import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FONTES_CONCURSO = [
  { url: "https://www.jcconcursos.com.br/concursos", nome: "JC Concursos" },
  { url: "https://www.pciconcursos.com.br/noticias/", nome: "PCI Concursos" },
];

async function scrapeNoticias(browserlessKey: string, cargo: string): Promise<any[]> {
  const termos = cargo.toLowerCase().replace(/[()]/g, "").split(/\s+/).filter(t => t.length > 3);
  const query = termos.join("+");
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(cargo + " concurso público 2025 2026")}&tbm=nws&num=10`;

  try {
    const response = await fetch("https://chrome.browserless.io/content?token=" + browserlessKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: searchUrl,
        waitFor: 3000,
        gotoOptions: { waitUntil: "networkidle2" },
      }),
    });

    if (!response.ok) {
      console.error("Browserless error:", response.status);
      return [];
    }

    const html = await response.text();
    
    // Extract news from Google News results
    const noticias: any[] = [];
    const linkRegex = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const titleRegex = /<div[^>]*class="[^"]*BNeawe[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    
    // Simple extraction of links and text from news results
    const blocks = html.split('<div class="g"');
    for (const block of blocks.slice(1, 11)) {
      const linkMatch = block.match(/href="\/url\?q=(https?:\/\/[^&"]+)/);
      const titleMatch = block.match(/<div[^>]*class="[^"]*BNeawe vvjwJb[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      const descMatch = block.match(/<div[^>]*class="[^"]*BNeawe s3v9rd[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      const dateMatch = block.match(/(\d{1,2}\s+(?:de\s+)?(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\w*\.?\s+(?:de\s+)?\d{4})/i);

      if (linkMatch && titleMatch) {
        const link = decodeURIComponent(linkMatch[1]);
        const titulo = titleMatch[1].replace(/<[^>]+>/g, "").trim();
        const descricao = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : null;
        
        // Extract source from URL
        const fonteMatch = link.match(/https?:\/\/(?:www\.)?([^\/]+)/);
        const fonte = fonteMatch ? fonteMatch[1] : "Web";

        if (titulo && link) {
          noticias.push({
            titulo,
            descricao: descricao?.substring(0, 300),
            link,
            fonte,
            data_publicacao: new Date().toISOString(),
          });
        }
      }
    }

    return noticias;
  } catch (error) {
    console.error("Erro no scraping:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const BROWSERLESS_KEY = Deno.env.get("BROWSERLESS_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variáveis do Supabase não configuradas");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let cargo = "concurso público";
    try {
      const body = await req.json();
      if (body?.cargo) cargo = body.cargo;
    } catch {}

    console.log(`🔍 Buscando notícias para cargo: ${cargo}`);

    // Check cache freshness (last 6 hours)
    const seisHorasAtras = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: recentes } = await supabase
      .from("noticias_concursos_cache")
      .select("id")
      .ilike("cargo", `%${cargo}%`)
      .gte("created_at", seisHorasAtras)
      .limit(1);

    if (recentes && recentes.length > 0) {
      console.log("✓ Cache atualizado, pulando scraping");
      return new Response(
        JSON.stringify({ status: "cache_ok", message: "Cache atualizado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!BROWSERLESS_KEY) {
      console.warn("⚠️ BROWSERLESS_API_KEY não configurada");
      return new Response(
        JSON.stringify({ status: "skip", message: "Browserless não configurado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const noticias = await scrapeNoticias(BROWSERLESS_KEY, cargo);
    console.log(`📰 ${noticias.length} notícias encontradas`);

    if (noticias.length > 0) {
      // Dedup by link
      const { data: existentes } = await supabase
        .from("noticias_concursos_cache")
        .select("link")
        .ilike("cargo", `%${cargo}%`);

      const linksExistentes = new Set((existentes || []).map((e: any) => e.link));
      const novas = noticias.filter((n) => !linksExistentes.has(n.link));

      if (novas.length > 0) {
        const inserts = novas.map((n) => ({
          cargo,
          titulo: n.titulo,
          descricao: n.descricao,
          link: n.link,
          fonte: n.fonte,
          data_publicacao: n.data_publicacao,
        }));

        const { error } = await supabase
          .from("noticias_concursos_cache")
          .insert(inserts);

        if (error) console.error("Erro ao inserir notícias:", error);
        else console.log(`✅ ${inserts.length} notícias inseridas`);
      }
    }

    return new Response(
      JSON.stringify({ status: "ok", total: noticias.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
