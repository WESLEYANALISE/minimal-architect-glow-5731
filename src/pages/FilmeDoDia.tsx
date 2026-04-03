import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Film, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFilmeHoje, useFilmesMes, useFilmePorData } from "@/hooks/useFilmeDoDia";
import FilmeDiaCalendario from "@/components/filme-dia/FilmeDiaCalendario";
import FilmeDiaCard from "@/components/filme-dia/FilmeDiaCard";

const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const FilmeDoDia = () => {
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

  const { data: filmeHoje, isLoading: loadingHoje } = useFilmeHoje();
  const { data: filmesMes = [], isLoading: loadingMes } = useFilmesMes(ano, mes);
  const { data: filmeSelecionado, isLoading: loadingSelecionado } = useFilmePorData(diaSelecionado);

  useEffect(() => {
    if (autoSelecionado || loadingMes) return;
    if (filmesMes.length > 0) {
      const filmeHojeNoMes = filmesMes.find(f => f.data === hojeStr);
      if (filmeHojeNoMes) { setDiaSelecionado(hojeStr); }
      else {
        const passados = filmesMes.filter(f => f.data < hojeStr);
        setDiaSelecionado(passados.length > 0 ? passados[passados.length - 1].data : filmesMes[filmesMes.length - 1].data);
      }
      setAutoSelecionado(true);
    } else if (filmeHoje) {
      setDiaSelecionado(filmeHoje.data);
      setAutoSelecionado(true);
    }
  }, [filmesMes, filmeHoje, autoSelecionado, loadingMes, hojeStr]);

  const filmeExibido = diaSelecionado ? filmeSelecionado : filmeHoje;
  const isLoadingFilme = diaSelecionado ? loadingSelecionado : loadingHoje;

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
      {/* Header cinema vermelho */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 border-b border-red-800/30">
        <div className="px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/80 hover:text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-red-300" />
                <h1 className="text-lg font-bold text-white">Filme do Dia</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2 px-1">
            <Button variant="ghost" size="icon" onClick={() => mudarMes(-1)} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-white/90">{MESES_NOME[mes - 1]} {ano}</span>
            <Button variant="ghost" size="icon" onClick={() => mudarMes(1)} className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <FilmeDiaCalendario
            ano={ano}
            mes={mes}
            filmesDoMes={filmesMes}
            diaSelecionado={diaSelecionado}
            onDiaClick={(data) => setDiaSelecionado(data)}
          />
        </div>
      </div>

      <div className="py-4 space-y-4">
        {(loadingHoje || loadingMes || isLoadingFilme) ? (
          <div className="bg-card/50 border border-border/30 rounded-xl p-8 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando filme...</p>
          </div>
        ) : filmeExibido ? (
          <FilmeDiaCard filme={filmeExibido} />
        ) : (
          <div className="bg-card/50 border border-border/30 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
            <Clock className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum filme disponível para este dia.</p>
            <p className="text-xs text-muted-foreground/50">Selecione um dia com filme no calendário.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilmeDoDia;
