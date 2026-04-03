import { useEffect, useRef, useState } from "react";

const MARKDOWN_ARTIGO_1 = `# ⚖️ Art. 1º — Anterioridade da Lei Penal

## 📜 Princípio da Legalidade (nullum crimen, nulla poena sine lege)
### 🔒 Reserva Legal Absoluta
#### Somente **lei em sentido estrito** pode criar crimes e penas
#### Medidas provisórias **não** podem definir crimes (CF, art. 62, §1º, I, b)
#### Vedação de costumes como fonte de incriminação
### 📋 Fontes Formais
#### Lei ordinária
#### Lei complementar
#### CF/88 (normas penais incriminadoras)
### 🏛️ Fundamento Constitucional
#### CF/88, Art. 5º, XXXIX
#### Cláusula pétrea (Art. 60, §4º, IV)
#### Declaração Universal dos Direitos Humanos, Art. XI

## 🔍 Nullum Crimen Sine Lege — Desdobramentos
### 📝 Lege Scripta
#### Lei escrita e formal
#### Proibição do direito consuetudinário incriminador
### 🎯 Lege Stricta
#### Vedação de **analogia in malam partem**
#### Analogia in bonam partem é permitida
#### Interpretação extensiva: divergência doutrinária
### 📐 Lege Certa (Taxatividade)
#### Descrição precisa e determinada da conduta
#### Proíbe tipos penais vagos e indeterminados
#### Mandado de certeza → segurança jurídica
### ⏰ Lege Praevia (Anterioridade)
#### Lei deve ser **anterior** ao fato
#### Irretroatividade como regra geral
#### Tempus regit actum

## 🔄 Irretroatividade da Lei Penal
### 🚫 Regra Geral
#### Lei penal **não retroage**
#### Protege o cidadão contra o Estado
#### Garantia individual fundamental
### ✅ Exceção: Retroatividade Benéfica
#### **Lex mitior** (lei mais branda) retroage sempre
#### Alcança fatos anteriores, mesmo com trânsito em julgado
#### **Abolitio criminis** (Art. 2º, CP)
##### Extinção da punibilidade
##### Cessam todos os efeitos penais
##### Permanecem efeitos civis (extrapenais)
### 📊 Combinação de Leis (Lex Tertia)
#### STF: **não admite** (Súmula 501 do STJ)
#### Parte da doutrina defende a combinação
#### Juiz não pode criar uma terceira lei

## 🏛️ Aplicação Prática
### 📚 Jurisprudência Relevante
#### STF — RE 600.817 (repercussão geral)
#### STJ — Súmula 501 (combinação de leis)
#### STF — HC 82.959 (regime de cumprimento)
### ⚠️ Questões de Concurso
#### FGV, CESPE, FCC cobram intensamente
#### Foco em exceções à irretroatividade
#### Diferença entre analogia e interpretação extensiva
`;

const CDN_LIB = "https://cdn.jsdelivr.net/npm/markmap-lib@0.18.12/dist/browser.min.js";
const CDN_VIEW = "https://cdn.jsdelivr.net/npm/markmap-view@0.18.12/dist/browser.min.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export const MarkmapRenderer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    let cancelled = false;

    // Inject white-text styles
    const styleId = "markmap-dark-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .markmap text { fill: #ffffff !important; font-size: 14px; }
        .markmap .markmap-node-circle { fill: hsl(var(--primary)); stroke: hsl(var(--primary) / 0.6); }
        .markmap .markmap-link { stroke: hsl(var(--primary) / 0.4) !important; }
      `;
      document.head.appendChild(style);
    }

    const applySvgDimensions = () => {
      if (!containerRef.current || !svgRef.current) return;
      const w = Math.max(containerRef.current.clientWidth, 320);
      const h = Math.max(containerRef.current.clientHeight, 320);
      svgRef.current.setAttribute("width", String(w));
      svgRef.current.setAttribute("height", String(h));
      svgRef.current.setAttribute("viewBox", `0 0 ${w} ${h}`);
    };

    const init = async () => {
      try {
        applySvgDimensions();

        await loadScript(CDN_LIB);
        await loadScript(CDN_VIEW);

        const mm = (window as any).markmap;
        if (!mm?.Transformer || !mm?.Markmap) {
          throw new Error("markmap globals not found after CDN load");
        }

        if (cancelled || !svgRef.current) return;

        const transformer = new mm.Transformer();
        const { root } = transformer.transform(MARKDOWN_ARTIGO_1);

        mmRef.current = mm.Markmap.create(
          svgRef.current,
          {
            autoFit: true,
            duration: 300,
            maxWidth: 320,
            initialExpandLevel: 4,
            colorFreezeLevel: 2,
          },
          root
        );

        mmRef.current?.fit?.();

        resizeObserverRef.current = new ResizeObserver(() => {
          applySvgDimensions();
          mmRef.current?.fit?.();
        });
        resizeObserverRef.current.observe(containerRef.current!);

        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar markmap:", err);
        if (!cancelled) {
          setError(`Falha ao renderizar Markmap: ${(err as Error).message}`);
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (mmRef.current?.destroy) mmRef.current.destroy();
      mmRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-[600px] rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground text-sm px-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-[600px] rounded-xl border border-border bg-card overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          Carregando Markmap…
        </div>
      )}
      <svg ref={svgRef} className="block w-full h-full" />
    </div>
  );
};
