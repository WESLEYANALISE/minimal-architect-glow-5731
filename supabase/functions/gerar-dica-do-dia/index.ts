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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BIBLIOTECAS = [
  { nome: 'classicos', tabela: 'BIBLIOTECA-CLASSICOS', campoTitulo: 'livro', campoCapa: 'imagem', campoAutor: 'autor', campoSobre: 'sobre', campoArea: 'area' },
  { nome: 'fora-da-toga', tabela: 'BIBLIOTECA-FORA-DA-TOGA', campoTitulo: 'livro', campoCapa: 'capa-livro', campoAutor: 'autor', campoSobre: 'sobre', campoArea: 'area' },
  { nome: 'oratoria', tabela: 'BIBLIOTECA-ORATORIA', campoTitulo: 'livro', campoCapa: 'imagem', campoAutor: 'autor', campoSobre: 'sobre', campoArea: 'area' },
  { nome: 'lideranca', tabela: 'BIBLIOTECA-LIDERANÇA', campoTitulo: 'livro', campoCapa: 'imagem', campoAutor: 'autor', campoSobre: 'sobre', campoArea: 'area' },
];

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

async function gerarAudioTTSFinal(texto: string): Promise<Uint8Array> {
  const chunks = dividirTextoEmChunks(texto, 2000);
  console.log(`🎙️ Gerando áudio TTS em ${chunks.length} chunk(s) (${texto.length} chars total)...`);
  
  const pcmBuffers: Uint8Array[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  📦 Chunk ${i + 1}/${chunks.length}: ${chunks[i].length} chars`);
    const base64 = await gerarAudioTTSSingle(chunks[i]);
    const pcm = base64ToUint8Array(base64);
    pcmBuffers.push(pcm);
    console.log(`  ✅ Chunk ${i + 1} PCM: ${pcm.length} bytes`);
  }
  
  const totalLength = pcmBuffers.reduce((sum, buf) => sum + buf.length, 0);
  const concatenated = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of pcmBuffers) {
    concatenated.set(buf, offset);
    offset += buf.length;
  }
  
  console.log(`✅ PCM total concatenado: ${concatenated.length} bytes`);
  return concatenated;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function criarWAVEficiente(pcmData: Uint8Array, sampleRate: number): Uint8Array {
  const headerSize = 44;
  const dataSize = pcmData.length;
  const buffer = new Uint8Array(headerSize + dataSize);
  const view = new DataView(buffer.buffer);
  
  buffer[0]=82;buffer[1]=73;buffer[2]=70;buffer[3]=70;
  view.setUint32(4, 36 + dataSize, true);
  buffer[8]=87;buffer[9]=65;buffer[10]=86;buffer[11]=69;
  buffer[12]=102;buffer[13]=109;buffer[14]=116;buffer[15]=32;
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  buffer[36]=100;buffer[37]=97;buffer[38]=116;buffer[39]=97;
  view.setUint32(40, dataSize, true);
  
  buffer.set(pcmData, headerSize);
  return buffer;
}

async function gerarAudioTTSSingle(text: string): Promise<string> {
  let lastError: Error | null = null;
  
  for (const apiKey of API_KEYS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
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

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`TTS error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) throw new Error('Nenhum áudio na resposta TTS');
      
      return audioData;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error('Erro TTS:', lastError.message);
      continue;
    }
  }
  
  throw lastError || new Error('Todas as chaves falharam no TTS');
}

// ==================== BUSCAR CONTEUDO PDF ====================

async function buscarConteudoLivro(supabase: any, titulo: string): Promise<string> {
  try {
    console.log(`📄 Buscando conteúdo extraído para: "${titulo}"`);
    const { data, error } = await supabase
      .from('BIBLIOTECA-LEITURA-DINAMICA')
      .select('"Conteúdo", "Pagina"')
      .eq('Titulo da Obra', titulo)
      .order('Pagina', { ascending: true });

    if (error || !data || data.length === 0) {
      console.log(`⚠️ Nenhum conteúdo extraído encontrado para "${titulo}"`);
      return '';
    }

    let conteudo = data.map((p: any) => p['Conteúdo'] || '').join('\n\n');
    
    if (conteudo.length > 15000) {
      console.log(`✂️ Conteúdo truncado: ${conteudo.length} -> ~15000 chars`);
      conteudo = conteudo.substring(0, 15000);
      const ultimoPonto = Math.max(conteudo.lastIndexOf('.'), conteudo.lastIndexOf('!'), conteudo.lastIndexOf('?'));
      if (ultimoPonto > 12000) conteudo = conteudo.substring(0, ultimoPonto + 1);
    }

    console.log(`✅ Conteúdo extraído: ${data.length} páginas, ${conteudo.length} chars`);
    return conteudo;
  } catch (err) {
    console.error('Erro ao buscar conteúdo do livro:', err);
    return '';
  }
}

// ==================== MAIN ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    let dataHoje: string;
    let skipAudio = false;
    let regenerarAudio = false;
    let forcarRegeneracao = false;
    let livroIdEspecifico: number | null = null;
    let bibliotecaEspecifica: string | null = null;
    let body: any = null;
    try {
      body = await req.json();
      const dataParam = body?.data_especifica || body?.data;
      if (dataParam) {
        dataHoje = dataParam;
      } else {
        throw new Error('no data');
      }
      if (body?.skip_audio) skipAudio = true;
      if (body?.regenerar_audio) regenerarAudio = true;
      if (body?.forcar_regeneracao) forcarRegeneracao = true;
      if (body?.livro_id_especifico) livroIdEspecifico = body.livro_id_especifico;
      if (body?.biblioteca_especifica) bibliotecaEspecifica = body.biblioteca_especifica;
    } catch {
      const now = new Date();
      const brasiliaOffset = -3 * 60;
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
      dataHoje = brasiliaDate.toISOString().split('T')[0];
    }

    console.log(`🗓️ Gerando dica do dia para: ${dataHoje}`);

    // 1. Verificar se já existe dica para hoje
    const { data: existente } = await supabase
      .from('dicas_do_dia')
      .select('*')
      .eq('data', dataHoje)
      .maybeSingle();

    // Se pediu para regenerar áudio de uma dica existente
    if (existente && regenerarAudio) {
      console.log(`🔄 Regenerando áudio para dica existente ID: ${existente.id}`);
      const scriptAudio = gerarScriptAudio(
        existente.livro_titulo, existente.livro_autor || '', existente.livro_sobre || '',
        existente.area_livro || '', existente.biblioteca,
        { porque_ler: existente.porque_ler || '', frase_dia: existente.frase_dia || '', dica_estudo: existente.dica_estudo || '' }
      );
      console.log(`📝 Script total: ${scriptAudio.length} caracteres`);
      const pcmData = await gerarAudioTTSFinal(scriptAudio);
      const wavBuffer = criarWAVEficiente(pcmData, 24000);
      const filePath = `${dataHoje}_regen_${Date.now()}.wav`;
      const { error: uploadError } = await supabase.storage
        .from('dicas-audio')
        .upload(filePath, wavBuffer, { contentType: 'audio/wav', upsert: true });
      if (uploadError) throw new Error(`Erro upload áudio: ${uploadError.message}`);
      const { data: publicUrl } = supabase.storage.from('dicas-audio').getPublicUrl(filePath);
      const duracaoSegundos = Math.round(pcmData.length / 48000);
      await supabase.from('dicas_do_dia').update({
        audio_url: publicUrl.publicUrl,
        audio_duracao_segundos: duracaoSegundos,
      }).eq('id', existente.id);
      console.log(`✅ Áudio regenerado! Duração: ${duracaoSegundos}s`);
      return new Response(
        JSON.stringify({ success: true, id: existente.id, regenerado: true, duracao: duracaoSegundos }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existente) {
      if (existente.status === 'pronto' && !forcarRegeneracao) {
        return new Response(JSON.stringify({ message: 'Dica já gerada para hoje', id: existente.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      await supabase.from('dicas_do_dia').delete().eq('id', existente.id);
      console.log(`🗑️ Dica existente ID ${existente.id} deletada para regeneração`);
    }

    // 2. Selecionar livro (específico ou por rotação)
    let bib: typeof BIBLIOTECAS[0];
    let livro: any;

    if (livroIdEspecifico && bibliotecaEspecifica) {
      bib = BIBLIOTECAS.find(b => b.nome === bibliotecaEspecifica)!;
      if (!bib) throw new Error(`Biblioteca "${bibliotecaEspecifica}" não encontrada`);
      
      const { data: livroEsp, error: livroError } = await supabase
        .from(bib.tabela)
        .select(`id, ${bib.campoTitulo}, ${bib.campoAutor}, ${bib.campoCapa}, ${bib.campoSobre}, ${bib.campoArea}`)
        .eq('id', livroIdEspecifico)
        .single();

      if (livroError || !livroEsp) throw new Error(`Livro ID ${livroIdEspecifico} não encontrado: ${livroError?.message}`);
      livro = livroEsp;
      console.log(`📚 Livro ESPECÍFICO selecionado da biblioteca: ${bib.nome}`);
    } else {
      const { data: ultimaDica } = await supabase
        .from('dicas_do_dia')
        .select('biblioteca, livro_id')
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle();

      let bibliotecaIdx = 0;
      if (ultimaDica) {
        const lastIdx = BIBLIOTECAS.findIndex(b => b.nome === ultimaDica.biblioteca);
        bibliotecaIdx = (lastIdx + 1) % BIBLIOTECAS.length;
      }

      bib = BIBLIOTECAS[bibliotecaIdx];
      console.log(`📚 Biblioteca selecionada: ${bib.nome}`);

      const { data: livros, error: livrosError } = await supabase
        .from(bib.tabela)
        .select(`id, ${bib.campoTitulo}, ${bib.campoAutor}, ${bib.campoCapa}, ${bib.campoSobre}, ${bib.campoArea}`)
        .not(bib.campoSobre, 'is', null);

      if (livrosError || !livros?.length) {
        throw new Error(`Nenhum livro encontrado na biblioteca ${bib.nome}: ${livrosError?.message}`);
      }

      const { data: dicasAnteriores } = await supabase
        .from('dicas_do_dia')
        .select('livro_id')
        .eq('biblioteca', bib.nome);

      const idsUsados = new Set((dicasAnteriores || []).map(d => d.livro_id));
      let livrosDisponiveis = livros.filter(l => !idsUsados.has(l.id));
      if (livrosDisponiveis.length === 0) livrosDisponiveis = livros;

      livro = livrosDisponiveis[Math.floor(Math.random() * livrosDisponiveis.length)];
    }

    const titulo = livro[bib.campoTitulo] || 'Livro sem título';
    const autor = livro[bib.campoAutor] || '';
    const capa = livro[bib.campoCapa] || '';
    const sobre = livro[bib.campoSobre] || '';
    const area = livro[bib.campoArea] || '';

    console.log(`📖 Livro selecionado: "${titulo}" por ${autor}`);

    // Buscar conteúdo extraído do PDF
    const conteudoCompleto = await buscarConteudoLivro(supabase, titulo);

    // 3. Inserir registro
    const { data: dicaInserida, error: insertError } = await supabase
      .from('dicas_do_dia')
      .insert({
        data: dataHoje,
        livro_id: livro.id,
        biblioteca: bib.nome,
        livro_titulo: titulo,
        livro_autor: autor,
        livro_capa: capa,
        livro_sobre: sobre,
        area_livro: area,
        porque_ler: '',
        status: 'gerando',
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`Erro ao inserir dica: ${insertError.message}`);
    const dicaId = dicaInserida.id;

    // 4. Gerar textos com Gemini (com conteúdo do PDF se disponível)
    console.log('🤖 Gerando textos com Gemini...');
    let textoGerado = await gerarTextosComGemini(titulo, autor, sobre, area, bib.nome, conteudoCompleto);

    // 4.1 Validar coerência: o conteúdo gerado deve mencionar o livro correto
    const MAX_TENTATIVAS_VALIDACAO = 3;
    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_VALIDACAO; tentativa++) {
      const incoerencia = validarCoerenciaConteudo(titulo, autor, textoGerado);
      if (!incoerencia) {
        console.log(`✅ Validação de coerência OK (tentativa ${tentativa})`);
        break;
      }
      console.warn(`⚠️ Incoerência detectada (tentativa ${tentativa}/${MAX_TENTATIVAS_VALIDACAO}): ${incoerencia}`);
      if (tentativa === MAX_TENTATIVAS_VALIDACAO) {
        // Na última tentativa, logar mas prosseguir mesmo assim
        console.error(`❌ Conteúdo incoerente após ${MAX_TENTATIVAS_VALIDACAO} tentativas. Prosseguindo com último resultado.`);
        break;
      }
      // Regenerar textos
      console.log('🔄 Regenerando textos...');
      textoGerado = await gerarTextosComGemini(titulo, autor, sobre, area, bib.nome, conteudoCompleto);
    }

    let audioPublicUrl: string | null = null;
    let duracaoSegundos: number | null = null;

    if (!skipAudio) {
      console.log('🎙️ Gerando áudio TTS com chunking...');
      const scriptAudio = gerarScriptAudio(titulo, autor, sobre, area, bib.nome, textoGerado);
      console.log(`📝 Script total: ${scriptAudio.length} caracteres`);
      const pcmData = await gerarAudioTTSFinal(scriptAudio);

      console.log('📤 Fazendo upload do áudio...');
      const wavBuffer = criarWAVEficiente(pcmData, 24000);
      const filePath = `${dataHoje}.wav`;

      const { error: uploadError } = await supabase.storage
        .from('dicas-audio')
        .upload(filePath, wavBuffer, { contentType: 'audio/wav', upsert: true });

      if (uploadError) throw new Error(`Erro upload áudio: ${uploadError.message}`);

      const { data: publicUrl } = supabase.storage.from('dicas-audio').getPublicUrl(filePath);
      audioPublicUrl = publicUrl.publicUrl;
      duracaoSegundos = Math.round(pcmData.length / 48000);
    } else {
      console.log('⏭️ Áudio pulado (skip_audio=true)');
    }

    const liberadoEm = new Date().toISOString();

    // Imagens são geradas pelo cron separado (gerar-imagens-recomendacao)
    // Não gerar inline para evitar timeout
    const imagensConteudo: string[] = [];

    const { error: updateError } = await supabase
      .from('dicas_do_dia')
      .update({
        porque_ler: textoGerado.porque_ler,
        frase_dia: textoGerado.frase_dia,
        dica_estudo: textoGerado.dica_estudo,
        audio_url: audioPublicUrl,
        audio_duracao_segundos: duracaoSegundos,
        imagens_conteudo: imagensConteudo.length > 0 ? imagensConteudo : null,
        status: 'pronto',
        liberado_em: liberadoEm,
      })
      .eq('id', dicaId);

    if (updateError) throw new Error(`Erro ao atualizar dica: ${updateError.message}`);

    console.log(`✅ Dica do dia gerada com sucesso! ID: ${dicaId}, duração: ${duracaoSegundos}s`);

    return new Response(
      JSON.stringify({ success: true, id: dicaId, livro: titulo, duracao: duracaoSegundos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro gerar-dica-do-dia:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ==================== HELPERS ====================

interface TextosGerados {
  porque_ler: string;
  frase_dia: string;
  dica_estudo: string;
  beneficios?: string[];
}

/**
 * Valida se o conteúdo gerado (porque_ler, frase_dia) é coerente com o livro esperado.
 * Retorna null se OK, ou uma string descrevendo a incoerência.
 */
function validarCoerenciaConteudo(tituloEsperado: string, autorEsperado: string, textos: TextosGerados): string | null {
  const tituloLower = tituloEsperado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const conteudoCompleto = `${textos.porque_ler} ${textos.frase_dia} ${textos.dica_estudo}`.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Extrair palavras-chave do título (ignorar palavras curtas como "o", "da", "e", "dos", "das")
  const stopWords = new Set(['o', 'a', 'os', 'as', 'do', 'da', 'dos', 'das', 'de', 'e', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'ao', 'aos', 'com', 'por', 'para']);
  const palavrasTitulo = tituloLower.split(/\s+/).filter(p => p.length > 2 && !stopWords.has(p));
  
  if (palavrasTitulo.length === 0) return null; // Título muito curto, pular validação

  // Verificar se pelo menos 50% das palavras-chave do título aparecem no conteúdo
  const matches = palavrasTitulo.filter(p => conteudoCompleto.includes(p));
  const matchRatio = matches.length / palavrasTitulo.length;

  if (matchRatio < 0.5) {
    // Tentar verificar pelo autor como fallback
    if (autorEsperado) {
      const autorLower = autorEsperado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const sobrenome = autorLower.split(/\s+/).pop() || '';
      if (sobrenome.length > 2 && conteudoCompleto.includes(sobrenome)) {
        return null; // Autor encontrado, considerar OK
      }
    }
    return `Apenas ${matches.length}/${palavrasTitulo.length} palavras-chave do título "${tituloEsperado}" encontradas no conteúdo. Palavras encontradas: [${matches.join(', ')}]. Palavras ausentes: [${palavrasTitulo.filter(p => !conteudoCompleto.includes(p)).join(', ')}]`;
  }

  return null;
}

async function gerarTextosComGemini(titulo: string, autor: string, sobre: string, area: string, biblioteca: string, conteudoCompleto: string = ''): Promise<TextosGerados> {
  let conteudoSection = '';
  if (conteudoCompleto) {
    conteudoSection = `

CONTEÚDO REAL DO LIVRO (extraído das páginas):
Baseie sua explicação EXCLUSIVAMENTE no conteúdo real abaixo. Seja preciso, cite conceitos, argumentos específicos, personagens, votos de juízes (se aplicável). NÃO invente informações que não estejam no texto abaixo.

${conteudoCompleto}

---
`;
  }

  const prompt = `Você é um mentor apaixonado de estudantes de Direito. Com base no livro abaixo, gere um JSON com exatamente 4 campos.

IMPORTANTE: EVITE recomendar livros de romance. Priorize livros que agreguem valor prático para a carreira jurídica, desenvolvimento pessoal, liderança ou conhecimento técnico.

IMPORTANTE SOBRE O TOM: Use linguagem acessível e amigável, como se estivesse conversando com o estudante. Trate por "você". Faça perguntas reflexivas ("já parou pra pensar...?", "imagine a seguinte situação..."). NÃO use gírias como "cara", "mano", "sério mesmo". O tom deve ser envolvente e instigante, fazendo a pessoa refletir. NUNCA use "Prezado(a)", "Caro(a)", "futuro(a) jurista" nem linguagem formal/acadêmica.

IMPORTANTE - Se o livro NÃO for estritamente jurídico (ex: investimentos, hábitos, liderança, psicologia, desenvolvimento pessoal), explique claramente POR QUE esse livro é valioso para a vida pessoal, carreira e crescimento do estudante. Conecte os ensinamentos com benefícios concretos para a rotina, mentalidade e sucesso profissional.

IMPORTANTE - O campo "porque_ler" deve ser um texto EXTENSO e RICO em formato Markdown, com NO MÍNIMO 5000 caracteres. Siga estas regras:

1. Use títulos com ## para organizar seções temáticas (mínimo 5 seções)
2. Use **negrito** para destacar conceitos importantes
3. Use listas com - para enumerar pontos relevantes
4. Use separadores --- entre seções
5. Distribua EXATAMENTE 5 placeholders de imagem no texto, cada um em sua própria linha, nos seguintes formatos:
   PLACEHOLDER_IMAGEM_1
   PLACEHOLDER_IMAGEM_2
   PLACEHOLDER_IMAGEM_3
   PLACEHOLDER_IMAGEM_4
   PLACEHOLDER_IMAGEM_5
6. Cada placeholder deve aparecer entre seções, como se fosse uma ilustração do conteúdo
7. Linguagem envolvente, reflexiva e amigável, voltada para estudantes de Direito
8. Explore o contexto histórico, a relevância prática, casos famosos, aplicações em provas/concursos
9. Faça o estudante SENTIR que precisa ler esse livro AGORA
${conteudoCompleto ? '10. ATENÇÃO: Use o CONTEÚDO REAL DO LIVRO fornecido abaixo como base principal. Seja fiel ao conteúdo real, cite argumentos e conceitos que realmente aparecem no livro.' : ''}

Estrutura sugerida para o porque_ler:
## 🔥 Por que esse livro vai mudar sua visão do Direito
(introdução impactante)

PLACEHOLDER_IMAGEM_1

## 📚 O que você vai encontrar nessas páginas
(conteúdo e temas abordados)

PLACEHOLDER_IMAGEM_2

## ⚖️ Como isso se aplica na prática jurídica
(aplicações reais, casos, jurisprudência)

PLACEHOLDER_IMAGEM_3

## 🎯 Por que cai em provas e concursos
(relevância para OAB, concursos, provas)

PLACEHOLDER_IMAGEM_4

## 💡 O que os grandes juristas dizem sobre essa obra
(impacto acadêmico e profissional)

PLACEHOLDER_IMAGEM_5

## 🚀 Como começar a estudar esse livro hoje
(dicas práticas de leitura e estudo)

---

Os outros 3 campos:
2. "beneficios": Um array de 4 a 6 strings curtas (1 frase cada), cada uma descrevendo um benefício concreto que o leitor terá ao ler esse livro. Exemplos: "Desenvolva pensamento crítico jurídico", "Entenda os dilemas morais da lei", "Prepare-se para provas de Filosofia do Direito". Seja específico e prático. Esses benefícios NÃO serão narrados no áudio, servem apenas como prévia visual.
3. "frase_dia": Uma frase inspiracional curta (1-2 linhas) relacionada ao tema do livro.
4. "dica_estudo": Uma mini-dica prática de como aplicar os ensinamentos no dia a dia (2-3 frases).

Livro: "${titulo}"
Autor: ${autor || 'Não informado'}
Biblioteca: ${biblioteca}
Área: ${area || 'Geral'}
Sobre o livro: ${sobre}
${conteudoSection}
Responda APENAS com o JSON válido, sem markdown externo. O campo porque_ler deve conter o markdown DENTRO da string JSON.`;

  const data = await chamarGeminiTexto(prompt);
  
  try {
    let texto = data.trim();
    if (texto.startsWith('```')) {
      texto = texto.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const parsed = JSON.parse(texto);
    // Inject beneficios into porque_ler as special block
    if (parsed.beneficios && Array.isArray(parsed.beneficios) && parsed.beneficios.length > 0) {
      const beneficiosBlock = `<!-- BENEFICIOS_START -->\n${parsed.beneficios.map((b: string) => `- ${b}`).join('\n')}\n<!-- BENEFICIOS_END -->\n\n`;
      parsed.porque_ler = beneficiosBlock + (parsed.porque_ler || '');
    }
    return parsed;
  } catch {
    return {
      porque_ler: data,
      frase_dia: 'O conhecimento jurídico transforma vidas.',
      dica_estudo: 'Reserve 30 minutos do seu dia para leitura focada deste livro.',
    };
  }
}

function limparMarkdownParaAudio(texto: string): string {
  return texto
    .replace(/<!-- BENEFICIOS_START -->[\s\S]*?<!-- BENEFICIOS_END -->\n*/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/PLACEHOLDER_IMAGEM_\d/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/---+/g, '')
    .replace(/[🔥📚⚖️🎯💡🚀✨📖🏛️⚡]/gu, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function gerarScriptAudio(titulo: string, autor: string, sobre: string, area: string, biblioteca: string, textos: TextosGerados): string {
  let porqueAudio = limparMarkdownParaAudio(textos.porque_ler);
  
  if (porqueAudio.length > 3500) {
    console.log(`✂️ Truncando porqueAudio: ${porqueAudio.length} -> ~3500 chars`);
    const cortado = porqueAudio.substring(0, 3500);
    const ultimoPonto = Math.max(cortado.lastIndexOf('.'), cortado.lastIndexOf('!'), cortado.lastIndexOf('?'));
    porqueAudio = ultimoPonto > 2500 ? cortado.substring(0, ultimoPonto + 1) : cortado;
  }
  console.log(`📝 porqueAudio limpo: ${porqueAudio.length} chars`);

  return `Olá! Eu sou a mentora do APP Direito Prime. A recomendação do livro de hoje é: "${titulo}"${autor ? `, de ${autor}` : ''}.

${porqueAudio}

E aqui vai uma dica prática: ${textos.dica_estudo}

Para encerrar, uma reflexão: ${textos.frase_dia}

Nos vemos amanhã com uma nova dica! Continue firme nos estudos. Até mais!`;
}

async function chamarGeminiTexto(prompt: string): Promise<string> {
  let lastError: Error | null = null;
  
  for (const apiKey of API_KEYS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 8000 },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini text error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error('Erro Gemini texto:', lastError.message);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
  }
  
  throw lastError || new Error('Todas as chaves falharam no Gemini texto');
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
