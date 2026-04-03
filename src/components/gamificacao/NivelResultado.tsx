import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, RotateCcw, ArrowLeft, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playLevelCompleteSound, playLevelFailSound } from "@/hooks/useGamificacaoSounds";

interface Props {
  nivel: number;
  estrelas: number;
  acertos: number;
  total: number;
  xpGanho?: number;
  onVoltar: () => void;
  onRejogar: () => void;
  onProximoNivel?: () => void;
}

export const NivelResultado = ({ nivel, estrelas, acertos, total, xpGanho = 0, onVoltar, onRejogar, onProximoNivel }: Props) => {
  const [xpAnimado, setXpAnimado] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (estrelas > 0) {
        playLevelCompleteSound();
      } else {
        playLevelFailSound();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [estrelas]);

  // Animate XP counter
  useEffect(() => {
    if (xpGanho <= 0) return;
    const duration = 1000;
    const steps = 30;
    const increment = xpGanho / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= xpGanho) {
        setXpAnimado(xpGanho);
        clearInterval(interval);
      } else {
        setXpAnimado(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [xpGanho]);

  const mensagem = estrelas === 3
    ? "Perfeito! 🎉"
    : estrelas === 2
      ? "Muito bom! 👏"
      : estrelas === 1
        ? "Bom início! 💪"
        : "Tente novamente! 😢";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">Nível {nivel}</h2>
        <p className="text-lg text-muted-foreground">{mensagem}</p>
      </motion.div>

      <div className="flex gap-3">
        {[1, 2, 3].map((s) => (
          <motion.div
            key={s}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: s * 0.2, type: "spring", stiffness: 200 }}
          >
            <Star
              className={`w-14 h-14 ${
                s <= estrelas
                  ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  : "text-muted-foreground/20"
              }`}
            />
          </motion.div>
        ))}
      </div>

      {/* XP ganho */}
      {xpGanho > 0 && (
        <motion.div
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-xl px-5 py-2.5"
        >
          <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span className="text-xl font-bold text-amber-500">+{xpAnimado} XP</span>
        </motion.div>
      )}

      <div className="bg-secondary/50 rounded-xl p-4 w-full max-w-xs">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Palavras acertadas</span>
          <span className="font-bold text-foreground">{acertos}/{total}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-muted-foreground">Estrelas</span>
          <span className="font-bold text-amber-500">{estrelas}/3</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-muted-foreground">XP Ganho</span>
          <span className="font-bold text-amber-500">{xpGanho}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {onProximoNivel && (
          <Button onClick={onProximoNivel} className="gap-2 w-full bg-green-600 hover:bg-green-700 text-white">
            Ir para Nível {nivel + 1} →
          </Button>
        )}
        <Button variant="outline" onClick={onRejogar} className="gap-2 w-full">
          <RotateCcw className="w-4 h-4" />
          Rejogar
        </Button>
        <Button variant="ghost" onClick={onVoltar} className="gap-2 w-full">
          <ArrowLeft className="w-4 h-4" />
          Voltar à Trilha
        </Button>
      </div>
    </div>
  );
};
