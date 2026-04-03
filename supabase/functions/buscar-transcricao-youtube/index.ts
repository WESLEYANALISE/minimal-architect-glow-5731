import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchYouTubeTranscript(videoId: string): Promise<Array<{ text: string; start: number; dur: number }>> {
  // Strategy 1: InnerTube API with WEB client + key
  const clients = [
    {
      clientName: "WEB",
      clientVersion: "2.20240101.00.00",
      key: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    },
    {
      clientName: "ANDROID",
      clientVersion: "19.09.37",
      key: "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w",
    },
    {
      clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER",
      clientVersion: "2.0",
      key: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
    },
  ];

  for (const client of clients) {
    console.log(`Trying InnerTube client: ${client.clientName}`);
    const url = `https://www.youtube.com/youtubei/v1/player?key=${client.key}&prettyPrint=false`;
    const body: any = {
      context: {
        client: {
          clientName: client.clientName,
          clientVersion: client.clientVersion,
          hl: "pt",
          gl: "BR",
        },
      },
      videoId,
    };
    
    // TVHTML5 embed client needs thirdParty context
    if (client.clientName === "TVHTML5_SIMPLY_EMBEDDED_PLAYER") {
      body.context.thirdParty = { embedUrl: `https://www.youtube.com/embed/${videoId}` };
    }

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        console.log(`${client.clientName} failed: ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!tracks || tracks.length === 0) {
        console.log(`${client.clientName}: no caption tracks`);
        continue;
      }

      console.log(`${client.clientName}: found ${tracks.length} tracks`);
      const segments = await fetchFromTracks(tracks);
      if (segments.length > 0) return segments;
    } catch (e) {
      console.log(`${client.clientName} error: ${e}`);
    }
  }

  // Strategy 2: Direct timedtext API
  console.log("Trying direct timedtext API...");
  const languages = ["pt", "pt-BR", "en"];
  for (const lang of languages) {
    for (const kind of ["asr", ""]) {
      const params = new URLSearchParams({ v: videoId, lang, ...(kind ? { kind } : {}) });
      try {
        const resp = await fetch(`https://www.youtube.com/api/timedtext?${params}`);
        if (!resp.ok) continue;
        const text = await resp.text();
        if (text.length < 20) continue;
        const segments = parseXML(text);
        if (segments.length > 0) {
          console.log(`Direct API: ${segments.length} segments (${lang}/${kind})`);
          return segments;
        }
      } catch {}
    }
  }

  // Strategy 3: Scrape the YouTube embed page
  console.log("Trying embed page scraping...");
  try {
    const embedResp = await fetch(`https://www.youtube.com/embed/${videoId}`, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (embedResp.ok) {
      const html = await embedResp.text();
      console.log(`Embed page HTML length: ${html.length}`);
      
      // Extract captionTracks from embed page
      const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])(?:,|\})/s);
      if (captionMatch) {
        try {
          const decoded = captionMatch[1].replace(/\\u0026/g, "&").replace(/\\"/g, '"');
          const rawTracks = JSON.parse(decoded);
          console.log(`Embed page: found ${rawTracks.length} caption tracks`);
          const segments = await fetchFromTracks(rawTracks);
          if (segments.length > 0) return segments;
        } catch (e) {
          console.log(`Embed page parse error: ${e}`);
        }
      } else {
        console.log("Embed page: no captionTracks found");
      }
      
      // Try ytInitialPlayerResponse from embed
      const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*;/s);
      if (playerMatch) {
        try {
          const playerData = JSON.parse(playerMatch[1]);
          const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (tracks && tracks.length > 0) {
            console.log(`Embed playerResponse: found ${tracks.length} tracks`);
            const segments = await fetchFromTracks(tracks);
            if (segments.length > 0) return segments;
          }
        } catch {}
      }
    }
  } catch (e) {
    console.log(`Embed page error: ${e}`);
  }

  console.log("No captions available for this video");
  return [];
}

async function fetchFromTracks(tracks: any[]): Promise<Array<{ text: string; start: number; dur: number }>> {
  const selected =
    tracks.find((t: any) => t.languageCode === "pt" && t.kind !== "asr") ||
    tracks.find((t: any) => t.languageCode === "pt") ||
    tracks.find((t: any) => t.languageCode === "pt-BR") ||
    tracks.find((t: any) => t.languageCode === "en") ||
    tracks[0];

  if (!selected?.baseUrl) return [];

  const baseUrl = selected.baseUrl.replace(/\\u0026/g, "&");
  console.log(`Using: ${selected.languageCode} | URL prefix: ${baseUrl.substring(0, 100)}`);

  // Fetch the track (usually returns XML)
  try {
    const resp = await fetch(baseUrl);
    if (!resp.ok) {
      console.log(`Track fetch failed: ${resp.status}`);
      return [];
    }
    const text = await resp.text();
    console.log(`Track response: ${text.length} chars`);
    
    // Parse XML - handle both <text start=...> and <p t=...> formats
    const segments = parseXML(text);
    if (segments.length > 0) {
      console.log(`Parsed ${segments.length} segments from XML`);
      return segments;
    }
  } catch (e) {
    console.log(`Track fetch error: ${e}`);
  }

  return [];
}

function parseXML(text: string): Array<{ text: string; start: number; dur: number }> {
  const segments: Array<{ text: string; start: number; dur: number }> = [];
  
  // Format 1: <text start="..." dur="...">...</text>
  const textMatches = [...text.matchAll(/<text start="([^"]+)" dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g)];
  for (const m of textMatches) {
    const decoded = decodeEntities(m[3]);
    if (decoded) segments.push({ text: decoded, start: parseFloat(m[1]), dur: parseFloat(m[2]) });
  }
  
  // Format 2: <p t="..." d="...">...</p> (milliseconds)
  if (segments.length === 0) {
    const pMatches = [...text.matchAll(/<p t="([^"]+)" d="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)];
    for (const m of pMatches) {
      const decoded = decodeEntities(m[3]);
      if (decoded) segments.push({ text: decoded, start: parseInt(m[1]) / 1000, dur: parseInt(m[2]) / 1000 });
    }
  }
  
  return segments;
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\n/g, " ").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    if (!videoId) {
      return new Response(JSON.stringify({ error: "videoId required", segments: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const segments = await fetchYouTubeTranscript(videoId);
    console.log(`Final: ${segments.length} segments for ${videoId}`);

    return new Response(JSON.stringify({ segments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ segments: [], error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
