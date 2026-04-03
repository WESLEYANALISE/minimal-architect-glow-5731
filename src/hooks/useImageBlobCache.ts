import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ImageCacheDB extends DBSchema {
  images: {
    key: string;
    value: {
      url: string;
      blob: Blob;
      timestamp: number;
      size: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'image-cache-db';
const DB_VERSION = 2; // Incrementado para novos limites
const MAX_IMAGES = 30; // REDUZIDO: Máximo de imagens no cache
const MAX_SIZE_MB = 15; // REDUZIDO: Limite de espaço em MB

let dbPromise: Promise<IDBPDatabase<ImageCacheDB>> | null = null;

// Cache em memória para URLs já convertidas (evita abrir IndexedDB repetidamente)
const memoryCache = new Map<string, string>();

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<ImageCacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('images')) {
          const store = db.createObjectStore('images', { keyPath: 'url' });
          store.createIndex('by-timestamp', 'timestamp');
          console.log('🖼️ IndexedDB: Store de imagens criado');
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Verifica se uma imagem está no cache (memória ou IndexedDB)
 */
export async function isImageBlobCached(url: string): Promise<boolean> {
  if (!url) return false;
  
  // Verifica cache em memória primeiro (instantâneo)
  if (memoryCache.has(url)) return true;
  
  try {
    const db = await getDB();
    const cached = await db.get('images', url);
    return !!cached;
  } catch {
    return false;
  }
}

/**
 * Obtém URL local da imagem (ObjectURL) se estiver em cache
 * Retorna null se não estiver cacheada
 */
export async function getImageFromCache(url: string): Promise<string | null> {
  if (!url) return null;
  
  // Verifica memória primeiro
  if (memoryCache.has(url)) {
    return memoryCache.get(url)!;
  }
  
  try {
    const db = await getDB();
    const cached = await db.get('images', url);
    
    if (cached) {
      // Cria ObjectURL do blob e salva em memória
      const objectUrl = URL.createObjectURL(cached.blob);
      memoryCache.set(url, objectUrl);
      return objectUrl;
    }
  } catch (error) {
    console.warn('Erro ao ler imagem do cache:', error);
  }
  
  return null;
}

/**
 * Salva uma imagem no cache (baixa e armazena como Blob)
 */
// Track URLs that already failed to avoid repeated warnings
const failedUrls = new Set<string>();

export async function saveImageToCache(url: string): Promise<string | null> {
  if (!url) return null;
  
  // Já está em memória
  if (memoryCache.has(url)) {
    return memoryCache.get(url)!;
  }

  // Skip URLs that already failed (avoid repeated console spam)
  if (failedUrls.has(url)) return null;

  // Validate URL before fetching
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) return null;
  } catch {
    return null;
  }
  
  try {
    // Baixa a imagem como Blob
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Fetch failed');
    
    const blob = await response.blob();
    const size = blob.size;
    
    // Salva no IndexedDB
    const db = await getDB();
    await db.put('images', {
      url,
      blob,
      timestamp: Date.now(),
      size
    });
    
    // Cria ObjectURL e salva em memória
    const objectUrl = URL.createObjectURL(blob);
    memoryCache.set(url, objectUrl);
    
    // Limpa cache antigo em background
    cleanOldCache();
    
    return objectUrl;
  } catch {
    failedUrls.add(url);
    return null;
  }
}

/**
 * Pré-cacheia múltiplas imagens em paralelo
 */
export async function preCacheImages(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;
  
  const uncachedUrls: string[] = [];
  
  // Verifica quais não estão em cache
  for (const url of urls) {
    if (url && !memoryCache.has(url)) {
      const isCached = await isImageBlobCached(url);
      if (!isCached) {
        uncachedUrls.push(url);
      } else {
        // Carrega do IndexedDB para memória
        await getImageFromCache(url);
      }
    }
  }
  
  // Cacheia as que faltam (em paralelo, max 3 por vez)
  const batchSize = 3;
  for (let i = 0; i < uncachedUrls.length; i += batchSize) {
    const batch = uncachedUrls.slice(i, i + batchSize);
    await Promise.all(batch.map(url => saveImageToCache(url)));
  }
}

/**
 * Limpa imagens antigas do cache (mantém apenas MAX_IMAGES mais recentes)
 */
async function cleanOldCache(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('images', 'readwrite');
    const store = tx.objectStore('images');
    const index = store.index('by-timestamp');
    
    // Pega todas ordenadas por timestamp
    const allImages = await index.getAll();
    
    if (allImages.length <= MAX_IMAGES) return;
    
    // Calcula tamanho total
    let totalSize = allImages.reduce((acc, img) => acc + img.size, 0);
    const maxBytes = MAX_SIZE_MB * 1024 * 1024;
    
    // Remove as mais antigas até estar dentro dos limites
    const sorted = [...allImages].sort((a, b) => a.timestamp - b.timestamp);
    let removed = 0;
    
    for (const img of sorted) {
      if (allImages.length - removed <= MAX_IMAGES && totalSize <= maxBytes) break;
      
      await store.delete(img.url);
      memoryCache.delete(img.url);
      totalSize -= img.size;
      removed++;
    }
    
    await tx.done;
    
    if (removed > 0) {
      console.log(`🧹 Cache de imagens: ${removed} imagens antigas removidas`);
    }
  } catch (error) {
    console.warn('Erro ao limpar cache de imagens:', error);
  }
}

/**
 * Hook para usar uma imagem com cache automático
 * Retorna a URL cacheada (local) ou a URL original enquanto cacheia
 */
export function useCachedImageUrl(originalUrl: string | undefined): {
  url: string | undefined;
  isFromCache: boolean;
} {
  // Este é um hook simplificado - o componente deve usar as funções acima
  // diretamente no useEffect para melhor controle
  return {
    url: originalUrl,
    isFromCache: originalUrl ? memoryCache.has(originalUrl) : false
  };
}

/**
 * Verifica se URL está em cache de memória (síncrono, instantâneo)
 */
export function isInMemoryCache(url: string): boolean {
  return memoryCache.has(url);
}

/**
 * Obtém URL do cache de memória (síncrono)
 */
export function getFromMemoryCache(url: string): string | undefined {
  return memoryCache.get(url);
}
