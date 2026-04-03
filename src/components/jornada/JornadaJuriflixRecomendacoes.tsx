import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Film, Star } from "lucide-react";
import { JornadaCarouselWrapper } from "./JornadaCarouselWrapper";
import type { JuriflixRecomendacao } from "@/hooks/useJornadaPessoal";

interface Props {
  juriflix: JuriflixRecomendacao[];
}

const getPoster = (j: JuriflixRecomendacao) => {
  if (j.poster_path) return `https://image.tmdb.org/t/p/w300${j.poster_path}`;
  return j.capa;
};

export const JornadaJuriflixRecomendacoes = memo(({ juriflix }: Props) => {
  const navigate = useNavigate();

  return (
    <JornadaCarouselWrapper
      title="Recomendações Juriflix"
      icon={<Film className="w-4 h-4 text-red-400" />}
      isEmpty={juriflix.length === 0}
      emptyMessage="Nenhuma recomendação disponível"
    >
      {juriflix.map((j) => {
        const poster = getPoster(j);
        return (
          <button
            key={j.id}
            onClick={() => navigate(`/juriflix/${j.id}`)}
            className="flex-shrink-0 w-[130px] bg-card border border-border/30 rounded-2xl overflow-hidden text-left hover:border-red-500/30 transition-all"
          >
            <div className="relative overflow-hidden shine-effect">
            {poster ? (
              <img src={poster} alt="" className="w-full h-[180px] object-cover" />
            ) : (
              <div className="w-full h-[180px] bg-muted flex items-center justify-center">
                <Film className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            </div>
            <div className="p-2.5 space-y-1">
              <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight">{j.nome}</p>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {j.nota && (
                  <>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span>{j.nota}</span>
                  </>
                )}
                {j.ano && <span>• {j.ano}</span>}
              </div>
            </div>
          </button>
        );
      })}
    </JornadaCarouselWrapper>
  );
});

JornadaJuriflixRecomendacoes.displayName = "JornadaJuriflixRecomendacoes";
