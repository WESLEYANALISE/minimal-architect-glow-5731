import { useDeviceType } from './use-device-type';

/**
 * Hook que indica se deve usar grid (desktop) ou carousel (mobile/tablet).
 * Útil para adaptar componentes que mostram listas de cards.
 */
export const useResponsiveLayout = () => {
  const { isDesktop, isTablet, isMobile } = useDeviceType();

  return {
    /** Usar grid ao invés de carousel */
    useGrid: isDesktop,
    /** Usar carousel horizontal */
    useCarousel: !isDesktop,
    /** Número de colunas recomendado para grids */
    gridCols: isDesktop ? 4 : isTablet ? 3 : 2,
    /** Classe Tailwind para grid responsivo */
    gridClassName: isDesktop
      ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      : isTablet
        ? 'grid grid-cols-2 md:grid-cols-3 gap-3'
        : '',
    isDesktop,
    isTablet,
    isMobile,
  };
};
