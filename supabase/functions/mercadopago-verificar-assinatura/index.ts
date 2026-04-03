import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Derivar planLevel do plan_type armazenado no banco
function derivePlanLevel(planType: string | null): 'free' | 'essencial' | 'pro' | 'vitalicio' {
  if (!planType) return 'free';
  const pt = planType.toLowerCase();
  if (pt === 'vitalicio') return 'vitalicio';
  if (pt === 'pro') return 'pro';
  if (pt === 'essencial') return 'essencial';
  // Planos legados (mensal, semestral, anual, anual_oferta, trimestral) → pro (acesso total)
  return 'pro';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar assinatura ativa primeiro (authorized), senão a mais recente
    const { data: activeSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['authorized', 'active', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: latestSubscription } = activeSubscription ? { data: activeSubscription } : await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const subscription = activeSubscription || latestSubscription;

    if (!subscription) {
      return new Response(
        JSON.stringify({ 
          isPremium: false,
          hasEvelynAccess: false,
          planLevel: 'free',
          subscription: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const expirationDate = subscription.expiration_date ? new Date(subscription.expiration_date) : null;
    
    const isPremium = ['authorized', 'active', 'approved'].includes(subscription.status) && 
      (!expirationDate || expirationDate > now);
    
    const planLevel = isPremium ? derivePlanLevel(subscription.plan_type) : 'free';
    const hasEvelynAccess = planLevel === 'pro' || planLevel === 'vitalicio';
    
    let daysRemaining = null;
    if (expirationDate && isPremium) {
      daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    console.log('Verificação de assinatura:', {
      userId,
      status: subscription.status,
      planType: subscription.plan_type,
      planLevel,
      isPremium,
      hasEvelynAccess,
      daysRemaining
    });

    return new Response(
      JSON.stringify({ 
        isPremium,
        hasEvelynAccess,
        planLevel,
        daysRemaining,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          planType: subscription.plan_type,
          amount: subscription.amount,
          expirationDate: subscription.expiration_date,
          paymentMethod: subscription.payment_method,
          createdAt: subscription.created_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
