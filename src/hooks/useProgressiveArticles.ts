import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIndexedDBCache } from './useIndexedDBCache';
import { sortArticles } from '@/lib/articleSorter';

// Tabelas que têm coluna ordem_artigo
const TABELAS_COM_ORDEM_ARTIGO = new Set([
  'CC - Código Civil',
  'CP - Código Penal',
  'CPC - Código de Processo Civil',
  'CPP - Código de Processo Penal',
  'CF - Constituição Federal',
  'CLT - Consolidação das Leis do Trabalho',
  'CDC – Código de Defesa do Consumidor',
  'CTN - Código Tributário Nacional',
  'ECA - Estatuto da Criança e do Adolescente',
  'CTB - Código de Trânsito Brasileiro',
  'LEP - Lei de Execução Penal',
  'LIA - Lei de Improbidade Administrativa',
  'LRF - Lei de Responsabilidade Fiscal',
  'LAI - Lei de Acesso à Informação',
  'Maria da Penha',
  'CDC – Código de Defesa do Consumidor',
]);

const getOrderColumn = (tableName: string): string => {
  return TABELAS_COM_ORDEM_ARTIGO.has(tableName) ? 'ordem_artigo' : 'id';
};

interface UseProgressiveArticlesOptions {
  tableName: string;
  initialChunk?: number;      // Primeiros N artigos (default: 200)
  backgroundChunk?: number;   // Quantos carregar por vez em background (default: 200)
  delayBetweenChunks?: number; // Delay entre chunks em ms (default: 50)
  enabled?: boolean;
  cacheKey?: string;
  idMin?: number;
  idMax?: number;
  idMaxExclusive?: number;
}

interface UseProgressiveArticlesReturn<T> {
  articles: T[];
  isLoadingInitial: boolean;  // True apenas enquanto carrega os primeiros 50
  isLoadingMore: boolean;     // True enquanto carrega em background
  progress: number;           // 0-100
  totalLoaded: number;
  isComplete: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook de carregamento progressivo para artigos de códigos/leis
 *
 * Estratégia:
 * 1. Verificar cache IndexedDB primeiro
 * 2. Se tem cache, mostrar instantaneamente e verificar atualizações em background
 * 3. Se não tem cache, carregar primeiros 50 artigos rapidamente
 * 4. Em background, carregar o resto automaticamente (sem precisar scroll)
 * 5. Salvar tudo no cache para próxima visita ser instantânea
 */
export const useProgressiveArticles = <T = any>({
  tableName,
  initialChunk = 200,
  backgroundChunk = 200,
  delayBetweenChunks = 50,
  enabled = true,
  cacheKey,
  idMin,
  idMax,
  idMaxExclusive
}: UseProgressiveArticlesOptions): UseProgressiveArticlesReturn<T> => {
  const [articles, setArticles] = useState<T[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const hasInitialized = useRef(false);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const effectiveCacheKey =
    cacheKey || `${tableName}:${idMin ?? 'min'}:${idMaxExclusive ?? idMax ?? 'max'}`;

  const { cachedData, isLoadingCache, saveToCache, clearCache } = useIndexedDBCache<T>(effectiveCacheKey);
  const skipCacheRef = useRef(false);

  const applyIdFilters = useCallback((query: any) => {
    let filteredQuery = query;

    if (typeof idMin === 'number') {
      filteredQuery = filteredQuery.gte('id', idMin);
    }

    if (typeof idMaxExclusive === 'number') {
      filteredQuery = filteredQuery.lt('id', idMaxExclusive);
    } else if (typeof idMax === 'number') {
      filteredQuery = filteredQuery.lte('id', idMax);
    }

    return filteredQuery;
  }, [idMin, idMax, idMaxExclusive]);

  // Função para ordenar artigos se tiver "Número do Artigo"
  const sortIfNeeded = useCallback((data: T[]): T[] => {
    if (data.length > 0 && "Número do Artigo" in (data[0] as any)) {
      return sortArticles(data as any) as T[];
    }
    return data;
  }, []);

  // Função para buscar um chunk de artigos
  const fetchChunk = useCallback(async (offset: number, limit: number): Promise<T[]> => {
    const orderColumn = getOrderColumn(tableName);

    const baseQuery = supabase
      .from(tableName as any)
      .select('*')
      .order(orderColumn, { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error } = await applyIdFilters(baseQuery);

    if (error) throw error;
    return (data || []) as T[];
  }, [tableName, applyIdFilters]);

  // Carregamento progressivo em background
  const loadProgressively = useCallback(async (startOffset: number = 0) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    abortControllerRef.current = new AbortController();

    try {
      let offset = startOffset;
      let hasMore = true;

      while (hasMore) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const chunk = await fetchChunk(offset, backgroundChunk);

        if (chunk.length === 0) {
          hasMore = false;
          break;
        }

        setArticles(prev => {
          const existingIds = new Set(prev.map((a: any) => a.id));
          const newArticles = chunk.filter((a: any) => !existingIds.has(a.id));

          if (newArticles.length === 0) {
            return prev;
          }

          const combined = [...prev, ...newArticles];
          return sortIfNeeded(combined);
        });

        offset += backgroundChunk;
        hasMore = chunk.length === backgroundChunk;

        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
        }
      }

      setIsComplete(true);
      setIsLoadingMore(false);

      setArticles(current => {
        if (current.length > 0) {
          saveToCache(current);
        }
        return current;
      });

    } catch (err) {
      console.error(`[${tableName}] Erro no carregamento progressivo:`, err);
      setError(err as Error);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [tableName, backgroundChunk, delayBetweenChunks, fetchChunk, saveToCache, sortIfNeeded]);

  // Carregamento inicial
  const loadInitial = useCallback(async () => {
    if (!enabled || hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      if (!skipCacheRef.current && cachedData && cachedData.length > 0) {
        const sorted = sortIfNeeded(cachedData);
        setArticles(sorted);
        setIsLoadingInitial(false);
        setIsComplete(true);
        console.log(`📦 [${tableName}] Cache carregado: ${sorted.length} artigos`);

        // Verificar atualizações rapidamente (500ms) para evitar mostrar cache obsoleto
        setTimeout(() => {
          checkForUpdates(sorted.length);
        }, 500);
        return;
      }

      console.log(`⚡ [${tableName}] Carregando primeiros ${initialChunk} artigos...`);
      const initialData = await fetchChunk(0, initialChunk);

      if (initialData.length > 0) {
        const sorted = sortIfNeeded(initialData);
        setArticles(sorted);
        setIsLoadingInitial(false);
        console.log(`✅ [${tableName}] Primeiros ${sorted.length} artigos carregados`);

        if (initialData.length === initialChunk) {
          setIsLoadingMore(true);
          setTimeout(() => {
            loadProgressively(initialChunk);
          }, 100);
        } else {
          setIsComplete(true);
          saveToCache(sorted);
        }
      } else {
        setIsLoadingInitial(false);
        setIsComplete(true);
      }

    } catch (err) {
      console.error(`[${tableName}] Erro no carregamento inicial:`, err);
      setError(err as Error);
      setIsLoadingInitial(false);
    }
  }, [enabled, cachedData, tableName, initialChunk, fetchChunk, sortIfNeeded, loadProgressively, saveToCache]);

  // Verificar atualizações em background (quando tem cache)
  const checkForUpdates = useCallback(async (cachedCount: number) => {
    try {
      const countQuery = supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });

      const { count } = await applyIdFilters(countQuery);

      if (count && count !== cachedCount) {
        console.log(`🔄 [${tableName}] Detectada mudança: ${cachedCount} → ${count} artigos. Limpando cache...`);
        await clearCache();
        skipCacheRef.current = true;
        setIsLoadingMore(true);
        hasInitialized.current = false;
        setArticles([]);
        setTimeout(() => {
          loadInitialRef.current();
        }, 50);
      }
    } catch (err) {
      console.error(`[${tableName}] Erro ao verificar atualizações:`, err);
    }
  }, [tableName, clearCache, applyIdFilters]);

  const loadInitialRef = useRef(loadInitial);
  loadInitialRef.current = loadInitial;

  useEffect(() => {
    if (!enabled) return;
    if (isLoadingCache) return;

    loadInitialRef.current();

    return () => {
      abortControllerRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isLoadingCache]);

  const refresh = useCallback(() => {
    abortControllerRef.current?.abort();
    hasInitialized.current = false;
    isLoadingRef.current = false;
    setArticles([]);
    setIsLoadingInitial(true);
    setIsLoadingMore(false);
    setIsComplete(false);
    setError(null);

    setTimeout(() => {
      loadInitial();
    }, 50);
  }, [loadInitial]);

  const progress = isComplete
    ? 100
    : articles.length > 0
      ? Math.min(99, Math.round((articles.length / (articles.length + backgroundChunk)) * 100))
      : 0;

  return {
    articles,
    isLoadingInitial: isLoadingInitial && !cachedData?.length,
    isLoadingMore,
    progress,
    totalLoaded: articles.length,
    isComplete,
    error,
    refresh
  };
};