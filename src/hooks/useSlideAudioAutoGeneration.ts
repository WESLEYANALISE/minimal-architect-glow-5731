import { useEffect, useState, useRef } from 'react';
import { slideAudioGenManager } from '@/lib/slideAudioGenerationManager';

interface UseSlideAudioAutoGenerationProps {
  topicoId?: number | string;
  secoes: Array<{ slides: Array<{ tipo?: string; narracaoUrl?: string }> }>;
  tabelaAlvo?: 'conceitos_topicos' | 'categorias_topicos' | 'faculdade_topicos';
  campoJson?: 'slides_json' | 'conteudo_gerado';
  enabled?: boolean;
}

export function useSlideAudioAutoGeneration({
  topicoId,
  secoes,
  tabelaAlvo = 'categorias_topicos',
  campoJson = 'conteudo_gerado',
  enabled = true,
}: UseSlideAudioAutoGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalGerados, setTotalGerados] = useState(0);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const hasTriggered = useRef(false);

  // Subscribe to manager state
  useEffect(() => {
    if (!topicoId) return;
    const unsub = slideAudioGenManager.subscribe(topicoId, (state) => {
      if (!state) {
        setIsGenerating(false);
        return;
      }
      setIsGenerating(state.isRunning);
      setTotalGerados(state.totalGerados);
      setTotalPendentes(state.jobs.filter(j => j.status === 'pending' || j.status === 'running').length);
    });
    return unsub;
  }, [topicoId]);

  // Auto-trigger when entering a lesson
  useEffect(() => {
    if (!enabled || !topicoId || secoes.length === 0) return;
    if (slideAudioGenManager.isRunning(topicoId)) return;
    if (hasTriggered.current) return;

    hasTriggered.current = true;

    // Small delay to let the UI render first
    const timer = setTimeout(() => {
      if (slideAudioGenManager.isRunning(topicoId)) return;
      slideAudioGenManager.startTopic(topicoId, secoes, tabelaAlvo, campoJson);
    }, 2000);

    return () => clearTimeout(timer);
  }, [enabled, topicoId, secoes, tabelaAlvo, campoJson]);

  // Reset trigger when topic changes
  useEffect(() => {
    hasTriggered.current = false;
  }, [topicoId]);

  return { isGenerating, totalGerados, totalPendentes };
}
