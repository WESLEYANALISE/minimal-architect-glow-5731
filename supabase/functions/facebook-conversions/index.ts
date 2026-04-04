import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PIXEL_ID = "2069588673817892";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeAccessToken(token: string | undefined): string | null {
  const normalized = token?.trim();
  return normalized ? normalized : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const accessToken = normalizeAccessToken(
      Deno.env.get("FACEBOOK_CONVERSIONS_API_TOKEN"),
    );

    if (!accessToken) {
      console.error("FACEBOOK_CONVERSIONS_API_TOKEN não configurado");
      return jsonResponse({
        success: false,
        skipped: true,
        error: "FACEBOOK_CONVERSIONS_API_TOKEN não configurado",
      });
    }

    let payload: {
      event_name?: string;
      event_id?: string;
      user_data?: Record<string, unknown>;
      custom_data?: Record<string, unknown>;
      event_source_url?: string;
      action_source?: string;
      test_event_code?: string;
    };

    try {
      payload = await req.json();
    } catch {
      return jsonResponse({
        success: false,
        skipped: true,
        error: "Payload JSON inválido",
      });
    }

    const {
      event_name,
      event_id,
      user_data,
      custom_data,
      event_source_url,
      action_source,
      test_event_code,
    } = payload;

    if (!event_name) {
      return jsonResponse({
        success: false,
        skipped: true,
        error: "event_name é obrigatório",
      });
    }

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const hashedUserData: Record<string, string> = {};
    const hashableFields = ["em", "ph", "fn", "ln", "ct", "st", "zp", "country", "db", "ge", "external_id"];

    if (user_data && typeof user_data === "object" && !Array.isArray(user_data)) {
      for (const [key, value] of Object.entries(user_data)) {
        if (typeof value !== "string" || !value.trim()) continue;

        if (hashableFields.includes(key)) {
          hashedUserData[key] = await hashSHA256(value);
        } else {
          hashedUserData[key] = value;
        }
      }
    }

    if (clientIp !== "unknown") {
      hashedUserData.client_ip_address = clientIp;
    }

    if (!hashedUserData.client_user_agent) {
      hashedUserData.client_user_agent = req.headers.get("user-agent") || "unknown";
    }

    const eventData = {
      data: [
        {
          event_name,
          event_id: event_id || undefined,
          event_time: Math.floor(Date.now() / 1000),
          action_source: action_source || "website",
          event_source_url: event_source_url || undefined,
          user_data: hashedUserData,
          custom_data: custom_data || undefined,
        },
      ],
      ...(test_event_code ? { test_event_code } : {}),
    };

    const url = new URL(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events`);
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });

    const rawResult = await response.text();
    let result: unknown = {};

    try {
      result = rawResult ? JSON.parse(rawResult) : {};
    } catch {
      result = { raw: rawResult };
    }

    if (!response.ok) {
      console.error("Facebook API error:", rawResult);
      return jsonResponse({
        success: false,
        skipped: true,
        provider: "facebook",
        status: response.status,
        error: `Facebook API error [${response.status}]`,
        details: result,
      });
    }

    console.log("Facebook event sent:", event_name, rawResult);

    return jsonResponse({ success: true, ...(typeof result === "object" && result !== null ? result : { result }) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Unexpected facebook-conversions error:", message);

    return jsonResponse({
      success: false,
      skipped: true,
      error: message,
    });
  }
});