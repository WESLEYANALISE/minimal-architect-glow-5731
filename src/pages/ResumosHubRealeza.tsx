import { useState, useMemo, useEffect, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePenLine, ArrowLeft, Search, Scale, BookOpen, ChevronRight,
  Heart, Clock, Star, ListOrdered, BarChart3, Crown, FileText,
  NotebookPen, Lightbulb, Grid3X3, Info, ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { DotPattern } from "@/components/ui/dot-pattern";
import { NumberTicker } from "@/components/ui/number-ticker";
import { useResumosCount } from "@/hooks/useResumosCount";
import { useResumosAreasCache, useResumosTemas } from "@/hooks/useResumosAreasCache";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import capaResumosJuridicos from "@/assets/capa-resumos-juridicos.webp";
import capaConceitos from "@/assets/capa-resumo-conceitos.webp";
import capaCornell from "@/assets/capa-resumo-cornell.webp";
import capaFeynman from "@/assets/capa-resumo-feynman.webp";

// ── Constants ──

const FREE_AREAS = ["Direito Constitucional", "Direito Administrativo"];

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
const AREAS_ORDEM = [...PRINCIPAIS, ...FREQUENTES,
  "Lei Penal Especial", "Direito Concorrencial", "Formação Complementar",
  "Pratica Profissional", "Pesquisa Científica", "Politicas Publicas",
];

const norm = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
const isInList = (a: string, l: string[]) => l.some(o => norm(o) === norm(a));

const normalizarArea = (area: string): string => {
  const m: Record<string, string> = {
    "Portugues": "Português", "portugues": "Português",
    "Direito Tributario": "Direito Tributário",
    "Direito Previndenciario": "Direito Previdenciário",
    "Direito Previndenciário": "Direito Previdenciário",
    "Direito Previdenciario": "Direito Previdenciário",
    "Direito Urbanistico": "Direito Urbanístico",
    "Direito Internacional Publico": "Direito Internacional Público",
  };
  return m[area] || area;
};

const GOLD = "hsl(40, 80%, 55%)";
const GOLD_DIM = "hsla(40, 60%, 70%, 0.7)";
const CARD_BG = "hsla(0, 0%, 100%, 0.04)";
const CARD_BORDER = "hsla(40, 60%, 50%, 0.12)";
const HERO_BG = "linear-gradient(145deg, hsl(345 65% 30%), hsl(350 50% 22%), hsl(350 40% 15%))";

const FAVS_KEY = "resumos-areas-favoritos";
const RECENTES_KEY = "resumos-areas-recentes";

type SubView = "landing" | "areas" | "temas";

const slideVariants = {
  enter: { x: "100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-30%", opacity: 0 },
};

// ── Metodos data ──

const METODOS = [
  { id: 1, title: "Resumo de Conceitos", desc: "Por área e tema do Direito", icon: BookOpen, capa: capaConceitos, metodoKey: "conceitos" as const },
  { id: 2, title: "Resumo Cornell", desc: "Anotações, Palavras-Chave e Resumo", icon: NotebookPen, capa: capaCornell, metodoKey: "cornell" as const },
  { id: 3, title: "Resumo Feynman", desc: "Aprenda explicando de forma simples", icon: Lightbulb, capa: capaFeynman, metodoKey: "feynman" as const },
];

const SOBRE_METODOS = [
  { titulo: "Resumo de Conceitos", icon: BookOpen, descricao: "Resumos organizados por área e tema do Direito, trazendo os principais conceitos, definições e fundamentos de cada matéria jurídica.", ideal: "Para quem está começando a estudar um tema ou precisa revisar conceitos fundamentais." },
  { titulo: "Método Cornell", icon: NotebookPen, descricao: "Divide a página em três seções: Anotações principais, Palavras-chave e um Resumo final. Criado na Universidade de Cornell nos anos 1950.", ideal: "Para revisão ativa — ao cobrir as anotações e tentar responder usando apenas as palavras-chave." },
  { titulo: "Técnica Feynman", icon: Lightbulb, descricao: "Inspirada no físico Richard Feynman, consiste em explicar um conceito de forma tão simples que até uma criança entenderia.", ideal: "Para identificar lacunas no conhecimento." },
];

// ── Fetch helpers ──
async function fetchAllAreas() {
  let all: { area: string }[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from("RESUMO").select("area").not("area", "is", null).range(offset, offset + 999);
    if (error) throw error;
    if (!data?.length) break;
    all = [...all, ...data];
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function fetchAreaTemas() {
  let all: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from("RESUMO").select("area, tema").not("area", "is", null).not("tema", "is", null).range(offset, offset + 999);
    if (error) throw error;
    if (!data?.length) break;
    all = [...all, ...data];
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function fetchMetodologiaAreas(metodo: string) {
  let all: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from("METODOLOGIAS_GERADAS").select("area").eq("metodo", metodo).not("area", "is", null).range(offset, offset + 999);
    if (error) throw error;
    if (!data?.length) break;
    all = [...all, ...data];
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

// ── Temas Inline Component ──
const TemasInline = ({ area, onBack }: { area: string; onBack: () => void }) => {
  const navigate = useNavigate();
  const { temas, isLoading, totalResumos } = useResumosTemas(area);
  const { isPremium } = useSubscription();
  const [activeTab, setActiveTab] = useState<"ordem" | "favoritos" | "pesquisar">("ordem");
  const [searchTerm, setSearchTerm] = useState("");
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("resumos-temas-favoritos-r") || "{}")[area] || []; } catch { return []; }
  });

  const toggleFavorito = (tema: string) => {
    const next = favoritos.includes(tema) ? favoritos.filter(f => f !== tema) : [...favoritos, tema];
    setFavoritos(next);
    try {
      const all = JSON.parse(localStorage.getItem("resumos-temas-favoritos-r") || "{}");
      all[area] = next;
      localStorage.setItem("resumos-temas-favoritos-r", JSON.stringify(all));
    } catch {}
  };

  const temasFiltered = useMemo(() => {
    if (!temas) return [];
    let filtered = temas;
    if (activeTab === "favoritos") return filtered.filter(t => favoritos.includes(t.tema));
    if (activeTab === "pesquisar" && searchTerm.trim()) {
      const s = norm(searchTerm);
      return filtered.filter(t => norm(t.tema).includes(s));
    }
    return filtered;
  }, [temas, activeTab, searchTerm, favoritos]);

  const handleSelect = (tema: string) => {
    navigate(`/resumos-juridicos/prontos/${encodeURIComponent(area)}/${encodeURIComponent(tema)}`);
  };

  const TABS = [
    { key: "ordem" as const, label: "Ordem", icon: ListOrdered },
    { key: "favoritos" as const, label: "Favoritos", icon: Heart },
    { key: "pesquisar" as const, label: "Pesquisar", icon: Search },
  ];

  const shortArea = area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, "").replace(/^Direitos\s+/i, "");

  return (
    <>
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-3xl mb-4" style={{ background: HERO_BG }}>
        <FilePenLine className="absolute -right-4 -bottom-4 text-white pointer-events-none" style={{ width: 90, height: 90, opacity: 0.05 }} />
        <div className="relative z-10 px-4 pt-3 pb-5">
          <button onClick={onBack} className="flex items-center gap-2 mb-3 group">
            <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Áreas</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsla(40, 60%, 50%, 0.15)", border: "1px solid hsla(40, 60%, 50%, 0.25)" }}>
              <FilePenLine className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">{shortArea}</h1>
              <p className="text-xs" style={{ color: GOLD_DIM }}>{temas?.length || 0} temas disponíveis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-center gap-6 text-sm" style={{ color: "hsla(0,0%,100%,0.6)" }}>
          <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" style={{ color: GOLD }} /><span>{temas?.length || 0} temas</span></div>
          <div className="flex items-center gap-2"><FileText className="w-4 h-4" style={{ color: GOLD }} /><span>{totalResumos.toLocaleString("pt-BR")} resumos</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-3">
        <div className="flex rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid hsla(0,0%,100%,0.08)` }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-all"
                style={{ background: isActive ? "hsla(40,60%,50%,0.15)" : "transparent", color: isActive ? GOLD : "hsla(0,0%,100%,0.4)" }}>
                <tab.icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      {activeTab === "pesquisar" && (
        <div className="px-4 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsla(40,60%,60%,0.5)" }} />
            <input type="text" placeholder="Buscar tema..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
              style={{ background: "hsla(0,0%,100%,0.05)", border: `1px solid ${CARD_BORDER}` }} />
          </div>
        </div>
      )}

      {/* Temas list */}
      <div className="px-4 pb-8 space-y-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: CARD_BG }} />
          ))
        ) : temasFiltered.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: "hsla(0,0%,100%,0.4)" }}>
            {activeTab === "pesquisar" && searchTerm.trim() ? "Nenhum tema encontrado." : activeTab === "favoritos" ? "Nenhum tema favoritado." : "Nenhum tema encontrado"}
          </p>
        ) : temasFiltered.map((tema, i) => {
          const isFav = favoritos.includes(tema.tema);
          const lockedFrom = isPremium ? Infinity : Math.max(1, Math.ceil(temasFiltered.length * 0.20));
          const isLocked = !isPremium && i >= lockedFrom;
          return (
            <motion.button key={tema.tema} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => isLocked ? navigate("/assinatura") : handleSelect(tema.tema)}
              className="w-full group flex items-center gap-3 rounded-xl p-3.5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: "hsla(40,60%,50%,0.12)", color: GOLD, border: "1.5px solid hsla(40,60%,50%,0.2)" }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-normal text-white leading-snug line-clamp-2">{tema.tema}</p>
                <p className="text-[11px] mt-0.5" style={{ color: GOLD }}>{tema.count} resumos</p>
              </div>
              <button onClick={e => { e.stopPropagation(); toggleFavorito(tema.tema); }}
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: isFav ? "#dc2626" : "hsla(0,0%,100%,0.06)", border: isFav ? "1.5px solid #fca5a5" : "1.5px solid hsla(0,0%,100%,0.1)" }}>
                <Heart className="w-3.5 h-3.5" style={{ color: isFav ? "white" : "hsla(0,0%,100%,0.4)", fill: isFav ? "white" : "none" }} />
              </button>
              {isLocked ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(40,90%,50%), hsl(40,70%,35%))", boxShadow: "0 0 10px hsla(40,90%,50%,0.5)", border: "1.5px solid hsl(40,80%,60%)" }}>
                  <Crown className="w-3.5 h-3.5 text-white" />
                </div>
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0 text-white/70" />
              )}
            </motion.button>
          );
        })}
      </div>
    </>
  );
};

// ── Main Hub ──
const ResumosHubRealeza = () => {
  const navigate = useNavigate();
  const { isPremium } = useSubscription();
  const { totalResumos, resumosMateria, resumosCornell, resumosFeynman } = useResumosCount();
  const [subView, setSubView] = useState<SubView>("landing");
  const [selectedArea, setSelectedArea] = useState("");
  const [activeAreaTab, setActiveAreaTab] = useState<"areas" | "favoritos" | "recentes">("areas");

  const [favs, setFavs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"); } catch { return []; }
  });
  const [recentes, setRecentes] = useState<{ area: string; timestamp: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECENTES_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(FAVS_KEY, JSON.stringify(favs)); }, [favs]);
  useEffect(() => { localStorage.setItem(RECENTES_KEY, JSON.stringify(recentes)); }, [recentes]);

  const toggleFav = (area: string) => {
    setFavs(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const addRecente = (area: string) => {
    setRecentes(prev => {
      const f = prev.filter(r => r.area !== area);
      return [{ area, timestamp: Date.now() }, ...f].slice(0, 30);
    });
  };

  // Areas data
  const { data: areasData, isLoading: areasLoading } = useQuery({
    queryKey: ["resumos-hub-realeza-areas"],
    queryFn: async () => {
      const all = await fetchAllAreas();
      const map = new Map<string, { area: string; count: number }>();
      all.forEach(item => {
        if (!item.area) return;
        const a = normalizarArea(item.area);
        const k = norm(a);
        const ex = map.get(k);
        if (ex) ex.count++;
        else map.set(k, { area: a, count: 1 });
      });
      return Array.from(map.values());
    },
    staleTime: Infinity,
  });

  // Raio-X
  const { data: raioXData } = useQuery({
    queryKey: ["resumos-raio-x-realeza"],
    queryFn: async () => {
      const [conceitos, cornell, feynman] = await Promise.all([fetchAllAreas(), fetchMetodologiaAreas("cornell"), fetchMetodologiaAreas("feynman")]);
      const counts: Record<string, number> = {};
      [...conceitos, ...cornell, ...feynman].forEach((r: any) => { counts[r.area] = (counts[r.area] || 0) + 1; });
      return Object.entries(counts).map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 10,
  });

  // Grade
  const { data: gradeData } = useQuery({
    queryKey: ["resumos-grade-realeza"],
    queryFn: async () => {
      const all = await fetchAreaTemas();
      const m: Record<string, Set<string>> = {};
      all.forEach((r: any) => { if (!m[r.area]) m[r.area] = new Set(); m[r.area].add(r.tema); });
      return Object.entries(m).map(([area, temas]) => ({ area, temas: Array.from(temas).sort(), count: temas.size })).sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 10,
  });

  const sorted = useMemo(() => {
    if (!areasData) return [];
    return [...areasData].filter(a => !isInList(a.area, AREAS_OCULTAS)).sort((a, b) => {
      const iA = AREAS_ORDEM.findIndex(o => norm(o) === norm(a.area));
      const iB = AREAS_ORDEM.findIndex(o => norm(o) === norm(b.area));
      return (iA >= 0 ? iA : 999) - (iB >= 0 ? iB : 999);
    });
  }, [areasData]);

  const principais = sorted.filter(a => isInList(a.area, PRINCIPAIS));
  const frequentes = sorted.filter(a => isInList(a.area, FREQUENTES));
  const extras = sorted.filter(a => !isInList(a.area, PRINCIPAIS) && !isInList(a.area, FREQUENTES));

  const handleSelectArea = (area: string) => {
    addRecente(area);
    setSelectedArea(area);
    setSubView("temas");
  };

  const counts: Record<number, number> = { 1: resumosMateria, 2: resumosCornell, 3: resumosFeynman };
  const totalRaioX = raioXData?.reduce((s, r) => s + r.count, 0) || 0;
  const maxRaioX = raioXData?.[0]?.count || 1;

  const timeAgo = (ts: number) => {
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    if (m < 1) return "agora";
    if (m < 60) return `há ${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `há ${h}h`;
    return `há ${Math.floor(h / 24)}d`;
  };

  const [landingTab, setLandingTab] = useState<"metodos" | "grade" | "raio-x" | "sobre">("metodos");

  const renderAreaItem = (item: { area: string; count: number }, idx: number, showTime?: number) => {
    const isFav = favs.includes(item.area);
    const isLocked = !isPremium && !FREE_AREAS.some(f => norm(f) === norm(item.area));
    return (
      <motion.div key={item.area} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
        <div className="flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98]"
          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            onClick={() => isLocked ? navigate("/assinatura") : handleSelectArea(item.area)}
            style={{ background: "hsla(40,60%,50%,0.12)", border: "1px solid hsla(40,60%,50%,0.15)" }}>
            <FilePenLine className="w-6 h-6" style={{ color: GOLD }} />
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => isLocked ? navigate("/assinatura") : handleSelectArea(item.area)}>
            <p className="text-sm font-medium text-white leading-tight line-clamp-2">{item.area}</p>
            <p className="text-xs" style={{ color: GOLD_DIM }}>
              {item.count.toLocaleString("pt-BR")} resumos{showTime ? ` · ${timeAgo(showTime)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={e => { e.stopPropagation(); toggleFav(item.area); }} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <Heart className={`w-4 h-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-white/40"}`} />
            </button>
            {isLocked ? (
              <div className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(40,90%,50%), hsl(40,70%,35%))", boxShadow: "0 0 10px hsla(40,90%,50%,0.5)", border: "1.5px solid hsl(40,80%,60%)" }}>
                <Crown className="w-3.5 h-3.5 text-white" />
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-white/70 cursor-pointer" onClick={() => handleSelectArea(item.area)} />
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSection = (title: string, items: typeof sorted, startIdx: number) => {
    if (!items.length) return null;
    return (
      <div key={title}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2 mt-4 first:mt-0" style={{ color: GOLD_DIM }}>{title}</p>
        <div className="space-y-2">{items.map((item, i) => renderAreaItem(item, startIdx + i))}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-20" style={{ background: "hsl(0 0% 10%)" }}>
      <DotPattern className="opacity-[0.03]" />

      <AnimatePresence mode="wait">
        <motion.div
          key={subView + (subView === "temas" ? selectedArea : "")}
          variants={slideVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="min-h-screen"
        >
          {/* ═══ TEMAS ═══ */}
          {subView === "temas" && selectedArea && (
            <TemasInline area={selectedArea} onBack={() => setSubView("areas")} />
          )}

          {/* ═══ AREAS ═══ */}
          {subView === "areas" && (
            <>
              <div className="relative overflow-hidden rounded-b-3xl mb-4" style={{ background: HERO_BG }}>
                <FilePenLine className="absolute -right-4 -bottom-4 text-white pointer-events-none" style={{ width: 110, height: 110, opacity: 0.05 }} />
                <div className="relative z-10 px-4 pt-3 pb-5">
                  <button onClick={() => setSubView("landing")} className="flex items-center gap-2 mb-3 group">
                    <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Resumos</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsla(40,60%,50%,0.15)", border: "1px solid hsla(40,60%,50%,0.25)" }}>
                      <FilePenLine className="w-6 h-6" style={{ color: GOLD }} />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white tracking-tight">Resumo de Conceitos</h1>
                      <p className="text-xs" style={{ color: GOLD_DIM }}>
                        <span className="font-semibold text-white/90"><NumberTicker value={areasData?.reduce((a, b) => a + b.count, 0) || 0} /></span> resumos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Area tabs */}
              <div className="px-4 mb-3">
                <div className="flex rounded-xl overflow-hidden" style={{ background: CARD_BG, border: "1px solid hsla(0,0%,100%,0.08)" }}>
                  {([
                    { key: "areas" as const, label: "Áreas", icon: Scale },
                    { key: "favoritos" as const, label: "Favoritos", icon: Star },
                    { key: "recentes" as const, label: "Recentes", icon: Clock },
                  ]).map(tab => {
                    const isActive = activeAreaTab === tab.key;
                    return (
                      <button key={tab.key} onClick={() => setActiveAreaTab(tab.key)}
                        className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-all"
                        style={{ background: isActive ? "hsla(40,60%,50%,0.15)" : "transparent", color: isActive ? GOLD : "hsla(0,0%,100%,0.4)" }}>
                        <tab.icon className="w-3.5 h-3.5" />{tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-4">
                {areasLoading ? (
                  <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-[60px] rounded-xl animate-pulse" style={{ background: CARD_BG }} />)}</div>
                ) : activeAreaTab === "areas" ? (
                  <div className="space-y-1">
                    {renderSection("Principais", principais, 0)}
                    {renderSection("Frequentes", frequentes, principais.length)}
                    {renderSection("Extras", extras, principais.length + frequentes.length)}
                  </div>
                ) : activeAreaTab === "favoritos" ? (
                  (() => {
                    const favAreas = sorted.filter(a => favs.includes(a.area));
                    return favAreas.length === 0 ? (
                      <div className="text-center py-12"><Heart className="w-8 h-8 mx-auto mb-3 opacity-30 text-white/30" /><p className="text-sm text-white/40">Nenhuma área favoritada</p></div>
                    ) : <div className="space-y-2">{favAreas.map((item, i) => renderAreaItem(item, i))}</div>;
                  })()
                ) : (
                  (() => {
                    const r = recentes.map(r => { const f = sorted.find(a => a.area === r.area); return f ? { ...f, timestamp: r.timestamp } : null; }).filter(Boolean) as any[];
                    return r.length === 0 ? (
                      <div className="text-center py-12"><Clock className="w-8 h-8 mx-auto mb-3 opacity-30 text-white/30" /><p className="text-sm text-white/40">Nenhum acesso recente</p></div>
                    ) : <div className="space-y-2">{r.map((item: any, i: number) => renderAreaItem(item, i, item.timestamp))}</div>;
                  })()
                )}
              </div>
            </>
          )}

          {/* ═══ LANDING ═══ */}
          {subView === "landing" && (
            <>
              <div className="relative overflow-hidden rounded-b-3xl mb-4" style={{ background: HERO_BG }}>
                <FilePenLine className="absolute -right-4 -bottom-4 text-white pointer-events-none" style={{ width: 110, height: 110, opacity: 0.05 }} />
                <div className="absolute top-4 right-8 w-2 h-2 rounded-full" style={{ background: GOLD, opacity: 0.3, boxShadow: `0 0 12px ${GOLD}` }} />
                <div className="relative z-10 px-4 pt-3 pb-5">
                  <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-3 group">
                    <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Início</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "hsla(40,60%,50%,0.15)", border: "1px solid hsla(40,60%,50%,0.25)" }}>
                      <FilePenLine className="w-6 h-6" style={{ color: GOLD }} />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white tracking-tight">Resumos Jurídicos</h1>
                      <p className="text-xs" style={{ color: GOLD_DIM }}>
                        <span className="font-semibold text-white/90"><NumberTicker value={totalResumos} /></span> disponíveis
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 space-y-4">
                {/* Tabs */}
                <div className="flex rounded-xl overflow-hidden" style={{ background: CARD_BG, border: "1px solid hsla(0,0%,100%,0.08)" }}>
                  {([
                    { key: "metodos" as const, label: "Métodos" },
                    { key: "grade" as const, label: "Grade", icon: Grid3X3 },
                    { key: "raio-x" as const, label: "Raio-X", icon: BarChart3 },
                    { key: "sobre" as const, label: "Sobre", icon: Info },
                  ]).map(tab => {
                    const isActive = landingTab === tab.key;
                    return (
                      <button key={tab.key} onClick={() => setLandingTab(tab.key)}
                        className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-all"
                        style={{ background: isActive ? "hsla(40,60%,50%,0.15)" : "transparent", color: isActive ? GOLD : "hsla(0,0%,100%,0.4)" }}>
                        {tab.icon && <tab.icon className="w-3 h-3" />}{tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Métodos */}
                {landingTab === "metodos" && (
                  <div className="space-y-2.5">
                    {METODOS.map((card, index) => {
                      const Icon = card.icon;
                      const count = counts[card.id] || 0;
                      const route = card.id === 1 ? undefined : card.id === 2 ? "/metodologias/cornell" : "/metodologias/feynman";
                      return (
                        <button key={card.id}
                          onClick={() => card.id === 1 ? setSubView("areas") : route && navigate(route)}
                          className="w-full flex items-stretch rounded-2xl overflow-hidden text-left hover:scale-[1.02] active:scale-[0.98] transition-all group"
                          style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, boxShadow: "0 4px 20px -4px rgba(0,0,0,0.4), inset 0 1px 0 hsla(40,60%,80%,0.06)", animation: `fade-in 0.4s ease-out forwards`, animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}>
                          <div className="w-[110px] shrink-0 relative overflow-hidden">
                            <img src={card.capa} alt={card.title} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/40" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                              <Icon className="w-8 h-8 text-white drop-shadow-lg relative z-10" />
                              <span className="text-[10px] font-bold text-white/90 bg-black/40 px-1.5 py-0.5 rounded-full relative z-10">2026</span>
                            </div>
                            {/* Shimmer */}
                            <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-20"
                                style={{ background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)", animation: "shinePratique 3s ease-in-out infinite", animationDelay: `${index * 400}ms` }} />
                            </div>
                          </div>
                          <div className="flex-1 p-4 flex items-center justify-between gap-2 min-h-[110px]">
                            <div className="flex-1">
                              <h3 className="font-bold text-sm text-white mb-1">{card.title}</h3>
                              <p className="text-xs mb-2" style={{ color: "hsla(0,0%,100%,0.5)" }}>{card.desc}</p>
                              {count > 0 && (
                                <div className="flex items-center gap-1"><BookOpen className="w-3 h-3" style={{ color: GOLD }} /><span className="text-xs font-medium" style={{ color: GOLD }}>{count.toLocaleString("pt-BR")} resumos</span></div>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/40 shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Grade */}
                {landingTab === "grade" && gradeData && (
                  <div className="space-y-3">
                    {gradeData.map(item => (
                      <details key={item.area} className="group rounded-xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors list-none">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsla(40,60%,50%,0.12)" }}>
                              <Scale className="w-4 h-4" style={{ color: GOLD }} />
                            </div>
                            <div><p className="text-sm font-semibold text-white truncate">{item.area}</p><p className="text-[11px]" style={{ color: GOLD_DIM }}>{item.count} temas</p></div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-white/40 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: "hsla(0,0%,100%,0.05)" }}>
                          <div className="flex flex-wrap gap-1.5">
                            {item.temas.map(tema => (
                              <span key={tema} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: "hsla(40,60%,50%,0.08)", color: "hsla(0,0%,100%,0.7)", border: `1px solid ${CARD_BORDER}` }}>{tema}</span>
                            ))}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}

                {/* Raio-X */}
                {landingTab === "raio-x" && (
                  <>
                    <div className="rounded-2xl p-4 space-y-1" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                      <p className="text-2xl font-bold text-white">{totalRaioX.toLocaleString("pt-BR")}</p>
                      <p className="text-xs" style={{ color: GOLD_DIM }}>resumos disponíveis no total</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: GOLD, background: "hsla(40,80%,55%,0.1)", border: "1px solid hsla(40,80%,55%,0.2)" }}>Atualizado 2026</span>
                    </div>
                    {raioXData && (
                      <div className="space-y-3">
                        {raioXData.map(r => {
                          const pct = Math.round((r.count / maxRaioX) * 100);
                          return (
                            <div key={r.area} className="space-y-1">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-white font-medium truncate max-w-[70%]">{r.area}</span>
                                <span style={{ color: GOLD_DIM }}>{r.count.toLocaleString("pt-BR")}</span>
                              </div>
                              <div className="w-full rounded-full h-2" style={{ background: "hsla(0,0%,100%,0.06)" }}>
                                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, hsl(40,80%,55%), hsl(40,60%,45%))` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Sobre */}
                {landingTab === "sobre" && (
                  <div className="space-y-4">
                    {SOBRE_METODOS.map(info => {
                      const SIcon = info.icon;
                      return (
                        <div key={info.titulo} className="rounded-2xl p-4 space-y-3" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsla(40,60%,50%,0.12)" }}>
                              <SIcon className="w-5 h-5" style={{ color: GOLD }} />
                            </div>
                            <h3 className="text-sm font-bold text-white">{info.titulo}</h3>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: "hsla(0,0%,100%,0.6)" }}>{info.descricao}</p>
                          <p className="text-xs leading-relaxed" style={{ color: GOLD_DIM }}>💡 {info.ideal}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ResumosHubRealeza;
