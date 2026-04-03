import { useState, useEffect } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VadeMecumDB extends DBSchema {
  articles: {
    key: string;
    value: {
      tableName: string;
      data: any[];
      timestamp: number;
    };
  };
}

const DB_NAME = 'vade-mecum-db';
const DB_VERSION = 12; // Incrementado para limpeza de cache bloated
const CACHE_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 dias (reduzido de 30)

let dbPromise: Promise<IDBPDatabase<VadeMecumDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<VadeMecumDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // PRESERVA cache existente - só cria store se não existir
        if (!db.objectStoreNames.contains('articles')) {
          db.createObjectStore('articles');
          console.log('📦 IndexedDB: Object store "articles" criado');
        }
        
        // Log de versão para debug
        if (oldVersion > 0) {
          console.log(`📦 IndexedDB: Upgrade de v${oldVersion} para v${DB_VERSION} (cache preservado)`);
        }
      },
    });

    // Limpeza automática de entradas antigas no startup
    dbPromise.then(async (db) => {
      try {
        const tx = db.transaction('articles', 'readwrite');
        const store = tx.objectStore('articles');
        const allKeys = await store.getAllKeys();
        const now = Date.now();
        let cleaned = 0;

        for (const key of allKeys) {
          const entry = await store.get(key);
          if (entry && (now - entry.timestamp) > CACHE_DURATION) {
            await store.delete(key);
            cleaned++;
          }
        }

        await tx.done;
        if (cleaned > 0) {
          console.log(`🧹 IndexedDB: ${cleaned} entradas expiradas removidas`);
        }
      } catch (err) {
        console.warn('IndexedDB cleanup error:', err);
      }
    });
  }
  return dbPromise;
};

export const useIndexedDBCache = <T = any>(tableName: string) => {
  const [cachedData, setCachedData] = useState<T[] | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const db = await getDB();
        const cached = await db.get('articles', tableName);

        if (cached) {
          const age = Date.now() - cached.timestamp;
          
          // Se cache está válido (menos de 7 dias)
          if (age < CACHE_DURATION) {
            setCachedData(cached.data as T[]);
          } else {
            // Cache expirado, remove
            await db.delete('articles', tableName);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar cache do IndexedDB:', error);
      } finally {
        setIsLoadingCache(false);
      }
    };

    loadCache();
  }, [tableName]);

  const saveToCache = async (data: T[]) => {
    try {
      const db = await getDB();
      await db.put('articles', {
        tableName,
        data,
        timestamp: Date.now(),
      }, tableName);
    } catch (error) {
      console.error('Erro ao salvar no IndexedDB:', error);
    }
  };

  const clearCache = async () => {
    try {
      const db = await getDB();
      await db.delete('articles', tableName);
      setCachedData(null);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  return {
    cachedData,
    isLoadingCache,
    saveToCache,
    clearCache,
  };
};
