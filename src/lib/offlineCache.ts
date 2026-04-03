import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'offline-cache-db';
const DB_VERSION = 1;

const getDB = () => openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('flashcards')) db.createObjectStore('flashcards');
    if (!db.objectStoreNames.contains('resumos')) db.createObjectStore('resumos');
    if (!db.objectStoreNames.contains('artigos')) db.createObjectStore('artigos');
  },
});

export async function saveOffline(store: string, key: string, data: any) {
  const db = await getDB();
  await db.put(store, { data, timestamp: Date.now() }, key);
}

export async function getOffline<T = any>(store: string, key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const entry = await db.get(store, key);
    return entry?.data ?? null;
  } catch { return null; }
}

export async function clearOfflineCache(store: string) {
  const db = await getDB();
  const tx = db.transaction(store, 'readwrite');
  await tx.objectStore(store).clear();
  await tx.done;
}

export async function clearAllOfflineCache() {
  const db = await getDB();
  for (const name of ['flashcards', 'resumos', 'artigos']) {
    if (db.objectStoreNames.contains(name)) {
      const tx = db.transaction(name, 'readwrite');
      await tx.objectStore(name).clear();
      await tx.done;
    }
  }
}

export async function getOfflineCacheStats(): Promise<{ store: string; count: number; sizeKB: number }[]> {
  const db = await getDB();
  const results: { store: string; count: number; sizeKB: number }[] = [];
  
  for (const name of ['flashcards', 'resumos', 'artigos']) {
    if (db.objectStoreNames.contains(name)) {
      try {
        const tx = db.transaction(name, 'readonly');
        const store = tx.objectStore(name);
        const keys = await store.getAllKeys();
        let totalSize = 0;
        for (const key of keys) {
          const val = await store.get(key);
          totalSize += JSON.stringify(val).length;
        }
        results.push({ store: name, count: keys.length, sizeKB: Math.round(totalSize / 1024) });
      } catch { results.push({ store: name, count: 0, sizeKB: 0 }); }
    }
  }
  return results;
}
