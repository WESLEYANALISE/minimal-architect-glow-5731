import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function processarProximoItem(supabase: any, supabaseUrl: string, supabaseKey: string, rodada: number): Promise<{ status: string; tipo?: string; area?: string; tema?: string }> {
  // Verificar se já há item processando
  const { data: processando } = await supabase
    .from('conteudo_geracao_fila')
    .select('id, updated_at')
    .eq('status', 'processando')
    .limit(1);

  if (processando && processando.length > 0) {
    const updatedAt = new Date(processando[0].updated_at);
    const agora = new Date();
    const diffMin = (agora.getTime() - updatedAt.getTime()) / 60000;

    if (diffMin > 10) {
      console.log(`[R${rodada}] ⚠️ Item ${processando[0].id} travado há ${Math.round(diffMin)}min. Resetando...`);
      await supabase.from('conteudo_geracao_fila')
        .update({ status: 'erro', erro_msg: 'Timeout: travado por mais de 10 minutos' })
        .eq('id', processando[0].id);
    } else {
      console.log(`[R${rodada}] 🔄 Já há item processando. Pulando.`);
      return { status: 'processando_existente' };
    }
  }

  // Buscar próximo item pendente
  const { data: proximo, error: errProx } = await supabase
    .from('conteudo_geracao_fila')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (errProx || !proximo) {
    console.log(`[R${rodada}] ✅ Nenhum item pendente. Fila vazia!`);
    return { status: 'fila_vazia' };
  }

  console.log(`[R${rodada}] 🚀 Processando: ${proximo.tipo} | ${proximo.area} > ${proximo.tema}`);

  // Marcar como processando
  await supabase.from('conteudo_geracao_fila')
    .update({ status: 'processando', updated_at: new Date().toISOString() })
    .eq('id', proximo.id);

  // Buscar resumos do tema
  const { data: resumos, error: errResumos } = await supabase
    .from('RESUMO')
    .select('*')
    .ilike('area', proximo.area)
    .ilike('tema', proximo.tema);

  if (errResumos || !resumos || resumos.length === 0) {
    console.error(`[R${rodada}] ❌ Nenhum resumo encontrado para ${proximo.area} > ${proximo.tema}`);
    await supabase.from('conteudo_geracao_fila')
      .update({ status: 'erro', erro_msg: 'Nenhum resumo encontrado para este tema' })
      .eq('id', proximo.id);
    return { status: 'erro' };
  }

  console.log(`[R${rodada}] 📝 ${resumos.length} resumos encontrados`);

  const functionMap: Record<string, string> = {
    'flashcards': 'gerar-flashcards-tema',
    'questoes': 'gerar-questoes-tema',
    'lacunas': 'gerar-flashcards-lacunas',
  };

  const targetFunction = functionMap[proximo.tipo];
  if (!targetFunction) {
    await supabase.from('conteudo_geracao_fila')
      .update({ status: 'erro', erro_msg: `Tipo desconhecido: ${proximo.tipo}` })
      .eq('id', proximo.id);
    return { status: 'erro' };
  }

  console.log(`[R${rodada}] 📡 Chamando ${targetFunction}...`);

  const genResponse = await fetch(`${supabaseUrl}/functions/v1/${targetFunction}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      area: proximo.area,
      tema: proximo.tema,
      resumos: resumos,
    }),
  });

  const genResult = await genResponse.json().catch(() => ({}));
  console.log(`[R${rodada}] 📊 Resultado: status=${genResponse.status}`, JSON.stringify(genResult).slice(0, 200));

  if (genResponse.ok) {
    const itensGerados = genResult.flashcards_gerados || genResult.questoes_geradas || genResult.lacunas_geradas || genResult.total || 0;

    await supabase.from('conteudo_geracao_fila')
      .update({
        status: 'concluido',
        itens_gerados: itensGerados,
        erro_msg: null,
      })
      .eq('id', proximo.id);

    console.log(`[R${rodada}] ✅ Concluído: ${itensGerados} itens gerados`);
  } else {
    const errorMsg = genResult.error || genResult.message || `HTTP ${genResponse.status}`;
    await supabase.from('conteudo_geracao_fila')
      .update({ status: 'erro', erro_msg: errorMsg.slice(0, 500) })
      .eq('id', proximo.id);

    console.error(`[R${rodada}] ❌ Erro na geração: ${errorMsg}`);
  }

  return { status: 'processado', tipo: proximo.tipo, area: proximo.area, tema: proximo.tema };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Verificar se está pausado
    const { data: config } = await supabase
      .from('conteudo_geracao_config')
      .select('pausado')
      .eq('id', 'main')
      .single();

    if (config?.pausado) {
      console.log('⏸️ Geração pausada. Saindo.');
      return new Response(JSON.stringify({ status: 'pausado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === RODADA 1 ===
    const resultado1 = await processarProximoItem(supabase, supabaseUrl, supabaseKey, 1);

    // === AGUARDAR ~25 SEGUNDOS ===
    if (resultado1.status === 'processado' || resultado1.status === 'erro') {
      console.log('⏳ Aguardando 25s para a segunda rodada...');
      await new Promise(resolve => setTimeout(resolve, 25000));

      // Re-verificar pausa
      const { data: config2 } = await supabase
        .from('conteudo_geracao_config')
        .select('pausado')
        .eq('id', 'main')
        .single();

      if (!config2?.pausado) {
        // === RODADA 2 ===
        const resultado2 = await processarProximoItem(supabase, supabaseUrl, supabaseKey, 2);

        return new Response(
          JSON.stringify({ rodada1: resultado1, rodada2: resultado2 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ rodada1: resultado1 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
