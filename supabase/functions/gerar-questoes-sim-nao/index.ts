import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_SUBTEMAS_POR_CHAMADA = 3;

type Pergunta = {
  afirmacao: string;
  resposta: boolean;
  explicacao: string;
  subtema: string;
};

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildCacheKey = (area: string, tema: string, subtema: string) => {
  return `questoes-sn:${encodeURIComponent(area)}:${encodeURIComponent(tema)}:${encodeURIComponent(subtema)}`;
};

const buildLegacyCacheKey = (area: string, subtema: string) => {
  return `questoes-sn:${area}:${subtema}`;
};

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
            generationConfig: { temperature: 0.7, maxOutputTokens: 5000 },
          }),
        }
      );

      if (response.status === 429 || response.status === 503 || response.status === 403) {
        continue;
      }

      if (!response.ok) continue;

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {
      continue;
    }
  }

  throw new Error("Todas as chaves API esgotadas");
}

function parsePerguntas(rawResponse: string, subtema: string): Pergunta[] {
  let parsed: unknown;

  try {
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
  } catch {
    throw new Error("Erro ao parsear resposta da IA");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Resposta da IA em formato inválido");
  }

  const perguntas = parsed
    .map((item: any) => {
      const resposta =
        typeof item?.resposta === "boolean"
          ? item.resposta
          : String(item?.resposta).trim().toLowerCase() === "true";

      return {
        afirmacao: String(item?.afirmacao || "").trim(),
        resposta,
        explicacao: String(item?.explicacao || "").trim(),
        subtema,
      };
    })
    .filter((item) => item.afirmacao.length > 0 && item.explicacao.length > 0)
    .slice(0, 10);

  if (perguntas.length === 0) {
    throw new Error("Nenhuma pergunta válida foi gerada");
  }

  return perguntas;
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
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(subtema);
    }
  }

  return unique;
}

async function generatePerguntasParaSubtema(
  supabase: ReturnType<typeof createClient>,
  area: string,
  tema: string,
  subtema: string
): Promise<{ perguntas: Pergunta[]; fromCache: boolean; generatedNow: boolean }> {
  const cacheKey = buildCacheKey(area, tema, subtema);
  const legacyCacheKey = buildLegacyCacheKey(area, subtema);

  const { data: cachedRows } = await supabase
    .from("gamificacao_sim_nao_cache")
    .select("materia, perguntas")
    .eq("nivel", 1)
    .in("materia", [cacheKey, legacyCacheKey]);

  const cached = cachedRows?.find((row: any) => Array.isArray(row.perguntas) && row.perguntas.length > 0);

  if (cached?.perguntas) {
    const perguntasCache = (cached.perguntas as any[]).map((item) => ({
      afirmacao: String(item?.afirmacao || "").trim(),
      resposta:
        typeof item?.resposta === "boolean"
          ? item.resposta
          : String(item?.resposta).trim().toLowerCase() === "true",
      explicacao: String(item?.explicacao || "").trim(),
      subtema,
    }));

    return { perguntas: perguntasCache, fromCache: true, generatedNow: false };
  }

  const { data: resumoData } = await supabase
    .from("RESUMO")
    .select("conteudo")
    .eq("area", area)
    .eq("tema", tema)
    .eq("subtema", subtema)
    .limit(4);

  const contexto = (resumoData || [])
    .map((row: any) => row.conteudo)
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4500);

  const prompt = `Você é um professor de ${area}. Gere EXATAMENTE 10 afirmações jurídicas no formato Verdadeiro/Falso sobre o subtema "${subtema}" (tema: ${tema}).

${contexto ? `CONTEXTO BASEADO NO RESUMO:\n${contexto}\n\n` : ""}REGRAS OBRIGATÓRIAS:
- Retorne exatamente 10 itens
- Misture verdadeiro e falso (aprox. 50/50)
- Afirmações curtas e objetivas (1-2 frases)
- Explicação curta e precisa (1-2 frases)
- Não repita afirmações

Retorne APENAS um JSON válido neste formato:
[
  {"afirmacao":"texto","resposta":true,"explicacao":"texto"}
]`;

  const aiResponse = await callGeminiWithFallback(prompt);
  const perguntas = parsePerguntas(aiResponse, subtema);

  await supabase
    .from("gamificacao_sim_nao_cache")
    .upsert({ materia: cacheKey, nivel: 1, perguntas }, { onConflict: "materia,nivel" });

  return { perguntas, fromCache: false, generatedNow: true };
}

function mapPerguntasDoCachePorSubtema(
  rows: any[],
  area: string,
  tema: string,
  subtemasValidosNorm: Set<string>
): Map<string, Pergunta[]> {
  const map = new Map<string, Pergunta[]>();

  const newPrefix = `questoes-sn:${encodeURIComponent(area)}:${encodeURIComponent(tema)}:`;
  const legacyPrefix = `questoes-sn:${area}:`;

  for (const row of rows) {
    const materia = String(row?.materia || "");
    if (!Array.isArray(row?.perguntas)) continue;

    let subtema = "";

    if (materia.startsWith(newPrefix)) {
      const encodedSubtema = materia.slice(newPrefix.length);
      subtema = safeDecode(encodedSubtema);
    } else if (materia.startsWith(legacyPrefix)) {
      subtema = materia.slice(legacyPrefix.length);
    } else {
      continue;
    }

    if (!subtema) continue;

    const subtemaNorm = normalize(subtema);
    if (!subtemasValidosNorm.has(subtemaNorm)) continue;

    const perguntas = (row.perguntas as any[])
      .map((item: any) => ({
        afirmacao: String(item?.afirmacao || "").trim(),
        resposta:
          typeof item?.resposta === "boolean"
            ? item.resposta
            : String(item?.resposta).trim().toLowerCase() === "true",
        explicacao: String(item?.explicacao || "").trim(),
        subtema,
      }))
      .filter((item: Pergunta) => item.afirmacao.length > 0 && item.explicacao.length > 0)
      .slice(0, 10);

    if (perguntas.length > 0 && !map.has(subtemaNorm)) {
      map.set(subtemaNorm, perguntas);
    }
  }

  return map;
}

async function buscarCacheDoTema(
  supabase: ReturnType<typeof createClient>,
  area: string,
  tema: string,
  subtemasValidosNorm: Set<string>
): Promise<Map<string, Pergunta[]>> {
  const newPrefix = `questoes-sn:${encodeURIComponent(area)}:${encodeURIComponent(tema)}:`;
  const legacyPrefix = `questoes-sn:${area}:`;

  const [newCacheResult, legacyCacheResult] = await Promise.all([
    supabase
      .from("gamificacao_sim_nao_cache")
      .select("materia, perguntas")
      .eq("nivel", 1)
      .like("materia", `${newPrefix}%`),
    supabase
      .from("gamificacao_sim_nao_cache")
      .select("materia, perguntas")
      .eq("nivel", 1)
      .like("materia", `${legacyPrefix}%`),
  ]);

  const rows = [...(newCacheResult.data || []), ...(legacyCacheResult.data || [])];
  return mapPerguntasDoCachePorSubtema(rows, area, tema, subtemasValidosNorm);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const area = String(body?.area || "").trim();
    const tema = String(body?.tema || "").trim();
    const subtema = String(body?.subtema || "").trim();
    const includeQuestions = Boolean(body?.include_questions);
    const maxSubtemasPorChamada = Number(body?.max_subtemas || MAX_SUBTEMAS_POR_CHAMADA);

    if (!area) {
      return new Response(JSON.stringify({ error: "area é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tema && !subtema) {
      return new Response(JSON.stringify({ error: "tema ou subtema é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (subtema) {
      const temaParaCache = tema || "geral";
      const result = await generatePerguntasParaSubtema(supabase, area, temaParaCache, subtema);

      return new Response(
        JSON.stringify({
          modo: "subtema",
          subtema,
          perguntas: result.perguntas,
          fromCache: result.fromCache,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subtemas = await fetchSubtemasDoTema(supabase, area, tema);

    if (subtemas.length === 0) {
      return new Response(
        JSON.stringify({
          modo: "tema",
          tema,
          total_subtemas: 0,
          subtemas_processados: 0,
          subtemas_faltantes: 0,
          questoes_geradas: 0,
          geracao_completa: true,
          perguntas: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subtemasNormSet = new Set(subtemas.map((item) => normalize(item)));
    const cacheMap = await buscarCacheDoTema(supabase, area, tema, subtemasNormSet);

    const pendingSubtemas = subtemas.filter((item) => !cacheMap.has(normalize(item)));
    const batch = pendingSubtemas.slice(0, Math.max(1, maxSubtemasPorChamada));

    let questoesGeradasNaChamada = 0;

    for (let index = 0; index < batch.length; index++) {
      const subtemaAtual = batch[index];

      try {
        const result = await generatePerguntasParaSubtema(supabase, area, tema, subtemaAtual);
        cacheMap.set(normalize(subtemaAtual), result.perguntas);

        if (result.generatedNow) {
          questoesGeradasNaChamada += result.perguntas.length;
        }
      } catch (error) {
        console.error(`[gerar-questoes-sim-nao] erro no subtema "${subtemaAtual}":`, error);
      }

      if (index + 1 < batch.length) {
        await sleep(500);
      }
    }

    const subtemasFaltantes = subtemas.filter((item) => !cacheMap.has(normalize(item))).length;
    const subtemasProcessados = subtemas.length - subtemasFaltantes;
    const geracaoCompleta = subtemasFaltantes === 0;

    const perguntas = includeQuestions
      ? subtemas.flatMap((subtemaItem) => {
          const cached = cacheMap.get(normalize(subtemaItem)) || [];
          return cached.map((pergunta) => ({
            afirmacao: pergunta.afirmacao,
            resposta: pergunta.resposta,
            explicacao: pergunta.explicacao,
            subtema: subtemaItem,
          }));
        })
      : undefined;

    return new Response(
      JSON.stringify({
        modo: "tema",
        tema,
        total_subtemas: subtemas.length,
        subtemas_processados: subtemasProcessados,
        subtemas_faltantes: subtemasFaltantes,
        questoes_geradas: questoesGeradasNaChamada,
        geracao_completa: geracaoCompleta,
        ...(includeQuestions ? { perguntas } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[gerar-questoes-sim-nao] Erro:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
