import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export interface Avaliacao {
  id: string;
  user_id: string;
  tipo: 'filme' | 'livro';
  item_data: string;
  status: 'assistido' | 'pretendo_assistir' | 'lido' | 'pretendo_ler';
  nota: number | null;
  comentario: string | null;
  created_at: string;
}

function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  return userId;
}

export function useAvaliacoes(tipo: 'filme' | 'livro', itemData: string | null) {
  return useQuery({
    queryKey: ['avaliacoes', tipo, itemData],
    queryFn: async (): Promise<Avaliacao[]> => {
      if (!itemData) return [];
      const { data, error } = await (supabase as any)
        .from('avaliacoes_recomendacoes')
        .select('*')
        .eq('tipo', tipo)
        .eq('item_data', itemData)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!itemData,
    staleTime: 1000 * 60 * 2,
  });
}

export function useMinhaAvaliacao(tipo: 'filme' | 'livro', itemData: string | null) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['minha-avaliacao', tipo, itemData, userId],
    queryFn: async (): Promise<Avaliacao | null> => {
      if (!itemData || !userId) return null;
      const { data, error } = await (supabase as any)
        .from('avaliacoes_recomendacoes')
        .select('*')
        .eq('tipo', tipo)
        .eq('item_data', itemData)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!itemData && !!userId,
  });
}

export function useSalvarAvaliacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      tipo: 'filme' | 'livro';
      itemData: string;
      status: string;
      nota?: number;
      comentario?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await (supabase as any)
        .from('avaliacoes_recomendacoes')
        .upsert({
          user_id: user.id,
          tipo: params.tipo,
          item_data: params.itemData,
          status: params.status,
          nota: params.nota || null,
          comentario: params.comentario || null,
        }, { onConflict: 'user_id,tipo,item_data' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes', variables.tipo, variables.itemData] });
      queryClient.invalidateQueries({ queryKey: ['minha-avaliacao', variables.tipo, variables.itemData] });
    },
  });
}

export function useResumoAvaliacoes(tipo: 'filme' | 'livro', itemData: string | null) {
  const { data: avaliacoes = [] } = useAvaliacoes(tipo, itemData);

  const comNota = avaliacoes.filter(a => a.nota);
  const media = comNota.length > 0
    ? comNota.reduce((sum, a) => sum + (a.nota || 0), 0) / comNota.length
    : 0;
  const comentarios = avaliacoes
    .filter(a => a.comentario)
    .slice(0, 5);
  const total = avaliacoes.filter(a => a.status === (tipo === 'filme' ? 'assistido' : 'lido')).length;

  return { media, total, comentarios, totalAvaliacoes: avaliacoes.length };
}
