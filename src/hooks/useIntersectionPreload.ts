import { useEffect, useRef } from 'react';

/**
 * Hook that preloads images when a container element approaches the viewport.
 * Uses IntersectionObserver with generous rootMargin (200px) to start loading
 * images before the user scrolls to them — pattern used by YouTube/Netflix.
 */
export function useIntersectionPreload(
  imageUrls: string[],
  options?: { rootMargin?: string; enabled?: boolean }
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const rootMargin = options?.rootMargin ?? '200px';
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || loadedRef.current || imageUrls.length === 0) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadedRef.current = true;
          observer.disconnect();

          // Preload images in batches to avoid network congestion
          imageUrls.forEach((url, i) => {
            if (!url || typeof url !== 'string') return;
            setTimeout(() => {
              const img = new Image();
              img.src = url;
            }, i * 30);
          });
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [imageUrls, rootMargin, enabled]);

  return containerRef;
}

export default useIntersectionPreload;
