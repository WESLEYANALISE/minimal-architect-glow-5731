import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ConceitoSecao } from "@/components/conceitos/slides/types";

interface SlideImageState {
  [key: string]: string | undefined; // "secaoIndex-slideIndex" -> imageUrl
}

interface UseConceitosSlideImagesProps {
  topicoId: number | string;
  secoes: ConceitoSecao[];
  area?: string;
  enabled?: boolean;
  tabelaAlvo?: 'conceitos_topicos' | 'categorias_topicos' | 'faculdade_topicos';
  campoJson?: 'slides_json' | 'conteudo_gerado';
}

export const useConceitosSlideImages = ({
  topicoId,
  secoes,
  area,
  enabled = true,
  tabelaAlvo = 'conceitos_topicos',
  campoJson = 'slides_json',
}: UseConceitosSlideImagesProps) => {
  const [imageStates, setImageStates] = useState<SlideImageState>({});
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const queueRef = useRef<Array<{ secaoIndex: number; slideIndex: number; titulo: string; conteudo: string }>>([]);
  const isProcessingRef = useRef(false);
  const mountedRef = useRef(true);

  // Build initial state from existing slides
  useEffect(() => {
    const initial: SlideImageState = {};
    secoes.forEach((secao, si) => {
      secao.slides.forEach((slide, pi) => {
        const key = `${si}-${pi}`;
        if (slide.imagemUrl) {
          initial[key] = slide.imagemUrl;
        }
      });
    });
    setImageStates(initial);
  }, [secoes]);

  // Build queue of slides needing images
  useEffect(() => {
    if (!enabled) return;
    
    const queue: typeof queueRef.current = [];
    secoes.forEach((secao, si) => {
      secao.slides.forEach((slide, pi) => {
        if (slide.tipo === 'quickcheck') return;
        if (slide.imagemUrl) return;
        queue.push({
          secaoIndex: si,
          slideIndex: pi,
          titulo: slide.titulo || '',
          conteudo: slide.conteudo || '',
        });
      });
    });
    queueRef.current = queue;
  }, [secoes, enabled]);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || !mountedRef.current) return;
    isProcessingRef.current = true;

    while (queueRef.current.length > 0 && mountedRef.current) {
      const item = queueRef.current.shift();
      if (!item) break;

      const key = `${item.secaoIndex}-${item.slideIndex}`;
      
      if (imageStates[key]) continue;

      setGeneratingKey(key);

      try {
        const { data, error } = await supabase.functions.invoke('gerar-imagem-conceito-slide', {
          body: {
            topico_id: topicoId,
            secao_index: item.secaoIndex,
            slide_index: item.slideIndex,
            titulo_slide: item.titulo,
            conteudo_slide: item.conteudo,
            area: area || 'Direito',
            tabela_alvo: tabelaAlvo,
            campo_json: campoJson,
          },
        });

        if (error) {
          console.error(`[useConceitosSlideImages] Erro no slide ${key}:`, error);
        } else if (data?.imagemUrl && mountedRef.current) {
          setImageStates(prev => ({ ...prev, [key]: data.imagemUrl }));
        }
      } catch (err) {
        console.error(`[useConceitosSlideImages] Exceção no slide ${key}:`, err);
      }

      // Rate limit delay: 3s between requests
      if (queueRef.current.length > 0 && mountedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    if (mountedRef.current) {
      setGeneratingKey(null);
    }
    isProcessingRef.current = false;
  }, [topicoId, area, imageStates, tabelaAlvo, campoJson]);

  // Start processing immediately when enabled
  useEffect(() => {
    if (!enabled) return;
    
    mountedRef.current = true;
    // Start immediately - no delay
    if (queueRef.current.length > 0) {
      processQueue();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, processQueue]);

  const getSlideImage = useCallback((secaoIndex: number, slideIndex: number): string | undefined => {
    return imageStates[`${secaoIndex}-${slideIndex}`];
  }, [imageStates]);

  const isSlideGenerating = useCallback((secaoIndex: number, slideIndex: number): boolean => {
    return generatingKey === `${secaoIndex}-${slideIndex}`;
  }, [generatingKey]);

  return {
    imageStates,
    getSlideImage,
    isSlideGenerating,
    isGenerating: generatingKey !== null,
  };
};
