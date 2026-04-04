import { useState, useEffect, useRef, useMemo, useTransition, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUp, Crown, BookOpen, ArrowLeft, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import QuestoesModal from "@/components/QuestoesModal";
import TermosModal from "@/components/TermosModal";
import PerguntaModal from "@/components/PerguntaModal";
import FlashcardsArtigoModal from "@/components/FlashcardsArtigoModal";
import { VadeMecumTabsInline } from "@/components/VadeMecumTabsInline";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { ArtigoListaCompacta } from "@/components/ArtigoListaCompacta";
import { ArtigoFullscreenDrawer } from "@/components/ArtigoFullscreenDrawer";
import { useProgressiveArticles } from "@/hooks/useProgressiveArticles";
import { LeiHeader } from "@/components/LeiHeader";
import { ModoVisualizacaoArtigos } from "@/components/ModoVisualizacaoArtigos";
import { AulaArtigoSlidesViewer } from "@/components/AulaArtigoSlidesViewer";
import { useDeviceType } from "@/hooks/use-device-type";
import { VadeMecumDesktopLayout } from "@/components/vade-mecum/VadeMecumDesktopLayout";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

// ID boundary: CF body = 1-272, ADCT = 273+
const CF_ADCT_BOUNDARY = 273;

const Constituicao = () => {
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [secao, setSecao] = useState<'cf' | 'adct' | null>(null);
  const [targetArticleNumber, setTargetArticleNumber] = useState<string | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Detectar tipo de dispositivo
  const { isDesktop } = useDeviceType();

  // Show scroll to top button after scrolling
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Debounce da pesquisa para evitar travamentos
  useEffect(() => {
    if (searchInput === '') {
      setSearchQuery('');
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      startTransition(() => {
        setSearchQuery(searchInput);
        setIsSearching(false);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  
  // Drawer state for fullscreen article view
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [highlightAlteracao, setHighlightAlteracao] = useState<{ elementoTipo: string; elementoNumero: string | null; tipoAlteracao?: string; leiAlteradora?: string | null; anoAlteracao?: number | null; textoCompleto?: string | null; textoAnterior?: string | null; urlLeiAlteradora?: string | null } | null>(null);

  // Auto-search based on URL parameter and scroll to article
  useEffect(() => {
    const artigoParam = searchParams.get('artigo');
    const secaoParam = searchParams.get('secao');
    if (secaoParam === 'adct') {
      setSecao('adct');
    } else if (secaoParam === 'cf' || artigoParam) {
      setSecao('cf');
    }
    if (artigoParam) {
      setSearchInput(artigoParam);
      setTargetArticleNumber(artigoParam);
      setSearchQuery(artigoParam);
      setActiveTab('artigos');
    }
  }, [searchParams]);

  const [stickyPlayerOpen, setStickyPlayerOpen] = useState(false);
  const [currentAudio, setCurrentAudio] = useState({
    url: "",
    title: "",
    isComment: false
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    artigo: "",
    numeroArtigo: "",
    tipo: "explicacao" as "explicacao" | "exemplo",
    nivel: "tecnico" as "tecnico" | "simples"
  });

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoModalData, setVideoModalData] = useState({
    videoUrl: "",
    artigo: "",
    numeroArtigo: ""
  });

  const [questoesModalOpen, setQuestoesModalOpen] = useState(false);
  const [questoesModalData, setQuestoesModalData] = useState({
    artigo: "",
    numeroArtigo: ""
  });

  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosModalData, setTermosModalData] = useState({
    artigo: "",
    numeroArtigo: ""
  });

  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [flashcardsModalData, setFlashcardsModalData] = useState({
    artigo: "",
    numeroArtigo: ""
  });

  const [perguntaModalOpen, setPerguntaModalOpen] = useState(false);
  const [perguntaData, setPerguntaData] = useState({ artigo: "", numeroArtigo: "" });
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  
  // Aula Artigo state
  const [aulaArtigoModalOpen, setAulaArtigoModalOpen] = useState(false);
  const [aulaArtigoData, setAulaArtigoData] = useState({ artigo: "", numeroArtigo: "" });
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'artigos' | 'playlist' | 'ranking'>('artigos');
  
  // Modo de visualização: numérico ou capítulos
  const [modoVisualizacao, setModoVisualizacao] = useState<'numerico' | 'capitulos'>('numerico');
  const [capituloSelecionado, setCapituloSelecionado] = useState<string>('');
  
  // View mode state
  const [viewMode, setViewMode] = useState<'lista' | 'expandido'>('lista');
  
  const tableName = "CF - Constituição Federal";
  const codeName = "Constituição Federal";

  // Estado para controlar artigos com narração (sem geração automática)
  const [artigosComNarracao, setArtigosComNarracao] = useState<Set<number>>(new Set());

  // Callback when user scrolls past article 7
  const handleScrollPastArticle7 = useCallback((isPast: boolean) => {
    setShowScrollTop(isPast);
  }, []);

  // Scroll to top function
  const scrollToTopSmooth = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Use progressive loading por seção para evitar mistura de cache (CF vs ADCT)
  const {
    articles,
    isLoadingInitial: isLoading,
    isLoadingMore: isLoadingFull,
    isComplete,
    totalLoaded
  } = useProgressiveArticles<Article>({
    tableName,
    initialChunk: 50,
    backgroundChunk: 100,
    delayBetweenChunks: 200,
    cacheKey: secao ? `${tableName}:${secao}` : `${tableName}:all`,
    idMaxExclusive: secao === 'cf' ? CF_ADCT_BOUNDARY : undefined,
    idMin: secao === 'adct' ? CF_ADCT_BOUNDARY : undefined,
    enabled: !!secao
  });

  const sectionArticles = useMemo(() => articles, [articles]);
  
  // Função placeholder para updateArticle
  const updateArticle = useCallback((id: number, updates: Partial<Article>) => {
    console.log('updateArticle called', id, updates);
  }, []);

  // Inicializar set de artigos com narração
  useEffect(() => {
    if (articles.length > 0) {
      const withNarration = new Set<number>();
      articles.forEach(art => {
        if (art["Narração"] && art["Narração"].trim() !== "") {
          withNarration.add(art.id);
        }
      });
      setArtigosComNarracao(withNarration);
    }
  }, [articles]);


  // Navegação entre artigos no drawer
  const currentArticleIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return sectionArticles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, sectionArticles]);

  // Compute section info (TÍTULO/CAPÍTULO) for the selected article
  const selectedSectionInfo = useMemo(() => {
    if (!selectedArticle || currentArticleIndex < 0) return null;
    // Walk backwards to find the closest header (articles with null "Número do Artigo" are headers)
    for (let i = currentArticleIndex - 1; i >= 0; i--) {
      const art = sectionArticles[i];
      if (!art["Número do Artigo"] && art["Artigo"]) {
        const lines = art["Artigo"].split('\n').map(l => l.trim()).filter(Boolean);
        // Look for TÍTULO / CAPÍTULO pattern
        for (let j = 0; j < Math.min(lines.length, 4); j++) {
          if (/^(T[ÍI]TULO|CAP[ÍI]TULO|SE[CÇ][AÃ]O|LIVRO|PARTE)\s+/i.test(lines[j])) {
            const subtitulo = lines[j + 1] && !/^Art\./i.test(lines[j + 1]) ? lines[j + 1] : undefined;
            return { titulo: lines[j], subtitulo };
          }
        }
        // If the header record itself is the text (single line)
        if (/^(T[ÍI]TULO|CAP[ÍI]TULO|SE[CÇ][AÃ]O|LIVRO|PARTE)\s+/i.test(lines[0])) {
          return { titulo: lines[0], subtitulo: lines[1] };
        }
      }
    }
    return null;
  }, [selectedArticle, currentArticleIndex, sectionArticles]);

  // Navegação circular - vai para o último se estiver no primeiro, e vice-versa
  const handlePreviousArticle = useCallback(() => {
    if (sectionArticles.length === 0) return;
    if (currentArticleIndex <= 0) {
      setSelectedArticle(sectionArticles[sectionArticles.length - 1]);
    } else {
      setSelectedArticle(sectionArticles[currentArticleIndex - 1]);
    }
  }, [currentArticleIndex, sectionArticles]);

  const handleNextArticle = useCallback(() => {
    if (sectionArticles.length === 0) return;
    if (currentArticleIndex >= sectionArticles.length - 1) {
      setSelectedArticle(sectionArticles[0]);
    } else {
      setSelectedArticle(sectionArticles[currentArticleIndex + 1]);
    }
  }, [currentArticleIndex, sectionArticles]);

  // Filter and limit articles with useMemo
  const filteredArticles = useMemo(() => {
    if (!searchQuery) return sectionArticles;
    const searchLower = searchQuery.toLowerCase().trim();
    const isNumericSearch = /^\d+$/.test(searchLower);
    const normalizeDigits = (s: string) => s.replace(/\D/g, "");

    const filtered = sectionArticles.filter(article => {
      const numeroArtigoRaw = article["Número do Artigo"] || "";
      const numeroArtigo = numeroArtigoRaw.toLowerCase().trim();
      const conteudoArtigo = article["Artigo"]?.toLowerCase() || "";

      if (isNumericSearch) {
        const numeroDigits = normalizeDigits(numeroArtigo);
        if (numeroDigits.startsWith(searchLower)) return true;
      } else {
        if (numeroArtigo === searchLower || numeroArtigo.includes(searchLower)) return true;
      }

      return conteudoArtigo.includes(searchLower);
    });

    return filtered.sort((a, b) => {
      const aNum = (a["Número do Artigo"] || "").toLowerCase().trim();
      const bNum = (b["Número do Artigo"] || "").toLowerCase().trim();
      const normalizeA = normalizeDigits(aNum);
      const normalizeB = normalizeDigits(bNum);
      
      const aExato = isNumericSearch ? normalizeA === searchLower : aNum === searchLower;
      const bExato = isNumericSearch ? normalizeB === searchLower : bNum === searchLower;
      
      if (aExato && !bExato) return -1;
      if (!aExato && bExato) return 1;
      
      if (isNumericSearch) {
        const aNumInt = parseInt(normalizeA) || 0;
        const bNumInt = parseInt(normalizeB) || 0;
        return aNumInt - bNumInt;
      }
      
      return 0;
    });
  }, [sectionArticles, searchQuery]);

  const displayedArticles = useMemo(() => filteredArticles, [filteredArticles]);

  // Filter articles with audio for playlist
  const articlesWithAudio = useMemo(() => {
    return sectionArticles.filter(article => 
      article["Narração"] && 
      article["Narração"].trim() !== "" &&
      article["Número do Artigo"] &&
      article["Número do Artigo"].trim() !== ""
    ) as any[];
  }, [sectionArticles]);


  const handlePlayComment = (audioUrl: string, title: string) => {
    setCurrentAudio({
      url: audioUrl,
      title,
      isComment: true
    });
    setStickyPlayerOpen(true);
  };

  const handleOpenAula = (article: Article) => {
    if (article.Aula && article["Artigo"] && article["Número do Artigo"]) {
      setVideoModalData({
        videoUrl: article.Aula,
        artigo: article["Artigo"],
        numeroArtigo: article["Número do Artigo"]
      });
      setVideoModalOpen(true);
    }
  };

  const handleOpenExplicacao = (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => {
    setModalData({
      artigo,
      numeroArtigo,
      tipo,
      nivel: nivel || "tecnico"
    });
    setModalOpen(true);
  };
  
  const handleGenerateFlashcards = async (artigo: string, numeroArtigo: string) => {
    setLoadingFlashcards(true);
    try {
      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: { content: `Art. ${numeroArtigo}\n${artigo}` }
      });
      if (response.error) throw response.error;
      setFlashcardsModalData({ artigo, numeroArtigo });
      setFlashcardsModalOpen(true);
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const handleArticleClick = (numeroArtigo: string) => {
    setActiveTab('artigos');
    setSearchQuery(numeroArtigo);
  };

  // Modais compartilhados
  const renderModals = () => (
    <>
      <StickyAudioPlayer 
        isOpen={stickyPlayerOpen} 
        onClose={() => setStickyPlayerOpen(false)} 
        audioUrl={currentAudio.url} 
        title={currentAudio.title}
      />

      <ExplicacaoModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        artigo={modalData.artigo} 
        numeroArtigo={modalData.numeroArtigo} 
        tipo={modalData.tipo} 
        nivel={modalData.nivel}
        codigo="cf"
        codigoTabela="CF - Constituição Federal"
      />

      <VideoAulaModal 
        isOpen={videoModalOpen} 
        onClose={() => setVideoModalOpen(false)} 
        videoUrl={videoModalData.videoUrl} 
        artigo={videoModalData.artigo} 
        numeroArtigo={videoModalData.numeroArtigo} 
      />

      <QuestoesModal 
        isOpen={questoesModalOpen} 
        onClose={() => setQuestoesModalOpen(false)} 
        artigo={questoesModalData.artigo} 
        numeroArtigo={questoesModalData.numeroArtigo} 
      />

      <TermosModal 
        isOpen={termosModalOpen} 
        onClose={() => setTermosModalOpen(false)} 
        artigo={termosModalData.artigo} 
        numeroArtigo={termosModalData.numeroArtigo} 
      />

      <FlashcardsArtigoModal 
        isOpen={flashcardsModalOpen} 
        onClose={() => setFlashcardsModalOpen(false)} 
        artigo={flashcardsModalData.artigo} 
        numeroArtigo={flashcardsModalData.numeroArtigo} 
      />

      <PerguntaModal 
        isOpen={perguntaModalOpen} 
        onClose={() => setPerguntaModalOpen(false)} 
        artigo={perguntaData.artigo} 
        numeroArtigo={perguntaData.numeroArtigo} 
      />

      <AulaArtigoSlidesViewer
        isOpen={aulaArtigoModalOpen}
        onClose={() => setAulaArtigoModalOpen(false)}
        codigoTabela={tableName}
        codigoNome={codeName}
        numeroArtigo={aulaArtigoData.numeroArtigo}
        conteudoArtigo={aulaArtigoData.artigo}
      />
    </>
  );

  // Contagem de artigos por seção
  const cfBodyCount = useMemo(() => articles.filter(a => a.id < CF_ADCT_BOUNDARY).length, [articles]);
  const adctCount = useMemo(() => articles.filter(a => a.id >= CF_ADCT_BOUNDARY).length, [articles]);

  // Tela de seleção de seção
  const renderSectionSelector = () => (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <LeiHeader 
        titulo="CONSTITUIÇÃO FEDERAL" 
        subtitulo="de 5 de outubro de 1988"
      />
      
      <div className="px-4 max-w-4xl mx-auto space-y-4 mt-2">
        <Card
          className="cursor-pointer hover:scale-[1.01] hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-500/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
          onClick={() => setSecao('cf')}
        >
          <div 
            className="absolute top-0 left-0 right-0 h-1 opacity-80"
            style={{
              background: `linear-gradient(90deg, transparent, hsl(38, 92%, 50%), transparent)`,
              boxShadow: `0 0 20px hsl(38, 92%, 50%)`
            }}
          />
          <div 
            className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded"
            style={{ 
              backgroundColor: `hsl(38, 92%, 50%, 0.15)`,
              color: 'hsl(38, 92%, 50%)' 
            }}
          >
            CF/88
          </div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-amber-600 rounded-full p-3.5 shadow-lg shadow-amber-600/30">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-0.5">Constituição Federal</h3>
              <p className="text-sm text-muted-foreground mb-1.5">
                Corpo principal da Carta Magna
              </p>
              <p className="text-sm font-medium" style={{ color: 'hsl(38, 92%, 50%)' }}>
                Art. 1º ao Art. 250
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:scale-[1.01] hover:shadow-xl transition-all border-2 border-transparent hover:border-sky-500/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative animate-fade-in"
          onClick={() => setSecao('adct')}
        >
          <div 
            className="absolute top-0 left-0 right-0 h-1 opacity-80"
            style={{
              background: `linear-gradient(90deg, transparent, hsl(199, 89%, 48%), transparent)`,
              boxShadow: `0 0 20px hsl(199, 89%, 48%)`
            }}
          />
          <div 
            className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded"
            style={{ 
              backgroundColor: `hsl(199, 89%, 48%, 0.15)`,
              color: 'hsl(199, 89%, 48%)' 
            }}
          >
            ADCT
          </div>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-sky-600 rounded-full p-3.5 shadow-lg shadow-sky-600/30">
              <ScrollText className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-0.5">Emendas Constitucionais</h3>
              <p className="text-sm text-muted-foreground mb-1.5">
                Disposições transitórias da CF/88
              </p>
              <p className="text-sm font-medium" style={{ color: 'hsl(199, 89%, 48%)' }}>
                Art. 1º ao Art. 138
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Se nenhuma seção foi selecionada, mostra seletor
  if (!secao) {
    return renderSectionSelector();
  }

  // LAYOUT DESKTOP - 3 colunas
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {renderModals()}
        
        <VadeMecumDesktopLayout
          tableName={tableName}
          codeName={secao === 'adct' ? 'ADCT' : codeName}
          lawNumber="de 5 de outubro de 1988"
          articles={sectionArticles}
          isLoading={isLoading}
          selectedArticle={selectedArticle}
          onSelectArticle={(article) => setSelectedArticle(article as Article)}
          onCloseDetail={() => setSelectedArticle(null)}
          onPlayAudio={handlePlayComment}
          onOpenExplicacao={handleOpenExplicacao}
          onOpenAula={handleOpenAula}
          onOpenTermos={(artigo, numeroArtigo) => {
            setTermosModalData({ artigo, numeroArtigo });
            setTermosModalOpen(true);
          }}
          onOpenQuestoes={(artigo, numeroArtigo) => {
            setQuestoesModalData({ artigo, numeroArtigo });
            setQuestoesModalOpen(true);
          }}
          onPerguntar={(artigo, numeroArtigo) => {
            setPerguntaData({ artigo, numeroArtigo });
            setPerguntaModalOpen(true);
          }}
          onOpenAulaArtigo={(artigo, numeroArtigo) => {
            setAulaArtigoData({ artigo, numeroArtigo });
            setAulaArtigoModalOpen(true);
            setSelectedArticle(null);
          }}
          onGenerateFlashcards={handleGenerateFlashcards}
          loadingFlashcards={loadingFlashcards}
          targetArticle={targetArticleNumber}
          backLabel="Códigos"
          backRoute="/vade-mecum?categoria=codigos"
          header={
            <LeiHeader 
              titulo={secao === 'adct' ? 'EMENDAS CONSTITUCIONAIS' : 'CONSTITUIÇÃO FEDERAL'} 
              subtitulo={secao === 'adct' ? 'Disposições transitórias da CF/88' : 'de 5 de outubro de 1988'}
            />
          }
        />
      </div>
    );
  }

  // LAYOUT MOBILE/TABLET - Original
  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {renderModals()}

      {/* Header com Brasão - sempre visível quando na aba artigos */}
      {activeTab === 'artigos' && (
        <div>
          <LeiHeader 
            titulo={secao === 'adct' ? 'EMENDAS CONSTITUCIONAIS' : 'CONSTITUIÇÃO FEDERAL'} 
            subtitulo={secao === 'adct' ? 'Disposições transitórias da CF/88' : 'de 5 de outubro de 1988'}
          />
        </div>
      )}


      {/* Tabs Inline - Playlist e Em Alta - apenas quando NÃO está nos artigos */}
      {activeTab !== 'artigos' && (
        <VadeMecumTabsInline 
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* Artigo Fullscreen Drawer */}
      <ArtigoFullscreenDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedArticle(null);
          setHighlightAlteracao(null);
        }}
        article={selectedArticle}
        codeName="CF/88"
        onPlayComment={handlePlayComment}
        onOpenAula={handleOpenAula}
        onOpenExplicacao={handleOpenExplicacao}
        onGenerateFlashcards={handleGenerateFlashcards}
        onOpenTermos={(artigo, numeroArtigo) => {
          setTermosModalData({ artigo, numeroArtigo });
          setTermosModalOpen(true);
        }}
        onOpenQuestoes={(artigo, numeroArtigo) => {
          setQuestoesModalData({ artigo, numeroArtigo });
          setQuestoesModalOpen(true);
        }}
        onPerguntar={(artigo, numeroArtigo) => {
          setPerguntaData({ artigo, numeroArtigo });
          setPerguntaModalOpen(true);
        }}
        onOpenAulaArtigo={(artigo, numeroArtigo) => {
          setAulaArtigoData({ artigo, numeroArtigo });
          setAulaArtigoModalOpen(true);
          setSelectedArticle(null);
        }}
        loadingFlashcards={loadingFlashcards}
        currentAudio={currentAudio}
        stickyPlayerOpen={stickyPlayerOpen}
        onPreviousArticle={handlePreviousArticle}
        onNextArticle={handleNextArticle}
        totalArticles={sectionArticles.length}
        skipInitialAnimation={true}
        highlightAlteracao={highlightAlteracao}
        sectionInfo={selectedSectionInfo}
      />

      {/* Content with slide animation */}
      <div ref={contentRef} className="animate-fade-in">
        
        {/* Playlist Tab */}
        {activeTab === 'playlist' && (
          <div className="px-4 max-w-4xl mx-auto pb-20">
            <VadeMecumPlaylist 
              articles={articlesWithAudio}
              codigoNome={codeName}
            />
          </div>
        )}

        {/* Ranking Tab */}
        {activeTab === 'ranking' && (
          <div className="px-4 max-w-4xl mx-auto pb-20">
            <VadeMecumRanking 
              tableName={tableName}
              codigoNome={codeName}
              onArticleClick={handleArticleClick}
            />
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'artigos' && (
          <div>
            {sectionArticles.length === 0 && isLoading ? (
              <div className="space-y-6 px-4 max-w-4xl mx-auto pb-20">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                    <Skeleton className="h-8 w-32 mb-3" />
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-24 w-full mb-6" />
                  </div>
                ))}
              </div>
            ) : sectionArticles.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                {searchQuery ? "Nenhum artigo encontrado para sua busca." : "Nenhum artigo disponível."}
              </div>
            ) : (
              <ArtigoListaCompacta
                articles={displayedArticles}
                onArtigoClick={(article, highlight) => {
                  setSelectedArticle(article);
                  setHighlightAlteracao(highlight || null);
                  setDrawerOpen(true);
                }}
                searchQuery={searchQuery}
                onScrollPastArticle7={handleScrollPastArticle7}
                scrollAreaRef={scrollAreaRef}
                targetArticleNumber={targetArticleNumber}
                onScrollComplete={() => setTargetArticleNumber(null)}
                artigosComNarracao={artigosComNarracao}
                tabelaLei={tableName}
                codigoNome={codeName}
                searchInput={searchInput}
                onSearchInputChange={setSearchInput}
                onSearchSubmit={() => {
                  setSearchQuery(searchInput);
                  setTargetArticleNumber(searchInput);
                }}
                onSearchClear={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setTargetArticleNumber(null);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Scroll to top button - only show after scrolling */}
      {showScrollTop && (
        <Button
          onClick={scrollToTopSmooth}
          size="icon"
          className="fixed bottom-28 right-4 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground z-30 shadow-lg animate-fade-in"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default Constituicao;
