import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar, ChevronRight, Check, ArrowLeft, Play, Trash2, BookOpen, Target } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuestoesAreasCache } from "@/hooks/useQuestoesAreasCache";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, isSameDay, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CronogramaItem {
  dia: string;
  temas: string[];
}

interface PlanoData {
  id: string;
  area: string;
  temas: string[];
  duracao: number;
  meta_diaria: number;
  data_inicio: string;
  cronograma: CronogramaItem[];
}

const DURACOES = [7, 15, 30];
const STEP_LABELS = ["Área", "Temas", "Config"];

export const QuestoesPlanoSheet = ({ open, onOpenChange }: Props) => {
  const { areas } = useQuestoesAreasCache();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedArea, setSelectedArea] = useState("");
  const [temasDisponiveis, setTemasDisponiveis] = useState<string[]>([]);
  const [selectedTemas, setSelectedTemas] = useState<string[]>([]);
  const [duracao, setDuracao] = useState(7);
  const [metaDiaria, setMetaDiaria] = useState(10);
  const [plano, setPlano] = useState<PlanoData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = startOfDay(new Date());

  // Load existing plan from Supabase
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setStep(1);
    setSelectedArea("");
    setSelectedTemas([]);
    supabase
      .from("user_questoes_plano")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPlano({
            id: data.id,
            area: data.area,
            temas: (data.temas as any) || [],
            duracao: data.duracao,
            meta_diaria: data.meta_diaria,
            data_inicio: data.data_inicio,
            cronograma: (data.cronograma as any) || [],
          });
        } else {
          setPlano(null);
        }
        setLoading(false);
      });
  }, [open, user]);

  // Fetch temas when area selected
  useEffect(() => {
    if (!selectedArea || step !== 2) return;
    supabase
      .from("QUESTOES_GERADAS")
      .select("tema")
      .eq("area", selectedArea)
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set((data as any[]).map((d) => d.tema).filter(Boolean))];
          setTemasDisponiveis(unique.sort());
        }
      });
  }, [selectedArea, step]);

  const toggleTema = (t: string) => {
    setSelectedTemas(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const gerarPlano = async () => {
    if (!user) return;
    const temasFinais = selectedTemas.length > 0 ? selectedTemas : temasDisponiveis;
    const hoje = startOfDay(new Date());
    const cronograma: CronogramaItem[] = [];

    for (let i = 0; i < duracao; i++) {
      const dia = format(addDays(hoje, i), "yyyy-MM-dd");
      const temaIdx = i % temasFinais.length;
      cronograma.push({ dia, temas: [temasFinais[temaIdx]] });
    }

    const { data, error } = await supabase
      .from("user_questoes_plano")
      .insert({
        user_id: user.id,
        area: selectedArea,
        temas: temasFinais as any,
        duracao,
        meta_diaria: metaDiaria,
        data_inicio: format(hoje, "yyyy-MM-dd"),
        cronograma: cronograma as any,
      })
      .select("id")
      .single();

    if (data) {
      setPlano({
        id: data.id,
        area: selectedArea,
        temas: temasFinais,
        duracao,
        meta_diaria: metaDiaria,
        data_inicio: format(hoje, "yyyy-MM-dd"),
        cronograma,
      });
      setStep(4);
    }
  };

  const deletarPlano = async () => {
    if (plano?.id) {
      await supabase.from("user_questoes_plano").delete().eq("id", plano.id);
    }
    setPlano(null);
    setStep(1);
  };

  const handlePraticar = (tema: string) => {
    if (!plano) return;
    onOpenChange(false);
    navigate(`/ferramentas/questoes/resolver?area=${encodeURIComponent(plano.area)}&tema=${encodeURIComponent(tema)}`);
  };

  // Progress calculation for existing plan
  const planProgress = useMemo(() => {
    if (!plano) return 0;
    const pastDays = plano.cronograma.filter(item => {
      const itemDate = new Date(item.dia + "T12:00:00");
      return isBefore(itemDate, today) && !isSameDay(itemDate, today);
    }).length;
    return Math.round((pastDays / plano.cronograma.length) * 100);
  }, [plano, today]);

  // Step indicator component
  const StepIndicator = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center gap-2 mb-5">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className={`w-8 h-0.5 rounded-full transition-colors ${isDone ? 'bg-primary' : 'bg-border'}`} />}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110' :
                isDone ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {isDone ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            Plano de Estudos
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : plano && step === 1 ? (
            /* Show existing plan */
            <div className="space-y-4">
              {/* Plan header with gradient */}
              <div className="bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{plano.area}</p>
                    <p className="text-xs text-muted-foreground">
                      {plano.temas.length} temas · {plano.duracao} dias · {plano.meta_diaria} questões/dia
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progresso do plano</span>
                    <span className="font-bold text-primary">{planProgress}%</span>
                  </div>
                  <Progress value={planProgress} className="h-2" />
                </div>
              </div>

              {/* Cronograma */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {plano.cronograma.map((item, i) => {
                  const itemDate = new Date(item.dia + "T12:00:00");
                  const isToday = isSameDay(itemDate, today);
                  const isPast = isBefore(itemDate, today) && !isToday;

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-xl text-sm transition-all ${
                        isToday
                          ? "bg-amber-500/15 border-2 border-amber-500/40 shadow-sm shadow-amber-500/10"
                          : isPast
                          ? "bg-muted/30 border border-border/30 opacity-60"
                          : "bg-card border border-border/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isToday ? 'bg-amber-500/20 text-amber-500' :
                          isPast ? 'bg-muted text-muted-foreground' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {isPast ? <Check className="w-4 h-4" /> : format(itemDate, "dd")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground block">
                            {format(itemDate, "EEEE, dd/MM", { locale: ptBR })}
                          </span>
                          <span className="text-sm font-medium text-foreground truncate block">{item.temas[0]}</span>
                        </div>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold whitespace-nowrap">
                            HOJE
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handlePraticar(item.temas[0])}
                        className="ml-2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors flex-shrink-0"
                      >
                        <Play className="w-3 h-3" />
                        Praticar
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={deletarPlano}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Plano
                </button>
                <button
                  onClick={() => { setPlano(null); setStep(1); }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                >
                  Novo Plano
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Choose area */}
              {!plano && step === 1 && (
                <div className="space-y-3">
                  <StepIndicator currentStep={1} />
                  <p className="text-sm text-muted-foreground">Escolha a área de estudo:</p>
                  <Select value={selectedArea} onValueChange={(v) => { setSelectedArea(v); setStep(2); }}>
                    <SelectTrigger className="w-full bg-card border-border">
                      <SelectValue placeholder="Selecione uma área" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50 max-h-60">
                      {(areas || []).map(a => (
                        <SelectItem key={a.area} value={a.area}>
                          {a.area} ({a.totalTemas} temas · {a.totalQuestoes} questões)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Step 2: Choose temas */}
              {step === 2 && (
                <div className="space-y-3">
                  <StepIndicator currentStep={2} />
                  <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-primary font-medium">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <p className="text-sm text-muted-foreground">Escolha os temas (ou pule para todos):</p>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {temasDisponiveis.map(t => (
                      <button
                        key={t}
                        onClick={() => toggleTema(t)}
                        className={`w-full flex items-center gap-2 p-3 rounded-xl text-sm text-left transition-all ${
                          selectedTemas.includes(t)
                            ? "bg-primary/15 border-2 border-primary/30 text-foreground"
                            : "bg-card border border-border text-foreground hover:bg-accent/30"
                        }`}
                      >
                        {selectedTemas.includes(t) && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        <span className="truncate">{t}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    {selectedTemas.length > 0 ? `Continuar (${selectedTemas.length} temas)` : "Todos os temas"}
                  </button>
                </div>
              )}

              {/* Step 3: Duration + meta */}
              {step === 3 && (
                <div className="space-y-4">
                  <StepIndicator currentStep={3} />
                  <button onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-primary font-medium">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Duração do plano:</p>
                    <div className="flex gap-2">
                      {DURACOES.map(d => (
                        <button
                          key={d}
                          onClick={() => setDuracao(d)}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                            duracao === d
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "bg-card border border-border text-foreground hover:bg-accent/30"
                          }`}
                        >
                          {d} dias
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Meta diária de questões:</p>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20].map(m => (
                        <button
                          key={m}
                          onClick={() => setMetaDiaria(m)}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                            metaDiaria === m
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "bg-card border border-border text-foreground hover:bg-accent/30"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={gerarPlano}
                    className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    Gerar Plano
                  </button>
                </div>
              )}

              {/* Step 4: Plan generated */}
              {step === 4 && plano && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-500/15 to-green-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-base font-bold text-foreground">Plano criado!</p>
                    <p className="text-xs text-muted-foreground mt-1">{plano.duracao} dias · {plano.meta_diaria} questões/dia</p>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {plano.cronograma.slice(0, 10).map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-xl text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {format(new Date(item.dia + "T12:00:00"), "dd")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-muted-foreground block">
                              {format(new Date(item.dia + "T12:00:00"), "EEE, dd/MM", { locale: ptBR })}
                            </span>
                            <span className="text-xs font-medium text-foreground truncate block">{item.temas[0]}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePraticar(item.temas[0])}
                          className="ml-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/15 text-primary text-[10px] font-semibold"
                        >
                          <Play className="w-3 h-3" />
                          Praticar
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => { setStep(1); }}
                    className="w-full py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    Ver Plano Completo
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
