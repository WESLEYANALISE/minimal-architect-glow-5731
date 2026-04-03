import { useCallback } from 'react';
import { useInstantCache, saveToInstantCache } from './useInstantCache';
import { supabase } from '@/integrations/supabase/client';

interface ResumoAreaStats {
  area: string;
  count: number;
  capa?: string;
}

interface ResumoTemaStats {
  tema: string;
  ordem: string;
  count: number;
}

export const RESUMOS_AREAS_CACHE_KEY = 'resumos-areas-stats-v1';
export const resumosTemasCacheKey = (area: string) => `resumos-temas-${area.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;

// Fetch áreas de resumos
export async function fetchResumosAreasStats(): Promise<ResumoAreaStats[]> {
  let allData: { area: string; url_imagem_resumo: string | null }[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('RESUMO')
      .select('area, url_imagem_resumo')
      .not('area', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...(data as { area: string; url_imagem_resumo: string | null }[])];
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  const areaMap = new Map<string, { count: number; capa?: string }>();
  allData.forEach((item) => {
    if (item.area) {
      const existing = areaMap.get(item.area);
      if (existing) {
        existing.count++;
        if (!existing.capa && item.url_imagem_resumo) {
          existing.capa = item.url_imagem_resumo;
        }
      } else {
        areaMap.set(item.area, {
          count: 1,
          capa: item.url_imagem_resumo || undefined
        });
      }
    }
  });

  return Array.from(areaMap.entries())
    .map(([area, data]) => ({ area, ...data }))
    .sort((a, b) => a.area.localeCompare(b.area));
}

// Fetch temas de uma área
export async function fetchResumosTemas(area: string): Promise<ResumoTemaStats[]> {
  let allData: any[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('RESUMO')
      .select('tema, "ordem Tema"')
      .eq('area', area)
      .not('tema', 'is', null)
      .range(offset, offset + batchSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = [...allData, ...data];
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  const temaMap = new Map<string, { tema: string; ordem: string; count: number }>();
  allData.forEach((item: any) => {
    if (item.tema) {
      const existing = temaMap.get(item.tema);
      if (existing) {
        existing.count++;
      } else {
        temaMap.set(item.tema, {
          tema: item.tema,
          ordem: item["ordem Tema"] || "0",
          count: 1,
        });
      }
    }
  });

  return Array.from(temaMap.values()).sort((a, b) => {
    const ordemA = parseFloat(a.ordem) || 0;
    const ordemB = parseFloat(b.ordem) || 0;
    return ordemA - ordemB;
  });
}

// Hook para áreas
export const useResumosAreasCache = () => {
  const queryFn = useCallback(() => fetchResumosAreasStats(), []);

  const { data: areas, isLoading } = useInstantCache<ResumoAreaStats[]>({
    cacheKey: RESUMOS_AREAS_CACHE_KEY,
    queryFn,
  });

  const totalResumos = areas?.reduce((acc, a) => acc + a.count, 0) || 0;
  const totalAreas = areas?.length || 0;

  return { areas, isLoading, totalResumos, totalAreas };
};

// Hook para temas de uma área
export const useResumosTemas = (area: string) => {
  const cacheKey = resumosTemasCacheKey(area);
  const queryFn = useCallback(() => fetchResumosTemas(area), [area]);

  const { data: temas, isLoading } = useInstantCache<ResumoTemaStats[]>({
    cacheKey,
    queryFn,
    enabled: !!area,
  });

  const totalResumos = temas?.reduce((acc, t) => acc + t.count, 0) || 0;

  return { temas: temas || [], isLoading, totalResumos };
};
