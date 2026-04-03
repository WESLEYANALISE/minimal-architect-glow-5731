import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// URL patterns for each type and year range
const URL_PATTERNS: Record<string, (ano: number) => string> = {
  PEC: (ano) => {
    const ato = getAtoRange(ano);
    return `https://www.planalto.gov.br/ccivil_03/Projetos/${ato}/${ano}/PEC/_Quadro_Emenda_Constitucional_${ano}.htm`;
  },
  PL: (ano) => {
    const ato = getAtoRange(ano);
    return `https://www.planalto.gov.br/ccivil_03/Projetos/${ato}/${ano}/PL/_Quadro_PL_${ano}.htm`;
  },
  PLP: (ano) => {
    const ato = getAtoRange(ano);
    return `https://www.planalto.gov.br/ccivil_03/Projetos/${ato}/${ano}/PLP/_Quadro_PLP_${ano}.htm`;
  },
};

const TABLE_MAP: Record<string, string> = {
  PEC: "PEC_VADEMECUM",
  PL: "PL_VADEMECUM",
  PLP: "PLP_VADEMECUM",
};

const TIPO_ATO_MAP: Record<string, string> = {
  PEC: "Proposta de Emenda à Constituição",
  PL: "Projeto de Lei",
  PLP: "Projeto de Lei Complementar",
};

function getAtoRange(ano: number): string {
  if (ano >= 2023) return "Ato_2023_2026";
  if (ano >= 2019) return "Ato_2019_2022";
  if (ano >= 2015) return `PEC`; // Older URLs use direct path
  return `PEC`;
}

interface ProposicaoParsed {
  numero_lei: string;
  ementa: string;
  situacao: string;
  url_camara: string | null;
  url_texto: string | null;
  ano: number;
}

function parseHTML(html: string, tipo: string, ano: number): ProposicaoParsed[] {
  const results: ProposicaoParsed[] = [];
  
  // Find the main data table (border="2")
  const tableMatch = html.match(/<table[^>]*border="2"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    console.log("No data table found in HTML");
    return results;
  }
  
  const tableContent = tableMatch[1];
  
  // Extract all rows (skip header row)
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[] = [];
  let match;
  while ((match = rowRegex.exec(tableContent)) !== null) {
    rows.push(match[1]);
  }
  
  // Skip first row (header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Extract cells
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      cells.push(cellMatch[1]);
    }
    
    if (cells.length < 3) continue;
    
    // Cell 0: Número (with link to text)
    const numCell = cells[0];
    const numLinkMatch = numCell.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    let numero = "";
    let urlTexto = null;
    
    if (numLinkMatch) {
      urlTexto = numLinkMatch[1];
      numero = stripHTML(numLinkMatch[2]).trim();
    } else {
      numero = stripHTML(numCell).trim();
    }
    
    // Clean up numero format
    numero = numero
      .replace(/\s+/g, " ")
      .replace(/\n/g, " ")
      .trim();
    
    if (!numero || numero === "&nbsp;" || numero.length < 3) continue;
    
    // Cell 1: Ementa
    const ementa = stripHTML(cells[1])
      .replace(/\s+/g, " ")
      .replace(/\n/g, " ")
      .trim();
    
    if (!ementa || ementa === "&nbsp;") continue;
    
    // Cell 2: Situação (with optional link to Câmara)
    const sitCell = cells[2];
    const sitLinkMatch = sitCell.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    let situacao = "";
    let urlCamara = null;
    
    if (sitLinkMatch) {
      urlCamara = sitLinkMatch[1];
      situacao = stripHTML(sitLinkMatch[2]).trim();
    } else {
      situacao = stripHTML(sitCell).trim();
    }
    
    results.push({
      numero_lei: numero,
      ementa,
      situacao: situacao || "Sem informação",
      url_camara: urlCamara,
      url_texto: urlTexto,
      ano,
    });
  }
  
  return results;
}

function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, anos, forceReimport } = await req.json();

    if (!tipo || !TABLE_MAP[tipo]) {
      return new Response(
        JSON.stringify({
          error: `Tipo inválido. Use: ${Object.keys(TABLE_MAP).join(", ")}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anosArray: number[] = anos || [2024, 2025, 2026];
    const tableName = TABLE_MAP[tipo];
    const tipoAto = TIPO_ATO_MAP[tipo];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const logs: string[] = [];
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const ano of anosArray) {
      const urlFn = URL_PATTERNS[tipo];
      if (!urlFn) continue;
      
      const url = urlFn(ano);
      logs.push(`📥 Buscando ${tipo} ${ano}: ${url}`);

      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JurisBot/1.0)",
            "Accept": "text/html",
            "Accept-Charset": "utf-8, iso-8859-1",
          },
        });

        if (!response.ok) {
          logs.push(`⚠️ ${tipo} ${ano}: HTTP ${response.status} - Página não encontrada`);
          totalErrors++;
          continue;
        }

        // Handle encoding - Planalto pages often use ISO-8859-1
        const buffer = await response.arrayBuffer();
        let html: string;
        
        try {
          // Try UTF-8 first
          html = new TextDecoder("utf-8").decode(buffer);
          // Check if it decoded properly (look for garbled characters)
          if (html.includes("Ã§") || html.includes("Ã£")) {
            html = new TextDecoder("iso-8859-1").decode(buffer);
          }
        } catch {
          html = new TextDecoder("iso-8859-1").decode(buffer);
        }

        const proposicoes = parseHTML(html, tipo, ano);
        logs.push(`📊 ${tipo} ${ano}: ${proposicoes.length} proposições encontradas`);

        if (proposicoes.length === 0) {
          logs.push(`⚠️ ${tipo} ${ano}: Nenhuma proposição na página (pode estar vazia ou formato diferente)`);
          continue;
        }

        // Check existing records
        const numerosExistentes = new Set<string>();
        if (!forceReimport) {
          const { data: existing } = await supabase
            .from(tableName as any)
            .select("numero_lei")
            .in(
              "numero_lei",
              proposicoes.map((p) => p.numero_lei)
            );
          
          if (existing) {
            existing.forEach((e: any) => numerosExistentes.add(e.numero_lei));
          }
        }

        // Insert new records
        for (const prop of proposicoes) {
          if (!forceReimport && numerosExistentes.has(prop.numero_lei)) {
            totalSkipped++;
            continue;
          }

          const record: any = {
            numero_lei: prop.numero_lei,
            ementa: prop.ementa,
            situacao: prop.situacao,
            url_camara: prop.url_camara,
            tipo_ato: tipoAto,
            data_apresentacao: `${prop.ano}-01-01`,
          };

          if (forceReimport) {
            // Upsert by numero_lei
            const { error } = await supabase
              .from(tableName as any)
              .upsert(record, { onConflict: "numero_lei" });

            if (error) {
              // If upsert fails (no unique constraint), try insert
              const { error: insertError } = await supabase
                .from(tableName as any)
                .insert(record);
              
              if (insertError) {
                logs.push(`❌ Erro inserindo ${prop.numero_lei}: ${insertError.message}`);
                totalErrors++;
                continue;
              }
            }
          } else {
            const { error } = await supabase
              .from(tableName as any)
              .insert(record);

            if (error) {
              if (error.code === "23505") {
                // Duplicate, skip
                totalSkipped++;
                continue;
              }
              logs.push(`❌ Erro inserindo ${prop.numero_lei}: ${error.message}`);
              totalErrors++;
              continue;
            }
          }

          totalImported++;
        }

        logs.push(`✅ ${tipo} ${ano}: ${proposicoes.length - totalSkipped} inseridas`);
      } catch (fetchError) {
        logs.push(`❌ Erro ao buscar ${tipo} ${ano}: ${fetchError.message}`);
        totalErrors++;
      }
    }

    const summary = {
      tipo,
      tabela: tableName,
      anos: anosArray,
      total_importados: totalImported,
      total_ignorados: totalSkipped,
      total_erros: totalErrors,
      logs,
    };

    console.log("Importação concluída:", JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
