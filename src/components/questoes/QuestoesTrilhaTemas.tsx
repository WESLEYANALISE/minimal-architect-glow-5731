import { motion } from "framer-motion";
import { Target, Loader2, Lock, Heart } from "lucide-react";

const SERPENTINE_X = [50, 78, 50, 22];
const getNodeX = (idx: number) => SERPENTINE_X[idx % SERPENTINE_X.length];
const NODE_SIZE = 110;
const ACTIVE_NODE_SIZE = 140;
const VERTICAL_SPACING = 180;
const CONTAINER_WIDTH = 360;

interface TemaItem {
  tema: string;
  temQuestoes: boolean;
  parcial: boolean;
  subtemasGerados: number;
  totalSubtemas: number;
  totalQuestoes: number;
  progressoPercent: number;
  ordem: number;
}

interface QuestoesTrilhaTemasProps {
  temas: TemaItem[];
  hexColor: string;
  onTemaClick: (tema: string) => void;
  icon?: React.ComponentType<any>;
  badgeLabel?: string;
  lockedFromIndex?: number;
  onLockedClick?: () => void;
  favoritos?: string[];
  onToggleFavorito?: (tema: string) => void;
}

const ProgressRing = ({ size, progress, color, isActive }: { size: number; progress: number; color: string; isActive: boolean }) => {
  const radius = size / 2 + 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 100) / 100);
  const svgSize = size + 16;

  return (
    <svg
      className="absolute pointer-events-none"
      width={svgSize}
      height={svgSize}
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <defs>
        <linearGradient id={`ring-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
        {isActive && (
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="4"
      />
      <motion.circle
        cx={svgSize / 2}
        cy={svgSize / 2}
        r={radius}
        fill="none"
        stroke={`url(#ring-grad-${size})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        whileInView={{ strokeDashoffset: offset }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        filter={isActive ? "url(#ring-glow)" : undefined}
      />
    </svg>
  );
};

export const QuestoesTrilhaTemas = ({ temas, hexColor, onTemaClick, icon: Icon = Target, badgeLabel, lockedFromIndex, onLockedClick, favoritos = [], onToggleFavorito }: QuestoesTrilhaTemasProps) => {
  const firstIncompleteIdx = temas.findIndex(t => !t.temQuestoes);

  const nodes = temas.map((tema, i) => {
    const isActive = i === firstIncompleteIdx;
    const size = isActive ? ACTIVE_NODE_SIZE : NODE_SIZE;
    const x = (getNodeX(i) / 100) * CONTAINER_WIDTH;
    const y = i * VERTICAL_SPACING + size / 2 + 20;
    return { ...tema, x, y, size, isActive, index: i };
  });

  const totalHeight = temas.length * VERTICAL_SPACING + 120;

  const svgPath = nodes.length >= 2
    ? nodes.reduce((d, node, i) => {
        if (i === 0) return `M ${node.x} ${node.y}`;
        const prev = nodes[i - 1];
        const ctrlX = (prev.x + node.x) / 2;
        const ctrlY = (prev.y + node.y) / 2;
        return `${d} Q ${ctrlX} ${ctrlY}, ${node.x} ${node.y}`;
      }, "")
    : "";

  return (
    <div className="flex flex-col items-center pb-8 pt-4">
      <div className="relative" style={{ width: CONTAINER_WIDTH, height: totalHeight }}>
        {svgPath && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CONTAINER_WIDTH} ${totalHeight}`} fill="none">
            <defs>
              <filter id="questoes-energy-glow">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="path-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={hexColor} stopOpacity="0.5" />
                <stop offset="50%" stopColor={hexColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={hexColor} stopOpacity="0.5" />
              </linearGradient>
            </defs>

            <motion.path
              d={svgPath}
              stroke="url(#path-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />

            <motion.path
              d={svgPath}
              stroke={`${hexColor}80`}
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#questoes-energy-glow)"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />

            <motion.path
              d={svgPath}
              stroke={`${hexColor}50`}
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="6 8"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              style={{ animation: 'dash-flow 12s linear infinite' }}
            />

            <circle r="5" fill={hexColor} opacity="0.9" filter="url(#questoes-energy-glow)">
              <animateMotion dur="3.5s" repeatCount="indefinite" path={svgPath} />
              <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="r" values="3;6;3" dur="1.8s" repeatCount="indefinite" />
            </circle>

            <circle r="3" fill="white" opacity="0.6" filter="url(#questoes-energy-glow)">
              <animateMotion dur="5s" repeatCount="indefinite" path={svgPath} begin="1.5s" />
              <animate attributeName="opacity" values="0.1;0.7;0.1" dur="2s" repeatCount="indefinite" />
              <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        )}

        {nodes.map((node) => {
          const circleSize = node.isActive ? 96 : 78;
          const isComplete = node.temQuestoes;
          const isLocked = lockedFromIndex !== undefined && node.index >= lockedFromIndex;
          const isFavorited = favoritos.includes(node.tema);

          return (
            <motion.div
              key={node.tema}
              initial={{ opacity: 0, scale: 0.3 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (node.index % 5) * 0.08, type: "spring", stiffness: 180, damping: 15 }}
              className="absolute flex flex-col items-center"
              style={{ left: node.x - node.size / 2, top: node.y - node.size / 2, width: node.size }}
            >
              <motion.div
                onClick={() => isLocked ? onLockedClick?.() : onTemaClick(node.tema)}
                className="relative group cursor-pointer flex items-center justify-center"
                style={{ width: circleSize + 20, height: circleSize + 20 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                {/* Active node pulsing rings */}
                {node.isActive && (
                  <>
                    <motion.div
                      className="absolute rounded-full"
                      style={{ 
                        borderColor: hexColor, 
                        inset: -8,
                        border: `2px solid ${hexColor}`,
                        boxShadow: `0 0 20px ${hexColor}40`,
                      }}
                      animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute rounded-full"
                      style={{ 
                        borderColor: hexColor, 
                        inset: -14,
                        border: `1px solid ${hexColor}`,
                      }}
                      animate={{ scale: [1, 1.22, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                    />
                    <motion.div
                      className="absolute rounded-full"
                      style={{ 
                        inset: -3,
                        background: `radial-gradient(circle, ${hexColor}30 0%, transparent 70%)`,
                      }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </>
                )}

                {/* Complete node golden glow */}
                {isComplete && (
                  <motion.div
                    className="absolute rounded-full"
                    style={{ 
                      inset: -4,
                      background: `radial-gradient(circle, ${hexColor}20 0%, transparent 70%)`,
                      border: `2px solid ${hexColor}60`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}

                {/* Progress ring */}
                {node.progressoPercent > 0 && (
                  <ProgressRing size={circleSize} progress={node.progressoPercent} color={hexColor} isActive={node.isActive} />
                )}

                {/* Main circle */}
                <div
                  className="rounded-full flex items-center justify-center relative overflow-hidden"
                  style={{
                    width: circleSize,
                    height: circleSize,
                    border: node.isActive
                      ? `3px solid ${hexColor}`
                      : isComplete
                        ? `2px solid ${hexColor}90`
                        : "2px solid rgba(255,255,255,0.12)",
                    boxShadow: node.isActive
                      ? `0 0 25px ${hexColor}50, inset 0 0 15px ${hexColor}20`
                      : isComplete
                        ? `0 4px 20px ${hexColor}40, inset 0 0 10px ${hexColor}15`
                        : `0 4px 12px rgba(0,0,0,0.3)`,
                    background: isComplete
                      ? `radial-gradient(circle at 30% 30%, ${hexColor}, ${hexColor}bb)`
                      : `radial-gradient(circle at 30% 30%, ${hexColor}ee, ${hexColor}99)`,
                  }}
                >
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
                    }}
                  />
                  
                  {node.parcial && !node.temQuestoes ? (
                    <Loader2 className="w-7 h-7 animate-spin text-white relative z-10" style={{ opacity: 0.9 }} />
                  ) : isComplete ? (
                    <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <Icon
                      className="w-7 h-7 text-white relative z-10"
                      style={{ opacity: node.isActive ? 1 : 0.7 }}
                    />
                  )}
                </div>

                {/* Heart favorite badge (top-right) — hidden when locked */}
                {!isLocked && onToggleFavorito && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorito(node.tema);
                    }}
                    className="absolute w-7 h-7 rounded-full flex items-center justify-center shadow-lg z-10 transition-colors"
                    style={{
                      top: 0,
                      right: 0,
                      backgroundColor: isFavorited ? "#dc2626" : "rgba(30,30,40,0.85)",
                      border: isFavorited ? "2px solid #fca5a5" : "2px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <Heart
                      className="w-3.5 h-3.5 transition-all"
                      style={{
                        color: isFavorited ? "white" : "rgba(255,255,255,0.7)",
                        fill: isFavorited ? "white" : "none",
                      }}
                    />
                  </motion.button>
                )}

                {/* Lock badge for premium-gated items */}
                {isLocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute w-8 h-8 rounded-full flex items-center justify-center z-10"
                    style={{
                      top: 0,
                      right: 0,
                      backgroundColor: "rgba(180,130,0,0.92)",
                      border: "2px solid #f59e0b",
                      boxShadow: "0 0 12px rgba(245,158,11,0.7), 0 2px 8px rgba(0,0,0,0.4)",
                    }}
                  >
                    <Lock className="w-4 h-4 text-amber-300" style={{ filter: "drop-shadow(0 0 3px rgba(251,191,36,0.9))" }} />
                  </motion.div>
                )}

                {/* Numbering badge (bottom-left) */}
                <div
                  className="absolute w-6 h-6 rounded-full flex items-center justify-center z-10 text-[10px] font-bold text-white"
                  style={{
                    bottom: 0,
                    left: 0,
                    backgroundColor: "rgba(15,15,25,0.9)",
                    border: `2px solid ${hexColor}60`,
                  }}
                >
                  {node.index + 1}
                </div>
              </motion.div>

              {/* Label with glassmorphism */}
              <div className="mt-2.5 text-center w-[150px]">
                <div className="inline-block px-3 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
                  <p className="text-xs text-white font-semibold leading-tight">
                    {node.tema}
                  </p>
                </div>
                <div 
                  className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ 
                    background: `${hexColor}25`,
                    color: hexColor,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${hexColor}30`,
                  }}
                >
                  {isComplete ? (
                    <>✓ {node.totalQuestoes} {badgeLabel || "questões"}</>
                  ) : node.parcial ? (
                    <>{node.subtemasGerados}/{node.totalSubtemas} {badgeLabel || "subtemas"}</>
                  ) : (
                    <>{node.totalSubtemas} {badgeLabel || "subtemas"}</>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
