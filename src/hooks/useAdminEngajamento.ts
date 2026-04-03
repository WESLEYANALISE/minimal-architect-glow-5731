import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ---- Cadastros por dia da semana ----
export interface CadastroDiaSemana {
  dia: string;
  atual: number;
  anterior: number;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const useCadastrosPorDiaSemana = () => {
  return useQuery({
    queryKey: ['admin-cadastros-dia-semana'],
    queryFn: async (): Promise<CadastroDiaSemana[]> => {
      const agora = new Date();
      const inicioSemana = new Date(agora);
      inicioSemana.setDate(agora.getDate() - agora.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      
      const inicioSemanaAnterior = new Date(inicioSemana);
      inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', inicioSemanaAnterior.toISOString());

      if (error) throw error;

      const atual = new Array(7).fill(0);
      const anterior = new Array(7).fill(0);

      (data || []).forEach((p) => {
        const d = new Date(p.created_at);
        const dow = d.getDay();
        if (d >= inicioSemana) {
          atual[dow]++;
        } else {
          anterior[dow]++;
        }
      });

      return DIAS_SEMANA.map((dia, i) => ({ dia, atual: atual[i], anterior: anterior[i] }));
    },
    refetchInterval: 60000,
  });
};

// ---- Engajamento de gratuitos (top 20) ----
export interface GratuitoEngajado {
  user_id: string;
  nome: string | null;
  email: string | null;
  total_views: number;
  dias_ativos: number;
  streak_atual: number;
}

export const useEngajamentoGratuitos = (dias = 30) => {
  return useQuery({
    queryKey: ['admin-engajamento-gratuitos', dias],
    queryFn: async (): Promise<GratuitoEngajado[]> => {
      // 1. IDs com assinatura ativa
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'authorized');
      const premiumIds = new Set((subs || []).map(s => s.user_id));

      // 2. Page views dos últimos N dias
      const dataLimite = new Date(Date.now() - dias * 86400000).toISOString();
      const { data: views, error } = await supabase
        .from('page_views')
        .select('user_id, created_at')
        .not('user_id', 'is', null)
        .gte('created_at', dataLimite);

      if (error) throw error;

      // Agrupar por user_id
      const userMap = new Map<string, Set<string>>();
      (views || []).forEach((v: any) => {
        if (!v.user_id || premiumIds.has(v.user_id)) return;
        if (!userMap.has(v.user_id)) userMap.set(v.user_id, new Set());
        const dateStr = new Date(v.created_at).toISOString().slice(0, 10);
        userMap.get(v.user_id)!.add(dateStr);
      });

      // Contar views por user
      const viewCounts = new Map<string, number>();
      (views || []).forEach((v: any) => {
        if (!v.user_id || premiumIds.has(v.user_id)) return;
        viewCounts.set(v.user_id, (viewCounts.get(v.user_id) || 0) + 1);
      });

      // Calcular streak atual
      const calcStreak = (dates: Set<string>) => {
        const sorted = [...dates].sort().reverse();
        const hoje = new Date().toISOString().slice(0, 10);
        let streak = 0;
        let expected = hoje;
        for (const d of sorted) {
          if (d === expected || (streak === 0 && d === getYesterday(hoje))) {
            streak++;
            expected = getYesterday(d);
          } else if (d < expected) {
            break;
          }
        }
        return streak;
      };

      const getYesterday = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00');
        d.setDate(d.getDate() - 1);
        return d.toISOString().slice(0, 10);
      };

      // Montar ranking
      const ranking = [...userMap.entries()]
        .map(([uid, dates]) => ({
          user_id: uid,
          total_views: viewCounts.get(uid) || 0,
          dias_ativos: dates.size,
          streak_atual: calcStreak(dates),
        }))
        .sort((a, b) => b.total_views - a.total_views)
        .slice(0, 20);

      // Buscar perfis
      if (ranking.length === 0) return [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', ranking.map(r => r.user_id));

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return ranking.map(r => ({
        ...r,
        nome: profileMap.get(r.user_id)?.nome || null,
        email: profileMap.get(r.user_id)?.email || null,
      }));
    },
    refetchInterval: 120000,
  });
};

// ---- Áreas mais acessadas por premium ----
export interface AreaPremium {
  area: string;
  views: number;
  percentual: number;
}

const PATH_MAP: Record<string, string> = {
  '/flashcards': 'Flashcards',
  '/videoaulas': 'Videoaulas',
  '/bibliotecas': 'Bibliotecas',
  '/resumos-juridicos': 'Resumos',
  '/vade-mecum': 'Vade Mecum',
  '/ferramentas/questoes': 'Questões',
  '/constituicao': 'Constituição',
  '/codigos': 'Códigos e Leis',
  '/estatutos': 'Estatutos',
  '/sumulas': 'Súmulas',
  '/assinatura': 'Assinatura',
  '/perfil': 'Perfil',
  '/pesquisar': 'Pesquisar',
  '/oab-trilhas': 'OAB Trilhas',
  '/advogado': 'Advogado',
  '/primeiros-passos': 'Conceitos',
  
};

export const useAreasPremium = (dias = 30) => {
  return useQuery({
    queryKey: ['admin-areas-premium', dias],
    queryFn: async (): Promise<AreaPremium[]> => {
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'authorized');
      const premiumIds = [...new Set((subs || []).map(s => s.user_id))];
      if (premiumIds.length === 0) return [];

      const dataLimite = new Date(Date.now() - dias * 86400000).toISOString();
      const { data: views, error } = await supabase
        .from('page_views')
        .select('page_path')
        .in('user_id', premiumIds)
        .gte('created_at', dataLimite);

      if (error) throw error;

      const areaCounts = new Map<string, number>();
      let total = 0;
      (views || []).forEach((v: any) => {
        const path = v.page_path || '/';
        // Extract first path segment
        const match = path.match(/^(\/[^/]*)/);
        const base = match ? match[1] : path;
        const area = PATH_MAP[base] || PATH_MAP[path] || base;
        if (area === '/' || area === '/admin') return;
        areaCounts.set(area, (areaCounts.get(area) || 0) + 1);
        total++;
      });

      return [...areaCounts.entries()]
        .map(([area, views]) => ({ area, views, percentual: total > 0 ? (views / total) * 100 : 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 15);
    },
    refetchInterval: 120000,
  });
};

// ---- Horários de pico ----
export interface HorarioPico {
  hora: string;
  views: number;
}

export const useHorariosPico = (dias = 7) => {
  return useQuery({
    queryKey: ['admin-horarios-pico', dias],
    queryFn: async (): Promise<HorarioPico[]> => {
      const dataLimite = new Date(Date.now() - dias * 86400000).toISOString();
      const { data, error } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', dataLimite);

      if (error) throw error;

      const horas = new Array(24).fill(0);
      (data || []).forEach((v: any) => {
        // Ajustar para fuso SP (UTC-3)
        const d = new Date(v.created_at);
        const horaLocal = (d.getUTCHours() - 3 + 24) % 24;
        horas[horaLocal]++;
      });

      return horas.map((views, i) => ({
        hora: `${i.toString().padStart(2, '0')}:00`,
        views,
      }));
    },
    refetchInterval: 120000,
  });
};

// ---- Assinaturas Admin (migrado de AdminAssinaturas) ----
export interface SubscriptionAdmin {
  id: string;
  user_id: string;
  plan_type: string;
  payment_method: string;
  amount: number;
  status: string;
  created_at: string;
  expiration_date: string | null;
  nome: string | null;
  email: string | null;
}

export interface PlanAnalyticsStats {
  verMais: number;
  abrirModal: number;
  selecionarPix: number;
  selecionarCartao: number;
  mensal: number;
  vitalicio: number;
  essencial: number;
  pro: number;
}

export const useAssinaturasAdmin = () => {
  const subsQuery = useQuery({
    queryKey: ['admin-assinaturas-full'],
    queryFn: async (): Promise<SubscriptionAdmin[]> => {
      const { data: subs, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      const userIds = [...new Set((subs || []).map(s => s.user_id).filter(Boolean))];
      let profileMap: Record<string, { nome: string | null; email: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', userIds);
        (profiles || []).forEach((p) => {
          profileMap[p.id] = { nome: p.nome, email: p.email };
        });
      }

      return (subs || []).map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        plan_type: sub.plan_type,
        payment_method: sub.payment_method,
        amount: sub.amount,
        status: sub.status,
        created_at: sub.created_at,
        expiration_date: sub.expiration_date,
        nome: profileMap[sub.user_id]?.nome || null,
        email: profileMap[sub.user_id]?.email || null,
      }));
    },
    refetchInterval: 30000,
  });

  const analyticsQuery = useQuery({
    queryKey: ['admin-plan-analytics-stats'],
    queryFn: async (): Promise<PlanAnalyticsStats> => {
      const { data, error } = await supabase
        .from('plan_click_analytics')
        .select('action, plan_type, user_id')
        .limit(2000);
      if (error) throw error;
      const arr = data || [];
      
      // Eventos totais para ações de frequência
      const verMais = arr.filter(a => a.action === 'view_more').length;
      const abrirModal = arr.filter(a => a.action === 'open_modal').length;
      const selecionarPix = arr.filter(a => a.action === 'select_pix').length;
      const selecionarCartao = arr.filter(a => a.action === 'select_card').length;
      
      // Usuários únicos por plan_type
      const uniqueByPlan = (plan: string) => new Set(arr.filter(a => a.plan_type === plan && a.user_id).map(a => a.user_id)).size;
      
      return {
        verMais,
        abrirModal,
        selecionarPix,
        selecionarCartao,
        mensal: uniqueByPlan('mensal'),
        vitalicio: uniqueByPlan('vitalicio'),
        essencial: uniqueByPlan('essencial'),
        pro: uniqueByPlan('pro'),
      };
    },
    refetchInterval: 60000,
  });

  return {
    subscriptions: subsQuery.data || [],
    loadingSubscriptions: subsQuery.isLoading,
    analytics: analyticsQuery.data,
    loadingAnalytics: analyticsQuery.isLoading,
  };
};

// ---- Retenção D1/D7 ----
export interface RetencaoData {
  d1: number;
  d7: number;
  totalBase: number;
}

export const useRetencao = () => {
  return useQuery({
    queryKey: ['admin-retencao'],
    queryFn: async (): Promise<RetencaoData> => {
      // Users who signed up 2-8 days ago
      const d8 = new Date(Date.now() - 8 * 86400000).toISOString();
      const d2 = new Date(Date.now() - 2 * 86400000).toISOString();
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', d8)
        .lte('created_at', d2);

      if (!profiles || profiles.length === 0) return { d1: 0, d7: 0, totalBase: 0 };

      const userIds = profiles.map(p => p.id);
      const { data: views } = await supabase
        .from('page_views')
        .select('user_id, created_at')
        .in('user_id', userIds);

      let voltouD1 = 0;
      let voltouD7 = 0;

      profiles.forEach(p => {
        const cadastro = new Date(p.created_at);
        const d1Start = new Date(cadastro.getTime() + 86400000);
        const d1End = new Date(cadastro.getTime() + 2 * 86400000);
        const d7Start = new Date(cadastro.getTime() + 7 * 86400000);
        const d7End = new Date(cadastro.getTime() + 8 * 86400000);

        const userViews = (views || []).filter(v => v.user_id === p.id);
        if (userViews.some(v => {
          const t = new Date(v.created_at);
          return t >= d1Start && t < d1End;
        })) voltouD1++;
        if (userViews.some(v => {
          const t = new Date(v.created_at);
          return t >= d7Start && t < d7End;
        })) voltouD7++;
      });

      return {
        d1: profiles.length > 0 ? Math.round((voltouD1 / profiles.length) * 100) : 0,
        d7: profiles.length > 0 ? Math.round((voltouD7 / profiles.length) * 100) : 0,
        totalBase: profiles.length,
      };
    },
    refetchInterval: 300000,
  });
};
