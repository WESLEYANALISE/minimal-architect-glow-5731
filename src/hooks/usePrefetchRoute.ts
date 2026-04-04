import { useCallback, useRef } from 'react';

// Map of route paths to their lazy import functions
const ROUTE_IMPORTS: Record<string, () => Promise<any>> = {
  '/bibliotecas': () => import('../pages/Bibliotecas'),
  '/vade-mecum': () => import('../pages/VadeMecumTodas'),
  '/cursos': () => import('../pages/Cursos'),
  '/flashcards': () => import('../pages/FlashcardsAreas'),
  '/ferramentas': () => import('../pages/Ferramentas'),
  '/noticias-juridicas': () => import('../pages/NoticiasJuridicas'),
  '/questoes': () => import('../pages/ferramentas/QuestoesHub'),
  '/resumos': () => import('../pages/ResumosJuridicosTrilhas'),
  '/juriflix': () => import('../pages/JuriFlix'),
  '/blogger-juridico': () => import('../pages/BloggerJuridico'),
  '/pesquisar': () => import('../pages/Pesquisar'),
  '/jogos-juridicos': () => import('../pages/JogosJuridicos'),
  '/tela-hub': () => import('../pages/TelaHub'),
  '/codigos': () => import('../pages/Codigos'),
  '/simulados': () => import('../pages/ferramentas/SimuladosHub'),
  '/chat-professora': () => import('../pages/ChatProfessora'),
  '/funcoes': () => import('../pages/Funcoes'),
  '/documentarios': () => import('../pages/Documentarios'),
  '/dicionario-juridico': () => import('../pages/Dicionario'),
  '/modo-desktop': () => import('../pages/ModoDesktop'),
};

const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route chunk on hover (desktop pattern used by Astro, Nuxt, Qwik).
 * Returns an onMouseEnter handler to attach to navigation elements.
 */
export function usePrefetchRoute() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const prefetch = useCallback((route: string) => {
    if (prefetchedRoutes.has(route)) return;

    // Find matching import — try exact match first, then prefix match
    const importFn = ROUTE_IMPORTS[route];
    if (!importFn) return;

    prefetchedRoutes.add(route);
    importFn().catch(() => {
      // Remove from set so it can be retried
      prefetchedRoutes.delete(route);
    });
  }, []);

  const onHoverStart = useCallback((route: string) => {
    // Small delay to avoid prefetching on accidental hovers
    timeoutRef.current = setTimeout(() => prefetch(route), 80);
  }, [prefetch]);

  const onHoverEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { prefetch, onHoverStart, onHoverEnd };
}

export default usePrefetchRoute;
