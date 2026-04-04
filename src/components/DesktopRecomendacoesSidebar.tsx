import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, ArrowRight, Film } from "lucide-react";
import { useDicasMes, useDicaPorData } from "@/hooks/useDicaDoDia";
import { useFilmesMes, useFilmePorData } from "@/hooks/useFilmeDoDia";
import DicaDiaCalendario from "@/components/dica-dia/DicaDiaCalendario";
import FilmeDiaCalendario from "@/components/filme-dia/FilmeDiaCalendario";

const MESES_NOME = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getBrasiliaDate() {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + brasiliaOffset * 60000);
}

type Tab = 'livros' | 'filmes';

export const DesktopRecomendacoesSidebar = memo(() => {
  const navigate = useNavigate();
  const brasiliaDate = getBrasiliaDate();
  const [activeTab, setActiveTab] = useState<Tab>('livros');

  // Livros
  const [mes, setMes] = useState(brasiliaDate.getMonth() + 1);
  const [ano, setAno] = useState(brasiliaDate.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const { data: dicasDoMes = [] } = useDicasMes(ano, mes);
  const { data: dicaSelecionada } = useDicaPorData(diaSelecionado);

  // Filmes
  const [filmeMes, setFilmeMes] = useState(brasiliaDate.getMonth() + 1);
  const [filmeAno, setFilmeAno] = useState(brasiliaDate.getFullYear());
  const [filmeDiaSel, setFilmeDiaSel] = useState<string | null>(null);
  const { data: filmesDoMes = [] } = useFilmesMes(filmeAno, filmeMes);
  const { data: filmeSelecionado } = useFilmePorData(filmeDiaSel);

  useEffect(() => {
    if (dicasDoMes.length === 0) { setDiaSelecionado(null); return; }
    const hojeStr = getBrasiliaDate().toISOString().split('T')[0];
    const hoje = dicasDoMes.find(d => d.data === hojeStr);
    if (hoje) { setDiaSelecionado(hoje.data); return; }
    const passadas = dicasDoMes.filter(d => d.data <= hojeStr);
    if (passadas.length > 0) { setDiaSelecionado(passadas[passadas.length - 1].data); return; }
    setDiaSelecionado(dicasDoMes[0].data);
  }, [dicasDoMes]);

  useEffect(() => {
    if (filmesDoMes.length === 0) { setFilmeDiaSel(null); return; }
    const hojeStr = getBrasiliaDate().toISOString().split('T')[0];
    const hoje = filmesDoMes.find(f => f.data === hojeStr);
    if (hoje) { setFilmeDiaSel(hoje.data); return; }
    const passados = filmesDoMes.filter(f => f.data <= hojeStr);
    if (passados.length > 0) { setFilmeDiaSel(passados[passados.length - 1].data); return; }
    setFilmeDiaSel(filmesDoMes[0].data);
  }, [filmesDoMes]);

  const navigateMes = useCallback((dir: number) => {
    setMes(prev => {
      let m = prev + dir;
      if (m < 1) { setAno(a => a - 1); return 12; }
      if (m > 12) { setAno(a => a + 1); return 1; }
      return m;
    });
    setDiaSelecionado(null);
  }, []);

  const navigateFilmeMes = (dir: number) => {
    let m = filmeMes + dir, a = filmeAno;
    if (m < 1) { m = 12; a--; } else if (m > 12) { m = 1; a++; }
    setFilmeMes(m); setFilmeAno(a); setFilmeDiaSel(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/15">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <h3 className="font-semibold text-xs text-foreground">Recomendações do Dia</h3>
      </div>

      {/* Tab toggle */}
      <div className="px-3 pt-3">
        <div className="flex items-center w-full bg-white/10 rounded-full p-0.5 gap-0.5">
          <button
            onClick={() => setActiveTab('livros')}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-medium transition-all ${
              activeTab === 'livros'
                ? "bg-white text-amber-900 shadow-sm"
                : "text-white/60 hover:text-white"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Livros</span>
          </button>
          <button
            onClick={() => setActiveTab('filmes')}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-full text-[10px] font-medium transition-all ${
              activeTab === 'filmes'
                ? "bg-white text-blue-900 shadow-sm"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Filmes</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
        {activeTab === 'livros' ? (
          <>
            {/* Calendário livros */}
            <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950/95 rounded-xl p-2.5 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => navigateMes(-1)} className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <ChevronLeft className="w-3 h-3 text-white" />
                </button>
                <span className="text-[10px] font-semibold text-white">
                  {MESES_NOME[mes - 1]} {ano}
                </span>
                <button onClick={() => navigateMes(1)} className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <ChevronRight className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="overflow-hidden [&_button]:!text-[9px] [&_button]:!w-7 [&_button]:!h-7 [&_span]:!text-[8px]">
                <DicaDiaCalendario
                  ano={ano}
                  mes={mes}
                  dicasDoMes={dicasDoMes}
                  diaSelecionado={diaSelecionado}
                  onDiaClick={setDiaSelecionado}
                />
              </div>
            </div>

            {/* Livro selecionado */}
            {dicaSelecionada ? (
              <div className="rounded-xl overflow-hidden border border-amber-800/30 bg-gradient-to-b from-amber-950/80 to-neutral-900/90 p-3 space-y-3">
                {dicaSelecionada.livro_capa && (
                  <div className="flex justify-center">
                    <img
                      src={dicaSelecionada.livro_capa}
                      alt={dicaSelecionada.livro_titulo}
                      className="h-36 w-auto rounded-lg shadow-lg object-contain"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white leading-tight line-clamp-2">
                    {dicaSelecionada.livro_titulo}
                  </h4>
                  {dicaSelecionada.livro_autor && (
                    <p className="text-[10px] text-amber-300/70">{dicaSelecionada.livro_autor}</p>
                  )}
                  {dicaSelecionada.porque_ler && (
                    <p className="text-[10px] text-white/60 leading-relaxed line-clamp-4">
                      {dicaSelecionada.porque_ler
                        .replace(/<!--.*?-->/g, '')
                        .replace(/\*\*/g, '')
                        .replace(/^[\s\-•]+/gm, '')
                        .trim()}
                    </p>
                  )}
                  {dicaSelecionada.frase_dia && (
                    <div className="border-l-2 border-amber-500/50 pl-2">
                      <p className="text-[10px] text-amber-200/80 italic line-clamp-3">
                        "{dicaSelecionada.frase_dia}"
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/bibliotecas`)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 text-[10px] font-medium transition-colors"
                  >
                    Ver na Biblioteca <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <BookOpen className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">Selecione um dia no calendário</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Calendário filmes */}
            <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950/95 rounded-xl p-2.5 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => navigateFilmeMes(-1)} className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <ChevronLeft className="w-3 h-3 text-white" />
                </button>
                <span className="text-[10px] font-semibold text-white">
                  {MESES_NOME[filmeMes - 1]} {filmeAno}
                </span>
                <button onClick={() => navigateFilmeMes(1)} className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <ChevronRight className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="overflow-hidden [&_button]:!text-[9px] [&_button]:!w-7 [&_button]:!h-7 [&_span]:!text-[8px]">
                <FilmeDiaCalendario
                  ano={filmeAno}
                  mes={filmeMes}
                  filmesDoMes={filmesDoMes}
                  diaSelecionado={filmeDiaSel}
                  onDiaClick={setFilmeDiaSel}
                />
              </div>
            </div>

            {/* Filme selecionado */}
            {filmeSelecionado ? (
              <div className="rounded-xl overflow-hidden border border-blue-800/30 bg-gradient-to-b from-blue-950/80 to-neutral-900/90 p-3 space-y-3">
                {(filmeSelecionado as any).poster_path && (
                  <div className="flex justify-center">
                    <img
                      src={`https://image.tmdb.org/t/p/w300${(filmeSelecionado as any).poster_path}`}
                      alt={(filmeSelecionado as any).titulo}
                      className="h-36 w-auto rounded-lg shadow-lg object-contain"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white leading-tight line-clamp-2">
                    {(filmeSelecionado as any).titulo}
                  </h4>
                  {(filmeSelecionado as any).sinopse && (
                    <p className="text-[10px] text-white/60 leading-relaxed line-clamp-4">
                      {((filmeSelecionado as any).sinopse || '')
                        .replace(/<!--.*?-->/g, '')
                        .replace(/#{1,6}\s*/g, '')
                        .replace(/\*\*/g, '')
                        .replace(/"/g, '')
                        .trim()}
                    </p>
                  )}
                  {(filmeSelecionado as any).porque_assistir && (
                    <div className="border-l-2 border-blue-500/50 pl-2">
                      <p className="text-[10px] text-blue-200/80 italic line-clamp-3">
                        {((filmeSelecionado as any).porque_assistir || '')
                          .replace(/<!--.*?-->/g, '')
                          .replace(/#{1,6}\s*/g, '')
                          .replace(/\*\*/g, '')
                          .replace(/"/g, '')
                          .trim()}
                      </p>
                    </div>
                  )}
                  {(filmeSelecionado as any).trailer_url && (
                    <button
                      onClick={() => window.open((filmeSelecionado as any).trailer_url, '_blank')}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-[10px] font-medium transition-colors"
                    >
                      Ver Trailer <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Film className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">Selecione um dia no calendário</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

DesktopRecomendacoesSidebar.displayName = "DesktopRecomendacoesSidebar";
