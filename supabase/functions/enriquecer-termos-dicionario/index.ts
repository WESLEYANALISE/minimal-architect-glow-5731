import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "gemini-2.5-flash-lite";

async function chamarGeminiComFallback(prompt: string): Promise<string> {
  const API_KEYS = [
    { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
    { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
    { name: 'DIREITO_PREMIUM_API_KEY', key: Deno.env.get('DIREITO_PREMIUM_API_KEY') }
  ].filter(k => k.key);

  if (API_KEYS.length === 0) throw new Error('Nenhuma API key configurada');

  // Round-robin based on timestamp
  const startIndex = Date.now() % API_KEYS.length;

  for (let i = 0; i < API_KEYS.length; i++) {
    const idx = (startIndex + i) % API_KEYS.length;
    const { name, key } = API_KEYS[idx];
    try {
      console.log(`📝 Tentando ${name}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 4000 }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`✅ Sucesso com ${name}`);
        return result;
      }

      const errorText = await response.text();
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED')) {
        console.log(`⚠️ Quota excedida em ${name}, tentando próxima...`);
        continue;
      }
      console.error(`❌ Erro ${response.status} em ${name}: ${errorText.substring(0, 200)}`);
      continue;
    } catch (error) {
      console.error(`❌ Exceção em ${name}: ${error}`);
      continue;
    }
  }

  throw new Error('Todas as chaves API falharam');
}

function extractJson(text: string): any {
  // Try to extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  // Try parsing directly
  return JSON.parse(text);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termos } = await req.json();

    if (!termos || !Array.isArray(termos) || termos.length === 0) {
      throw new Error("Campo 'termos' é obrigatório (array de {palavra, significado})");
    }

    // Build batch prompt
    const termList = termos.map((t: any, i: number) => 
      `${i + 1}. Termo: "${t.palavra}" | Significado original: "${t.significado}"`
    ).join("\n");

    const prompt = `Você é um professor de Direito brasileiro explicando termos para um LEIGO completo, alguém que nunca estudou Direito.

Para cada termo jurídico abaixo, reescreva o significado de forma clara, simples e acessível.

REGRAS OBRIGATÓRIAS:
- Use linguagem simples, como se estivesse explicando para alguém sem nenhum conhecimento jurídico
- Comece explicando O QUE É o termo de forma direta (ex: "É quando...", "Significa que...", "Refere-se a...")
- Se o termo vem do latim ou outra língua, mencione brevemente a origem mas foque na explicação prática
- Dê 2-3 frases: a primeira explica o conceito, as seguintes dão contexto prático de quando/onde é usado
- NÃO use outros termos jurídicos complexos na explicação (ou se usar, explique-os entre parênteses)
- NÃO use abreviações como "Adj.", "DCan.", "Lat." sem explicar
- NÃO use formatação markdown
- Responda APENAS com um array JSON, sem texto adicional

EXEMPLO:
Termo original: "(Lat. ecles. abbatialis.) Adj. DCan. Relativo a abade, abadia."
Significado enriquecido: "É um termo que vem do latim eclesiástico e significa 'relativo ao abade ou à abadia'. Na prática, é usado no Direito Canônico (o direito da Igreja Católica) para se referir a tudo que diz respeito à administração e autoridade de um abade dentro de um mosteiro ou abadia."

Formato:
[{"palavra": "...", "significado_enriquecido": "..."}]

Termos:
${termList}`;

    const result = await chamarGeminiComFallback(prompt);
    const enriched = extractJson(result);

    return new Response(JSON.stringify({ enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
