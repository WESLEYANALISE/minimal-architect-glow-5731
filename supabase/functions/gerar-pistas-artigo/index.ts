import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getGeminiKey = () => {
  const keys = [
    Deno.env.get("GEMINI_KEY_1"),
    Deno.env.get("GEMINI_KEY_2"),
  ].filter(Boolean);
  if (!keys.length) throw new Error("Nenhuma chave Gemini configurada");
  return keys[Math.floor(Math.random() * keys.length)]!;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigos } = await req.json() as {
      artigos: { numero: string; conteudo: string }[];
    };

    if (!artigos?.length) {
      throw new Error("Nenhum artigo fornecido");
    }

    const prompt = `Você é um professor de Direito Penal especialista em gamificação jurídica.

Para cada artigo do Código Penal abaixo, gere:
1. Exatamente 5 pistas progressivas (da mais vaga à mais específica) para que o jogador adivinhe qual artigo é.
   - Pista 1: Categoria geral (ex: "Crime contra a pessoa")
   - Pista 2: Subcategoria ou bem jurídico protegido
   - Pista 3: Elemento do tipo penal (dolo, culpa, resultado)
   - Pista 4: Pena prevista ou qualificadoras
   - Pista 5: Descrição quase literal do caput (sem mencionar o número do artigo)
2. Exatamente 3 artigos distratores (números reais do CP que sejam plausíveis mas incorretos)

ARTIGOS:
${artigos.map((a, i) => `[${i + 1}] Art. ${a.numero}: ${a.conteudo?.substring(0, 500) || "sem conteúdo"}`).join("\n\n")}

Responda APENAS em JSON válido, sem markdown, no formato:
{
  "rodadas": [
    {
      "artigo_correto": "121",
      "pistas": ["pista1", "pista2", "pista3", "pista4", "pista5"],
      "distratores": ["129", "133", "155"],
      "narrativa": "Uma breve narrativa de caso fictício envolvendo este crime (2-3 frases)"
    }
  ]
}`;

    const apiKey = getGeminiKey();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Resposta vazia do Gemini");

    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro gerar-pistas-artigo:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
