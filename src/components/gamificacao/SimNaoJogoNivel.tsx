import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NivelResultado } from "./NivelResultado";
import { useGerarSimNao, useSalvarProgresso, calcularXP } from "@/hooks/useGamificacao";
import { playCorrectLetterSound, playWrongLetterSound } from "@/hooks/useGamificacaoSounds";
import type { ProgressoNivel } from "@/hooks/useGamificacao";

interface Pergunta {
  afirmacao: string;
  resposta: boolean;
  explicacao: string;
  categoria: string;
}

interface Props {
  materia: string;
  nivel: number;
  materiaSlug: string;
  onComplete: () => void;
  progressoExistente: ProgressoNivel | null;
}

const TIMER_DURATION = 10;

export const SimNaoJogoNivel = ({ materia, nivel, materiaSlug, onComplete, progressoExistente }: Props) => {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [respondida, setRespondida] = useState(false);
  const [respostaUsuario, setRespostaUsuario] = useState<boolean | null>(null);
  const [timer, setTimer] = useState(TIMER_DURATION);
  const [fase, setFase] = useState<"loading" | "jogando" | "resultado">("loading");
  const [xpAcumulado, setXpAcumulado] = useState(0);
  const [temaAtual, setTemaAtual] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const gerarPerguntas = useGerarSimNao();
  const salvarProgresso = useSalvarProgresso();

  // Carregar perguntas
  useEffect(() => {
    gerarPerguntas.mutate(
      { materia, nivel },
      {
        onSuccess: (data) => {
          if (data?.perguntas?.length > 0) {
            setPerguntas(data.perguntas);
            setTemaAtual(data.tema || "");
            setFase("jogando");
          }
        },
      }
    );
  }, [materia, nivel]);

  // Timer countdown
  useEffect(() => {
    if (fase !== "jogando" || respondida) return;
    setTimer(TIMER_DURATION);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleResposta(null); // tempo esgotado
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [perguntaAtual, fase, respondida]);

  const handleResposta = useCallback((resposta: boolean | null) => {
    if (respondida || !perguntas[perguntaAtual]) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setRespondida(true);
    setRespostaUsuario(resposta);

    const correta = resposta === perguntas[perguntaAtual].resposta;
    if (correta) {
      setAcertos((a) => a + 1);
      setXpAcumulado((x) => x + 10);
      playCorrectLetterSound();
    } else {
      playWrongLetterSound();
    }
  }, [respondida, perguntas, perguntaAtual]);

  const proximaPergunta = useCallback(() => {
    if (perguntaAtual + 1 >= perguntas.length) {
      // Fim do jogo
      const totalAcertos = acertos;
      const estrelas = totalAcertos >= 9 ? 3 : totalAcertos >= 7 ? 2 : totalAcertos >= 4 ? 1 : 0;
      const xp = calcularXP(totalAcertos, nivel);

      salvarProgresso.mutate({
        materia: `SN:${materia}`,
        nivel,
        estrelas,
        palavras_acertadas: totalAcertos,
        palavras_total: perguntas.length,
      });

      setXpAcumulado(xp);
      setFase("resultado");
    } else {
      setPerguntaAtual((p) => p + 1);
      setRespondida(false);
      setRespostaUsuario(null);
    }
  }, [perguntaAtual, perguntas.length, acertos, materia, nivel]);

  const reiniciar = () => {
    setPerguntaAtual(0);
    setAcertos(0);
    setRespondida(false);
    setRespostaUsuario(null);
    setXpAcumulado(0);
    setFase("jogando");
  };

  if (fase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Gerando afirmações...</p>
      </div>
    );
  }

  if (fase === "resultado") {
    const totalAcertos = acertos;
    const estrelas = totalAcertos >= 9 ? 3 : totalAcertos >= 7 ? 2 : totalAcertos >= 4 ? 1 : 0;
    return (
      <NivelResultado
        nivel={nivel}
        estrelas={estrelas}
        acertos={totalAcertos}
        total={perguntas.length}
        xpGanho={xpAcumulado}
        onVoltar={onComplete}
        onRejogar={reiniciar}
        onProximoNivel={nivel < 100 ? () => {
          window.location.href = `/gamificacao/sim-nao/${materiaSlug}/${nivel + 1}`;
        } : undefined}
      />
    );
  }

  const pergunta = perguntas[perguntaAtual];
  if (!pergunta) return null;

  const acertou = respostaUsuario === pergunta.resposta;
  const timerPercent = (timer / TIMER_DURATION) * 100;

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      {/* Header: progresso + XP */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-muted-foreground">
          Pergunta {perguntaAtual + 1}/{perguntas.length}
        </span>
        <div className="flex items-center gap-1 bg-amber-500/15 rounded-lg px-2.5 py-1">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-amber-500">{xpAcumulado} XP</span>
        </div>
      </div>

      {/* Barra de progresso */}
      <Progress value={((perguntaAtual) / perguntas.length) * 100} className="h-2 mb-4" />

      {/* Timer */}
      {!respondida && (
        <div className="flex items-center gap-2 mb-4">
          <Clock className={`w-4 h-4 ${timer <= 3 ? "text-red-500" : "text-muted-foreground"}`} />
          <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${timer <= 3 ? "bg-red-500" : "bg-emerald-500"}`}
              initial={{ width: "100%" }}
              animate={{ width: `${timerPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className={`text-xs font-bold min-w-[20px] text-right ${timer <= 3 ? "text-red-500" : "text-muted-foreground"}`}>
            {timer}s
          </span>
        </div>
      )}

      {/* Card da afirmação */}
      <AnimatePresence mode="wait">
        <motion.div
          key={perguntaAtual}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl border-2 p-6 mb-6 min-h-[160px] flex flex-col justify-center ${
            respondida
              ? acertou
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-red-500/50 bg-red-500/10"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{materia}</span>
            {temaAtual && temaAtual !== materia && (
              <>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground font-medium">{temaAtual}</span>
              </>
            )}
          </div>
          <p className="text-base font-semibold text-foreground leading-relaxed">
            {pergunta.afirmacao}
          </p>

          {/* Feedback após resposta */}
          {respondida && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-4 pt-4 border-t border-border/50"
            >
              <div className="flex items-start gap-2">
                {acertou ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-bold ${acertou ? "text-emerald-500" : "text-red-500"}`}>
                    {respostaUsuario === null
                      ? "Tempo esgotado!"
                      : acertou
                        ? "Correto! ✓"
                        : "Incorreto ✗"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {pergunta.explicacao}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Resposta: {pergunta.resposta ? "Verdadeiro" : "Falso"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Botões de resposta ou próxima */}
      {!respondida ? (
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => handleResposta(true)}
              className="w-full h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Verdadeiro
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => handleResposta(false)}
              className="w-full h-14 text-base font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2"
            >
              <XCircle className="w-5 h-5" />
              Falso
            </Button>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={proximaPergunta}
            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 rounded-xl"
          >
            {perguntaAtual + 1 >= perguntas.length ? "Ver Resultado" : "Próxima →"}
          </Button>
        </motion.div>
      )}

      {/* Placar rápido */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-500">{acertos}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-red-500">
            {respondida ? perguntaAtual + 1 - acertos - (acertou ? 0 : 0) : perguntaAtual - acertos}
          </span>
        </div>
      </div>
    </div>
  );
};
