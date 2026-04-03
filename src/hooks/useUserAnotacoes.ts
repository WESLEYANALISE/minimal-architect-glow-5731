import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Anotacao {
  id: string;
  user_id: string;
  titulo: string;
  conteudo: string;
  cor: string;
  importante: boolean;
  data_referencia: string;
  categoria: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateAnotacaoInput {
  titulo: string;
  conteudo: string;
  cor?: string;
  importante?: boolean;
  data_referencia?: string;
  categoria?: string | null;
}

interface UpdateAnotacaoInput {
  id: string;
  titulo?: string;
  conteudo?: string;
  cor?: string;
  importante?: boolean;
  data_referencia?: string;
  categoria?: string | null;
}

export const useUserAnotacoes = (filtroData?: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: anotacoes = [], isLoading } = useQuery({
    queryKey: ['user-anotacoes', user?.id, filtroData],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('user_anotacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filtroData) {
        query = query.eq('data_referencia', filtroData);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Anotacao[];
    },
    enabled: !!user?.id,
  });

  const { data: anotacoesRecentes = [] } = useQuery({
    queryKey: ['user-anotacoes-recentes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_anotacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as Anotacao[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateAnotacaoInput) => {
      if (!user?.id) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('user_anotacoes')
        .insert({
          user_id: user.id,
          titulo: input.titulo,
          conteudo: input.conteudo,
          cor: input.cor || '#FEF7CD',
          importante: input.importante || false,
          data_referencia: input.data_referencia || new Date().toISOString().split('T')[0],
          categoria: input.categoria || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-anotacoes'] });
      queryClient.invalidateQueries({ queryKey: ['user-anotacoes-recentes'] });
      queryClient.invalidateQueries({ queryKey: ['user-anotacoes-mes'] });
      toast.success('Anotação salva!');
    },
    onError: () => toast.error('Erro ao salvar anotação'),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateAnotacaoInput) => {
      if (!user?.id) throw new Error('Não autenticado');
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('user_anotacoes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-anotacoes'] });
      queryClient.invalidateQueries({ queryKey: ['user-anotacoes-recentes'] });
      queryClient.invalidateQueries({ queryKey: ['user-anotacoes-mes'] });
      toast.success('Anotação atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('user_anotacoes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-anotacoes'] });
      queryClient.invalidateQueries({ queryKey: ['user-anotacoes-recentes'] });
      queryClient.invalidateQueries({ queryKey: ['user-anotacoes-mes'] });
      toast.success('Anotação removida');
    },
    onError: () => toast.error('Erro ao remover'),
  });

  return {
    anotacoes,
    anotacoesRecentes,
    isLoading,
    createAnotacao: createMutation.mutateAsync,
    updateAnotacao: updateMutation.mutateAsync,
    deleteAnotacao: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useAnotacoesMes = (ano: number, mes: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-anotacoes-mes', user?.id, ano, mes],
    queryFn: async () => {
      if (!user?.id) return [];
      const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const endDate = mes === 12
        ? `${ano + 1}-01-01`
        : `${ano}-${String(mes + 1).padStart(2, '0')}-01`;

      const { data, error } = await supabase
        .from('user_anotacoes')
        .select('id, data_referencia, cor, importante, titulo')
        .eq('user_id', user.id)
        .gte('data_referencia', startDate)
        .lt('data_referencia', endDate);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};
