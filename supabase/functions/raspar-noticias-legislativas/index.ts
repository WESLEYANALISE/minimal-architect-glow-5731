import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

function parseDataBR(dataStr: string): string {
  if (!dataStr) return new Date().toISOString();
  try {
    const match = dataStr.trim().match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (!match) return new Date().toISOString();
    const [, dia, mes, ano, hora, min] = match;
    const date = new Date(`${ano}-${mes}-${dia}T${hora}:${min}:00-03:00`);
    if (isNaN(date.getTime())) return new Date().toISOString();
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

async function gerarTituloCurto(titulo: string): Promise<string> {
  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Crie um título CURTO e CHAMATIVO (máximo 55 caracteres) estilo clickbait para esta notícia legislativa. Deve ser impactante e despertar curiosidade. Responda APENAS o título, sem aspas, sem explicação.\n\nTítulo original: ${titulo}` }] }],
            generationConfig: { temperature: 0.9, maxOutputTokens: 100 }
          })
        }
      );
      if (response.status === 429) continue;
      if (!response.ok) continue;
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text && text.length <= 70) return text.replace(/^["']|["']$/g, '');
    } catch {}
  }
  // Fallback: truncate original
  return titulo.length > 55 ? titulo.substring(0, 52) + '...' : titulo;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache - only update if last update was > 10 min ago
    const { data: latest } = await supabase
      .from('noticias_legislativas_cache')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (latest?.updated_at) {
      const diff = Date.now() - new Date(latest.updated_at).getTime();
      if (diff < 10 * 60 * 1000) {
        console.log('Cache ainda válido, pulando scraping');
        return new Response(
          JSON.stringify({ success: true, cached: true, message: 'Cache ainda válido' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('🔍 Raspando notícias de camara.leg.br/noticias/ultimas...');

    const response = await fetch('https://www.camara.leg.br/noticias/ultimas', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const html = await response.text();

    const articleRegex = /<article\s+class="g-chamada\s+chamada--ultimas">([\s\S]*?)<\/article>/gi;
    const noticias: any[] = [];
    let match;

    while ((match = articleRegex.exec(html)) !== null) {
      const articleHtml = match[1];

      const imgMatch = articleHtml.match(/<img\s+src="([^"]+)"\s+class="g-chamada__imagem"/);
      const imagem = imgMatch?.[1] || '';

      const catMatch = articleHtml.match(/<span\s+class="g-chamada__retranca">([^<]+)<\/span>/);
      const categoria = catMatch?.[1]?.trim() || '';

      const titleMatch = articleHtml.match(/<h3\s+class="g-chamada__titulo">\s*<a\s+href="([^"]+)">([^<]+)<\/a>/);
      const link = titleMatch?.[1] || '';
      const titulo = titleMatch?.[2]?.trim() || '';

      const dateMatch = articleHtml.match(/<span\s+class="g-chamada__data">([^<]+)<\/span>/);
      const dataStr = dateMatch?.[1]?.trim() || '';

      if (titulo && link) {
        noticias.push({
          titulo,
          link,
          imagem,
          categoria,
          data_publicacao: parseDataBR(dataStr),
          fonte: 'Câmara dos Deputados',
        });
      }
    }

    console.log(`📰 Encontradas ${noticias.length} notícias`);

    if (noticias.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'Nenhuma notícia encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert + generate titulo_curto via Gemini + auto-process content
    let inserted = 0;
    const novasNoticias: any[] = [];
    for (const noticia of noticias) {
      // Check if already exists
      const { data: existing } = await supabase
        .from('noticias_legislativas_cache')
        .select('titulo_curto, conteudo_formatado')
        .eq('link', noticia.link)
        .maybeSingle();

      const isNew = !existing;

      const { error } = await supabase
        .from('noticias_legislativas_cache')
        .upsert(noticia, { onConflict: 'link', ignoreDuplicates: false });

      if (error) {
        console.error(`Erro ao inserir "${noticia.titulo.substring(0, 40)}":`, error.message);
      } else {
        inserted++;
        // Generate titulo_curto if not yet set
        if (!existing?.titulo_curto) {
          try {
            const tituloCurto = await gerarTituloCurto(noticia.titulo);
            console.log(`🏷️ Título curto: "${tituloCurto}"`);
            await supabase
              .from('noticias_legislativas_cache')
              .update({ titulo_curto: tituloCurto })
              .eq('link', noticia.link);
          } catch (e) {
            console.error('Erro ao gerar título curto:', e);
          }
        }
        // Queue for processing if no content yet
        if (!existing?.conteudo_formatado) {
          novasNoticias.push(noticia);
        }
      }
    }

    // Auto-process up to 3 new notícias (fire and forget to avoid timeout)
    const toProcess = novasNoticias.slice(0, 3);
    for (const n of toProcess) {
      console.log(`🔄 Auto-processando: "${n.titulo.substring(0, 50)}..."`);
      supabase.functions.invoke('processar-noticia-legislativa', {
        body: { url: n.link, titulo: n.titulo }
      }).catch(e => console.error('Erro auto-process:', e));
    }

    // Compress cover images to WebP (up to 5 per run)
    const { data: semWebp } = await supabase
      .from('noticias_legislativas_cache')
      .select('id, imagem')
      .is('imagem_webp', null)
      .not('imagem', 'is', null)
      .not('imagem', 'eq', '')
      .limit(5);

    if (semWebp && semWebp.length > 0) {
      console.log(`🖼️ Comprimindo ${semWebp.length} imagens para WebP...`);
      for (const item of semWebp) {
        if (!item.imagem || item.imagem.includes('.webp') || item.imagem.includes('supabase.co/storage')) continue;
        try {
          const { data: webpResult, error: webpError } = await supabase.functions.invoke('converter-imagem-webp', {
            body: { imageUrl: item.imagem }
          });
          if (!webpError && webpResult?.webpUrl) {
            await supabase
              .from('noticias_legislativas_cache')
              .update({ imagem_webp: webpResult.webpUrl })
              .eq('id', item.id);
            console.log(`✅ WebP: ${item.id}`);
          }
        } catch (e) {
          console.error(`Erro WebP ${item.id}:`, e);
        }
      }
    }

    // Cleanup old entries (> 14 days)
    const quatorzeDias = new Date();
    quatorzeDias.setDate(quatorzeDias.getDate() - 14);
    await supabase
      .from('noticias_legislativas_cache')
      .delete()
      .lt('data_publicacao', quatorzeDias.toISOString());

    console.log(`✅ ${inserted}/${noticias.length} notícias salvas`);

    return new Response(
      JSON.stringify({ success: true, count: inserted, total: noticias.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
