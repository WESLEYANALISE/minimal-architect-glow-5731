import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Crosshair, Shield, Bomb, Zap, Star, Target, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import type { InvasoresHistorico } from "@/hooks/useInvasoresHistorico";

interface Props {
  codigoSlug: string;
  codigoNome: string;
  codigoIcone: string;
  totalArtigos: number;
  historico: InvasoresHistorico | undefined;
  onPlay: () => void;
  onBack: () => void;
}

const MiniGhost = ({ color, glow, horns, fire }: { color: string; glow?: string; horns?: boolean; fire?: boolean }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {fire && (
      <>
        <circle cx="24" cy="26" r="22" fill={`${glow || color}15`} />
        <circle cx="24" cy="26" r="18" fill={`${glow || color}20`} />
      </>
    )}
    {horns && (
      <>
        <polygon points="12,18 8,8 16,16" fill={color} opacity="0.8" />
        <polygon points="36,18 40,8 32,16" fill={color} opacity="0.8" />
      </>
    )}
    <path
      d={`M12,28 L12,20 Q12,10 24,10 Q36,10 36,20 L36,28 Q34,32 32,28 Q30,24 28,28 Q26,32 24,28 Q22,24 20,28 Q18,32 16,28 Q14,24 12,28 Z`}
      fill={color}
      opacity="0.85"
    />
    <circle cx="19" cy="20" r="2.5" fill="white" />
    <circle cx="29" cy="20" r="2.5" fill="white" />
    <circle cx="19.8" cy="20.5" r="1.2" fill="#111" />
    <circle cx="29.8" cy="20.5" r="1.2" fill="#111" />
  </svg>
);

const InvasoresBriefing = ({ codigoSlug, codigoNome, codigoIcone, totalArtigos, historico, onPlay, onBack }: Props) => {
  const artigosCobertos = historico?.artigos_cobertos?.length || 0;
  const progressPercent = totalArtigos > 0 ? (artigosCobertos / totalArtigos) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-cyan-950/20 to-neutral-950 pb-20">
      <div className="px-3 py-4 max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-neutral-400">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <span className="text-cyan-400 font-bold text-sm">{codigoSlug.toUpperCase()}</span>
        </div>

        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
          <div className="text-5xl mb-2">{codigoIcone}</div>
          <h1 className="text-xl font-bold text-white">{codigoNome}</h1>
        </motion.div>

        {/* Como Jogar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="bg-neutral-900/80 border-blue-500/20">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-blue-400 font-bold text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                COMO JOGAR
              </h3>
              <ul className="space-y-1.5 text-neutral-300 text-xs leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-cyan-400">▸</span>
                  Invasores carregando artigos de lei descem pela tela. Atire neles para destruí-los!
                </li>
                <li className="flex gap-2">
                  <span className="text-yellow-400">▸</span>
                  Quando um invasor chega ao fundo ou um chefe te atinge, você responde uma questão sobre o artigo.
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">▸</span>
                  Acerte a questão para ganhar pontos extras. Erre e perde uma vida!
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Invasores Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-neutral-900/80 border-cyan-500/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-cyan-400 font-bold text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                CONHEÇA OS INVASORES
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {/* Normal */}
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 mx-auto bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30">
                    <MiniGhost color="#06b6d4" />
                  </div>
                  <p className="text-cyan-400 font-bold text-xs">Normal</p>
                  <p className="text-neutral-500 text-[10px]">3 HP • Zigue-zague</p>
                  <p className="text-neutral-600 text-[10px]">Questão fácil</p>
                </div>
                {/* Elite */}
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 mx-auto bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/30">
                    <MiniGhost color="#a855f7" horns />
                  </div>
                  <p className="text-purple-400 font-bold text-xs">Elite</p>
                  <p className="text-neutral-500 text-[10px]">5 HP • Veloz</p>
                  <p className="text-neutral-600 text-[10px]">Interpretação</p>
                </div>
                {/* Boss */}
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 mx-auto bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                    <MiniGhost color="#ef4444" glow="#f97316" fire />
                  </div>
                  <p className="text-red-400 font-bold text-xs">Chefe</p>
                  <p className="text-neutral-500 text-[10px]">10 HP • Dispara</p>
                  <p className="text-neutral-600 text-[10px]">Análise crítica</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Power-ups Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-neutral-900/80 border-yellow-500/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-yellow-400 font-bold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                POWER-UPS
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 bg-neutral-800/50 rounded-lg p-2">
                  <Crosshair className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <p className="text-cyan-300 font-semibold text-xs">Tiro Triplo</p>
                    <p className="text-neutral-500 text-[10px]">10 kills • Dispara 3 projéteis em leque</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-neutral-800/50 rounded-lg p-2">
                  <Shield className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-green-300 font-semibold text-xs">Escudo Jurídico</p>
                    <p className="text-neutral-500 text-[10px]">20 kills • Bloqueia 1 invasor</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-neutral-800/50 rounded-lg p-2">
                  <Bomb className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <p className="text-red-300 font-semibold text-xs">Bomba Legal</p>
                    <p className="text-neutral-500 text-[10px]">30 kills • Destrói todos na tela</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-neutral-900/80 border-green-500/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-green-400 font-bold text-sm flex items-center gap-2">
                <Star className="w-4 h-4" />
                SEU PROGRESSO
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Artigos cobertos</span>
                  <span className="text-cyan-400 font-bold">{artigosCobertos}/{totalArtigos} ({progressPercent.toFixed(1)}%)</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {historico ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-yellow-400">{historico.pontuacao.toLocaleString()}</div>
                    <div className="text-[10px] text-neutral-500">Melhor</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-cyan-400">Nv.{historico.nivel_maximo}</div>
                    <div className="text-[10px] text-neutral-500">Nível Max</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-400">{historico.fantasmas_destruidos}</div>
                    <div className="text-[10px] text-neutral-500">Destruídos</div>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-500 text-xs text-center">Primeira vez neste código. Boa sorte!</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Play Button */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, type: "spring" }}>
          <Button
            onClick={onPlay}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/30"
          >
            🚀 INICIAR MISSÃO
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default InvasoresBriefing;
