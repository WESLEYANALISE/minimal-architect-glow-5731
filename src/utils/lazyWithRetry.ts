import { lazy } from 'react';

/**
 * Wrapper around React.lazy that retries on chunk load failure (stale deploy).
 * On failure, reloads the page once to get fresh asset references.
 */
export function lazyWithRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((err) => {
      // Only auto-reload once per session to avoid infinite loops
      const key = 'chunk_reload_ts';
      const last = sessionStorage.getItem(key);
      const now = Date.now();

      if (!last || now - Number(last) > 10000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }

      throw err;
    })
  );
}
