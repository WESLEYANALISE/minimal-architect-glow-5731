import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target } from "lucide-react";

const COLORS = [
  "hsl(45 93% 47%)",
  "hsl(199 89% 48%)",
  "hsl(142 76% 36%)",
  "hsl(346 77% 50%)",
  "hsl(262 83% 58%)",
  "hsl(25 95% 53%)",
  "hsl(173 80% 40%)",
  "hsl(328 73% 56%)",
  "hsl(210 70% 50%)",
  "hsl(0 70% 55%)",
];

interface Props {
  cargo: string;
  isEscrevente: boolean;
  isOAB?: boolean;
}

interface MateriaData {
  materia: string;
  total: number;
  percent: number;
}

export default function CargoRaioX({ cargo, isEscrevente, isOAB = false }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["raio-x-cargo", cargo],
    queryFn: async () => {
      const materias: Record<string, number> = {};

      if (isOAB) {
        const { data: questoes } = await supabase
          .from("SIMULADO-OAB" as any)
          .select("area");
        if (questoes) {
          (questoes as any[]).forEach((q: any) => {
            const mat = (q.area || "Outros").trim();
            materias[mat] = (materias[mat] || 0) + 1;
          });
        }
        const total = Object.values(materias).reduce((a, b) => a + b, 0);
        if (total === 0) return [];
        return Object.entries(materias)
          .map(([materia, count]) => ({ materia, total: count, percent: Math.round((count / total) * 100) }))
          .sort((a, b) => b.total - a.total);
      }

      if (isEscrevente) {
        const { data: questoes } = await supabase
          .from("SIMULADO-ESCREVENTE" as any)
          .select("Materia");
        if (questoes) {
          (questoes as any[]).forEach((q: any) => {
            const mat = (q.Materia || "Outros").trim();
            materias[mat] = (materias[mat] || 0) + 1;
          });
        }
      }

      const { data: sims } = await supabase
        .from("simulados_concursos")
        .select("id, cargo")
        .eq("status", "pronto");

      const matchingSims = (sims || []).filter((s) => {
        const sCargo = (s.cargo || "").toLowerCase();
        const target = cargo.toLowerCase();
        return sCargo === target || sCargo.includes(target) || target.includes(sCargo);
      });

      if (matchingSims.length) {
        const simIds = matchingSims.map((s) => s.id);
        for (let i = 0; i < simIds.length; i += 20) {
          const batch = simIds.slice(i, i + 20);
          const { data: questoes } = await supabase
            .from("simulados_questoes" as any)
            .select("materia")
            .in("simulado_id", batch);
          if (questoes) {
            (questoes as any[]).forEach((q: any) => {
              const mat = (q.materia || "Outros").trim();
              materias[mat] = (materias[mat] || 0) + 1;
            });
          }
        }
      }

      const total = Object.values(materias).reduce((a, b) => a + b, 0);
      if (total === 0) return [];

      const result: MateriaData[] = Object.entries(materias)
        .map(([materia, count]) => ({
          materia,
          total: count,
          percent: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return result;
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Sem dados suficientes para gerar o Raio-X.
      </p>
    );
  }

  const totalQuestoes = data.reduce((acc, item) => acc + item.total, 0);
  const topMateria = data[0];
  const maxPercent = topMateria.percent;

  return (
    <div className="space-y-5">
      {/* Header description */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <Target className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-foreground leading-relaxed">
            Baseado em <span className="font-semibold text-amber-400">{totalQuestoes} questões</span> aplicadas nas provas deste cargo, estas são as matérias mais cobradas. Foque seus estudos nas áreas com maior incidência para maximizar sua aprovação.
          </p>
        </div>
      </div>

      {/* Top matéria highlight */}
      <div className="flex items-center gap-2 px-1">
        <TrendingUp className="w-4 h-4 text-amber-400" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{topMateria.materia}</span> é a matéria mais cobrada, representando <span className="font-semibold text-amber-400">{topMateria.percent}%</span> de todas as questões.
        </p>
      </div>

      {/* Visual ranking - single clean list with bars */}
      <div className="space-y-2.5">
        {data.map((item, i) => (
          <div key={item.materia} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    backgroundColor: `${COLORS[i % COLORS.length]}20`,
                    color: COLORS[i % COLORS.length],
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-xs text-foreground">{item.materia}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs font-semibold text-foreground">{item.percent}%</span>
                <span className="text-[10px] text-muted-foreground">({item.total})</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden ml-7">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${maxPercent > 0 ? (item.percent / maxPercent) * 100 : 0}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
