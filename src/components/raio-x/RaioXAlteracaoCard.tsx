import { memo, useState } from "react";
import { ChevronDown, ArrowRightLeft, Plus, Trash2, Eye } from "lucide-react";
import { RaioXCard } from "./RaioXCard";

interface RaioXAlteracaoCardProps {
  year: number;
  items: any[];
}

export const RaioXAlteracaoCard = memo(({ year, items }: RaioXAlteracaoCardProps) => {
  const [expanded, setExpanded] = useState(false);

  // Count by type
  const counts = items.reduce((acc, i) => {
    acc[i.tipo_alteracao] = (acc[i.tipo_alteracao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const parts: string[] = [];
  if (counts.alteracao) parts.push(counts.alteracao > 1 ? `${counts.alteracao} alterações` : `${counts.alteracao} alteração`);
  if (counts.inclusao) parts.push(counts.inclusao > 1 ? `${counts.inclusao} inclusões` : `${counts.inclusao} inclusão`);
  if (counts.nova) parts.push(`${counts.nova} nova${counts.nova > 1 ? "s" : ""}`);
  if (counts.revogacao) parts.push(counts.revogacao > 1 ? `${counts.revogacao} revogações` : `${counts.revogacao} revogação`);
  if (counts.vide) parts.push(counts.vide > 1 ? `${counts.vide} referências` : `${counts.vide} referência`);
  const summary = parts.join(" · ") || `${items.length} registro${items.length !== 1 ? "s" : ""}`;

  return (
    <div className="mb-3 bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm hover:border-primary/20 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        {/* Year badge */}
        <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/20 border border-primary/40 flex flex-col items-center justify-center">
          {year === 0 ? (
            <span className="text-sm font-black text-muted-foreground leading-none">S/D</span>
          ) : (
            <span className="text-lg font-black text-primary leading-none">{year}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            {year === 0 ? "Sem data definida" : `${items.length} ${items.length !== 1 ? "registros" : "registro"}`}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {counts.alteracao > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-300">
                <ArrowRightLeft className="w-2.5 h-2.5" /> {counts.alteracao}
              </span>
            )}
            {counts.inclusao > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-cyan-300">
                <Plus className="w-2.5 h-2.5" /> {counts.inclusao}
              </span>
            )}
            {counts.nova > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-300">
                <Plus className="w-2.5 h-2.5" /> {counts.nova}
              </span>
            )}
            {counts.revogacao > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-300">
                <Trash2 className="w-2.5 h-2.5" /> {counts.revogacao}
              </span>
            )}
            {counts.vide > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-300">
                <Eye className="w-2.5 h-2.5" /> {counts.vide}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/30">
          <div className="pt-3">
            {items.map((item, index) => (
              <RaioXCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

RaioXAlteracaoCard.displayName = "RaioXAlteracaoCard";
