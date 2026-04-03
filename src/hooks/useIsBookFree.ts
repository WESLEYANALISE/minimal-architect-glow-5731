import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ORDEM_LEITURA_CLASSICOS } from '@/components/biblioteca/BibliotecaSortToggle';

const FREE_LIMIT = 2;

type BibliotecaType = 'classicos' | 'lideranca' | 'oratoria' | 'fora-da-toga' | 'portugues' | 'pesquisa';

const TABLE_MAP: Record<BibliotecaType, string> = {
  'classicos': 'BIBLIOTECA-CLASSICOS',
  'lideranca': 'BIBLIOTECA-LIDERANÇA',
  'oratoria': 'BIBLIOTECA-ORATORIA',
  'fora-da-toga': 'BIBLIOTECA-FORA-DA-TOGA',
  'portugues': 'BIBLIOTECA-PORTUGUES',
  'pesquisa': 'BIBLIOTECA-PESQUISA-CIENTIFICA',
};

export function useIsBookFree(bookId: number | undefined, biblioteca: BibliotecaType): boolean {
  const isClassicos = biblioteca === 'classicos';

  // For non-classicos libraries, fetch the first N book IDs
  const { data: freeIds } = useQuery({
    queryKey: ['free-book-ids', biblioteca],
    queryFn: async () => {
      const table = TABLE_MAP[biblioteca];
      if (!table) return [];
      const { data } = await (supabase as any)
        .from(table)
        .select('id')
        .order('id')
        .limit(FREE_LIMIT);
      return (data || []).map((r: any) => r.id as number);
    },
    staleTime: 1000 * 60 * 60,
    enabled: !!bookId && !isClassicos,
  });

  return useMemo(() => {
    if (!bookId) return false;

    // For Clássicos, use the static order map
    if (isClassicos) {
      const ordem = ORDEM_LEITURA_CLASSICOS[bookId];
      return ordem !== undefined && ordem <= FREE_LIMIT;
    }

    // For others, check if book is in the first N by ID
    if (!freeIds) return false;
    return freeIds.includes(bookId);
  }, [bookId, isClassicos, freeIds]);
}
