import { useState } from "react";
import { useDeviceType } from "@/hooks/use-device-type";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, BookMarked, Layers, Footprints, ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { motion } from "framer-motion";
import { useFlashcardsArtigosCount, getTotalFlashcards } from "@/hooks/useFlashcardsArtigosCount";
import { useFlashcardsAreasCache } from "@/hooks/useFlashcardsAreasCache";


// Imagens temáticas para cada categoria de artigo (locais)
import artigoBrasil from "@/assets/flashcards/artigo-brasil.webp";
import artigoCodigos from "@/assets/flashcards/artigo-codigos.webp";
import artigoPenalV2 from "@/assets/flashcards/artigo-penal-v2.webp";
import artigoEstatutos from "@/assets/flashcards/artigo-estatutos.webp";
import artigoPrevidencia from "@/assets/flashcards/artigo-previdencia.webp";
import artigoSumulas from "@/assets/flashcards/artigo-sumulas.webp";

interface CategoryCard {
  id: string;
  title: string;
  urlCapa: string;
  colors: { bg: string; glow: string };
  route: string;
}

// ABA 1: ARTIGO (Flashcards por Lei) - com imagens temáticas igual à Área
const categoriasArtigo: CategoryCard[] = [
  {
    id: "constituicao",
    title: "Constituição",
    urlCapa: artigoBrasil,
    colors: { 
      bg: "from-green-600/30 to-yellow-600/40", 
      glow: "rgba(34, 197, 94, 0.4)"
    },
    route: "/flashcards/artigos-lei/temas?codigo=cf&cor=%23f97316"
  },
  {
    id: "codigos",
    title: "Códigos",
    urlCapa: artigoCodigos,
    colors: { 
      bg: "from-red-600/30 to-red-900/50", 
      glow: "rgba(239, 68, 68, 0.4)"
    },
    route: "/flashcards/artigos-lei/codigos"
  },
  {
    id: "estatutos",
    title: "Estatutos",
    urlCapa: artigoEstatutos,
    colors: { 
      bg: "from-purple-600/30 to-purple-900/50", 
      glow: "rgba(168, 85, 247, 0.4)"
    },
    route: "/flashcards/artigos-lei/estatutos"
  },
  {
    id: "previdenciario",
    title: "Previdenciário",
    urlCapa: artigoPrevidencia,
    colors: { 
      bg: "from-emerald-600/30 to-emerald-900/50", 
      glow: "rgba(16, 185, 129, 0.4)"
    },
    route: "/flashcards/artigos-lei/previdenciario"
  },
  {
    id: "sumulas",
    title: "Súmulas",
    urlCapa: artigoSumulas,
    colors: { 
      bg: "from-blue-600/30 to-blue-900/50", 
      glow: "rgba(59, 130, 246, 0.4)"
    },
    route: "/flashcards/artigos-lei/sumulas"
  }
];

// Cores vibrantes para os cards de área
const areaCardColors = [
  { bg: "from-violet-600/30 to-purple-900/50", glow: "rgba(139, 92, 246, 0.4)" },
  { bg: "from-rose-600/30 to-red-900/50", glow: "rgba(244, 63, 94, 0.4)" },
  { bg: "from-emerald-600/30 to-green-900/50", glow: "rgba(16, 185, 129, 0.4)" },
  { bg: "from-amber-600/30 to-yellow-900/50", glow: "rgba(245, 158, 11, 0.4)" },
  { bg: "from-cyan-600/30 to-blue-900/50", glow: "rgba(6, 182, 212, 0.4)" },
  { bg: "from-fuchsia-600/30 to-pink-900/50", glow: "rgba(217, 70, 239, 0.4)" },
];

// Componente de Linha do Tempo para Categorias de Artigos
const TimelineArtigo = ({ categorias }: { categorias: CategoryCard[] }) => {
  const navigate = useNavigate();

  return (
    <div className="relative py-6">
      {/* Linha central animada */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
        <div className="w-full h-full bg-gradient-to-b from-violet-500/20 via-violet-500/40 to-violet-500/20 rounded-full" />
        <motion.div
          className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-violet-400/60 via-purple-500/80 to-transparent rounded-full"
          animate={{ y: ["0%", "200%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Cards alternados */}
      <div className="relative space-y-6">
        {categorias.map((card, index) => {
          const isLeft = index % 2 === 0;
          
          return (
            <div
              key={card.id}
              className="relative flex items-center"
              style={{ minHeight: '120px' }}
            >
              {/* Pegada central - posição absoluta centralizada */}
              <motion.div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
                  animate={{ 
                    boxShadow: [
                      "0 0 10px rgba(139, 92, 246, 0.5)",
                      "0 0 25px rgba(139, 92, 246, 0.8)",
                      "0 0 10px rgba(139, 92, 246, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>

              {/* Card */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className={`${isLeft ? 'mr-auto pr-8' : 'ml-auto pl-8'} w-[45%]`}
                onClick={() => navigate(card.route)}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative rounded-xl overflow-hidden cursor-pointer border border-white/20 shadow-lg hover:border-white/40 transition-colors bg-neutral-900"
                  style={{ boxShadow: `0 10px 25px -10px ${card.colors.glow}` }}
                >
                  {/* Background com imagem de capa - mais visível */}
                  {card.urlCapa && (
                    <div 
                      className="absolute inset-0 opacity-70"
                      style={{
                        backgroundImage: `url(${card.urlCapa})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}
                  
                  {/* Gradiente suave de fundo */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.colors.bg} opacity-60`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  
                  {/* Conteúdo - altura maior para mostrar mais o desenho */}
                  <div className="relative z-10 p-4 min-h-[130px] flex flex-col justify-end">
                    <h3 className="font-bold text-white text-sm text-center drop-shadow-lg">{card.title}</h3>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface AreaItem {
  area: string;
  totalFlashcards: number;
  urlCapa?: string;
}

// Componente de Linha do Tempo para Áreas
const TimelineAreas = ({ areas, isLoading }: { areas: AreaItem[], isLoading: boolean }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6 py-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-card/50 animate-pulse mx-auto w-[42%]" />
        ))}
      </div>
    );
  }

  if (!areas || areas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma área encontrada</p>
        <p className="text-sm mt-2">Carregando flashcards...</p>
      </div>
    );
  }

  return (
    <div className="relative py-6">
      {/* Linha central animada */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
        <div className="w-full h-full bg-gradient-to-b from-emerald-500/20 via-emerald-500/40 to-emerald-500/20 rounded-full" />
        <motion.div
          className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-400/60 via-green-500/80 to-transparent rounded-full"
          animate={{ y: ["0%", "200%", "0%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Cards alternados */}
      <div className="relative space-y-6">
        {areas.map((item, index) => {
          const isLeft = index % 2 === 0;
          const colors = areaCardColors[index % areaCardColors.length];
          
          return (
            <div
              key={item.area}
              className="relative flex items-center"
              style={{ minHeight: '120px' }}
            >
              {/* Pegada central - posição absoluta centralizada */}
              <motion.div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.08 + 0.2 }}
              >
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg"
                  animate={{ 
                    boxShadow: [
                      "0 0 10px rgba(16, 185, 129, 0.5)",
                      "0 0 25px rgba(16, 185, 129, 0.8)",
                      "0 0 10px rgba(16, 185, 129, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  <Footprints className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>

              {/* Card */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className={`${isLeft ? 'mr-auto pr-8' : 'ml-auto pl-8'} w-[45%]`}
                onClick={() => navigate(`/flashcards/temas?area=${encodeURIComponent(item.area)}`)}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative rounded-xl overflow-hidden cursor-pointer border border-emerald-500/30 shadow-lg hover:border-emerald-500/60 transition-colors"
                  style={{ boxShadow: `0 10px 25px -10px ${colors.glow}` }}
                >
                  {/* Background com imagem de capa */}
                  {item.urlCapa && (
                    <div 
                      className="absolute inset-0 opacity-40"
                      style={{
                        backgroundImage: `url(${item.urlCapa})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}
                  
                  {/* Gradiente de fundo */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Conteúdo - título embaixo */}
                  <div className="relative z-10 p-4 min-h-[100px] flex flex-col justify-end">
                    <h3 className="font-bold text-white text-sm text-center">{item.area}</h3>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FlashcardsHub = () => {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("artigo");
  const { isDesktop } = useDeviceType();
  const { data: flashcardCounts } = useFlashcardsArtigosCount();
  const { areas, totalFlashcards: totalAreas, isLoading: areasLoading } = useFlashcardsAreasCache();
  
  // Total de flashcards por artigo
  const totalArtigos = flashcardCounts ? getTotalFlashcards(flashcardCounts) : 0;
  const totalGeral = totalAreas + totalArtigos;

  // ─── DESKTOP ───
  if (isDesktop) {
    return (
      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-red-400" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
                <p className="text-sm text-muted-foreground"><span className="text-red-400 font-semibold">{totalGeral.toLocaleString('pt-BR')}</span> disponíveis</p>
              </div>
            </div>

            <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-md h-auto p-1 bg-card/80 border border-border/50 mb-6">
                <TabsTrigger value="artigo" className="flex items-center gap-1.5 py-2.5 text-sm data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"><BookMarked className="w-4 h-4" /><span>Artigo</span></TabsTrigger>
                <TabsTrigger value="area" className="flex items-center gap-1.5 py-2.5 text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"><Layers className="w-4 h-4" /><span>Área</span></TabsTrigger>
              </TabsList>

              <TabsContent value="artigo" className="mt-0">
                <div className="grid grid-cols-3 xl:grid-cols-5 gap-4">
                  {categoriasArtigo.map((card) => (
                    <div key={card.id} onClick={() => navigate(card.route)} className="relative rounded-xl overflow-hidden cursor-pointer group border border-border/30 hover:border-primary/30 transition-all hover:scale-[1.02]" style={{ boxShadow: `0 10px 25px -10px ${card.colors.glow}` }}>
                      {card.urlCapa && <div className="absolute inset-0 opacity-70" style={{ backgroundImage: `url(${card.urlCapa})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.colors.bg} opacity-60`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="relative z-10 p-4 min-h-[140px] flex flex-col justify-end"><h3 className="font-bold text-white text-sm text-center drop-shadow-lg">{card.title}</h3></div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="area" className="mt-0">
                <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                  {(areas || []).map((item, index) => {
                    const colors = areaCardColors[index % areaCardColors.length];
                    return (
                      <div key={item.area} onClick={() => navigate(`/flashcards/temas?area=${encodeURIComponent(item.area)}`)} className="relative rounded-xl overflow-hidden cursor-pointer group border border-border/30 hover:border-primary/30 transition-all hover:scale-[1.02]" style={{ boxShadow: `0 10px 25px -10px ${colors.glow}` }}>
                        {item.urlCapa && <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url(${item.urlCapa})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                        <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="relative z-10 p-4 min-h-[110px] flex flex-col justify-end"><h3 className="font-bold text-white text-sm text-center">{item.area}</h3></div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  // ─── MOBILE ───
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(0 0% 12%)" }}>
      {/* Header banner — Noble Red, espelhando QuestoesHub */}
      <div
        className="relative overflow-hidden rounded-b-3xl mb-3"
        style={{
          background: "linear-gradient(145deg, hsl(8 65% 42%), hsl(8 55% 30%), hsl(8 40% 20%))",
        }}
      >
        <Sparkles
          className="absolute -right-3 -bottom-3 text-white pointer-events-none"
          style={{ width: 100, height: 100, opacity: 0.06 }}
        />

        <div className="relative z-10 px-4 pt-3 pb-5">
          {/* Back to home */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-3 group"
          >
            <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] text-white/50 uppercase tracking-wide">Voltar</span>
              <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">Início</span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "hsla(8, 60%, 50%, 0.35)",
                border: "1px solid hsla(8, 60%, 60%, 0.3)",
              }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Flashcards</h1>
              <p className="text-xs text-white/55">
                <span className="text-white/90 font-semibold">{totalGeral.toLocaleString('pt-BR')}</span> disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col pb-24">

        {/* Sistema de Tabs - APENAS 2 abas */}
        <div className="px-4 pt-4">
          <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
            <TabsList className="grid grid-cols-2 w-full h-auto p-1" style={{ background: "hsl(0 0% 16%)", border: "1px solid hsl(0 0% 22%)" }}>
              <TabsTrigger 
                value="artigo" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400"
              >
                <BookMarked className="w-4 h-4" />
                <span>Artigo</span>
              </TabsTrigger>
              <TabsTrigger 
                value="area" 
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
              >
                <Layers className="w-4 h-4" />
                <span>Área</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 pb-24">
              <TabsContent value="artigo" className="mt-0">
                <TimelineArtigo categorias={categoriasArtigo} />
              </TabsContent>
              
              <TabsContent value="area" className="mt-0">
                <TimelineAreas areas={areas || []} isLoading={areasLoading} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsHub;
