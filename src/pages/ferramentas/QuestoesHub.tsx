import { useState, useEffect, useMemo, startTransition } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Target, Search, ChevronRight, ClipboardList, CheckCircle2, Footprints, Link2, ArrowLeft, Scale, BookOpen, Gavel, Briefcase } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { DisciplinaCard } from "@/components/questoes/DisciplinaCard";
import { SugestoesReforco } from "@/components/questoes/SugestoesReforco";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { QuestoesSidebarNav } from "@/components/questoes/QuestoesSidebarNav";
import { useDeviceType } from "@/hooks/use-device-type";
import { QuestoesPersonalizar } from "@/components/questoes/QuestoesPersonalizar";
import { QuestoesMenuPrincipal } from "@/components/questoes/QuestoesMenuPrincipal";
import { QuestoesProgressoPage } from "@/components/questoes/QuestoesProgressoPage";
import { QuestoesCadernos } from "@/components/questoes/QuestoesCadernos";
import { QuestoesDiagnosticoPage } from "@/components/questoes/QuestoesDiagnosticoPage";
import { QuestoesReforcoTab } from "@/components/questoes/QuestoesReforcoTab";
import qSlide1 from "@/assets/questoes-slide-1.webp";
import qSlide2 from "@/assets/questoes-slide-2.webp";
import qSlide3 from "@/assets/questoes-slide-3.webp";
import qSlide4 from "@/assets/questoes-slide-4.webp";
import bgQuestoesCategorias from "@/assets/bg-questoes-categorias-mobile.webp";

const FREE_AREAS = ["Direito Constitucional", "Direito Administrativo"];

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

const getGradient = (area: string) => AREA_GRADIENTS[area] || "from-slate-500 to-slate-700";

const AREAS_ORDEM = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Processual do Trabalho",
  "Direito Tributário", "Direito Empresarial",
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
];

const PRINCIPAIS = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Tributário",
];

const FREQUENTES = [
  "Direito Empresarial", "Direito Processual do Trabalho",
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
];

const TABS_AREAS = [
  { id: "principais" as const, label: "Principais", icon: Scale },
  { id: "frequentes" as const, label: "Frequentes", icon: BookOpen },
  { id: "extras" as const, label: "Extras", icon: Gavel },
];

type AreaTabId = typeof TABS_AREAS[number]["id"];

const isInList = (area: string, list: string[]) => {
  const norm = area.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return list.some(o => o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm);
};

const AREAS_OCULTAS = ["Revisão Oab", "Revisao Oab", "Português", "Portugues", "Filosofia do Direito"];

const HERO_SLIDES = [
  { title: "Questões de Direito", subtitle: "Pratique com milhares de questões organizadas por área e tema", image: qSlide1 },
  { title: "Acompanhe seu Progresso", subtitle: "Estatísticas detalhadas de acertos e áreas para melhorar", image: qSlide2 },
  { title: "Ranking de Questões", subtitle: "Compete com outros estudantes e veja quem mais acerta", image: qSlide3 },
  { title: "Todas as Áreas do Direito", subtitle: "Penal, Civil, Constitucional, Trabalhista e muito mais", image: qSlide4 },
];

type CategoryType = null | "alternativas" | "sim-nao";
type SubView = "menu" | "praticar" | "progresso" | "reforco" | "cadernos" | "categorias" | "diagnostico";

// Whether a subview is an internal page (needs compact header)
const isInternalView = (v: SubView) => ["progresso", "reforco", "cadernos", "diagnostico"].includes(v);

interface UserStat {
  area: string;
  tema: string;
  acertos: number;
  erros: number;
  ultima_resposta: string | null;
}

const QuestoesHub = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDesktop } = useDeviceType();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { areas, totalQuestoes, isLoading } = useQuestoesAreasCache();
  const [slideIndex, setSlideIndex] = useState(0);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [activeAreaTab, setActiveAreaTab] = useState<AreaTabId>("principais");
  const [showSearch, setShowSearch] = useState(searchParams.get("tab") === "pesquisar");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("alternativas");
  const [subView, setSubView] = useState<SubView>("menu");
  const [simNaoCount, setSimNaoCount] = useState(0);
  const [correspondenciaCount, setCorrespondenciaCount] = useState(0);

  // Fetch real question counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: snRows } = await supabase
          .from('gamificacao_sim_nao_cache')
          .select('*', { count: 'exact', head: true })
          .like('materia', 'questoes-sn:%');
        if (snRows) setSimNaoCount(snRows * 10);

        const { count: corrRows } = await supabase
          .from('gamificacao_sim_nao_cache')
          .select('*', { count: 'exact', head: true })
          .like('materia', 'questoes-corresp:%');
        if (corrRows) setCorrespondenciaCount(corrRows * 5);
      } catch (e) {
        console.warn('Erro ao buscar contagens:', e);
      }
    };
    fetchCounts();
  }, []);

  // Carousel auto-advance
  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % HERO_SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Fetch user stats
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_questoes_stats")
      .select("area, tema, acertos, erros, ultima_resposta")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setUserStats(data.map((r: any) => ({
            area: r.area,
            tema: r.tema || 'Geral',
            acertos: r.acertos || 0,
            erros: r.erros || 0,
            ultima_resposta: r.ultima_resposta,
          })));
        }
      });
  }, [user]);

  const isOculta = (area: string) => {
    const n = area.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return AREAS_OCULTAS.some(o => o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === n);
  };

  const sorted = useMemo(() => {
    if (!areas) return [];
    return [...areas].filter(a => !isOculta(a.area)).sort((a, b) => {
      const iA = AREAS_ORDEM.indexOf(a.area);
      const iB = AREAS_ORDEM.indexOf(b.area);
      return (iA >= 0 ? iA : 999) - (iB >= 0 ? iB : 999);
    });
  }, [areas]);

  // Area respondidas count map
  const areaRespondidasMap = useMemo(() => {
    const map = new Map<string, number>();
    userStats.forEach(s => {
      const current = map.get(s.area) || 0;
      map.set(s.area, current + s.acertos + s.erros);
    });
    return map;
  }, [userStats]);

  const areaPctMap = useMemo(() => {
    const map = new Map<string, number>();
    sorted.forEach(areaData => {
      const respondidas = areaRespondidasMap.get(areaData.area) || 0;
      if (respondidas === 0 || areaData.totalQuestoes === 0) { map.set(areaData.area, 0); return; }
      const progresso = (respondidas / areaData.totalQuestoes) * 100;
      map.set(areaData.area, progresso < 1 ? parseFloat(progresso.toFixed(1)) : Math.round(progresso));
    });
    return map;
  }, [sorted, areaRespondidasMap]);

  const getAreaPct = (area: string): number => areaPctMap.get(area) || 0;
  const getAreaRespondidas = (area: string): number => areaRespondidasMap.get(area) || 0;

  // Sugestões de reforço
  const sugestoes = userStats
    .filter(s => {
      const total = s.acertos + s.erros;
      if (total < 5) return false;
      const taxa = Math.round((s.acertos / total) * 100);
      if (taxa < 50) return true;
      if (s.ultima_resposta) {
        const diff = Date.now() - new Date(s.ultima_resposta).getTime();
        if (diff > 7 * 24 * 60 * 60 * 1000) return true;
      }
      return false;
    })
    .map(s => {
      const total = s.acertos + s.erros;
      const taxa = Math.round((s.acertos / total) * 100);
      return {
        area: s.area,
        tema: s.tema,
        tipo: (taxa < 50 ? "prioridade" : "revisao") as "prioridade" | "revisao",
        taxa,
        totalRespondidas: total,
      };
    });

  // Global stats for menu
  const globalAcertos = userStats.reduce((sum, s) => sum + s.acertos, 0);
  const globalErros = userStats.reduce((sum, s) => sum + s.erros, 0);
  const globalTotal = globalAcertos + globalErros;
  const globalTaxa = globalTotal > 0 ? Math.round((globalAcertos / globalTotal) * 100) : 0;

  // Filtered for search
  const filteredSorted = searchQuery
    ? sorted.filter(a => a.area.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')))
    : sorted;

  // Tab-based area filtering
  const principais = sorted.filter(a => isInList(a.area, PRINCIPAIS));
  const frequentes = sorted.filter(a => isInList(a.area, FREQUENTES));
  const extras = sorted.filter(a => !isInList(a.area, PRINCIPAIS) && !isInList(a.area, FREQUENTES));
  const currentTabAreas = activeAreaTab === "principais" ? principais : activeAreaTab === "frequentes" ? frequentes : extras;

  const renderDisciplinaCard = (item: typeof sorted[0]) => {
    return (
      <DisciplinaCard key={item.area} area={item.area} gradient={getGradient(item.area)}
        totalQuestoes={item.totalQuestoes} progress={getAreaPct(item.area)}
        respondidas={getAreaRespondidas(item.area)} />
    );
  };

  const renderCategoryGroup = (title: string, items: typeof sorted) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">{title}</p>
        <div className="grid grid-cols-2 gap-3">
          {items.map(renderDisciplinaCard)}
        </div>
      </div>
    );
  };

  const handlePesquisar = () => {
    setShowSearch(true);
    setSubView("praticar");
  };

  const handleBack = () => {
    if (subView === "praticar") {
      setSubView("categorias");
    } else {
      setSubView("menu");
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(0 0% 12%)" }}>
      {isDesktop && subView === "praticar" && (
        <QuestoesSidebarNav onPesquisar={handlePesquisar} onDiagnostico={() => setSubView("diagnostico")} />
      )}
      <div className={isDesktop ? "flex-1 min-w-0 pb-4" : "w-full pb-6"}>

      {/* Header - styled banner when on category selection (admin praticar flow) */}
      {subView === "categorias" && (
        <div className="relative overflow-hidden rounded-b-3xl mb-2" style={{ background: "linear-gradient(135deg, hsl(15 40% 28%), hsl(10 35% 20%))" }}>
          <div className="absolute inset-0 opacity-10">
            <Target className="absolute -right-6 -bottom-6 w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 px-4 pt-4 pb-5">
            <button onClick={() => setSubView("menu")} className="flex items-center gap-1 text-white/70 text-xs mb-3 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "hsla(15, 40%, 40%, 0.5)", border: "1px solid hsla(15, 40%, 50%, 0.3)" }}>
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Questões</h1>
                <p className="text-xs text-white/60">
                  {(totalQuestoes + simNaoCount + correspondenciaCount).toLocaleString('pt-BR')} disponíveis • {globalAcertos.toLocaleString('pt-BR')} corretas
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact header for internal subviews */}
      {isInternalView(subView) && (
        <div
          className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
          style={{
            background: "linear-gradient(145deg, hsl(8 65% 42%), hsl(8 55% 30%))",
            boxShadow: "0 4px 16px hsla(8, 65%, 35%, 0.3)",
          }}
        >
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <h1 className="text-sm font-bold text-white">Questões</h1>
        </div>
      )}

      {/* Full header banner for menu and praticar — includes back button */}
      {subView !== "categorias" && !isInternalView(subView) && (
        <div
          className="relative overflow-hidden rounded-b-3xl mb-3"
          style={{
            background: "linear-gradient(145deg, hsl(8 65% 42%), hsl(8 55% 30%), hsl(8 40% 20%))",
          }}
        >
          <Target
            className="absolute -right-3 -bottom-3 text-white pointer-events-none"
            style={{ width: 100, height: 100, opacity: 0.06 }}
          />

          <div className="relative z-10 px-4 pt-3 pb-5">
            {/* Back to home */}
            <button
              onClick={() => {
                if (subView === "praticar") {
                  if (!isAdmin) {
                    navigate("/");
                  } else {
                    handleBack();
                  }
                } else {
                  navigate("/");
                }
              }}
              className="flex items-center gap-2 mb-3 group"
            >
              <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
              <div className="flex flex-col items-start">
                <span className="text-[9px] text-white/50 uppercase tracking-wide">Voltar</span>
                <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                  {subView === "praticar" && isAdmin ? "Menu" : "Início"}
                </span>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "hsla(8, 60%, 50%, 0.35)",
                  border: "1px solid hsla(8, 60%, 60%, 0.3)",
                }}
              >
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Questões</h1>
                <p className="text-xs text-white/55">
                  <span className="text-white/90 font-semibold">{totalQuestoes.toLocaleString('pt-BR')}</span> disponíveis
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection (Admin only) */}
      {subView === "categorias" && (
        <div className="relative px-4 pb-4">
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <img src={bgQuestoesCategorias} alt="" className="w-full h-full object-cover opacity-15" />
            <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-[hsl(0_0%_12%)] via-[hsl(0_0%_12%)]/80 to-transparent" />
          </div>

          <div className="relative py-6 px-2">
            <div className="absolute left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2">
              <div className="w-full h-full bg-gradient-to-b from-red-500/30 to-emerald-500/20" />
              <motion.div
                className="absolute top-0 left-0 w-full h-12 bg-gradient-to-b from-transparent via-white/60 to-transparent rounded-full"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            {/* Item 1 - Left (Alternativas) */}
            <div className="relative flex items-center mb-10">
              <motion.button
                onClick={() => { setSelectedCategory("alternativas"); setSubView("praticar"); }}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                className="group w-[calc(50%-24px)] p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[#b8334a] to-[#6e1a2c] text-left relative overflow-hidden border border-white/[0.06] active:scale-95 transition-transform flex flex-col items-start justify-center gap-2.5"
                style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
              >
                <ClipboardList
                  className="absolute -bottom-2 -right-2 w-[60px] h-[60px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
                  strokeWidth={1.2}
                  style={{ opacity: 0.3, color: 'rgba(255,255,255,0.35)' }}
                />
                <div className="bg-white/15 p-3 rounded-xl relative z-[1]">
                  <ClipboardList className="w-7 h-7 text-white" />
                </div>
                <div className="text-left relative z-[1] w-full flex items-end justify-between">
                  <div>
                    <span className="text-[15px] sm:text-base font-bold text-white block leading-tight">Alternativas</span>
                    <span className="text-[11px] sm:text-xs text-white/60 block">Múltipla escolha</span>
                    <span className="text-[10px] text-white/50 block mt-0.5">{totalQuestoes.toLocaleString('pt-BR')} questões</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #f9a8d480, transparent)' }} />
              </motion.button>
              
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-400 to-red-600"
                  style={{ boxShadow: "0 0 16px rgba(239, 68, 68, 0.5)" }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Item 2 - Right (Sim ou Não) */}
            <div className="relative flex items-center justify-end">
              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-400 to-green-600"
                  style={{ boxShadow: "0 0 16px rgba(52, 211, 153, 0.5)" }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </div>
              
              <motion.button
                onClick={() => startTransition(() => navigate("/ferramentas/questoes/sim-nao"))}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
                className="group w-[calc(50%-24px)] p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[#0f766e] to-[#064e3b] text-left relative overflow-hidden border border-white/[0.06] active:scale-95 transition-transform flex flex-col items-start justify-center gap-2.5"
                style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
              >
                <CheckCircle2
                  className="absolute -bottom-2 -right-2 w-[60px] h-[60px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
                  strokeWidth={1.2}
                  style={{ opacity: 0.3, color: 'rgba(255,255,255,0.35)' }}
                />
                <div className="bg-white/15 p-3 rounded-xl relative z-[1]">
                  <CheckCircle2 className="w-7 h-7 text-white" />
                </div>
                <div className="text-left relative z-[1] w-full flex items-end justify-between">
                  <div>
                    <span className="text-[15px] sm:text-base font-bold text-white block leading-tight">Sim ou Não</span>
                    <span className="text-[11px] sm:text-xs text-white/60 block">Verdadeiro ou Falso</span>
                    <span className="text-[10px] text-white/50 block mt-0.5">{simNaoCount > 0 ? simNaoCount.toLocaleString('pt-BR') : '...'} questões</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #5eead480, transparent)' }} />
              </motion.button>
            </div>

            {/* Item 3 - Left (Caso Prático) - Admin only */}
            {isAdmin && (
              <div className="relative flex items-center mt-10">
                <motion.button
                  onClick={() => startTransition(() => navigate("/ferramentas/questoes/caso-pratico"))}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                  className="group w-[calc(50%-24px)] p-3 sm:p-4 rounded-xl bg-gradient-to-br from-[#1d4ed8] to-[#1e3a5f] text-left relative overflow-hidden border border-white/[0.06] active:scale-95 transition-transform flex flex-col items-start justify-center gap-2.5"
                  style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
                >
                  <Briefcase
                    className="absolute -bottom-2 -right-2 w-[60px] h-[60px] pointer-events-none rotate-[-12deg] blur-[0.3px]"
                    strokeWidth={1.2}
                    style={{ opacity: 0.3, color: 'rgba(255,255,255,0.35)' }}
                  />
                  <div className="bg-white/15 p-3 rounded-xl relative z-[1]">
                    <Briefcase className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left relative z-[1] w-full flex items-end justify-between">
                    <div>
                      <span className="text-[15px] sm:text-base font-bold text-white block leading-tight">Caso Prático</span>
                      <span className="text-[11px] sm:text-xs text-white/60 block">Cenários jurídicos</span>
                      <span className="text-[10px] text-white/50 block mt-0.5">Admin</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #93c5fd80, transparent)' }} />
                </motion.button>

                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-400 to-indigo-600"
                    style={{ boxShadow: "0 0 16px rgba(99, 102, 241, 0.5)" }}
                  >
                    <Footprints className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show content only when category is selected */}
      {selectedCategory === "alternativas" && (
        <>
          {/* Sub-view: Menu Principal (4 cards) */}
           {subView === "menu" && (
            <QuestoesMenuPrincipal
              totalRespondidas={globalTotal}
              totalAcertos={globalAcertos}
              taxaGlobal={globalTaxa}
              temasReforco={sugestoes.filter(s => s.tipo === "prioridade").length}
              totalQuestoes={totalQuestoes}
              userStats={userStats}
              isDesktop={isDesktop}
              onPraticar={() => setSubView("categorias")}
              onProgresso={() => setSubView("progresso")}
              onReforco={() => setSubView("reforco")}
              onCadernos={() => setSubView("cadernos")}
              onDiagnostico={() => setSubView("diagnostico")}
            />
          )}

          {/* Sub-view: Progresso */}
          {subView === "progresso" && (
            <div className="animate-fade-in">
              <QuestoesProgressoPage onBack={() => setSubView("menu")} />
            </div>
          )}

          {/* Sub-view: Reforço */}
          {subView === "reforco" && (
            <div className="pb-6 animate-fade-in">
              <QuestoesReforcoTab sugestoes={sugestoes} onPraticar={() => setSubView(null)} />
            </div>
          )}

          {/* Sub-view: Cadernos */}
          {subView === "cadernos" && (
            <div className="animate-fade-in">
              <QuestoesCadernos onBack={() => setSubView("menu")} />
            </div>
          )}

          {/* Sub-view: Diagnóstico Completo */}
          {subView === "diagnostico" && (
            <div className="animate-fade-in">
              <QuestoesDiagnosticoPage onBack={() => setSubView("menu")} />
            </div>
          )}

          {/* Sub-view: Praticar (disciplinas) */}
          {subView === "praticar" && (
            <>
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

              {/* Search bar */}
              {showSearch && (
                <div className="px-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar disciplina..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* Tab Menu - Principais / Frequentes / Extras */}
              <div className="px-4 pb-4">
                <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
                  {TABS_AREAS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeAreaTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveAreaTab(tab.id)}
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

              {/* Disciplinas Grid */}
              <div className="px-4 mb-5">
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
                    ))}
                  </div>
                ) : showSearch && searchQuery ? (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredSorted.map(renderDisciplinaCard)}
                    {filteredSorted.length === 0 && (
                      <p className="col-span-2 text-center text-sm text-muted-foreground py-8">Nenhuma disciplina encontrada</p>
                    )}
                  </div>
                ) : currentTabAreas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma área nesta categoria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {currentTabAreas.map(renderDisciplinaCard)}
                  </div>
                )}
              </div>

              {/* Sugestões de Reforço inline */}
              {user && sugestoes.length > 0 && !showSearch && <SugestoesReforco sugestoes={sugestoes.slice(0, 4)} />}
            </>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default QuestoesHub;
