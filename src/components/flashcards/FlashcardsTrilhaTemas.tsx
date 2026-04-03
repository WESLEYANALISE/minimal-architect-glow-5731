import { motion } from "framer-motion";
import { Brain, Heart, Loader2, Lock } from "lucide-react";

const SERPENTINE_X = [50, 78, 50, 22];
const getNodeX = (idx: number) => SERPENTINE_X[idx % SERPENTINE_X.length];
const NODE_SIZE = 110;
const ACTIVE_NODE_SIZE = 130;
const VERTICAL_SPACING = 170;
const CONTAINER_WIDTH = 360;

interface TemaItem {
  tema: string;
  temFlashcards: boolean;
  parcial: boolean;
  subtemasGerados: number;
  totalSubtemas: number;
  totalFlashcards: number;
  progressoPercent: number;
  ordem: number;
}

interface FlashcardsTrilhaTemasProps {
  temas: TemaItem[];
  hexColor: string;
  onTemaClick: (tema: string) => void;
  favoritos: string[];
  onToggleFavorito: (tema: string) => void;
  lockedFromIndex?: number;
  onLockedClick?: () => void;
}

const ProgressRing = ({ size, progress, color }: { size: number; progress: number; color: string }) => {
  const radius = size / 2 + 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 100) / 100);

  return (
    <svg
      className="absolute pointer-events-none"
      width={size + 8}
      height={size + 8}
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <circle
        cx={(size + 8) / 2}
        cy={(size + 8) / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="3"
      />
      <motion.circle
        cx={(size + 8) / 2}
        cy={(size + 8) / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        whileInView={{ strokeDashoffset: offset }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
      />
    </svg>
  );
};

export const FlashcardsTrilhaTemas = ({ temas, hexColor, onTemaClick, favoritos, onToggleFavorito, lockedFromIndex, onLockedClick }: FlashcardsTrilhaTemasProps) => {
  const firstIncompleteIdx = temas.findIndex(t => !t.temFlashcards);

  const nodes = temas.map((tema, i) => {
    const isActive = i === firstIncompleteIdx;
    const size = isActive ? ACTIVE_NODE_SIZE : NODE_SIZE;
    const x = (getNodeX(i) / 100) * CONTAINER_WIDTH;
    const y = i * VERTICAL_SPACING + size / 2 + 20;
    return { ...tema, x, y, size, isActive, index: i };
  });

  const totalHeight = temas.length * VERTICAL_SPACING + 100;

  // Build Bezier path
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
        {/* SVG connectors */}
        {svgPath && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${CONTAINER_WIDTH} ${totalHeight}`} fill="none">
            <defs>
              <filter id="flashcard-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Background path */}
            <motion.path
              d={svgPath}
              stroke={`${hexColor}25`}
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
            {/* Foreground path */}
            <motion.path
              d={svgPath}
              stroke={`${hexColor}60`}
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              filter="url(#flashcard-glow)"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
            {/* Energy flow animation */}
            <circle r="4" fill={hexColor} opacity="0.8" filter="url(#flashcard-glow)">
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                path={svgPath}
              />
              <animate
                attributeName="opacity"
                values="0.3;0.9;0.3"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values="3;5;3"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        )}

        {/* Nodes */}
        {nodes.map((node) => {
          const circleSize = node.isActive ? 90 : 76;
          const isFav = favoritos.includes(node.tema);
          const isLocked = lockedFromIndex !== undefined && node.index >= lockedFromIndex;

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
                style={{ width: circleSize + 16, height: circleSize + 16 }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                {/* Pulse ring for active node */}
                {node.isActive && !isLocked && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2"
                      style={{ borderColor: hexColor, inset: -6 }}
                      animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border"
                      style={{ borderColor: hexColor, inset: -10 }}
                      animate={{ scale: [1, 1.18, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    />
                  </>
                )}

                {/* Progress ring */}
                {node.progressoPercent > 0 && !isLocked && (
                  <ProgressRing size={circleSize} progress={node.progressoPercent} color={hexColor} />
                )}

                <div
                  className="rounded-full flex items-center justify-center shadow-xl"
                  style={{
                    width: circleSize,
                    height: circleSize,
                    border: node.isActive
                      ? `3px solid ${hexColor}`
                      : "2px solid rgba(255,255,255,0.15)",
                    boxShadow: node.isActive
                      ? `0 0 15px ${hexColor}40`
                      : `0 4px 12px ${hexColor}30`,
                    background: `linear-gradient(135deg, ${hexColor}, ${hexColor}cc)`,
                  }}
                >
                  <Brain
                    className="w-7 h-7 text-white"
                    style={{
                      opacity: node.temFlashcards || node.isActive ? 1 : 0.6,
                    }}
                  />
                </div>

                {/* Badge: Lock for locked items, Heart for unlocked */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-10 cursor-pointer"
                  style={{
                    top: 0,
                    right: 0,
                    backgroundColor: isLocked
                      ? "rgba(180,130,0,0.92)"
                      : isFav ? "#ef4444" : "rgba(30,30,40,0.85)",
                    border: isLocked
                      ? "2px solid #f59e0b"
                      : isFav ? "2px solid #fca5a5" : "2px solid rgba(255,255,255,0.2)",
                    boxShadow: isLocked ? "0 0 12px rgba(245,158,11,0.7), 0 2px 8px rgba(0,0,0,0.4)" : undefined,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isLocked) {
                      onLockedClick?.();
                    } else {
                      onToggleFavorito(node.tema);
                    }
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                >
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-amber-300" style={{ filter: "drop-shadow(0 0 3px rgba(251,191,36,0.9))" }} />
                  ) : (
                    <Heart
                      className="w-3.5 h-3.5"
                      style={{
                        color: isFav ? "white" : "rgba(255,255,255,0.5)",
                        fill: isFav ? "white" : "none",
                      }}
                    />
                  )}
                </motion.div>
              </motion.div>

              {/* Tema name below - NO truncation */}
              <div className="mt-2 text-center w-[140px]">
                <p className="text-xs text-white/90 font-medium leading-tight">
                  {node.tema}
                </p>
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: `${hexColor}` }}>
                  {node.temFlashcards
                    ? `${node.totalFlashcards} flashcards`
                    : node.parcial
                      ? `${node.subtemasGerados}/${node.totalSubtemas} subtemas`
                      : `${node.totalSubtemas} subtemas`}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
