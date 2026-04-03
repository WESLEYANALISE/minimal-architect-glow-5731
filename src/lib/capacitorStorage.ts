import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

// In-memory cache for sync reads, backed by async Capacitor Preferences on native
const cache = new Map<string, string>();

// Pre-load cached session keys from Preferences on native startup
let initialized = false;
async function initCache() {
  if (initialized || !isNative) return;
  initialized = true;
  try {
    const keys = [
      'sb-izspjvegxdfgkgibpyst-auth-token',
    ];
    for (const key of keys) {
      const { value } = await Preferences.get({ key });
      if (value !== null) {
        cache.set(key, value);
      }
    }
  } catch (e) {
    console.warn('[capacitorStorage] init error:', e);
  }
}

// Start loading immediately
if (isNative) {
  initCache();
}

/**
 * Custom storage adapter for Supabase auth.
 * On native: uses Capacitor Preferences (persists across OS memory cleanup).
 * On web: falls back to localStorage.
 */
export const capacitorStorage = {
  getItem(key: string): string | null {
    if (!isNative) return localStorage.getItem(key);
    return cache.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    if (!isNative) {
      localStorage.setItem(key, value);
      return;
    }
    cache.set(key, value);
    Preferences.set({ key, value }).catch((e) =>
      console.warn('[capacitorStorage] setItem error:', e)
    );
  },

  removeItem(key: string): void {
    if (!isNative) {
      localStorage.removeItem(key);
      return;
    }
    cache.delete(key);
    Preferences.remove({ key }).catch((e) =>
      console.warn('[capacitorStorage] removeItem error:', e)
    );
  },
};
