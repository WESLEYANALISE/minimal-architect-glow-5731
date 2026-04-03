import { useEffect } from 'react';
import { APP_VERSION } from '@/lib/appVersion';

const VERSION_KEY = 'app_version';

export function useForceUpdate() {
  useEffect(() => {
    const stored = localStorage.getItem(VERSION_KEY);

    if (stored === APP_VERSION) return;

    // Versão diferente ou ausente — limpar tudo e recarregar
    (async () => {
      try {
        // 1. Limpar todos os caches do Workbox / CacheStorage
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));

        // 2. Desregistrar todos os Service Workers
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }

        // 3. Limpar sessionStorage
        sessionStorage.clear();
      } catch (e) {
        console.warn('[useForceUpdate] Erro ao limpar caches:', e);
      } finally {
        // 4. Salvar nova versão e forçar reload
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        window.location.reload();
      }
    })();
  }, []);
}
