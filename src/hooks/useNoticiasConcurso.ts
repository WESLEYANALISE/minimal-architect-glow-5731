import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNoticiasConcurso(cargo: string, limit = 10) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["noticias-concurso", cargo, limit],
    queryFn: async () => {
      // Fire and forget scraping
      supabase.functions.invoke("raspar-noticias-concursos", {
        body: { cargo },
      }).catch(() => {});

      const { data, error } = await supabase
        .from("noticias_concursos_cache" as any)
        .select("*")
        .ilike("cargo", `%${cargo}%`)
        .order("data_publicacao", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as any[]) || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  return { noticias: data || [], loading: isLoading, refetch };
}
