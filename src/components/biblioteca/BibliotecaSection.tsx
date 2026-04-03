import { memo, useCallback, useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookMarked, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { LivroCarouselCard } from "@/components/LivroCarouselCard";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { VideoImersivo } from "@/components/biblioteca/VideoImersivo";
import { BibliotecaNivelToggle, type BibliotecaNivelMode, LIVROS_INICIANTE, LIVROS_AVANCADO } from "@/components/biblioteca/BibliotecaSortToggle";

export interface BibliotecaSectionBook {
  id: number;
  titulo: string;
  capa: string | null;
  autor?: string;
  sobre?: string | null;
  urlVideoaula?: string | null;
}

interface BibliotecaSectionProps {
  title: string;
  subtitle?: string;
  capaUrl: string;
  count: number;
  route: string;
  livroRoute: string;
  books: BibliotecaSectionBook[];
  isLoading?: boolean;
  freeLimit?: number;
  isPremium?: boolean;
  isAreaBased?: boolean;
  areaBooks?: Record<string, BibliotecaSectionBook[]>;
  areaTabMinWidth?: number; // largura compartilhada entre seções area-based
  showNivelToggle?: boolean;
  navigate?: (path: string, options?: any) => void;
}

export const BibliotecaSection = memo(({
  title,
  subtitle,
  capaUrl,
  count,
  route,
  livroRoute,
  books,
  isLoading,
  freeLimit,
  isPremium: isPremiumUser,
  isAreaBased,
  areaBooks,
  areaTabMinWidth,
  showNivelToggle,
  navigate: navigateProp,
}: BibliotecaSectionProps) => {
  const routerNavigate = useNavigate();
  const navigate = navigateProp || routerNavigate;
  const scrollRef = useRef<HTMLDivElement>(null);
  const livrosScrollRef = useRef<HTMLDivElement>(null);
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const [nivelMode, setNivelMode] = useState<BibliotecaNivelMode>("faculdade");
  const [showVideoaulas, setShowVideoaulas] = useState(false);
  const [videoBook, setVideoBook] = useState<BibliotecaSectionBook | null>(null);
  const [isTouching, setIsTouching] = useState(false);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-scroll CSS animation para Clássicos (sem setInterval/scrollBy)

  const handleCarouselTouchStart = useCallback(() => {
    setIsTouching(true);
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
  }, []);

  const handleCarouselTouchEnd = useCallback(() => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => setIsTouching(false), 3000);
  }, []);

  // Livros que possuem videoaula
  const booksWithVideo = useMemo(() => {
    return books.filter(b => b.urlVideoaula);
  }, [books]);

  // Extrair YouTube video ID
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
    return match?.[1] || '';
  };
  // Estado de área selecionada para seções Estudos/OAB
  const AREA_PRIORITY = ["Direito Penal", "Direito Civil", "Direito Constitucional"];
  const areaNames = areaBooks
    ? Object.keys(areaBooks).sort((a, b) => {
        const pa = AREA_PRIORITY.indexOf(a);
        const pb = AREA_PRIORITY.indexOf(b);
        if (pa !== -1 && pb !== -1) return pa - pb;
        if (pa !== -1) return -1;
        if (pb !== -1) return 1;
        return a.localeCompare(b, 'pt-BR');
      })
    : [];
  const defaultArea = areaNames.includes("Direito Penal") ? "Direito Penal" : areaNames[0] || null;
  const [selectedArea, setSelectedArea] = useState<string | null>(defaultArea);

  // Sincroniza selectedArea quando areaBooks carrega pela primeira vez
  // Usa apenas areaNames.length como dep para evitar loop com selectedArea
  useEffect(() => {
    if (selectedArea === null && areaNames.length > 0) {
      const def = areaNames.includes("Direito Penal") ? "Direito Penal" : areaNames[0];
      setSelectedArea(def);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaNames.length]);

  const scroll = useCallback((dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  }, []);

  // Abreviação dos nomes das áreas para as abas
  const abreviarArea = (area: string) =>
    area.replace("Direito ", "").replace(" do Trabalho", " Trab.").replace("Processual ", "Proc. ");

  // Para seções area-based, o carrossel principal mostra os livros da área selecionada
  const livrosDaArea = selectedArea && areaBooks ? (areaBooks[selectedArea] || []) : [];
  
  // Filtragem por nível (apenas para Clássicos com showNivelToggle)
  const booksFiltered = useMemo(() => {
    if (!showNivelToggle) return books;
    if (showVideoaulas) return books.filter(b => b.urlVideoaula);
    if (nivelMode === "iniciante") return books.filter(b => LIVROS_INICIANTE.has(b.id));
    if (nivelMode === "avancado") return books.filter(b => LIVROS_AVANCADO.has(b.id));
    return books;
  }, [books, nivelMode, showNivelToggle, showVideoaulas]);

  const booksToShow = isAreaBased && areaBooks ? livrosDaArea : booksFiltered;

  // Duplicar livros para loop infinito CSS (apenas Clássicos com showNivelToggle)
  const loopBooks = useMemo(() => {
    if (!showNivelToggle || booksToShow.length === 0) return booksToShow;
    return [...booksToShow, ...booksToShow];
  }, [showNivelToggle, booksToShow]);

  return (
    <section className="relative">
      <div className="relative z-10 py-3">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-1 px-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10">
            <BookMarked className="w-3 h-3 text-white/90" />
            <span className="text-xs font-bold text-white">{count} obras</span>
          </div>
        </div>

        <div>
          {/* Title + subtitle + Ver todos */}
          <div className="flex items-end justify-between mb-3 px-2">
            <div>
              <h2
                className="text-lg sm:text-xl font-bold text-foreground tracking-tight"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={() => navigate(route)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-medium hover:bg-white/25 transition-colors shrink-0"
            >
              Ver todos
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>


          {/* Carrossel principal: livros da área selecionada (area-based) ou todos os livros */}
          <div className="relative">
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 text-white p-1.5 rounded-full -ml-1 hidden md:flex"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 text-white p-1.5 rounded-full -mr-1 hidden md:flex"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {showNivelToggle ? (
              /* Carrossel CSS animation infinito para Clássicos */
              <div
                className={`w-full ${isTouching ? 'overflow-x-auto' : 'overflow-hidden'} scrollbar-hide`}
                style={{ WebkitOverflowScrolling: 'touch', perspective: '1000px' }}
                onTouchStart={handleCarouselTouchStart}
                onTouchEnd={handleCarouselTouchEnd}
              >
                <div
                  className={`flex gap-3 pl-2 ${isTouching ? '' : 'animate-[scrollLeft_120s_linear_infinite]'}`}
                  style={{ width: "max-content", willChange: isTouching ? 'auto' : 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
                >
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-[28%] aspect-[2/3] rounded-xl bg-white/10 animate-pulse" style={{ width: '110px' }} />
                    ))
                  ) : loopBooks.length > 0 ? (
                    loopBooks.map((book, index) => {
                      const realIndex = index % booksToShow.length;
                      const isLocked = !isPremiumUser && freeLimit !== undefined && realIndex >= (freeLimit || 0);
                      const isAnalise = showVideoaulas && book.urlVideoaula;
                      return (
                        <div
                          key={`${book.id}-${index}`}
                          className="flex-shrink-0 min-w-0 relative group"
                          style={{ width: '110px' }}
                        >
                          <LivroCarouselCard
                            titulo={book.titulo}
                            capaUrl={book.capa}
                            isPremiumLocked={isLocked}
                            priority={index < 4}
                            onClick={() => {
                              if (isLocked) {
                                setShowPremiumCard(true);
                              } else if (isAnalise) {
                                setVideoBook(book);
                              } else {
                                navigate(`${livroRoute}/${book.id}`);
                              }
                            }}
                          />
                          {isAnalise && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ bottom: '20px' }}>
                              <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40 animate-pulse">
                                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-white/60 py-4 px-2">Nenhum livro encontrado.</p>
                  )}
                </div>
              </div>
            ) : (
              /* Carrossel scroll manual para demais bibliotecas */
              <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pl-2"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-[0_0_28%] md:flex-[0_0_18%] lg:flex-[0_0_13%] aspect-[2/3] rounded-xl bg-white/10 animate-pulse"
                    />
                  ))
                ) : booksToShow.length > 0 ? (
                  booksToShow.map((book, index) => {
                    const isLocked = !isPremiumUser && freeLimit !== undefined && index >= freeLimit;
                    const isAnalise = showVideoaulas && book.urlVideoaula;
                    return (
                      <div
                        key={book.id}
                        className="flex-[0_0_28%] md:flex-[0_0_18%] lg:flex-[0_0_13%] min-w-0 relative group animate-fade-in"
                      >
                        <LivroCarouselCard
                          titulo={book.titulo}
                          capaUrl={book.capa}
                          isPremiumLocked={isLocked}
                          priority={index < 4}
                          showYear={title === "OAB" ? "2026" : undefined}
                          onClick={() => {
                            if (isLocked) {
                              setShowPremiumCard(true);
                            } else if (isAnalise) {
                              setVideoBook(book);
                            } else {
                              navigate(`${livroRoute}/${book.id}`);
                            }
                          }}
                        />
                        {isAnalise && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ bottom: '20px' }}>
                            <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/40 animate-pulse">
                              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-white/60 py-4 px-2">Nenhum livro encontrado.</p>
                )}
              </div>
            )}
          </div>

          {/* Abas de área ABAIXO do carrossel (apenas para Estudos e OAB) */}
          {isAreaBased && areaBooks && areaNames.length > 0 && (() => {
            const longestLabel = areaNames.reduce((acc, area) => {
              const label = abreviarArea(area);
              return label.length > acc.length ? label : acc;
            }, "");
            const minWidth = areaTabMinWidth ?? (longestLabel.length * 5 + 12);
            return (
              <div className="mt-3" ref={livrosScrollRef}>
                <div
                  className="flex overflow-x-auto scrollbar-hide gap-2 px-2 pb-1"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {areaNames.map((area) => {
                    const isActive = selectedArea === area;
                    return (
                      <button
                        key={area}
                        onClick={() => setSelectedArea(area)}
                        style={{ minWidth: `${minWidth}px` }}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap border text-center ${
                          isActive
                            ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30"
                            : "bg-white/10 text-white/70 border-white/10 hover:bg-white/20 hover:text-white"
                        }`}
                      >
                        {abreviarArea(area)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Toggle Faculdade/Iniciante/Avançado — centralizado + Análise na segunda linha */}
          {showNivelToggle && (
            <div className="mt-3 space-y-2">
              {/* Linha 1: Faculdade, Iniciante, Avançado */}
              <div className="flex justify-center gap-2 px-2">
                {(["faculdade", "iniciante", "avancado"] as const).map((nivel) => {
                  const labels: Record<string, string> = { faculdade: "Faculdade", iniciante: "Iniciante", avancado: "Avançado" };
                  const isActive = nivelMode === nivel && !showVideoaulas;
                  return (
                    <button
                      key={nivel}
                      onClick={() => { setNivelMode(nivel); setShowVideoaulas(false); }}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap border ${
                        isActive
                          ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30"
                          : "bg-white/10 text-white/70 border-white/10 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {labels[nivel]}
                    </button>
                  );
                })}
              </div>
              {/* Linha 2: Análise */}
              {booksWithVideo.length > 0 && (
                <div className="flex justify-center px-2">
                  <button
                    onClick={() => setShowVideoaulas(!showVideoaulas)}
                    className={`flex-shrink-0 px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap border inline-flex items-center gap-1.5 ${
                      showVideoaulas
                        ? "bg-red-500 text-white border-red-400 shadow-md shadow-red-500/30"
                        : "bg-white/10 text-white/70 border-white/10 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    Análise
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        title="Conteúdo Premium"
        description="Desbloqueie todos os livros assinando um dos nossos planos."
        sourceFeature={`Biblioteca ${title}`}
      />

      <VideoImersivo
        isOpen={!!videoBook}
        onClose={() => setVideoBook(null)}
        videoUrl={videoBook?.urlVideoaula || ""}
        titulo={videoBook?.titulo || ""}
        autor={videoBook?.autor}
        capaUrl={videoBook?.capa}
      />
    </section>
  );
});

BibliotecaSection.displayName = "BibliotecaSection";
