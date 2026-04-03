import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TribunaComentario {
  id: string;
  foto_flickr_id: string;
  user_id: string;
  parent_id: string | null;
  conteudo: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: { nome: string | null; avatar_url: string | null };
  respostas?: TribunaComentario[];
  user_liked?: boolean;
}

export const useTribunaComentarios = (fotoFlickrId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tribuna-comentarios", fotoFlickrId],
    queryFn: async () => {
      if (!fotoFlickrId) return [];

      const { data: comentarios, error } = await supabase
        .from("tribuna_comentarios")
        .select("*")
        .eq("foto_flickr_id", fotoFlickrId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!comentarios?.length) return [];

      const userIds = [...new Set(comentarios.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      let userLikesSet = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from("tribuna_comentarios_likes")
          .select("comentario_id")
          .eq("user_id", user.id);
        userLikesSet = new Set(likes?.map(l => l.comentario_id) || []);
      }

      const map = new Map<string, TribunaComentario>();
      const roots: TribunaComentario[] = [];

      comentarios.forEach(c => {
        map.set(c.id, {
          ...c,
          user: profilesMap.get(c.user_id) || { nome: "Usuário", avatar_url: null },
          respostas: [],
          user_liked: userLikesSet.has(c.id),
        });
      });

      comentarios.forEach(c => {
        const item = map.get(c.id)!;
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id)!.respostas!.push(item);
        } else if (!c.parent_id) {
          roots.push(item);
        }
      });

      roots.forEach(r => r.respostas?.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));

      return roots;
    },
    enabled: !!fotoFlickrId,
  });
};

export const useAddTribunaComentario = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ fotoFlickrId, conteudo, parentId }: { fotoFlickrId: string; conteudo: string; parentId?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("tribuna_comentarios")
        .insert({ foto_flickr_id: fotoFlickrId, user_id: user.id, conteudo, parent_id: parentId || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["tribuna-comentarios", v.fotoFlickrId] });
      toast.success("Comentário adicionado!");
    },
    onError: () => toast.error("Erro ao comentar"),
  });
};

export const useDeleteTribunaComentario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ comentarioId, fotoFlickrId }: { comentarioId: string; fotoFlickrId: string }) => {
      const { error } = await supabase.from("tribuna_comentarios").delete().eq("id", comentarioId);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["tribuna-comentarios", v.fotoFlickrId] });
      toast.success("Comentário removido");
    },
    onError: () => toast.error("Erro ao remover"),
  });
};

export const useLikeTribunaComentario = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ comentarioId, isLiked, fotoFlickrId }: { comentarioId: string; isLiked: boolean; fotoFlickrId: string }) => {
      if (!user) throw new Error("Não autenticado");
      if (isLiked) {
        await supabase.from("tribuna_comentarios_likes").delete().eq("comentario_id", comentarioId).eq("user_id", user.id);
      } else {
        await supabase.from("tribuna_comentarios_likes").insert({ comentario_id: comentarioId, user_id: user.id });
      }
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["tribuna-comentarios", v.fotoFlickrId] }),
  });
};
