import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Mapping categoria → Planalto index URL + parsing config
const CATEGORIAS_CONFIG: Record<
  string,
  { url: string; prefixo: string; tipo_alteracao: string }
> = {
  constitucional: {
    url: "https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/quadro_emc.htm",
    prefixo: "Emenda Constitucional nº",
    tipo_alteracao: "alteracao",
  },
  codigos: {
    url: "https://www.planalto.gov.br/ccivil_03/LEIS/LCP/Quadro_Lcp.htm",
    prefixo: "Lei Complementar nº",
    tipo_alteracao: "nova",
  },
  decretos: {
    url: "https://www.planalto.gov.br/ccivil_03/_Ato2019-2022/2019/Decreto/_decretos2019.htm",
    prefixo: "Decreto nº",
    tipo_alteracao: "nova",
  },
};

function parseDate(text: string): string | null {
  // Tries to parse dates like "19.12.2025" or "9.12.2025"
  const m = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  const [, d, month, y] = m;
  return `${y}-${month.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parsePlanaltoHtml(
  html: string,
  prefixo: string
): Array<{
  numero_lei: string;
  ementa: string;
  data_publicacao: string | null;
  url_planalto: string;
}> {
  const results: Array<{
    numero_lei: string;
    ementa: string;
    data_publicacao: string | null;
    url_planalto: string;
  }> = [];

  // Split by <tr> to process each row
  const rows = html.split(/<tr[^>]*>/gi);

  for (const row of rows) {
    // Find the link with the law number
    const linkMatch = row.match(
      /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/i
    );
    if (!linkMatch) continue;

    let url = linkMatch[1].trim();
    const linkText = linkMatch[2].trim();

    // Skip header rows or non-law links
    if (!linkText.match(/\d+/)) continue;

    // Make URL absolute if relative
    if (url.startsWith("/")) {
      url = "https://www.planalto.gov.br" + url;
    } else if (!url.startsWith("http")) {
      url = "https://www.planalto.gov.br/ccivil_03/" + url;
    }

    // Extract number from link text (e.g., "138, de 19.12.2025" or "Decreto nº 10.196, de 30.12.2019")
    const numMatch = linkText.match(/(\d[\d.]*)/);
    if (!numMatch) continue;
    const numero = numMatch[1];
    const numero_lei = `${prefixo} ${numero}`;

    // Extract date from link text
    const data_publicacao = parseDate(linkText);

    // Extract ementa from the second <td>
    // Find content after the </td> of the first cell and within the next <td>
    const tdParts = row.split(/<\/td>/i);
    let ementa = "";
    if (tdParts.length >= 2) {
      // Get second td content
      const secondTd = tdParts[1] || "";
      // Strip HTML tags
      ementa = secondTd
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (!ementa || ementa.length < 10) continue;

    results.push({ numero_lei, ementa, data_publicacao, url_planalto: url });
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoria } = await req.json();

    if (!categoria || !CATEGORIAS_CONFIG[categoria]) {
      return new Response(
        JSON.stringify({
          error: "Categoria inválida. Disponíveis: " +
            Object.keys(CATEGORIAS_CONFIG).join(", "),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = CATEGORIAS_CONFIG[categoria];
    console.log(`Importando histórico para categoria: ${categoria}`);
    console.log(`URL: ${config.url}`);

    // Fetch the index page
    const response = await fetch(config.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LexBot/1.0)",
        "Accept": "text/html",
        "Accept-Charset": "utf-8, iso-8859-1",
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao acessar Planalto: ${response.status}`);
    }

    // Handle encoding - Planalto uses ISO-8859-1
    const buffer = await response.arrayBuffer();
    let html: string;
    try {
      html = new TextDecoder("iso-8859-1").decode(buffer);
    } catch {
      html = new TextDecoder("utf-8").decode(buffer);
    }

    console.log(`HTML recebido: ${html.length} caracteres`);

    // Parse the HTML
    const leis = parsePlanaltoHtml(html, config.prefixo);
    console.log(`Leis encontradas: ${leis.length}`);

    if (leis.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhuma lei encontrada no HTML", importados: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let importados = 0;
    let existentes = 0;
    const erros: string[] = [];

    // Process in batches
    for (const lei of leis) {
      try {
        // Check if already exists in resenha_diaria
        const { data: existing } = await supabase
          .from("resenha_diaria")
          .select("id")
          .eq("numero_lei", lei.numero_lei)
          .maybeSingle();

        let resenhaId: string;

        if (existing) {
          resenhaId = existing.id;
          existentes++;
        } else {
          // Insert into resenha_diaria
          const { data: inserted, error: insertError } = await supabase
            .from("resenha_diaria")
            .insert({
              numero_lei: lei.numero_lei,
              ementa: lei.ementa,
              data_publicacao: lei.data_publicacao,
              url_planalto: lei.url_planalto,
              status: "formatada",
            })
            .select("id")
            .single();

          if (insertError) {
            erros.push(`Resenha ${lei.numero_lei}: ${insertError.message}`);
            continue;
          }
          resenhaId = inserted.id;
        }

        // Check if raio_x already exists for this resenha
        const { data: existingRaioX } = await supabase
          .from("raio_x_legislativo")
          .select("id")
          .eq("resenha_id", resenhaId)
          .maybeSingle();

        if (!existingRaioX) {
          // Determine tipo_alteracao from ementa
          let tipo = config.tipo_alteracao;
          const ementaLower = lei.ementa.toLowerCase();
          if (ementaLower.includes("revoga")) tipo = "revogacao";
          else if (ementaLower.includes("altera") || ementaLower.includes("acrescenta") || ementaLower.includes("dá nova redação"))
            tipo = "alteracao";

          // Extract lei_afetada from ementa
          let lei_afetada: string | null = null;
          const leiMatch = lei.ementa.match(
            /(?:altera|acrescenta|revoga)[^.]*?(Lei\s+(?:Complementar\s+)?(?:nº\s*)?\d[\d.]*(?:\/\d{2,4})?|Constituição\s+Federal|Código\s+(?:Civil|Penal|Processo|Tributário)[^,.]*)/i
          );
          if (leiMatch) lei_afetada = leiMatch[1]?.trim() || null;
          if (categoria === "constitucional") lei_afetada = "Constituição Federal";

          // Extract artigos_afetados
          const artigosMatch = lei.ementa.match(/art[s]?\.\s*[\d\w,\s]+/gi);
          const artigos_afetados = artigosMatch
            ? artigosMatch.map((a) => a.trim())
            : null;

          const relevancia =
            ementaLower.includes("constituição federal") ||
            ementaLower.includes("código penal") ||
            ementaLower.includes("código civil")
              ? "alta"
              : "normal";

          const { error: raioXError } = await supabase
            .from("raio_x_legislativo")
            .insert({
              resenha_id: resenhaId,
              categoria,
              tipo_alteracao: tipo,
              lei_afetada,
              artigos_afetados,
              relevancia,
              resumo_alteracao: lei.ementa.substring(0, 500),
              created_at: lei.data_publicacao
                ? new Date(lei.data_publicacao + "T12:00:00Z").toISOString()
                : new Date().toISOString(),
            });

          if (raioXError) {
            erros.push(`RaioX ${lei.numero_lei}: ${raioXError.message}`);
          } else {
            importados++;
          }
        } else {
          existentes++;
        }
      } catch (e) {
        erros.push(`${lei.numero_lei}: ${e.message}`);
      }
    }

    console.log(
      `Importação concluída: ${importados} novos, ${existentes} existentes, ${erros.length} erros`
    );

    return new Response(
      JSON.stringify({
        success: true,
        categoria,
        total_encontrados: leis.length,
        importados,
        existentes,
        erros: erros.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na importação:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
