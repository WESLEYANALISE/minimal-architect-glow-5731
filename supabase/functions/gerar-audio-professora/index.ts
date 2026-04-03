import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { pcmToWav } from "../_shared/pcm-to-wav.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || text.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Texto muito curto para gerar áudio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada');
    }

    const truncatedText = text.substring(0, 5000);
    
    console.log('Gerando áudio via Gemini TTS API REST...');
    
    let lastError: Error | null = null;
    
    for (const apiKey of API_KEYS) {
      try {
        const audioBase64 = await generateAudioWithTTS(apiKey, truncatedText);
        
        console.log('✅ Áudio gerado com sucesso via TTS API');
        
        return new Response(
          JSON.stringify({ 
            audioBase64,
            mimeType: 'audio/wav'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error(`Erro com chave API:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }
    
    throw lastError || new Error('Todas as chaves API falharam');

  } catch (error) {
    console.error('Erro gerar-audio-professora:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro ao gerar áudio';
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateAudioWithTTS(apiKey: string, text: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{ text }]
    }],
    generationConfig: {
      response_modalities: ["AUDIO"],
      speech_config: {
        voice_config: {
          prebuilt_voice_config: {
            voice_name: "Kore"
          }
        }
      }
    }
  };

  console.log('Enviando request para TTS API...');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('TTS API error:', response.status, errorText);
    throw new Error(`TTS API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('TTS API response received');

  const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  
  if (!inlineData?.data) {
    console.error('Response structure:', JSON.stringify(data, null, 2));
    throw new Error('Nenhum áudio na resposta da API');
  }

  // Convert raw PCM to WAV with proper header
  const rawPcm = Uint8Array.from(atob(inlineData.data), c => c.charCodeAt(0));
  const wavData = pcmToWav(rawPcm, 24000, 1, 16);
  
  // Convert back to base64 for response
  let binary = '';
  for (let i = 0; i < wavData.length; i++) {
    binary += String.fromCharCode(wavData[i]);
  }
  return btoa(binary);
}
