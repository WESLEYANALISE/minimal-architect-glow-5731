import { memo } from "react";
import { BarChart3 } from "lucide-react";

interface Props {
  areas: { area: string; count: number }[];
}

export const JornadaAreasChart = memo(({ areas }: Props) => {
  if (areas.length === 0) return null;

  const max = Math.max(...areas.map((a) => a.count), 1);

  return (
    <div className="px-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BarChart3 className="w-4 h-4 text-amber-400" />
        <span>Áreas Mais Estudadas</span>
      </div>
      <div className="bg-card/60 border border-border/30 rounded-2xl p-4 space-y-3">
        {areas.map((a, i) => {
          const pct = Math.round((a.count / max) * 100);
          const colors = [
            "bg-red-500",
            "bg-amber-500",
            "bg-emerald-500",
            "bg-sky-500",
            "bg-violet-500",
            "bg-pink-500",
          ];
          return (
            <div key={a.area} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-foreground font-medium truncate max-w-[70%]">{a.area}</span>
                <span className="text-muted-foreground">{a.count}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${colors[i % colors.length]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

JornadaAreasChart.displayName = "JornadaAreasChart";
