import { memo, useMemo } from "react";
import { RaioXAlteracaoCard } from "./RaioXAlteracaoCard";
import { Loader2, SearchX } from "lucide-react";

interface RaioXTimelineProps {
  items: any[];
  isLoading: boolean;
}

export const RaioXTimeline = memo(({ items, isLoading }: RaioXTimelineProps) => {
  // Group items by year (most recent first)
  const yearGroups = useMemo(() => {
    const groups: Record<number, any[]> = {};
    items.forEach((item) => {
      const dateStr = item.resenha_diaria?.data_publicacao || item.created_at;
      const year = dateStr ? new Date(dateStr).getFullYear() : 0;
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    });
    return Object.entries(groups)
      .map(([y, list]) => ({ year: Number(y), items: list }))
      .sort((a, b) => b.year - a.year);
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando timeline...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <SearchX className="w-10 h-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Nenhuma alteração encontrada</p>
        <p className="text-xs text-muted-foreground/70">Tente outro filtro ou período</p>
      </div>
    );
  }

  return (
    <div>
      {/* Counter */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {items.length} resultado{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Year-grouped cards */}
      {yearGroups.map(({ year, items: yearItems }) => (
        <RaioXAlteracaoCard key={year} year={year} items={yearItems} />
      ))}
    </div>
  );
});

RaioXTimeline.displayName = "RaioXTimeline";
