import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface InvasoresHistorico {
  id: string;
  user_id: string;
  codigo_slug: string;
  pontuacao: number;
  nivel_maximo: number;
  fantasmas_destruidos: number;
  artigos_cobertos: string[];
  power_ups_usados: number;
  created_at: string;
  updated_at: string;
}

export const useInvasoresHistorico = () => {
  const { user } = useAuth();
  const [historicos, setHistoricos] = useState<InvasoresHistorico[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistoricos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('invasores_historico')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      setHistoricos(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico invasores:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistoricos();
  }, [fetchHistoricos]);

  const getHistoricoByCodigo = useCallback((slug: string) => {
    return historicos.find(h => h.codigo_slug === slug);
  }, [historicos]);

  const getMelhorPontuacao = useCallback(() => {
    if (historicos.length === 0) return null;
    return historicos.reduce((best, h) => h.pontuacao > best.pontuacao ? h : best, historicos[0]);
  }, [historicos]);

  const salvarResultado = useCallback(async (params: {
    codigoSlug: string;
    pontuacao: number;
    nivelMaximo: number;
    fantasmasDestruidos: number;
    artigosCobertos: string[];
    powerUpsUsados: number;
  }) => {
    if (!user) return;
    try {
      const existing = getHistoricoByCodigo(params.codigoSlug);
      
      if (existing) {
        // Merge artigos cobertos (union)
        const mergedArtigos = [...new Set([...existing.artigos_cobertos, ...params.artigosCobertos])];
        
        const updates: any = {
          artigos_cobertos: mergedArtigos,
          power_ups_usados: existing.power_ups_usados + params.powerUpsUsados,
          fantasmas_destruidos: Math.max(existing.fantasmas_destruidos, params.fantasmasDestruidos),
        };
        
        // Only update if better score
        if (params.pontuacao > existing.pontuacao) {
          updates.pontuacao = params.pontuacao;
        }
        if (params.nivelMaximo > existing.nivel_maximo) {
          updates.nivel_maximo = params.nivelMaximo;
        }

        await (supabase as any)
          .from('invasores_historico')
          .update(updates)
          .eq('id', existing.id);
      } else {
        await (supabase as any)
          .from('invasores_historico')
          .insert({
            user_id: user.id,
            codigo_slug: params.codigoSlug,
            pontuacao: params.pontuacao,
            nivel_maximo: params.nivelMaximo,
            fantasmas_destruidos: params.fantasmasDestruidos,
            artigos_cobertos: params.artigosCobertos,
            power_ups_usados: params.powerUpsUsados,
          });
      }

      await fetchHistoricos();
    } catch (err) {
      console.error('Erro ao salvar resultado:', err);
    }
  }, [user, getHistoricoByCodigo, fetchHistoricos]);

  return {
    historicos,
    loading,
    getHistoricoByCodigo,
    getMelhorPontuacao,
    salvarResultado,
    refetch: fetchHistoricos,
  };
};
