import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Fetch all rows with pagination to bypass 1000-row limit
async function fetchAllRows(supabase: any, table: string, select: string, filters?: (q: any) => any) {
  const PAGE_SIZE = 1000;
  let all: any[] = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (filters) query = filters(query);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Buscando todos os temas do RESUMO (paginado)...');

    // 1. Buscar todos os temas/subtemas do RESUMO (paginado)
    const resumos = await fetchAllRows(supabase, 'RESUMO', 'area, tema, subtema', (q: any) =>
      q.not('area', 'is', null).not('tema', 'is', null)
    );

    // Temas únicos (area+tema) para flashcards, questões e lacunas
    const temasUnicos = new Map<string, Set<string>>();
    // Subtemas únicos (area+tema+subtema) para cornell, feynman, correspondencias, questoes_sim_nao
    const subtemasUnicos: { area: string; tema: string; subtema: string }[] = [];
    const subtemasSet = new Set<string>();

    for (const r of resumos || []) {
      const area = r.area?.trim();
      const tema = r.tema?.trim();
      const subtema = r.subtema?.trim();
      if (!area || !tema) continue;

      if (!temasUnicos.has(area)) temasUnicos.set(area, new Set());
      temasUnicos.get(area)!.add(tema);

      if (subtema) {
        const key = `${area}|||${tema}|||${subtema}`.toLowerCase();
        if (!subtemasSet.has(key)) {
          subtemasSet.add(key);
          subtemasUnicos.push({ area, tema, subtema });
        }
      }
    }

    const totalTemas = Array.from(temasUnicos.values()).reduce((s, t) => s + t.size, 0);
    console.log(`📊 ${temasUnicos.size} áreas, ${totalTemas} temas, ${subtemasUnicos.length} subtemas`);

    // 2. Buscar o que já existe em cada tipo (tudo paginado)
    const [flashcardsData, questoesData, lacunasData, cornellData, feynmanData] = await Promise.all([
      fetchAllRows(supabase, 'FLASHCARDS_GERADOS', 'area, tema', (q: any) =>
        q.not('area', 'is', null).not('tema', 'is', null)
      ),
      fetchAllRows(supabase, 'QUESTOES_GERADAS', 'area, tema', (q: any) =>
        q.not('area', 'is', null).not('tema', 'is', null)
      ),
      fetchAllRows(supabase, 'FLASHCARDS_LACUNAS', 'area, tema', (q: any) =>
        q.not('area', 'is', null).not('tema', 'is', null)
      ),
      fetchAllRows(supabase, 'METODOLOGIAS_GERADAS', 'area, tema, subtema', (q: any) =>
        q.eq('metodo', 'cornell')
      ),
      fetchAllRows(supabase, 'METODOLOGIAS_GERADAS', 'area, tema, subtema', (q: any) =>
        q.eq('metodo', 'feynman')
      ),
    ]);

    // 2b. Buscar correspondencias e sim_nao do cache
    const [correspCacheData, simNaoCacheData] = await Promise.all([
      fetchAllRows(supabase, 'gamificacao_sim_nao_cache', 'materia', (q: any) =>
        q.eq('nivel', 1).like('materia', 'questoes-corresp:%')
      ),
      fetchAllRows(supabase, 'gamificacao_sim_nao_cache', 'materia', (q: any) =>
        q.eq('nivel', 1).like('materia', 'questoes-sn:%')
      ),
    ]);

    console.log(`📦 Existentes: ${flashcardsData.length} flashcards, ${questoesData.length} questões, ${lacunasData.length} lacunas, ${cornellData.length} cornell, ${feynmanData.length} feynman, ${correspCacheData.length} corresp-cache, ${simNaoCacheData.length} sn-cache`);

    const makeSetTema = (data: any[]) => new Set(
      (data || []).map((f: any) => `${f.area?.trim().toLowerCase()}|||${f.tema?.trim().toLowerCase()}`)
    );
    const makeSetSubtema = (data: any[]) => new Set(
      (data || []).map((f: any) => `${f.area?.trim().toLowerCase()}|||${f.tema?.trim().toLowerCase()}|||${(f.subtema || '').trim().toLowerCase()}`)
    );

    // Build sets for cache-based types (correspondencias and sim_nao)
    // Cache key format: questoes-corresp:encodeURI(area):encodeURI(tema):encodeURI(subtema)
    const buildCacheSubtemaSet = (cacheData: any[], prefix: string): Set<string> => {
      const set = new Set<string>();
      for (const entry of cacheData || []) {
        const materia = entry.materia as string;
        if (!materia) continue;
        // Remove prefix and split by :
        const rest = materia.substring(prefix.length);
        const parts = rest.split(':');
        if (parts.length >= 3) {
          try {
            const area = decodeURIComponent(parts[0]).trim().toLowerCase();
            const tema = decodeURIComponent(parts[1]).trim().toLowerCase();
            const subtema = decodeURIComponent(parts[2]).trim().toLowerCase();
            set.add(`${area}|||${tema}|||${subtema}`);
          } catch { /* skip malformed */ }
        }
      }
      return set;
    };

    const flashcardsSet = makeSetTema(flashcardsData);
    const questoesSet = makeSetTema(questoesData);
    const lacunasSet = makeSetTema(lacunasData);
    const cornellSet = makeSetSubtema(cornellData);
    const feynmanSet = makeSetSubtema(feynmanData);
    const correspSet = buildCacheSubtemaSet(correspCacheData, 'questoes-corresp:');
    const simNaoSet = buildCacheSubtemaSet(simNaoCacheData, 'questoes-sn:');

    // 3. Identificar pendentes
    const pendentes: { tipo: string; area: string; tema: string; subtema?: string }[] = [];

    // Flashcards, Questões e Lacunas pendentes (por tema)
    for (const [area, temas] of temasUnicos) {
      for (const tema of temas) {
        const key = `${area.toLowerCase()}|||${tema.toLowerCase()}`;
        if (!flashcardsSet.has(key)) {
          pendentes.push({ tipo: 'flashcards', area, tema });
        }
        if (!questoesSet.has(key)) {
          pendentes.push({ tipo: 'questoes', area, tema });
        }
        if (!lacunasSet.has(key)) {
          pendentes.push({ tipo: 'lacunas', area, tema });
        }
      }
    }

    // Cornell, Feynman, Correspondências e Sim/Não pendentes (por subtema)
    for (const { area, tema, subtema } of subtemasUnicos) {
      const key = `${area.toLowerCase()}|||${tema.toLowerCase()}|||${subtema.toLowerCase()}`;
      if (!cornellSet.has(key)) {
        pendentes.push({ tipo: 'cornell', area, tema, subtema });
      }
      if (!feynmanSet.has(key)) {
        pendentes.push({ tipo: 'feynman', area, tema, subtema });
      }
      if (!correspSet.has(key)) {
        pendentes.push({ tipo: 'correspondencias', area, tema, subtema });
      }
      if (!simNaoSet.has(key)) {
        pendentes.push({ tipo: 'questoes_sim_nao', area, tema, subtema });
      }
    }

    const countByType = (t: string) => pendentes.filter(p => p.tipo === t).length;

    console.log(`📋 Pendentes: ${countByType('cornell')} cornell, ${countByType('feynman')} feynman, ${countByType('flashcards')} flashcards, ${countByType('questoes')} questões, ${countByType('lacunas')} lacunas, ${countByType('correspondencias')} correspondências, ${countByType('questoes_sim_nao')} sim/não`);

    // 4. Limpar TODA a fila para dados frescos
    await supabase.from('geracao_unificada_fila').delete().neq('id', 0);

    const tipos = ['cornell', 'feynman', 'flashcards', 'questoes', 'lacunas', 'correspondencias', 'questoes_sim_nao'];
    const byType: Record<string, typeof pendentes> = {};
    for (const t of tipos) {
      byType[t] = pendentes.filter(p => p.tipo === t);
    }

    const filaOrdenada: typeof pendentes = [];
    const maxLen = Math.max(...tipos.map(t => byType[t].length));

    for (let i = 0; i < maxLen; i++) {
      for (const t of tipos) {
        if (i < byType[t].length) {
          filaOrdenada.push(byType[t][i]);
        }
      }
    }

    let inseridos = 0;
    for (let i = 0; i < filaOrdenada.length; i += 200) {
      const batch = filaOrdenada.slice(i, i + 200).map(item => ({
        tipo: item.tipo,
        area: item.area,
        tema: item.tema,
        subtema: item.subtema || null,
        status: 'pendente',
      }));
      const { error } = await supabase.from('geracao_unificada_fila').insert(batch);
      if (error) {
        console.error(`Erro no lote ${i}:`, error.message);
      } else {
        inseridos += batch.length;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total: inseridos,
      cornell: countByType('cornell'),
      feynman: countByType('feynman'),
      flashcards: countByType('flashcards'),
      questoes: countByType('questoes'),
      lacunas: countByType('lacunas'),
      correspondencias: countByType('correspondencias'),
      questoes_sim_nao: countByType('questoes_sim_nao'),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
