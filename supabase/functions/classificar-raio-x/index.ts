import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento regex → categoria do Vade Mecum
const CATEGORIA_RULES: Array<{ pattern: RegExp; categoria: string }> = [
  // Constituição
  { pattern: /emenda\s+constitucional|proposta\s+de\s+emenda/i, categoria: "constitucional" },
  { pattern: /constituição\s+federal|art\.\s*\d+.*da\s+cf/i, categoria: "constitucional" },
  // Códigos
  { pattern: /código\s+(civil|penal|processo\s+civil|processo\s+penal|trabalho|tributário|trânsito|eleitoral|defesa\s+do\s+consumidor)/i, categoria: "codigos" },
  { pattern: /decreto-lei\s+n[ºo°]?\s*2\.?848/i, categoria: "codigos" }, // CP
  { pattern: /decreto-lei\s+n[ºo°]?\s*3\.?689/i, categoria: "codigos" }, // CPP
  { pattern: /lei\s+n[ºo°]?\s*10\.?406/i, categoria: "codigos" }, // CC
  { pattern: /lei\s+n[ºo°]?\s*13\.?105/i, categoria: "codigos" }, // CPC
  { pattern: /decreto-lei\s+n[ºo°]?\s*5\.?452/i, categoria: "codigos" }, // CLT
  { pattern: /lei\s+n[ºo°]?\s*5\.?172/i, categoria: "codigos" }, // CTN
  { pattern: /lei\s+n[ºo°]?\s*8\.?078/i, categoria: "codigos" }, // CDC
  { pattern: /lei\s+n[ºo°]?\s*9\.?503/i, categoria: "codigos" }, // CTB
  // Penal
  { pattern: /lei\s+n[ºo°]?\s*7\.?210/i, categoria: "penal" }, // LEP
  { pattern: /lei\s+n[ºo°]?\s*11\.?340/i, categoria: "penal" }, // Maria da Penha
  { pattern: /lei\s+n[ºo°]?\s*11\.?343/i, categoria: "penal" }, // Drogas
  { pattern: /lei\s+n[ºo°]?\s*12\.?850/i, categoria: "penal" }, // Org. Criminosas
  { pattern: /lei\s+n[ºo°]?\s*8\.?072/i, categoria: "penal" }, // Hediondos
  { pattern: /lei\s+n[ºo°]?\s*9\.?455/i, categoria: "penal" }, // Tortura
  { pattern: /lei\s+n[ºo°]?\s*13\.?869/i, categoria: "penal" }, // Abuso autoridade
  { pattern: /crime|penal|pris[ãa]o|pena\s/i, categoria: "penal" },
  // Estatutos
  { pattern: /estatuto/i, categoria: "estatutos" },
  { pattern: /lei\s+n[ºo°]?\s*8\.?069/i, categoria: "estatutos" }, // ECA
  { pattern: /lei\s+n[ºo°]?\s*10\.?741/i, categoria: "estatutos" }, // Idoso
  { pattern: /lei\s+n[ºo°]?\s*8\.?906/i, categoria: "estatutos" }, // OAB
  // Previdenciário
  { pattern: /previdên|inss|aposentadoria|benefício\s+previdenciário/i, categoria: "previdenciario" },
  { pattern: /lei\s+n[ºo°]?\s*8\.?213/i, categoria: "previdenciario" },
  { pattern: /lei\s+n[ºo°]?\s*8\.?212/i, categoria: "previdenciario" },
  // Medidas Provisórias
  { pattern: /medida\s+provisória/i, categoria: "medidas_provisorias" },
  // Decretos
  { pattern: /^decreto\s+n[ºo°]?/i, categoria: "decretos" },
];

// Detecta tipo de alteração e lei afetada pela ementa
function detectarTipoAlteracao(ementa: string, numeroLei: string): { tipo: string; leiAfetada: string | null; artigos: string[] } {
  const tipo = /revoga/i.test(ementa) ? "revogacao"
    : /altera|acrescenta|inclui|modifica|dá nova redação/i.test(ementa) ? "alteracao"
    : "nova";

  let leiAfetada: string | null = null;
  const matchLei = ementa.match(/(?:altera|acrescenta|inclui|modifica|revoga)[^.]*?(?:a\s+)?(?:Lei|Decreto-Lei|Decreto|Lei\s+Complementar)\s+n[ºo°]?\s*[\d.]+(?:\/\d{2,4})?/i);
  if (matchLei) {
    leiAfetada = matchLei[0].replace(/^(?:altera|acrescenta|inclui|modifica|revoga)[^]*?(?:a\s+)?/i, "").trim();
  }

  // Extrair artigos afetados
  const artigos: string[] = [];
  const matchArtigos = ementa.matchAll(/art(?:igo)?\.?\s*(\d+[\w-]*)/gi);
  for (const m of matchArtigos) {
    artigos.push(`Art. ${m[1]}`);
  }

  return { tipo, leiAfetada, artigos: [...new Set(artigos)] };
}

// Classificar categoria via regex
function classificarCategoriaRegex(ementa: string, numeroLei: string): string | null {
  const texto = `${numeroLei} ${ementa}`;
  for (const rule of CATEGORIA_RULES) {
    if (rule.pattern.test(texto)) {
      return rule.categoria;
    }
  }
  return null;
}

// Classificar via IA (fallback)
async function classificarCategoriaIA(ementas: Array<{ id: string; ementa: string; numero: string }>): Promise<Record<string, string>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY || ementas.length === 0) return {};

  const categoriasValidas = ["codigos", "constitucional", "penal", "estatutos", "previdenciario", "ordinarias", "decretos", "medidas_provisorias"];

  const prompt = `Classifique cada lei abaixo em UMA das categorias: ${categoriasValidas.join(", ")}.
Responda APENAS com um JSON: { "id": "categoria", ... }

Leis:
${ementas.map(e => `- ID ${e.id}: ${e.numero} — ${e.ementa?.substring(0, 200)}`).join("\n")}`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Você é um classificador de legislação brasileira. Responda APENAS com JSON válido." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!resp.ok) {
      console.error("AI Gateway error:", resp.status, await resp.text());
      return {};
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate categories
      const result: Record<string, string> = {};
      for (const [id, cat] of Object.entries(parsed)) {
        if (categoriasValidas.includes(cat as string)) {
          result[id] = cat as string;
        }
      }
      return result;
    }
  } catch (e) {
    console.error("AI classification error:", e);
  }
  return {};
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar resenhas que ainda não foram classificadas
    const { data: existingIds } = await supabase
      .from("raio_x_legislativo")
      .select("resenha_id");

    const processedIds = new Set((existingIds || []).map((r: any) => r.resenha_id));

    const { data: resenhas, error } = await supabase
      .from("resenha_diaria")
      .select("id, numero_lei, ementa, data_publicacao, areas_direito, artigos")
      .eq("status", "ativo")
      .order("data_publicacao", { ascending: false })
      .limit(200);

    if (error) throw error;

    const novas = (resenhas || []).filter((r: any) => !processedIds.has(r.id));
    if (novas.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma nova resenha para classificar", total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Classificando ${novas.length} novas resenhas...`);

    // Fase 1: Classificar via regex
    const pendentesIA: Array<{ id: string; ementa: string; numero: string }> = [];
    const inserts: any[] = [];

    for (const r of novas) {
      const { tipo, leiAfetada, artigos } = detectarTipoAlteracao(r.ementa || "", r.numero_lei);
      const categoriaRegex = classificarCategoriaRegex(r.ementa || "", r.numero_lei);

      if (categoriaRegex) {
        inserts.push({
          resenha_id: r.id,
          categoria: categoriaRegex,
          tipo_alteracao: tipo,
          lei_afetada: leiAfetada,
          artigos_afetados: artigos.length > 0 ? artigos : null,
          relevancia: tipo === "alteracao" ? "alta" : "normal",
        });
      } else {
        pendentesIA.push({ id: r.id, ementa: r.ementa || "", numero: r.numero_lei });
      }
    }

    // Fase 2: Classificar pendentes via IA (em batches de 20)
    for (let i = 0; i < pendentesIA.length; i += 20) {
      const batch = pendentesIA.slice(i, i + 20);
      const iaResults = await classificarCategoriaIA(batch);

      for (const item of batch) {
        const categoria = iaResults[item.id] || "ordinarias"; // fallback
        const r = novas.find((n: any) => n.id === item.id)!;
        const { tipo, leiAfetada, artigos } = detectarTipoAlteracao(r.ementa || "", r.numero_lei);

        inserts.push({
          resenha_id: r.id,
          categoria,
          tipo_alteracao: tipo,
          lei_afetada: leiAfetada,
          artigos_afetados: artigos.length > 0 ? artigos : null,
          relevancia: tipo === "alteracao" ? "alta" : "normal",
        });
      }
    }

    // Fase 3: Gerar resumos para alterações importantes (via IA)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      const alteracoes = inserts.filter(i => i.tipo_alteracao === "alteracao" && i.lei_afetada);
      for (let i = 0; i < Math.min(alteracoes.length, 10); i++) {
        const item = alteracoes[i];
        const r = novas.find((n: any) => n.id === item.resenha_id)!;
        try {
          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                { role: "system", content: "Resuma em 1-2 frases curtas o que mudou na legislação brasileira. Seja direto e objetivo." },
                { role: "user", content: `Lei: ${r.numero_lei}\nEmenta: ${r.ementa}\nLei afetada: ${item.lei_afetada}` },
              ],
              temperature: 0.3,
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            item.resumo_alteracao = data.choices?.[0]?.message?.content?.substring(0, 500) || null;
          }
        } catch { /* skip */ }
      }
    }

    // Inserir tudo
    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from("raio_x_legislativo")
        .insert(inserts);

      if (insertError) throw insertError;
    }

    const stats = {
      total: inserts.length,
      regex: inserts.length - pendentesIA.length,
      ia: pendentesIA.length,
      alteracoes: inserts.filter(i => i.tipo_alteracao === "alteracao").length,
      novas: inserts.filter(i => i.tipo_alteracao === "nova").length,
      revogacoes: inserts.filter(i => i.tipo_alteracao === "revogacao").length,
    };

    console.log("Classificação concluída:", stats);

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classificar-raio-x error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
