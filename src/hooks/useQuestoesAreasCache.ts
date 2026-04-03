import { useCallback } from 'react';
import { useInstantCache, saveToInstantCache } from './useInstantCache';
import { supabase } from '@/integrations/supabase/client';

interface AreaComContagem {
  area: string;
  totalTemas: number;
  totalQuestoes: number;
}

export const QUESTOES_AREAS_CACHE_KEY = 'questoes-areas-stats-v2';

// Normalizar nome da área para unificar duplicatas com/sem acentos
const normalizarArea = (area: string): string => {
  const mapeamento: Record<string, string> = {
    'Portugues': 'Português',
    'portugues': 'Português',
    'Direito Tributario': 'Direito Tributário',
    'Direito Previndenciario': 'Direito Previdenciário',
    'Direito Previdenciario': 'Direito Previdenciário',
  };
  return mapeamento[area] || area;
};

// Função de fetch exportada para reuso no preloader
export async function fetchQuestoesAreasStats(): Promise<AreaComContagem[]> {
  const { data, error } = await supabase.rpc('get_questoes_areas_stats');

  if (error) {
    console.error('Erro ao buscar estatísticas de áreas:', error);
    throw error;
  }

  const areasAgrupadas = new Map<string, AreaComContagem>();

  (data || []).forEach((item: { area: string; total_temas: number; total_questoes: number }) => {
    const areaNormalizada = normalizarArea(item.area);
    const existing = areasAgrupadas.get(areaNormalizada);

    if (existing) {
      existing.totalTemas += Number(item.total_temas);
      existing.totalQuestoes += Number(item.total_questoes);
    } else {
      areasAgrupadas.set(areaNormalizada, {
        area: areaNormalizada,
        totalTemas: Number(item.total_temas),
        totalQuestoes: Number(item.total_questoes),
      });
    }
  });

  return Array.from(areasAgrupadas.values());
}

export const useQuestoesAreasCache = () => {
  const queryFn = useCallback(() => fetchQuestoesAreasStats(), []);

  const { data: areas, isLoading } = useInstantCache<AreaComContagem[]>({
    cacheKey: QUESTOES_AREAS_CACHE_KEY,
    queryFn,
  });

  const totalQuestoes = areas?.reduce((acc, item) => acc + item.totalQuestoes, 0) || 0;

  return {
    areas,
    isLoading,
    totalQuestoes,
  };
};
