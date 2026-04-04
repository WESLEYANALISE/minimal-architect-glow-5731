import { useEffect, useRef } from 'react';

let mpLoaded = false;
let pgLoaded = false;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/** Loads MercadoPago + PagBank SDKs on demand (call on payment pages) */
export function usePaymentSDK() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    if (!mpLoaded) {
      loadScript('https://sdk.mercadopago.com/js/v2')
        .then(() => { mpLoaded = true; })
        .catch(() => console.warn('[PaymentSDK] MercadoPago failed'));
    }

    if (!pgLoaded) {
      loadScript('https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js')
        .then(() => { pgLoaded = true; })
        .catch(() => console.warn('[PaymentSDK] PagBank failed'));
    }
  }, []);
}
