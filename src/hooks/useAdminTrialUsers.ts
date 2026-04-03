import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ==================== CONSTANTS ====================
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
  '/assinatura': 'Assinatura',
  '/perfil': 'Perfil',
  '/estatutos': 'Estatutos',
  '/advogado': 'Carreira Advogado',
  '/aula-interativa': 'Aula Interativa',
};

function mapPathToFuncao(path: string): string | null {
  for (const [route, funcao] of Object.entries(ROUTE_TO_FUNCAO)) {
    if (path === route || path.startsWith(route + '/')) return funcao;
  }
  if (path === '/' || path === '') return 'Home';
  return null;
}

function formatMinutes(totalMin: number): string {
  if (totalMin < 1) return '<1min';
  if (totalMin < 60) return `${Math.round(totalMin)}min`;
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ==================== TYPES ====================

export type TrialSortBy = 'tempo_restante' | 'tempo_tela' | 'dias_ativos' | 'mais_recente';

export interface TrialUserItem {
  user_id: string;
  nome: string;
  email: string;
  created_at: string;
  trial_end: Date;
  ms_remaining: number;
  tempo_restante_label: string;
  tempo_tela_min: number;
  tempo_tela_label: string;
  dias_ativos: number;
  top_funcoes: string[];
  status: 'ativo' | 'urgente' | 'expirado';
  extra_ms: number;
  desativado: boolean;
  ip_cadastro: string | null;
  ip_duplicado: boolean;
  contas_mesmo_ip: { user_id: string; nome: string; email: string }[];
  rating_bonus_claimed: boolean;
  rating_bonus_claimed_at: string | null;
  rating_bonus_revoked: boolean;
}

// ==================== HELPERS ====================

async function fetchAllProfiles() {
  const allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, created_at, ip_cadastro')
      .order('created_at', { ascending: false })
      .range(from, from + batchSize - 1);
    if (error || !data || data.length === 0) break;
    allData.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return allData;
}

async function fetchPageViewsSince(since: string) {
  const allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('page_views')
      .select('user_id, session_id, page_path, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .range(from, from + batchSize - 1);
    if (error || !data || data.length === 0) break;
    allData.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return allData;
}

function calcTrialEnd(createdAt: string): Date {
  const created = new Date(createdAt);
  const effective = new Date(Math.max(created.getTime(), LAUNCH_DATE.getTime()));
  return new Date(effective.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Expirado';
  const totalMin = ms / 60000;
  if (totalMin < 60) return `${Math.round(totalMin)}min`;
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h < 24) return m > 0 ? `${h}h ${m}min` : `${h}h`;
  const d = Math.floor(h / 24);
  const remainH = h % 24;
  return remainH > 0 ? `${d}d ${remainH}h` : `${d}d`;
}

// ==================== HOOK ====================

export function useAdminTrialUsers(sortBy: TrialSortBy = 'tempo_restante', enabled = true) {
  return useQuery({
    queryKey: ['admin-trial-users', sortBy],
    enabled,
    refetchInterval: 60000,
    queryFn: async (): Promise<TrialUserItem[]> => {
      const now = new Date();

      // 1. Fetch all profiles
      const profiles = await fetchAllProfiles();

      // 2. Fetch active subscriptions
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'authorized');
      const premiumIds = new Set((subs || []).map((s: any) => s.user_id));

      // 3. Filter to non-premium users only
      const trialProfiles = profiles.filter((p: any) => !premiumIds.has(p.id));

      // 3b. Fetch trial overrides
      const { data: overrides } = await supabase
        .from('trial_overrides')
        .select('user_id, extra_ms, desativado, rating_bonus_claimed, rating_bonus_claimed_at, rating_bonus_revoked');
      const overrideMap = new Map<string, { extra_ms: number; desativado: boolean; rating_bonus_claimed: boolean; rating_bonus_claimed_at: string | null; rating_bonus_revoked: boolean }>();
      for (const o of (overrides || [])) {
        overrideMap.set(o.user_id, {
          extra_ms: Number(o.extra_ms) || 0,
          desativado: !!o.desativado,
          rating_bonus_claimed: !!(o as any).rating_bonus_claimed,
          rating_bonus_claimed_at: (o as any).rating_bonus_claimed_at || null,
          rating_bonus_revoked: !!(o as any).rating_bonus_revoked,
        });
      }

      // 4. Fetch page_views for last 7 days
      const since7d = new Date();
      since7d.setDate(since7d.getDate() - 7);
      const pageViews = await fetchPageViewsSince(since7d.toISOString());

      // 5. Group page_views by user
      const userPV: Record<string, { time: Date; path: string; sessionId: string }[]> = {};
      for (const pv of pageViews) {
        if (!pv.user_id) continue;
        if (!userPV[pv.user_id]) userPV[pv.user_id] = [];
        userPV[pv.user_id].push({ time: new Date(pv.created_at), path: pv.page_path, sessionId: pv.session_id });
      }

      // 6. Calculate metrics per trial user
      const results: TrialUserItem[] = trialProfiles.map((p: any) => {
        const ov = overrideMap.get(p.id);
        const trialEnd = calcTrialEnd(p.created_at);
        const extraMs = ov?.extra_ms || 0;
        const adjustedEnd = new Date(trialEnd.getTime() + extraMs);
        
        // Se desativado pelo admin, ms_remaining = 0
        const msRemaining = ov?.desativado ? 0 : Math.max(0, adjustedEnd.getTime() - now.getTime());

        const entries = userPV[p.id] || [];
        entries.sort((a, b) => a.time.getTime() - b.time.getTime());

        // Screen time
        let totalMin = 0;
        for (let i = 1; i < entries.length; i++) {
          const diff = (entries[i].time.getTime() - entries[i - 1].time.getTime()) / 60000;
          if (diff < 30) totalMin += diff;
        }
        if (entries.length > 0) totalMin += 1;

        // Active days
        const activeDays = new Set(entries.map(e => e.time.toISOString().slice(0, 10))).size;

        // Top 3 functions
        const funcCounts: Record<string, number> = {};
        for (const e of entries) {
          const f = mapPathToFuncao(e.path);
          if (f) funcCounts[f] = (funcCounts[f] || 0) + 1;
        }
        const topFuncoes = Object.entries(funcCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([f]) => f);

        // Status
        let status: 'ativo' | 'urgente' | 'expirado' = 'ativo';
        if (ov?.desativado || msRemaining <= 0) status = 'expirado';
        else if (msRemaining < 6 * 60 * 60 * 1000) status = 'urgente';

        return {
          user_id: p.id,
          nome: p.nome || '',
          email: p.email || '',
          created_at: p.created_at,
          trial_end: adjustedEnd,
          ms_remaining: msRemaining,
          tempo_restante_label: ov?.desativado ? 'Desativado' : formatRemaining(msRemaining),
          tempo_tela_min: totalMin,
          tempo_tela_label: formatMinutes(totalMin),
          dias_ativos: activeDays,
          top_funcoes: topFuncoes,
          status,
          extra_ms: extraMs,
          desativado: ov?.desativado || false,
          ip_cadastro: p.ip_cadastro || null,
          ip_duplicado: false,
          contas_mesmo_ip: [],
          rating_bonus_claimed: ov?.rating_bonus_claimed || false,
          rating_bonus_claimed_at: ov?.rating_bonus_claimed_at || null,
          rating_bonus_revoked: ov?.rating_bonus_revoked || false,
        };
      });

      // Detect duplicate IPs
      const ipMap = new Map<string, TrialUserItem[]>();
      for (const u of results) {
        if (u.ip_cadastro) {
          if (!ipMap.has(u.ip_cadastro)) ipMap.set(u.ip_cadastro, []);
          ipMap.get(u.ip_cadastro)!.push(u);
        }
      }
      // Also check ALL profiles (including premium) for same IP
      const allProfilesByIp = new Map<string, { user_id: string; nome: string; email: string }[]>();
      for (const p of profiles) {
        if (p.ip_cadastro) {
          if (!allProfilesByIp.has(p.ip_cadastro)) allProfilesByIp.set(p.ip_cadastro, []);
          allProfilesByIp.get(p.ip_cadastro)!.push({ user_id: p.id, nome: p.nome || '', email: p.email || '' });
        }
      }
      for (const u of results) {
        if (u.ip_cadastro) {
          const allWithSameIp = allProfilesByIp.get(u.ip_cadastro) || [];
          if (allWithSameIp.length > 1) {
            u.ip_duplicado = true;
            u.contas_mesmo_ip = allWithSameIp.filter(c => c.user_id !== u.user_id);
          }
        }
      }

      // 7. Sort
      switch (sortBy) {
        case 'tempo_restante':
          results.sort((a, b) => a.ms_remaining - b.ms_remaining);
          break;
        case 'tempo_tela':
          results.sort((a, b) => b.tempo_tela_min - a.tempo_tela_min);
          break;
        case 'dias_ativos':
          results.sort((a, b) => b.dias_ativos - a.dias_ativos);
          break;
        case 'mais_recente':
          results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
      }

      return results;
    },
  });
}
