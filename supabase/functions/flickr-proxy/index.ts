import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FLICKR_BASE = "https://api.flickr.com/services/rest/";

const ALLOWED_METHODS = [
  "flickr.people.findByUsername",
  "flickr.people.getPhotos",
  "flickr.people.getInfo",
  "flickr.people.getPublicPhotos",
  "flickr.photos.search",
  "flickr.photos.getInfo",
  "flickr.photos.getSizes",
  "flickr.photosets.getList",
  "flickr.photosets.getPhotos",
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FLICKR_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "FLICKR_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { method, params } = await req.json();

    if (!method || !ALLOWED_METHODS.includes(method)) {
      return new Response(JSON.stringify({ error: `Method not allowed: ${method}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(FLICKR_BASE);
    url.searchParams.set("method", method);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("nojsoncallback", "1");

    if (params && typeof params === "object") {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
