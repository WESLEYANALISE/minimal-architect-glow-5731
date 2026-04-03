import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { saveToInstantCache, getFromInstantCache, preloadImages } from '@/hooks/useInstantCache';

// Imagens locais do Hero Banner — REDUZIDO de 16 para 6 (apenas carrossel principal)
import heroBannerThemisAdvogado from '@/assets/hero-banner-themis-advogado-v2.webp';
import heroBannerThemisChorando from '@/assets/hero-banner-themis-chorando.webp';
import heroBannerTribunal from '@/assets/hero-banner-tribunal.webp';
import heroVadeMecumPlanalto from '@/assets/hero-vademecum-planalto.webp';

// Configuração das tabelas a pré-carregar
interface PreloadConfig {
  cacheKey: string;
  table: string;
  select: string;
  limit: number;
  orderBy?: { column: string; ascending: boolean };
  imageColumns?: string[];
}

// OTIMIZADO: Mesmas tabelas mas com limits reduzidos para imagens
const PRELOAD_CONFIGS: PreloadConfig[] = [
  {
    cacheKey: 'noticias-politicas-instant',
    table: 'noticias_politicas_cache',
    select: 'id,titulo,fonte,imagem_url,imagem_url_webp,data_publicacao,url,espectro,processado',
    limit: 10,
    orderBy: { column: 'data_publicacao', ascending: false },
    imageColumns: ['imagem_url_webp', 'imagem_url'],
  },
  {
    cacheKey: 'noticias-juridicas-home',
    table: 'noticias_juridicas_cache',
    select: 'id,titulo,fonte,imagem,imagem_webp,data_publicacao,link',
    limit: 10,
    orderBy: { column: 'data_publicacao', ascending: false },
    imageColumns: ['imagem_webp', 'imagem'],
  },
  {
    cacheKey: 'capas-biblioteca-v2',
    table: 'CAPA-BIBILIOTECA',
    select: 'id,Biblioteca,capa',
    limit: 15,
    imageColumns: ['capa'],
  },
  {
    cacheKey: 'resumos-diarios-carousel',
    table: 'resumos_diarios',
    select: 'id,data,total_noticias,slides,tipo',
    limit: 30,
    orderBy: { column: 'data', ascending: false },
  },
  {
    cacheKey: 'leis-push-2025-home',
    table: 'leis_push_2025',
    select: 'id,numero_lei,ementa,data_publicacao,tipo_ato',
    limit: 15,
    orderBy: { column: 'data_publicacao', ascending: false },
  },
  {
    cacheKey: 'cursos-home-v2',
    table: 'CURSOS-APP',
    select: 'id,tema,"capa-aula","descricao-aula",area,ordem',
    limit: 50,
    orderBy: { column: 'ordem', ascending: true },
    imageColumns: ['capa-aula'],
  },
  {
    cacheKey: 'carreiras-capas-home',
    table: 'carreiras_capas',
    select: 'id,carreira,url_capa',
    limit: 15,
    imageColumns: ['url_capa'],
  },
  {
    cacheKey: 'blogger-juridico-home',
    table: 'BLOGGER_JURIDICO',
    select: 'id,titulo,categoria,url_capa,imagem_wikipedia,descricao_curta,ordem,topicos,conteudo_gerado,termo_wikipedia,fonte',
    limit: 15,
    orderBy: { column: 'ordem', ascending: true },
    imageColumns: ['url_capa', 'imagem_wikipedia'],
  },
  {
    cacheKey: 'documentarios-juridicos-cache',
    table: 'documentarios_juridicos',
    select: 'id,video_id,titulo,descricao,thumbnail,capa_webp,duracao,publicado_em,canal_nome,categoria',
    limit: 20,
    orderBy: { column: 'publicado_em', ascending: false },
    imageColumns: ['capa_webp', 'thumbnail'],
  },
  {
    cacheKey: 'conceitos-materias-trilhante',
    table: 'conceitos_materias',
    select: '*',
    limit: 20,
    orderBy: { column: 'area_ordem', ascending: true },
  },
];

// Imagens locais críticas — apenas 4 do hero principal
const LOCAL_HERO_IMAGES = [
  heroBannerThemisAdvogado,
  heroBannerThemisChorando,
  heroBannerTribunal,
  heroVadeMecumPlanalto,
];

// Preload hero images IMMEDIATELY at module level (no idle callback)
preloadImages(LOCAL_HERO_IMAGES);

let hasPreloaded = false;

async function preloadTableData(config: PreloadConfig): Promise<string[]> {
  const imageUrls: string[] = [];
  
  try {
    const cached = await getFromInstantCache<any[]>(config.cacheKey);
    if (cached && !cached.isStale && cached.data.length > 0) {
      if (config.imageColumns) {
        cached.data.forEach((item: any) => {
          config.imageColumns!.forEach(col => {
            const url = item[col];
            if (url && typeof url === 'string') {
              imageUrls.push(url);
            }
          });
        });
      }
      return imageUrls;
    }

    let query = supabase
      .from(config.table as any)
      .select(config.select)
      .limit(config.limit);

    if (config.orderBy) {
      query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending });
    }

    const { data, error } = await query;

    if (error) {
      console.warn(`[HomePreloader] Erro ao carregar ${config.table}:`, error.message);
      return imageUrls;
    }

    if (data && data.length > 0) {
      await saveToInstantCache(config.cacheKey, data);

      if (config.imageColumns) {
        data.forEach((item: any) => {
          config.imageColumns!.forEach(col => {
            const url = item[col];
            if (url && typeof url === 'string') {
              imageUrls.push(url);
            }
          });
        });
      }
    }

    return imageUrls;
  } catch (err) {
    console.warn(`[HomePreloader] Falha silenciosa em ${config.table}`);
    return imageUrls;
  }
}

// Cache global para áudios persuasivos do PremiumFloatingCard
export const persuasiveAudioCache = new Map<string, { frase: string; audioBase64: string }>();

// Pré-carrega áreas de questões no cache instantâneo
async function preloadQuestoesAreas() {
  try {
    const { QUESTOES_AREAS_CACHE_KEY, fetchQuestoesAreasStats } = await import('@/hooks/useQuestoesAreasCache');
    const cached = await getFromInstantCache(QUESTOES_AREAS_CACHE_KEY);
    if (cached && !cached.isStale) return;
    const data = await fetchQuestoesAreasStats();
    await saveToInstantCache(QUESTOES_AREAS_CACHE_KEY, data);
  } catch (err) {
    console.warn('[HomePreloader] Falha ao pré-carregar questões:', err);
  }
}

async function preloadFlashcardsAreas() {
  try {
    const { FLASHCARDS_AREAS_CACHE_KEY, fetchFlashcardsAreasStats } = await import('@/hooks/useFlashcardsAreasCache');
    const cached = await getFromInstantCache(FLASHCARDS_AREAS_CACHE_KEY);
    if (cached && !cached.isStale) return;
    const data = await fetchFlashcardsAreasStats();
    await saveToInstantCache(FLASHCARDS_AREAS_CACHE_KEY, data);
  } catch (err) {
    console.warn('[HomePreloader] Falha ao pré-carregar flashcards:', err);
  }
}

async function preloadConceitosTopicosCount() {
  try {
    const cached = await getFromInstantCache('conceitos-topicos-count-materia');
    if (cached && !cached.isStale) return;
    const { data: topicos } = await supabase.from("conceitos_topicos" as any).select("materia_id");
    if (!topicos) return;
    const counts: Record<number, number> = {};
    for (const topico of (topicos as any[])) {
      counts[topico.materia_id] = (counts[topico.materia_id] || 0) + 1;
    }
    await saveToInstantCache('conceitos-topicos-count-materia', counts);
  } catch (err) {
    console.warn('[HomePreloader] Falha ao pré-carregar contagem de tópicos:', err);
  }
}

async function preloadResumosAreas() {
  try {
    const { RESUMOS_AREAS_CACHE_KEY, fetchResumosAreasStats } = await import('@/hooks/useResumosAreasCache');
    const cached = await getFromInstantCache(RESUMOS_AREAS_CACHE_KEY);
    if (cached && !cached.isStale) return;
    const data = await fetchResumosAreasStats();
    await saveToInstantCache(RESUMOS_AREAS_CACHE_KEY, data);
  } catch (err) {
    console.warn('[HomePreloader] Falha ao pré-carregar resumos:', err);
  }
}

async function runPreload() {
  if (hasPreloaded) return;
  hasPreloaded = true;

  const startTime = performance.now();
  console.log('🚀 [HomePreloader] Iniciando pré-carregamento da Home...');

  try {
    // 1. Hero images já foram pré-carregadas no nível do módulo (injectPreloadLink + new Image())
    // Apenas garantir que o cache de preloadImages está sincronizado
    preloadImages(LOCAL_HERO_IMAGES);

    // 2. Buscar dados em paralelo
    const allImageUrls: string[] = [];
    const results = await Promise.all([
      ...PRELOAD_CONFIGS.map(config => preloadTableData(config)),
      preloadQuestoesAreas().then(() => [] as string[]),
      preloadFlashcardsAreas().then(() => [] as string[]),
      preloadResumosAreas().then(() => [] as string[]),
      preloadConceitosTopicosCount().then(() => [] as string[]),
    ]);

    results.forEach(urls => {
      allImageUrls.push(...urls);
    });

    // 3. Pré-carregar no máximo 15 imagens do Supabase
    const uniqueUrls = [...new Set(allImageUrls)].slice(0, 15);
    if (uniqueUrls.length > 0) {
      await preloadImages(uniqueUrls);
    }

    const elapsed = Math.round(performance.now() - startTime);
    console.log(`✅ [HomePreloader] Concluído em ${elapsed}ms - ${PRELOAD_CONFIGS.length} tabelas, ${uniqueUrls.length} imagens`);
  } catch (err) {
    console.warn('[HomePreloader] Erro durante pré-carregamento:', err);
  }
}

export const useHomePreloader = () => {
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const startPreload = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => runPreload(), { timeout: 5000 });
      } else {
        setTimeout(runPreload, 2500);
      }
    };

    startPreload();
  }, []);
};

export { runPreload as preloadHomeData };
