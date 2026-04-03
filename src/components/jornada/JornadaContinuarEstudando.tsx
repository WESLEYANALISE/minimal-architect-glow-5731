import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { JornadaCarouselWrapper } from "./JornadaCarouselWrapper";
import type { AulaEmAndamento } from "@/hooks/useJornadaPessoal";

interface Props {
  aulas: AulaEmAndamento[];
}

export const JornadaContinuarEstudando = memo(({ aulas }: Props) => {
  const navigate = useNavigate();

  return (
    <JornadaCarouselWrapper
      title="Continuar Estudando"
      icon={<GraduationCap className="w-4 h-4 text-red-400" />}
      isEmpty={aulas.length === 0}
      emptyMessage="Comece sua primeira aula de conceitos!"
    >
      {aulas.map((aula) => (
        <button
          key={aula.topico_id}
          onClick={() => navigate(`/conceitos/materia/${aula.materia_id}`)}
          className="flex-shrink-0 w-[170px] bg-card border border-border/30 rounded-2xl p-3 text-left hover:border-red-500/30 transition-all space-y-2"
        >
          <div className="relative rounded-xl overflow-hidden shine-effect">
          {aula.capa_url ? (
            <img src={aula.capa_url} alt="" className="w-full h-20 object-cover" />
          ) : (
            <div className="w-full h-20 bg-muted flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          </div>
          <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{aula.titulo}</p>
          <p className="text-[10px] text-muted-foreground truncate">{aula.materia_nome}</p>
          <Progress value={aula.progresso} className="h-1.5" />
          <p className="text-[10px] text-red-400 font-medium">{aula.progresso}%</p>
        </button>
      ))}
    </JornadaCarouselWrapper>
  );
});

JornadaContinuarEstudando.displayName = "JornadaContinuarEstudando";
