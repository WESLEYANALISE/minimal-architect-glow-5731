import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PER_TYPE = 10;

interface ProcessResult {
  tipo: string;
  processados: number;
  erros: number;
}

async function processarLoteTipo(
  supabase: any,
  supabaseUrl: string,
  supabaseKey: string,
  tipo: string,
): Promise<ProcessResult> {
  const { data: items, error } = await supabase
    .from('geracao_unificada_fila')
    .select('*')
    .eq('status', 'pendente')
    .eq('tipo', tipo)
    .order('id', { ascending: true })
    .limit(PER_TYPE);

  if (error || !items || items.length === 0) {
    return { tipo, processados: 0, erros: 0 };
  }

  const ids = items.map((i: any) => i.id);
  await supabase.from('geracao_unificada_fila')
    .update({ status: 'gerando' })
    .in('id', ids);

  console.log(`🔄 Processando ${items.length} ${tipo}...`);

  let processados = 0;
  let erros = 0;

  const results = await Promise.allSettled(
    items.map(async (item: any) => {
      try {
        let targetFunction: string;
        let body: any;

        if (tipo === 'cornell' || tipo === 'feynman') {
          targetFunction = 'gerar-metodologia';
          body = {
            area: item.area,
            tema: item.tema,
            subtema: item.subtema || item.tema,
            metodo: tipo,
          };
        } else if (tipo === 'flashcards') {
          const { data: resumos } = await supabase
            .from('RESUMO')
            .select('*')
            .ilike('area', item.area)
            .ilike('tema', item.tema);

          targetFunction = 'gerar-flashcards-tema';
          body = { area: item.area, tema: item.tema, resumos: resumos || [] };
        } else if (tipo === 'questoes') {
          const { data: resumos } = await supabase
            .from('RESUMO')
            .select('*')
            .ilike('area', item.area)
            .ilike('tema', item.tema);

          targetFunction = 'gerar-questoes-tema';
          body = { area: item.area, tema: item.tema, resumos: resumos || [] };
        } else if (tipo === 'lacunas') {
          const { data: resumos } = await supabase
            .from('RESUMO')
            .select('id, tema, subtema, conteudo')
            .ilike('area', item.area)
            .ilike('tema', item.tema)
            .not('conteudo', 'is', null);

          targetFunction = 'gerar-flashcards-lacunas';
          body = { area: item.area, tema: item.tema, resumos: resumos || [] };
        } else if (tipo === 'correspondencias') {
          targetFunction = 'gerar-questoes-correspondencia';
          body = { area: item.area, tema: item.tema };
        } else if (tipo === 'questoes_sim_nao') {
          targetFunction = 'gerar-questoes-sim-nao';
          body = { area: item.area, tema: item.tema };
        } else {
          throw new Error(`Tipo desconhecido: ${tipo}`);
        }

        console.log(`📡 ${tipo}: ${item.area} > ${item.tema}${item.subtema ? ` > ${item.subtema}` : ''}`);

        const response = await fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify(body),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok) {
          const itensGerados = result.flashcards_gerados || result.questoes_geradas || result.total || 1;
          await supabase.from('geracao_unificada_fila')
            .update({ status: 'concluido', itens_gerados: itensGerados, erro: null })
            .eq('id', item.id);
          return true;
        } else {
          const errorMsg = result.error || result.message || `HTTP ${response.status}`;
          await supabase.from('geracao_unificada_fila')
            .update({ status: 'erro', erro: errorMsg.slice(0, 500) })
            .eq('id', item.id);
          return false;
        }
      } catch (e: any) {
        console.error(`❌ ${tipo} ${item.id}:`, e.message);
        await supabase.from('geracao_unificada_fila')
          .update({ status: 'erro', erro: e.message?.slice(0, 500) || 'Erro desconhecido' })
          .eq('id', item.id);
        return false;
      }
    })
  );

  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) processados++;
    else erros++;
  }

  return { tipo, processados, erros };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: config } = await supabase
      .from('geracao_unificada_config')
      .select('pausado')
      .eq('id', 'main')
      .single();

    if (config?.pausado) {
      console.log('⏸️ Pipeline unificado pausado.');
      return new Response(JSON.stringify({ status: 'pausado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Reset stuck items (gerando for more than 10 min)
    await supabase.from('geracao_unificada_fila')
      .update({ status: 'pendente', erro: null })
      .eq('status', 'gerando')
      .lt('updated_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    // Process all types in parallel
    const tipos = ['cornell', 'feynman', 'flashcards', 'questoes', 'lacunas', 'correspondencias', 'questoes_sim_nao'];
    const results = await Promise.all(
      tipos.map(tipo => processarLoteTipo(supabase, supabaseUrl, supabaseKey, tipo))
    );

    const totalProcessados = results.reduce((s, r) => s + r.processados, 0);
    const totalErros = results.reduce((s, r) => s + r.erros, 0);

    console.log(`✅ Rodada concluída: ${totalProcessados} sucesso, ${totalErros} erros`);

    const { count: pendentesCount } = await supabase
      .from('geracao_unificada_fila')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente');

    return new Response(JSON.stringify({
      status: 'processado',
      results,
      totalProcessados,
      totalErros,
      pendentesRestantes: pendentesCount || 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
