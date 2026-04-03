import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, NotebookPen, Lightbulb, Brain, BookOpen, FileText, ListOrdered, Heart, Search, ChevronRight, Loader2, Zap } from 'lucide-react';
import { getAreaGradient, getAreaHex } from '@/lib/flashcardsAreaColors';
import { MapaMentalSkeleton } from '@/components/skeletons/MapaMentalSkeleton';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMetodologiasAutoGeneration } from '@/hooks/useMetodologiasAutoGeneration';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAIL } from '@/lib/adminConfig';

const metodoInfo: Record<string, { titulo: string; icon: any }> = {
  cornell: { titulo: 'Método Cornell', icon: NotebookPen },
  feynman: { titulo: 'Método Feynman', icon: Lightbulb },
  mapamental: { titulo: 'Mapa Mental', icon: Brain },
};

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const FAVORITES_KEY = "metodologias-temas-favoritos-public";

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

const MetodologiasTemas = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { metodo, area } = useParams<{ metodo: string; area: string }>();
  const decodedArea = decodeURIComponent(area || '');
  const hexColor = getAreaHex(decodedArea);
  const gradient = getAreaGradient(decodedArea);
  const info = metodoInfo[metodo || ''] || metodoInfo.cornell;
  const isMapaMental = metodo === 'mapamental';
  const storageKey = `${metodo}-${decodedArea}`;
  const Icon = info.icon;
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [activeTab, setActiveTab] = useState<"ordem" | "favoritos" | "pesquisar">("ordem");
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  const { data: temas, isLoading } = useQuery({
    queryKey: ['metodologias-temas-public', metodo, decodedArea],
    queryFn: async () => {
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

      // Count gerados per tema
      let geradosPerTema = new Map<string, number>();
      let totalResumos = 0;
      if (isMapaMental) {
        const { data: gerados } = await supabase
          .from('MAPAS_MENTAIS_GERADOS')
          .select('tema')
          .ilike('area', decodedArea);
        (gerados || []).forEach((g: any) => {
          const key = (g.tema || '').toLowerCase();
          geradosPerTema.set(key, (geradosPerTema.get(key) || 0) + 1);
        });
        totalResumos = (gerados || []).length;
      } else {
        const { data: gerados } = await supabase
          .from('METODOLOGIAS_GERADAS')
          .select('tema, subtema')
          .ilike('area', decodedArea)
          .eq('metodo', metodo!);
        (gerados || []).forEach((g: any) => {
          const key = (g.tema || '').toLowerCase();
          geradosPerTema.set(key, (geradosPerTema.get(key) || 0) + 1);
        });
        totalResumos = (gerados || []).length;
      }

      return {
        temas: Array.from(temaMap.entries())
          .map(([tema, ordem]) => {
            const key = tema.toLowerCase();
            const count = geradosPerTema.get(key) || 0;
            return {
              tema,
              ordem,
              gerado: count > 0,
              resumosCount: count,
            };
          })
          .sort((a, b) => a.ordem - b.ordem),
        totalResumos,
      };
    },
    refetchInterval: (query) => {
      if (!isAdmin) return false;
      const temPendentes = query.state.data?.temas?.some(t => !t.gerado);
      return temPendentes ? 8000 : false;
    },
  });

  const temasList = temas?.temas;
  const totalResumos = temas?.totalResumos || 0;

  const handleAutoGenProgress = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['metodologias-temas-public', metodo, decodedArea] });
  }, [queryClient, metodo, decodedArea]);

  const { isGenerating, currentTema, geradosCount } = useMetodologiasAutoGeneration({
    metodo: metodo || 'cornell',
    area: decodedArea,
    temas: temasList,
    enabled: isAdmin && !isMapaMental && !isLoading && !!metodo && (temasList?.some(t => !t.gerado) || false),
    onProgress: handleAutoGenProgress,
  });

  useEffect(() => {
    if (storageKey) setFavorites(getFavorites(storageKey));
  }, [storageKey]);

  const handleToggleFavorite = useCallback((tema: string) => {
    setFavorites(toggleFavorite(storageKey, tema));
  }, [storageKey]);

  if (isLoading) return <MapaMentalSkeleton />;

  const totalTemasGerados = temasList?.filter(t => t.gerado).length || 0;
  const total = temasList?.length || 0;

  const temasFiltered = (() => {
    if (!temasList) return [];
    if (activeTab === "pesquisar" && searchTerm.trim()) {
      const term = normalizar(searchTerm);
      return temasList.filter(t => normalizar(t.tema).includes(term));
    }
    if (activeTab === "favoritos") {
      return temasList.filter(t => favorites.includes(t.tema));
    }
    return temasList;
  })();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className={`bg-gradient-to-br ${gradient} px-4 pt-4 pb-6`}>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/metodologias/${metodo}`)}
            className="shrink-0 bg-black/30 backdrop-blur-sm hover:bg-black/50 border border-white/20 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white leading-tight">{decodedArea}</h1>
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
            <span>{totalResumos} resumos</span>
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

      {/* Tab switcher */}
      <div className="px-4 py-3">
        <div className="max-w-lg mx-auto flex rounded-xl overflow-hidden border border-border/30 bg-card/50 backdrop-blur-sm">
          {[
            { id: "ordem" as const, icon: ListOrdered, label: "Ordem" },
            { id: "favoritos" as const, icon: Heart, label: "Favoritos" },
            { id: "pesquisar" as const, icon: Search, label: "Pesquisar" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id ? "text-foreground shadow-md" : "text-muted-foreground hover:text-foreground/70"
              }`}
              style={activeTab === tab.id ? { backgroundColor: `${hexColor}40` } : {}}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      {activeTab === "pesquisar" && (
        <div className="px-4 pb-3 animate-fade-in">
          <div className="max-w-lg mx-auto relative">
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
      )}

      {/* Empty states */}
      {activeTab === "favoritos" && temasFiltered.length === 0 && (
        <div className="px-4 py-12 text-center animate-fade-in">
          <Heart className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum tema favoritado ainda</p>
        </div>
      )}

      {activeTab === "pesquisar" && searchTerm.trim() && temasFiltered.length === 0 && (
        <div className="px-4 py-12 text-center animate-fade-in">
          <Search className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum tema encontrado</p>
        </div>
      )}

      {/* Lista de temas */}
      {temasFiltered.length > 0 && (
        <div className="px-4 space-y-2 max-w-lg mx-auto">
          {temasFiltered.map((t, i) => {
            const isFav = favorites.includes(t.tema);
            return (
              <div
                key={t.tema}
                className="flex items-center gap-3 rounded-xl p-3 border border-border/30 bg-card/60 backdrop-blur-sm animate-fade-in cursor-pointer active:scale-[0.98] transition-all"
                style={{ animationDelay: `${Math.min(i, 15) * 30}ms`, animationFillMode: 'both' }}
                onClick={() => navigate(`/metodologias/${metodo}/area/${encodeURIComponent(decodedArea)}/tema/${encodeURIComponent(t.tema)}`)}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${hexColor}25` }}
                >
                  <Icon className="w-5 h-5" style={{ color: hexColor }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                    {t.tema}
                  </p>
                  {t.gerado && (
                    <p className="text-[11px] mt-0.5 font-medium" style={{ color: hexColor }}>
                      {t.resumosCount} {t.resumosCount === 1 ? 'resumo' : 'resumos'}
                    </p>
                  )}
                </div>

                {/* Favorite */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(t.tema);
                  }}
                  className="shrink-0 p-1.5"
                >
                  <Heart
                    className="w-4 h-4"
                    style={{
                      color: isFav ? '#ef4444' : 'rgba(255,255,255,0.25)',
                      fill: isFav ? '#ef4444' : 'none',
                    }}
                  />
                </button>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MetodologiasTemas;
