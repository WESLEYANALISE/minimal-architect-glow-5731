import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leiId, descricao } = await req.json();
    if (!leiId || !descricao) {
      throw new Error('leiId e descricao são obrigatórios');
    }

    const sb = getSupabase();

    // Verificar cache: já tem capa?
    const { data: existing } = await sb
      .from('leis_push_2025')
      .select('capa_explicacao_url')
      .eq('id', leiId)
      .maybeSingle();

    if (existing?.capa_explicacao_url) {
      return new Response(
        JSON.stringify({ success: true, url: existing.capa_explicacao_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar imagem usando mesmo estilo do caso prático
    const prompt = `Generate a dramatic, cinematic illustration for a Brazilian law publication. Subject: ${descricao.substring(0, 300)}. Style: dark moody legal illustration, warm red and amber tones, dramatic chiaroscuro lighting, detailed realistic scene with Brazilian government building or courtroom setting, scales of justice, legal documents. NO TEXT in the image. Horizontal composition 16:9.`;

    const offset = Math.floor(Date.now() / 1000) % GEMINI_KEYS.length;

    for (let i = 0; i < GEMINI_KEYS.length; i++) {
      const key = GEMINI_KEYS[(offset + i) % GEMINI_KEYS.length];
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { response_modalities: ["TEXT", "IMAGE"] },
            }),
          }
        );

        if (res.status === 429 || res.status === 503) continue;
        if (!res.ok) continue;

        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

        if (!imagePart?.inlineData?.data) continue;

        // Ensure bucket exists
        const { error: bucketErr } = await sb.storage.getBucket('leis-dia-capas');
        if (bucketErr) {
          await sb.storage.createBucket('leis-dia-capas', {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024,
          });
        }

        const binaryData = Uint8Array.from(atob(imagePart.inlineData.data), c => c.charCodeAt(0));
        const mimeType = imagePart.inlineData.mimeType || 'image/png';
        const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
        const fileName = `lei-${leiId.substring(0, 8)}-${Date.now()}.${ext}`;

        const { error: uploadErr } = await sb.storage
          .from('leis-dia-capas')
          .upload(fileName, binaryData, { contentType: mimeType, upsert: true });

        if (uploadErr) {
          console.error('Upload error:', uploadErr);
          continue;
        }

        const { data: urlData } = sb.storage.from('leis-dia-capas').getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        // Salvar no banco
        await sb.from('leis_push_2025').update({ capa_explicacao_url: publicUrl }).eq('id', leiId);

        return new Response(
          JSON.stringify({ success: true, url: publicUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('Key', i, 'error:', e);
        continue;
      }
    }

    throw new Error('Todas as chaves falharam para gerar imagem');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
