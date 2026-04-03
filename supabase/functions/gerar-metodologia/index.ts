import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

function getApiKeys(): string[] {
  return getRotatedKeyStrings();
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
    // Fix common issues
    cleaned = cleaned
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/[\x00-\x1F\x7F]/g, '');

    try {
      return JSON.parse(cleaned);
    } catch {
      // Try to repair truncated JSON
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
      console.log(`[gerar-metodologia] Tentando chave ${i + 1}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKeys[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            }
          })
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[gerar-metodologia] Chave ${i + 1} rate limited`);
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        console.error(`[gerar-metodologia] Erro chave ${i + 1}: ${err}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.error(`[gerar-metodologia] Exceção chave ${i + 1}:`, e);
    }
  }
  throw new Error('Todas as chaves esgotadas');
}

function buildCornellPrompt(area: string, tema: string, subtema?: string): string {
  const contexto = subtema ? `o subtema "${subtema}" do tema "${tema}"` : `o tema "${tema}"`;
  return `Você é um especialista em Direito brasileiro. Gere uma FICHA DE ESTUDO CONCISA usando o Método Cornell para ${contexto} da área "${area}".

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
    {
      "titulo": "Ponto-chave",
      "conteudo": "Explicação curta (2-3 frases no máximo)"
    }
  ],
  "palavras_chave": [
    {
      "termo": "Termo técnico",
      "dica": "Definição em 1 frase"
    }
  ],
  "resumo": "Síntese em 2 frases no máximo"
}

Gere EXATAMENTE 3 anotações e 5 palavras-chave. Seja objetivo e direto.`;
}

function buildFeynmanPrompt(area: string, tema: string, subtema?: string): string {
  const contexto = subtema ? `o subtema "${subtema}" do tema "${tema}"` : `o tema "${tema}"`;
  return `Você é um especialista em Direito brasileiro. Gere uma FICHA DE ESTUDO CONCISA usando o Método Feynman para ${contexto} da área "${area}".

REGRAS DE CONCISÃO (OBRIGATÓRIO):
- Conceito: 1-2 frases diretas
- Explicação simples: 1 parágrafo curto (máx 4 frases)
- Cada lacuna: 1 frase
- Cada analogia: 1 frase

O Método Feynman tem 4 etapas:
1. CONCEITO: Definição clara e direta (1-2 frases)
2. EXPLICAÇÃO SIMPLES: Como explicaria para um leigo (1 parágrafo curto)
3. LACUNAS: Pontos que os estudantes mais erram
4. ANALOGIAS: Comparações do dia a dia

Retorne um JSON com esta estrutura EXATA:
{
  "conceito": "Definição direta em 1-2 frases",
  "explicacao_simples": "Explicação simples em 1 parágrafo curto (máx 4 frases)",
  "lacunas": [
    {
      "ponto": "Aspecto complexo",
      "explicacao": "Explicação em 1 frase"
    }
  ],
  "analogias": [
    {
      "analogia": "Situação do cotidiano",
      "relacao": "Relação com o conceito em 1 frase"
    }
  ]
}

Gere EXATAMENTE 3 lacunas e 3 analogias. Seja objetivo e criativo.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, tema, metodo, subtema } = await req.json();

    if (!area || !tema || !metodo) {
      return new Response(JSON.stringify({ error: 'area, tema e metodo são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!['cornell', 'feynman'].includes(metodo)) {
      return new Response(JSON.stringify({ error: 'metodo deve ser cornell ou feynman' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      throw new Error('Nenhuma chave API configurada');
    }

    const prompt = metodo === 'cornell' ? buildCornellPrompt(area, tema, subtema) : buildFeynmanPrompt(area, tema, subtema);
    
    console.log(`[gerar-metodologia] Gerando ${metodo} para ${area} > ${tema}${subtema ? ` > ${subtema}` : ''}`);
    const resultText = await chamarGemini(prompt, apiKeys);
    
    let conteudo;
    try {
      conteudo = extractJsonFromResponse(resultText);
    } catch (parseErr) {
      console.error('[gerar-metodologia] JSON inválido. Resposta bruta:', resultText?.substring(0, 500));
      throw new Error('Resposta da IA não é JSON válido');
    }

    // Salvar no banco
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert based on the unique index (area, tema, subtema, metodo)
    const { error: dbError } = await supabase
      .from('METODOLOGIAS_GERADAS')
      .upsert({
        area,
        tema,
        metodo,
        subtema: subtema || '',
        conteudo,
        created_at: new Date().toISOString(),
      }, { onConflict: 'area,tema,subtema,metodo' });

    if (dbError) {
      console.error('[gerar-metodologia] Erro DB:', dbError);
      throw new Error(`Erro ao salvar: ${dbError.message}`);
    }

    console.log(`[gerar-metodologia] Sucesso: ${metodo} para ${area} > ${tema}${subtema ? ` > ${subtema}` : ''}`);

    return new Response(JSON.stringify({ success: true, conteudo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[gerar-metodologia] Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
