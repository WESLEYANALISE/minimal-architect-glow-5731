import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileImage, ZoomIn, ZoomOut, RotateCcw, Share2, Plus, Minus, Type } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useExternalBrowser } from '@/hooks/use-external-browser';
import ShareMapaWhatsAppModal from './ShareMapaWhatsAppModal';
import { getIconForContext } from '@/lib/legalIcons';

// ═══════════════ TYPES ═══════════════

interface Item {
  numero: string;
  texto: string;
}

interface Subsecao {
  numero: string;
  titulo: string;
  itens: Item[];
  exemplo?: string;
  termos?: string[];
  dica_prova?: string;
}

interface Secao {
  numero: string;
  titulo: string;
  subsecoes: Subsecao[];
}

interface MapaData {
  titulo: string;
  area: string;
  secoes: Secao[];
}

interface MapaMentalCanvasProps {
  dados: MapaData;
  areaColor: string;
}

// ═══════════════ THEME PALETTE ═══════════════

const BRANCH_COLORS = [
  { bg: '#0d1b3e', border: '#3b82f6', accent: '#60a5fa', text: '#dbeafe', glow: 'rgba(59,130,246,0.3)', card: '#0f2249' },
  { bg: '#1c0d3e', border: '#8b5cf6', accent: '#a78bfa', text: '#ede9fe', glow: 'rgba(139,92,246,0.3)', card: '#1f1049' },
  { bg: '#0d2e1f', border: '#10b981', accent: '#34d399', text: '#d1fae5', glow: 'rgba(16,185,129,0.3)', card: '#0f3525' },
  { bg: '#2e1f0d', border: '#f59e0b', accent: '#fbbf24', text: '#fef3c7', glow: 'rgba(245,158,11,0.3)', card: '#352510' },
  { bg: '#2e0d1f', border: '#ec4899', accent: '#f472b6', text: '#fce7f3', glow: 'rgba(236,72,153,0.3)', card: '#351025' },
  { bg: '#0d2e2e', border: '#06b6d4', accent: '#22d3ee', text: '#cffafe', glow: 'rgba(6,182,212,0.3)', card: '#0f3535' },
];

const SECTION_ICONS: Record<number, string> = {
  0: '📖', 1: '⚖️', 2: '⚙️', 3: '📋', 4: '🔑', 5: '🏛️',
};

// ═══════════════ FONT SCALE SYSTEM ═══════════════

const FONT_SCALES = [1, 1.2, 1.4] as const;
const FONT_LABELS = ['A', 'A+', 'A++'] as const;

// ═══════════════ LAYOUT CONSTANTS ═══════════════

const COLUMN_W = 420;       // width of each tower column
const COLUMN_GAP = 60;      // horizontal gap between columns
const TITLE_H = 100;
const TITLE_MARGIN_BOTTOM = 80;
const TOP_PADDING = 50;
const SIDE_PADDING = 60;

// ═══════════════ TOWER LAYOUT CALCULATION ═══════════════

interface TowerLayout {
  colIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  secao: Secao;
  theme: typeof BRANCH_COLORS[0];
  branchIndex: number;
}

interface BezierConnection {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

function calculateConstellationLayout(dados: MapaData) {
  const secoes = dados.secoes.slice(0, 6);
  const numSections = secoes.length;
  const numCols = numSections <= 1 ? 1 : numSections <= 3 ? 2 : 3;
  const totalGridW = numCols * COLUMN_W + (numCols - 1) * COLUMN_GAP;
  const titleW = Math.min(totalGridW, 600);
  const titleX = SIDE_PADDING + (totalGridW - titleW) / 2;
  const titleY = TOP_PADDING;
  const towersStartY = titleY + TITLE_H + TITLE_MARGIN_BOTTOM;

  const columns: number[][] = Array.from({ length: numCols }, () => []);
  secoes.forEach((_, i) => { columns[i % numCols].push(i); });

  const towers: TowerLayout[] = [];
  const columnHeights = new Array(numCols).fill(0);

  columns.forEach((colSections, colIdx) => {
    let yOffset = towersStartY;
    if (colIdx % 2 === 1 && numCols > 1) yOffset += 40;

    colSections.forEach((secIdx) => {
      const sec = secoes[secIdx];
      const theme = BRANCH_COLORS[secIdx % BRANCH_COLORS.length];
      const headerH = 70;
      const subH = sec.subsecoes.reduce((total, sub) => {
        let h = 60;
        h += sub.itens.length * 28;
        if (sub.exemplo) h += 50;
        if (sub.dica_prova) h += 50;
        if (sub.termos?.length) h += 36;
        return total + h + 16;
      }, 0);
      const estimatedH = headerH + subH + 40;
      const x = SIDE_PADDING + colIdx * (COLUMN_W + COLUMN_GAP);

      towers.push({ colIndex: colIdx, x, y: yOffset, width: COLUMN_W, height: estimatedH, secao: sec, theme, branchIndex: secIdx });
      yOffset += estimatedH + 90;
      columnHeights[colIdx] = yOffset;
    });
  });

  const maxColH = Math.max(...columnHeights, towersStartY + 200);
  const canvasW = SIDE_PADDING * 2 + totalGridW;
  const canvasH = maxColH + 80;

  const titleCenterX = titleX + titleW / 2;
  const titleBottomY = titleY + TITLE_H;
  const beziers: BezierConnection[] = towers.map(t => ({
    fromX: titleCenterX, fromY: titleBottomY,
    toX: t.x + t.width / 2, toY: t.y, color: t.theme.border,
  }));

  return { titleX, titleY, titleW, towers, beziers, canvasW, canvasH, numSections: secoes.length };
}

// ═══════════════ SVG CONNECTIONS (with draw-in animation) ═══════════════

function BezierConnections({ beziers, canvasW, canvasH }: {
  beziers: BezierConnection[]; canvasW: number; canvasH: number;
}) {
  return (
    <svg width={canvasW} height={canvasH} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}>
      <defs>
        <filter id="bezierGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {beziers.map((b, i) => (
          <linearGradient key={`grad-${i}`} id={`bezGrad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor={b.color} stopOpacity="0.9" />
          </linearGradient>
        ))}
      </defs>
      {beziers.map((b, i) => {
        const dy = b.toY - b.fromY;
        const cp1Y = b.fromY + dy * 0.35;
        const cp2Y = b.toY - dy * 0.35;
        const d = `M ${b.fromX} ${b.fromY} C ${b.fromX} ${cp1Y}, ${b.toX} ${cp2Y}, ${b.toX} ${b.toY}`;
        // Estimate path length for stroke-dasharray animation
        const pathLen = Math.sqrt((b.toX - b.fromX) ** 2 + (b.toY - b.fromY) ** 2) * 1.4;

        return (
          <g key={i}>
            <path d={d} stroke={b.color} strokeWidth={8} fill="none" opacity={0.08} filter="url(#bezierGlow)" />
            <path
              d={d} stroke={`url(#bezGrad-${i})`} strokeWidth={2.5} fill="none"
              strokeLinecap="round" opacity={0.85}
              style={{
                strokeDasharray: pathLen,
                strokeDashoffset: pathLen,
                animation: `drawLine 0.8s ease-out ${0.3 + i * 0.12}s forwards`,
              }}
            />
            <circle cx={b.fromX} cy={b.fromY} r={4} fill="#ffffff" opacity={0.6}
              style={{ animation: `nodeAppear 0.4s ease-out 0.2s both` }} />
            <circle cx={b.fromX} cy={b.fromY} r={8} fill="#ffffff" opacity={0.08} />
            <circle cx={b.toX} cy={b.toY} r={5} fill={b.color} opacity={0.9}
              style={{ animation: `nodeAppear 0.4s ease-out ${0.5 + i * 0.12}s both` }} />
            <circle cx={b.toX} cy={b.toY} r={10} fill={b.color} opacity={0.15} />
          </g>
        );
      })}
    </svg>
  );
}

// ═══════════════ TITLE BANNER (with scale-in animation) ═══════════════

function TitleBanner({ x, y, w, titulo, area, numSections, fs }: {
  x: number; y: number; w: number;
  titulo: string; area: string; numSections: number;
  fs: (base: number) => number;
}) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: w, height: TITLE_H, zIndex: 20,
      animation: 'titleScaleIn 0.4s ease-out both',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '20px',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1145 40%, #0f0b2a 100%)',
        border: '1.5px solid rgba(139,92,246,0.35)',
        boxShadow: '0 12px 60px rgba(139,92,246,0.12), 0 0 0 1px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.06) 50%, transparent 100%)', animation: 'shimmer 3s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-50%', left: '30%', width: '40%', height: '200%', background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <h1 style={{ color: '#f1f5f9', fontSize: `${fs(20)}px`, fontWeight: 800, margin: 0, lineHeight: 1.3, letterSpacing: '-0.02em', textAlign: 'center', position: 'relative', zIndex: 1, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
          {titulo}
        </h1>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '30px', height: '1px', background: 'linear-gradient(to right, transparent, rgba(139,92,246,0.5))' }} />
          <span style={{ color: '#a78bfa', fontSize: `${fs(10)}px`, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{area}</span>
          <div style={{ width: '30px', height: '1px', background: 'linear-gradient(to left, transparent, rgba(139,92,246,0.5))' }} />
          <div style={{ padding: '2px 8px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <span style={{ color: '#c4b5fd', fontSize: `${fs(9)}px`, fontWeight: 700 }}>{numSections} seções</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════ SECTION TOWER (with staggered slide-in) ═══════════════

function SectionTower({ tower, fs }: { tower: TowerLayout; fs: (base: number) => number }) {
  const { secao, theme, branchIndex } = tower;
  const icon = getIconForContext(secao.titulo) || SECTION_ICONS[branchIndex] || '📌';

  return (
    <div style={{
      position: 'absolute', left: tower.x, top: tower.y,
      width: tower.width, zIndex: 10,
      animation: `towerSlideIn 0.5s ease-out ${branchIndex * 0.12}s both`,
    }}>
      {/* Section Header Card */}
      <div style={{
        borderRadius: '16px 16px 0 0',
        background: `linear-gradient(145deg, ${theme.bg}, #080814)`,
        borderTop: `4px solid ${theme.border}`,
        borderLeft: `1px solid ${theme.border}30`,
        borderRight: `1px solid ${theme.border}30`,
        boxShadow: `0 -4px 30px ${theme.glow}, 0 4px 20px rgba(0,0,0,0.4)`,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px',
          background: `linear-gradient(135deg, ${theme.border}25, ${theme.border}10)`,
          border: `1.5px solid ${theme.border}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: `${fs(20)}px`, flexShrink: 0,
          boxShadow: `0 0 20px ${theme.glow}`,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: theme.accent, fontSize: `${fs(9)}px`, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3px', opacity: 0.8 }}>
            Seção {secao.numero}
          </div>
          <div style={{ color: '#f1f5f9', fontSize: `${fs(14)}px`, fontWeight: 700, lineHeight: 1.3 }}>
            {secao.titulo}
          </div>
        </div>
        <div style={{ padding: '4px 10px', borderRadius: '8px', background: `${theme.border}15`, border: `1px solid ${theme.border}30` }}>
          <span style={{ color: theme.accent, fontSize: `${fs(10)}px`, fontWeight: 700 }}>{secao.subsecoes.length}</span>
        </div>
      </div>

      {/* Spine + Subsection Cards */}
      <div style={{
        position: 'relative',
        borderLeft: `1px solid ${theme.border}30`, borderRight: `1px solid ${theme.border}30`,
        borderBottom: `1px solid ${theme.border}20`, borderRadius: '0 0 16px 16px',
        background: `linear-gradient(180deg, ${theme.bg}80, #060611)`,
        padding: '0', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', left: '24px', top: 0, bottom: 0, width: '2px', background: `linear-gradient(180deg, ${theme.border}60, ${theme.border}10)`, zIndex: 1 }} />
        {secao.subsecoes.map((sub, si) => (
          <SubsectionCard key={si} sub={sub} theme={theme} index={si} isLast={si === secao.subsecoes.length - 1} fs={fs} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════ SUBSECTION CARD ═══════════════

function SubsectionCard({ sub, theme, index, isLast, fs }: {
  sub: Subsecao; theme: typeof BRANCH_COLORS[0]; index: number; isLast: boolean;
  fs: (base: number) => number;
}) {
  return (
    <div style={{
      padding: `16px 16px 16px 46px`,
      borderBottom: isLast ? 'none' : `1px solid ${theme.border}12`,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', left: '16px', top: '28px', width: '20px', height: '2px', background: theme.border, opacity: 0.5, zIndex: 2 }} />
      <div style={{ position: 'absolute', left: '20px', top: '24px', width: '10px', height: '10px', borderRadius: '50%', background: theme.border, border: `2px solid ${theme.bg}`, boxShadow: `0 0 8px ${theme.glow}`, zIndex: 3 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ minWidth: '28px', height: '22px', borderRadius: '7px', background: `${theme.border}20`, border: `1px solid ${theme.border}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: theme.accent, fontSize: `${fs(10)}px`, fontWeight: 800 }}>{sub.numero}</span>
        </div>
        <span style={{ color: theme.text, fontSize: `${fs(12)}px`, fontWeight: 700, lineHeight: 1.3 }}>{sub.titulo}</span>
      </div>

      {sub.itens.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
          {sub.itens.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ minWidth: '6px', height: '6px', borderRadius: '50%', background: theme.accent, opacity: 0.6, marginTop: '5px', flexShrink: 0 }} />
              <span style={{ color: '#b8c5d6', fontSize: `${fs(10.5)}px`, lineHeight: 1.65 }}>{item.texto}</span>
            </div>
          ))}
        </div>
      )}

      {sub.exemplo && (
        <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: `${fs(13)}px`, flexShrink: 0 }}>💡</span>
          <span style={{ color: '#93c5fd', fontSize: `${fs(9.5)}px`, lineHeight: 1.6, fontStyle: 'italic' }}>{sub.exemplo}</span>
        </div>
      )}

      {sub.dica_prova && (
        <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '10px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: `${fs(13)}px`, flexShrink: 0 }}>🎯</span>
          <span style={{ color: '#fde68a', fontSize: `${fs(9.5)}px`, lineHeight: 1.6, fontWeight: 600 }}>{sub.dica_prova}</span>
        </div>
      )}

      {sub.termos && sub.termos.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {sub.termos.map((t, i) => (
            <span key={i} style={{ padding: '3px 10px', borderRadius: '8px', fontSize: `${fs(8.5)}px`, fontWeight: 700, color: theme.accent, background: `${theme.border}12`, border: `1px solid ${theme.border}28` }}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════ WHATSAPP TEXT ═══════════════

function mapaToWhatsAppText(dados: MapaData): string {
  const lines: string[] = [];
  lines.push(`╔════════════╗`);
  lines.push(`   *🧠 ${dados.titulo}*`);
  lines.push(`╚════════════╝`);
  lines.push(`📚 _${dados.area}_\n`);

  const emojis = ['📖', '🔑', '⚙️', '⚠️', '📋'];

  dados.secoes.forEach((sec, i) => {
    lines.push(`━━━━━━━━━━`);
    lines.push(`${emojis[i] || '📌'} *RAMO ${sec.numero} — ${sec.titulo}*\n`);

    sec.subsecoes.forEach(sub => {
      lines.push(`🔹 *${sub.titulo}*`);
      sub.itens.forEach(item => {
        lines.push(`  • ${item.texto}`);
      });
      if (sub.exemplo) {
        lines.push(`  💡 _Ex: ${sub.exemplo}_`);
      }
      if (sub.dica_prova) {
        lines.push(`  🎯 *Dica p/ prova:* ${sub.dica_prova}`);
      }
      if (sub.termos?.length) {
        lines.push(`  🏷️ ${sub.termos.join(' | ')}`);
      }
      lines.push('');
    });
  });

  lines.push(`━━━━━━━━━━`);
  lines.push(`✨ _Direito Premium_`);
  lines.push(`📱 _Mapa Mental gerado por IA_`);

  return lines.join('\n');
}

// ═══════════════ FLOATING CONTROLS PILL ═══════════════

function FloatingMapControls({ zoom, setZoom, fontScaleIndex, setFontScaleIndex }: {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  fontScaleIndex: number;
  setFontScaleIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div
      className="floating-controls-pill"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '16px',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 6px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Zoom In */}
      <button
        onClick={() => setZoom(z => Math.min(3, z + 0.15))}
        style={floatingBtnStyle}
        title="Zoom +"
      >
        <ZoomIn style={{ width: 16, height: 16 }} />
      </button>

      {/* Zoom % */}
      <div style={{
        color: 'rgba(255,255,255,0.6)',
        fontSize: '9px',
        fontWeight: 700,
        textAlign: 'center',
        padding: '2px 0',
        userSelect: 'none',
      }}>
        {Math.round(zoom * 100)}%
      </div>

      {/* Zoom Out */}
      <button
        onClick={() => setZoom(z => Math.max(0.2, z - 0.15))}
        style={floatingBtnStyle}
        title="Zoom -"
      >
        <ZoomOut style={{ width: 16, height: 16 }} />
      </button>

      {/* Reset */}
      <button
        onClick={() => setZoom(0.55)}
        style={floatingBtnStyle}
        title="Resetar zoom"
      >
        <RotateCcw style={{ width: 14, height: 14 }} />
      </button>

      {/* Divider */}
      <div style={{ width: '70%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px auto' }} />

      {/* Font size toggle */}
      <button
        onClick={() => setFontScaleIndex(i => (i + 1) % FONT_SCALES.length)}
        style={{
          ...floatingBtnStyle,
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
        }}
        title={`Fonte: ${FONT_LABELS[fontScaleIndex]}`}
      >
        {FONT_LABELS[fontScaleIndex]}
      </button>
    </div>
  );
}

const floatingBtnStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  border: 'none',
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
};

// ═══════════════ MAIN COMPONENT ═══════════════

export const MapaMentalCanvas = ({ dados, areaColor }: MapaMentalCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nomeUsuarioRef = useRef("Estudante");
  const [zoom, setZoom] = useState(0.55);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [fontScaleIndex, setFontScaleIndex] = useState(0);
  const { openUrl } = useExternalBrowser();

  const fontScale = FONT_SCALES[fontScaleIndex];
  const fs = useCallback((base: number) => base * fontScale, [fontScale]);

  // Fetch user name for PDF cover
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        supabase.from('profiles').select('nome').eq('id', data.user.id).maybeSingle().then(({ data: profile }) => {
          if (profile?.nome) nomeUsuarioRef.current = profile.nome;
        });
      }
    });
  }, []);

  // Improved pinch-to-zoom with midpoint origin
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let initialZoom = 0.55;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches);
        initialZoom = zoom;
      }
    };

    let rafId: number | null = null;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const currentDistance = getDistance(e.touches);
          const scale = currentDistance / initialDistance;
          const newZoom = Math.max(0.3, Math.min(2.5, initialZoom * scale));
          setZoom(newZoom);
        });
      }
    };

    const handleTouchEnd = () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [zoom]);

  // Scroll-wheel zoom (Ctrl/Cmd + scroll)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom(z => Math.max(0.2, Math.min(3, z + delta)));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Convert blob to base64 string (without data URI prefix)
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // strip "data:...;base64,"
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Upload to Google Drive via edge function
  const uploadToDrive = useCallback(async (pngBlob: Blob | null, pdfBlob: Blob | null) => {
    try {
      const body: Record<string, string> = {
        area: dados.area || '',
        tema: dados.titulo || '',
        metodo: 'mapamental',
      };
      if (pngBlob) body.pngBase64 = await blobToBase64(pngBlob);
      if (pdfBlob) body.pdfBase64 = await blobToBase64(pdfBlob);

      const { data, error } = await supabase.functions.invoke('salvar-metodologia-drive', { body });
      if (error) {
        console.error('Drive upload error:', error);
        return null;
      }
      return data as { drive_png_url?: string; drive_pdf_url?: string };
    } catch (err) {
      console.error('Drive upload exception:', err);
      return null;
    }
  }, [dados]);

  // Save blob to Supabase and open, then also upload to Drive in background
  const saveToSupabaseAndOpen = useCallback(async (blob: Blob, filename: string, mimeType: string) => {
    try {
      const filePath = `mapas-mentais/${Date.now()}-${filename}`;
      const { error: uploadError } = await supabase.storage.from('pdfs').upload(filePath, blob, { contentType: mimeType, upsert: true });
      if (uploadError) {
        console.error('Erro upload:', uploadError);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = filename; link.click();
        URL.revokeObjectURL(url);
        return;
      }
      const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(filePath);
      if (urlData?.publicUrl) await openUrl(urlData.publicUrl);
    } catch (err) {
      console.error('Erro ao salvar/abrir:', err);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = filename; link.click();
      URL.revokeObjectURL(url);
    }
  }, [openUrl]);

  // Generate 2-page PDF for WhatsApp
  const generatePdfForWhatsApp = useCallback(async (): Promise<string | null> => {
    if (!canvasRef.current) return null;
    try {
      toast.loading('Gerando PDF do mapa mental...');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Page 1: Cover
      pdf.setFillColor(6, 6, 17);
      pdf.rect(0, 0, pageW, pageH, 'F');
      pdf.setDrawColor(212, 168, 83);
      pdf.setLineWidth(1.5);
      pdf.line(30, 30, pageW - 30, 30);

      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => resolve();
          logoImg.src = '/logo.webp';
        });
        if (logoImg.width > 0) {
          const logoSize = 32;
          pdf.addImage(logoImg, 'PNG', (pageW - logoSize) / 2, 40, logoSize, logoSize);
        }
      } catch { /* skip logo */ }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.setTextColor(212, 168, 83);
      pdf.text('DIREITO PRIME', pageW / 2, 85, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(180, 160, 120);
      pdf.text('Estudos Jurídicos', pageW / 2, 94, { align: 'center' });
      pdf.setDrawColor(212, 168, 83);
      pdf.setLineWidth(0.5);
      pdf.line(60, 100, pageW - 60, 100);
      pdf.setFontSize(14);
      pdf.setTextColor(150, 160, 180);
      pdf.text('🧠  MAPA MENTAL', pageW / 2, 120, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setTextColor(130, 140, 160);
      const descText = 'Um mapa mental é uma ferramenta visual que organiza informações de forma hierárquica, conectando conceitos principais a subtópicos, exemplos práticos e dicas para provas.';
      const descLines = pdf.splitTextToSize(descText, pageW - 80);
      pdf.text(descLines, pageW / 2, 132, { align: 'center' });
      pdf.setFontSize(16);
      pdf.setTextColor(220, 230, 240);
      pdf.setFont('helvetica', 'bold');
      pdf.text(dados.area, pageW / 2, 165, { align: 'center' });
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      const tituloLines = pdf.splitTextToSize(dados.titulo, pageW - 60);
      pdf.text(tituloLines, pageW / 2, 180, { align: 'center' });
      pdf.setDrawColor(212, 168, 83);
      pdf.setLineWidth(0.5);
      pdf.line(60, pageH - 50, pageW - 60, pageH - 50);
      pdf.setFontSize(10);
      pdf.setTextColor(160, 150, 130);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Enviado por ${nomeUsuarioRef.current}`, pageW / 2, pageH - 38, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 120);
      pdf.text('Gerado por IA • Direito Premium', pageW / 2, pageH - 30, { align: 'center' });
      pdf.setDrawColor(212, 168, 83);
      pdf.setLineWidth(1.5);
      pdf.line(30, pageH - 20, pageW - 30, pageH - 20);

      // Page 2: Mind map canvas
      const prevZoom = zoom;
      setZoom(1);
      await new Promise(r => setTimeout(r, 400));

      const whatsScale = 1.5;
      const canvas = await html2canvas(canvasRef.current, { backgroundColor: '#060611', scale: whatsScale, useCORS: true, logging: false });
      setZoom(prevZoom);

      const imgData = canvas.toDataURL('image/jpeg', 0.80);
      const pxToMm = 0.264583;
      const contentW = (canvas.width / whatsScale) * pxToMm;
      const contentH = (canvas.height / whatsScale) * pxToMm;

      const isLandscape = contentW > contentH;
      pdf.addPage(isLandscape ? 'landscape' : 'portrait');
      const p2W = pdf.internal.pageSize.getWidth();
      const p2H = pdf.internal.pageSize.getHeight();
      pdf.setFillColor(6, 6, 17);
      pdf.rect(0, 0, p2W, p2H, 'F');

      const margin = 8;
      const availW = p2W - margin * 2;
      const availH = p2H - margin * 2;
      const ratio = Math.min(availW / contentW, availH / contentH);
      const finalW = contentW * ratio;
      const finalH = contentH * ratio;
      pdf.addImage(imgData, 'JPEG', (p2W - finalW) / 2, (p2H - finalH) / 2, finalW, finalH, undefined, 'FAST');

      const pdfBlob = pdf.output('blob');
      const filePath = `mapas-mentais/${Date.now()}-mapa-mental.pdf`;
      const { error: uploadError } = await supabase.storage.from('pdfs').upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });
      if (uploadError) {
        console.error('Erro upload PDF:', uploadError);
        toast.dismiss();
        toast.error('Erro ao fazer upload do PDF');
        return null;
      }
      const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(filePath);
      toast.dismiss();
      return urlData?.publicUrl || null;
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.dismiss();
      toast.error('Erro ao gerar PDF');
      return null;
    }
  }, [dados, zoom]);

  const exportarPNG = async () => {
    if (!canvasRef.current) return;
    try {
      toast.loading('Gerando imagem e salvando no Drive...');
      const prevZoom = zoom;
      setZoom(1);
      await new Promise(r => setTimeout(r, 300));
      const canvas = await html2canvas(canvasRef.current, { backgroundColor: '#060611', scale: 1.5, useCORS: true });
      const filename = `mapa-mental-${dados.titulo.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.webp`;
      canvas.toBlob(async (blob) => {
        if (blob) {
          // Upload to Drive
          const driveResult = await uploadToDrive(blob, null);
          if (driveResult?.drive_png_url) {
            toast.dismiss();
            toast.success('Imagem salva no Google Drive!');
            await openUrl(driveResult.drive_png_url);
          } else {
            // Fallback to Supabase
            await saveToSupabaseAndOpen(blob, filename, 'image/webp');
            toast.dismiss();
            toast.success('Imagem salva e aberta!');
          }
        }
      }, 'image/webp', 0.80);
      setZoom(prevZoom);
    } catch { toast.dismiss(); toast.error('Erro ao gerar imagem'); }
  };

  const exportarPDF = async () => {
    if (!canvasRef.current) return;
    try {
      toast.loading('Gerando PDF e salvando no Drive...');
      const prevZoom = zoom;
      setZoom(1);
      await new Promise(r => setTimeout(r, 300));

      const exportScale = 1.5;
      const canvas = await html2canvas(canvasRef.current, { backgroundColor: '#060611', scale: exportScale, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.80);
      const pxToMm = 0.264583;
      const contentW = (canvas.width / exportScale) * pxToMm;
      const contentH = (canvas.height / exportScale) * pxToMm;

      const margin = 6;
      const pageW = contentW + margin * 2;
      const pageH = contentH + margin * 2;
      const pdf = new jsPDF({ orientation: pageW > pageH ? 'landscape' : 'portrait', unit: 'mm', format: [pageW, pageH], compress: true });
      pdf.setFillColor(6, 6, 17);
      pdf.rect(0, 0, pageW, pageH, 'F');
      pdf.addImage(imgData, 'JPEG', margin, margin, contentW, contentH, undefined, 'FAST');

      const filename = `mapa-mental-${dados.titulo.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const pdfBlob = pdf.output('blob');

      // Upload to Drive
      const driveResult = await uploadToDrive(null, pdfBlob);
      if (driveResult?.drive_pdf_url) {
        toast.dismiss();
        toast.success('PDF salvo no Google Drive!');
        await openUrl(driveResult.drive_pdf_url);
      } else {
        // Fallback to Supabase
        await saveToSupabaseAndOpen(pdfBlob, filename, 'application/pdf');
        toast.dismiss();
        toast.success('PDF salvo e aberto!');
      }
      setZoom(prevZoom);
    } catch { toast.dismiss(); toast.error('Erro ao gerar PDF'); }
  };

  const layout = calculateConstellationLayout(dados);

  return (
    <div className="space-y-3">
      {/* Export buttons — simplified top row */}
      <div className="flex items-center gap-2 justify-end flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setShowWhatsApp(true)} className="gap-1.5 h-8 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10">
          <Share2 className="w-3.5 h-3.5" /> WhatsApp
        </Button>
        <Button variant="outline" size="sm" onClick={exportarPNG} className="gap-1.5 h-8">
          <FileImage className="w-3.5 h-3.5" /> PNG
        </Button>
        <Button variant="outline" size="sm" onClick={exportarPDF} className="gap-1.5 h-8">
          <Download className="w-3.5 h-3.5" /> PDF
        </Button>
      </div>

      {/* Scrollable + zoomable container */}
      <div
        ref={containerRef}
        className="overflow-auto shadow-2xl"
        style={{
          maxHeight: '80vh',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'manipulation',
          position: 'relative',
        }}
      >
        <div
          ref={canvasRef}
          style={{
            backgroundColor: '#060611',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            position: 'relative',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: layout.canvasW,
            height: layout.canvasH,
          }}
        >
          {/* Background dot grid */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

          {/* Radial vignette */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(6,6,17,0.6) 100%)', pointerEvents: 'none', zIndex: 0 }} />

          {/* Watermark */}
          <div style={{ position: 'absolute', top: 14, left: 16, display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.12, pointerEvents: 'none', zIndex: 30 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
              <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
              <path d="M7 21h10" /><path d="M12 3v18" />
            </svg>
            <span style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Direito Prime</span>
          </div>

          {/* SVG bezier connections */}
          <BezierConnections beziers={layout.beziers} canvasW={layout.canvasW} canvasH={layout.canvasH} />

          {/* Title banner */}
          <TitleBanner x={layout.titleX} y={layout.titleY} w={layout.titleW} titulo={dados.titulo} area={dados.area} numSections={layout.numSections} fs={fs} />

          {/* Section towers */}
          {layout.towers.map((tower, i) => (
            <SectionTower key={i} tower={tower} fs={fs} />
          ))}

          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', zIndex: 10 }}>
            {BRANCH_COLORS.slice(0, dados.secoes.length).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '8px', background: `${t.border}0a`, border: `1px solid ${t.border}20` }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: t.border, boxShadow: `0 0 6px ${t.glow}` }} />
                <span style={{ color: t.accent, fontSize: `${fs(8.5)}px`, fontWeight: 600 }}>{dados.secoes[i]?.titulo || `Seção ${i + 1}`}</span>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', color: '#334155', fontSize: '8px', fontWeight: 500, zIndex: 10, whiteSpace: 'nowrap' }}>
            Mapa Mental • Gerado por IA • Direito Premium
          </div>
        </div>
      </div>

      {/* Floating controls pill — fixed to viewport */}
      <FloatingMapControls
        zoom={zoom}
        setZoom={setZoom}
        fontScaleIndex={fontScaleIndex}
        setFontScaleIndex={setFontScaleIndex}
      />

      {/* WhatsApp Share Modal */}
      <ShareMapaWhatsAppModal
        open={showWhatsApp}
        onClose={() => setShowWhatsApp(false)}
        titulo={dados.titulo}
        area={dados.area}
        conteudoTexto={mapaToWhatsAppText(dados)}
        onGeneratePdf={generatePdfForWhatsApp}
      />

      {/* Animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes towerSlideIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes titleScaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
        @keyframes nodeAppear {
          from { opacity: 0; r: 0; }
          to { opacity: 1; }
        }
        .floating-controls-pill button:hover {
          background: rgba(255,255,255,0.15) !important;
          color: #fff !important;
        }
      `}</style>
    </div>
  );
};

export default MapaMentalCanvas;
