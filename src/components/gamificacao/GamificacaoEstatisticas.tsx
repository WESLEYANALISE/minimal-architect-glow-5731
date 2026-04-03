import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRanking, calcularXP } from "@/hooks/useGamificacao";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Star, Trophy, Target, TrendingUp, TrendingDown,
  Award, AlertTriangle, BarChart3, Hash, Percent, Layers, Users,
} from "lucide-react";

const MATERIAS_NOMES: Record<string, string> = {
  "direito-penal": "Direito Penal",
  "direito-civil": "Direito Civil",
  "direito-constitucional": "Direito Constitucional",
  "direito-processual-civil": "Dir. Proc. Civil",
  "direito-do-trabalho": "Direito do Trabalho",
  "direito-tributario": "Direito Tributário",
  "direito-administrativo": "Dir. Administrativo",
  "direito-processual-penal": "Dir. Proc. Penal",
  "direito-empresarial": "Direito Empresarial",
  "direitos-humanos": "Direitos Humanos",
};

interface ProgressoRow {
  materia: string;
  nivel: number;
  estrelas: number;
  palavras_acertadas: number;
  palavras_total: number;
  concluido: boolean;
}

export const GamificacaoEstatisticas = () => {
  const { user } = useAuth();
  const { data: ranking = [] } = useRanking();

  const { data: progresso = [], isLoading } = useQuery({
    queryKey: ["gamificacao-all-progresso", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("gamificacao_progresso")
        .select("materia, nivel, estrelas, palavras_acertadas, palavras_total, concluido")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []) as ProgressoRow[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalEstrelas = progresso.reduce((s, p) => s + (p.estrelas || 0), 0);
  const totalNiveis = progresso.filter((p) => p.concluido).length;
  const totalPalavras = progresso.reduce((s, p) => s + (p.palavras_acertadas || 0), 0);
  const totalPalavrasJogadas = progresso.reduce((s, p) => s + (p.palavras_total || 0), 0);
  const totalXP = progresso.reduce((s, p) => s + calcularXP(p.palavras_acertadas || 0, p.nivel || 1), 0);
  const taxaAcertoGeral = totalPalavrasJogadas > 0 ? Math.round((totalPalavras / totalPalavrasJogadas) * 100) : 0;
  const mediaEstrelasPorNivel = totalNiveis > 0 ? (totalEstrelas / totalNiveis).toFixed(1) : "0";

  const myRankIdx = ranking.findIndex((r) => r.user_id === user?.id);
  const myPosition = myRankIdx >= 0 ? myRankIdx + 1 : null;
  const totalJogadores = ranking.length;
  const percentil = myPosition && totalJogadores > 0 ? Math.round(((totalJogadores - myPosition) / totalJogadores) * 100) : null;

  const materiaMap = new Map<string, ProgressoRow[]>();
  progresso.forEach((p) => {
    const arr = materiaMap.get(p.materia) || [];
    arr.push(p);
    materiaMap.set(p.materia, arr);
  });

  const materiaStats = Array.from(materiaMap.entries())
    .map(([materia, rows]) => {
      const estrelas = rows.reduce((s, r) => s + (r.estrelas || 0), 0);
      const niveis = rows.filter((r) => r.concluido).length;
      const acertadas = rows.reduce((s, r) => s + (r.palavras_acertadas || 0), 0);
      const total = rows.reduce((s, r) => s + (r.palavras_total || 0), 0);
      const taxa = total > 0 ? Math.round((acertadas / total) * 100) : 0;
      const xp = rows.reduce((s, r) => s + calcularXP(r.palavras_acertadas || 0, r.nivel || 1), 0);
      return { materia, estrelas, niveis, acertadas, total, taxa, xp, totalNiveis: rows.length };
    })
    .sort((a, b) => b.taxa - a.taxa);

  const melhorMateria = materiaStats.length > 0 ? materiaStats[0] : null;
  const piorMateria = materiaStats.length > 1 ? materiaStats[materiaStats.length - 1] : null;
  const maisJogada = materiaStats.length > 0 ? [...materiaStats].sort((a, b) => b.totalNiveis - a.totalNiveis)[0] : null;
  const menosJogada = materiaStats.length > 1 ? [...materiaStats].sort((a, b) => a.totalNiveis - b.totalNiveis)[0] : null;

  const avgXP = totalJogadores > 0 ? ranking.reduce((s, r) => s + ((r as any).total_xp || 0), 0) / totalJogadores : 0;
  const avgNiveis = totalJogadores > 0 ? ranking.reduce((s, r) => s + (r.total_niveis_concluidos || 0), 0) / totalJogadores : 0;
  const avgPalavras = totalJogadores > 0 ? ranking.reduce((s, r) => s + (r.total_palavras_acertadas || 0), 0) / totalJogadores : 0;

  const diffXP = avgXP > 0 ? Math.round(((totalXP - avgXP) / avgXP) * 100) : 0;
  const diffNiveis = avgNiveis > 0 ? Math.round(((totalNiveis - avgNiveis) / avgNiveis) * 100) : 0;
  const diffPalavras = avgPalavras > 0 ? Math.round(((totalPalavras - avgPalavras) / avgPalavras) * 100) : 0;

  const getBarColor = (taxa: number) =>
    taxa >= 70 ? "bg-green-500" : taxa >= 40 ? "bg-amber-500" : "bg-red-500";

  if (progresso.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Jogue pelo menos um nível para ver suas estatísticas</p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4 pb-4">
      {/* Resumo Geral */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" /> Resumo Geral
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Zap className="w-4 h-4 text-amber-500" />} label="Total XP" value={totalXP.toLocaleString()} />
          <StatCard icon={<Star className="w-4 h-4 text-amber-400" />} label="Estrelas" value={totalEstrelas.toString()} />
          <StatCard icon={<Layers className="w-4 h-4 text-blue-500" />} label="Níveis" value={totalNiveis.toString()} />
          <StatCard icon={<Target className="w-4 h-4 text-green-500" />} label="Palavras" value={totalPalavras.toString()} />
        </div>
        {myPosition && (
          <div className="mt-3 bg-background/60 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Posição no ranking</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">#{myPosition}</span>
              <span className="text-[10px] text-muted-foreground">de {totalJogadores}</span>
              {percentil !== null && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Top {100 - percentil}%
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desempenho por Matéria */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/10 p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-blue-500" /> Desempenho por Matéria
        </h3>
        <div className="space-y-3">
          {materiaStats.map((m) => {
            const isBest = melhorMateria?.materia === m.materia && materiaStats.length > 1;
            const isWorst = piorMateria?.materia === m.materia && materiaStats.length > 1;
            return (
              <div key={m.materia} className="bg-background/60 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {MATERIAS_NOMES[m.materia] || m.materia}
                    </span>
                    {isBest && (
                      <Badge className="text-[9px] px-1 py-0 bg-green-500/20 text-green-600 border-green-500/30">
                        <Award className="w-2.5 h-2.5 mr-0.5" /> Forte
                      </Badge>
                    )}
                    {isWorst && (
                      <Badge className="text-[9px] px-1 py-0 bg-red-500/20 text-red-600 border-red-500/30">
                        <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Melhorar
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{m.taxa}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${getBarColor(m.taxa)}`}
                    style={{ width: `${m.taxa}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 text-amber-500" /> {m.xp} XP
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-amber-400" /> {m.estrelas}
                  </span>
                  <span>{m.niveis} níveis</span>
                  <span>{m.acertadas}/{m.total} palavras</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparação com Outros */}
      {totalJogadores > 1 && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/10 p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-500" /> Comparação com Outros
          </h3>
          <div className="space-y-2">
            <ComparisonRow label="XP" diff={diffXP} myValue={totalXP} avg={Math.round(avgXP)} />
            <ComparisonRow label="Níveis concluídos" diff={diffNiveis} myValue={totalNiveis} avg={Math.round(avgNiveis)} />
            <ComparisonRow label="Palavras acertadas" diff={diffPalavras} myValue={totalPalavras} avg={Math.round(avgPalavras)} />
          </div>
        </div>
      )}

      {/* Métricas Avançadas */}
      <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/10 p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
          <Percent className="w-4 h-4 text-green-500" /> Métricas Avançadas
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Média ⭐ / nível" value={mediaEstrelasPorNivel} />
          <MiniStat label="Taxa de acerto" value={`${taxaAcertoGeral}%`} />
          {maisJogada && (
            <MiniStat label="Mais jogada" value={MATERIAS_NOMES[maisJogada.materia] || maisJogada.materia} small />
          )}
          {menosJogada && (
            <MiniStat label="Menos jogada" value={MATERIAS_NOMES[menosJogada.materia] || menosJogada.materia} small />
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-background/60 rounded-xl p-3 flex items-center gap-2.5">
    {icon}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const ComparisonRow = ({ label, diff, myValue, avg }: { label: string; diff: number; myValue: number; avg: number }) => {
  const isAbove = diff >= 0;
  return (
    <div className="bg-background/60 rounded-xl p-3 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">
          Você: {myValue.toLocaleString()} · Média: {avg.toLocaleString()}
        </p>
      </div>
      <div className={`flex items-center gap-0.5 text-xs font-bold ${isAbove ? "text-green-500" : "text-red-500"}`}>
        {isAbove ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {isAbove ? "+" : ""}{diff}%
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, small }: { label: string; value: string; small?: boolean }) => (
  <div className="bg-background/60 rounded-xl p-3">
    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
    <p className={`font-bold text-foreground ${small ? "text-[11px]" : "text-sm"}`}>{value}</p>
  </div>
);
