import { useState, useEffect, useCallback } from "react";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
import { useNavigate } from "react-router-dom";
import {
  Brain, ChevronRight, ArrowLeft, Footprints,
  BarChart3, Crown, BookOpen, PenLine, Link2, Scale, Gavel,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";

import { motion } from "framer-motion";
import { useFlashcardsAreasCache } from "@/hooks/useFlashcardsAreasCache";
import { useSubscription } from "@/contexts/SubscriptionContext";
import FlashcardsEstatisticas from "@/components/flashcards/FlashcardsEstatisticas";
import { FlashcardsMenuPrincipal } from "@/components/flashcards/FlashcardsMenuPrincipal";
import { FlashcardsProgressoPage } from "@/components/flashcards/FlashcardsProgressoPage";
import { FlashcardsReforcoTab } from "@/components/flashcards/FlashcardsReforcoTab";
import { FlashcardsDiagnosticoPage } from "@/components/flashcards/FlashcardsDiagnosticoPage";
import { FlashcardsCadernos } from "@/components/flashcards/FlashcardsCadernos";
import heroFlashcards from "@/assets/hero-flashcards.webp";
import themisEstudos from "@/assets/themis-estudos-background.webp";
import heroResumos from "@/assets/hero-resumos.webp";
import heroVideoaulas from "@/assets/hero-videoaulas.webp";
import bgFlashcardsCategorias from "@/assets/bg-flashcards-categorias-mobile.webp";

import { getAreaGradient, getAreaHex } from "@/lib/flashcardsAreaColors";
import { DotPattern } from "@/components/ui/dot-pattern";
import { NumberTicker } from "@/components/ui/number-ticker";

const FREE_AREAS = ["Direito Constitucional", "Direito Administrativo"];

const AREAS_ORDEM: string[] = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Processual do Trabalho",
  "Direito Tributário", "Direito Empresarial",
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
  "Filosofia do Direito", "Sociologia do Direito",
  "Direito Desportivo", "Direito Financeiro",
  "Direito Internacional Privado", "Direito Internacional Público",
  "Direito Urbanístico", "Direito Urbanistico",
  "Teoria e Filosofia do Direito", "Formação Complementar",
  "Pratica Profissional", "Politicas Publicas",
  "Lei Penal Especial", "Direito Concorrencial",
];


const MAIS_COBRADAS = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Tributário",
];

const ALTA_INCIDENCIA = [
  "Direito Empresarial", "Direito Processual do Trabalho",
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
  "Filosofia do Direito", "Sociologia do Direito",
  "Teoria e Filosofia do Direito",
];

const AREAS_OCULTAS = [
  "Revisão Oab", "Revisão OAB", "Revisao Oab",
  "Português", "Portugues",
  "Pesquisa Científica", "Pesquisa Cientifica",
  "Legislação Penal", "Legislacao Penal",
];

// Normalizar para comparação case-insensitive
const isAreaOculta = (area: string) => {
  const norm = area.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return AREAS_OCULTAS.some(o => o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm);
};

const isInList = (area: string, list: string[]) => {
  const norm = area.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return list.some(o => o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm);
};

interface FlashcardArea {
  area: string;
  totalFlashcards: number;
  totalTemas: number;
  urlCapa?: string;
}

const sortAreas = (areas: FlashcardArea[]) => {
  return [...areas].sort((a, b) => {
    const idxA = AREAS_ORDEM.indexOf(a.area);
    const idxB = AREAS_ORDEM.indexOf(b.area);
    const posA = idxA >= 0 ? idxA : 999;
    const posB = idxB >= 0 ? idxB : 999;
    return posA - posB;
  });
};

const HERO_SLIDES = [
  { title: "Flashcards de Direito", subtitle: "Estude com milhares de flashcards organizados por área e tema", image: heroFlashcards },
  { title: "Memorize com Eficiência", subtitle: "Técnica de repetição espaçada para fixar o conteúdo", image: themisEstudos },
  { title: "Ranking de Flashcards", subtitle: "Compete com outros estudantes e veja quem mais domina", image: heroResumos },
  { title: "Todas as Áreas do Direito", subtitle: "Penal, Civil, Constitucional, Trabalhista e muito mais", image: heroVideoaulas },
];

const TABS = [
  { id: "principais", label: "Principais", icon: Scale },
  { id: "frequentes", label: "Frequentes", icon: BookOpen },
  { id: "extras", label: "Extras", icon: Gavel },
] as const;

type TabId = typeof TABS[number]["id"];

// Prefetch tema stats on hover/touch
const prefetchTemaStats = (area: string) => {
  const cacheKey = `flashcards-temas-${area}`;
  const db = indexedDB.open('vade-mecum-db');
  db.onsuccess = () => {
    const database = db.result;
    try {
      const tx = database.transaction('articles', 'readonly');
      const store = tx.objectStore('articles');
      const req = store.get(cacheKey);
      req.onsuccess = () => {
        if (req.result && (Date.now() - req.result.timestamp) < 1000 * 60 * 60 * 24 * 7) {
          return;
        }
        supabase.rpc('get_flashcard_temas_stats', { p_area: area }).then(({ data }) => {
          if (data) {
            try {
              const writeTx = database.transaction('articles', 'readwrite');
              const writeStore = writeTx.objectStore('articles');
              writeStore.put({ tableName: cacheKey, data, timestamp: Date.now() }, cacheKey);
            } catch (e) { /* ignore */ }
          }
        });
      };
    } catch (e) { /* ignore */ }
  };
};

// ── Realeza palette constants ──
const R = {
  bg: "hsl(0, 0%, 7%)",
  bgCard: "hsl(0, 0%, 10%)",
  gold: "hsl(40, 80%, 55%)",
  goldMuted: "hsl(40, 70%, 60%)",
  border: "hsla(40, 60%, 50%, 0.12)",
  borderHover: "hsla(40, 60%, 50%, 0.25)",
  headerGradient: "linear-gradient(135deg, hsl(0, 0%, 11%), hsl(0, 0%, 8%))",
  iconBg: "hsla(40, 60%, 50%, 0.12)",
  iconBorder: "hsla(40, 60%, 50%, 0.15)",
};

const FlashcardsAreas = () => {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [activeTab, setActiveTab] = useState<TabId>("principais");
  const [showEstatisticas, setShowEstatisticas] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const { areas, totalFlashcards, totalAreas, isLoading } = useFlashcardsAreasCache();
  type SubView = "menu" | "categories" | "praticar" | "progresso" | "reforco" | "cadernos" | "diagnostico";
  const [subView, setSubView] = useState<SubView>("menu");

  // Fetch termos jurídicos count
  const { data: termosCount = 0 } = useQuery({
    queryKey: ["termos-juridicos-total-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("DICIONARIO" as any)
        .select("*", { count: "exact", head: true })
        .not("Letra", "is", null);
      return count || 0;
    },
    staleTime: 1000 * 60 * 60,
  });

  // Fetch lacunas count
  const { data: lacunasCount = 0 } = useQuery({
    queryKey: ["flashcards-lacunas-total-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("FLASHCARDS_LACUNAS" as any)
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
    staleTime: 1000 * 60 * 60,
  });

  // Fetch correspondência count
  const { data: correspondenciaCount = 0 } = useQuery({
    queryKey: ["correspondencia-total-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("gamificacao_sim_nao_cache")
        .select("*", { count: "exact", head: true })
        .like("materia", "questoes-corresp:%");
      return count || 0;
    },
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const sorted = areas ? sortAreas(areas).filter(a => !isAreaOculta(a.area)) : [];

  const renderCard = (item: FlashcardArea, idx: number) => {
    const handleClick = () => {
      navigate(`/flashcards/temas?area=${encodeURIComponent(item.area)}`);
    };
    return (
      <button
        key={item.area}
        onClick={handleClick}
        onMouseEnter={() => prefetchTemaStats(item.area)}
        onTouchStart={() => prefetchTemaStats(item.area)}
        className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] shadow-lg h-[100px] animate-fade-in"
        style={{
          animationDelay: `${idx * 30}ms`,
          animationFillMode: 'backwards',
          background: "hsla(0, 0%, 100%, 0.04)",
          border: `1px solid ${R.border}`,
          boxShadow: `0 4px 20px -4px rgba(0,0,0,0.4), inset 0 1px 0 hsla(40, 60%, 80%, 0.06)`,
        }}
      >
        {/* Shimmer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, hsla(40, 80%, 70%, 0.06) 45%, hsla(40, 80%, 70%, 0.12) 50%, hsla(40, 80%, 70%, 0.06) 55%, transparent 60%)",
          }}
        />
        <div className="absolute -right-3 -bottom-3 opacity-[0.07]">
          <Brain className="w-20 h-20" style={{ color: R.gold }} />
        </div>

        <div
          className="relative z-10 rounded-xl p-2 w-fit mb-2 transition-colors"
          style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}
        >
          <Brain className="w-5 h-5" style={{ color: R.gold }} />
        </div>
        <h3 className="relative z-10 font-semibold text-white text-sm leading-tight pr-6">
          {item.area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '')}
        </h3>
        <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 transition-all group-hover:translate-x-0.5" style={{ color: "hsla(40, 70%, 60%, 0.5)" }} />
      </button>
    );
  };

  const renderCategoriaSection = (titulo: string, subtitulo: string, items: FlashcardArea[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <h2 className="text-sm font-bold" style={{ color: R.goldMuted }}>{titulo}</h2>
        <p className="text-xs text-white/40 mb-3">{subtitulo}</p>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, idx) => renderCard(item, idx))}
        </div>
      </div>
    );
  };

  // ── Realeza Header ──
  const RealezaHeader = ({ onBack, backLabel = "Voltar" }: { onBack: () => void; backLabel?: string }) => (
    <div className="relative overflow-hidden rounded-b-3xl mb-2" style={{ background: R.headerGradient, borderBottom: `1px solid ${R.border}` }}>
      <DotPattern className="opacity-[0.04]" />
      <div className="absolute -right-6 -bottom-6 opacity-[0.05]">
        <Brain className="w-32 h-32" style={{ color: R.gold }} />
      </div>
      <div className="relative z-10 px-4 pt-4 pb-5">
        <button onClick={onBack} className="flex items-center gap-1 text-xs mb-3 hover:opacity-80 transition-opacity" style={{ color: R.goldMuted }}>
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}>
            <Brain className="w-5 h-5" style={{ color: R.gold }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>Flashcards</h1>
            <p className="text-xs" style={{ color: "hsla(40, 60%, 70%, 0.6)" }}>
              <span className="font-semibold" style={{ color: R.goldMuted }}><NumberTicker value={totalFlashcards} /></span> disponíveis
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Sub-views ──
  if (subView === "menu") {
    return (
      <div className="min-h-screen pb-20" style={{ background: R.bg }}>
        <RealezaHeader onBack={() => navigate("/")} />
        <FlashcardsMenuPrincipal
          totalFlashcards={totalFlashcards}
          onPraticar={() => setSubView("categories")}
          onProgresso={() => setSubView("progresso")}
          onReforco={() => setSubView("reforco")}
          onCadernos={() => setSubView("cadernos")}
          onDiagnostico={() => setSubView("diagnostico")}
        />
      </div>
    );
  }

  if (subView === "progresso") {
    return (
      <div className="min-h-screen pb-20" style={{ background: R.bg }}>
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity mb-2" style={{ color: R.goldMuted }}>
            <ArrowLeft className="w-4 h-4" /><span>Menu</span>
          </button>
        </div>
        <FlashcardsProgressoPage onBack={() => setSubView("menu")} />
      </div>
    );
  }

  if (subView === "reforco") {
    return (
      <div className="min-h-screen pb-20" style={{ background: R.bg }}>
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity mb-2" style={{ color: R.goldMuted }}>
            <ArrowLeft className="w-4 h-4" /><span>Menu</span>
          </button>
        </div>
        <FlashcardsReforcoTab onPraticar={() => setSubView("categories")} />
      </div>
    );
  }

  if (subView === "cadernos") {
    return (
      <div className="min-h-screen pb-20" style={{ background: R.bg }}>
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity mb-2" style={{ color: R.goldMuted }}>
            <ArrowLeft className="w-4 h-4" /><span>Menu</span>
          </button>
        </div>
        <FlashcardsCadernos onBack={() => setSubView("menu")} />
      </div>
    );
  }

  if (subView === "diagnostico") {
    return (
      <div className="min-h-screen pb-20" style={{ background: R.bg }}>
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity mb-2" style={{ color: R.goldMuted }}>
            <ArrowLeft className="w-4 h-4" /><span>Menu</span>
          </button>
        </div>
        <FlashcardsDiagnosticoPage onBack={() => setSubView("menu")} />
      </div>
    );
  }

  if (subView === "categories") {
    return (
      <div className="min-h-screen pb-20" style={{ background: R.bg }}>
        <RealezaHeader onBack={() => setSubView("menu")} backLabel="Menu" />

        {/* Serpentine timeline with golden accents */}
        <div className="relative px-4 pb-4">
          <div className="absolute inset-0 -top-16 -bottom-4 overflow-hidden pointer-events-none">
            <img src={bgFlashcardsCategorias} alt="" className="w-full h-full object-cover opacity-10" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[hsl(0,0%,7%)] via-[hsl(0,0%,7%)]/80 to-transparent" />
          </div>

          <div className="relative py-6 px-2">
            {/* Central golden line */}
            <div className="absolute left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2">
              <div className="w-full h-full" style={{ background: "linear-gradient(to bottom, hsla(40, 60%, 50%, 0.3), hsla(40, 60%, 50%, 0.15), hsla(40, 60%, 50%, 0.3))" }} />
              <motion.div
                className="absolute top-0 left-0 w-full h-12 rounded-full"
                style={{ background: "linear-gradient(to bottom, transparent, hsla(40, 80%, 55%, 0.6), transparent)" }}
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            {/* Item 1 - Left (Conceitos) */}
            <div className="relative flex items-center mb-10">
              <motion.button
                onClick={() => setSubView("praticar")}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                className="w-[calc(50%-24px)] h-[130px] p-4 rounded-2xl text-left transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden"
                style={{
                  background: "hsla(0, 0%, 100%, 0.04)",
                  border: `1px solid ${R.border}`,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 hsla(40, 60%, 80%, 0.06)`,
                }}
              >
                <div className="absolute -right-3 -bottom-3 opacity-[0.07]">
                  <Brain className="w-[88px] h-[88px]" style={{ color: R.gold }} />
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}>
                  <Brain className="w-5 h-5" style={{ color: R.gold }} />
                </div>
                <p className="text-sm font-bold text-white">Conceitos</p>
                <p className="text-[10px] mt-0.5" style={{ color: "hsla(40, 60%, 70%, 0.6)" }}>{totalAreas} áreas</p>
                <p className="text-[10px] font-semibold mt-1" style={{ color: R.goldMuted }}>{totalFlashcards.toLocaleString('pt-BR')} cards</p>
              </motion.button>
              
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${R.gold}, hsl(35, 70%, 40%))`, boxShadow: `0 0 16px hsla(40, 80%, 55%, 0.5)` }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Item 2 - Right (Lacunas) */}
            <div className="relative flex items-center justify-end mb-10">
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${R.gold}, hsl(35, 70%, 40%))`, boxShadow: `0 0 16px hsla(40, 80%, 55%, 0.5)` }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              
              <motion.button
                onClick={() => navigate("/flashcards/lacunas")}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="w-[calc(50%-24px)] h-[130px] p-4 rounded-2xl text-left transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden"
                style={{
                  background: "hsla(0, 0%, 100%, 0.04)",
                  border: `1px solid ${R.border}`,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 hsla(40, 60%, 80%, 0.06)`,
                }}
              >
                <div className="absolute -right-3 -bottom-3 opacity-[0.07]">
                  <PenLine className="w-[88px] h-[88px]" style={{ color: R.gold }} />
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}>
                  <PenLine className="w-5 h-5" style={{ color: R.gold }} />
                </div>
                <p className="text-sm font-bold text-white">Lacunas</p>
                <p className="text-[10px] mt-0.5" style={{ color: "hsla(40, 60%, 70%, 0.6)" }}>Complete a frase</p>
                <p className="text-[10px] font-semibold mt-1" style={{ color: R.goldMuted }}>{lacunasCount.toLocaleString('pt-BR')} cards</p>
              </motion.button>
            </div>

            {/* Item 3 - Left (Correspondência) */}
            <div className="relative flex items-center mb-10">
              <motion.button
                onClick={() => navigate("/ferramentas/questoes/correspondencia")}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
                className="w-[calc(50%-24px)] h-[130px] p-4 rounded-2xl text-left transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden"
                style={{
                  background: "hsla(0, 0%, 100%, 0.04)",
                  border: `1px solid ${R.border}`,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 hsla(40, 60%, 80%, 0.06)`,
                }}
              >
                <div className="absolute -right-3 -bottom-3 opacity-[0.07]">
                  <Link2 className="w-[88px] h-[88px]" style={{ color: R.gold }} />
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}>
                  <Link2 className="w-5 h-5" style={{ color: R.gold }} />
                </div>
                <p className="text-sm font-bold text-white">Correspondência</p>
                <p className="text-[10px] mt-0.5" style={{ color: "hsla(40, 60%, 70%, 0.6)" }}>Associe conceitos</p>
                <p className="text-[10px] font-semibold mt-1" style={{ color: R.goldMuted }}>{correspondenciaCount > 0 ? `${correspondenciaCount} sets` : 'Novo!'}</p>
              </motion.button>
              
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.65, type: "spring" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${R.gold}, hsl(35, 70%, 40%))`, boxShadow: `0 0 16px hsla(40, 80%, 55%, 0.5)` }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Item 4 - Right (Termos Jurídicos) */}
            <div className="relative flex items-center justify-end">
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.85, type: "spring" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${R.gold}, hsl(35, 70%, 40%))`, boxShadow: `0 0 16px hsla(40, 80%, 55%, 0.5)` }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              
              <motion.button
                onClick={() => navigate("/flashcards/termos-juridicos")}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5, ease: "easeOut" }}
                className="w-[calc(50%-24px)] h-[130px] p-4 rounded-2xl text-left transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden"
                style={{
                  background: "hsla(0, 0%, 100%, 0.04)",
                  border: `1px solid ${R.border}`,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 hsla(40, 60%, 80%, 0.06)`,
                }}
              >
                <div className="absolute -right-3 -bottom-3 opacity-[0.07]">
                  <BookOpen className="w-[88px] h-[88px]" style={{ color: R.gold }} />
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}>
                  <BookOpen className="w-5 h-5" style={{ color: R.gold }} />
                </div>
                <p className="text-sm font-bold text-white">Termos Jurídicos</p>
                <p className="text-[10px] mt-0.5" style={{ color: "hsla(40, 60%, 70%, 0.6)" }}>Dicionário A-Z</p>
                <p className="text-[10px] font-semibold mt-1" style={{ color: R.goldMuted }}>{termosCount.toLocaleString('pt-BR')} termos</p>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── "praticar" sub-view — Area list with tabs ──
  return (
    <div className="min-h-screen pb-20" style={{ background: R.bg }}>
      {/* Realeza Header */}
      <div className="relative overflow-hidden rounded-b-3xl mb-3" style={{ background: R.headerGradient, borderBottom: `1px solid ${R.border}` }}>
        <DotPattern className="opacity-[0.04]" />
        <Brain
          className="absolute -right-3 -bottom-3 pointer-events-none"
          style={{ width: 100, height: 100, opacity: 0.04, color: R.gold }}
        />
        <div className="relative z-10 px-4 pt-3 pb-5">
          <button
            onClick={() => setSubView("categories")}
            className="flex items-center gap-2 mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 transition-colors" style={{ color: R.goldMuted }} />
            <div className="flex flex-col items-start">
              <span className="text-[9px] uppercase tracking-wide" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>Voltar</span>
              <span className="text-xs font-semibold transition-colors" style={{ color: R.goldMuted }}>
                Categorias
              </span>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}
            >
              <Brain className="w-6 h-6" style={{ color: R.gold }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>Flashcards</h1>
              <p className="text-xs" style={{ color: "hsla(40, 60%, 70%, 0.6)" }}>
                <span className="font-semibold" style={{ color: R.goldMuted }}>{totalFlashcards.toLocaleString('pt-BR')}</span> disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="px-4 pb-4">
        <div className="relative overflow-hidden rounded-2xl" style={{ border: `1px solid ${R.border}` }}>
          <div 
            key={slideIndex}
            className="relative min-h-[140px] overflow-hidden rounded-2xl animate-fade-in"
          >
            <img src={HERO_SLIDES[slideIndex].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="relative z-10 p-5 flex flex-col justify-end h-full min-h-[140px]">
              <h2 className="text-base font-bold text-white leading-tight mb-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                {HERO_SLIDES[slideIndex].title}
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "hsla(40, 60%, 70%, 0.8)" }}>
                {HERO_SLIDES[slideIndex].subtitle}
              </p>
            </div>
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === slideIndex ? 20 : 6,
                  height: 6,
                  background: i === slideIndex ? R.gold : "hsla(40, 60%, 50%, 0.3)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tab Menu — golden active */}
      <div className="px-2 pb-4">
        <div className="flex rounded-xl p-1 gap-1" style={{ background: "hsla(0, 0%, 100%, 0.04)", border: `1px solid ${R.border}` }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: isActive ? "hsla(40, 60%, 50%, 0.15)" : "transparent",
                  color: isActive ? R.gold : "hsla(0, 0%, 100%, 0.4)",
                  border: isActive ? `1px solid hsla(40, 60%, 50%, 0.2)` : "1px solid transparent",
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "principais" && (
        <div className="px-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[100px] rounded-2xl animate-pulse" style={{ background: "hsla(0, 0%, 100%, 0.04)" }} />
              ))}
            </div>
          ) : (
            renderCategoriaSection("Principais", "Essenciais para qualquer prova", sorted.filter(a => isInList(a.area, MAIS_COBRADAS)))
          )}
        </div>
      )}

      {activeTab === "frequentes" && (
        <div className="px-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[100px] rounded-2xl animate-pulse" style={{ background: "hsla(0, 0%, 100%, 0.04)" }} />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-sm font-bold" style={{ color: R.goldMuted }}>Frequentes</h2>
                <p className="text-xs text-white/40 mb-3">Frequentes em concursos e OAB</p>
                <div className="grid grid-cols-2 gap-3">
                  {sorted.filter(a => isInList(a.area, ALTA_INCIDENCIA)).map((item, idx) => renderCard(item, idx))}
                  <button
                    onClick={() => navigate('/categorias/trilha/Teoria%20e%20Filosofia%20do%20Direito')}
                    className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] shadow-lg h-[100px] animate-fade-in"
                    style={{
                      background: "hsla(0, 0%, 100%, 0.04)",
                      border: `1px solid ${R.border}`,
                      boxShadow: `0 4px 20px -4px rgba(0,0,0,0.4), inset 0 1px 0 hsla(40, 60%, 80%, 0.06)`,
                    }}
                  >
                    <div className="absolute -right-3 -bottom-3 opacity-[0.07]">
                      <Brain className="w-20 h-20" style={{ color: R.gold }} />
                    </div>
                    <div className="rounded-xl p-2 w-fit mb-2 transition-colors" style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}>
                      <Brain className="w-5 h-5" style={{ color: R.gold }} />
                    </div>
                    <h3 className="font-semibold text-white text-sm leading-tight pr-6">
                      Teoria e Filosofia do Direito
                    </h3>
                    <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 transition-all group-hover:translate-x-0.5" style={{ color: "hsla(40, 70%, 60%, 0.5)" }} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "extras" && (
        <div className="px-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[100px] rounded-2xl animate-pulse" style={{ background: "hsla(0, 0%, 100%, 0.04)" }} />
              ))}
            </div>
          ) : (
            renderCategoriaSection("Extras", "Aprofunde seus conhecimentos", sorted.filter(a => !isInList(a.area, MAIS_COBRADAS) && !isInList(a.area, ALTA_INCIDENCIA)))
          )}
        </div>
      )}

      {/* Estatísticas Modal/Overlay */}
      {showEstatisticas && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: R.bg }}>
          <div className="px-4 pt-4 pb-2 flex items-center gap-3 sticky top-0 z-10" style={{ background: R.bg }}>
            <button onClick={() => setShowEstatisticas(false)} className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "hsla(40, 60%, 50%, 0.1)", border: `1px solid ${R.border}` }}>
              <ArrowLeft className="w-5 h-5" style={{ color: R.gold }} />
            </button>
            <h2 className="text-lg font-bold text-white">Estatísticas</h2>
          </div>
          <FlashcardsEstatisticas />
        </div>
      )}

      {/* Floating Stats Button */}
      {!showEstatisticas && (
        <button
          onClick={() => setShowEstatisticas(true)}
          className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          style={{
            background: `linear-gradient(135deg, ${R.gold}, hsl(35, 70%, 40%))`,
            boxShadow: `0 4px 16px hsla(40, 80%, 55%, 0.4)`,
          }}
        >
          <BarChart3 className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
};

export default FlashcardsAreas;
