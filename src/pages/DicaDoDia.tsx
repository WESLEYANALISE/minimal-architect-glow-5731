import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDicaHoje, useDicasMes, useDicaPorData } from "@/hooks/useDicaDoDia";
import DicaDiaCalendario from "@/components/dica-dia/DicaDiaCalendario";
import DicaDiaCard from "@/components/dica-dia/DicaDiaCard";

const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const DicaDoDia = () => {
  const navigate = useNavigate();
  
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const brasiliaDate = new Date(utcMs + brasiliaOffset * 60000);
  
  const [ano, setAno] = useState(brasiliaDate.getFullYear());
  const [mes, setMes] = useState(brasiliaDate.getMonth() + 1);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [autoSelecionado, setAutoSelecionado] = useState(false);

  const hojeStr = brasiliaDate.toISOString().split('T')[0];

  const { data: dicaHoje, isLoading: loadingHoje } = useDicaHoje();
  const { data: dicasMes = [], isLoading: loadingMes } = useDicasMes(ano, mes);
  const { data: dicaSelecionada, isLoading: loadingSelecionada } = useDicaPorData(diaSelecionado);

  // Auto-selecionar: hoje se tem dica, senão o mais recente anterior
  useEffect(() => {
    if (autoSelecionado || loadingMes) return;
    
    if (dicasMes.length > 0) {
      // Priorizar hoje se tem dica
      const dicaHojeNoMes = dicasMes.find(d => d.data === hojeStr);
      if (dicaHojeNoMes) {
        setDiaSelecionado(hojeStr);
      } else {
        const dicasPassadas = dicasMes.filter(d => d.data < hojeStr);
        if (dicasPassadas.length > 0) {
          setDiaSelecionado(dicasPassadas[dicasPassadas.length - 1].data);
        } else {
          setDiaSelecionado(dicasMes[dicasMes.length - 1].data);
        }
      }
      setAutoSelecionado(true);
    } else if (dicaHoje) {
      setDiaSelecionado(dicaHoje.data);
      setAutoSelecionado(true);
    }
  }, [dicasMes, dicaHoje, autoSelecionado, loadingMes, hojeStr]);

  // Show selected day's tip, or today's tip if nothing selected
  const dicaExibida = diaSelecionado ? dicaSelecionada : dicaHoje;
  const isLoadingDica = diaSelecionado ? loadingSelecionada : loadingHoje;

  const mudarMes = (delta: number) => {
    let novoMes = mes + delta;
    let novoAno = ano;
    if (novoMes < 1) { novoMes = 12; novoAno--; }
    if (novoMes > 12) { novoMes = 1; novoAno++; }
    setMes(novoMes);
    setAno(novoAno);
    setDiaSelecionado(null);
    setAutoSelecionado(false);
  };
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header com estilo laranja */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950/95 border-b border-amber-800/30">
        <div className="px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/80 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <h1 className="text-lg font-bold text-white">Recomendação do Dia</h1>
              </div>
            </div>
          </div>

          {/* Navegação do mês */}
          <div className="flex items-center justify-between mb-2 px-1">
            <Button variant="ghost" size="icon" onClick={() => mudarMes(-1)} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-white/90">
              {MESES_NOME[mes - 1]} {ano}
            </span>
            <Button variant="ghost" size="icon" onClick={() => mudarMes(1)} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendário horizontal */}
          <DicaDiaCalendario
            ano={ano}
            mes={mes}
            dicasDoMes={dicasMes}
            diaSelecionado={diaSelecionado}
            onDiaClick={(data) => setDiaSelecionado(data)}
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-lg lg:max-w-3xl mx-auto">
        {/* Card da dica */}
        {(loadingHoje || loadingMes || isLoadingDica) ? (
          <div className="bg-card/50 border border-border/30 rounded-xl p-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando recomendação...</p>
          </div>
        ) : dicaExibida ? (
          <DicaDiaCard dica={dicaExibida} />
        ) : (
          <div className="bg-card/50 border border-border/30 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
            <Clock className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Nenhuma recomendação disponível para este dia.
            </p>
            <p className="text-xs text-muted-foreground/50">
              Selecione um dia com recomendação no calendário acima.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DicaDoDia;
