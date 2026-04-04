import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, BookOpen, Crown } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { LivroCard } from "@/components/LivroCard";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { motion } from "framer-motion";
import capaOabEstudos from "@/assets/capa-biblioteca-oab-estudos.webp";
import capaOabAreas from "@/assets/capa-oab-areas.webp";
import capaDireitoPenal from "@/assets/capa-direito-penal.webp";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { useSubscription } from "@/contexts/SubscriptionContext";
// PremiumUpgradeModal removed - using PremiumFloatingCard only
import { useContentLimit } from "@/hooks/useContentLimit";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";

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
}

const BibliotecaOABEstudos = () => {
  const navigate = useNavigate();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const [selectedArea, setSelectedArea] = useState<string | null>("Direito Penal");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const areaTabsRef = useRef<HTMLDivElement>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["biblioteca-oab-estudos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("BIBILIOTECA-OAB")
        .select("id, \"Área\", \"Ordem\", \"Tema\", \"Download\", \"Link\", \"Capa-area\", \"Capa-livro\", \"Sobre\", aula")
        .order("Ordem", { ascending: true });
      if (error) throw error;
      return data as BibliotecaItem[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const areaGroups = useMemo(() => {
    return items?.reduce((acc, item) => {
      const area = item.Área || "Sem Área";
      if (!acc[area]) {
        acc[area] = { capa: capaOabAreas, livros: [] };
      }
      acc[area].livros.push(item);
      return acc;
    }, {} as Record<string, { capa: string | null; livros: BibliotecaItem[] }>);
  }, [items]);

  const areasFiltradas = useMemo(() => {
    if (!areaGroups) return [];
    const searchLower = debouncedSearch.toLowerCase();
    return Object.entries(areaGroups)
      .map(([area, data]) => {
        const livrosFiltrados = data.livros.filter(livro =>
          (livro.Tema?.toLowerCase() || '').includes(searchLower)
        );
        const incluirArea = area.toLowerCase().includes(searchLower) || livrosFiltrados.length > 0;
        return incluirArea ? [area, { ...data, livros: debouncedSearch ? livrosFiltrados : data.livros }] as const : null;
      })
      .filter((item): item is [string, typeof areaGroups[string]] => item !== null)
      .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  }, [areaGroups, debouncedSearch]);

  const livrosDaAreaSelecionada = useMemo(() => {
    if (!selectedArea || !areaGroups) return [];
    const areaData = areaGroups[selectedArea];
    if (!areaData) return [];
    return areaData.livros.filter(livro =>
      (livro.Tema || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedArea, areaGroups, searchTerm]);

  const { visibleItems, lockedItems, isPremiumRequired } = useContentLimit(livrosDaAreaSelecionada, 'oab');

  const getAreaCover = (area: string) => {
    if (area === "Direito Penal") return capaDireitoPenal;
    return capaOabAreas;
  };

  const abreviarArea = (area: string) =>
    area.replace("Direito ", "").replace(" do Trabalho", " Trab.").replace("Processual ", "Proc. ");

  const areasSorted = areasFiltradas.map(([area]) => area);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image - Fixed */}
      <div className="fixed inset-0">
        <img
          src={capaOabEstudos}
          alt="Estudos OAB"
          className="w-full h-full object-cover object-[50%_30%]"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-neutral-900" />

      <div className="relative z-10">
        <StandardPageHeader title="OAB" position="fixed" backPath="/biblioteca-oab" />

        <div className="pt-14 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  <span className="bg-gradient-to-br from-blue-200 via-blue-100 to-blue-300 bg-clip-text text-transparent">
                    Estudos OAB
                  </span>
                </h1>
                <p className="text-sm text-gray-400">Materiais completos por área</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="max-w-lg mx-auto">
            <Card className="bg-black/40 backdrop-blur-sm border-white/10">
              <CardContent className="p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar livro..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="text-base bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Button variant="outline" size="icon" className="shrink-0 border-white/20 text-white hover:bg-white/10">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista de livros da área selecionada */}
        {selectedArea && areaGroups && areaGroups[selectedArea] && (
          <div className="px-4 pb-32 pt-2 max-w-4xl mx-auto animate-fade-in">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white mb-1">{selectedArea}</h2>
              <p className="text-sm text-white/60">
                {areaGroups[selectedArea].livros.length} {areaGroups[selectedArea].livros.length === 1 ? "livro disponível" : "livros disponíveis"}
                {isPremiumRequired && <span className="text-amber-400 ml-2">• {visibleItems.length} liberados</span>}
              </p>
            </div>

            <div className="space-y-3">
              {visibleItems.map((livro) => (
                <LivroCard
                  key={livro.id}
                  titulo={livro.Tema || "Sem título"}
                  subtitulo={selectedArea}
                  capaUrl={livro["Capa-livro"] || getAreaCover(selectedArea)}
                  sobre={livro.Sobre}
                  onClick={() => navigate(`/biblioteca-oab/${livro.id}`)}
                />
              ))}
              {lockedItems.map((livro) => (
                <LivroCard
                  key={livro.id}
                  titulo={livro.Tema || "Sem título"}
                  subtitulo={selectedArea}
                  capaUrl={livro["Capa-livro"] || getAreaCover(selectedArea)}
                  sobre={livro.Sobre}
                  isPremiumLocked
                  onClick={() => setShowPremiumModal(true)}
                />
              ))}
              {visibleItems.length === 0 && lockedItems.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-white/20" />
                  <p className="text-white/50 text-sm">Nenhum livro encontrado</p>
                </div>
              )}
            </div>

            <PremiumFloatingCard
              isOpen={showPremiumModal}
              onClose={() => setShowPremiumModal(false)}
              title="Conteúdo Premium"
              description="Desbloqueie todos os livros desta matéria assinando um dos nossos planos."
              sourceFeature="Biblioteca OAB Estudos"
            />
          </div>
        )}

        {/* PremiumUpgradeModal removed - PremiumFloatingCard already used above */}
      </div>

      {/* Bottom nav de áreas - fixo */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-white/10">
        <div
          ref={areaTabsRef}
          className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-2"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {areasSorted.map((area) => {
            const isActive = selectedArea === area;
            return (
              <button
                key={area}
                onClick={() => {
                  setSelectedArea(area);
                  setSearchTerm("");
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                }`}
              >
                {abreviarArea(area)}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BibliotecaOABEstudos;
