import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NovoUsuario {
  id: string;
  nome: string | null;
  email: string | null;
  created_at: string;
  dispositivo: string | null;
  device_info: any;
  intencao: string | null;
  primeiro_acesso_minutos?: number;
}

interface PaginaPopular {
  page_path: string;
  page_title: string | null;
  count: number;
}

interface TermoPesquisado {
  termo: string;
  count: number;
}

interface EstatisticasGerais {
  totalUsuarios: number;
  novosNoPeriodo: number;
  ativosNoPeriodo: number;
  onlineAgora: number;
  totalPageViews: number;
  // Comparação com período anterior
  novosAnterior: number;
  ativosAnterior: number;
  pageViewsAnterior: number;
}

interface DistribuicaoDispositivos {
  iOS: number;
  Android: number;
  Desktop: number;
  Outro: number;
}

interface DistribuicaoIntencoes {
  Universitario: number;
  Concurseiro: number;
  OAB: number;
  Advogado: number;
  Outro: number;
}

interface CadastrosDia {
  dia: string;
  total: number;
}

export interface UsuarioDetalhe {
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  dispositivo: string | null;
  intencao?: string | null;
  page_path?: string | null;
  total_views?: number;
  last_seen?: string;
  created_at?: string;
  isPremium?: boolean;
  country?: string | null;
  region?: string | null;
  pais_cadastro?: string | null;
  estado_cadastro?: string | null;
}

// Hook para buscar novos usuários com filtro de período
export const useNovosUsuarios = (dias = 7, limite = 50) => {
  return useQuery({
    queryKey: ['admin-controle-novos', dias, limite],
    queryFn: async (): Promise<NovoUsuario[]> => {
      let query = supabase
        .from('profiles')
        .select('id, nome, email, created_at, dispositivo, device_info, intencao')
        .order('created_at', { ascending: false })
        .limit(limite);

      if (dias > 0) {
        const dataInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', dataInicio);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const usuarios = data || [];
      
      // Calculate first session screen time for each user
      if (usuarios.length > 0) {
        const userIds = usuarios.map(u => u.id);
        // Get page_views for these users on their first day
        const { data: pageViews } = await supabase
          .from('page_views')
          .select('user_id, created_at')
          .in('user_id', userIds)
          .order('created_at', { ascending: true });
        
        if (pageViews && pageViews.length > 0) {
          // Group by user and calculate first session duration
          const userSessions = new Map<string, { first: Date; last: Date }>();
          pageViews.forEach((pv: any) => {
            const userId = pv.user_id;
            const ts = new Date(pv.created_at);
            const existing = userSessions.get(userId);
            if (!existing) {
              userSessions.set(userId, { first: ts, last: ts });
            } else {
              // Only count views within first 24h of first view
              const diffFromFirst = (ts.getTime() - existing.first.getTime()) / (1000 * 60 * 60);
              if (diffFromFirst <= 24) {
                existing.last = ts;
              }
            }
          });
          
          return usuarios.map(u => ({
            ...u,
            primeiro_acesso_minutos: userSessions.has(u.id)
              ? Math.round((userSessions.get(u.id)!.last.getTime() - userSessions.get(u.id)!.first.getTime()) / (1000 * 60))
              : undefined,
          }));
        }
      }
      
      return usuarios;
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
};

// Hook para buscar páginas mais acessadas via RPC
export const usePaginasPopulares = (dias = 7) => {
  return useQuery({
    queryKey: ['admin-controle-paginas', dias],
    queryFn: async (): Promise<PaginaPopular[]> => {
      const { data, error } = await supabase.rpc('get_admin_paginas_populares', {
        p_dias: dias,
      });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        page_path: item.page_path,
        page_title: item.page_title,
        count: Number(item.total),
      }));
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};

// Hook para buscar termos pesquisados
export const useTermosPesquisados = (limite = 20) => {
  return useQuery({
    queryKey: ['admin-controle-termos', limite],
    queryFn: async (): Promise<TermoPesquisado[]> => {
      const { data, error } = await supabase
        .from('cache_pesquisas')
        .select('termo_pesquisado, total_resultados')
        .order('total_resultados', { ascending: false })
        .limit(limite);
      
      if (error) throw error;
      
      return (data || []).map((item) => ({
        termo: item.termo_pesquisado || '',
        count: item.total_resultados || 1,
      }));
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};

// Hook para estatísticas gerais - agora com período dinâmico
export const useEstatisticasGerais = (periodoDias = 7) => {
  return useQuery({
    queryKey: ['admin-controle-stats', periodoDias],
    queryFn: async (): Promise<EstatisticasGerais> => {
      // Período anterior para comparação (ex: 7 dias -> dias 14-7 atrás)
      const periodoAnterior = periodoDias === 0 ? 1 : periodoDias * 2;
      
      const [
        totalRes,
        novosRes,
        ativosRes,
        onlineRes,
        pvRes,
        novosAntRes,
        ativosAntRes,
        pvAntRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.rpc('get_admin_novos_por_periodo', { p_dias: periodoDias }),
        supabase.rpc('get_admin_ativos_periodo', { p_dias: periodoDias }),
        supabase.rpc('get_admin_online_count'),
        supabase.rpc('get_admin_total_pageviews', { p_dias: periodoDias }),
        supabase.rpc('get_admin_novos_por_periodo', { p_dias: periodoAnterior }),
        supabase.rpc('get_admin_ativos_periodo', { p_dias: periodoAnterior }),
        supabase.rpc('get_admin_total_pageviews', { p_dias: periodoAnterior }),
      ]);

      // Calcular valores do período anterior subtraindo o atual
      const novosAtual = novosRes.data || 0;
      const ativosAtual = ativosRes.data || 0;
      const pvAtual = Number(pvRes.data) || 0;
      const novosTotal2x = novosAntRes.data || 0;
      const ativosTotal2x = ativosAntRes.data || 0;
      const pvTotal2x = Number(pvAntRes.data) || 0;

      return {
        totalUsuarios: totalRes.count || 0,
        novosNoPeriodo: novosAtual,
        ativosNoPeriodo: ativosAtual,
        onlineAgora: onlineRes.data || 0,
        totalPageViews: pvAtual,
        novosAnterior: novosTotal2x - novosAtual,
        ativosAnterior: ativosTotal2x - ativosAtual,
        pageViewsAnterior: pvTotal2x - pvAtual,
      };
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
};

// Hook para distribuição de dispositivos
export const useDistribuicaoDispositivos = () => {
  return useQuery({
    queryKey: ['admin-controle-dispositivos'],
    queryFn: async (): Promise<DistribuicaoDispositivos> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('dispositivo');
      
      if (error) throw error;
      
      const distribuicao: DistribuicaoDispositivos = {
        iOS: 0,
        Android: 0,
        Desktop: 0,
        Outro: 0,
      };
      
      (data || []).forEach((item) => {
        const dispositivo = item.dispositivo?.toLowerCase() || '';
        if (dispositivo.includes('ios') || dispositivo.includes('iphone') || dispositivo.includes('ipad')) {
          distribuicao.iOS++;
        } else if (dispositivo.includes('android')) {
          distribuicao.Android++;
        } else if (dispositivo.includes('desktop') || dispositivo.includes('windows') || dispositivo.includes('mac')) {
          distribuicao.Desktop++;
        } else {
          distribuicao.Outro++;
        }
      });
      
      return distribuicao;
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};

// Hook para distribuição de intenções
export const useDistribuicaoIntencoes = () => {
  return useQuery({
    queryKey: ['admin-controle-intencoes'],
    queryFn: async (): Promise<DistribuicaoIntencoes> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('intencao');
      
      if (error) throw error;
      
      const distribuicao: DistribuicaoIntencoes = {
        Universitario: 0,
        Concurseiro: 0,
        OAB: 0,
        Advogado: 0,
        Outro: 0,
      };
      
      (data || []).forEach((item) => {
        const intencao = item.intencao?.toLowerCase() || '';
        if (intencao === 'universitario' || intencao.includes('estudante') || intencao.includes('faculdade')) {
          distribuicao.Universitario++;
        } else if (intencao === 'concurseiro') {
          distribuicao.Concurseiro++;
        } else if (intencao === 'oab') {
          distribuicao.OAB++;
        } else if (intencao === 'advogado' || intencao.includes('profissional')) {
          distribuicao.Advogado++;
        } else if (intencao) {
          distribuicao.Outro++;
        }
      });
      
      return distribuicao;
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};

// Interface para assinante hoje (detalhes)
export interface AssinanteHojeDetalhe {
  user_id: string;
  nome: string | null;
  email: string | null;
  plano: string;
  valor: number;
  payment_method: string | null;
  created_at: string;
}

// Interface para métricas premium
interface MetricasPremium {
  totalPremium: number;
  taxaConversao: number;
  mediaDiasAtePremium: number | null;
  mediaHorasAtePremium: number | null;
  conversaoPorPerfil: { perfil: string; horas: number; count: number; avgSessions: number | null }[];
  receitaTotal: number;
  receitaHoje: number;
  receitaOntem: number;
  receitaMesAtual: number;
  receitaMensal: number;
  receitaAnual: number;
  receitaVitalicio: number;
  novosPremiumPeriodo: number;
  assinaturasHoje: number;
  assinantesHojeDetalhes: AssinanteHojeDetalhe[];
}

// Hook para métricas de Premium com receita - COM REALTIME
// OTIMIZADO: Removida a paginação pesada de page_views do carregamento principal
export const useMetricasPremium = (periodoDias = 7) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-premium-metrics-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-controle-premium'] });
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['admin-controle-premium', periodoDias],
    queryFn: async (): Promise<MetricasPremium> => {
      const { count: totalUsuarios } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // Buscar subscriptions com email do pagador para filtrar contas teste
      // Incluir updated_at para usar data de confirmação (importante para PIX)
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('user_id, created_at, updated_at, status, plan_type, amount, payment_method, mp_payer_email')
        .eq('status', 'authorized');
      
      if (error) throw error;

      // Buscar profiles para cross-reference de emails de teste
      const allUserIds = [...new Set((subscriptions || []).map(s => s.user_id).filter(Boolean))];
      let profileEmailMap = new Map<string, { email: string | null; nome: string | null }>();
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, nome')
          .in('id', allUserIds);
        (profiles || []).forEach((p: any) => {
          profileEmailMap.set(p.id, { email: p.email, nome: p.nome });
        });
      }

      // Filtrar contas de teste
      const filteredSubscriptions = (subscriptions || []).filter(sub => {
        const profileData = profileEmailMap.get(sub.user_id);
        const profileEmail = profileData?.email;
        const profileNome = profileData?.nome;
        const payerEmail = (sub as any).mp_payer_email;
        return !isTestAccount(profileEmail, profileNome) && !isTestAccount(payerEmail);
      });
      
      const usuariosPremium = new Set(filteredSubscriptions.map(s => s.user_id));
      const totalPremium = usuariosPremium.size;
      
      const taxaConversao = totalUsuarios && totalUsuarios > 0 
        ? (totalPremium / totalUsuarios) * 100 
        : 0;
      
      let receitaTotal = 0;
      let receitaHoje = 0;
      let receitaOntem = 0;
      let receitaMesAtual = 0;
      let receitaMensal = 0;
      let receitaAnual = 0;
      let receitaVitalicio = 0;
      let novosPremiumPeriodo = 0;
      const assinaturasHojeSet = new Set<string>();
      const assinantesHojeDetalhes: AssinanteHojeDetalhe[] = [];

      const dataLimite = periodoDias === 0 
        ? new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0]).toISOString()
        : new Date(Date.now() - periodoDias * 24 * 60 * 60 * 1000).toISOString();

      const nowSP = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const hojeInicio = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate()).toISOString();
      const ontemInicio = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate() - 1).toISOString();
      const mesInicio = new Date(nowSP.getFullYear(), nowSP.getMonth(), 1).toISOString();

      // Helper para nome do plano
      const getNomePlano = (planType: string) => {
        const p = (planType || '').toLowerCase();
        if (p.includes('mensal') || p.includes('monthly')) return 'Mensal';
        if (p.includes('anual') || p.includes('yearly')) return 'Anual';
        if (p.includes('vitalicio') || p.includes('lifetime')) return 'Vitalício';
        // Legados
        if (p.includes('trimestral') || p.includes('quarterly') || p.includes('semestral')) return 'Legado';
        if (p.includes('essencial') || p.includes('pro')) return 'Legado';
        return 'Vitalício';
      };

      // Timestamp corrompido pela migração em massa de 23/02
      const CORRUPTED_TIMESTAMP = '2026-02-23 15:17:56';

      filteredSubscriptions.forEach(sub => {
        const amount = sub.amount || 0;
        receitaTotal += amount;
        
        const planId = (sub.plan_type || '').toLowerCase();
        if (planId.includes('mensal') || planId.includes('monthly') || planId.includes('pro') || planId.includes('essencial')) receitaMensal += amount;
        else if (planId.includes('anual') || planId.includes('yearly') || planId.includes('trimestral') || planId.includes('semestral')) receitaAnual += amount;
        else receitaVitalicio += amount;

        // Usar data de confirmação (updated_at) para classificação de receita
        // Fallback para created_at se updated_at foi corrompido pela migração
        const updatedAt = (sub as any).updated_at || '';
        const isCorrupted = updatedAt.includes(CORRUPTED_TIMESTAMP);
        const dataReferencia = isCorrupted ? sub.created_at : (updatedAt || sub.created_at);

        if (dataReferencia >= hojeInicio) {
          receitaHoje += amount;
          if (sub.user_id) {
            assinaturasHojeSet.add(sub.user_id);
            const profileData = profileEmailMap.get(sub.user_id);
            assinantesHojeDetalhes.push({
              user_id: sub.user_id,
              nome: profileData?.nome || null,
              email: profileData?.email || (sub as any).mp_payer_email || null,
              plano: getNomePlano(sub.plan_type || ''),
              valor: amount,
              payment_method: sub.payment_method || null,
              created_at: dataReferencia,
            });
          }
        } else if (dataReferencia >= ontemInicio && dataReferencia < hojeInicio) {
          receitaOntem += amount;
        }
        if (dataReferencia >= mesInicio) {
          receitaMesAtual += amount;
        }

        if (dataReferencia >= dataLimite) {
          novosPremiumPeriodo++;
        }
      });

      let mediaDiasAtePremium: number | null = null;
      let mediaHorasAtePremium: number | null = null;
      let conversaoPorPerfil: { perfil: string; horas: number; count: number; avgSessions: number | null }[] = [];
      
      if (filteredSubscriptions.length > 0) {
        const userIds = [...usuariosPremium];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, created_at, intencao')
          .in('id', userIds);
        
        if (profiles && profiles.length > 0) {
          const profileMap = new Map(profiles.map(p => [p.id, { date: new Date(p.created_at), intencao: p.intencao }]));
          
          let totalHoras = 0;
          let count = 0;
          const perfilHoras: Record<string, { total: number; count: number }> = {};
          
          filteredSubscriptions.forEach(sub => {
            const profile = profileMap.get(sub.user_id);
            if (profile) {
              const subDate = new Date(sub.created_at);
              const diffHoras = (subDate.getTime() - profile.date.getTime()) / (60 * 60 * 1000);
              if (diffHoras >= 0) {
                totalHoras += diffHoras;
                count++;
                
                const perfil = (profile.intencao || 'outro').toLowerCase();
                if (!perfilHoras[perfil]) perfilHoras[perfil] = { total: 0, count: 0 };
                perfilHoras[perfil].total += diffHoras;
                perfilHoras[perfil].count++;
              }
            }
          });
          
          if (count > 0) {
            const avgHoras = totalHoras / count;
            mediaDiasAtePremium = Math.round(avgHoras / 24);
            mediaHorasAtePremium = Math.round(avgHoras * 10) / 10;
          }
          
          conversaoPorPerfil = Object.entries(perfilHoras).map(([perfil, data]) => ({
            perfil,
            horas: Math.round((data.total / data.count) * 10) / 10,
            count: data.count,
            avgSessions: null,
          }));
        }
      }
      
      return {
        totalPremium,
        taxaConversao: Math.round(taxaConversao * 100) / 100,
        mediaDiasAtePremium,
        mediaHorasAtePremium,
        conversaoPorPerfil,
        receitaTotal,
        receitaHoje,
        receitaOntem,
        receitaMesAtual,
        receitaMensal,
        receitaAnual,
        receitaVitalicio,
        novosPremiumPeriodo,
        assinaturasHoje: assinaturasHojeSet.size,
        assinantesHojeDetalhes,
      };
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
};

// Interface para assinante premium
export interface AssinantePremium {
  email: string;
  nome: string | null;
  telefone: string | null;
  plano: string;
  valor: number;
  data: string;
  status: string;
  intencao: string | null;
  payment_method: string | null;
}

// Hook para listar assinantes premium únicos - COM REALTIME
export const useListaAssinantesPremium = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admin-premium-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-controle-lista-premium'] });
          queryClient.invalidateQueries({ queryKey: ['admin-controle-premium'] });
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['admin-controle-lista-premium'],
    queryFn: async (): Promise<AssinantePremium[]> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('user_id, mp_payer_email, plan_type, amount, created_at, status, payment_method')
        .eq('status', 'authorized')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Deduplicate by user_id (keep most recent)
      const userIdMap = new Map<string, any>();
      (data || []).forEach((sub: any) => {
        if (sub.user_id && !userIdMap.has(sub.user_id)) {
          userIdMap.set(sub.user_id, sub);
        }
      });

      const uniqueSubs = Array.from(userIdMap.values());
      const userIds = uniqueSubs.map((s: any) => s.user_id).filter(Boolean);

      // Fetch profiles for all users
      let profileMap = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, nome, telefone, intencao')
          .in('id', userIds);

        (profiles || []).forEach((p: any) => {
          profileMap.set(p.id, p);
        });
      }

      return uniqueSubs.map((sub: any) => {
        const profile = profileMap.get(sub.user_id);
        const planId = (sub.plan_type || '').toLowerCase();
        let plano = 'Vitalício';
        if (planId.includes('mensal') || planId.includes('monthly')) plano = 'Mensal';
        else if (planId.includes('anual') || planId.includes('yearly')) plano = 'Anual';
        else if (planId.includes('essencial')) plano = 'Essencial';
        else if (planId.includes('pro')) plano = 'Pro';

        return {
          email: profile?.email || sub.mp_payer_email || 'Email não disponível',
          nome: profile?.nome || null,
          telefone: profile?.telefone || null,
          plano,
          valor: sub.amount || 0,
          data: sub.created_at,
          status: sub.status,
          intencao: profile?.intencao || null,
          payment_method: sub.payment_method || null,
        };
      });
    },
    staleTime: 15000,
    refetchInterval: 15000,
  });
};

// Hook para Online Agora com Supabase Realtime + RPC
export const useOnlineAgoraRealtime = () => {
  const [onlineAgora, setOnlineAgora] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOnline = useCallback(async () => {
    try {
      // Use details RPC and filter out admin for accurate count
      const { data, error } = await supabase.rpc('get_admin_online_details');
      if (!error && data != null) {
        const now = Date.now();
        const FIVE_MIN_MS = 5 * 60 * 1000;
        const filtered = (data as any[]).filter((item: any) => {
          if (isTestAccount(item.email, item.nome)) return false;
          if (!item.last_seen) return false;
          return now - new Date(item.last_seen).getTime() <= FIVE_MIN_MS;
        });
        setOnlineAgora(filtered.length);
      }
    } catch (error) {
      console.error('Erro ao buscar online agora:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnline();

    const channel = supabase
      .channel('online-agora-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'page_views' },
        () => {
          fetchOnline();
        }
      )
      .subscribe();

    const interval = setInterval(fetchOnline, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchOnline]);

  return { onlineAgora, isLoading, refetch: fetchOnline };
};

// Hook para Online 30 Minutos - usa details filtrados para contagem correta
const ADMIN_EMAIL = "wn7corporation@gmail.com";

// Função para identificar contas de teste (todas as variantes de "corporation" + conta "Teste")
const isTestAccount = (email?: string | null, nome?: string | null): boolean => {
  if (email && email.includes('corporation')) return true;
  if (nome && nome.toLowerCase().trim() === 'teste') return true;
  return false;
};

export const useOnline30MinRealtime = () => {
  const [online30Min, setOnline30Min] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOnline30 = useCallback(async () => {
    try {
      // Use details RPC and filter to get accurate count of registered users
      const { data, error } = await (supabase.rpc as any)('get_admin_online_30min_details');
      if (!error && data != null) {
        const filtered = (data as any[]).filter((item: any) => 
          item.nome && item.nome.trim() !== '' && !isTestAccount(item.email, item.nome)
        );
        setOnline30Min(filtered.length);
      }
    } catch (error) {
      console.error('Erro ao buscar online 30min:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnline30();

    const channel = supabase
      .channel('online-30min-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'page_views' },
        () => { fetchOnline30(); }
      )
      .subscribe();

    const interval = setInterval(fetchOnline30, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchOnline30]);

  return { online30Min, isLoading, refetch: fetchOnline30 };
};

// Helper to enrich users with premium status and created_at
async function enrichWithPremiumStatus(users: UsuarioDetalhe[]): Promise<UsuarioDetalhe[]> {
  if (users.length === 0) return users;
  const userIds = users.map(u => u.user_id).filter(Boolean);
  
  // Fetch premium status and created_at in parallel
  const [subsResult, profilesResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'authorized')
      .in('user_id', userIds),
    supabase
      .from('profiles')
      .select('id, created_at')
      .in('id', userIds),
  ]);
  
  const premiumIds = new Set((subsResult.data || []).map((s: any) => s.user_id));
  const createdAtMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p.created_at]));
  
  return users.map(u => ({
    ...u,
    isPremium: premiumIds.has(u.user_id),
    created_at: u.created_at || createdAtMap.get(u.user_id) || null,
  }));
}

// Hook para detalhes dos usuários online agora
export const useOnlineDetails = (enabled = true) => {
  return useQuery({
    queryKey: ['admin-controle-online-details'],
    enabled,
    queryFn: async (): Promise<UsuarioDetalhe[]> => {
      const { data, error } = await supabase.rpc('get_admin_online_details');
      if (error) throw error;
      const now = Date.now();
      const FIVE_MIN_MS = 5 * 60 * 1000;
      const filtered = (data || [])
        .filter((item: any) => !isTestAccount(item.email, item.nome))
        .map((item: any) => ({
          user_id: item.user_id,
          nome: item.nome,
          email: item.email,
          telefone: item.telefone,
          dispositivo: item.dispositivo,
          page_path: item.page_path,
          last_seen: item.last_seen,
          country: item.country,
          region: item.region,
        }))
        .filter((u: UsuarioDetalhe) => {
          if (!u.last_seen) return false;
          return now - new Date(u.last_seen).getTime() <= FIVE_MIN_MS;
        });
      return enrichWithPremiumStatus(filtered);
    },
    staleTime: 15000,
    refetchInterval: 15000,
  });
};

// Hook para detalhes dos usuários online 30 minutos
export const useOnline30MinDetails = (enabled = true) => {
  return useQuery({
    queryKey: ['admin-controle-online-30min-details'],
    enabled,
    queryFn: async (): Promise<UsuarioDetalhe[]> => {
      const { data, error } = await (supabase.rpc as any)('get_admin_online_30min_details');
      if (error) throw error;
      const filtered = (data || [])
        .filter((item: any) => item.nome && item.nome.trim() !== '' && !isTestAccount(item.email, item.nome))
        .map((item: any) => ({
          user_id: item.user_id,
          nome: item.nome,
          email: item.email,
          telefone: item.telefone,
          dispositivo: item.dispositivo,
          page_path: item.page_path,
          last_seen: item.last_seen,
          country: item.country,
          region: item.region,
        }));
      return enrichWithPremiumStatus(filtered);
    },
    staleTime: 15000,
    refetchInterval: 15000,
  });
};

// Hook para detalhes dos usuários ativos no período
export const useAtivosDetalhes = (dias = 7, enabled = true) => {
  return useQuery({
    queryKey: ['admin-controle-ativos-details', dias],
    enabled,
    queryFn: async (): Promise<UsuarioDetalhe[]> => {
      const { data, error } = await supabase.rpc('get_admin_ativos_detalhes', { p_dias: dias });
      if (error) throw error;
      return (data || []).map((item: any) => ({
        user_id: item.user_id,
        nome: item.nome,
        email: item.email,
        telefone: item.telefone,
        dispositivo: item.dispositivo,
        total_views: Number(item.total_views),
        last_seen: item.last_seen,
      }));
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
};

// Hook para detalhes dos novos usuários no período
export const useNovosDetalhes = (dias = 7, enabled = true) => {
  return useQuery({
    queryKey: ['admin-controle-novos-details', dias],
    enabled,
    queryFn: async (): Promise<UsuarioDetalhe[]> => {
      const { data, error } = await (supabase.rpc as any)('get_admin_novos_detalhes', { p_dias: dias });
      if (error) throw error;
      return (data || []).map((item: any) => ({
        user_id: item.user_id,
        nome: item.nome,
        email: item.email,
        telefone: item.telefone,
        dispositivo: item.dispositivo,
        intencao: item.intencao,
        created_at: item.created_at,
        pais_cadastro: item.pais_cadastro,
        estado_cadastro: item.estado_cadastro,
      }));
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
};

// Hook para cadastros por dia (gráfico de evolução)
export const useCadastrosPorDia = (dias = 30) => {
  return useQuery({
    queryKey: ['admin-controle-cadastros-dia', dias],
    queryFn: async (): Promise<CadastrosDia[]> => {
      const { data, error } = await supabase.rpc('get_admin_cadastros_por_dia', {
        p_dias: dias,
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        dia: item.dia,
        total: Number(item.total),
      }));
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};

// Hook para cadastros hoje (separado)
export const useCadastrosHoje = () => {
  return useQuery({
    queryKey: ['admin-cadastros-hoje'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('get_admin_novos_por_periodo', { p_dias: 0 });
      if (error) throw error;
      return data || 0;
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
};

// Hook para cadastros no mês (separado)
export const useCadastrosMes = () => {
  return useQuery({
    queryKey: ['admin-cadastros-mes'],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('get_admin_novos_por_periodo', { p_dias: 30 });
      if (error) throw error;
      return data || 0;
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};

// Hook para Online Hoje (usuários únicos do dia)
export const useOnlineHojeRealtime = () => {
  const [onlineHoje, setOnlineHoje] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOnlineHoje = useCallback(async () => {
    try {
      // Get start of today in São Paulo timezone
      const nowSP = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const startOfDay = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate());
      // Convert back to UTC ISO string
      const startOfDayUTC = new Date(startOfDay.getTime() - (-startOfDay.getTimezoneOffset() * 60000 + 3 * 3600000)).toISOString();

      const { data, error } = await supabase
        .from('page_views')
        .select('user_id')
        .gte('created_at', startOfDayUTC)
        .not('user_id', 'is', null);

      if (!error && data) {
        // Get unique user_ids, excluding admin
        const uniqueUsers = new Set<string>();
        for (const row of data) {
          if (row.user_id) uniqueUsers.add(row.user_id);
        }
        // Remove admin by checking profiles
        const userIds = Array.from(uniqueUsers);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, nome')
            .in('id', userIds);
          const testIds = new Set((profiles || []).filter((p: any) => isTestAccount(p.email, p.nome)).map((p: any) => p.id));
          setOnlineHoje(userIds.filter(id => !testIds.has(id)).length);
        } else {
          setOnlineHoje(0);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar online hoje:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineHoje();
    const interval = setInterval(fetchOnlineHoje, 30000);
    return () => clearInterval(interval);
  }, [fetchOnlineHoje]);

  return { onlineHoje, isLoading };
};

// Hook para detalhes dos usuários online hoje
export const useOnlineHojeDetails = (enabled = true) => {
  return useQuery({
    queryKey: ['admin-controle-online-hoje-details'],
    enabled,
    queryFn: async (): Promise<UsuarioDetalhe[]> => {
      const nowSP = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
      const startOfDay = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate());
      const startOfDayUTC = new Date(startOfDay.getTime() - (-startOfDay.getTimezoneOffset() * 60000 + 3 * 3600000)).toISOString();

      // Get distinct user_ids from page_views today
      const { data: views, error } = await supabase
        .from('page_views')
        .select('user_id, created_at')
        .gte('created_at', startOfDayUTC)
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Build map of unique users with their last_seen
      const userMap = new Map<string, string>();
      for (const v of (views || [])) {
        if (v.user_id && !userMap.has(v.user_id)) {
          userMap.set(v.user_id, v.created_at);
        }
      }

      const userIds = Array.from(userMap.keys());
      if (userIds.length === 0) return [];

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email, telefone, dispositivo, created_at')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const users: UsuarioDetalhe[] = userIds
        .map(uid => {
          const profile = profileMap.get(uid);
          if (isTestAccount(profile?.email, profile?.nome)) return null;
          return {
            user_id: uid,
            nome: profile?.nome || null,
            email: profile?.email || null,
            telefone: profile?.telefone || null,
            dispositivo: profile?.dispositivo || null,
            last_seen: userMap.get(uid) || null,
          };
        })
        .filter(Boolean) as UsuarioDetalhe[];

      return enrichWithPremiumStatus(users);
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });
};

// Hook para usuários únicos por período histórico (ontem=1, 7dias=7) — desabilitado quando "hoje"
export const useOnlinePorPeriodo = (dias: number, enabled = true) => {
  return useQuery({
    queryKey: ['admin-online-periodo', dias],
    enabled,
    queryFn: async (): Promise<{ unicos: number; pageviews: number }> => {
      const nowSP = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

      let startDate: Date;
      let endDate: Date;

      if (dias === 1) {
        // Ontem: de 00:00 a 23:59 de ontem
        startDate = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate() - 1);
        endDate   = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate());
      } else {
        // N dias atrás até agora
        startDate = new Date(nowSP.getFullYear(), nowSP.getMonth(), nowSP.getDate() - dias);
        endDate   = new Date(nowSP.getTime() + 1000); // now+1s
      }

      const tzOffset = -3 * 3600000; // BRT = UTC-3
      const startUTC = new Date(startDate.getTime() - tzOffset).toISOString();
      const endUTC   = new Date(endDate.getTime()   - tzOffset).toISOString();

      const { data, error } = await supabase
        .from('page_views')
        .select('user_id')
        .gte('created_at', startUTC)
        .lt('created_at', endUTC)
        .not('user_id', 'is', null);

      if (error) throw error;

      const allUserIds = Array.from(new Set((data || []).map((r: any) => r.user_id).filter(Boolean)));
      const totalViews = (data || []).length;

      if (allUserIds.length === 0) return { unicos: 0, pageviews: totalViews };

      // Excluir admin
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, nome')
        .in('id', allUserIds);

      const testIds = new Set((profiles || []).filter((p: any) => isTestAccount(p.email, p.nome)).map((p: any) => p.id));
      const unicos = allUserIds.filter(id => !testIds.has(id)).length;

      return { unicos, pageviews: totalViews };
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};

// Hook para feedback diário da IA
export const useDailyFeedback = () => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async (regenerate = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        'https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/admin-daily-feedback',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y',
          },
          body: JSON.stringify({ regenerate }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFeedback(data.feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar feedback');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return { feedback, isLoading, error, regenerate: () => fetchFeedback(true) };
};

// ─── Quiz Respostas ──────────────────────────────────────────────────────────

export interface QuizResposta {
  id: string;
  user_id: string;
  intencao: string | null;
  faixa_etaria: string | null;
  forma_estudo: string | null;
  necessidade_app: string | null;
  frequencia_estudo: string | null;
  created_at: string;
  profiles?: { nome: string | null; email: string | null } | null;
}

export const useQuizRespostas = (limite = 50, enabled = true) => {
  return useQuery({
    queryKey: ['admin-quiz-respostas', limite],
    enabled,
    queryFn: async (): Promise<QuizResposta[]> => {
      const { data, error } = await supabase
        .from('onboarding_quiz_respostas' as any)
        .select('id, user_id, intencao, faixa_etaria, forma_estudo, necessidade_app, frequencia_estudo, created_at, profiles(nome, email)')
        .order('created_at', { ascending: false })
        .limit(limite);
      if (error) throw error;
      return (data as unknown as QuizResposta[]) || [];
    },
    staleTime: 60000,
    refetchInterval: 60000,
  });
};
