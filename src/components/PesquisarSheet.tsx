import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Search, X, Sparkles, ChevronDown, Bot, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useBuscaGlobal } from "@/hooks/useBuscaGlobal";
import { CategoriaCard } from "@/components/pesquisa/CategoriaCard";
import { BuscaGlobalSkeleton } from "@/components/pesquisa/BuscaGlobalSkeleton";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const categoriasFiltro = [
  { id: "todas", termo: "Todas", icon: "🔍" },
  { id: "vade-mecum", termo: "Vade Mecum", icon: "⚖️" },
  { id: "resumos", termo: "Resumos", icon: "📝" },
  { id: "flashcards", termo: "Flashcards", icon: "🧠" },
  { id: "questoes", termo: "Questões", icon: "🎯" },
  { id: "biblioteca", termo: "Biblioteca", icon: "📚" },
  { id: "videoaulas", termo: "Videoaulas", icon: "🎬" },
  { id: "audio-aulas", termo: "Áudio Aulas", icon: "🎧" },
  { id: "aulas", termo: "Aulas", icon: "🎓" },
  { id: "dicionario", termo: "Dicionário", icon: "📖" },
  { id: "mapas-mentais", termo: "Mapas Mentais", icon: "🗺️" },
  { id: "juriflix", termo: "JuriFlix", icon: "🎞️" },
  { id: "simulados", termo: "Simulados", icon: "✅" },
  { id: "sumulas", termo: "Súmulas", icon: "📜" },
  { id: "blog", termo: "Blog Jurídico", icon: "📰" },
  { id: "estatutos", termo: "Estatutos", icon: "📋" },
  { id: "leis-especiais", termo: "Leis Especiais", icon: "⚡" },
  { id: "primeiros-passos", termo: "Primeiros Passos", icon: "👣" },
];

interface PesquisarSheetProps {
  open: boolean;
  onClose: () => void;
}

export const PesquisarSheet = ({ open, onClose }: PesquisarSheetProps) => {
  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("todas");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Always search with the query (no category prerequisite)
  const { resultados, isSearching, totalResults, error } = useBuscaGlobal(
    query.length >= 3 ? query : "",
    open && query.length >= 3
  );

  // Filter results by selected category
  const filteredResultados = useMemo(() => {
    if (selectedFilter === "todas") return resultados;
    const cat = categoriasFiltro.find(c => c.id === selectedFilter);
    if (!cat) return resultados;
    return resultados.filter(r =>
      r.nome.toLowerCase().includes(cat.termo.toLowerCase()) ||
      cat.termo.toLowerCase().includes(r.nome.toLowerCase())
    );
  }, [resultados, selectedFilter]);

  const hasSearched = query.length >= 3;
  const showResults = hasSearched && !isSearching && filteredResultados.length > 0;
  const showEmpty = hasSearched && !isSearching && filteredResultados.length === 0;

  const filteredTotalResults = useMemo(() => {
    return filteredResultados.reduce((acc, r) => acc + r.count, 0);
  }, [filteredResultados]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedFilter("todas");
    }
  }, [open]);

  // Autofocus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-3xl p-0 border-t border-border bg-background overflow-hidden"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <button onClick={onClose} className="w-12 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors" />
        </div>

        {/* Header fixo */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 pt-2 pb-3 max-w-4xl mx-auto space-y-3">
            {/* Título e fechar */}
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Pesquisar
              </h1>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Campo de busca - sempre visível */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="O que você quer estudar?"
                className="pl-10 pr-10 h-12 text-base rounded-xl border-2 border-border focus:border-primary transition-colors bg-secondary/40"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filtros horizontais - aparecem quando há busca */}
            {hasSearched && (
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                {categoriasFiltro.map((cat) => {
                  const isActive = selectedFilter === cat.id;
                  // Count for this category
                  const catCount = cat.id === "todas"
                    ? resultados.reduce((a, r) => a + r.count, 0)
                    : resultados.filter(r =>
                        r.nome.toLowerCase().includes(cat.termo.toLowerCase()) ||
                        cat.termo.toLowerCase().includes(r.nome.toLowerCase())
                      ).reduce((a, r) => a + r.count, 0);

                  if (cat.id !== "todas" && catCount === 0) return null;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedFilter(cat.id)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border whitespace-nowrap",
                        isActive
                          ? "bg-primary/20 border-primary/50 text-foreground ring-1 ring-primary/30"
                          : "bg-secondary/60 border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span>{cat.termo}</span>
                      {catCount > 0 && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                          isActive ? "bg-primary/30 text-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {catCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Badge de resultados */}
            {showResults && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
                  <Sparkles className="w-3 h-3" />
                  {filteredTotalResults} resultado{filteredTotalResults !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto h-[calc(92vh-180px)] px-4 py-4 max-w-4xl mx-auto">
          {/* Estado inicial - sem busca */}
          {!hasSearched && query.length === 0 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-base font-semibold mb-1">Busque qualquer conteúdo</h2>
                <p className="text-sm text-muted-foreground">
                  Digite acima para encontrar artigos, resumos, aulas e mais
                </p>
              </div>

              {/* Busca Avançada com a Professora */}
              <button
                onClick={() => { onClose(); navigate('/chat-professora'); }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all text-left flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-primary/20 flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Busca Avançada com a Professora</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Não encontrou o que procura? Use a IA para buscar conteúdo.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Digitando mas < 3 chars */}
          {query.length > 0 && query.length < 3 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
                <Search className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-base font-semibold mb-1">
                Digite mais {3 - query.length} caractere{3 - query.length > 1 ? 's' : ''}
              </h2>
            </div>
          )}

          {isSearching && <BuscaGlobalSkeleton />}

          {showEmpty && (
            <div className="text-center py-16 space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-3">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold mb-1">Nenhum resultado encontrado</h2>
              <p className="text-sm text-muted-foreground">
                Tente buscar por outros termos
              </p>
              {/* Sugestão da IA */}
              <button
                onClick={() => { onClose(); navigate('/chat-professora'); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Bot className="w-4 h-4" />
                Perguntar à Professora
              </button>
            </div>
          )}

          {showResults && (
            <div className="grid grid-cols-1 gap-4">
              {filteredResultados.map((categoria) => (
                <CategoriaCard
                  key={categoria.id}
                  categoria={categoria}
                  searchTerm={query}
                />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-3">
                <X className="w-7 h-7 text-destructive" />
              </div>
              <h2 className="text-base font-semibold mb-1">Erro na busca</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
