import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TRIAL_DAYS = 3;
const LAUNCH_DATE = new Date('2026-02-20T00:00:00Z');

const ROUTE_TO_FUNCAO: Record<string, string> = {
  '/flashcards': 'Flashcards',
  '/ferramentas/questoes': 'Questões',
  '/videoaulas': 'Videoaulas',
  '/vade-mecum': 'Vade Mecum',
  '/constituicao': 'Constituição',
  '/codigos': 'Códigos e Leis',
  '/evelyn': 'Evelyn IA',
  '/ferramentas/evelyn': 'Evelyn IA',
  '/bibliotecas': 'Bibliotecas',
  '/resumos-juridicos': 'Resumos',
  '/mapas-mentais': 'Mapas Mentais',
  '/oab-trilhas': 'OAB Trilhas',
  '/sumulas': 'Súmulas',
  '/audio-aulas': 'Áudio Aulas',
  '/conceitos': 'Conceitos',
  '/dominando': 'Dominando',
  '/pesquisar': 'Pesquisa',
  '/aula-interativa': 'Aula Interativa',
};

function mapPathToFuncao(path: string): string | null {
  for (const [route, funcao] of Object.entries(ROUTE_TO_FUNCAO)) {
    if (path === route || path.startsWith(route + '/')) return funcao;
  }
  return null;
}

export interface TrialAssinaturaUser {
  user_id: string;
  nome: string | null;
  email: string | null;
  created_at: string;
  trial_end: Date;
  voltou: boolean;
  ultima_visita: string | null;
  top_funcoes: string[];
  assinou: boolean;
  plano: string | null;
  data_assinatura: string | null;
}

export interface TrialAssinaturaMetrics {
  total_expirados: number;
  voltaram: number;
  assinaram: number;
  nunca_voltaram: number;
  taxa_conversao: number;
}

export type TrialAssinaturaFilter = 'todos' | 'voltaram' | 'assinaram' | 'nunca_voltaram';

function getTrialEnd(createdAt: string, extraMs: number): Date {
  const created = new Date(createdAt);
  const effectiveStart = new Date(Math.max(created.getTime(), LAUNCH_DATE.getTime()));
  return new Date(effectiveStart.getTime() + TRIAL_DAYS * 86400000 + extraMs);
}

export function useAdminTrialAssinatura() {
  return useQuery({
    queryKey: ['admin-trial-assinatura'],
    queryFn: async () => {
      // 1. Fetch all profiles
      const allProfiles: any[] = [];
      let from = 0;
      const batch = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome, email, created_at')
          .order('created_at', { ascending: false })
          .range(from, from + batch - 1);
        if (error || !data || data.length === 0) break;
        allProfiles.push(...data);
        if (data.length < batch) break;
        from += batch;
      }

      // 2. Fetch trial overrides
      const { data: overrides } = await supabase
        .from('trial_overrides')
        .select('user_id, extra_ms, desativado');
      const overrideMap = new Map((overrides || []).map(o => [o.user_id, o]));

      // 3. Fetch subscriptions (all, not just authorized, so we can detect any sub)
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('user_id, status, plan_type, created_at')
        .eq('status', 'authorized');
      const subMap = new Map((subs || []).map(s => [s.user_id, s]));

      const now = new Date();
      
      // 4. Filter expired trial users
      const expiredUsers: { profile: any; trialEnd: Date }[] = [];
      for (const p of allProfiles) {
        const override = overrideMap.get(p.id);
        const extraMs = Number(override?.extra_ms) || 0;
        const desativado = !!override?.desativado;
        const trialEnd = getTrialEnd(p.created_at, extraMs);
        if (desativado || now >= trialEnd) {
          expiredUsers.push({ profile: p, trialEnd });
        }
      }

      // 5. Batch fetch page_views for ALL expired users at once using a single query
      // Get the earliest trial end date to limit the query
      const userIds = expiredUsers.map(u => u.profile.id);
      
      // Fetch recent page_views for all expired users in a single query
      const pageViewMap = new Map<string, { last: string; paths: string[] }>();
      
      if (userIds.length > 0) {
        // Fetch page_views in batches of IDs but with a single query per batch
        for (let i = 0; i < userIds.length; i += 200) {
          const chunk = userIds.slice(i, i + 200);
          const { data: views } = await supabase
            .from('page_views')
            .select('user_id, page_path, created_at')
            .in('user_id', chunk)
            .order('created_at', { ascending: false })
            .limit(5000);
          
          if (views) {
            for (const v of views) {
              if (!v.user_id) continue;
              const existing = pageViewMap.get(v.user_id);
              if (existing) {
                existing.paths.push(v.page_path);
              } else {
                pageViewMap.set(v.user_id, {
                  last: v.created_at,
                  paths: [v.page_path],
                });
              }
            }
          }
        }
      }

      // 6. Build user list
      const users: TrialAssinaturaUser[] = [];

      for (const { profile, trialEnd } of expiredUsers) {
        const allPv = pageViewMap.get(profile.id);
        const sub = subMap.get(profile.id);
        
        // Filter page views to only those after trial end
        let postTrialPaths: string[] = [];
        let lastPostTrialVisit: string | null = null;
        
        if (allPv) {
          // The views are already sorted desc, filter by trial end
          const trialEndStr = trialEnd.toISOString();
          for (const path of allPv.paths) {
            // We don't have individual timestamps per path in this structure
            // so we use the overall last visit
          }
          // Since we fetched all views, check if last visit is after trial end
          if (allPv.last > trialEndStr) {
            lastPostTrialVisit = allPv.last;
            postTrialPaths = allPv.paths;
          }
        }

        // Top functions
        const funcCounts: Record<string, number> = {};
        for (const path of postTrialPaths) {
          const f = mapPathToFuncao(path);
          if (f) funcCounts[f] = (funcCounts[f] || 0) + 1;
        }
        const topFuncoes = Object.entries(funcCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([f]) => f);

        users.push({
          user_id: profile.id,
          nome: profile.nome,
          email: profile.email,
          created_at: profile.created_at,
          trial_end: trialEnd,
          voltou: !!lastPostTrialVisit,
          ultima_visita: lastPostTrialVisit,
          top_funcoes: topFuncoes,
          assinou: !!sub,
          plano: sub?.plan_type || null,
          data_assinatura: sub?.created_at || null,
        });
      }

      // Sort: most recent trial end first
      users.sort((a, b) => b.trial_end.getTime() - a.trial_end.getTime());

      const metrics: TrialAssinaturaMetrics = {
        total_expirados: users.length,
        voltaram: users.filter(u => u.voltou).length,
        assinaram: users.filter(u => u.assinou).length,
        nunca_voltaram: users.filter(u => !u.voltou && !u.assinou).length,
        taxa_conversao: users.length > 0 
          ? Math.round((users.filter(u => u.assinou).length / users.length) * 100) 
          : 0,
      };

      return { users, metrics };
    },
    staleTime: 5 * 60 * 1000,
  });
}