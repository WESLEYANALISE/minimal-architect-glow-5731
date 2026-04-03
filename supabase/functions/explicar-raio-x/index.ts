import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { numero_lei, ementa, lei_afetada, artigos_afetados, tipo_alteracao } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tipoLabel = tipo_alteracao === "alteracao" ? "alteração" : tipo_alteracao === "revogacao" ? "revogação" : "nova lei";

    const prompt = `Explique de forma simples e didática, para uma pessoa leiga, o seguinte ato legislativo brasileiro:

**Lei**: ${numero_lei}
**Tipo**: ${tipoLabel}
**Ementa**: ${ementa || "Não informada"}
${lei_afetada ? `**Lei afetada**: ${lei_afetada}` : ""}
${artigos_afetados?.length ? `**Artigos afetados**: ${artigos_afetados.join(", ")}` : ""}

Sua resposta deve:
1. Explicar O QUE mudou em linguagem simples (sem jargão jurídico)
2. Explicar POR QUE isso é relevante para o cidadão comum
3. Dar um exemplo prático do impacto no dia a dia, se possível

Limite: máximo 250 palavras. Seja direto e claro. Não use bullet points, escreva em parágrafos curtos.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Você é um especialista em direito brasileiro que explica leis de forma simples e acessível para leigos. Responda sempre em português do Brasil." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const explicacao = data.choices?.[0]?.message?.content || "Não foi possível gerar a explicação.";

    return new Response(JSON.stringify({ explicacao }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("explicar-raio-x error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
