import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
import { JornadaCarouselWrapper } from "./JornadaCarouselWrapper";
import type { FlashcardArea } from "@/hooks/useJornadaPessoal";

interface Props {
  flashcards: FlashcardArea[];
}

export const JornadaFlashcardsRecentes = memo(({ flashcards }: Props) => {
  const navigate = useNavigate();

  return (
    <JornadaCarouselWrapper
      title="Flashcards"
      icon={<Brain className="w-4 h-4 text-violet-400" />}
      isEmpty={flashcards.length === 0}
      emptyMessage="Comece a estudar seus flashcards!"
    >
      {flashcards.map((fc) => {
        const pct = fc.total > 0 ? Math.round((fc.compreendi / fc.total) * 100) : 0;
        return (
          <button
            key={fc.area}
            onClick={() => navigate("/flashcards")}
            className="flex-shrink-0 w-[160px] bg-card border border-border/30 rounded-2xl p-3 text-left hover:border-violet-500/30 transition-all space-y-2"
          >
            <div className="p-2 bg-violet-500/20 rounded-xl w-fit shine-effect">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-xs font-semibold text-foreground line-clamp-2">{fc.area}</p>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-emerald-400">{fc.compreendi} ✓</span>
              <span className="text-amber-400">{fc.revisar} ↻</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-violet-400 font-medium">{pct}% dominado</p>
          </button>
        );
      })}
    </JornadaCarouselWrapper>
  );
});

JornadaFlashcardsRecentes.displayName = "JornadaFlashcardsRecentes";
