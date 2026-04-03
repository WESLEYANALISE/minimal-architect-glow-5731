import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
].filter(Boolean) as string[];

// Abreviações jurídicas para expandir
const ABREVIACOES_JURIDICAS: Record<string, string> = {
  "Art.": "Artigo",
  "art.": "artigo",
  "Arts.": "Artigos",
  "arts.": "artigos",
  "CF": "Constituição Federal",
  "CF/88": "Constituição Federal de 1988",
  "CC": "Código Civil",
  "CC/02": "Código Civil de 2002",
  "CP": "Código Penal",
  "CPC": "Código de Processo Civil",
  "CPP": "Código de Processo Penal",
  "CLT": "Consolidação das Leis do Trabalho",
  "CDC": "Código de Defesa do Consumidor",
  "CTN": "Código Tributário Nacional",
  "ECA": "Estatuto da Criança e do Adolescente",
  "STF": "Supremo Tribunal Federal",
  "STJ": "Superior Tribunal de Justiça",
  "TST": "Tribunal Superior do Trabalho",
  "TSE": "Tribunal Superior Eleitoral",
  "TJ": "Tribunal de Justiça",
  "TRF": "Tribunal Regional Federal",
  "TRT": "Tribunal Regional do Trabalho",
  "TRE": "Tribunal Regional Eleitoral",
  "RE": "Recurso Extraordinário",
  "REsp": "Recurso Especial",
  "RO": "Recurso Ordinário",
  "HC": "Habeas Corpus",
  "MS": "Mandado de Segurança",
  "ADI": "Ação Direta de Inconstitucionalidade",
  "ADC": "Ação Declaratória de Constitucionalidade",
  "ADPF": "Arguição de Descumprimento de Preceito Fundamental",
  "Min.": "Ministro",
  "Rel.": "Relator",
  "Des.": "Desembargador",
  "Dr.": "Doutor",
  "Dra.": "Doutora",
  "nº": "número",
  "n.": "número",
  "§": "parágrafo",
  "§§": "parágrafos",
  "inc.": "inciso",
  "al.": "alínea",
  "p.": "página",
  "pp.": "páginas",
  "ss.": "e seguintes",
  "v.g.": "por exemplo",
  "i.e.": "isto é",
  "e.g.": "por exemplo",
  "op. cit.": "obra citada",
  "loc. cit.": "lugar citado",
  "et al.": "e outros",
  "apud": "citado por",
  "idem": "o mesmo",
  "ibidem": "no mesmo lugar",
  "sic": "assim mesmo",
  "DJ": "Diário da Justiça",
  "DJe": "Diário da Justiça eletrônico",
  "DOU": "Diário Oficial da União",
  "LINDB": "Lei de Introdução às Normas do Direito Brasileiro",
  "LC": "Lei Complementar",
  "EC": "Emenda Constitucional",
  "MP": "Medida Provisória",
  "LF": "Lei Federal",
  "LE": "Lei Estadual",
  "LM": "Lei Municipal",
  "c/c": "combinado com",
  "s/n": "sem número",
  "OAB": "Ordem dos Advogados do Brasil",
  "CRFB": "Constituição da República Federativa do Brasil",
};

// Mapas para conversão de números romanos em ordinais (para incisos)
const ROMANOS_PARA_ORDINAIS: Record<string, string> = {
  "I": "primeiro", "II": "segundo", "III": "terceiro", "IV": "quarto", "V": "quinto",
  "VI": "sexto", "VII": "sétimo", "VIII": "oitavo", "IX": "nono", "X": "décimo",
  "XI": "décimo primeiro", "XII": "décimo segundo", "XIII": "décimo terceiro", 
  "XIV": "décimo quarto", "XV": "décimo quinto", "XVI": "décimo sexto", 
  "XVII": "décimo sétimo", "XVIII": "décimo oitavo", "XIX": "décimo nono", 
  "XX": "vigésimo", "XXI": "vigésimo primeiro", "XXII": "vigésimo segundo",
  "XXIII": "vigésimo terceiro", "XXIV": "vigésimo quarto", "XXV": "vigésimo quinto",
  "XXVI": "vigésimo sexto", "XXVII": "vigésimo sétimo", "XXVIII": "vigésimo oitavo",
  "XXIX": "vigésimo nono", "XXX": "trigésimo", "XL": "quadragésimo", "L": "quinquagésimo"
};

// Mapas para números por extenso
const NUMEROS_ORDINAIS: Record<string, string> = {
  "1": "primeiro", "2": "segundo", "3": "terceiro", "4": "quarto", "5": "quinto",
  "6": "sexto", "7": "sétimo", "8": "oitavo", "9": "nono", "10": "décimo",
  "11": "décimo primeiro", "12": "décimo segundo", "13": "décimo terceiro",
  "14": "décimo quarto", "15": "décimo quinto", "16": "décimo sexto",
  "17": "décimo sétimo", "18": "décimo oitavo", "19": "décimo nono", "20": "vigésimo"
};

// Normaliza texto para TTS expandindo abreviações e termos jurídicos
function normalizarTextoParaTTS(texto: string): string {
  let resultado = texto;
  
  // Remover markdown completo
  resultado = resultado
    .replace(/#{1,6}\s*/g, "") // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic
    .replace(/_([^_]+)_/g, "$1") // Remove underline
    .replace(/`{3}[\s\S]*?`{3}/g, "") // Remove code blocks
    .replace(/`([^`]+)`/g, "$1") // Remove inline code
    .replace(/>\s?/g, "") // Remove blockquotes
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // Remove images
    .replace(/[-*+]\s/g, "") // Remove list markers
    .replace(/\d+\.\s/g, "") // Remove numbered list markers
    .replace(/^\s*[-*_]{3,}\s*$/gm, "") // Remove horizontal rules
    .replace(/\\\n/g, " ") // Remove line continuation
    .replace(/\\([^\\])/g, "$1") // Remove escape backslashes
    .replace(/^\\$/gm, "") // Remove standalone backslashes
    .replace(/\n{3,}/g, "\n\n") // Normalize line breaks
    .replace(/⚠️|💡|✦|🔗|📚|⚖️|🎯|📖|📌|✅|❌|⭐|🔴|🟡|🟢|🔵|⚪|💬|📝|🏛️|⚔️|🔑|🎓|📋/g, "") // Remove emojis
    .replace(/---+/g, "") // Remove separator lines
    .replace(/\|[^|]+\|/g, "") // Remove table content
    .replace(/^\s*\|.*$/gm, ""); // Remove table rows
  
  // ============ CONVERSÃO DE TERMOS JURÍDICOS ============
  
  // Parágrafos: §1º, §2º, § único, etc.
  resultado = resultado.replace(/§\s*único/gi, "parágrafo único");
  resultado = resultado.replace(/§§\s*(\d+)[º°]?\s*e\s*(\d+)[º°]?/g, (_, n1, n2) => {
    const ord1 = NUMEROS_ORDINAIS[n1] || n1;
    const ord2 = NUMEROS_ORDINAIS[n2] || n2;
    return `parágrafos ${ord1} e ${ord2}`;
  });
  resultado = resultado.replace(/§\s*(\d+)[º°]?/g, (_, num) => {
    const ordinal = NUMEROS_ORDINAIS[num] || num;
    return `parágrafo ${ordinal}`;
  });
  
  // Incisos com números romanos: I -, II -, etc.
  resultado = resultado.replace(/\b(I{1,3}|IV|V|VI{0,3}|IX|X{1,3}|XI{0,3}|XIV|XV|XVI{0,3}|XIX|XX{0,3}|XXI{0,3}|XXIV|XXV|XXVI{0,3}|XXIX|XXX|XL|L)\s*[-–—]/g, (match, romano) => {
    const ordinal = ROMANOS_PARA_ORDINAIS[romano] || romano;
    return `inciso ${ordinal}, `;
  });
  
  // Alíneas: a), b), c), etc.
  resultado = resultado.replace(/\b([a-z])\)\s*/g, (_, letra) => `alínea ${letra}, `);
  
  // Remover símbolos de grau/ordinal isolados
  resultado = resultado.replace(/[º°]/g, "");
  
  // ============ FIM CONVERSÃO DE TERMOS JURÍDICOS ============
  
  // Expandir abreviações jurídicas (ordenar por tamanho decrescente para evitar conflitos)
  const abreviacoesOrdenadas = Object.entries(ABREVIACOES_JURIDICAS)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [abrev, expansao] of abreviacoesOrdenadas) {
    // Escapar caracteres especiais para regex
    const abrevEscapada = abrev.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    resultado = resultado.replace(new RegExp(`\\b${abrevEscapada}\\b`, "g"), expansao);
  }
  
  // Limpar espaços extras e linhas em branco
  resultado = resultado
    .replace(/\s+/g, " ")
    .replace(/\s*\.\s*/g, ". ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
  
  return resultado;
}

// Divide texto em chunks respeitando limite de bytes e sentenças
function dividirTextoEmChunks(texto: string, limiteBytesMax: number = 4500): string[] {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  
  // Dividir por sentenças (pontos finais)
  const sentencas = texto.split(/(?<=[.!?])\s+/);
  let chunkAtual = "";
  
  for (const sentenca of sentencas) {
    const bytesAtuais = encoder.encode(chunkAtual).length;
    const bytesSentenca = encoder.encode(sentenca).length;
    
    if (bytesAtuais + bytesSentenca + 1 <= limiteBytesMax) {
      chunkAtual = chunkAtual ? `${chunkAtual} ${sentenca}` : sentenca;
    } else {
      if (chunkAtual) {
        chunks.push(chunkAtual.trim());
      }
      
      // Se a sentença sozinha é maior que o limite, dividir por palavras
      if (bytesSentenca > limiteBytesMax) {
        const palavras = sentenca.split(/\s+/);
        let subChunk = "";
        
        for (const palavra of palavras) {
          const bytesSubChunk = encoder.encode(subChunk).length;
          const bytesPalavra = encoder.encode(palavra).length;
          
          if (bytesSubChunk + bytesPalavra + 1 <= limiteBytesMax) {
            subChunk = subChunk ? `${subChunk} ${palavra}` : palavra;
          } else {
            if (subChunk) {
              chunks.push(subChunk.trim());
            }
            subChunk = palavra;
          }
        }
        
        chunkAtual = subChunk;
      } else {
        chunkAtual = sentenca;
      }
    }
  }
  
  if (chunkAtual.trim()) {
    chunks.push(chunkAtual.trim());
  }
  
  return chunks;
}

// Gera áudio para um chunk usando Cloud Text-to-Speech (Chirp 3 HD)
async function gerarAudioChunkChirp3HD(texto: string, tentativaInicial: number = 0): Promise<Uint8Array> {
  for (let attempt = tentativaInicial; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const keyIndex = attempt % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];

    try {
      console.log(`[TTS Chirp3] Chunk tentativa ${attempt + 1} com key ${keyIndex + 1}...`);
      
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text: texto },
            voice: {
              languageCode: "pt-BR",
              name: "pt-BR-Chirp3-HD-Aoede"
            },
            audioConfig: {
              audioEncoding: "LINEAR16",
              sampleRateHertz: 24000,
              speakingRate: 1.0,
              pitch: 0
            }
          }),
        }
      );

      if (response.status === 429) {
        console.log(`[TTS Chirp3] Rate limit na key ${keyIndex + 1}, aguardando...`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TTS Chirp3] Erro ${response.status}:`, errorText);
        
        if (response.status === 403 || response.status === 400) {
          console.log(`[TTS Chirp3] Key ${keyIndex + 1} com problema, tentando próxima...`);
          continue;
        }
        throw new Error(`Erro TTS: ${response.status}`);
      }

      const data = await response.json();
      const audioContent = data.audioContent;

      if (!audioContent) {
        throw new Error("Resposta sem dados de áudio");
      }

      // Decodificar base64 para bytes
      const binaryString = atob(audioContent);
      const audioBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioBytes[i] = binaryString.charCodeAt(i);
      }

      console.log(`[TTS Chirp3] Chunk gerado: ${audioBytes.length} bytes`);
      return audioBytes;
      
    } catch (error) {
      console.error(`[TTS Chirp3] Erro na tentativa ${attempt + 1}:`, error);
      if (attempt >= GEMINI_KEYS.length * 2 - 1) throw error;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  throw new Error("Todas as tentativas de TTS falharam para o chunk");
}

// Extrai dados PCM de um arquivo WAV (remove header de 44 bytes)
function extrairPCMdeWav(wavBytes: Uint8Array): Uint8Array {
  // Verificar se é WAV válido
  if (wavBytes[0] === 0x52 && wavBytes[1] === 0x49 && 
      wavBytes[2] === 0x46 && wavBytes[3] === 0x46) {
    // Pular header de 44 bytes
    return wavBytes.slice(44);
  }
  // Se não for WAV, assumir que já é PCM
  return wavBytes;
}

// Gera áudio completo dividindo em chunks se necessário
async function gerarAudioChirp3HD(texto: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const bytesTotal = encoder.encode(texto).length;
  
  console.log(`[TTS Chirp3] Texto total: ${texto.length} chars, ${bytesTotal} bytes`);
  
  // Se o texto cabe no limite, gerar diretamente
  if (bytesTotal <= 4500) {
    return await gerarAudioChunkChirp3HD(texto);
  }
  
  // Dividir em chunks
  const chunks = dividirTextoEmChunks(texto);
  console.log(`[TTS Chirp3] Dividido em ${chunks.length} chunks`);
  
  const audioPartes: Uint8Array[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[TTS Chirp3] Processando chunk ${i + 1}/${chunks.length} (${encoder.encode(chunks[i]).length} bytes)`);
    
    const audioChunk = await gerarAudioChunkChirp3HD(chunks[i]);
    
    // Extrair apenas o PCM (sem header WAV) para concatenar
    const pcmData = extrairPCMdeWav(audioChunk);
    audioPartes.push(pcmData);
    
    // Pequena pausa entre chunks para evitar rate limiting
    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  
  // Concatenar todos os PCMs
  const tamanhoTotal = audioPartes.reduce((acc, arr) => acc + arr.length, 0);
  const pcmConcatenado = new Uint8Array(tamanhoTotal);
  
  let offset = 0;
  for (const parte of audioPartes) {
    pcmConcatenado.set(parte, offset);
    offset += parte.length;
  }
  
  console.log(`[TTS Chirp3] PCM concatenado: ${pcmConcatenado.length} bytes`);
  
  return pcmConcatenado;
}

// Cria header WAV para dados PCM
function criarHeaderWav(pcmData: Uint8Array, sampleRate: number = 24000): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF header
  view.setUint8(0, 0x52); // R
  view.setUint8(1, 0x49); // I
  view.setUint8(2, 0x46); // F
  view.setUint8(3, 0x46); // F
  view.setUint32(4, fileSize, true);
  view.setUint8(8, 0x57);  // W
  view.setUint8(9, 0x41);  // A
  view.setUint8(10, 0x56); // V
  view.setUint8(11, 0x45); // E

  // fmt subchunk
  view.setUint8(12, 0x66); // f
  view.setUint8(13, 0x6D); // m
  view.setUint8(14, 0x74); // t
  view.setUint8(15, 0x20); // (space)
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  view.setUint8(36, 0x64); // d
  view.setUint8(37, 0x61); // a
  view.setUint8(38, 0x74); // t
  view.setUint8(39, 0x61); // a
  view.setUint32(40, dataSize, true);

  // Combinar header + PCM data
  const wavFile = new Uint8Array(44 + pcmData.length);
  wavFile.set(new Uint8Array(header), 0);
  wavFile.set(pcmData, 44);

  return wavFile;
}

// Upload para Supabase Storage
async function uploadParaSupabase(
  supabase: any,
  audioBytes: Uint8Array,
  bucket: string,
  path: string
): Promise<string> {
  console.log(`[Upload] Processando ${audioBytes.length} bytes de áudio...`);
  
  // Verificar se já tem header WAV
  const hasWavHeader = audioBytes[0] === 0x52 && audioBytes[1] === 0x49 && 
                       audioBytes[2] === 0x46 && audioBytes[3] === 0x46;
  
  let wavBytes: Uint8Array;
  if (hasWavHeader) {
    console.log("[Upload] Áudio já possui header WAV");
    wavBytes = audioBytes;
  } else {
    console.log("[Upload] Adicionando header WAV...");
    wavBytes = criarHeaderWav(audioBytes);
  }
  
  console.log(`[Upload] WAV final: ${wavBytes.length} bytes`);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, wavBytes, {
      contentType: "audio/wav",
      upsert: true,
    });

  if (uploadError) {
    console.error("[Upload] Erro:", uploadError);
    throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

// Função principal de geração (executada em background)
async function processarNarracaoBackground(topico_id: number, conteudo: string, _titulo: string) {
  console.log(`[Narração BG] Iniciando processamento para tópico ${topico_id}`);
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. NÃO incluir título na narração (já está no header visual)
    // O título é passado mas não usado para evitar duplicação
    
    // 2. Normalizar texto (expandir abreviações, limpar markdown)
    console.log("[Narração BG] Normalizando texto...");
    const textoNormalizado = normalizarTextoParaTTS(conteudo);
    
    console.log(`[Narração BG] Texto normalizado: ${textoNormalizado.length} chars`);

    // 3. Gerar áudio via Cloud TTS Chirp 3 HD (com chunking automático)
    console.log("[Narração BG] Gerando áudio com Chirp 3 HD...");
    const audioBytes = await gerarAudioChirp3HD(textoNormalizado);

    // 4. Upload para Supabase Storage
    const timestamp = Date.now();
    const storagePath = `faculdade/${topico_id}_${timestamp}.wav`;
    
    console.log("[Narração BG] Fazendo upload...");
    const audioUrl = await uploadParaSupabase(supabase, audioBytes, "audios", storagePath);
    
    console.log("[Narração BG] URL gerada:", audioUrl);

    // 5. Atualizar tópico com URL da narração
    const { error: updateError } = await supabase
      .from("faculdade_topicos")
      .update({ url_narracao: audioUrl })
      .eq("id", topico_id);

    if (updateError) {
      console.error("[Narração BG] Erro ao atualizar tópico:", updateError);
      throw new Error(`Erro ao salvar URL: ${updateError.message}`);
    }

    console.log(`[Narração BG] ✅ Concluída com sucesso para tópico ${topico_id}`);
    
  } catch (error: unknown) {
    console.error(`[Narração BG] ❌ Erro no tópico ${topico_id}:`, error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id, conteudo, titulo } = await req.json();

    if (!topico_id || !conteudo) {
      return new Response(
        JSON.stringify({ error: "topico_id e conteudo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Narração] Recebida requisição para tópico ${topico_id}: ${titulo}`);

    // Processa em background - não bloqueia a resposta
    // @ts-ignore - EdgeRuntime disponível no ambiente Supabase
    EdgeRuntime.waitUntil(processarNarracaoBackground(topico_id, conteudo, titulo));

    // Retorna imediatamente para o cliente
    return new Response(
      JSON.stringify({
        success: true,
        message: "Geração de narração iniciada em segundo plano",
        topico_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Narração] Erro:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
