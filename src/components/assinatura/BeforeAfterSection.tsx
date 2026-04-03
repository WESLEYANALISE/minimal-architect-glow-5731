import { X, Check, Frown, Sparkles } from "lucide-react";

const WITHOUT_ITEMS = [
  "Estuda sozinho, sem direção",
  "Material desatualizado e disperso",
  "Sem saber se está no caminho certo",
  "Revisão manual e demorada",
  "Dúvidas sem resposta imediata",
];

const WITH_ITEMS = [
  "Plano de estudos inteligente",
  "Conteúdo atualizado diariamente",
  "IA tirando dúvidas 24h por dia",
  "Flashcards e revisão automática",
  "Aprovação com método comprovado",
];

export const BeforeAfterSection = () => {
  return (
    <div className="max-w-lg mx-auto mb-10 sm:mb-14">
      <h2
        className="text-center text-xl sm:text-2xl font-black text-white mb-6"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Por que assinar?
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {/* SEM Premium */}
        <div
          className="rounded-2xl p-4 border border-red-500/20"
          style={{
            background:
              "linear-gradient(160deg, rgba(127,29,29,0.15), rgba(9,9,11,0.8))",
          }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Frown className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              Sem Premium
            </span>
          </div>
          <ul className="space-y-2.5">
            {WITHOUT_ITEMS.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <X className="w-3.5 h-3.5 text-red-400/70 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-400 text-[11px] sm:text-xs leading-tight">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* COM Premium */}
        <div
          className="rounded-2xl p-4 border border-emerald-500/30"
          style={{
            background:
              "linear-gradient(160deg, rgba(6,78,59,0.15), rgba(9,9,11,0.8))",
          }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              Com Premium
            </span>
          </div>
          <ul className="space-y-2.5">
            {WITH_ITEMS.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-200 text-[11px] sm:text-xs leading-tight font-medium">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
