import { memo, useState, useEffect, useCallback } from "react";
import { BookOpen, ChevronLeft, ChevronRight, ArrowRight, Film, Sparkles } from "lucide-react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { useDicasMes, useDicaPorData } from "@/hooks/useDicaDoDia";
import { useFilmesMes, useFilmePorData } from "@/hooks/useFilmeDoDia";
import DicaDiaCalendario from "@/components/dica-dia/DicaDiaCalendario";
import FilmeDiaCalendario from "@/components/filme-dia/FilmeDiaCalendario";
import { motion, AnimatePresence } from "framer-motion";

const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getBrasiliaDate() {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + brasiliaOffset * 60000);
}

type RecomendacaoTab = 'livros' | 'filmes';

interface LivroDoDiaHomeSectionProps {
  userName?: string | null;
  hideHeader?: boolean;
}

export const LivroDoDiaHomeSection = memo(({ userName, hideHeader = false }: LivroDoDiaHomeSectionProps) => {
  const navigate = useTransitionNavigate();
  const brasiliaDate = getBrasiliaDate();

  const [activeTab, setActiveTab] = useState<RecomendacaoTab>('livros');

  // Livros state
  const [mes, setMes] = useState(brasiliaDate.getMonth() + 1);
  const [ano, setAno] = useState(brasiliaDate.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const { data: dicasDoMes = [] } = useDicasMes(ano, mes);
  const { data: dicaSelecionada } = useDicaPorData(diaSelecionado);

  // Filmes state
  const [filmeMes, setFilmeMes] = useState(brasiliaDate.getMonth() + 1);
  const [filmeAno, setFilmeAno] = useState(brasiliaDate.getFullYear());
  const [filmeDiaSel, setFilmeDiaSel] = useState<string | null>(null);

  const { data: filmesDoMes = [] } = useFilmesMes(filmeAno, filmeMes);
  const { data: filmeSelecionado } = useFilmePorData(filmeDiaSel);

  // Auto-select dia livros
  useEffect(() => {
    if (dicasDoMes.length === 0) { setDiaSelecionado(null); return; }
    const hojeStr = getBrasiliaDate().toISOString().split('T')[0];
    const hoje = dicasDoMes.find(d => d.data === hojeStr);
    if (hoje) { setDiaSelecionado(hoje.data); return; }
    const passadas = dicasDoMes.filter(d => d.data <= hojeStr);
    if (passadas.length > 0) { setDiaSelecionado(passadas[passadas.length - 1].data); return; }
    setDiaSelecionado(dicasDoMes[0].data);
  }, [dicasDoMes]);

  // Auto-select dia filmes
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

  const personalMessage = userName
    ? `${userName}, veja a recomendação de hoje`
    : "Veja a recomendação de hoje";

  return (
    <div className={`${hideHeader ? 'h-full' : 'space-y-3 mt-4'}`}>
      {/* Header externo */}
      {!hideHeader && (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-xl">
            <Sparkles className="w-5 h-5 xl:w-6 xl:h-6 text-amber-100" />
          </div>
          <div>
            <h3 className="text-lg xl:text-xl 2xl:text-2xl font-bold text-foreground tracking-tight">
              Recomendação do Dia
            </h3>
            <p className="text-muted-foreground text-xs xl:text-sm">
              Sugestões diárias de leitura e filmes
            </p>
          </div>
        </div>
      )}

      {/* Container */}
      <div className={`rounded-3xl p-4 relative overflow-hidden shadow-2xl border transition-colors duration-300 ${
        activeTab === 'livros'
          ? 'bg-gradient-to-b from-amber-950/90 via-amber-950/70 to-neutral-900 border-amber-800/30'
          : 'bg-gradient-to-b from-blue-950/90 via-blue-950/70 to-neutral-900 border-blue-800/30'
      } ${hideHeader ? 'h-full flex flex-col' : ''}`}>
        {/* Header interno (quando hideHeader) */}
        {hideHeader && (
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 bg-white/15 rounded-xl">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Recomendação do Dia</h3>
              <p className="text-white/50 text-[10px]">Sugestões diárias de leitura e filmes</p>
            </div>
          </div>
        )}
        {/* Toggle Tabs */}
        <div className="flex items-center w-full bg-white/10 rounded-full p-1 gap-0.5 mb-4">
          <button
            onClick={() => setActiveTab('livros')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'livros'
                ? "bg-white text-amber-900 shadow-md"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Livros</span>
          </button>
          <button
            onClick={() => setActiveTab('filmes')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'filmes'
                ? "bg-white text-blue-900 shadow-md"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Filmes</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* === LIVROS TAB === */}
          {activeTab === 'livros' && (
            <motion.div key="livros" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <div className="bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950/95 rounded-2xl p-3 overflow-hidden mb-3">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => navigateMes(-1)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-sm font-semibold text-white">
                    {MESES_NOME[mes - 1]} {ano}
                  </span>
                  <button onClick={() => navigateMes(1)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="overflow-hidden">
                  <DicaDiaCalendario
                    ano={ano}
                    mes={mes}
                    dicasDoMes={dicasDoMes}
                    diaSelecionado={diaSelecionado}
                    onDiaClick={setDiaSelecionado}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {dicaSelecionada ? (
                  <motion.div
                    key={dicaSelecionada.data}
                    className="bg-black/90 rounded-2xl p-4 space-y-3 border border-white/10"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-amber-400/90 text-xs font-medium">{personalMessage}</p>
                    <div className="flex gap-3">
                      {dicaSelecionada.livro_capa && (
                        <img src={dicaSelecionada.livro_capa} alt={dicaSelecionada.livro_titulo} className="w-20 h-28 object-cover rounded-xl shadow-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white leading-tight">{dicaSelecionada.livro_titulo}</h3>
                        {dicaSelecionada.livro_autor && <p className="text-xs text-neutral-400 mt-1">{dicaSelecionada.livro_autor}</p>}
                        {dicaSelecionada.area_livro && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 bg-amber-900/40 text-amber-400 text-[10px] rounded-full border border-amber-700/30">
                            {dicaSelecionada.area_livro}
                          </span>
                        )}
                      </div>
                    </div>
                    {dicaSelecionada.frase_dia && (
                      <div className="bg-amber-950/40 border border-amber-800/20 rounded-xl p-3">
                        <p className="text-amber-200/90 text-xs italic leading-relaxed">"{dicaSelecionada.frase_dia}"</p>
                      </div>
                    )}
                    <motion.button onClick={() => navigate('/dica-do-dia')} className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-sm font-semibold transition-colors shadow-lg shadow-amber-900/30" whileTap={{ scale: 0.97 }}>
                      <BookOpen className="w-4 h-4" />
                      Ver recomendação
                      <ArrowRight className="w-4 h-4 animate-[bounceRight_1s_ease-in-out_infinite]" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="bg-black/90 rounded-2xl p-6 text-center border border-white/10">
                    <BookOpen className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <p className="text-neutral-500 text-xs">Nenhuma recomendação para este dia</p>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* === FILMES TAB === */}
          {activeTab === 'filmes' && (
            <motion.div key="filmes" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-3">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-950/70 rounded-2xl p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => navigateFilmeMes(-1)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-sm font-semibold text-white">
                    {MESES_NOME[filmeMes - 1]} {filmeAno}
                  </span>
                  <button onClick={() => navigateFilmeMes(1)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="overflow-hidden">
                  <FilmeDiaCalendario
                    ano={filmeAno}
                    mes={filmeMes}
                    filmesDoMes={filmesDoMes}
                    diaSelecionado={filmeDiaSel}
                    onDiaClick={setFilmeDiaSel}
                  />
                </div>
              </div>

              {filmeSelecionado ? (
                <motion.div
                  className="bg-black/90 rounded-2xl p-4 space-y-3 border border-white/10"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-blue-400/90 text-xs font-medium">{personalMessage}</p>
                  <div className="flex gap-3">
                    {filmeSelecionado.poster_path && (
                      <img
                        src={filmeSelecionado.poster_path.startsWith('http') ? filmeSelecionado.poster_path : `https://image.tmdb.org/t/p/w300${filmeSelecionado.poster_path}`}
                        alt={filmeSelecionado.titulo}
                        className="w-20 h-28 object-cover rounded-xl shadow-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-white leading-tight">{filmeSelecionado.titulo}</h3>
                      {filmeSelecionado.diretor && <p className="text-xs text-neutral-400 mt-1">Dir. {filmeSelecionado.diretor}</p>}
                      {filmeSelecionado.ano && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-900/40 text-blue-400 text-[10px] rounded-full border border-blue-700/30">
                          {filmeSelecionado.ano}
                        </span>
                      )}
                    </div>
                  </div>
                  {filmeSelecionado.frase_dia && (
                    <div className="bg-blue-950/40 border border-blue-800/20 rounded-xl p-3">
                      <p className="text-blue-200/90 text-xs italic leading-relaxed">"{filmeSelecionado.frase_dia}"</p>
                    </div>
                  )}
                  <motion.button onClick={() => navigate('/filme-do-dia')} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30" whileTap={{ scale: 0.97 }}>
                    <Film className="w-4 h-4" />
                    Ver recomendação
                    <ArrowRight className="w-4 h-4 animate-[bounceRight_1s_ease-in-out_infinite]" />
                  </motion.button>
                </motion.div>
              ) : (
                <div className="bg-black/90 rounded-2xl p-6 text-center border border-white/10">
                  <Film className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-neutral-500 text-xs">Nenhum filme para este dia</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

LivroDoDiaHomeSection.displayName = "LivroDoDiaHomeSection";
