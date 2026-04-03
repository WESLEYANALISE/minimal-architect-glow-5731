import { memo, useMemo, useRef } from "react";
import { Calendar, Scale, TrendingUp, ArrowRightLeft, Plus, Trash2, Eye } from "lucide-react";

interface TimelineItem {
  id: string;
  tipo_alteracao: string;
  created_at: string | null;
  resenha_diaria?: {
    data_publicacao: string | null;
    numero_lei: string;
  };
}

interface RaioXTimelineChartProps {
  items: TimelineItem[];
}

const TIPO_CARDS = [
  { key: "alteracao", label: "Alteração", icon: ArrowRightLeft, bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-400/30" },
  { key: "inclusao", label: "Inclusão", icon: Plus, bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-400/30" },
  { key: "nova", label: "Nova Lei", icon: Plus, bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-400/30" },
  { key: "revogacao", label: "Revogação", icon: Trash2, bg: "bg-red-500/20", text: "text-red-300", border: "border-red-400/30" },
  { key: "vide", label: "Referência", icon: Eye, bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-400/30" },
];

export const RaioXTimelineChart = memo(({ items }: RaioXTimelineChartProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { tipoCounts, yearData, stats } = useMemo(() => {
    const counts: Record<string, number> = {};
    const byYear: Record<number, number> = {};
    const leisSet = new Set<string>();

    items.forEach((item) => {
      const tipo = item.tipo_alteracao || "nova";
      counts[tipo] = (counts[tipo] || 0) + 1;

      const dateStr = item.resenha_diaria?.data_publicacao || item.created_at;
      if (dateStr) {
        const year = new Date(dateStr).getFullYear();
        if (!isNaN(year)) {
          byYear[year] = (byYear[year] || 0) + 1;
        }
      }

      if (item.resenha_diaria?.numero_lei) {
        leisSet.add(item.resenha_diaria.numero_lei);
      }
    });

    const years = Object.keys(byYear).map(Number).sort();
    const maxCount = Math.max(...Object.values(byYear), 1);
    const yearEntries = years.map((y) => ({ year: y, count: byYear[y], pct: byYear[y] / maxCount }));

    return {
      tipoCounts: counts,
      yearData: yearEntries,
      stats: {
        totalAnos: years.length,
        totalLeis: leisSet.size,
        totalAlteracoes: items.length,
      },
    };
  }, [items]);

  if (items.length === 0) return null;

  const minYear = yearData[0]?.year;
  const maxYear = yearData[yearData.length - 1]?.year;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 mb-4 shadow-lg">
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        Alterações ao longo do tempo
      </h3>

      {/* Type cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {TIPO_CARDS.map(({ key, label, icon: Icon, bg, text, border }) => {
          const count = tipoCounts[key] || 0;
          if (count === 0 && (key === "vide" || key === "inclusao" || key === "nova")) return null;
          return (
            <div key={key} className={`${bg} border ${border} rounded-lg p-2 text-center`}>
              <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${text}`} />
              <p className={`text-lg font-black ${text}`}>{count}</p>
              <p className={`text-[9px] ${text} opacity-80`}>{label}</p>
            </div>
          );
        })}
      </div>

      {/* Horizontal timeline */}
      {yearData.length > 1 && (
        <div className="mb-4">
          <div
            ref={scrollRef}
            className="flex items-end gap-1 overflow-x-auto pb-2 scrollbar-none"
            style={{ scrollbarWidth: "none" }}
          >
            {yearData.map(({ year, count, pct }) => (
              <div key={year} className="flex flex-col items-center min-w-[36px]">
                <div
                  className="w-5 bg-primary/60 rounded-t-sm transition-all"
                  style={{ height: Math.max(8, pct * 48) }}
                />
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                <span className="text-[9px] text-foreground/70 mt-0.5">{year}</span>
                <span className="text-[9px] font-bold text-foreground">{count}</span>
              </div>
            ))}
          </div>
          {/* Line */}
          <div className="h-px bg-border/40 -mt-[26px] mx-2" />
        </div>
      )}

      {/* Top years pills */}
      {yearData.length > 2 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none" style={{ scrollbarWidth: "none" }}>
          {yearData
            .slice()
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
            .map(({ year, count }) => (
              <span
                key={year}
                className="shrink-0 text-[10px] font-semibold bg-primary/15 text-primary-foreground/90 px-2 py-1 rounded-full border border-primary/30"
              >
                {year}: {count} alt
              </span>
            ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
        <div className="text-center">
          <p className="text-lg font-black text-foreground">{stats.totalAnos}</p>
          <p className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" /> Anos
          </p>
        </div>
        <div className="text-center border-x border-border/30">
          <p className="text-lg font-black text-foreground">{stats.totalLeis}</p>
          <p className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
            <Scale className="w-3 h-3" /> Leis
          </p>
        </div>
        <div className="text-center">
          <p className="text-lg font-black text-foreground">{stats.totalAlteracoes}</p>
          <p className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" /> Alterações
          </p>
        </div>
      </div>
    </div>
  );
});

RaioXTimelineChart.displayName = "RaioXTimelineChart";
