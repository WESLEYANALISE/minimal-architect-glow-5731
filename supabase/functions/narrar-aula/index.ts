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

function extractTextFromConteudo(conteudo: any): string {
  if (!conteudo) return '';
  if (typeof conteudo === 'string') return conteudo;
  
  const parts: string[] = [];

  function extractSlide(slide: any) {
    if (!slide) return;
    if (slide.titulo) parts.push(slide.titulo);
    if (slide.title) parts.push(slide.title);
    if (slide.conteudo) parts.push(slide.conteudo);
    if (slide.content) parts.push(slide.content);
    if (slide.text) parts.push(slide.text);
    if (slide.body) parts.push(slide.body);
    if (slide.explicacao) parts.push(slide.explicacao);
    if (Array.isArray(slide.bullets)) parts.push(...slide.bullets.filter((b: any) => typeof b === 'string'));
    if (Array.isArray(slide.items)) {
      for (const item of slide.items) {
        if (typeof item === 'string') parts.push(item);
        else if (item?.text) parts.push(item.text);
        else if (item?.content) parts.push(item.content);
        else if (item?.conteudo) parts.push(item.conteudo);
      }
    }
    if (Array.isArray(slide.topicos)) {
      for (const t of slide.topicos) {
        if (typeof t === 'string') parts.push(t);
        else if (t?.titulo) parts.push(t.titulo);
        else if (t?.texto) parts.push(t.texto);
      }
    }
  }

  if (Array.isArray(conteudo.secoes)) {
    for (const secao of conteudo.secoes) {
      if (secao.titulo) parts.push(secao.titulo);
      if (Array.isArray(secao.slides)) {
        for (const slide of secao.slides) {
          extractSlide(slide);
        }
      }
      if (secao.conteudo) parts.push(secao.conteudo);
      if (secao.content) parts.push(secao.content);
    }
  }

  if (Array.isArray(conteudo.sections)) {
    for (const section of conteudo.sections) {
      extractSlide(section);
    }
  }
  
  if (Array.isArray(conteudo.slides)) {
    for (const slide of conteudo.slides) {
      extractSlide(slide);
    }
  }
  
  if (conteudo.titulo) parts.push(conteudo.titulo);
  if (conteudo.resumo) parts.push(conteudo.resumo);
  if (conteudo.introducao) parts.push(conteudo.introducao);
  if (conteudo.conclusao) parts.push(conteudo.conclusao);
  if (conteudo.text) parts.push(conteudo.text);
  if (conteudo.body) parts.push(conteudo.body);
  if (conteudo.markdown) parts.push(conteudo.markdown);
  
  if (parts.length === 0) {
    const str = JSON.stringify(conteudo);
    return str.replace(/[{}\[\]"]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  
  return parts.join('. ')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[\u{200D}]/gu, '')
    .replace(/[☕🎯🔥⚡💡📌✅⚠️📋🎭🌊•]/g, '')
    .replace(/\|/g, ', ')
    .replace(/[-]{2,}/g, ' ')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ==================== CHUNKING (~1 minuto por chunk = ~1500 chars) ====================

function splitTextIntoChunks(text: string, maxChars = 1500): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) { chunks.push(remaining); break; }
    let splitAt = -1;
    for (let i = maxChars; i >= maxChars * 0.5; i--) {
      if (remaining[i] === '.' || remaining[i] === '!' || remaining[i] === '?') {
        splitAt = i + 1;
        break;
      }
    }
    if (splitAt === -1) {
      for (let i = maxChars; i >= maxChars * 0.5; i--) {
        if (remaining[i] === ' ') { splitAt = i + 1; break; }
      }
    }
    if (splitAt === -1) splitAt = maxChars;
    chunks.push(remaining.substring(0, splitAt).trim());
    remaining = remaining.substring(splitAt).trim();
  }
  return chunks;
}

// ==================== GEMINI 2.5 FLASH TTS ====================

// Extrai apenas os dados PCM, removendo qualquer header WAV/RIFF
function stripWavHeader(data: Uint8Array): Uint8Array {
  if (data.length > 44 &&
      data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
      data[8] === 0x57 && data[9] === 0x41 && data[10] === 0x56 && data[11] === 0x45) {
    for (let i = 12; i < Math.min(data.length - 8, 200); i++) {
      if (data[i] === 0x64 && data[i+1] === 0x61 && data[i+2] === 0x74 && data[i+3] === 0x61) {
        const dataStart = i + 8;
        console.log(`[narrar-aula] Header WAV detectado, removendo ${dataStart} bytes de header`);
        return data.slice(dataStart);
      }
    }
    console.log(`[narrar-aula] Header WAV padrão, removendo 44 bytes`);
    return data.slice(44);
  }
  return data;
}

async function gerarAudioTTSSingle(texto: string): Promise<Uint8Array> {
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
        const errText = await response.text();
        console.log(`Erro Gemini TTS (${response.status}):`, errText);
        continue;
      }

      const data = await response.json();
      const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const audioBase64 = inlineData?.data;
      const mimeType = inlineData?.mimeType || 'audio/pcm';
      if (!audioBase64) continue;

      console.log(`[narrar-aula] Gemini retornou mimeType: ${mimeType}, base64 length: ${audioBase64.length}`);

      const binaryString = atob(audioBase64);
      const rawBytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        rawBytes[j] = binaryString.charCodeAt(j);
      }

      const pcm = stripWavHeader(rawBytes);
      return pcm;
    } catch (error) {
      console.error('Erro com Gemini TTS:', error);
      continue;
    }
  }
  throw new Error('Todas as chaves falharam para TTS');
}

async function gerarAudioComChunking(texto: string): Promise<Uint8Array> {
  const chunks = splitTextIntoChunks(texto, 1500);
  console.log(`[narrar-aula] Texto dividido em ${chunks.length} chunk(s) (~1min cada)`);

  const pcmBuffers: Uint8Array[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[narrar-aula] 🎙️ Chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
    const pcm = await gerarAudioTTSSingle(chunks[i]);
    pcmBuffers.push(pcm);
  }

  const totalLength = pcmBuffers.reduce((acc, buf) => acc + buf.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of pcmBuffers) {
    combined.set(buf, offset);
    offset += buf.length;
  }
  return combined;
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
    const { topico_id } = await req.json();

    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: 'topico_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: topico, error: fetchError } = await supabase
      .from('categorias_topicos')
      .select('id, titulo, conteudo_gerado, url_narracao')
      .eq('id', topico_id)
      .single();

    if (fetchError || !topico) {
      return new Response(
        JSON.stringify({ error: 'Tópico não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const text = extractTextFromConteudo(topico.conteudo_gerado);
    if (!text || text.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Conteúdo insuficiente para narração', titulo: topico.titulo }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const truncatedText = text.substring(0, 5000);
    console.log(`[narrar-aula] Gemini Flash TTS Sulafat: ${topico.titulo} (${truncatedText.length} chars)`);

    // Gerar áudio PCM via Gemini 2.5 Flash TTS com chunks de ~1 min
    const pcmData = await gerarAudioComChunking(truncatedText);

    // Converter para WAV
    const wavData = pcmToWav(pcmData);
    const duracaoSegundos = Math.round(pcmData.length / 48000);
    console.log(`[narrar-aula] ✅ Áudio gerado: ${wavData.length} bytes, ~${duracaoSegundos}s`);

    // Upload como WAV
    const fileName = `aula_${topico_id}_${Date.now()}.wav`;
    const storagePath = `narracoes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('aulas-narracoes')
      .upload(storagePath, wavData, {
        contentType: 'audio/wav',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('aulas-narracoes')
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from('categorias_topicos')
      .update({ url_narracao: publicUrl })
      .eq('id', topico_id);

    if (updateError) {
      console.error('Erro ao atualizar url_narracao:', updateError);
    }

    console.log(`✅ Narração Gemini Flash TTS gerada: ${topico.titulo} -> ${publicUrl}`);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, titulo: topico.titulo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro narrar-aula:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar narração' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});