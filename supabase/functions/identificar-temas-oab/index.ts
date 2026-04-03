import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normaliza título removendo números romanos, arábicos, "PARTE I/II", "- Parte I", etc.
function normalizarTitulo(titulo: string): string {
  return titulo
    // Remove " - Parte I", " – PARTE II", " — Parte 1", etc. (com hífen/en dash/em dash)
    .replace(/\s*[-–—]\s*Parte\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\s*$/gi, '')
    // Remove " Parte I", " Parte II", etc. (sem hífen)
    .replace(/\s+Parte\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\s*$/gi, '')
    // Remove números romanos no final: "Tema I", "Tema II", etc.
    .replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)(\s+E\s+(I|II|III|IV|V|VI|VII|VIII|IX|X))*\s*$/gi, '')
    // Remove números arábicos no final: "Tema 1", "Tema 2", etc.
    .replace(/\s+\d+(\s+E\s+\d+)*\s*$/gi, '')
    .trim();
}

// Agrupa temas que têm o mesmo título normalizado (sequenciais)
function agruparTemasSequenciais(temas: any[]): any[] {
  const grupos: Map<string, any[]> = new Map();
  const ordemGrupos: string[] = [];
  
  for (const tema of temas) {
    const chave = normalizarTitulo(tema.titulo).toUpperCase();
    if (!grupos.has(chave)) {
      grupos.set(chave, []);
      ordemGrupos.push(chave);
    }
    grupos.get(chave)!.push(tema);
  }
  
  const temasAgrupados: any[] = [];
  let ordem = 1;
  
  for (const chave of ordemGrupos) {
    const temasDoGrupo = grupos.get(chave)!;
    temasDoGrupo.sort((a, b) => a.pagina_inicial - b.pagina_inicial);
    
    const subtopicosUnificados: any[] = [];
    for (const tema of temasDoGrupo) {
      if (tema.subtopicos?.length) {
        subtopicosUnificados.push(...tema.subtopicos);
      }
    }
    
    const tituloLimpo = normalizarTitulo(temasDoGrupo[0].titulo);
    
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

    console.log(`[OAB] Identificando TEMAS para matéria ${materiaId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar TODAS as páginas
    const { data: paginas, error: paginasError } = await supabase
      .from('oab_trilhas_materia_paginas')
      .select('pagina, conteudo')
      .eq('materia_id', materiaId)
      .order('pagina');

    if (paginasError || !paginas?.length) {
      throw new Error("Nenhum conteúdo encontrado para análise");
    }

    const totalPaginas = paginas.length;
    console.log(`📚 Analisando ${totalPaginas} páginas do material OAB`);

    // Detectar páginas do índice com heurísticas avançadas
    const paginasIndice = paginas.filter(p => {
      const texto = (p.conteudo || '');
      const textoUpper = texto.toUpperCase();
      
      if (textoUpper.includes('ÍNDICE') || textoUpper.includes('SUMÁRIO')) return true;
      if (/\d+\.\s+[A-Z].*\.{2,}\s*\d+/.test(texto)) return true;
      
      const linhas = texto.split('\n').filter(l => l.trim().length > 3);
      const linhasComPagina = linhas.filter(l => /\.{2,}\s*\d+\s*$/.test(l) || /\s{3,}\d+\s*$/.test(l));
      if (linhas.length > 3 && linhasComPagina.length / linhas.length > 0.3) return true;
      
      const headersNumerados = linhas.filter(l => /^#{1,3}\s+\d+[\.\)]\s+/.test(l));
      if (headersNumerados.length >= 3) return true;
      
      const linhasCurtas = linhas.filter(l => l.length < 120 && /\.\.\.\s*\d+\s*$/.test(l));
      if (linhasCurtas.length >= 5) return true;
      
      return false;
    });

    console.log(`📑 Páginas de índice detectadas: ${paginasIndice.map(p => p.pagina).join(', ') || 'nenhuma'}`);

    // Limite dinâmico
    const limitePorPagina = totalPaginas > 100 ? 300 
                          : totalPaginas > 50 ? 500 
                          : totalPaginas > 30 ? 800 
                          : 2000;

    const conteudoAnalise = paginas
      .map(p => {
        const ehPaginaIndice = paginasIndice.some(pi => pi.pagina === p.pagina);
        const limite = ehPaginaIndice ? 8000 : limitePorPagina;
        return `--- PÁGINA ${p.pagina} ${ehPaginaIndice ? '(ÍNDICE)' : ''} ---\n${p.conteudo?.substring(0, limite) || ''}`;
      })
      .join('\n\n');

    const prompt = `Você é um especialista em análise de ÍNDICES de materiais de estudo para OAB.

CONTEÚDO (${paginas.length} páginas):
${conteudoAnalise}

## 🎯 SUA TAREFA: EXTRAIR APENAS OS TEMAS (CAPÍTULOS PRINCIPAIS)

Analise o ÍNDICE/SUMÁRIO do material e extraia APENAS os TEMAS principais (capítulos numerados).
Para cada tema, inclua também os subtópicos que pertencem a ele.

## FORMATO DE RESPOSTA:

{
  "temas": [
    {
      "ordem": 1,
      "titulo": "Nome do Tema Principal",
      "pagina_inicial": 3,
      "pagina_final": 15,
      "subtopicos": [
        {"titulo": "Subtópico 1", "pagina_inicial": 3, "pagina_final": 8},
        {"titulo": "Subtópico 2", "pagina_inicial": 9, "pagina_final": 15}
      ]
    }
  ]
}

## REGRAS IMPORTANTES:

1. Extraia APENAS os TEMAS principais (capítulos numerados ou seções principais)
2. NÃO extraia os subtópicos como temas separados - eles devem ficar dentro do array "subtopicos"
3. O "titulo" do tema deve ser o nome do capítulo
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
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192
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

    let parsed: any;
    let temas: any[] = [];

    if (textResponse.startsWith('{')) {
      try {
        parsed = JSON.parse(textResponse);
        temas = parsed.temas || [];
      } catch (parseError) {
        console.error("Erro ao parsear JSON:", parseError);
      }
    }

    if (!temas.length) {
      const jsonMatch = textResponse.match(/\{[\s\S]*"temas"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          temas = parsed.temas || [];
          console.log("JSON extraído de texto misto");
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

    // Agrupar temas sequenciais
    const temasAgrupados = agruparTemasSequenciais(temasValidados);

    console.log(`✅ ${temasAgrupados.length} TEMAS após agrupamento:`);
    temasAgrupados.forEach((t: any) => {
      console.log(`  ${t.ordem}. ${t.titulo} (págs ${t.pagina_inicial}-${t.pagina_final}) - ${t.subtopicos.length} subtópicos`);
    });

    // Atualizar matéria com temas
    await supabase
      .from('oab_trilhas_materias')
      .update({ 
        status_processamento: 'aguardando_confirmacao',
        temas_identificados: temasAgrupados
      })
      .eq('id', materiaId);

    console.log(`✅ ${temasAgrupados.length} temas identificados para confirmação`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        temas: temasAgrupados,
        message: `${temasAgrupados.length} temas identificados`
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
