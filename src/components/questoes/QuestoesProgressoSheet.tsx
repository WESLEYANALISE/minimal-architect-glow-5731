import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Target, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RawStat {
  area: string;
  tema: string;
  acertos: number;
  erros: number;
}

interface DisplayStat {
  label: string;
  acertos: number;
  erros: number;
}

export const QuestoesProgressoSheet = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const [rawData, setRawData] = useState<RawStat[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("user_questoes_stats")
      .select("area, tema, acertos, erros")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setRawData(data as RawStat[]);
      });
  }, [open, user]);

  // Reset filter when sheet closes
  useEffect(() => {
    if (!open) setSelectedArea(null);
  }, [open]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    rawData.forEach(r => { if (r.area) set.add(r.area); });
    return Array.from(set).sort();
  }, [rawData]);

  const displayStats = useMemo((): DisplayStat[] => {
    const map = new Map<string, DisplayStat>();

    if (selectedArea) {
      // Group by tema within selected area
      rawData.filter(r => r.area === selectedArea).forEach(r => {
        const key = r.tema || "Geral";
        const ex = map.get(key);
        if (ex) {
          ex.acertos += r.acertos || 0;
          ex.erros += r.erros || 0;
        } else {
          map.set(key, { label: key, acertos: r.acertos || 0, erros: r.erros || 0 });
        }
      });
    } else {
      // Group by area
      rawData.forEach(r => {
        const ex = map.get(r.area);
        if (ex) {
          ex.acertos += r.acertos || 0;
          ex.erros += r.erros || 0;
        } else {
          map.set(r.area, { label: r.area, acertos: r.acertos || 0, erros: r.erros || 0 });
        }
      });
    }

    // Sort by accuracy rate descending
    return Array.from(map.values()).sort((a, b) => {
      const pctA = (a.acertos + a.erros) > 0 ? a.acertos / (a.acertos + a.erros) : 0;
      const pctB = (b.acertos + b.erros) > 0 ? b.acertos / (b.acertos + b.erros) : 0;
      return pctB - pctA;
    });
  }, [rawData, selectedArea]);

  const totalAcertos = displayStats.reduce((s, i) => s + i.acertos, 0);
  const totalErros = displayStats.reduce((s, i) => s + i.erros, 0);
  const total = totalAcertos + totalErros;
  const taxaGlobal = total > 0 ? Math.round((totalAcertos / total) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Progresso Geral
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Area filter */}
          <Select
            value={selectedArea ?? "__geral__"}
            onValueChange={(v) => setSelectedArea(v === "__geral__" ? null : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Geral" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__geral__">Geral</SelectItem>
              {areas.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Target className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{total}</p>
              <p className="text-[10px] text-muted-foreground">Respondidas</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-500">{totalAcertos}</p>
              <p className="text-[10px] text-muted-foreground">Acertos</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-500">{totalErros}</p>
              <p className="text-[10px] text-muted-foreground">Erros</p>
            </div>
          </div>

          {/* Taxa global */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Taxa de Acerto {selectedArea ? `- ${selectedArea}` : "Global"}</span>
              <span className="text-lg font-bold text-primary">{taxaGlobal}%</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all"
                style={{ width: `${taxaGlobal}%` }}
              />
            </div>
          </div>

          {/* Desempenho por área/tema */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">
              {selectedArea ? "Desempenho por Tema" : "Desempenho por Área"}
            </p>
            <div className="space-y-2">
              {displayStats.map(s => {
                const t = s.acertos + s.erros;
                const pct = t > 0 ? Math.round((s.acertos / t) * 100) : 0;
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 truncate">
                      {selectedArea ? s.label : s.label.replace("Direito ", "D. ")}
                    </span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
              {displayStats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Responda questões para ver seu progresso</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
