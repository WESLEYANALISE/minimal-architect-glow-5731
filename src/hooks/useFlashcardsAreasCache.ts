import { useCallback } from 'react';
import { useInstantCache, saveToInstantCache } from './useInstantCache';
import { supabase } from '@/integrations/supabase/client';

interface FlashcardAreaStats {
  area: string;
  totalFlashcards: number;
  totalTemas: number;
  urlCapa?: string;
}

export const FLASHCARDS_AREAS_CACHE_KEY = 'flashcards-areas-stats-v2';

// Áreas a excluir
const AREAS_EXCLUIDAS = ['revisao oab'];

// Função para normalizar strings para comparação
const normalizar = (str: string) =>
  str.trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

// Função de fetch exportada para reuso no preloader
export async function fetchFlashcardsAreasStats(): Promise<FlashcardAreaStats[]> {
  // 1. Buscar áreas da BIBLIOTECA-ESTUDOS
  const { data: bibliotecaData, error: bibliotecaError } = await supabase
    .from('BIBLIOTECA-ESTUDOS')
    .select('"Área", url_capa_gerada, "Capa-area"')
    .not('Área', 'is', null);

  if (bibliotecaError) throw bibliotecaError;

  const areasMap = new Map<string, { capa: string | null; count: number; nomeOriginal: string }>();

  (bibliotecaData as { Área: string | null; url_capa_gerada: string | null; "Capa-area": string | null }[] | null)?.forEach(item => {
    if (item.Área) {
      const areaNorm = normalizar(item.Área);
      if (AREAS_EXCLUIDAS.includes(areaNorm)) return;

      const existing = areasMap.get(areaNorm);
      if (!existing) {
        areasMap.set(areaNorm, {
          capa: item.url_capa_gerada || item["Capa-area"] || null,
          count: 1,
          nomeOriginal: item.Área.trim()
        });
      } else {
        existing.count++;
        if (!existing.capa) {
          existing.capa = item.url_capa_gerada || item["Capa-area"] || null;
        }
      }
    }
  });

  // 2. Buscar áreas do RESUMO em lotes
  let resumoOffset = 0;
  const BATCH_SIZE = 1000;
  const resumoAreasSet = new Set<string>();

  while (true) {
    const { data: resumoBatch } = await supabase
      .from('RESUMO')
      .select('area')
      .not('area', 'is', null)
      .range(resumoOffset, resumoOffset + BATCH_SIZE - 1);

    if (!resumoBatch || resumoBatch.length === 0) break;
    resumoBatch.forEach((r: { area: string }) => {
      if (r.area) resumoAreasSet.add(r.area.trim());
    });
    if (resumoBatch.length < BATCH_SIZE) break;
    resumoOffset += BATCH_SIZE;
  }

  resumoAreasSet.forEach(areaName => {
    const areaNorm = normalizar(areaName);
    if (AREAS_EXCLUIDAS.includes(areaNorm)) return;
    if (!areasMap.has(areaNorm)) {
      areasMap.set(areaNorm, { capa: null, count: 1, nomeOriginal: areaName });
    }
  });

  // 3. Buscar contagem de flashcards por área
  const { data: flashcardsCount } = await supabase.rpc('get_flashcard_areas_from_gerados');

  // 4. Combinar dados
  return Array.from(areasMap.entries()).map(([areaNorm, data]) => {
    const fcData = flashcardsCount?.find((f: { area: string; total_flashcards: number }) =>
      normalizar(f.area) === areaNorm
    );

    return {
      area: data.nomeOriginal,
      totalFlashcards: fcData?.total_flashcards || 0,
      totalTemas: data.count,
      urlCapa: data.capa || undefined
    };
  }).sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
}

export const useFlashcardsAreasCache = () => {
  const queryFn = useCallback(() => fetchFlashcardsAreasStats(), []);

  const { data: areas, isLoading } = useInstantCache<FlashcardAreaStats[]>({
    cacheKey: FLASHCARDS_AREAS_CACHE_KEY,
    queryFn,
  });

  const totalFlashcards = areas?.reduce((acc, item) => acc + item.totalFlashcards, 0) || 0;
  const totalAreas = areas?.length || 0;

  return {
    areas,
    isLoading,
    totalFlashcards,
    totalAreas,
  };
};
