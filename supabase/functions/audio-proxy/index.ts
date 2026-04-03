import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type, Authorization",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Content-Type, Accept-Ranges",
};

/** Detect content type from URL extension */
function guessContentType(url: string): string {
  const path = new URL(url).pathname.toLowerCase();
  if (path.endsWith(".mp4")) return "video/mp4";
  if (path.endsWith(".webm")) return "video/webm";
  if (path.endsWith(".ogg")) return "audio/ogg";
  if (path.endsWith(".wav")) return "audio/wav";
  if (path.endsWith(".m4a")) return "audio/mp4";
  if (path.endsWith(".mp3")) return "audio/mpeg";
  return "application/octet-stream";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const audioUrl = url.searchParams.get("url");

  if (!audioUrl) {
    return new Response("Missing url parameter", { status: 400, headers: corsHeaders });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(audioUrl);
  } catch {
    return new Response("Invalid URL", { status: 400, headers: corsHeaders });
  }

  const allowedHosts = [
    "dl.dropboxusercontent.com",
    "www.dropbox.com",
    "dropbox.com",
  ];

  if (!allowedHosts.some((h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith("." + h))) {
    return new Response("URL host not allowed", { status: 403, headers: corsHeaders });
  }

  // Normalize Dropbox URL for streaming
  // For /scl/ links, keep original host (www.dropbox.com) with dl=1 — fetch follows redirects
  // For legacy /s/ links, transform to dl.dropboxusercontent.com
  let streamUrl = audioUrl;
  if (streamUrl.includes("dropbox.com")) {
    // Ensure dl=1 for direct download
    streamUrl = streamUrl.replace(/([?&])dl=0/, "$1dl=1");
    if (!streamUrl.includes("dl=1") && !streamUrl.includes("raw=1")) {
      streamUrl += (streamUrl.includes("?") ? "&" : "?") + "dl=1";
    }
    // Only transform hostname for legacy /s/ links, not /scl/ links
    if (!streamUrl.includes("/scl/")) {
      streamUrl = streamUrl
        .replace("www.dropbox.com", "dl.dropboxusercontent.com")
        .replace(/([?&])dl=1/, "$1raw=1");
    }
  }

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (compatible; AudioProxy/1.0)",
  };
  const range = req.headers.get("Range");
  if (range) {
    headers["Range"] = range;
  }

  try {
    const upstream = await fetch(streamUrl, { headers });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
        headers: corsHeaders,
      });
    }

    const responseHeaders = new Headers(corsHeaders);
    const forward = ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"];
    for (const h of forward) {
      const v = upstream.headers.get(h);
      if (v) responseHeaders.set(h, v);
    }

    // Only override Content-Type if upstream didn't provide a valid media type
    const ct = responseHeaders.get("Content-Type") || "";
    if (!ct.startsWith("audio/") && !ct.startsWith("video/")) {
      responseHeaders.set("Content-Type", guessContentType(streamUrl));
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(`Proxy error: ${err}`, { status: 502, headers: corsHeaders });
  }
});
