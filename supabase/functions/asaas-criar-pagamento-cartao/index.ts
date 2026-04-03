import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLANS: Record<string, { amount: number; days: number; description: string; cycle: string }> = {
  mensal: { amount: 21.90, days: 30, description: 'Direito Premium - Mensal', cycle: 'MONTHLY' },
  anual: { amount: 149.90, days: 365, description: 'Direito Premium - Anual', cycle: 'YEARLY' },
  vitalicio: { amount: 249.90, days: 36500, description: 'Direito Premium - Vitalício', cycle: 'YEARLY' },
};

async function getOrCreateCustomer(apiKey: string, baseUrl: string, name: string, email: string, cpf: string, phone?: string): Promise<string> {
  console.log('[asaas-cartao] Buscando cliente por CPF...');
  const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cpf}`, {
    headers: { 'access_token': apiKey },
  });
  
  const searchText = await searchRes.text();
  console.log(`[asaas-cartao] Search response status: ${searchRes.status}, body length: ${searchText.length}`);
  
  if (searchRes.status === 404 || searchText.length === 0) {
    console.log('[asaas-cartao] Cliente não encontrado (404/empty), criando novo...');
  } else if (!searchRes.ok) {
    console.error('[asaas-cartao] Erro ao buscar cliente:', searchText);
    throw new Error(`Erro ao buscar cliente (${searchRes.status}): ${searchText.substring(0, 200)}`);
  } else {
    try {
      const searchData = JSON.parse(searchText);
      if (searchData.data && searchData.data.length > 0) {
        console.log('[asaas-cartao] Cliente encontrado:', searchData.data[0].id);
        return searchData.data[0].id;
      }
    } catch (e) {
      console.warn('[asaas-cartao] Erro ao parsear resposta da busca, criando novo cliente:', e);
    }
  }

  console.log('[asaas-cartao] Criando novo cliente...');
  const createRes = await fetch(`${baseUrl}/customers`, {
    method: 'POST',
    headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name || email.split('@')[0],
      email,
      cpfCnpj: cpf,
      phone: phone || undefined,
    }),
  });
  
  const createText = await createRes.text();
  console.log(`[asaas-cartao] Create response status: ${createRes.status}`);

  if (!createRes.ok) {
    console.error('[asaas-cartao] Erro ao criar cliente:', createText);
    throw new Error(`Erro ao criar cliente: ${createText.substring(0, 200)}`);
  }

  const createData = JSON.parse(createText);
  return createData.id;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      userId, userEmail, planType,
      cardNumber, cardholderName, expiryMonth, expiryYear, ccv,
      cpf, cep, addressNumber, conversionSource, phone: phoneOverride, remoteIp: clientRemoteIp,
    } = await req.json();

    const remoteIp = clientRemoteIp
      || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || req.headers.get('x-real-ip')
      || undefined;
    console.log(`[asaas-cartao] Remote IP resolved: ${remoteIp || 'none'}`);

    console.log(`[asaas-cartao] Processando RECORRÊNCIA - Plano: ${planType}, User: ${userId}`);

    if (!userId || !userEmail || !planType || !cardNumber || !cardholderName || !expiryMonth || !expiryYear || !ccv || !cpf) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plan = { ...PLANS[planType] };
    if (!plan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Plano inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    const rawApiKey = Deno.env.get('ASAAS_API_KEY') || '';
    const apiKey = rawApiKey.replace(/^["'\s]+|["'\s]+$/g, '').replace(/^Bearer\s+/i, '').replace(/^\$aact_/, '$aact_');
    console.log(`[asaas-cartao] API Key cleaned length: ${apiKey.length}, starts with: ${apiKey.substring(0, 15)}...`);

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
    console.log(`[asaas-cartao] Ambiente: ${isProduction ? 'PRODUÇÃO' : 'SANDBOX'}, URL: ${ASAAS_API_URL}`);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const basePlanType = planType.replace(/_semestral|_anual/, '');

    // Get user profile data
    let userName = cardholderName;
    let userPhone = phoneOverride || null;
    try {
      const { data: profile } = await supabase.from('profiles').select('nome, telefone').eq('id', userId).maybeSingle();
      if (profile) {
        userName = profile.nome || cardholderName;
        if (!userPhone) userPhone = profile.telefone || null;
      }
    } catch {}

    // Get or create customer
    const customerId = await getOrCreateCustomer(apiKey, ASAAS_API_URL, userName, userEmail, cpf, userPhone);

    // === ASSINATURA RECORRENTE via POST /subscriptions ===
    const nextDueDate = new Date().toISOString().split('T')[0];

    const phoneForHolder = (() => {
      const raw = (userPhone || phoneOverride || '').replace(/\D/g, '');
      const local = raw.startsWith('55') && raw.length > 10 ? raw.slice(2) : raw;
      return local.length >= 10 ? local : undefined;
    })();

    const subscriptionBody: Record<string, unknown> = {
      customer: customerId,
      billingType: 'CREDIT_CARD',
      value: plan.amount,
      cycle: plan.cycle,
      nextDueDate,
      description: plan.description,
      externalReference: `${userId}|${basePlanType}`,
      creditCard: {
        holderName: cardholderName,
        number: cardNumber,
        expiryMonth,
        expiryYear,
        ccv,
      },
      creditCardHolderInfo: {
        name: cardholderName,
        email: userEmail,
        cpfCnpj: cpf,
        ...(cep ? { postalCode: cep.replace(/\D/g, '') } : {}),
        addressNumber: addressNumber || 'S/N',
        ...(phoneForHolder ? { phone: phoneForHolder } : {}),
      },
      ...(remoteIp ? { remoteIp } : {}),
    };

    console.log('[asaas-cartao] Criando assinatura recorrente no Asaas...', JSON.stringify({ cycle: plan.cycle, value: plan.amount }));

    const subRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionBody),
    });
    const subText = await subRes.text();
    console.log(`[asaas-cartao] Subscription response status: ${subRes.status}, body: ${subText.substring(0, 500)}`);
    
    let subData: any;
    try {
      subData = JSON.parse(subText);
    } catch {
      console.error('[asaas-cartao] Resposta não-JSON da API:', subText.substring(0, 300));
      return new Response(
        JSON.stringify({ success: false, error: 'Erro na comunicação com o gateway de pagamento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log attempt
    try {
      await supabase.from('payment_attempts').insert({
        user_id: userId,
        user_email: userEmail,
        plan_type: basePlanType,
        amount: plan.amount,
        payment_method: 'credit_card',
        mp_payment_id: subData.id || null,
        mp_status: subData.status || String(subRes.status),
        mp_status_detail: subData.status || null,
        error_message: !subRes.ok
          ? (subData.errors?.[0]?.description || subData.status || 'Erro desconhecido')
          : null,
        installments: 1,
      });
    } catch (e) { console.error('Erro ao logar tentativa:', e); }

    if (!subRes.ok) {
      const errorMsg = subData.errors?.[0]?.description || 'Erro ao processar pagamento';
      console.error('[asaas-cartao] Erro Asaas:', JSON.stringify(subData));
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Subscription created successfully — Asaas returns status ACTIVE when first payment is confirmed
    const isActive = subData.status === 'ACTIVE';

    // Calculate next_payment_date based on cycle
    const nextPayment = new Date();
    if (plan.cycle === 'MONTHLY') nextPayment.setMonth(nextPayment.getMonth() + 1);
    else if (plan.cycle === 'SEMIANNUALLY') nextPayment.setMonth(nextPayment.getMonth() + 6);
    else if (plan.cycle === 'YEARLY') nextPayment.setFullYear(nextPayment.getFullYear() + 1);

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + plan.days);

    if (isActive) {
      const insertData: Record<string, unknown> = {
        user_id: userId,
        status: 'authorized',
        plan_type: basePlanType,
        amount: plan.amount,
        mp_payment_id: subData.id,
        mp_preapproval_id: subData.id, // Asaas subscription ID for recurring billing
        mp_payer_email: userEmail,
        payment_method: 'credit_card',
        expiration_date: expirationDate.toISOString(),
        last_payment_date: new Date().toISOString(),
        next_payment_date: nextPayment.toISOString(),
      };
      if (conversionSource) insertData.conversion_source = conversionSource;

      const { error: insertError } = await supabase.from('subscriptions').insert(insertData);

      if (!insertError) {
        try {
          await supabase.functions.invoke('evelyn-notificar-pagamento', {
            body: { userId, planType: basePlanType, amount: plan.amount, paymentMethod: 'card', expirationDate: expirationDate.toISOString(), installments: 1, totalAmount: plan.amount }
          });
        } catch {}

        try {
          const { data: profileData } = await supabase.from('profiles').select('nome, email, telefone').eq('id', userId).maybeSingle();
          await supabase.functions.invoke('notificar-admin-whatsapp', {
            body: { tipo: 'novo_premium', dados: { userId, nome: profileData?.nome || '', email: profileData?.email || userEmail, telefone: profileData?.telefone || 'Não informado', plano: basePlanType, valor: plan.amount, payment_method: 'card (recorrente)' } }
          });
        } catch {}
      }

      return new Response(
        JSON.stringify({ success: true, paymentId: subData.id, status: 'approved', message: 'Pagamento aprovado! Cobrança recorrente ativada.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If subscription is created but payment is pending
    if (subData.status === 'PENDING' || subData.status === 'ACTIVE') {
      const insertPending: Record<string, unknown> = {
        user_id: userId, status: 'pending', plan_type: basePlanType, amount: plan.amount,
        mp_payment_id: subData.id, mp_preapproval_id: subData.id,
        mp_payer_email: userEmail, payment_method: 'credit_card',
        expiration_date: expirationDate.toISOString(), last_payment_date: new Date().toISOString(),
        next_payment_date: nextPayment.toISOString(),
      };
      if (conversionSource) insertPending.conversion_source = conversionSource;
      await supabase.from('subscriptions').insert(insertPending);

      return new Response(
        JSON.stringify({ success: true, paymentId: subData.id, status: 'pending', message: 'Pagamento em análise.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rejected / other status
    const errorMsg = subData.errors?.[0]?.description || 'Pagamento não aprovado. Tente outro cartão.';
    return new Response(
      JSON.stringify({ success: false, error: errorMsg, status: subData.status }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[asaas-cartao] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno ao processar pagamento' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});