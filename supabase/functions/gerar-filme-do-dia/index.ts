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

const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY')!;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Lista curada de filmes relevantes para estudantes de Direito
const FILMES_CURADOS = [
  // Filmes jurídicos clássicos
  { titulo: "12 Angry Men", ano: 1957 },
  { titulo: "To Kill a Mockingbird", ano: 1962 },
  { titulo: "A Few Good Men", ano: 1992 },
  { titulo: "The Verdict", ano: 1982 },
  { titulo: "Philadelphia", ano: 1993 },
  { titulo: "Erin Brockovich", ano: 2000 },
  { titulo: "The Lincoln Lawyer", ano: 2011 },
  { titulo: "Primal Fear", ano: 1996 },
  { titulo: "A Time to Kill", ano: 1996 },
  { titulo: "The Rainmaker", ano: 1997 },
  { titulo: "Michael Clayton", ano: 2007 },
  { titulo: "The Client", ano: 1994 },
  { titulo: "Anatomy of a Murder", ano: 1959 },
  { titulo: "Witness for the Prosecution", ano: 1957 },
  { titulo: "Runaway Jury", ano: 2003 },
  { titulo: "The Judge", ano: 2014 },
  { titulo: "Marshall", ano: 2017 },
  { titulo: "Just Mercy", ano: 2019 },
  { titulo: "Dark Waters", ano: 2019 },
  { titulo: "Richard Jewell", ano: 2019 },
  // Justiça social e direitos civis
  { titulo: "Selma", ano: 2014 },
  { titulo: "The Trial of the Chicago 7", ano: 2020 },
  { titulo: "Mississippi Burning", ano: 1988 },
  { titulo: "Amistad", ano: 1997 },
  { titulo: "Ghandi", ano: 1982 },
  { titulo: "Mandela: Long Walk to Freedom", ano: 2013 },
  { titulo: "Hidden Figures", ano: 2016 },
  { titulo: "Green Book", ano: 2018 },
  { titulo: "The Help", ano: 2011 },
  { titulo: "12 Years a Slave", ano: 2013 },
  { titulo: "Fruitvale Station", ano: 2013 },
  { titulo: "Suffragette", ano: 2015 },
  // Ética e dilemas morais
  { titulo: "The Shawshank Redemption", ano: 1994 },
  { titulo: "Schindler's List", ano: 1993 },
  { titulo: "A Beautiful Mind", ano: 2001 },
  { titulo: "The Pursuit of Happyness", ano: 2006 },
  { titulo: "Spotlight", ano: 2015 },
  { titulo: "All the President's Men", ano: 1976 },
  { titulo: "The Post", ano: 2017 },
  { titulo: "Snowden", ano: 2016 },
  { titulo: "The Insider", ano: 1999 },
  { titulo: "Sully", ano: 2016 },
  { titulo: "Bridge of Spies", ano: 2015 },
  // Sistema penal e prisional
  { titulo: "Dead Man Walking", ano: 1995 },
  { titulo: "The Green Mile", ano: 1999 },
  { titulo: "Monster", ano: 2003 },
  { titulo: "Changeling", ano: 2008 },
  { titulo: "Prisoners", ano: 2013 },
  { titulo: "Zodiac", ano: 2007 },
  { titulo: "Catch Me If You Can", ano: 2002 },
  { titulo: "Escape from Alcatraz", ano: 1979 },
  // Liderança e superação
  { titulo: "The King's Speech", ano: 2010 },
  { titulo: "Invictus", ano: 2009 },
  { titulo: "Lincoln", ano: 2012 },
  { titulo: "Darkest Hour", ano: 2017 },
  { titulo: "Bohemian Rhapsody", ano: 2018 },
  { titulo: "The Social Network", ano: 2010 },
  { titulo: "Steve Jobs", ano: 2015 },
  { titulo: "Moneyball", ano: 2011 },
  // Filmes brasileiros relevantes
  { titulo: "O Auto da Compadecida", ano: 2000 },
  { titulo: "Tropa de Elite", ano: 2007 },
  { titulo: "Cidade de Deus", ano: 2002 },
  { titulo: "Central do Brasil", ano: 1998 },
  { titulo: "Carandiru", ano: 2003 },
  { titulo: "O Mecanismo", ano: 2018 },
  { titulo: "Bacurau", ano: 2019 },
  // Filmes sobre corrupção e política
  { titulo: "The Godfather", ano: 1972 },
  { titulo: "The Godfather Part II", ano: 1974 },
  { titulo: "Goodfellas", ano: 1990 },
  { titulo: "The Wolf of Wall Street", ano: 2013 },
  { titulo: "The Big Short", ano: 2015 },
  { titulo: "Vice", ano: 2018 },
  { titulo: "Bombshell", ano: 2019 },
  // Guerra e direito internacional
  { titulo: "Judgment at Nuremberg", ano: 1961 },
  { titulo: "The Reader", ano: 2008 },
  { titulo: "Hotel Rwanda", ano: 2004 },
  { titulo: "Eye in the Sky", ano: 2015 },
  { titulo: "Official Secrets", ano: 2019 },
  { titulo: "The Mauritanian", ano: 2021 },
  // Tecnologia e direito digital
  { titulo: "The Fifth Estate", ano: 2013 },
  { titulo: "Citizenfour", ano: 2014 },
  { titulo: "The Great Hack", ano: 2019 },
  // Mais filmes de tribunal
  { titulo: "Kramer vs. Kramer", ano: 1979 },
  { titulo: "Legally Blonde", ano: 2001 },
  { titulo: "My Cousin Vinny", ano: 1992 },
  { titulo: "The Pelican Brief", ano: 1993 },
  { titulo: "The Firm", ano: 1993 },
  { titulo: "Conviction", ano: 2010 },
  { titulo: "North Country", ano: 2005 },
  { titulo: "Class Action", ano: 1991 },
  { titulo: "Denial", ano: 2016 },
  { titulo: "On the Basis of Sex", ano: 2018 },
  { titulo: "The Two Popes", ano: 2019 },
  { titulo: "Oppenheimer", ano: 2023 },
];

// ==================== TMDB ====================

async function buscarFilmeTMDB(titulo: string, ano: number) {
  const searchUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(titulo)}&year=${ano}&language=pt-BR`;
  const res = await fetch(searchUrl);
  const data = await res.json();
  
  if (!data.results || data.results.length === 0) {
    const searchUrl2 = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`;
    const res2 = await fetch(searchUrl2);
    const data2 = await res2.json();
    if (!data2.results || data2.results.length === 0) throw new Error(`Filme não encontrado no TMDB: ${titulo}`);
    return data2.results[0].id;
  }
  
  return data.results[0].id;
}

async function buscarSerieTMDB(titulo: string, ano: number | null) {
  const anoParam = ano ? `&first_air_date_year=${ano}` : '';
  const searchUrl = `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(titulo)}${anoParam}&language=pt-BR`;
  const res = await fetch(searchUrl);
  const data = await res.json();
  
  if (!data.results || data.results.length === 0) {
    // Tentar sem ano
    const searchUrl2 = `${TMDB_BASE}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`;
    const res2 = await fetch(searchUrl2);
    const data2 = await res2.json();
    if (!data2.results || data2.results.length === 0) throw new Error(`Série não encontrada no TMDB: ${titulo}`);
    return data2.results[0].id;
  }
  
  return data.results[0].id;
}

async function buscarDetalhesTMDB(tmdbId: number) {
  const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits,videos,images&include_image_language=null,en,pt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return await res.json();
}

async function buscarDetalhesTVTMDB(tmdbId: number) {
  const url = `${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits,videos,images&include_image_language=null,en,pt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB TV error: ${res.status}`);
  return await res.json();
}

function extrairImagensCenas(images: any): string[] {
  if (!images?.backdrops) return [];
  return images.backdrops
    .sort((a: any, b: any) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, 10)
    .map((img: any) => `${TMDB_IMG}/w780${img.file_path}`);
}

function extrairTrailer(videos: any): string | null {
  if (!videos?.results) return null;
  const trailer = videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')
    || videos.results.find((v: any) => v.site === 'YouTube');
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

function extrairElenco(credits: any): any[] {
  if (!credits?.cast) return [];
  return credits.cast.slice(0, 6).map((a: any) => ({
    nome: a.name,
    personagem: a.character,
    foto: a.profile_path ? `${TMDB_IMG}/w185${a.profile_path}` : null,
  }));
}

function extrairDiretor(credits: any): string {
  if (!credits?.crew) return 'Desconhecido';
  const dir = credits.crew.find((c: any) => c.job === 'Director');
  return dir?.name || 'Desconhecido';
}

// ==================== TTS (mesma lógica do gerar-dica-do-dia) ====================

function dividirTextoEmChunks(texto: string, maxChars = 4000): string[] {
  if (texto.length <= maxChars) return [texto];
  const chunks: string[] = [];
  let restante = texto;
  while (restante.length > 0) {
    if (restante.length <= maxChars) { chunks.push(restante); break; }
    let corte = -1;
    for (let i = maxChars; i >= maxChars * 0.5; i--) {
      if (restante[i] === '.' || restante[i] === '!' || restante[i] === '?') { corte = i + 1; break; }
    }
    if (corte === -1) {
      for (let i = maxChars; i >= maxChars * 0.5; i--) {
        if (restante[i] === ' ') { corte = i + 1; break; }
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
  console.log(`🎙️ TTS: ${chunks.length} chunk(s), ${texto.length} chars`);
  const pcmBuffers: Uint8Array[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const base64 = await gerarAudioTTSSingle(chunks[i]);
    const pcm = base64ToUint8Array(base64);
    pcmBuffers.push(pcm);
  }
  const totalLength = pcmBuffers.reduce((sum, buf) => sum + buf.length, 0);
  const concatenated = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of pcmBuffers) { concatenated.set(buf, offset); offset += buf.length; }
  return concatenated;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function criarWAV(pcmData: Uint8Array, sampleRate: number): Uint8Array {
  const headerSize = 44;
  const buffer = new Uint8Array(headerSize + pcmData.length);
  const view = new DataView(buffer.buffer);
  buffer[0]=82;buffer[1]=73;buffer[2]=70;buffer[3]=70;
  view.setUint32(4, 36 + pcmData.length, true);
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
  view.setUint32(40, pcmData.length, true);
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
            speech_config: { voice_config: { prebuilt_voice_config: { voice_name: "Sulafat" } } }
          }
        }),
      });
      if (!response.ok) throw new Error(`TTS error ${response.status}`);
      const data = await response.json();
      const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) throw new Error('Sem áudio na resposta');
      return audioData;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  throw lastError || new Error('Todas as chaves falharam no TTS');
}

// ==================== GEMINI ====================

async function gerarConteudoComGemini(titulo: string, tituloOriginal: string, sinopse: string, diretor: string, generos: string[], ano: number): Promise<{ porque_assistir: string; beneficios_juridicos: string; frase_dia: string }> {
  const prompt = `Você é um mentor apaixonado de estudantes de Direito. Analise o filme abaixo e gere um JSON com exatamente 3 campos:

FILME: "${titulo}" (${tituloOriginal})
ANO: ${ano}
DIRETOR: ${diretor}
GÊNEROS: ${generos.join(', ')}
SINOPSE: ${sinopse}

Gere um JSON com:

1. "porque_assistir": Um texto EXTENSO em Markdown (mínimo 800 palavras) explicando POR QUE um estudante de Direito deve assistir este filme. Inclua:
   - Contexto jurídico retratado no filme
   - Análise de personagens e suas posturas éticas
   - Conceitos de Direito presentes (constitucional, penal, civil, trabalho, etc.)
   - Como o filme ajuda no desenvolvimento de pensamento crítico
   - Paralelos com o sistema jurídico brasileiro
   - Cenas marcantes e seus ensinamentos
   Use subtítulos em Markdown (##), negrito, listas.
   
   IMPORTANTE: Distribua EXATAMENTE 5 placeholders de imagem no texto, cada um em sua própria linha:
   PLACEHOLDER_IMAGEM_1
   PLACEHOLDER_IMAGEM_2
   PLACEHOLDER_IMAGEM_3
   PLACEHOLDER_IMAGEM_4
   PLACEHOLDER_IMAGEM_5
   Cada placeholder deve aparecer entre seções, como se fosse uma ilustração do conteúdo.

2. "beneficios_juridicos": Um ARRAY JSON de objetos, cada um com "titulo" e "descricao". Gere de 4 a 6 benefícios PRÁTICOS e ESPECÍFICOS para a carreira jurídica. Cada titulo deve ser curto (3-6 palavras) e cada descricao deve ter 1-2 frases explicando como esse benefício ajuda concretamente o estudante de Direito. Exemplo de formato:
   [{"titulo": "Pensamento Crítico Jurídico", "descricao": "O filme desafia você a questionar as bases do sistema penal e desenvolver argumentação sólida."}, ...]

3. "frase_dia": Uma frase inspiradora curta relacionada ao tema do filme (máx 150 chars).

Retorne APENAS o JSON, sem markdown code blocks. O campo beneficios_juridicos deve ser um ARRAY JSON, não texto.`;

  let lastError: Error | null = null;
  for (const apiKey of API_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        }
      );
      if (!response.ok) { 
        if (response.status === 429) throw new Error('RATE_LIMIT');
        continue; 
      }
      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.message === 'RATE_LIMIT') throw lastError;
      continue;
    }
  }
  throw lastError || new Error('Todas as chaves Gemini falharam');
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
    let forcarRegeneracao = false;
    let filmeIndex: number | null = null;

    try {
      const body = await req.json();
      dataHoje = body?.data || body?.data_especifica || (() => { throw new Error('no data'); })();
      if (body?.skip_audio) skipAudio = true;
      if (body?.forcar_regeneracao) forcarRegeneracao = true;
      if (body?.filme_index !== undefined) filmeIndex = body.filme_index;
    } catch {
      const now = new Date();
      const brasiliaOffset = -3 * 60;
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
      dataHoje = brasiliaDate.toISOString().split('T')[0];
    }

    console.log(`🎬 Gerando filme do dia para: ${dataHoje}`);

    // 1. Verificar se já existe
    const { data: existente } = await (supabase as any)
      .from('filmes_do_dia')
      .select('*')
      .eq('data', dataHoje)
      .maybeSingle();

    if (existente && existente.status === 'pronto' && !forcarRegeneracao) {
      return new Response(JSON.stringify({ message: 'Filme já gerado para hoje', id: existente.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (existente) {
      await (supabase as any).from('filmes_do_dia').delete().eq('id', existente.id);
    }

    // 2. Buscar títulos da JURIFLIX
    const { data: juriflixTitulos } = await (supabase as any)
      .from('JURIFLIX')
      .select('id, nome, ano, tipo');

    // 3. Verificar tmdb_ids já usados
    const { data: filmesUsados } = await (supabase as any)
      .from('filmes_do_dia')
      .select('tmdb_id');

    const tmdbIdsUsados = new Set((filmesUsados || []).map((f: any) => f.tmdb_id));

    let filmeEscolhido: { titulo: string; ano: number; isTV: boolean } | null = null;
    let usandoJuriflix = false;

    if (filmeIndex !== null && filmeIndex < FILMES_CURADOS.length) {
      const fc = FILMES_CURADOS[filmeIndex];
      filmeEscolhido = { titulo: fc.titulo, ano: fc.ano, isTV: false };
    } else {
      // Tentar primeiro da JURIFLIX
      const juriflixEmbaralhado = (juriflixTitulos || [])
        .filter((jf: any) => jf.nome)
        .sort(() => Math.random() - 0.5);

      for (const jf of juriflixEmbaralhado) {
        try {
          const isTV = jf.tipo === 'Séries' || jf.tipo === 'Documentários';
          const tmdbId = isTV
            ? await buscarSerieTMDB(jf.nome, jf.ano)
            : await buscarFilmeTMDB(jf.nome, jf.ano);
          if (!tmdbIdsUsados.has(tmdbId)) {
            filmeEscolhido = { titulo: jf.nome, ano: jf.ano || 2000, isTV };
            usandoJuriflix = true;
            console.log(`🎯 JURIFLIX selecionado: "${jf.nome}" (${jf.tipo}) tmdb_id=${tmdbId}`);
            break;
          }
        } catch (e) {
          console.warn(`⚠️ JURIFLIX falhou para "${jf.nome}":`, e);
          continue;
        }
      }

      // Fallback para lista curada
      if (!filmeEscolhido) {
        console.log('📋 Todos JURIFLIX usados, usando FILMES_CURADOS');
        const curadoEmbaralhado = [...FILMES_CURADOS].sort(() => Math.random() - 0.5);
        for (const candidato of curadoEmbaralhado) {
          try {
            const candidatoId = await buscarFilmeTMDB(candidato.titulo, candidato.ano);
            if (!tmdbIdsUsados.has(candidatoId)) {
              filmeEscolhido = { titulo: candidato.titulo, ano: candidato.ano, isTV: false };
              break;
            }
          } catch { continue; }
        }
        // Último recurso: pegar qualquer um
        if (!filmeEscolhido) {
          const fc = FILMES_CURADOS[Math.floor(Math.random() * FILMES_CURADOS.length)];
          filmeEscolhido = { titulo: fc.titulo, ano: fc.ano, isTV: false };
        }
      }
    }

    console.log(`🔍 Buscando no TMDB: "${filmeEscolhido.titulo}" (${filmeEscolhido.ano}) isTV=${filmeEscolhido.isTV}`);

    // 3. Buscar detalhes no TMDB
    const tmdbIdFinal = filmeEscolhido.isTV
      ? await buscarSerieTMDB(filmeEscolhido.titulo, filmeEscolhido.ano)
      : await buscarFilmeTMDB(filmeEscolhido.titulo, filmeEscolhido.ano);

    const detalhes = filmeEscolhido.isTV
      ? await buscarDetalhesTVTMDB(tmdbIdFinal)
      : await buscarDetalhesTMDB(tmdbIdFinal);

    // Buscar watch providers do Brasil
    let ondeAssistir: any = null;
    try {
      const mediaType = filmeEscolhido.isTV ? 'tv' : 'movie';
      const providersUrl = `${TMDB_BASE}/${mediaType}/${tmdbIdFinal}/watch/providers?api_key=${TMDB_API_KEY}`;
      const provRes = await fetch(providersUrl);
      const provData = await provRes.json();
      const br = provData.results?.BR || {};
      const processProviders = (list: any[]) =>
        (list || []).map((p: any) => ({
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path ? `${TMDB_IMG}/w92${p.logo_path}` : null,
        }));
      ondeAssistir = {
        flatrate: processProviders(br.flatrate),
        rent: processProviders(br.rent),
        buy: processProviders(br.buy),
        link: br.link || null,
      };
      console.log(`📺 Providers BR: flatrate=${ondeAssistir.flatrate.length}, rent=${ondeAssistir.rent.length}, buy=${ondeAssistir.buy.length}`);
    } catch (e) {
      console.error('⚠️ Erro ao buscar providers:', e);
    }

    // Adaptar campos para TV vs Movie
    const titulo = filmeEscolhido.isTV
      ? (detalhes.name || filmeEscolhido.titulo)
      : (detalhes.title || filmeEscolhido.titulo);
    const tituloOriginal = filmeEscolhido.isTV
      ? (detalhes.original_name || '')
      : (detalhes.original_title || '');
    const sinopse = detalhes.overview || '';
    const posterPath = detalhes.poster_path ? `${TMDB_IMG}/w500${detalhes.poster_path}` : null;
    const backdropPath = detalhes.backdrop_path ? `${TMDB_IMG}/original${detalhes.backdrop_path}` : null;
    const trailerUrl = extrairTrailer(detalhes.videos);
    const imagensCenas = extrairImagensCenas(detalhes.images);
    const elenco = extrairElenco(detalhes.credits);
    const diretor = filmeEscolhido.isTV
      ? (detalhes.created_by?.map((c: any) => c.name).join(', ') || extrairDiretor(detalhes.credits))
      : extrairDiretor(detalhes.credits);
    const generos = (detalhes.genres || []).map((g: any) => g.name);
    const duracao = filmeEscolhido.isTV
      ? (detalhes.episode_run_time?.[0] || detalhes.number_of_episodes || 0)
      : (detalhes.runtime || 0);
    const dataLancamento = filmeEscolhido.isTV ? detalhes.first_air_date : detalhes.release_date;
    const ano = dataLancamento ? parseInt(dataLancamento.split('-')[0]) : filmeEscolhido.ano;
    const notaTmdb = detalhes.vote_average || 0;

    console.log(`🎬 Filme: "${titulo}" | Diretor: ${diretor} | Trailer: ${trailerUrl ? 'Sim' : 'Não'}`);

    // 4. Inserir registro
    const { data: filmeInserido, error: insertError } = await (supabase as any)
      .from('filmes_do_dia')
      .insert({
        data: dataHoje,
        tmdb_id: tmdbIdFinal,
        titulo,
        titulo_original: tituloOriginal,
        sinopse,
        poster_path: posterPath,
        backdrop_path: backdropPath,
        trailer_url: trailerUrl,
        imagens_cenas: imagensCenas,
        elenco,
        diretor,
        generos,
        duracao,
        ano,
        nota_tmdb: notaTmdb,
        status: 'gerando',
        onde_assistir: ondeAssistir,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(`Erro ao inserir: ${insertError.message}`);
    const filmeId = filmeInserido.id;

    // 5. Gerar conteúdo com Gemini
    console.log('🤖 Gerando conteúdo com Gemini...');
    const conteudo = await gerarConteudoComGemini(titulo, tituloOriginal, sinopse, diretor, generos, ano);

    // 6. Marcar como pronto ANTES do TTS (áudio é bônus)
    await (supabase as any)
      .from('filmes_do_dia')
      .update({
        porque_assistir: conteudo.porque_assistir,
        beneficios_juridicos: conteudo.beneficios_juridicos,
        frase_dia: conteudo.frase_dia,
        status: 'pronto',
        liberado_em: new Date().toISOString(),
      })
      .eq('id', filmeId);

    console.log(`✅ Filme do dia salvo como pronto! ID: ${filmeId}`);

    // 7. Gerar áudio TTS (bônus, não bloqueia)
    let audioUrl: string | null = null;
    let audioDuracao: number | null = null;

    if (!skipAudio) {
      try {
        console.log('🎙️ Gerando áudio TTS...');
        const scriptAudio = `Filme do dia: ${titulo}. Dirigido por ${diretor}, do ano ${ano}. ${sinopse}. ${conteudo.porque_assistir.replace(/[#*_\[\]]/g, '')}`;
        const pcmData = await gerarAudioTTSFinal(scriptAudio);
        const wavBuffer = criarWAV(pcmData, 24000);
        const filePath = `filme_${dataHoje}.wav`;

        const { error: uploadError } = await supabase.storage
          .from('dicas-audio')
          .upload(filePath, wavBuffer, { contentType: 'audio/wav', upsert: true });

        if (uploadError) console.error('Erro upload áudio:', uploadError);
        else {
          const { data: publicUrl } = supabase.storage.from('dicas-audio').getPublicUrl(filePath);
          audioUrl = publicUrl.publicUrl;
          audioDuracao = Math.round(pcmData.length / 48000);

          await (supabase as any)
            .from('filmes_do_dia')
            .update({ audio_url: audioUrl, audio_duracao_segundos: audioDuracao })
            .eq('id', filmeId);
        }
      } catch (ttsError) {
        console.error('⚠️ TTS falhou (filme já salvo como pronto):', ttsError);
      }
    }

    console.log(`✅ Filme do dia gerado! ID: ${filmeId}`);

    return new Response(
      JSON.stringify({ success: true, id: filmeId, filme: titulo, duracao_audio: audioDuracao }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro gerar-filme-do-dia:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
