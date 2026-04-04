import { useState } from "react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { GraduationCap, Brain, Target, FileText, Headphones, BookOpen, ChevronRight } from "lucide-react";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

import coverAulas from "@/assets/covers/cover-aulas.jpg";
import coverResumos from "@/assets/covers/cover-resumos.jpg";
import coverFlashcards from "@/assets/covers/cover-flashcards.jpg";
import coverQuestoes from "@/assets/covers/cover-questoes.jpg";
import coverBiblioteca from "@/assets/covers/cover-biblioteca.jpg";
import coverAudioaulas from "@/assets/covers/cover-audioaulas.jpg";

const PRATIQUE_ITEMS = [
  {
    id: "cursos",
    label: "Aulas",
    subtitle: "Estudos",
    icon: GraduationCap,
    route: "/aulas",
    cover: coverAulas,
    accent: "#f9a8d4",
    delay: 0.1,
  },
  {
    id: "resumos",
    label: "Resumos",
    subtitle: "Jurídicos",
    icon: FileText,
    route: "/resumos-juridicos",
    cover: coverResumos,
    accent: "#5eead4",
    delay: 0.15,
  },
  {
    id: "flashcards",
    label: "Flashcards",
    subtitle: "Cards",
    icon: Brain,
    route: "/flashcards",
    cover: coverFlashcards,
    accent: "#93c5fd",
    delay: 0.2,
  },
  {
    id: "questoes",
    label: "Questões",
    subtitle: "Prática",
    icon: Target,
    route: "/questoes",
    cover: coverQuestoes,
    accent: "#fdba74",
    delay: 0.25,
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    subtitle: "Livros",
    icon: BookOpen,
    route: "/bibliotecas",
    cover: coverBiblioteca,
    accent: "#fcd34d",
    delay: 0.3,
  },
  {
    id: "audioaulas",
    label: "Audioaulas",
    subtitle: "Áudio",
    icon: Headphones,
    route: "/audioaulas",
    cover: coverAudioaulas,
    accent: "#c084fc",
    delay: 0.35,
  },
];

export function HomePratiqueSlide() {
  const navigate = useTransitionNavigate();
  const { user } = useAuth();
  const { trialExpired, loading: trialLoading } = useTrialStatus();
  const { isPremium } = useSubscription();
  const isBlocked = !!user && !trialLoading && trialExpired && !isPremium;
  const [showPremiumCard, setShowPremiumCard] = useState(false);

  const handleItemClick = (route: string) => {
    if (isBlocked) {
      setShowPremiumCard(true);
      return;
    }
    navigate(route);
  };
  return (
    <div className="bg-gradient-to-b from-red-950 via-red-900/95 to-red-950 backdrop-blur-sm overflow-hidden flex flex-col">

      <div className="px-3 pb-3 pt-3 flex-1 flex flex-col">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRATIQUE_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.route)}
                className="group relative rounded-xl overflow-hidden border border-white/[0.06] animate-fade-in active:scale-95 transition-transform min-h-[110px]"
                style={{
                  animationDelay: `${item.delay}s`,
                  animationFillMode: 'backwards',
                  boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {/* Cover image background */}
                <img
                  src={item.cover}
                  alt=""
                  loading="lazy"
                  width={256}
                  height={256}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />


                {/* Shine effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                  <div
                    className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                    style={{ animation: `shinePratique 4s ease-in-out infinite ${item.delay + 1}s` }}
                  />
                </div>

                {/* Content */}
                <div className="relative z-[1] p-3 sm:p-4 flex flex-col items-start justify-end h-full min-h-[110px]">
                  <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-xl mb-2">
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="text-left w-full flex items-end justify-between">
                    <div>
                      <span className="text-[15px] sm:text-base font-bold text-white block leading-tight drop-shadow-md">{item.label}</span>
                      <span className="text-[11px] sm:text-xs text-white/70 block drop-shadow-sm">{item.subtitle}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
                  </div>
                </div>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[3px] z-[2]"
                  style={{ background: `linear-gradient(90deg, transparent, ${item.accent}80, transparent)` }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
      />
    </div>
  );
}
