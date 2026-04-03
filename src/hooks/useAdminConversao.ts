import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ==================== ROUTE TO FUNCAO MAPPING ====================
const ROUTE_TO_FUNCAO: Record<string, string> = {
  '/flashcards': 'Flashcards',
  '/ferramentas/questoes': 'Questões',
  '/ferramentas/resumo': 'Resumos',
  '/ferramentas/simulado': 'Simulados',
  '/ferramentas/peticao': 'Petições',
  '/ferramentas/calculos': 'Cálculos',
  '/ferramentas/modelos': 'Modelos',
  '/bibliotecas': 'Biblioteca',
  '/vade-mecum': 'Vade Mecum',
  '/audiencias': 'Audiências',
  '/chat': 'Chat IA',
  '/aprofundamento': 'Aprofundamento',
  '/noticias': 'Notícias',
  '/politica': 'Política',
  '/audio-aula': 'Áudio Aula',
  '/aula-interativa': 'Aula Interativa',
  '/planos': 'Planos',
  '/perfil': 'Perfil',
};

function mapPathToFuncao(path: string): string | null {
  for (const [route, funcao] of Object.entries(ROUTE_TO_FUNCAO)) {
    if (path === route || path.startsWith(route + '/')) return funcao;
  }
  return null;
}

// ==================== INTERFACES ====================

export interface FunilEmailEntry {
  email: string;
  count: number;
  lastTime?: string;
  planType?: string;
  amount?: number;
  paymentMethod?: string;
}

export interface FunilItem {
  action: string;
  label: string;
  count: number;
  totalEvents: number;
  percentual: number;
  conversionRate?: string;
  totalAmount?: number;
  emails?: FunilEmailEntry[];
  cardSubSteps?: {
    formFilled: { email: string; lastTime?: string; metadata?: any }[];
    success: { email: string; lastTime?: string; metadata?: any }[];
    error: { email: string; lastTime?: string; metadata?: any }[];
  };
  checkoutBreakdown?: {
    pix: { count: number; totalEvents: number; emails: FunilEmailEntry[] };
    cartao: { count: number; totalEvents: number; emails: FunilEmailEntry[] };
  };
}

export interface GatePremium {
  modal_type: string;
  count: number;
}

export interface GateSourcePage {
  source_page: string;
  count: number;
}

export interface GateSourceFeature {
  source_feature: string;
  count: number;
}

export interface JornadaAssinante {
  user_id: string;
  nome: string | null;
  email: string | null;
  plano: string;
  dias_ate_assinar: number;
  ultimo_gate: string | null;
  paginas_mais_visitadas: string[];
  data_assinatura: string;
}

export interface RetencaoFuncao {
  funcao: string;
  usuarios_unicos: number;
  total_views: number;
  percentual_retorno: number;
}

// ==================== NEW: Funnel event interfaces ====================

export interface FunnelEvent {
  id: string;
  user_id: string;
  event_type: string;
  plan_type: string | null;
  payment_method: string | null;
  amount: number | null;
  referrer_page: string | null;
  duration_seconds: number | null;
  metadata: any;
  device: string | null;
  created_at: string;
  user_nome?: string | null;
  user_email?: string | null;
}

export interface UserJourney {
  user_id: string;
  nome: string | null;
  email: string | null;
  events: FunnelEvent[];
  total_duration: number | null;
  plans_viewed: string[];
  payment_methods: string[];
  final_status: string;
}

export interface FunnelMetrics {
  avg_duration: number;
  most_viewed_plan: string;
  most_used_payment: string;
  top_referrers: { page: string; count: number }[];
  total_enters: number;
  total_leaves: number;
  total_pix: number;
  total_card: number;
  total_completed: number;
}

// ==================== HELPERS ====================

function getDateRange(dias: number, periodo?: string): { inicio: string; fim?: string } {
  const now = new Date();
  const spNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  if (periodo === 'hoje') {
    const inicio = new Date(spNow);
    inicio.setHours(0, 0, 0, 0);
    return { inicio: inicio.toISOString() };
  }
  
  if (periodo === 'ontem') {
    const inicio = new Date(spNow);
    inicio.setDate(inicio.getDate() - 1);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(spNow);
    fim.setHours(0, 0, 0, 0);
    return { inicio: inicio.toISOString(), fim: fim.toISOString() };
  }
  
  const inicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  return { inicio: inicio.toISOString() };
}

const ADMIN_EMAIL = 'wn7corporation@gmail.com';

const EVENT_LABELS: Record<string, string> = {
  page_enter: 'Entrou na tela de assinatura',
  page_leave: 'Saiu da tela',
  plan_tab_switch: 'Trocou aba de plano',
  plan_modal_open: 'Selecionou plano',
  payment_method_select: 'Escolheu forma de pagamento',
  pix_generated: 'Gerou QR Code PIX',
  card_initiated: 'Abriu checkout do cartão',
  card_form_filled: 'Enviou dados do cartão',
  card_form_progress: 'Preencheu formulário do cartão',
  card_payment_success: 'Pagamento aprovado ✅',
  card_payment_error: 'Pagamento recusado ❌',
  payment_completed: 'Assinatura ativada 🎉',
};

export { EVENT_LABELS };

// ==================== REALTIME HOOK ====================

export const useFunnelRealtime = (dias: number, periodo?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-funnel-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'subscription_funnel_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-funil-conversao', dias, periodo] });
          queryClient.invalidateQueries({ queryKey: ['admin-funil-detalhado', dias, periodo] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-funil-conversao', dias, periodo] });
          queryClient.invalidateQueries({ queryKey: ['admin-funil-detalhado', dias, periodo] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'plan_click_analytics' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-funil-conversao', dias, periodo] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'page_views' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-funil-conversao', dias, periodo] });
          queryClient.invalidateQueries({ queryKey: ['admin-funil-detalhado', dias, periodo] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, dias, periodo]);
};

// ==================== NEW HOOK: useFunilDetalhado ====================

export const useFunilDetalhado = (dias = 30, periodo?: string) => {
  return useQuery({
    queryKey: ['admin-funil-detalhado', dias, periodo],
    queryFn: async () => {
      const { inicio, fim } = getDateRange(dias, periodo);

      let query = supabase
        .from('subscription_funnel_events')
        .select('*')
        .gte('created_at', inicio)
        .order('created_at', { ascending: false })
        .limit(500);
      if (fim) query = query.lt('created_at', fim);

      const { data: events, error } = await query;
      if (error) throw error;

      const rawEvents = (events || []) as any[];
      const userIds = [...new Set(rawEvents.map(e => e.user_id).filter(Boolean))];

      let profileMap = new Map<string, { nome: string | null; email: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', userIds);
        (profiles || []).forEach((p: any) => {
          profileMap.set(p.id, { nome: p.nome, email: p.email });
        });
      }

      const filteredEvents: FunnelEvent[] = rawEvents
        .filter(e => profileMap.has(e.user_id))
        .map(e => ({
          ...e,
          user_nome: profileMap.get(e.user_id)?.nome,
          user_email: profileMap.get(e.user_id)?.email,
        }));

      const timeline = filteredEvents.slice(0, 50);

      const byUser = new Map<string, FunnelEvent[]>();
      filteredEvents.forEach(e => {
        const list = byUser.get(e.user_id) || [];
        list.push(e);
        byUser.set(e.user_id, list);
      });

      const journeys: UserJourney[] = Array.from(byUser.entries()).map(([userId, userEvents]) => {
        const sorted = [...userEvents].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const leaveEvents = sorted.filter(e => e.event_type === 'page_leave' && e.duration_seconds);
        const totalDuration = leaveEvents.reduce((sum, e) => sum + (e.duration_seconds || 0), 0);
        const plansViewed = [...new Set(sorted.filter(e => e.plan_type).map(e => e.plan_type!))];
        const paymentMethods = [...new Set(sorted.filter(e => e.payment_method).map(e => e.payment_method!))];
        const hasCompleted = sorted.some(e => e.event_type === 'payment_completed');
        const hasGenerated = sorted.some(e => e.event_type === 'pix_generated' || e.event_type === 'card_initiated');
        
        let finalStatus = 'Visualizou';
        if (hasCompleted) finalStatus = 'Pagou ✅';
        else if (sorted.some(e => e.event_type === 'card_payment_success')) finalStatus = 'Aprovado ✅';
        else if (sorted.some(e => e.event_type === 'card_payment_error')) finalStatus = 'Recusado ❌';
        else if (hasGenerated) finalStatus = 'Gerou pagamento';
        else if (paymentMethods.length > 0) finalStatus = 'Escolheu método';
        else if (plansViewed.length > 0) finalStatus = 'Viu plano';

        return {
          user_id: userId,
          nome: sorted[0]?.user_nome || null,
          email: sorted[0]?.user_email || null,
          events: sorted,
          total_duration: totalDuration || null,
          plans_viewed: plansViewed,
          payment_methods: paymentMethods,
          final_status: finalStatus,
        };
      }).sort((a, b) => {
        const aLast = a.events[a.events.length - 1]?.created_at || '';
        const bLast = b.events[b.events.length - 1]?.created_at || '';
        return bLast.localeCompare(aLast);
      });

      const enters = filteredEvents.filter(e => e.event_type === 'page_enter');
      const leaves = filteredEvents.filter(e => e.event_type === 'page_leave' && e.duration_seconds);
      const avgDuration = leaves.length > 0
        ? Math.round(leaves.reduce((s, e) => s + (e.duration_seconds || 0), 0) / leaves.length)
        : 0;

      const planCounts: Record<string, number> = {};
      filteredEvents.filter(e => e.plan_type).forEach(e => {
        planCounts[e.plan_type!] = (planCounts[e.plan_type!] || 0) + 1;
      });
      const mostViewedPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      const paymentCounts: Record<string, number> = {};
      filteredEvents.filter(e => e.payment_method).forEach(e => {
        paymentCounts[e.payment_method!] = (paymentCounts[e.payment_method!] || 0) + 1;
      });
      const mostUsedPayment = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      const referrerCounts: Record<string, number> = {};
      enters.filter(e => e.referrer_page).forEach(e => {
        referrerCounts[e.referrer_page!] = (referrerCounts[e.referrer_page!] || 0) + 1;
      });
      const topReferrers = Object.entries(referrerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([page, count]) => ({ page, count }));

      const metrics: FunnelMetrics = {
        avg_duration: avgDuration,
        most_viewed_plan: mostViewedPlan,
        most_used_payment: mostUsedPayment,
        top_referrers: topReferrers,
        total_enters: enters.length,
        total_leaves: leaves.length,
        total_pix: filteredEvents.filter(e => e.event_type === 'pix_generated').length,
        total_card: filteredEvents.filter(e => e.event_type === 'card_initiated').length,
        total_completed: filteredEvents.filter(e => e.event_type === 'payment_completed').length,
      };

      return { timeline, journeys, metrics };
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
};

// ==================== EXISTING HOOKS ====================

export const useFunilConversao = (dias = 30, periodo?: string) => {
  return useQuery({
    queryKey: ['admin-funil-conversao', dias, periodo],
    queryFn: async (): Promise<FunilItem[]> => {
      const { inicio, fim } = getDateRange(dias, periodo);

      // 1. Visitou tela de assinatura
      let pvQuery = supabase
        .from('page_views')
        .select('user_id, created_at')
        .or('page_path.ilike.%assinatura%,page_path.ilike.%escolher-plano%')
        .not('user_id', 'is', null)
        .gte('created_at', inicio);
      if (fim) pvQuery = pvQuery.lt('created_at', fim);
      const { data: pvData } = await pvQuery;

      const visitedUsers = new Set<string>();
      const visitedCounts = new Map<string, number>();
      const visitedLastTime = new Map<string, string>();
      (pvData || []).forEach((pv: any) => {
        if (pv.user_id) {
          visitedUsers.add(pv.user_id);
          visitedCounts.set(pv.user_id, (visitedCounts.get(pv.user_id) || 0) + 1);
          const prev = visitedLastTime.get(pv.user_id);
          if (!prev || pv.created_at > prev) visitedLastTime.set(pv.user_id, pv.created_at);
        }
      });
      visitedUsers.delete('372b4f7f-9450-4fa4-83ee-84988c2586eb');
      visitedCounts.delete('372b4f7f-9450-4fa4-83ee-84988c2586eb');
      visitedLastTime.delete('372b4f7f-9450-4fa4-83ee-84988c2586eb');

      // 2. Analytics from plan_click_analytics + subscription_funnel_events
      let pcaQuery = supabase
        .from('plan_click_analytics')
        .select('user_id, action, created_at')
        .gte('created_at', inicio);
      if (fim) pcaQuery = pcaQuery.lt('created_at', fim);
      const { data: pcaData } = await pcaQuery;

      const updateLastTime = (map: Map<string, string>, uid: string, ts: string) => {
        const prev = map.get(uid);
        if (!prev || ts > prev) map.set(uid, ts);
      };

      // Step: Escolheu plano (selecionou um plano específico)
      const selectedPlanUsers = new Set<string>();
      const selectedPlanCounts = new Map<string, number>();
      const selectedPlanLastTime = new Map<string, string>();

      // Step: Gerou PIX
      const selectPixUsers = new Set<string>();
      const selectPixCounts = new Map<string, number>();
      const selectPixLastTime = new Map<string, string>();

      // Step: Checkout Cartão (abriu tela de cartão)
      const selectCardUsers = new Set<string>();
      const selectCardCounts = new Map<string, number>();
      const selectCardLastTime = new Map<string, string>();

      // Step: Enviou Pagamento (form filled / pix generated)
      const paymentSentUsers = new Set<string>();
      const paymentSentCounts = new Map<string, number>();
      const paymentSentLastTime = new Map<string, string>();

      // Card sub-steps
      const cardFormFilledList: { user_id: string; created_at: string; metadata: any }[] = [];
      const cardSuccessList: { user_id: string; created_at: string; metadata: any }[] = [];
      const cardErrorList: { user_id: string; created_at: string; metadata: any }[] = [];

      (pcaData || []).forEach((item: any) => {
        const uid = item.user_id;
        if (!uid) return;
        switch (item.action) {
          case 'open_modal':
            selectedPlanUsers.add(uid);
            selectedPlanCounts.set(uid, (selectedPlanCounts.get(uid) || 0) + 1);
            updateLastTime(selectedPlanLastTime, uid, item.created_at);
            break;
          case 'select_pix':
            selectPixUsers.add(uid);
            selectPixCounts.set(uid, (selectPixCounts.get(uid) || 0) + 1);
            updateLastTime(selectPixLastTime, uid, item.created_at);
            break;
          case 'select_card':
            selectCardUsers.add(uid);
            selectCardCounts.set(uid, (selectCardCounts.get(uid) || 0) + 1);
            updateLastTime(selectCardLastTime, uid, item.created_at);
            break;
          case 'payment_initiated':
            paymentSentUsers.add(uid);
            paymentSentCounts.set(uid, (paymentSentCounts.get(uid) || 0) + 1);
            updateLastTime(paymentSentLastTime, uid, item.created_at);
            break;
        }
      });

      // Step: Preencheu as Informações
      const formFilledUsers = new Set<string>();
      const formFilledCounts = new Map<string, number>();
      const formFilledLastTime = new Map<string, string>();

      // Complementar com subscription_funnel_events
      let sfeQuery = supabase
        .from('subscription_funnel_events')
        .select('user_id, event_type, payment_method, plan_type, amount, created_at, metadata')
        .in('event_type', ['plan_modal_open', 'payment_method_select', 'card_initiated', 'pix_generated', 'card_form_filled', 'card_form_progress', 'card_payment_success', 'card_payment_error'])
        .gte('created_at', inicio);
      if (fim) sfeQuery = sfeQuery.lt('created_at', fim);
      const { data: sfeData } = await sfeQuery;

      (sfeData || []).forEach((item: any) => {
        const uid = item.user_id;
        if (!uid) return;

        switch (item.event_type) {
          case 'plan_modal_open':
            selectedPlanUsers.add(uid);
            selectedPlanCounts.set(uid, (selectedPlanCounts.get(uid) || 0) + 1);
            updateLastTime(selectedPlanLastTime, uid, item.created_at);
            break;
          case 'payment_method_select':
            if (item.payment_method === 'pix') {
              selectPixUsers.add(uid);
              selectPixCounts.set(uid, (selectPixCounts.get(uid) || 0) + 1);
              updateLastTime(selectPixLastTime, uid, item.created_at);
            } else {
              selectCardUsers.add(uid);
              selectCardCounts.set(uid, (selectCardCounts.get(uid) || 0) + 1);
              updateLastTime(selectCardLastTime, uid, item.created_at);
            }
            break;
          case 'pix_generated':
            selectPixUsers.add(uid);
            selectPixCounts.set(uid, (selectPixCounts.get(uid) || 0) + 1);
            updateLastTime(selectPixLastTime, uid, item.created_at);
            // PIX exige CPF = Preencheu as Informações
            formFilledUsers.add(uid);
            formFilledCounts.set(uid, (formFilledCounts.get(uid) || 0) + 1);
            updateLastTime(formFilledLastTime, uid, item.created_at);
            // PIX gerado = Enviou Pagamento (ato de pagar)
            paymentSentUsers.add(uid);
            paymentSentCounts.set(uid, (paymentSentCounts.get(uid) || 0) + 1);
            updateLastTime(paymentSentLastTime, uid, item.created_at);
            break;
          case 'card_initiated':
            selectCardUsers.add(uid);
            selectCardCounts.set(uid, (selectCardCounts.get(uid) || 0) + 1);
            updateLastTime(selectCardLastTime, uid, item.created_at);
            // card_initiated = Abriu o Checkout (NÃO mais Enviou Pagamento)
            break;
          case 'card_form_progress':
            // Preencheu as Informações
            formFilledUsers.add(uid);
            formFilledCounts.set(uid, (formFilledCounts.get(uid) || 0) + 1);
            updateLastTime(formFilledLastTime, uid, item.created_at);
            break;
          case 'card_form_filled':
            // Clicou em pagar = Enviou Pagamento
            cardFormFilledList.push({ user_id: uid, created_at: item.created_at, metadata: item.metadata });
            paymentSentUsers.add(uid);
            paymentSentCounts.set(uid, (paymentSentCounts.get(uid) || 0) + 1);
            updateLastTime(paymentSentLastTime, uid, item.created_at);
            // Também conta como "preencheu"
            formFilledUsers.add(uid);
            formFilledCounts.set(uid, (formFilledCounts.get(uid) || 0) + 1);
            updateLastTime(formFilledLastTime, uid, item.created_at);
            break;
          case 'card_payment_success':
            cardSuccessList.push({ user_id: uid, created_at: item.created_at, metadata: item.metadata });
            break;
          case 'card_payment_error':
            cardErrorList.push({ user_id: uid, created_at: item.created_at, metadata: item.metadata });
            break;
        }
      });

      // Subscriptions finalizadas
      let subQuery = supabase
        .from('subscriptions')
        .select('user_id, payment_method, created_at, amount, plan_type')
        .eq('status', 'authorized')
        .gte('created_at', inicio);
      if (fim) subQuery = subQuery.lt('created_at', fim);
      const { data: subData } = await subQuery;

      const subscribedUsers = new Set<string>();
      const subscribedLastTime = new Map<string, string>();
      (subData || []).forEach((s: any) => {
        if (s.user_id) {
          subscribedUsers.add(s.user_id);
          const prev = subscribedLastTime.get(s.user_id);
          if (!prev || s.created_at > prev) subscribedLastTime.set(s.user_id, s.created_at);
        }
      });

      // Buscar TODOS os premium para filtrar do "visitou"
      const { data: allActiveSubs } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'authorized');

      const allPremiumIds = new Set(
        (allActiveSubs || []).map((s: any) => s.user_id).filter(Boolean)
      );

      allPremiumIds.forEach(id => {
        visitedUsers.delete(id);
        visitedCounts.delete(id);
        visitedLastTime.delete(id);
      });

      // Backfill: assinantes devem aparecer em todas as etapas
      subscribedUsers.forEach(uid => {
        selectedPlanUsers.add(uid);
        visitedUsers.add(uid);
      });

      (subData || []).forEach((s: any) => {
        if (!s.user_id) return;
        const pm = s.payment_method?.toLowerCase() || '';
        if (pm.includes('pix')) {
          selectPixUsers.add(s.user_id);
          updateLastTime(selectPixLastTime, s.user_id, s.created_at);
        } else if (pm.includes('card') || pm.includes('credit')) {
          selectCardUsers.add(s.user_id);
          updateLastTime(selectCardLastTime, s.user_id, s.created_at);
        } else {
          selectPixUsers.add(s.user_id);
          updateLastTime(selectPixLastTime, s.user_id, s.created_at);
        }
        paymentSentUsers.add(s.user_id);
        updateLastTime(paymentSentLastTime, s.user_id, s.created_at);
      });

      // Mapear amount/plan_type por user_id
      const userSubInfo = new Map<string, { amount: number; plan_type: string; payment_method?: string }>();
      (sfeData || []).forEach((item: any) => {
        if (item.user_id && (item.plan_type || item.amount)) {
          const existing = userSubInfo.get(item.user_id);
          if (!existing || (item.created_at > (existing as any)._ts)) {
            userSubInfo.set(item.user_id, { 
              amount: item.amount || 0, 
              plan_type: item.plan_type || '', 
              payment_method: item.payment_method || '',
              _ts: item.created_at 
            } as any);
          }
        }
      });
      (subData || []).forEach((s: any) => {
        if (s.user_id) {
          userSubInfo.set(s.user_id, { amount: s.amount || 0, plan_type: s.plan_type || '', payment_method: s.payment_method || '' });
        }
      });

      // Profiles
      const allUserIds = new Set([...visitedUsers, ...selectedPlanUsers, ...selectPixUsers, ...selectCardUsers, ...formFilledUsers, ...paymentSentUsers, ...subscribedUsers]);
      let profileMap = new Map<string, { nome: string; email: string }>();
      if (allUserIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, nome')
          .in('id', Array.from(allUserIds));
        (profiles || []).forEach((p: any) => {
          if (p.email && p.email !== ADMIN_EMAIL) profileMap.set(p.id, { nome: p.nome || '', email: p.email });
        });
      }
      const emailMap = new Map<string, string>();
      profileMap.forEach((v, k) => emailMap.set(k, v.email));

      const adminIds = new Set<string>();
      emailMap.forEach((email, id) => { if (email === ADMIN_EMAIL) adminIds.add(id); });
      adminIds.forEach(id => {
        visitedUsers.delete(id);
        selectedPlanUsers.delete(id);
        selectPixUsers.delete(id);
        selectCardUsers.delete(id);
        paymentSentUsers.delete(id);
        subscribedUsers.delete(id);
      });

      const formatTime = (isoStr?: string) => {
        if (!isoStr) return undefined;
        const d = new Date(isoStr);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      };

      const getEmailsWithCount = (set: Set<string>, countsMap?: Map<string, number>, timeMap?: Map<string, string>, includeSubInfo = false) => 
        Array.from(set)
          .map(id => {
            const profile = profileMap.get(id);
            if (!profile) return null;
            const base: any = { 
              email: profile.nome || profile.email, 
              count: countsMap?.get(id) || 1, 
              lastTime: formatTime(timeMap?.get(id)), 
              rawTime: timeMap?.get(id) || '' 
            };
            if (includeSubInfo) {
              const info = userSubInfo.get(id);
              if (info) {
                base.planType = info.plan_type;
                base.amount = info.amount;
                if (info.payment_method) base.paymentMethod = info.payment_method;
              }
            }
            return base;
          })
          .filter(Boolean)
          .sort((a: any, b: any) => (b.rawTime || '').localeCompare(a.rawTime || ''))
          .map(({ rawTime, ...rest }: any) => rest) as { email: string; count: number; lastTime?: string; planType?: string; amount?: number }[];

      const totalVisitedEvents = Array.from(visitedUsers).reduce((sum, id) => sum + (visitedCounts.get(id) || 1), 0);
      const totalSelectedPlanEvents = Array.from(selectedPlanUsers).reduce((sum, id) => sum + (selectedPlanCounts.get(id) || 1), 0);
      const totalPixEvents = Array.from(selectPixUsers).reduce((sum, id) => sum + (selectPixCounts.get(id) || 1), 0);
      const totalCardEvents = Array.from(selectCardUsers).reduce((sum, id) => sum + (selectCardCounts.get(id) || 1), 0);
      const totalFormFilledEvents = Array.from(formFilledUsers).reduce((sum, id) => sum + (formFilledCounts.get(id) || 1), 0);
      const totalPaymentSentEvents = Array.from(paymentSentUsers).reduce((sum, id) => sum + (paymentSentCounts.get(id) || 1), 0);

      const maxCount = Math.max(visitedUsers.size, 1);
      const convRate = visitedUsers.size > 0 ? `${((subscribedUsers.size / visitedUsers.size) * 100).toFixed(1)}%` : '0%';

      const buildCardSubList = (list: { user_id: string; created_at: string; metadata: any }[]) =>
        list
          .map(item => {
            const profile = profileMap.get(item.user_id);
            if (!profile) return null;
            return {
              email: profile.nome || profile.email,
              lastTime: formatTime(item.created_at),
              metadata: item.metadata,
            };
          })
          .filter(Boolean) as { email: string; lastTime?: string; metadata?: any }[];

      const cardSubSteps = {
        formFilled: buildCardSubList(cardFormFilledList),
        success: buildCardSubList(cardSuccessList),
        error: buildCardSubList(cardErrorList),
      };

      // Merged checkout: PIX + Cartão combined
      const checkoutUsers = new Set([...selectPixUsers, ...selectCardUsers]);
      const checkoutCounts = new Map<string, number>();
      const checkoutLastTime = new Map<string, string>();
      checkoutUsers.forEach(uid => {
        checkoutCounts.set(uid, (selectPixCounts.get(uid) || 0) + (selectCardCounts.get(uid) || 0));
        const pixTime = selectPixLastTime.get(uid) || '';
        const cardTime = selectCardLastTime.get(uid) || '';
        checkoutLastTime.set(uid, pixTime > cardTime ? pixTime : cardTime);
      });
      const totalCheckoutEvents = totalPixEvents + totalCardEvents;

      return [
        { action: 'visited_assinatura', label: 'Visitou Tela de Assinatura', count: visitedUsers.size, totalEvents: totalVisitedEvents, percentual: 100, emails: getEmailsWithCount(visitedUsers, visitedCounts, visitedLastTime) },
        { 
          action: 'abriu_checkout', 
          label: 'Abriu o Checkout', 
          count: checkoutUsers.size, 
          totalEvents: totalCheckoutEvents, 
          percentual: (checkoutUsers.size / maxCount) * 100, 
          emails: getEmailsWithCount(checkoutUsers, checkoutCounts, checkoutLastTime, true),
          cardSubSteps,
          checkoutBreakdown: {
            pix: { count: selectPixUsers.size, totalEvents: totalPixEvents, emails: getEmailsWithCount(selectPixUsers, selectPixCounts, selectPixLastTime, true) },
            cartao: { count: selectCardUsers.size, totalEvents: totalCardEvents, emails: getEmailsWithCount(selectCardUsers, selectCardCounts, selectCardLastTime, true) },
          },
        },
        { action: 'form_filled', label: 'Preencheu as Informações', count: formFilledUsers.size, totalEvents: totalFormFilledEvents, percentual: (formFilledUsers.size / maxCount) * 100, emails: getEmailsWithCount(formFilledUsers, formFilledCounts, formFilledLastTime, true) },
        { action: 'payment_sent', label: 'Enviou Pagamento', count: paymentSentUsers.size, totalEvents: totalPaymentSentEvents, percentual: (paymentSentUsers.size / maxCount) * 100, emails: getEmailsWithCount(paymentSentUsers, paymentSentCounts, paymentSentLastTime, true) },
        { action: 'subscribed', label: 'Assinatura Ativada', count: subscribedUsers.size, totalEvents: subscribedUsers.size, percentual: (subscribedUsers.size / maxCount) * 100, conversionRate: convRate, totalAmount: (subData || []).reduce((sum: number, s: any) => sum + (s.amount || 0), 0), emails: getEmailsWithCount(subscribedUsers, undefined, subscribedLastTime, true) },
      ];
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });
};

export const useGatesPremium = (dias = 30, periodo?: string) => {
  return useQuery({
    queryKey: ['admin-gates-premium', dias, periodo],
    queryFn: async () => {
      const { inicio, fim } = getDateRange(dias, periodo);
      let query = supabase.from('premium_modal_views').select('modal_type, source_page, source_feature').gte('created_at', inicio);
      if (fim) query = query.lt('created_at', fim);
      const { data, error } = await query;
      if (error) throw error;

      const byType: Record<string, number> = {};
      const byPage: Record<string, number> = {};
      const byFeature: Record<string, number> = {};
      (data || []).forEach((item: any) => {
        byType[item.modal_type] = (byType[item.modal_type] || 0) + 1;
        if (item.source_page) byPage[item.source_page] = (byPage[item.source_page] || 0) + 1;
        if (item.source_feature) byFeature[item.source_feature] = (byFeature[item.source_feature] || 0) + 1;
      });

      return {
        porTipo: Object.entries(byType).map(([modal_type, count]) => ({ modal_type, count })).sort((a, b) => b.count - a.count) as GatePremium[],
        porPagina: Object.entries(byPage).map(([source_page, count]) => ({ source_page, count })).sort((a, b) => b.count - a.count).slice(0, 10) as GateSourcePage[],
        porFeature: Object.entries(byFeature).map(([source_feature, count]) => ({ source_feature, count })).sort((a, b) => b.count - a.count).slice(0, 10) as GateSourceFeature[],
        total: data?.length || 0,
      };
    },
    refetchInterval: 60000,
  });
};

export const useJornadaPremium = () => {
  return useQuery({
    queryKey: ['admin-jornada-premium'],
    queryFn: async (): Promise<JornadaAssinante[]> => {
      const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select('user_id, plan_type, created_at')
        .eq('status', 'authorized')
        .order('created_at', { ascending: false });
      if (subsError) throw subsError;
      if (!subs || subs.length === 0) return [];

      const uniqueMap = new Map<string, any>();
      subs.forEach(s => { if (s.user_id && !uniqueMap.has(s.user_id)) uniqueMap.set(s.user_id, s); });
      const uniqueSubs = Array.from(uniqueMap.values());
      const userIds = uniqueSubs.map(s => s.user_id).filter(Boolean);

      const { data: profiles } = await supabase.from('profiles').select('id, nome, email, created_at').in('id', userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const { data: pageViews } = await supabase.from('page_views').select('user_id, page_path').in('user_id', userIds).order('created_at', { ascending: false }).limit(1000);
      const { data: modalViews } = await supabase.from('premium_modal_views').select('user_id, modal_type, source_page, created_at').in('user_id', userIds).order('created_at', { ascending: false }).limit(500);

      const pvByUser = new Map<string, string[]>();
      (pageViews || []).forEach((pv: any) => { if (!pv.user_id) return; const list = pvByUser.get(pv.user_id) || []; list.push(pv.page_path); pvByUser.set(pv.user_id, list); });

      const lastModalByUser = new Map<string, string>();
      (modalViews || []).forEach((mv: any) => { if (!mv.user_id || lastModalByUser.has(mv.user_id)) return; lastModalByUser.set(mv.user_id, mv.modal_type); });

      return uniqueSubs.slice(0, 20).map(sub => {
        const profile = profileMap.get(sub.user_id);
        const pages = pvByUser.get(sub.user_id) || [];
        const pageCounts: Record<string, number> = {};
        pages.forEach(p => { pageCounts[p] = (pageCounts[p] || 0) + 1; });
        const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p]) => decodeURIComponent(p));
        const diasAteAssinar = profile ? Math.max(0, Math.floor((new Date(sub.created_at).getTime() - new Date(profile.created_at).getTime()) / (24 * 60 * 60 * 1000))) : 0;
        const planId = (sub.plan_type || '').toLowerCase();
        let plano = 'Vitalício';
        if (planId.includes('mensal')) plano = 'Mensal';
        else if (planId.includes('anual')) plano = 'Anual';
        else if (planId.includes('essencial')) plano = 'Essencial';
        else if (planId.includes('pro')) plano = 'Pro';

        return {
          user_id: sub.user_id, nome: profile?.nome || null, email: profile?.email || null, plano,
          dias_ate_assinar: diasAteAssinar, ultimo_gate: lastModalByUser.get(sub.user_id) || null,
          paginas_mais_visitadas: topPages, data_assinatura: sub.created_at,
        };
      });
    },
    refetchInterval: 120000,
  });
};

export const useRetencaoPorFuncao = (dias = 30, periodo?: string) => {
  return useQuery({
    queryKey: ['admin-retencao-funcao', dias, periodo],
    queryFn: async (): Promise<RetencaoFuncao[]> => {
      const { inicio, fim } = getDateRange(dias, periodo);
      let query = supabase.from('page_views').select('user_id, page_path').gte('created_at', inicio).not('user_id', 'is', null).limit(5000);
      if (fim) query = query.lt('created_at', fim);
      const { data, error } = await query;
      if (error) throw error;

      const funcaoUsers = new Map<string, Set<string>>();
      const funcaoViews = new Map<string, number>();
      (data || []).forEach((pv: any) => {
        const funcao = mapPathToFuncao(pv.page_path);
        if (!funcao || !pv.user_id) return;
        if (!funcaoUsers.has(funcao)) funcaoUsers.set(funcao, new Set());
        funcaoUsers.get(funcao)!.add(pv.user_id);
        funcaoViews.set(funcao, (funcaoViews.get(funcao) || 0) + 1);
      });

      const allUsers = new Set<string>();
      (data || []).forEach((pv: any) => { if (pv.user_id) allUsers.add(pv.user_id); });
      const totalUsers = Math.max(allUsers.size, 1);

      return Array.from(funcaoUsers.entries())
        .map(([funcao, users]) => ({
          funcao, usuarios_unicos: users.size, total_views: funcaoViews.get(funcao) || 0,
          percentual_retorno: Math.round((users.size / totalUsers) * 100),
        }))
        .sort((a, b) => b.usuarios_unicos - a.usuarios_unicos);
    },
    refetchInterval: 120000,
  });
};
