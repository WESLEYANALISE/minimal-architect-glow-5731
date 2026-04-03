import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, BookOpen, RotateCcw, Gavel, Star, Award, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";
import type { ProvaData } from "./BatalhaProvas";
import type { OpcaoSentenca } from "./BatalhaSentenca";

interface ProvaDecisao {
  prova: ProvaData;
  deferido: boolean;
  correto: boolean;
}

interface BatalhaResultadoProps {
  sentencaEscolhida: OpcaoSentenca;
  provasDecisoes: ProvaDecisao[];
  explicacao: string;
  onJogarNovamente: () => void;
  onVoltar: () => void;
}

const getBadge = (score: number) => {
  if (score >= 90) return { label: "Juiz Exemplar", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: <Award className="w-5 h-5" /> };
  if (score >= 70) return { label: "Juiz Competente", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: <Star className="w-5 h-5" /> };
  if (score >= 50) return { label: "Juiz Iniciante", color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: <TrendingUp className="w-5 h-5" /> };
  return { label: "Precisa Estudar Mais", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: <TrendingDown className="w-5 h-5" /> };
};

const BatalhaResultado = ({
  sentencaEscolhida,
  provasDecisoes,
  explicacao,
  onJogarNovamente,
  onVoltar,
}: BatalhaResultadoProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Calculate score
  const sentencaPontos = sentencaEscolhida.pontos;
  const provasPontos = provasDecisoes.reduce((acc, d) => acc + (d.correto ? 10 : 0), 0);
  const maxProvas = provasDecisoes.length * 10;
  const totalScore = Math.min(100, sentencaPontos + provasPontos);
  const badge = getBadge(totalScore);

  useEffect(() => {
    if (totalScore >= 80) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#f59e0b"],
      });
    }

    // Animate score counter
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current >= totalScore) {
        current = totalScore;
        clearInterval(interval);
      }
      setAnimatedScore(current);
    }, 30);
    return () => clearInterval(interval);
  }, [totalScore]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-4"
    >
      {/* Score header */}
      <div className="rounded-2xl p-6 text-center border bg-neutral-900/80 border-white/10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20"
        >
          <span className="text-white text-2xl font-black">{animatedScore}</span>
        </motion.div>

        <Badge className={`${badge.color} text-sm gap-1.5 px-3 py-1 mb-2`}>
          {badge.icon}
          {badge.label}
        </Badge>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
          <span>Sentença: <span className="text-white font-semibold">{sentencaPontos}pts</span></span>
          <span>•</span>
          <span>Provas: <span className="text-white font-semibold">{provasPontos}/{maxProvas}pts</span></span>
        </div>
      </div>

      {/* Sentença feedback */}
      <div className="rounded-2xl bg-neutral-900 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gavel className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-sm">Sua Sentença</h3>
          {sentencaEscolhida.correta ? (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs ml-auto">Correta</Badge>
          ) : (
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs ml-auto">Incorreta</Badge>
          )}
        </div>
        <p className="text-gray-300 text-sm italic mb-3">"{sentencaEscolhida.texto}"</p>
        <p className="text-gray-400 text-xs leading-relaxed">{sentencaEscolhida.feedback}</p>
      </div>

      {/* Provas feedback */}
      {provasDecisoes.length > 0 && (
        <div className="rounded-2xl bg-neutral-900 border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-sm">Decisões sobre Provas</h3>
          </div>
          <div className="space-y-3">
            {provasDecisoes.map((d, i) => (
              <div key={i} className={`rounded-xl p-3 border text-sm ${
                d.correto
                  ? "bg-emerald-900/10 border-emerald-500/20"
                  : "bg-red-900/10 border-red-500/20"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {d.correto ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-white font-medium">{d.prova.nome}</span>
                  <span className={`text-xs ml-auto ${d.deferido ? "text-emerald-300" : "text-red-300"}`}>
                    {d.deferido ? "Deferido" : "Indeferido"}
                  </span>
                </div>
                <p className="text-gray-400 text-xs ml-6">{d.prova.motivo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explicação */}
      <div className="rounded-2xl bg-neutral-900 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-sm">Fundamentação Jurídica</h3>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{explicacao}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onVoltar}
          variant="outline"
          className="flex-1 h-11 border-white/20"
        >
          Voltar aos Temas
        </Button>
        <Button
          onClick={onJogarNovamente}
          className="flex-1 h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Jogar Novamente
        </Button>
      </div>
    </motion.div>
  );
};

export default BatalhaResultado;
