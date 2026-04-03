import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Declare fbq on window
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    __fbPixelAdvancedMatch?: (userData: Record<string, string>) => void;
  }
}

type FacebookEventName =
  | 'PageView'
  | 'CompleteRegistration'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'Lead';

interface CustomData {
  content_name?: string;
  content_category?: string;
  content_type?: string;
  currency?: string;
  value?: number;
  status?: boolean;
  payment_method?: string;
  [key: string]: any;
}

const generateEventId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getCookie = (name: string): string | undefined => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : undefined;
};

/** Capture fbclid from URL and persist in localStorage */
export const captureFbclid = (): void => {
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) {
      localStorage.setItem('_fbclid', fbclid);
      localStorage.setItem('_fbclid_ts', Date.now().toString());
    }
  } catch (e) {
    // silently fail
  }
};

/** Get fbc value: cookie first, then construct from fbclid */
const getFbcValue = (): string | undefined => {
  const fbcCookie = getCookie('_fbc');
  if (fbcCookie) return fbcCookie;

  try {
    const params = new URLSearchParams(window.location.search);
    const fbclidUrl = params.get('fbclid');
    if (fbclidUrl) {
      return `fb.1.${Date.now()}.${fbclidUrl}`;
    }
  } catch (e) {
    // ignore
  }

  try {
    const stored = localStorage.getItem('_fbclid');
    const storedTs = localStorage.getItem('_fbclid_ts');
    if (stored) {
      const ts = storedTs ? parseInt(storedTs, 10) : Date.now();
      return `fb.1.${ts}.${stored}`;
    }
  } catch (e) {
    // ignore
  }

  return undefined;
};

/** Wait for _fbp cookie with retry (pixel takes ~1s to set it) */
const getFbpWithRetry = (maxRetries = 4, delayMs = 500): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const fbp = getCookie('_fbp');
    if (fbp) {
      resolve(fbp);
      return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const value = getCookie('_fbp');
      if (value || attempts >= maxRetries) {
        clearInterval(interval);
        resolve(value);
      }
    }, delayMs);
  });
};

/** Split full name into first name and last name */
const splitName = (fullName: string): { fn: string; ln: string } | null => {
  if (!fullName || !fullName.trim()) return null;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return null;
  const fn = parts[0];
  const ln = parts.length > 1 ? parts[parts.length - 1] : '';
  return ln ? { fn, ln } : { fn, ln: fn };
};

export const useFacebookPixel = () => {
  const { user } = useAuth();
  const phoneRef = useRef<string | null>(null);
  const fnRef = useRef<string | null>(null);
  const lnRef = useRef<string | null>(null);
  const stRef = useRef<string | null>(null);
  const countryRef = useRef<string | null>(null);
  const profileFetchedForRef = useRef<string | null>(null);
  const fbpRef = useRef<string | undefined>(undefined);

  // Capture fbclid on mount
  useEffect(() => {
    captureFbclid();
  }, []);

  // Pre-fetch _fbp with retry on mount
  useEffect(() => {
    getFbpWithRetry().then((value) => {
      fbpRef.current = value;
    });
  }, []);

  // Fetch user profile data (phone + name + state + country) and trigger advanced matching
  useEffect(() => {
    if (user?.id && profileFetchedForRef.current !== user.id) {
      profileFetchedForRef.current = user.id;
      supabase
        .from('profiles')
        .select('telefone, nome, estado_cadastro, pais_cadastro')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.telefone) {
            phoneRef.current = data.telefone.replace(/\D/g, '');
          }
          if (data?.nome) {
            const names = splitName(data.nome);
            if (names) {
              fnRef.current = names.fn;
              lnRef.current = names.ln;
            }
          }
          if ((data as any)?.estado_cadastro) {
            stRef.current = (data as any).estado_cadastro.toLowerCase().trim();
          }
          if ((data as any)?.pais_cadastro) {
            countryRef.current = (data as any).pais_cadastro.toLowerCase().trim();
          } else {
            countryRef.current = 'br'; // default for Brazilian app
          }

          // Advanced Matching: re-init pixel with user data
          const advData: Record<string, string> = {};
          if (user.email) advData.em = user.email;
          if (phoneRef.current) advData.ph = phoneRef.current;
          if (user.id) advData.external_id = user.id;
          if (fnRef.current) advData.fn = fnRef.current;
          if (lnRef.current) advData.ln = lnRef.current;
          if (stRef.current) advData.st = stRef.current;
          if (countryRef.current) advData.country = countryRef.current;

          if (Object.keys(advData).length > 0 && window.__fbPixelAdvancedMatch) {
            window.__fbPixelAdvancedMatch(advData);
          }
        });
    }
  }, [user?.id, user?.email]);

  const trackEvent = useCallback(
    (eventName: FacebookEventName, customData?: CustomData, testEventCode?: string) => {
      const eventId = generateEventId();

      // 1. Frontend Pixel
      try {
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', eventName, customData || {}, { eventID: eventId });
        }
      } catch (e) {
        console.warn('Facebook Pixel error:', e);
      }

      // 2. Server-side Conversions API
      const userData: Record<string, string> = {};
      if (user?.email) {
        userData.em = user.email;
      }
      if (user?.id) {
        userData.external_id = user.id;
      }

      // Phone
      if (phoneRef.current) {
        userData.ph = phoneRef.current;
      }

      // First name / Last name
      if (fnRef.current) {
        userData.fn = fnRef.current;
      }
      if (lnRef.current) {
        userData.ln = lnRef.current;
      }

      // State / Country
      if (stRef.current) {
        userData.st = stRef.current;
      }
      if (countryRef.current) {
        userData.country = countryRef.current;
      }

      // Get fbp (use cached value or try again)
      const fbp = fbpRef.current || getCookie('_fbp');
      const fbc = getFbcValue();
      if (fbp) userData.fbp = fbp;
      if (fbc) userData.fbc = fbc;

      supabase.functions
        .invoke('facebook-conversions', {
          body: {
            event_name: eventName,
            event_id: eventId,
            event_source_url: window.location.href,
            action_source: 'website',
            user_data: {
              ...userData,
              client_user_agent: navigator.userAgent,
            },
            custom_data: customData || undefined,
            ...(testEventCode && { test_event_code: testEventCode }),
          },
        })
        .catch((err) => console.warn('Facebook CAPI error:', err));
    },
    [user]
  );

  return { trackEvent };
};
