import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppStatistics {
  flashcards: number;
  videoaulas: number;
  audioaulas: number;
  livrosTotal: number;
  livrosEstudos: number;
  livrosForaDaToga: number;
  livrosClassicos: number;
  livrosLideranca: number;
  livrosOratoria: number;
  resumos: number;
  questoesOAB: number;
  cursosAulas: number;
  casosSimulacao: number;
  mapasMentais: number;
  funcoesApp: number;
  loading: boolean;
}

export const useAppStatistics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["app-statistics"],
    queryFn: async (): Promise<AppStatistics> => {
      // Buscar todas as estatísticas em paralelo
      // Usar RPC única em vez de 13 queries paralelas
      const { data, error } = await supabase.rpc("get_app_statistics" as never);

      if (error) {
        console.error("Erro ao buscar estatísticas:", error);
        throw error;
      }

      const stats = (data as any)?.[0] || data;

      const livrosEstudos = Number(stats?.livros_estudos || 0);
      const livrosForaDaToga = Number(stats?.livros_fora_da_toga || 0);
      const livrosClassicos = Number(stats?.livros_classicos || 0);
      const livrosLideranca = Number(stats?.livros_lideranca || 0);
      const livrosOratoria = Number(stats?.livros_oratoria || 0);

      const livrosTotal = livrosEstudos + livrosForaDaToga + livrosClassicos + livrosLideranca + livrosOratoria;
      const funcoesApp = 50;

      return {
        flashcards: Number(stats?.flashcards || 0),
        videoaulas: Number(stats?.videoaulas || 0),
        audioaulas: Number(stats?.audioaulas || 0),
        livrosTotal,
        livrosEstudos,
        livrosForaDaToga,
        livrosClassicos,
        livrosLideranca,
        livrosOratoria,
        resumos: Number(stats?.resumos || 0),
        questoesOAB: Number(stats?.questoes_oab || 0),
        cursosAulas: Number(stats?.cursos_aulas || 0),
        casosSimulacao: Number(stats?.casos_simulacao || 0),
        mapasMentais: Number(stats?.mapas_mentais || 0),
        funcoesApp,
        loading: false,
      };
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  return {
    statistics: data || {
      flashcards: 0,
      videoaulas: 0,
      audioaulas: 0,
      livrosTotal: 0,
      livrosEstudos: 0,
      livrosForaDaToga: 0,
      livrosClassicos: 0,
      livrosLideranca: 0,
      livrosOratoria: 0,
      resumos: 0,
      questoesOAB: 0,
      cursosAulas: 0,
      casosSimulacao: 0,
      mapasMentais: 0,
      funcoesApp: 0,
      loading: true,
    },
    isLoading,
  };
};
