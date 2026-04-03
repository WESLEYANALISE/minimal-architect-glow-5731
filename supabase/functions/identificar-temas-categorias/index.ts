import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizarTitulo(titulo: string): string {
  return titulo
    .replace(/\s*[-–—]\s*Parte\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\s*$/gi, '')
    .replace(/\s+Parte\s+(I|II|III|IV|V|VI|VII|VIII|IX|X|\d+)\s*$/gi, '')
    .replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)(\s+E\s+(I|II|III|IV|V|VI|VII|VIII|IX|X))*\s*$/gi, '')
    .replace(/\s+(?!\d{4}\b)\d{1,2}(\s+E\s+\d{1,2})*\s*$/gi, '')
    .trim();
}

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
      if (tema.subtopicos?.length) subtopicosUnificados.push(...tema.subtopicos);
    }
    
    temasAgrupados.push({
      ordem: ordem++,
      titulo: temasDoGrupo[0].titulo,
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
    if (!materiaId) throw new Error("materiaId é obrigatório");

    console.log(`[Categorias] Identificando temas para matéria ${materiaId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: paginas, error: paginasError } = await supabase
      .from('categorias_materia_paginas')
      .select('pagina, conteudo')
      .eq('materia_id', materiaId)
      .order('pagina');

    if (paginasError || !paginas?.length) {
      throw new Error("Nenhum conteúdo encontrado para análise");
    }

    const totalPaginas = paginas.length;
    console.log(`📚 Analisando ${totalPaginas} páginas`);

    // Detectar páginas do índice com heurísticas avançadas
    const paginasIndice = paginas.filter(p => {
      const texto = (p.conteudo || '');
      const textoUpper = texto.toUpperCase();
      
      // Critério 1: Contém palavra "ÍNDICE" ou "SUMÁRIO"
      if (textoUpper.includes('ÍNDICE') || textoUpper.includes('SUMÁRIO')) return true;
      
      // Critério 2: Padrão pontilhado clássico (1. TEMA...8)
      if (/\d+\.\s+[A-Z].*\.{2,}\s*\d+/.test(texto)) return true;
      
      // Critério 3: Alta densidade de linhas com números de página no final (ex: "Tema...24" ou "Tema 24")
      const linhas = texto.split('\n').filter(l => l.trim().length > 3);
      const linhasComPagina = linhas.filter(l => /\.{2,}\s*\d+\s*$/.test(l) || /\s{3,}\d+\s*$/.test(l));
      if (linhas.length > 3 && linhasComPagina.length / linhas.length > 0.3) return true;
      
      // Critério 4: Alta densidade de headers "## N." (continuação de índice em Markdown)
      const headersNumerados = linhas.filter(l => /^#{1,3}\s+\d+[\.\)]\s+/.test(l));
      if (headersNumerados.length >= 3) return true;
      
      // Critério 5: Muitas linhas curtas com padrão "Subtópico...página"
      const linhasCurtas = linhas.filter(l => l.length < 120 && /\.\.\.\s*\d+\s*$/.test(l));
      if (linhasCurtas.length >= 5) return true;
      
      return false;
    });

    console.log(`📑 Páginas de índice detectadas: ${paginasIndice.map(p => p.pagina).join(', ') || 'nenhuma'}`);

    const limitePorPagina = totalPaginas > 100 ? 300 : totalPaginas > 50 ? 500 : totalPaginas > 30 ? 800 : 2000;

    const conteudoAnalise = paginas
      .map(p => {
        const ehIndice = paginasIndice.some(pi => pi.pagina === p.pagina);
        const limite = ehIndice ? 8000 : limitePorPagina;
        return `--- PÁGINA ${p.pagina} ${ehIndice ? '(ÍNDICE)' : ''} ---\n${p.conteudo?.substring(0, limite) || ''}`;
      })
      .join('\n\n');

    const prompt = `Você é um especialista em análise de ÍNDICES de materiais de estudo jurídico.

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
        {"titulo": "Subtópico 1", "pagina_inicial": 3, "pagina_final": 8}
      ]
    }
  ]
}

## REGRAS:
1. Extraia APENAS os TEMAS principais (capítulos)
2. Subtópicos ficam dentro do array "subtopicos"
3. pagina_final de cada tema = pagina_inicial do próximo - 1
4. O último tema termina na página ${totalPaginas}

RESPONDA APENAS COM JSON válido:`;

    const geminiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
    ].filter(Boolean) as string[];

    if (!geminiKeys.length) throw new Error("Nenhuma chave Gemini configurada");

    let geminiResponse: Response | null = null;
    let lastError = "";

    for (const geminiKey of geminiKeys) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 16384 }
            })
          }
        );
        if (response.ok) { geminiResponse = response; break; }
        lastError = await response.text();
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    if (!geminiResponse) throw new Error(`Todas as chaves Gemini falharam: ${lastError.substring(0, 100)}`);

    const geminiData = await geminiResponse.json();
    let textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let temas: any[] = [];

    try {
      const parsed = JSON.parse(textResponse);
      temas = parsed.temas || [];
    } catch {
      // Try to repair truncated JSON
      let reparado = textResponse;
      let chaves = 0, colchetes = 0;
      for (const char of reparado) {
        if (char === '{') chaves++; if (char === '}') chaves--;
        if (char === '[') colchetes++; if (char === ']') colchetes--;
      }
      reparado = reparado.replace(/,\s*\{[^}]*$/, '').replace(/,\s*$/, '');
      while (colchetes > 0) { reparado += ']'; colchetes--; }
      while (chaves > 0) { reparado += '}'; chaves--; }
      try {
        const parsed = JSON.parse(reparado);
        temas = parsed.temas || [];
      } catch { /* fallback below */ }
    }

    if (!temas.length) {
      const jsonMatch = textResponse.match(/\{[\s\S]*"temas"[\s\S]*\}/);
      if (jsonMatch) {
        try { temas = JSON.parse(jsonMatch[0]).temas || []; } catch {}
      }
    }

    if (!temas.length) {
      const temasEstimados = Math.min(6, Math.ceil(totalPaginas / 15));
      const paginasPorTema = Math.ceil(totalPaginas / temasEstimados);
      for (let i = 0; i < temasEstimados; i++) {
        temas.push({
          ordem: i + 1, titulo: `Tema ${i + 1}`,
          pagina_inicial: i * paginasPorTema + 1,
          pagina_final: Math.min((i + 1) * paginasPorTema, totalPaginas),
          subtopicos: []
        });
      }
    }

    const temasValidados = temas.map((t: any, idx: number) => ({
      ordem: idx + 1, titulo: t.titulo,
      pagina_inicial: Math.max(1, t.pagina_inicial || 1),
      pagina_final: Math.min(totalPaginas, t.pagina_final || totalPaginas),
      subtopicos: Array.isArray(t.subtopicos) ? t.subtopicos.map((s: any) => ({
        titulo: s.titulo, pagina_inicial: s.pagina_inicial || t.pagina_inicial, pagina_final: s.pagina_final || t.pagina_final
      })) : []
    }));

    const temasAgrupados = agruparTemasSequenciais(temasValidados);

    console.log(`✅ ${temasAgrupados.length} temas após agrupamento`);

    await supabase
      .from('categorias_materias')
      .update({ status_processamento: 'aguardando_confirmacao', temas_identificados: temasAgrupados })
      .eq('id', materiaId);

    return new Response(
      JSON.stringify({ success: true, temas: temasAgrupados, message: `${temasAgrupados.length} temas identificados` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
