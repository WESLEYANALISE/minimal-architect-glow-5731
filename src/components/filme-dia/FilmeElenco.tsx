import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ElencoMembro {
  nome: string;
  personagem: string;
  foto: string | null;
}

interface FilmeElencoProps {
  elenco: ElencoMembro[];
}

const FilmeElenco = ({ elenco }: FilmeElencoProps) => {
  if (!elenco || elenco.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-white/80 mb-2">🎭 Elenco Principal</h3>
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {elenco.map((ator, i) => (
            <div key={i} className="flex-shrink-0 w-20 text-center">
              <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-white/10 mb-1">
                {ator.foto ? (
                  <img src={ator.foto} alt={ator.nome} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-xl">🎬</div>
                )}
              </div>
              <p className="text-[10px] font-medium text-white/90 leading-tight truncate">{ator.nome}</p>
              <p className="text-[9px] text-white/50 leading-tight truncate">{ator.personagem}</p>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default FilmeElenco;
