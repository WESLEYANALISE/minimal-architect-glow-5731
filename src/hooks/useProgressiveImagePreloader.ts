import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Apenas seções NÃO cobertas pelo useHomePreloader
const SECTION_IMAGE_SOURCES: Record<string, { table: string; columns: string[]; select: string; limit: number }[]> = {
  '/camara-deputados': [
    { table: 'deputados_cache', columns: ['url_foto'], select: 'id,url_foto', limit: 100 },
  ],
  '/carreiras': [
    { table: 'carreiras_capas', columns: ['url_capa'], select: 'id,url_capa', limit: 20 },
  ],
};

const preloadedSections = new Set<string>();

function preloadImageUrls(urls: string[]) {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

async function preloadSectionImages(section: string) {
  if (preloadedSections.has(section)) return;
  preloadedSections.add(section);

  const sources = SECTION_IMAGE_SOURCES[section];
  if (!sources) return;

  const allUrls: string[] = [];

  await Promise.all(
    sources.map(async (source) => {
      try {
        const { data } = await supabase
          .from(source.table as any)
          .select(source.select)
          .limit(source.limit);

        if (data) {
          data.forEach((item: any) => {
            source.columns.forEach(col => {
              const url = item[col];
              if (url && typeof url === 'string' && url.startsWith('http')) {
                allUrls.push(url);
              }
            });
          });
        }
      } catch {
        // Silent fail
      }
    })
  );

  if (allUrls.length > 0) {
    preloadImageUrls([...new Set(allUrls)]);
  }
}

/**
 * Hook que pré-carrega imagens progressivamente conforme o usuário navega.
 * Apenas seções NÃO cobertas pelo useHomePreloader (que já carrega bibliotecas, cursos, política, etc).
 */
export const useProgressiveImagePreloader = () => {
  const location = useLocation();
  const lastSection = useRef('');

  useEffect(() => {
    const section = '/' + location.pathname.split('/')[1];
    
    if (section === lastSection.current) return;
    lastSection.current = section;

    preloadSectionImages(section);
  }, [location.pathname]);
};

export default useProgressiveImagePreloader;
