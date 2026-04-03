import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ChevronRight, PenLine, BarChart3, BookOpen, FileText, Scale, Gavel } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { supabase } from "@/integrations/supabase/client";
import { getAreaGradient } from "@/lib/flashcardsAreaColors";
import heroFlashcards from "@/assets/hero-flashcards.webp";
import themisEstudos from "@/assets/themis-estudos-background.webp";
import heroResumos from "@/assets/hero-resumos.webp";
import heroVideoaulas from "@/assets/hero-videoaulas.webp";

const AREAS_OCULTAS = [
  "Revisão Oab", "Revisão OAB", "Revisao Oab",
  "Português", "Portugues",
  "Pesquisa Científica", "Pesquisa Cientifica",
  "Legislação Penal", "Legislacao Penal",
];

const isAreaOculta = (area: string) => {
  const norm = area.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return AREAS_OCULTAS.some(o => o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm);
};

const AREAS_ORDEM = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Processual do Trabalho",
  "Direito Tributário", "Direito Empresarial",
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
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

const isInList = (area: string, list: string[]) => {
  const norm = area.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return list.some(o => o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm);
};

const HERO_SLIDES = [
  { title: "Lacunas Jurídicas", subtitle: "Complete frases com o termo jurídico correto", image: heroFlashcards },
  { title: "Memorize com Eficiência", subtitle: "Escolha a palavra certa e fixe o conteúdo", image: themisEstudos },
  { title: "Todas as Áreas do Direito", subtitle: "Penal, Civil, Constitucional, Trabalhista e muito mais", image: heroResumos },
  { title: "Aprenda na Prática", subtitle: "Exercícios de preenchimento de lacunas", image: heroVideoaulas },
];

const TABS = [
  { id: "principais" as const, label: "Principais", icon: Scale },
  { id: "frequentes" as const, label: "Frequentes", icon: BookOpen },
  { id: "extras" as const, label: "Extras", icon: Gavel },
];

type TabId = "principais" | "frequentes" | "extras";

interface AreaStat {
  area: string;
  total_lacunas: number;
  total_temas: number;
}

const FlashcardsLacunasAreas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [areas, setAreas] = useState<AreaStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("principais");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/flashcards/areas", { replace: true });
      return;
    }
    const load = async () => {
      const { data, error } = await supabase.rpc('get_lacunas_areas_stats');
      if (!error && data) {
        setAreas(data.filter((a: AreaStat) => !isAreaOculta(a.area)));
      }
      setIsLoading(false);
    };
    load();
  }, [isAdmin, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const sorted = [...areas].sort((a, b) => {
    const idxA = AREAS_ORDEM.indexOf(a.area);
    const idxB = AREAS_ORDEM.indexOf(b.area);
    return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
  });

  const totalLacunas = areas.reduce((s, a) => s + a.total_lacunas, 0);

  const renderCard = (item: AreaStat, idx: number, gradientOverride?: string) => {
    const gradient = gradientOverride || getAreaGradient(item.area);
    return (
      <button
        key={item.area}
        onClick={() => navigate(`/flashcards/lacunas/temas?area=${encodeURIComponent(item.area)}`)}
        className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${gradient} shadow-lg h-[100px] animate-fade-in`}
        style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}
      >
        <div className="absolute -right-3 -bottom-3 opacity-20">
          <PenLine className="w-20 h-20 text-white" />
        </div>
        <div className="relative z-10 bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
          <PenLine className="w-5 h-5 text-white" />
        </div>
        <h3 className="relative z-10 font-semibold text-white text-sm leading-tight pr-6">
          {item.area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '')}
        </h3>
        {item.total_lacunas > 0 && (
          <span className="absolute top-3 right-3 text-[10px] text-white/60 font-medium">
            {item.total_lacunas}
          </span>
        )}
        <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </button>
    );
  };

  const renderCategoriaSection = (titulo: string, subtitulo: string, items: AreaStat[], gradientOverride?: string) => {
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-red-400" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Lacunas</h1>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-400 font-semibold">{totalLacunas.toLocaleString('pt-BR')}</span> disponíveis
            </p>
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
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
                className={`rounded-full transition-all ${i === slideIndex ? "w-5 h-1.5 bg-red-400" : "w-1.5 h-1.5 bg-white/40"}`}
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
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[100px] rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : !areas || areas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma área encontrada</p>
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
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[100px] rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            renderCategoriaSection("Frequentes", "Frequentes em concursos e OAB", sorted.filter(a => isInList(a.area, ALTA_INCIDENCIA)), "from-indigo-500 to-indigo-700")
          )}
        </div>
      )}

      {activeTab === "extras" && (
        <div className="px-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[100px] rounded-2xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            renderCategoriaSection("Extras", "Aprofunde seus conhecimentos", sorted.filter(a => !isInList(a.area, MAIS_COBRADAS) && !isInList(a.area, ALTA_INCIDENCIA)), "from-slate-500 to-slate-700")
          )}
        </div>
      )}
    </div>
  );
};

export default FlashcardsLacunasAreas;
