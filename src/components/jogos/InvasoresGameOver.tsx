import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, RotateCcw, ArrowLeft, BookOpen, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface Artigo {
  numero: string;
  texto: string;
}

interface Props {
  pontuacao: number;
  nivel: number;
  fantasmasDestruidos: number;
  artigosErrados: Artigo[];
  codigoNome: string;
  artigosCobertos?: number;
  totalArtigos?: number;
  onRestart: () => void;
  onBack: () => void;
}

const InvasoresGameOver = ({ pontuacao, nivel, fantasmasDestruidos, artigosErrados, codigoNome, artigosCobertos = 0, totalArtigos = 0, onRestart, onBack }: Props) => {
  const progressPercent = totalArtigos > 0 ? (artigosCobertos / totalArtigos) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-cyan-950/20 to-neutral-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md space-y-4"
      >
        <div className="text-center space-y-2">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-6xl"
          >
            🚀
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Game Over</h1>
          <p className="text-neutral-400 text-sm">{codigoNome}</p>
        </div>

        {/* Stats */}
        <Card className="bg-neutral-900/80 border-cyan-500/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-400">{pontuacao}</div>
                <div className="text-xs text-neutral-500">Pontos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">{nivel}</div>
                <div className="text-xs text-neutral-500">Nível</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{fantasmasDestruidos}</div>
                <div className="text-xs text-neutral-500">Destruídos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Article Progress */}
        {totalArtigos > 0 && (
          <Card className="bg-neutral-900/80 border-cyan-500/20">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Target className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Progresso de Artigos</h3>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Nesta sessão</span>
                <span className="text-cyan-400 font-bold">{artigosCobertos}/{totalArtigos} ({progressPercent.toFixed(1)}%)</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Artigos errados */}
        {artigosErrados.length > 0 && (
          <Card className="bg-neutral-900/80 border-red-500/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400">
                <BookOpen className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Artigos para revisar</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {artigosErrados.map((art, i) => (
                  <div key={i} className="bg-neutral-800 rounded p-2">
                    <span className="text-cyan-400 text-xs font-bold">Art. {art.numero}</span>
                    <p className="text-neutral-400 text-xs line-clamp-2 mt-1">{art.texto}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700" onClick={onRestart}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Jogar Novamente
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default InvasoresGameOver;
