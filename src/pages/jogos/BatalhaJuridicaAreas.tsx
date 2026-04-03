import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight, Swords,
  ListOrdered, Search,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import bgAreasOab from "@/assets/bg-areas-oab.webp";
import { InstantBackground } from "@/components/ui/instant-background";
import { getAreaGradient } from "@/lib/flashcardsAreaColors";

const AREAS_ORDEM: string[] = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Processual do Trabalho",
  "Direito Tributário", "Direito Empresarial",
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
];

const MAIS_COBRADAS = [
  "Direito Constitucional", "Direito Administrativo", "Direito Penal",
  "Direito Processual Penal", "Direito Civil", "Direito Processual Civil",
  "Direito do Trabalho", "Direito Processual do Trabalho",
  "Direito Tributário", "Direito Empresarial",
];

const ALTA_INCIDENCIA = [
  "Direitos Humanos", "Direito Ambiental",
  "Direito do Consumidor", "Direito Eleitoral", "Direito Previdenciário",
  "Filosofia do Direito", "Sociologia do Direito",
];

const AREAS_OCULTAS = [
  "Teoria e Filosofia do Direito", "Revisão Oab",
  "Formação Complementar", "Pratica Profissional", "Pesquisa Científica",
  "Politicas Publicas", "Lei Penal Especial", "Direito Concorrencial",
  "Português",
];

const ALTA_INCIDENCIA_GRADIENT = "from-indigo-500 to-indigo-700";
const COMPLEMENTARES_GRADIENT = "from-slate-500 to-slate-700";

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const TABS = [
  { id: "ordem", label: "Ordem", icon: ListOrdered },
  { id: "pesquisar", label: "Pesquisar", icon: Search },
] as const;

type TabId = typeof TABS[number]["id"];

export default function BatalhaJuridicaAreas() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("ordem");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: areas, isLoading } = useQuery({
    queryKey: ["batalha-areas"],
    queryFn: async () => {
      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("RESUMO")
          .select("area")
          .not("area", "is", null)
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

      const areaMap = new Map<string, number>();
      allData.forEach((item) => {
        if (item.area) {
          areaMap.set(item.area, (areaMap.get(item.area) || 0) + 1);
        }
      });

      return Array.from(areaMap.entries())
        .map(([area, count]) => ({ area, count }))
        .filter(a => !AREAS_OCULTAS.includes(a.area))
        .sort((a, b) => {
          const idxA = AREAS_ORDEM.indexOf(a.area);
          const idxB = AREAS_ORDEM.indexOf(b.area);
          return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
        });
    },
  });

  const filtered = searchTerm.trim()
    ? areas?.filter(a => normalizar(a.area).includes(normalizar(searchTerm)))
    : areas;

  const renderCard = (item: { area: string; count: number }, idx: number, gradientOverride?: string) => {
    const gradient = gradientOverride || getAreaGradient(item.area);
    return (
      <button
        key={item.area}
        onClick={() => navigate(`/gamificacao/batalha-juridica/temas/${encodeURIComponent(item.area)}`)}
        className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br ${gradient} shadow-lg h-[100px]`}
      >
        <div className="absolute -right-3 -bottom-3 opacity-20">
          <Swords className="w-20 h-20 text-white" />
        </div>
        <div className="bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
          <Swords className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-semibold text-white text-sm leading-tight pr-6">
          {item.area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '')}
        </h3>
        <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </button>
    );
  };

  const renderCategoriaSection = (titulo: string, subtitulo: string, items: typeof areas, gradientOverride?: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-5">
        <h2 className="text-sm font-bold text-white">{titulo}</h2>
        <p className="text-xs text-white/60 mb-3">{subtitulo}</p>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, idx) => renderCard(item, idx, gradientOverride))}
        </div>
      </div>
    );
  };

  const renderAreasGrid = (areasToRender: typeof areas) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[100px] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      );
    }
    if (!areasToRender || areasToRender.length === 0) {
      return (
        <div className="text-center py-8 text-white/50">
          <p>Nenhuma área encontrada</p>
        </div>
      );
    }
    return (
      <>
        {renderCategoriaSection("Mais Cobradas", "Essenciais para qualquer prova", areasToRender.filter(a => MAIS_COBRADAS.includes(a.area)))}
        {renderCategoriaSection("Alta Incidência", "Frequentes em concursos e OAB", areasToRender.filter(a => ALTA_INCIDENCIA.includes(a.area)), ALTA_INCIDENCIA_GRADIENT)}
        {renderCategoriaSection("Complementares", "Aprofunde seus conhecimentos", areasToRender.filter(a => !MAIS_COBRADAS.includes(a.area) && !ALTA_INCIDENCIA.includes(a.area)), COMPLEMENTARES_GRADIENT)}
      </>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      <InstantBackground
        src={bgAreasOab}
        alt="Áreas"
        blurCategory="oab"
        gradientClassName="bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]"
      />

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-red-500" />
          <div>
            <h1 className="text-lg font-bold text-white">Batalha Jurídica</h1>
            <p className="text-xs text-white/60">Escolha uma área do Direito</p>
          </div>
        </div>
      </div>

      {/* Tab Menu */}
      <div className="relative z-10 px-4 py-3">
        <div className="flex bg-white/5 backdrop-blur-sm rounded-xl p-1 gap-1 border border-white/10">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive ? "bg-white/15 text-white shadow-sm" : "text-white/50 hover:text-white/70"
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
      <div className="relative z-10">
        {activeTab === "ordem" && (
          <div className="px-4">
            {renderAreasGrid(areas)}
          </div>
        )}

        {activeTab === "pesquisar" && (
          <div className="px-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar área..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30 backdrop-blur-sm"
                autoFocus
              />
            </div>
            {searchTerm.trim() ? (
              filtered && filtered.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((item, idx) => renderCard(item, idx))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/50">
                  Nenhuma área encontrada
                </div>
              )
            ) : (
              renderAreasGrid(areas)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
