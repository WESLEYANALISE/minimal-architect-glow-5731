import { useState, useEffect } from "react";
import { Check, GripVertical } from "lucide-react";

interface AreaItem {
  area: string;
  totalQuestoes: number;
}

interface QuestoesPersonalizarProps {
  allAreas: AreaItem[];
  gradientFn: (area: string) => string;
}

const STORAGE_KEY = "questoes-disciplinas-favoritas";
const MAX_FAVORITAS = 6;

export const getCustomDisciplinas = (): string[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
};

export const QuestoesPersonalizar = ({ allAreas, gradientFn }: QuestoesPersonalizarProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const saved = getCustomDisciplinas();
    if (saved) {
      setSelected(saved);
    } else {
      setSelected(allAreas.slice(0, MAX_FAVORITAS).map(a => a.area));
    }
  }, [allAreas]);

  const toggle = (area: string) => {
    setSelected(prev => {
      let next: string[];
      if (prev.includes(area)) {
        next = prev.filter(a => a !== area);
      } else {
        if (prev.length >= MAX_FAVORITAS) return prev;
        next = [...prev, area];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const shortName = (area: string) =>
    area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '');

  return (
    <div className="px-4 pb-6">
      <p className="text-xs text-muted-foreground mb-3">
        Selecione até <span className="text-primary font-bold">{MAX_FAVORITAS}</span> disciplinas para exibir no grid principal ({selected.length}/{MAX_FAVORITAS})
      </p>
      <div className="space-y-2">
        {allAreas.map(item => {
          const isSelected = selected.includes(item.area);
          return (
            <button
              key={item.area}
              onClick={() => toggle(item.area)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] ${
                isSelected
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/50 bg-card"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientFn(item.area)} flex items-center justify-center flex-shrink-0`}>
                <GripVertical className="w-3.5 h-3.5 text-white/70" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{shortName(item.area)}</p>
                <p className="text-[11px] text-muted-foreground">{item.totalQuestoes.toLocaleString('pt-BR')} questões</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
              }`}>
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
