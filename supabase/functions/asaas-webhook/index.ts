import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_DAYS: Record<string, number> = {
  mensal: 30,
  essencial: 30,
  pro: 30,
  trimestral: 90,
  semestral: 180,
  anual: 365,
  anual_oferta: 365,
  vitalicio: 36500,
};

const PLAN_CYCLES: Record<string, string> = {
  mensal: 'MONTHLY',
  essencial: 'MONTHLY',
  pro: 'MONTHLY',
  semestral: 'SEMIANNUALLY',
  anual: 'YEARLY',
  vitalicio: 'YEARLY',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('[asaas-webhook] Webhook recebido:', JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const event = body.event;
    const payment = body.payment;

    if (!payment?.id) {
      console.log('[asaas-webhook] Sem payment ID no evento');
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === PAYMENT_OVERDUE: cartão falhou na renovação ===
    if (event === 'PAYMENT_OVERDUE') {
      const externalRef = payment.externalReference;
      if (externalRef && externalRef.includes('|') && !externalRef.startsWith('whatsapp|')) {
        const [userId, planType] = externalRef.split('|');
        console.log('[asaas-webhook] PAYMENT_OVERDUE - cartão falhou para:', userId, planType);

        // Marcar assinatura como expirada
        const { data: activeSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .in('status', ['authorized', 'active', 'approved'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeSub) {
          await supabase.from('subscriptions').update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          }).eq('id', activeSub.id);
          console.log('[asaas-webhook] Assinatura marcada como expired:', activeSub.id);

          // Notificar admin sobre falha
          try {
            const { data: profileData } = await supabase.from('profiles').select('nome, email').eq('id', userId).maybeSingle();
            await supabase.functions.invoke('notificar-admin-whatsapp', {
              body: {
                tipo: 'pagamento_falhou',
                dados: { userId, nome: profileData?.nome || '', email: profileData?.email || '', plano: planType }
              }
            });
          } catch {}
        }
      }

      return new Response(
        JSON.stringify({ success: true, handled: 'PAYMENT_OVERDUE' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process confirmed/received payments
    const isConfirmed = event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED';

    if (!isConfirmed) {
      console.log(`[asaas-webhook] Evento ignorado: ${event}, payment: ${payment.id}`);
      return new Response(
        JSON.stringify({ received: true, skipped: true, reason: event }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentId = payment.id;
    const externalRef = payment.externalReference;

    if (!externalRef || !externalRef.includes('|')) {
      console.log('[asaas-webhook] externalReference inválido:', externalRef);
      return new Response(JSON.stringify({ received: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle WhatsApp payments
    if (externalRef.startsWith('whatsapp|')) {
      const [, telefone, planType] = externalRef.split('|');
      console.log('[asaas-webhook] Pagamento WhatsApp confirmado:', telefone, planType);

      const days = PLAN_DAYS[planType] || 30;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);

      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id, user_id')
        .eq('mp_payment_id', paymentId)
        .maybeSingle();

      if (existingSub) {
        await supabase.from('subscriptions').update({
          status: 'authorized',
          last_payment_date: new Date().toISOString(),
          expiration_date: expirationDate.toISOString(),
          payment_method: payment.billingType === 'PIX' ? 'pix' : 'credit_card',
          updated_at: new Date().toISOString(),
        }).eq('id', existingSub.id);
      }

      await supabase.from('evelyn_usuarios').update({
        autorizado: true,
        periodo_teste_expirado: false,
        aviso_teste_enviado: false,
      }).eq('telefone', telefone);

      // Send WhatsApp confirmation
      try {
        const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
        const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
        const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';

        if (evolutionUrl && evolutionKey) {
          await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
            body: JSON.stringify({
              number: `${telefone}@s.whatsapp.net`,
              text: `🎉 *Pagamento Confirmado!*\n\nSua assinatura *Direito Premium* foi ativada com sucesso!\n\n📅 Válida até: ${expirationDate.toLocaleDateString('pt-BR')}\n\nAgora você tem acesso ilimitado! 💜`,
            }),
          });
        }
      } catch (e) { console.error('[asaas-webhook] Erro WhatsApp:', e); }

    } else {
      // App payment (userId|planType)
      const [userId, planType] = externalRef.split('|');
      console.log('[asaas-webhook] Pagamento app confirmado:', userId, planType);

      const days = PLAN_DAYS[planType] || 30;
      const isPix = payment.billingType === 'PIX';

      // === RENOVAÇÃO RECORRENTE: verificar se já tem assinatura authorized ===
      const { data: authorizedSub } = await supabase
        .from('subscriptions')
        .select('id, mp_preapproval_id, plan_type, expiration_date, created_at')
        .eq('user_id', userId)
        .in('status', ['authorized', 'active', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (authorizedSub) {
        // Verificar se a assinatura foi criada há menos de 5 minutos (evitar duplicação com criação inicial)
        const createdAt = new Date(authorizedSub.created_at || 0);
        const minutesSinceCreation = (Date.now() - createdAt.getTime()) / 60000;
        
        if (minutesSinceCreation < 5) {
          console.log(`[asaas-webhook] Assinatura recém-criada (${minutesSinceCreation.toFixed(1)}min atrás), ignorando renovação duplicada para ${userId}`);
          // Apenas atualizar last_payment_date sem estender expiração
          await supabase.from('subscriptions').update({
            last_payment_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', authorizedSub.id);
        } else {
          // É uma renovação automática recorrente de verdade!
          const currentExpiration = authorizedSub.expiration_date ? new Date(authorizedSub.expiration_date) : new Date();
          const baseDate = currentExpiration > new Date() ? currentExpiration : new Date();
          const newExpiration = new Date(baseDate);
          newExpiration.setDate(newExpiration.getDate() + days);

          const nextPayment = new Date();
          const cycle = PLAN_CYCLES[planType] || 'MONTHLY';
          if (cycle === 'MONTHLY') nextPayment.setMonth(nextPayment.getMonth() + 1);
          else if (cycle === 'SEMIANNUALLY') nextPayment.setMonth(nextPayment.getMonth() + 6);
          else if (cycle === 'YEARLY') nextPayment.setFullYear(nextPayment.getFullYear() + 1);

          console.log(`[asaas-webhook] RENOVAÇÃO RECORRENTE: ${userId}, nova expiração: ${newExpiration.toISOString()}, próx cobrança: ${nextPayment.toISOString()}`);

          await supabase.from('subscriptions').update({
            last_payment_date: new Date().toISOString(),
            expiration_date: newExpiration.toISOString(),
            next_payment_date: nextPayment.toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', authorizedSub.id);
        }

        // Notificar admin sobre renovação
        try {
          const { data: profileData } = await supabase.from('profiles').select('nome, email, telefone').eq('id', userId).maybeSingle();
          await supabase.functions.invoke('notificar-admin-whatsapp', {
            body: {
              tipo: 'renovacao_automatica',
              dados: { userId, nome: profileData?.nome || '', email: profileData?.email || '', plano: planType, valor: payment.value, novaExpiracao: newExpiration.toISOString() }
            }
          });
        } catch {}

      } else {
        // Dedup: check if this exact paymentId was already processed
        const { data: existingPayment } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('mp_payment_id', paymentId)
          .in('status', ['authorized', 'active', 'approved'])
          .maybeSingle();

        if (existingPayment) {
          console.log('[asaas-webhook] Payment ID já processado, ignorando:', paymentId);
          return new Response(
            JSON.stringify({ success: true, skipped: true, reason: 'duplicate_payment_id' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // First payment — update pending subscription
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);

        // Calcular próxima cobrança
        const nextPayment = new Date();
        const cycle = PLAN_CYCLES[planType] || 'MONTHLY';
        if (cycle === 'MONTHLY') nextPayment.setMonth(nextPayment.getMonth() + 1);
        else if (cycle === 'SEMIANNUALLY') nextPayment.setMonth(nextPayment.getMonth() + 6);
        else if (cycle === 'YEARLY') nextPayment.setFullYear(nextPayment.getFullYear() + 1);

        const { data: existingSub, error: pendingError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pendingError) {
          console.error('[asaas-webhook] Erro ao buscar assinatura pending:', pendingError);
        }

        if (existingSub?.id) {
          const { data: updatedSub, error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'authorized',
              mp_payment_id: paymentId,
              last_payment_date: new Date().toISOString(),
              expiration_date: expirationDate.toISOString(),
              next_payment_date: nextPayment.toISOString(),
              payment_method: isPix ? 'pix' : 'credit_card',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSub.id)
            .eq('status', 'pending')
            .select('id')
            .maybeSingle();

          if (updateError) {
            console.error('[asaas-webhook] Erro ao autorizar assinatura:', updateError);
          }

          if (!updatedSub) {
            console.log('[asaas-webhook] Assinatura já estava autorizada (evento duplicado); não notificando:', userId);
          } else {
            const totalAmount = payment.value;

            try {
              await supabase.functions.invoke('evelyn-notificar-pagamento', {
                body: {
                  userId,
                  planType,
                  amount: totalAmount,
                  paymentMethod: isPix ? 'pix' : 'card',
                  expirationDate: expirationDate.toISOString(),
                  installments: 1,
                  totalAmount,
                },
              });
            } catch (e) {
              console.error('[asaas-webhook] Erro ao invocar evelyn-notificar-pagamento:', e);
            }
          }
        } else {
          console.warn('[asaas-webhook] Nenhuma assinatura pending encontrada para:', userId);
        }
      }

      // Notify admin
      if (!authorizedSub) {
        try {
          const { data: profileData } = await supabase.from('profiles').select('nome, email, telefone').eq('id', userId).single();
          if (profileData) {
            await supabase.functions.invoke('notificar-admin-whatsapp', {
              body: {
                tipo: 'novo_premium',
                dados: { userId, nome: profileData.nome, email: profileData.email, telefone: profileData.telefone || 'Não informado', plano: planType, valor: payment.value, payment_method: isPix ? 'pix' : 'card (recorrente)' }
              }
            });
          }
        } catch {}
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[asaas-webhook] Erro:', error);
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});