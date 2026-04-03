import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODELOS_IMAGEM = [
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.0-flash-exp",
];

async function gerarImagemGemini(prompt: string, apiKey: string, modelo: string): Promise<{ data?: string; error?: string; isQuota?: boolean; isNotFound?: boolean }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      error: `${response.status}: ${errorText.substring(0, 200)}`,
      isQuota: response.status === 429 || errorText.includes("RESOURCE_EXHAUSTED"),
      isNotFound: response.status === 404,
    };
  }

  const result = await response.json();
  const parts = result?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith("image/")) {
      return { data: part.inlineData.data };
    }
  }
  return { error: "Nenhuma imagem na resposta" };
}

async function gerarImagemComFallback(prompt: string, apiKeys: string[]): Promise<string> {
  let lastError = "";
  for (const modelo of MODELOS_IMAGEM) {
    for (let i = 0; i < apiKeys.length; i++) {
      const result = await gerarImagemGemini(prompt, apiKeys[i], modelo);
      if (result.data) return result.data;
      lastError = result.error || "Erro desconhecido";
      if (result.isNotFound) break;
      if (result.isQuota) continue;
    }
  }
  throw new Error(`Todas as chaves falharam. Último erro: ${lastError}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id, titulo } = await req.json();
    if (!topico_id || !titulo) {
      return new Response(JSON.stringify({ error: "topico_id e titulo são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[gerar-capa-faculdade] Gerando capa para: "${titulo}"`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const { data: existing } = await supabase
      .from("faculdade_topicos")
      .select("capa_url")
      .eq("id", topico_id)
      .single();

    if (existing?.capa_url) {
      return new Response(JSON.stringify({ success: true, cached: true, capa_url: existing.capa_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("DIREITO_PREMIUM_API_KEY"),
    ].filter(Boolean) as string[];

    const prompt = `Create a cinematic, photorealistic image representing the legal concept: "${titulo}".

STYLE: Cinematic Realistic — a real-life Brazilian scene transforming into a legal concept.
- Show a realistic everyday scene (office, courtroom, street, library) with golden ethereal legal symbols floating above (scales of justice, contracts, gavels, law books).
- Dramatic lighting with warm golden tones and deep shadows.
- Characters shown in silhouette, profile, or from behind (NO clear faces to avoid distortion).
- Rich atmospheric details: dust particles in light beams, reflections, depth of field.
- Aspect ratio: 1:1 (square), suitable for a circular thumbnail.
- NO text, NO titles, NO watermarks, NO cartoon or 3D style.
- High impact, visually striking composition that immediately conveys the legal theme.

⛔ FORBIDDEN: Any text or letters in the image, cartoon style, 3D renders, clear facial features.`;

    const imageBase64 = await gerarImagemComFallback(prompt, apiKeys);
    const bytes = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));

    const fileName = `faculdade/capas/topico-${topico_id}-${Date.now()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("imagens")
      .upload(fileName, bytes, { contentType: "image/webp", upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("imagens").getPublicUrl(fileName);
    const capaUrl = urlData.publicUrl;

    await supabase
      .from("faculdade_topicos")
      .update({ capa_url: capaUrl })
      .eq("id", topico_id);

    console.log(`[gerar-capa-faculdade] ✅ Capa gerada: ${capaUrl}`);

    return new Response(JSON.stringify({ success: true, capa_url: capaUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[gerar-capa-faculdade] Erro:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
