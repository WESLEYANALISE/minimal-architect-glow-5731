import { useState, useEffect } from "react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Crown, Clock, ArrowRight } from "lucide-react";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { AnimatePresence, motion } from "framer-motion";

type FraseItem = { text: string; highlight?: string; suffix?: string };

const FRASES: FraseItem[] = [
  { text: "⚖️ Tudo para dominar o Direito em um só lugar." },
  { text: "📚 Alunos conosco têm ", highlight: "87% mais aprovação na OAB." },
  { text: "🎯 +10.000 alunos já transformaram seus estudos." },
  { text: "🚀 Nossos simulados: ", highlight: "73% mais acertos em concursos." },
  { text: "🏛️ OAB, concursos e faculdade com excelência." },
  { text: "💡 ", highlight: "94% assinam ", suffix: "após o primeiro contato." },
  { text: "📖 Flashcards e resumos: ", highlight: "2x mais retenção." },
  { text: "🔥 ", highlight: "68% dos aprovados ", suffix: "usam Vade Mecum digital." },
  { text: "🎓 Conteúdo atualizado: ", highlight: "+500 leis ", suffix: "comentadas." },
  { text: "💪 Simulados semanais: ", highlight: "3x mais chances de aprovação." },
];

export const PersuasiveTextCarousel = () => {
  const { isPremium, loading } = useSubscription();
  const navigate = useTransitionNavigate();

  // Always call hooks
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (!isPremium && !loading) return; // Only run carousel for premium users
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % FRASES.length);
        setFade(true);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPremium, loading]);

  const ctaMessage = "Desbloqueie todas as funções e melhore seus estudos!";

  // Non-premium: hide this component (TrialBanner at top already handles CTA)
  if (loading) {
    return <div className="min-h-[44px]" />;
  }
  if (!isPremium) {
    return null;
  }

  // Premium users: show regular carousel
  const item = FRASES[current];

  return (
    <div className="px-3 sm:px-4 py-2 sm:py-2.5 min-h-[44px]">
      <p
        className="text-[10px] sm:text-xs leading-relaxed text-center line-clamp-1 transition-opacity duration-300 text-foreground/80 shine-effect overflow-hidden relative whitespace-nowrap"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {item.text}
        {item.highlight && <span className="font-bold text-yellow-400">{item.highlight}</span>}
        {item.suffix && item.suffix}
      </p>
      {/* Dots */}
      <div className="flex justify-center gap-1 mt-1.5">
        {FRASES.map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${
              i === current ? "bg-foreground/50 w-2.5" : "bg-foreground/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
