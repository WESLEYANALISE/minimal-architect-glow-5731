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

// ==================== TEXT HELPERS ====================

function limparTextoParaTTS(texto: string): string {
  return texto
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[-*]\s/g, '')
    .replace(/>\s/g, '')
    .replace(/---+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function montarScript(dica: any): string {
  const partes: string[] = [];
  partes.push(`A recomendação do livro de hoje é "${dica.livro_titulo}", de ${dica.livro_autor}.`);

  if (dica.porque_ler) {
    // Sem limite - texto completo
    partes.push(limparTextoParaTTS(dica.porque_ler));
  }

  if (dica.frase_dia) {
    partes.push(`Para refletir: ${limparTextoParaTTS(dica.frase_dia)}`);
  }

  partes.push(`Esse foi o resumo de hoje. Bons estudos e até a próxima!`);
  return partes.join('\n\n');
}

// ==================== CHUNKING TTS ====================

function dividirTextoEmChunks(texto: string, maxChars = 4000): string[] {
  if (texto.length <= maxChars) return [texto];

  const chunks: string[] = [];
  let restante = texto;

  while (restante.length > 0) {
    if (restante.length <= maxChars) {
      chunks.push(restante);
      break;
    }

    let corte = -1;
    for (let i = maxChars; i >= maxChars * 0.5; i--) {
      if (restante[i] === '.' || restante[i] === '!' || restante[i] === '?') {
        corte = i + 1;
        break;
      }
    }

    if (corte === -1) {
      for (let i = maxChars; i >= maxChars * 0.5; i--) {
        if (restante[i] === ' ') {
          corte = i + 1;
          break;
        }
      }
    }

    if (corte === -1) corte = maxChars;

    chunks.push(restante.slice(0, corte).trim());
    restante = restante.slice(corte).trim();
  }

  return chunks;
}

async function gerarAudioTTSComChunking(texto: string): Promise<string> {
  const chunks = dividirTextoEmChunks(texto, 4000);
  console.log(`📝 Texto dividido em ${chunks.length} chunk(s) para TTS`);

  const pcmBuffers: Uint8Array[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`🎙️ Gerando áudio chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
    const base64 = await gerarAudioTTSSingle(chunks[i]);
    
    const binaryString = atob(base64);
    const len = binaryString.length;
    const pcm = new Uint8Array(len);
    for (let j = 0; j < len; j++) {
      pcm[j] = binaryString.charCodeAt(j);
    }
    pcmBuffers.push(pcm);
  }

  // Concatenar PCM
  const totalLength = pcmBuffers.reduce((acc, buf) => acc + buf.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of pcmBuffers) {
    combined.set(buf, offset);
    offset += buf.length;
  }

  // Base64 encode
  const CHUNK_SIZE = 65536;
  let binaryStr = '';
  for (let i = 0; i < combined.length; i += CHUNK_SIZE) {
    const slice = combined.subarray(i, Math.min(i + CHUNK_SIZE, combined.length));
    binaryStr += String.fromCharCode(...slice);
  }

  console.log(`✅ Áudio total: ${combined.length} bytes PCM`);
  return btoa(binaryStr);
}

async function gerarAudioTTSSingle(texto: string): Promise<string> {
  for (const chave of API_KEYS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${chave}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: texto }] }],
          generationConfig: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: { voice_name: "Sulafat" }
              }
            }
          }
        })
      });

      if (!response.ok) {
        console.log('Erro Gemini TTS:', response.status, await response.text());
        continue;
      }

      const data = await response.json();
      const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64) return audioBase64;
    } catch (error) {
      console.error('Erro com Gemini TTS:', error);
      continue;
    }
  }
  throw new Error('Todas as chaves falharam para TTS');
}

// ==================== WAV HELPER ====================

function pcmToWav(pcmData: Uint8Array, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Uint8Array {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const wavData = new Uint8Array(buffer);
  wavData.set(pcmData, 44);
  return wavData;
}

// ==================== MAIN ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (API_KEYS.length === 0) throw new Error('Nenhuma chave API Gemini configurada');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let dica_id: number | null = null;
    try {
      const body = await req.json();
      dica_id = body?.dica_id || null;
    } catch { /* body vazio do cron */ }

    // Se não recebeu dica_id, buscar a dica de hoje sem áudio
    if (!dica_id) {
      const now = new Date();
      const brasiliaOffset = -3 * 60;
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
      const dataHoje = brasiliaDate.toISOString().split('T')[0];
      console.log(`🔍 Buscando dica do dia sem áudio para: ${dataHoje}`);

      const { data: dicaHoje } = await supabase
        .from('dicas_do_dia')
        .select('id')
        .eq('data', dataHoje)
        .is('audio_url', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!dicaHoje) {
        console.log('⏭️ Nenhuma dica sem áudio encontrada para hoje');
        return new Response(JSON.stringify({ message: 'Nenhuma dica pendente de narração' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      dica_id = dicaHoje.id;
      console.log(`✅ Dica encontrada: ID ${dica_id}`);
    }

    const { data: dica, error: dicaError } = await supabase
      .from('dicas_do_dia')
      .select('*')
      .eq('id', dica_id)
      .single();

    if (dicaError || !dica) throw new Error(`Dica não encontrada: ${dicaError?.message}`);

    console.log(`Gerando narração para: ${dica.livro_titulo}`);

    const script = montarScript(dica);
    console.log(`Script com ${script.length} caracteres`);

    // Gerar áudio com chunking (texto completo, sem limites)
    const audioBase64 = await gerarAudioTTSComChunking(script);
    
    // Decodificar
    const binaryString = atob(audioBase64);
    const len = binaryString.length;
    const pcmBytes = new Uint8Array(len);
    for (let j = 0; j < len; j++) {
      pcmBytes[j] = binaryString.charCodeAt(j);
    }

    const audioBytes = pcmToWav(pcmBytes);
    const duracaoSegundos = Math.round(len / 48000);

    const path = `${dica_id}_${Date.now()}.wav`;
    const { error: uploadError } = await supabase.storage
      .from('dicas-audio')
      .upload(path, audioBytes, { contentType: 'audio/wav', upsert: true });

    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('dicas-audio').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('dicas_do_dia')
      .update({ audio_url: publicUrl, audio_duracao_segundos: duracaoSegundos })
      .eq('id', dica_id);

    if (updateError) throw new Error(`Update falhou: ${updateError.message}`);

    console.log(`✅ Narração salva: ${publicUrl} (${duracaoSegundos}s)`);

    return new Response(
      JSON.stringify({ success: true, audio_url: publicUrl, duracao: duracaoSegundos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro gerar-narracao-recomendacao:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
