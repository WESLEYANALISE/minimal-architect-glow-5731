import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  FilePenLine, ArrowLeft, ChevronRight, Heart, Clock,
  Scale, BookOpen, Gavel, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { AnimatePresence, motion } from "framer-motion";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

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
  "Direito Concorrencial": "from-stone-500 to-stone-700",
  "Direito Desportivo": "from-gray-500 to-gray-700",
  "Direito Processual do Trabalho": "from-orange-600 to-orange-800",
  "Direito Financeiro": "from-emerald-500 to-emerald-700",
  "Sociologia do Direito": "from-violet-600 to-violet-800",
  "Teoria e Filosofia do Direito": "from-violet-500 to-violet-700",
  "Formação Complementar": "from-slate-500 to-slate-700",
  "Pratica Profissional": "from-amber-500 to-amber-700",
  "Pesquisa Científica": "from-cyan-500 to-cyan-700",
  "Politicas Publicas": "from-rose-500 to-rose-700",
  "Lei Penal Especial": "from-red-700 to-red-900",
  "Direito Previndenciário": "from-fuchsia-600 to-fuchsia-800",
  "Direito Tributario": "from-emerald-600 to-emerald-800",
  "Direito Urbanistico": "from-green-600 to-green-800",
  "Direito Internacional Publico": "from-sky-600 to-sky-800",
  "Direito Internacional Privado": "from-blue-500 to-blue-700",
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

const HERO_SLIDES = [
  { title: "Resumos Jurídicos", subtitle: "Resumos completos organizados por área e tema do Direito", image: heroResumos },
  { title: "Estude com Eficiência", subtitle: "Conteúdo estruturado para revisão rápida e aprofundada", image: heroBibliotecas },
  { title: "Todas as Áreas", subtitle: "Penal, Civil, Constitucional, Trabalhista e muito mais", image: estudosBg },
  { title: "Resumos Personalizados", subtitle: "Crie resumos a partir de textos, PDFs ou imagens", image: capaEstudos },
];

const FAVS_KEY = "resumos-areas-favoritos";
const RECENTES_KEY = "resumos-areas-recentes";

type TabKey = "areas" | "favoritos" | "recentes";

const TABS: { key: TabKey; label: string; icon: typeof Scale }[] = [
  { key: "areas", label: "Áreas", icon: Scale },
  { key: "favoritos", label: "Favoritos", icon: Star },
  { key: "recentes", label: "Recentes", icon: Clock },
];

const sortAreas = (areas: { area: string; count: number }[]) => {
  return [...areas].sort((a, b) => {
    const idxA = AREAS_ORDEM.findIndex(o => normalizar(o) === normalizar(a.area));
    const idxB = AREAS_ORDEM.findIndex(o => normalizar(o) === normalizar(b.area));
    return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
  });
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export default function ResumosJuridicosEscolha() {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState<TabKey>("areas");
  const [slideIndex, setSlideIndex] = useState(0);
  const [favs, setFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"); } catch { return []; }
  });
  const [recentes, setRecentes] = useState<{ area: string; timestamp: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENTES_KEY) || "[]"); } catch { return []; }
  });
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex((i) => (i + 1) % HERO_SLIDES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { localStorage.setItem(FAVS_KEY, JSON.stringify(favs)); }, [favs]);
  useEffect(() => { localStorage.setItem(RECENTES_KEY, JSON.stringify(recentes)); }, [recentes]);

  const toggleFav = (area: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setFavs(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const addRecente = (area: string) => {
    setRecentes(prev => {
      const filtered = prev.filter(r => r.area !== area);
      return [{ area, timestamp: Date.now() }, ...filtered].slice(0, 30);
    });
  };

  const handleNavigate = (area: string) => {
    addRecente(area);
    navigate(`/resumos-juridicos/temas?area=${encodeURIComponent(area)}`);
  };

  const { data: areasData, isLoading, isError, refetch } = useQuery({
    queryKey: ['resumos-juridicos-areas-hub'],
    queryFn: async () => {
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
      allData.forEach((item) => {
        if (item.area) {
          const areaNorm = normalizar(normalizarArea(item.area));
          const existing = areaMap.get(areaNorm);
          if (existing) {
            existing.count++;
          } else {
            areaMap.set(areaNorm, { area: normalizarArea(item.area), count: 1 });
          }
        }
      });

      return Array.from(areaMap.values())
        .sort((a, b) => a.area.localeCompare(b.area, 'pt-BR'));
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const totalResumos = useMemo(() => areasData?.reduce((acc, item) => acc + item.count, 0) || 0, [areasData]);

  const sorted = areasData ? sortAreas(areasData).filter(a => !isInList(a.area, AREAS_OCULTAS)) : [];
  const principais = sorted.filter(a => isInList(a.area, PRINCIPAIS));
  const frequentes = sorted.filter(a => isInList(a.area, FREQUENTES));
  const extras = sorted.filter(a => !isInList(a.area, PRINCIPAIS) && !isInList(a.area, FREQUENTES));

  const renderItem = (item: { area: string; count: number }, idx: number, showTime?: number) => {
    const gradient = getAreaGradient(item.area);
    const isFav = favs.includes(item.area);

    return (
      <div
        key={item.area}
        className="animate-fade-in"
        style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'forwards' }}
      >
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/30 bg-card/80 hover:bg-card transition-all active:scale-[0.98]">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}
            onClick={() => handleNavigate(item.area)}
          >
            <FilePenLine className="w-6 h-6 text-white" />
          </div>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => handleNavigate(item.area)}
          >
            <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">{item.area}</p>
            <p className="text-xs text-muted-foreground">
              {item.count.toLocaleString('pt-BR')} resumos
              {showTime ? ` · ${timeAgo(showTime)}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFav(item.area); }}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Heart className={`w-4 h-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </button>
            <ChevronRight
              className="w-4 h-4 text-muted-foreground cursor-pointer"
              onClick={() => handleNavigate(item.area)}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, items: { area: string; count: number }[], startIdx: number) => {
    if (items.length === 0) return null;
    return (
      <div key={title}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 first:mt-0">{title}</p>
        <div className="space-y-2">
          {items.map((item, i) => renderItem(item, startIdx + i))}
        </div>
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
          className="shrink-0 bg-card backdrop-blur-sm hover:bg-muted border border-border rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex items-center gap-2">
          <FilePenLine className="w-5 h-5 text-red-500" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Resumo de Conceitos</h1>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-400 font-semibold">{totalResumos.toLocaleString('pt-BR')}</span> resumos disponíveis
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

      {/* Tab Menu */}
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

      {/* Content */}
      <div className="px-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[60px] rounded-xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-3">Erro ao carregar áreas</p>
            <button onClick={() => refetch()} className="text-sm text-primary underline">Tente novamente</button>
          </div>
        ) : activeTab === "areas" ? (
          <div className="space-y-1">
            {renderSection("Principais", principais, 0)}
            {renderSection("Frequentes", frequentes, principais.length)}
            {renderSection("Extras", extras, principais.length + frequentes.length)}
          </div>
        ) : activeTab === "favoritos" ? (
          (() => {
            if (!isPremium) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Recurso exclusivo para assinantes</p>
                  <p className="text-xs mt-1">Assine para favoritar suas áreas preferidas</p>
                  <button onClick={() => setShowPremiumModal(true)} className="mt-3 text-sm text-amber-400 underline">Ver planos</button>
                </div>
              );
            }
            const favAreas = sorted.filter(a => favs.includes(a.area));
            return favAreas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma área favoritada</p>
                <p className="text-xs mt-1">Toque no ♡ para favoritar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {favAreas.map((item, i) => renderItem(item, i))}
              </div>
            );
          })()
        ) : (
          (() => {
            const recentesComDados = recentes
              .map(r => {
                const found = sorted.find(a => a.area === r.area);
                return found ? { ...found, timestamp: r.timestamp } : null;
              })
              .filter(Boolean) as ({ area: string; count: number; timestamp: number })[];

            return recentesComDados.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum acesso recente</p>
                <p className="text-xs mt-1">Seus últimos acessos aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentesComDados.map((item, i) => renderItem(item, i, item.timestamp))}
              </div>
            );
          })()
        )}
      </div>

      <PremiumFloatingCard
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Recurso Premium"
        sourceFeature="Resumos Favoritos"
      />
    </div>
  );
}
