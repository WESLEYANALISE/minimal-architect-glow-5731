import { useState } from "react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { GraduationCap, Brain, Target, FileText, Headphones, BookOpen, ChevronRight, Crown } from "lucide-react";
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
    delay: 0.1,
  },
  {
    id: "resumos",
    label: "Resumos",
    subtitle: "Jurídicos",
    icon: FileText,
    route: "/resumos-juridicos",
    cover: coverResumos,
    delay: 0.15,
  },
  {
    id: "flashcards",
    label: "Flashcards",
    subtitle: "Cards",
    icon: Brain,
    route: "/flashcards",
    cover: coverFlashcards,
    delay: 0.2,
  },
  {
    id: "questoes",
    label: "Questões",
    subtitle: "Prática",
    icon: Target,
    route: "/questoes",
    cover: coverQuestoes,
    delay: 0.25,
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    subtitle: "Livros",
    icon: BookOpen,
    route: "/bibliotecas",
    cover: coverBiblioteca,
    delay: 0.3,
  },
  {
    id: "audioaulas",
    label: "Audioaulas",
    subtitle: "Áudio",
    icon: Headphones,
    route: "/audioaulas",
    cover: coverAudioaulas,
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
        {/* 6 Cards in 2-col grid, 3-col on desktop */}
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
                }}
              >
                {/* Cover image */}
                <img
                  src={item.cover}
                  alt={item.label}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                {/* Shine effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                  <div
                    className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                    style={{ animation: `shinePratique 4s ease-in-out infinite ${item.delay + 1}s` }}
                  />
                </div>

                {/* Content */}
                <div className="relative z-[1] p-3 sm:p-4 flex flex-col items-start justify-end h-full min-h-[110px]">
                  {/* Icon */}
                  <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-xl mb-2">
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Label */}
                  <div className="text-left w-full flex items-end justify-between">
                    <div>
                      <span className="text-[15px] sm:text-base font-bold text-white block leading-tight drop-shadow-md">{item.label}</span>
                      <span className="text-[11px] sm:text-xs text-white/70 block drop-shadow-sm">{item.subtitle}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
                  </div>
                </div>
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
