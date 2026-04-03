import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useUtmCapture } from '@/hooks/useUtmCapture';
import { captureFbclid } from '@/hooks/useFacebookPixel';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente wrapper para rastrear navegação de páginas e capturar UTMs
 * Deve ser usado dentro do BrowserRouter
 */
export const PageTracker = () => {
  const { search, pathname } = useLocation();
  const { user } = useAuth();
  const { trackEvent } = useFacebookPixel();

  useUtmCapture();
  usePageTracking();

  // Capture fbclid on every navigation (not just mount)
  useEffect(() => {
    captureFbclid();
  }, [search]);

  // Fire server-side PageView via CAPI for logged-in users
  useEffect(() => {
    if (!user?.id) return;
    // Skip admin routes
    if (pathname.startsWith('/admin')) return;

    trackEvent('PageView');
  }, [pathname, user?.id, trackEvent]);

  return null;
};
