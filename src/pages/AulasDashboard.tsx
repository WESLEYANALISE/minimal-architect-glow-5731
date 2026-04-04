import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, PlayCircle, Clock, Filter, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

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
        .eq("user_id", user.id).eq("leitura_completa", false).gt("progresso_leitura", 0)
        .order("updated_at", { ascending: false });
      if (!progressoData?.length) return [];
      const topicoIds = progressoData.map(p => p.topico_id);
      const { data: topicos } = await supabase.from("conceitos_topicos").select("id, titulo, materia_id").in("id", topicoIds);
      const materiaIds = [...new Set((topicos || []).map((t: any) => t.materia_id).filter(Boolean))];
      let materiasMap = new Map<number, string>();
      if (materiaIds.length > 0) {
        const { data: materias } = await supabase.from("conceitos_materias").select("id, nome, area").in("id", materiaIds);
        (materias || []).forEach((m: any) => materiasMap.set(m.id, m.nome));
      }
      const topicosMap = new Map((topicos || []).map((t: any) => [t.id, t]));
      return progressoData.map((item: any) => {
        const topico = topicosMap.get(item.topico_id);
        const materiaNome = topico?.materia_id ? materiasMap.get(topico.materia_id) : null;
        return { id: item.id, nome: topico?.titulo || "Tópico", area: materiaNome || "Conceitos", materia: "Conceitos", progresso: item.progresso_leitura || 0, tipo: "conceitos" as const, topicoId: item.topico_id, updatedAt: item.updated_at };
      });
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user?.id,
  });

  const { data: progressoAulas } = useQuery({
    queryKey: ["dashboard-progresso-aulas", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("aulas_progresso").select("*, aulas_interativas(titulo, area, tema)")
        .eq("user_id", user.id).eq("concluida", false).gt("progresso_percentual", 0).order("updated_at", { ascending: false });
      return (data || []).map((item: any) => ({
        id: item.id, nome: item.aulas_interativas?.titulo || "Aula", area: item.aulas_interativas?.area || "Aula Interativa",
        materia: item.aulas_interativas?.tema || "", progresso: item.progresso_percentual || 0, tipo: "aula" as const, aulaId: item.aula_id, updatedAt: item.updated_at,
      }));
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user?.id,
  });

  const todos: ProgressItem[] = [...(progressoConceitos || []), ...(progressoAulas || [])]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const areasUnicas = [...new Set(todos.map(item => item.area))].sort();
  const itensFiltrados = filtroArea === "todos" ? todos : todos.filter(item => item.area === filtroArea);

  const handleClick = (item: ProgressItem) => {
    if (item.tipo === "conceitos") navigate(`/conceitos/topico/${item.topicoId}`);
    else navigate(`/aula/${item.aulaId}`);
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-sm" style={{ background: 'hsla(345, 65%, 25%, 0.95)', borderBottom: '1px solid hsla(40, 60%, 50%, 0.1)' }}>
        <div className="flex items-center gap-3 px-4 py-3 relative z-10">
          <Crown className="w-5 h-5" style={{ color: GOLD }} />
          <div>
            <h1 className="font-semibold text-base" style={{ color: 'hsl(40, 60%, 85%)' }}>Seu Progresso</h1>
            <p className="text-[10px]" style={{ color: 'hsl(40, 20%, 55%)' }}>{todos.length} {todos.length === 1 ? 'aula' : 'aulas'} em andamento</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      {areasUnicas.length > 1 && (
        <div className="px-4 pt-4 pb-2 relative z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <Filter className="w-3.5 h-3.5" style={{ color: 'hsl(40, 20%, 50%)' }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(40, 20%, 50%)' }}>Filtrar por área</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setFiltroArea("todos")}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
              style={filtroArea === "todos" ? { background: GOLD, color: 'hsl(350, 40%, 12%)' } : { background: 'hsla(40, 60%, 50%, 0.08)', color: 'hsl(40, 20%, 60%)' }}>
              Todos ({todos.length})
            </button>
            {areasUnicas.map(area => {
              const count = todos.filter(i => i.area === area).length;
              return (
                <button key={area} onClick={() => setFiltroArea(area)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                  style={filtroArea === area ? { background: GOLD, color: 'hsl(350, 40%, 12%)' } : { background: 'hsla(40, 60%, 50%, 0.08)', color: 'hsl(40, 20%, 60%)' }}>
                  {area} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4 space-y-3 pb-24 relative z-10">
        {todos.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsla(40, 80%, 55%, 0.2)' }} />
            <p className="text-sm" style={{ color: 'hsl(40, 20%, 50%)' }}>Nenhuma aula em andamento</p>
            <p className="text-xs mt-1" style={{ color: 'hsl(40, 20%, 40%)' }}>Comece uma aula para acompanhar seu progresso aqui</p>
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: 'hsl(40, 20%, 50%)' }}>Nenhum progresso nesta área</p>
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
                className="w-full rounded-2xl p-4 text-left transition-colors backdrop-blur-sm"
                style={{ background: 'hsla(345, 30%, 18%, 0.7)', border: '1px solid hsla(40, 60%, 50%, 0.1)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2.5 mt-0.5" style={{ background: 'hsla(40, 80%, 55%, 0.12)' }}>
                    <PlayCircle className="w-5 h-5" style={{ color: GOLD }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 leading-snug" style={{ color: 'hsl(40, 60%, 90%)' }}>{item.nome}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'hsla(40, 80%, 55%, 0.12)', color: GOLD }}>
                        {item.area}
                      </span>
                      {item.materia && item.materia !== item.area && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'hsla(40, 60%, 50%, 0.06)', color: 'hsl(40, 20%, 55%)' }}>
                          {item.materia}
                        </span>
                      )}
                      <span className="text-[9px] flex items-center gap-0.5 ml-auto" style={{ color: 'hsl(40, 20%, 45%)' }}>
                        <Clock className="w-3 h-3" />
                        {formatDate(item.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <Progress
                        value={item.progresso}
                        className="h-2 flex-1"
                        style={{ background: 'hsla(40, 60%, 50%, 0.1)' }}
                      />
                      <span className="text-xs font-bold w-10 text-right" style={{ color: GOLD }}>
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
