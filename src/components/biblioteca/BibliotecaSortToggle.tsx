import { GraduationCap, SortAsc, Info, BookOpen, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export type BibliotecaSortMode = "recomendada" | "alfabetica" | "sobre";
export type BibliotecaNivelMode = "faculdade" | "iniciante" | "avancado";

interface BibliotecaSortToggleProps {
  mode: BibliotecaSortMode;
  setMode: (mode: BibliotecaSortMode) => void;
}

const MODOS = [
  { id: "recomendada" as const, icon: GraduationCap, label: "Recomendada" },
  { id: "alfabetica" as const, icon: SortAsc, label: "Alfabética" },
  { id: "sobre" as const, icon: Info, label: "Sobre" },
];

export function BibliotecaSortToggle({ mode, setMode }: BibliotecaSortToggleProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center bg-muted/50 rounded-full p-1 gap-0.5">
        {MODOS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              mode === m.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <m.icon className="w-3.5 h-3.5" />
            <span>{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Sets de IDs por nível de leitura
export const LIVROS_INICIANTE = new Set<number>([127, 147, 149, 122, 133, 124, 143, 146, 132, 131]);
export const LIVROS_AVANCADO = new Set<number>([126, 129, 130, 138, 139, 140, 141, 135, 137, 125]);

const NIVEIS = [
  { id: "faculdade" as const, icon: GraduationCap, label: "Faculdade" },
  { id: "iniciante" as const, icon: BookOpen, label: "Iniciante" },
  { id: "avancado" as const, icon: Brain, label: "Avançado" },
];

interface BibliotecaNivelToggleProps {
  mode: BibliotecaNivelMode;
  setMode: (mode: BibliotecaNivelMode) => void;
  fullWidth?: boolean;
}

export function BibliotecaNivelToggle({ mode, setMode, fullWidth }: BibliotecaNivelToggleProps) {
  return (
    <div className={cn("flex items-center", fullWidth ? "w-full" : "justify-center")}>
      <div className={cn(
        "flex items-center bg-muted/50 rounded-full p-1 gap-0.5",
        fullWidth ? "w-full" : "inline-flex"
      )}>
        {NIVEIS.map((n) => (
          <button
            key={n.id}
            onClick={() => setMode(n.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              fullWidth && "flex-1",
              mode === n.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <n.icon className="w-3.5 h-3.5" />
            <span>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Ordem de leitura recomendada para Biblioteca Clássicos (do mais acessível ao mais avançado)
export const ORDEM_LEITURA_CLASSICOS: Record<number, number> = {
  // Ordem personalizada
  121: 1,  // O Caso dos Exploradores de Cavernas
  127: 2,  // O que é Direito
  149: 3,  // O Mundo de Sofia
  123: 4,  // Dos Delitos e das Penas
  140: 5,  // O Príncipe
  144: 6,  // Teoria Pura do Direito
  130: 7,  // O Espírito das Leis
  147: 8,  // Introdução ao Estudo do Direito

  // Demais livros em ordem complementar
  122: 9,  // Justiça: O que é fazer a coisa certa
  134: 10, // O Último Dia de um Condenado
  133: 11, // A Luta pelo Direito
  124: 12, // O Monge e o Executivo
  125: 13, // A Arte da Guerra
  131: 14, // 1984
  136: 15, // O Processo
  132: 16, // O Advogado do Diabo
  142: 17, // Eles, os Juízes
  129: 18, // O Contrato Social
  138: 19, // Sobre a Liberdade
  137: 20, // O Mundo Assombrado pelos Demônios
  135: 21, // Como as Democracias Morrem
  128: 22, // Acesso à Justiça
  148: 23, // A Era dos Direitos
  126: 24, // O Leviatã
  139: 25, // A República
  141: 26, // Ética a Nicômaco
  145: 27, // Vigiar e Punir
  143: 28, // Virando a Própria Mesa
  146: 29, // A Meta
};
