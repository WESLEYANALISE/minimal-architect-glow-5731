import { useMemo } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';

// Limites de conteúdo gratuito por tipo
// Valores <= 1 = percentual (ex: 0.20 = 20%)
// Valores > 1 = número absoluto de itens gratuitos
const LIMITS: Record<string, number> = {
  // Bibliotecas - 2 livros gratuitos (número absoluto)
  'classicos': 2,
  'estudos': 2,        // 2 por área
  'oab': 2,            // 2 por matéria
  'oratoria': 2,
  'lideranca': 2,
  'portugues': 2,
  'fora-da-toga': 2,
  'pesquisa': 0,       // Tudo premium
  // Outros conteúdos - percentual
  'flashcards': 0.20,
  'flashcards-temas': 0.10,
  'questoes': 0.20,
  'resumos-juridicos': 0.20,
  'cursos': 0.20,
  'mapa-mental': 0.20,
  'audioaulas': 0.20,
  'blog-juridico': 0.30,
  'iniciando': 0.30,
  'carreiras': 0.30,
  'advogado': 0.30,
  'juiz': 0.30,
  'delegado': 0.30,
  'prf': 0.30,
  'pf': 0.30,
  'historia': 0.30,
  'filosofos': 0.30,
  'curiosidades': 0.30,
  'termos': 0.30,
  'casos': 0.30,
  'areas': 0.30,
  'principios': 0.30,
  'codigos_historicos': 0.30,
  'civilizacoes': 0.30,
  'juristas_brasileiros': 0.30,
  'julgamentos_mundiais': 0.30,
  'tribunais_brasil': 0.30,
  'orgaos_juridicos': 0.30,
  'sistemas_juridicos': 0.30,
  'direitos_humanos': 0.30,
  'constituicoes_brasil': 0.30,
  'direito_comparado': 0.30,
  'crimes_famosos': 0.30,
  'prisoes_historicas': 0.30,
  'politica-artigos': 2,
};

export interface ContentLimitResult<T> {
  visibleItems: T[];
  lockedItems: T[];
  totalCount: number;
  visibleCount: number;
  lockedCount: number;
  isPremiumRequired: boolean;
  limitPercentage: number;
}

export function useContentLimit<T>(
  items: T[] | undefined,
  type: keyof typeof LIMITS
): ContentLimitResult<T> {
  const { isPremium, loading } = useSubscription();


  return useMemo(() => {
    const allItems = items || [];
    const totalCount = allItems.length;
    
    // Premium, trial ativo ou carregando = acesso total
    if (isPremium || loading) {
      return {
        visibleItems: allItems,
        lockedItems: [],
        totalCount,
        visibleCount: totalCount,
        lockedCount: 0,
        isPremiumRequired: false,
        limitPercentage: 100,
      };
    }

    // Calcular limite
    const limit = LIMITS[type] ?? 0.20;
    // Se limit > 1, é número absoluto; se <= 1, é percentual
    const visibleCount = limit > 1 
      ? Math.min(limit, totalCount)
      : limit === 0 
        ? 0 
        : Math.max(1, Math.ceil(totalCount * limit));
    
    return {
      visibleItems: allItems.slice(0, visibleCount),
      lockedItems: allItems.slice(visibleCount),
      totalCount,
      visibleCount,
      lockedCount: totalCount - visibleCount,
      isPremiumRequired: totalCount > visibleCount,
      limitPercentage: limit > 1 ? Math.round((limit / totalCount) * 100) : Math.round(limit * 100),
    };
  }, [items, type, isPremium, loading]);
}

// Hook simplificado para verificar se um índice está bloqueado
export function useIsItemLocked(
  index: number,
  totalItems: number,
  type: keyof typeof LIMITS
): boolean {
  const { isPremium, loading } = useSubscription();
  

  return useMemo(() => {
    if (isPremium || loading) return false;
    
    const limit = LIMITS[type] ?? 0.20;
    const visibleCount = limit > 1 
      ? Math.min(limit, totalItems)
      : limit === 0 
        ? 0 
        : Math.max(1, Math.ceil(totalItems * limit));
    
    return index >= visibleCount;
  }, [index, totalItems, type, isPremium, loading]);
}

export default useContentLimit;
