import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Scale, Gavel, Users, Landmark, FileText, Shield, Building2, HardHat, Coins, Briefcase, Heart, Leaf, Globe2, Trophy, MapPin, Brain, Megaphone, BookOpen, GraduationCap, Footprints, ChevronRight, ZoomIn, ZoomOut, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import lawyerJusticeBg from "@/assets/lawyer-justice-bg.webp";

// Thumbnails - Mais Cobradas (WebP + compressed + resized at build time)
import thumbConstitucional from "@/assets/thumbnails/area-constitucional.webp";
import thumbCivil from "@/assets/thumbnails/area-civil.webp";
import thumbPenal from "@/assets/thumbnails/area-penal.webp";
import thumbProcCivil from "@/assets/thumbnails/area-proc-civil.webp";
import thumbProcPenal from "@/assets/thumbnails/area-proc-penal.webp";
import thumbAdministrativo from "@/assets/thumbnails/area-administrativo.webp";
import thumbTrabalho from "@/assets/thumbnails/area-trabalho.webp";
import thumbTributario from "@/assets/thumbnails/area-tributario.webp";
// Alta Incidência
import thumbEmpresarial from "@/assets/thumbnails/area-empresarial.webp";
import thumbPrevidenciario from "@/assets/thumbnails/area-previdenciario.webp";
import thumbAmbiental from "@/assets/thumbnails/area-ambiental.webp";
import thumbProcTrabalho from "@/assets/thumbnails/area-proc-trabalho.webp";
import thumbHumanos from "@/assets/thumbnails/area-humanos.webp";
import thumbFinanceiro from "@/assets/thumbnails/area-financeiro.webp";
// Complementares
import thumbIntPublico from "@/assets/thumbnails/area-int-publico.webp";
import thumbIntPrivado from "@/assets/thumbnails/area-int-privado.webp";
import thumbConcorrencial from "@/assets/thumbnails/area-concorrencial.webp";
import thumbDesportivo from "@/assets/thumbnails/area-desportivo.webp";
import thumbUrbanistico from "@/assets/thumbnails/area-urbanistico.webp";
import thumbLeiPenalEsp from "@/assets/thumbnails/area-lei-penal-esp.webp";
import thumbFilosofia from "@/assets/thumbnails/area-filosofia.webp";
import thumbPoliticas from "@/assets/thumbnails/area-politicas.webp";
import thumbPratica from "@/assets/thumbnails/area-pratica.webp";
import thumbPortugues from "@/assets/thumbnails/area-portugues-comp.webp";
import thumbPesquisa from "@/assets/thumbnails/area-pesquisa.webp";
import thumbFormacao from "@/assets/thumbnails/area-formacao.webp";
import thumbRevisaoOab from "@/assets/thumbnails/area-revisao-oab.webp";

interface AreaItem {
  label: string;
  value: string;
  icon: LucideIcon;
  thumb: string;
  accentColor: string;
}

const PRINCIPAIS: AreaItem[] = [
  { label: "Constitucional", value: "Direito Constitucional", icon: Landmark, thumb: thumbConstitucional, accentColor: "#f59e0b" },
  { label: "Civil", value: "Direito Civil", icon: Users, thumb: thumbCivil, accentColor: "#ef4444" },
  { label: "Penal", value: "Direito Penal", icon: Gavel, thumb: thumbPenal, accentColor: "#475569" },
  { label: "Processual Civil", value: "Direito Processual Civil", icon: FileText, thumb: thumbProcCivil, accentColor: "#3b82f6" },
  { label: "Processual Penal", value: "Direito Processual Penal", icon: Shield, thumb: thumbProcPenal, accentColor: "#7c3aed" },
  { label: "Administrativo", value: "Direito Administrativo", icon: Building2, thumb: thumbAdministrativo, accentColor: "#14b8a6" },
  { label: "Trabalho", value: "Direito Do Trabalho", icon: HardHat, thumb: thumbTrabalho, accentColor: "#eab308" },
  { label: "Tributário", value: "Direito Tributario", icon: Coins, thumb: thumbTributario, accentColor: "#16a34a" },
];

const ALTA_INCIDENCIA: AreaItem[] = [
  { label: "Empresarial", value: "Direito Empresarial", icon: Briefcase, thumb: thumbEmpresarial, accentColor: "#0891b2" },
  { label: "Previdenciário", value: "Direito Previndenciario", icon: Heart, thumb: thumbPrevidenciario, accentColor: "#ec4899" },
  { label: "Ambiental", value: "Direito Ambiental", icon: Leaf, thumb: thumbAmbiental, accentColor: "#65a30d" },
  { label: "Processual do Trabalho", value: "Direito Processual Do Trabalho", icon: Scale, thumb: thumbProcTrabalho, accentColor: "#ea580c" },
  { label: "Direitos Humanos", value: "Direitos Humanos", icon: Heart, thumb: thumbHumanos, accentColor: "#e11d48" },
  { label: "Financeiro", value: "Direito Financeiro", icon: Coins, thumb: thumbFinanceiro, accentColor: "#059669" },
];

const COMPLEMENTARES: AreaItem[] = [
  { label: "Internacional Público", value: "Direito Internacional Público", icon: Globe2, thumb: thumbIntPublico, accentColor: "#0ea5e9" },
  { label: "Internacional Privado", value: "Direito Internacional Privado", icon: Globe2, thumb: thumbIntPrivado, accentColor: "#8b5cf6" },
  { label: "Concorrencial", value: "Direito Concorrencial", icon: Trophy, thumb: thumbConcorrencial, accentColor: "#d946ef" },
  { label: "Desportivo", value: "Direito Desportivo", icon: Trophy, thumb: thumbDesportivo, accentColor: "#10b981" },
  { label: "Urbanístico", value: "Direito Urbanistico", icon: MapPin, thumb: thumbUrbanistico, accentColor: "#78716c" },
  { label: "Lei Penal Especial", value: "Lei Penal Especial", icon: Shield, thumb: thumbLeiPenalEsp, accentColor: "#dc2626" },
  { label: "Filosofia do Direito", value: "Teoria E Filosofia Do Direito", icon: Brain, thumb: thumbFilosofia, accentColor: "#7c3aed" },
  { label: "Políticas Públicas", value: "Politicas Publicas", icon: Megaphone, thumb: thumbPoliticas, accentColor: "#2563eb" },
  { label: "Prática Profissional", value: "Pratica Profissional", icon: Briefcase, thumb: thumbPratica, accentColor: "#d97706" },
  { label: "Português", value: "Portugues", icon: BookOpen, thumb: thumbPortugues, accentColor: "#ef4444" },
  { label: "Pesquisa Científica", value: "Pesquisa Científica", icon: Brain, thumb: thumbPesquisa, accentColor: "#06b6d4" },
  { label: "Formação Complementar", value: "Formação Complementar", icon: GraduationCap, thumb: thumbFormacao, accentColor: "#1d4ed8" },
  { label: "Revisão OAB", value: "Revisão Oab", icon: Scale, thumb: thumbRevisaoOab, accentColor: "#b91c1c" },
];

type TabKey = "principais" | "alta" | "complementares";

const TABS: { key: TabKey; label: string; color: string; areas: AreaItem[] }[] = [
  { key: "principais", label: "Principais", color: "bg-amber-500", areas: PRINCIPAIS },
  { key: "alta", label: "Frequentes", color: "bg-emerald-500", areas: ALTA_INCIDENCIA },
  { key: "complementares", label: "Especializadas", color: "bg-violet-500", areas: COMPLEMENTARES },
];

// ===== FOOTPRINT NODE =====
const FootprintNode = ({ index, accentColor }: { index: number; accentColor: string }) => (
  <motion.div
    animate={{
      scale: [1, 1.2, 1],
      boxShadow: [
        `0 0 0 0 ${accentColor}66`,
        `0 0 0 8px ${accentColor}00`,
        `0 0 0 0 ${accentColor}00`,
      ],
    }}
    transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.4 }}
    className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-amber-600 flex items-center justify-center shadow-lg z-20"
  >
    <Footprints className="w-4.5 h-4.5 text-white" />
  </motion.div>
);

// ===== CARD BODY =====
const CardBody = ({ area, navigate, aulasCount, scale = 1 }: { area: AreaItem; navigate: (path: string) => void; aulasCount?: number; scale?: number }) => {
  const Icon = area.icon;
  const imgH = Math.round(110 * scale);
  const titleSize = Math.max(13, Math.round(15 * scale));
  const subSize = Math.max(9, Math.round(11 * scale));
  const iconSize = Math.max(14, Math.round(16 * scale));
  
  return (
    <button
      onClick={() => navigate(`/aulas/area/${encodeURIComponent(area.value)}`)}
      className="w-full relative overflow-hidden rounded-2xl text-left transition-all active:scale-[0.97] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)]"
    >
      <div className="relative w-full shine-effect" style={{ height: `${imgH}px` }}>
        <img src={area.thumb} alt={area.label} className="absolute inset-0 w-full h-full object-cover rounded-t-2xl" loading="eager" fetchPriority="high" decoding="async" />
        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-xl p-1.5 w-fit">
          <Icon style={{ width: iconSize, height: iconSize }} className="text-white" />
        </div>
      </div>
      <div className="p-3 bg-gradient-to-br from-white/8 to-white/3 border-t border-white/10">
        <h3 className="font-bold text-white leading-tight" style={{ fontSize: `${titleSize}px` }}>{area.label}</h3>
        <div className="flex items-center justify-between mt-1">
          {aulasCount !== undefined && aulasCount > 0 ? (
            <span className="font-semibold" style={{ fontSize: `${subSize}px`, color: 'rgb(251 191 36 / 0.9)' }}>{aulasCount} aulas</span>
          ) : (
            <span style={{ fontSize: `${subSize}px` }}>&nbsp;</span>
          )}
          <ChevronRight className="w-4 h-4 text-white/40" />
        </div>
      </div>
    </button>
  );
};

// ===== SERPENTINE CARD =====
const SerpentineCard = ({ area, index, navigate, aulasCount, scale = 1 }: { area: AreaItem; index: number; navigate: (path: string) => void; aulasCount?: number; scale?: number }) => {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="relative flex items-start"
    >
      <div className="w-[45%]">
        {isLeft && <CardBody area={area} navigate={navigate} aulasCount={aulasCount} scale={scale} />}
      </div>
      <div className="w-[10%] flex flex-col items-center relative">
        <FootprintNode index={index} accentColor={area.accentColor} />
      </div>
      <div className="w-[45%]">
        {!isLeft && <CardBody area={area} navigate={navigate} aulasCount={aulasCount} scale={scale} />}
      </div>
    </motion.div>
  );
};

const totalAreas = PRINCIPAIS.length + ALTA_INCIDENCIA.length + COMPLEMENTARES.length;

const ALL_AREA_VALUES = [...PRINCIPAIS, ...ALTA_INCIDENCIA, ...COMPLEMENTARES].map(a => a.value);

const AulasAreasPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("principais");
  const [cardScale, setCardScale] = useState(1);
  
  const increaseScale = () => setCardScale(s => Math.min(s + 0.15, 1.6));
  const decreaseScale = () => setCardScale(s => Math.max(s - 0.15, 0.7));

  // Fetch total aulas (tópicos) per area
  const { data: aulasCountByArea } = useQuery({
    queryKey: ["areas-aulas-count"],
    queryFn: async () => {
      // Get all materias grouped by categoria (area)
      const { data: materias } = await supabase
        .from("categorias_materias")
        .select("id, categoria")
        .in("categoria", ALL_AREA_VALUES);
      if (!materias || materias.length === 0) return {};

      const materiaIds = materias.map(m => m.id);
      
      // Fetch all topicos in batches to avoid 1000-row limit
      let allTopicos: { materia_id: number }[] = [];
      const batchSize = 500;
      for (let i = 0; i < materiaIds.length; i += batchSize) {
        const batch = materiaIds.slice(i, i + batchSize);
        let from = 0;
        while (true) {
          const { data: page } = await supabase
            .from("categorias_topicos")
            .select("materia_id")
            .in("materia_id", batch)
            .range(from, from + 999);
          if (!page || page.length === 0) break;
          allTopicos = allTopicos.concat(page);
          if (page.length < 1000) break;
          from += 1000;
        }
      }

      // Count topicos per materia
      const countByMateria: Record<number, number> = {};
      allTopicos.forEach(t => {
        countByMateria[t.materia_id] = (countByMateria[t.materia_id] || 0) + 1;
      });

      // Aggregate by area
      const countByArea: Record<string, number> = {};
      materias.forEach(m => {
        countByArea[m.categoria] = (countByArea[m.categoria] || 0) + (countByMateria[m.id] || 0);
      });
      return countByArea;
    },
    staleTime: 1000 * 60 * 30,
  });

  const currentTab = TABS.find(t => t.key === activeTab)!;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <img src={lawyerJusticeBg} alt="" className="w-full h-full object-cover opacity-55" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/aulas")} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Áreas do Direito</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={decreaseScale} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ZoomOut className="w-4 h-4 text-foreground/60" />
            </button>
            <button onClick={increaseScale} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ZoomIn className="w-4 h-4 text-foreground/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 py-6">
        {/* Title */}
        <div className="text-center mb-5">
          <Scale className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h2 className="font-cinzel text-xl font-bold text-amber-100">Áreas do Direito</h2>
          <p className="text-amber-200/60 text-xs mt-1">
            {totalAreas} matérias · {Object.values(aulasCountByArea || {}).reduce((a, b) => a + b, 0)} aulas
          </p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex justify-center gap-2 px-4 mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all text-center ${
                activeTab === tab.key
                  ? `${tab.color} text-white shadow-lg scale-105`
                  : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Serpentine Path */}
        <div className="px-3 relative">
          {/* Central animated line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 z-0 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-b from-amber-500/50 via-red-500/40 to-amber-600/30 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
            <motion.div
              className="absolute top-0 left-0 w-full h-32 rounded-full"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(251,191,36,0.8), rgba(239,68,68,0.6), transparent)' }}
              animate={{ y: ["-20%", "600%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-0 left-0 w-full h-16 rounded-full"
              style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.5), transparent)' }}
              animate={{ y: ["-10%", "800%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
            />
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
              animate={{ y: ["0%", "2000%"], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeIn", delay: 0.5 }}
            />
          </div>

          {/* Path nodes */}
          <div className="relative z-10 space-y-6">
            {currentTab.areas.map((area, index) => (
              <SerpentineCard key={area.value} area={area} index={index} navigate={navigate} aulasCount={aulasCountByArea?.[area.value]} scale={cardScale} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AulasAreasPage;
