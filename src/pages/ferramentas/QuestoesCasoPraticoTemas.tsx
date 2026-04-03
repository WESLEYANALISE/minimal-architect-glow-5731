import { useCallback, useEffect, useState, useMemo, startTransition } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, Loader2, Zap, Target, Heart, Search,
  ListOrdered, X, Briefcase, FileText, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { useQuestoesCasoPraticoTemas } from "@/hooks/useQuestoesCasoPraticoTemas";
import { useQuestoesCasoPraticoAutoGeneration } from "@/hooks/useQuestoesCasoPraticoAutoGeneration";

const TABS = [
  { id: "ordem" as const, label: "Ordem", icon: ListOrdered },
  { id: "favoritos" as const, label: "Favoritos", icon: Heart },
  { id: "pesquisar" as const, label: "Pesquisar", icon: Search },
];

type TabId = "ordem" | "favoritos" | "pesquisar";

const QuestoesCasoPraticoTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const { temas, isLoading, refresh } = useQuestoesCasoPraticoTemas(area);
  const [activeTab, setActiveTab] = useState<TabId>("ordem");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoritos, setFavoritos] = useState<string[]>([]);

  const handleProgress = useCallback(() => { refresh(); }, [refresh]);

  const { isGenerating, currentTema, geradosCount } = useQuestoesCasoPraticoAutoGeneration({
    area,
    temas,
    enabled: !!area && !isLoading && temas.some((t) => !t.temQuestoes),
    onProgress: handleProgress,
  });

  useEffect(() => {
    if (user && !isAdmin) navigate("/ferramentas/questoes", { replace: true });
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    const key = `caso-pratico-favoritos-${area}`;
    const stored = localStorage.getItem(key);
    if (stored) setFavoritos(JSON.parse(stored));
  }, [area]);

  const saveFavoritos = (newFavs: string[]) => {
    setFavoritos(newFavs);
    localStorage.setItem(`caso-pratico-favoritos-${area}`, JSON.stringify(newFavs));
  };

  const toggleFavorito = (tema: string) => {
    const newFavs = favoritos.includes(tema) ? favoritos.filter(f => f !== tema) : [...favoritos, tema];
    saveFavoritos(newFavs);
  };

  const totalQuestoesGeral = temas.reduce((acc, t) => acc + Math.max(t.totalQuestoes, t.subtemasGerados * 5), 0);

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
      navigate(`/ferramentas/questoes/caso-pratico/resolver?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}`);
    });
  };

  const getTotalQuestoes = (t: typeof temas[0]) => Math.max(t.totalQuestoes, t.subtemasGerados * 5);

  const renderTemaItem = (t: typeof temas[0], idx: number) => {
    const total = getTotalQuestoes(t);
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
              background: "linear-gradient(135deg, hsl(220 65% 50%), hsl(240 55% 40%))",
              boxShadow: "0 4px 12px rgba(60, 60, 200, 0.3)",
            }}
          >
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-normal text-white line-clamp-2">{t.tema}</p>
            <p className="text-[11px] text-white/40 text-left">
              {total > 0 ? `${total} casos` : t.parcial ? `${t.progressoPercent}% gerado` : 'Pendente'}
            </p>
          </div>
        </button>
        <button onClick={() => toggleFavorito(t.tema)} className="p-1.5 shrink-0">
          <Heart className={`w-4 h-4 transition-colors ${favoritos.includes(t.tema) ? 'fill-red-500 text-red-500' : 'text-white/20 hover:text-red-400'}`} />
        </button>
        {total > 0 && (
          <div className="shrink-0 shine-effect rounded-lg p-1">
            <ChevronRight className="w-5 h-5 text-white/50" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "hsl(0 0% 13%)" }}>
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-b-2xl"
        style={{
          background: "linear-gradient(145deg, hsl(220 65% 48%), hsl(240 55% 35%), hsl(250 40% 25%))",
          boxShadow: "0 8px 32px hsla(230, 65%, 35%, 0.4)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsla(220, 70%, 60%, 0.6), transparent)" }} />
        <div className="absolute -right-4 -bottom-4 opacity-[0.07]">
          <Briefcase style={{ width: 100, height: 100 }} className="text-white" />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(115deg, transparent 30%, hsla(0,0%,100%,0.06) 45%, transparent 55%)" }} />

        <div className="relative z-10 pt-4 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            <button onClick={() => navigate("/ferramentas/questoes/caso-pratico")} className="mb-3 flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="flex items-center gap-4 animate-fade-in">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm"
                style={{ background: "hsla(230, 50%, 45%, 0.4)", border: "1px solid hsla(230, 50%, 55%, 0.3)" }}
              >
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1">{area}</h1>
                <p className="text-sm text-white/70 mt-0.5">Caso Prático • Escolha um tema</p>
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
              background: "linear-gradient(135deg, hsl(220 65% 48% / 0.2), hsl(240 55% 35% / 0.15))",
              border: "1px solid hsl(220 65% 48% / 0.3)",
            }}
          >
            <Zap className="w-5 h-5 text-blue-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-400">Gerando casos práticos...</p>
              <p className="text-xs truncate text-blue-400/60">
                {currentTema ? `Tema: ${currentTema}` : "Iniciando..."} • {geradosCount} gerados
              </p>
            </div>
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-400" />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-6 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>{temas.length} temas</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>{totalQuestoesGeral.toLocaleString('pt-BR')} casos</span>
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
                onClick={() => setActiveTab(tab.id)}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : filteredTemas.length === 0 ? (
          <p className="text-center text-sm text-white/40 py-8">
            {activeTab === "favoritos" ? "Nenhum favorito salvo" : activeTab === "pesquisar" ? "Nenhum tema encontrado" : "Nenhum tema disponível"}
          </p>
        ) : (
          filteredTemas.map((t, idx) => renderTemaItem(t, idx))
        )}
      </div>
    </div>
  );
};

export default QuestoesCasoPraticoTemas;
