import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, ChevronRight,
  NotebookPen, Lightbulb, Brain, Crown,
  Scale, BookOpen, Gavel
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { AnimatePresence, motion } from "framer-motion";

import heroResumos from "@/assets/hero-resumos.webp";
import heroBibliotecas from "@/assets/hero-bibliotecas-office.webp";
import estudosBg from "@/assets/estudos-background.webp";
import capaEstudos from "@/assets/capa-estudos-opt.webp";

const AREA_GRADIENTS: Record<string, string> = {
  "Direito Penal": "from-red-600 to-red-800",
  "Direito Civil": "from-blue-600 to-blue-800",
  "Direito Constitucional": "from-purple-600 to-purple-800",
  "Direito Processual Civil": "from-teal-600 to-teal-800",
  "Direito do Trabalho": "from-orange-500 to-orange-700",
  "Direito Tributário": "from-emerald-600 to-emerald-800",
  "Direito Administrativo": "from-indigo-500 to-indigo-700",
  "Direito Processual Penal": "from-pink-600 to-pink-800",
  "Direito Empresarial": "from-amber-500 to-amber-700",
  "Direitos Humanos": "from-cyan-600 to-cyan-800",
  "Português": "from-rose-500 to-rose-700",
  "Filosofia do Direito": "from-violet-500 to-violet-700",
  "Direito Ambiental": "from-lime-600 to-lime-800",
  "Direito do Consumidor": "from-yellow-600 to-yellow-800",
  "Direito Eleitoral": "from-sky-600 to-sky-800",
  "Direito Previdenciário": "from-fuchsia-600 to-fuchsia-800",
  "Direito Internacional": "from-slate-500 to-slate-700",
  "Direito Processual do Trabalho": "from-orange-600 to-orange-800",
  "Direito Financeiro": "from-emerald-500 to-emerald-700",
  "Teoria e Filosofia do Direito": "from-violet-500 to-violet-700",
  "Lei Penal Especial": "from-red-700 to-red-900",
  "Legislação Penal": "from-red-600 to-red-800",
};

const normalizar = (str: string) => str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const normalizarArea = (area: string): string => {
  const mapeamento: Record<string, string> = {
    'Portugues': 'Português',
    'portugues': 'Português',
    'Direito Tributario': 'Direito Tributário',
    'Direito Previndenciario': 'Direito Previdenciário',
    'Direito Previndenciário': 'Direito Previdenciário',
    'Direito Previdenciario': 'Direito Previdenciário',
    'Direito Urbanistico': 'Direito Urbanístico',
    'Direito Internacional Publico': 'Direito Internacional Público',
  };
  return mapeamento[area] || area;
};

const isInList = (area: string, list: string[]) => {
  const norm = normalizar(area);
  return list.some(o => normalizar(o) === norm);
};

const getAreaGradient = (area: string) =>
  AREA_GRADIENTS[area] || "from-slate-500 to-slate-700";

const PRINCIPAIS = [
  "Direito Constitucional", "Direito Administrativo", "Direito Civil",
  "Direito Penal", "Direito Processual Civil", "Direito Processual Penal",
  "Direito do Trabalho", "Direito Tributário",
];

const FREQUENTES = [
  "Direito Empresarial", "Direito Processual do Trabalho",
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
  "Filosofia do Direito", "Sociologia do Direito", "Teoria e Filosofia do Direito",
];

const AREAS_OCULTAS = ["Revisão Oab"];

const AREAS_ORDEM: string[] = [
  ...PRINCIPAIS, ...FREQUENTES,
  "Lei Penal Especial",
  "Direito Concorrencial", "Formação Complementar", "Pratica Profissional",
  "Pesquisa Científica", "Politicas Publicas",
];

const FREE_AREAS = ["Direito Constitucional", "Direito Administrativo"];

const metodoInfo: Record<string, { titulo: string; icon: any; cor: string }> = {
  cornell: { titulo: 'Método Cornell', icon: NotebookPen, cor: '#4F46E5' },
  feynman: { titulo: 'Método Feynman', icon: Lightbulb, cor: '#EA580C' },
  mapamental: { titulo: 'Mapa Mental', icon: Brain, cor: '#059669' },
};

const HERO_SLIDES = [
  { title: "Metodologias de Estudo", subtitle: "Cornell, Feynman e Mapas Mentais para cada área do Direito", image: heroResumos },
  { title: "Estude com Eficiência", subtitle: "Conteúdo estruturado para revisão rápida e aprofundada", image: heroBibliotecas },
  { title: "Todas as Áreas", subtitle: "Penal, Civil, Constitucional, Trabalhista e muito mais", image: estudosBg },
  { title: "Aprenda do Seu Jeito", subtitle: "Escolha o método que funciona melhor para você", image: capaEstudos },
];

type TabKey = "principais" | "frequentes" | "extras";

const TABS: { key: TabKey; label: string; icon: typeof Scale }[] = [
  { key: "principais", label: "Principais", icon: Scale },
  { key: "frequentes", label: "Frequentes", icon: BookOpen },
  { key: "extras", label: "Extras", icon: Gavel },
];

const sortAreas = (areas: { area: string; count: number }[]) => {
  return [...areas].sort((a, b) => {
    const normA = normalizar(a.area);
    const normB = normalizar(b.area);
    const idxA = AREAS_ORDEM.findIndex(o => normalizar(o) === normA);
    const idxB = AREAS_ORDEM.findIndex(o => normalizar(o) === normB);
    return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
  });
};

export default function MetodologiasAreas() {
  const navigate = useNavigate();
  const { metodo } = useParams<{ metodo: string }>();
  const { isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState<TabKey>("principais");
  const [slideIndex, setSlideIndex] = useState(0);

  const info = metodoInfo[metodo || ''] || metodoInfo.cornell;
  const MetodoIcon = info.icon;

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex(i => (i + 1) % HERO_SLIDES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const { data: areasData, isLoading } = useQuery({
    queryKey: ['metodologias-public-areas', metodo],
    queryFn: async () => {
      // 1. Fetch areas from RESUMO
      let allData: { area: string }[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('RESUMO')
          .select('area')
          .not('area', 'is', null)
          .range(offset, offset + batchSize - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      const areaMap = new Map<string, { area: string; count: number }>();
      allData.forEach(item => {
        if (item.area) {
          const areaNorm = normalizar(normalizarArea(item.area));
          const existing = areaMap.get(areaNorm);
          if (existing) existing.count++;
          else areaMap.set(areaNorm, { area: normalizarArea(item.area), count: 1 });
        }
      });

      // 2. Fetch order from BIBLIOTECA-ESTUDOS
      const { data: bibliotecaData } = await (supabase as any)
        .from('BIBLIOTECA-ESTUDOS')
        .select('"Área", "Ordem"')
        .not('Área', 'is', null)
        .order('Ordem');

      // Build order map: area (normalized) → minimum Ordem value
      const ordemMap = new Map<string, number>();
      (bibliotecaData || []).forEach((item: { Área: string | null; Ordem: number | null }) => {
        if (item.Área) {
          const norm = normalizar(item.Área.trim());
          if (!ordemMap.has(norm)) {
            ordemMap.set(norm, item.Ordem ?? 9999);
          }
        }
      });

      // Sort by BIBLIOTECA-ESTUDOS order
      return Array.from(areaMap.values()).sort((a, b) => {
        const ordemA = ordemMap.get(normalizar(a.area)) ?? 9999;
        const ordemB = ordemMap.get(normalizar(b.area)) ?? 9999;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return a.area.localeCompare(b.area, 'pt-BR');
      });
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
  });

  const totalResumos = useMemo(() => areasData?.reduce((acc, item) => acc + item.count, 0) || 0, [areasData]);

  const sorted = areasData ? areasData.filter(a => !isInList(a.area, AREAS_OCULTAS)) : [];

  const principais = sorted.filter(a => isInList(a.area, PRINCIPAIS));
  const frequentes = sorted.filter(a => isInList(a.area, FREQUENTES));
  const extras = sorted.filter(a => !isInList(a.area, PRINCIPAIS) && !isInList(a.area, FREQUENTES));

  const currentAreas = activeTab === "principais" ? principais : activeTab === "frequentes" ? frequentes : extras;

  const renderCard = (item: { area: string; count: number }, animIndex: number) => {
    const gradient = getAreaGradient(item.area);
    return (
      <div
        key={item.area}
        className="animate-fade-in"
        style={{ animationDelay: `${animIndex * 80}ms`, animationFillMode: 'forwards' }}
      >
        <button
          onClick={() => navigate(`/metodologias/${metodo}/area/${encodeURIComponent(item.area)}`)}
          className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br ${gradient} shadow-lg h-[100px] w-full`}
        >
          <div className="absolute -right-3 -bottom-3 opacity-20">
            <MetodoIcon className="w-20 h-20 text-white" />
          </div>
          <div className="bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
            <MetodoIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-white text-sm leading-tight pr-6">
            {item.area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '')}
          </h3>
          <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/resumos-juridicos")}
          className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
        <div className="flex items-center gap-2">
          <MetodoIcon className="w-5 h-5" style={{ color: info.cor }} />
          <div>
            <h1 className="text-lg font-bold text-foreground">{info.titulo}</h1>
            <p className="text-xs text-muted-foreground">
              <span style={{ color: info.cor }} className="font-semibold">{totalResumos.toLocaleString('pt-BR')}</span> resumos disponíveis
            </p>
          </div>
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="px-4 pb-4">
        <div className="relative overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.35 }}
              className="relative min-h-[140px] overflow-hidden rounded-2xl"
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
            </motion.div>
          </AnimatePresence>
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

      {/* Tab Menu - Principais / Frequentes / Extras */}
      <div className="px-4 pb-4">
        <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Areas Grid */}
      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : currentAreas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma área nesta categoria</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {currentAreas.map((item, i) => renderCard(item, i))}
          </div>
        )}
      </div>
    </div>
  );
}
