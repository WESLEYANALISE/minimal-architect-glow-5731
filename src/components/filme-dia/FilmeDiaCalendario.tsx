import { centerItemInHorizontalScroll, cn } from "@/lib/utils";
import { Film } from "lucide-react";
import { FilmeDoDia } from "@/hooks/useFilmeDoDia";
import { useRef, useEffect } from "react";

interface Props {
  ano: number;
  mes: number;
  filmesDoMes: FilmeDoDia[];
  diaSelecionado: string | null;
  onDiaClick: (data: string) => void;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const FilmeDiaCalendario = ({ ano, mes, filmesDoMes, diaSelecionado, onDiaClick }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalDias = new Date(ano, mes, 0).getDate();
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
  const hojeStr = brasiliaDate.toISOString().split('T')[0];

  const datasComFilme = new Set(filmesDoMes.map(f => f.data));
  const dias = Array.from({ length: totalDias }, (_, i) => {
    const dia = i + 1;
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const diaSemana = new Date(ano, mes - 1, dia).getDay();
    return { dia, dataStr, diaSemana, temFilme: datasComFilme.has(dataStr), isHoje: dataStr === hojeStr };
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
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dias.map(d => {
          const selecionado = d.dataStr === diaSelecionado;
          const isFuturo = d.dataStr > hojeStr;

          return (
            <button
              key={d.dia}
              data-date={d.dataStr}
              onClick={() => d.temFilme && onDiaClick(d.dataStr)}
              disabled={!d.temFilme}
              className={cn(
                "flex flex-col items-center min-w-[65px] w-[65px] h-[72px] px-3 py-2 rounded-xl transition-all relative shrink-0",
                selecionado && d.temFilme && "bg-white text-red-900",
                !selecionado && d.temFilme && "bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer",
                !d.temFilme && !isFuturo && "bg-white/5 text-white/40 hover:bg-white/10",
                isFuturo && "bg-white/[0.02] text-white/15"
              )}
            >
              <span className={cn(
                "text-[10px] uppercase font-medium",
                selecionado ? "text-red-600" : d.temFilme ? "text-white/60" : "text-white/30"
              )}>
                {DIAS_SEMANA[d.diaSemana]}
              </span>
              <span className={cn(
                "text-lg font-bold",
                !d.temFilme && !selecionado && "opacity-40"
              )}>
                {d.dia}
              </span>
              <span className={cn(
                "text-[10px] uppercase",
                selecionado ? "text-red-600" : d.temFilme ? "text-white/50" : "text-white/25"
              )}>
                {MESES[mes - 1]}
              </span>

              {/* Indicador de filme disponível */}
              {d.temFilme && !selecionado && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-1">
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Novo filme todos os dias às 18h
        </p>
      </div>
    </div>
  );
};

export default FilmeDiaCalendario;
