import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/[\x00-\x1F\x7F]/g, '');
    return JSON.parse(cleaned);
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
              temperature: 0.4,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.status === 429 || response.status === 503) continue;
      if (!response.ok) {
        await response.text();
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      console.error(`[gerar-resumo-artigo-metodo] Exceção chave ${i + 1}:`, e);
    }
  }
  throw new Error('Todas as chaves esgotadas');
}

function buildCornellPrompt(artigo: string, numeroArtigo: string, area: string): string {
  return `Você é um especialista em Direito brasileiro. Gere uma FICHA DE ESTUDO CONCISA usando o Método Cornell para o Art. ${numeroArtigo} de "${area}".

TEXTO DO ARTIGO:
${artigo}

REGRAS:
- Cada anotação: máximo 2-3 frases curtas baseadas no texto do artigo
- Cada palavra-chave: 1 frase objetiva
- Resumo: máximo 2 frases

O Método Cornell divide em 3 seções:
1. ANOTAÇÕES: 3 pontos-chave essenciais do artigo
2. PALAVRAS-CHAVE: 5 termos técnicos presentes no artigo com definição
3. RESUMO: Síntese em no máximo 2 frases

Retorne JSON:
{
  "anotacoes": [{"titulo": "...", "conteudo": "..."}],
  "palavras_chave": [{"termo": "...", "dica": "..."}],
  "resumo": "..."
}

EXATAMENTE 3 anotações e 5 palavras-chave.`;
}

function buildFeynmanPrompt(artigo: string, numeroArtigo: string, area: string): string {
  return `Você é um especialista em Direito brasileiro. Gere uma FICHA DE ESTUDO CONCISA usando o Método Feynman para o Art. ${numeroArtigo} de "${area}".

TEXTO DO ARTIGO:
${artigo}

REGRAS:
- Conceito: 1-2 frases diretas
- Explicação simples: 1 parágrafo curto (máx 4 frases)
- Cada lacuna: 1 frase
- Cada analogia: 1 frase

O Método Feynman tem 4 etapas:
1. CONCEITO: O que o artigo define
2. EXPLICAÇÃO SIMPLES: Como explicaria para um leigo
3. LACUNAS: Pontos que estudantes mais erram sobre este artigo
4. ANALOGIAS: Comparações do dia a dia

Retorne JSON:
{
  "conceito": "...",
  "explicacao_simples": "...",
  "lacunas": [{"ponto": "...", "explicacao": "..."}],
  "analogias": [{"analogia": "...", "relacao": "..."}]
}

EXATAMENTE 3 lacunas e 3 analogias.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigo, numeroArtigo, codeName, area, metodo } = await req.json();

    if (!artigo || !numeroArtigo || !metodo) {
      return new Response(JSON.stringify({ error: 'artigo, numeroArtigo e metodo são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['cornell', 'feynman'].includes(metodo)) {
      return new Response(JSON.stringify({ error: 'metodo deve ser cornell ou feynman' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKeys = getRotatedKeyStrings();
    if (apiKeys.length === 0) throw new Error('Nenhuma chave API configurada');

    const prompt = metodo === 'cornell'
      ? buildCornellPrompt(artigo, numeroArtigo, area || codeName)
      : buildFeynmanPrompt(artigo, numeroArtigo, area || codeName);

    console.log(`[gerar-resumo-artigo-metodo] Gerando ${metodo} para Art. ${numeroArtigo} de ${area}`);
    const resultText = await chamarGemini(prompt, apiKeys);
    const conteudo = extractJsonFromResponse(resultText);

    return new Response(JSON.stringify({ success: true, conteudo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[gerar-resumo-artigo-metodo] Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
