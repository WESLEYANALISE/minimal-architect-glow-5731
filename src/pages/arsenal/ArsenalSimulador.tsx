import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Loader2, Sparkles, Timer, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArsenalConteudoInput } from "@/components/arsenal/ArsenalConteudoInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Alternativa { letra: string; texto: string; }
interface QuestaoSim {
  id: number;
  enunciado: string;
  dificuldade: string;
  topico: string;
  alternativas: Alternativa[];
  gabarito: string;
  explicacao: string;
}
interface SimuladoResult {
  titulo: string;
  totalQuestoes: number;
  tempoMinutos: number;
  questoes: QuestaoSim[];
}

const ArsenalSimulador = () => {
  const navigate = useNavigate();
  const [conteudo, setConteudo] = useState("");
  const [quantidade, setQuantidade] = useState(10);
  const [tempoMin, setTempoMin] = useState(0);
  const [simulado, setSimulado] = useState<SimuladoResult | null>(null);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [finalizado, setFinalizado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (cronometroAtivo && segundosRestantes > 0) {
      intervalRef.current = setInterval(() => {
        setSegundosRestantes(s => {
          if (s <= 1) { clearInterval(intervalRef.current!); setFinalizado(true); return 0; }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cronometroAtivo]);

  const handleGerar = async () => {
    if (!conteudo.trim()) { toast.error("Insira o conteúdo"); return; }
    setCarregando(true);
    setSimulado(null);
    setRespostas({});
    setFinalizado(false);
    setQuestaoAtual(0);
    try {
      const { data, error } = await supabase.functions.invoke("arsenal-academico", {
        body: { ferramenta: "simulador", conteudo, opcoes: { quantidade, tempo: tempoMin } },
      });
      if (error) throw error;
      setSimulado(data.resultado);
      if (tempoMin > 0) {
        setSegundosRestantes(tempoMin * 60);
        setCronometroAtivo(true);
      }
    } catch (e) {
      toast.error("Erro ao gerar simulado");
    } finally {
      setCarregando(false);
    }
  };

  const handleResponder = (letra: string) => {
    if (!simulado || finalizado) return;
    const q = simulado.questoes[questaoAtual];
    if (respostas[q.id]) return;
    setRespostas(prev => ({ ...prev, [q.id]: letra }));
    if (questaoAtual < simulado.questoes.length - 1) {
      setTimeout(() => setQuestaoAtual(q => q + 1), 800);
    }
  };

  const handleFinalizar = () => {
    setCronometroAtivo(false);
    setFinalizado(true);
  };

  const acertos = simulado ? simulado.questoes.filter(q => respostas[q.id] === q.gabarito).length : 0;
  const pctAcerto = simulado ? Math.round((acertos / simulado.questoes.length) * 100) : 0;

  const formatarTempo = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-1.5 bg-red-500/20 rounded-lg"><Trophy className="w-5 h-5 text-red-400" /></div>
            <div>
              <h1 className="text-base font-bold text-foreground">Simulador de Prova</h1>
              {simulado && !finalizado && <p className="text-xs text-muted-foreground">{questaoAtual + 1}/{simulado.questoes.length}</p>}
            </div>
          </div>
          {cronometroAtivo && segundosRestantes > 0 && (
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-sm font-bold",
              segundosRestantes < 60 ? "bg-red-500/20 text-red-400" : "bg-muted text-foreground")}>
              <Timer className="w-4 h-4" />
              {formatarTempo(segundosRestantes)}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 max-w-2xl mx-auto w-full">
        {/* Config */}
        {!simulado && (
          <>
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">1. Conteúdo do simulado</h2>
              <ArsenalConteudoInput onConteudoChange={(c) => setConteudo(c)} placeholder="Cole o conteúdo para criar o simulado..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">2. Questões</h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {[5, 10, 15, 20].map((q) => (
                    <button key={q} onClick={() => setQuantidade(q)}
                      className={cn("py-2 rounded-lg text-xs font-medium border transition-all",
                        quantidade === q ? "border-red-500/60 bg-red-500/10 text-red-400" : "border-border/50 bg-muted/30 text-muted-foreground")}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">3. Tempo</h2>
                <div className="grid grid-cols-2 gap-1.5">
                  {[0, 15, 30, 60].map((t) => (
                    <button key={t} onClick={() => setTempoMin(t)}
                      className={cn("py-2 rounded-lg text-xs font-medium border transition-all",
                        tempoMin === t ? "border-red-500/60 bg-red-500/10 text-red-400" : "border-border/50 bg-muted/30 text-muted-foreground")}>
                      {t === 0 ? "Livre" : `${t}min`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={handleGerar} disabled={carregando || !conteudo.trim()} className="w-full bg-red-600 hover:bg-red-700 text-white gap-2">
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {carregando ? "Gerando simulado..." : "Iniciar Simulado"}
            </Button>
          </>
        )}

        {/* Questão atual */}
        {simulado && !finalizado && (
          <div className="space-y-4">
            <div className="flex gap-1 flex-wrap">
              {simulado.questoes.map((_, i) => (
                <button key={i} onClick={() => setQuestaoAtual(i)}
                  className={cn("w-7 h-7 rounded-full text-xs font-bold transition-all",
                    i === questaoAtual ? "bg-red-500 text-white" :
                    respostas[simulado.questoes[i].id] ? "bg-green-500/30 text-green-400" : "bg-muted text-muted-foreground")}>
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                  {simulado.questoes[questaoAtual].dificuldade}
                </span>
                <span className="text-[10px] text-muted-foreground">{simulado.questoes[questaoAtual].topico}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{simulado.questoes[questaoAtual].enunciado}</p>
              <div className="space-y-2">
                {simulado.questoes[questaoAtual].alternativas?.map((alt) => {
                  const respondeu = !!respostas[simulado.questoes[questaoAtual].id];
                  const selecionada = respostas[simulado.questoes[questaoAtual].id] === alt.letra;
                  return (
                    <button key={alt.letra} onClick={() => handleResponder(alt.letra)} disabled={respondeu}
                      className={cn("w-full flex items-start gap-2 p-3 rounded-lg border text-left text-xs transition-all",
                        !respondeu ? "border-border/50 bg-muted/20 hover:border-border" :
                        selecionada ? "border-blue-500/60 bg-blue-500/10" : "border-border/30 opacity-60")}>
                      <span className="font-bold text-foreground/70">{alt.letra})</span>
                      <span className="text-foreground/90">{alt.texto}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {Object.keys(respostas).length === simulado.questoes.length && (
              <Button onClick={handleFinalizar} className="w-full bg-red-600 hover:bg-red-700 text-white">
                Finalizar e ver resultado
              </Button>
            )}
          </div>
        )}

        {/* Resultado final */}
        {finalizado && simulado && (
          <div className="space-y-4">
            <div className={cn("rounded-2xl p-5 text-center border", pctAcerto >= 70 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20")}>
              <p className="text-4xl font-bold text-foreground">{acertos}/{simulado.questoes.length}</p>
              <p className="text-sm text-muted-foreground mt-1">{pctAcerto}% de aproveitamento</p>
              <p className="text-lg mt-2">{pctAcerto >= 70 ? "🎉 Aprovado!" : "📚 Continue estudando!"}</p>
            </div>

            <h3 className="text-sm font-bold text-foreground">Gabarito comentado</h3>
            {simulado.questoes.map((q, i) => {
              const resp = respostas[q.id];
              const acertou = resp === q.gabarito;
              return (
                <div key={q.id} className="bg-muted/30 border border-border/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    {acertou ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                    <p className="text-xs text-foreground leading-relaxed">{i + 1}. {q.enunciado}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-6">
                    {!acertou && <span className="text-red-400">Sua resposta: {resp || "não respondida"} | </span>}
                    <span className="text-green-400">Gabarito: {q.gabarito}</span> — {q.explicacao}
                  </p>
                </div>
              );
            })}

            <Button variant="outline" onClick={() => { setSimulado(null); setConteudo(""); }} className="w-full gap-2">
              <RotateCcw className="w-4 h-4" /> Novo simulado
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArsenalSimulador;
