import { DicaDoDia } from "@/hooks/useDicaDoDia";
import { centerItemInHorizontalScroll, cn } from "@/lib/utils";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect } from "react";

interface DicaDiaCalendarioProps {
  ano: number;
  mes: number;
  dicasDoMes: DicaDoDia[];
  diaSelecionado: string | null;
  onDiaClick: (data: string) => void;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function DicaDiaCalendario({ ano, mes, dicasDoMes, diaSelecionado, onDiaClick }: DicaDiaCalendarioProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
  const hojeStr = brasiliaDate.toISOString().split('T')[0];

  const dicasMap = new Map(dicasDoMes.map(d => [d.data, d]));

  // Gerar todos os dias do mês
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dias = Array.from({ length: ultimoDia }, (_, i) => {
    const dia = i + 1;
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const date = new Date(ano, mes - 1, dia);
    const diaSemana = date.getDay();
    return { dia, dataStr, diaSemana, temDica: dicasMap.has(dataStr), isHoje: dataStr === hojeStr };
  });

  // Scroll para o dia selecionado ou hoje
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const targetDate = diaSelecionado || hojeStr;
    const el = container.querySelector<HTMLElement>(`[data-date="${targetDate}"]`);

    if (el) {
      centerItemInHorizontalScroll(container, el, 'smooth');
    }
  }, [diaSelecionado, hojeStr, mes]);

  return (
    <div className="overflow-hidden -mx-4">
      {/* Scroll horizontal de dias */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dias.map(({ dia, dataStr, diaSemana, temDica, isHoje }) => {
          const isSelecionado = dataStr === diaSelecionado;
          const isFuturo = dataStr > hojeStr;

          return (
            <button
              key={dia}
              data-date={dataStr}
              onClick={() => temDica && onDiaClick(dataStr)}
              disabled={!temDica}
              className={cn(
                "flex flex-col items-center min-w-[65px] w-[65px] h-[72px] px-3 py-2 rounded-xl transition-all relative shrink-0",
                isSelecionado && temDica && "bg-white text-orange-900",
                !isSelecionado && temDica && "bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer",
                !temDica && !isFuturo && "bg-white/5 text-white/40 hover:bg-white/10",
                isFuturo && "bg-white/[0.02] text-white/15"
              )}
            >
              <span className={cn(
                "text-[10px] uppercase font-medium",
                isSelecionado ? "text-amber-600" : temDica ? "text-white/60" : "text-white/30"
              )}>
                {DIAS_SEMANA[diaSemana]}
              </span>
              <span className={cn(
                "text-lg font-bold",
                !temDica && !isSelecionado && "opacity-40"
              )}>
                {dia}
              </span>
              <span className={cn(
                "text-[10px] uppercase",
                isSelecionado ? "text-amber-600" : temDica ? "text-white/50" : "text-white/25"
              )}>
                {MESES[mes - 1]}
              </span>

              {/* Indicador de dica disponível */}
              {temDica && !isSelecionado && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Contagem */}
      <div className="px-4 pt-1">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Nova recomendação todos os dias às 8h da manhã
        </p>
      </div>
    </div>
  );
}
