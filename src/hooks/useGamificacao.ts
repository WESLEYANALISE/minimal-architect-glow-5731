import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProgressoNivel {
  id: string;
  user_id: string;
  materia: string;
  nivel: number;
  estrelas: number;
  palavras_acertadas: number;
  palavras_total: number;
  concluido: boolean;
}

export interface RankingItem {
  id: string;
  user_id: string;
  total_estrelas: number;
  total_niveis_concluidos: number;
  total_palavras_acertadas: number;
  total_xp: number;
}

export function calcularXP(acertos: number, nivel: number): number {
  const baseXP = acertos >= 5 ? 100 : acertos >= 3 ? 60 : acertos >= 1 ? 30 : 0;
  const bonusNivel = nivel * 2;
  return baseXP + bonusNivel;
}

export function useProgressoMateria(materia: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gamificacao-progresso", materia, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("gamificacao_progresso")
        .select("*")
        .eq("user_id", user.id)
        .eq("materia", materia)
        .order("nivel", { ascending: true });
      if (error) throw error;
      return (data || []) as ProgressoNivel[];
    },
    enabled: !!user && !!materia,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRanking() {
  return useQuery({
    queryKey: ["gamificacao-ranking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamificacao_ranking")
        .select("*")
        .order("total_xp", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as RankingItem[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useSalvarProgresso() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      materia, nivel, estrelas, palavras_acertadas, palavras_total,
    }: {
      materia: string; nivel: number; estrelas: number;
      palavras_acertadas: number; palavras_total: number;
    }) => {
      if (!user) throw new Error("Não autenticado");

      // Upsert progresso
      const { error: progError } = await supabase
        .from("gamificacao_progresso")
        .upsert({
          user_id: user.id,
          materia,
          nivel,
          estrelas,
          palavras_acertadas,
          palavras_total,
          concluido: estrelas > 0,
        }, { onConflict: "user_id,materia,nivel" });
      if (progError) throw progError;

      // Recalcular ranking
      const { data: allProgress } = await supabase
        .from("gamificacao_progresso")
        .select("estrelas, concluido, palavras_acertadas, nivel")
        .eq("user_id", user.id);

      const totals = (allProgress || []).reduce(
        (acc, p: any) => ({
          estrelas: acc.estrelas + (p.estrelas || 0),
          niveis: acc.niveis + (p.concluido ? 1 : 0),
          palavras: acc.palavras + (p.palavras_acertadas || 0),
          xp: acc.xp + calcularXP(p.palavras_acertadas || 0, p.nivel || 1),
        }),
        { estrelas: 0, niveis: 0, palavras: 0, xp: 0 }
      );

      await supabase
        .from("gamificacao_ranking")
        .upsert({
          user_id: user.id,
          total_estrelas: totals.estrelas,
          total_niveis_concluidos: totals.niveis,
          total_palavras_acertadas: totals.palavras,
          total_xp: totals.xp,
        } as any, { onConflict: "user_id" });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["gamificacao-progresso", vars.materia] });
      queryClient.invalidateQueries({ queryKey: ["gamificacao-ranking"] });
    },
  });
}

export function useGerarPalavras() {
  return useMutation({
    mutationFn: async ({ materia, nivel }: { materia: string; nivel: number }) => {
      const { data, error } = await supabase.functions.invoke("gerar-forca-gamificacao", {
        body: { materia, nivel },
      });
      if (error) throw error;
      return data as { palavras: { palavra: string; dica: string; categoria: string }[]; tema: string };
    },
  });
}

export function useGerarSimNao() {
  return useMutation({
    mutationFn: async ({ materia, nivel }: { materia: string; nivel: number }) => {
      const { data, error } = await supabase.functions.invoke("gerar-sim-nao-gamificacao", {
        body: { materia, nivel },
      });
      if (error) throw error;
      return data as { perguntas: { afirmacao: string; resposta: boolean; explicacao: string; categoria: string }[]; tema: string };
    },
  });
}
