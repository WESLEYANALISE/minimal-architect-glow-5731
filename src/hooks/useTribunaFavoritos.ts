import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useTribunaFavoritos = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tribuna-favoritos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tribuna_favoritos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useIsFavorito = (fotoFlickrId: string | undefined) => {
  const { data: favoritos } = useTribunaFavoritos();
  return favoritos?.some(f => f.foto_flickr_id === fotoFlickrId) || false;
};

export const useToggleTribunaFavorito = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ fotoFlickrId, instituicaoSlug, fotoUrl, fotoTitulo, isFavorito }: {
      fotoFlickrId: string; instituicaoSlug: string; fotoUrl?: string; fotoTitulo?: string; isFavorito: boolean;
    }) => {
      if (!user) throw new Error("Não autenticado");
      if (isFavorito) {
        await supabase.from("tribuna_favoritos").delete().eq("user_id", user.id).eq("foto_flickr_id", fotoFlickrId);
      } else {
        await supabase.from("tribuna_favoritos").insert({
          user_id: user.id, foto_flickr_id: fotoFlickrId, instituicao_slug: instituicaoSlug,
          foto_url: fotoUrl || null, foto_titulo: fotoTitulo || null,
        });
      }
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["tribuna-favoritos"] });
      toast.success(v.isFavorito ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: () => toast.error("Erro ao atualizar favorito"),
  });
};
