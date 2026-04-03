import { Crosshair, Shield, Bomb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type PowerUpType = 'triple_shot' | 'shield' | 'bomb';

interface PowerUp {
  type: PowerUpType;
  available: boolean;
  used: boolean;
  killsNeeded: number;
}

interface Props {
  kills: number;
  powerUps: PowerUp[];
  onActivate: (type: PowerUpType) => void;
  activePowerUp: PowerUpType | null;
}

const POWER_UP_CONFIG: Record<PowerUpType, { icon: typeof Crosshair; label: string; color: string; bgColor: string; kills: number }> = {
  triple_shot: { icon: Crosshair, label: 'Triplo', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/40', kills: 10 },
  shield: { icon: Shield, label: 'Escudo', color: 'text-green-400', bgColor: 'bg-green-500/20 border-green-500/40', kills: 20 },
  bomb: { icon: Bomb, label: 'Bomba', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/40', kills: 30 },
};

const InvasoresPowerUps = ({ kills, powerUps, onActivate, activePowerUp }: Props) => {
  // Next power-up progress
  const nextPowerUp = powerUps.find(p => !p.available && !p.used);
  const progressToNext = nextPowerUp ? Math.min(kills / nextPowerUp.killsNeeded, 1) : 1;

  return (
    <div className="flex items-center gap-1.5">
      {powerUps.map((pu) => {
        const config = POWER_UP_CONFIG[pu.type];
        const Icon = config.icon;
        const isActive = activePowerUp === pu.type;

        return (
          <AnimatePresence key={pu.type}>
            {pu.used ? (
              <div className="w-8 h-8 rounded-lg bg-neutral-800/50 border border-neutral-700/30 flex items-center justify-center opacity-30">
                <Icon className="w-3.5 h-3.5 text-neutral-600" />
              </div>
            ) : pu.available ? (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 0.5 }}
                onClick={() => onActivate(pu.type)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center ${config.bgColor} ${isActive ? 'ring-2 ring-white/50' : ''}`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
              </motion.button>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-neutral-800/80 border border-neutral-700/30 flex items-center justify-center relative overflow-hidden">
                <Icon className="w-3.5 h-3.5 text-neutral-600" />
                {/* Progress fill */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-neutral-600/30"
                  style={{ height: `${(kills / config.kills) * 100}%` }}
                />
              </div>
            )}
          </AnimatePresence>
        );
      })}

      {/* Kill counter for next */}
      {nextPowerUp && (
        <div className="text-[10px] text-neutral-500 ml-1">
          {kills}/{nextPowerUp.killsNeeded}
        </div>
      )}
    </div>
  );
};

export default InvasoresPowerUps;
