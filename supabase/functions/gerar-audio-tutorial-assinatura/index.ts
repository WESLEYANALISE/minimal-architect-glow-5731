import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TUTORIAL_TEXT = `Olá! Que bom te ver aqui! Antes de qualquer coisa, deixa eu te mostrar o preferido da galera: o Plano Anual por apenas 149 reais e 90 centavos. Um pagamento por ano, sem surpresa. Acesso completo por 12 meses.

E olha esse dado: 89 por cento das pessoas que assinam o Direito Prime escolhem o Anual antes mesmo do período de teste acabar. Por quê? Porque quando elas entram e veem tudo o que tem aqui: resumos, questões, videoaulas, conteúdo pra faculdade e concurso em um só lugar, elas falam: não tem como largar isso.

Com o Anual, nenhuma versão fica bloqueada. É tudo liberado, por 1 ano inteiro.

Se você quiser testar por mais tempo antes de decidir pelo anual, tem o Plano Semestral por 49 reais e 90 centavos. São 6 meses com acesso completo. Ótimo custo benefício pra quem tá no ritmo dos estudos agora.

E pra quem quer começar com calma, o Plano Mensal por 29 reais e 90 centavos renova todo mês e você pode cancelar quando quiser. Simples assim.`;

const OFERTA_48H_TEXT = `Atenção! Você ainda está no seu período de teste de 48 horas e isso é uma vantagem enorme. Se você assinar o Plano Anual agora, durante o seu período de teste, você paga apenas 99 reais e 90 centavos em vez de 149 reais e 90 centavos. São 50 reais de desconto que somem quando seu teste acabar. Não deixa essa passar!`;

async function gerarAudioGeminiTTS(texto: string, chavesDisponiveis: string[]): Promise<string> {
  for (let i = 0; i < chavesDisponiveis.length; i++) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${chavesDisponiveis[i]}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: texto }] }],
          generationConfig: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: "Sulafat"
                }
              }
            }
          }
        }),
      });

      if (response.status === 429 || response.status === 503) {
        console.log(`Chave ${i + 1} rate limited, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro chave ${i + 1}: ${response.status} - ${errorText}`);
        if (i < chavesDisponiveis.length - 1) continue;
        throw new Error(`TTS falhou: ${response.status}`);
      }

      const data = await response.json();
      const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!audioBase64) {
        console.error('Sem áudio na resposta');
        if (i < chavesDisponiveis.length - 1) continue;
        throw new Error('Nenhum áudio retornado');
      }

      console.log(`✅ Áudio gerado com chave ${i + 1}`);
      return audioBase64;
    } catch (error) {
      if (i === chavesDisponiveis.length - 1) throw error;
    }
  }
  throw new Error('Nenhuma chave disponível');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { tipo } = await req.json();
    const cacheKey = tipo === 'oferta_48h' ? 'tutorial_assinatura_oferta_48h_v1' : 'tutorial_assinatura_v1';
    const texto = tipo === 'oferta_48h' ? OFERTA_48H_TEXT : TUTORIAL_TEXT;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache
    const { data: cached } = await supabase
      .from('AUDIO_FEEDBACK_CACHE')
      .select('url_audio')
      .eq('tipo', cacheKey)
      .maybeSingle();

    if (cached?.url_audio) {
      return new Response(JSON.stringify({ audioUrl: cached.url_audio, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gerar áudio via Gemini TTS
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
    ].filter(Boolean) as string[];

    if (chavesDisponiveis.length === 0) throw new Error('Nenhuma chave GEMINI configurada');

    const audioBase64 = await gerarAudioGeminiTTS(texto, chavesDisponiveis);

    // Converter base64 para bytes
    const binaryString = atob(audioBase64);
    const audioBytes = new Uint8Array(binaryString.length);
    for (let j = 0; j < binaryString.length; j++) audioBytes[j] = binaryString.charCodeAt(j);

    // Upload
    const path = `tutorial/${cacheKey}_${Date.now()}.wav`;
    const { error: uploadError } = await supabase.storage
      .from('audios')
      .upload(path, audioBytes, { contentType: 'audio/wav', upsert: true });

    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('audios').getPublicUrl(path);
    const audioUrl = urlData.publicUrl;

    // Salvar no cache
    await supabase.from('AUDIO_FEEDBACK_CACHE').insert({ tipo: cacheKey, url_audio: audioUrl });

    return new Response(JSON.stringify({ audioUrl, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[gerar-audio-tutorial-assinatura]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
