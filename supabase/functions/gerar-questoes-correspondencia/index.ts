import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_SUBTEMAS_POR_CHAMADA = 3;

type Par = {
  conceito: string;
  definicao: string;
  subtema: string;
};

const normalize = (value: string) =>
  value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");

const safeDecode = (value: string) => {
  try { return decodeURIComponent(value); } catch { return value; }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildCacheKey = (area: string, tema: string, subtema: string) =>
  `questoes-corresp:${encodeURIComponent(area)}:${encodeURIComponent(tema)}:${encodeURIComponent(subtema)}`;

async function callGeminiWithFallback(prompt: string): Promise<string> {
  const keys = getRotatedKeyStrings();
  for (const apiKey of keys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
          }),
        }
      );
      if (response.status === 429 || response.status === 503 || response.status === 403) continue;
      if (!response.ok) continue;
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch { continue; }
  }
  throw new Error("Todas as chaves API esgotadas");
}

function parsePares(rawResponse: string, subtema: string): Par[] {
  let parsed: unknown;
  try {
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch {
    throw new Error("Erro ao parsear resposta da IA");
  }
  if (!Array.isArray(parsed)) throw new Error("Resposta da IA em formato inválido");

  return parsed
    .map((item: any) => ({
      conceito: String(item?.conceito || "").trim(),
      definicao: String(item?.definicao || "").trim(),
      subtema,
    }))
    .filter((p) => p.conceito.length > 0 && p.definicao.length > 0)
    .slice(0, 5);
}

async function fetchSubtemasDoTema(
  supabase: ReturnType<typeof createClient>,
  area: string,
  tema: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("RESUMO")
    .select("id, subtema")
    .eq("area", area)
    .eq("tema", tema)
    .not("subtema", "is", null)
    .order("id", { ascending: true });
  if (error) throw error;

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const row of data || []) {
    if (!row.subtema) continue;
    const subtema = row.subtema.trim();
    if (!subtema) continue;
    const key = normalize(subtema);
    if (!seen.has(key)) { seen.add(key); unique.push(subtema); }
  }
  return unique;
}

async function generateParesParaSubtema(
  supabase: ReturnType<typeof createClient>,
  area: string,
  tema: string,
  subtema: string
): Promise<{ pares: Par[]; fromCache: boolean; generatedNow: boolean }> {
  const cacheKey = buildCacheKey(area, tema, subtema);

  const { data: cached } = await supabase
    .from("gamificacao_sim_nao_cache")
    .select("perguntas")
    .eq("materia", cacheKey)
    .eq("nivel", 1)
    .maybeSingle();

  if (cached?.perguntas && Array.isArray(cached.perguntas) && cached.perguntas.length > 0) {
    const pares = (cached.perguntas as any[]).map((item) => ({
      conceito: String(item?.conceito || "").trim(),
      definicao: String(item?.definicao || "").trim(),
      subtema,
    })).filter((p) => p.conceito.length > 0 && p.definicao.length > 0);
    if (pares.length > 0) return { pares, fromCache: true, generatedNow: false };
  }

  const { data: resumoData } = await supabase
    .from("RESUMO")
    .select("conteudo")
    .eq("area", area)
    .eq("tema", tema)
    .eq("subtema", subtema)
    .limit(4);

  const contexto = (resumoData || []).map((row: any) => row.conteudo).filter(Boolean).join("\n\n").slice(0, 4500);

  const prompt = `Você é um professor de ${area}. Gere EXATAMENTE 5 pares de conceito-definição sobre o subtema "${subtema}" (tema: ${tema}).

${contexto ? `CONTEXTO BASEADO NO RESUMO:\n${contexto}\n\n` : ""}REGRAS OBRIGATÓRIAS:
- Retorne exatamente 5 pares
- Cada conceito deve ser um termo ou instituto jurídico curto (1-4 palavras)
- Cada definição deve ser clara e objetiva (1-2 frases)
- Os conceitos devem ser distintos entre si
- As definições devem ser suficientemente diferentes para não gerar ambiguidade

Retorne APENAS um JSON válido neste formato:
[
  {"conceito":"Habeas Corpus","definicao":"Ação constitucional que protege o direito de locomoção contra ilegalidade ou abuso de poder."},
  {"conceito":"Mandado de Segurança","definicao":"Remédio constitucional para proteger direito líquido e certo não amparado por habeas corpus ou habeas data."}
]`;

  const aiResponse = await callGeminiWithFallback(prompt);
  const pares = parsePares(aiResponse, subtema);

  await supabase
    .from("gamificacao_sim_nao_cache")
    .upsert({ materia: cacheKey, nivel: 1, perguntas: pares }, { onConflict: "materia,nivel" });

  return { pares, fromCache: false, generatedNow: true };
}

async function buscarCacheDoTema(
  supabase: ReturnType<typeof createClient>,
  area: string,
  tema: string,
  subtemasValidosNorm: Set<string>
): Promise<Map<string, Par[]>> {
  const prefix = `questoes-corresp:${encodeURIComponent(area)}:${encodeURIComponent(tema)}:`;

  const { data } = await supabase
    .from("gamificacao_sim_nao_cache")
    .select("materia, perguntas")
    .eq("nivel", 1)
    .like("materia", `${prefix}%`);

  const map = new Map<string, Par[]>();
  for (const row of data || []) {
    const materia = String(row?.materia || "");
    if (!Array.isArray(row?.perguntas)) continue;
    if (!materia.startsWith(prefix)) continue;
    const subtema = safeDecode(materia.slice(prefix.length));
    if (!subtema) continue;
    const subtemaNorm = normalize(subtema);
    if (!subtemasValidosNorm.has(subtemaNorm)) continue;

    const pares = (row.perguntas as any[])
      .map((item: any) => ({
        conceito: String(item?.conceito || "").trim(),
        definicao: String(item?.definicao || "").trim(),
        subtema,
      }))
      .filter((p) => p.conceito.length > 0 && p.definicao.length > 0)
      .slice(0, 5);

    if (pares.length > 0 && !map.has(subtemaNorm)) map.set(subtemaNorm, pares);
  }
  return map;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const area = String(body?.area || "").trim();
    const tema = String(body?.tema || "").trim();
    const includeQuestions = Boolean(body?.include_questions);
    const maxSubtemas = Number(body?.max_subtemas || MAX_SUBTEMAS_POR_CHAMADA);

    if (!area || !tema) {
      return new Response(JSON.stringify({ error: "area e tema são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const subtemas = await fetchSubtemasDoTema(supabase, area, tema);
    if (subtemas.length === 0) {
      return new Response(JSON.stringify({
        tema, total_subtemas: 0, subtemas_processados: 0, subtemas_faltantes: 0,
        questoes_geradas: 0, geracao_completa: true, pares: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const subtemasNormSet = new Set(subtemas.map(normalize));
    const cacheMap = await buscarCacheDoTema(supabase, area, tema, subtemasNormSet);
    const pendingSubtemas = subtemas.filter((item) => !cacheMap.has(normalize(item)));
    const batch = pendingSubtemas.slice(0, Math.max(1, maxSubtemas));

    let questoesGeradas = 0;
    for (let i = 0; i < batch.length; i++) {
      try {
        const result = await generateParesParaSubtema(supabase, area, tema, batch[i]);
        cacheMap.set(normalize(batch[i]), result.pares);
        if (result.generatedNow) questoesGeradas += result.pares.length;
      } catch (error) {
        console.error(`[gerar-questoes-correspondencia] erro em "${batch[i]}":`, error);
      }
      if (i + 1 < batch.length) await sleep(500);
    }

    const subtemasFaltantes = subtemas.filter((item) => !cacheMap.has(normalize(item))).length;
    const geracaoCompleta = subtemasFaltantes === 0;

    const pares = includeQuestions
      ? subtemas.flatMap((s) => (cacheMap.get(normalize(s)) || []).map((p) => ({ ...p, subtema: s })))
      : undefined;

    return new Response(JSON.stringify({
      tema,
      total_subtemas: subtemas.length,
      subtemas_processados: subtemas.length - subtemasFaltantes,
      subtemas_faltantes: subtemasFaltantes,
      questoes_geradas: questoesGeradas,
      geracao_completa: geracaoCompleta,
      ...(includeQuestions ? { pares } : {}),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[gerar-questoes-correspondencia] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
