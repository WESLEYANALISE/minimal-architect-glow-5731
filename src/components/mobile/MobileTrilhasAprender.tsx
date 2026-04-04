import { useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Footprints, Scale, Gavel, ChevronRight, PlayCircle, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { Progress } from "@/components/ui/progress";

import conceitosThumb from "@/assets/thumbnails/conceitos-thumb.webp";
import portuguesThumb from "@/assets/thumbnails/portugues-thumb.webp";
import oabThumb from "@/assets/thumbnails/oab-thumb.webp";
import areasThumb from "@/assets/thumbnails/areas-thumb.webp";
import termosThumb from "@/assets/thumbnails/termos-thumb.webp";

// ===== PATH NODE TYPE =====
interface PathNode {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  side: "left" | "right";
  onClick: () => void;
  thumb?: string;
  accentColor: string;
}

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

// ===== SERPENTINE CARD =====
const SerpentineCard = ({ node, index }: { node: PathNode; index: number }) => {
  const isLeft = node.side === "left";

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="relative flex items-start"
    >
      {/* Left */}
      <div className="w-[45%]">
        {isLeft && <CardBody node={node} />}
      </div>

      {/* Center footprint */}
      <div className="w-[10%] flex flex-col items-center relative">
        <FootprintNode index={index} accentColor={node.accentColor} />
      </div>

      {/* Right */}
      <div className="w-[45%]">
        {!isLeft && <CardBody node={node} />}
      </div>
    </motion.div>
  );
};

const CardBody = ({ node }: { node: PathNode }) => (
  <button
    onClick={node.onClick}
    className="w-full relative overflow-hidden rounded-2xl text-left transition-all active:scale-[0.97] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)]"
  >
    {/* Thumbnail area */}
    <div className="relative w-full h-[110px]">
      {node.thumb ? (
        <img src={node.thumb} alt={node.title} className="absolute inset-0 w-full h-full object-cover rounded-t-2xl" loading="lazy" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-t-2xl" />
      )}
      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-xl p-1.5 w-fit">
        {node.icon}
      </div>
    </div>
    {/* Info area */}
    <div className="p-3 bg-gradient-to-br from-white/8 to-white/3 border-t border-white/10">
      <h3 className="font-bold text-white text-sm leading-tight">{node.title}</h3>
      <div className="flex items-center justify-between mt-1">
        <p className="text-white/50 text-[10px]">{node.subtitle}</p>
        <ChevronRight className="w-4 h-4 text-white/40" />
      </div>
    </div>
  </button>
);

export const MobileTrilhasAprender = memo(() => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // === TOTAL DE AULAS ===
  const { data: totalAulas = 0 } = useQuery({
    queryKey: ["total-aulas-jornada"],
    queryFn: async () => {
      const [conceitos, interativas, artigos] = await Promise.all([
        supabase.from("conceitos_topicos").select("*", { count: "exact", head: true }),
        supabase.from("aulas_interativas").select("*", { count: "exact", head: true }),
        supabase.from("aulas_artigos").select("*", { count: "exact", head: true }),
      ]);
      return (conceitos.count || 0) + (interativas.count || 0) + (artigos.count || 0);
    },
    staleTime: 1000 * 60 * 30,
  });

  // === PROGRESSO ===
  const { data: progressoConceitos } = useQuery({
    queryKey: ["progresso-conceitos-oab", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: progressoData, error } = await supabase
        .from("oab_trilhas_estudo_progresso")
        .select("id, topico_id, progresso_leitura, leitura_completa, updated_at")
        .eq("user_id", user.id)
        .eq("leitura_completa", false)
        .gt("progresso_leitura", 0)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error || !progressoData?.length) return [];
      const topicoIds = progressoData.map(p => p.topico_id);
      const { data: topicos } = await supabase
        .from("conceitos_topicos")
        .select("id, titulo, materia_id")
        .in("id", topicoIds);
      
      // Fetch materia names to get the area
      const materiaIds = [...new Set((topicos || []).map((t: any) => t.materia_id).filter(Boolean))];
      let materiasMap = new Map<number, string>();
      if (materiaIds.length > 0) {
        const { data: materias } = await supabase
          .from("conceitos_materias")
          .select("id, nome")
          .in("id", materiaIds);
        (materias || []).forEach((m: any) => materiasMap.set(m.id, m.nome));
      }
      
      const topicosMap = new Map((topicos || []).map((t: any) => [t.id, { titulo: t.titulo, materia_id: t.materia_id }]));
      return progressoData.map((item: any) => {
        const topico = topicosMap.get(item.topico_id);
        const materiaNome = topico?.materia_id ? materiasMap.get(topico.materia_id) : null;
        return {
          id: item.id,
          nome: topico?.titulo || "Tópico",
          progresso: item.progresso_leitura || 0,
          tipo: "conceitos" as const,
          topicoId: item.topico_id,
          area: materiaNome || "Conceitos",
        };
      });
    },
    staleTime: Infinity,
    enabled: !!user?.id,
  });

  const { data: progressoAulas } = useQuery({
    queryKey: ["progresso-aulas-interativas", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("aulas_progresso")
        .select("*, aulas_interativas(titulo, area)")
        .eq("user_id", user.id)
        .eq("concluida", false)
        .gt("progresso_percentual", 0)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) return [];
      return (data || []).map((item: any) => ({
        id: item.id,
        nome: item.aulas_interativas?.titulo || "Aula",
        progresso: item.progresso_percentual || 0,
        tipo: "aula" as const,
        aulaId: item.aula_id,
        area: item.aulas_interativas?.area || "Aula",
      }));
    },
    staleTime: Infinity,
    enabled: !!user?.id,
  });

  const todosProgresso = [...(progressoConceitos || []), ...(progressoAulas || [])];

  const handleContinuar = (item: any) => {
    if (item.tipo === "conceitos") navigate(`/conceitos/topico/${item.topicoId}`);
    else if (item.tipo === "aula") navigate(`/aula/${item.aulaId}`);
  };

  // ===== PATH NODES - all navigate to dedicated pages =====
  const pathNodes = ([
    {
      id: "conceitos",
      title: "Trilha de Conceitos",
      subtitle: "Fundamentos do Direito",
      icon: <Footprints className="w-4 h-4 text-white" />,
      side: "left",
      onClick: () => navigate("/conceitos/trilhante"),
      thumb: conceitosThumb,
      accentColor: "#ef4444",
    },
    {
      id: "areas",
      title: "Áreas do Direito",
      subtitle: "27 matérias disponíveis",
      icon: <Scale className="w-4 h-4 text-white" />,
      side: "right",
      onClick: () => navigate("/aulas/areas"),
      thumb: areasThumb,
      accentColor: "#f59e0b",
    },
    {
      id: "oab",
      title: "Trilhas OAB",
      subtitle: "1ª e 2ª Fase",
      icon: <Gavel className="w-4 h-4 text-white" />,
      side: "left",
      onClick: () => navigate("/aulas/oab"),
      thumb: oabThumb,
      accentColor: "#dc2626",
    },
    {
      id: "portugues",
      title: "Português Jurídico",
      subtitle: "Gramática • Redação",
      icon: <BookOpen className="w-4 h-4 text-white" />,
      side: "right",
      onClick: () => navigate("/aulas/portugues"),
      thumb: portuguesThumb,
      accentColor: "#8b5cf6",
    },
    {
      id: "termos",
      title: "Termos Jurídicos",
      subtitle: "50 termos essenciais",
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      side: "left",
      onClick: () => navigate("/termos-juridicos"),
      thumb: termosThumb,
      accentColor: "#d97706",
    },
  ] as PathNode[]).filter(node => {
    if ((node.id === "oab" || node.id === "portugues") && user?.email !== ADMIN_EMAIL) return false;
    return true;
  });

  return (
    <div className="relative py-4 pb-24 flex flex-col items-center">
      {/* ========== PROGRESSO ========== */}
      <div className="w-full mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="font-semibold text-base text-white">Seu Progresso</h2>
          {todosProgresso.length > 0 && (
            <button
              onClick={() => navigate("/aulas/dashboard")}
              className="text-xs text-amber-400 font-medium flex items-center gap-0.5"
            >
              Ver tudo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {todosProgresso.length === 0 ? (
          <div className="mx-4 bg-gradient-to-br from-white/8 to-white/3 border border-white/10 rounded-2xl p-8 text-center shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)]">
            <div className="bg-amber-500/15 rounded-2xl p-4 w-fit mx-auto mb-3">
              <PlayCircle className="w-10 h-10 text-amber-400/50" />
            </div>
            <p className="text-white/60 text-sm font-medium">Comece uma aula</p>
            <p className="text-white/30 text-xs mt-1">Seu progresso aparecerá aqui</p>
          </div>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {todosProgresso.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => handleContinuar(item)}
                className="flex-shrink-0 w-[220px] bg-gradient-to-br from-white/10 to-white/4 border border-white/12 rounded-2xl p-4 text-left hover:border-amber-400/40 transition-all shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)]"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="bg-amber-500/25 rounded-xl p-2">
                    <PlayCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold line-clamp-1">
                    {item.area || (item.tipo === "conceitos" ? "Conceitos" : "Aula")}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-3">{item.nome}</h3>
                <div className="flex items-center gap-2.5">
                  <Progress
                    value={item.progresso}
                    className="h-2 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500 [&>div]:rounded-full"
                  />
                  <span className="text-xs text-amber-400 font-bold min-w-[32px] text-right">{Math.round(item.progresso)}%</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========== JORNADA DE ESTUDOS - SERPENTINA ========== */}
      <div className="text-center mb-6">
      <h2 className="font-cinzel text-xl font-bold text-amber-100 mb-1">Jornada de Estudos</h2>
        <p className="text-amber-200/70 text-xs">Aulas aprofundadas do Direito</p>
        {totalAulas > 0 && (
          <p className="text-amber-300/50 text-[11px] mt-1">{totalAulas} aulas disponíveis</p>
        )}
      </div>

      <div className="w-full px-3 relative">
        {/* Central animated line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 z-0 overflow-hidden">
          {/* Base glow line */}
          <div className="w-full h-full bg-gradient-to-b from-amber-500/50 via-red-500/40 to-amber-600/30 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
          {/* Primary energy pulse */}
          <motion.div
            className="absolute top-0 left-0 w-full h-32 rounded-full"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(251,191,36,0.8), rgba(239,68,68,0.6), transparent)' }}
            animate={{ y: ["-20%", "600%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Secondary faster pulse */}
          <motion.div
            className="absolute top-0 left-0 w-full h-16 rounded-full"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.5), transparent)' }}
            animate={{ y: ["-10%", "800%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }}
          />
          {/* Glowing dots */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]"
            animate={{ y: ["0%", "2000%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeIn", delay: 0.5 }}
          />
        </div>

        {/* Path nodes */}
        <div className="relative z-10 space-y-6">
          {pathNodes.map((node, index) => (
            <SerpentineCard key={node.id} node={node} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
});

MobileTrilhasAprender.displayName = "MobileTrilhasAprender";
