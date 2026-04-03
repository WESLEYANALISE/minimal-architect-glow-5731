import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface JuriflixComentario {
  id: string;
  juriflix_id: number;
  user_id: string;
  parent_id: string | null;
  conteudo: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    nome: string | null;
    avatar_url: string | null;
  };
  respostas?: JuriflixComentario[];
  user_liked?: boolean;
}

export const useJuriflixComentarios = (juriflixId: number | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['juriflix-comentarios', juriflixId],
    queryFn: async () => {
      if (!juriflixId) return [];

      const { data: comentarios, error } = await supabase
        .from('juriflix_comentarios')
        .select('*')
        .eq('juriflix_id', juriflixId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!comentarios || comentarios.length === 0) return [];

      const userIds = [...new Set(comentarios.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      let userLikesSet = new Set<string>();
      if (user) {
        const { data: userLikes } = await supabase
          .from('juriflix_comentarios_likes')
          .select('comentario_id')
          .eq('user_id', user.id);
        userLikesSet = new Set(userLikes?.map(l => l.comentario_id) || []);
      }

      const comentariosMap = new Map<string, JuriflixComentario>();
      const rootComentarios: JuriflixComentario[] = [];

      comentarios.forEach(c => {
        const comentario: JuriflixComentario = {
          ...c,
          user: profilesMap.get(c.user_id) || { nome: 'Usuário', avatar_url: null },
          respostas: [],
          user_liked: userLikesSet.has(c.id)
        };
        comentariosMap.set(c.id, comentario);
      });

      comentarios.forEach(c => {
        const comentario = comentariosMap.get(c.id)!;
        if (c.parent_id && comentariosMap.has(c.parent_id)) {
          comentariosMap.get(c.parent_id)!.respostas!.push(comentario);
        } else if (!c.parent_id) {
          rootComentarios.push(comentario);
        }
      });

      rootComentarios.forEach(c => {
        c.respostas?.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      return rootComentarios;
    },
    enabled: !!juriflixId
  });
};

export const useAddJuriflixComentario = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      juriflixId,
      conteudo,
      parentId
    }: {
      juriflixId: number;
      conteudo: string;
      parentId?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('juriflix_comentarios')
        .insert({
          juriflix_id: juriflixId,
          user_id: user.id,
          conteudo,
          parent_id: parentId || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juriflix-comentarios', variables.juriflixId] });
      toast.success('Comentário adicionado!');
    },
    onError: () => {
      toast.error('Erro ao adicionar comentário');
    }
  });
};

export const useEditJuriflixComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      comentarioId,
      conteudo,
      juriflixId
    }: {
      comentarioId: string;
      conteudo: string;
      juriflixId: number;
    }) => {
      const { error } = await supabase
        .from('juriflix_comentarios')
        .update({ conteudo, updated_at: new Date().toISOString() })
        .eq('id', comentarioId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juriflix-comentarios', variables.juriflixId] });
      toast.success('Comentário editado!');
    },
    onError: () => {
      toast.error('Erro ao editar comentário');
    }
  });
};

export const useDeleteJuriflixComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      comentarioId,
      juriflixId
    }: {
      comentarioId: string;
      juriflixId: number;
    }) => {
      const { error } = await supabase
        .from('juriflix_comentarios')
        .delete()
        .eq('id', comentarioId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juriflix-comentarios', variables.juriflixId] });
      toast.success('Comentário removido');
    },
    onError: () => {
      toast.error('Erro ao remover comentário');
    }
  });
};

export const useLikeJuriflixComentario = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      comentarioId,
      isLiked,
      juriflixId
    }: {
      comentarioId: string;
      isLiked: boolean;
      juriflixId: number;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      if (isLiked) {
        const { error } = await supabase
          .from('juriflix_comentarios_likes')
          .delete()
          .eq('comentario_id', comentarioId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('juriflix_comentarios_likes')
          .insert({
            comentario_id: comentarioId,
            user_id: user.id
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juriflix-comentarios', variables.juriflixId] });
    }
  });
};
