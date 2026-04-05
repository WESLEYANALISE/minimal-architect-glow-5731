import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Target, BarChart3, GraduationCap, BookMarked, ChevronRight, Flame, BookOpen, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import draArabellaAvatar from "@/assets/dra-jurisia-avatar.webp";

// Session key to track if typing animation already played this session
const SESSION_TYPED_KEY = "arabella_typed_this_session";

interface UserStat {
  area: string;
  tema: string;
  acertos: number;
  erros: number;
  ultima_resposta: string | null;
}

interface QuestoesMenuPrincipalProps {
  totalRespondidas: number;
  totalAcertos: number;
  taxaGlobal: number;
  temasReforco: number;
  totalQuestoes: number;
  userStats: UserStat[];
  isDesktop?: boolean;
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
    desc: "Resolver questões por disciplina",
    icon: Target,
    bgIcon: Target,
    gradient: "linear-gradient(135deg, hsl(220 72% 50%), hsl(235 65% 40%))",
    iconBg: "hsla(220, 65%, 65%, 0.3)",
    emptyBadge: null,
  },
  {
    key: "progresso",
    label: "Progresso",
    desc: "Seu desempenho detalhado",
    icon: BarChart3,
    bgIcon: BarChart3,
    gradient: "linear-gradient(135deg, hsl(152 72% 40%), hsl(165 65% 32%))",
    iconBg: "hsla(152, 65%, 55%, 0.3)",
    emptyBadge: "Novo",
  },
  {
    key: "reforco",
    label: "Reforço",
    desc: "Temas para melhorar",
    icon: GraduationCap,
    bgIcon: GraduationCap,
    gradient: "linear-gradient(135deg, hsl(205 70% 50%), hsl(220 65% 42%))",
    iconBg: "hsla(205, 65%, 60%, 0.3)",
    emptyBadge: "0 temas",
  },
  {
    key: "cadernos",
    label: "Cadernos",
    desc: "Monte seus cadernos",
    icon: BookMarked,
    bgIcon: BookMarked,
    gradient: "linear-gradient(135deg, hsl(270 72% 58%), hsl(285 65% 45%))",
    iconBg: "hsla(270, 60%, 70%, 0.3)",
    emptyBadge: null,
  },
] as const;

/**
 * Generate Dra. Arabella's feedback locally based on actual stats.
 */
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
    if (diffDays === 1) {
      newStreak = streak + 1;
    } else if (diffDays === 0) {
      newStreak = streak || 1;
    }
  }

  localStorage.setItem("arabella_last_visit", hoje);
  localStorage.setItem("arabella_streak", String(newStreak));

  let streakMsg = "";
  if (newStreak >= 2) {
    streakMsg = `🔥 Parabéns! Já é o seu <b>${newStreak}º dia consecutivo</b> estudando! Essa consistência faz toda a diferença. `;
  }

  if (totalRespondidas === 0) {
    return `${streakMsg}Olá! Vejo que você ainda não começou a praticar. Que tal resolver suas primeiras questões? Toque em "Praticar" e comece agora, cada questão respondida é um passo a mais na sua preparação! 💪`;
  }

  if (totalRespondidas < 10) {
    return `${streakMsg}Bom começo! Você já respondeu <b>${totalRespondidas}</b> ${totalRespondidas === 1 ? "questão" : "questões"} com <b>${totalAcertos}</b> ${totalAcertos === 1 ? "acerto" : "acertos"} (<b>${taxaGlobal}%</b>). Continue praticando para fortalecer sua base!`;
  }

  const totalErros = totalRespondidas - totalAcertos;

  if (taxaGlobal >= 80) {
    return `${streakMsg}Excelente desempenho! De <b>${totalRespondidas.toLocaleString("pt-BR")}</b> questões, você acertou <b>${totalAcertos.toLocaleString("pt-BR")}</b> (<b>${taxaGlobal}%</b>). ${temasReforco > 0 ? `Ainda tem <b>${temasReforco}</b> ${temasReforco === 1 ? "tema" : "temas"} para reforçar, foque neles para dominar tudo!` : "Você está dominando todas as áreas!"}`;
  }

  if (taxaGlobal >= 60) {
    return `${streakMsg}Bom progresso! Você tem <b>${totalRespondidas.toLocaleString("pt-BR")}</b> questões respondidas com taxa de <b>${taxaGlobal}%</b> de acerto. ${temasReforco > 0 ? `Atenção: <b>${temasReforco}</b> ${temasReforco === 1 ? "tema precisa" : "temas precisam"} de reforço. Revise-os para subir sua taxa!` : "Continue nesse ritmo!"}`;
  }

  if (taxaGlobal >= 40) {
    return `${streakMsg}Você já respondeu <b>${totalRespondidas.toLocaleString("pt-BR")}</b> questões com <b>${taxaGlobal}%</b> de aproveitamento. São <b>${totalErros.toLocaleString("pt-BR")}</b> erros que podem virar aprendizado! ${temasReforco > 0 ? `Foque nos <b>${temasReforco}</b> temas de reforço para melhorar rapidamente.` : "Revise as questões erradas para solidificar o conhecimento."}`;
  }

  return `${streakMsg}Vejo que você já tentou <b>${totalRespondidas.toLocaleString("pt-BR")}</b> questões, mas sua taxa está em <b>${taxaGlobal}%</b>. Não desanime! Cada erro é uma oportunidade de aprender. ${temasReforco > 0 ? `Comece pelos <b>${temasReforco}</b> temas de reforço, a prática direcionada vai fazer sua taxa subir!` : "Volte às questões erradas e estude os temas com calma."}`;
}

export const QuestoesMenuPrincipal = ({
  totalRespondidas,
  totalAcertos,
  taxaGlobal,
  temasReforco,
  totalQuestoes,
  userStats,
  isDesktop = false,
  onPraticar,
  onProgresso,
  onReforco,
  onCadernos,
  onDiagnostico,
}: QuestoesMenuPrincipalProps) => {
  const { user } = useAuth();
  const [displayedText, setDisplayedText] = useState("");
  const feedbackTextRef = useRef("");
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const hasInitialized = useRef(false);
  const [rotatingIndex, setRotatingIndex] = useState(0);

  // Compute derived stats
  const totalErros = totalRespondidas - totalAcertos;
  const taxaErros = totalRespondidas > 0 ? Math.round((totalErros / totalRespondidas) * 100) : 0;
  const progressoRespondidas = totalQuestoes > 0 ? Math.min(Math.round((totalRespondidas / totalQuestoes) * 100), 100) : 0;

  const diasConsecutivos = parseInt(localStorage.getItem("arabella_streak") || "1", 10);

  const materiaPreferida = useMemo(() => {
    const map = new Map<string, number>();
    userStats.forEach(s => {
      const total = s.acertos + s.erros;
      map.set(s.area, (map.get(s.area) || 0) + total);
    });
    let best = "—";
    let max = 0;
    map.forEach((v, k) => { if (v > max) { max = v; best = k; } });
    return best;
  }, [userStats]);

  const temasEstudados = useMemo(() => {
    const set = new Set<string>();
    userStats.forEach(s => { if (s.acertos + s.erros > 0) set.add(`${s.area}::${s.tema}`); });
    return set.size;
  }, [userStats]);

  // Rotating card slides
  const rotatingSlides = useMemo(() => [
    { icon: Flame, label: "Dias consecutivos", value: `${diasConsecutivos}`, color: "hsl(25 90% 55%)" },
    { icon: Star, label: "Matéria preferida", value: materiaPreferida, color: "hsl(45 90% 55%)" },
    { icon: BookOpen, label: "Temas estudados", value: `${temasEstudados}`, color: "hsl(200 70% 55%)" },
  ], [diasConsecutivos, materiaPreferida, temasEstudados]);

  // Auto-rotate the 4th card
  useEffect(() => {
    const t = setInterval(() => setRotatingIndex(i => (i + 1) % rotatingSlides.length), 3000);
    return () => clearInterval(t);
  }, [rotatingSlides.length]);

  const handlers: Record<string, () => void> = {
    praticar: onPraticar,
    progresso: onProgresso,
    reforco: onReforco,
    cadernos: onCadernos,
  };

  const getBadge = (key: string): string | null => {
    if (key === "progresso") return totalRespondidas > 0 ? `${taxaGlobal}%` : "Novo";
    if (key === "reforco") return temasReforco > 0 ? `${temasReforco}` : "0 temas";
    if (key === "cadernos") return null;
    return null;
  };

  // Generate feedback once when component mounts
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const text = gerarFeedbackArabella(totalRespondidas, totalAcertos, taxaGlobal, temasReforco);
    feedbackTextRef.current = text;

    const alreadyTyped = sessionStorage.getItem(SESSION_TYPED_KEY);
    if (alreadyTyped) {
      setDisplayedText(text);
      setShouldAnimate(false);
    } else {
      setShouldAnimate(true);
      sessionStorage.setItem(SESSION_TYPED_KEY, "true");
    }
  }, [totalRespondidas, totalAcertos, taxaGlobal, temasReforco]);

  // Typing animation effect
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

  const currentSlide = rotatingSlides[rotatingIndex];

  const renderStats = () => (
    <div className={`grid grid-cols-4 gap-2 ${isDesktop ? 'gap-3' : ''}`}>
      <div className="relative rounded-2xl py-4 px-2 text-center overflow-hidden" style={{ background: "hsl(215 20% 18%)", border: "1px solid hsl(210 40% 40% / 0.25)" }}>
        <p className={`font-bold text-foreground tracking-tight ${isDesktop ? 'text-2xl' : 'text-xl'}`}>{totalRespondidas.toLocaleString("pt-BR")}</p>
        <p className="text-[9px] text-muted-foreground mt-1 font-medium">de {totalQuestoes.toLocaleString("pt-BR")}</p>
        <div className="mt-2 mx-auto w-4/5 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(210 15% 25%)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressoRespondidas}%`, background: "hsl(210 80% 60%)" }} />
        </div>
      </div>
      <div className="relative rounded-2xl py-4 px-2 text-center overflow-hidden" style={{ background: "hsl(152 20% 16%)", border: "1px solid hsl(152 50% 40% / 0.3)" }}>
        <p className={`font-bold tracking-tight ${isDesktop ? 'text-2xl' : 'text-xl'}`} style={{ color: "hsl(152 75% 50%)" }}>{taxaGlobal}%</p>
        <p className="text-[9px] text-muted-foreground mt-1 font-medium">Acertos</p>
        <div className="mt-2 mx-auto w-4/5 h-1 rounded-full overflow-hidden" style={{ background: "hsl(152 15% 22%)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${taxaGlobal}%`, background: "hsl(152 72% 42%)" }} />
        </div>
      </div>
      <div className="relative rounded-2xl py-4 px-2 text-center overflow-hidden" style={{ background: "hsl(0 20% 16%)", border: "1px solid hsl(0 50% 42% / 0.3)" }}>
        <p className={`font-bold tracking-tight ${isDesktop ? 'text-2xl' : 'text-xl'}`} style={{ color: "hsl(0 78% 58%)" }}>{taxaErros}%</p>
        <p className="text-[9px] text-muted-foreground mt-1 font-medium">Erros</p>
        <div className="mt-2 mx-auto w-4/5 h-1 rounded-full overflow-hidden" style={{ background: "hsl(0 15% 22%)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${taxaErros}%`, background: "hsl(0 78% 50%)" }} />
        </div>
      </div>
      <div className="relative rounded-2xl py-4 px-2 text-center overflow-hidden" style={{ background: "hsl(25 22% 16%)", border: "1px solid hsl(25 55% 42% / 0.3)" }}>
        <Flame className="w-4 h-4 mx-auto mb-0.5" style={{ color: "hsl(20 95% 55%)" }} />
        <p className={`font-bold text-foreground tracking-tight ${isDesktop ? 'text-2xl' : 'text-xl'}`}>{diasConsecutivos}</p>
        <p className="text-[9px] text-muted-foreground mt-1 font-medium">Dias seguidos</p>
      </div>
    </div>
  );

  const renderMenuCards = () => (
    <div className={`grid grid-cols-2 gap-3 ${isDesktop ? 'gap-4' : ''}`}>
      {MENU_ITEMS.map((item, i) => {
        const Icon = item.icon;
        const BgIcon = item.bgIcon;
        const badge = getBadge(item.key);
        const isEmpty = totalRespondidas === 0;
        const isEmptyBadge = isEmpty && item.emptyBadge;
        return (
          <button
            key={item.key}
            onClick={handlers[item.key]}
            className={`relative p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.03] active:scale-95 overflow-hidden animate-fade-in group shine-effect ${isDesktop ? 'h-[150px]' : 'h-[130px]'}`}
            style={{
              background: item.gradient,
              border: "1px solid hsl(0 0% 100% / 0.1)",
              animationDelay: `${i * 80}ms`,
              animationFillMode: "both",
            }}
          >
            <BgIcon className="absolute -bottom-2 -right-2 text-white pointer-events-none" style={{ width: 88, height: 88, opacity: 0.15 }} />
            {badge && !isEmptyBadge && item.key !== "progresso" && (
              <span className="absolute top-2.5 right-2.5 text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.18)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>{badge}</span>
            )}
            {item.key === "progresso" && totalRespondidas > 0 && (
              <div className="absolute top-2 right-2">
                <svg width="30" height="30" viewBox="0 0 30 30" className="transform -rotate-90">
                  <circle cx="15" cy="15" r="12" fill="none" stroke="hsla(0,0%,100%,0.15)" strokeWidth="3" />
                  <circle cx="15" cy="15" r="12" fill="none" stroke="white" strokeWidth="3" strokeDasharray={2 * Math.PI * 12} strokeDashoffset={2 * Math.PI * 12 - (taxaGlobal / 100) * 2 * Math.PI * 12} strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white">{taxaGlobal}%</span>
              </div>
            )}
            {isEmptyBadge && (
              <span className="absolute top-2.5 right-2.5 text-[9px] font-semibold text-white/70 px-2 py-0.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.1)" }}>{item.emptyBadge}</span>
            )}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2" style={{ background: item.iconBg, border: "1px solid hsl(0 0% 100% / 0.1)" }}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <p className={`font-bold text-white ${isDesktop ? 'text-base' : 'text-sm'}`}>{item.label}</p>
            <p className={`text-white/60 mt-0.5 ${isDesktop ? 'text-xs' : 'text-[10px]'}`}>{item.desc}</p>
          </button>
        );
      })}
    </div>
  );

  const renderArabella = () => {
    if (!displayedText) return null;
    return (
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2.5">
          <img src={draArabellaAvatar} alt="Dra. Arabella" className="w-9 h-9 rounded-full object-cover border-2" style={{ borderColor: "hsl(265 50% 45%)" }} />
          <span className="text-xs font-bold text-foreground">Dra. Arabella</span>
        </div>
        <div className="ml-5 relative">
          <div className="absolute -top-1 left-3 w-3 h-3 rotate-45" style={{ background: "hsl(265 20% 22%)" }} />
          <div className="relative rounded-2xl rounded-tl-md px-4 py-3" style={{ background: "hsl(265 20% 22%)", border: "1px solid hsl(265 30% 30% / 0.4)" }}>
            <span className="text-xs text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: displayedText }} />
            {isTyping && <span className="inline-block w-0.5 h-3 bg-violet-400 ml-0.5 animate-pulse" />}
          </div>
        </div>
        {!isTyping && (
          <button
            onClick={onDiagnostico}
            className="ml-5 w-[calc(100%-20px)] relative flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors hover:opacity-90 overflow-hidden shine-effect"
            style={{ background: "linear-gradient(135deg, hsl(265 55% 50%), hsl(280 50% 42%))" }}
          >
            Ver análise completa <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </motion.div>
    );
  };

  const renderDesktopSidebar = () => (
    <div className="space-y-5">
      {/* Quick stats summary */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "hsl(215 20% 15%)", border: "1px solid hsl(210 40% 40% / 0.2)" }}>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          Resumo Rápido
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Matéria preferida</span>
            <span className="text-xs font-semibold text-foreground">{materiaPreferida}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Temas estudados</span>
            <span className="text-xs font-semibold text-foreground">{temasEstudados}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Total questões</span>
            <span className="text-xs font-semibold text-foreground">{totalQuestoes.toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Dias consecutivos</span>
            <span className="text-xs font-semibold" style={{ color: "hsl(20 95% 55%)" }}>🔥 {diasConsecutivos}</span>
          </div>
        </div>
      </div>

      {/* Arabella */}
      {renderArabella()}
    </div>
  );

  // ── DESKTOP ──
  if (isDesktop) {
    return (
      <div className="px-6 pb-8">
        {renderStats()}
        <div className="mt-5 grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-5">
            {renderMenuCards()}
          </div>
          <div>
            {renderDesktopSidebar()}
          </div>
        </div>
      </div>
    );
  }

  // ── MOBILE ──
  return (
    <div className="px-4 space-y-5 pb-8">
      {renderStats()}
      {renderMenuCards()}
      {renderArabella()}
    </div>
  );
};
