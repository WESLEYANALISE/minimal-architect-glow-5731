import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, Video, BookOpen, Scroll, Sparkles, Brain, Calendar, Target, FileText, Search, BarChart3, Map, Footprints, ArrowRight, Wrench, Film, Mic, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeviceType } from "@/hooks/use-device-type";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useDicasMes, useDicaPorData } from "@/hooks/useDicaDoDia";
import { useFilmesMes, useFilmePorData } from "@/hooks/useFilmeDoDia";
import DicaDiaCalendario from "@/components/dica-dia/DicaDiaCalendario";
import FilmeDiaCalendario from "@/components/filme-dia/FilmeDiaCalendario";
import capaFaculdadeImage from "@/assets/capa-faculdade-opt.webp";

// Preload images for instant loading
const preloadImages = [capaFaculdadeImage].forEach(src => {
  const img = new Image();
  img.src = src;
});

type MaterialTab = 'materiais' | 'tematica' | 'ferramentas';
type MainTab = 'estudos' | 'livro-dia' | 'filme-dia';

const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getBrasiliaDate() {
  const now = new Date();
  const brasiliaOffset = -3 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + brasiliaOffset * 60000);
}

const Estudos = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const { user } = useAuth();
  const [showUSPModal, setShowUSPModal] = useState(false);
  const [activeTab, setActiveTab] = useState<MaterialTab>('materiais');
  const [mainTab, setMainTab] = useState<MainTab>('estudos');

  const isAdmin = user?.email === 'wn7corporation@gmail.com';

  // --- Livro do Dia state ---
  const brasiliaDate = getBrasiliaDate();
  const [livroMes, setLivroMes] = useState(brasiliaDate.getMonth() + 1);
  const [livroAno, setLivroAno] = useState(brasiliaDate.getFullYear());
  const [livroDiaSel, setLivroDiaSel] = useState<string | null>(null);

  const { data: dicasDoMes = [] } = useDicasMes(livroAno, livroMes);
  const { data: dicaSelecionada } = useDicaPorData(livroDiaSel);

  // Auto-select dia do livro
  useEffect(() => {
    if (dicasDoMes.length === 0) { setLivroDiaSel(null); return; }
    const hojeStr = getBrasiliaDate().toISOString().split('T')[0];
    const hoje = dicasDoMes.find(d => d.data === hojeStr);
    if (hoje) { setLivroDiaSel(hoje.data); return; }
    const passadas = dicasDoMes.filter(d => d.data <= hojeStr);
    if (passadas.length > 0) { setLivroDiaSel(passadas[passadas.length - 1].data); return; }
    setLivroDiaSel(dicasDoMes[0].data);
  }, [dicasDoMes]);

  // --- Filme do Dia state ---
  const [filmeMes, setFilmeMes] = useState(brasiliaDate.getMonth() + 1);
  const [filmeAno, setFilmeAno] = useState(brasiliaDate.getFullYear());
  const [filmeDiaSel, setFilmeDiaSel] = useState<string | null>(null);

  const { data: filmesDoMes = [] } = useFilmesMes(filmeAno, filmeMes);
  const { data: filmeSelecionado } = useFilmePorData(filmeDiaSel);

  // Auto-select dia do filme
  useEffect(() => {
    if (filmesDoMes.length === 0) { setFilmeDiaSel(null); return; }
    const hojeStr = getBrasiliaDate().toISOString().split('T')[0];
    const hoje = filmesDoMes.find(f => f.data === hojeStr);
    if (hoje) { setFilmeDiaSel(hoje.data); return; }
    const passados = filmesDoMes.filter(f => f.data <= hojeStr);
    if (passados.length > 0) { setFilmeDiaSel(passados[passados.length - 1].data); return; }
    setFilmeDiaSel(filmesDoMes[0].data);
  }, [filmesDoMes]);

  // Navigation helpers
  const navigateLivroMes = (dir: number) => {
    let m = livroMes + dir;
    let a = livroAno;
    if (m < 1) { m = 12; a--; } else if (m > 12) { m = 1; a++; }
    setLivroMes(m); setLivroAno(a); setLivroDiaSel(null);
  };
  const navigateFilmeMes = (dir: number) => {
    let m = filmeMes + dir;
    let a = filmeAno;
    if (m < 1) { m = 12; a--; } else if (m > 12) { m = 1; a++; }
    setFilmeMes(m); setFilmeAno(a); setFilmeDiaSel(null);
  };

  // --- existing items ---
  const handleAccessTrilhas = () => { setShowUSPModal(true); };
  const handleContinueToTrilhas = () => { setShowUSPModal(false); navigate('/faculdade/universidade/1/trilhas'); };

  const materiaisItems = [
    { id: "biblioteca", title: "Biblioteca III", description: "Livros para a faculdade", icon: BookOpen, route: "/biblioteca-faculdade" },
    { id: "resumos", title: "Resumos", description: "Conteúdo resumido", icon: Scroll, route: "/resumos-juridicos" },
    { id: "flashcards", title: "Flashcards", description: "Cartões de memorização", icon: Sparkles, route: "/flashcards" },
    { id: "videoaulas", title: "Videoaulas", description: "Aulas em vídeo por área", icon: Video, route: "/videoaulas/faculdade" },
    { id: "mapa-mental", title: "Mapa Mental", description: "Conexões visuais", icon: Brain, route: "/mapa-mental" },
    { id: "plano-estudos", title: "Plano de Estudos", description: "Organize sua preparação", icon: Calendar, route: "/plano-estudos" },
    { id: "questoes", title: "Questões", description: "Teste conhecimentos", icon: Target, route: "/ferramentas/questoes" },
    { id: "dicionario", title: "Dicionário", description: "Termos jurídicos", icon: FileText, route: "/dicionario" },
  ];

  const tematicaItems = [
    { id: "documentarios", title: "Documentários", description: "Filmes e séries jurídicas", icon: Film, route: "/ferramentas/documentarios-juridicos" },
    { id: "audiencias", title: "Audiências", description: "Sessões e julgamentos", icon: Mic, route: "/audiencias" },
  ];

  const ferramentasItems = [
    { id: "se-aprofunde", title: "Se Aprofunde", description: "Estudo aprofundado", icon: Map, route: "/se-aprofunde" },
    { id: "tcc", title: "Pesquise TCC", description: "Busque dissertações", icon: FileText, route: "/ferramentas/tcc" },
    { id: "localizador", title: "Localizador", description: "Encontre jurisprudência", icon: Search, route: "/pesquisar" },
    { id: "ranking", title: "Ranking", description: "Melhores faculdades", icon: BarChart3, route: "/ranking-faculdades" },
  ];

  const currentItems = activeTab === 'materiais' ? materiaisItems : activeTab === 'tematica' ? tematicaItems : ferramentasItems;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/?tab=iniciante')} 
            className="p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Faculdade</h1>
            <p className="text-sm text-muted-foreground">Conteúdo de estudos jurídicos</p>
          </div>
        </div>

        {/* ===== MAIN TAB TOGGLE ===== */}
        <div className="flex items-center w-full bg-neutral-800/80 rounded-full p-1 gap-0.5">
          <button
            onClick={() => setMainTab('estudos')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              mainTab === 'estudos'
                ? "bg-red-600/20 text-red-400 border border-red-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Estudos</span>
          </button>
          <button
            onClick={() => setMainTab('livro-dia')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              mainTab === 'livro-dia'
                ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Livro do Dia</span>
          </button>
          <button
            onClick={() => setMainTab('filme-dia')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              mainTab === 'filme-dia'
                ? "bg-red-600/20 text-red-400 border border-red-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Filme do Dia</span>
          </button>
        </div>

        {/* ===== TAB CONTENT ===== */}

        {/* --- ESTUDOS (conteúdo original) --- */}
        {mainTab === 'estudos' && (
          <>
            {/* Capa + Trilhas da Faculdade */}
            <div className="relative overflow-hidden rounded-3xl">
              <div className="relative h-40 md:h-52">
                <img 
                  src={capaFaculdadeImage} 
                  alt="Biblioteca jurídica" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-neutral-900" />
              </div>
              <div className="p-4 bg-card border border-border rounded-b-3xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-red-900/40 text-red-400 border border-red-700/50">
                    <Footprints className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium leading-snug">Trilhas da Faculdade</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">Grade curricular baseada na USP</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button 
                    onClick={handleAccessTrilhas}
                    className="px-8 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    <Footprints className="w-4 h-4" />
                    Acessar
                    <ArrowRight className="w-4 h-4 animate-[bounceRight_1s_ease-in-out_infinite]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal USP */}
            <Dialog open={showUSPModal} onOpenChange={setShowUSPModal}>
              <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-neutral-900 border-neutral-800">
                <div className="relative">
                  <img 
                    src={capaFaculdadeImage} 
                    alt="Faculdade de Direito da USP" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent" />
                </div>
                <div className="p-5 space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-2">Faculdade de Direito da USP</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      As trilhas de estudo são baseadas na grade curricular da <strong className="text-amber-400">maior faculdade de Direito do Brasil e da América Latina</strong>.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      onClick={handleContinueToTrilhas}
                      className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full py-3 font-medium flex items-center justify-center gap-2"
                    >
                      Começar a Estudar
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowUSPModal(false)}
                      className="w-full text-muted-foreground hover:text-white"
                    >
                      Fechar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Material de Estudos com Toggle */}
            <div className="space-y-4">
              <div className="bg-neutral-900/90 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="bg-red-900/20 ring-red-800/30 rounded-2xl p-3 shadow-lg ring-1">
                    <GraduationCap className="w-6 h-6 md:w-5 md:h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-lg font-bold text-foreground tracking-tight">Material de Estudos</h3>
                    <p className="text-muted-foreground text-xs">
                      {activeTab === 'materiais' ? 'Ferramentas de aprendizado' : activeTab === 'tematica' ? 'Conteúdo audiovisual' : 'Recursos auxiliares'}
                    </p>
                  </div>
                </div>
                <div className="mb-4 relative z-10">
                  <div className="inline-flex items-center bg-neutral-800/80 rounded-full p-1 gap-0.5">
                    <button
                      onClick={() => setActiveTab('materiais')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === 'materiais'
                          ? "bg-red-600/20 text-red-400 border border-red-500/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Materiais</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('tematica')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === 'tematica'
                          ? "bg-red-600/20 text-red-400 border border-red-500/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Film className="w-4 h-4" />
                      <span>Temática</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('ferramentas')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === 'ferramentas'
                          ? "bg-red-600/20 text-red-400 border border-red-500/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Ferramentas</span>
                    </button>
                  </div>
                </div>
                <div className={`grid gap-3 relative z-10 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'}`}>
                  {currentItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button 
                        key={item.id} 
                        onClick={() => navigate(item.route)} 
                        className="group bg-neutral-800/70 hover:bg-neutral-700/80 rounded-2xl p-3 text-left transition-colors duration-150 flex flex-col gap-2 shadow-lg border border-white/5 hover:border-white/10 overflow-hidden h-[130px]"
                      >
                        <div className="bg-red-900/20 group-hover:bg-red-900/30 rounded-xl p-2 w-fit transition-colors shadow-lg">
                          <Icon className="text-red-400 drop-shadow-md w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors drop-shadow-sm">
                            {item.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- LIVRO DO DIA --- */}
        {mainTab === 'livro-dia' && (
          <div className="space-y-4">
            {/* Calendário */}
            <div className="bg-gradient-to-br from-amber-900/40 to-amber-950/60 rounded-3xl p-4 border border-amber-700/20">
              {/* Navegação mês */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => navigateLivroMes(-1)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <span className="text-sm font-semibold text-white">
                  {MESES_NOME[livroMes - 1]} {livroAno}
                </span>
                <button onClick={() => navigateLivroMes(1)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
              <DicaDiaCalendario
                ano={livroAno}
                mes={livroMes}
                dicasDoMes={dicasDoMes}
                diaSelecionado={livroDiaSel}
                onDiaClick={setLivroDiaSel}
              />
            </div>

            {/* Card do Livro */}
            {dicaSelecionada ? (
              <div className="bg-neutral-900/90 rounded-3xl p-5 border border-white/5 space-y-4">
                <div className="flex gap-4">
                  {dicaSelecionada.livro_capa && (
                    <img 
                      src={dicaSelecionada.livro_capa} 
                      alt={dicaSelecionada.livro_titulo} 
                      className="w-24 h-36 object-cover rounded-xl shadow-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground leading-tight">{dicaSelecionada.livro_titulo}</h3>
                    {dicaSelecionada.livro_autor && (
                      <p className="text-sm text-muted-foreground mt-1">{dicaSelecionada.livro_autor}</p>
                    )}
                    {dicaSelecionada.area_livro && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-amber-900/30 text-amber-400 text-xs rounded-full border border-amber-700/30">
                        {dicaSelecionada.area_livro}
                      </span>
                    )}
                  </div>
                </div>

                {dicaSelecionada.frase_dia && (
                  <div className="bg-amber-900/20 border border-amber-700/20 rounded-2xl p-4">
                    <p className="text-amber-200 text-sm italic leading-relaxed">
                      "{dicaSelecionada.frase_dia}"
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate('/dica-do-dia')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-sm font-medium transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Ver recomendação
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-neutral-900/90 rounded-3xl p-8 border border-white/5 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma recomendação para este dia</p>
              </div>
            )}
          </div>
        )}

        {/* --- FILME DO DIA (admin only) --- */}
        {mainTab === 'filme-dia' && (
          <div className="space-y-4">
            {/* Calendário */}
            <div className="bg-gradient-to-br from-red-900/40 to-red-950/60 rounded-3xl p-4 border border-red-700/20">
              <div className="flex items-center justify-between mb-3">
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
              <FilmeDiaCalendario
                ano={filmeAno}
                mes={filmeMes}
                filmesDoMes={filmesDoMes}
                diaSelecionado={filmeDiaSel}
                onDiaClick={setFilmeDiaSel}
              />
            </div>

            {/* Card do Filme */}
            {filmeSelecionado ? (
              <div className="bg-neutral-900/90 rounded-3xl p-5 border border-white/5 space-y-4">
                <div className="flex gap-4">
                  {filmeSelecionado.poster_path && (
                    <img 
                      src={filmeSelecionado.poster_path.startsWith('http') ? filmeSelecionado.poster_path : `https://image.tmdb.org/t/p/w300${filmeSelecionado.poster_path}`}
                      alt={filmeSelecionado.titulo} 
                      className="w-24 h-36 object-cover rounded-xl shadow-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground leading-tight">{filmeSelecionado.titulo}</h3>
                    {filmeSelecionado.diretor && (
                      <p className="text-sm text-muted-foreground mt-1">Dir. {filmeSelecionado.diretor}</p>
                    )}
                    {filmeSelecionado.ano && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded-full border border-red-700/30">
                        {filmeSelecionado.ano}
                      </span>
                    )}
                  </div>
                </div>

                {filmeSelecionado.frase_dia && (
                  <div className="bg-red-900/20 border border-red-700/20 rounded-2xl p-4">
                    <p className="text-red-200 text-sm italic leading-relaxed">
                      "{filmeSelecionado.frase_dia}"
                    </p>
                  </div>
                )}

                <button
                  onClick={() => navigate('/filme-do-dia')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors"
                >
                  <Film className="w-4 h-4" />
                  Ver recomendação
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-neutral-900/90 rounded-3xl p-8 border border-white/5 text-center">
                <Film className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum filme para este dia</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Estudos;
