import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * SM-2 Algorithm Implementation
 * 
 * Quality ratings:
 *   0 = "Não lembro" (total blackout)
 *   3 = "Difícil" (recalled with difficulty)  
 *   4 = "Bom" (recalled with some hesitation)
 *   5 = "Fácil" (perfect recall)
 * 
 * EF (Easiness Factor): min 1.3
 * Interval: 1, 6, then EF * previous interval
 */

export type SM2Quality = 0 | 3 | 4 | 5;

interface SM2Result {
  fator_facilidade: number;
  intervalo_dias: number;
  repeticoes: number;
  proxima_revisao: string; // ISO date
}

function calcularSM2(
  quality: SM2Quality,
  currentEF: number,
  currentInterval: number,
  currentReps: number
): SM2Result {
  // Calculate new EF
  let newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  let newReps: number;

  if (quality < 3) {
    // Failed — reset
    newInterval = 1;
    newReps = 0;
  } else {
    newReps = currentReps + 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEF);
    }
  }

  const proxima = new Date();
  proxima.setDate(proxima.getDate() + newInterval);

  return {
    fator_facilidade: Math.round(newEF * 100) / 100,
    intervalo_dias: newInterval,
    repeticoes: newReps,
    proxima_revisao: proxima.toISOString().split('T')[0],
  };
}

export const useSpacedRepetition = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const registrarRevisao = useCallback(async (
    flashcardId: number,
    area: string,
    tema: string,
    quality: SM2Quality
  ) => {
    if (!user) return;

    // Fetch current state
    const { data: existing } = await supabase
      .from('flashcard_revisoes' as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('flashcard_id', flashcardId)
      .single();

    const row = existing as any;
    const currentEF = row?.fator_facilidade ?? 2.5;
    const currentInterval = row?.intervalo_dias ?? 0;
    const currentReps = row?.repeticoes ?? 0;

    const result = calcularSM2(quality, currentEF, currentInterval, currentReps);

    const { error } = await supabase
      .from('flashcard_revisoes' as any)
      .upsert({
        user_id: user.id,
        flashcard_id: flashcardId,
        area,
        tema,
        fator_facilidade: result.fator_facilidade,
        intervalo_dias: result.intervalo_dias,
        repeticoes: result.repeticoes,
        proxima_revisao: result.proxima_revisao,
        ultima_revisao: new Date().toISOString(),
        total_acertos: (row?.total_acertos ?? 0) + (quality >= 3 ? 1 : 0),
        total_erros: (row?.total_erros ?? 0) + (quality < 3 ? 1 : 0),
      }, { onConflict: 'user_id,flashcard_id' });

    if (error) console.error('Erro ao registrar revisão SM-2:', error);

    queryClient.invalidateQueries({ queryKey: ['spaced-repetition'] });
  }, [user, queryClient]);

  return { registrarRevisao, calcularSM2 };
};

/** Cards pending review for an area */
export const useCardsParaRevisao = (area?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spaced-repetition', 'pendentes', user?.id, area],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_flashcards_para_revisao', {
        p_user_id: user!.id,
        p_area: area || null,
        p_limite: 100,
      });
      if (error) throw error;
      return (data || []) as Array<{
        flashcard_id: number;
        area: string;
        tema: string;
        fator_facilidade: number;
        intervalo_dias: number;
        repeticoes: number;
        dias_atrasado: number;
      }>;
    },
    staleTime: 60_000,
  });
};

/** Summary stats per area */
export const useRevisaoStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['spaced-repetition', 'stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('flashcard_revisoes' as any)
        .select('area, proxima_revisao')
        .eq('user_id', user!.id);

      const items = (data || []) as any[];
      const today = new Date().toISOString().split('T')[0];

      const byArea: Record<string, { total: number; pendentes: number }> = {};
      items.forEach((item: any) => {
        if (!byArea[item.area]) byArea[item.area] = { total: 0, pendentes: 0 };
        byArea[item.area].total++;
        if (item.proxima_revisao <= today) byArea[item.area].pendentes++;
      });

      const totalPendentes = items.filter((i: any) => i.proxima_revisao <= today).length;

      return { byArea, totalPendentes, totalCards: items.length };
    },
    staleTime: 60_000,
  });
};
