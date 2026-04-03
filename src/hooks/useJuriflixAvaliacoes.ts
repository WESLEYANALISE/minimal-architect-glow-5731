import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useJuriflixAvaliacaoMedia = (juriflixId: number | undefined) => {
  return useQuery({
    queryKey: ['juriflix-avaliacao-media', juriflixId],
    queryFn: async () => {
      if (!juriflixId) return { media: 0, total: 0 };

      const { data, error } = await supabase
        .from('juriflix_avaliacoes' as any)
        .select('nota')
        .eq('juriflix_id', juriflixId);

      if (error) throw error;
      if (!data || data.length === 0) return { media: 0, total: 0 };

      const notas = data.map((d: any) => d.nota);
      const soma = notas.reduce((a: number, b: number) => a + b, 0);
      return { media: soma / notas.length, total: notas.length };
    },
    enabled: !!juriflixId,
  });
};

export const useJuriflixMinhaAvaliacao = (juriflixId: number | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['juriflix-minha-avaliacao', juriflixId, user?.id],
    queryFn: async () => {
      if (!juriflixId || !user) return null;

      const { data, error } = await supabase
        .from('juriflix_avaliacoes' as any)
        .select('*')
        .eq('juriflix_id', juriflixId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as { id: string; nota: number } | null;
    },
    enabled: !!juriflixId && !!user,
  });
};

export const useAvaliarJuriflix = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ juriflixId, nota }: { juriflixId: number; nota: number }) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('juriflix_avaliacoes' as any)
        .upsert(
          {
            juriflix_id: juriflixId,
            user_id: user.id,
            nota,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'juriflix_id,user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['juriflix-avaliacao-media', variables.juriflixId] });
      queryClient.invalidateQueries({ queryKey: ['juriflix-minha-avaliacao', variables.juriflixId] });
      toast.success('Avaliação salva! ⭐');
    },
    onError: () => {
      toast.error('Erro ao salvar avaliação');
    },
  });
};
