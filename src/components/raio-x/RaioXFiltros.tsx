import { memo } from "react";
import { Crown, Scale, Shield, Gavel, HandCoins, FileText, Zap, ScrollText, ListFilter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIAS = [
  { id: "todos", label: "Todos", icon: ListFilter },
  { id: "codigos", label: "Códigos", icon: Scale },
  { id: "constitucional", label: "Constitucional", icon: Crown },
  { id: "penal", label: "Penal", icon: Shield },
  { id: "estatutos", label: "Estatutos", icon: Gavel },
  { id: "previdenciario", label: "Previdenciário", icon: HandCoins },
  { id: "ordinarias", label: "Ordinárias", icon: FileText },
  { id: "decretos", label: "Decretos", icon: ScrollText },
  { id: "medidas_provisorias", label: "MPs", icon: Zap },
];

const PERIODOS = [
  { value: "todos", label: "Desde o início" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
];

interface RaioXFiltrosProps {
  categoria: string;
  periodo: string;
  onCategoriaChange: (cat: string) => void;
  onPeriodoChange: (per: string) => void;
}

export const RaioXFiltros = memo(({ categoria, periodo, onCategoriaChange, onPeriodoChange }: RaioXFiltrosProps) => {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIAS.map((cat) => {
          const Icon = cat.icon;
          const isActive = categoria === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoriaChange(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      <Select value={periodo} onValueChange={onPeriodoChange}>
        <SelectTrigger className="w-44 h-8 text-xs bg-card border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

RaioXFiltros.displayName = "RaioXFiltros";
