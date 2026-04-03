import { Target, Brain, ArrowRight } from "lucide-react";
import { useFlashcardStats } from "@/hooks/useFlashcardStudyProgress";

interface Props {
  onPraticar?: () => void;
}

export const FlashcardsReforcoTab = ({ onPraticar }: Props) => {
  const { data: stats } = useFlashcardStats();
  const areaStats = stats?.areaStats || [];

  const areasReforco = areaStats
    .filter(a => a.total >= 3 && a.percentDominio < 60)
    .sort((a, b) => a.percentDominio - b.percentDominio);

  if (areasReforco.length === 0) {
    return (
      <div className="px-4 pb-6 flex flex-col items-center justify-center text-center pt-12">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-2">
          Nenhuma sugestão ainda
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
          Estude pelo menos 3 flashcards em alguma área para desbloquear sugestões de reforço.
        </p>
        {onPraticar && (
          <button
            onClick={onPraticar}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(220,60%,35%)] text-white text-sm font-semibold active:scale-[0.97] transition-transform"
          >
            <Brain className="w-4 h-4" />
            Praticar Flashcards
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 space-y-3">
      <p className="text-sm font-semibold text-foreground">Áreas para Revisar</p>
      <p className="text-xs text-muted-foreground mb-2">
        Áreas com taxa de compreensão abaixo de 60%. Foque nelas!
      </p>
      {areasReforco.map((area, i) => (
        <div
          key={area.area}
          className="rounded-2xl p-4 relative overflow-hidden animate-fade-in"
          style={{
            background: area.percentDominio < 30 ? "hsl(0 20% 16%)" : "hsl(38 20% 16%)",
            border: `1px solid ${area.percentDominio < 30 ? "hsl(0 50% 42% / 0.3)" : "hsl(38 50% 42% / 0.3)"}`,
            animationDelay: `${i * 60}ms`,
            animationFillMode: "both",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${area.percentDominio < 30 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                {area.percentDominio < 30 ? "Prioridade" : "Revisão"}
              </span>
              <span className="text-sm font-semibold text-foreground">{area.area}</span>
            </div>
            <span className={`text-sm font-bold ${area.percentDominio < 30 ? "text-red-400" : "text-amber-400"}`}>
              {area.percentDominio}%
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>✅ {area.compreendi} compreendi</span>
            <span>🔄 {area.revisar} revisar</span>
            <span>📊 {area.total} total</span>
          </div>
        </div>
      ))}
    </div>
  );
};
