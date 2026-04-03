import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Search, Lock, CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { normalizeArticleNumber } from "@/lib/articleSorter";
import { useProgressoMateria } from "@/hooks/useGamificacao";
import { motion } from "framer-motion";

const ARTIGOS_POR_NIVEL = 5;

const JogoPistasTrilha = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin]);

  const { data: artigos = [], isLoading } = useQuery({
    queryKey: ["pistas-artigos-cp"],
    queryFn: async () => {
      const allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("CP - Código Penal" as any)
          .select('id, "Número do Artigo", Artigo')
          .order("ordem_artigo", { ascending: true, nullsFirst: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        if (data) allData.push(...data);
        hasMore = (data?.length || 0) === pageSize;
        page++;
      }
      const seen = new Set<string>();
      return allData
        .filter((item: any) => {
          const num = item["Número do Artigo"]?.trim();
          if (!num) return false;
          if (seen.has(num)) return false;
          seen.add(num);
          return true;
        })
        .sort((a: any, b: any) =>
          normalizeArticleNumber(a["Número do Artigo"]) - normalizeArticleNumber(b["Número do Artigo"])
        );
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: progressos = [] } = useProgressoMateria("pistas-cp");

  const niveis = useMemo(() => {
    const total = Math.ceil(artigos.length / ARTIGOS_POR_NIVEL);
    const progressoMap = new Map(progressos.map(p => [p.nivel, p]));
    return Array.from({ length: total }, (_, i) => {
      const nivel = i + 1;
      const prog = progressoMap.get(nivel);
      return {
        nivel,
        concluido: prog?.concluido || false,
        estrelas: prog?.estrelas || 0,
        artigosRange: `Art. ${artigos[i * ARTIGOS_POR_NIVEL]?.["Número do Artigo"] || "?"} - ${artigos[Math.min((i + 1) * ARTIGOS_POR_NIVEL - 1, artigos.length - 1)]?.["Número do Artigo"] || "?"}`,
      };
    });
  }, [artigos, progressos]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-sm border-b border-amber-500/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/gamificacao")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-amber-400">🔍 Detetive Jurídico</h1>
            <p className="text-xs text-muted-foreground">Código Penal — {niveis.length} níveis</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-4 flex gap-3">
        <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{niveis.filter(n => n.concluido).length}</p>
          <p className="text-xs text-muted-foreground">Concluídos</p>
        </div>
        <div className="flex-1 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-400">{niveis.reduce((a, n) => a + n.estrelas, 0)}</p>
          <p className="text-xs text-muted-foreground">⭐ Estrelas</p>
        </div>
        <div className="flex-1 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-cyan-400">{niveis.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Levels Grid */}
      <div className="px-4 space-y-3">
        {niveis.map((nivel, idx) => {
          const desbloqueado = idx === 0 || niveis[idx - 1]?.concluido;
          return (
            <motion.div
              key={nivel.nivel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <button
                disabled={!desbloqueado}
                onClick={() => navigate(`/gamificacao/jogo-pistas/${nivel.nivel}`)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  nivel.concluido
                    ? "bg-green-500/10 border-green-500/30"
                    : desbloqueado
                    ? "bg-amber-500/10 border-amber-500/30 hover:scale-[1.02]"
                    : "bg-gray-800/40 border-gray-700/30 opacity-50"
                }`}
              >
                {/* Level number */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  nivel.concluido
                    ? "bg-green-500 text-white"
                    : desbloqueado
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-gray-700 text-gray-400"
                }`}>
                  {nivel.concluido ? <CheckCircle className="w-6 h-6" /> : desbloqueado ? <Play className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">Nível {nivel.nivel}</p>
                  <p className="text-xs text-muted-foreground">{nivel.artigosRange}</p>
                </div>

                {/* Stars */}
                {nivel.concluido && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(s => (
                      <span key={s} className={s <= nivel.estrelas ? "text-amber-400" : "text-gray-600"}>⭐</span>
                    ))}
                  </div>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default JogoPistasTrilha;
