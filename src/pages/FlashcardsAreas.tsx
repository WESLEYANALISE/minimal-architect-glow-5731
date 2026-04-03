import { useState, useEffect } from "react";
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

const ALTA_INCIDENCIA_GRADIENT = "from-indigo-500 to-indigo-700";
const COMPLEMENTARES_GRADIENT = "from-slate-500 to-slate-700";

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
  // Only prefetch if not already in cache
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
          return; // Cache still valid
        }
        // Fetch and save to cache
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

  // Fetch lacunas count from FLASHCARDS_LACUNAS (correct table)
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

  const renderCard = (item: FlashcardArea, idx: number, gradientOverride?: string) => {
    const gradient = gradientOverride || getAreaGradient(item.area);
    // All areas are accessible — premium gate is at tema level (2 free per area)
    const handleClick = () => {
      navigate(`/flashcards/temas?area=${encodeURIComponent(item.area)}`);
    };
    return (
      <button
        key={item.area}
        onClick={handleClick}
        onMouseEnter={() => prefetchTemaStats(item.area)}
        onTouchStart={() => prefetchTemaStats(item.area)}
        className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${gradient} shadow-lg h-[100px] animate-fade-in shine-effect`}
        style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}
      >
        <div className="absolute -right-3 -bottom-3 opacity-20">
          <Brain className="w-20 h-20 text-white" />
        </div>

        <div className="relative z-10 bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <h3 className="relative z-10 font-semibold text-white text-sm leading-tight pr-6">
          {item.area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '')}
        </h3>
        <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </button>
    );
  };

  const renderCategoriaSection = (titulo: string, subtitulo: string, items: FlashcardArea[], gradientOverride?: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <h2 className="text-sm font-bold text-foreground">{titulo}</h2>
        <p className="text-xs text-muted-foreground mb-3">{subtitulo}</p>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, idx) => renderCard(item, idx, gradientOverride))}
        </div>
      </div>
    );
  };

  // Admin hub sub-views
  if (subView === "menu") {
    return (
      <div className="min-h-screen pb-20" style={{ background: "hsl(0 0% 12%)" }}>
        <div className="relative overflow-hidden rounded-b-3xl mb-2" style={{ background: "linear-gradient(135deg, hsl(25 35% 22%), hsl(15 30% 16%))" }}>
          <div className="absolute inset-0 opacity-10">
            <Brain className="absolute -right-6 -bottom-6 w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 px-4 pt-4 pb-5">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/")} 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsla(25, 50%, 35%, 0.5)", border: "1px solid hsla(25, 50%, 45%, 0.3)" }}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Flashcards</h1>
                <p className="text-xs text-white/60">
                  {totalFlashcards.toLocaleString('pt-BR')} disponíveis
                </p>
              </div>
            </div>
          </div>
        </div>
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
      <div className="min-h-screen pb-20" style={{ background: "hsl(0 0% 12%)" }}>
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /><span>Menu</span>
          </button>
        </div>
        <FlashcardsProgressoPage onBack={() => setSubView("menu")} />
      </div>
    );
  }

  if (subView === "reforco") {
    return (
      <div className="min-h-screen pb-20" style={{ background: "hsl(0 0% 12%)" }}>
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /><span>Menu</span>
          </button>
        </div>
        <FlashcardsReforcoTab onPraticar={() => setSubView("categories")} />
      </div>
    );
  }

  if (subView === "cadernos") {
    return (
      <div className="min-h-screen pb-20" style={{ background: "hsl(0 0% 12%)" }}>
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /><span>Menu</span>
          </button>
        </div>
        <FlashcardsCadernos onBack={() => setSubView("menu")} />
      </div>
    );
  }

  if (subView === "diagnostico") {
    return (
      <div className="min-h-screen pb-20" style={{ background: "hsl(0 0% 12%)" }}>
        <div className="px-4 pt-4 pb-2">
          <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /><span>Menu</span>
          </button>
        </div>
        <FlashcardsDiagnosticoPage onBack={() => setSubView("menu")} />
      </div>
    );
  }

  if (subView === "categories") {
    return (
      <div className="min-h-screen pb-20" style={{ background: "hsl(0 0% 12%)" }}>
        {/* Header banner — matching QuestoesHub categorias style */}
        <div className="relative overflow-hidden rounded-b-3xl mb-2" style={{ background: "linear-gradient(135deg, hsl(15 40% 28%), hsl(10 35% 20%))" }}>
          <div className="absolute inset-0 opacity-10">
            <Brain className="absolute -right-6 -bottom-6 w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 px-4 pt-4 pb-5">
            <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-white/70 text-xs mb-3 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsla(15, 40%, 40%, 0.5)", border: "1px solid hsla(15, 40%, 50%, 0.3)" }}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Flashcards</h1>
                <p className="text-xs text-white/60">
                  {totalFlashcards.toLocaleString('pt-BR')} disponíveis
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen background + serpentine timeline */}
        <div className="relative px-4 pb-4">
          <div className="absolute inset-0 -top-16 -bottom-4 -left-0 -right-0 overflow-hidden pointer-events-none">
            <img src={bgFlashcardsCategorias} alt="" className="w-full h-full object-cover opacity-15" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[hsl(0_0%_12%)] via-[hsl(0_0%_12%)]/80 to-transparent" />
          </div>

          <div className="relative py-6 px-2">
            {/* Central line */}
            <div className="absolute left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2">
              <div className="w-full h-full bg-gradient-to-b from-purple-500/30 via-blue-500/20 to-amber-500/30" />
              <motion.div
                className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-transparent via-white/60 to-transparent rounded-full"
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
                className="w-[calc(50%-24px)] h-[130px] p-4 rounded-2xl text-left transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden shine-effect"
                style={{
                  background: "linear-gradient(135deg, hsl(265 60% 50%), hsl(280 55% 40%))",
                  border: "1px solid hsla(265, 50%, 60%, 0.4)",
                  boxShadow: "0 8px 24px rgba(147, 51, 234, 0.35)",
                }}
              >
                <div className="absolute -right-3 -bottom-3 opacity-15">
                  <Brain className="w-[88px] h-[88px] text-white" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white">Conceitos</p>
                <p className="text-[10px] text-white/60 mt-0.5">{totalAreas} áreas</p>
                <p className="text-[10px] text-purple-200 font-semibold mt-1">{totalFlashcards.toLocaleString('pt-BR')} cards</p>
              </motion.button>
              
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-400 to-purple-600"
                  style={{ boxShadow: "0 0 16px rgba(147, 51, 234, 0.5)" }}
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
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-400 to-green-600"
                  style={{ boxShadow: "0 0 16px rgba(52, 211, 153, 0.5)" }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              
              <motion.button
                onClick={() => navigate("/flashcards/lacunas")}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="w-[calc(50%-24px)] h-[130px] p-4 rounded-2xl text-left transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden shine-effect"
                style={{
                  background: "linear-gradient(135deg, hsl(160 55% 45%), hsl(170 50% 35%))",
                  border: "1px solid hsla(160, 50%, 55%, 0.4)",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
                }}
              >
                <div className="absolute -right-3 -bottom-3 opacity-15">
                  <PenLine className="w-[88px] h-[88px] text-white" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white">Lacunas</p>
                <p className="text-[10px] text-white/60 mt-0.5">Complete a frase</p>
                <p className="text-[10px] text-emerald-200 font-semibold mt-1">{lacunasCount.toLocaleString('pt-BR')} cards</p>
              </motion.button>
            </div>

            {/* Item 3 - Left (Correspondência) */}
            <div className="relative flex items-center mb-10">
              <motion.button
                onClick={() => navigate("/ferramentas/questoes/correspondencia")}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
                className="w-[calc(50%-24px)] h-[130px] p-4 rounded-2xl text-left transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden shine-effect"
                style={{
                  background: "linear-gradient(135deg, hsl(215 70% 55%), hsl(225 65% 45%))",
                  border: "1px solid hsla(215, 60%, 60%, 0.4)",
                  boxShadow: "0 8px 24px rgba(59, 130, 246, 0.35)",
                }}
              >
                <div className="absolute -right-3 -bottom-3 opacity-15">
                  <Link2 className="w-[88px] h-[88px] text-white" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                  <Link2 className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white">Correspondência</p>
                <p className="text-[10px] text-white/60 mt-0.5">Associe conceitos</p>
                <p className="text-[10px] text-blue-200 font-semibold mt-1">{correspondenciaCount > 0 ? `${correspondenciaCount} sets` : 'Novo!'}</p>
              </motion.button>
              
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.65, type: "spring" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-blue-600"
                  style={{ boxShadow: "0 0 16px rgba(59, 130, 246, 0.5)" }}
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
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-teal-500 to-cyan-700"
                  style={{ boxShadow: "0 0 16px rgba(20, 184, 166, 0.5)" }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              
              <motion.button
                onClick={() => navigate("/flashcards/termos-juridicos")}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5, ease: "easeOut" }}
                className="w-[calc(50%-24px)] h-[130px] p-4 rounded-2xl text-left transition-all hover:scale-[1.03] active:scale-95 relative overflow-hidden shine-effect"
                style={{
                  background: "linear-gradient(135deg, hsl(175 50% 38%), hsl(185 55% 28%))",
                  border: "1px solid hsla(175, 45%, 45%, 0.4)",
                  boxShadow: "0 8px 24px rgba(20, 184, 166, 0.35)",
                }}
              >
                <div className="absolute -right-3 -bottom-3 opacity-15">
                  <BookOpen className="w-[88px] h-[88px] text-white" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-bold text-white">Termos Jurídicos</p>
                <p className="text-[10px] text-white/60 mt-0.5">Dicionário A-Z</p>
                <p className="text-[10px] text-teal-200 font-semibold mt-1">{termosCount.toLocaleString('pt-BR')} termos</p>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "hsl(0 0% 12%)" }}>
      {/* Header — banner marrom igual ao menu admin */}
      <div
        className="relative overflow-hidden rounded-b-3xl mb-3"
        style={{ background: "linear-gradient(135deg, hsl(25 35% 22%), hsl(15 30% 16%))" }}
      >
        <Brain
          className="absolute -right-3 -bottom-3 text-white pointer-events-none"
          style={{ width: 100, height: 100, opacity: 0.06 }}
        />
        <div className="relative z-10 px-4 pt-3 pb-5">
          <button
            onClick={() => setSubView("categories")}
            className="flex items-center gap-2 mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] text-white/50 uppercase tracking-wide">Voltar</span>
              <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                Categorias
              </span>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "hsla(25, 50%, 35%, 0.5)",
                border: "1px solid hsla(25, 50%, 45%, 0.3)",
              }}
            >
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Flashcards</h1>
              <p className="text-xs text-white/55">
                <span className="text-white/90 font-semibold">{totalFlashcards.toLocaleString('pt-BR')}</span> disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="px-4 pb-4">
        <div className="relative overflow-hidden rounded-2xl">
          <div 
            key={slideIndex}
            className="relative min-h-[140px] overflow-hidden rounded-2xl animate-fade-in"
          >
            <img src={HERO_SLIDES[slideIndex].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="relative z-10 p-5 flex flex-col justify-end h-full min-h-[140px]">
              <h2 className="text-base font-bold text-white leading-tight mb-1">
                {HERO_SLIDES[slideIndex].title}
              </h2>
              <p className="text-xs text-white/80 leading-relaxed">
                {HERO_SLIDES[slideIndex].subtitle}
              </p>
            </div>
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`rounded-full transition-all ${i === slideIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tab Menu */}
      <div className="px-2 pb-4">
        <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-background text-foreground shadow-sm" 
                    : "bg-card/80 text-muted-foreground hover:text-foreground shine-effect"
                }`}
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
                <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
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
                <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-sm font-bold text-foreground">Frequentes</h2>
                <p className="text-xs text-muted-foreground mb-3">Frequentes em concursos e OAB</p>
                <div className="grid grid-cols-2 gap-3">
                  {sorted.filter(a => isInList(a.area, ALTA_INCIDENCIA)).map((item, idx) => renderCard(item, idx, ALTA_INCIDENCIA_GRADIENT))}
                  <button
                    onClick={() => navigate('/categorias/trilha/Teoria%20e%20Filosofia%20do%20Direito')}
                    className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg h-[100px] animate-fade-in"
                  >
                    <div className="absolute -right-3 -bottom-3 opacity-20">
                      <Brain className="w-20 h-20 text-white" />
                    </div>
                    <div className="bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white text-sm leading-tight pr-6">
                      Teoria e Filosofia do Direito
                    </h3>
                    <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
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
                <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : (
            renderCategoriaSection("Extras", "Aprofunde seus conhecimentos", sorted.filter(a => !isInList(a.area, MAIS_COBRADAS) && !isInList(a.area, ALTA_INCIDENCIA)), COMPLEMENTARES_GRADIENT)
          )}
        </div>
      )}

      {/* Estatísticas Modal/Overlay */}
      {showEstatisticas && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
          <div className="px-4 pt-4 pb-2 flex items-center gap-3 sticky top-0 bg-background z-10">
            <button onClick={() => setShowEstatisticas(false)} className="shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-foreground">Estatísticas</h2>
          </div>
          <FlashcardsEstatisticas />
        </div>
      )}

      {/* Floating Stats Button */}
      {!showEstatisticas && (
        <button
          onClick={() => setShowEstatisticas(true)}
          className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      )}

      {/* Modal removed - navigates directly to /flashcards/temas */}
    </div>
  );
};

export default FlashcardsAreas;
