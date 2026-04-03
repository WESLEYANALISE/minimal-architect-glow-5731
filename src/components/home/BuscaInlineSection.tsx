import { useState, useCallback, useMemo, useEffect } from "react";
import { Search, X, ChevronRight, ChevronDown, BookOpen, Video, Brain, Target, Headphones, Scale, Newspaper, Map, FileText, Check, ArrowLeft, PlayCircle, GraduationCap, Layers, Film, Scroll, Gavel, Trophy } from "lucide-react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { useBuscaGlobal, CategoriaResultado, ResultadoItem } from "@/hooks/useBuscaGlobal";
import { motion, AnimatePresence } from "framer-motion";

const FILTROS = [
  { id: "todos", label: "Todos", icon: Search },
  { id: "artigos", label: "Vade Mecum", icon: Scale },
  { id: "videoaulas", label: "Videoaulas", icon: Video },
  { id: "flashcards", label: "Flashcards", icon: Brain },
  { id: "bibliotecas", label: "Bibliotecas", icon: BookOpen },
  { id: "questoes", label: "Questões", icon: Target },
  { id: "dicionario", label: "Dicionário", icon: FileText },
  { id: "blog", label: "Blog Jurídico", icon: Newspaper },
  { id: "audioaulas", label: "Audioaulas", icon: Headphones },
  { id: "mapas-mentais", label: "Mapas Mentais", icon: Map },
];

const ALL_CATEGORY_IDS = FILTROS.filter(f => f.id !== "todos").map(f => f.id);

// Map icon string from CategoriaResultado to Lucide component
const ICON_MAP: Record<string, React.ElementType> = {
  Scale, PlayCircle: Video, GraduationCap, Layers: Brain, BookOpen, Newspaper, BookA: FileText,
  Brain: Map, Film, Headphones, Target, Scroll, Gavel, FileText, Trophy: GraduationCap,
};

export const BuscaInlineSection = () => {
  const navigate = useTransitionNavigate();
  const [termo, setTermo] = useState("");
  const [filtrosAtivos, setFiltrosAtivos] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [erroCategoria, setErroCategoria] = useState(false);

  const shouldSearch = sheetOpen && termo.trim().length >= 3 && filtrosAtivos.size > 0;
  const { resultados, isSearching, totalResults } = useBuscaGlobal(termo, shouldSearch);

  // Dispatch event to hide/show bottom nav when sheet opens/closes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pesquisar-sheet-active', { detail: { active: sheetOpen } }));
  }, [sheetOpen]);

  const resultadosFiltrados = useMemo(() => {
    if (filtrosAtivos.size === 0 || filtrosAtivos.size === ALL_CATEGORY_IDS.length) return resultados;
    return resultados.filter((cat) => filtrosAtivos.has(cat.id));
  }, [resultados, filtrosAtivos]);

  const handleFiltroClick = (id: string) => {
    setErroCategoria(false);
    if (id === "todos") {
      // Toggle all
      if (filtrosAtivos.size === ALL_CATEGORY_IDS.length) {
        setFiltrosAtivos(new Set());
      } else {
        setFiltrosAtivos(new Set(ALL_CATEGORY_IDS));
      }
      return;
    }
    setFiltrosAtivos(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBuscar = () => {
    if (filtrosAtivos.size === 0) {
      setErroCategoria(true);
      return;
    }
    if (termo.trim().length < 3) return;
    setSheetOpen(true);
  };

  const allSelected = filtrosAtivos.size === ALL_CATEGORY_IDS.length;
  const filtroLabels = filtrosAtivos.size === 0
    ? "Nenhuma"
    : allSelected
      ? "Todos"
      : FILTROS.filter(f => filtrosAtivos.has(f.id)).map(f => f.label).join(", ");

  return (
    <>
      <div className="min-h-[340px]">
        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Busque em todo o app..."
            className="w-full bg-white/10 border border-white/15 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/15 transition-all"
            onKeyDown={(e) => { if (e.key === 'Enter') handleBuscar(); }}
          />
          {termo && (
            <button onClick={() => setTermo("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-white/50 text-xs mb-3 font-medium">Selecione as categorias que deseja</p>

        {erroCategoria && (
          <p className="text-red-400 text-xs mb-2 font-medium">⚠️ Selecione ao menos uma categoria antes de buscar</p>
        )}

        {/* Category Grid - Multi-select */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {FILTROS.map((f) => {
            const Icon = f.icon;
            const isSelected = f.id === "todos" ? allSelected : filtrosAtivos.has(f.id);
            return (
              <button
                key={f.id}
                onClick={() => handleFiltroClick(f.id)}
                className={`group rounded-xl p-3 text-left transition-all duration-150 flex items-center gap-2.5 border ${
                  isSelected
                    ? "bg-white/25 border-amber-400/50"
                    : "bg-white/10 border-white/10 hover:bg-white/20 hover:border-white/20"
                }`}
                style={{ boxShadow: '2px 3px 8px rgba(0, 0, 0, 0.3)' }}
              >
                <div className={`rounded-lg p-1.5 transition-colors ${isSelected ? 'bg-amber-500/30' : 'bg-white/20 group-hover:bg-white/30'}`}>
                  {isSelected ? <Check className="w-4 h-4 text-amber-200" /> : <Icon className="w-4 h-4 text-amber-100" />}
                </div>
                <span className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Buscar Button */}
        <button
          onClick={handleBuscar}
          disabled={termo.trim().length < 3}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            termo.trim().length >= 3
              ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>

        {termo.trim().length > 0 && termo.trim().length < 3 && (
          <p className="text-white/30 text-[10px] text-center mt-1.5">Digite pelo menos 3 caracteres</p>
        )}
      </div>

      {/* Full-screen results sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            className="fixed inset-0 z-[9999] bg-background flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
              <button onClick={() => setSheetOpen(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  placeholder={`Buscar em ${filtroLabels}...`}
                  className="w-full bg-muted border border-border rounded-xl pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  autoFocus
                />
                {termo && (
                  <button onClick={() => setTermo("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter chips */}
            <div className="px-4 py-2 border-b border-border bg-card flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-muted-foreground flex-shrink-0">Categorias:</span>
              <span className="text-xs font-semibold text-primary truncate">{filtroLabels}</span>
              <button
                onClick={() => setSheetOpen(false)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                Alterar
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {isSearching && (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-muted rounded-xl p-4 animate-pulse">
                      <div className="h-3 bg-muted-foreground/20 rounded w-1/4 mb-3" />
                      <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && resultadosFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm font-medium">Nenhum resultado encontrado</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Tente outro termo ou categoria</p>
                </div>
              )}

              {!isSearching && resultadosFiltrados.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">{totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}</p>
                  {resultadosFiltrados.map((cat) => (
                    <CategoriaSheet key={cat.id} categoria={cat} navigate={(path) => { setSheetOpen(false); navigate(path); }} />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Category-specific color themes
const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string; headerBg: string }> = {
  artigos: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", headerBg: "bg-violet-950/40" },
  bibliotecas: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", headerBg: "bg-emerald-950/40" },
  videoaulas: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", headerBg: "bg-rose-950/40" },
  flashcards: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", headerBg: "bg-cyan-950/40" },
  questoes: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", headerBg: "bg-amber-950/40" },
  dicionario: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", headerBg: "bg-blue-950/40" },
  blog: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", headerBg: "bg-orange-950/40" },
  audioaulas: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", headerBg: "bg-purple-950/40" },
  "mapas-mentais": { text: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20", headerBg: "bg-teal-950/40" },
};

const DEFAULT_COLORS = { text: "text-muted-foreground", bg: "bg-muted/50", border: "border-border", headerBg: "bg-muted/50" };

const CategoriaSheet = ({ categoria, navigate }: { categoria: CategoriaResultado; navigate: (path: string) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const hasMore = categoria.allResults.length > 3;
  const displayItems = expanded ? categoria.allResults : categoria.allResults.slice(0, 3);
  const remaining = categoria.allResults.length - 3;

  // Get icon component for the category
  const CatIcon = ICON_MAP[categoria.icon] || Search;
  const colors = CATEGORY_COLORS[categoria.id] || DEFAULT_COLORS;

  return (
    <div className={`rounded-xl overflow-hidden border shadow-sm ${colors.border} ${colors.bg}`}>
      <div className={`px-4 py-2.5 flex items-center justify-between border-b ${colors.border} ${colors.headerBg}`}>
        <div className="flex items-center gap-2">
          <CatIcon className={`w-4 h-4 ${colors.text}`} />
          <span className={`text-sm font-semibold ${colors.text}`}>{categoria.nome}</span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{categoria.count}</span>
      </div>
      <div className="divide-y divide-border/50">
        {displayItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.route)}
            className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors group"
          >
            {/* Thumbnail / Icon */}
            {item.imagem ? (
              <img
                src={item.imagem}
                alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-muted"
                loading="lazy"
              />
            ) : categoria.id === 'audioaulas' ? (
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-purple-400" />
              </div>
            ) : categoria.id === 'videoaulas' ? (
              <div className="w-10 h-10 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5 text-rose-400" />
              </div>
            ) : null}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.titulo}</p>
              {item.subtitulo && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitulo}</p>
              )}
              {item.extra && (
                <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{item.extra}</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors" />
          </button>
        ))}
      </div>

      {/* Ver mais / Ver menos */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full px-4 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium ${colors.text} hover:bg-white/5 transition-colors border-t ${colors.border}`}
        >
          {expanded ? (
            <>Ver menos<ChevronDown className="w-3.5 h-3.5 rotate-180" /></>
          ) : (
            <>Ver mais ({remaining} restante{remaining !== 1 ? 's' : ''})<ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
};

export default BuscaInlineSection;