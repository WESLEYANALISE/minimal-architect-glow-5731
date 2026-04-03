import { CheckCircle2, Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface CursoModuloItemProps {
  index: number;
  titulo: string;
  tema: string;
  concluida: boolean;
  desbloqueada: boolean;
  onClick: () => void;
}

export const CursoModuloItem = ({ index, titulo, tema, concluida, desbloqueada, onClick }: CursoModuloItemProps) => {
  return (
    <button
      onClick={onClick}
      disabled={!desbloqueada}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left",
        concluida
          ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
          : desbloqueada
            ? "bg-card border-border/50 hover:border-primary/40 hover:bg-accent/5 active:scale-[0.98]"
            : "bg-muted/10 border-border/20 opacity-50 cursor-not-allowed"
      )}
    >
      {/* Step number / icon */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
        concluida
          ? "bg-emerald-500/20 text-emerald-400"
          : desbloqueada
            ? "bg-primary/10 text-primary"
            : "bg-muted/30 text-muted-foreground"
      )}>
        {concluida ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : !desbloqueada ? (
          <Lock className="w-4 h-4" />
        ) : (
          <span>{index + 1}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-sm truncate",
          concluida ? "text-emerald-300" : desbloqueada ? "text-foreground" : "text-muted-foreground"
        )}>
          {titulo}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{tema}</p>
      </div>

      {/* Action */}
      {desbloqueada && !concluida && (
        <Play className="w-4 h-4 text-primary flex-shrink-0" />
      )}
    </button>
  );
};
