import { Target, BookOpen, ArrowRight } from "lucide-react";
import { SugestoesReforco } from "./SugestoesReforco";
import { MinhasAulasSection } from "./MinhasAulasSection";

interface Sugestao {
  area: string;
  tema: string;
  tipo: "prioridade" | "revisao";
  taxa: number;
  totalRespondidas: number;
}

interface QuestoesReforcoTabProps {
  sugestoes: Sugestao[];
  onPraticar?: () => void;
}

export const QuestoesReforcoTab = ({ sugestoes, onPraticar }: QuestoesReforcoTabProps) => {
  if (sugestoes.length === 0) {
    return (
      <div className="px-4 pb-6 flex flex-col items-center justify-center text-center pt-12">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-base font-bold text-foreground mb-2">
          Nenhuma sugestão ainda
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
          Responda pelo menos 5 questões em algum tema para desbloquear sugestões personalizadas de reforço.
        </p>
        {onPraticar && (
          <button
            onClick={onPraticar}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.97] transition-transform"
          >
            <BookOpen className="w-4 h-4" />
            Praticar Questões
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pb-6">
      <SugestoesReforco sugestoes={sugestoes} showAll />
      <div className="px-4">
        <MinhasAulasSection />
      </div>
    </div>
  );
};
