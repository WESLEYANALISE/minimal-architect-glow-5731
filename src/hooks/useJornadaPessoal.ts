import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AulaEmAndamento {
  topico_id: number;
  titulo: string;
  materia_nome: string;
  materia_id: number;
  progresso: number;
  capa_url: string | null;
  updated_at: string;
}

export interface LeituraEmAndamento {
  id: string;
  titulo: string;
  capa_url: string | null;
  progresso: number;
  status: string;
  biblioteca_tabela: string;
  item_id: number;
  updated_at: string;
}

export interface FlashcardArea {
  area: string;
  total: number;
  compreendi: number;
  revisar: number;
}

export interface ResumoRecente {
  page_path: string;
  page_title: string;
  created_at: string;
  visitas: number;
}

export interface JuriflixRecomendacao {
  id: number;
  nome: string;
  capa: string | null;
  poster_path: string | null;
  nota: string | null;
  tipo: string | null;
  ano: number | null;
}

export interface JornadaStats {
  totalAulas: number;
  totalLivros: number;
  streak: number;
  maxStreak: number;
  areaMaisEstudada: string | null;
}

export function useJornadaPessoal() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: aulasProgresso, isLoading: loadingAulas } = useQuery({
    queryKey: ["jornada-aulas", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: progresso } = await supabase
        .from("conceitos_topicos_progresso")
        .select("topico_id, progresso_porcentagem, updated_at")
        .eq("user_id", userId)
        .gt("progresso_porcentagem", 0)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (!progresso || progresso.length === 0) return [];

      const topicoIds = progresso.map((p) => p.topico_id);
      const { data: topicos } = await supabase
        .from("conceitos_topicos")
        .select("id, titulo, materia_id, capa_url")
        .in("id", topicoIds);

      if (!topicos) return [];

      const materiaIds = [...new Set(topicos.map((t) => t.materia_id))];
      const { data: materias } = await supabase
        .from("conceitos_materias")
        .select("id, nome")
        .in("id", materiaIds);

      const materiaMap = Object.fromEntries((materias || []).map((m) => [m.id, m.nome]));
      const topicoMap = Object.fromEntries(topicos.map((t) => [t.id, t]));

      return progresso
        .filter((p) => topicoMap[p.topico_id])
        .map((p): AulaEmAndamento => ({
          topico_id: p.topico_id,
          titulo: topicoMap[p.topico_id].titulo,
          materia_nome: materiaMap[topicoMap[p.topico_id].materia_id] || "",
          materia_id: topicoMap[p.topico_id].materia_id,
          progresso: p.progresso_porcentagem,
          capa_url: topicoMap[p.topico_id].capa_url,
          updated_at: p.updated_at,
        }));
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  const { data: leituras, isLoading: loadingLeituras } = useQuery({
    queryKey: ["jornada-leituras", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("biblioteca_plano_leitura")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["lendo", "quero_ler"])
        .order("updated_at", { ascending: false })
        .limit(20);
      return (data || []).map((d): LeituraEmAndamento => ({
        id: d.id,
        titulo: d.titulo,
        capa_url: d.capa_url,
        progresso: d.progresso,
        status: d.status,
        biblioteca_tabela: d.biblioteca_tabela,
        item_id: d.item_id,
        updated_at: d.updated_at,
      }));
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  const { data: flashcardsData, isLoading: loadingFlashcards } = useQuery({
    queryKey: ["jornada-flashcards", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("flashcard_study_progress")
        .select("area, status")
        .eq("user_id", userId);
      if (!data) return [];
      const areaMap: Record<string, { total: number; compreendi: number; revisar: number }> = {};
      for (const item of data) {
        if (!item.area) continue;
        if (!areaMap[item.area]) areaMap[item.area] = { total: 0, compreendi: 0, revisar: 0 };
        areaMap[item.area].total++;
        if (item.status === "compreendi") areaMap[item.area].compreendi++;
        else areaMap[item.area].revisar++;
      }
      return Object.entries(areaMap).map(([area, counts]): FlashcardArea => ({ area, ...counts }));
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  const { data: resumos, isLoading: loadingResumos } = useQuery({
    queryKey: ["jornada-resumos", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("page_views")
        .select("page_path, page_title, created_at")
        .eq("user_id", userId)
        .like("page_path", "%/resumos/%")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!data) return [];
      // Group by path, count visits
      const pathMap: Record<string, { title: string; count: number; latest: string }> = {};
      for (const v of data) {
        if (!pathMap[v.page_path]) {
          pathMap[v.page_path] = { title: v.page_title || v.page_path, count: 0, latest: v.created_at };
        }
        pathMap[v.page_path].count++;
      }
      return Object.entries(pathMap)
        .map(([path, info]): ResumoRecente => ({
          page_path: path,
          page_title: info.title,
          created_at: info.latest,
          visitas: info.count,
        }))
        .slice(0, 10);
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  const { data: juriflix, isLoading: loadingJuriflix } = useQuery({
    queryKey: ["jornada-juriflix"],
    queryFn: async () => {
      const { data } = await supabase
        .from("JURIFLIX")
        .select("id, nome, capa, poster_path, nota, tipo, ano")
        .order("popularidade", { ascending: false })
        .limit(10);
      return (data || []) as JuriflixRecomendacao[];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: streakData } = useQuery({
    queryKey: ["jornada-streak", userId],
    queryFn: async () => {
      if (!userId) return { current_streak: 0, max_streak: 0 };
      const { data } = await supabase
        .from("flashcard_study_streaks")
        .select("current_streak, max_streak")
        .eq("user_id", userId)
        .maybeSingle();
      return data || { current_streak: 0, max_streak: 0 };
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  });

  // Areas mais estudadas from flashcards + aulas
  const areasEstudadas = (() => {
    const areaCount: Record<string, number> = {};
    for (const f of flashcardsData || []) {
      areaCount[f.area] = (areaCount[f.area] || 0) + f.total;
    }
    for (const a of aulasProgresso || []) {
      const area = a.materia_nome;
      if (area) areaCount[area] = (areaCount[area] || 0) + 1;
    }
    return Object.entries(areaCount)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  })();

  const stats: JornadaStats = {
    totalAulas: aulasProgresso?.filter((a) => a.progresso >= 100).length || 0,
    totalLivros: leituras?.filter((l) => l.status === "lido").length || 0,
    streak: streakData?.current_streak || 0,
    maxStreak: streakData?.max_streak || 0,
    areaMaisEstudada: areasEstudadas[0]?.area || null,
  };

  return {
    aulasProgresso: aulasProgresso || [],
    leituras: leituras || [],
    flashcardsData: flashcardsData || [],
    resumos: resumos || [],
    juriflix: juriflix || [],
    areasEstudadas,
    stats,
    isLoading: loadingAulas || loadingLeituras || loadingFlashcards || loadingResumos || loadingJuriflix,
    isLoggedIn: !!userId,
  };
}
