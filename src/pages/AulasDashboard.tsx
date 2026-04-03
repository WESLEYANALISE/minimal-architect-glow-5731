import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, BookOpen, PlayCircle, Clock, Filter } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface ProgressItem {
  id: string;
  nome: string;
  area: string;
  materia: string;
  progresso: number;
  tipo: "conceitos" | "aula";
  topicoId?: number;
  aulaId?: string;
  updatedAt: string;
}

const AulasDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filtroArea, setFiltroArea] = useState<string>("todos");

  const { data: progressoConceitos } = useQuery({
    queryKey: ["dashboard-progresso-conceitos-oab", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: progressoData } = await supabase
        .from("oab_trilhas_estudo_progresso")
        .select("id, topico_id, progresso_leitura, leitura_completa, updated_at")
        .eq("user_id", user.id)
        .eq("leitura_completa", false)
        .gt("progresso_leitura", 0)
        .order("updated_at", { ascending: false });
      if (!progressoData?.length) return [];

      const topicoIds = progressoData.map(p => p.topico_id);
      const { data: topicos } = await supabase
        .from("conceitos_topicos")
        .select("id, titulo, materia_id")
        .in("id", topicoIds);

      const materiaIds = [...new Set((topicos || []).map((t: any) => t.materia_id).filter(Boolean))];
      let materiasMap = new Map<number, string>();
      if (materiaIds.length > 0) {
        const { data: materias } = await supabase
          .from("conceitos_materias")
          .select("id, nome, area")
          .in("id", materiaIds);
        (materias || []).forEach((m: any) => materiasMap.set(m.id, m.nome));
      }

      const topicosMap = new Map((topicos || []).map((t: any) => [t.id, t]));

      return progressoData.map((item: any) => {
        const topico = topicosMap.get(item.topico_id);
        const materiaNome = topico?.materia_id ? materiasMap.get(topico.materia_id) : null;
        return {
          id: item.id,
          nome: topico?.titulo || "Tópico",
          area: materiaNome || "Conceitos",
          materia: "Conceitos",
          progresso: item.progresso_leitura || 0,
          tipo: "conceitos" as const,
          topicoId: item.topico_id,
          updatedAt: item.updated_at,
        };
      });
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user?.id,
  });

  const { data: progressoAulas } = useQuery({
    queryKey: ["dashboard-progresso-aulas", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("aulas_progresso")
        .select("*, aulas_interativas(titulo, area, tema)")
        .eq("user_id", user.id)
        .eq("concluida", false)
        .gt("progresso_percentual", 0)
        .order("updated_at", { ascending: false });
      return (data || []).map((item: any) => ({
        id: item.id,
        nome: item.aulas_interativas?.titulo || "Aula",
        area: item.aulas_interativas?.area || "Aula Interativa",
        materia: item.aulas_interativas?.tema || "",
        progresso: item.progresso_percentual || 0,
        tipo: "aula" as const,
        aulaId: item.aula_id,
        updatedAt: item.updated_at,
      }));
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user?.id,
  });

  const todos: ProgressItem[] = [...(progressoConceitos || []), ...(progressoAulas || [])]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Extract unique areas for filter
  const areasUnicas = [...new Set(todos.map(item => item.area))].sort();

  const itensFiltrados = filtroArea === "todos"
    ? todos
    : todos.filter(item => item.area === filtroArea);

  const handleClick = (item: ProgressItem) => {
    if (item.tipo === "conceitos") {
      navigate(`/conceitos/topico/${item.topicoId}`);
    } else {
      navigate(`/aula/${item.aulaId}`);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Agora";
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-sm border-b border-white/5" style={{ background: 'hsl(0 0% 7% / 0.95)' }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h1 className="font-semibold text-base">Seu Progresso</h1>
            <p className="text-[10px] text-white/40">{todos.length} {todos.length === 1 ? 'aula' : 'aulas'} em andamento</p>
          </div>
        </div>
      </div>

      {/* Area Filter Pills */}
      {areasUnicas.length > 1 && (
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Filter className="w-3.5 h-3.5 text-white/40" />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Filtrar por área</span>
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <button
              onClick={() => setFiltroArea("todos")}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                filtroArea === "todos"
                  ? "bg-amber-500 text-black"
                  : "bg-white/8 text-white/60 hover:bg-white/12"
              }`}
            >
              Todos ({todos.length})
            </button>
            {areasUnicas.map(area => {
              const count = todos.filter(i => i.area === area).length;
              return (
                <button
                  key={area}
                  onClick={() => setFiltroArea(area)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    filtroArea === area
                      ? "bg-amber-500 text-black"
                      : "bg-white/8 text-white/60 hover:bg-white/12"
                  }`}
                >
                  {area} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4 space-y-3 pb-24">
        {todos.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-sm">Nenhuma aula em andamento</p>
            <p className="text-white/25 text-xs mt-1">Comece uma aula para acompanhar seu progresso aqui</p>
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/40 text-sm">Nenhum progresso nesta área</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {itensFiltrados.map((item, i) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleClick(item)}
                className="w-full bg-white/5 border border-white/8 rounded-2xl p-4 text-left hover:bg-white/8 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500/20 rounded-xl p-2.5 mt-0.5">
                    <PlayCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-white line-clamp-2 leading-snug">{item.nome}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-semibold">
                        {item.area}
                      </span>
                      {item.materia && item.materia !== item.area && (
                        <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full">
                          {item.materia}
                        </span>
                      )}
                      <span className="text-[9px] text-white/30 flex items-center gap-0.5 ml-auto">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <Progress
                        value={item.progresso}
                        className="h-2 flex-1 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500 [&>div]:rounded-full"
                      />
                      <span className="text-xs text-amber-400 font-bold w-10 text-right">
                        {Math.round(item.progresso)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AulasDashboard;
