import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

function getApiKeys(): string[] {
  return getRotatedKeyStrings(true);
}

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) throw new Error('No JSON found');

  const openChar = cleaned[jsonStart];
  const closeChar = openChar === '[' ? ']' : '}';
  const jsonEnd = cleaned.lastIndexOf(closeChar);

  if (jsonEnd === -1 || jsonEnd <= jsonStart) throw new Error('No JSON found');

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, '');

    try {
      return JSON.parse(cleaned);
    } catch {
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace > 0 && openChar === '[') {
        const repaired = cleaned.substring(0, lastBrace + 1) + ']';
        return JSON.parse(repaired);
      }
      throw new Error('Cannot parse JSON');
    }
  }
}

async function chamarGemini(prompt: string, apiKeys: string[]): Promise<string> {
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKeys[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            }
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        console.error(`[cron-met] Erro chave ${i + 1}: ${err.substring(0, 150)}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.error(`[cron-met] Exceção chave ${i + 1}:`, e instanceof Error ? e.message : e);
    }
  }
  throw new Error('Todas as chaves esgotadas');
}

function buildCornellPrompt(area: string, tema: string, subtema: string): string {
  return `Você é um especialista em Direito brasileiro. Gere uma FICHA DE ESTUDO CONCISA usando o Método Cornell para o subtema "${subtema}" do tema "${tema}" da área "${area}".

REGRAS DE CONCISÃO (OBRIGATÓRIO):
- Cada anotação: máximo 2-3 frases curtas
- Cada palavra-chave: 1 frase objetiva
- Resumo: máximo 2 frases

O Método Cornell divide a página em 3 seções:
1. ANOTAÇÕES: 3 pontos-chave essenciais (curtos e diretos, com artigo de lei quando aplicável)
2. PALAVRAS-CHAVE: 5 termos técnicos com definição de 1 frase
3. RESUMO: Síntese em no máximo 2 frases

Retorne um JSON com esta estrutura EXATA:
{
  "anotacoes": [
    { "titulo": "Ponto-chave", "conteudo": "Explicação curta (2-3 frases no máximo)" }
  ],
  "palavras_chave": [
    { "termo": "Termo técnico", "dica": "Definição em 1 frase" }
  ],
  "resumo": "Síntese em 2 frases no máximo"
}

Gere EXATAMENTE 3 anotações e 5 palavras-chave. Seja objetivo e direto.`;
}

function buildFeynmanPrompt(area: string, tema: string, subtema: string): string {
  return `Você é um especialista em Direito brasileiro. Gere uma FICHA DE ESTUDO CONCISA usando o Método Feynman para o subtema "${subtema}" do tema "${tema}" da área "${area}".

REGRAS DE CONCISÃO (OBRIGATÓRIO):
- Conceito: 1-2 frases diretas
- Explicação simples: 1 parágrafo curto (máx 4 frases)
- Cada lacuna: 1 frase
- Cada analogia: 1 frase

Retorne um JSON com esta estrutura EXATA:
{
  "conceito": "Definição direta em 1-2 frases",
  "explicacao_simples": "Explicação simples em 1 parágrafo curto (máx 4 frases)",
  "lacunas": [
    { "ponto": "Aspecto complexo", "explicacao": "Explicação em 1 frase" }
  ],
  "analogias": [
    { "analogia": "Situação do cotidiano", "relacao": "Relação com o conceito em 1 frase" }
  ]
}

Gere EXATAMENTE 3 lacunas e 3 analogias. Seja objetivo e criativo.`;
}

async function processarItem(supabaseClient: any, item: any, apiKeys: string[]) {
  const { id, area, tema, subtema, metodo } = item;

  try {
    const prompt = metodo === 'cornell'
      ? buildCornellPrompt(area, tema, subtema)
      : buildFeynmanPrompt(area, tema, subtema);

    const resultText = await chamarGemini(prompt, apiKeys);

    let conteudo: any;
    try {
      conteudo = extractJsonFromResponse(resultText);
    } catch {
      console.error(`[cron-met] JSON inválido para ${subtema}: ${resultText?.substring(0, 200)}`);
      throw new Error('Resposta da IA não é JSON válido');
    }

    await supabaseClient.from('METODOLOGIAS_GERADAS').upsert({
      area, tema, metodo, subtema, conteudo, created_at: new Date().toISOString(),
    }, { onConflict: 'area,tema,subtema,metodo' });

    await supabaseClient.from('metodologias_fila').update({ status: 'concluido', erro: null }).eq('id', id);

  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`[cron-met] ❌ ${metodo} ${subtema}: ${erroMsg}`);
    await supabaseClient.from('metodologias_fila').update({ status: 'erro', erro: erroMsg }).eq('id', id);
  }
}

/**
 * Processa toda a fila em loop contínuo:
 * - Busca 10 cornell + 10 feynman = 20 por rodada
 * - Processa os 20 em paralelo
 * - Repete até a fila esvaziar
 */
async function processarFilaCompleta(supabaseClient: any, apiKeys: string[]): Promise<number> {
  let totalProcessados = 0;
  const PER_METHOD = 10;
  const MAX_ROUNDS = 200; // safety: max 200 rounds = 4000 itens

  for (let round = 0; round < MAX_ROUNDS; round++) {
    // Resetar travados (gerando há mais de 5 min)
    await supabaseClient
      .from('metodologias_fila')
      .update({ status: 'pendente', erro: null })
      .eq('status', 'gerando')
      .lt('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    // Buscar 10 cornell pendentes
    const { data: cornellItems } = await supabaseClient
      .from('metodologias_fila')
      .select('*')
      .eq('status', 'pendente')
      .eq('metodo', 'cornell')
      .order('id', { ascending: true })
      .limit(PER_METHOD);

    // Buscar 10 feynman pendentes
    const { data: feynmanItems } = await supabaseClient
      .from('metodologias_fila')
      .select('*')
      .eq('status', 'pendente')
      .eq('metodo', 'feynman')
      .order('id', { ascending: true })
      .limit(PER_METHOD);

    const items = [...(cornellItems || []), ...(feynmanItems || [])];

    if (items.length === 0) {
      console.log(`[cron-met] ✅ Fila vazia! Total processados: ${totalProcessados}`);
      break;
    }

    // Marcar todos como "gerando"
    const ids = items.map((it: any) => it.id);
    await supabaseClient
      .from('metodologias_fila')
      .update({ status: 'gerando' })
      .in('id', ids);

    console.log(`[cron-met] 🔄 Rodada ${round + 1}: ${items.length} itens (${cornellItems?.length || 0} cornell + ${feynmanItems?.length || 0} feynman)`);

    // Processar todos em paralelo
    await Promise.allSettled(
      items.map((item: any) => processarItem(supabaseClient, item, apiKeys))
    );

    totalProcessados += items.length;

    // Pequeno delay entre rodadas para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return totalProcessados;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      throw new Error('Nenhuma chave API configurada');
    }

    // Processar toda a fila diretamente (sem background)
    // A resposta só retorna quando terminar tudo
    const processados = await processarFilaCompleta(supabaseClient, apiKeys);

    return new Response(JSON.stringify({ success: true, processados }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[cron-met] Erro geral:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
