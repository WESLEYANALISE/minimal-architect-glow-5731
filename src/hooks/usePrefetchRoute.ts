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
  '/resumos-juridicos': () => import('../pages/ResumosJuridicosTrilhas'),
  '/juriflix': () => import('../pages/JuriFlix'),
  '/blogger-juridico': () => import('../pages/BloggerJuridico'),
  '/pesquisar': () => import('../pages/Pesquisar'),
  '/jogos-juridicos': () => import('../pages/JogosJuridicos'),
  '/tela-hub': () => import('../pages/TelaHub'),
  '/videoaulas': () => import('../pages/TelaHub'),
  '/codigos': () => import('../pages/Codigos'),
  '/simulados': () => import('../pages/ferramentas/SimuladosHub'),
  '/chat-professora': () => import('../pages/ChatProfessora'),
  '/modo-desktop': () => import('../pages/ModoDesktop'),
  '/audioaulas': () => import('../pages/AudioaulasSpotify'),
  '/aulas': () => import('../pages/AulasPage'),
  '/aulas-em-tela': () => import('../pages/AulasEmTelaPage'),
};

const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route chunk on hover/touch/focus.
 * Returns handlers to attach to navigation elements.
 */
export function usePrefetchRoute() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const prefetch = useCallback((route: string) => {
    if (prefetchedRoutes.has(route)) return;

    const importFn = ROUTE_IMPORTS[route];
    if (!importFn) return;

    prefetchedRoutes.add(route);
    importFn().catch(() => {
      prefetchedRoutes.delete(route);
    });
  }, []);

  const onHoverStart = useCallback((route: string) => {
    timeoutRef.current = setTimeout(() => prefetch(route), 80);
  }, [prefetch]);

  const onHoverEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Mobile: prefetch imediatamente no toque (sem delay)
  const onTouchStart = useCallback((route: string) => {
    prefetch(route);
  }, [prefetch]);

  return { prefetch, onHoverStart, onHoverEnd, onTouchStart };
}

export default usePrefetchRoute;
