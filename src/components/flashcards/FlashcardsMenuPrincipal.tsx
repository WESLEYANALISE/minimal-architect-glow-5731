import { useState, useEffect, useRef, useMemo } from "react";
import { Target, BarChart3, GraduationCap, BookMarked, ChevronRight, Flame, Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useFlashcardStats } from "@/hooks/useFlashcardStudyProgress";
import draArabellaAvatar from "@/assets/dra-jurisia-avatar.png";

const SESSION_TYPED_KEY = "arabella_flashcards_typed";

interface FlashcardsMenuPrincipalProps {
  totalFlashcards: number;
  onPraticar: () => void;
  onProgresso: () => void;
  onReforco: () => void;
  onCadernos: () => void;
  onDiagnostico: () => void;
}

const MENU_ITEMS = [
  {
    key: "praticar",
    label: "Praticar",
    desc: "Estudar flashcards por área",
    icon: Target,
    bgIcon: Target,
    gradient: "linear-gradient(135deg, hsl(220 60% 35%), hsl(220 55% 28%))",
    iconBg: "hsla(220, 55%, 50%, 0.3)",
  },
  {
    key: "progresso",
    label: "Progresso",
    desc: "Seu desempenho detalhado",
    icon: BarChart3,
    bgIcon: BarChart3,
    gradient: "linear-gradient(135deg, hsl(160 60% 38%), hsl(170 55% 30%))",
    iconBg: "hsla(160, 55%, 50%, 0.3)",
  },
  {
    key: "reforco",
    label: "Reforço",
    desc: "Áreas para revisar",
    icon: GraduationCap,
    bgIcon: GraduationCap,
    gradient: "linear-gradient(135deg, hsl(230 65% 55%), hsl(240 60% 42%))",
    iconBg: "hsla(230, 55%, 65%, 0.3)",
  },
  {
    key: "cadernos",
    label: "Decks",
    desc: "Monte seus decks",
    icon: BookMarked,
    bgIcon: BookMarked,
    gradient: "linear-gradient(135deg, hsl(340 55% 50%), hsl(350 50% 38%))",
    iconBg: "hsla(340, 50%, 60%, 0.3)",
  },
] as const;

function gerarFeedbackFlashcards(
  compreendi: number,
  revisar: number,
  total: number,
  streak: number,
): string {
  let streakMsg = "";
  if (streak >= 2) {
    streakMsg = `🔥 Parabéns! Já é o seu <b>${streak}º dia consecutivo</b> estudando flashcards! Essa consistência faz toda a diferença. `;
  }

  if (total === 0) {
    return `${streakMsg}Olá! Vejo que você ainda não começou a estudar flashcards. Que tal começar agora? Toque em "Praticar" e comece sua jornada de memorização! 💪`;
  }

  const taxaCompreendi = Math.round((compreendi / total) * 100);

  if (total < 10) {
    return `${streakMsg}Bom começo! Você já estudou <b>${total}</b> flashcards com <b>${compreendi}</b> compreendidos (<b>${taxaCompreendi}%</b>). Continue praticando para fortalecer sua base!`;
  }

  if (taxaCompreendi >= 80) {
    return `${streakMsg}Excelente desempenho! De <b>${total}</b> flashcards estudados, você compreendeu <b>${compreendi}</b> (<b>${taxaCompreendi}%</b>). ${revisar > 0 ? `Ainda tem <b>${revisar}</b> para revisar, foque neles para dominar tudo!` : "Você está dominando todas as áreas!"}`;
  }

  if (taxaCompreendi >= 60) {
    return `${streakMsg}Bom progresso! Você tem <b>${total}</b> flashcards estudados com taxa de <b>${taxaCompreendi}%</b> de compreensão. ${revisar > 0 ? `Atenção: <b>${revisar}</b> flashcards precisam de revisão. Revise-os para subir sua taxa!` : "Continue nesse ritmo!"}`;
  }

  if (taxaCompreendi >= 40) {
    return `${streakMsg}Você já estudou <b>${total}</b> flashcards com <b>${taxaCompreendi}%</b> de aproveitamento. São <b>${revisar}</b> cards para revisar que podem virar aprendizado! Foque na revisão para melhorar rapidamente.`;
  }

  return `${streakMsg}Vejo que você já estudou <b>${total}</b> flashcards, mas sua taxa está em <b>${taxaCompreendi}%</b>. Não desanime! Cada revisão é uma oportunidade de aprender. Volte aos cards marcados para revisão e estude com calma.`;
}

export const FlashcardsMenuPrincipal = ({
  totalFlashcards,
  onPraticar,
  onProgresso,
  onReforco,
  onCadernos,
  onDiagnostico,
}: FlashcardsMenuPrincipalProps) => {
  const { user } = useAuth();
  const { data: stats } = useFlashcardStats();
  const [displayedText, setDisplayedText] = useState("");
  const feedbackTextRef = useRef("");
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const hasInitialized = useRef(false);

  const compreendi = stats?.compreendi || 0;
  const revisar = stats?.revisar || 0;
  const total = stats?.total || 0;
  const streak = stats?.streak || 0;
  const taxaCompreendi = total > 0 ? Math.round((compreendi / total) * 100) : 0;
  const taxaRevisar = total > 0 ? Math.round((revisar / total) * 100) : 0;
  const progressoEstudados = totalFlashcards > 0 ? Math.min(Math.round((total / totalFlashcards) * 100), 100) : 0;

  const temasReforco = useMemo(() => {
    return (stats?.areaStats || []).filter(a => a.percentDominio < 50).length;
  }, [stats]);

  const handlers: Record<string, () => void> = {
    praticar: onPraticar,
    progresso: onProgresso,
    reforco: onReforco,
    cadernos: onCadernos,
  };

  const getBadge = (key: string): string | null => {
    if (key === "progresso") return total > 0 ? `${taxaCompreendi}%` : "Novo";
    if (key === "reforco") return temasReforco > 0 ? `${temasReforco}` : "0 áreas";
    return null;
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const text = gerarFeedbackFlashcards(compreendi, revisar, total, streak);
    feedbackTextRef.current = text;

    const alreadyTyped = sessionStorage.getItem(SESSION_TYPED_KEY);
    if (alreadyTyped) {
      setDisplayedText(text);
      setShouldAnimate(false);
    } else {
      setShouldAnimate(true);
      sessionStorage.setItem(SESSION_TYPED_KEY, "true");
    }
  }, [compreendi, revisar, total, streak]);

  useEffect(() => {
    if (!shouldAnimate || !feedbackTextRef.current) return;
    const fullText = feedbackTextRef.current;
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setShouldAnimate(false);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [shouldAnimate]);

  const isTyping = shouldAnimate && displayedText.length < feedbackTextRef.current.length;

  return (
    <div className="px-4 space-y-5 pb-8">
      {/* Stats resumo - 4 columns */}
      <div className="grid grid-cols-4 gap-2">
        <div
          className="relative rounded-2xl py-4 px-2 text-center overflow-hidden"
          style={{ background: "hsl(230 20% 18%)", border: "1px solid hsl(230 40% 40% / 0.25)" }}
        >
          <p className="text-xl font-bold text-foreground tracking-tight">{total.toLocaleString("pt-BR")}</p>
          <p className="text-[9px] text-muted-foreground mt-1 font-medium">de {totalFlashcards.toLocaleString("pt-BR")}</p>
          <div className="mt-2 mx-auto w-4/5 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(230 15% 25%)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressoEstudados}%`, background: "hsl(25 85% 55%)" }} />
          </div>
        </div>

        <div
          className="relative rounded-2xl py-4 px-2 text-center overflow-hidden"
          style={{ background: "hsl(152 20% 16%)", border: "1px solid hsl(152 50% 40% / 0.3)" }}
        >
          <p className="text-xl font-bold tracking-tight" style={{ color: "hsl(152 75% 50%)" }}>{taxaCompreendi}%</p>
          <p className="text-[9px] text-muted-foreground mt-1 font-medium">Compreendi</p>
          <div className="mt-2 mx-auto w-4/5 h-1 rounded-full overflow-hidden" style={{ background: "hsl(152 15% 22%)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${taxaCompreendi}%`, background: "hsl(152 72% 42%)" }} />
          </div>
        </div>

        <div
          className="relative rounded-2xl py-4 px-2 text-center overflow-hidden"
          style={{ background: "hsl(0 20% 16%)", border: "1px solid hsl(0 50% 42% / 0.3)" }}
        >
          <p className="text-xl font-bold tracking-tight" style={{ color: "hsl(0 78% 58%)" }}>{taxaRevisar}%</p>
          <p className="text-[9px] text-muted-foreground mt-1 font-medium">Revisar</p>
          <div className="mt-2 mx-auto w-4/5 h-1 rounded-full overflow-hidden" style={{ background: "hsl(0 15% 22%)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${taxaRevisar}%`, background: "hsl(0 78% 50%)" }} />
          </div>
        </div>

        <div
          className="relative rounded-2xl py-4 px-2 text-center overflow-hidden"
          style={{ background: "hsl(30 22% 16%)", border: "1px solid hsl(30 55% 42% / 0.3)" }}
        >
          <Flame className="w-4 h-4 mx-auto mb-0.5" style={{ color: "hsl(20 95% 55%)" }} />
          <p className="text-xl font-bold text-foreground tracking-tight">{streak}</p>
          <p className="text-[9px] text-muted-foreground mt-1 font-medium">Dias seguidos</p>
        </div>
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {MENU_ITEMS.map((item, i) => {
          const Icon = item.icon;
          const BgIcon = item.bgIcon;
          const badge = getBadge(item.key);
          return (
            <button
              key={item.key}
              onClick={handlers[item.key]}
              className="relative h-[130px] p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.03] active:scale-95 overflow-hidden animate-fade-in group shine-effect"
              style={{
                background: item.gradient,
                border: "1px solid hsl(0 0% 100% / 0.1)",
                animationDelay: `${i * 80}ms`,
                animationFillMode: "both",
              }}
            >
              <BgIcon
                className="absolute -bottom-2 -right-2 text-white pointer-events-none"
                style={{ width: 88, height: 88, opacity: 0.15 }}
              />
              {badge && item.key !== "progresso" && (
                <span
                  className="absolute top-2.5 right-2.5 text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
                  style={{ background: "hsl(0 0% 100% / 0.18)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                >
                  {badge}
                </span>
              )}
              {item.key === "progresso" && total > 0 && (
                <div className="absolute top-2 right-2">
                  <svg width="30" height="30" viewBox="0 0 30 30" className="transform -rotate-90">
                    <circle cx="15" cy="15" r="12" fill="none" stroke="hsla(0,0%,100%,0.15)" strokeWidth="3" />
                    <circle cx="15" cy="15" r="12" fill="none" stroke="white" strokeWidth="3"
                      strokeDasharray={2 * Math.PI * 12}
                      strokeDashoffset={2 * Math.PI * 12 - (taxaCompreendi / 100) * 2 * Math.PI * 12}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">{taxaCompreendi}%</span>
                </div>
              )}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
                style={{ background: item.iconBg, border: "1px solid hsl(0 0% 100% / 0.1)" }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-white">{item.label}</p>
              <p className="text-[10px] text-white/60 mt-0.5">{item.desc}</p>
            </button>
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
            <img src={draArabellaAvatar} alt="Dra. Arabella" className="w-9 h-9 rounded-full object-cover border-2" style={{ borderColor: "hsl(25 60% 45%)" }} />
            <span className="text-xs font-bold text-foreground">Dra. Arabella</span>
          </div>
          <div className="ml-5 relative">
            <div className="absolute -top-1 left-3 w-3 h-3 rotate-45" style={{ background: "hsl(25 18% 20%)" }} />
            <div className="relative rounded-2xl rounded-tl-md px-4 py-3" style={{ background: "hsl(25 18% 20%)", border: "1px solid hsl(25 25% 28% / 0.4)" }}>
              <span className="text-xs text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: displayedText }} />
              {isTyping && <span className="inline-block w-0.5 h-3 bg-violet-400 ml-0.5 animate-pulse" />}
            </div>
          </div>
          {!isTyping && (
            <button
              onClick={onDiagnostico}
              className="ml-5 w-[calc(100%-20px)] relative flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors hover:opacity-90 overflow-hidden shine-effect"
              style={{ background: "linear-gradient(135deg, hsl(25 85% 52%), hsl(15 75% 42%))" }}
            >
              Ver análise completa <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};
