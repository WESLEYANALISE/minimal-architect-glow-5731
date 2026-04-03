import { memo } from "react";
import { Loader2 } from "lucide-react";
import { useJornadaPessoal } from "@/hooks/useJornadaPessoal";
import { JornadaStatsBar } from "./JornadaStatsBar";
import { JornadaContinuarEstudando } from "./JornadaContinuarEstudando";
import { JornadaLeituras } from "./JornadaLeituras";
import { JornadaFlashcardsRecentes } from "./JornadaFlashcardsRecentes";
import { JornadaResumosRecentes } from "./JornadaResumosRecentes";
import { JornadaJuriflixRecomendacoes } from "./JornadaJuriflixRecomendacoes";
import { JornadaAreasChart } from "./JornadaAreasChart";

export const JornadaPessoalSection = memo(() => {
  const {
    aulasProgresso,
    leituras,
    flashcardsData,
    resumos,
    juriflix,
    areasEstudadas,
    stats,
    isLoading,
    isLoggedIn,
  } = useJornadaPessoal();

  if (!isLoggedIn) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <JornadaStatsBar stats={stats} />
      <JornadaContinuarEstudando aulas={aulasProgresso} />
      <JornadaLeituras leituras={leituras} />
      <JornadaFlashcardsRecentes flashcards={flashcardsData} />
      <JornadaResumosRecentes resumos={resumos} />
      <JornadaJuriflixRecomendacoes juriflix={juriflix} />
      <JornadaAreasChart areas={areasEstudadas} />
    </div>
  );
});

JornadaPessoalSection.displayName = "JornadaPessoalSection";
