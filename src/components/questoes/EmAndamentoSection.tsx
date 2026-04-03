import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Target } from "lucide-react";

interface EmAndamentoItem {
  area: string;
  acertos: number;
  erros: number;
  gradient: string;
}

interface EmAndamentoSectionProps {
  items: EmAndamentoItem[];
}

export const EmAndamentoSection = ({ items }: EmAndamentoSectionProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, 3);
  const shortName = (area: string) =>
    area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '');

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground">Em Andamento</h2>
        {items.length > 3 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary font-medium">
            {expanded ? "Ver menos" : "Ver tudo"}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {visible.map((item) => {
          const total = item.acertos + item.erros;
          const pct = total > 0 ? Math.round((item.acertos / total) * 100) : 0;
          return (
            <button
              key={item.area}
              onClick={() => navigate(`/ferramentas/questoes/temas?area=${encodeURIComponent(item.area)}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all active:scale-[0.98]"
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient}`}>
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground text-left truncate">{shortName(item.area)}</p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="text-xs font-semibold text-muted-foreground min-w-[32px] text-right">{pct}%</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
