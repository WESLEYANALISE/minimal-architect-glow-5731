import { useEffect, useMemo, useState, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, Target, Zap, Brain, Scale, Gavel, Building2, Shield, BookOpen, Landmark, Users, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";

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

const AREA_ICONS: Record<string, LucideIcon> = {
  "Direito Constitucional": Landmark,
  "Direito Administrativo": Building2,
  "Direito Penal": Gavel,
  "Direito Processual Penal": Shield,
  "Direito Civil": Scale,
  "Direito Processual Civil": BookOpen,
  "Direito do Trabalho": Hammer,
  "Direito Tributário": Briefcase,
  "Direito Empresarial": Briefcase,
  "Direitos Humanos": Users,
};

const AREAS_OCULTAS = ["Revisão Oab", "Revisao Oab", "Português", "Portugues", "Filosofia do Direito"];

const isInList = (area: string, list: string[]) => {
  const norm = area.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return list.some(o => o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === norm);
};

const QuestoesCasoPraticoAreas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { areas, isLoading, totalQuestoes } = useQuestoesAreasCache();
  const [activeTab, setActiveTab] = useState<AreaTabId>("principais");
  const [simNaoCount, setSimNaoCount] = useState(0);
  const [correspondenciaCount, setCorrespondenciaCount] = useState(0);

  useEffect(() => {
    if (user && !isAdmin) navigate("/ferramentas/questoes", { replace: true });
  }, [user, isAdmin]);

  // Fetch counts for other modes
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
      } catch {}
    };
    fetchCounts();
  }, []);

  const totalGeral = totalQuestoes + simNaoCount + correspondenciaCount;

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
        const pesoA = iA >= 0 ? iA : Number.MAX_SAFE_INTEGER;
        const pesoB = iB >= 0 ? iB : Number.MAX_SAFE_INTEGER;
        if (pesoA !== pesoB) return pesoA - pesoB;
        return a.area.localeCompare(b.area, 'pt-BR');
      });
  }, [areas]);

  const principais = sorted.filter(a => isInList(a.area, PRINCIPAIS));
  const frequentes = sorted.filter(a => isInList(a.area, FREQUENTES));
  const extras = sorted.filter(a => !isInList(a.area, PRINCIPAIS) && !isInList(a.area, FREQUENTES));
  const currentAreas = activeTab === "principais" ? principais : activeTab === "frequentes" ? frequentes : extras;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ferramentas/questoes")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Caso Prático
          </h1>
          <p className="text-xs text-muted-foreground">Escolha uma disciplina</p>
        </div>
      </div>

      {/* Banner */}
      <div className="px-4 pb-3">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Briefcase className="w-28 h-28" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Caso Prático</h2>
                <p className="text-xs text-white/80">Cenários jurídicos com 4 alternativas</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/70 mt-2">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {totalGeral.toLocaleString('pt-BR')} questões</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Estilo OAB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dica */}
      <div className="px-4 pb-4">
        <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 20%)" }}>
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <Brain className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Leia o cenário com atenção</p>
            <p className="text-[11px] text-muted-foreground">Analise os fatos narrados antes de escolher a alternativa</p>
          </div>
        </div>
      </div>

      {/* Tab Menu - Principais / Frequentes / Extras */}
      <div className="px-4 pb-4">
        <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
          {TABS_AREAS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

      {/* Disciplinas */}
      <div className="px-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Disciplinas</h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : currentAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma disciplina nesta categoria</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {currentAreas.map(item => {
              const Icon = AREA_ICONS[item.area] || Target;
              return (
                <button
                  key={item.area}
                  onClick={() => startTransition(() => navigate(`/ferramentas/questoes/caso-pratico/temas?area=${encodeURIComponent(item.area)}`))}
                  className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${AREA_GRADIENTS[item.area] || "from-slate-500 to-slate-700"} shadow-lg h-[100px] animate-fade-in`}
                >
                  <div className="absolute -right-3 -bottom-3 opacity-20">
                    <Icon className="w-20 h-20 text-white" />
                  </div>
                  <div className="relative z-10 bg-white/20 rounded-xl p-2 w-fit mb-2">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="relative z-10 font-semibold text-white text-sm leading-tight">
                    {item.area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '')}
                  </h3>
                  <p className="relative z-10 text-[10px] text-white/60 mt-0.5">
                    {item.totalTemas} temas
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestoesCasoPraticoAreas;
