import { useEffect, useRef, useState } from "react";
import "jsmind/style/jsmind.css";

const JSMIND_ARTIGO_1 = {
  meta: { name: "artigo-1", author: "admin", version: "0.2" },
  format: "node_tree",
  data: {
    id: "root",
    topic: "Art. 1º — Anterioridade",
    children: [
      {
        id: "legalidade",
        topic: "Princípio da Legalidade",
        direction: "right",
        children: [
          { id: "legalidade-1", topic: "Sem lei anterior, não há crime" },
          { id: "legalidade-2", topic: "Sem cominação prévia, não há pena" },
        ],
      },
      {
        id: "nullum",
        topic: "Nullum crimen sine lege",
        direction: "right",
        children: [
          { id: "nullum-1", topic: "Reserva legal estrita" },
          { id: "nullum-2", topic: "Veda analogia in malam partem" },
        ],
      },
      {
        id: "retro",
        topic: "Irretroatividade",
        direction: "left",
        children: [
          { id: "retro-1", topic: "Regra: não retroage" },
          { id: "retro-2", topic: "Exceção: retroage se benéfica" },
        ],
      },
    ],
  },
};

export const JsMindRenderer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || instanceRef.current) return;
    let cancelled = false;

    const init = async () => {
      try {
        const mod = await import("jsmind");
        const JsMindCtor = (mod as any).default || mod;

        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        instanceRef.current = new (JsMindCtor as any)({
          container: containerRef.current,
          editable: false,
          theme: "primary",
          view: {
            engine: "svg",
            hmargin: 80,
            vmargin: 50,
          },
        });

        instanceRef.current.show(JSMIND_ARTIGO_1);
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar jsMind:", err);
        if (!cancelled) {
          setError(`Falha ao renderizar jsMind: ${(err as Error).message}`);
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
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
          Carregando jsMind…
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
