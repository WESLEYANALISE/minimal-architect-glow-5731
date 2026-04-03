import { useInstantCache } from './useInstantCache';
import { supabase } from '@/integrations/supabase/client';

interface TemaData {
  tema: string;
  temQuestoes: boolean;
  parcial: boolean;
  subtemasGerados: number;
  totalSubtemas: number;
  totalQuestoes: number;
  progressoPercent: number;
  ordem: number;
}

const normalizar = (str: string) =>
  str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');

const safeDecode = (value: string) => {
  try { return decodeURIComponent(value); } catch { return value; }
};

async function fetchTemasCasoPraticoData(area: string): Promise<TemaData[]> {
  const { data: resumoData, error } = await supabase
    .from('RESUMO')
    .select('id, tema, subtema')
    .eq('area', area)
    .not('tema', 'is', null)
    .order('id', { ascending: true });

  if (error) throw error;

  const temasMap: Record<string, { nomeOriginal: string; ordem: number; subtemas: Set<string> }> = {};
  let ordemCounter = 0;

  (resumoData || []).forEach((row) => {
    if (!row.tema) return;
    const temaNorm = normalizar(row.tema);
    if (!temasMap[temaNorm]) {
      temasMap[temaNorm] = { nomeOriginal: row.tema.trim(), ordem: ordemCounter++, subtemas: new Set<string>() };
    }
    const subtemaNome = row.subtema?.trim() || row.tema.trim();
    temasMap[temaNorm].subtemas.add(normalizar(subtemaNome));
  });

  const encodedArea = encodeURIComponent(area);
  const prefix = `questoes-cp:${encodedArea}:`;

  const { data: cacheData } = await supabase
    .from('gamificacao_sim_nao_cache')
    .select('materia, perguntas')
    .eq('nivel', 1)
    .like('materia', `${prefix}%`);

  const generatedByTemaSubtema = new Set<string>();

  (cacheData || []).forEach((row) => {
    const materia = row.materia || '';
    if (!materia.startsWith(prefix)) return;
    const rest = materia.slice(prefix.length);
    const separatorIndex = rest.indexOf(':');
    if (separatorIndex < 0) return;
    const temaEnc = rest.slice(0, separatorIndex);
    const subtemaEnc = rest.slice(separatorIndex + 1);
    const temaNorm = normalizar(safeDecode(temaEnc));
    const subtemaNorm = normalizar(safeDecode(subtemaEnc));
    generatedByTemaSubtema.add(`${temaNorm}::${subtemaNorm}`);
  });

  return Object.entries(temasMap)
    .map(([temaNorm, item]) => {
      const totalSubtemas = item.subtemas.size;
      let subtemasGerados = 0;

      item.subtemas.forEach((subtemaNorm) => {
        if (generatedByTemaSubtema.has(`${temaNorm}::${subtemaNorm}`)) subtemasGerados += 1;
      });

      const temTodosSubtemas = totalSubtemas > 0 && subtemasGerados >= totalSubtemas;
      const parcial = subtemasGerados > 0 && !temTodosSubtemas;
      const progressoPercent = totalSubtemas > 0 ? Math.round((subtemasGerados / totalSubtemas) * 100) : 0;

      return {
        tema: item.nomeOriginal,
        temQuestoes: temTodosSubtemas,
        parcial,
        subtemasGerados,
        totalSubtemas,
        totalQuestoes: subtemasGerados * 5,
        progressoPercent,
        ordem: item.ordem,
      };
    })
    .sort((a, b) => a.ordem - b.ordem);
}

export function useQuestoesCasoPraticoTemas(area: string) {
  const cacheKey = `questoes-caso-pratico-temas-${normalizar(area || '')}`;

  const { data, isLoading, isFetching, error, refresh } = useInstantCache<TemaData[]>({
    cacheKey,
    queryFn: () => fetchTemasCasoPraticoData(area),
    enabled: !!area,
    cacheDuration: 1000 * 60 * 10,
  });

  return { temas: data || [], isLoading, isFetching, error, refresh };
}
