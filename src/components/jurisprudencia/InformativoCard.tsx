import { memo } from "react";
import { ChevronRight, FileText } from "lucide-react";

interface Informativo {
  id: number;
  tribunal: string;
  numero_edicao: number;
  data_publicacao: string | null;
  titulo_edicao: string | null;
  tipo: string | null;
}

interface Props {
  informativo: Informativo;
  onClick: () => void;
}

export const InformativoCard = memo(({ informativo, onClick }: Props) => {
  const isSTF = informativo.tribunal === 'STF';
  
  const formatDate = (date: string | null) => {
    if (!date) return '';
    try {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return date;
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-card/90 backdrop-blur-sm rounded-2xl p-4 text-left transition-all duration-150 hover:bg-card hover:scale-[1.01] border border-border/50 hover:border-primary/30 shadow-sm group"
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2.5 ${isSTF ? 'bg-emerald-500/15' : 'bg-blue-500/15'}`}>
          <FileText className={`w-5 h-5 ${isSTF ? 'text-emerald-400' : 'text-blue-400'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isSTF 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {informativo.tribunal}
            </span>
            <span className="text-xs text-muted-foreground">
              nº {informativo.numero_edicao}
            </span>
            {informativo.data_publicacao && (
              <span className="text-xs text-muted-foreground/60">
                • {formatDate(informativo.data_publicacao)}
              </span>
            )}
          </div>
          
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {informativo.titulo_edicao || `Informativo ${informativo.tribunal} nº ${informativo.numero_edicao}`}
          </p>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>
    </button>
  );
});

InformativoCard.displayName = 'InformativoCard';
