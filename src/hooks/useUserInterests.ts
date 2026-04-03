import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface InterestArea {
  area: string;
  count: number;
}

interface UseUserInterestsReturn {
  topAreas: InterestArea[];
  loading: boolean;
}

const mapPathToArea = (path: string): string | null => {
  const p = path.toLowerCase();

  if (['/vade-mecum', '/codigos', '/estatutos', '/sumulas', '/constituicao'].includes(p)) return 'Legislação';
  if (p.startsWith('/oab')) return 'OAB';
  if (p.includes('penal')) return 'Direito Penal';
  if (p.includes('civil')) return 'Direito Civil';
  if (p.includes('constituc')) return 'Direito Constitucional';
  if (p.includes('trabalh')) return 'Direito Trabalhista';
  if (p.includes('tributar') || p.includes('fiscal')) return 'Direito Tributário';
  if (p.includes('administ')) return 'Direito Administrativo';
  if (['/flashcards', '/ferramentas/questoes'].includes(p)) return 'Questões e Revisão';
  if (['/bibliotecas', '/resumos-juridicos'].includes(p)) return 'Estudos';
  if (p === '/videoaulas') return 'Videoaulas';
  if (p === '/advogado') return 'Carreira';

  return null;
};

export const useUserInterests = (): UseUserInterestsReturn => {
  const { user } = useAuth();
  const [topAreas, setTopAreas] = useState<InterestArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchInterests = async () => {
      try {
        const { data, error } = await supabase
          .from('page_views')
          .select('page_path')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error || !data) {
          setLoading(false);
          return;
        }

        const areaCounts: Record<string, number> = {};
        for (const row of data) {
          const area = mapPathToArea(row.page_path);
          if (area) {
            areaCounts[area] = (areaCounts[area] || 0) + 1;
          }
        }

        const sorted = Object.entries(areaCounts)
          .map(([area, count]) => ({ area, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setTopAreas(sorted);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [user?.id]);

  return { topAreas, loading };
};
