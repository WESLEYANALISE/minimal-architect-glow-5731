import { useEffect, useMemo, useState, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Target, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { supabase } from "@/integrations/supabase/client";
import { Scale, Gavel, Building2, Shield, BookOpen, Briefcase, Landmark, Users, Hammer } from "lucide-react";
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
};

const AREAS_ORDEM = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Tributário", "Direito Empresarial",
  "Direitos Humanos",
];

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

const ProgressCircle = ({ percent }: { percent: number }) => {
  const size = 38;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="white" strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500" />
      </svg>
      <span className="absolute text-[9px] font-bold text-white">
        {percent < 1 && percent > 0 ? percent.toFixed(1) : Math.round(percent)}%
      </span>
    </div>
  );
};

const QuestoesSimNaoAreas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { areas, isLoading, totalQuestoes } = useQuestoesAreasCache();
  const [userStats, setUserStats] = useState<Record<string, { respondidas: number }>>({});

  useEffect(() => {
    if (user && !isAdmin) navigate("/ferramentas/questoes", { replace: true });
  }, [user, isAdmin]);

  // Fetch user progress for sim-nao from gamificacao_sim_nao_cache or a simple count
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_questoes_stats")
      .select("area, acertos, erros")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { respondidas: number }> = {};
        data.forEach((r: any) => {
          const a = r.area;
          if (!map[a]) map[a] = { respondidas: 0 };
          map[a].respondidas += (r.acertos || 0) + (r.erros || 0);
        });
        setUserStats(map);
      });
  }, [user]);

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

  const getProgress = (area: string, total: number) => {
    if (total === 0) return 0;
    const respondidas = userStats[area]?.respondidas || 0;
    const pct = (respondidas / total) * 100;
    return pct < 1 && pct > 0 ? parseFloat(pct.toFixed(1)) : Math.round(pct);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ferramentas/questoes")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Sim ou Não
          </h1>
          <p className="text-xs text-muted-foreground">Escolha uma disciplina</p>
        </div>
      </div>

      {/* Banner principal */}
      <div className="px-4 pb-3">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <CheckCircle2 className="w-28 h-28" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Verdadeiro ou Falso</h2>
                <p className="text-xs text-white/80">Afirmações jurídicas sem tempo limite</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/70 mt-2">
              <span className="flex items-center gap-1"><Target className="w-3 h-3" /> 10 afirmações por subtema</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Feedback imediato</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner secundário - dica */}
      <div className="px-4 pb-4">
        <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 20%)" }}>
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Brain className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Responda sem pressa</p>
            <p className="text-[11px] text-muted-foreground">Leia com atenção e decida se a afirmação é verdadeira ou falsa</p>
          </div>
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
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sorted.map(item => {
              const Icon = AREA_ICONS[item.area] || Target;
              const progress = getProgress(item.area, item.totalQuestoes);
              return (
                <button
                  key={item.area}
                  onClick={() => startTransition(() => navigate(`/ferramentas/questoes/sim-nao/temas?area=${encodeURIComponent(item.area)}`))}
                  className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${AREA_GRADIENTS[item.area] || "from-slate-500 to-slate-700"} shadow-lg h-[100px] animate-fade-in`}
                >
                  <div className="absolute -right-3 -bottom-3 opacity-20">
                    <Icon className="w-20 h-20 text-white" />
                  </div>
                  {/* Progress circle */}
                  <div className="absolute top-3 right-3">
                    <ProgressCircle percent={progress} />
                  </div>
                  <div className="relative z-10 bg-white/20 rounded-xl p-2 w-fit mb-2">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="relative z-10 font-semibold text-white text-sm leading-tight pr-12">
                    {item.area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '')}
                  </h3>
                  <p className="relative z-10 text-[10px] text-white/60 mt-0.5">
                    {item.totalQuestoes.toLocaleString('pt-BR')} questões
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

export default QuestoesSimNaoAreas;
