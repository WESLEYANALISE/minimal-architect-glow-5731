import { useEffect, useState, useCallback, useRef } from 'react';
import { metodologiaGenManager } from '@/lib/metodologiaGenerationManager';

interface TemaStatus {
  tema: string;
  gerado: boolean;
}

interface UseMetodologiasAutoGenerationProps {
  metodo: string;
  area: string;
  temas: TemaStatus[] | undefined;
  enabled: boolean;
  onProgress?: () => void;
}

export function useMetodologiasAutoGeneration({
  metodo,
  area,
  temas,
  enabled,
  onProgress
}: UseMetodologiasAutoGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTema, setCurrentTema] = useState<string | null>(null);
  const [geradosCount, setGeradosCount] = useState(0);
  const hasTriggered = useRef(false);
  const lastNotify = useRef(0);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!area || !metodo) return;

    const unsub = metodologiaGenManager.subscribe(metodo, area, (state) => {
      if (!state) {
        setIsGenerating(false);
        setCurrentTema(null);
        return;
      }

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
      }
    });

    return unsub;
  }, [area, metodo]);

  useEffect(() => {
    if (!enabled || !temas || !area || !metodo) return;
    if (metodologiaGenManager.isRunning(metodo, area)) return;
    if (hasTriggered.current) return;

    const pendentes = temas.filter(t => !t.gerado);
    if (pendentes.length === 0) return;

    hasTriggered.current = true;

    setTimeout(() => {
      if (metodologiaGenManager.isRunning(metodo, area)) return;
      console.log(`🚀 [AutoGen Metodologia] Disparando: ${pendentes.length} temas pendentes de ${metodo} para ${area}`);
      metodologiaGenManager.startArea(metodo, area, pendentes.map(t => ({ tema: t.tema })));
    }, 2000);
  }, [enabled, temas, area, metodo]);

  useEffect(() => {
    hasTriggered.current = false;
  }, [area, metodo]);

  return {
    isGenerating,
    currentTema,
    geradosCount,
  };
}
