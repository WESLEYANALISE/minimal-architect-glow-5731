import { useMemo, useRef, useEffect, useState } from 'react';
import { Search, X, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatNumeroArtigo } from '@/lib/formatNumeroArtigo';
import { extractArticleNumber } from '@/lib/utils/premiumNarration';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PremiumFloatingCard } from '@/components/PremiumFloatingCard';

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração"?: string | null;
}

interface VadeMecumArticlePanelProps {
  articles: Article[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedArticle: Article | null;
  onSelectArticle: (article: Article) => void;
  codeName: string;
  totalCount: number;
  targetArticle?: string | null;
}

export const VadeMecumArticlePanel = ({
  articles,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedArticle,
  onSelectArticle,
  codeName,
  totalCount,
  targetArticle
}: VadeMecumArticlePanelProps) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const articleRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { isPremium } = useSubscription();
  const [showPremiumCard, setShowPremiumCard] = useState(false);

  // Auto-scroll para artigo alvo
  useEffect(() => {
    if (targetArticle && articles.length > 0) {
      const targetArt = articles.find(a => 
        a["Número do Artigo"]?.toLowerCase().includes(targetArticle.toLowerCase())
      );
      if (targetArt) {
        const ref = articleRefs.current.get(targetArt.id);
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
          onSelectArticle(targetArt);
        }
      }
    }
  }, [targetArticle, articles, onSelectArticle]);

  // Atalho de teclado para busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'f' && (e.ctrlKey || e.metaKey)) || e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  return (
    <div className="h-full flex flex-col">
      {/* Header com busca */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar artigo... (Ctrl+F ou /)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 h-11 text-sm bg-zinc-800 border-zinc-700"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Contador de resultados */}
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {searchQuery 
              ? `${articles.length} resultado${articles.length !== 1 ? 's' : ''}`
              : `${articles.length} de ${totalCount} artigos`
            }
          </span>
          {selectedArticle && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Selecionado: Art. {selectedArticle["Número do Artigo"]}
            </span>
          )}
        </div>
      </div>

      {/* Lista de artigos */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50">
                <Skeleton className="h-5 w-20 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-base">Nenhum artigo encontrado</p>
              <p className="text-sm mt-1">Tente buscar por outro termo</p>
            </div>
          ) : (
            articles.map((article) => {
              const isSelected = selectedArticle?.id === article.id;
              const hasAudio = !!article["Narração"];
              const artNum = extractArticleNumber(article["Número do Artigo"] || "");
              const isLocked = !isPremium && artNum !== null && artNum > 10;
              
              return (
                <div
                  key={article.id}
                  ref={(el) => {
                    if (el) articleRefs.current.set(article.id, el);
                  }}
                  onClick={() => {
                    if (isLocked) {
                      setShowPremiumCard(true);
                    } else {
                      onSelectArticle(article);
                    }
                  }}
                  className={cn(
                    "flex items-stretch rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden",
                    "hover:border-zinc-600 hover:shadow-sm",
                    isLocked && "opacity-60",
                    isSelected 
                      ? "bg-primary/10 border-primary/50 shadow-md ring-1 ring-primary/20" 
                      : "bg-zinc-800/60 border-zinc-700/50 hover:bg-zinc-700/50"
                  )}
                >
                  {/* Coluna esquerda: número do artigo */}
                  <div className={cn(
                    "w-[68px] flex-shrink-0 flex flex-col items-center justify-center border-r py-3 px-2",
                    isSelected
                      ? "bg-primary/20 border-primary/30"
                      : "bg-zinc-700/30 border-zinc-700/60"
                  )}>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-1">
                      Art.
                    </span>
                    <span className={cn(
                      "text-base font-bold leading-tight text-center break-all",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {formatNumeroArtigo(article["Número do Artigo"] || '')}
                    </span>
                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground mt-1.5" />
                    ) : hasAudio ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 animate-pulse" title="Possui áudio" />
                    ) : null}
                  </div>

                  {/* Coluna direita: preview do conteúdo */}
                  <div className="flex-1 p-3 min-w-0 flex items-center">
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {(article["Artigo"] || 'Conteúdo não disponível').replace(/\n+/g, ' ')}
                    </p>
                    {isLocked && (
                      <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        feature="vademecum-completo"
      />
    </div>
  );
};

export default VadeMecumArticlePanel;
