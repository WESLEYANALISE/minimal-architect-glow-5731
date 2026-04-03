import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

// ==================== TEXT HELPERS ====================

function normalizeTextForTTS(text: string): string {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
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
    // "X" entre palavras = "versus" (ex: "Erro de Proibição X Erro do Tipo")
    .replace(/\s+[Xx]\s+/g, ' versus ')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .replace(/\bArt\./gi, 'Artigo')
    .replace(/\barts\./gi, 'Artigos')
    .replace(/\bcf\./gi, 'conforme')
    .replace(/\bp\.ex\./gi, 'por exemplo')
    .replace(/\bCF\/88/gi, 'Constituição Federal de 1988')
    .replace(/\bCC\/02/gi, 'Código Civil de 2002')
    .replace(/\bCPC/gi, 'Código de Processo Civil')
    .replace(/\bCPP/gi, 'Código de Processo Penal')
    .replace(/\bCP\b/gi, 'Código Penal')
    .replace(/\bSTF\b/g, 'Supremo Tribunal Federal')
    .replace(/\bSTJ\b/g, 'Superior Tribunal de Justiça')
    .replace(/\bTST\b/g, 'Tribunal Superior do Trabalho')
    .replace(/\bOAB\b/g, 'Ordem dos Advogados do Brasil')
    .trim();
}

function extractSlideText(slide: any): string {
  const parts: string[] = [];
  if (slide.titulo) parts.push(slide.titulo);
  if (slide.conteudo) parts.push(slide.conteudo);
  if (slide.pergunta) parts.push(slide.pergunta);
  if (Array.isArray(slide.pontos)) parts.push(...slide.pontos.filter((p: any) => typeof p === 'string'));
  if (Array.isArray(slide.termos)) {
    for (const t of slide.termos) {
      if (t?.termo) parts.push(t.termo);
      if (t?.definicao) parts.push(t.definicao);
    }
  }
  if (Array.isArray(slide.etapas)) {
    for (const e of slide.etapas) {
      if (e?.titulo) parts.push(e.titulo);
      if (e?.descricao) parts.push(e.descricao);
    }
  }
  if (slide.tabela?.cabecalhos) parts.push(slide.tabela.cabecalhos.join(', '));
  if (slide.tabela?.linhas) {
    for (const row of slide.tabela.linhas) {
      parts.push(row.join(', '));
    }
  }
  if (Array.isArray(slide.collapsibleItems)) {
    for (const item of slide.collapsibleItems) {
      if (item?.titulo) parts.push(item.titulo);
      if (item?.conteudo) parts.push(item.conteudo);
    }
  }
  return normalizeTextForTTS(parts.join('. '));
}

// ==================== CHUNKING (~1 minuto por chunk = ~1500 chars) ====================

function splitTextIntoChunks(text: string, maxChars = 1500): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) { chunks.push(remaining); break; }
    let splitAt = -1;
    // Tentar cortar em ponto final
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
  // Verifica se tem header RIFF/WAV (44 bytes padrão)
  if (data.length > 44 &&
      data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 && // "RIFF"
      data[8] === 0x57 && data[9] === 0x41 && data[10] === 0x56 && data[11] === 0x45) { // "WAVE"
    // Encontrar o início do chunk "data"
    for (let i = 12; i < Math.min(data.length - 8, 200); i++) {
      if (data[i] === 0x64 && data[i+1] === 0x61 && data[i+2] === 0x74 && data[i+3] === 0x61) { // "data"
        const dataStart = i + 8; // skip "data" + 4 bytes de tamanho
        console.log(`[narrar-slide] Header WAV detectado, removendo ${dataStart} bytes de header`);
        return data.slice(dataStart);
      }
    }
    // Fallback: header padrão de 44 bytes
    console.log(`[narrar-slide] Header WAV padrão, removendo 44 bytes`);
    return data.slice(44);
  }
  return data;
}

const MODEL_FLASH = 'gemini-2.5-flash-preview-tts';
const MODEL_PRO = 'gemini-2.5-pro-preview-tts';
const MODEL_FALLBACK = 'gemini-2.5-flash-lite-preview-tts';

// Threshold: ~1750 chars ≈ 1min10s de áudio
const CHAR_THRESHOLD_PRO = 1750;

function escolherModelo(textoTotal: string): string {
  if (textoTotal.length > CHAR_THRESHOLD_PRO) {
    console.log(`[narrar-slide] 📊 Texto com ${textoTotal.length} chars (>${CHAR_THRESHOLD_PRO}) → usando Pro TTS`);
    return MODEL_PRO;
  }
  console.log(`[narrar-slide] 📊 Texto com ${textoTotal.length} chars (≤${CHAR_THRESHOLD_PRO}) → usando Flash TTS`);
  return MODEL_FLASH;
}

async function gerarAudioTTSSingle(texto: string, modelo: string): Promise<Uint8Array> {
  let lastError = '';
  let allQuotaExhausted = true;

  // Tentar o modelo escolhido primeiro, depois fallback
  const modelos = [modelo, ...(modelo !== MODEL_FALLBACK ? [MODEL_FALLBACK] : [])];

  for (const model of modelos) {
    for (const chave of API_KEYS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${chave}`;
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
          console.log(`Erro Gemini TTS ${model} (${response.status}):`, errText.substring(0, 300));
          if (response.status === 429) {
            continue;
          }
          lastError = errText;
          allQuotaExhausted = false;
          continue;
        }

        allQuotaExhausted = false;
        const data = await response.json();
        const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        const audioBase64 = inlineData?.data;
        const mimeType = inlineData?.mimeType || 'audio/pcm';
        if (!audioBase64) { lastError = 'Sem dados de áudio na resposta'; continue; }

        console.log(`[narrar-slide] ✅ ${model} retornou mimeType: ${mimeType}, base64 length: ${audioBase64.length}`);

        const binaryString = atob(audioBase64);
        const rawBytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          rawBytes[j] = binaryString.charCodeAt(j);
        }

        const pcm = stripWavHeader(rawBytes);
        return pcm;
      } catch (error) {
        console.error(`Erro com Gemini TTS ${model}:`, error);
        allQuotaExhausted = false;
        continue;
      }
    }
  }

  if (allQuotaExhausted) {
    throw new QuotaExhaustedError('Quota diária de TTS esgotada em todas as chaves. Tente novamente em algumas horas.');
  }
  throw new Error('Todas as chaves falharam para TTS: ' + lastError);
}

class QuotaExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExhaustedError';
  }
}

async function gerarAudioComChunking(texto: string): Promise<Uint8Array> {
  // Escolher modelo baseado no tamanho total do texto
  const modelo = escolherModelo(texto);

  const chunks = splitTextIntoChunks(texto, 1500);
  console.log(`[narrar-slide] Texto dividido em ${chunks.length} chunk(s) (~1min cada) | Modelo: ${modelo}`);

  const pcmBuffers: Uint8Array[] = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[narrar-slide] 🎙️ Chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)...`);
    const pcm = await gerarAudioTTSSingle(chunks[i], modelo);
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
    const { topico_id, secao_index, slide_index, texto_slide, tabela_alvo, campo_json } = await req.json();

    if (topico_id === undefined || secao_index === undefined || slide_index === undefined) {
      return new Response(
        JSON.stringify({ error: 'topico_id, secao_index e slide_index são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tabela = tabela_alvo || 'categorias_topicos';
    const campo = campo_json || 'conteudo_gerado';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch current JSON to check if narracaoUrl already cached
    const { data: topico, error: fetchError } = await supabase
      .from(tabela)
      .select(`id, ${campo}`)
      .eq('id', topico_id)
      .single();

    if (fetchError || !topico) {
      return new Response(
        JSON.stringify({ error: 'Tópico não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jsonData = topico[campo];
    
    let slide: any = null;
    if (jsonData?.secoes?.[secao_index]?.slides?.[slide_index]) {
      slide = jsonData.secoes[secao_index].slides[slide_index];
    }

    // If already has narracaoUrl cached, return it
    if (slide?.narracaoUrl) {
      console.log(`[narrar-slide] Cache hit: s${secao_index}_p${slide_index}`);
      return new Response(
        JSON.stringify({ narracaoUrl: slide.narracaoUrl, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text
    let text = texto_slide || '';
    if (!text && slide) {
      text = extractSlideText(slide);
    }

    if (!text || text.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Texto insuficiente para narração', narracaoUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limitar texto total
    const truncatedText = text.substring(0, 4500);
    console.log(`[narrar-slide] Generating TTS Sulafat: s${secao_index}_p${slide_index} (${truncatedText.length} chars, modelo auto: ${truncatedText.length > CHAR_THRESHOLD_PRO ? 'Pro' : 'Flash'})`);

    // Gerar áudio PCM via Gemini 2.5 Flash TTS com chunks de ~1 min
    const pcmData = await gerarAudioComChunking(truncatedText);

    // Converter para WAV
    const wavData = pcmToWav(pcmData);
    const duracaoSegundos = Math.round(pcmData.length / 48000);
    console.log(`[narrar-slide] ✅ Áudio gerado: ${wavData.length} bytes, ~${duracaoSegundos}s`);

    // Upload como WAV
    const fileName = `slide_${topico_id}_s${secao_index}_p${slide_index}.wav`;
    const storagePath = `slides/${topico_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('aulas-narracoes')
      .upload(storagePath, wavData, { contentType: 'audio/wav', upsert: true });

    if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

    const { data: publicUrlData } = supabase.storage
      .from('aulas-narracoes')
      .getPublicUrl(storagePath);

    const narracaoUrl = publicUrlData.publicUrl;

    // Update JSON to cache the URL in the slide
    if (jsonData?.secoes?.[secao_index]?.slides?.[slide_index]) {
      jsonData.secoes[secao_index].slides[slide_index].narracaoUrl = narracaoUrl;
      
      const { error: updateError } = await supabase
        .from(tabela)
        .update({ [campo]: jsonData })
        .eq('id', topico_id);

      if (updateError) {
        console.error('[narrar-slide] Erro ao atualizar JSON:', updateError);
      }
    }

    console.log(`✅ [narrar-slide] Gemini TTS s${secao_index}_p${slide_index} -> ${narracaoUrl}`);

    return new Response(
      JSON.stringify({ narracaoUrl, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[narrar-slide] Erro:', error);
    const isQuota = error instanceof QuotaExhaustedError;
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro ao gerar narração' }),
      { status: isQuota ? 429 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});