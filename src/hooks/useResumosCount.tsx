import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ResumosCount {
  resumosMateria: number;
  resumosArtigosLei: number;
  resumosCornell: number;
  resumosFeynman: number;
  total: number;
}

const CACHE_KEY = 'resumos-count-cache-v2';
const REVALIDATE_INTERVAL = 1000 * 60 * 5; // 5 minutos

export const useResumosCount = () => {
  const [counts, setCounts] = useState<ResumosCount | null>(() => {
    // Carregar do localStorage instantaneamente
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data } = JSON.parse(cached);
        return data;
      }
    } catch (e) {
      console.error('Erro ao ler cache de resumos:', e);
    }
    return null;
  });

  const [lastFetchTime, setLastFetchTime] = useState<number | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        return timestamp;
      }
    } catch (e) {
      return null;
    }
    return null;
  });

  const fetchFromSupabase = useCallback(async (): Promise<ResumosCount> => {
    // Uma única RPC ao invés de 4 queries separadas
    const { data, error } = await supabase.rpc("get_resumos_counts" as any);
    if (error) throw error;
    
    const row = Array.isArray(data) ? data[0] : data;
    const materiaCount = Number(row?.resumos_materia) || 0;
    const artigosCount = Number(row?.resumos_artigos_lei) || 0;
    const cornellCount = Number(row?.resumos_cornell) || 0;
    const feynmanCount = Number(row?.resumos_feynman) || 0;

    return {
      resumosMateria: materiaCount,
      resumosArtigosLei: artigosCount,
      resumosCornell: cornellCount,
      resumosFeynman: feynmanCount,
      total: materiaCount + artigosCount + cornellCount + feynmanCount,
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const shouldRevalidate = !lastFetchTime || (Date.now() - lastFetchTime > REVALIDATE_INTERVAL);
      
      if (!counts) {
        // Sem cache - carrega normalmente
        try {
          const data = await fetchFromSupabase();
          setCounts(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro ao carregar contagem de resumos:', error);
        }
      } else if (shouldRevalidate) {
        // Com cache - revalida em background sem mostrar loading
        try {
          const data = await fetchFromSupabase();
          setCounts(data);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
          setLastFetchTime(Date.now());
        } catch (error) {
          console.error('Erro na revalidação em background:', error);
        }
      }
    };

    loadData();
  }, [counts, fetchFromSupabase, lastFetchTime]);

  return {
    data: counts,
    isLoading: false,
    totalResumos: counts?.total || 0,
    resumosMateria: counts?.resumosMateria || 0,
    resumosArtigosLei: counts?.resumosArtigosLei || 0,
    resumosCornell: counts?.resumosCornell || 0,
    resumosFeynman: counts?.resumosFeynman || 0,
  };
};

export const invalidateResumosCache = () => {
  localStorage.removeItem(CACHE_KEY);
};
