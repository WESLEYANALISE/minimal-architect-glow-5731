import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNoticiasLegislativas(limit = 20) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["noticias-legislativas", limit],
    queryFn: async () => {
      // Trigger scraping (fire and forget)
      supabase.functions.invoke("raspar-noticias-legislativas").catch(() => {});

      const { data, error } = await supabase
        .from("noticias_legislativas_cache" as any)
        .select("id, titulo, titulo_curto, descricao, link, imagem, imagem_webp, fonte, categoria, data_publicacao, analise_ia")
        .order("data_publicacao", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as any[]) || [];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

  return {
    noticias: data || [],
    loading: isLoading,
    refetch,
  };
}
