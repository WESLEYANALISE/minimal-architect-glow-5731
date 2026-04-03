import { useEffect } from 'react';

const UTM_STORAGE_KEY = 'utm_params';

export interface UtmParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

/**
 * Captura parâmetros UTM da URL e persiste no localStorage.
 * Deve ser chamado no nível mais alto do app.
 */
export const useUtmCapture = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmParams: UtmParams = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
    };

    // Só salva se pelo menos um parâmetro UTM estiver presente
    const hasUtm = Object.values(utmParams).some(Boolean);
    if (hasUtm) {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
    }
  }, []);
};

/**
 * Retorna os parâmetros UTM salvos no localStorage.
 */
export const getStoredUtmParams = (): UtmParams => {
  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  };
};
