import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArsenalConteudoInput } from "@/components/arsenal/ArsenalConteudoInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Dificuldade = "facil" | "medio" | "dificil";

interface DiaPlano {
  dia: string;
  tema: string;
  atividades: string[];
  duracao: string;
  dica?: string;
}

interface SemanaPlano {
  numero: number;
  titulo: string;
  dias: DiaPlano[];
}

interface PlanoResult {
  resumo: string;
  totalSemanas: number;
  semanas: SemanaPlano[];
  dicas: string[];
}

const dificuldades: { id: Dificuldade; label: string; emoji: string }[] = [
  { id: "facil", label: "Fácil", emoji: "😊" },
  { id: "medio", label: "Médio", emoji: "🤔" },
  { id: "dificil", label: "Difícil", emoji: "💪" },
];

const ArsenalPlano = () => {
  const navigate = useNavigate();
  const [passo, setPasso] = useState(1);
  const [conteudo, setConteudo] = useState("");
  const [dataProva, setDataProva] = useState<Date>();
  const [horasDia, setHorasDia] = useState([2]);
  const [dificuldade, setDificuldade] = useState<Dificuldade>("medio");
  const [resultado, setResultado] = useState<PlanoResult | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [semanaAtiva, setSemanaAtiva] = useState(0);

  const handleGerar = async () => {
    if (!conteudo.trim()) { toast.error("Insira o conteúdo"); return; }
    setCarregando(true);
    try {
      const { data, error } = await supabase.functions.invoke("arsenal-academico", {
        body: {
          ferramenta: "plano",
          conteudo,
          opcoes: {
            dataProva: dataProva ? format(dataProva, "dd/MM/yyyy") : null,
            horasDia: horasDia[0],
            dificuldade,
          },
        },
      });
      if (error) throw error;
      setResultado(data.resultado);
      setPasso(3);
    } catch (e) {
      toast.error("Erro ao gerar plano. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => passo > 1 ? setPasso(p => p - 1) : navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-1.5 bg-green-500/20 rounded-lg"><Calendar className="w-5 h-5 text-green-400" /></div>
          <div>
            <h1 className="text-base font-bold text-foreground">Plano de Estudos</h1>
            <p className="text-xs text-muted-foreground">Passo {Math.min(passo, 2)} de 2</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 max-w-2xl mx-auto w-full">
        {/* Passo 1: Conteúdo */}
        {passo === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">📚 Qual conteúdo deseja estudar?</h2>
            <ArsenalConteudoInput onConteudoChange={(c) => setConteudo(c)} placeholder="Descreva o conteúdo, cole um trecho ou selecione uma matéria..." />
            <Button onClick={() => { if (!conteudo.trim()) { toast.error("Insira o conteúdo"); return; } setPasso(2); }} className="w-full bg-green-600 hover:bg-green-700 text-white">
              Próximo →
            </Button>
          </div>
        )}

        {/* Passo 2: Configurações */}
        {passo === 2 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground">⚙️ Configure seu plano</h2>

            {/* Data da prova */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Data da prova (opcional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataProva && "text-muted-foreground")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataProva ? format(dataProva, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI mode="single" selected={dataProva} onSelect={setDataProva} initialFocus className="p-3 pointer-events-auto" disabled={(d) => d < new Date()} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Horas por dia */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Horas disponíveis por dia: <span className="text-foreground font-bold">{horasDia[0]}h</span></label>
              <Slider value={horasDia} onValueChange={setHorasDia} min={1} max={8} step={0.5} className="w-full" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1h</span><span>8h</span>
              </div>
            </div>

            {/* Dificuldade */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Nível de dificuldade da matéria</label>
              <div className="grid grid-cols-3 gap-2">
                {dificuldades.map((d) => (
                  <button key={d.id} onClick={() => setDificuldade(d.id)}
                    className={cn("flex flex-col items-center p-3 rounded-xl border transition-all",
                      dificuldade === d.id ? "border-green-500/60 bg-green-500/10" : "border-border/50 bg-muted/30")}>
                    <span className="text-xl">{d.emoji}</span>
                    <span className="text-xs font-medium text-foreground mt-1">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleGerar} disabled={carregando} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2">
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {carregando ? "Gerando plano..." : "Gerar Cronograma"}
            </Button>
          </div>
        )}

        {/* Passo 3: Resultado */}
        {passo === 3 && resultado && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
              <p className="text-sm text-foreground">{resultado.resumo}</p>
            </div>

            {/* Navegação entre semanas */}
            {resultado.semanas?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">{resultado.semanas[semanaAtiva]?.titulo}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => setSemanaAtiva(s => Math.max(0, s - 1))} disabled={semanaAtiva === 0}
                      className="p-1.5 rounded-lg bg-muted disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-muted-foreground px-2 py-1.5">{semanaAtiva + 1}/{resultado.semanas.length}</span>
                    <button onClick={() => setSemanaAtiva(s => Math.min(resultado.semanas.length - 1, s + 1))} disabled={semanaAtiva === resultado.semanas.length - 1}
                      className="p-1.5 rounded-lg bg-muted disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {resultado.semanas[semanaAtiva]?.dias?.map((dia, i) => (
                  <div key={i} className="bg-muted/30 border border-border/50 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{dia.dia}</span>
                      <span className="text-[10px] text-green-400 font-medium">{dia.duracao}</span>
                    </div>
                    <p className="text-xs font-medium text-foreground/90">{dia.tema}</p>
                    <ul className="space-y-0.5">
                      {dia.atividades?.map((at, j) => (
                        <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-1">
                          <span className="text-green-400 mt-0.5">•</span> {at}
                        </li>
                      ))}
                    </ul>
                    {dia.dica && <p className="text-[11px] text-amber-400 italic">💡 {dia.dica}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Dicas gerais */}
            {resultado.dicas?.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-foreground">💡 Dicas Gerais</h3>
                {resultado.dicas.map((d, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-1">
                    <span className="text-amber-400">✓</span> {d}
                  </p>
                ))}
              </div>
            )}

            <Button variant="outline" onClick={() => { setPasso(1); setResultado(null); }} className="w-full text-sm">
              Criar novo plano
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArsenalPlano;
