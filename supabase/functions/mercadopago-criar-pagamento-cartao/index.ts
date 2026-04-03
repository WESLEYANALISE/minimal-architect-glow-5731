import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Esta função foi descontinuada. O checkout de cartão agora usa o Asaas.
// Usuários com cache antigo do PWA ainda podem chamar esta função,
// então retornamos um erro amigável pedindo para atualizar o app.

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[mercadopago-criar-pagamento-cartao] DEPRECATED - Chamada recebida de cache antigo');

  try {
    const body = await req.json();
    console.log(`[DEPRECATED] User: ${body.userId}, Plan: ${body.planType}`);
  } catch {}

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Atualize o aplicativo para continuar. Feche e abra novamente o app.',
      requiresUpdate: true,
    }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
