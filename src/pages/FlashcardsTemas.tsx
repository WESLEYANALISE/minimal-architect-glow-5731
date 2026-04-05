import { useNavigate, useSearchParams } from "react-router-dom";
import { Brain, BookOpen, FileText, Loader2, Zap, Heart, ListOrdered, Search, ArrowUp, ChevronRight, Crown, BarChart3, Target, TrendingUp } from "lucide-react";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FlashcardsEstudar from "@/pages/FlashcardsEstudar";
import { useFlashcardsAutoGeneration } from "@/hooks/useFlashcardsAutoGeneration";
import { DotPattern } from "@/components/ui/dot-pattern";
import { useIndexedDBCache } from "@/hooks/useIndexedDBCache";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { useDeviceType } from "@/hooks/use-device-type";
import FlashcardsEstatisticas from "@/components/flashcards/FlashcardsEstatisticas";
import { useFlashcardStats } from "@/hooks/useFlashcardStudyProgress";

// ── Realeza palette ──
const R = {
  bg: "hsl(0, 0%, 7%)",
  gold: "hsl(40, 80%, 55%)",
  goldMuted: "hsl(40, 70%, 60%)",
  border: "hsla(40, 60%, 50%, 0.12)",
  iconBg: "hsla(40, 60%, 50%, 0.12)",
  iconBorder: "hsla(40, 60%, 50%, 0.15)",
  headerGradient: "linear-gradient(135deg, hsl(0, 0%, 11%), hsl(0, 0%, 8%))",
};

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
      <div key={i} className="h-[68px] rounded-xl animate-pulse" style={{ background: "hsla(0, 0%, 100%, 0.04)" }} />
    ))}
  </div>
);

const FlashcardsTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const { isDesktop: isDesktopDevice } = useDeviceType();
  const [activeTab, setActiveTab] = useState<"ordem" | "favoritos" | "pesquisar">("ordem");
  const [favoritos, setFavoritos] = useState<string[]>(() => getFavoritos(area));
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [estudarTema, setEstudarTema] = useState<string | null>(null);
  const cacheHashRef = useRef('');

  // Register back interceptor when studying inline
  useEffect(() => {
    if (estudarTema) {
      (window as any).__backInterceptor = () => setEstudarTema(null);
      return () => { delete (window as any).__backInterceptor; };
    }
  }, [estudarTema]);
  const isGeneratingRef = useRef(false);

  const { isPremium } = useSubscription();
  const { data: studyStats } = useFlashcardStats();

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
    refetchInterval: () => isGeneratingRef.current ? 15000 : false
  });

  useEffect(() => {
    if (cachedData && cachedData.length > 0 && !cacheHashRef.current) {
      cacheHashRef.current = hashTemas(cachedData);
    }
  }, [cachedData]);

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
  isGeneratingRef.current = isGenerating;

  const totalFlashcards = temas?.reduce((acc, t) => acc + t.totalFlashcards, 0) || 0;
  const totalTemas = temas?.length || 0;
  const lockedFromIndex = isPremium ? undefined : 2;

  const navegarParaTema = (tema: string) => {
    setEstudarTema(tema);
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

  // If studying a tema inline, render FlashcardsEstudar directly
  if (estudarTema) {
    return (
      <FlashcardsEstudar
        inlineArea={area}
        inlineTema={estudarTema}
        onExit={() => setEstudarTema(null)}
        onComplete={() => setEstudarTema(null)}
      />
    );
  }

  // Shared tema list renderer
  const renderTemaList = (maxWidth?: string) => (
    <>
      {/* Auto generation indicator */}
      {isGenerating && (
        <div className="px-4 py-2 animate-slide-down">
          <div className={maxWidth ? `max-w-none` : "max-w-lg mx-auto"}>
            <div className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "hsla(40, 60%, 50%, 0.08)", border: `1px solid hsla(40, 60%, 50%, 0.2)` }}
            >
              <div className="relative">
                <Zap className="w-5 h-5" style={{ color: R.gold }} />
                <div className="absolute inset-0 animate-ping">
                  <Zap className="w-5 h-5 opacity-50" style={{ color: R.gold }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: R.gold }}>
                  Gerando flashcards automaticamente...
                </p>
                <p className="text-xs truncate" style={{ color: R.goldMuted }}>
                  {currentTema ? `Tema: ${currentTema}` : 'Iniciando...'} • {geradosCount} gerados
                </p>
              </div>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: R.gold }} />
            </div>
          </div>
        </div>
      )}

      {/* Info Stats */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-6 text-sm" style={{ color: "hsla(40, 60%, 70%, 0.7)" }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: R.gold }} />
            <span>{totalTemas} temas</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: R.gold }} />
            <span>{(totalFlashcards ?? 0).toLocaleString('pt-BR')} flashcards</span>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 pb-2">
        <div className={`${maxWidth ? '' : 'max-w-lg mx-auto'} flex rounded-xl overflow-hidden backdrop-blur-sm`} style={{ background: "hsla(0, 0%, 100%, 0.04)", border: `1px solid ${R.border}` }}>
          {([
            { key: "ordem" as const, icon: ListOrdered, label: "Ordem" },
            { key: "favoritos" as const, icon: Heart, label: `Favoritos${favoritos.length > 0 ? ` (${favoritos.length})` : ''}` },
            { key: "pesquisar" as const, icon: Search, label: "Pesquisar" },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? "hsla(40, 60%, 50%, 0.15)" : "transparent",
                color: activeTab === tab.key ? R.gold : "hsla(0, 0%, 100%, 0.4)",
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search input */}
      {activeTab === "pesquisar" && (
        <div className="px-4 pb-3 animate-fade-in">
          <div className={maxWidth ? '' : "max-w-lg mx-auto"}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsla(40, 60%, 50%, 0.4)" }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar tema..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-white text-sm focus:outline-none backdrop-blur-sm"
                style={{
                  background: "hsla(0, 0%, 100%, 0.06)",
                  border: `1px solid ${R.border}`,
                  color: "white",
                }}
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Vertical List */}
      {temasFiltered && temasFiltered.length > 0 ? (
        <div className="px-4 pb-6">
          <div className={`${maxWidth ? '' : 'max-w-lg mx-auto'} space-y-2`}>
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
                    background: isLocked ? 'hsla(0, 0%, 100%, 0.02)' : 'hsla(0, 0%, 100%, 0.04)',
                    border: `1px solid ${isLocked ? 'hsla(0, 0%, 100%, 0.05)' : R.border}`,
                  }}
                >
                  {!isLocked && (
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: "linear-gradient(105deg, transparent 40%, hsla(40, 80%, 70%, 0.04) 45%, hsla(40, 80%, 70%, 0.08) 50%, hsla(40, 80%, 70%, 0.04) 55%, transparent 60%)" }}
                    />
                  )}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: isLocked ? 'hsla(0, 0%, 100%, 0.04)' : 'hsla(40, 60%, 50%, 0.1)',
                      color: isLocked ? 'hsla(0, 0%, 100%, 0.3)' : R.gold,
                      border: `1.5px solid ${isLocked ? 'hsla(0, 0%, 100%, 0.06)' : 'hsla(40, 60%, 50%, 0.25)'}`,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-normal leading-snug line-clamp-2 ${isLocked ? 'text-white/40' : 'text-white'}`}>
                      {tema.tema}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px]" style={{ color: isLocked ? 'hsla(0, 0%, 100%, 0.2)' : R.goldMuted }}>
                        {(tema.totalFlashcards ?? 0).toLocaleString('pt-BR')} flashcards
                      </p>
                      {!tema.temFlashcards && tema.parcial && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "hsla(40, 80%, 50%, 0.15)", color: R.gold }}>parcial</span>
                      )}
                      {!tema.temFlashcards && !tema.parcial && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "hsla(0, 0%, 100%, 0.06)", color: "hsla(0, 0%, 100%, 0.3)" }}>pendente</span>
                      )}
                    </div>
                  </div>
                  {isLocked ? (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${R.gold}, hsl(35, 70%, 35%))`,
                        border: `1.5px solid ${R.gold}`,
                        boxShadow: `0 0 8px hsla(40, 80%, 55%, 0.5)`,
                      }}
                    >
                      <Crown className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorito(tema.tema); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: isFavorited ? '#dc2626' : 'hsla(0, 0%, 100%, 0.06)',
                          border: isFavorited ? '1.5px solid #fca5a5' : `1.5px solid ${R.border}`,
                        }}
                      >
                        <Heart className="w-3.5 h-3.5" style={{ color: isFavorited ? 'white' : 'hsla(0, 0%, 100%, 0.4)', fill: isFavorited ? 'white' : 'none' }} />
                      </button>
                      <ChevronRight className="w-4 h-4 transition-colors group-hover:translate-x-0.5" style={{ color: "hsla(40, 70%, 60%, 0.4)" }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16" style={{ color: "hsla(40, 60%, 70%, 0.4)" }}>
          {activeTab === "favoritos"
            ? "Nenhum tema favoritado ainda. Toque no ♥ para favoritar."
            : activeTab === "pesquisar" && searchTerm.trim()
              ? "Nenhum tema encontrado para essa busca."
              : "Nenhum tema encontrado"}
        </div>
      )}
    </>
  );

  // Desktop: three-column layout
  if (isDesktopDevice) {
    const completedCount = studyStats?.compreendi || 0;
    const reviewCount = studyStats?.revisar || 0;
    const streakCount = studyStats?.streak || 0;
    const completedTemas = temasFiltered?.filter(t => t.temFlashcards).length || 0;
    const pendingTemas = temasFiltered?.filter(t => !t.temFlashcards).length || 0;

    return (
      <div className="min-h-screen relative" style={{ background: R.bg }}>
        {/* Compact Header */}
        <div className="relative overflow-hidden z-10" style={{ background: R.headerGradient, borderBottom: `1px solid ${R.border}` }}>
          <DotPattern className="opacity-[0.04]" />
          <div className="absolute -right-6 -bottom-6 opacity-[0.05]">
            <Brain className="w-32 h-32" style={{ color: R.gold }} />
          </div>
          <div className="relative z-10 pt-4 pb-4 px-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}>
              <Brain className="w-6 h-6" style={{ color: R.gold }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                {area}
              </h1>
              <p className="text-sm" style={{ color: "hsla(40, 60%, 70%, 0.6)" }}>
                Escolha um tema para estudar
              </p>
            </div>
          </div>
        </div>

        {/* Three-column grid */}
        <div className="px-6 py-5 grid grid-cols-[260px_1fr_260px] gap-6">
          {/* LEFT: Area Info & Quick Stats */}
          <div className="space-y-4 sticky top-20 self-start">
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "hsla(0, 0%, 100%, 0.03)", border: `1px solid ${R.border}` }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>Resumo da Área</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "hsla(0, 0%, 100%, 0.5)" }}>Total de Temas</span>
                  <span className="text-sm font-bold" style={{ color: R.gold }}>{totalTemas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "hsla(0, 0%, 100%, 0.5)" }}>Total Flashcards</span>
                  <span className="text-sm font-bold" style={{ color: R.gold }}>{(totalFlashcards ?? 0).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "hsla(0, 0%, 100%, 0.5)" }}>Completos</span>
                  <span className="text-sm font-bold text-emerald-400">{completedTemas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "hsla(0, 0%, 100%, 0.5)" }}>Pendentes</span>
                  <span className="text-sm font-bold text-amber-400">{pendingTemas}</span>
                </div>
              </div>
            </div>

            {/* Favoritos rápidos */}
            {favoritos.length > 0 && (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: "hsla(0, 0%, 100%, 0.03)", border: `1px solid ${R.border}` }}>
                <p className="text-[10px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>
                  <Heart className="w-3 h-3" /> Favoritos ({favoritos.length})
                </p>
                <div className="space-y-1">
                  {favoritos.slice(0, 5).map(fav => (
                    <button
                      key={fav}
                      onClick={() => navegarParaTema(fav)}
                      className="w-full text-left text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors truncate"
                      style={{ color: R.goldMuted }}
                    >
                      {fav}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CENTER: Main Content */}
          <div className="min-w-0 relative z-10">
            {isLoading ? <ListSkeleton /> : renderTemaList("full")}
          </div>

          {/* RIGHT: Study Stats */}
          <div className="space-y-4 sticky top-20 self-start">
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "hsla(0, 0%, 100%, 0.03)", border: `1px solid ${R.border}` }}>
              <p className="text-[10px] uppercase tracking-wider flex items-center gap-1.5" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>
                <BarChart3 className="w-3 h-3" /> Seu Progresso
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-3 text-center" style={{ background: "hsla(40, 60%, 50%, 0.08)", border: `1px solid ${R.border}` }}>
                  <p className="text-lg font-bold" style={{ color: R.gold }}>{completedCount}</p>
                  <p className="text-[10px]" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>Compreendi</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "hsla(0, 0%, 100%, 0.04)", border: `1px solid ${R.border}` }}>
                  <p className="text-lg font-bold text-amber-400">{reviewCount}</p>
                  <p className="text-[10px]" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>Revisar</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: "hsla(0, 0%, 100%, 0.04)", border: `1px solid ${R.border}` }}>
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-bold text-orange-400">{streakCount}</span>
                <span className="text-[10px]" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>dias seguidos</span>
              </div>
            </div>

            {/* Dica rápida */}
            <div className="rounded-2xl p-4" style={{ background: "hsla(40, 60%, 50%, 0.06)", border: `1px solid ${R.border}` }}>
              <p className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>
                <Target className="w-3 h-3" /> Dica de Estudo
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "hsla(40, 60%, 70%, 0.7)" }}>
                Revise os flashcards marcados como "revisar" a cada 2-3 dias para maximizar a retenção com repetição espaçada.
              </p>
            </div>
          </div>
        </div>

        <PremiumFloatingCard
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          title="Mais temas de Flashcards"
          sourceFeature="Flashcards Temas"
        />
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="min-h-screen relative" style={{ background: R.bg }}>
      {/* Realeza Header */}
      <div className="relative overflow-hidden z-10" style={{ background: R.headerGradient, borderBottom: `1px solid ${R.border}` }}>
        <DotPattern className="opacity-[0.04]" />
        <div className="absolute -right-6 -bottom-6 opacity-[0.05]">
          <Brain className="w-32 h-32" style={{ color: R.gold }} />
        </div>
        <div className="relative z-10 pt-6 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm" style={{ background: R.iconBg, border: `1px solid ${R.iconBorder}` }}>
                <Brain className="w-7 h-7" style={{ color: R.gold }} />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {area}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "hsla(40, 60%, 70%, 0.6)" }}>
                  Escolha um tema para estudar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {isLoading ? <ListSkeleton /> : renderTemaList()}
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 left-4 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md transition-all hover:scale-110 active:scale-95 animate-fade-in"
          style={{ background: `${R.gold}cc`, border: `1px solid ${R.border}` }}
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
