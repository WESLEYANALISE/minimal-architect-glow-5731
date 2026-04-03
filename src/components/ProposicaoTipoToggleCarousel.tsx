import { useState } from "react";
import ProposicaoTipoCarousel from "./ProposicaoTipoCarousel";

interface TipoOption {
  sigla: string;
  label: string;
}

interface ProposicaoTipoToggleCarouselProps {
  opcoes: TipoOption[];
}

const ProposicaoTipoToggleCarousel = ({ opcoes }: ProposicaoTipoToggleCarouselProps) => {
  const [ativo, setAtivo] = useState(0);

  return (
    <div className="space-y-2">
      {/* Toggle pills */}
      <div className="flex gap-2 px-2 overflow-x-auto scrollbar-hide">
        {opcoes.map((op, i) => (
          <button
            key={op.sigla}
            onClick={() => setAtivo(i)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all text-center ${
              i === ativo
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-card/80 text-muted-foreground hover:bg-card border border-border/50"
            }`}
          >
            {op.sigla}
          </button>
        ))}
      </div>

      {/* Active carousel */}
      <ProposicaoTipoCarousel
        key={opcoes[ativo].sigla}
        siglaTipo={opcoes[ativo].sigla}
        titulo={opcoes[ativo].label}
      />
    </div>
  );
};

export default ProposicaoTipoToggleCarousel;
