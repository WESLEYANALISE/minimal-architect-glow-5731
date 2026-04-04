import { useState, useEffect, useMemo, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { Target, ArrowLeft, Search, Scale, BookOpen, Gavel, ChevronRight, CheckCircle2, AlertCircle, ListOrdered, Heart, BarChart3, ArrowUp, FileText, Crown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { DisciplinaCardRealeza } from "@/components/questoes/DisciplinaCardRealeza";
import { QuestoesMenuRealeza } from "@/components/questoes/QuestoesMenuRealeza";
import { QuestoesProgressoPage } from "@/components/questoes/QuestoesProgressoPage";
import { QuestoesCadernos } from "@/components/questoes/QuestoesCadernos";
import { QuestoesReforcoTab } from "@/components/questoes/QuestoesReforcoTab";
import { QuestoesDiagnosticoPage } from "@/components/questoes/QuestoesDiagnosticoPage";
import { useQuestoesTemas } from "@/hooks/useQuestoesTemas";
import { DotPattern } from "@/components/ui/dot-pattern";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ADMIN_EMAIL } from "@/lib/adminConfig";

// Eagerly preload QuestoesResolver chunk so navigation is instant
const resolverPreload = import("./QuestoesResolver");

const FREE_AREAS = ["Direito Constitucional", "Direito Administrativo"];

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
type SubView = "menu" | "praticar" | "temas" | "progresso" | "reforco" | "cadernos" | "diagnostico";

const AREAS_OCULTAS = ["Revisão Oab", "Revisao Oab", "Português", "Portugues", "Filosofia do Direito"];

const norm = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const isInList = (area: string, list: string[]) => list.some(o => norm(o) === norm(area));

interface UserStat {
  area: string;
  tema: string;
  acertos: number;
  erros: number;
  ultima_resposta: string | null;
}

// Slide variants for subview transitions
const slideVariants = {
  enter: { x: "100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-30%", opacity: 0 },
};

// Inline Temas component
const TemasInline = ({ area, onBack }: { area: string; onBack: () => void }) => {
  const navigate = useNavigate();
  const { temas, isLoading } = useQuestoesTemas(area);
  const [searchQuery, setSearchQuery] = useState("");

  const shortArea = area
    .replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '')
    .replace(/^Direitos\s+/i, '');

  const filtered = searchQuery
    ? temas.filter(t => norm(t.tema).includes(norm(searchQuery)))
    : temas;

  const handleSelect = (tema: string) => {
    // Ensure resolver chunk is loaded before navigating
    resolverPreload.then(() => {
      startTransition(() => {
        navigate(`/ferramentas/questoes/resolver?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}`);
      });
    }).catch(() => {
      startTransition(() => {
        navigate(`/ferramentas/questoes/resolver?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}`);
      });
    });
  };

  return (
    <>
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-b-3xl mb-4"
        style={{
          background: "linear-gradient(145deg, hsl(345 65% 30%), hsl(350 50% 22%), hsl(350 40% 15%))",
        }}
      >
        <Target className="absolute -right-4 -bottom-4 text-white pointer-events-none" style={{ width: 90, height: 90, opacity: 0.05 }} />

        <div className="relative z-10 px-4 pt-3 pb-5">
          <button onClick={onBack} className="flex items-center gap-2 mb-3 group">
            <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Disciplinas</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "hsla(40, 60%, 50%, 0.15)", border: "1px solid hsla(40, 60%, 50%, 0.25)" }}
            >
              <Target className="w-5 h-5" style={{ color: "hsl(40, 80%, 55%)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">{shortArea}</h1>
              <p className="text-xs" style={{ color: "hsla(40, 60%, 70%, 0.7)" }}>
                {temas.length} temas disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <input
          type="text"
          placeholder="Buscar tema..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
          style={{ background: "hsla(0, 0%, 100%, 0.05)", border: "1px solid hsla(40, 60%, 50%, 0.12)" }}
        />
      </div>

      {/* Temas list */}
      <div className="px-4 pb-8 space-y-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "hsla(0, 0%, 100%, 0.04)" }} />
          ))
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: "hsla(0, 0%, 100%, 0.4)" }}>Nenhum tema encontrado</p>
        ) : (
          filtered.map((tema, i) => (
            <motion.button
              key={tema.tema}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleSelect(tema.tema)}
              className="w-full group flex items-center gap-3 rounded-xl p-3.5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "hsla(0, 0%, 100%, 0.04)", border: "1px solid hsla(40, 60%, 50%, 0.08)" }}
            >
              <div className="shrink-0">
                {tema.temQuestoes ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color: "hsl(145, 60%, 45%)" }} />
                ) : tema.parcial ? (
                  <AlertCircle className="w-5 h-5" style={{ color: "hsl(40, 80%, 55%)" }} />
                ) : (
                  <div className="w-5 h-5 rounded-full" style={{ border: "2px solid hsla(0, 0%, 100%, 0.15)" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{tema.tema}</h3>
                <p className="text-[10px] mt-0.5" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>
                  {tema.totalQuestoes > 0
                    ? `${tema.totalQuestoes} questões • ${tema.subtemasGerados}/${tema.totalSubtemas} subtemas`
                    : `${tema.totalSubtemas} subtemas`
                  }
                </p>
              </div>
              {tema.progressoPercent > 0 && (
                <span className="text-[11px] font-semibold shrink-0" style={{ color: "hsl(40, 80%, 55%)" }}>
                  {tema.progressoPercent}%
                </span>
              )}
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "hsla(0, 0%, 100%, 0.15)" }} />
            </motion.button>
          ))
        )}
      </div>
    </>
  );
};

const QuestoesHubNovo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { areas, totalQuestoes, isLoading } = useQuestoesAreasCache();
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [activeAreaTab, setActiveAreaTab] = useState<AreaTabId>("principais");
  const [searchQuery, setSearchQuery] = useState("");
  const [subView, setSubView] = useState<SubView>("menu");
  const [selectedArea, setSelectedArea] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_questoes_stats")
      .select("area, tema, acertos, erros, ultima_resposta")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          setUserStats(data.map((r: any) => ({
            area: r.area, tema: r.tema || 'Geral',
            acertos: r.acertos || 0, erros: r.erros || 0,
            ultima_resposta: r.ultima_resposta,
          })));
        }
      });
  }, [user]);

  const sorted = useMemo(() => {
    if (!areas) return [];
    return [...areas]
      .filter(a => !AREAS_OCULTAS.some(o => norm(o) === norm(a.area)))
      .sort((a, b) => {
        const iA = AREAS_ORDEM.indexOf(a.area);
        const iB = AREAS_ORDEM.indexOf(b.area);
        return (iA >= 0 ? iA : 999) - (iB >= 0 ? iB : 999);
      });
  }, [areas]);

  const areaRespondidasMap = useMemo(() => {
    const map = new Map<string, number>();
    userStats.forEach(s => map.set(s.area, (map.get(s.area) || 0) + s.acertos + s.erros));
    return map;
  }, [userStats]);

  const areaPctMap = useMemo(() => {
    const map = new Map<string, number>();
    sorted.forEach(a => {
      const r = areaRespondidasMap.get(a.area) || 0;
      if (r === 0 || a.totalQuestoes === 0) { map.set(a.area, 0); return; }
      const p = (r / a.totalQuestoes) * 100;
      map.set(a.area, p < 1 ? parseFloat(p.toFixed(1)) : Math.round(p));
    });
    return map;
  }, [sorted, areaRespondidasMap]);

  const globalAcertos = userStats.reduce((s, u) => s + u.acertos, 0);
  const globalErros = userStats.reduce((s, u) => s + u.erros, 0);
  const globalTotal = globalAcertos + globalErros;
  const globalTaxa = globalTotal > 0 ? Math.round((globalAcertos / globalTotal) * 100) : 0;

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
      return {
        area: s.area, tema: s.tema,
        tipo: (Math.round((s.acertos / total) * 100) < 50 ? "prioridade" : "revisao") as "prioridade" | "revisao",
        taxa: Math.round((s.acertos / total) * 100),
        totalRespondidas: total,
      };
    });

  const filteredSorted = searchQuery
    ? sorted.filter(a => norm(a.area).includes(norm(searchQuery)))
    : sorted;

  const principais = sorted.filter(a => isInList(a.area, PRINCIPAIS));
  const frequentes = sorted.filter(a => isInList(a.area, FREQUENTES));
  const extras = sorted.filter(a => !isInList(a.area, PRINCIPAIS) && !isInList(a.area, FREQUENTES));
  const currentTabAreas = activeAreaTab === "principais" ? principais : activeAreaTab === "frequentes" ? frequentes : extras;

  const isInternal = ["progresso", "reforco", "cadernos", "diagnostico"].includes(subView);

  const handleSelectArea = (area: string) => {
    setSelectedArea(area);
    setSubView("temas");
  };

  const handleBackFromTemas = () => {
    setSubView("praticar");
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "hsl(0 0% 10%)" }}>
      <DotPattern className="opacity-[0.03]" />

      <AnimatePresence mode="wait">
        <motion.div
          key={subView + (subView === "temas" ? selectedArea : "")}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="min-h-screen"
        >
          {/* Compact header for internal views */}
          {isInternal && (
            <div
              className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
              style={{
                background: "linear-gradient(145deg, hsl(345 65% 30%), hsl(350 50% 20%))",
                boxShadow: "0 4px 16px hsla(345, 65%, 25%, 0.4)",
              }}
            >
              <button onClick={() => setSubView("menu")} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              <h1 className="text-sm font-bold text-white">Questões</h1>
            </div>
          )}

          {/* Hero header for menu/praticar */}
          {!isInternal && subView !== "temas" && (
            <div
              className="relative overflow-hidden rounded-b-3xl mb-4"
              style={{
                background: "linear-gradient(145deg, hsl(345 65% 30%), hsl(350 50% 22%), hsl(350 40% 15%))",
              }}
            >
              <Target className="absolute -right-4 -bottom-4 text-white pointer-events-none" style={{ width: 110, height: 110, opacity: 0.05 }} />
              <div className="absolute top-4 right-8 w-2 h-2 rounded-full" style={{ background: "hsl(40, 80%, 55%)", opacity: 0.3, boxShadow: "0 0 12px hsl(40, 80%, 55%)" }} />

              <div className="relative z-10 px-4 pt-3 pb-5">
                <button onClick={() => subView === "praticar" ? setSubView("menu") : navigate("/")} className="flex items-center gap-2 mb-3 group">
                  <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                    {subView === "praticar" ? "Menu" : "Início"}
                  </span>
                </button>

                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "hsla(40, 60%, 50%, 0.15)", border: "1px solid hsla(40, 60%, 50%, 0.25)" }}
                  >
                    <Target className="w-6 h-6" style={{ color: "hsl(40, 80%, 55%)" }} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Questões</h1>
                    <p className="text-xs" style={{ color: "hsla(40, 60%, 70%, 0.7)" }}>
                      <span className="font-semibold text-white/90">
                        <NumberTicker value={totalQuestoes} />
                      </span>{" "}disponíveis
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === TEMAS (inline) === */}
          {subView === "temas" && selectedArea && (
            <TemasInline area={selectedArea} onBack={handleBackFromTemas} />
          )}

          {/* Menu principal */}
          {subView === "menu" && (
            <QuestoesMenuRealeza
              totalRespondidas={globalTotal}
              totalAcertos={globalAcertos}
              taxaGlobal={globalTaxa}
              temasReforco={sugestoes.filter(s => s.tipo === "prioridade").length}
              totalQuestoes={totalQuestoes}
              onPraticar={() => setSubView("praticar")}
              onProgresso={() => setSubView("progresso")}
              onReforco={() => setSubView("reforco")}
              onCadernos={() => setSubView("cadernos")}
              onDiagnostico={() => setSubView("diagnostico")}
            />
          )}

          {/* Progresso */}
          {subView === "progresso" && (
            <QuestoesProgressoPage onBack={() => setSubView("menu")} />
          )}

          {/* Reforço */}
          {subView === "reforco" && (
            <div className="pb-6">
              <QuestoesReforcoTab sugestoes={sugestoes} onPraticar={() => setSubView("praticar")} />
            </div>
          )}

          {/* Cadernos */}
          {subView === "cadernos" && (
            <QuestoesCadernos onBack={() => setSubView("menu")} />
          )}

          {/* Diagnóstico */}
          {subView === "diagnostico" && (
            <QuestoesDiagnosticoPage onBack={() => setSubView("menu")} />
          )}

          {/* Praticar - seleção de disciplinas */}
          {subView === "praticar" && (
            <div className="px-4 pb-6">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsla(40, 60%, 60%, 0.5)" }} />
                  <input
                    type="text"
                    placeholder="Buscar disciplina..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
                    style={{ background: "hsla(0, 0%, 100%, 0.05)", border: "1px solid hsla(40, 60%, 50%, 0.12)" }}
                  />
                </div>
              </div>

              {/* Tabs */}
              {!searchQuery && (
                <div className="flex rounded-xl p-1 gap-1 mb-4" style={{ background: "hsla(0, 0%, 100%, 0.04)" }}>
                  {TABS_AREAS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeAreaTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveAreaTab(tab.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: isActive ? "hsla(40, 60%, 50%, 0.12)" : "transparent",
                          color: isActive ? "hsl(40, 80%, 55%)" : "hsla(0, 0%, 100%, 0.4)",
                          border: isActive ? "1px solid hsla(40, 60%, 50%, 0.2)" : "1px solid transparent",
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Grid */}
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-[110px] rounded-2xl animate-pulse" style={{ background: "hsla(0, 0%, 100%, 0.04)" }} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(searchQuery ? filteredSorted : currentTabAreas).map((item, i) => (
                    <DisciplinaCardRealeza
                      key={item.area}
                      area={item.area}
                      totalQuestoes={item.totalQuestoes}
                      progress={areaPctMap.get(item.area) || 0}
                      respondidas={areaRespondidasMap.get(item.area) || 0}
                      isLocked={!isPremium && !FREE_AREAS.includes(item.area)}
                      onLockedClick={() => startTransition(() => navigate("/assinatura"))}
                      onSelect={handleSelectArea}
                      delay={i * 60}
                    />
                  ))}
                  {searchQuery && filteredSorted.length === 0 && (
                    <p className="col-span-2 text-center text-sm py-8" style={{ color: "hsla(0, 0%, 100%, 0.4)" }}>
                      Nenhuma disciplina encontrada
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuestoesHubNovo;
