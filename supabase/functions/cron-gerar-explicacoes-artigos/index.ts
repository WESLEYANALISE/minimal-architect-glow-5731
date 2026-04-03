import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar itens pendentes
    const { data: pendentes, error } = await supabase
      .from("explicacoes_artigos_fila")
      .select("*")
      .eq("status", "pendente")
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) throw error;
    if (!pendentes || pendentes.length === 0) {
      console.log("✅ Fila vazia - nada a processar");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "Fila vazia" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🚀 Processando ${pendentes.length} itens da fila`);
    let processed = 0;
    let errors = 0;

    for (const item of pendentes) {
      // Marcar como gerando
      await supabase
        .from("explicacoes_artigos_fila")
        .update({ status: "gerando" })
        .eq("id", item.id);

      try {
        // Chamar gerar-resumo-artigo-lei
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/gerar-resumo-artigo-lei`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              tableName: item.tabela_lei,
              artigo: item.numero_artigo,
            }),
          }
        );

        const result = await response.json();

        if (result.success) {
          await supabase
            .from("explicacoes_artigos_fila")
            .update({ status: "concluido" })
            .eq("id", item.id);
          processed++;
          console.log(`✅ ${item.tabela_lei} Art. ${item.numero_artigo} - OK`);
        } else {
          throw new Error(result.error || "Falha na geração");
        }
      } catch (err) {
        await supabase
          .from("explicacoes_artigos_fila")
          .update({ status: "erro", erro: String(err) })
          .eq("id", item.id);
        errors++;
        console.error(`❌ ${item.tabela_lei} Art. ${item.numero_artigo}:`, err);
      }

      // Delay entre itens para não sobrecarregar API
      await new Promise(r => setTimeout(r, 2000));
    }

    // Verificar se ainda tem pendentes para auto-continuar
    const { count } = await supabase
      .from("explicacoes_artigos_fila")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendente");

    const remaining = count || 0;

    // Se ainda tem pendentes, auto-chamar novamente
    if (remaining > 0) {
      console.log(`🔄 Ainda restam ${remaining} pendentes, auto-chamando...`);
      fetch(`${SUPABASE_URL}/functions/v1/cron-gerar-explicacoes-artigos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ auto: true }),
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        remaining,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro geral:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
