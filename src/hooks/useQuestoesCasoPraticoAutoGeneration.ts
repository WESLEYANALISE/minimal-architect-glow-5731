import { useCallback, useEffect, useRef, useState } from 'react';
import { questoesCasoPraticoGenManager } from '@/lib/questoesCasoPraticoGenerationManager';

interface TemaStatus {
  tema: string;
  temQuestoes: boolean;
}

interface Props {
  area: string;
  temas: TemaStatus[] | undefined;
  enabled: boolean;
  onProgress?: () => void;
}

export function useQuestoesCasoPraticoAutoGeneration({ area, temas, enabled, onProgress }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTema, setCurrentTema] = useState<string | null>(null);
  const [geradosCount, setGeradosCount] = useState(0);
  const hasTriggered = useRef(false);
  const lastNotify = useRef(0);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!area) return;
    const unsubscribe = questoesCasoPraticoGenManager.subscribe(area, (state) => {
      if (!state) { setIsGenerating(false); setCurrentTema(null); return; }
      setIsGenerating(state.isRunning);
      setGeradosCount(state.totalGerados);
      const running = state.jobs.find((job) => job.status === 'running');
      setCurrentTema(running?.tema || null);
      const now = Date.now();
      if (state.isRunning && now - lastNotify.current > 4000) {
        lastNotify.current = now;
        onProgressRef.current?.();
      }
      if (!state.isRunning) onProgressRef.current?.();
    });
    return unsubscribe;
  }, [area]);

  useEffect(() => {
    if (!enabled || !temas || !area) return;
    if (questoesCasoPraticoGenManager.isRunning(area)) return;
    if (hasTriggered.current) return;

    const pendentes = temas.filter((tema) => !tema.temQuestoes);
    if (pendentes.length === 0) return;

    hasTriggered.current = true;
    setTimeout(() => {
      if (questoesCasoPraticoGenManager.isRunning(area)) return;
      questoesCasoPraticoGenManager.startArea(area, pendentes.map((t) => ({ tema: t.tema })));
    }, 1200);
  }, [enabled, temas, area]);

  useEffect(() => { hasTriggered.current = false; }, [area]);

  const startGeneration = useCallback(() => {
    if (!temas || !area) return;
    hasTriggered.current = false;
    const pendentes = temas.filter((tema) => !tema.temQuestoes);
    if (pendentes.length > 0) {
      questoesCasoPraticoGenManager.startArea(area, pendentes.map((t) => ({ tema: t.tema })));
    }
  }, [temas, area]);

  return { isGenerating, currentTema, geradosCount, startGeneration };
}
