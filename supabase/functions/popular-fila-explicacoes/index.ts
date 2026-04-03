import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName } = await req.json();
    if (!tableName) {
      return new Response(JSON.stringify({ error: "tableName é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar todos os artigos da tabela da lei
    const allArticles: string[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('"Número do Artigo"')
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const row of data) {
        const num = (row as any)["Número do Artigo"];
        if (!num) continue;
        // Filtrar cabeçalhos estruturais (PARTE, TÍTULO, CAPÍTULO, SEÇÃO, LIVRO, etc.)
        const trimmed = num.trim();
        if (/^(PARTE|TÍTULO|CAPÍTULO|SEÇÃO|LIVRO|DISPOSIÇÕES|PREÂMBULO)/i.test(trimmed)) continue;
        // Só aceitar se começa com dígito (é um número de artigo real)
        if (!/^\d/.test(trimmed)) continue;
        if (!allArticles.includes(trimmed)) {
          allArticles.push(trimmed);
        }
      }
      if (data.length < pageSize) break;
      from += pageSize;
    }

    console.log(`📋 ${tableName}: ${allArticles.length} artigos únicos encontrados`);

    // Extrair nome da área a partir do tableName
    const areaName = tableName
      .replace(/^[A-Z]+ [-–] /, "")
      .replace(/^[A-Z]+ /, "")
      .trim() || tableName;

    // Buscar quais já têm resumo na RESUMOS_ARTIGOS_LEI
    const existingTemas: string[] = [];
    let fromR = 0;
    while (true) {
      const { data, error } = await supabase
        .from("RESUMOS_ARTIGOS_LEI")
        .select("tema")
        .eq("area", areaName)
        .range(fromR, fromR + pageSize - 1);
      if (error) break;
      if (!data || data.length === 0) break;
      for (const row of data) {
        if (row.tema) existingTemas.push(row.tema);
      }
      if (data.length < pageSize) break;
      fromR += pageSize;
    }

    // Normalizar para comparação
    const normalize = (s: string) => s.replace(/[°º\s]/g, "").toLowerCase();
    const existingSet = new Set(existingTemas.map(normalize));

    const missing = allArticles.filter(art => !existingSet.has(normalize(art)));
    console.log(`🔍 ${missing.length} artigos sem explicação de ${allArticles.length} total`);

    // Limpar fila antiga desta tabela
    await supabase
      .from("explicacoes_artigos_fila")
      .delete()
      .eq("tabela_lei", tableName);

    // Inserir pendentes na fila em lotes de 100
    let inserted = 0;
    for (let i = 0; i < missing.length; i += 100) {
      const batch = missing.slice(i, i + 100).map(art => ({
        tabela_lei: tableName,
        numero_artigo: art,
        status: "pendente",
      }));
      const { error } = await supabase
        .from("explicacoes_artigos_fila")
        .insert(batch);
      if (!error) inserted += batch.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalArtigos: allArticles.length,
        jaExistem: allArticles.length - missing.length,
        adicionadosNaFila: inserted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
