import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

const CACHE_KEY = 'trial_expirado_audio_v3';

const TEXTO_NARRADO = `Olá! Obrigado por testar o Direito Prime. Seu período de teste terminou, mas você pode continuar com acesso completo a todas as ferramentas. São mais de 13 recursos exclusivos: aulas interativas, flashcards, resumos inteligentes, questões comentadas, biblioteca jurídica, videoaulas, audioaulas e muito mais. 94 por cento dos nossos usuários afirmam que o Direito Prime tem tudo que procuram: passo a passo detalhado, conteúdo sempre atualizado e leis organizadas. Tudo pensado pra você dominar o Direito, seja pra faculdade, OAB ou concursos. Milhares de alunos já transformaram seus estudos. Agora é a sua vez!`;

const MENSAGEM_MODAL = 'Você aproveitou ao máximo! Continue com acesso completo a todas as ferramentas.';

function criarWAV(pcmData: Uint8Array, sampleRate: number): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const buffer = new Uint8Array(headerSize + dataSize);
  const view = new DataView(buffer.buffer);
  buffer.set([0x52, 0x49, 0x46, 0x46], 0);
  view.setUint32(4, 36 + dataSize, true);
  buffer.set([0x57, 0x41, 0x56, 0x45], 8);
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  buffer.set([0x64, 0x61, 0x74, 0x61], 36);
  view.setUint32(40, dataSize, true);
  buffer.set(pcmData, 44);
  return buffer;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check cache first — single audio for everyone
    const { data: cached } = await supabase
      .from('AUDIO_FEEDBACK_CACHE')
      .select('url_audio')
      .eq('tipo', CACHE_KEY)
      .maybeSingle();

    if (cached?.url_audio) {
      console.log('✅ Retornando áudio do cache');
      return new Response(
        JSON.stringify({ mensagem: MENSAGEM_MODAL, audioUrl: cached.url_audio }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Generate TTS with Gemini (fixed text, same for all users)
    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    let audioBase64 = '';
    for (const key of API_KEYS) {
      try {
        const ttsRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: TEXTO_NARRADO }] }],
              generationConfig: {
                response_modalities: ['AUDIO'],
                speech_config: {
                  voice_config: {
                    prebuilt_voice_config: { voice_name: 'Kore' },
                  },
                },
              },
            }),
          }
        );
        if (!ttsRes.ok) {
          console.error(`TTS falhou: ${ttsRes.status}`);
          continue;
        }
        const ttsData = await ttsRes.json();
        audioBase64 = ttsData?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
        if (audioBase64) break;
      } catch (e) {
        console.error('TTS error:', e);
      }
    }

    if (!audioBase64) {
      return new Response(
        JSON.stringify({ mensagem: MENSAGEM_MODAL, audioUrl: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Convert PCM to WAV and upload
    const pcmBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const wavBuffer = criarWAV(pcmBytes, 24000);
    const fileName = `trial_expirado_universal.wav`;

    const { error: uploadError } = await supabase.storage
      .from('audios')
      .upload(fileName, wavBuffer, { contentType: 'audio/wav', upsert: true });

    let audioUrl: string | null = null;
    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from('audios').getPublicUrl(fileName);
      audioUrl = publicUrl?.publicUrl || null;
    } else {
      console.error('Upload error:', uploadError);
    }

    // 4. Cache the URL for future requests
    if (audioUrl) {
      await supabase
        .from('AUDIO_FEEDBACK_CACHE')
        .insert({ tipo: CACHE_KEY, url_audio: audioUrl });
      console.log('✅ Áudio cacheado com sucesso');
    }

    return new Response(
      JSON.stringify({ mensagem: MENSAGEM_MODAL, audioUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ mensagem: MENSAGEM_MODAL, audioUrl: null, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
