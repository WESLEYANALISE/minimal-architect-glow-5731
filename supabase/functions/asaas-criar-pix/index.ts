import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_CONFIG: Record<string, { amount: number; days: number; description: string }> = {
  vitalicio: { amount: 249.90, days: 36500, description: 'Direito Premium - Vitalício (PIX)' },
  anual: { amount: 149.90, days: 365, description: 'Direito Premium - Anual (PIX)' },
  mensal: { amount: 21.90, days: 30, description: 'Direito Premium - Mensal (PIX)' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, planType, conversionSource, amount: overrideAmount, cpf } = await req.json();

    console.log(`[asaas-pix] Criando PIX (venda) - Plano: ${planType}, User: ${userId}, CPF fornecido: ${!!cpf}`);

    if (!userId || !userEmail || !planType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const planConfig = PLAN_CONFIG[planType];
    if (!planConfig) {
      return new Response(
        JSON.stringify({ success: false, error: 'Plano inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '';
    if (!cleanCpf || (cleanCpf.length !== 11 && cleanCpf.length !== 14)) {
      return new Response(
        JSON.stringify({ success: false, error: 'CPF/CNPJ é obrigatório para pagamento via PIX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawApiKey = Deno.env.get('ASAAS_API_KEY') || '';
    const apiKey = rawApiKey.replace(/^["'\s]+|["'\s]+$/g, '').replace(/^Bearer\s+/i, '').replace(/^\$aact_/, '$aact_');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração de pagamento ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isProduction = apiKey.includes('_prod_');
    const ASAAS_API_URL = isProduction
      ? 'https://api.asaas.com/v3'
      : 'https://api-sandbox.asaas.com/v3';

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const finalAmount = overrideAmount || planConfig.amount;
    const planDays = planConfig.days;

    // Buscar perfil do usuário
    let userName = userEmail.split('@')[0];
    try {
      const { data: profile } = await supabase.from('profiles').select('nome').eq('id', userId).maybeSingle();
      if (profile?.nome) userName = profile.nome;
    } catch {}

    // Buscar ou criar customer no Asaas (por email)
    let customerId: string;

    const searchRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(userEmail)}`, {
      headers: { 'access_token': apiKey },
    });
    const searchText = await searchRes.text();
    let found = false;

    if (searchRes.ok && searchText.length > 0) {
      try {
        const searchData = JSON.parse(searchText);
        if (searchData.data?.length > 0) {
          customerId = searchData.data[0].id;
          found = true;
          console.log('[asaas-pix] Cliente encontrado:', customerId);
        }
      } catch {}
    }

    if (!found) {
      const createRes = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, email: userEmail, cpfCnpj: cleanCpf }),
      });
      const createText = await createRes.text();
      if (!createRes.ok) {
        console.error('[asaas-pix] Erro ao criar cliente:', createText);
        throw new Error('Erro ao criar cliente no gateway');
      }
      const createData = JSON.parse(createText);
      customerId = createData.id;
      console.log('[asaas-pix] Cliente criado com CPF:', customerId);
    } else {
      console.log('[asaas-pix] Atualizando CPF do cliente existente:', customerId!);
      const updateRes = await fetch(`${ASAAS_API_URL}/customers/${customerId!}`, {
        method: 'PUT',
        headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpfCnpj: cleanCpf }),
      });
      const updateText = await updateRes.text();
      console.log(`[asaas-pix] Update CPF response: ${updateRes.status} - ${updateText.substring(0, 200)}`);
    }

    // Criar pagamento avulso (venda) com PIX
    const dueDate = new Date();
    dueDate.setMinutes(dueDate.getMinutes() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const paymentBody = {
      customer: customerId!,
      billingType: 'PIX',
      value: finalAmount,
      dueDate: dueDateStr,
      description: planConfig.description,
      externalReference: `${userId}|${planType}`,
    };

    console.log('[asaas-pix] Criando pagamento PIX...', JSON.stringify({ value: finalAmount, planType }));

    const payRes = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentBody),
    });
    const payText = await payRes.text();
    console.log(`[asaas-pix] Payment response: ${payRes.status}, body: ${payText.substring(0, 500)}`);

    let payData: any;
    try {
      payData = JSON.parse(payText);
    } catch {
      throw new Error('Resposta inválida do gateway de pagamento');
    }

    if (!payRes.ok) {
      const errorMsg = payData.errors?.[0]?.description || 'Erro ao criar pagamento PIX';
      throw new Error(errorMsg);
    }

    // Buscar QR Code PIX
    const pixRes = await fetch(`${ASAAS_API_URL}/payments/${payData.id}/pixQrCode`, {
      headers: { 'access_token': apiKey },
    });
    const pixText = await pixRes.text();
    console.log(`[asaas-pix] PIX QR response: ${pixRes.status}`);

    let pixInfo: any = {};
    if (pixRes.ok) {
      try {
        pixInfo = JSON.parse(pixText);
      } catch {}
    }

    // Criar subscription pending no Supabase
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + planDays);

    const insertData: Record<string, unknown> = {
      user_id: userId,
      status: 'pending',
      plan_type: planType,
      amount: finalAmount,
      mp_payment_id: payData.id,
      mp_payer_email: userEmail,
      payment_method: 'pix',
      expiration_date: expirationDate.toISOString(),
    };
    if (conversionSource) insertData.conversion_source = conversionSource;

    await supabase.from('subscriptions').insert(insertData);

    // Log attempt
    try {
      await supabase.from('payment_attempts').insert({
        user_id: userId,
        user_email: userEmail,
        plan_type: planType,
        amount: finalAmount,
        payment_method: 'pix',
        mp_payment_id: payData.id,
        mp_status: payData.status || 'PENDING',
        mp_status_detail: 'pix_generated',
      });
    } catch {}

    // Expiração do QR Code (10 minutos)
    const qrExpiry = new Date();
    qrExpiry.setMinutes(qrExpiry.getMinutes() + 10);

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: payData.id,
        qrCodeBase64: pixInfo.encodedImage || '',
        qrCode: pixInfo.payload || '',
        expiresAt: pixInfo.expirationDate || qrExpiry.toISOString(),
        amount: finalAmount,
        planType,
        planDays,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[asaas-pix] Erro:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
