import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'stats';

    if (action === 'stats') {
      // Estatísticas gerais de dispositivos
      const { data: allDevices, error } = await supabase
        .from('dispositivos_fcm')
        .select('id, ativo, device_info, created_at, updated_at');

      if (error) throw error;

      const devices = allDevices || [];
      const total = devices.length;
      const ativos = devices.filter(d => d.ativo).length;
      const inativos = total - ativos;

      // Breakdown por plataforma
      const plataformas: Record<string, number> = { web: 0, android: 0, ios: 0, outro: 0 };
      for (const d of devices) {
        if (!d.ativo) continue;
        const info = d.device_info as any;
        const p = info?.plataforma || 'web';
        if (p === 'android') plataformas.android++;
        else if (p === 'ios') plataformas.ios++;
        else if (p === 'web') plataformas.web++;
        else plataformas.outro++;
      }

      // Últimos envios
      const { data: envios } = await supabase
        .from('notificacoes_push_enviadas')
        .select('id, titulo, total_sucesso, total_falha, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      return new Response(
        JSON.stringify({
          dispositivos: { total, ativos, inativos, plataformas },
          ultimosEnvios: envios || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check-token') {
      // Verificar info de um token via Firebase IID API
      const body = await req.json();
      const { token } = body;

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
      if (!serviceAccountJson) {
        return new Response(
          JSON.stringify({ error: 'Firebase não configurado' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const serviceAccount = JSON.parse(serviceAccountJson);
      const accessToken = await getAccessToken(serviceAccount);

      const iidResponse = await fetch(
        `https://iid.googleapis.com/iid/info/${token}?details=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'access_token_auth': 'true',
          },
        }
      );

      if (iidResponse.ok) {
        const info = await iidResponse.json();
        return new Response(
          JSON.stringify({ success: true, info }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const errorText = await iidResponse.text();
        return new Response(
          JSON.stringify({ success: false, error: errorText }),
          { status: iidResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// JWT signing for OAuth2
async function createSignedJWT(serviceAccount: any): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${payloadB64}`;

  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(signatureInput));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signatureInput}.${signatureB64}`;
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createSignedJWT(serviceAccount);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao obter access token: ${error}`);
  }
  const data = await response.json();
  return data.access_token;
}
