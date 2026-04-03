import { Search, X, Sparkles, TrendingUp, Bot, ChevronDown, ChevronUp, Loader2, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useBuscaGlobal } from "@/hooks/useBuscaGlobal";
import { CategoriaCard } from "@/components/pesquisa/CategoriaCard";
import { BuscaGlobalSkeleton } from "@/components/pesquisa/BuscaGlobalSkeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const categoriasBusca = [
  { termo: "Todas", icon: "🔍", id: "todas" },
  { termo: "Vade Mecum", icon: "⚖️", id: "vade-mecum" },
  { termo: "Resumos", icon: "📝", id: "resumos" },
  { termo: "Flashcards", icon: "🧠", id: "flashcards" },
  { termo: "Questões", icon: "🎯", id: "questoes" },
  { termo: "Biblioteca", icon: "📚", id: "biblioteca" },
  { termo: "Videoaulas", icon: "🎬", id: "videoaulas" },
  { termo: "Áudio Aulas", icon: "🎧", id: "audio-aulas" },
  { termo: "Aulas", icon: "🎓", id: "aulas" },
  { termo: "Dicionário", icon: "📖", id: "dicionario" },
  { termo: "Mapas Mentais", icon: "🗺️", id: "mapas-mentais" },
  { termo: "JuriFlix", icon: "🎞️", id: "juriflix" },
  { termo: "Simulados", icon: "✅", id: "simulados" },
  { termo: "Súmulas", icon: "📜", id: "sumulas" },
  { termo: "Blog Jurídico", icon: "📰", id: "blog" },
  { termo: "Estatutos", icon: "📋", id: "estatutos" },
  { termo: "Leis Especiais", icon: "⚡", id: "leis-especiais" },
  { termo: "Primeiros Passos", icon: "👣", id: "primeiros-passos" },
];

const CATEGORIAS_PRINCIPAIS = 6;

const Pesquisar = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Only search when triggered manually
  const searchTerm = searchTriggered ? query : "";
  const { resultados, isSearching, totalResults, error } = useBuscaGlobal(searchTerm, searchTriggered && query.length >= 2);

  const handleSearch = useCallback(() => {
    if (query.trim().length < 2) return;
    setSearchTriggered(true);
  }, [query]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (searchTriggered) setSearchTriggered(false);
  };

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id);
    if (searchTriggered) setSearchTriggered(false);
  };

  const handleClear = () => {
    setQuery("");
    setSearchTriggered(false);
  };

  // Filter results by selected category
  const filteredResults = useMemo(() => {
    if (selectedCategory === "todas") return resultados;
    const catConfig = categoriasBusca.find(c => c.id === selectedCategory);
    if (!catConfig) return resultados;
    return resultados.filter(r => 
      r.nome.toLowerCase().includes(catConfig.termo.toLowerCase()) ||
      catConfig.termo.toLowerCase().includes(r.nome.toLowerCase())
    );
  }, [resultados, selectedCategory]);

  const showResults = searchTriggered && !isSearching && filteredResults.length > 0;
  const showEmpty = searchTriggered && !isSearching && query.length >= 2 && filteredResults.length === 0;
  const showInitial = !searchTriggered;

  const visibleCategories = showAllCategories 
    ? categoriasBusca 
    : categoriasBusca.slice(0, CATEGORIAS_PRINCIPAIS);

  const categoriasComResultados = useMemo(() => {
    return filteredResults.filter(r => r.count > 0).length;
  }, [filteredResults]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 lg:px-8 py-4 max-w-4xl lg:max-w-6xl mx-auto">
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
              <Search className="w-6 h-6 text-primary" />
              Pesquisar
            </h1>
            <p className="text-sm text-muted-foreground">
              Selecione uma categoria e busque o que precisa
            </p>
          </div>

          {/* Category Selection */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {visibleCategories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 border",
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card border-border hover:border-primary/40 text-foreground"
                    )}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate max-w-[90px]">{cat.termo}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Ver mais / Ver menos */}
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="mt-2 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              {showAllCategories ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Ver mais categorias ({categoriasBusca.length - CATEGORIAS_PRINCIPAIS})
                </>
              )}
            </button>
          </div>

          {/* Search Input + Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="O que você quer encontrar?" 
                className="pl-10 pr-10 h-12 text-base rounded-xl border-2 focus:border-primary transition-colors" 
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={query.trim().length < 2 || isSearching}
              className="h-12 px-5 rounded-xl font-semibold gap-2 text-base"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Pesquisar
            </Button>
          </div>

          {/* Results Summary */}
          {showResults && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                <Sparkles className="w-3.5 h-3.5" />
                {totalResults} resultados
              </Badge>
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
                <TrendingUp className="w-3.5 h-3.5" />
                {categoriasComResultados} categorias
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6 max-w-4xl lg:max-w-6xl mx-auto">
        {/* Initial State */}
        {showInitial && !isSearching && (
          <div className="space-y-6">
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <LayoutGrid className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">
                {selectedCategory === "todas" 
                  ? "Escolha uma categoria" 
                  : `Buscar em ${categoriasBusca.find(c => c.id === selectedCategory)?.termo}`}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {selectedCategory === "todas"
                  ? "Selecione acima para começar sua busca"
                  : "Digite o que procura e clique em Pesquisar"}
              </p>
            </div>

            {/* Busca Avançada com a Professora */}
            <button
              onClick={() => navigate('/chat-professora')}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all text-left flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-primary/20 flex-shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Busca Avançada com a Professora</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Não encontrou o que procura? A professora busca no material para você.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Loading State */}
        {isSearching && <BuscaGlobalSkeleton />}

        {/* Empty State */}
        {showEmpty && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tente buscar por outros termos ou selecione outra categoria
            </p>
          </div>
        )}

        {/* Results - Category Cards */}
        {showResults && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {filteredResults.map((categoria) => (
              <CategoriaCard 
                key={categoria.id} 
                categoria={categoria} 
                searchTerm={query}
              />
            ))}
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <X className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Erro na busca</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pesquisar;
