import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNarrationPlayer } from "@/contexts/NarrationPlayerContext";
import type { ConceitoSlide, ConceitoSecao } from "@/components/conceitos/slides/types";

interface UseSlideNarrationProps {
  currentSlideIndex: number;
  flatSlides: Array<{
    slide: ConceitoSlide;
    secaoIndex: number;
    paginaIndex: number;
  }>;
  topicoId?: number | string;
  tabelaAlvo?: 'conceitos_topicos' | 'categorias_topicos' | 'faculdade_topicos';
  campoJson?: 'slides_json' | 'conteudo_gerado';
  enabled?: boolean;
}

interface SlideNarrationState {
  isNarrating: boolean;
  isGenerating: boolean;
  narrationProgress: number;
  narrationCurrentTime: number;
  narrationDuration: number;
  toggleNarration: () => void;
}

export const useSlideNarration = ({
  currentSlideIndex,
  flatSlides,
  topicoId,
  tabelaAlvo = 'categorias_topicos',
  campoJson = 'conteudo_gerado',
  enabled = true,
}: UseSlideNarrationProps): SlideNarrationState => {
  const { playNarration, stopNarration } = useNarrationPlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrationProgress, setNarrationProgress] = useState(0);
  const [narrationCurrentTime, setNarrationCurrentTime] = useState(0);
  const [narrationDuration, setNarrationDuration] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const currentSlideRef = useRef(currentSlideIndex);
  // Cache of narracaoUrl per slide key
  const narrationCacheRef = useRef<Record<string, string>>({});

  // Track current slide index
  useEffect(() => {
    currentSlideRef.current = currentSlideIndex;
  }, [currentSlideIndex]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopNarration();
    };
  }, [stopNarration]);

  const updateMetrics = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    setNarrationCurrentTime(current);
    setNarrationDuration(duration);
    setNarrationProgress(duration > 0 ? (current / duration) * 100 : 0);
  }, []);

  // Start/stop progress polling based on playing state
  useEffect(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (isNarrating) {
      progressIntervalRef.current = setInterval(updateMetrics, 200);
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isNarrating, updateMetrics]);

  const playAudioUrl = useCallback(async (url: string) => {
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }

    const audio = new Audio(url);
    audio.volume = 0.8;
    audio.preload = 'auto';
    audioRef.current = audio;

    const handlePlay = () => { if (mountedRef.current) setIsNarrating(true); };
    const handlePause = () => { if (mountedRef.current) setIsNarrating(false); };
    const handleEnded = () => {
      if (mountedRef.current) {
        setIsNarrating(false);
        updateMetrics();
      }
    };
    const handleMetrics = () => updateMetrics();

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleMetrics);
    audio.addEventListener('loadedmetadata', handleMetrics);
    audio.addEventListener('durationchange', handleMetrics);

    try {
      await playNarration(audio);
      updateMetrics();
    } catch {
      // Try again on canplay
      audio.addEventListener('canplay', () => {
        if (mountedRef.current && currentSlideRef.current === currentSlideIndex) {
          playNarration(audio).catch(() => setIsNarrating(false));
        }
      }, { once: true });
    }
  }, [playNarration, updateMetrics, currentSlideIndex]);

  const generateAndPlay = useCallback(async () => {
    if (!topicoId || !enabled || !mountedRef.current) return;

    const currentFlat = flatSlides[currentSlideIndex];
    if (!currentFlat) return;

    const slide = currentFlat.slide;
    // Skip quickcheck slides
    if (slide.tipo === 'quickcheck') return;

    const key = `${currentFlat.secaoIndex}-${currentFlat.paginaIndex}`;

    // Check cache first
    if (slide.narracaoUrl) {
      narrationCacheRef.current[key] = slide.narracaoUrl;
      await playAudioUrl(slide.narracaoUrl);
      return;
    }

    if (narrationCacheRef.current[key]) {
      await playAudioUrl(narrationCacheRef.current[key]);
      return;
    }

    // Generate via edge function
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('narrar-slide', {
        body: {
          topico_id: topicoId,
          secao_index: currentFlat.secaoIndex,
          slide_index: currentFlat.paginaIndex,
          tabela_alvo: tabelaAlvo,
          campo_json: campoJson,
        },
      });

      if (!mountedRef.current || currentSlideRef.current !== currentSlideIndex) return;

      if (error) {
        console.error('[useSlideNarration] Erro:', error);
        setIsGenerating(false);
        return;
      }

      if (data?.narracaoUrl) {
        narrationCacheRef.current[key] = data.narracaoUrl;
        setIsGenerating(false);
        await playAudioUrl(data.narracaoUrl);
      } else {
        setIsGenerating(false);
      }
    } catch (err) {
      console.error('[useSlideNarration] Exceção:', err);
      if (mountedRef.current) setIsGenerating(false);
    }
  }, [topicoId, enabled, flatSlides, currentSlideIndex, tabelaAlvo, campoJson, playAudioUrl]);

  // When slide changes: stop current, reset, auto-start new
  useEffect(() => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsNarrating(false);
    setNarrationProgress(0);
    setNarrationCurrentTime(0);
    setNarrationDuration(0);
    setIsGenerating(false);
    stopNarration();

    if (!enabled || !topicoId) return;

    // Auto-start narration for new slide after a short delay
    const timer = setTimeout(() => {
      if (mountedRef.current && currentSlideRef.current === currentSlideIndex) {
        generateAndPlay();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlideIndex, enabled, topicoId]);

  const toggleNarration = useCallback(() => {
    const audio = audioRef.current;
    
    if (isGenerating) return; // Don't toggle while generating

    if (audio && !audio.paused) {
      audio.pause();
      setIsNarrating(false);
      return;
    }

    if (audio && audio.paused && audio.src) {
      playNarration(audio)
        .then(() => updateMetrics())
        .catch(() => setIsNarrating(false));
      return;
    }

    // No audio yet - generate
    generateAndPlay();
  }, [isGenerating, playNarration, updateMetrics, generateAndPlay]);

  return {
    isNarrating,
    isGenerating,
    narrationProgress,
    narrationCurrentTime,
    narrationDuration,
    toggleNarration,
  };
};
