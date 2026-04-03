import { useCallback, useEffect, useState, useMemo, startTransition } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight, Loader2, Zap, Heart, Search,
  Layers, ListOrdered, X, Trash2, Play, Brain, Sparkles, Plus, FileText, BookOpen, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { useQuestoesCorrespondenciaTemas } from "@/hooks/useQuestoesCorrespondenciaTemas";
import { useCorrespondenciaAutoGeneration } from "@/hooks/useCorrespondenciaAutoGeneration";

interface CorrespDeck {
  id: string;
  name: string;
  area: string;
  temas: string[];
  createdAt: string;
}

const TABS = [
  { id: "ordem" as const, label: "Ordem", icon: ListOrdered },
  { id: "decks" as const, label: "Decks", icon: Layers },
  { id: "favoritos" as const, label: "Favoritos", icon: Heart },
  { id: "pesquisar" as const, label: "Pesquisar", icon: Search },
];

type TabId = "ordem" | "decks" | "favoritos" | "pesquisar";

const DECK_COLORS = [
  { bg: 'from-violet-600/80 to-purple-800/80', border: 'border-violet-500/30', icon: 'text-violet-300' },
  { bg: 'from-emerald-600/80 to-teal-800/80', border: 'border-emerald-500/30', icon: 'text-emerald-300' },
  { bg: 'from-amber-600/80 to-orange-800/80', border: 'border-amber-500/30', icon: 'text-amber-300' },
  { bg: 'from-sky-600/80 to-blue-800/80', border: 'border-sky-500/30', icon: 'text-sky-300' },
  { bg: 'from-rose-600/80 to-pink-800/80', border: 'border-rose-500/30', icon: 'text-rose-300' },
  { bg: 'from-cyan-600/80 to-indigo-800/80', border: 'border-cyan-500/30', icon: 'text-cyan-300' },
];

const QuestoesCorrespondenciaTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const { temas, isLoading, refresh } = useQuestoesCorrespondenciaTemas(area);

  const [activeTab, setActiveTab] = useState<TabId>("ordem");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemas, setSelectedTemas] = useState<string[]>([]);
  const [deckName, setDeckName] = useState("");
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [decks, setDecks] = useState<CorrespDeck[]>([]);
  const [showDeckCreator, setShowDeckCreator] = useState(false);

  const handleProgress = useCallback(() => { refresh(); }, [refresh]);

  const { isGenerating, currentTema, geradosCount } = useCorrespondenciaAutoGeneration({
    area,
    temas,
    enabled: !!area && !isLoading && temas.some((t) => !t.temQuestoes),
    onProgress: handleProgress,
  });

  useEffect(() => {
    if (user && !isAdmin) navigate("/ferramentas/questoes", { replace: true });
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    const key = `corresp-favoritos-${area}`;
    const stored = localStorage.getItem(key);
    if (stored) setFavoritos(JSON.parse(stored));
  }, [area]);

  useEffect(() => {
    const stored = localStorage.getItem('corresp-decks');
    if (stored) {
      const allDecks: CorrespDeck[] = JSON.parse(stored);
      setDecks(allDecks.filter(d => d.area === area));
    }
  }, [area]);

  const saveFavoritos = (newFavs: string[]) => {
    setFavoritos(newFavs);
    localStorage.setItem(`corresp-favoritos-${area}`, JSON.stringify(newFavs));
  };

  const toggleFavorito = (tema: string) => {
    const newFavs = favoritos.includes(tema) ? favoritos.filter(f => f !== tema) : [...favoritos, tema];
    saveFavoritos(newFavs);
  };

  const saveDecks = (allDecks: CorrespDeck[]) => {
    const stored = localStorage.getItem('corresp-decks');
    const existing: CorrespDeck[] = stored ? JSON.parse(stored) : [];
    const otherArea = existing.filter(d => d.area !== area);
    const merged = [...otherArea, ...allDecks];
    localStorage.setItem('corresp-decks', JSON.stringify(merged));
    setDecks(allDecks);
  };

  const createDeck = () => {
    if (!deckName.trim() || selectedTemas.length === 0) return;
    const newDeck: CorrespDeck = {
      id: Date.now().toString(), name: deckName.trim(), area, temas: [...selectedTemas], createdAt: new Date().toISOString(),
    };
    saveDecks([...decks, newDeck]);
    setDeckName(""); setSelectedTemas([]); setShowDeckCreator(false);
  };

  const deleteDeck = (id: string) => { saveDecks(decks.filter(d => d.id !== id)); };

  const toggleTemaSelection = (tema: string) => {
    setSelectedTemas(prev => prev.includes(tema) ? prev.filter(t => t !== tema) : [...prev, tema]);
  };

  const totalPares = temas.reduce((acc, t) => acc + Math.max(t.totalQuestoes, t.subtemasGerados * 5), 0);

  const filteredTemas = useMemo(() => {
    if (activeTab === "favoritos") return temas.filter(t => favoritos.includes(t.tema));
    if (activeTab === "pesquisar" && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return temas.filter(t => t.tema.toLowerCase().includes(q));
    }
    return temas;
  }, [temas, activeTab, favoritos, searchQuery]);

  const navigateToResolver = (tema: string) => {
    startTransition(() => {
      navigate(`/ferramentas/questoes/correspondencia/resolver?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}`);
    });
  };

  const navigateToDeckStudy = (deck: CorrespDeck) => {
    const temasParam = deck.temas.map(t => encodeURIComponent(t)).join(',');
    startTransition(() => {
      navigate(`/ferramentas/questoes/correspondencia/resolver?area=${encodeURIComponent(area)}&temas=${temasParam}`);
    });
  };

  const getTotalPares = (t: typeof temas[0]) => Math.max(t.totalQuestoes, t.subtemasGerados * 5);

  const renderTemaItem = (t: typeof temas[0], idx: number) => {
    const total = getTotalPares(t);
    return (
      <div
        key={t.tema}
        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all min-h-[72px] animate-fade-in"
        style={{
          background: "hsl(0 0% 18%)",
          border: "1px solid hsl(0 0% 22%)",
          animationDelay: `${idx * 30}ms`,
          animationFillMode: 'backwards',
        }}
      >
        <button
          onClick={() => total > 0 ? navigateToResolver(t.tema) : undefined}
          disabled={total === 0}
          className={`flex-1 flex items-center gap-3 ${total === 0 ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(230 60% 42%), hsl(240 55% 32%))",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
            }}
          >
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-normal text-white line-clamp-2">{t.tema}</p>
            <p className="text-[11px] text-white/40 text-left">
              {total > 0 ? `${total} pares` : t.parcial ? `${t.progressoPercent}% gerado` : 'Pendente'}
            </p>
          </div>
        </button>
        <button onClick={() => toggleFavorito(t.tema)} className="p-1.5 shrink-0">
          <Heart className={`w-4 h-4 transition-colors ${favoritos.includes(t.tema) ? 'fill-indigo-500 text-indigo-500' : 'text-white/20 hover:text-indigo-400'}`} />
        </button>
        {total > 0 && (
          <div className="shrink-0 rounded-lg p-1">
            <ChevronRight className="w-5 h-5 text-white/50" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "hsl(0 0% 13%)" }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(230 60% 35%), hsl(240 55% 25%))" }}>
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Link2 className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 pt-6 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            <button onClick={() => navigate("/ferramentas/questoes/correspondencia")} className="mb-3 flex items-center gap-1 text-white/60 text-sm hover:text-white/80 transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
            </button>
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Link2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1">{area}</h1>
                <p className="text-sm text-white/70 mt-0.5">Correspondência • Escolha um tema</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation banner */}
      {isGenerating && (
        <div className="px-4 py-2">
          <div
            className="max-w-lg mx-auto flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: "linear-gradient(135deg, hsl(230 60% 42% / 0.2), hsl(240 55% 32% / 0.15))",
              border: "1px solid hsl(230 60% 42% / 0.3)",
            }}
          >
            <Zap className="w-5 h-5 text-indigo-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-indigo-300">Gerando pares automaticamente...</p>
              <p className="text-xs truncate text-indigo-300/60">
                {currentTema ? `Tema: ${currentTema}` : "Iniciando..."} • {geradosCount} gerados
              </p>
            </div>
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-6 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>{temas.length} temas</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>{totalPares.toLocaleString('pt-BR')} pares</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pb-4">
        <div className="flex rounded-xl p-1 gap-0.5" style={{ background: "hsl(0 0% 16%)" }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'decks') setShowDeckCreator(false); }}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                  isActive ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 space-y-2.5 max-w-lg mx-auto">
        {/* Search input */}
        {activeTab === "pesquisar" && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tema..."
              className="pl-9 bg-[hsl(0_0%_18%)] border-[hsl(0_0%_22%)] text-white placeholder:text-white/30"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-white/40" />
              </button>
            )}
          </div>
        )}

        {/* Decks tab */}
        {activeTab === "decks" && (
          <div className="space-y-5 mb-4">
            {!showDeckCreator && (
              <button
                onClick={() => setShowDeckCreator(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-white/15 hover:border-indigo-400/40 text-white/40 hover:text-white/70 transition-all active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Criar meu Deck</span>
              </button>
            )}

            {showDeckCreator && (
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: "hsl(0 0% 18%)",
                  border: "1px solid hsl(0 0% 22%)",
                  animation: 'slide-up-deck 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Novo Deck
                  </h3>
                  <button onClick={() => { setShowDeckCreator(false); setSelectedTemas([]); setDeckName(''); }} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>
                <Input
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Nome do deck..."
                  className="bg-[hsl(0_0%_15%)] border-[hsl(0_0%_22%)] text-white placeholder:text-white/30"
                  autoFocus
                />
                {selectedTemas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemas.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center gap-1">
                        {t}
                        <button onClick={() => toggleTemaSelection(t)}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto rounded-lg divide-y divide-white/5" style={{ background: "hsl(0 0% 15%)", border: "1px solid hsl(0 0% 20%)" }}>
                  {temas.map((t, idx) => (
                    <button
                      key={t.tema}
                      onClick={() => toggleTemaSelection(t.tema)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                      style={{ animation: `slide-up-deck 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 20}ms backwards` }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        selectedTemas.includes(t.tema)
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-white/20'
                      }`}>
                        {selectedTemas.includes(t.tema) && <span className="text-xs">✓</span>}
                      </div>
                      <span className="text-sm text-white flex-1">{t.tema}</span>
                      <span className="text-[10px] text-white/30">{getTotalPares(t)}</span>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={createDeck}
                  disabled={!deckName.trim() || selectedTemas.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  size="sm"
                >
                  <Layers className="w-4 h-4 mr-1" />
                  Criar Deck ({selectedTemas.length} {selectedTemas.length === 1 ? 'tema' : 'temas'})
                </Button>
              </div>
            )}

            {/* Saved decks */}
            {decks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-white/30 uppercase tracking-wide">Decks salvos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {decks.map((deck, idx) => {
                    const color = DECK_COLORS[idx % DECK_COLORS.length];
                    return (
                      <div
                        key={deck.id}
                        className={`relative rounded-xl border ${color.border} bg-gradient-to-br ${color.bg} p-4 flex flex-col gap-3 animate-fade-in shadow-lg overflow-hidden group`}
                        style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'backwards' }}
                      >
                        <div className="absolute -right-2 -top-2 opacity-10">
                          <Brain className="w-16 h-16 text-white" />
                        </div>
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
                            Resolver
                          </button>
                          <button
                            onClick={() => deleteDeck(deck.id)}
                            className="p-2 rounded-lg hover:bg-white/15 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-white/50 hover:text-white/80" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {decks.length === 0 && !showDeckCreator && (
              <div className="text-center py-8 text-white/30">
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum deck criado ainda</p>
                <p className="text-xs mt-1">Crie seu primeiro deck personalizado!</p>
              </div>
            )}
          </div>
        )}

        {/* Tema list */}
        {activeTab !== "decks" && (
          isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl animate-pulse" style={{ background: "hsl(0 0% 18%)" }} />
            ))
          ) : filteredTemas.length > 0 ? (
            filteredTemas.map((t, idx) => renderTemaItem(t, idx))
          ) : (
            <div className="text-center py-16 text-white/30">
              {activeTab === "favoritos" ? "Nenhum tema favoritado" : activeTab === "pesquisar" ? "Nenhum tema encontrado" : "Nenhum tema encontrado para esta área."}
            </div>
          )
        )}
      </div>

      <style>{`
        @keyframes slide-up-deck {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default QuestoesCorrespondenciaTemas;
