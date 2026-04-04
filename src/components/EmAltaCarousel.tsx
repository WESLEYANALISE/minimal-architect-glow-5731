import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { preloadImages } from "@/hooks/useInstantCache";
import { GraduationCap, Library, MessageCircle, Brain, ChevronRight, Scale, FileCheck2, Target, Video, Clapperboard, Briefcase, BookOpen, Headphones, Footprints, Bot, Crown } from "lucide-react";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import atalhoProfessora from "@/assets/atalho-professora.webp";
import atalhoAulas from "@/assets/atalho-aulas.webp";
import atalhoBiblioteca from "@/assets/atalho-biblioteca-juridica.webp";
import atalhoEvelyn from "@/assets/atalho-evelyn.webp";
import atalhoFlashcards from "@/assets/atalho-flashcards.webp";
import atalhoResumos from "@/assets/atalho-resumos.webp";
import atalhoQuestoes from "@/assets/atalho-questoes.webp";
import atalhoVideoaulas from "@/assets/atalho-videoaulas.webp";
import atalhoJuriflix from "@/assets/juriflix-hero-cover.webp";
import atalhoCarreiras from "@/assets/atalho-carreiras.webp";
import atalhoVademecum from "@/assets/atalhos/vade-mecum-cover.jpg";
import atalhoAudioaulas from "@/assets/atalho-audioaulas.webp";
import atalhoPrimeirosPassos from "@/assets/atalho-iniciando.webp";

export interface AtalhoItem {
  key: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  path: string;
  iconColor: string;
  gradient: string;
  decorColor: string;
  coverImage: string;
}

// Keys that remain FREE even after trial expires
const FREE_KEYS = new Set(["juriflix", "videoaulas", "carreiras", "professora"]);

export const ALL_ATALHOS: AtalhoItem[] = [
  { key: "professora", label: "Professora", subtitle: "Tire suas dúvidas", icon: Bot, path: "/chat-professora", iconColor: "text-red-400", gradient: "from-red-900 via-red-800 to-amber-700", decorColor: "bg-amber-500/20", coverImage: atalhoProfessora },
  { key: "aulas", label: "Aulas", subtitle: "Estudos", icon: GraduationCap, path: "/aulas", iconColor: "text-amber-500", gradient: "from-amber-700 via-amber-600 to-orange-500", decorColor: "bg-orange-400/20", coverImage: atalhoAulas },
  { key: "biblioteca", label: "Biblioteca", subtitle: "Acervo completo", icon: Library, path: "/bibliotecas", iconColor: "text-blue-400", gradient: "from-blue-900 via-blue-800 to-indigo-600", decorColor: "bg-indigo-400/20", coverImage: atalhoBiblioteca },
  { key: "evelyn", label: "Evelyn IA", subtitle: "Assistente jurídica", icon: Bot, path: "/evelyn", iconColor: "text-violet-400", gradient: "from-violet-800 via-violet-700 to-purple-600", decorColor: "bg-purple-400/20", coverImage: atalhoEvelyn },
  { key: "flashcards", label: "Flashcards", subtitle: "Revisão rápida", icon: Brain, path: "/flashcards/areas", iconColor: "text-emerald-400", gradient: "from-emerald-800 via-emerald-700 to-green-500", decorColor: "bg-green-400/20", coverImage: atalhoFlashcards },
  { key: "resumos", label: "Resumos", subtitle: "Resumos jurídicos", icon: FileCheck2, path: "/resumos", iconColor: "text-rose-400", gradient: "from-rose-800 via-rose-700 to-rose-500", decorColor: "bg-rose-400/20", coverImage: atalhoResumos },
  { key: "questoes", label: "Questões", subtitle: "Pratique questões", icon: Target, path: "/questoes", iconColor: "text-cyan-400", gradient: "from-cyan-800 via-cyan-700 to-blue-500", decorColor: "bg-blue-400/20", coverImage: atalhoQuestoes },
  { key: "videoaulas", label: "Videoaulas", subtitle: "Aulas em vídeo", icon: Video, path: "/videoaulas/playlists", iconColor: "text-sky-400", gradient: "from-blue-700 via-blue-600 to-sky-500", decorColor: "bg-sky-400/20", coverImage: atalhoVideoaulas },
  { key: "juriflix", label: "Juriflix", subtitle: "Temática jurídica", icon: Clapperboard, path: "/juriflix", iconColor: "text-pink-400", gradient: "from-purple-800 via-purple-700 to-pink-500", decorColor: "bg-pink-400/20", coverImage: atalhoJuriflix },
  { key: "carreiras", label: "Carreiras", subtitle: "Guia de carreiras", icon: Briefcase, path: "/carreiras", iconColor: "text-amber-400", gradient: "from-amber-800 via-amber-700 to-orange-500", decorColor: "bg-orange-400/20", coverImage: atalhoCarreiras },
  { key: "vademecum", label: "Vade Mecum", subtitle: "Legislação completa", icon: BookOpen, path: "/vade-mecum", iconColor: "text-teal-400", gradient: "from-teal-800 via-teal-700 to-emerald-500", decorColor: "bg-emerald-400/20", coverImage: atalhoVademecum },
  { key: "audioaulas", label: "Áudio Aulas", subtitle: "Aprenda ouvindo", icon: Headphones, path: "/audioaulas", iconColor: "text-violet-400", gradient: "from-purple-900 via-violet-800 to-fuchsia-700", decorColor: "bg-fuchsia-400/20", coverImage: atalhoAudioaulas },
  { key: "primeiros-passos", label: "Iniciando", subtitle: "Primeiros Passos", icon: Footprints, path: "/aulas-em-tela", iconColor: "text-amber-400", gradient: "from-amber-900 via-orange-800 to-yellow-600", decorColor: "bg-yellow-400/20", coverImage: atalhoPrimeirosPassos },
];

const DEFAULT_KEYS = ["primeiros-passos", "biblioteca", "professora", "audioaulas", "aulas", "flashcards"];

// Preload agressivo de todas as imagens de atalhos — imediato
const ATALHO_IMAGES = ALL_ATALHOS.map(a => a.coverImage).filter(Boolean);
ATALHO_IMAGES.forEach((src) => {
  const img = new Image();
  img.src = src;
});

export function getActiveKeys(): string[] {
  try {
    const saved = localStorage.getItem("atalhos-personalizados");
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
    }
  } catch {}
  return DEFAULT_KEYS;
}

interface EmAltaCarouselProps {
  navigate: (path: string) => void;
}

export const EmAltaCarousel = ({ navigate }: EmAltaCarouselProps) => {
  const [isTouching, setIsTouching] = useState(false);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { user } = useAuth();
  const { trialExpired, loading: trialLoading } = useTrialStatus();
  const { isPremium } = useSubscription();
  const isBlocked = !!user && !trialLoading && trialExpired && !isPremium;

  const activeKeys = useMemo(() => {
    if (trialLoading) return getActiveKeys();
    return isBlocked ? DEFAULT_KEYS : getActiveKeys();
  }, [isBlocked, trialLoading]);
  const items = useMemo(() => activeKeys.map((key) => ALL_ATALHOS.find((a) => a.key === key)).filter(Boolean) as AtalhoItem[], [activeKeys]);

  const coverUrls = useMemo(() => items.map(item => item.coverImage).filter(Boolean), [items]);
  useEffect(() => { preloadImages(coverUrls); }, [coverUrls]);

  const [showPremiumCard, setShowPremiumCard] = useState(false);

  const handleClick = (item: AtalhoItem) => {
    if (isBlocked && !FREE_KEYS.has(item.key)) {
      setShowPremiumCard(true);
      return;
    }
    navigate(item.path);
  };

  const handleTouchStart = useCallback(() => {
    setIsTouching(true);
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => setIsTouching(false), 3000);
  }, []);

  // Duplicate items for seamless infinite loop
  const loopItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div>
      <div
        className="w-full overflow-x-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <div
          className={`flex gap-3 pl-4 ${isTouching ? '' : 'animate-[scrollLeft_50s_linear_infinite]'}`}
          style={{ width: "max-content", willChange: isTouching ? 'auto' : 'transform' }}
        >
          {loopItems.map((item, index) => (
            <button
              key={`${item.key}-${index}`}
              onClick={() => handleClick(item)}
              className="flex-shrink-0 w-[130px] sm:w-[155px] md:w-[170px] overflow-hidden rounded-2xl text-left border border-red-900/30 shadow-[0_8px_30px_rgba(0,0,0,0.5),0_2px_8px_rgba(0,0,0,0.4)] group outline-none focus:outline-none focus-visible:outline-none relative"
              style={{ transform: 'translateZ(0)' }}
            >
              {/* Crown for blocked premium items */}
              {isBlocked && !FREE_KEYS.has(item.key) && (
                <div className="absolute top-2 right-2 z-20 bg-amber-500/90 rounded-full p-1 shadow-lg shadow-amber-900/40">
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="relative h-[110px] sm:h-[130px] overflow-hidden cover-reflection">
                {item.coverImage.endsWith('.webm') || item.coverImage.endsWith('.mp4') ? (
                  <video src={item.coverImage} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline />
                ) : (
                  <img
                    src={item.coverImage}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    fetchPriority={index < 6 ? "high" : "auto"}
                  />
                )}
              </div>
              <div className="p-2 sm:p-3 flex items-center justify-between bg-gradient-to-r from-red-950/95 to-red-900/90">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <item.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${item.iconColor}`} />
                    <h3 className="text-xs sm:text-sm font-bold text-foreground whitespace-nowrap truncate">{item.label}</h3>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-red-200/60 mt-0.5 truncate">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
      />
    </div>
  );
};
