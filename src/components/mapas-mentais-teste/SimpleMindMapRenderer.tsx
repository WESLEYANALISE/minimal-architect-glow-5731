import { useEffect, useRef, useState } from "react";

const ARTIGO_1_DATA = {
  data: {
    text: "Art. 1º — Anterioridade",
    children: [
      {
        data: { text: "Princípio da Legalidade" },
        children: [
          { data: { text: "Sem lei anterior, não há crime" }, children: [] },
          { data: { text: "Sem cominação prévia, não há pena" }, children: [] },
        ],
      },
      {
        data: { text: "Nullum crimen sine lege" },
        children: [
          { data: { text: "Reserva legal estrita" }, children: [] },
          { data: { text: "Veda analogia para prejudicar" }, children: [] },
        ],
      },
      {
        data: { text: "Irretroatividade" },
        children: [
          { data: { text: "Regra: não retroage" }, children: [] },
          { data: { text: "Exceção: retroage se benéfica" }, children: [] },
        ],
      },
    ],
  },
};

export const SimpleMindMapRenderer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || instanceRef.current) return;
    let cancelled = false;

    const init = async () => {
      try {
        const mod = await import("simple-mind-map");
        const MindMap = (mod as any).default || (mod as any).MindMap || mod;

        if (cancelled || !containerRef.current) return;

        instanceRef.current = new (MindMap as any)({
          el: containerRef.current,
          data: ARTIGO_1_DATA,
          layout: "logicalStructure",
          theme: "default",
          themeConfig: {
            backgroundColor: "transparent",
          },
        });

        instanceRef.current.execCommand?.("EXPAND_ALL");
        instanceRef.current.setRootNodeCenter?.();

        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar simple-mind-map:", err);
        if (!cancelled) {
          setError(`Falha ao renderizar SimpleMindMap: ${(err as Error).message}`);
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (instanceRef.current?.destroy) {
        instanceRef.current.destroy();
      }
      instanceRef.current = null;
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
    <div className="w-full h-[600px] rounded-xl border border-border bg-card overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
          Carregando SimpleMindMap…
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
