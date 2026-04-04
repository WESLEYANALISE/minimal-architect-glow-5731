import { supabase } from "@/integrations/supabase/client";
import { Search, BookOpen, Clock, SortAsc, ImageIcon, X, GraduationCap, ChevronLeft, Settings, Heart, Share2, Library } from "lucide-react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LivroCard } from "@/components/LivroCard";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBibliotecaCapasAutoGeneration } from "@/hooks/useBibliotecaCapasAutoGeneration";
import { useInstantCache } from "@/hooks/useInstantCache";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useContentLimit } from "@/hooks/useContentLimit";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import capaDireitoPenal from "@/assets/capa-direito-penal.webp";
import { AreaCardEstudos } from "@/components/biblioteca/AreaCardEstudos";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getAreaConfig } from "@/components/biblioteca/AreaCardEstudos";

interface BibliotecaItem {
  id: number;
  Área: string | null;
  Ordem: number | null;
  Tema: string | null;
  Download: string | null;
  Link: string | null;
  "Capa-area": string | null;
  "Capa-livro": string | null;
  Sobre: string | null;
  url_capa_gerada?: string | null;
}

interface CapaBiblioteca {
  Biblioteca: string;
  capa: string;
  sobre?: string;
}

interface RecentBook {
  id: number;
  titulo: string;
  area: string;
  capaUrl: string | null;
  openedAt: number;
}

const STORAGE_KEYS = {
  recentes: "biblioteca-estudos-recentes",
  favoritos: "biblioteca-estudos-favoritos-ids",
  ordemAreas: "biblioteca-estudos-ordem-areas",
  modoPersonalizado: "biblioteca-estudos-modo-personalizado",
};

type BottomTab = "catalogo" | "recentes" | "favoritos";

// Sortable area item for settings sheet
function SortableAreaItem({ area, id }: { area: string; id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.8 : 1 };
  const config = getAreaConfig(area);
  const Icon = config.icon;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/30">
      <div className={`w-8 h-8 rounded-lg ${config.accent} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground truncate">{area}</span>
      <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
        <GripVertical className="w-5 h-5" />
      </div>
    </div>
  );
}

const BibliotecaEstudos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchAreaTerm, setSearchAreaTerm] = useState("");
  const [ordenacao, setOrdenacao] = useState<"cronologica" | "alfabetica">("cronologica");
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>("catalogo");
  const [favoritosIds, setFavoritosIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.favoritos) || "[]"); } catch { return []; }
  });
  const [recentes, setRecentes] = useState<RecentBook[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.recentes) || "[]"); } catch { return []; }
  });
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [customOrdemAreas, setCustomOrdemAreas] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.ordemAreas) || "[]"); } catch { return []; }
  });
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedAreaSearch = useDebounce(searchAreaTerm, 300);

  // Hook de geração automática de capas
  const {
    isGenerating, currentLivro, processados, total, livrosSemCapa, cancelar
  } = useBibliotecaCapasAutoGeneration({ area: selectedArea, enabled: !!selectedArea });

  useEffect(() => {
    if (processados > 0) queryClient.invalidateQueries({ queryKey: ["biblioteca-estudos"] });
  }, [processados, queryClient]);

  useEffect(() => {
    if (location.state?.selectedArea) setSelectedArea(location.state.selectedArea);
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favoritos, JSON.stringify(favoritosIds));
  }, [favoritosIds]);

  // Cache instantâneo para capa
  const { data: capa } = useInstantCache<CapaBiblioteca>({
    cacheKey: "capa-biblioteca-estudos",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("CAPA-BIBILIOTECA")
        .select("*")
        .eq("Biblioteca", "Biblioteca de Estudos")
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Cache instantâneo para livros
  const { data: items, isLoading } = useInstantCache<BibliotecaItem[]>({
    cacheKey: "biblioteca-estudos-livros",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .order("Ordem");
      if (error) throw error;
      return data as BibliotecaItem[];
    },
    preloadImages: true,
    imageExtractor: (data) => {
      const capas: string[] = [];
      data.forEach(item => {
        const cap = item.url_capa_gerada || item["Capa-livro"];
        if (cap && !capas.includes(cap)) capas.push(cap);
      });
      return capas.slice(0, 50);
    },
  });

  // Agrupar por área
  const areaGroups = useMemo(() => {
    return items?.reduce((acc, item) => {
      const area = item.Área || "Sem Área";
      if (!acc[area]) acc[area] = { capa: null, livros: [] };
      acc[area].livros.push(item);
      if (!acc[area].capa) {
        const capaLivro = item.url_capa_gerada || item["Capa-livro"];
        if (capaLivro) acc[area].capa = capaLivro;
      }
      return acc;
    }, {} as Record<string, { capa: string | null; livros: BibliotecaItem[] }>);
  }, [items]);

  const removerAcentuacao = (texto: string) =>
    texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Areas sorted with customization
  const allAreasSorted = useMemo(() => {
    if (!areaGroups) return [];
    const areas = Object.keys(areaGroups).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    if (customOrdemAreas.length > 0) {
      const ordered: string[] = [];
      customOrdemAreas.forEach(a => { if (areas.includes(a)) ordered.push(a); });
      areas.forEach(a => { if (!ordered.includes(a)) ordered.push(a); });
      return ordered;
    }
    return areas;
  }, [areaGroups, customOrdemAreas]);

  // Filtered areas for search
  const areasFiltered = useMemo(() => {
    if (!debouncedAreaSearch) return allAreasSorted;
    const search = removerAcentuacao(debouncedAreaSearch.toLowerCase());
    return allAreasSorted.filter(a => removerAcentuacao(a.toLowerCase()).includes(search));
  }, [allAreasSorted, debouncedAreaSearch]);

  const ordenarLivros = (livros: BibliotecaItem[]) => {
    if (ordenacao === "alfabetica") {
      return [...livros].sort((a, b) => (a.Tema || "").localeCompare(b.Tema || "", 'pt-BR', { sensitivity: 'base' }));
    }
    return [...livros].sort((a, b) => (a.Ordem || 0) - (b.Ordem || 0));
  };

  const livrosDaAreaSelecionada = useMemo(() => {
    if (bottomTab !== "catalogo" || !selectedArea || !areaGroups) return [];
    const areaData = areaGroups[selectedArea];
    if (!areaData) return [];
    const filtrados = areaData.livros.filter(livro =>
      removerAcentuacao((livro.Tema || "").toLowerCase()).includes(removerAcentuacao(searchTerm.toLowerCase()))
    );
    return ordenarLivros(filtrados);
  }, [selectedArea, areaGroups, searchTerm, ordenacao, bottomTab]);

  const { visibleItems, lockedItems, isPremiumRequired } = useContentLimit(livrosDaAreaSelecionada, 'estudos');

  const getAreaCover = (area: string, dataCapa: string | null) => {
    if (area === "Direito Penal") return capaDireitoPenal;
    return dataCapa;
  };

  const toggleFavorito = useCallback((livroId: number) => {
    setFavoritosIds(prev => prev.includes(livroId) ? prev.filter(id => id !== livroId) : [...prev, livroId]);
  }, []);

  const isFavorito = useCallback((livroId: number) => favoritosIds.includes(livroId), [favoritosIds]);

  const addRecente = useCallback((livro: BibliotecaItem) => {
    const entry: RecentBook = {
      id: livro.id, titulo: livro.Tema || "Sem título", area: livro.Área || "",
      capaUrl: livro.url_capa_gerada || livro["Capa-livro"] || null, openedAt: Date.now(),
    };
    setRecentes(prev => {
      const filtered = prev.filter(r => r.id !== livro.id);
      const updated = [entry, ...filtered].slice(0, 30);
      localStorage.setItem(STORAGE_KEYS.recentes, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const shareViaWhatsApp = useCallback((livro: BibliotecaItem) => {
    const lines: string[] = [];
    lines.push(`╔══════════════════╗`);
    lines.push(`   📚 *Biblioteca de Estudos*`);
    lines.push(`╚══════════════════╝`);
    lines.push('');
    lines.push(`📖 *${livro.Tema || 'Livro'}*`);
    if (livro.Área) lines.push(`📂 ${livro.Área}`);
    lines.push('');
    if (livro.Sobre) {
      const sobre = livro.Sobre.length > 300 ? livro.Sobre.substring(0, 300) + '...' : livro.Sobre;
      lines.push(`📝 *Sobre:*`);
      lines.push(sobre);
      lines.push('');
    }
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push(`✨ _Direito Premium_`);
    lines.push(`📱 _App de Estudos Jurídicos_`);
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
    toast({ title: "Compartilhando no WhatsApp", description: "Livro formatado para envio!" });
  }, []);

  const handleLivroClick = useCallback((livro: BibliotecaItem) => {
    addRecente(livro);
    navigate(`/biblioteca-estudos/${livro.id}`);
  }, [addRecente, navigate]);

  const livrosFavoritos = useMemo(() => {
    if (!items) return [];
    return items.filter(l => favoritosIds.includes(l.id));
  }, [items, favoritosIds]);

  // DnD sensors for settings sheet
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const order = [...(customOrdemAreas.length > 0 ? customOrdemAreas : allAreasSorted)];
      const oldIndex = order.indexOf(active.id as string);
      const newIndex = order.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(order, oldIndex, newIndex);
        setCustomOrdemAreas(newOrder);
        localStorage.setItem(STORAGE_KEYS.ordemAreas, JSON.stringify(newOrder));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="relative h-32 md:h-40 overflow-hidden">
        {capa?.capa && (
          <img src={capa.capa} alt="Biblioteca de Estudos" className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="sync" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background" />
        <Button
          variant="ghost" size="icon"
          onClick={() => selectedArea ? setSelectedArea(null) : navigate("/biblioteca-faculdade")}
          className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/90 rounded-xl shadow-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">
                {selectedArea || "Estudos"}
              </h1>
              <p className="text-xs text-white/80">
                {selectedArea
                  ? `${areaGroups?.[selectedArea]?.livros.length || 0} livros`
                  : `${items?.length || 0} livros • ${allAreasSorted.length} áreas`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="px-3 py-4 max-w-4xl mx-auto pb-24 animate-fade-in">
        {/* ===== VISTA DE ÁREAS (sem área selecionada) ===== */}
        {bottomTab === "catalogo" && !selectedArea && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">Áreas do Direito</h2>
                <p className="text-xs text-muted-foreground">{allAreasSorted.length} áreas disponíveis</p>
              </div>
              <button
                onClick={() => setShowSettingsSheet(true)}
                className="p-2 rounded-full text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Busca de áreas */}
            <Card className="mb-4">
              <CardContent className="p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar área..."
                    value={searchAreaTerm}
                    onChange={e => setSearchAreaTerm(e.target.value)}
                    className="text-base"
                  />
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de áreas */}
            <div className="space-y-2">
              {areasFiltered.map(area => (
                <AreaCardEstudos
                  key={area}
                  area={area}
                  totalLivros={areaGroups?.[area]?.livros.length || 0}
                  capaUrl={areaGroups?.[area]?.capa}
                  onClick={() => { setSelectedArea(area); setSearchTerm(""); }}
                />
              ))}
              {areasFiltered.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Nenhuma área encontrada</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== VISTA DE LIVROS (área selecionada) ===== */}
        {bottomTab === "catalogo" && selectedArea && (
          <>
            <div className="mb-4">
              <h2 className="text-xl md:text-2xl font-bold mb-1">{selectedArea}</h2>
              <p className="text-sm text-muted-foreground">
                {livrosDaAreaSelecionada.length} {livrosDaAreaSelecionada.length === 1 ? "livro disponível" : "livros disponíveis"}
                {isPremiumRequired && <span className="text-amber-500 ml-2">• {visibleItems.length} liberados</span>}
              </p>
            </div>

            {(isGenerating || livrosSemCapa > 0) && (
              <Card className="mb-4 border-border/50 bg-secondary/30">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      {!isGenerating && livrosSemCapa > 0 && <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                      <div>
                        <p className="text-sm text-foreground">
                          {isGenerating ? `Gerando capa: ${currentLivro}` : `${livrosSemCapa} capas pendentes`}
                        </p>
                        <p className="text-xs text-muted-foreground">{processados}/{total} processados</p>
                      </div>
                    </div>
                    {isGenerating && (
                      <Button variant="ghost" size="icon" onClick={cancelar} className="h-8 w-8">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-muted-foreground/50 transition-all duration-500" style={{ width: `${(processados / total) * 100}%` }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="mb-4">
              <CardContent className="p-3">
                <div className="flex gap-2">
                  <Input placeholder="Buscar livro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="text-base" />
                  <Button variant="outline" size="icon" className="shrink-0"><Search className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mb-4">
              <ToggleGroup type="single" value={ordenacao} onValueChange={(v) => { if (v) setOrdenacao(v as "cronologica" | "alfabetica"); }} className="bg-secondary/50 rounded-lg p-1">
                <ToggleGroupItem value="cronologica" aria-label="Cronológica" className="text-xs px-3 py-1.5 h-auto gap-1.5">
                  <Clock className="w-3.5 h-3.5" />Cronológica
                </ToggleGroupItem>
                <ToggleGroupItem value="alfabetica" aria-label="Alfabética" className="text-xs px-3 py-1.5 h-auto gap-1.5">
                  <SortAsc className="w-3.5 h-3.5" />Alfabética
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-4">
              {visibleItems.map((livro, idx) => {
                const areaCapa = getAreaCover(selectedArea, areaGroups?.[selectedArea]?.capa || null);
                return (
                  <div key={livro.id} className="relative">
                    <LivroCard
                      titulo={livro.Tema || "Sem título"}
                      subtitulo={livro.Área || ""}
                      capaUrl={livro.url_capa_gerada || livro["Capa-livro"] || areaCapa}
                      sobre={livro.Sobre}
                      numero={livro.Ordem || idx + 1}
                      ano={2026}
                      onClick={() => handleLivroClick(livro)}
                    />
                    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorito(livro.id); }}
                        className={`p-1.5 rounded-full backdrop-blur-sm transition-all ${isFavorito(livro.id) ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavorito(livro.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); shareViaWhatsApp(livro); }}
                        className="p-1.5 rounded-full bg-black/40 text-white/80 hover:bg-green-600/80 backdrop-blur-sm transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {lockedItems.map((livro, index) => {
                const areaCapa = getAreaCover(selectedArea, areaGroups?.[selectedArea]?.capa || null);
                return (
                  <LivroCard
                    key={livro.id}
                    titulo={livro.Tema || "Sem título"}
                    subtitulo={livro.Área || ""}
                    capaUrl={livro.url_capa_gerada || livro["Capa-livro"] || areaCapa}
                    sobre={livro.Sobre}
                    numero={livro.Ordem || visibleItems.length + index + 1}
                    ano={2026}
                    isPremiumLocked
                    onClick={() => setShowPremiumCard(true)}
                  />
                );
              })}
              {visibleItems.length === 0 && lockedItems.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Nenhum livro encontrado</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== TAB RECENTES ===== */}
        {bottomTab === "recentes" && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-1">Lidos Recentemente</h2>
              <p className="text-sm text-muted-foreground">Últimos livros que você abriu</p>
            </div>
            {recentes.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Nenhum livro aberto ainda</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Ao abrir um livro, ele aparecerá aqui</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentes.map((r) => {
                  const livroCompleto = items?.find(l => l.id === r.id);
                  return (
                    <div key={r.id} className="relative">
                      <LivroCard
                        titulo={r.titulo}
                        subtitulo={r.area}
                        capaUrl={r.capaUrl}
                        sobre={livroCompleto?.Sobre}
                        onClick={() => navigate(`/biblioteca-estudos/${r.id}`)}
                      />
                      <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorito(r.id); }}
                          className={`p-1.5 rounded-full backdrop-blur-sm transition-all ${isFavorito(r.id) ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFavorito(r.id) ? 'fill-current' : ''}`} />
                        </button>
                        {livroCompleto && (
                          <button
                            onClick={(e) => { e.stopPropagation(); shareViaWhatsApp(livroCompleto); }}
                            className="p-1.5 rounded-full bg-black/40 text-white/80 hover:bg-green-600/80 backdrop-blur-sm transition-all"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== TAB FAVORITOS ===== */}
        {bottomTab === "favoritos" && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-1">Meus Favoritos</h2>
              <p className="text-sm text-muted-foreground">{livrosFavoritos.length} livros favoritados</p>
            </div>
            {livrosFavoritos.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Nenhum favorito ainda</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Toque no ❤️ dos livros para favoritá-los</p>
              </div>
            ) : (
              <div className="space-y-4">
                {livrosFavoritos.map((livro) => {
                  const areaCapa = livro.Área ? getAreaCover(livro.Área, areaGroups?.[livro.Área]?.capa || null) : null;
                  return (
                    <div key={livro.id} className="relative">
                      <LivroCard
                        titulo={livro.Tema || "Sem título"}
                        subtitulo={livro.Área || ""}
                        capaUrl={livro.url_capa_gerada || livro["Capa-livro"] || areaCapa}
                        sobre={livro.Sobre}
                        numero={livro.Ordem}
                        ano={2026}
                        onClick={() => handleLivroClick(livro)}
                      />
                      <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorito(livro.id); }}
                          className="p-1.5 rounded-full bg-red-500/90 text-white backdrop-blur-sm transition-all"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); shareViaWhatsApp(livro); }}
                          className="p-1.5 rounded-full bg-black/40 text-white/80 hover:bg-green-600/80 backdrop-blur-sm transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation fixo */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/50">
        <div className="flex justify-around py-2">
          <button
            onClick={() => { setBottomTab("catalogo"); setSelectedArea(null); }}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${bottomTab === "catalogo" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Library className="w-5 h-5" />
            <span className="text-[10px] font-medium">Catálogo</span>
          </button>
          <button
            onClick={() => setBottomTab("recentes")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${bottomTab === "recentes" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-medium">Recentes</span>
          </button>
          <button
            onClick={() => setBottomTab("favoritos")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors relative ${bottomTab === "favoritos" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Heart className={`w-5 h-5 ${bottomTab === "favoritos" ? "fill-current" : ""}`} />
            <span className="text-[10px] font-medium">Favoritos</span>
            {favoritosIds.length > 0 && (
              <span className="absolute -top-0.5 right-2 bg-red-500 text-white text-[8px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full">
                {favoritosIds.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Settings Sheet para reordenar áreas */}
      <Sheet open={showSettingsSheet} onOpenChange={setShowSettingsSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto p-0">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-lg font-bold">Ordenar Áreas</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Arraste para reordenar as áreas do jeito que preferir
            </SheetDescription>
          </SheetHeader>

          <div className="px-5 pb-3 space-y-1">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={customOrdemAreas.length > 0 ? customOrdemAreas : allAreasSorted} strategy={verticalListSortingStrategy}>
                {(customOrdemAreas.length > 0 ? customOrdemAreas : allAreasSorted).map(area => (
                  <SortableAreaItem key={area} id={area} area={area} />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="sticky bottom-0 px-5 py-4 bg-background border-t border-border">
            <button
              onClick={() => setShowSettingsSheet(false)}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground"
            >
              Salvar
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        title="Conteúdo Premium"
        description="Desbloqueie todos os livros desta área assinando um dos nossos planos."
        sourceFeature="Biblioteca Estudos"
      />
    </div>
  );
};

export default BibliotecaEstudos;
