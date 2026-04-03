import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGerarPalavras, useSalvarProgresso, calcularXP } from "@/hooks/useGamificacao";
import type { ProgressoNivel } from "@/hooks/useGamificacao";
import { ForcaVisual } from "@/components/jogos/ForcaVisual";
import { NivelResultado } from "./NivelResultado";
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, Zap, Star, RotateCcw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  playClickSound,
  playCorrectLetterSound,
  playWrongLetterSound,
  playWordCompleteSound,
  playWordFailSound,
} from "@/hooks/useGamificacaoSounds";

const MAX_ERROS = 6;
const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Props {
  materia: string;
  nivel: number;
  materiaSlug: string;
  onComplete: () => void;
  progressoExistente?: ProgressoNivel | null;
}

interface PalavraJogo {
  palavra: string;
  dica: string;
  categoria: string;
}

export const ForcaJogoNivel = ({ materia, nivel, materiaSlug, onComplete, progressoExistente }: Props) => {
  const navigate = useNavigate();
  const gerarPalavras = useGerarPalavras();
  const salvarProgresso = useSalvarProgresso();

  const [palavras, setPalavras] = useState<PalavraJogo[]>([]);
  const [palavraAtual, setPalavraAtual] = useState(0);
  const [letrasUsadas, setLetrasUsadas] = useState<Set<string>>(new Set());
  const [erros, setErros] = useState(0);
  const [resultados, setResultados] = useState<boolean[]>([]);
  const [faseCompleta, setFaseCompleta] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [showResumo, setShowResumo] = useState(!!progressoExistente?.concluido);
  const [xpAnimKey, setXpAnimKey] = useState(0);

  const acertosAtual = resultados.filter(Boolean).length;
  const xpParcial = calcularXP(acertosAtual, nivel);
  const [showWordXp, setShowWordXp] = useState<{ xp: number; key: number } | null>(null);

  useEffect(() => {
    if (showResumo) return;
    setCarregando(true);
    gerarPalavras.mutate(
      { materia, nivel },
      {
        onSuccess: (data) => {
          if (data.palavras && data.palavras.length > 0) {
            setPalavras(data.palavras.slice(0, 5));
          } else {
            toast.error("Erro ao gerar palavras");
          }
          setCarregando(false);
        },
        onError: () => {
          toast.error("Erro ao gerar palavras. Tente novamente.");
          setCarregando(false);
        },
      }
    );
  }, [materia, nivel, showResumo]);

  const palavraCorreta = palavras[palavraAtual]?.palavra || "";
  const dicaAtual = palavras[palavraAtual]?.dica || "";

  const acertouPalavra = palavraCorreta
    .split("")
    .every((l) => letrasUsadas.has(l));
  const perdeuPalavra = erros >= MAX_ERROS;

  useEffect(() => {
    if (acertouPalavra && palavraCorreta) {
      playWordCompleteSound();
      // Show floating XP gain
      const newAcertos = acertosAtual + 1;
      const newXp = calcularXP(newAcertos, nivel);
      const oldXp = xpParcial;
      const gained = newXp - oldXp;
      if (gained > 0) {
        setShowWordXp({ xp: gained, key: Date.now() });
        setTimeout(() => setShowWordXp(null), 1800);
      }
    } else if (perdeuPalavra && palavraCorreta) {
      playWordFailSound();
    }
  }, [acertouPalavra, perdeuPalavra, palavraCorreta]);

  const handleLetra = useCallback(
    (letra: string) => {
      if (letrasUsadas.has(letra) || acertouPalavra || perdeuPalavra) return;
      playClickSound();
      const novas = new Set(letrasUsadas);
      novas.add(letra);
      setLetrasUsadas(novas);
      if (palavraCorreta.includes(letra)) {
        setTimeout(() => playCorrectLetterSound(), 50);
      } else {
        setTimeout(() => playWrongLetterSound(), 50);
        setErros((e) => e + 1);
      }
    },
    [letrasUsadas, palavraCorreta, acertouPalavra, perdeuPalavra]
  );

  const proximaPalavra = useCallback(() => {
    const acertou = acertouPalavra;
    const novosResultados = [...resultados, acertou];
    setResultados(novosResultados);
    setXpAnimKey((k) => k + 1);

    if (palavraAtual + 1 < palavras.length) {
      setPalavraAtual((p) => p + 1);
      setLetrasUsadas(new Set());
      setErros(0);
    } else {
      const acertos = novosResultados.filter(Boolean).length;
      const estrelas = acertos >= 5 ? 3 : acertos >= 3 ? 2 : acertos >= 1 ? 1 : 0;

      // Only save if better than existing
      const shouldSave = !progressoExistente || estrelas > (progressoExistente.estrelas || 0);
      if (shouldSave) {
        salvarProgresso.mutate({
          materia,
          nivel,
          estrelas,
          palavras_acertadas: acertos,
          palavras_total: palavras.length,
        });
      }

      setFaseCompleta(true);
    }
  }, [acertouPalavra, resultados, palavraAtual, palavras, materia, nivel, progressoExistente]);

  const iniciarJogo = () => {
    setShowResumo(false);
    setPalavraAtual(0);
    setLetrasUsadas(new Set());
    setErros(0);
    setResultados([]);
    setFaseCompleta(false);
    setXpAnimKey(0);
  };

  // Tela de nível já concluído
  if (showResumo && progressoExistente?.concluido) {
    const estrelasExistentes = progressoExistente.estrelas || 0;
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-6">
        <div className="bg-card border border-border/30 rounded-2xl p-6 w-full max-w-sm text-center shadow-lg">
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-10 h-10 ${
                  s <= estrelasExistentes
                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_2px_6px_rgba(251,191,36,0.5)]"
                    : "text-muted-foreground/20"
                }`}
              />
            ))}
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Nível {nivel} Concluído!</h2>
          <p className="text-sm text-muted-foreground mb-1">
            {progressoExistente.palavras_acertadas}/{progressoExistente.palavras_total} acertos
          </p>
          <div className="flex items-center justify-center gap-1 text-amber-500 font-bold text-lg mb-6">
            <Zap className="w-5 h-5" />
            {calcularXP(progressoExistente.palavras_acertadas || 0, nivel)} XP
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={iniciarJogo} className="gap-2 w-full">
              <RotateCcw className="w-4 h-4" />
              Jogar Novamente
            </Button>
            <Button variant="outline" onClick={onComplete} className="gap-2 w-full">
              <ArrowLeft className="w-4 h-4" />
              Voltar à Trilha
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Gerando palavras com IA...</p>
      </div>
    );
  }

  if (faseCompleta) {
    const acertos = resultados.filter(Boolean).length;
    const estrelas = acertos >= 5 ? 3 : acertos >= 3 ? 2 : acertos >= 1 ? 1 : 0;
    const xpGanho = calcularXP(acertos, nivel);
    return (
      <NivelResultado
        nivel={nivel}
        estrelas={estrelas}
        acertos={acertos}
        total={palavras.length}
        xpGanho={xpGanho}
        onVoltar={onComplete}
        onProximoNivel={() => navigate(`/gamificacao/${materiaSlug}/${nivel + 1}`)}
        onRejogar={() => {
          setPalavraAtual(0);
          setLetrasUsadas(new Set());
          setErros(0);
          setResultados([]);
          setFaseCompleta(false);
          setShowResumo(false);
          setXpAnimKey(0);
        }}
      />
    );
  }

  if (palavras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm text-muted-foreground">Nenhuma palavra gerada. Tente novamente.</p>
        <Button onClick={onComplete}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col items-center gap-4">
      {/* XP Animated Badge + Progress bar */}
      <div className="w-full max-w-sm flex items-center gap-3">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Palavra {palavraAtual + 1}/{palavras.length}</span>
            <span>{acertosAtual} acertos</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${((palavraAtual) / palavras.length) * 100}%` }}
            />
          </div>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={xpAnimKey}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold text-sm px-3 py-1.5 rounded-full shrink-0"
          >
            <Zap className="w-4 h-4" />
            {xpParcial}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dica */}
      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 max-w-sm w-full">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-sm text-foreground">{dicaAtual}</p>
      </div>

      {/* Forca visual */}
      <div className="text-foreground">
        <ForcaVisual erros={erros} />
      </div>

      {/* Palavra - larger for mobile */}
      <div className="flex gap-2 flex-wrap justify-center">
        {palavraCorreta.split("").map((letra, i) => (
          <div
            key={i}
            className={`w-11 h-14 border-b-2 flex items-center justify-center text-2xl font-bold
              ${letrasUsadas.has(letra)
                ? "text-foreground border-primary"
                : perdeuPalavra
                  ? "text-destructive border-destructive"
                  : "border-muted-foreground/30"
              }
            `}
          >
            {letrasUsadas.has(letra) || perdeuPalavra ? letra : ""}
          </div>
        ))}
      </div>

      {/* Teclado ou botão próxima - larger keys */}
      {acertouPalavra || perdeuPalavra ? (
        <div className="flex flex-col items-center gap-3 relative">
          {/* Floating XP animation on correct */}
          <AnimatePresence>
            {showWordXp && acertouPalavra && (
              <motion.div
                key={showWordXp.key}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -40, scale: 1.2 }}
                exit={{ opacity: 0, y: -70, scale: 0.8 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute -top-8 font-extrabold text-xl text-amber-400 flex items-center gap-1 drop-shadow-lg pointer-events-none"
              >
                <Zap className="w-5 h-5" />
                +{showWordXp.xp} XP
              </motion.div>
            )}
          </AnimatePresence>

          {acertouPalavra ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-1"
            >
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-3xl"
              >
                🎉
              </motion.div>
              <p className="text-base font-bold text-green-500">Acertou!</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-1"
            >
              <p className="text-base font-medium text-destructive">
                ❌ Era: <span className="font-bold">{palavraCorreta}</span>
              </p>
            </motion.div>
          )}

          <Button onClick={proximaPalavra} className="min-w-[200px]">
            {palavraAtual + 1 < palavras.length ? "Próxima Palavra" : "Ver Resultado"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {ALFABETO.map((letra) => {
            const usada = letrasUsadas.has(letra);
            const correta = usada && palavraCorreta.includes(letra);
            const errada = usada && !palavraCorreta.includes(letra);
            return (
              <button
                key={letra}
                onClick={() => handleLetra(letra)}
                disabled={usada}
                className={`w-12 h-12 rounded-lg text-lg font-bold transition-all
                  ${correta ? "bg-green-500 text-white" : ""}${errada ? "bg-destructive/20 text-destructive line-through" : ""}${!usada ? "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground" : ""}
                `}
              >
                {letra}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
