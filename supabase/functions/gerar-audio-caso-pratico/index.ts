import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pcmToWav } from "../_shared/pcm-to-wav.ts";

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

async function processAudio(caso: any) {
  const sb = getSupabase();
  const texto = caso.caso_narrativa.substring(0, 5000);
  const offset = Math.floor(Date.now() / 1000) % GEMINI_KEYS.length;

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const apiKey = GEMINI_KEYS[(offset + i) % GEMINI_KEYS.length];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: texto }] }],
          generationConfig: {
            response_modalities: ["AUDIO"],
            speech_config: { voice_config: { prebuilt_voice_config: { voice_name: "Kore" } } }
          }
        }),
      });
      if (res.status === 429 || res.status === 503) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!inlineData?.data) continue;

      const rawPcm = Uint8Array.from(atob(inlineData.data), c => c.charCodeAt(0));
      
      // Convert PCM to WAV with proper header
      const wavData = pcmToWav(rawPcm, 24000, 1, 16);

      const fileName = `narracoes/caso-audio-${caso.id}-${Date.now()}.wav`;
      const { error: uploadErr } = await sb.storage.from('casos-praticos-capas').upload(fileName, wavData, { contentType: 'audio/wav', upsert: true });
      if (uploadErr) { console.error('Upload falhou:', uploadErr); return; }
      const { data: urlData } = sb.storage.from('casos-praticos-capas').getPublicUrl(fileName);
      await sb.from('gamificacao_casos_praticos').update({ audio_url: urlData.publicUrl }).eq('id', caso.id);
      console.log(`✅ Áudio gerado para caso ${caso.id} (Art. ${caso.numero_artigo}): ${urlData.publicUrl}`);
      return;
    } catch (e) { console.error('Erro TTS:', e); continue; }
  }
  console.error('Todas as chaves falharam para caso', caso.id);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { caso_id, force } = await req.json();
    if (!caso_id) throw new Error('caso_id é obrigatório');
    if (GEMINI_KEYS.length === 0) throw new Error('Nenhuma chave Gemini configurada');

    const sb = getSupabase();
    const { data: caso, error } = await sb
      .from('gamificacao_casos_praticos')
      .select('id, numero_artigo, caso_narrativa, audio_url')
      .eq('id', caso_id)
      .single();

    if (error || !caso) throw new Error('Caso não encontrado');
    if (caso.audio_url && !force) {
      return new Response(JSON.stringify({ audio_url: caso.audio_url, message: 'Áudio já existe' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!caso.caso_narrativa || caso.caso_narrativa.length < 10) throw new Error('Narrativa muito curta');

    // Process in background
    const bgPromise = processAudio(caso);
    // @ts-ignore
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(bgPromise);
    } else {
      bgPromise.catch(e => console.error('BG error:', e));
    }

    return new Response(JSON.stringify({ status: 'gerando', message: 'Áudio sendo gerado em background' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Erro:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
