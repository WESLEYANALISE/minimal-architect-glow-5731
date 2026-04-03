import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowLeft, Loader2, Scale, Footprints, Search, X, ListOrdered, Heart, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import { SerpentineNiveis } from "@/components/shared/SerpentineNiveis";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import PremiumFloatingCard from "@/components/PremiumFloatingCard";

const SCROLL_KEY = "area-trilha-scroll";

// Favoritos helpers (localStorage)
const getFavoritosKey = (area: string) => `aulas-favoritos-${area}`;
const getFavoritos = (area: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(getFavoritosKey(area)) || "[]");
  } catch { return []; }
};
const toggleFavorito = (area: string, id: string) => {
  const favs = getFavoritos(area);
  const updated = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
  localStorage.setItem(getFavoritosKey(area), JSON.stringify(updated));
  return updated;
};

const AreaTrilhaPage = () => {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const decodedArea = decodeURIComponent(area || "");
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const { isInTrial } = useTrialStatus();
  const hasFullAccess = isPremium || isInTrial;
  const [activeTab, setActiveTab] = useState<"aulas" | "favoritos" | "pesquisar">("aulas");
  const [favoritos, setFavoritos] = useState<string[]>(() => getFavoritos(decodedArea));
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showPremiumCard, setShowPremiumCard] = useState(false);

  // Restaurar scroll
  useEffect(() => {
    const saved = sessionStorage.getItem(`${SCROLL_KEY}-${decodedArea}`);
    if (saved) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(saved));
        sessionStorage.removeItem(`${SCROLL_KEY}-${decodedArea}`);
      }, 100);
    }
  }, [decodedArea]);

  // Back to top visibility
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const navigateWithScroll = (path: string) => {
    sessionStorage.setItem(`${SCROLL_KEY}-${decodedArea}`, window.scrollY.toString());
    navigate(path);
  };

  const handleToggleFavorito = useCallback((id: string) => {
    setFavoritos(toggleFavorito(decodedArea, id));
  }, [decodedArea]);

  // Buscar livros (matérias) desta área
  const { data: livros, isLoading } = useQuery({
    queryKey: ["area-trilha-livros", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .select("*")
        .eq("Área", decodedArea)
        .order("Ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Buscar contagem de tópicos por matéria
  const { data: topicosCount } = useQuery({
    queryKey: ["area-trilha-topicos-count", decodedArea],
    queryFn: async () => {
      const { data: materias } = await supabase
        .from("categorias_materias")
        .select("id, nome")
        .eq("categoria", decodedArea);
      if (!materias || materias.length === 0) return {};
      
      const materiaIds = materias.map(m => m.id);
      const { data: topicos } = await supabase
        .from("categorias_topicos")
        .select("materia_id")
        .in("materia_id", materiaIds);
      
      const countById: Record<number, number> = {};
      topicos?.forEach(t => {
        countById[t.materia_id] = (countById[t.materia_id] || 0) + 1;
      });
      
      const counts: Record<string, number> = {};
      materias.forEach(m => {
        counts[m.nome] = countById[m.id] || 0;
      });
      return counts;
    },
    enabled: !!decodedArea,
    staleTime: 1000 * 30,
  });

  const totalMaterias = livros?.length || 0;
  const totalTopicos = Object.values(topicosCount || {}).reduce((a, b) => a + b, 0);

  // First module item count (same logic as SerpentineNiveis: TOTAL_NIVEIS=10)
  const firstModuleCount = useMemo(() => {
    if (!livros || livros.length === 0) return 0;
    return Math.ceil(livros.length / 10);
  }, [livros]);

  const filteredLivros = useMemo(() => {
    if (!livros) return [];
    
    if (activeTab === "favoritos") {
      return livros.filter(l => favoritos.includes(String(l.id)));
    }
    
    if (activeTab === "pesquisar" && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      return livros.filter(l => (l.Tema || "").toLowerCase().includes(term));
    }
    
    return livros;
  }, [livros, activeTab, favoritos, searchTerm]);

  const emptyMessage = activeTab === "favoritos"
    ? "Nenhuma matéria favoritada ainda. Toque no ♥ para favoritar."
    : activeTab === "pesquisar" && searchTerm.trim()
      ? "Nenhuma matéria encontrada para essa busca."
      : "Nenhuma matéria encontrada.";

  return (
    <div className="min-h-screen relative overflow-hidden">
      <InstantBackground
        src={bgAreasOab}
        alt="Áreas"
        blurCategory="oab"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate("/aulas/areas")}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Scale className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                    {decodedArea}
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    {totalMaterias} matérias · {totalTopicos} aulas
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>{totalMaterias} matérias</span>
            </div>
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-yellow-400" />
              <span>{totalTopicos} aulas</span>
            </div>
          </div>
        </div>

        {/* Tab switcher: Aulas / Favoritos / Pesquisar */}
        <div className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("aulas")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "aulas"
                  ? "text-white shadow-md bg-red-500/40"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              Aulas
            </button>
            <button
              onClick={() => setActiveTab("favoritos")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "favoritos"
                  ? "text-white shadow-md bg-red-500/40"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <Heart className="w-4 h-4" />
              Favoritos {favoritos.length > 0 && `(${favoritos.length})`}
            </button>
            <button
              onClick={() => setActiveTab("pesquisar")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "pesquisar"
                  ? "text-white shadow-md bg-red-500/40"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <Search className="w-4 h-4" />
              Pesquisar
            </button>
          </div>
        </div>

        {/* Search input (only when pesquisar tab active) */}
        {activeTab === "pesquisar" && (
          <div className="px-4 pb-3 animate-fade-in">
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar matéria..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-sm"
                autoFocus
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Serpentine */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : filteredLivros.length > 0 ? (
          <SerpentineNiveis
            items={filteredLivros}
            getItemCapa={(item) => item["Capa-livro"]}
            getItemTitulo={(item) => item["Tema"] || "Sem título"}
            getItemOrdem={(item) => item["Ordem"] || 0}
            getItemAulas={(item) => (topicosCount || {})[item["Tema"]] || 0}
            getItemProgresso={() => 0}
            onItemClick={(item) => {
              const idx = livros?.findIndex(l => l.id === item.id) ?? 0;
              if (!hasFullAccess && idx >= firstModuleCount) {
                setShowPremiumCard(true);
                return;
              }
              navigateWithScroll(`/aulas/area/${encodeURIComponent(decodedArea)}/materia/${item.id}`);
            }}
            isItemLocked={!hasFullAccess ? (item) => {
              const idx = livros?.findIndex(l => l.id === item.id) ?? 0;
              return idx >= firstModuleCount;
            } : undefined}
            favoritos={favoritos}
            onToggleFavorito={handleToggleFavorito}
            getItemFavoritoId={(item) => String(item.id)}
          />
        ) : (
          <div className="text-center py-16 text-white/50 text-sm">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 left-4 z-50 w-11 h-11 rounded-full bg-red-500/80 flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 animate-fade-in"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </button>
      )}

      {showPremiumCard && (
        <PremiumFloatingCard isOpen={showPremiumCard} onClose={() => setShowPremiumCard(false)} />
      )}
    </div>
  );
};

export default AreaTrilhaPage;
