import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Swords, BookOpen, ListOrdered, Search, ArrowUp } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { getAreaGradient, getAreaHex } from "@/lib/flashcardsAreaColors";
import { QuestoesTrilhaTemas } from "@/components/questoes/QuestoesTrilhaTemas";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const TrilhaSkeleton = ({ hex }: { hex: string }) => (
  <div className="flex flex-col items-center gap-6 py-8 px-4 animate-fade-in">
    {Array.from({ length: 7 }).map((_, i) => {
      const isLeft = i % 2 === 0;
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

export default function BatalhaJuridicaTemas() {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const decodedArea = decodeURIComponent(area || "");
  const [activeTab, setActiveTab] = useState<"ordem" | "pesquisar">("ordem");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const hex = getAreaHex(decodedArea);
  const gradient = getAreaGradient(decodedArea);

  useEffect(() => {
    if (!decodedArea) navigate("/gamificacao/batalha-juridica/areas", { replace: true });
  }, [decodedArea, navigate]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: temas, isLoading } = useQuery({
    queryKey: ["batalha-temas", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("RESUMO")
        .select("tema")
        .eq("area", decodedArea)
        .not("tema", "is", null);

      if (error) throw error;

      const temasUnicos = [...new Set(data?.map((d) => d.tema).filter(Boolean))] as string[];
      return temasUnicos.sort().map((tema, i) => ({
        tema,
        temQuestoes: false,
        parcial: false,
        subtemasGerados: 0,
        totalSubtemas: 1,
        totalQuestoes: 0,
        progressoPercent: 0,
        ordem: i,
      }));
    },
    enabled: !!decodedArea,
  });

  const totalTemas = temas?.length || 0;

  const handleTemaClick = (tema: string) => {
    navigate("/gamificacao/batalha-juridica/jogar", {
      state: { area: decodedArea, tema },
    });
  };

  const temasFiltered = useMemo(() => {
    if (!temas) return [];
    if (activeTab === "pesquisar" && searchTerm.trim()) {
      const term = normalizar(searchTerm);
      return temas.filter(t => normalizar(t.tema).includes(term));
    }
    return temas;
  }, [temas, activeTab, searchTerm]);

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
          <Swords className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 pt-6 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Swords className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {decodedArea}
                </h1>
                <p className="text-sm text-white/70 mt-0.5">
                  Escolha um tema para batalhar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Stats */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" style={{ color: hex }} />
              <span>{totalTemas} temas</span>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("ordem")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "ordem" ? "text-white shadow-md" : "text-white/50 hover:text-white/70"
              }`}
              style={activeTab === "ordem" ? { backgroundColor: `${hex}40` } : {}}
            >
              <ListOrdered className="w-4 h-4" />
              Ordem
            </button>
            <button
              onClick={() => setActiveTab("pesquisar")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "pesquisar" ? "text-white shadow-md" : "text-white/50 hover:text-white/70"
              }`}
              style={activeTab === "pesquisar" ? { backgroundColor: `${hex}40` } : {}}
            >
              <Search className="w-4 h-4" />
              Pesquisar
            </button>
          </div>
        </div>

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

        {/* Serpentine Trail */}
        {(activeTab === "ordem" || activeTab === "pesquisar") && (
          isLoading ? (
            <TrilhaSkeleton hex={hex} />
          ) : temasFiltered && temasFiltered.length > 0 ? (
            <div className="px-2">
              <QuestoesTrilhaTemas
                temas={temasFiltered}
                hexColor={hex}
                onTemaClick={handleTemaClick}
                icon={Swords}
                badgeLabel="temas"
              />
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              {activeTab === "pesquisar" && searchTerm.trim()
                ? "Nenhum tema encontrado para essa busca."
                : "Nenhum tema encontrado"}
            </div>
          )
        )}
      </div>

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 left-4 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 animate-fade-in"
          style={{ backgroundColor: `${hex}cc` }}
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}
