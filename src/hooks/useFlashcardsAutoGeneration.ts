import { useEffect, useState, useCallback, useRef } from 'react';
import { flashcardGenManager } from '@/lib/flashcardGenerationManager';
import { toast } from 'sonner';

interface TemaStatus {
  tema: string;
  temFlashcards: boolean;
  parcial: boolean;
  totalSubtemas: number;
  subtemasGerados: number;
}

interface UseFlashcardsAutoGenerationProps {
  area: string;
  temas: TemaStatus[] | undefined;
  enabled: boolean;
  onProgress?: () => void;
}

export function useFlashcardsAutoGeneration({
  area,
  temas,
  enabled,
  onProgress
}: UseFlashcardsAutoGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTema, setCurrentTema] = useState<string | null>(null);
  const [geradosCount, setGeradosCount] = useState(0);
  const hasTriggered = useRef(false);
  const lastNotify = useRef(0);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // Subscribe to global generation manager
  useEffect(() => {
    if (!area) return;

    const unsub = flashcardGenManager.subscribe(area, (state) => {
      if (!state) {
        setIsGenerating(false);
        setCurrentTema(null);
        return;
      }

      setIsGenerating(state.isRunning);
      setGeradosCount(state.totalGerados);

      const running = state.jobs.find(j => j.status === 'running');
      setCurrentTema(running?.tema || null);

      // Throttle onProgress calls
      const now = Date.now();
      if (state.isRunning && now - lastNotify.current > 4000) {
        lastNotify.current = now;
        onProgressRef.current?.();
      }

      // When done, ALWAYS refresh (even if 0 generated — cache/normalization fix)
      if (!state.isRunning) {
        onProgressRef.current?.();
      }
    });

    return unsub;
  }, [area]);

  // Auto-trigger generation when temas are available and have pending items
  useEffect(() => {
    if (!enabled || !temas || !area) return;
    if (flashcardGenManager.isRunning(area)) {
      console.log(`⏩ [AutoGen] Geração já em andamento para ${area}`);
      return;
    }
    if (hasTriggered.current) return;

    // Check sessionStorage to avoid re-triggering after failure
    const attemptKey = `flashcard-gen-attempted-${area}`;
    if (sessionStorage.getItem(attemptKey)) {
      console.log(`⏭️ [AutoGen] Já tentou gerar para ${area} nesta sessão, pulando`);
      return;
    }

    const pendentes = temas.filter(t => !t.temFlashcards);
    
    console.log(`🔍 [AutoGen] Verificando: ${temas.length} temas, ${pendentes.length} pendentes para ${area}`);
    
    if (pendentes.length === 0) return;

    // Mark as triggered immediately
    hasTriggered.current = true;
    sessionStorage.setItem(attemptKey, 'true');

    setTimeout(() => {
      if (flashcardGenManager.isRunning(area)) return;
      console.log(`🚀 [AutoGen] Disparando geração paralela: ${pendentes.length} temas pendentes para ${area}`);
      flashcardGenManager.startArea(area, pendentes.map(t => ({ tema: t.tema })));
    }, 1500);
  }, [enabled, temas, area]);

  // Reset trigger when area changes
  useEffect(() => {
    hasTriggered.current = false;
  }, [area]);

  const stopGeneration = useCallback(() => {
    console.log('⏹️ [AutoGen] Stop requested');
  }, []);

  const startGeneration = useCallback(() => {
    if (!temas || !area) return;
    hasTriggered.current = false; // Allow re-trigger
    const pendentes = temas.filter(t => !t.temFlashcards);
    if (pendentes.length > 0) {
      flashcardGenManager.startArea(area, pendentes.map(t => ({ tema: t.tema })));
    }
  }, [temas, area]);

  return {
    isGenerating,
    currentTema,
    geradosCount,
    stopGeneration,
    startGeneration
  };
}
