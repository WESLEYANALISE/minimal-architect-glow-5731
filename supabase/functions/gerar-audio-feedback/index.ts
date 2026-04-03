import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Textos fixos para feedback de voz
const FEEDBACKS = {
  correta: "Parabéns, você acertou!",
  incorreta: "Ops, você errou."
}

const CURRENT_AUDIO_VERSION = 'v4'
const SAMPLE_RATE = 24000

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function pcmToWav(pcmData: Uint8Array): Uint8Array {
  const numChannels = 1
  const bitsPerSample = 16
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8)
  const blockAlign = numChannels * (bitsPerSample / 8)
  const dataSize = pcmData.length
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, totalSize - 8, true)
  writeString(view, 8, 'WAVE')

  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)

  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  const wavData = new Uint8Array(buffer)
  wavData.set(pcmData, headerSize)
  return wavData
}

// Função para upload no Supabase Storage
async function uploadParaSupabase(
  supabase: any,
  bytes: Uint8Array,
  bucket: string,
  path: string,
  contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`)
  
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true
    })

  if (uploadError) {
    console.error('[upload] Erro:', uploadError)
    throw new Error(`Erro no upload: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  console.log(`[upload] URL pública: ${publicUrl}`)
  return publicUrl
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tipo, texto: textoCustom, voz } = await req.json()

    if (!tipo) {
      throw new Error('Tipo é obrigatório')
    }

    // Determinar o texto a ser usado
    let textoFinal: string
    if (textoCustom) {
      // Texto customizado passado diretamente
      textoFinal = textoCustom
    } else if (['correta', 'incorreta'].includes(tipo)) {
      // Tipos padrão de feedback
      textoFinal = FEEDBACKS[tipo as keyof typeof FEEDBACKS]
    } else {
      throw new Error('Para tipos customizados, o parâmetro "texto" é obrigatório')
    }

    // Chaves de API disponíveis para fallback (apenas GEMINI_KEY_1, 2, 3)
    const chavesDisponiveis = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
    ].filter(Boolean) as string[];

    if (chavesDisponiveis.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verificar cache na tabela AUDIO_FEEDBACK_CACHE
    const { data: cached } = await supabase
      .from('AUDIO_FEEDBACK_CACHE')
      .select('url_audio')
      .eq('tipo', tipo)
      .single()

    const hasCurrentCache = cached?.url_audio?.includes(`_${CURRENT_AUDIO_VERSION}.`)

    if (hasCurrentCache && cached?.url_audio) {
      console.log(`[gerar-audio-feedback] Cache encontrado para: ${tipo}`)
      return new Response(
        JSON.stringify({ url_audio: cached.url_audio, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[gerar-audio-feedback] Gerando áudio para: ${tipo} (${chavesDisponiveis.length} chaves disponíveis)`)

    // Determinar a voz Gemini TTS (padrão: Kore)
    const vozFinal = voz || 'Kore';

    let audioBase64 = '';
    let audioMimeType = '';

    for (let i = 0; i < chavesDisponiveis.length; i++) {
      try {
        console.log(`[gerar-audio-feedback] Tentando chave ${i + 1}/${chavesDisponiveis.length}...`);
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${chavesDisponiveis[i]}`;
        const ttsResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: textoFinal }] }],
            generationConfig: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voice_config: { prebuilt_voice_config: { voice_name: vozFinal } }
              }
            }
          })
        });

        if (!ttsResponse.ok) {
          console.error(`[gerar-audio-feedback] Erro TTS chave ${i + 1}: ${ttsResponse.status}`);
          if (ttsResponse.status === 429 && i < chavesDisponiveis.length - 1) {
            console.log(`[gerar-audio-feedback] Rate limit, tentando próxima chave...`);
            continue;
          }
          if (i === chavesDisponiveis.length - 1) {
            const errorText = await ttsResponse.text();
            throw new Error(`Gemini TTS erro: ${ttsResponse.status} - ${errorText}`);
          }
          continue;
        }

        const data = await ttsResponse.json();
        const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        audioBase64 = inlineData?.data || '';
        audioMimeType = (inlineData?.mimeType || '').toLowerCase();

        if (audioBase64) {
          console.log(`[gerar-audio-feedback] Sucesso com chave ${i + 1} (${audioMimeType || 'mimeType desconhecido'})`);
          break;
        }
      } catch (error: any) {
        if (i === chavesDisponiveis.length - 1) throw error;
      }
    }

    if (!audioBase64) {
      throw new Error('Falha em todas as chaves de API Gemini TTS');
    }

    const rawAudioBytes = decodeBase64ToBytes(audioBase64)

    const isPCM = audioMimeType.includes('audio/l16') || audioMimeType.includes('pcm')
    const isWav = audioMimeType.includes('wav')

    const processedBytes = isPCM ? pcmToWav(rawAudioBytes) : rawAudioBytes
    const extension = isPCM || isWav ? 'wav' : 'mp3'
    const contentType = isPCM || isWav ? 'audio/wav' : 'audio/mpeg'

    // Upload para Supabase Storage (v4 = áudio corrigido com formato válido)
    const filePath = `feedback/${tipo}_${CURRENT_AUDIO_VERSION}.${extension}`
    const audioUrl = await uploadParaSupabase(supabase, processedBytes, 'audios', filePath, contentType)

    console.log(`[gerar-audio-feedback] Áudio gerado: ${audioUrl}`)

    // Salvar no cache
    await supabase
      .from('AUDIO_FEEDBACK_CACHE')
      .upsert({ tipo, url_audio: audioUrl }, { onConflict: 'tipo' })

    return new Response(
      JSON.stringify({ url_audio: audioUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-audio-feedback] Erro:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar áudio de feedback', details: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
