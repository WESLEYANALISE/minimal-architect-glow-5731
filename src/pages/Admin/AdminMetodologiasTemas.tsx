import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, NotebookPen, Lightbulb, Brain, BookOpen, FileText, ListOrdered, Heart, Search, Settings, ToggleLeft, ToggleRight, GripVertical, ArrowUp, ArrowDown, Zap, Loader2 } from 'lucide-react';
import { getAreaGradient, getAreaHex } from '@/lib/flashcardsAreaColors';
import { QuestoesTrilhaTemas } from '@/components/questoes/QuestoesTrilhaTemas';
import { MapaMentalSkeleton } from '@/components/skeletons/MapaMentalSkeleton';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMetodologiasAutoGeneration } from '@/hooks/useMetodologiasAutoGeneration';

const ADMIN_EMAIL = 'wn7corporation@gmail.com';

const metodoInfo: Record<string, { titulo: string; icon: any }> = {
  cornell: { titulo: 'Método Cornell', icon: NotebookPen },
  feynman: { titulo: 'Método Feynman', icon: Lightbulb },
  mapamental: { titulo: 'Mapa Mental', icon: Brain },
};

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const FAVORITES_KEY = "metodologias-temas-favoritos";
const CUSTOM_ORDER_KEY = "metodologias-temas-ordem-custom";
const CUSTOM_MODE_KEY = "metodologias-temas-modo-custom";

const getFavorites = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, string[]>;
    return all[key] || [];
  } catch { return []; }
};

const toggleFavorite = (key: string, tema: string): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, string[]> : {};
    const current = all[key] || [];
    if (current.includes(tema)) {
      all[key] = current.filter(t => t !== tema);
    } else {
      all[key] = [...current, tema];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(all));
    return all[key];
  } catch { return []; }
};

const getCustomOrder = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_ORDER_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as Record<string, string[]>;
    return all[key] || [];
  } catch { return []; }
};

const saveCustomOrder = (key: string, order: string[]) => {
  try {
    const raw = localStorage.getItem(CUSTOM_ORDER_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, string[]> : {};
    all[key] = order;
    localStorage.setItem(CUSTOM_ORDER_KEY, JSON.stringify(all));
  } catch {}
};

const getCustomMode = (key: string): boolean => {
  try {
    const raw = localStorage.getItem(CUSTOM_MODE_KEY);
    if (!raw) return false;
    const all = JSON.parse(raw) as Record<string, boolean>;
    return all[key] || false;
  } catch { return false; }
};

const saveCustomMode = (key: string, enabled: boolean) => {
  try {
    const raw = localStorage.getItem(CUSTOM_MODE_KEY);
    const all = raw ? JSON.parse(raw) as Record<string, boolean> : {};
    all[key] = enabled;
    localStorage.setItem(CUSTOM_MODE_KEY, JSON.stringify(all));
  } catch {}
};

const AdminMetodologiasTemas = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { metodo, area } = useParams<{ metodo: string; area: string }>();
  const { user } = useAuth();
  const decodedArea = decodeURIComponent(area || '');
  const hexColor = getAreaHex(decodedArea);
  const gradient = getAreaGradient(decodedArea);
  const info = metodoInfo[metodo || ''] || metodoInfo.cornell;
  const isMapaMental = metodo === 'mapamental';
  const storageKey = `${metodo}-${decodedArea}`;

  const [activeTab, setActiveTab] = useState<"ordem" | "favoritos" | "pesquisar">("ordem");
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPersonalizacao, setShowPersonalizacao] = useState(false);
  const [customModeEnabled, setCustomModeEnabled] = useState(false);
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const { data: temas, isLoading } = useQuery({
    queryKey: ['metodologias-temas-trilha', metodo, decodedArea],
    queryFn: async () => {
      // Batch pagination to get all rows (Supabase default limit is 1000)
      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('RESUMO')
          .select('tema, "ordem Tema"')
          .eq('area', decodedArea)
          .not('tema', 'is', null)
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

      const temaMap = new Map<string, number>();
      allData.forEach((r: any) => {
        if (r.tema && !temaMap.has(r.tema)) {
          temaMap.set(r.tema, parseFloat(r['ordem Tema'] || '0') || 0);
        }
      });

      let geradosSet: Set<string>;

      if (isMapaMental) {
        const { data: gerados } = await supabase
          .from('MAPAS_MENTAIS_GERADOS')
          .select('tema')
          .eq('area', decodedArea);
        geradosSet = new Set((gerados || []).map((g: any) => g.tema));
      } else {
        const { data: gerados } = await supabase
          .from('METODOLOGIAS_GERADAS')
          .select('tema')
          .eq('area', decodedArea)
          .eq('metodo', metodo!);
        geradosSet = new Set((gerados || []).map((g: any) => g.tema));
      }

      return Array.from(temaMap.entries())
        .map(([tema, ordem]) => ({
          tema,
          ordem,
          gerado: geradosSet.has(tema),
        }))
        .sort((a, b) => a.ordem - b.ordem);
    },
    refetchInterval: () => {
      const temPendentes = temas?.some(t => !t.gerado);
      return temPendentes ? 8000 : false;
    },
  });

  // Initialize custom order when temas load
  useEffect(() => {
    if (temas && temas.length > 0 && customOrder.length === 0) {
      const saved = getCustomOrder(storageKey);
      if (saved.length > 0) {
        setCustomOrder(saved);
      } else {
        setCustomOrder(temas.map(t => t.tema));
      }
    }
  }, [temas, storageKey]);

  // Load favorites and custom settings
  useEffect(() => {
    if (storageKey) {
      setFavorites(getFavorites(storageKey));
      setCustomModeEnabled(getCustomMode(storageKey));
      setCustomOrder(getCustomOrder(storageKey));
    }
  }, [storageKey]);

  const handleToggleFavorite = useCallback((tema: string) => {
    const updated = toggleFavorite(storageKey, tema);
    setFavorites(updated);
  }, [storageKey]);

  const handleAutoGenProgress = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['metodologias-temas-trilha', metodo, decodedArea] });
  }, [queryClient, metodo, decodedArea]);

  const { isGenerating, currentTema, geradosCount } = useMetodologiasAutoGeneration({
    metodo: metodo || 'cornell',
    area: decodedArea,
    temas: temas?.map(t => ({ tema: t.tema, gerado: t.gerado })),
    enabled: isAdmin && !isMapaMental && !isLoading && !!metodo && (temas?.some(t => !t.gerado) || false),
    onProgress: handleAutoGenProgress,
  });

  if (!isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito.</div>;
  }

  const handleToggleCustomMode = () => {
    const newVal = !customModeEnabled;
    setCustomModeEnabled(newVal);
    saveCustomMode(storageKey, newVal);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
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
    saveCustomOrder(storageKey, customOrder);
  };
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...customOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setCustomOrder(newOrder);
    saveCustomOrder(storageKey, newOrder);
  };

  if (isLoading) return <MapaMentalSkeleton />;

  const totalGerados = temas?.filter(t => t.gerado).length || 0;
  const total = temas?.length || 0;

  const temasForTrail = (() => {
    if (!temas) return [];
    let filtered = [...temas];

    if (activeTab === "pesquisar" && searchTerm.trim()) {
      const term = normalizar(searchTerm);
      filtered = temas.filter(t => normalizar(t.tema).includes(term));
    } else if (activeTab === "favoritos") {
      filtered = temas.filter(t => favorites.includes(t.tema));
    } else if (activeTab === "ordem" && customModeEnabled && customOrder.length > 0) {
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

    return filtered.map((t, i) => ({
      tema: t.tema,
      temQuestoes: t.gerado,
      parcial: false,
      subtemasGerados: t.gerado ? 1 : 0,
      totalSubtemas: 1,
      totalQuestoes: t.gerado ? 1 : 0,
      progressoPercent: t.gerado ? 100 : 0,
      ordem: t.ordem,
    }));
  })();

  const reorderItems = (() => {
    if (!temas) return [];
    const temaMap = new Map(temas.map(t => [t.tema, t]));
    const order = customOrder.length > 0 ? customOrder : temas.map(t => t.tema);
    const result: { tema: string; gerado: boolean }[] = [];
    order.forEach(tema => {
      const t = temaMap.get(tema);
      if (t) result.push({ tema: t.tema, gerado: t.gerado });
    });
    temas.forEach(t => {
      if (!order.includes(t.tema)) result.push({ tema: t.tema, gerado: t.gerado });
    });
    return result;
  })();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className={`bg-gradient-to-br ${gradient} px-4 pt-4 pb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/admin/metodologias/${metodo}`)}
            className="shrink-0 bg-black/30 backdrop-blur-sm hover:bg-black/50 border border-white/20 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{decodedArea}</h1>
            <p className="text-xs text-white/70">{info.titulo}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-white/60" />
            <span>{total} temas</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/60" />
            <span>{totalGerados} gerados</span>
          </div>
        </div>
      </div>

      {/* Auto generation indicator */}
      {isGenerating && (
        <div className="px-4 py-2 animate-slide-down">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 border"
              style={{ backgroundColor: `${hexColor}15`, borderColor: `${hexColor}30` }}
            >
              <div className="relative">
                <Zap className="w-5 h-5" style={{ color: hexColor }} />
                <div className="absolute inset-0 animate-ping">
                  <Zap className="w-5 h-5 opacity-50" style={{ color: hexColor }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: hexColor }}>
                  Gerando {info.titulo}...
                </p>
                <p className="text-xs truncate" style={{ color: `${hexColor}99` }}>
                  {currentTema ? `Tema: ${currentTema}` : 'Iniciando...'} • {geradosCount} gerados
                </p>
              </div>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: hexColor }} />
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher: Ordem / Favoritos / Pesquisar */}
      <div className="px-4 py-3">
        <div className="max-w-lg mx-auto flex rounded-xl overflow-hidden border border-border/30 bg-card/50 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("ordem")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
              activeTab === "ordem"
                ? "text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
            style={activeTab === "ordem" ? { backgroundColor: `${hexColor}40` } : {}}
          >
            <ListOrdered className="w-4 h-4" />
            Ordem
          </button>
          <button
            onClick={() => setActiveTab("favoritos")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
              activeTab === "favoritos"
                ? "text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
            style={activeTab === "favoritos" ? { backgroundColor: `${hexColor}40` } : {}}
          >
            <Heart className="w-4 h-4" />
            Favoritos
          </button>
          <button
            onClick={() => setActiveTab("pesquisar")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
              activeTab === "pesquisar"
                ? "text-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
            style={activeTab === "pesquisar" ? { backgroundColor: `${hexColor}40` } : {}}
          >
            <Search className="w-4 h-4" />
            Pesquisar
          </button>
        </div>
      </div>

      {/* Search bar */}
      {activeTab === "pesquisar" && (
        <div className="px-4 pb-3 animate-fade-in">
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar tema..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Personalization gear button */}
      {activeTab === "ordem" && (
        <div className="px-4 pb-2 animate-fade-in">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setShowPersonalizacao(!showPersonalizacao)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border backdrop-blur-sm ${
                showPersonalizacao
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                  : "bg-card/50 border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/80"
              }`}
            >
              <Settings className="w-4 h-4" />
              Personalizar
            </button>

            {/* Personalization panel */}
            {showPersonalizacao && (
              <div className="mt-3 rounded-xl border border-border/30 bg-card/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Modo Personalizado</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {customModeEnabled
                        ? "Arraste para reorganizar do seu jeito"
                        : "Os temas estão em ordem cronológica de estudo. Ative para personalizar!"}
                    </p>
                  </div>
                  <button onClick={handleToggleCustomMode} className="transition-transform active:scale-95">
                    {customModeEnabled ? (
                      <ToggleRight className="w-10 h-10 text-amber-400" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-muted-foreground/40" />
                    )}
                  </button>
                </div>

                {customModeEnabled && (
                  <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                    {reorderItems.map((item, index) => (
                      <div
                        key={item.tema}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                          draggedIndex === index
                            ? "bg-primary/10 border-primary/30 scale-[1.02]"
                            : "bg-card/60 border-border/20 hover:bg-card/90"
                        }`}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground w-5 text-right flex-shrink-0">{index + 1}.</span>
                        <span className="text-sm text-foreground flex-1 truncate">{item.tema}</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20"
                          >
                            <ArrowUp className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === reorderItems.length - 1}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20"
                          >
                            <ArrowDown className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Favoritos empty state */}
      {activeTab === "favoritos" && temasForTrail.length === 0 && (
        <div className="px-4 py-12 text-center animate-fade-in">
          <Heart className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum tema favoritado ainda</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Toque no ❤️ nos temas para adicionar</p>
        </div>
      )}

      {/* Search empty state */}
      {activeTab === "pesquisar" && searchTerm.trim() && temasForTrail.length === 0 && (
        <div className="px-4 py-12 text-center animate-fade-in">
          <Search className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum tema encontrado</p>
        </div>
      )}

      {temasForTrail.length > 0 && (
        <QuestoesTrilhaTemas
          temas={temasForTrail}
          hexColor={hexColor}
          onTemaClick={(tema) => navigate(`/admin/metodologias/${metodo}/area/${encodeURIComponent(decodedArea)}/tema/${encodeURIComponent(tema)}`)}
          icon={info.icon}
          badgeLabel="gerado"
          favoritos={favorites}
          onToggleFavorito={handleToggleFavorite}
        />
      )}
    </div>
  );
};

export default AdminMetodologiasTemas;
