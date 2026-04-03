import { useNavigate, useSearchParams } from "react-router-dom";
import { FilePenLine, BookOpen, FileText, ListOrdered, Search, ArrowUp, ArrowLeft, Heart, Settings, GripVertical, ToggleLeft, ToggleRight, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAreaGradient, getAreaHex } from "@/lib/flashcardsAreaColors";
import { QuestoesTrilhaTemas } from "@/components/questoes/QuestoesTrilhaTemas";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { PremiumBadge } from "@/components/PremiumBadge";
import { Crown } from "lucide-react";

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const FAVORITES_KEY = "resumos-temas-favoritos";
const CUSTOM_ORDER_KEY = "resumos-temas-ordem-custom";
const CUSTOM_MODE_KEY = "resumos-temas-modo-custom";

const getFavorites = (area: string): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, string[]>;
    return all[area] || [];
  } catch { return []; }
};

const toggleFavorite = (area: string, tema: string): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, string[]> : {};
    const current = all[area] || [];
    if (current.includes(tema)) {
      all[area] = current.filter(t => t !== tema);
    } else {
      all[area] = [...current, tema];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(all));
    return all[area];
  } catch { return []; }
};

const getCustomOrder = (area: string): string[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_ORDER_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, string[]>;
    return all[area] || [];
  } catch { return []; }
};

const saveCustomOrder = (area: string, order: string[]) => {
  try {
    const raw = localStorage.getItem(CUSTOM_ORDER_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, string[]> : {};
    all[area] = order;
    localStorage.setItem(CUSTOM_ORDER_KEY, JSON.stringify(all));
  } catch {}
};

const getCustomMode = (area: string): boolean => {
  try {
    const raw = localStorage.getItem(CUSTOM_MODE_KEY);
    if (!raw) return false;
    const all = JSON.parse(raw) as Record<string, boolean>;
    return all[area] || false;
  } catch { return false; }
};

const saveCustomMode = (area: string, enabled: boolean) => {
  try {
    const raw = localStorage.getItem(CUSTOM_MODE_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, boolean> : {};
    all[area] = enabled;
    localStorage.setItem(CUSTOM_MODE_KEY, JSON.stringify(all));
  } catch {}
};

// Skeleton for first visit
const TrilhaSkeleton = ({ hex }: { hex: string }) => (
  <div className="flex flex-col items-center gap-6 py-8 px-4 animate-fade-in">
    {Array.from({ length: 7 }).map((_, i) => {
      const isLeft = Math.floor(i / 1) % 2 === 0;
      return (
        <div
          key={i}
          className="flex items-center gap-4"
          style={{ alignSelf: isLeft ? 'flex-start' : 'flex-end', marginLeft: isLeft ? '15%' : '0', marginRight: isLeft ? '0' : '15%' }}
        >
          <div
            className="w-[90px] h-[90px] rounded-full animate-pulse"
            style={{ backgroundColor: `${hex}25`, border: `2px solid ${hex}20` }}
          />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full animate-pulse" style={{ backgroundColor: `${hex}15` }} />
            <div className="h-2 w-16 rounded-full animate-pulse" style={{ backgroundColor: `${hex}10` }} />
          </div>
        </div>
      );
    })}
  </div>
);

const ResumosJuridicosTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const [activeTab, setActiveTab] = useState<"ordem" | "favoritos" | "pesquisar" | "personalizar">("ordem");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPersonalizacao, setShowPersonalizacao] = useState(false);
  const [customModeEnabled, setCustomModeEnabled] = useState(false);
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const hex = getAreaHex(area);
  const gradient = getAreaGradient(area);
  const { isPremium } = useSubscription();

  // Load favorites and custom settings
  useEffect(() => {
    if (area) {
      setFavorites(getFavorites(area));
      setCustomModeEnabled(getCustomMode(area));
      setCustomOrder(getCustomOrder(area));
    }
  }, [area]);

  // Redirect if no area
  useEffect(() => {
    if (!area) {
      navigate("/resumos-juridicos", { replace: true });
    }
  }, [area, navigate]);

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

  const handleToggleFavorite = (tema: string) => {
    const updated = toggleFavorite(area, tema);
    setFavorites(updated);
  };

  const handleToggleCustomMode = () => {
    const newVal = !customModeEnabled;
    setCustomModeEnabled(newVal);
    saveCustomMode(area, newVal);
  };

  // Fetch temas from RESUMO table
  const { data: temas, isLoading, isError, refetch } = useQuery({
    queryKey: ["resumos-temas-trilha", area],
    queryFn: async () => {
      if (!area) return [];

      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("tema, \"ordem Tema\"")
          .eq("area", area)
          .not("tema", "is", null)
          .range(offset, offset + batchSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const temaMap = new Map<string, { tema: string; ordem: number; count: number }>();
      allData.forEach((item: any) => {
        if (item.tema) {
          const existing = temaMap.get(item.tema);
          if (existing) {
            existing.count++;
          } else {
            temaMap.set(item.tema, {
              tema: item.tema,
              ordem: parseFloat(item["ordem Tema"]) || 0,
              count: 1,
            });
          }
        }
      });

      return Array.from(temaMap.values()).sort((a, b) => a.ordem - b.ordem);
    },
    enabled: !!area,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const totalResumos = temas?.reduce((acc, t) => acc + t.count, 0) || 0;
  const totalTemas = temas?.length || 0;
  const lockedFromIndex = isPremium ? undefined : 2;

  // Initialize custom order when temas load
  useEffect(() => {
    if (temas && temas.length > 0 && customOrder.length === 0) {
      const saved = getCustomOrder(area);
      if (saved.length > 0) {
        setCustomOrder(saved);
      } else {
        setCustomOrder(temas.map(t => t.tema));
      }
    }
  }, [temas, area]);

  const handleTemaClick = (tema: string) => {
    navigate(`/resumos-juridicos/prontos/${encodeURIComponent(area)}/${encodeURIComponent(tema)}`);
  };

  // Drag handlers for reorder
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrder = [...customOrder];
    const [dragged] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, dragged);
    setCustomOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    saveCustomOrder(area, customOrder);
  };

  // Move item up/down in custom order
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...customOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setCustomOrder(newOrder);
    saveCustomOrder(area, newOrder);
  };

  // Format temas for the trail component
  const temasForTrail = useMemo(() => {
    if (!temas) return [];
    let filtered = temas;

    // Apply tab filter first
    if (activeTab === "favoritos") {
      filtered = temas.filter(t => favorites.includes(t.tema));
    } else if (activeTab === "personalizar") {
      // Show nothing in list when personalizar tab is active
      return [];
    } else if (customModeEnabled && customOrder.length > 0) {
      const temaMap = new Map(temas.map(t => [t.tema, t]));
      const ordered: typeof temas = [];
      customOrder.forEach(tema => {
        const t = temaMap.get(tema);
        if (t) ordered.push(t);
      });
      temas.forEach(t => {
        if (!customOrder.includes(t.tema)) ordered.push(t);
      });
      filtered = ordered;
    }

    // Apply search filter on top of any tab
    if (searchTerm.trim()) {
      const term = normalizar(searchTerm);
      filtered = filtered.filter(t => normalizar(t.tema).includes(term));
    }

    return filtered.map((t, i) => ({
      tema: t.tema,
      temQuestoes: false,
      parcial: false,
      subtemasGerados: t.count,
      totalSubtemas: t.count,
      totalQuestoes: t.count,
      progressoPercent: 0,
      ordem: t.ordem || i + 1,
    }));
  }, [temas, activeTab, searchTerm, favorites, customModeEnabled, customOrder]);

  // Items for reorder panel
  const reorderItems = useMemo(() => {
    if (!temas) return [];
    const temaMap = new Map(temas.map(t => [t.tema, t]));
    const order = customOrder.length > 0 ? customOrder : temas.map(t => t.tema);
    const result: { tema: string; count: number }[] = [];
    order.forEach(tema => {
      const t = temaMap.get(tema);
      if (t) result.push({ tema: t.tema, count: t.count });
    });
    // Add any new temas
    temas.forEach(t => {
      if (!order.includes(t.tema)) result.push({ tema: t.tema, count: t.count });
    });
    return result;
  }, [temas, customOrder]);

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
          <FilePenLine className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 pt-6 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/resumos-juridicos/prontos")}
              className="mb-3 bg-black/30 hover:bg-black/50 border border-white/20 rounded-full backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>

            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <FilePenLine className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {area}
                </h1>
                <p className="text-sm text-white/70 mt-0.5">
                  Escolha um tema
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Info Stats */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: hex }} />
              <span>{totalTemas} temas</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: hex }} />
              <span>{totalResumos.toLocaleString('pt-BR')} resumos</span>
            </div>
          </div>
        </div>

        {/* Tab switcher: Ordem / Favoritos / Personalizar */}
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
              Favoritos
            </button>
            <button
              onClick={() => setActiveTab("personalizar")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "personalizar"
                  ? "text-white shadow-md"
                  : "text-white/50 hover:text-white/70"
              }`}
              style={activeTab === "personalizar" ? { backgroundColor: `${hex}40` } : {}}
            >
              <Settings className="w-4 h-4" />
              Personalizar
            </button>
          </div>
        </div>

        {/* Search bar - always visible */}
        <div className="px-4 pb-3">
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar tema..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {/* Personalization panel */}
        {activeTab === "personalizar" && (
          <div className="px-4 pb-3 animate-fade-in">
            <div className="max-w-lg mx-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4">
              {/* Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-white">Modo Personalizado</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {customModeEnabled 
                      ? "Arraste para reorganizar do seu jeito" 
                      : "Os temas estão em ordem cronológica de estudo. Ative para personalizar a ordem como preferir!"}
                  </p>
                </div>
                <button
                  onClick={handleToggleCustomMode}
                  className="transition-transform active:scale-95"
                >
                  {customModeEnabled ? (
                    <ToggleRight className="w-10 h-10 text-amber-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-white/30" />
                  )}
                </button>
              </div>

              {/* Reorder list */}
              {customModeEnabled && (
                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                  {reorderItems.map((item, index) => (
                    <div
                      key={item.tema}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                        draggedIndex === index
                          ? "bg-amber-500/20 border-amber-500/40 scale-[1.02]"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <GripVertical className="w-4 h-4 text-white/30 shrink-0" />
                      <span className="text-xs font-bold text-white/40 w-5 shrink-0">{index + 1}</span>
                      <span className="text-sm text-white flex-1 line-clamp-1">{item.tema}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${hex}25`, color: hex }}>
                        {item.count}
                      </span>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === reorderItems.length - 1}
                          className="text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors rotate-180"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Favoritos empty state */}
        {activeTab === "favoritos" && temasForTrail.length === 0 && !isLoading && (
          <div className="text-center py-16 text-white/50 animate-fade-in">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum tema favoritado ainda.</p>
            <p className="text-xs mt-1 text-white/30">Toque no ♡ na aba Ordem para favoritar.</p>
          </div>
        )}

        {/* List Layout */}
        {isLoading ? (
          <TrilhaSkeleton hex={hex} />
        ) : isError ? (
          <div className="text-center py-16 text-white/60 animate-fade-in">
            <p className="mb-3">Erro ao carregar temas</p>
            <button onClick={() => refetch()} className="text-sm text-primary underline">Tente novamente</button>
          </div>
        ) : temasForTrail && temasForTrail.length > 0 ? (
          <div className="px-4 pb-6 space-y-2 max-w-lg mx-auto">
            {temasForTrail.map((item, index) => {
              const isLocked = lockedFromIndex !== undefined && index >= lockedFromIndex;
              const isFav = favorites.includes(item.tema);
              return (
                <div
                  key={item.tema}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                    isLocked
                      ? "bg-black/60 border-white/10 opacity-60"
                      : "bg-black/60 border-white/15 hover:bg-black/70 active:scale-[0.98]"
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div
                    className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer"
                    onClick={() => isLocked ? setShowPremiumModal(true) : handleTemaClick(item.tema)}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${hex}25`, border: `1.5px solid ${hex}40` }}
                    >
                      <span className="text-xs font-bold" style={{ color: hex }}>{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-normal text-white leading-tight line-clamp-2">{item.tema}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: hex }}>
                        {item.subtemasGerados} {item.subtemasGerados === 1 ? "resumo" : "resumos"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeTab === "ordem" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!isPremium) { setShowPremiumModal(true); return; } handleToggleFavorite(item.tema); }}
                        className="p-1"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? "fill-red-400 text-red-400" : "text-white/20"}`} />
                      </button>
                    )}
                    {isLocked ? (
                      <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab !== "favoritos" ? (
          <div className="text-center py-16 text-gray-400">
            {activeTab === "pesquisar" && searchTerm.trim()
              ? "Nenhum tema encontrado para essa busca."
              : "Nenhum tema encontrado"}
          </div>
        ) : null}
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
        title="Mais temas de Resumos"
        sourceFeature="Resumos Temas"
      />
    </div>
  );
};

export default ResumosJuridicosTemas;