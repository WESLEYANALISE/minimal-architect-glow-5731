import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { Highlight, HIGHLIGHT_COLORS } from "@/hooks/useArtigoGrifos";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { Highlighter, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MagicGrifo {
  trechoExato: string;
  cor: 'amarelo' | 'verde' | 'azul' | 'rosa' | 'laranja';
  explicacao: string;
  hierarquia: string;
}

export const MAGIC_COLORS: Record<string, { bg: string; border: string; label: string; emoji: string }> = {
  amarelo: { bg: 'rgba(234, 179, 8, 0.55)', border: '#EAB308', label: 'Chave', emoji: '📌' },
  verde:   { bg: 'rgba(34, 197, 94, 0.55)', border: '#22C55E', label: 'Exceção', emoji: '⚠️' },
  azul:    { bg: 'rgba(59, 130, 246, 0.55)', border: '#3B82F6', label: 'Efeito', emoji: '⚖️' },
  rosa:    { bg: 'rgba(236, 72, 153, 0.55)', border: '#EC4899', label: 'Termo', emoji: '📚' },
  laranja: { bg: 'rgba(249, 115, 22, 0.55)', border: '#F97316', label: 'Pegadinha', emoji: '🎯' },
};

interface ArticleHighlighterProps {
  content: string;
  highlights: Highlight[];
  isEditing: boolean;
  selectedColor: string;
  onAddHighlight: (start: number, end: number, text: string) => void;
  onRemoveHighlightAtPosition?: (position: number) => void;
  onColorChange?: (color: string) => void;
  fontSize: number;
  hideAnnotations?: boolean;
  highlightAlteracao?: { elementoTipo: string; elementoNumero: string | null } | null;
  magicHighlights?: MagicGrifo[];
  magicMode?: boolean;
  onMagicTooltip?: (grifo: MagicGrifo, rect: { x: number; y: number }) => void;
}

// Pencil SVG cursor for editing mode
const PENCIL_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'/%3E%3C/svg%3E") 2 22, crosshair`;

export const ArticleHighlighter = ({
  content,
  highlights,
  isEditing,
  selectedColor,
  onAddHighlight,
  onRemoveHighlightAtPosition,
  onColorChange,
  fontSize,
  hideAnnotations = false,
  highlightAlteracao = null,
  magicHighlights = [],
  magicMode = false,
  onMagicTooltip,
}: ArticleHighlighterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [floatingBtn, setFloatingBtn] = useState<{ x: number; y: number; start: number; end: number; text: string } | null>(null);
  const [removePopup, setRemovePopup] = useState<{ x: number; y: number; highlightId: string } | null>(null);
  const [pencilPos, setPencilPos] = useState<{ x: number; y: number } | null>(null);
  const [localColor, setLocalColor] = useState(selectedColor);

  // Sync local color with parent
  useEffect(() => {
    setLocalColor(selectedColor);
  }, [selectedColor]);

  // Build regex to find the altered element in text
  const alteracaoRegex = useMemo(() => {
    if (!highlightAlteracao) return null;
    const tipo = highlightAlteracao.elementoTipo?.toLowerCase() || '';
    const num = highlightAlteracao.elementoNumero || '';
    
    if (tipo === 'artigo' || !tipo) return null;
    
    const extractAlineaLetter = (raw: string) => {
      const match = raw.match(/([a-z])\s*\)?$/i);
      return match ? match[1].toLowerCase() : null;
    };

    const patterns: Record<string, string | null> = {
      'inciso': `(${num ? num.replace(/[()]/g, '\\$&') : '[IVXLCDM]+'}\\s*[-–—]\\s*.+?)(?=\\n[IVXLCDM]+\\s*[-–—]|\\n§|\\nParágrafo|$)`,
      'parágrafo': num 
        ? `(§\\s*${num.replace('§', '').trim()}[°ºª]?\\s*[-–—.]?\\s*.+?)(?=\\n§\\s*\\d|$)`
        : `(§\\s*\\d+[°ºª]?\\s*[-–—.]?\\s*.+?|Parágrafo único[.:\\s]*.+?)(?=\\n§|$)`,
      'alínea': (() => {
        const letter = extractAlineaLetter(num);
        if (letter) {
          return `(${letter}\\)\\s*.+?)(?=\\n[a-z]\\)|\\n[IVXLCDM]+\\s*[-–—]|\\n§|$)`;
        }
        return `([a-z]\\)\\s*.+?)(?=\\n[a-z]\\)|\\n[IVXLCDM]+\\s*[-–—]|\\n§|$)`;
      })(),
      'caput': null,
    };

    const pattern = patterns[tipo];
    if (!pattern) return null;
    
    try {
      return new RegExp(pattern, 'is');
    } catch {
      return null;
    }
  }, [highlightAlteracao]);

  // Get formatted HTML
  const formattedHtml = useMemo(() => {
    return formatTextWithUppercase(content, hideAnnotations);
  }, [content, hideAnnotations]);

  // Apply highlights to HTML by injecting <mark> tags
  const highlightedHtml = useMemo(() => {
    if (highlights.length === 0 && !highlightAlteracao && (!magicMode || magicHighlights.length === 0)) return formattedHtml;

    const shouldSkipMagicNode = (node: Text) => {
      const parentElement = node.parentElement;
      if (!parentElement) return false;

      return Boolean(parentElement.closest('mark, .alteracao-highlight'));
    };

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedHtml;

    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
    const textNodes: { node: Text; start: number; end: number }[] = [];
    let charCount = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      textNodes.push({ node, start: charCount, end: charCount + node.length });
      charCount += node.length;
    }

    const sortedHighlights = [...highlights].sort((a, b) => b.start - a.start);

    for (const hl of sortedHighlights) {
      for (let i = textNodes.length - 1; i >= 0; i--) {
        const { node, start, end } = textNodes[i];
        if (end <= hl.start || start >= hl.end) continue;

        const overlapStart = Math.max(hl.start - start, 0);
        const overlapEnd = Math.min(hl.end - start, node.length);
        const text = node.textContent || '';

        const before = text.slice(0, overlapStart);
        const matched = text.slice(overlapStart, overlapEnd);
        const after = text.slice(overlapEnd);

        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));

        const mark = document.createElement('mark');
        mark.setAttribute('data-highlight-id', hl.id);
        mark.setAttribute('data-highlight-start', String(hl.start));
        mark.style.backgroundColor = hl.color;
        mark.style.padding = '0 2px';
        mark.style.borderRadius = '2px';
        mark.style.cursor = isEditing ? 'pointer' : 'default';
        mark.textContent = matched;
        frag.appendChild(mark);

        if (after) frag.appendChild(document.createTextNode(after));
        node.parentNode?.replaceChild(frag, node);
      }
    }

    // Apply alteração highlight
    if (highlightAlteracao && alteracaoRegex) {
      const fullText = tempDiv.textContent || '';
      const match = alteracaoRegex.exec(fullText);
      if (match) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;

        const walker2 = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
        const textNodes2: { node: Text; start: number; end: number }[] = [];
        let c2 = 0;
        while (walker2.nextNode()) {
          const n = walker2.currentNode as Text;
          textNodes2.push({ node: n, start: c2, end: c2 + n.length });
          c2 += n.length;
        }

        for (const { node, start, end } of textNodes2) {
          if (end <= matchStart || start >= matchEnd) continue;
          const os = Math.max(matchStart - start, 0);
          const oe = Math.min(matchEnd - start, node.length);
          const t = node.textContent || '';
          const b = t.slice(0, os);
          const m = t.slice(os, oe);
          const a = t.slice(oe);

          const frag = document.createDocumentFragment();
          if (b) frag.appendChild(document.createTextNode(b));
          const span = document.createElement('span');
          span.className = 'alteracao-highlight';
          span.style.background = 'rgba(168,85,247,0.2)';
          span.style.borderLeft = '2px solid rgb(168,85,247)';
          span.style.paddingLeft = '4px';
          span.style.borderRadius = '0 6px 6px 0';
          span.style.paddingTop = '2px';
          span.style.paddingBottom = '2px';
          span.textContent = m;
          frag.appendChild(span);
          if (a) frag.appendChild(document.createTextNode(a));
          node.parentNode?.replaceChild(frag, node);
        }
      }
    }

    // Apply magic highlights (normalized text matching)
    if (magicMode && magicHighlights.length > 0) {
      const fullText = tempDiv.textContent || '';
      const normalizeForMagicMatch = (value: string) => value.normalize('NFKC').replace(/\s+/g, ' ').trim();
      const buildNormalizedIndexMap = (value: string) => {
        const source = value.normalize('NFKC');
        const normalizedChars: string[] = [];
        const rawIndexMap: number[] = [];
        let pendingSpaceIndex: number | null = null;

        for (let i = 0; i < source.length; i++) {
          const char = source[i];
          if (/\s/.test(char)) {
            if (normalizedChars.length > 0 && pendingSpaceIndex === null) {
              pendingSpaceIndex = i;
            }
            continue;
          }

          if (pendingSpaceIndex !== null) {
            normalizedChars.push(' ');
            rawIndexMap.push(pendingSpaceIndex);
            pendingSpaceIndex = null;
          }

          normalizedChars.push(char);
          rawIndexMap.push(i);
        }

        return {
          normalizedText: normalizedChars.join(''),
          rawIndexMap,
        };
      };

      const { normalizedText, rawIndexMap } = buildNormalizedIndexMap(fullText);
      const occupiedRanges: Array<{ start: number; end: number }> = [];
      const sortedMagic = magicHighlights
        .map((grifo, originalIndex) => ({
          ...grifo,
          originalIndex,
          trechoNormalizado: normalizeForMagicMatch(grifo.trechoExato),
        }))
        .filter((grifo) => grifo.trechoNormalizado.length > 0)
        .sort((a, b) => b.trechoNormalizado.length - a.trechoNormalizado.length);

      for (const grifo of sortedMagic) {
        let searchFrom = 0;
        let matchStart = -1;
        let matchEnd = -1;

        while (searchFrom < normalizedText.length) {
          const normalizedIdx = normalizedText.indexOf(grifo.trechoNormalizado, searchFrom);
          if (normalizedIdx === -1) break;

          const rawStart = rawIndexMap[normalizedIdx];
          const rawEndIndex = rawIndexMap[normalizedIdx + grifo.trechoNormalizado.length - 1];
          if (rawStart === undefined || rawEndIndex === undefined) break;

          const candidateStart = rawStart;
          const candidateEnd = rawEndIndex + 1;
          const overlapsExisting = occupiedRanges.some((range) => candidateStart < range.end && candidateEnd > range.start);

          if (!overlapsExisting) {
            matchStart = candidateStart;
            matchEnd = candidateEnd;
            occupiedRanges.push({ start: matchStart, end: matchEnd });
            break;
          }

          searchFrom = normalizedIdx + grifo.trechoNormalizado.length;
        }

        if (matchStart === -1 || matchEnd === -1) continue;

        const colorConfig = MAGIC_COLORS[grifo.cor] || MAGIC_COLORS.amarelo;
        const walker3 = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
        const textNodes3: { node: Text; start: number; end: number }[] = [];
        let c3 = 0;
        while (walker3.nextNode()) {
          const n = walker3.currentNode as Text;
          textNodes3.push({ node: n, start: c3, end: c3 + n.length });
          c3 += n.length;
        }

        for (const { node, start, end } of textNodes3) {
          if (end <= matchStart || start >= matchEnd) continue;
          if (shouldSkipMagicNode(node)) continue;

          const os = Math.max(matchStart - start, 0);
          const oe = Math.min(matchEnd - start, node.length);
          const t = node.textContent || '';
          const b = t.slice(0, os);
          const m = t.slice(os, oe);
          const a = t.slice(oe);

          const frag = document.createDocumentFragment();
          if (b) frag.appendChild(document.createTextNode(b));
          const mark = document.createElement('mark');
          mark.className = 'magic-grifo';
          mark.setAttribute('data-magic-cor', grifo.cor);
          mark.setAttribute('data-magic-index', String(grifo.originalIndex));
          mark.style.backgroundColor = colorConfig.bg;
          mark.style.color = 'white';
          mark.style.borderBottom = `2px solid ${colorConfig.border}`;
          mark.style.padding = '1px 3px';
          mark.style.borderRadius = '3px';
          mark.style.cursor = 'pointer';
          mark.style.transition = 'all 0.15s';
          mark.textContent = m;
          frag.appendChild(mark);
          if (a) frag.appendChild(document.createTextNode(a));
          node.parentNode?.replaceChild(frag, node);
        }
      }
    }

    return tempDiv.innerHTML;
  }, [formattedHtml, highlights, highlightAlteracao, alteracaoRegex, isEditing, magicMode, magicHighlights]);

  // Scroll to alteração highlight
  useEffect(() => {
    if (highlightAlteracao && alteracaoRegex) {
      const timer = setTimeout(() => {
        const el = containerRef.current?.querySelector('.alteracao-highlight');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [highlightAlteracao, alteracaoRegex, content]);

  // Mobile pencil follower - tracks touch position
  useEffect(() => {
    if (!isEditing) {
      setPencilPos(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const containerRect = container.getBoundingClientRect();
      setPencilPos({
        x: touch.clientX - containerRect.left,
        y: touch.clientY - containerRect.top - 40
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const containerRect = container.getBoundingClientRect();
      setPencilPos({
        x: touch.clientX - containerRect.left,
        y: touch.clientY - containerRect.top - 40
      });
    };

    const handleTouchEnd = () => {
      // Keep pencil visible briefly then hide
      setTimeout(() => setPencilPos(null), 300);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isEditing]);

  // Handle native text selection for adding highlights
  useEffect(() => {
    if (!isEditing) {
      setFloatingBtn(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const handleSelectionEnd = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        setFloatingBtn(null);
        return;
      }

      const selectedText = sel.toString().trim();
      if (!selectedText || selectedText.length < 2) {
        setFloatingBtn(null);
        return;
      }

      // Calculate plain text offsets
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let charCount = 0;
      let startOffset = -1;
      let endOffset = -1;

      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        if (node === range.startContainer) startOffset = charCount + range.startOffset;
        if (node === range.endContainer) endOffset = charCount + range.endOffset;
        charCount += node.length;
      }

      if (startOffset === -1 || endOffset === -1 || startOffset >= endOffset) {
        setFloatingBtn(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setFloatingBtn({
        x: Math.min(Math.max(rect.left + rect.width / 2 - containerRect.left, 60), containerRect.width - 60),
        y: rect.top - containerRect.top - 90,
        start: startOffset,
        end: endOffset,
        text: selectedText
      });
      
      // Hide pencil when selection popup shows
      setPencilPos(null);
    };

    const handleMouseUp = () => setTimeout(handleSelectionEnd, 10);
    const handleTouchEndSel = () => setTimeout(handleSelectionEnd, 50);

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setTimeout(() => {
          const currentSel = window.getSelection();
          if (!currentSel || currentSel.isCollapsed) setFloatingBtn(null);
        }, 200);
      }
    };

    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchend', handleTouchEndSel);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchend', handleTouchEndSel);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isEditing]);

  // Handle clicking on existing highlights to remove
  useEffect(() => {
    if (!isEditing) {
      setRemovePopup(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'MARK' && target.dataset.highlightId) {
        e.preventDefault();
        e.stopPropagation();
        const rect = target.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        setRemovePopup({
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top - containerRect.top - 40,
          highlightId: target.dataset.highlightId
        });
        setFloatingBtn(null);
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [isEditing]);

  // Handle clicking on magic grifos
  useEffect(() => {
    if (!magicMode || magicHighlights.length === 0) return;

    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('magic-grifo') && target.dataset.magicIndex) {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(target.dataset.magicIndex, 10);
        const grifo = magicHighlights[index];
        if (grifo && onMagicTooltip) {
          const rect = target.getBoundingClientRect();
          onMagicTooltip(grifo, {
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [magicMode, magicHighlights, onMagicTooltip]);

  useEffect(() => {
    if (!removePopup && !floatingBtn) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-floating-action]')) {
        setRemovePopup(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [removePopup, floatingBtn]);

  const handleAddHighlight = useCallback((color?: string) => {
    if (!floatingBtn) return;
    const colorToUse = color || localColor;
    // Update parent color if changed
    if (color && onColorChange) onColorChange(color);
    onAddHighlight(floatingBtn.start, floatingBtn.end, floatingBtn.text);
    setFloatingBtn(null);
    window.getSelection()?.removeAllRanges();
  }, [floatingBtn, localColor, onAddHighlight, onColorChange]);

  const handleRemoveHighlight = useCallback(() => {
    if (!removePopup || !onRemoveHighlightAtPosition) return;
    const hl = highlights.find(h => h.id === removePopup.highlightId);
    if (hl) onRemoveHighlightAtPosition(hl.start);
    setRemovePopup(null);
  }, [removePopup, highlights, onRemoveHighlightAtPosition]);

  return (
    <div
      ref={containerRef}
      className="article-content text-foreground/90 whitespace-pre-line leading-relaxed break-words relative"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: "1.7",
        ...(isEditing ? {
          cursor: PENCIL_CURSOR,
          WebkitUserSelect: 'text',
          userSelect: 'text',
          WebkitTouchCallout: 'default',
        } : {}),
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlightedHtml) }} />
      
      {/* Mobile pencil follower */}
      {isEditing && pencilPos && (
        <div
          className="absolute z-40 pointer-events-none transition-all duration-75 ease-out"
          style={{
            left: `${pencilPos.x}px`,
            top: `${pencilPos.y}px`,
            transform: 'translateX(-50%) rotate(-30deg)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </div>
      )}

      {/* Floating popup with "Destacar" + color options */}
      {isEditing && floatingBtn && (
        <div
          data-floating-action
          className="absolute z-50 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${floatingBtn.x}px`,
            top: `${floatingBtn.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Color circles */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-card/95 backdrop-blur-sm border border-border/50 shadow-lg">
            {HIGHLIGHT_COLORS.map(({ name, color }) => (
              <button
                key={color}
                data-floating-action
                onClick={() => {
                  setLocalColor(color);
                  if (onColorChange) onColorChange(color);
                  handleAddHighlight(color);
                }}
                className={cn(
                  "w-7 h-7 rounded-full transition-all duration-150 flex items-center justify-center",
                  "border-2 active:scale-90",
                  localColor === color
                    ? "border-white scale-110 shadow-md"
                    : "border-white/30 hover:scale-105"
                )}
                style={{ backgroundColor: color }}
                title={name}
              >
                {localColor === color && (
                  <Check className="w-3.5 h-3.5 text-gray-700" />
                )}
              </button>
            ))}
          </div>
          
          {/* Destacar button */}
          <button
            data-floating-action
            onClick={() => handleAddHighlight()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full shadow-lg border border-border/30 text-xs font-bold transition-all active:scale-95"
            style={{
              backgroundColor: localColor,
              color: '#374151',
            }}
          >
            <Highlighter className="w-3.5 h-3.5" />
            Destacar
          </button>
        </div>
      )}

      {/* Remove highlight popup */}
      {isEditing && removePopup && (
        <button
          data-floating-action
          onClick={handleRemoveHighlight}
          className="absolute z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground shadow-lg text-xs font-semibold transition-all animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${removePopup.x}px`,
            top: `${removePopup.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          Remover
        </button>
      )}
    </div>
  );
};
