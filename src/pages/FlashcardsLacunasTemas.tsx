import { useNavigate, useSearchParams } from "react-router-dom";
import { PenLine, BookOpen, FileText, Loader2, Zap, ChevronRight, Heart, Search, Layers, ListOrdered, X, Trash2, Play, Brain, Sparkles, Plus, Wand2, SlidersHorizontal } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFlashcardsLacunasAutoGeneration } from "@/hooks/useFlashcardsLacunasAutoGeneration";
import { getAreaGradient, getAreaHex } from "@/lib/flashcardsAreaColors";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface LacunaDeck {
  id: string;
  name: string;
  area: string;
  temas: string[];
  createdAt: string;
  isExample?: boolean;
  feedback?: string;
}

const TABS = [
  { id: "ordem" as const, label: "Ordem", icon: ListOrdered },
  { id: "decks" as const, label: "Decks", icon: Layers },
  { id: "favoritos" as const, label: "Favoritos", icon: Heart },
  { id: "pesquisar" as const, label: "Pesquisar", icon: Search },
];

type TabId = "ordem" | "decks" | "favoritos" | "pesquisar";
type CreatorMode = "manual" | "ia";

// Card color palette for saved decks
const DECK_COLORS = [
  { bg: 'from-violet-600/80 to-purple-800/80', border: 'border-violet-500/30', icon: 'text-violet-300' },
  { bg: 'from-emerald-600/80 to-teal-800/80', border: 'border-emerald-500/30', icon: 'text-emerald-300' },
  { bg: 'from-amber-600/80 to-orange-800/80', border: 'border-amber-500/30', icon: 'text-amber-300' },
  { bg: 'from-sky-600/80 to-blue-800/80', border: 'border-sky-500/30', icon: 'text-sky-300' },
  { bg: 'from-rose-600/80 to-pink-800/80', border: 'border-rose-500/30', icon: 'text-rose-300' },
  { bg: 'from-cyan-600/80 to-indigo-800/80', border: 'border-cyan-500/30', icon: 'text-cyan-300' },
];

const EXAMPLE_DECK_COLOR = { bg: 'from-slate-500/60 to-slate-700/60', border: 'border-slate-400/20', icon: 'text-slate-300' };

// Example deck definitions per area (pick first matching themes)
const EXAMPLE_DECK_CONFIGS: Record<string, { name: string; keywords: string[] }[]> = {
  "Direito Constitucional": [
    { name: "Direitos Fundamentais", keywords: ["direitos fundamentais", "direitos e garantias", "direitos sociais", "direitos individuais", "remédios constitucionais"] },
    { name: "Organização do Estado", keywords: ["organização do estado", "federalismo", "competências", "união", "estados", "municípios", "administração pública"] },
  ],
  "Direito Civil": [
    { name: "Obrigações e Contratos", keywords: ["obrigações", "contratos", "responsabilidade civil"] },
    { name: "Direito das Coisas", keywords: ["posse", "propriedade", "direitos reais"] },
  ],
  "Direito Penal": [
    { name: "Teoria do Crime", keywords: ["crime", "tipicidade", "antijuridicidade", "culpabilidade", "dolo", "culpa"] },
    { name: "Penas e Medidas", keywords: ["penas", "medidas de segurança", "execução penal", "regime"] },
  ],
};

function buildExampleDecks(area: string, availableTemas: { tema: string; totalLacunas: number }[]): LacunaDeck[] {
  const configs = EXAMPLE_DECK_CONFIGS[area];
  if (!configs || !availableTemas?.length) {
    // Fallback: create 2 decks from first available themes with lacunas
    const temasComLacunas = availableTemas?.filter(t => t.totalLacunas > 0) || [];
    if (temasComLacunas.length < 3) return [];
    const mid = Math.ceil(temasComLacunas.length / 2);
    return [
      {
        id: 'example-1',
        name: `${area} - Parte 1`,
        area,
        temas: temasComLacunas.slice(0, Math.min(5, mid)).map(t => t.tema),
        createdAt: new Date().toISOString(),
        isExample: true,
      },
      {
        id: 'example-2',
        name: `${area} - Parte 2`,
        area,
        temas: temasComLacunas.slice(mid, mid + 5).map(t => t.tema),
        createdAt: new Date().toISOString(),
        isExample: true,
      },
    ];
  }

  return configs.map((config, idx) => {
    const matchedTemas = availableTemas
      .filter(t => t.totalLacunas > 0)
      .filter(t => config.keywords.some(kw => t.tema.toLowerCase().includes(kw)))
      .map(t => t.tema)
      .slice(0, 8);

    if (matchedTemas.length < 2) {
      // Fallback: pick some themes with lacunas
      const fallback = availableTemas
        .filter(t => t.totalLacunas > 0)
        .slice(idx * 4, idx * 4 + 5)
        .map(t => t.tema);
      return {
        id: `example-${idx + 1}`,
        name: config.name,
        area,
        temas: fallback,
        createdAt: new Date().toISOString(),
        isExample: true,
      };
    }

    return {
      id: `example-${idx + 1}`,
      name: config.name,
      area,
      temas: matchedTemas,
      createdAt: new Date().toISOString(),
      isExample: true,
    };
  }).filter(d => d.temas.length > 0);
}

const FlashcardsLacunasTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const hex = getAreaHex(area);
  const gradient = getAreaGradient(area);

  const [activeTab, setActiveTab] = useState<TabId>("ordem");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemas, setSelectedTemas] = useState<string[]>([]);
  const [deckName, setDeckName] = useState("");
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [decks, setDecks] = useState<LacunaDeck[]>([]);
  const [showDeckCreator, setShowDeckCreator] = useState(false);
  const [creatorMode, setCreatorMode] = useState<CreatorMode>("manual");
  const [iaDescricao, setIaDescricao] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaResult, setIaResult] = useState<{ nome: string; temas: string[]; feedback: string } | null>(null);
  const [hiddenExampleIds, setHiddenExampleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin) navigate("/flashcards/areas", { replace: true });
  }, [isAdmin, navigate]);

  // Load favoritos from localStorage
  useEffect(() => {
    const key = `lacunas-favoritos-${area}`;
    const stored = localStorage.getItem(key);
    if (stored) setFavoritos(JSON.parse(stored));
  }, [area]);

  // Load decks from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lacunas-decks');
    if (stored) {
      const allDecks: LacunaDeck[] = JSON.parse(stored);
      setDecks(allDecks.filter(d => d.area === area));
    }
  }, [area]);

  const saveFavoritos = (newFavs: string[]) => {
    setFavoritos(newFavs);
    localStorage.setItem(`lacunas-favoritos-${area}`, JSON.stringify(newFavs));
  };

  const toggleFavorito = (tema: string) => {
    const newFavs = favoritos.includes(tema)
      ? favoritos.filter(f => f !== tema)
      : [...favoritos, tema];
    saveFavoritos(newFavs);
  };

  const saveDecks = (allDecks: LacunaDeck[]) => {
    const stored = localStorage.getItem('lacunas-decks');
    const existing: LacunaDeck[] = stored ? JSON.parse(stored) : [];
    const otherArea = existing.filter(d => d.area !== area);
    const merged = [...otherArea, ...allDecks];
    localStorage.setItem('lacunas-decks', JSON.stringify(merged));
    setDecks(allDecks);
  };

  const createDeck = () => {
    if (!deckName.trim() || selectedTemas.length === 0) return;
    const newDeck: LacunaDeck = {
      id: Date.now().toString(),
      name: deckName.trim(),
      area,
      temas: [...selectedTemas],
      createdAt: new Date().toISOString(),
    };
    saveDecks([...decks, newDeck]);
    setDeckName("");
    setSelectedTemas([]);
    setShowDeckCreator(false);
  };

  const createDeckFromIA = () => {
    if (!iaResult) return;
    const newDeck: LacunaDeck = {
      id: Date.now().toString(),
      name: iaResult.nome,
      area,
      temas: [...iaResult.temas],
      createdAt: new Date().toISOString(),
      feedback: iaResult.feedback,
    };
    saveDecks([...decks, newDeck]);
    setIaResult(null);
    setIaDescricao("");
    setShowDeckCreator(false);
    toast.success("Deck criado com sucesso!");
  };

  const handleIACreate = async () => {
    if (!iaDescricao.trim() || !temas?.length) return;
    setIaLoading(true);
    setIaResult(null);

    try {
      const temasDisponiveis = temas
        .filter(t => t.totalLacunas > 0)
        .map(t => t.tema);

      const { data, error } = await supabase.functions.invoke('gerar-deck-ia', {
        body: { area, descricao: iaDescricao.trim(), temasDisponiveis },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setIaResult({
        nome: data.nome,
        temas: data.temas,
        feedback: data.feedback,
      });
    } catch (err: any) {
      toast.error("Erro ao criar deck com IA: " + (err.message || "Tente novamente"));
    } finally {
      setIaLoading(false);
    }
  };

  const deleteDeck = (id: string) => {
    saveDecks(decks.filter(d => d.id !== id));
  };

  const toggleTemaSelection = (tema: string) => {
    setSelectedTemas(prev =>
      prev.includes(tema) ? prev.filter(t => t !== tema) : [...prev, tema]
    );
  };

  const { data: temas, isLoading } = useQuery({
    queryKey: ["lacunas-temas", area],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_lacunas_temas_stats', { p_area: area });
      if (error) throw error;
      return (data || [])
        .filter((row: any) => row.tema && row.tema.trim() !== '')
        .map((row: any) => {
        const totalSubtemas = Number(row.total_subtemas) || 0;
        const subtemasGerados = Number(row.subtemas_gerados) || 0;
        const totalLacunas = Number(row.total_lacunas) || 0;
        const temTodosSubtemas = totalSubtemas > 0 && (subtemasGerados >= totalSubtemas || (totalSubtemas > 1 && subtemasGerados / totalSubtemas >= 0.9));
        return {
          tema: row.tema,
          temFlashcards: temTodosSubtemas,
          parcial: subtemasGerados > 0 && !temTodosSubtemas,
          subtemasGerados,
          totalSubtemas,
          totalLacunas,
          progressoPercent: totalSubtemas > 0 ? Math.round((subtemasGerados / totalSubtemas) * 100) : 0,
        };
      });
    },
    enabled: !!area,
    refetchInterval: (query) => {
      const temPendentes = query.state.data?.some((t: any) => !t.temFlashcards);
      return temPendentes ? 6000 : false;
    }
  });

  const queryClient = useQueryClient();
  const handleProgress = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["lacunas-temas", area] });
  }, [queryClient, area]);

  const { isGenerating, currentTema, geradosCount } = useFlashcardsLacunasAutoGeneration({
    area,
    temas,
    enabled: !!area && !isLoading && (temas?.some(t => !t.temFlashcards) || false),
    onProgress: handleProgress
  });

  const totalLacunas = temas?.reduce((acc, t) => acc + t.totalLacunas, 0) || 0;

  // Example decks (shown when no user decks exist)
  const exampleDecks = useMemo(() => {
    if (decks.length > 0 || !temas?.length) return [];
    return buildExampleDecks(area, temas).filter(d => !hiddenExampleIds.includes(d.id));
  }, [decks.length, temas, area, hiddenExampleIds]);

  const deleteExampleDeck = (id: string) => {
    setHiddenExampleIds(prev => [...prev, id]);
  };

  const filteredTemas = useMemo(() => {
    if (!temas) return [];
    if (activeTab === "favoritos") return temas.filter(t => favoritos.includes(t.tema));
    if (activeTab === "pesquisar" && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return temas.filter(t => t.tema.toLowerCase().includes(q));
    }
    return temas;
  }, [temas, activeTab, favoritos, searchQuery]);

  const navigateToStudy = (tema: string) => {
    navigate(`/flashcards/lacunas/estudar?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}`);
  };

  const navigateToDeckStudy = (deck: LacunaDeck) => {
    const temasParam = deck.temas.map(t => encodeURIComponent(t)).join(',');
    navigate(`/flashcards/lacunas/estudar?area=${encodeURIComponent(area)}&temas=${temasParam}`);
  };

  const renderTemaItem = (t: any, idx: number, showFavorite = true, showCheckbox = false) => (
    <div
      key={t.tema}
      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border animate-fade-in bg-card hover:bg-card/80 border-border min-h-[72px]"
      style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}
    >
      {showCheckbox && (
        <button
          onClick={() => toggleTemaSelection(t.tema)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
            selectedTemas.includes(t.tema)
              ? 'border-red-500 bg-red-500 text-white'
              : 'border-muted-foreground/30 hover:border-red-400'
          }`}
        >
          {selectedTemas.includes(t.tema) && <span className="text-xs">✓</span>}
        </button>
      )}
      <button
        onClick={() => t.totalLacunas > 0 && !showCheckbox ? navigateToStudy(t.tema) : showCheckbox ? toggleTemaSelection(t.tema) : undefined}
        disabled={t.totalLacunas === 0 && !showCheckbox}
        className={`flex-1 flex items-center gap-3 ${t.totalLacunas === 0 && !showCheckbox ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-red-500/20">
          {t.temFlashcards ? (
            <PenLine className="w-5 h-5 text-red-400" />
          ) : t.parcial ? (
            <Loader2 className="w-5 h-5 animate-spin text-red-400" />
          ) : (
            <PenLine className="w-5 h-5 text-red-400/50" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground text-left line-clamp-2">{t.tema}</p>
          <p className="text-xs text-muted-foreground text-left">
            {t.totalLacunas > 0 ? `${t.totalLacunas} lacunas` : t.parcial ? `${t.progressoPercent}% gerado` : 'Pendente'}
          </p>
        </div>
      </button>
      {showFavorite && !showCheckbox && (
        <button onClick={() => toggleFavorito(t.tema)} className="p-1.5 shrink-0">
          <Heart className={`w-4 h-4 transition-colors ${favoritos.includes(t.tema) ? 'fill-red-500 text-red-500' : 'text-muted-foreground/40 hover:text-red-400'}`} />
        </button>
      )}
      {t.totalLacunas > 0 && !showCheckbox && (
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
    </div>
  );

  const renderDeckCard = (deck: LacunaDeck, idx: number) => {
    const isExample = deck.isExample;
    const color = isExample ? EXAMPLE_DECK_COLOR : DECK_COLORS[idx % DECK_COLORS.length];
    return (
      <div
        key={deck.id}
        className={`relative rounded-xl border ${color.border} bg-gradient-to-br ${color.bg} p-4 flex flex-col gap-3 animate-fade-in shadow-lg overflow-hidden group`}
        style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'backwards' }}
      >
        {/* Decorative brain icon */}
        <div className="absolute -right-2 -top-2 opacity-10">
          <Brain className="w-16 h-16 text-white" />
        </div>

        {isExample && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/70 font-medium">Exemplo</span>
          </div>
        )}

        <div className="relative z-10 flex-1">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center mb-2">
            <Brain className={`w-5 h-5 ${color.icon}`} />
          </div>
          <p className="text-sm font-bold text-white leading-tight line-clamp-2">{deck.name}</p>
          <p className="text-[11px] text-white/60 mt-1">{deck.temas.length} {deck.temas.length === 1 ? 'tema' : 'temas'}</p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={() => navigateToDeckStudy(deck)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-medium"
          >
            <Play className="w-3.5 h-3.5" />
            Estudar
          </button>
          <button
            onClick={() => isExample ? deleteExampleDeck(deck.id) : deleteDeck(deck.id)}
            className="p-2 rounded-lg hover:bg-white/15 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-white/50 hover:text-white/80" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className={`bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <PenLine className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 pt-6 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            <button onClick={() => navigate("/flashcards/lacunas")} className="mb-3 flex items-center gap-1 text-white/60 text-sm hover:text-white/80 transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
            </button>
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <PenLine className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1">{area}</h1>
                <p className="text-sm text-white/70 mt-0.5">Flashcards de Lacunas • Escolha um tema</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation indicator */}
      {isGenerating && (
        <div className="px-4 py-2">
          <div className="max-w-lg mx-auto flex items-center gap-3 rounded-xl px-4 py-3 border"
            style={{ backgroundColor: `${hex}15`, borderColor: `${hex}30` }}
          >
            <Zap className="w-5 h-5" style={{ color: hex }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: hex }}>Gerando lacunas automaticamente...</p>
              <p className="text-xs truncate" style={{ color: `${hex}99` }}>
                {currentTema ? `Tema: ${currentTema}` : 'Iniciando...'} • {geradosCount} gerados
              </p>
            </div>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: hex }} />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: hex }} />
            <span>{temas?.length || 0} temas</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: hex }} />
            <span>{totalLacunas.toLocaleString('pt-BR')} lacunas</span>
          </div>
        </div>
      </div>

      {/* Tab Menu */}
      <div className="px-4 pb-4">
        <div className="flex bg-muted/50 rounded-xl p-1 gap-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'decks') setShowDeckCreator(false); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                  isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 space-y-2 max-w-lg mx-auto">
        {/* Search input for pesquisar tab */}
        {activeTab === "pesquisar" && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tema..."
              className="pl-9 bg-card border-border"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Decks tab */}
        {activeTab === "decks" && (
          <div className="space-y-5 mb-4">
            {/* Create deck button */}
            {!showDeckCreator && !iaResult && (
              <button
                onClick={() => { setShowDeckCreator(true); setCreatorMode("manual"); setIaResult(null); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Criar meu Deck</span>
              </button>
            )}

            {/* Deck creator - slides up */}
            {showDeckCreator && !iaResult && (
              <div 
                className="rounded-xl bg-card border border-border p-4 space-y-3"
                style={{ animation: 'slide-up-deck 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Novo Deck
                  </h3>
                  <button onClick={() => { setShowDeckCreator(false); setSelectedTemas([]); setDeckName(''); setIaDescricao(''); }} className="p-1 rounded-full hover:bg-muted transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Toggle Manual / IA */}
                <div className="flex bg-muted/60 rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => setCreatorMode("manual")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                      creatorMode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Manual
                  </button>
                  <button
                    onClick={() => setCreatorMode("ia")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                      creatorMode === "ia" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Com IA ✨
                  </button>
                </div>

                {/* Manual mode */}
                {creatorMode === "manual" && (
                  <>
                    <Input
                      value={deckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      placeholder="Nome do deck..."
                      className="bg-background border-border"
                      autoFocus
                    />
                    {selectedTemas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTemas.map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 flex items-center gap-1">
                            {t}
                            <button onClick={() => toggleTemaSelection(t)}><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="rounded-lg border border-border bg-background/50 divide-y divide-border pb-16">
                      {temas?.map((t, idx) => (
                        <button
                          key={t.tema}
                          onClick={() => toggleTemaSelection(t.tema)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                          style={{ animation: `slide-up-deck 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 20}ms backwards` }}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                            selectedTemas.includes(t.tema)
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-muted-foreground/30'
                          }`}>
                            {selectedTemas.includes(t.tema) && <span className="text-xs">✓</span>}
                          </div>
                          <span className="text-sm text-foreground flex-1">{t.tema}</span>
                          <span className="text-[10px] text-muted-foreground">{t.totalLacunas}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* IA mode */}
                {creatorMode === "ia" && (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        📝 Descreva sua prova ou objetivo de estudo. A IA vai selecionar os temas mais relevantes para você.
                      </p>
                      <Textarea
                        value={iaDescricao}
                        onChange={(e) => setIaDescricao(e.target.value)}
                        placeholder='Ex: "Prova OAB 2ª fase, foco em controle de constitucionalidade e direitos fundamentais"'
                        className="bg-background border-border min-h-[80px] text-sm resize-none"
                        autoFocus
                      />
                    </div>

                    {iaLoading ? (
                      <div className="flex flex-col items-center py-6 gap-3">
                        <div className="relative">
                          <Wand2 className="w-8 h-8 text-primary animate-pulse" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-ping" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">Analisando conteúdo...</p>
                          <p className="text-xs text-muted-foreground mt-1">A IA está selecionando os melhores temas</p>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleIACreate}
                        disabled={!iaDescricao.trim() || iaLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        size="sm"
                      >
                        <Wand2 className="w-4 h-4 mr-1" />
                        Criar com IA ✨
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* IA Result card */}
            {iaResult && (
              <div
                className="rounded-xl bg-card border border-primary/30 p-5 space-y-4"
                style={{ animation: 'slide-up-deck 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">✅ Deck criado!</p>
                  </div>
                  <button onClick={() => { setIaResult(null); setShowDeckCreator(false); }} className="ml-auto p-1 rounded-full hover:bg-muted">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div>
                  <p className="text-base font-semibold text-foreground">"{iaResult.nome}"</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{iaResult.temas.length} temas selecionados</p>
                </div>

                {/* Feedback from IA */}
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    💬 {iaResult.feedback}
                  </p>
                </div>

                {/* Selected themes preview */}
                <div className="flex flex-wrap gap-1.5">
                  {iaResult.temas.slice(0, 6).map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                      {t}
                    </span>
                  ))}
                  {iaResult.temas.length > 6 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      +{iaResult.temas.length - 6} mais
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={createDeckFromIA}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Salvar e Estudar
                  </Button>
                  <Button
                    onClick={() => { setIaResult(null); setShowDeckCreator(true); }}
                    variant="outline"
                    size="sm"
                    className="border-border"
                  >
                    Refazer
                  </Button>
                </div>
              </div>
            )}

            {/* Saved decks as 2-column cards */}
            {decks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Decks salvos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {decks.map((deck, idx) => renderDeckCard(deck, idx))}
                </div>
              </div>
            )}

            {/* Example decks */}
            {exampleDecks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Decks de exemplo</h3>
                <div className="grid grid-cols-2 gap-3">
                  {exampleDecks.map((deck, idx) => renderDeckCard(deck, idx))}
                </div>
              </div>
            )}

            {decks.length === 0 && exampleDecks.length === 0 && !showDeckCreator && !iaResult && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum deck criado ainda</p>
                <p className="text-xs mt-1">Crie seu primeiro deck personalizado!</p>
              </div>
            )}
          </div>
        )}

        {/* Tema list - hide when decks tab is active */}
        {activeTab !== "decks" && (
          isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-card/50 animate-pulse" />
            ))
          ) : filteredTemas && filteredTemas.length > 0 ? (
            filteredTemas.map((t, idx) =>
              renderTemaItem(t, idx, true, false)
            )
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              {activeTab === "favoritos" ? "Nenhum tema favoritado" : activeTab === "pesquisar" ? "Nenhum tema encontrado" : "Nenhum tema encontrado"}
            </div>
          )
        )}
      </div>

      {/* CSS for slide-up animation */}
      <style>{`
        @keyframes slide-up-deck {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Floating create deck button */}
      {showDeckCreator && creatorMode === "manual" && activeTab === "decks" && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 z-[100] bg-background border-t border-border" style={{ pointerEvents: 'auto' }}>
          <div className="max-w-lg mx-auto">
            <Button
              onClick={createDeck}
              disabled={!deckName.trim() || selectedTemas.length === 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white shadow-2xl h-12 text-sm font-semibold"
              size="lg"
            >
              <Layers className="w-4 h-4 mr-2" />
              Criar Deck ({selectedTemas.length} {selectedTemas.length === 1 ? 'tema' : 'temas'})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardsLacunasTemas;
