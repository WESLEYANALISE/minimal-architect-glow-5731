import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

interface UseArtigoAnotacoesProps {
  tabelaCodigo: string;
  numeroArtigo: string;
  artigoId: number;
}

interface AnotacaoData {
  id: string;
  user_id: string;
  tabela_codigo: string;
  numero_artigo: string;
  artigo_id: number;
  anotacao: string;
  updated_at: string;
  created_at: string;
}

export const useArtigoAnotacoes = ({
  tabelaCodigo,
  numeroArtigo,
  artigoId
}: UseArtigoAnotacoesProps) => {
  const { user } = useAuth();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const hasAccess = isPremium || loadingSubscription;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [shouldShowPremiumModal, setShouldShowPremiumModal] = useState(false);

  const { data: anotacaoData, isLoading } = useQuery({
    queryKey: ['artigo-anotacao', user?.id, tabelaCodigo, numeroArtigo],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('artigos_anotacoes')
        .select('*')
        .eq('user_id', user.id)
        .eq('tabela_codigo', tabelaCodigo)
        .eq('numero_artigo', numeroArtigo)
        .maybeSingle();
      
      if (error) throw error;
      return data as AnotacaoData | null;
    },
    enabled: !!user?.id && !!tabelaCodigo && !!numeroArtigo
  });

  const anotacao = anotacaoData?.anotacao || '';

  const saveMutation = useMutation({
    mutationFn: async (novaAnotacao: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('artigos_anotacoes')
        .upsert({
          user_id: user.id,
          tabela_codigo: tabelaCodigo,
          numero_artigo: numeroArtigo,
          artigo_id: artigoId,
          anotacao: novaAnotacao,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tabela_codigo,numero_artigo'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artigo-anotacao', user?.id, tabelaCodigo, numeroArtigo] });
      toast.success('Anotação salva!');
    },
    onError: (error) => {
      console.error('Erro ao salvar anotação:', error);
      toast.error('Erro ao salvar anotação');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !anotacaoData?.id) throw new Error('Sem anotação para deletar');
      
      const { error } = await supabase
        .from('artigos_anotacoes')
        .delete()
        .eq('id', anotacaoData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artigo-anotacao', user?.id, tabelaCodigo, numeroArtigo] });
      toast.success('Anotação removida');
    },
    onError: (error) => {
      console.error('Erro ao deletar anotação:', error);
      toast.error('Erro ao remover anotação');
    }
  });

  const saveAnotacao = useCallback((texto: string) => {
    if (!user?.id) {
      toast.error('Faça login para adicionar anotações');
      return;
    }
    
    if (!hasAccess) {
      setShouldShowPremiumModal(true);
      return;
    }
    
    saveMutation.mutate(texto);
  }, [user?.id, hasAccess, saveMutation]);

  const deleteAnotacao = useCallback(() => {
    if (!user?.id) {
      toast.error('Faça login para remover anotações');
      return;
    }
    deleteMutation.mutate();
  }, [user?.id, deleteMutation]);

  const closePremiumModal = useCallback(() => {
    setShouldShowPremiumModal(false);
  }, []);

  return {
    anotacao,
    isLoading,
    isEditing,
    setIsEditing,
    saveAnotacao,
    deleteAnotacao,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    hasAnotacao: !!anotacao && anotacao.trim().length > 0,
    isPremium,
    shouldShowPremiumModal,
    closePremiumModal
  };
};
