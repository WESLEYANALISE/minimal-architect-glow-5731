import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Scale, BookOpen, FileText, ListOrdered, Search, ArrowUp, BarChart3 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QuestoesTrilhaTemas } from "@/components/questoes/QuestoesTrilhaTemas";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import QuestoesEstatisticas from "@/components/questoes/QuestoesEstatisticas";

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const TrilhaSkeleton = ({ hex }: { hex: string }) => (
  <div className="flex flex-col items-center gap-6 py-8 px-4 animate-fade-in">
    {Array.from({ length: 5 }).map((_, i) => {
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

const CategoriasTrilhaPage = () => {
  const navigate = useNavigate();
  const { categoria } = useParams<{ categoria: string }>();
  const { user } = useAuth();
  const isAdmin = user?.email === 'wn7corporation@gmail.com';
  const categoriaName = decodeURIComponent(categoria || "");
  const [activeTab, setActiveTab] = useState<"ordem" | "estatistica" | "pesquisar">("ordem");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const hex = "#8b5cf6"; // violet
  const gradient = "from-violet-500 to-violet-700";

  useEffect(() => {
    if (!categoriaName) {
      navigate("/ferramentas/questoes", { replace: true });
    }
  }, [categoriaName, navigate]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Fetch materias for this categoria
  const { data: materias, isLoading } = useQuery({
    queryKey: ["categorias-materias-trilha", categoriaName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_materias")
        .select("id, nome, categoria, ordem")
        .eq("categoria", categoriaName)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!categoriaName,
  });

  // Fetch question counts per materia using RPC (avoids downloading huge JSON)
  const materiaIds = materias?.map(m => m.id) || [];
  const { data: questoesCountData } = useQuery({
    queryKey: ["categorias-questoes-count-rpc", materiaIds],
    queryFn: async () => {
      if (materiaIds.length === 0) return [];
      const { data, error } = await supabase
        .rpc("contar_questoes_por_materias", { materia_ids: materiaIds } as any);
      if (error) throw error;
      return (data || []) as { materia_id: number; questoes_count: number }[];
    },
    enabled: materiaIds.length > 0,
  });

  // Map materias to trail format with question counts
  const temas = useMemo(() => {
    if (!materias) return [];
    const questoesPerMateria: Record<number, number> = {};
    questoesCountData?.forEach(t => {
      questoesPerMateria[t.materia_id] = (questoesPerMateria[t.materia_id] || 0) + (t.questoes_count || 0);
    });

    return materias.map((m, i) => {
      const totalQ = questoesPerMateria[m.id] || 0;
      return {
        tema: m.nome,
        temQuestoes: totalQ > 0,
        parcial: false,
        subtemasGerados: totalQ > 0 ? 1 : 0,
        totalSubtemas: 1,
        totalQuestoes: totalQ,
        progressoPercent: totalQ > 0 ? 100 : 0,
        ordem: m.ordem ?? i,
      };
    });
  }, [materias, questoesCountData]);

  const totalQuestoes = temas.reduce((acc, t) => acc + t.totalQuestoes, 0);
  const totalMaterias = temas.length;

  const handleTemaClick = (tema: string) => {
    const materia = materias?.find(m => m.nome === tema);
    if (!materia) return;
    const totalQ = temas.find(t => t.tema === tema)?.totalQuestoes || 0;
    if (totalQ > 0) {
      navigate(`/categorias/questoes/${materia.id}`);
    } else if (isAdmin) {
      navigate(`/categorias/materia/${materia.id}`);
    } else {
      toast.error("Nenhuma questão disponível para esta matéria ainda.");
    }
  };

  const temasFiltered = useMemo(() => {
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

      {/* Header with gradient */}
      <div className={`bg-gradient-to-br ${gradient} relative overflow-hidden z-10`}>
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Scale className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 pt-6 pb-5 px-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white line-clamp-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  {categoriaName}
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
              <span>{totalMaterias} matérias</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: hex }} />
              <span>{totalQuestoes.toLocaleString('pt-BR')} questões</span>
            </div>
          </div>
        </div>

        {/* Tab switcher: Ordem / Estatística / Pesquisar */}
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
              onClick={() => setActiveTab("estatistica")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "estatistica" ? "text-white shadow-md" : "text-white/50 hover:text-white/70"
              }`}
              style={activeTab === "estatistica" ? { backgroundColor: `${hex}40` } : {}}
            >
              <BarChart3 className="w-4 h-4" />
              Estatística
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
                  placeholder="Buscar matéria..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-sm"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Serpentine Trail (Ordem + Pesquisar tabs) */}
        {(activeTab === "ordem" || activeTab === "pesquisar") && (
          isLoading ? (
            <TrilhaSkeleton hex={hex} />
          ) : temasFiltered.length > 0 ? (
            <div className="px-2">
              <QuestoesTrilhaTemas
                temas={temasFiltered}
                hexColor={hex}
                onTemaClick={handleTemaClick}
                icon={Scale}
                badgeLabel="questões"
              />
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              {activeTab === "pesquisar" && searchTerm.trim()
                ? "Nenhuma matéria encontrada para essa busca."
                : "Nenhuma matéria encontrada"}
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
    </div>
  );
};

export default CategoriasTrilhaPage;
