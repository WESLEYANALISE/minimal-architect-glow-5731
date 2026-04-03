import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FavoritoData {
  id: string;
  video_id: string;
  titulo: string;
  thumbnail: string | null;
  created_at: string;
}

export function useVideoaulaFavorito(tabela: string, videoId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorito } = useQuery({
    queryKey: ["videoaula-favorito", user?.id, tabela, videoId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("videoaulas_favoritos")
        .select("id")
        .eq("user_id", user.id)
        .eq("tabela", tabela)
        .eq("video_id", videoId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!videoId,
  });

  const isFavorited = !!favorito;

  const toggleMutation = useMutation({
    mutationFn: async ({ titulo, thumbnail }: { titulo: string; thumbnail?: string | null }) => {
      if (!user) {
        toast.error("Faça login para favoritar");
        throw new Error("Not authenticated");
      }
      if (isFavorited) {
        const { error } = await (supabase as any)
          .from("videoaulas_favoritos")
          .delete()
          .eq("id", favorito.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("videoaulas_favoritos")
          .insert({
            user_id: user.id,
            tabela,
            video_id: videoId,
            titulo,
            thumbnail: thumbnail || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoaula-favorito", user?.id, tabela, videoId] });
      queryClient.invalidateQueries({ queryKey: ["videoaulas-favoritos", user?.id, tabela] });
      toast.success(isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: () => {
      toast.error("Erro ao atualizar favorito");
    },
  });

  return { isFavorited, toggle: toggleMutation.mutate, isLoading: toggleMutation.isPending };
}

export function useVideoaulasFavoritas(tabela: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["videoaulas-favoritos", user?.id, tabela],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("videoaulas_favoritos")
        .select("*")
        .eq("user_id", user.id)
        .eq("tabela", tabela)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as FavoritoData[];
    },
    enabled: !!user,
  });
}
