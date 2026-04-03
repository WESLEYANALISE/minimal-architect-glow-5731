import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

interface UseArtigoFavoritoProps {
  tabelaCodigo: string;
  numeroArtigo: string;
  artigoId: number;
  conteudoPreview?: string;
}

interface FavoritoData {
  id: string;
  user_id: string;
  tabela_codigo: string;
  numero_artigo: string;
  artigo_id: number;
  conteudo_preview: string | null;
  created_at: string;
}

export const useArtigoFavorito = ({
  tabelaCodigo,
  numeroArtigo,
  artigoId,
  conteudoPreview
}: UseArtigoFavoritoProps) => {
  const { user } = useAuth();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const hasAccess = isPremium || loadingSubscription;
  const queryClient = useQueryClient();
  const [shouldShowPremiumModal, setShouldShowPremiumModal] = useState(false);
  
  const { data: favorito, isLoading } = useQuery({
    queryKey: ['artigo-favorito', user?.id, tabelaCodigo, numeroArtigo],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('artigos_favoritos')
        .select('*')
        .eq('user_id', user.id)
        .eq('tabela_codigo', tabelaCodigo)
        .eq('numero_artigo', numeroArtigo)
        .maybeSingle();
      
      if (error) throw error;
      return data as FavoritoData | null;
    },
    enabled: !!user?.id && !!tabelaCodigo && !!numeroArtigo
  });

  const isFavorito = !!favorito;

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('artigos_favoritos')
        .insert({
          user_id: user.id,
          tabela_codigo: tabelaCodigo,
          numero_artigo: numeroArtigo,
          artigo_id: artigoId,
          conteudo_preview: conteudoPreview?.substring(0, 200) || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artigo-favorito', user?.id, tabelaCodigo, numeroArtigo] });
      queryClient.invalidateQueries({ queryKey: ['artigos-favoritos', user?.id] });
      toast.success('Artigo adicionado aos favoritos');
    },
    onError: (error) => {
      console.error('Erro ao favoritar:', error);
      toast.error('Erro ao favoritar artigo');
    }
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { error } = await supabase
        .from('artigos_favoritos')
        .delete()
        .eq('user_id', user.id)
        .eq('tabela_codigo', tabelaCodigo)
        .eq('numero_artigo', numeroArtigo);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artigo-favorito', user?.id, tabelaCodigo, numeroArtigo] });
      queryClient.invalidateQueries({ queryKey: ['artigos-favoritos', user?.id] });
      toast.success('Artigo removido dos favoritos');
    },
    onError: (error) => {
      console.error('Erro ao remover favorito:', error);
      toast.error('Erro ao remover favorito');
    }
  });

  const toggleFavorito = useCallback(() => {
    if (!user?.id) {
      toast.error('Faça login para favoritar artigos');
      return;
    }
    
    if (!isFavorito && !hasAccess) {
      setShouldShowPremiumModal(true);
      return;
    }
    
    if (isFavorito) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  }, [isFavorito, user?.id, hasAccess, addMutation, removeMutation]);

  const closePremiumModal = useCallback(() => {
    setShouldShowPremiumModal(false);
  }, []);

  return {
    isFavorito,
    isLoading: isLoading || addMutation.isPending || removeMutation.isPending,
    toggleFavorito,
    isPremium,
    shouldShowPremiumModal,
    closePremiumModal
  };
};

// Hook para listar todos os favoritos de um código
export const useArtigosFavoritos = (tabelaCodigo?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['artigos-favoritos', user?.id, tabelaCodigo],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('artigos_favoritos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (tabelaCodigo) {
        query = query.eq('tabela_codigo', tabelaCodigo);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as FavoritoData[];
    },
    enabled: !!user?.id
  });
};
