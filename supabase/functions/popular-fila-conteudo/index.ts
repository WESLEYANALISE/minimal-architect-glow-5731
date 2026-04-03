import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Buscando temas do RESUMO...');

    // Buscar todos os temas distintos do RESUMO
    const { data: resumoTemas, error: e1 } = await supabase
      .from('RESUMO')
      .select('area, tema')
      .not('area', 'is', null)
      .not('tema', 'is', null);

    if (e1) throw e1;

    // Temas únicos
    const temasUnicos = new Map<string, Set<string>>();
    for (const r of resumoTemas || []) {
      const area = r.area?.trim();
      const tema = r.tema?.trim();
      if (!area || !tema) continue;
      if (!temasUnicos.has(area)) temasUnicos.set(area, new Set());
      temasUnicos.get(area)!.add(tema);
    }

    console.log(`📊 Total de áreas: ${temasUnicos.size}`);

    // Buscar o que já existe em cada tabela
    const [flashcardsRes, questoesRes, lacunasRes] = await Promise.all([
      supabase.from('FLASHCARDS_GERADOS').select('area, tema').not('area', 'is', null).not('tema', 'is', null),
      supabase.from('QUESTOES_GERADAS').select('area, tema').not('area', 'is', null).not('tema', 'is', null),
      supabase.from('FLASHCARDS_LACUNAS').select('area, tema').not('area', 'is', null).not('tema', 'is', null),
    ]);

    const makeSet = (data: any[]) => new Set(
      (data || []).map((f: any) => `${f.area?.trim().toLowerCase()}|||${f.tema?.trim().toLowerCase()}`)
    );

    const flashcardsSet = makeSet(flashcardsRes.data || []);
    const questoesSet = makeSet(questoesRes.data || []);
    const lacunasSet = makeSet(lacunasRes.data || []);

    // Identificar pendentes
    const pendentesFlashcards: { area: string; tema: string }[] = [];
    const pendentesQuestoes: { area: string; tema: string }[] = [];
    const pendentesLacunas: { area: string; tema: string }[] = [];

    for (const [area, temas] of temasUnicos) {
      for (const tema of temas) {
        const key = `${area.toLowerCase()}|||${tema.toLowerCase()}`;
        if (!flashcardsSet.has(key)) pendentesFlashcards.push({ area, tema });
        if (!questoesSet.has(key)) pendentesQuestoes.push({ area, tema });
        if (!lacunasSet.has(key)) pendentesLacunas.push({ area, tema });
      }
    }

    console.log(`📋 Pendentes: ${pendentesFlashcards.length} flashcards, ${pendentesQuestoes.length} questões, ${pendentesLacunas.length} lacunas`);

    // Limpar fila existente (itens pendentes)
    await supabase.from('conteudo_geracao_fila').delete().eq('status', 'pendente');

    // Montar fila em round-robin: 1 flashcard, 1 questão, 1 lacuna, repeat
    const filaItems: { tipo: string; area: string; tema: string }[] = [];
    const maxLen = Math.max(pendentesFlashcards.length, pendentesQuestoes.length, pendentesLacunas.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < pendentesFlashcards.length) filaItems.push({ tipo: 'flashcards', ...pendentesFlashcards[i] });
      if (i < pendentesQuestoes.length) filaItems.push({ tipo: 'questoes', ...pendentesQuestoes[i] });
      if (i < pendentesLacunas.length) filaItems.push({ tipo: 'lacunas', ...pendentesLacunas[i] });
    }

    console.log(`📝 Inserindo ${filaItems.length} itens na fila...`);

    // Inserir em lotes de 100
    for (let i = 0; i < filaItems.length; i += 100) {
      const batch = filaItems.slice(i, i + 100);
      const { error } = await supabase.from('conteudo_geracao_fila').insert(batch);
      if (error) {
        console.error(`Erro ao inserir lote ${i}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: filaItems.length,
        flashcards: pendentesFlashcards.length,
        questoes: pendentesQuestoes.length,
        lacunas: pendentesLacunas.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
