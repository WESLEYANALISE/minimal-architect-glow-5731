import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useDeputadoFavorito = (deputadoId: number) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: favorito } = useQuery({
    queryKey: ["deputado-favorito", user?.id, deputadoId],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("deputados_favoritos" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("deputado_id", deputadoId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!deputadoId,
  });

  const isFavorited = !!favorito;

  const toggleMutation = useMutation({
    mutationFn: async (meta?: { nome?: string; partido?: string; uf?: string; foto?: string }) => {
      if (!user) throw new Error("Login necessário");
      if (isFavorited) {
        await supabase.from("deputados_favoritos" as any).delete().eq("id", (favorito as any).id);
      } else {
        await (supabase as any).from("deputados_favoritos").insert({
          user_id: user.id,
          deputado_id: deputadoId,
          deputado_nome: meta?.nome || null,
          deputado_partido: meta?.partido || null,
          deputado_uf: meta?.uf || null,
          deputado_foto: meta?.foto || null,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deputado-favorito", user?.id, deputadoId] });
      qc.invalidateQueries({ queryKey: ["deputados-favoritos"] });
      toast.success(isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: () => toast.error("Erro ao atualizar favorito"),
  });

  return { isFavorited, toggle: toggleMutation.mutate, isLoading: toggleMutation.isPending };
};

export const useDeputadosFavoritos = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["deputados-favoritos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("deputados_favoritos" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });
};
