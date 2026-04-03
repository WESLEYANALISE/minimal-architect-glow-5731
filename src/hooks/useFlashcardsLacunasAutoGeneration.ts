import { useEffect, useState, useCallback, useRef } from 'react';
import { lacunasGenManager } from '@/lib/lacunasGenerationManager';
import { toast } from 'sonner';

interface TemaStatus {
  tema: string;
  temFlashcards: boolean;
  parcial: boolean;
  totalSubtemas: number;
  subtemasGerados: number;
}

interface Props {
  area: string;
  temas: TemaStatus[] | undefined;
  enabled: boolean;
  onProgress?: () => void;
}

export function useFlashcardsLacunasAutoGeneration({ area, temas, enabled, onProgress }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTema, setCurrentTema] = useState<string | null>(null);
  const [geradosCount, setGeradosCount] = useState(0);
  const hasTriggered = useRef(false);
  const lastNotify = useRef(0);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!area) return;
    const unsub = lacunasGenManager.subscribe(area, (state) => {
      if (!state) { setIsGenerating(false); setCurrentTema(null); return; }
      setIsGenerating(state.isRunning);
      setGeradosCount(state.totalGerados);
      const running = state.jobs.find(j => j.status === 'running');
      setCurrentTema(running?.tema || null);
      const now = Date.now();
      if (state.isRunning && now - lastNotify.current > 4000) {
        lastNotify.current = now;
        onProgressRef.current?.();
      }
      if (!state.isRunning) {
        onProgressRef.current?.();
        if (state.totalGerados > 0) {
          toast.success(`${state.totalGerados} lacunas geradas automaticamente!`);
        }
      }
    });
    return unsub;
  }, [area]);

  useEffect(() => {
    if (!enabled || !temas || !area) return;
    if (lacunasGenManager.isRunning(area)) return;
    if (hasTriggered.current) return;

    const pendentes = temas.filter(t => !t.temFlashcards);
    if (pendentes.length === 0) return;

    hasTriggered.current = true;
    setTimeout(() => {
      if (lacunasGenManager.isRunning(area)) return;
      lacunasGenManager.startArea(area, pendentes.map(t => ({ tema: t.tema })));
    }, 1500);
  }, [enabled, temas, area]);

  useEffect(() => { hasTriggered.current = false; }, [area]);

  const startGeneration = useCallback(() => {
    if (!temas || !area) return;
    hasTriggered.current = false;
    const pendentes = temas.filter(t => !t.temFlashcards);
    if (pendentes.length > 0) {
      lacunasGenManager.startArea(area, pendentes.map(t => ({ tema: t.tema })));
    }
  }, [temas, area]);

  return { isGenerating, currentTema, geradosCount, startGeneration };
}
