import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TemaPendente {
  area: string;
  tema: string;
}

export interface AreaPendente {
  area: string;
  temas: string[];
}

export function useFlashcardsPendentes() {
  return useQuery({
    queryKey: ['flashcards-pendentes'],
    queryFn: async (): Promise<AreaPendente[]> => {
      // Buscar todos os temas distintos do RESUMO
      const { data: resumoTemas, error: e1 } = await supabase
        .from('RESUMO')
        .select('area, tema')
        .not('area', 'is', null)
        .not('tema', 'is', null);

      if (e1) throw e1;

      // Buscar todos os temas que já têm flashcards
      const { data: flashcardTemas, error: e2 } = await supabase
        .from('FLASHCARDS_GERADOS')
        .select('area, tema')
        .not('area', 'is', null)
        .not('tema', 'is', null);

      if (e2) throw e2;

      // Criar set de temas que já têm flashcards (normalizado)
      const geradosSet = new Set(
        (flashcardTemas || []).map(f => `${f.area?.trim().toLowerCase()}|||${f.tema?.trim().toLowerCase()}`)
      );

      // Encontrar temas únicos do RESUMO que não existem em FLASHCARDS_GERADOS
      const temasUnicos = new Map<string, Set<string>>();
      
      for (const r of resumoTemas || []) {
        const area = r.area?.trim();
        const tema = r.tema?.trim();
        if (!area || !tema) continue;
        
        const key = `${area.toLowerCase()}|||${tema.toLowerCase()}`;
        if (geradosSet.has(key)) continue;

        if (!temasUnicos.has(area)) {
          temasUnicos.set(area, new Set());
        }
        temasUnicos.get(area)!.add(tema);
      }

      // Converter para array agrupado
      const resultado: AreaPendente[] = [];
      for (const [area, temas] of temasUnicos) {
        resultado.push({
          area,
          temas: Array.from(temas).sort(),
        });
      }

      return resultado.sort((a, b) => b.temas.length - a.temas.length);
    },
    staleTime: 5 * 60 * 1000,
  });
}
