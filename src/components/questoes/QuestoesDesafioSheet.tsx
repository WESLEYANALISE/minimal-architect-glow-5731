import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Check, X, Minus, Plus, ChevronRight, ArrowLeft, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isAfter, isBefore, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_HEADER = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const QuestoesDesafioSheet = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { areas } = useQuestoesAreasCache();
  const [meta, setMeta] = useState(10);
  const [area, setArea] = useState<string | null>(null);
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState(false);
  const [desafioId, setDesafioId] = useState<string | null>(null);
  const today = startOfDay(new Date());

  // Load desafio from Supabase
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("user_questoes_desafio")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMeta(data.meta_diaria || 10);
          setArea(data.area || null);
          setDesafioId(data.id);
          setConfiguring(false);
        } else {
          setConfiguring(true);
          setArea(null);
          setDesafioId(null);
        }
        setLoading(false);
      });
  }, [open, user]);

  // Load daily answer counts
  useEffect(() => {
    if (!open || !user || !area) return;
    supabase
      .from("user_questoes_stats")
      .select("ultima_resposta, acertos, erros")
      .eq("user_id", user.id)
      .eq("area", area)
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach((r: any) => {
          if (!r.ultima_resposta) return;
          const day = format(new Date(r.ultima_resposta), "yyyy-MM-dd");
          counts[day] = (counts[day] || 0) + (r.acertos || 0) + (r.erros || 0);
        });
        setDailyCounts(counts);
      });
  }, [open, user, area]);

  const saveMeta = async (v: number) => {
    const val = Math.max(1, Math.min(100, v));
    setMeta(val);
    if (desafioId && user) {
      await supabase
        .from("user_questoes_desafio")
        .update({ meta_diaria: val })
        .eq("id", desafioId);
    }
  };

  const salvarDesafio = async () => {
    if (!user || !area) return;
    if (desafioId) {
      await supabase
        .from("user_questoes_desafio")
        .update({ area, meta_diaria: meta })
        .eq("id", desafioId);
    } else {
      const { data } = await supabase
        .from("user_questoes_desafio")
        .insert({ user_id: user.id, area, meta_diaria: meta })
        .select("id")
        .single();
      if (data) setDesafioId(data.id);
    }
    setConfiguring(false);
  };

  const deletarDesafio = async () => {
    if (desafioId) {
      await supabase.from("user_questoes_desafio").delete().eq("id", desafioId);
    }
    setDesafioId(null);
    setArea(null);
    setConfiguring(true);
  };

  const handlePraticar = () => {
    if (!area) return;
    onOpenChange(false);
    navigate(`/ferramentas/questoes/resolver?area=${encodeURIComponent(area)}&modo=todas`);
  };

  // Calendar
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOffset = monthStart.getDay();

  // Streak
  const streak = useMemo(() => {
    let count = 0;
    let d = today;
    const todayKey = format(d, "yyyy-MM-dd");
    if ((dailyCounts[todayKey] || 0) >= meta) {
      count = 1;
      d = subDays(d, 1);
    }
    while (true) {
      const key = format(d, "yyyy-MM-dd");
      if ((dailyCounts[key] || 0) >= meta) {
        count++;
        d = subDays(d, 1);
      } else {
        break;
      }
    }
    return count;
  }, [dailyCounts, meta]);

  const todayCount = dailyCounts[format(today, "yyyy-MM-dd")] || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Desafio Diário
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : configuring ? (
            /* Wizard: escolher área + meta */
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Escolha a área do desafio:</p>
              <Select value={area || ""} onValueChange={(v) => setArea(v)}>
                <SelectTrigger className="w-full bg-card border-border">
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50 max-h-60">
                  {(areas || []).map(a => (
                    <SelectItem key={a.area} value={a.area}>
                      {a.area} ({a.totalQuestoes} questões)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {area && (
                <>
                  <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
                    <span className="text-sm font-medium text-foreground">Meta diária</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setMeta(Math.max(1, meta - 5))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Minus className="w-4 h-4 text-foreground" />
                      </button>
                      <span className="text-lg font-bold text-primary w-8 text-center">{meta}</span>
                      <button onClick={() => setMeta(Math.min(100, meta + 5))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Plus className="w-4 h-4 text-foreground" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={salvarDesafio}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                  >
                    Iniciar Desafio
                  </button>
                </>
              )}
            </div>
          ) : (
            /* Desafio ativo: streak, calendar, praticar */
            <>
              {/* Streak */}
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-1" />
                <p className="text-3xl font-bold text-foreground">{streak}</p>
                <p className="text-xs text-muted-foreground">dias consecutivos</p>
              </div>

              {/* Área + Meta */}
              <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Área</p>
                  <p className="text-sm font-semibold text-foreground">{area}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Meta diária</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => saveMeta(meta - 5)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <Minus className="w-3 h-3 text-foreground" />
                    </button>
                    <span className="text-sm font-bold text-primary">{meta}</span>
                    <button onClick={() => saveMeta(meta + 5)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="w-3 h-3 text-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Today progress */}
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Hoje</span>
                  <span className={`text-xs font-bold ${todayCount >= meta ? "text-green-400" : "text-amber-400"}`}>
                    {todayCount}/{meta}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${todayCount >= meta ? "bg-green-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, (todayCount / meta) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Praticar Hoje */}
              <button
                onClick={handlePraticar}
                className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Praticar Hoje
              </button>

              {/* Calendar */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3 text-center">
                  {format(today, "MMMM yyyy", { locale: ptBR })}
                </p>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS_HEADER.map(d => (
                    <span key={d} className="text-[10px] text-muted-foreground text-center font-medium">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {days.map(day => {
                    const key = format(day, "yyyy-MM-dd");
                    const count = dailyCounts[key] || 0;
                    const isToday = isSameDay(day, today);
                    const isPast = isBefore(day, today) && !isToday;
                    const isFuture = isAfter(day, today);
                    const metaCumprida = count >= meta;

                    let bg = "bg-muted/30 text-muted-foreground";
                    if (isToday) {
                      bg = metaCumprida
                        ? "bg-green-500/20 text-green-400 ring-2 ring-amber-500"
                        : "bg-card ring-2 ring-amber-500 text-foreground";
                    } else if (isPast) {
                      bg = metaCumprida
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/15 text-red-400";
                    }

                    return (
                      <div
                        key={key}
                        className={`w-full aspect-square rounded-full flex items-center justify-center text-xs font-medium ${bg}`}
                      >
                        {isPast && metaCumprida ? <Check className="w-3.5 h-3.5" /> :
                         isPast && !metaCumprida && count === 0 ? <X className="w-3.5 h-3.5" /> :
                         day.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={deletarDesafio}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/30"
                >
                  Excluir Desafio
                </button>
                <button
                  onClick={() => setConfiguring(true)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary/15 text-primary border border-primary/30"
                >
                  Alterar
                </button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
