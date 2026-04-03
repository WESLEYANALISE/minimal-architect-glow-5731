import { cn } from "@/lib/utils";

export type ModoVisualizacao = "dados" | "explicacao" | "glossario" | "interpretar";

interface ToggleExplicacaoProps {
  modoExplicacao: ModoVisualizacao;
  setModoExplicacao: (value: ModoVisualizacao) => void;
}

const MODOS = [
  { id: "dados" as const, label: "Artigo" },
  { id: "explicacao" as const, label: "Explicação" },
  { id: "glossario" as const, label: "Termos" },
  { id: "interpretar" as const, label: "Como Ler" },
];

export function ToggleExplicacao({ modoExplicacao, setModoExplicacao }: ToggleExplicacaoProps) {
  return (
    <div className="flex items-center justify-center w-full px-2">
      <div className="inline-flex items-center bg-muted/50 rounded-full p-1 gap-0.5 w-full max-w-md">
        {MODOS.map((modo) => (
          <button
            key={modo.id}
            onClick={() => setModoExplicacao(modo.id)}
            className={cn(
              "flex-1 flex items-center justify-center px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
              modoExplicacao === modo.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {modo.label}
          </button>
        ))}
      </div>
    </div>
  );
}
