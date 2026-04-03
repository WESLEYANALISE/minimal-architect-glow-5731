import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Loader2, Trophy, Star, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { TrilhaSerpentinaCasoPratico } from "@/components/gamificacao/TrilhaSerpentinaCasoPratico";
import bgPenal from "@/assets/caso-pratico-bg-penal.jpg?format=webp&quality=75";

const CasoPraticoTrilha = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin]);

  // Fetch all articles from CP - Código Penal (Vade Mecum table)
  const { data: artigos = [], isLoading: loadingArtigos } = useQuery({
    queryKey: ["caso-pratico-artigos-cp"],
    queryFn: async () => {
      const allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("CP - Código Penal" as any)
          .select("id, \"Número do Artigo\", Artigo")
          .order("ordem_artigo", { ascending: true, nullsFirst: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        if (data) allData.push(...data);
        hasMore = (data?.length || 0) === pageSize;
        page++;
      }
      // Filter out articles without number and deduplicate
      const seen = new Set<string>();
      return allData
        .filter((item: any) => {
          const num = item["Número do Artigo"]?.trim();
          if (!num) return false;
          if (seen.has(num)) return false;
          seen.add(num);
          return true;
        })
        .map((item: any) => ({
          id: item.id,
          tema: item["Número do Artigo"].trim(),
          artigo: item.Artigo,
        }));
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch existing cases status
  const { data: casos = [] } = useQuery({
    queryKey: ["caso-pratico-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gamificacao_casos_praticos")
        .select("numero_artigo, status, progresso_geracao")
        .eq("area", "Código Penal");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  // Fetch user progress
  const { data: progressos = [] } = useQuery({
    queryKey: ["caso-pratico-progresso", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("gamificacao_casos_praticos_progresso")
        .select("caso_id, concluido, pontuacao, acertos, total_questoes")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const casosMap = useMemo(() => {
    const m: Record<string, any> = {};
    casos.forEach(c => { m[c.numero_artigo] = c; });
    return m;
  }, [casos]);

  const { data: casosIds = [] } = useQuery({
    queryKey: ["caso-pratico-ids"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gamificacao_casos_praticos")
        .select("id, numero_artigo")
        .eq("area", "Código Penal");
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const progressoMap = useMemo(() => {
    const casoIdToArtigo: Record<number, string> = {};
    casosIds.forEach((c: any) => { casoIdToArtigo[c.id] = c.numero_artigo; });
    const m: Record<string, any> = {};
    progressos.forEach((p: any) => {
      const artigo = casoIdToArtigo[p.caso_id];
      if (artigo) m[artigo] = p;
    });
    return m;
  }, [progressos, casosIds]);

  const sortedArtigos = useMemo(() => {
    return artigos.map((a: any) => {
      const caso = casosMap[a.tema];
      const prog = progressoMap[a.tema];
      return {
        ...a,
        casoStatus: caso?.status,
        casoProgresso: caso?.progresso_geracao,
        concluido: prog?.concluido || false,
        pontuacao: prog?.pontuacao || 0,
      };
    });
  }, [artigos, casosMap, progressoMap]);

  const stats = useMemo(() => {
    const concluidos = sortedArtigos.filter(a => a.concluido).length;
    const gerados = sortedArtigos.filter(a => a.casoStatus === 'concluido').length;
    const totalPontos = sortedArtigos.reduce((sum, a) => sum + (a.pontuacao || 0), 0);
    return { concluidos, gerados, totalPontos };
  }, [sortedArtigos]);

  if (loadingArtigos) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <img
          src={bgPenal}
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/gamificacao")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Caso Prático</h1>
          <p className="text-xs text-muted-foreground">
            Código Penal • {sortedArtigos.length} artigos
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/gamificacao/ranking")} className="gap-1">
          <Trophy className="w-4 h-4 text-amber-500" />
        </Button>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-4 pb-2">
        <div className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-foreground">{stats.concluidos}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-amber-500">{stats.totalPontos} pts</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              <span className="font-bold text-foreground">{stats.concluidos}</span>/{sortedArtigos.length}
            </span>
          </div>
        </div>
      </div>

      {/* Serpentine Trail */}
      <div className="relative z-10">
        <TrilhaSerpentinaCasoPratico
          artigos={sortedArtigos}
          onArtigoClick={(tema) => navigate(`/gamificacao/caso-pratico/${encodeURIComponent(tema)}`)}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
};

export default CasoPraticoTrilha;
