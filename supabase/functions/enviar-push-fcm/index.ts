import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function createSignedJWT(serviceAccount: any): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${payloadB64}`;
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
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
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao obter access token: ${error}`);
  }
  const data = await response.json();
  return data.access_token;
}

function buildMessage(
  target: { topic?: string; token?: string },
  notification: { titulo: string; mensagem: string; link?: string; imagem_url?: string; cor?: string; icone_url?: string; notification_id?: string }
) {
  const iconUrl = notification.icone_url || '/logo.webp';
  const color = notification.cor || '#7C3AED';

  const msg: any = {
    notification: {
      title: notification.titulo,
      body: notification.mensagem,
      image: notification.imagem_url || undefined
    },
    data: {
      link: notification.link || '/',
      timestamp: new Date().toISOString(),
      cor: color,
      icone_url: iconUrl,
      notification_id: notification.notification_id || ''
    },
    webpush: {
      notification: {
        icon: iconUrl,
        badge: '/logo.webp',
        vibrate: [200, 100, 200],
        requireInteraction: true
      },
      fcm_options: { link: notification.link || '/' }
    },
    android: {
      notification: {
        icon: 'ic_notification',
        color: color,
        click_action: 'OPEN_APP'
      }
    }
  };

  if (target.topic) msg.topic = target.topic;
  if (target.token) msg.token = target.token;

  return { message: msg };
}

async function sendFCM(
  accessToken: string,
  projectId: string,
  messageBody: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageBody)
      }
    );
    if (response.ok) {
      const data = await response.json();
      return { success: true, messageId: data.name };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { titulo, mensagem, link, imagem_url, cor, icone_url } = await req.json();
    
    console.log('=== ENVIAR PUSH FCM (DUPLO) ===');
    console.log('Título:', titulo);
    
    if (!titulo || !mensagem) {
      return new Response(
        JSON.stringify({ error: 'Título e mensagem são obrigatórios' }),
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
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Obter user_id do auth header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    // Contar dispositivos ativos
    const { data: dispositivos } = await supabase
      .from('dispositivos_fcm')
      .select('fcm_token')
      .eq('ativo', true);
    const totalTokens = dispositivos?.length || 0;

    // SALVAR PRIMEIRO para obter o notification_id
    const { data: insertedRecord } = await supabase
      .from('notificacoes_push_enviadas')
      .insert({
        titulo,
        mensagem,
        link,
        imagem_url,
        total_enviados: totalTokens + 1,
        total_sucesso: 0,
        total_falha: 0,
        enviado_por: userId
      })
      .select('id')
      .single();
    
    const notificationId = insertedRecord?.id || '';
    console.log('Notification ID:', notificationId);

    const notif = { titulo, mensagem, link, imagem_url, cor, icone_url, notification_id: notificationId };

    // === ENVIO DUPLO: tópico + tokens individuais ===
    
    // 1. Enviar para tópico "all"
    const topicMsg = buildMessage({ topic: 'all' }, notif);
    const topicResult = await sendFCM(accessToken, serviceAccount.project_id, topicMsg);
    console.log(`Topic "all": ${topicResult.success ? 'sucesso' : 'falha'}`, topicResult.messageId || topicResult.error);

    // 2. Enviar para tokens individuais do banco (fallback)
    let tokenSucesso = 0;
    let tokenFalha = 0;
    const tokensInvalidos: string[] = [];

    if (dispositivos && dispositivos.length > 0) {
      console.log(`Enviando para ${dispositivos.length} tokens individuais...`);
      
      for (const d of dispositivos) {
        const tokenMsg = buildMessage({ token: d.fcm_token }, notif);
        const result = await sendFCM(accessToken, serviceAccount.project_id, tokenMsg);
        
        if (result.success) {
          tokenSucesso++;
        } else {
          tokenFalha++;
          if (result.error?.includes('UNREGISTERED') || result.error?.includes('INVALID')) {
            tokensInvalidos.push(d.fcm_token);
          }
        }
      }

      // Desativar tokens inválidos
      if (tokensInvalidos.length > 0) {
        await supabase
          .from('dispositivos_fcm')
          .update({ ativo: false })
          .in('fcm_token', tokensInvalidos);
        console.log(`${tokensInvalidos.length} tokens inválidos desativados`);
      }
    }

    const resultMessage = `Broadcast: ${topicResult.success ? '✅' : '❌'} | Tokens: ${tokenSucesso}/${totalTokens} sucesso`;
    console.log(resultMessage);

    // Atualizar registro com contagens reais
    await supabase
      .from('notificacoes_push_enviadas')
      .update({
        total_sucesso: (topicResult.success ? 1 : 0) + tokenSucesso,
        total_falha: (topicResult.success ? 0 : 1) + tokenFalha,
      })
      .eq('id', notificationId);
    
    return new Response(
      JSON.stringify({
        sucesso: (topicResult.success ? 1 : 0) + tokenSucesso,
        falha: (topicResult.success ? 0 : 1) + tokenFalha,
        total: totalTokens + 1,
        topicSuccess: topicResult.success,
        topicMessageId: topicResult.messageId,
        tokensSucesso: tokenSucesso,
        tokensFalha: tokenFalha,
        tokensTotal: totalTokens,
        tokensInvalidados: tokensInvalidos.length,
        mensagem: resultMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
