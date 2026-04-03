import { useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Star, CheckCircle2 } from "lucide-react";
import type { ProgressoNivel } from "@/hooks/useGamificacao";

const TOTAL_NIVEIS = 100;
const NODE_RADIUS = 30;
const NODE_DIAMETER = NODE_RADIUS * 2;
const VERTICAL_SPACING = 78;
const CONTAINER_WIDTH = 340;
const PADDING_X = 56;
const PADDING_TOP = 55;

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#06b6d4",
];

const COLS = [PADDING_X, CONTAINER_WIDTH / 2, CONTAINER_WIDTH - PADDING_X];

interface Props {
  materiaSlug: string;
  progressoMap: Map<number, ProgressoNivel>;
  onNivelClick: (nivel: number) => void;
  isAdmin?: boolean;
}

export const TrilhaSerpentina100 = ({ materiaSlug, progressoMap, onNivelClick, isAdmin }: Props) => {
  const activeRef = useRef<HTMLDivElement>(null);

  const maxUnlocked = useMemo(() => {
    for (let i = TOTAL_NIVEIS; i >= 1; i--) {
      const p = progressoMap.get(i);
      if (p && p.concluido) return i + 1;
    }
    return 1;
  }, [progressoMap]);

  const nodes = useMemo(() => {
    const result: { nivel: number; x: number; y: number; color: string }[] = [];
    for (let i = 0; i < TOTAL_NIVEIS; i++) {
      const nivel = i + 1;
      const blockIndex = Math.floor(i / 10);
      const groupOf3 = Math.floor(i / 3);
      const posInGroup = i % 3;
      const isReversed = groupOf3 % 2 === 1;
      let x: number;
      if (isReversed) {
        x = COLS[2 - posInGroup];
      } else {
        x = COLS[posInGroup];
      }
      const y = PADDING_TOP + i * VERTICAL_SPACING;
      result.push({ nivel, x, y, color: COLORS[blockIndex % COLORS.length] });
    }
    return result;
  }, []);

  const totalHeight = nodes.length > 0 ? nodes[nodes.length - 1].y + 120 : 500;

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [maxUnlocked]);

  const paths = useMemo(() => {
    return nodes.slice(1).map((curr, i) => {
      const prev = nodes[i];
      const midY = (prev.y + curr.y) / 2;
      const d = `M ${prev.x} ${prev.y} Q ${prev.x} ${midY} ${(prev.x + curr.x) / 2} ${midY} Q ${curr.x} ${midY} ${curr.x} ${curr.y}`;
      return { d, color: curr.color, unlocked: curr.nivel <= maxUnlocked };
    });
  }, [nodes, maxUnlocked]);

  return (
    <div className="overflow-y-auto flex justify-center pb-24" style={{ maxHeight: "calc(100vh - 100px)" }}>
      <div className="relative" style={{ width: CONTAINER_WIDTH, height: totalHeight }}>
        {/* SVG connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CONTAINER_WIDTH}
          height={totalHeight}
          style={{ zIndex: 0 }}
        >
          <defs>
            {COLORS.map((color, i) => (
              <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.7" />
                <stop offset="100%" stopColor={color} stopOpacity="0.3" />
              </linearGradient>
            ))}
          </defs>
          <style>{`
            @keyframes dashFlow {
              from { stroke-dashoffset: 100; }
              to { stroke-dashoffset: 0; }
            }
          `}</style>
          {paths.map((path, i) => {
            const pathUnlocked = isAdmin || path.unlocked;
            return (
              <path
                key={i}
                d={path.d}
                stroke={pathUnlocked ? path.color : "rgba(255,255,255,0.25)"}
                strokeWidth={pathUnlocked ? 3 : 1.5}
                fill="none"
                strokeDasharray="8,8"
                opacity={pathUnlocked ? 1 : 0.4}
                strokeLinecap="round"
                style={pathUnlocked ? { animation: "dashFlow 3s linear infinite" } : undefined}
              />
            );
          })}
        </svg>

        {/* Block banners every 10 levels */}
        {nodes.filter((n) => (n.nivel - 1) % 10 === 0).map((node) => {
          const blockNum = Math.floor((node.nivel - 1) / 10) + 1;
          return (
            <div
              key={`banner-${blockNum}`}
              className="absolute flex justify-center"
              style={{
                top: node.y - NODE_RADIUS - 24,
                left: node.x + NODE_RADIUS + 10,
              }}
            >
              <span
                className="px-3 py-0.5 rounded-full text-xs font-bold text-white shadow-lg whitespace-nowrap"
                style={{ backgroundColor: node.color, boxShadow: `0 2px 10px ${node.color}40` }}
              >
                Bloco {blockNum}
              </span>
            </div>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const prog = progressoMap.get(node.nivel);
          const isLocked = isAdmin ? false : node.nivel > maxUnlocked;
          const isCurrent = isAdmin ? node.nivel === 1 && !progressoMap.get(1)?.concluido : node.nivel === maxUnlocked;
          const estrelas = prog?.estrelas || 0;
          const concluido = prog?.concluido || false;

          return (
            <motion.div
              key={node.nivel}
              ref={isCurrent ? activeRef : undefined}
              initial={{ opacity: 0, scale: 0.3 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ delay: (node.nivel % 5) * 0.03, type: "spring", stiffness: 260, damping: 22 }}
              className="absolute flex flex-col items-center"
              style={{
                left: node.x - NODE_RADIUS,
                top: node.y - NODE_RADIUS,
                zIndex: isCurrent ? 10 : 1,
              }}
            >
              {/* Double pulse for current node - pointer-events-none fix */}
              {isCurrent && (
                <>
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: NODE_DIAMETER + 16,
                      height: NODE_DIAMETER + 16,
                      left: -8,
                      top: -8,
                      border: `2px solid ${node.color}`,
                    }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: NODE_DIAMETER + 30,
                      height: NODE_DIAMETER + 30,
                      left: -15,
                      top: -15,
                      border: `1.5px solid ${node.color}`,
                    }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: 0.25 }}
                  />
                </>
              )}

              <button
                onClick={() => !isLocked && onNivelClick(node.nivel)}
                disabled={isLocked}
                className="flex flex-col items-center"
              >
                <div
                  className={`rounded-full flex items-center justify-center font-bold transition-all duration-150 active:scale-90 hover:scale-105
                    ${isLocked ? "bg-muted/40 text-muted-foreground/30 border border-muted-foreground/10" : "text-white"}
                  `}
                  style={{
                    width: NODE_DIAMETER,
                    height: NODE_DIAMETER,
                    fontSize: node.nivel >= 100 ? 14 : 16,
                    ...(!isLocked ? {
                      background: concluido
                        ? `linear-gradient(145deg, ${node.color}, ${node.color}cc)`
                        : `linear-gradient(145deg, ${node.color}ee, ${node.color}bb, ${node.color}99)`,
                      boxShadow: isCurrent
                        ? `0 0 28px ${node.color}60, 0 4px 18px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)`
                        : concluido
                          ? `0 3px 12px ${node.color}40, inset 0 2px 4px rgba(255,255,255,0.25)`
                          : `0 3px 12px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.2)`,
                    } : {}),
                  }}
                >
                  {isLocked ? (
                    <Lock className="w-4.5 h-4.5" />
                  ) : concluido ? (
                    <CheckCircle2 className="w-5.5 h-5.5" />
                  ) : (
                    node.nivel
                  )}
                </div>

                {concluido && (
                  <div className="flex gap-0.5 mt-1.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= estrelas
                            ? "text-amber-400 fill-amber-400 drop-shadow-[0_1px_3px_rgba(251,191,36,0.6)]"
                            : "text-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
