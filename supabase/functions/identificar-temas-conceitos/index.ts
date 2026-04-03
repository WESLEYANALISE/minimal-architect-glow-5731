import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normaliza título removendo números romanos, arábicos e "PARTE" do final
function normalizarTitulo(titulo: string): string {
  return titulo
    // Remove números romanos no final: I, II, III, IV, V, VI, VII, VIII, IX, X (com "E" opcional)
    .replace(/\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X)(\s+E\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X))*\s*$/gi, '')
    // Remove números arábicos pequenos no final (1-99), mas preserva anos (1800-2099)
    .replace(/\s+(?!\d{4}\b)\d{1,2}(\s+E\s+\d{1,2})*\s*$/gi, '')
    // Remove "PARTE I", "PARTE II", etc.
    .replace(/\s+PARTE\s+(I{1,3}|IV|V|VI{1,3}|VII{1,3}|IX|X|\d+)\s*$/gi, '')
    .trim();
}

// Agrupa temas que têm o mesmo título normalizado (sequenciais)
function agruparTemasSequenciais(temas: any[]): any[] {
  const grupos: Map<string, any[]> = new Map();
  const ordemGrupos: string[] = []; // Mantém ordem de aparição
  
  // Agrupar por título normalizado
  for (const tema of temas) {
    const chave = normalizarTitulo(tema.titulo).toUpperCase();
    if (!grupos.has(chave)) {
      grupos.set(chave, []);
      ordemGrupos.push(chave);
    }
    grupos.get(chave)!.push(tema);
  }
  
  // Criar temas agrupados mantendo a ordem original
  const temasAgrupados: any[] = [];
  let ordem = 1;
  
  for (const chave of ordemGrupos) {
    const temasDoGrupo = grupos.get(chave)!;
    
    // Ordenar por página inicial
    temasDoGrupo.sort((a, b) => a.pagina_inicial - b.pagina_inicial);
    
    // Combinar subtópicos de todos os temas do grupo
    const subtopicosUnificados: any[] = [];
    for (const tema of temasDoGrupo) {
      if (tema.subtopicos?.length) {
        subtopicosUnificados.push(...tema.subtopicos);
      }
    }
    
    // Usar título ORIGINAL do primeiro tema (preserva anos como 1824, 1891)
    const tituloLimpo = temasDoGrupo[0].titulo;
    
    temasAgrupados.push({
      ordem: ordem++,
      titulo: tituloLimpo,
      pagina_inicial: temasDoGrupo[0].pagina_inicial,
      pagina_final: temasDoGrupo[temasDoGrupo.length - 1].pagina_final,
      subtopicos: subtopicosUnificados
    });
  }
  
  return temasAgrupados;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materiaId } = await req.json();

    if (!materiaId) {
      throw new Error("materiaId é obrigatório");
    }

    console.log(`Identificando TEMAS (capítulos principais) para matéria ${materiaId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar TODAS as páginas
    const { data: paginas, error: paginasError } = await supabase
      .from('conceitos_materia_paginas')
      .select('pagina, conteudo')
      .eq('materia_id', materiaId)
      .order('pagina');

    if (paginasError || !paginas?.length) {
      throw new Error("Nenhum conteúdo encontrado para análise");
    }

    const totalPaginas = paginas.length;
    console.log(`📚 Analisando ${totalPaginas} páginas do livro`);

    // Detectar páginas do índice
    const paginasIndice = paginas.filter(p => {
      const texto = (p.conteudo || '').toUpperCase();
      return texto.includes('ÍNDICE') || 
             texto.includes('SUMÁRIO') ||
             /\d+\.\s+[A-Z].*\.{3,}\s*\d+/.test(p.conteudo || '');
    });

    console.log(`📑 Páginas de índice detectadas: ${paginasIndice.map(p => p.pagina).join(', ') || 'nenhuma'}`);

    // Limite dinâmico
    const limitePorPagina = totalPaginas > 100 ? 300 
                          : totalPaginas > 50 ? 500 
                          : totalPaginas > 30 ? 800 
                          : 2000;

    // Montar conteúdo: páginas do índice com mais caracteres
    const conteudoAnalise = paginas
      .map(p => {
        const ehPaginaIndice = paginasIndice.some(pi => pi.pagina === p.pagina);
        const limite = ehPaginaIndice ? 8000 : limitePorPagina;
        return `--- PÁGINA ${p.pagina} ${ehPaginaIndice ? '(ÍNDICE)' : ''} ---\n${p.conteudo?.substring(0, limite) || ''}`;
      })
      .join('\n\n');

    const prompt = `Você é um especialista em análise de ÍNDICES de livros jurídicos.

CONTEÚDO (${paginas.length} páginas):
${conteudoAnalise}

## 🎯 SUA TAREFA: EXTRAIR APENAS OS TEMAS (CAPÍTULOS PRINCIPAIS)

Analise o ÍNDICE/SUMÁRIO do livro e extraia APENAS os TEMAS principais (capítulos numerados).
Para cada tema, inclua também os subtópicos que pertencem a ele.

## COMO INTERPRETAR O ÍNDICE:

Exemplo de índice típico:
\`\`\`
1. SURGIMENTO DO DIREITO .......................................... 3
   Ponto de Vista Formal e Material .............................. 3
   Hábitos e Costumes ............................................ 5
   Início da Instrumentalização do Direito ....................... 5
   Torá, a "Constituição" dos Hebreus ............................ 6
2. DIREITO NA GRÉCIA ............................................. 7
   O direito na Grécia ........................................... 7
   Controle de Constitucionalidade ............................... 8
\`\`\`

Neste exemplo, você deve retornar 2 TEMAS:

1. TEMA: "Surgimento do Direito" (páginas 3-6)
   - Subtópicos: ["Ponto de Vista Formal e Material", "Hábitos e Costumes", "Início da Instrumentalização do Direito", "Torá, a Constituição dos Hebreus"]

2. TEMA: "Direito na Grécia" (páginas 7+)
   - Subtópicos: ["O direito na Grécia", "Controle de Constitucionalidade"]

## FORMATO DE RESPOSTA:

{
  "temas": [
    {
      "ordem": 1,
      "titulo": "Surgimento do Direito",
      "pagina_inicial": 3,
      "pagina_final": 6,
      "subtopicos": [
        {"titulo": "Ponto de Vista Formal e Material", "pagina_inicial": 3, "pagina_final": 5},
        {"titulo": "Hábitos e Costumes", "pagina_inicial": 5, "pagina_final": 5},
        {"titulo": "Início da Instrumentalização do Direito", "pagina_inicial": 5, "pagina_final": 6},
        {"titulo": "Torá, a Constituição dos Hebreus", "pagina_inicial": 6, "pagina_final": 6}
      ]
    },
    {
      "ordem": 2,
      "titulo": "Direito na Grécia",
      "pagina_inicial": 7,
      "pagina_final": 10,
      "subtopicos": [
        {"titulo": "O direito na Grécia", "pagina_inicial": 7, "pagina_final": 8},
        {"titulo": "Controle de Constitucionalidade", "pagina_inicial": 8, "pagina_final": 10}
      ]
    }
  ]
}

## REGRAS IMPORTANTES:

1. Extraia APENAS os TEMAS principais (capítulos numerados ou seções principais)
2. NÃO extraia os subtópicos como temas separados - eles devem ficar dentro do array "subtopicos"
3. O "titulo" do tema deve ser o nome do capítulo (ex: "Surgimento do Direito", "Direito na Grécia")
4. Cada tema deve ter um array "subtopicos" com os itens que pertencem a ele
5. Se um tema não tem subtópicos explícitos, deixe o array vazio []
6. pagina_final de cada tema = pagina_inicial do próximo tema - 1
7. O último tema deve terminar na página ${totalPaginas}

RESPONDA APENAS COM JSON válido, sem texto adicional:`;

    // Obter chaves Gemini
    const geminiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
    ].filter(Boolean) as string[];

    if (!geminiKeys.length) {
      throw new Error("Nenhuma chave Gemini configurada");
    }

    let geminiResponse: Response | null = null;
    let lastError = "";

    for (const geminiKey of geminiKeys) {
      console.log("Tentando chave Gemini...");

      try {
        // Usando gemini-2.5-flash com tokens aumentados para evitar truncamento
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 16384 // Aumentado para evitar truncamento de JSON
              }
            })
          }
        );

        if (response.ok) {
          geminiResponse = response;
          console.log("✅ Gemini respondeu com sucesso");
          break;
        } else {
          lastError = await response.text();
          console.error(`Erro com chave (${response.status}):`, lastError.substring(0, 200));
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.error("Erro de conexão:", lastError);
      }
    }

    if (!geminiResponse) {
      throw new Error(`Todas as chaves Gemini falharam: ${lastError.substring(0, 100)}`);
    }

    const geminiData = await geminiResponse.json();
    let textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpar JSON
    textResponse = textResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log("Resposta Gemini:", textResponse.substring(0, 800));

    // Função para reparar JSON truncado
    function repararJsonTruncado(json: string): string {
      let reparado = json.trim();
      
      // Contar chaves e colchetes abertos/fechados
      let chaves = 0, colchetes = 0;
      for (const char of reparado) {
        if (char === '{') chaves++;
        if (char === '}') chaves--;
        if (char === '[') colchetes++;
        if (char === ']') colchetes--;
      }
      
      // Se truncado no meio de um objeto/array, tentar fechar
      if (chaves > 0 || colchetes > 0) {
        console.log(`⚠️ JSON truncado detectado (chaves: ${chaves}, colchetes: ${colchetes})`);
        
        // Remover último objeto incompleto se termina com vírgula ou após propriedade
        reparado = reparado
          .replace(/,\s*"[^"]*":\s*\d*\s*$/, '') // Remove "prop": 123 incompleto
          .replace(/,\s*"[^"]*":\s*"[^"]*$/, '') // Remove "prop": "valor incompleto
          .replace(/,\s*\{[^}]*$/, '') // Remove objeto incompleto final
          .replace(/,\s*$/, ''); // Remove vírgula final
        
        // Fechar arrays e objetos restantes
        while (colchetes > 0) { reparado += ']'; colchetes--; }
        while (chaves > 0) { reparado += '}'; chaves--; }
        
        console.log(`✅ JSON reparado (adicionado fechamentos)`);
      }
      
      return reparado;
    }

    // Tentar extrair JSON da resposta
    let parsed: any;
    let temas: any[] = [];

    if (textResponse.startsWith('{')) {
      try {
        parsed = JSON.parse(textResponse);
        temas = parsed.temas || [];
      } catch (parseError) {
        console.error("Erro ao parsear JSON:", parseError);
        // Tentar reparar JSON truncado
        try {
          const jsonReparado = repararJsonTruncado(textResponse);
          parsed = JSON.parse(jsonReparado);
          temas = parsed.temas || [];
          console.log(`✅ JSON reparado com sucesso: ${temas.length} temas`);
        } catch (repairError) {
          console.error("Falha ao reparar JSON:", repairError);
        }
      }
    }

    // Se não conseguiu, tentar extrair JSON embutido
    if (!temas.length) {
      const jsonMatch = textResponse.match(/\{[\s\S]*"temas"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonExtraido = repararJsonTruncado(jsonMatch[0]);
          parsed = JSON.parse(jsonExtraido);
          temas = parsed.temas || [];
          console.log(`JSON extraído e reparado: ${temas.length} temas`);
        } catch (e) {
          console.error("Falha ao extrair JSON embutido");
        }
      }
    }

    // Fallback se não conseguiu extrair
    if (!temas.length) {
      console.log("⚠️ Gemini não retornou JSON válido. Criando estrutura básica.");
      const temasEstimados = Math.min(6, Math.ceil(totalPaginas / 15));
      const paginasPorTema = Math.ceil(totalPaginas / temasEstimados);
      
      for (let i = 0; i < temasEstimados; i++) {
        temas.push({
          ordem: i + 1,
          titulo: `Tema ${i + 1}`,
          pagina_inicial: i * paginasPorTema + 1,
          pagina_final: Math.min((i + 1) * paginasPorTema, totalPaginas),
          subtopicos: []
        });
      }
    }

    if (!temas.length) {
      throw new Error("Nenhum tema identificado");
    }

    // Validar e normalizar temas
    const temasValidados = temas.map((t: any, idx: number) => ({
      ordem: idx + 1,
      titulo: t.titulo,
      pagina_inicial: Math.max(1, t.pagina_inicial || 1),
      pagina_final: Math.min(totalPaginas, t.pagina_final || totalPaginas),
      subtopicos: Array.isArray(t.subtopicos) ? t.subtopicos.map((s: any) => ({
        titulo: s.titulo,
        pagina_inicial: s.pagina_inicial || t.pagina_inicial,
        pagina_final: s.pagina_final || t.pagina_final
      })) : []
    }));

    console.log(`📋 ${temasValidados.length} temas extraídos pelo Gemini`);

    // Agrupar temas sequenciais (ex: "Perfil Histórico I E II" + "Perfil Histórico III" → "Perfil Histórico")
    const temasAgrupados = agruparTemasSequenciais(temasValidados);

    console.log(`✅ ${temasAgrupados.length} TEMAS após agrupamento:`);
    temasAgrupados.forEach((t: any) => {
      console.log(`  ${t.ordem}. ${t.titulo} (págs ${t.pagina_inicial}-${t.pagina_final}) - ${t.subtopicos.length} subtópicos`);
    });

    // Extrair texto das páginas do índice para salvar
    const indiceBruto = paginasIndice.map(p => p.conteudo).join('\n\n---\n\n');

    // Atualizar matéria com temas agrupados E índice bruto
    await supabase
      .from('conceitos_materias')
      .update({ 
        status_processamento: 'aguardando_confirmacao',
        temas_identificados: temasAgrupados,
        indice_bruto: indiceBruto || null
      })
      .eq('id', materiaId);

    console.log(`✅ ${temasAgrupados.length} temas identificados para confirmação`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        temas: temasAgrupados,
        message: `${temasAgrupados.length} temas identificados (capítulos agrupados)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro na identificação:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
