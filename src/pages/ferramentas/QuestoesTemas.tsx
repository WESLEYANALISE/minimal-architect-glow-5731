import { useNavigate, useSearchParams } from "react-router-dom";
import { Target, BookOpen, FileText, ListOrdered, Search, ArrowUp, BarChart3, Heart, ChevronRight, Lock, Crown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useQuestoesTemas } from "@/hooks/useQuestoesTemas";
import { getAreaGradient, getAreaHex } from "@/lib/flashcardsAreaColors";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import QuestoesEstatisticas from "@/components/questoes/QuestoesEstatisticas";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const QuestoesTemas = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const [activeTab, setActiveTab] = useState<"ordem" | "favoritos" | "estatistica" | "pesquisar">("ordem");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Favoritos via localStorage
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("questoes-temas-favoritos") || "[]");
    } catch { return []; }
  });

  const toggleFavorito = (tema: string) => {
    const novos = favoritos.includes(tema)
      ? favoritos.filter(f => f !== tema)
      : [...favoritos, tema];
    setFavoritos(novos);
    localStorage.setItem("questoes-temas-favoritos", JSON.stringify(novos));
  };

  const hex = getAreaHex(area);
  const gradient = getAreaGradient(area);
  const { isPremium } = useSubscription();

  useEffect(() => {
    if (!area) {
      navigate("/ferramentas/questoes", { replace: true });
    }
  }, [area, navigate]);

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

  const { temas, isLoading, isFetching } = useQuestoesTemas(area);

  const totalQuestoes = temas?.reduce((acc, t) => acc + t.totalQuestoes, 0) || 0;
  const totalTemas = temas?.length || 0;
  const lockedFromIndex = isPremium ? undefined : 2;

  const handleTemaClick = (tema: string) => {
    navigate(`/ferramentas/questoes/resolver?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}`);
  };

  const temasFiltered = useMemo(() => {
    if (!temas) return [];
    if (activeTab === "favoritos") {
      return temas.filter(t => favoritos.includes(t.tema));
    }
    if (activeTab === "pesquisar" && searchTerm.trim()) {
      const term = normalizar(searchTerm);
      return temas.filter(t => normalizar(t.tema).includes(term));
    }
    return temas;
  }, [temas, activeTab, searchTerm, favoritos]);

  const showList = activeTab === "ordem" || activeTab === "pesquisar" || activeTab === "favoritos";

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
          <Target className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 pt-6 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {area}
                </h1>
                <p className="text-sm text-white/70 mt-0.5">
                  Escolha um tema para praticar
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
              <span>{totalQuestoes.toLocaleString('pt-BR')} questões</span>
            </div>
          </div>
        </div>

        {/* Tab switcher: Ordem / Favoritos / Estatística / Pesquisar */}
        <div className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
            {([
              { key: "ordem" as const, label: "Ordem", icon: ListOrdered },
              { key: "favoritos" as const, label: "Favoritos", icon: Heart },
              { key: "estatistica" as const, label: "Estatística", icon: BarChart3 },
              { key: "pesquisar" as const, label: "Pesquisar", icon: Search },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? "text-white shadow-md"
                    : "text-white/50 hover:text-white/70"
                }`}
                style={activeTab === tab.key ? { backgroundColor: `${hex}40` } : {}}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Estatística tab */}
        {activeTab === "estatistica" && (
          <div className="px-4 pb-8">
            <QuestoesEstatisticas />
          </div>
        )}

        {/* Search input */}
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

        {/* List of Temas */}
        {showList && (
          isLoading ? (
            <div className="px-4 space-y-3 animate-fade-in">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[68px] rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : temasFiltered && temasFiltered.length > 0 ? (
            <div className="px-4 pb-8 space-y-2 max-w-lg mx-auto">
              {temasFiltered.map((tema, idx) => {
                const isLocked = lockedFromIndex !== undefined && idx >= lockedFromIndex;
                const isFavorited = favoritos.includes(tema.tema);

                return (
                  <button
                    key={tema.tema}
                    onClick={() => isLocked ? setShowPremiumModal(true) : handleTemaClick(tema.tema)}
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
                      <p className="text-[11px] mt-0.5" style={{ color: isLocked ? 'rgba(255,255,255,0.2)' : `${hex}` }}>
                        {tema.totalQuestoes.toLocaleString('pt-BR')} questões
                      </p>
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
                        {/* Favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorito(tema.tema);
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
          ) : (
            <div className="text-center py-16 text-gray-400">
              {activeTab === "pesquisar" && searchTerm.trim()
                ? "Nenhum tema encontrado para essa busca."
                : activeTab === "favoritos"
                  ? "Nenhum tema favoritado ainda. Toque no ❤️ para salvar."
                  : "Nenhum tema encontrado"}
            </div>
          )
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
        title="Mais temas de Questões"
        sourceFeature="Questões Temas"
      />
    </div>
  );
};

export default QuestoesTemas;
