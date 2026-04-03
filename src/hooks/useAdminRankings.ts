import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ==================== MAPPINGS ====================

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
  '/primeiros-passos': 'Conceitos',
  '/pesquisar': 'Pesquisa',
  '/assinatura': 'Assinatura',
  '/perfil': 'Perfil',
  '/estatutos': 'Estatutos',
  '/advogado': 'Carreira Advogado',
  '/aula-interativa': 'Aula Interativa',
  '/videoaulas-oab': 'Videoaulas OAB',
  '/videoaulas-oab-1fase': 'Videoaulas OAB 1ª Fase',
};

const ROUTE_TO_AREA: Record<string, string> = {
  '/constituicao': 'Constitucional',
  '/oab-trilhas': 'OAB',
  '/ferramentas/questoes': 'OAB',
  '/vade-mecum': 'Geral',
  '/bibliotecas': 'Geral',
  '/resumos-juridicos': 'Geral',
  '/codigos': 'Códigos (Geral)',
  '/flashcards': 'Estudo (Geral)',
  '/videoaulas': 'Videoaulas',
  '/conceitos': 'Conceitos',
  '/primeiros-passos': 'Conceitos',
  
  '/evelyn': 'Evelyn IA',
  '/ferramentas/evelyn': 'Evelyn IA',
  '/mapas-mentais': 'Mapas Mentais',
  '/sumulas': 'Súmulas',
  '/audio-aulas': 'Áudio Aulas',
  '/estatutos': 'Estatutos',
  '/advogado': 'Carreira',
  '/assinatura': 'Assinatura',
  '/perfil': 'Perfil',
  '/pesquisar': 'Pesquisa',
};

function mapPathToFuncao(path: string): string | null {
  for (const [route, funcao] of Object.entries(ROUTE_TO_FUNCAO)) {
    if (path === route || path.startsWith(route + '/')) return funcao;
  }
  if (path === '/' || path === '') return 'Home';
  return 'Outro';
}

function mapPathToArea(path: string): string | null {
  for (const [route, area] of Object.entries(ROUTE_TO_AREA)) {
    if (path === route || path.startsWith(route + '/')) return area;
  }
  if (path === '/' || path === '') return 'Home';
  return 'Outro';
}

function formatMinutes(totalMin: number): string {
  if (totalMin < 1) return '<1min';
  if (totalMin < 60) return `${Math.round(totalMin)}min`;
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ==================== TYPES ====================

export interface RankingTempoTelaItem {
  user_id: string;
  nome: string;
  email: string;
  telefone: string;
  intencao: string;
  tempo_total_min: number;
  tempo_formatado: string;
  tempo_hoje_min: number;
  tempo_hoje_formatado: string;
  sessoes: number;
  page_views: number;
  paginas_mais_vistas: string[];
  ultima_atividade: string;
  cadastro: string;
}

export interface RankingAreaItem {
  area: string;
  count: number;
  percentual: number;
  usuarios_unicos: number;
}

export interface RankingFuncaoItem {
  funcao: string;
  count: number;
  percentual: number;
  usuarios_unicos: number;
}

export interface RankingFidelidadeItem {
  user_id: string;
  nome: string;
  email: string;
  telefone: string;
  intencao: string;
  dias_ativos: number;
  streak: number;
  total_page_views: number;
  primeira_visita: string;
  ultima_visita: string;
  cadastro: string;
}

export interface RankingAulasItem {
  page_path: string;
  titulo: string;
  tipo: string;
  total_views: number;
  usuarios_unicos: number;
  tempo_estimado_min: number;
  tempo_formatado: string;
}

export interface RankingUsuarioAulasItem {
  user_id: string;
  nome: string;
  email: string;
  total_aulas_acessadas: number;
  total_views_aulas: number;
  tempo_estimado_min: number;
  tempo_formatado: string;
  aulas_distintas: string[];
}

// Helper to fetch all page_views in batches (bypassing 1000 row limit)
async function fetchAllPageViews(since: string, select: string) {
  const allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('page_views')
      .select(select)
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

// Helper to fetch ALL profiles in batches (bypassing 1000 row limit)
async function fetchAllProfiles(select: string = 'id, nome, email, telefone, intencao, dispositivo, created_at') {
  const allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('profiles')
      .select(select)
      .order('created_at', { ascending: false })
      .range(from, from + batchSize - 1);
    
    if (error || !data || data.length === 0) break;
    allData.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  
  return allData;
}

async function fetchProfileMap(userIds: string[]) {
  const profileMap: Record<string, { nome: string; email: string; telefone: string; intencao: string; cadastro: string }> = {};
  // Batch in groups of 50
  for (let i = 0; i < userIds.length; i += 50) {
    const batch = userIds.slice(i, i + 50);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nome, email, telefone, intencao, created_at')
      .in('id', batch);
    
    for (const p of profiles || []) {
      profileMap[p.id] = {
        nome: p.nome || '',
        email: p.email || '',
        telefone: p.telefone || '',
        intencao: p.intencao || '',
        cadastro: p.created_at || '',
      };
    }
  }
  return profileMap;
}

// ==================== HOOKS ====================
// All ranking hooks now accept an optional `enabled` parameter

export function useRankingTempoTela(dias: number, enabled = true) {
  return useQuery({
    queryKey: ['ranking-tempo-tela', dias],
    enabled,
    queryFn: async (): Promise<RankingTempoTelaItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const pageViews = await fetchAllPageViews(
        since.toISOString(),
        'user_id, session_id, page_path, created_at'
      );

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const allProfiles = await fetchAllProfiles('id, nome, email, telefone, intencao, created_at');

      const userSessions: Record<string, { 
        times: { time: Date; path: string; sessionId: string }[];
      }> = {};

      for (const pv of pageViews) {
        if (!pv.user_id || !pv.session_id) continue;
        if (!userSessions[pv.user_id]) {
          userSessions[pv.user_id] = { times: [] };
        }
        userSessions[pv.user_id].times.push({
          time: new Date(pv.created_at),
          path: pv.page_path,
          sessionId: pv.session_id,
        });
      }

      const calcUserMetrics = (entries: { time: Date; path: string; sessionId: string }[]) => {
        if (entries.length === 0) return { total: 0, todayTotal: 0, sessoes: 0, pageViews: 0, pathCounts: {} as Record<string, number>, lastSeen: new Date(0) };

        const sorted = entries.sort((a, b) => a.time.getTime() - b.time.getTime());
        let total = 0;
        let todayTotal = 0;
        const sessionIds = new Set<string>();
        const pathCounts: Record<string, number> = {};
        let lastSeen = new Date(0);

        let currentSessionStart = sorted[0].time;
        let sessionCount = 1;

        for (let i = 0; i < sorted.length; i++) {
          const entry = sorted[i];
          sessionIds.add(entry.sessionId);
          pathCounts[entry.path] = (pathCounts[entry.path] || 0) + 1;
          if (entry.time > lastSeen) lastSeen = entry.time;

          if (i > 0) {
            const diff = (entry.time.getTime() - sorted[i - 1].time.getTime()) / 60000;
            if (diff >= 30) {
              sessionCount++;
              currentSessionStart = entry.time;
            }
            if (diff < 30) {
              total += diff;
              if (sorted[i - 1].time >= todayStart && entry.time < todayEnd) {
                todayTotal += diff;
              }
            }
          }
        }
        total += sessionCount;
        const todayEntries = sorted.filter(e => e.time >= todayStart && e.time < todayEnd);
        if (todayEntries.length > 0) todayTotal += 1;

        return { total, todayTotal, sessoes: sessionCount, pageViews: sorted.length, pathCounts, lastSeen };
      };

      const results: RankingTempoTelaItem[] = [];

      for (const profile of allProfiles) {
        const userData = userSessions[profile.id];
        const metrics = userData ? calcUserMetrics(userData.times) : { total: 0, todayTotal: 0, sessoes: 0, pageViews: 0, pathCounts: {}, lastSeen: new Date(0) };

        const topPaths = Object.entries(metrics.pathCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([p]) => decodeURIComponent(p));

        results.push({
          user_id: profile.id,
          nome: profile.nome || 'Sem nome',
          email: profile.email || '',
          telefone: profile.telefone || '',
          intencao: profile.intencao || '',
          tempo_total_min: metrics.total,
          tempo_formatado: formatMinutes(metrics.total),
          tempo_hoje_min: metrics.todayTotal,
          tempo_hoje_formatado: formatMinutes(metrics.todayTotal),
          sessoes: metrics.sessoes,
          page_views: metrics.pageViews,
          paginas_mais_vistas: topPaths,
          ultima_atividade: metrics.lastSeen.getTime() > 0 ? metrics.lastSeen.toISOString() : '',
          cadastro: profile.created_at || '',
        });
      }

      return results.sort((a, b) => b.tempo_total_min - a.tempo_total_min);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRankingAreasAcessadas(dias: number, enabled = true) {
  return useQuery({
    queryKey: ['ranking-areas', dias],
    enabled,
    queryFn: async (): Promise<RankingAreaItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const data = await fetchAllPageViews(since.toISOString(), 'page_path, user_id');

      if (data.length === 0) return [];

      const counts: Record<string, { count: number; users: Set<string> }> = {};
      for (const pv of data) {
        const area = mapPathToArea(pv.page_path);
        if (area) {
          if (!counts[area]) counts[area] = { count: 0, users: new Set() };
          counts[area].count++;
          if (pv.user_id) counts[area].users.add(pv.user_id);
        }
      }

      const total = Object.values(counts).reduce((a, b) => a + b.count, 0) || 1;
      return Object.entries(counts)
        .map(([area, d]) => ({ 
          area, 
          count: d.count, 
          percentual: (d.count / total) * 100,
          usuarios_unicos: d.users.size,
        }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRankingFuncoesUtilizadas(dias: number, enabled = true) {
  return useQuery({
    queryKey: ['ranking-funcoes', dias],
    enabled,
    queryFn: async (): Promise<RankingFuncaoItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const data = await fetchAllPageViews(since.toISOString(), 'page_path, user_id');

      if (data.length === 0) return [];

      const counts: Record<string, { count: number; users: Set<string> }> = {};
      for (const pv of data) {
        const funcao = mapPathToFuncao(pv.page_path);
        if (funcao) {
          if (!counts[funcao]) counts[funcao] = { count: 0, users: new Set() };
          counts[funcao].count++;
          if (pv.user_id) counts[funcao].users.add(pv.user_id);
        }
      }

      const total = Object.values(counts).reduce((a, b) => a + b.count, 0) || 1;
      return Object.entries(counts)
        .map(([funcao, d]) => ({ 
          funcao, 
          count: d.count, 
          percentual: (d.count / total) * 100,
          usuarios_unicos: d.users.size,
        }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRankingFidelidade(dias: number, enabled = true) {
  return useQuery({
    queryKey: ['ranking-fidelidade', dias],
    enabled,
    queryFn: async (): Promise<RankingFidelidadeItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const data = await fetchAllPageViews(since.toISOString(), 'user_id, created_at');

      if (data.length === 0) return [];

      const userDays: Record<string, Set<string>> = {};
      const userFirst: Record<string, string> = {};
      const userLast: Record<string, string> = {};
      const userViews: Record<string, number> = {};
      
      for (const pv of data) {
        if (!pv.user_id) continue;
        if (!userDays[pv.user_id]) {
          userDays[pv.user_id] = new Set();
          userFirst[pv.user_id] = pv.created_at;
        }
        const day = pv.created_at.slice(0, 10);
        userDays[pv.user_id].add(day);
        userLast[pv.user_id] = pv.created_at;
        userViews[pv.user_id] = (userViews[pv.user_id] || 0) + 1;
      }

      const calcStreak = (days: Set<string>): number => {
        const sorted = [...days].sort().reverse();
        if (sorted.length === 0) return 0;
        let streak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const prev = new Date(sorted[i - 1]);
          const curr = new Date(sorted[i]);
          const diff = (prev.getTime() - curr.getTime()) / 86400000;
          if (Math.abs(diff - 1) < 0.5) streak++;
          else break;
        }
        return streak;
      };

      const userIds = Object.keys(userDays);
      if (userIds.length === 0) return [];

      const profileMap = await fetchProfileMap(userIds);

      return Object.entries(userDays)
        .map(([uid, days]) => ({
          user_id: uid,
          nome: profileMap[uid]?.nome || 'Sem nome',
          email: profileMap[uid]?.email || '',
          telefone: profileMap[uid]?.telefone || '',
          intencao: profileMap[uid]?.intencao || '',
          dias_ativos: days.size,
          streak: calcStreak(days),
          total_page_views: userViews[uid] || 0,
          primeira_visita: userFirst[uid],
          ultima_visita: userLast[uid],
          cadastro: profileMap[uid]?.cadastro || '',
        }))
        .sort((a, b) => b.dias_ativos - a.dias_ativos);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Ranking de aulas mais acessadas (videoaulas + conceitos + aula-interativa)
export function useRankingAulas(dias: number, enabled = true) {
  return useQuery({
    queryKey: ['ranking-aulas', dias],
    enabled,
    queryFn: async (): Promise<RankingAulasItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const data = await fetchAllPageViews(since.toISOString(), 'page_path, user_id, session_id, created_at');

      if (data.length === 0) return [];

      // Filter only aula-related paths
      const aulaViews = data.filter(pv => 
        pv.page_path.startsWith('/videoaulas') ||
        pv.page_path.startsWith('/conceitos') ||
        pv.page_path.startsWith('/aula-interativa') ||
        pv.page_path.startsWith('/primeiros-passos') ||
        false
      );

      // Group by page_path
      const pathData: Record<string, { 
        views: number; 
        users: Set<string>;
        sessions: Record<string, Date[]>;
      }> = {};

      for (const pv of aulaViews) {
        if (!pathData[pv.page_path]) {
          pathData[pv.page_path] = { views: 0, users: new Set(), sessions: {} };
        }
        pathData[pv.page_path].views++;
        if (pv.user_id) pathData[pv.page_path].users.add(pv.user_id);
        
        const sid = pv.session_id || 'unknown';
        if (!pathData[pv.page_path].sessions[sid]) {
          pathData[pv.page_path].sessions[sid] = [];
        }
        pathData[pv.page_path].sessions[sid].push(new Date(pv.created_at));
      }

      const getTipo = (path: string): string => {
        if (path.startsWith('/videoaulas/iniciante')) return '📹 Videoaula Iniciante';
        if (path.startsWith('/videoaulas/areas')) return '📹 Videoaula por Área';
        if (path.startsWith('/videoaulas/oab') || path.startsWith('/videoaulas-oab')) return '📹 Videoaula OAB';
        if (path.startsWith('/videoaulas')) return '📹 Videoaulas';
        if (path.startsWith('/conceitos/topico')) return '📖 Tópico de Conceito';
        if (path.startsWith('/conceitos/materia')) return '📖 Matéria Conceitos';
        if (path.startsWith('/conceitos')) return '📖 Conceitos';
        if (path.startsWith('/aula-interativa')) return '🎮 Aula Interativa';
        if (path.startsWith('/primeiros-passos')) return '🚀 Primeiros Passos';
        if (path.startsWith('/dominando')) return '🏆 Dominando';
        return '📚 Aula';
      };

      const getTitulo = (path: string): string => {
        const decoded = decodeURIComponent(path);
        const parts = decoded.split('/').filter(Boolean);
        if (parts.length <= 1) return decoded;
        return parts.slice(1).join(' > ');
      };

      return Object.entries(pathData)
        .map(([path, d]) => {
          let totalTimeMin = 0;
          for (const times of Object.values(d.sessions)) {
            const sorted = times.sort((a, b) => a.getTime() - b.getTime());
            for (let i = 1; i < sorted.length; i++) {
              const diff = (sorted[i].getTime() - sorted[i - 1].getTime()) / 60000;
              if (diff < 30) totalTimeMin += diff;
            }
            totalTimeMin += 1;
          }
          
          return {
            page_path: path,
            titulo: getTitulo(path),
            tipo: getTipo(path),
            total_views: d.views,
            usuarios_unicos: d.users.size,
            tempo_estimado_min: totalTimeMin,
            tempo_formatado: formatMinutes(totalTimeMin),
          };
        })
        .sort((a, b) => b.total_views - a.total_views);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Ranking de usuários que mais acessam aulas
export function useRankingUsuarioAulas(dias: number, enabled = true) {
  return useQuery({
    queryKey: ['ranking-usuario-aulas', dias],
    enabled,
    queryFn: async (): Promise<RankingUsuarioAulasItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const data = await fetchAllPageViews(since.toISOString(), 'page_path, user_id, session_id, created_at');

      if (data.length === 0) return [];

      const aulaViews = data.filter(pv => 
        pv.user_id && (
          pv.page_path.startsWith('/videoaulas') ||
          pv.page_path.startsWith('/conceitos') ||
          pv.page_path.startsWith('/aula-interativa') ||
          pv.page_path.startsWith('/primeiros-passos') ||
          pv.page_path.startsWith('/dominando')
        )
      );

      const userData: Record<string, {
        views: number;
        paths: Set<string>;
        sessions: Record<string, Date[]>;
      }> = {};

      for (const pv of aulaViews) {
        if (!userData[pv.user_id]) {
          userData[pv.user_id] = { views: 0, paths: new Set(), sessions: {} };
        }
        userData[pv.user_id].views++;
        userData[pv.user_id].paths.add(pv.page_path);

        const sid = pv.session_id || 'unknown';
        if (!userData[pv.user_id].sessions[sid]) {
          userData[pv.user_id].sessions[sid] = [];
        }
        userData[pv.user_id].sessions[sid].push(new Date(pv.created_at));
      }

      const userIds = Object.keys(userData);
      if (userIds.length === 0) return [];

      const profileMap = await fetchProfileMap(userIds);

      return Object.entries(userData)
        .map(([uid, d]) => {
          let totalTimeMin = 0;
          for (const times of Object.values(d.sessions)) {
            const sorted = times.sort((a, b) => a.getTime() - b.getTime());
            for (let i = 1; i < sorted.length; i++) {
              const diff = (sorted[i].getTime() - sorted[i - 1].getTime()) / 60000;
              if (diff < 30) totalTimeMin += diff;
            }
            totalTimeMin += 1;
          }

          return {
            user_id: uid,
            nome: profileMap[uid]?.nome || 'Sem nome',
            email: profileMap[uid]?.email || '',
            total_aulas_acessadas: d.paths.size,
            total_views_aulas: d.views,
            tempo_estimado_min: totalTimeMin,
            tempo_formatado: formatMinutes(totalTimeMin),
            aulas_distintas: [...d.paths].slice(0, 5),
          };
        })
        .sort((a, b) => b.total_views_aulas - a.total_views_aulas);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Todos os usuários cadastrados com dados completos (sem limite de 1000)
export function useRankingTodosUsuarios(dias: number, enabled = true) {
  return useQuery({
    queryKey: ['ranking-todos-usuarios', dias],
    enabled,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const profiles = await fetchAllProfiles();

      if (!profiles || profiles.length === 0) return [];

      const pvData = await fetchAllPageViews(since.toISOString(), 'user_id');
      const pvCounts: Record<string, number> = {};
      for (const pv of pvData) {
        if (pv.user_id) pvCounts[pv.user_id] = (pvCounts[pv.user_id] || 0) + 1;
      }

      return profiles.map(p => ({
        user_id: p.id,
        nome: p.nome || 'Sem nome',
        email: p.email || '',
        telefone: p.telefone || '',
        intencao: p.intencao || '',
        dispositivo: p.dispositivo || '',
        cadastro: p.created_at,
        page_views_periodo: pvCounts[p.id] || 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
