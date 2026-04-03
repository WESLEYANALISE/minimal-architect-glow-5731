import { useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Star, CheckCircle2, Loader2 } from "lucide-react";

const NODE_RADIUS = 28;
const NODE_DIAMETER = NODE_RADIUS * 2;
const VERTICAL_SPACING = 72;
const CONTAINER_WIDTH = 340;
const PADDING_X = 56;
const PADDING_TOP = 55;

const COLORS = [
  "#ef4444", "#dc2626", "#b91c1c", "#ef4444", "#f97316",
  "#dc2626", "#ef4444", "#b91c1c", "#f97316", "#ef4444",
];

const COLS = [PADDING_X, CONTAINER_WIDTH / 2, CONTAINER_WIDTH - PADDING_X];

interface ArtigoNode {
  id: number;
  tema: string;
  casoStatus?: string;
  casoProgresso?: number;
  concluido: boolean;
  pontuacao: number;
}

interface Props {
  artigos: ArtigoNode[];
  onArtigoClick: (tema: string) => void;
  isAdmin?: boolean;
}

export const TrilhaSerpentinaCasoPratico = ({ artigos, onArtigoClick, isAdmin }: Props) => {
  const activeRef = useRef<HTMLDivElement>(null);

  // Find first non-completed article
  const maxUnlocked = useMemo(() => {
    if (isAdmin) return artigos.length;
    for (let i = 0; i < artigos.length; i++) {
      if (!artigos[i].concluido) return i + 1;
    }
    return artigos.length;
  }, [artigos, isAdmin]);

  const nodes = useMemo(() => {
    return artigos.map((artigo, i) => {
      const groupOf3 = Math.floor(i / 3);
      const posInGroup = i % 3;
      const isReversed = groupOf3 % 2 === 1;
      const x = isReversed ? COLS[2 - posInGroup] : COLS[posInGroup];
      const y = PADDING_TOP + i * VERTICAL_SPACING;
      const blockIndex = Math.floor(i / 10);
      return { ...artigo, x, y, color: COLORS[blockIndex % COLORS.length], index: i };
    });
  }, [artigos]);

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
      return { d, color: curr.color, unlocked: curr.index + 1 <= maxUnlocked };
    });
  }, [nodes, maxUnlocked]);

  // Format article number: "1" -> "1º", "121-A" -> "121-A"
  const extractNumber = (tema: string): string => {
    const cleaned = tema.replace(/[ºª]/g, '').trim();
    const match = cleaned.match(/^(\d+)(-[A-Za-z])?/);
    if (!match) return tema.substring(0, 4);
    return match[2] ? `${match[1]}${match[2]}` : `${match[1]}º`;
  };

  return (
    <div className="overflow-y-auto flex justify-center pb-24" style={{ maxHeight: "calc(100vh - 160px)" }}>
      <div className="relative" style={{ width: CONTAINER_WIDTH, height: totalHeight }}>
        {/* SVG connections */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={CONTAINER_WIDTH}
          height={totalHeight}
          style={{ zIndex: 0 }}
        >
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
                stroke={pathUnlocked ? path.color : "rgba(255,255,255,0.15)"}
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

        {/* Block banners every 10 */}
        {nodes.filter((_, i) => i % 10 === 0).map((node) => {
          const blockNum = Math.floor(node.index / 10) + 1;
          return (
            <div
              key={`banner-${blockNum}`}
              className="absolute"
              style={{
                top: node.y - NODE_RADIUS - 22,
                left: node.x + NODE_RADIUS + 8,
              }}
            >
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg whitespace-nowrap"
                style={{ backgroundColor: node.color, boxShadow: `0 2px 8px ${node.color}40` }}
              >
                Bloco {blockNum}
              </span>
            </div>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isLocked = !isAdmin && node.index + 1 > maxUnlocked;
          const isCurrent = isAdmin
            ? node.index === 0 && !node.concluido
            : node.index + 1 === maxUnlocked;
          const isGerando = node.casoStatus === "gerando";

          return (
            <motion.div
              key={node.id}
              ref={isCurrent ? activeRef : undefined}
              initial={{ opacity: 0, scale: 0.3 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ delay: (node.index % 5) * 0.03, type: "spring", stiffness: 260, damping: 22 }}
              className="absolute flex flex-col items-center"
              style={{
                left: node.x - NODE_RADIUS,
                top: node.y - NODE_RADIUS,
                zIndex: isCurrent ? 10 : 1,
              }}
            >
              {/* Pulse for current */}
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
                      width: NODE_DIAMETER + 28,
                      height: NODE_DIAMETER + 28,
                      left: -14,
                      top: -14,
                      border: `1.5px solid ${node.color}`,
                    }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: 0.25 }}
                  />
                </>
              )}

              <button
                onClick={() => !isLocked && onArtigoClick(node.tema)}
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
                    fontSize: 13,
                    ...(!isLocked ? {
                      background: node.concluido
                        ? `linear-gradient(145deg, ${node.color}, ${node.color}cc)`
                        : `linear-gradient(145deg, ${node.color}ee, ${node.color}bb, ${node.color}99)`,
                      boxShadow: isCurrent
                        ? `0 0 28px ${node.color}60, 0 4px 18px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)`
                        : node.concluido
                          ? `0 3px 12px ${node.color}40, inset 0 2px 4px rgba(255,255,255,0.25)`
                          : `0 3px 12px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.2)`,
                    } : {}),
                  }}
                >
                  {isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : isGerando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : node.concluido ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-bold">{extractNumber(node.tema)}</span>
                  )}
                </div>

                {/* Stars for completed */}
                {node.concluido && (
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3].map((s) => {
                      const stars = node.pontuacao >= 80 ? 3 : node.pontuacao >= 50 ? 2 : 1;
                      return (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= stars
                              ? "text-amber-400 fill-amber-400 drop-shadow-[0_1px_3px_rgba(251,191,36,0.6)]"
                              : "text-muted-foreground/20"
                          }`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Generating badge */}
                {isGerando && (
                  <span className="text-[9px] text-amber-400 mt-1 whitespace-nowrap">
                    {node.casoProgresso || 0}%
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
