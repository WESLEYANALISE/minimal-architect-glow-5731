import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Topico {
  id: number;
  titulo: string;
  status: string | null;
  ordem: number;
  complemento: string | null;
  conteudo_gerado: any;
  capa_url: string | null;
}

interface UseFaculdadeAutoGenerationProps {
  disciplinaId: number | null;
  topicos: Topico[] | undefined;
  enabled?: boolean;
}

export const useFaculdadeAutoGeneration = ({
  disciplinaId,
  topicos,
  enabled = true,
}: UseFaculdadeAutoGenerationProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const CONCURRENT_GENERATIONS = 5;

  const totalTopicos = topicos?.length || 0;
  const concluidos = topicos?.filter(t => t.status === "concluido").length || 0;
  const pendentes = topicos?.filter(t => !t.status || t.status === "pendente" || t.status === "erro").length || 0;
  const gerando = topicos?.filter(t => t.status === "gerando" || t.status === "na_fila").length || 0;
  const percentualGeral = totalTopicos > 0 ? Math.round((concluidos / totalTopicos) * 100) : 0;

  const findNextPendingBatch = useCallback(() => {
    if (!topicos) return [];
    const currentlyGenerating = topicos.filter(t => t.status === "gerando" || t.status === "na_fila").length;
    if (currentlyGenerating >= CONCURRENT_GENERATIONS) return [];
    const slots = CONCURRENT_GENERATIONS - currentlyGenerating;
    const sorted = [...topicos].sort((a, b) => a.ordem - b.ordem);
    const pending = sorted.filter(t => !t.status || t.status === "pendente" || t.status === "erro");
    return pending.slice(0, slots);
  }, [topicos]);

  const startBatchGeneration = useCallback(async () => {
    if (isGeneratingRef.current) return;
    const batch = findNextPendingBatch();
    if (batch.length === 0) return;

    isGeneratingRef.current = true;
    setIsGenerating(true);
    console.log(`[FaculdadeAutoGen] Iniciando ${batch.length} tópicos em paralelo`);

    const promises = batch.map(async (topico) => {
      try {
        const { error } = await supabase.functions.invoke("gerar-conteudo-faculdade-topico", {
          body: { topico_id: topico.id },
        });
        if (error) {
          console.error(`[FaculdadeAutoGen] Erro: ${topico.titulo}`, error);
        }
      } catch (err) {
        console.error(`[FaculdadeAutoGen] Exceção: ${topico.titulo}`, err);
      }
    });

    await Promise.allSettled(promises);
    isGeneratingRef.current = false;
  }, [findNextPendingBatch]);

  // Auto-start when there are pending topics
  useEffect(() => {
    if (!enabled || !disciplinaId || !topicos) return;
    const currentlyGenerating = topicos.filter(t => t.status === "gerando" || t.status === "na_fila").length;
    if (currentlyGenerating < CONCURRENT_GENERATIONS && pendentes > 0) {
      const timer = setTimeout(() => startBatchGeneration(), 1500);
      return () => clearTimeout(timer);
    }
  }, [enabled, disciplinaId, topicos, pendentes, startBatchGeneration]);

  // Update isGenerating state
  useEffect(() => {
    setIsGenerating(gerando > 0);
    if (gerando === 0) isGeneratingRef.current = false;
  }, [gerando]);

  const getTopicoStatus = useCallback((topicoId: number) => {
    const topico = topicos?.find(t => t.id === topicoId);
    if (!topico) return { status: "pendente" as const, progresso: 0 };
    if (topico.status === "concluido") return { status: "concluido" as const, progresso: 100 };
    if (topico.status === "gerando") return { status: "gerando" as const, progresso: 50 };
    if (topico.status === "na_fila") return { status: "na_fila" as const, progresso: 0 };
    if (topico.status === "erro") return { status: "erro" as const, progresso: 0 };
    return { status: "pendente" as const, progresso: 0 };
  }, [topicos]);

  return {
    isGenerating,
    totalTopicos,
    concluidos,
    pendentes,
    percentualGeral,
    getTopicoStatus,
  };
};
