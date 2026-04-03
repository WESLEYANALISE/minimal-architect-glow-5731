import { useMemo, useState } from "react";
import { BarChart3, CheckCircle, XCircle, Target, TrendingDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFlashcardStats } from "@/hooks/useFlashcardStudyProgress";

interface Props {
  onBack: () => void;
}

export const FlashcardsProgressoPage = ({ onBack }: Props) => {
  const { data: stats } = useFlashcardStats();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const areaStats = stats?.areaStats || [];
  const areas = useMemo(() => areaStats.map(a => a.area).sort(), [areaStats]);

  const displayStats = useMemo(() => {
    if (selectedArea) {
      const found = areaStats.find(a => a.area === selectedArea);
      return found ? [{ label: found.area, compreendi: found.compreendi, revisar: found.revisar }] : [];
    }
    return areaStats.map(a => ({ label: a.area, compreendi: a.compreendi, revisar: a.revisar }));
  }, [areaStats, selectedArea]);

  const totalCompreendi = displayStats.reduce((s, i) => s + i.compreendi, 0);
  const totalRevisar = displayStats.reduce((s, i) => s + i.revisar, 0);
  const total = totalCompreendi + totalRevisar;
  const taxaGlobal = total > 0 ? Math.round((totalCompreendi / total) * 100) : 0;

  const weakAreas = areaStats.filter(a => a.total >= 5 && a.percentDominio < 50);

  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">Progresso Flashcards</h2>
      </div>

      <Select value={selectedArea ?? "__geral__"} onValueChange={(v) => setSelectedArea(v === "__geral__" ? null : v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Geral" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__geral__">Geral</SelectItem>
          {areas.map((a) => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Target className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-foreground">{total}</p>
          <p className="text-[10px] text-muted-foreground">Estudados</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-500">{totalCompreendi}</p>
          <p className="text-[10px] text-muted-foreground">Compreendi</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-red-500">{totalRevisar}</p>
          <p className="text-[10px] text-muted-foreground">Revisar</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">
            Taxa de Compreensão {selectedArea ? `- ${selectedArea}` : "Global"}
          </span>
          <span className="text-lg font-bold text-primary">{taxaGlobal}%</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all" style={{ width: `${taxaGlobal}%` }} />
        </div>
      </div>

      {weakAreas.length > 0 && !selectedArea && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">Precisa de revisão</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {weakAreas.slice(0, 5).map((w) => (
              <span key={w.area} className="text-[10px] bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
                {w.area.replace("Direito ", "D. ")} ({w.percentDominio}%)
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Desempenho por Área</p>
        <div className="space-y-2">
          {displayStats.map((s) => {
            const t = s.compreendi + s.revisar;
            const pct = t > 0 ? Math.round((s.compreendi / t) * 100) : 0;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 truncate">
                  {s.label.replace("Direito ", "D. ")}
                </span>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-10 text-right">{pct}%</span>
              </div>
            );
          })}
          {displayStats.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Estude flashcards para ver seu progresso
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
