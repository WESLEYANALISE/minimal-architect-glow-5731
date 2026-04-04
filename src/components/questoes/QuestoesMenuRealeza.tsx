import { Target, TrendingUp, RefreshCw, BookMarked } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { motion } from "framer-motion";

interface QuestoesMenuRealezaProps {
  totalRespondidas: number;
  totalAcertos: number;
  taxaGlobal: number;
  temasReforco: number;
  totalQuestoes: number;
  onPraticar: () => void;
  onProgresso: () => void;
  onReforco: () => void;
  onCadernos: () => void;
}

const ACTIONS = [
  { id: "praticar", label: "Praticar", desc: "Resolver questões", icon: Target, key: "onPraticar" },
  { id: "progresso", label: "Progresso", desc: "Suas estatísticas", icon: TrendingUp, key: "onProgresso" },
  { id: "reforco", label: "Reforço", desc: "Temas fracos", icon: RefreshCw, key: "onReforco" },
  { id: "cadernos", label: "Cadernos", desc: "Questões salvas", icon: BookMarked, key: "onCadernos" },
] as const;

export const QuestoesMenuRealeza = ({
  totalRespondidas,
  totalAcertos,
  taxaGlobal,
  temasReforco,
  totalQuestoes,
  onPraticar,
  onProgresso,
  onReforco,
  onCadernos,
}: QuestoesMenuRealezaProps) => {
  const handlers: Record<string, () => void> = { onPraticar, onProgresso, onReforco, onCadernos };
  const totalErros = totalRespondidas - totalAcertos;
  const taxaErro = totalRespondidas > 0 ? 100 - taxaGlobal : 0;

  const stats = [
    { label: "Respondidas", value: totalRespondidas, color: "hsl(40, 80%, 55%)" },
    { label: "Acertos", value: taxaGlobal, suffix: "%", color: "hsl(145, 60%, 45%)" },
    { label: "Erros", value: taxaErro, suffix: "%", color: "hsl(0, 70%, 55%)" },
    { label: "Questões", value: totalQuestoes, color: "hsl(220, 60%, 55%)" },
  ];

  return (
    <div className="px-4 pb-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="rounded-xl p-3 text-center"
            style={{
              background: "hsla(0, 0%, 100%, 0.04)",
              border: "1px solid hsla(40, 60%, 50%, 0.1)",
            }}
          >
            <div className="text-lg font-bold text-white">
              <NumberTicker value={s.value} delay={0.2 + i * 0.1} />
              {s.suffix && <span className="text-sm">{s.suffix}</span>}
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "hsla(0, 0%, 100%, 0.45)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Action cards 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
              onClick={handlers[action.key]}
              className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: "hsla(0, 0%, 100%, 0.04)",
                backdropFilter: "blur(12px)",
                border: "1px solid hsla(40, 60%, 50%, 0.12)",
                boxShadow: "0 4px 20px -4px rgba(0,0,0,0.4), inset 0 1px 0 hsla(40, 60%, 80%, 0.06)",
              }}
            >
              {/* Shimmer */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, hsla(40, 80%, 70%, 0.06) 45%, hsla(40, 80%, 70%, 0.12) 50%, hsla(40, 80%, 70%, 0.06) 55%, transparent 60%)",
                }}
              />

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: "hsla(40, 60%, 50%, 0.12)",
                  border: "1px solid hsla(40, 60%, 50%, 0.15)",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: "hsl(40, 80%, 55%)" }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-0.5">{action.label}</h3>
              <p className="text-[10px]" style={{ color: "hsla(0, 0%, 100%, 0.45)" }}>{action.desc}</p>

              <BorderBeam size={80} duration={10} delay={i * 0.5} colorFrom="hsl(40, 80%, 55%)" colorTo="hsl(345, 65%, 40%)" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
