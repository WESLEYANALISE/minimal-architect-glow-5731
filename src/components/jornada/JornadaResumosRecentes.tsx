import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Eye } from "lucide-react";
import { JornadaCarouselWrapper } from "./JornadaCarouselWrapper";
import type { ResumoRecente } from "@/hooks/useJornadaPessoal";

interface Props {
  resumos: ResumoRecente[];
}

export const JornadaResumosRecentes = memo(({ resumos }: Props) => {
  const navigate = useNavigate();

  return (
    <JornadaCarouselWrapper
      title="Resumos Acessados"
      icon={<FileText className="w-4 h-4 text-sky-400" />}
      isEmpty={resumos.length === 0}
      emptyMessage="Acesse seus primeiros resumos!"
    >
      {resumos.map((r) => (
        <button
          key={r.page_path}
          onClick={() => navigate(r.page_path)}
          className="flex-shrink-0 w-[160px] bg-card border border-border/30 rounded-2xl p-3 text-left hover:border-sky-500/30 transition-all space-y-2"
        >
          <div className="p-2 bg-sky-500/20 rounded-xl w-fit">
            <FileText className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{r.page_title}</p>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Eye className="w-3 h-3" />
            <span>{r.visitas} {r.visitas === 1 ? "visita" : "visitas"}</span>
          </div>
        </button>
      ))}
    </JornadaCarouselWrapper>
  );
});

JornadaResumosRecentes.displayName = "JornadaResumosRecentes";
