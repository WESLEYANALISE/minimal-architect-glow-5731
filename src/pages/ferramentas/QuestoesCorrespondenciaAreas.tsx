import { useEffect, useMemo, useState, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link2, Target, Zap, Brain, ClipboardList, Settings2, ShieldCheck, Search, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { Scale, Gavel, Building2, Shield, BookOpen, Briefcase, Landmark, Users, Hammer, Leaf, ShoppingCart, Vote, Heart, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import qSlide1 from "@/assets/questoes-slide-1.webp";
import qSlide2 from "@/assets/questoes-slide-2.webp";
import qSlide3 from "@/assets/questoes-slide-3.webp";
import qSlide4 from "@/assets/questoes-slide-4.webp";

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
  "Direito Ambiental": "from-lime-600 to-lime-800",
  "Direito do Consumidor": "from-yellow-600 to-yellow-800",
  "Direito Eleitoral": "from-sky-600 to-sky-800",
  "Direito Previdenciário": "from-fuchsia-600 to-fuchsia-800",
  "Direito Processual do Trabalho": "from-orange-600 to-orange-800",
};

const AREAS_ORDEM = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Processual do Trabalho",
  "Direito Tributário", "Direito Empresarial",
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
];

const MAIS_COBRADAS = AREAS_ORDEM.slice(0, 10);
const ALTA_INCIDENCIA = [
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
  "Direito Financeiro", "Teoria e Filosofia do Direito",
];

const AREA_ICONS: Record<string, LucideIcon> = {
  "Direito Constitucional": Landmark,
  "Direito Administrativo": Building2,
  "Direito Penal": Gavel,
  "Direito Processual Penal": Shield,
  "Direito Civil": Scale,
  "Direito Processual Civil": BookOpen,
  "Direito do Trabalho": Hammer,
  "Direito Processual do Trabalho": Hammer,
  "Direito Tributário": Briefcase,
  "Direito Empresarial": Briefcase,
  "Direitos Humanos": Users,
  "Direito Ambiental": Leaf,
  "Direito do Consumidor": ShoppingCart,
  "Direito Eleitoral": Vote,
  "Direito Previdenciário": Heart,
  "Direito Internacional": Globe,
};

const AREAS_OCULTAS = ["Revisão Oab", "Revisao Oab", "Português", "Portugues", "Filosofia do Direito"];

const HERO_SLIDES = [
  { title: "Correspondência Jurídica", subtitle: "Associe conceitos às definições corretas e domine a matéria", image: qSlide1 },
  { title: "5 Pares por Subtema", subtitle: "Questões organizadas por tema com feedback imediato", image: qSlide2 },
  { title: "Aprendizado Ativo", subtitle: "Método comprovado para fixação de conceitos jurídicos", image: qSlide3 },
  { title: "Todas as Disciplinas", subtitle: "Penal, Civil, Constitucional, Trabalhista e muito mais", image: qSlide4 },
];

type TabType = "principais" | "frequentes" | "extras";

const QuestoesCorrespondenciaAreas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { areas, isLoading } = useQuestoesAreasCache();
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>("principais");
  const [showAllDisciplinas] = useState(true);

  useEffect(() => {
    if (user && !isAdmin) navigate("/ferramentas/questoes", { replace: true });
  }, [user, isAdmin]);

  // Auto-advance carousel
  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % HERO_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const isOculta = (area: string) => {
    const n = area.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return AREAS_OCULTAS.some(o => o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === n);
  };

  const sorted = useMemo(() => {
    if (!areas) return [];
    return [...areas]
      .filter((a) => !isOculta(a.area))
      .sort((a, b) => {
        const iA = AREAS_ORDEM.indexOf(a.area);
        const iB = AREAS_ORDEM.indexOf(b.area);
        return (iA >= 0 ? iA : 999) - (iB >= 0 ? iB : 999);
      });
  }, [areas]);

  const renderCategoryGroup = (title: string, items: typeof sorted) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">{title}</p>
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => {
            const Icon = AREA_ICONS[item.area] || Target;
            const shortName = item.area
              .replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '')
              .replace(/^Direitos\s+/i, '');
            return (
              <button
                key={item.area}
                onClick={() => startTransition(() => navigate(`/ferramentas/questoes/correspondencia/temas?area=${encodeURIComponent(item.area)}`))}
                className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${AREA_GRADIENTS[item.area] || "from-slate-500 to-slate-700"} shadow-lg h-[100px] animate-fade-in`}
              >
                <div className="absolute -right-3 -bottom-3 opacity-20" style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }}>
                  <Icon className="w-20 h-20 text-white" style={{ filter: "drop-shadow(0 -2px 4px rgba(255,255,255,0.4))" }} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-full" style={{ maskImage: "linear-gradient(135deg, white 20%, transparent 60%)", WebkitMaskImage: "linear-gradient(135deg, white 20%, transparent 60%)" }} />
                </div>
                <div className="relative z-10 bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="relative z-10 font-semibold text-white text-sm leading-tight pr-12">{shortName}</h3>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "principais", label: "Principais", icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { key: "frequentes", label: "Frequentes", icon: <Brain className="w-3.5 h-3.5" /> },
    { key: "extras", label: "Extras", icon: <Target className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ferramentas/questoes")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-500" />
            Correspondência
          </h1>
          <p className="text-xs text-muted-foreground">Escolha uma disciplina</p>
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="px-4 pb-3">
        <div className="relative overflow-hidden rounded-2xl">
          <AnimatePresence mode="wait">
            <motion.div key={slideIndex}
              initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.35 }}
              className="relative min-h-[140px] overflow-hidden rounded-2xl">
              <img src={HERO_SLIDES[slideIndex].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 p-5 flex flex-col justify-end h-full min-h-[140px]">
                <h2 className="text-base font-bold text-white leading-tight mb-1">{HERO_SLIDES[slideIndex].title}</h2>
                <p className="text-xs text-white/80 leading-relaxed">{HERO_SLIDES[slideIndex].subtitle}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlideIndex(i)}
                className={`rounded-full transition-all ${i === slideIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div className="px-4 mb-3">
        <div className="flex gap-1 p-1 rounded-xl bg-card border border-border/50">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Principais */}
      {activeTab === "principais" && (
        <div className="px-4 mb-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : (
            renderCategoryGroup("Principais", sorted.filter(a => MAIS_COBRADAS.includes(a.area)))
          )}
        </div>
      )}

      {/* Tab: Frequentes */}
      {activeTab === "frequentes" && (
        <div className="px-4 mb-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : (
            renderCategoryGroup("Frequentes", sorted.filter(a => ALTA_INCIDENCIA.includes(a.area)))
          )}
        </div>
      )}

      {/* Tab: Extras */}
      {activeTab === "extras" && (
        <div className="px-4 mb-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : (
            renderCategoryGroup("Extras", sorted.filter(a => !MAIS_COBRADAS.includes(a.area) && !ALTA_INCIDENCIA.includes(a.area)))
          )}
        </div>
      )}
    </div>
  );
};

export default QuestoesCorrespondenciaAreas;
