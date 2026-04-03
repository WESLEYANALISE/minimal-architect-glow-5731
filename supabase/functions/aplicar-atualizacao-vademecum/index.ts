import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { atualizacao_id, acao } = await req.json();

    if (!atualizacao_id || !acao) {
      return new Response(
        JSON.stringify({ success: false, error: "atualizacao_id e acao são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar atualização pendente
    const { data: atualizacao, error: fetchError } = await supabase
      .from('vademecum_atualizacoes_pendentes')
      .select('*')
      .eq('id', atualizacao_id)
      .eq('status', 'pendente')
      .single();

    if (fetchError || !atualizacao) {
      return new Response(
        JSON.stringify({ success: false, error: "Atualização não encontrada ou já processada" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se rejeitada, apenas marca
    if (acao === 'rejeitar') {
      await supabase
        .from('vademecum_atualizacoes_pendentes')
        .update({ status: 'rejeitada', aprovada_em: new Date().toISOString() })
        .eq('id', atualizacao_id);

      return new Response(
        JSON.stringify({ success: true, message: "Atualização rejeitada" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (acao !== 'aprovar') {
      return new Response(
        JSON.stringify({ success: false, error: "Ação inválida. Use 'aprovar' ou 'rejeitar'" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // APROVAR: aplicar mudanças granulares
    const tabela = atualizacao.tabela;
    const diff = atualizacao.artigos_afetados as any;
    let erros = 0;
    let aplicados = 0;

    console.log(`🔄 Aplicando atualização para ${tabela}...`);

    // 1. Aplicar ALTERAÇÕES (UPDATE em linhas específicas)
    if (diff.alterados && diff.alterados.length > 0) {
      for (const art of diff.alterados) {
        const { error } = await supabase
          .from(tabela)
          .update({
            "Artigo": art.texto_novo,
            "ultima_atualizacao": new Date().toISOString(),
          })
          .eq('id', art.id_atual);

        if (error) {
          console.error(`❌ Erro ao atualizar Art. ${art.numero}:`, error);
          erros++;
        } else {
          aplicados++;
          console.log(`✅ Art. ${art.numero} atualizado`);
        }
      }
    }

    // 2. Aplicar NOVOS (INSERT de artigos novos)
    if (diff.novos && diff.novos.length > 0) {
      const registrosNovos = diff.novos.map((art: any) => ({
        "Número do Artigo": art.numero,
        "Artigo": art.texto_novo,
        "ordem_artigo": art.ordem,
        "ultima_atualizacao": new Date().toISOString(),
      }));

      // Inserir em batches de 50
      for (let i = 0; i < registrosNovos.length; i += 50) {
        const batch = registrosNovos.slice(i, i + 50);
        const { error } = await supabase
          .from(tabela)
          .insert(batch);

        if (error) {
          // Fallback sem campos opcionais
          const batchSimples = batch.map((r: any) => ({
            "Número do Artigo": r["Número do Artigo"],
            "Artigo": r["Artigo"],
          }));
          const { error: errSimples } = await supabase
            .from(tabela)
            .insert(batchSimples);

          if (errSimples) {
            console.error(`❌ Erro ao inserir novos artigos:`, errSimples);
            erros += batch.length;
          } else {
            aplicados += batch.length;
          }
        } else {
          aplicados += batch.length;
        }
      }
    }

    // 3. Aplicar REMOÇÕES (DELETE de artigos revogados)
    if (diff.removidos && diff.removidos.length > 0) {
      for (const art of diff.removidos) {
        const { error } = await supabase
          .from(tabela)
          .delete()
          .eq('id', art.id_atual);

        if (error) {
          console.error(`❌ Erro ao remover Art. ${art.numero}:`, error);
          erros++;
        } else {
          aplicados++;
          console.log(`🗑️ Art. ${art.numero} removido`);
        }
      }
    }

    // 4. Marcar como aprovada
    await supabase
      .from('vademecum_atualizacoes_pendentes')
      .update({
        status: 'aprovada',
        aprovada_em: new Date().toISOString(),
        aprovada_por: 'admin',
      })
      .eq('id', atualizacao_id);

    // 5. Atualizar cache
    const { count } = await supabase
      .from(tabela)
      .select('*', { count: 'exact', head: true });

    await supabase
      .from('cache_leis_raspadas')
      .upsert({
        nome_tabela: tabela,
        total_artigos: count || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'nome_tabela' });

    console.log(`🎉 Atualização aplicada: ${aplicados} operações, ${erros} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Atualização aprovada e aplicada com sucesso`,
        aplicados,
        erros,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro:`, msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
