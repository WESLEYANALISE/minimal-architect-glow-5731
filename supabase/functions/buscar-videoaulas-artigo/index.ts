import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    // Try fetching captions via YouTube innertube (no API quota)
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const watchRes = await fetch(watchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'pt-BR,pt;q=0.9' }
    });
    const html = await watchRes.text();
    
    // Extract captions URL from player response
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) {
      console.log('[transcript] No captions found');
      return null;
    }
    
    const tracks = JSON.parse(captionMatch[1]);
    // Prefer Portuguese, then auto-generated Portuguese, then any
    const ptTrack = tracks.find((t: any) => t.languageCode === 'pt') 
      || tracks.find((t: any) => t.languageCode?.startsWith('pt'))
      || tracks[0];
    
    if (!ptTrack?.baseUrl) {
      console.log('[transcript] No suitable caption track');
      return null;
    }

    const captionRes = await fetch(ptTrack.baseUrl);
    const xml = await captionRes.text();
    
    // Parse XML transcript - extract text content
    const textSegments = xml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];
    const transcript = textSegments
      .map(seg => {
        const text = seg.replace(/<[^>]+>/g, '').trim();
        return text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n/g, ' ');
      })
      .filter(Boolean)
      .join(' ');
    
    console.log(`[transcript] Got ${transcript.length} chars`);
    return transcript.length > 50 ? transcript : null;
  } catch (err) {
    console.error('[transcript] Error:', err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { numeroArtigo, codeName, area } = await req.json();

    if (!numeroArtigo || !area) {
      return new Response(JSON.stringify({ error: 'numeroArtigo e area são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Check cache first
    const { data: cached } = await supabase
      .from('videoaulas_artigos_cache')
      .select('*')
      .eq('codigo_tabela', codeName || '')
      .eq('numero_artigo', numeroArtigo)
      .maybeSingle();

    if (cached) {
      console.log(`[buscar-videoaulas] Cache hit: ${cached.video_id}`);
      return new Response(JSON.stringify({
        videos: [{
          videoId: cached.video_id,
          title: cached.video_title,
          thumbnail: cached.video_thumbnail,
          channelTitle: cached.video_channel,
        }],
        cached: true,
        transcricao: cached.transcricao,
        resumo: cached.resumo,
        flashcards: cached.flashcards,
        questoes: cached.questoes,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Search YouTube
    if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY não configurada');

    const query = `"artigo ${numeroArtigo}" ${area} explicação aula`;
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&publishedAfter=${threeYearsAgo.toISOString()}&maxResults=1&relevanceLanguage=pt&regionCode=BR&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      const err = await response.text();
      console.error(`[buscar-videoaulas] YouTube API erro: ${response.status} - ${err}`);
      throw new Error(`YouTube API ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];
    
    if (items.length === 0) {
      return new Response(JSON.stringify({ videos: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const video = {
      videoId: items[0].id.videoId,
      title: items[0].snippet.title,
      thumbnail: items[0].snippet.thumbnails?.medium?.url || items[0].snippet.thumbnails?.default?.url,
      channelTitle: items[0].snippet.channelTitle,
    };

    // 3. Fetch transcript
    const transcricao = await fetchTranscript(video.videoId);

    // 4. Save to cache
    await supabase.from('videoaulas_artigos_cache').upsert({
      codigo_tabela: codeName || '',
      numero_artigo: numeroArtigo,
      area,
      video_id: video.videoId,
      video_title: video.title,
      video_channel: video.channelTitle,
      video_thumbnail: video.thumbnail,
      transcricao,
    }, { onConflict: 'codigo_tabela,numero_artigo' });

    console.log(`[buscar-videoaulas] Cached: ${video.videoId}, transcript: ${transcricao ? 'yes' : 'no'}`);

    return new Response(JSON.stringify({
      videos: [video],
      cached: false,
      transcricao,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[buscar-videoaulas] Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
