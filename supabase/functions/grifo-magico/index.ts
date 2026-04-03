import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getRotatedGeminiKeys } from "../_shared/gemini-keys.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CACHE_MODE = 'grifo_magico_v5';

const SYSTEM_PROMPT = `Você é um professor de Direito Brasileiro especialista em preparação para concursos.
Analise o artigo de lei abaixo e identifique os trechos mais importantes para estudo,
como se estivesse grifando um material de estudo para um aluno.

Regras:
- Responda SOMENTE com um array JSON válido, sem markdown, sem explicação extra
- Cada item deve ter:
  "trechoExato" (trecho EXATO copiado do texto),
  "cor" (uma das 5 cores),
  "explicacao" (1-2 frases explicando por que é importante),
  "hierarquia" (nome da categoria)
- Cores e hierarquias:
  - "amarelo" = "Conceito-chave" (regra principal, núcleo do artigo)
  - "verde" = "Exceção / Condição" (requisitos, condicionantes, ressalvas, "salvo", "exceto", "desde que")
  - "azul" = "Efeito jurídico" (consequência, pena, sanção, resultado, "será punido", "incorre em")
  - "rosa" = "Termo técnico" (instituto jurídico, conceito que precisa ser entendido, nomes formais)
  - "laranja" = "Pegadinha de prova" (trecho cobrado de forma invertida ou confusa em provas, palavras-chave que bancas trocam)
- OBRIGATÓRIO: use TODAS as 5 cores. Nunca retorne grifos de uma única cor.
- Distribuição mínima: pelo menos 1 trecho de cada cor (amarelo, verde, azul, rosa, laranja).
- Se o artigo tiver incisos, identifique quais são exceções (verde), quais são termos técnicos (rosa), quais têm efeito jurídico (azul), quais são pegadinhas (laranja).
- Para artigos curtos (menos de 5 trechos possíveis), use no mínimo 3 cores diferentes.
- Identifique entre 5 e 8 trechos, priorizando os mais relevantes para provas.
- Os trechos DEVEM ser copiados EXATAMENTE como aparecem no texto.
- Não grife o artigo inteiro, apenas os trechos mais importantes.
- NUNCA use apenas amarelo. Distribua as cores de forma equilibrada.

Exemplo para Art. 1º da CF:
[
  {"trechoExato":"República Federativa do Brasil","cor":"rosa","hierarquia":"Termo técnico","explicacao":"Forma de governo (república) + forma de Estado (federação). Bancas cobram a diferença entre república e monarquia."},
  {"trechoExato":"união indissolúvel","cor":"amarelo","hierarquia":"Conceito-chave","explicacao":"Princípio fundamental que veda o direito de secessão dos Estados-membros."},
  {"trechoExato":"Estado Democrático de Direito","cor":"rosa","hierarquia":"Termo técnico","explicacao":"Conceito central do constitucionalismo que une democracia + legalidade."},
  {"trechoExato":"a soberania","cor":"azul","hierarquia":"Efeito jurídico","explicacao":"Fundamento que gera independência nas relações internacionais e supremacia interna."},
  {"trechoExato":"Todo o poder emana do povo","cor":"laranja","hierarquia":"Pegadinha de prova","explicacao":"Bancas trocam 'emana' por 'pertence' ou 'deriva'. O poder EMANA do povo, não pertence a ele."},
  {"trechoExato":"diretamente, ou por meio de representantes eleitos","cor":"verde","hierarquia":"Exceção / Condição","explicacao":"Condição alternativa: exercício direto (plebiscito, referendo) OU representativo (eleições)."}
]`;

function parseGeminiResponse(text: string): any[] {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.grifos && Array.isArray(parsed.grifos)) return parsed.grifos;
  if (parsed?.trechos && Array.isArray(parsed.trechos)) return parsed.trechos;
  return [];
}

function normalizeForMatch(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

function isUsefulTrecho(trecho: string): boolean {
  const words = trecho.split(' ').filter(Boolean);
  return words.length >= 2 || trecho.length >= 8;
}

function validateGrifos(artigoTexto: string, grifos: any[]): any[] {
  const textoNorm = normalizeForMatch(artigoTexto);
  const seenTrechos = new Set<string>();

  return grifos
    .map((grifo) => ({
      ...grifo,
      trechoExato: normalizeForMatch(String(grifo?.trechoExato ?? '')),
    }))
    .filter((grifo) => {
      if (!grifo.trechoExato) {
        return false;
      }

      if (!isUsefulTrecho(grifo.trechoExato)) {
        console.log(`[grifo-magico] Trecho curto descartado: "${grifo.trechoExato}"`);
        return false;
      }

      if (!textoNorm.includes(grifo.trechoExato)) {
        console.log(`[grifo-magico] Trecho não encontrado após normalização: "${grifo.trechoExato.substring(0, 80)}..."`);
        return false;
      }

      if (seenTrechos.has(grifo.trechoExato)) {
        return false;
      }

      seenTrechos.add(grifo.trechoExato);
      return true;
    });
}

async function callGeminiWithRotation(artigoTexto: string): Promise<any[]> {
  const keys = getRotatedGeminiKeys(true);
  console.log(`[grifo-magico] ${keys.length} chaves Gemini disponíveis: ${keys.map(k => k.name).join(', ')}`);

  for (let i = 0; i < keys.length; i++) {
    const { key, name } = keys[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nTexto do artigo:\n${artigoTexto}` }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[grifo-magico] ${name} falhou: ${response.status} - ${errText.substring(0, 200)}`);
        if (response.status === 429 && i < keys.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }
        if (i < keys.length - 1) continue;
        const error: any = new Error(`Gemini error: ${response.status}`);
        error.statusCode = response.status;
        throw error;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Resposta vazia do Gemini');

      console.log(`[grifo-magico] ✅ Sucesso com ${name}`);
      return parseGeminiResponse(text);
    } catch (error: any) {
      console.error(`[grifo-magico] Erro com ${name}:`, error.message);
      if (i < keys.length - 1) continue;
      throw error;
    }
  }

  throw new Error('Nenhuma chave Gemini disponível');
}

async function callOpenAIFallback(artigoTexto: string): Promise<any[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada');

  console.log('[grifo-magico] 🔄 Usando fallback OpenAI (gpt-4o-mini)');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Texto do artigo:\n${artigoTexto}` },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error: ${response.status} - ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Resposta vazia do OpenAI');

  console.log('[grifo-magico] ✅ Sucesso com OpenAI fallback');
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.grifos && Array.isArray(parsed.grifos)) return parsed.grifos;
  if (parsed?.trechos && Array.isArray(parsed.trechos)) return parsed.trechos;
  return [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { artigoTexto, artigoNumero, leiNome } = await req.json();

    if (!artigoTexto || !artigoNumero || !leiNome) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: artigoTexto, artigoNumero, leiNome' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cached } = await supabase
      .from('artigo_ai_cache')
      .select('conteudo')
      .eq('tabela_nome', leiNome)
      .eq('artigo_numero', artigoNumero)
      .eq('modo', CACHE_MODE)
      .maybeSingle();

    if (cached?.conteudo) {
      console.log(`[grifo-magico] Cache hit: ${leiNome} Art. ${artigoNumero}`);
      return new Response(
        JSON.stringify({ grifos: JSON.parse(cached.conteudo), fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[grifo-magico] Gerando grifos: ${leiNome} Art. ${artigoNumero}`);

    let grifosBrutos: any[];
    try {
      grifosBrutos = await callGeminiWithRotation(artigoTexto);
    } catch (geminiError) {
      console.warn('[grifo-magico] ⚠️ Todas as chaves Gemini falharam, tentando OpenAI...');
      grifosBrutos = await callOpenAIFallback(artigoTexto);
    }

    let validGrifos = validateGrifos(artigoTexto, grifosBrutos);

    // Diversity check: ensure at least 3 distinct colors
    const coresUsadas = new Set(validGrifos.map((g: any) => g.cor));
    if (validGrifos.length >= 3 && coresUsadas.size < 3) {
      console.warn(`[grifo-magico] Apenas ${coresUsadas.size} cor(es) usada(s): ${[...coresUsadas].join(', ')}. Regenerando com diversidade...`);
      try {
        const diversityPrompt = `${SYSTEM_PROMPT}\n\nATENÇÃO EXTRA: O resultado anterior usou apenas a(s) cor(es) ${[...coresUsadas].join(', ')}. Você DEVE usar pelo menos 4 cores diferentes desta vez. Identifique obrigatoriamente: exceções (verde), efeitos jurídicos (azul), termos técnicos (rosa) e pegadinhas (laranja), além de conceitos-chave (amarelo).\n\nTexto do artigo:\n${artigoTexto}`;
        
        const retryKeys = getRotatedGeminiKeys(true);
        for (const { key, name } of retryKeys) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`;
            const resp = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: diversityPrompt }] }],
                generationConfig: { temperature: 0.5, maxOutputTokens: 2048, responseMimeType: 'application/json' },
              }),
            });
            if (!resp.ok) { await resp.text(); continue; }
            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) continue;
            const retryGrifos = validateGrifos(artigoTexto, parseGeminiResponse(text));
            const retryCores = new Set(retryGrifos.map((g: any) => g.cor));
            if (retryCores.size > coresUsadas.size) {
              validGrifos = retryGrifos;
              console.log(`[grifo-magico] ✅ Retry com diversidade: ${retryCores.size} cores (${[...retryCores].join(', ')})`);
            }
            break;
          } catch { continue; }
        }
      } catch (retryErr: any) {
        console.warn('[grifo-magico] Retry de diversidade falhou:', retryErr.message);
      }
    }

    if (validGrifos.length < 4) {
      console.warn(`[grifo-magico] Poucos grifos válidos (${validGrifos.length}), tentando fallback de qualidade...`);
      try {
        const fallbackGrifos = await callOpenAIFallback(artigoTexto);
        const fallbackValidGrifos = validateGrifos(artigoTexto, fallbackGrifos);
        if (fallbackValidGrifos.length > validGrifos.length) {
          validGrifos = fallbackValidGrifos;
        }
      } catch (fallbackError: any) {
        console.warn('[grifo-magico] Fallback de qualidade indisponível:', fallbackError.message);
      }
    }

    if (validGrifos.length > 0) {
      await supabase.from('artigo_ai_cache').upsert({
        tabela_nome: leiNome,
        artigo_numero: artigoNumero,
        modo: CACHE_MODE,
        conteudo: JSON.stringify(validGrifos),
      }, { onConflict: 'tabela_nome,artigo_numero,modo' });
    }

    return new Response(
      JSON.stringify({ grifos: validGrifos, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[grifo-magico] Erro fatal:', error);
    const isRateLimit = error.statusCode === 429 || String(error.message || '').includes('429');
    return new Response(
      JSON.stringify({
        error: isRateLimit ? 'IA temporariamente sobrecarregada.' : (error.message || 'Erro interno'),
        rateLimited: isRateLimit,
        grifos: [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
