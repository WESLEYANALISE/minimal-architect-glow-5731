import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getStoredUtmParams } from '@/hooks/useUtmCapture';

// Gera um ID de sessão único
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('page_tracking_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('page_tracking_session_id', sessionId);
  }
  return sessionId;
};

// Detecta o tipo de dispositivo
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Windows Phone/.test(ua)) return 'Windows Phone';
  if (/Tablet/.test(ua)) return 'Tablet';
  if (/Mobile/.test(ua)) return 'Mobile';
  return 'Desktop';
};

// Mapeia paths para títulos amigáveis
const getPageTitle = (path: string): string => {
  const titles: Record<string, string> = {
    '/': 'Início',
    '/vade-mecum': 'Vade Mecum',
    '/bibliotecas': 'Bibliotecas',
    '/resumos-juridicos': 'Resumos Jurídicos',
    '/videoaulas': 'Videoaulas',
    '/flashcards': 'Flashcards',
    '/ferramentas/questoes': 'Questões',
    '/constituicao': 'Constituição',
    '/codigos': 'Códigos e Leis',
    '/estatutos': 'Estatutos',
    '/sumulas': 'Súmulas',
    '/assinatura': 'Assinatura Premium',
    '/perfil': 'Perfil',
    '/pesquisar': 'Pesquisar',
    '/oab-trilhas': 'OAB Primeira Fase',
    '/advogado': 'Carreira Advogado',
    '/primeiros-passos': 'Conceitos',
    
  };
  
  return titles[path] || path.replace(/\//g, ' ').trim() || 'Página';
};

// Cache geo data per session
const getGeoData = async (): Promise<{ country?: string; region?: string }> => {
  const cached = sessionStorage.getItem('page_tracking_geo');
  if (cached) {
    try { return JSON.parse(cached); } catch { /* ignore */ }
  }

  try {
    const { data } = await supabase.functions.invoke('capturar-ip');
    const geo = {
      country: data?.countryCode || data?.country || null,
      region: data?.region || null,
    };
    sessionStorage.setItem('page_tracking_geo', JSON.stringify(geo));
    return geo;
  } catch {
    return {};
  }
};

export const usePageTracking = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const lastTrackedPath = useRef<string>('');
  const sessionId = useRef<string>(getSessionId());

  useEffect(() => {
    // Evita rastrear a mesma página múltiplas vezes
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    // Ignora rotas de admin para não poluir estatísticas
    if (pathname.startsWith('/admin')) return;

    const trackPageView = async () => {
      try {
        const [utmParams, geoData] = await Promise.all([
          Promise.resolve(getStoredUtmParams()),
          getGeoData(),
        ]);
        await supabase.from('page_views').insert({
          user_id: user?.id || null,
          session_id: sessionId.current,
          page_path: pathname,
          page_title: getPageTitle(pathname),
          referrer: document.referrer || null,
          device: getDeviceType(),
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
          utm_content: utmParams.utm_content,
          utm_term: utmParams.utm_term,
          country: geoData.country || null,
          region: geoData.region || null,
        } as any);
      } catch (error) {
        // Silenciosamente falha para não afetar UX
        console.debug('Page tracking error:', error);
      }
    };

    // Pequeno delay para não bloquear renderização
    const timeoutId = setTimeout(trackPageView, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname, user?.id]);
};
