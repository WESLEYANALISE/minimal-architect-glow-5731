import { useState, useCallback, useMemo, useEffect } from 'react';
import { ReactNode } from 'react';
import { VadeMecumNavigationSidebar } from './VadeMecumNavigationSidebar';
import { ArtigoListaCompacta } from '@/components/ArtigoListaCompacta';
import { ArtigoFullscreenDrawer } from '@/components/ArtigoFullscreenDrawer';
import { useArticleNavigationShortcuts } from '@/hooks/useDesktopKeyboardShortcuts';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DotPattern } from '@/components/ui/dot-pattern';


interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

interface VadeMecumDesktopLayoutProps {
  tableName: string;
  codeName: string;
  lawNumber?: string;
  articles: Article[];
  isLoading: boolean;
  selectedArticle: Article | null;
  onSelectArticle: (article: Article) => void;
  onCloseDetail: () => void;
  onPlayAudio?: (url: string, title: string) => void;
  onOpenExplicacao?: (artigo: string, numeroArtigo: string, tipo: "explicacao" | "exemplo", nivel?: "tecnico" | "simples") => void;
  onOpenAula?: (article: Article) => void;
  onOpenTermos?: (artigo: string, numeroArtigo: string) => void;
  onOpenQuestoes?: (artigo: string, numeroArtigo: string) => void;
  onPerguntar?: (artigo: string, numeroArtigo: string) => void;
  onOpenAulaArtigo?: (artigo: string, numeroArtigo: string) => void;
  onGenerateFlashcards?: (artigo: string, numeroArtigo: string) => void;
  loadingFlashcards?: boolean;
  targetArticle?: string | null;
  header?: ReactNode;
  backLabel?: string;
  backRoute?: string;
  // Search props
  searchInput?: string;
  onSearchInputChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  onSearchClear?: () => void;
}

export const VadeMecumDesktopLayout = ({
  tableName,
  codeName,
  lawNumber,
  articles,
  isLoading,
  selectedArticle,
  onSelectArticle,
  onCloseDetail,
  onPlayAudio,
  onOpenExplicacao,
  onOpenAula,
  onOpenTermos,
  onOpenQuestoes,
  onPerguntar,
  onOpenAulaArtigo,
  onGenerateFlashcards,
  loadingFlashcards,
  targetArticle,
  header,
  backLabel,
  backRoute,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
}: VadeMecumDesktopLayoutProps) => {
  
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSelectArticle = useCallback((article: Article) => {
    onSelectArticle(article);
    setSheetOpen(true);
  }, [onSelectArticle]);

  const handleCloseDetail = useCallback(() => {
    setSheetOpen(false);
    onCloseDetail();
  }, [onCloseDetail]);

  // Padrões para detectar estruturas hierárquicas (mesma lógica do ArtigoListaCompacta)
  const padroes = useMemo(() => [
    { regex: /^PARTE\s+(GERAL|ESPECIAL|[IVXLCDM]+|\d+)/i, tipo: 'parte' },
    { regex: /^LIVRO\s+[IVXLCDM]+/i, tipo: 'livro' },
    { regex: /^T[ÍI]TULO\s+[IVXLCDM]+/i, tipo: 'titulo' },
    { regex: /^CAP[ÍI]TULO\s+[IVXLCDM]+/i, tipo: 'capitulo' },
    { regex: /^SE[CÇ][AÃ]O\s+[IVXLCDM]+/i, tipo: 'secao' },
    { regex: /^SUBSE[CÇ][AÃ]O\s+[IVXLCDM]+/i, tipo: 'subsecao' },
  ], []);

  // Extrair estrutura hierárquica dos artigos (alinhado com detectarCapitulos do mobile)
  const structure = useMemo(() => {
    const sections: { name: string; articles: Article[]; startId: number }[] = [];
    let currentSection: { name: string; articles: Article[]; startId: number } | null = null;
    
    const ehCabecalho = (article: Article): string | null => {
      const numArtigo = (article["Número do Artigo"] || "").trim();
      const conteudo = article["Artigo"] || "";
      
      // Check if "Número do Artigo" contains a header pattern (e.g. "CAPÍTULO I", "TÍTULO II")
      for (const padrao of padroes) {
        if (numArtigo && padrao.regex.test(numArtigo)) {
          const linhas = conteudo.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const subtituloLinhas = linhas.filter(l => {
            for (const p of padroes) {
              if (p.regex.test(l)) return false;
            }
            return l.length > 0 && !l.startsWith('Art.');
          });
          const subtitulo = subtituloLinhas.length > 0 ? subtituloLinhas[0] : '';
          return subtitulo ? `${numArtigo} › ${subtitulo}` : numArtigo;
        }
      }
      
      // Fallback: records without article number
      const temNumero = numArtigo !== "" && !/^(T[ÍI]TULO|CAP[ÍI]TULO|SE[CÇ]|SUBSE|LIVRO|PARTE|DISPOSI)/i.test(numArtigo);
      if (temNumero) return null;
      
      const linhas = conteudo.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      for (const linha of linhas) {
        for (const padrao of padroes) {
          if (padrao.regex.test(linha)) {
            const tituloLinhas = linhas.filter(l => 
              !l.startsWith('Art.') && 
              !l.startsWith('LEI ') &&
              !l.startsWith('O PRESIDENTE') &&
              !l.startsWith('Código Penal')
            );
            return tituloLinhas.slice(0, 3).join(' › ').replace(/\s+/g, ' ');
          }
        }
      }
      
      return null;
    };
    
    const artigosOrdenados = [...articles].sort((a, b) => a.id - b.id);
    
    artigosOrdenados.forEach(article => {
      const temNumero = article["Número do Artigo"] && article["Número do Artigo"].trim() !== "";
      const cabecalho = ehCabecalho(article);
      
      if (cabecalho) {
        if (currentSection && currentSection.articles.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { name: cabecalho, articles: [], startId: article.id };
      } else if (temNumero) {
        if (!currentSection) {
          currentSection = { name: 'Disposições Iniciais', articles: [], startId: 0 };
        }
        currentSection.articles.push(article);
      }
    });
    
    // Push last section
    if (currentSection && (currentSection as any).articles.length > 0) {
      sections.push(currentSection);
    }

    return sections.map(s => ({ name: s.name, articles: s.articles, count: s.articles.length }));
  }, [articles, padroes]);

  // Filter by chapter if selected
  const filteredArticles = useMemo(() => {
    if (!selectedChapter) return articles;
    const chapter = structure.find(s => s.name === selectedChapter);
    return chapter ? chapter.articles : articles;
  }, [articles, selectedChapter, structure]);

  const currentIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return filteredArticles.findIndex(a => a.id === selectedArticle.id);
  }, [selectedArticle, filteredArticles]);

  const handlePrevious = useCallback(() => {
    if (filteredArticles.length === 0) return;
    const newIndex = currentIndex <= 0 ? filteredArticles.length - 1 : currentIndex - 1;
    onSelectArticle(filteredArticles[newIndex]);
  }, [currentIndex, filteredArticles, onSelectArticle]);

  const handleNext = useCallback(() => {
    if (filteredArticles.length === 0) return;
    const newIndex = currentIndex >= filteredArticles.length - 1 ? 0 : currentIndex + 1;
    onSelectArticle(filteredArticles[newIndex]);
  }, [currentIndex, filteredArticles, onSelectArticle]);

  useArticleNavigationShortcuts({
    onPrevious: handlePrevious,
    onNext: handleNext,
    onClose: onCloseDetail,
    enabled: !!selectedArticle
  });

  // Atalho "/" para focar na busca
  useEffect(() => {
    const handleSlashKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') return;
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Buscar"], input[placeholder*="buscar"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };
    window.addEventListener('keydown', handleSlashKey);
    return () => window.removeEventListener('keydown', handleSlashKey);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative" style={{ background: 'linear-gradient(to bottom, hsl(345, 55%, 16%), hsl(350, 35%, 8%))' }}>
      {/* DotPattern de fundo */}
      <DotPattern className="opacity-[0.04]" />

      {/* Toggle sidebar button */}
      <div className="flex items-center px-5 py-2 border-b flex-shrink-0 sticky top-0 z-30"
           style={{ borderColor: 'hsla(40, 60%, 50%, 0.12)', background: 'hsla(345, 55%, 16%, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-foreground hover:bg-white/10"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Header da lei (brasão, nome, etc.) */}
      {header}

      {/* Main content: sidebar + articles */}
      <div className="flex flex-1 relative z-10">
        {/* Sidebar de capítulos */}
        <div className={cn(
          "flex-shrink-0 transition-all duration-300 overflow-hidden",
          sidebarOpen ? "w-[280px]" : "w-0"
        )}
        style={{ borderRight: sidebarOpen ? '1px solid hsla(40, 60%, 50%, 0.12)' : 'none' }}>
          {sidebarOpen && (
            <div className="h-[calc(100vh-120px)] sticky top-[53px]" style={{ background: 'hsla(345, 55%, 14%, 0.6)' }}>
              <VadeMecumNavigationSidebar
                codeName={codeName}
                structure={structure}
                selectedChapter={selectedChapter}
                onSelectChapter={setSelectedChapter}
                totalArticles={articles.length}
              />
            </div>
          )}
        </div>

        {/* Painel central com ArtigoListaCompacta */}
        <div className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto">
            {articles.length === 0 && isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex gap-3 p-3 rounded-lg" style={{ background: 'hsla(345, 40%, 20%, 0.4)' }}>
                    <div className="w-16 h-5 rounded bg-white/10 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full rounded bg-white/10" />
                      <div className="h-3 w-3/4 rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ArtigoListaCompacta
                articles={filteredArticles}
                onArtigoClick={(article, highlight) => {
                  handleSelectArticle(article);
                }}
                tabelaLei={tableName}
                codigoNome={codeName}
                targetArticleNumber={targetArticle}
                searchInput={searchInput}
                onSearchInputChange={onSearchInputChange}
                onSearchSubmit={onSearchSubmit}
                onSearchClear={onSearchClear}
              />
            )}
          </div>
        </div>
      </div>

      {/* ArtigoFullscreenDrawer - mesmo do mobile */}
      <ArtigoFullscreenDrawer
        isOpen={sheetOpen}
        onClose={handleCloseDetail}
        article={selectedArticle}
        codeName={codeName}
        onPlayComment={onPlayAudio}
        onOpenAula={onOpenAula}
        onOpenExplicacao={onOpenExplicacao}
        onGenerateFlashcards={onGenerateFlashcards}
        onOpenTermos={onOpenTermos}
        onOpenQuestoes={onOpenQuestoes}
        onPerguntar={onPerguntar}
        onOpenAulaArtigo={onOpenAulaArtigo}
        loadingFlashcards={loadingFlashcards}
        onPreviousArticle={handlePrevious}
        onNextArticle={handleNext}
        totalArticles={filteredArticles.length}
        skipInitialAnimation={true}
      />
    </div>
  );
};

export default VadeMecumDesktopLayout;
