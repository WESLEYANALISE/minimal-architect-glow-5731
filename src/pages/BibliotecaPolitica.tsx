import { useState } from "react";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { PoliticaLivros } from "@/components/politica/PoliticaLivros";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import capaPolitica from "@/assets/politico-esquerda.webp";

type Orientacao = "esquerda" | "centro" | "direita" | "todos";

const BibliotecaPolitica = () => {
  const [orientacao, setOrientacao] = useState<Orientacao>("todos");

  return (
    <div className="min-h-screen bg-background">
      <StandardPageHeader
        title="Biblioteca Política"
        subtitle="Literatura política e ciência de governo"
        backPath="/bibliotecas"
      />

      {/* Hero banner */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={capaPolitica}
          alt="Biblioteca Política"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-background" />
        <div className="absolute bottom-4 left-4">
          <h2
            className="text-2xl font-bold text-white drop-shadow-lg"
            style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
          >
            Biblioteca Política
          </h2>
          <p className="text-sm text-white/80 mt-0.5">
            Literatura política e ciência de governo
          </p>
        </div>
      </div>

      {/* Filtro de orientação */}
      <div className="px-4 py-4">
        <ToggleGroup
          type="single"
          value={orientacao}
          onValueChange={(val) => val && setOrientacao(val as Orientacao)}
          className="justify-start gap-2"
        >
          <ToggleGroupItem
            value="todos"
            className="rounded-full px-4 py-1.5 text-sm border border-white/10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Todos
          </ToggleGroupItem>
          <ToggleGroupItem
            value="esquerda"
            className="rounded-full px-4 py-1.5 text-sm border border-red-500/30 data-[state=on]:bg-red-600 data-[state=on]:text-white"
          >
            Esquerda
          </ToggleGroupItem>
          <ToggleGroupItem
            value="centro"
            className="rounded-full px-4 py-1.5 text-sm border border-purple-500/30 data-[state=on]:bg-purple-600 data-[state=on]:text-white"
          >
            Centro
          </ToggleGroupItem>
          <ToggleGroupItem
            value="direita"
            className="rounded-full px-4 py-1.5 text-sm border border-blue-500/30 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
          >
            Direita
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Lista de livros */}
      <div className="px-4 pb-10">
        <PoliticaLivros orientacao={orientacao} />
      </div>
    </div>
  );
};

export default BibliotecaPolitica;
