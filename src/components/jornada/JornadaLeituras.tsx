import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { JornadaCarouselWrapper } from "./JornadaCarouselWrapper";
import type { LeituraEmAndamento } from "@/hooks/useJornadaPessoal";

interface Props {
  leituras: LeituraEmAndamento[];
}

const getRoute = (l: LeituraEmAndamento) => {
  const tabela = l.biblioteca_tabela?.toLowerCase() || "";
  if (tabela.includes("classicos")) return `/biblioteca-classicos`;
  if (tabela.includes("oab")) return `/biblioteca-oab`;
  if (tabela.includes("estudos")) return `/biblioteca-estudos`;
  if (tabela.includes("oratoria")) return `/biblioteca-oratoria`;
  if (tabela.includes("lideranca") || tabela.includes("liderança")) return `/biblioteca-lideranca`;
  if (tabela.includes("fora")) return `/biblioteca-fora-da-toga`;
  if (tabela.includes("portugues") || tabela.includes("português")) return `/biblioteca-portugues`;
  if (tabela.includes("politica") || tabela.includes("política")) return `/biblioteca-politica`;
  if (tabela.includes("pesquisa")) return `/biblioteca-pesquisa-cientifica`;
  return `/biblioteca-classicos`;
};

export const JornadaLeituras = memo(({ leituras }: Props) => {
  const navigate = useNavigate();

  return (
    <JornadaCarouselWrapper
      title="Leituras em Andamento"
      icon={<BookOpen className="w-4 h-4 text-emerald-400" />}
      isEmpty={leituras.length === 0}
      emptyMessage="Adicione livros ao seu plano de leitura!"
    >
      {leituras.map((livro) => (
        <button
          key={livro.id}
          onClick={() => navigate(getRoute(livro))}
          className="flex-shrink-0 w-[140px] bg-card border border-border/30 rounded-2xl p-3 text-left hover:border-emerald-500/30 transition-all space-y-2"
        >
          <div className="relative rounded-xl overflow-hidden shine-effect">
          {livro.capa_url ? (
            <img src={livro.capa_url} alt="" className="w-full h-[160px] object-cover" />
          ) : (
            <div className="w-full h-[160px] bg-muted flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          </div>
          <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight">{livro.titulo}</p>
          <Progress value={livro.progresso} className="h-1.5" />
          <p className="text-[10px] text-emerald-400 font-medium">{livro.progresso}%</p>
        </button>
      ))}
    </JornadaCarouselWrapper>
  );
});

JornadaLeituras.displayName = "JornadaLeituras";
