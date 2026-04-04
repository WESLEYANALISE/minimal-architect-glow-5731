import { useState, useEffect, useRef } from "react";
import { Target, TrendingUp, RefreshCw, BookMarked, ChevronRight } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { motion } from "framer-motion";
import draArabellaAvatar from "@/assets/dra-jurisia-avatar.webp";

const SESSION_TYPED_KEY = "arabella_v2_typed";

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
  onDiagnostico?: () => void;
}

const ACTIONS = [
  { id: "praticar", label: "Praticar", desc: "Resolver questões", icon: Target, key: "onPraticar" },
  { id: "progresso", label: "Progresso", desc: "Suas estatísticas", icon: TrendingUp, key: "onProgresso" },
  { id: "reforco", label: "Reforço", desc: "Temas fracos", icon: RefreshCw, key: "onReforco" },
  { id: "cadernos", label: "Cadernos", desc: "Questões salvas", icon: BookMarked, key: "onCadernos" },
] as const;

function gerarFeedbackArabella(
  totalRespondidas: number,
  totalAcertos: number,
  taxaGlobal: number,
  temasReforco: number,
): string {
  const hoje = new Date().toISOString().split("T")[0];
  const lastVisit = localStorage.getItem("arabella_last_visit");
  const streak = parseInt(localStorage.getItem("arabella_streak") || "0", 10);

  let newStreak = 1;
  if (lastVisit) {
    const lastDate = new Date(lastVisit);
    const todayDate = new Date(hoje);
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) newStreak = streak + 1;
    else if (diffDays === 0) newStreak = streak || 1;
  }

  localStorage.setItem("arabella_last_visit", hoje);
  localStorage.setItem("arabella_streak", String(newStreak));

  let streakMsg = "";
  if (newStreak >= 2) {
    streakMsg = `🔥 Parabéns! Já é o seu <b>${newStreak}º dia consecutivo</b> estudando! `;
  }

  if (totalRespondidas === 0) {
    return `${streakMsg}Olá! Vejo que você ainda não começou a praticar. Que tal resolver suas primeiras questões? Toque em "Praticar" e comece agora! 💪`;
  }
  if (totalRespondidas < 10) {
    return `${streakMsg}Bom começo! Você já respondeu <b>${totalRespondidas}</b> ${totalRespondidas === 1 ? "questão" : "questões"} com <b>${totalAcertos}</b> ${totalAcertos === 1 ? "acerto" : "acertos"} (<b>${taxaGlobal}%</b>). Continue praticando!`;
  }
  const totalErros = totalRespondidas - totalAcertos;
  if (taxaGlobal >= 80) {
    return `${streakMsg}Excelente! De <b>${totalRespondidas.toLocaleString("pt-BR")}</b> questões, você acertou <b>${totalAcertos.toLocaleString("pt-BR")}</b> (<b>${taxaGlobal}%</b>). ${temasReforco > 0 ? `Foque nos <b>${temasReforco}</b> temas de reforço para dominar tudo!` : "Você está dominando todas as áreas!"}`;
  }
  if (taxaGlobal >= 60) {
    return `${streakMsg}Bom progresso! <b>${totalRespondidas.toLocaleString("pt-BR")}</b> questões com <b>${taxaGlobal}%</b> de acerto. ${temasReforco > 0 ? `<b>${temasReforco}</b> temas precisam de reforço.` : "Continue nesse ritmo!"}`;
  }
  if (taxaGlobal >= 40) {
    return `${streakMsg}Você respondeu <b>${totalRespondidas.toLocaleString("pt-BR")}</b> questões com <b>${taxaGlobal}%</b> de aproveitamento. ${temasReforco > 0 ? `Foque nos <b>${temasReforco}</b> temas de reforço!` : "Revise as questões erradas."}`;
  }
  return `${streakMsg}Você tentou <b>${totalRespondidas.toLocaleString("pt-BR")}</b> questões com <b>${taxaGlobal}%</b>. Não desanime! ${temasReforco > 0 ? `Comece pelos <b>${temasReforco}</b> temas de reforço.` : "Volte às questões erradas e estude com calma."}`;
}

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
  onDiagnostico,
}: QuestoesMenuRealezaProps) => {
  const handlers: Record<string, () => void> = { onPraticar, onProgresso, onReforco, onCadernos };
  const totalErros = totalRespondidas - totalAcertos;
  const taxaErro = totalRespondidas > 0 ? 100 - taxaGlobal : 0;

  // Arabella state
  const [displayedText, setDisplayedText] = useState("");
  const feedbackTextRef = useRef("");
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    const text = gerarFeedbackArabella(totalRespondidas, totalAcertos, taxaGlobal, temasReforco);
    feedbackTextRef.current = text;
    const alreadyTyped = sessionStorage.getItem(SESSION_TYPED_KEY);
    if (alreadyTyped) {
      setDisplayedText(text);
    } else {
      setShouldAnimate(true);
      sessionStorage.setItem(SESSION_TYPED_KEY, "true");
    }
  }, [totalRespondidas, totalAcertos, taxaGlobal, temasReforco]);

  useEffect(() => {
    if (!shouldAnimate || !feedbackTextRef.current) return;
    const fullText = feedbackTextRef.current;
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) { clearInterval(interval); setShouldAnimate(false); }
    }, 18);
    return () => clearInterval(interval);
  }, [shouldAnimate]);

  const isTyping = shouldAnimate && displayedText.length < feedbackTextRef.current.length;

  const stats = [
    { label: "Respondidas", value: totalRespondidas, color: "hsl(40, 80%, 55%)" },
    { label: "Acertos", value: taxaGlobal, suffix: "%", color: "hsl(145, 60%, 45%)" },
    { label: "Erros", value: taxaErro, suffix: "%", color: "hsl(0, 70%, 55%)" },
    { label: "Questões", value: totalQuestoes, color: "hsl(220, 60%, 55%)" },
  ];

  return (
    <div className="px-4 pb-6 animate-fade-in space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
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
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, hsla(40, 80%, 70%, 0.06) 45%, hsla(40, 80%, 70%, 0.12) 50%, hsla(40, 80%, 70%, 0.06) 55%, transparent 60%)",
                }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "hsla(40, 60%, 50%, 0.12)", border: "1px solid hsla(40, 60%, 50%, 0.15)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "hsl(40, 80%, 55%)" }} />
              </div>
              <h3 className="text-sm font-bold text-white mb-0.5">{action.label}</h3>
              <p className="text-[10px]" style={{ color: "hsla(0, 0%, 100%, 0.45)" }}>{action.desc}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Dra. Arabella */}
      {displayedText && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2.5">
            <img
              src={draArabellaAvatar}
              alt="Dra. Arabella"
              className="w-9 h-9 rounded-full object-cover border-2"
              style={{ borderColor: "hsl(40, 60%, 45%)" }}
            />
            <span className="text-xs font-bold text-white">Dra. Arabella</span>
          </div>

          <div className="ml-5 relative">
            <div
              className="absolute -top-1 left-3 w-3 h-3 rotate-45"
              style={{ background: "hsla(40, 20%, 15%, 0.8)" }}
            />
            <div
              className="relative rounded-2xl rounded-tl-md px-4 py-3"
              style={{
                background: "hsla(40, 20%, 15%, 0.8)",
                border: "1px solid hsla(40, 60%, 50%, 0.15)",
              }}
            >
              <span className="text-xs text-white/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: displayedText }} />
              {isTyping && (
                <span className="inline-block w-0.5 h-3 ml-0.5 animate-pulse" style={{ background: "hsl(40, 80%, 55%)" }} />
              )}
            </div>
          </div>

          {!isTyping && onDiagnostico && (
            <button
              onClick={onDiagnostico}
              className="ml-5 w-[calc(100%-20px)] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, hsl(345, 65%, 35%), hsl(350, 50%, 28%))",
                border: "1px solid hsla(40, 60%, 50%, 0.15)",
              }}
            >
              Ver análise completa <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};
