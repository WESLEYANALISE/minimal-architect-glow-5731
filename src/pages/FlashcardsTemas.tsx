import { useNavigate, useSearchParams } from "react-router-dom";
import { Brain, BookOpen, FileText, Loader2, Zap, Heart, ListOrdered, Search, ArrowUp, ChevronRight, Crown } from "lucide-react";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FlashcardsEstudar from "@/pages/FlashcardsEstudar";
import { useFlashcardsAutoGeneration } from "@/hooks/useFlashcardsAutoGeneration";
import { getAreaGradient, getAreaHex } from "@/lib/flashcardsAreaColors";
// Vertical list replaces serpentine trail
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import { useIndexedDBCache } from "@/hooks/useIndexedDBCache";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

// Favoritos helpers (localStorage)
const getFavoritosKey = (area: string) => `flashcards-favoritos-${area}`;
const getFavoritos = (area: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(getFavoritosKey(area)) || "[]");
  } catch { return []; }
};
const toggleFavorito = (area: string, tema: string) => {
  const favs = getFavoritos(area);
  const updated = favs.includes(tema) ? favs.filter(f => f !== tema) : [...favs, tema];
  localStorage.setItem(getFavoritosKey(area), JSON.stringify(updated));
  return updated;
};

// Hash simples para detectar mudanças
const hashTemas = (data: any[]): string => {
  if (!data || data.length === 0) return '';
  return `${data.length}-${data[0]?.tema || ''}-${data[data.length - 1]?.tema || ''}-${data.reduce((s, t) => s + t.totalFlashcards, 0)}`;
};

const normalizar = (str: string) => 
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

// Skeleton for first visit
const ListSkeleton = () => (
  <div className="px-4 py-3 space-y-2 max-w-lg mx-auto animate-fade-in">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-[68px] rounded-xl bg-white/5 animate-pulse" />
    ))}
  </div>
);

const FlashcardsTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const [activeTab, setActiveTab] = useState<"ordem" | "favoritos" | "pesquisar">("ordem");
  const [favoritos, setFavoritos] = useState<string[]>(() => getFavoritos(area));
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [estudarTema, setEstudarTema] = useState<string | null>(null);
  const cacheHashRef = useRef('');

  const hex = getAreaHex(area);
  const gradient = getAreaGradient(area);
  const { isPremium } = useSubscription();

  // Cache IndexedDB
  const cacheKey = `flashcards-temas-${area}`;
  const { cachedData, isLoadingCache, saveToCache } = useIndexedDBCache<any>(cacheKey);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { data: temas, isLoading: isQueryLoading } = useQuery({
    queryKey: ["flashcards-temas-progressivo", area],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_flashcard_temas_stats', { p_area: area });
      if (error) throw error;

      const result = (data || []).map((row: any) => {
        const totalSubtemas = Number(row.total_subtemas) || 0;
        const subtemasGerados = Number(row.subtemas_gerados) || 0;
        const totalFlashcards = Number(row.total_flashcards) || 0;
        const temTodosSubtemas = totalSubtemas > 0 && (subtemasGerados >= totalSubtemas || (totalSubtemas > 1 && subtemasGerados / totalSubtemas >= 0.9));
        const temAlgunsSubtemas = subtemasGerados > 0 && !temTodosSubtemas;
        const progressoPercent = totalSubtemas > 0 ? Math.round((subtemasGerados / totalSubtemas) * 100) : 0;

        return {
          tema: row.tema,
          temFlashcards: temTodosSubtemas,
          parcial: temAlgunsSubtemas,
          subtemasGerados,
          totalSubtemas,
          totalFlashcards,
          progressoPercent,
          ordem: Number(row.ordem) || 0
        };
      });

      // Salvar no cache apenas se dados mudaram
      const newHash = hashTemas(result);
      if (newHash !== cacheHashRef.current) {
        cacheHashRef.current = newHash;
        saveToCache(result);
      }

      return result;
    },
    enabled: !!area,
    placeholderData: cachedData && cachedData.length > 0 ? cachedData : undefined,
    staleTime: 0,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchInterval: () => {
      // Só poll se geração está ativa, intervalo maior para evitar loops
      if (!isGenerating) return false;
      return 15000;
    }
  });

  // Atualizar hash quando cache carrega
  useEffect(() => {
    if (cachedData && cachedData.length > 0 && !cacheHashRef.current) {
      cacheHashRef.current = hashTemas(cachedData);
    }
  }, [cachedData]);

  // isLoading só é true se não tem cache E query está carregando
  const isLoading = isQueryLoading && !temas && (!cachedData || cachedData.length === 0);

  const queryClient = useQueryClient();
  
  const handleAutoGenProgress = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["flashcards-temas-progressivo", area] });
  }, [queryClient, area]);

  const { isGenerating, currentTema, geradosCount } = useFlashcardsAutoGeneration({
    area,
    temas,
    enabled: !!area && !isLoading && (temas?.some(t => !t.temFlashcards) || false),
    onProgress: handleAutoGenProgress
  });

  const totalFlashcards = temas?.reduce((acc, t) => acc + t.totalFlashcards, 0) || 0;
  const totalTemas = temas?.length || 0;
  const lockedFromIndex = isPremium ? undefined : 2;

  const navegarParaTema = (tema: string) => {
    navigate(`/flashcards/estudar?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}`);
  };

  const handleToggleFavorito = useCallback((tema: string) => {
    const updated = toggleFavorito(area, tema);
    setFavoritos(updated);
  }, [area]);

  const temasFiltered = useMemo(() => {
    if (!temas) return [];
    if (activeTab === "favoritos") {
      return temas.filter(t => favoritos.includes(t.tema));
    }
    if (activeTab === "pesquisar" && searchTerm.trim()) {
      const term = normalizar(searchTerm);
      return temas.filter(t => normalizar(t.tema).includes(term));
    }
    if (activeTab === "pesquisar" && !searchTerm.trim()) {
      return temas;
    }
    return temas;
  }, [temas, activeTab, favoritos, searchTerm]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <InstantBackground
        src={bgAreasOab}
        alt="Áreas"
        blurCategory="oab"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />

      {/* Header with area gradient */}
      <div className={`bg-gradient-to-br ${gradient} relative overflow-hidden z-10`}>
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Brain className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 pt-6 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {area}
                </h1>
                <p className="text-sm text-white/70 mt-0.5">
                  Escolha um tema para estudar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {isLoading ? (
          <ListSkeleton />
        ) : (
          <>
            {/* Auto generation indicator */}
            {isGenerating && (
              <div className="px-4 py-2 animate-slide-down">
                <div className="max-w-lg mx-auto">
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                    style={{ backgroundColor: `${hex}15`, borderColor: `${hex}30` }}
                  >
                    <div className="relative">
                      <Zap className="w-5 h-5" style={{ color: hex }} />
                      <div className="absolute inset-0 animate-ping">
                        <Zap className="w-5 h-5 opacity-50" style={{ color: hex }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: hex }}>
                        Gerando flashcards automaticamente...
                      </p>
                      <p className="text-xs truncate" style={{ color: `${hex}99` }}>
                        {currentTema ? `Tema: ${currentTema}` : 'Iniciando...'} • {geradosCount} gerados
                      </p>
                    </div>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: hex }} />
                  </div>
                </div>
              </div>
            )}

            {/* Info Stats */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: hex }} />
                  <span>{totalTemas} temas</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: hex }} />
                  <span>{(totalFlashcards ?? 0).toLocaleString('pt-BR')} flashcards</span>
                </div>
              </div>
            </div>

            {/* Tab switcher: Ordem / Favoritos / Pesquisar */}
            <div className="px-4 pb-2">
              <div className="max-w-lg mx-auto flex rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab("ordem")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                    activeTab === "ordem"
                      ? "text-white shadow-md"
                      : "text-white/50 hover:text-white/70"
                  }`}
                  style={activeTab === "ordem" ? { backgroundColor: `${hex}40` } : {}}
                >
                  <ListOrdered className="w-4 h-4" />
                  Ordem
                </button>
                <button
                  onClick={() => setActiveTab("favoritos")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                    activeTab === "favoritos"
                      ? "text-white shadow-md"
                      : "text-white/50 hover:text-white/70"
                  }`}
                  style={activeTab === "favoritos" ? { backgroundColor: `${hex}40` } : {}}
                >
                  <Heart className="w-4 h-4" />
                  Favoritos {favoritos.length > 0 && `(${favoritos.length})`}
                </button>
                <button
                  onClick={() => setActiveTab("pesquisar")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                    activeTab === "pesquisar"
                      ? "text-white shadow-md"
                      : "text-white/50 hover:text-white/70"
                  }`}
                  style={activeTab === "pesquisar" ? { backgroundColor: `${hex}40` } : {}}
                >
                  <Search className="w-4 h-4" />
                  Pesquisar
                </button>
              </div>
            </div>

            {/* Search input (only when pesquisar tab active) */}
            {activeTab === "pesquisar" && (
              <div className="px-4 pb-3 animate-fade-in">
                <div className="max-w-lg mx-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar tema..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-sm"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Vertical List */}
            {temasFiltered && temasFiltered.length > 0 ? (
              <div className="px-4 pb-6">
                <div className="max-w-lg mx-auto space-y-2">
                  {temasFiltered.map((tema, idx) => {
                    const isLocked = !isPremium && lockedFromIndex !== undefined && idx >= lockedFromIndex;
                    const isFavorited = favoritos.includes(tema.tema);

                    return (
                      <button
                        key={tema.tema}
                        onClick={() => isLocked ? setShowPremiumModal(true) : navegarParaTema(tema.tema)}
                        className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.98] animate-fade-in group relative overflow-hidden"
                        style={{
                          animationDelay: `${idx * 30}ms`,
                          animationFillMode: 'backwards',
                          background: isLocked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${isLocked ? 'rgba(255,255,255,0.06)' : `${hex}25`}`,
                        }}
                      >
                        {/* Number badge */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: isLocked ? 'rgba(255,255,255,0.06)' : `${hex}20`,
                            color: isLocked ? 'rgba(255,255,255,0.3)' : hex,
                            border: `1.5px solid ${isLocked ? 'rgba(255,255,255,0.08)' : `${hex}35`}`,
                          }}
                        >
                          {idx + 1}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-normal leading-snug line-clamp-2 ${isLocked ? 'text-white/40' : 'text-white'}`}>
                            {tema.tema}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px]" style={{ color: isLocked ? 'rgba(255,255,255,0.2)' : hex }}>
                              {(tema.totalFlashcards ?? 0).toLocaleString('pt-BR')} flashcards
                            </p>
                            {!tema.temFlashcards && tema.parcial && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">parcial</span>
                            )}
                            {!tema.temFlashcards && !tema.parcial && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/30">pendente</span>
                            )}
                          </div>
                        </div>

                        {/* Right side: favorite or lock */}
                        {isLocked ? (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: "linear-gradient(135deg, #f59e0b, #b45309)",
                              border: "1.5px solid #fbbf24",
                              boxShadow: "0 0 8px rgba(245,158,11,0.5)",
                            }}
                          >
                            <Crown className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorito(tema.tema);
                              }}
                              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                              style={{
                                backgroundColor: isFavorited ? '#dc2626' : 'rgba(255,255,255,0.08)',
                                border: isFavorited ? '1.5px solid #fca5a5' : '1.5px solid rgba(255,255,255,0.15)',
                              }}
                            >
                              <Heart
                                className="w-3.5 h-3.5"
                                style={{
                                  color: isFavorited ? 'white' : 'rgba(255,255,255,0.5)',
                                  fill: isFavorited ? 'white' : 'none',
                                }}
                              />
                            </button>
                            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                {activeTab === "favoritos"
                  ? "Nenhum tema favoritado ainda. Toque no ♥ para favoritar."
                  : activeTab === "pesquisar" && searchTerm.trim()
                    ? "Nenhum tema encontrado para essa busca."
                    : "Nenhum tema encontrado"}
              </div>
            )}
          </>
        )}
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 left-4 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 animate-fade-in"
          style={{ backgroundColor: `${hex}cc` }}
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </button>
      )}
      <PremiumFloatingCard
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Mais temas de Flashcards"
        sourceFeature="Flashcards Temas"
      />
    </div>
  );
};

export default FlashcardsTemas;
