import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getGoogleAccessToken(credentialsJson: string): Promise<string> {
  const credentials = JSON.parse(credentialsJson);
  const now = Math.floor(Date.now() / 1000);
  
  // Create JWT header and claim set
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Base64url encode
  const b64url = (obj: unknown) => {
    const json = JSON.stringify(obj);
    const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerB64 = b64url(header);
  const claimB64 = b64url(claimSet);
  const signInput = `${headerB64}.${claimB64}`;

  // Import private key and sign
  const pemContent = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${signInput}.${sigB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

function pcmToWavBase64(pcmBase64: string, sampleRate = 24000, channels = 1, bitsPerSample = 16): string {
  const pcmBytes = Uint8Array.from(atob(pcmBase64), c => c.charCodeAt(0));
  const dataSize = pcmBytes.length;
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeStr = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true);
  view.setUint16(32, channels * bitsPerSample / 8, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  const wav = new Uint8Array(44 + dataSize);
  wav.set(new Uint8Array(header), 0);
  wav.set(pcmBytes, 44);
  let bin = "";
  for (let i = 0; i < wav.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, Array.from(wav.subarray(i, i + 0x8000)));
  }
  return btoa(bin);
}

async function generateGeminiTTS(texto: string, modelo: string, voiceName: string = "Kore"): Promise<{ audio: string; voice: string; mimeType: string }> {
  const keys = [Deno.env.get("GEMINI_KEY_1"), Deno.env.get("GEMINI_KEY_2")].filter(Boolean);
  const apiKey = keys[Math.floor(Math.random() * keys.length)];
  
  const modelName = modelo === "gemini-flash-tts" 
    ? "gemini-2.5-flash-preview-tts" 
    : "gemini-2.5-pro-preview-tts";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `Leia o seguinte texto em português brasileiro com tom profissional e claro:\n\n${texto}` }] 
        }],
        generationConfig: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            }
          }
        }
      }),
    }
  );

  const data = await res.json();
  
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }

  const audioPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!audioPart) {
    throw new Error("Nenhum áudio retornado pelo Gemini");
  }

  // Gemini returns raw PCM (audio/L16;rate=24000) - convert to WAV
  const wavBase64 = pcmToWavBase64(audioPart.inlineData.data, 24000);

  return { 
    audio: wavBase64, 
    voice: voiceName,
    mimeType: "audio/wav"
  };
}

async function generateGoogleCloudTTS(
  texto: string, 
  voiceName: string, 
  languageCode: string
): Promise<{ audio: string; voice: string }> {
  const credentials = Deno.env.get("GOOGLE_CLOUD_TTS_CREDENTIALS");
  if (!credentials) {
    throw new Error("GOOGLE_CLOUD_TTS_CREDENTIALS não configurado. Adicione a Service Account JSON nos secrets.");
  }

  const accessToken = await getGoogleAccessToken(credentials);

  const body: any = {
    input: { text: texto },
    voice: { languageCode, name: voiceName },
    audioConfig: { audioEncoding: "MP3", speakingRate: 1.0, pitch: 0 },
  };

  // Chirp 3 HD needs different endpoint and config
  if (voiceName.includes("Chirp3")) {
    body.audioConfig = { audioEncoding: "LINEAR16", speakingRate: 1.0 };
  }

  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }

  if (!data.audioContent) {
    throw new Error("Nenhum áudio retornado pela Google Cloud TTS");
  }

  return { audio: data.audioContent, voice: voiceName };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto, modelo, voz } = await req.json();

    if (!texto || !modelo) {
      return new Response(
        JSON.stringify({ error: "texto e modelo são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startTime = Date.now();
    let result: { audio: string; voice: string; mimeType?: string };

    switch (modelo) {
      case "gemini-flash-tts":
      case "gemini-pro-tts":
        result = await generateGeminiTTS(texto, modelo, voz || "Kore");
        break;
      case "chirp3-hd":
        result = await generateGoogleCloudTTS(texto, "pt-BR-Chirp3-HD-Achernar", "pt-BR");
        break;
      case "wavenet":
        result = await generateGoogleCloudTTS(texto, "pt-BR-Wavenet-A", "pt-BR");
        break;
      case "neural2":
        result = await generateGoogleCloudTTS(texto, "pt-BR-Neural2-A", "pt-BR");
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Modelo desconhecido: ${modelo}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const elapsed = Date.now() - startTime;
    const audioSizeKB = Math.round((result.audio.length * 3) / 4 / 1024);

    const mimeType = result.mimeType || (modelo.startsWith("gemini") ? "audio/wav" : "audio/mpeg");

    return new Response(
      JSON.stringify({
        audio_base64: result.audio,
        modelo,
        voz: result.voice,
        tempo_ms: elapsed,
        tamanho_kb: audioSizeKB,
        mime_type: mimeType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro teste-voz:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
