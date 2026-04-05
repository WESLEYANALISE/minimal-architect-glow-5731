import { useState, useEffect, useRef, useMemo, useTransition, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, MessageSquare, GraduationCap, Lightbulb, BookOpen, Bookmark, Plus, Minus, ArrowUp, BookMarked, FileQuestion, X, Share2, Loader2, Scale, CheckCircle, Volume2 } from "lucide-react";
import { BuscaCompacta } from "@/components/BuscaCompacta";
import { ArtigoListaCompacta } from "@/components/ArtigoListaCompacta";
import { ArtigoFullscreenDrawer } from "@/components/ArtigoFullscreenDrawer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllRows, fetchInitialRows } from "@/lib/fetchAllRows";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { sortArticles } from "@/lib/articleSorter";
import InlineAudioButton from "@/components/InlineAudioButton";
import AudioCommentButton from "@/components/AudioCommentButton";
import StickyAudioPlayer from "@/components/StickyAudioPlayer";
import ExplicacaoModal from "@/components/ExplicacaoModal";
import VideoAulaModal from "@/components/VideoAulaModal";
import TermosModal from "@/components/TermosModal";
import QuestoesModal from "@/components/QuestoesModal";
import PerguntaModal from "@/components/PerguntaModal";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { formatTextWithUppercase } from "@/lib/textFormatter";
import { CopyButton } from "@/components/CopyButton";
import { VadeMecumTabsInline } from "@/components/VadeMecumTabsInline";
import { VadeMecumPlaylist } from "@/components/VadeMecumPlaylist";
import { VadeMecumRanking } from "@/components/VadeMecumRanking";
import { useArticleTracking } from "@/hooks/useArticleTracking";
import { ArtigoActionsMenu } from "@/components/ArtigoActionsMenu";
import { formatForWhatsApp } from "@/lib/formatWhatsApp";
import { useProgressiveArticles } from "@/hooks/useProgressiveArticles";
import { getCodigoFromTable, LAW_METADATA, LawMetadata } from "@/lib/codigoMappings";
import { AulaArtigoSlidesViewer } from "@/components/AulaArtigoSlidesViewer";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { LeiHeader } from "@/components/LeiHeader";
import { URLS_PLANALTO } from "@/lib/urlsPlanalto";
import { ModoVisualizacaoArtigos } from "@/components/ModoVisualizacaoArtigos";
import { useDeviceType } from "@/hooks/use-device-type";
import { VadeMecumDesktopLayout } from "@/components/vade-mecum/VadeMecumDesktopLayout";
import { useAuth } from "@/contexts/AuthContext";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { DotPattern } from "@/components/ui/dot-pattern";


interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
  // Campos de explicação diretamente na tabela do código
  explicacao_resumido?: string | null;
  explicacao_tecnico?: string | null;
  exemplo?: string | null;
  termos?: any | null;
}
const CodigoView = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    id
  } = useParams();
  const [searchParams] = useSearchParams();
  const contentRef = useRef<HTMLDivElement>(null);
  const firstResultRef = useRef<HTMLDivElement>(null);
  
  // Detectar tipo de dispositivo
  const { isDesktop } = useDeviceType();
  
  const [fontSize, setFontSize] = useState(15);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [targetArticleNumber, setTargetArticleNumber] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [displayLimit, setDisplayLimit] = useState(1000);
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
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false);
  const [flashcardsData, setFlashcardsData] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [termosModalOpen, setTermosModalOpen] = useState(false);
  const [termosData, setTermosData] = useState({ artigo: "", numeroArtigo: "" });
  const [questoesModalOpen, setQuestoesModalOpen] = useState(false);
  const [questoesData, setQuestoesData] = useState({ artigo: "", numeroArtigo: "" });
  const [perguntaModalOpen, setPerguntaModalOpen] = useState(false);
  const [perguntaData, setPerguntaData] = useState({ artigo: "", numeroArtigo: "" });
  
  // Aula Artigo state
  const [aulaArtigoModalOpen, setAulaArtigoModalOpen] = useState(false);
  const [aulaArtigoData, setAulaArtigoData] = useState({ artigo: "", numeroArtigo: "" });
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'artigos' | 'playlist' | 'ranking'>('artigos');
  
  // Modo de visualização: numérico ou capítulos
  const [modoVisualizacao, setModoVisualizacao] = useState<'numerico' | 'capitulos'>('numerico');
  const [capituloSelecionado, setCapituloSelecionado] = useState<string>('');
  
  // View mode state - now always "lista" style with drawer
  const [viewMode, setViewMode] = useState<'lista' | 'expandido'>('lista');
  const [artigoExpandido, setArtigoExpandido] = useState<number | null>(null);
  
  // Show scroll to top button after scrolling past article 7
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Estado para controlar artigos com narração (sem geração automática)
  const [artigosComNarracao, setArtigosComNarracao] = useState<Set<number>>(new Set());
  
  // Ref for ScrollArea to enable smooth scroll to top
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Callback when user scrolls past article 7
  const handleScrollPastArticle7 = useCallback((isPast: boolean) => {
    setShowScrollTop(isPast);
  }, []);
  
  // Scroll to top function that targets ScrollArea viewport
  const scrollToTopSmooth = useCallback(() => {
    // Try Radix ScrollArea viewport first (desktop layout)
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Fallback to window scroll (mobile layout)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);
  
  // Drawer state for fullscreen article view
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [highlightAlteracao, setHighlightAlteracao] = useState<{ elementoTipo: string; elementoNumero: string | null; tipoAlteracao?: string; leiAlteradora?: string | null; anoAlteracao?: number | null; textoCompleto?: string | null; textoAnterior?: string | null; urlLeiAlteradora?: string | null } | null>(null);

  // Resolver metadata a partir do slug (suporta códigos, estatutos, súmulas e tabela direta)
  const resolvedMeta = useMemo((): { tableName: string; codeName: string; lawNumber: string; isSumula: boolean; itemLabel: string; meta: LawMetadata | null } => {
    const slug = id || '';
    const decodedSlug = decodeURIComponent(slug);
    
    // 1. Buscar no LAW_METADATA pelo slug direto
    const meta = LAW_METADATA[slug] || LAW_METADATA[decodedSlug];
    if (meta) {
      return {
        tableName: meta.tableName,
        codeName: meta.displayName,
        lawNumber: meta.lawNumber || '',
        isSumula: meta.tipo === 'sumula',
        itemLabel: meta.itemLabel || 'Artigo',
        meta,
      };
    }
    
    // 2. Fallback: Verificar se é um nome de tabela direto (URLs legadas com nome de tabela na URL)
    for (const [, m] of Object.entries(LAW_METADATA)) {
      if (m.tableName === decodedSlug) {
        return {
          tableName: m.tableName,
          codeName: m.displayName,
          lawNumber: m.lawNumber || '',
          isSumula: m.tipo === 'sumula',
          itemLabel: m.itemLabel || 'Artigo',
          meta: m,
        };
      }
    }
    
    // 3. Fallback final
    return {
      tableName: 'CP - Código Penal',
      codeName: 'Código Penal',
      lawNumber: 'Decreto-Lei nº 2.848/1940',
      isSumula: false,
      itemLabel: 'Artigo',
      meta: null,
    };
  }, [id]);

  const { tableName, codeName, lawNumber, isSumula, itemLabel } = resolvedMeta;
  const meta = resolvedMeta.meta;

  // URL do Planalto para o link "Ver no Planalto"
  const urlPlanalto = URLS_PLANALTO[tableName] || "";

  // Use progressive loading: primeiros 50 instantâneos, resto em background
  const { 
    articles, 
    isLoadingInitial: isLoading, 
    isLoadingMore: isLoadingFull,
    isComplete,
    totalLoaded 
  } = useProgressiveArticles<Article>({
    tableName,
    initialChunk: 100,       // Primeiros 100 artigos instantâneos
    backgroundChunk: 500,   // Carregar 500 por vez em background
    delayBetweenChunks: 100 // 100ms entre cada chunk
  });
  
  // Função placeholder para updateArticle (se necessário no futuro)
  const updateArticle = useCallback((id: number, updates: Partial<Article>) => {
    // Progressive articles não suporta update inline por ora
    console.log('updateArticle called', id, updates);
  }, []);
  // Usar todos os artigos (não filtrar mais)
  const filteredArticles = useMemo(() => articles, [articles]);
  
  const displayedArticles = useMemo(() => {
    return filteredArticles.slice(0, displayLimit);
  }, [filteredArticles, displayLimit]);

  // Handler para iniciar busca animada
  const handleAnimatedSearch = useCallback(() => {
    if (!searchInput.trim()) return;
    setTargetArticleNumber(searchInput.trim());
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  // Limpar busca
  const handleClearSearch = useCallback(() => {
    setSearchInput("");
    setSearchQuery("");
    setTargetArticleNumber(null);
    setArtigoExpandido(null);
  }, []);

  // Navegação entre artigos no drawer
  const currentArticleIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return articles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, articles]);

  // Compute section info (TÍTULO/CAPÍTULO) for the selected article
  const selectedSectionInfo = useMemo(() => {
    if (!selectedArticle || currentArticleIndex < 0) return null;
    const sectionPattern = /^(T[ÍI]TULO|CAP[ÍI]TULO|SE[CÇ][AÃ]O|LIVRO|PARTE)\s+/i;
    for (let i = currentArticleIndex - 1; i >= 0; i--) {
      const art = articles[i];
      const numArt = art["Número do Artigo"] || '';
      
      // Case 1: Section header stored in "Número do Artigo" (e.g. CE extraction)
      if (numArt && sectionPattern.test(numArt.trim())) {
        const artText = (art["Artigo"] || '').trim();
        const subtitulo = artText && !sectionPattern.test(artText) && !/^Art\./i.test(artText) ? artText : undefined;
        return { titulo: numArt.trim(), subtitulo };
      }
      
      // Case 2: Section header in article body with no "Número do Artigo"
      if (!numArt && art["Artigo"]) {
        const lines = art["Artigo"].split('\n').map(l => l.trim()).filter(Boolean);
        for (let j = 0; j < Math.min(lines.length, 4); j++) {
          if (sectionPattern.test(lines[j])) {
            const subtitulo = lines[j + 1] && !/^Art\./i.test(lines[j + 1]) ? lines[j + 1] : undefined;
            return { titulo: lines[j], subtitulo };
          }
        }
      }
    }
    return null;
  }, [selectedArticle, currentArticleIndex, articles]);

  // Navegação circular - vai para o último se estiver no primeiro, e vice-versa
  const handlePreviousArticle = useCallback(() => {
    if (articles.length === 0) return;
    if (currentArticleIndex <= 0) {
      // Se está no primeiro, vai para o último
      setSelectedArticle(articles[articles.length - 1]);
    } else {
      setSelectedArticle(articles[currentArticleIndex - 1]);
    }
  }, [currentArticleIndex, articles]);

  const handleNextArticle = useCallback(() => {
    if (articles.length === 0) return;
    if (currentArticleIndex >= articles.length - 1) {
      // Se está no último, vai para o primeiro
      setSelectedArticle(articles[0]);
    } else {
      setSelectedArticle(articles[currentArticleIndex + 1]);
    }
  }, [currentArticleIndex, articles]);

  // Filter articles with audio for playlist
  const articlesWithAudio = useMemo(() => {
    return articles.filter(article => 
      article["Narração"] && 
      article["Narração"].trim() !== "" &&
      article["Número do Artigo"] &&
      article["Número do Artigo"].trim() !== ""
    ) as any[];
  }, [articles]);

  // Contar artigos únicos por número (incluindo variações como 1-A, 1-B)
  const uniqueArticleCount = useMemo(() => {
    const uniqueNumbers = new Set<string>();
    articles.forEach(article => {
      const numero = article["Número do Artigo"];
      if (numero && numero.trim() !== "") {
        uniqueNumbers.add(numero.trim());
      }
    });
    return uniqueNumbers.size;
  }, [articles]);

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

  // Auto-search based on URL parameter
  useEffect(() => {
    const artigoParam = searchParams.get('artigo');
    if (artigoParam) {
      setSearchInput(artigoParam);
      setTargetArticleNumber(artigoParam);
      setSearchQuery(artigoParam);
    }
  }, [searchParams]);

  // Infinite scroll handler (listens to both container and window)
  useEffect(() => {
    if (searchQuery) return;
    const element = contentRef.current;

    const handleScroll = () => {
      if (displayLimit >= filteredArticles.length) return;
      
      // Check container scroll
      if (element) {
        const { scrollTop, scrollHeight, clientHeight } = element;
        if (scrollTop + clientHeight >= scrollHeight - 500) {
          setDisplayLimit(prev => Math.min(prev + 200, filteredArticles.length));
          return;
        }
      }
      
      // Fallback: check window scroll
      const windowScrollBottom = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (windowScrollBottom >= documentHeight - 500) {
        setDisplayLimit(prev => Math.min(prev + 200, filteredArticles.length));
      }
    };

    element?.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      element?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [displayLimit, filteredArticles.length, searchQuery]);
  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };
  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };
  // Formata conteúdo do artigo usando formatador da Constituição
  const formatArticleContent = (content: string) => {
    return formatTextWithUppercase(content || "Conteúdo não disponível");
  };

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
      // Usar mapeamento universal centralizado
      const codigo = getCodigoFromTable(tableName);

      console.log('🔍 [Debug FlashcardsModal]', {
        codigoEnviado: codigo,
        tabelaMapeada: tableName,
        numeroArtigo: numeroArtigo
      });

      const response = await supabase.functions.invoke('gerar-flashcards', {
        body: { 
          content: `Art. ${numeroArtigo}\n${artigo}`,
          codigo: codigo,
          numeroArtigo: numeroArtigo,
          tipo: 'artigo'
        }
      });
      
      if (response.error) throw response.error;
      
      setFlashcardsData(response.data.flashcards || []);
      setFlashcardsModalOpen(true);
      
      // Edge function já salva no cache, mas mantemos backup local
      if (response.data.flashcards && Array.isArray(response.data.flashcards) && !response.data.cached) {
        try {
          const { error: updateError } = await supabase
            .from(tableName as any)
            .update({ 
              flashcards: response.data.flashcards,
              ultima_atualizacao: new Date().toISOString()
            })
            .eq('Número do Artigo', numeroArtigo);
          
          if (updateError) {
            console.error('Erro ao salvar flashcards:', updateError);
          }
        } catch (saveError) {
          console.error('Erro ao salvar flashcards:', saveError);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar flashcards:', error);
    } finally {
      setLoadingFlashcards(false);
    }
  };
  const scrollToTop = () => {
    contentRef.current?.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleArticleClick = (numeroArtigo: string) => {
    setActiveTab('artigos');
    setSearchQuery(numeroArtigo);
  };

  // Registrar visualização de forma não-bloqueante
  const registrarVisualizacao = useCallback((numeroArtigo: string) => {
    const doRegister = async () => {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        await supabase
          .from('artigos_visualizacoes')
          .insert({
            tabela_codigo: tableName,
            numero_artigo: numeroArtigo,
            user_id: u?.id || null,
            origem: 'busca'
          });
      } catch (error) {
        console.error('Erro ao registrar visualização:', error);
      }
    };
    // Defer para não bloquear abertura do drawer
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(doRegister);
    } else {
      setTimeout(doRegister, 0);
    }
  }, [tableName]);

  // Registrar visualização quando buscar um artigo específico
  useEffect(() => {
    if (searchQuery && filteredArticles.length > 0) {
      const primeiroArtigo = filteredArticles[0];
      if (primeiroArtigo["Número do Artigo"]) {
        registrarVisualizacao(primeiroArtigo["Número do Artigo"]);
      }
    }
  }, [searchQuery]);

  // Disparar geração automática de aulas em background ao acessar o código
  useEffect(() => {
    const gerarAulasBackground = async () => {
      try {
        // Disparar em background - não bloqueia a UI
        supabase.functions.invoke('processar-aulas-background', {
          body: { codigoTabela: tableName }
        }).then(response => {
          if (response.data?.status === 'generated') {
            console.log(`[Background] Aula gerada para artigo ${response.data.artigo}`);
          }
        }).catch(error => {
          console.error('[Background] Erro ao processar aulas:', error);
        });
      } catch (error) {
        console.error('[Background] Erro:', error);
      }
    };

    // Executar após um pequeno delay para não competir com carregamento inicial
    const timeout = setTimeout(gerarAulasBackground, 3000);
    return () => clearTimeout(timeout);
  }, [tableName]);

  // Renderizar modais compartilhados
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
        codigo={id}
        codigoTabela={tableName}
      />

      <VideoAulaModal 
        isOpen={videoModalOpen} 
        onClose={() => setVideoModalOpen(false)} 
        videoUrl={videoModalData.videoUrl} 
        artigo={videoModalData.artigo} 
        numeroArtigo={videoModalData.numeroArtigo} 
      />

      <TermosModal 
        isOpen={termosModalOpen} 
        onClose={() => setTermosModalOpen(false)} 
        artigo={termosData.artigo} 
        numeroArtigo={termosData.numeroArtigo}
        codigoTabela={tableName}
        codigo={getCodigoFromTable(tableName)}
      />

      <QuestoesModal 
        isOpen={questoesModalOpen} 
        onClose={() => setQuestoesModalOpen(false)} 
        artigo={questoesData.artigo} 
        numeroArtigo={questoesData.numeroArtigo}
        codigoTabela={tableName}
        codigo={getCodigoFromTable(tableName)}
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

      {flashcardsModalOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-[hsl(var(--accent))]">Flashcards</h2>
              <button onClick={() => setFlashcardsModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FlashcardViewer flashcards={flashcardsData} />
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Auth gate for guests
  if (!authLoading && !user) {
    navigate('/', { replace: true });
    return null;
  }

  // LAYOUT DESKTOP - 3 colunas
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {renderModals()}
        
        <VadeMecumDesktopLayout
          tableName={tableName}
          codeName={codeName}
          lawNumber={lawNumber}
          articles={articles}
          isLoading={isLoading}
          selectedArticle={selectedArticle}
          onSelectArticle={(article) => setSelectedArticle(article as Article)}
          onCloseDetail={() => setSelectedArticle(null)}
          onPlayAudio={handlePlayComment}
          onOpenExplicacao={handleOpenExplicacao}
          onOpenAula={handleOpenAula}
          onOpenTermos={(artigo, numeroArtigo) => {
            setTermosData({ artigo, numeroArtigo });
            setTermosModalOpen(true);
          }}
          onOpenQuestoes={(artigo, numeroArtigo) => {
            setQuestoesData({ artigo, numeroArtigo });
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
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleAnimatedSearch}
          onSearchClear={handleClearSearch}
          header={
            <LeiHeader 
              titulo={codeName.toUpperCase()} 
              subtitulo={lawNumber}
              urlPlanalto={urlPlanalto}
            />
          }
        />
      </div>
    );
  }

  // LAYOUT MOBILE/TABLET - Modo Realeza
  return (
    <div className="min-h-screen text-foreground pb-24 relative" style={{ background: 'linear-gradient(to bottom, hsl(345, 55%, 16%), hsl(350, 35%, 8%))' }}>
      {/* DotPattern de fundo */}
      <DotPattern className="opacity-[0.04]" />
      
      {renderModals()}

      {/* Header com Brasão */}
      <LeiHeader 
        titulo={codeName.toUpperCase()}
        subtitulo={lawNumber}
        urlPlanalto={urlPlanalto}
      />

      {/* Search Bar */}
      <BuscaCompacta
        value={searchInput}
        onChange={setSearchInput}
        onSearch={handleAnimatedSearch}
        onClear={handleClearSearch}
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          if (mode === 'lista') setArtigoExpandido(null);
        }}
        resultCount={articles.length}
      />

      {/* Artigo Fullscreen Drawer */}
      <ArtigoFullscreenDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedArticle(null);
          setHighlightAlteracao(null);
        }}
        article={selectedArticle}
        codeName={codeName}
        onPlayComment={handlePlayComment}
        onOpenAula={handleOpenAula}
        onOpenExplicacao={handleOpenExplicacao}
        onGenerateFlashcards={handleGenerateFlashcards}
        onOpenTermos={(artigo, numeroArtigo) => {
          setTermosData({ artigo, numeroArtigo });
          setTermosModalOpen(true);
        }}
        onOpenQuestoes={(artigo, numeroArtigo) => {
          setQuestoesData({ artigo, numeroArtigo });
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
        totalArticles={articles.length}
        skipInitialAnimation={true}
        highlightAlteracao={highlightAlteracao}
        sectionInfo={selectedSectionInfo}
      />
      {/* Content */}
      <div ref={contentRef} className="animate-fade-in">
        {articles.length === 0 && isLoading ? (
          <div className="space-y-6 px-4 max-w-4xl mx-auto pb-20">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border">
                <Skeleton className="h-8 w-32 mb-3" />
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-24 w-full mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(j => <Skeleton key={j} className="h-10 w-full" />)}
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {searchQuery ? "Nenhum artigo encontrado para sua busca." : "Nenhum artigo disponível."}
          </div>
        ) : (
          <ArtigoListaCompacta
            articles={articles}
            onArtigoClick={(article, highlight) => {
              setSelectedArticle(article);
              setHighlightAlteracao(highlight || null);
              setDrawerOpen(true);
              if (article["Número do Artigo"]) {
                registrarVisualizacao(article["Número do Artigo"]);
              }
            }}
            searchQuery={searchQuery}
            onScrollPastArticle7={handleScrollPastArticle7}
            scrollAreaRef={scrollAreaRef}
            targetArticleNumber={targetArticleNumber}
            onScrollComplete={() => setTargetArticleNumber(null)}
            artigosComNarracao={artigosComNarracao}
            tabelaLei={tableName}
            codigoNome={codeName}
          />
        )}
      </div>

      {/* Floating Scroll to Top Button */}
      {articles.length > 0 && showScrollTop && (
        <button 
          onClick={scrollToTopSmooth} 
          className="fixed bottom-20 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30 text-white"
          style={{ background: 'hsl(40, 80%, 45%)' }}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default CodigoView;