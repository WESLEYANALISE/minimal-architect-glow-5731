import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import { useProgressoMateria, useRanking, calcularXP } from "@/hooks/useGamificacao";
import { TrilhaSerpentina100 } from "@/components/gamificacao/TrilhaSerpentina100";
import { ArrowLeft, Trophy, Star, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const MATERIAS_MAP: Record<string, { nome: string }> = {
  "direito-penal": { nome: "Direito Penal" },
  "direito-civil": { nome: "Direito Civil" },
  "direito-constitucional": { nome: "Direito Constitucional" },
  "direito-processual-civil": { nome: "Direito Processual Civil" },
  "direito-do-trabalho": { nome: "Direito do Trabalho" },
  "direito-tributario": { nome: "Direito Tributário" },
  "direito-administrativo": { nome: "Direito Administrativo" },
  "direito-processual-penal": { nome: "Direito Processual Penal" },
  "direito-empresarial": { nome: "Direito Empresarial" },
  "direitos-humanos": { nome: "Direitos Humanos" },
};

const GamificacaoSimNaoTrilha = () => {
  const { materia } = useParams<{ materia: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const materiaInfo = MATERIAS_MAP[materia || ""];
  const materiaNome = materiaInfo?.nome || materia || "";
  const { data: progresso = [], isLoading } = useProgressoMateria(`SN:${materiaNome}`);
  const { data: ranking = [] } = useRanking();

  const myRanking = ranking.find(r => r.user_id === user?.id);
  const myPosition = ranking.findIndex(r => r.user_id === user?.id) + 1;

  const materiaStats = useMemo(() => {
    const niveisCompletos = progresso.filter(p => p.concluido).length;
    const totalEstrelas = progresso.reduce((sum, p) => sum + (p.estrelas || 0), 0);
    const totalXp = progresso.reduce((sum, p) => sum + calcularXP(p.palavras_acertadas || 0, p.nivel), 0);
    return { niveisCompletos, totalEstrelas, totalXp };
  }, [progresso]);

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin]);

  const progressoMap = new Map(progresso.map(p => [p.nivel, p]));

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-background to-background" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/gamificacao")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">{materiaNome}</h1>
          <p className="text-xs text-muted-foreground">100 níveis • Sim ou Não</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/gamificacao/ranking")} className="gap-1">
          <Trophy className="w-4 h-4 text-amber-500" />
        </Button>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-4 pb-2">
        <div className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {myPosition > 0 && (
              <div className="flex items-center gap-1 bg-amber-500/15 rounded-lg px-2.5 py-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-500">#{myPosition}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-foreground">{materiaStats.totalEstrelas}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-500">{(myRanking as any)?.total_xp || 0} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{materiaStats.niveisCompletos}</span>/100
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <TrilhaSerpentina100
            materiaSlug={materia || ""}
            progressoMap={progressoMap}
            onNivelClick={(nivel) => navigate(`/gamificacao/sim-nao/${materia}/${nivel}`)}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
};

export default GamificacaoSimNaoTrilha;
