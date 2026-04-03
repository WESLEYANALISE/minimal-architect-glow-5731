import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export interface UserTrialMetrics {
  topFuncoes: string[];
  tempoTelaMinutos: number;
  diasAtivos: number;
  diasAtivosSet: string[];
  loading: boolean;
}

export function useUserTrialMetrics(): UserTrialMetrics {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<UserTrialMetrics>({
    topFuncoes: [],
    tempoTelaMinutos: 0,
    diasAtivos: 0,
    diasAtivosSet: [],
    loading: true,
  });

  useEffect(() => {
    if (!user) { setMetrics(m => ({ ...m, loading: false })); return; }

    const fetchMetrics = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const allData: any[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('page_views')
          .select('page_path, created_at')
          .eq('user_id', user.id)
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: true })
          .range(from, from + batchSize - 1);
        if (error || !data || data.length === 0) break;
        allData.push(...data);
        if (data.length < batchSize) break;
        from += batchSize;
      }

      // Screen time
      let totalMin = 0;
      for (let i = 1; i < allData.length; i++) {
        const diff = (new Date(allData[i].created_at).getTime() - new Date(allData[i - 1].created_at).getTime()) / 60000;
        if (diff < 30) totalMin += diff;
      }
      if (allData.length > 0) totalMin += 1;

      // Active days
      const activeDaysSet = [...new Set(allData.map(e => new Date(e.created_at).toISOString().slice(0, 10)))];
      const activeDays = activeDaysSet.length;

      // Top functions
      const funcCounts: Record<string, number> = {};
      for (const e of allData) {
        const f = mapPathToFuncao(e.page_path);
        if (f) funcCounts[f] = (funcCounts[f] || 0) + 1;
      }
      const topFuncoes = Object.entries(funcCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([f]) => f);

      setMetrics({
        topFuncoes,
        tempoTelaMinutos: Math.round(totalMin),
        diasAtivos: activeDays,
        diasAtivosSet: activeDaysSet,
        loading: false,
      });
    };

    fetchMetrics();
  }, [user]);

  return metrics;
}
