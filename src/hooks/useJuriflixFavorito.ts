import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useJuriflixFavorito(juriflixId: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorito } = useQuery({
    queryKey: ["juriflix-favorito", user?.id, juriflixId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from("juriflix_favoritos")
        .select("id")
        .eq("user_id", user.id)
        .eq("juriflix_id", juriflixId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!juriflixId,
  });

  const isFavorited = !!favorito;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error("Faça login para favoritar");
        throw new Error("Not authenticated");
      }
      if (isFavorited) {
        const { error } = await (supabase as any)
          .from("juriflix_favoritos")
          .delete()
          .eq("id", favorito.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("juriflix_favoritos")
          .insert({ user_id: user.id, juriflix_id: juriflixId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["juriflix-favorito", user?.id, juriflixId] });
      queryClient.invalidateQueries({ queryKey: ["juriflix-favoritos-all", user?.id] });
      toast.success(isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos ❤️");
    },
    onError: () => {
      toast.error("Erro ao atualizar favorito");
    },
  });

  return { isFavorited, toggle: toggleMutation.mutate, isLoading: toggleMutation.isPending };
}

export function useJuriflixFavoritos() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["juriflix-favoritos-all", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("juriflix_favoritos")
        .select("juriflix_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as { juriflix_id: number; created_at: string }[];
    },
    enabled: !!user,
  });
}
