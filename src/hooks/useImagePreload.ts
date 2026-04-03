/**
 * useImagePreload — Thin wrapper over useInstantCache
 * 
 * Mantido para retrocompatibilidade. Internamente delega ao useInstantCache
 * para evitar caches duplicados em memória.
 */
import { useEffect, useState, useCallback } from 'react';
import { 
  isImagePreloaded, 
  markImageLoaded as markInInstantCache,
  preloadImages 
} from './useInstantCache';

/**
 * Hook para pré-carregar uma lista de imagens
 */
export function useImagePreload(urls: string[]) {
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(() => {
    const cached = new Set<string>();
    urls.forEach(url => {
      if (url && isImagePreloaded(url)) {
        cached.add(url);
      }
    });
    return cached;
  });

  useEffect(() => {
    const urlsToLoad = urls.filter(url => url && !isImagePreloaded(url));
    if (urlsToLoad.length === 0) return;

    urlsToLoad.forEach(url => {
      const img = new Image();
      img.onload = () => {
        markInInstantCache(url);
        setLoadedUrls(prev => new Set([...prev, url]));
      };
      img.onerror = () => {
        // Mark as "loaded" to avoid infinite skeleton
        markInInstantCache(url);
      };
      img.src = url;
    });
  }, [urls.join(',')]);

  const isLoaded = useCallback((url: string) => {
    return loadedUrls.has(url) || isImagePreloaded(url);
  }, [loadedUrls]);

  return { loadedUrls, isLoaded };
}

/**
 * Hook para verificar se uma única imagem está em cache
 */
export function useImageCached(url: string | undefined | null) {
  const [isLoaded, setIsLoaded] = useState(() => {
    if (!url) return true;
    return isImagePreloaded(url);
  });

  useEffect(() => {
    if (!url) { setIsLoaded(true); return; }
    if (isImagePreloaded(url)) { setIsLoaded(true); return; }

    const img = new Image();
    img.onload = () => {
      markInInstantCache(url);
      setIsLoaded(true);
    };
    img.onerror = () => {
      markInInstantCache(url);
      setIsLoaded(true);
    };
    img.src = url;
  }, [url]);

  return isLoaded;
}

/**
 * Marcar uma imagem como carregada (delega ao useInstantCache)
 */
export function markImageLoaded(url: string) {
  if (url) markInInstantCache(url);
}

/**
 * Verificar se uma imagem está no cache
 */
export function isImageCached(url: string): boolean {
  return isImagePreloaded(url);
}

export default useImagePreload;
