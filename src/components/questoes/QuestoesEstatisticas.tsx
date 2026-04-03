import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3, Trophy, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Target, Loader2,
  Flame, BookOpen, Users, Award, AlertTriangle,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";

interface UserStats {
  id: string;
  area: string;
  tema: string | null;
  acertos: number;
  erros: number;
  ultima_resposta: string;
}

interface AreaSummary {
  area: string;
  acertos: number;
  erros: number;
  total: number;
  taxa: number;
}

type PeriodoFiltro = "hoje" | "7dias" | "30dias" | "todos";

const QuestoesEstatisticas = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats[]>([]);
  const [areaSummary, setAreaSummary] = useState<AreaSummary[]>([]);
  const [totals, setTotals] = useState({ acertos: 0, erros: 0, total: 0, taxa: 0 });
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("todos");
  const [streak, setStreak] = useState(0);
  const [globalAvg, setGlobalAvg] = useState({ acertos: 0, erros: 0, total: 0, taxa: 0 });

  useEffect(() => {
    if (user) fetchStats();
  }, [user, periodo]);

  const getDataFiltro = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    switch (periodo) {
      case "hoje": return hoje.toISOString();
      case "7dias": { const d = new Date(hoje); d.setDate(d.getDate() - 7); return d.toISOString(); }
      case "30dias": { const d = new Date(hoje); d.setDate(d.getDate() - 30); return d.toISOString(); }
      default: return null;
    }
  };

  const calcularStreak = (statsData: UserStats[]) => {
    if (!statsData || statsData.length === 0) return 0;
    const datas = statsData
      .map(s => new Date(s.ultima_resposta).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (datas.length === 0) return 0;
    let currentStreak = 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    for (let i = 0; i < datas.length; i++) {
      const dataCheck = new Date(hoje);
      dataCheck.setDate(dataCheck.getDate() - i);
      if (datas.includes(dataCheck.toDateString())) currentStreak++;
      else break;
    }
    return currentStreak;
  };

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase.from("user_questoes_stats").select("*").eq("user_id", user.id);
      const dataFiltro = getDataFiltro();
      if (dataFiltro) query = query.gte("ultima_resposta", dataFiltro);
      const { data, error } = await query;
      if (error) throw error;

      setStats(data || []);
      setStreak(calcularStreak(data || []));

      const areaMap = new Map<string, { acertos: number; erros: number }>();
      let totalAcertos = 0, totalErros = 0;
      (data || []).forEach((s: UserStats) => {
        const existing = areaMap.get(s.area) || { acertos: 0, erros: 0 };
        areaMap.set(s.area, { acertos: existing.acertos + s.acertos, erros: existing.erros + s.erros });
        totalAcertos += s.acertos;
        totalErros += s.erros;
      });

      const summary: AreaSummary[] = Array.from(areaMap.entries())
        .map(([area, { acertos, erros }]) => ({
          area, acertos, erros, total: acertos + erros,
          taxa: acertos + erros > 0 ? (acertos / (acertos + erros)) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);

      setAreaSummary(summary);
      setTotals({
        acertos: totalAcertos, erros: totalErros,
        total: totalAcertos + totalErros,
        taxa: totalAcertos + totalErros > 0 ? (totalAcertos / (totalAcertos + totalErros)) * 100 : 0
      });

      // Fetch global average
      const { data: allData } = await supabase.from("user_questoes_stats").select("user_id, acertos, erros");
      if (allData) {
        const userTotals = new Map<string, { ac: number; er: number }>();
        allData.forEach((r: any) => {
          const e = userTotals.get(r.user_id) || { ac: 0, er: 0 };
          userTotals.set(r.user_id, { ac: e.ac + (r.acertos || 0), er: e.er + (r.erros || 0) });
        });
        const users = Array.from(userTotals.values());
        if (users.length > 0) {
          const avgAc = users.reduce((s, u) => s + u.ac, 0) / users.length;
          const avgEr = users.reduce((s, u) => s + u.er, 0) / users.length;
          setGlobalAvg({
            acertos: Math.round(avgAc), erros: Math.round(avgEr),
            total: Math.round(avgAc + avgEr),
            taxa: avgAc + avgEr > 0 ? Math.round((avgAc / (avgAc + avgEr)) * 100) : 0,
          });
        }
      }
    } catch (err) {
      console.error("Erro ao buscar estatísticas:", err);
    } finally {
      setLoading(false);
    }
  };

  const topDomina = [...areaSummary].filter(a => a.total >= 3).sort((a, b) => b.taxa - a.taxa).slice(0, 5);
  const topMelhorar = [...areaSummary].filter(a => a.total >= 3).sort((a, b) => a.taxa - b.taxa).slice(0, 5);
  const melhorArea = topDomina[0];
  const piorArea = topMelhorar[0];

  const chartData = areaSummary.slice(0, 8).map(a => ({
    name: a.area.length > 12 ? a.area.substring(0, 12) + "..." : a.area,
    fullName: a.area, acertos: a.acertos, erros: a.erros, taxa: a.taxa.toFixed(0),
  }));

  const pieData = [
    { name: "Acertos", value: totals.acertos, fill: "#10b981" },
    { name: "Erros", value: totals.erros, fill: "#ef4444" },
  ];

  const getBarColor = (taxa: number) => taxa >= 70 ? "bg-green-500" : taxa >= 40 ? "bg-amber-500" : "bg-red-500";

  const diffAcertos = globalAvg.acertos > 0 ? Math.round(((totals.acertos - globalAvg.acertos) / globalAvg.acertos) * 100) : 0;
  const diffTaxa = globalAvg.taxa > 0 ? Math.round(totals.taxa - globalAvg.taxa) : 0;
  const diffTotal = globalAvg.total > 0 ? Math.round(((totals.total - globalAvg.total) / globalAvg.total) * 100) : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm">{data.fullName}</p>
          <div className="flex items-center gap-2 mt-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="text-xs">{data.acertos} acertos</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-3 h-3 text-red-500" />
            <span className="text-xs">{data.erros} erros</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Taxa: {data.taxa}%</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Nenhuma questão respondida {periodo !== "todos" ? "neste período" : "ainda"}</p>
        <p className="text-sm text-muted-foreground mt-1">Responda questões para ver suas estatísticas</p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4 pb-4">
      {/* Filtro de Período */}
      <ToggleGroup
        type="single"
        value={periodo}
        onValueChange={(v) => v && setPeriodo(v as PeriodoFiltro)}
        className="justify-start bg-muted/50 rounded-lg p-1"
      >
        {(["hoje", "7dias", "30dias", "todos"] as PeriodoFiltro[]).map((p) => (
          <ToggleGroupItem
            key={p}
            value={p}
            className="text-xs px-3 py-1.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {p === "hoje" ? "Hoje" : p === "7dias" ? "7 dias" : p === "30dias" ? "30 dias" : "Todos"}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-card rounded-xl p-3 border text-center">
          <BookOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-xl font-bold text-foreground">{totals.total}</p>
          <p className="text-[10px] text-muted-foreground">Respondidas</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
          <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
          <p className="text-xl font-bold text-emerald-500">{totals.acertos}</p>
          <p className="text-[10px] text-emerald-600">Acertos</p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20 text-center">
          <XCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
          <p className="text-xl font-bold text-red-500">{totals.erros}</p>
          <p className="text-[10px] text-red-600">Erros</p>
        </div>
        <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20 text-center">
          <Flame className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          <p className="text-xl font-bold text-amber-500">{streak}</p>
          <p className="text-[10px] text-amber-600">Dias seguidos</p>
        </div>
      </div>

      {/* Taxa de Acerto + Pizza */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Taxa de Acerto</span>
            <span className={cn("text-lg font-bold", totals.taxa >= 70 ? "text-emerald-500" : totals.taxa >= 50 ? "text-amber-500" : "text-red-500")}>
              {totals.taxa.toFixed(1)}%
            </span>
          </div>
          <Progress value={totals.taxa} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {totals.taxa >= 70 ? "Excelente desempenho!" : totals.taxa >= 50 ? "Bom, continue praticando!" : "Revise os temas com mais dificuldade"}
          </p>
        </div>
        {totals.total > 0 && (
          <div className="bg-card rounded-xl p-4 border flex items-center justify-center">
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Desempenho por Área (barras de progresso) */}
      {areaSummary.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/10 p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-blue-500" /> Desempenho por Área
          </h3>
          <div className="space-y-3">
            {areaSummary.map((m) => {
              const isBest = melhorArea?.area === m.area && areaSummary.length > 1;
              const isWorst = piorArea?.area === m.area && areaSummary.length > 1 && piorArea?.area !== melhorArea?.area;
              return (
                <div key={m.area} className="bg-background/60 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">{m.area}</span>
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
                    <span className="text-[10px] font-bold text-muted-foreground">{m.taxa.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all ${getBarColor(m.taxa)}`} style={{ width: `${m.taxa}%` }} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{m.acertos} acertos</span>
                    <span>{m.erros} erros</span>
                    <span>{m.total} total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparação com Outros */}
      {globalAvg.total > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/10 p-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-500" /> Comparação com Outros
          </h3>
          <div className="space-y-2">
            <ComparisonRow label="Questões respondidas" diff={diffTotal} myValue={totals.total} avg={globalAvg.total} />
            <ComparisonRow label="Total de acertos" diff={diffAcertos} myValue={totals.acertos} avg={globalAvg.acertos} />
            <ComparisonRow label="Taxa de acerto" diff={diffTaxa} myValue={Math.round(totals.taxa)} avg={globalAvg.taxa} suffix="%" />
          </div>
        </div>
      )}

      {/* Gráfico de Barras */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl p-4 border">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Acertos vs Erros por Área
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 35)}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="acertos" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="erros" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500" /><span>Acertos</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500" /><span>Erros</span></div>
          </div>
        </div>
      )}

      {/* Áreas que domina */}
      {topDomina.length > 0 && (
        <div className="bg-card rounded-xl p-4 border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Áreas que Você Domina
          </h3>
          <div className="space-y-2">
            {topDomina.map((area, idx) => (
              <div key={area.area} className="flex items-center gap-2">
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0", idx === 0 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground")}>{idx + 1}</span>
                <span className="flex-1 text-sm truncate">{area.area}</span>
                <span className="text-sm font-semibold text-emerald-500 shrink-0">{area.taxa.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Áreas para melhorar */}
      {topMelhorar.length > 0 && (
        <div className="bg-card rounded-xl p-4 border">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-500" /> Áreas para Melhorar
          </h3>
          <div className="space-y-2">
            {topMelhorar.map((area, idx) => (
              <div key={area.area} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground shrink-0">{idx + 1}</span>
                <span className="flex-1 text-sm truncate">{area.area}</span>
                <span className={cn("text-sm font-semibold shrink-0", area.taxa < 50 ? "text-red-500" : "text-amber-500")}>{area.taxa.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ComparisonRow = ({ label, diff, myValue, avg, suffix = "" }: { label: string; diff: number; myValue: number; avg: number; suffix?: string }) => {
  const isAbove = diff >= 0;
  return (
    <div className="bg-background/60 rounded-xl p-3 flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">
          Você: {myValue.toLocaleString()}{suffix} · Média: {avg.toLocaleString()}{suffix}
        </p>
      </div>
      <div className={`flex items-center gap-0.5 text-xs font-bold ${isAbove ? "text-green-500" : "text-red-500"}`}>
        {isAbove ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {isAbove ? "+" : ""}{diff}{suffix ? "pp" : "%"}
      </div>
    </div>
  );
};

export default QuestoesEstatisticas;
