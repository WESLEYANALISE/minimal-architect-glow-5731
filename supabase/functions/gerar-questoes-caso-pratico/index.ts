import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_SUBTEMAS_POR_CHAMADA = 3;

type CasoPratico = {
  cenario: string;
  pergunta: string;
  alternativas: { letra: string; texto: string }[];
  gabarito: string;
  explicacao: string;
  subtema: string;
};

const normalize = (value: string) =>
  value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");

const safeDecode = (value: string) => {
  try { return decodeURIComponent(value); } catch { return value; }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildCacheKey = (area: string, tema: string, subtema: string) =>
  `questoes-cp:${encodeURIComponent(area)}:${encodeURIComponent(tema)}:${encodeURIComponent(subtema)}`;

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
            generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
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

function parseCasos(rawResponse: string, subtema: string): CasoPratico[] {
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
      cenario: String(item?.cenario || "").trim(),
      pergunta: String(item?.pergunta || "").trim(),
      alternativas: Array.isArray(item?.alternativas)
        ? item.alternativas.map((a: any) => ({ letra: String(a?.letra || "").trim(), texto: String(a?.texto || "").trim() }))
        : [],
      gabarito: String(item?.gabarito || "").trim().toUpperCase(),
      explicacao: String(item?.explicacao || "").trim(),
      subtema,
    }))
    .filter((c) => c.cenario.length > 0 && c.pergunta.length > 0 && c.alternativas.length === 4 && c.gabarito.length > 0 && c.explicacao.length > 0)
    .slice(0, 5);
}

async function fetchSubtemasDoTema(supabase: ReturnType<typeof createClient>, area: string, tema: string): Promise<string[]> {
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

async function generateCasosParaSubtema(
  supabase: ReturnType<typeof createClient>, area: string, tema: string, subtema: string
): Promise<{ casos: CasoPratico[]; fromCache: boolean; generatedNow: boolean }> {
  const cacheKey = buildCacheKey(area, tema, subtema);

  const { data: cachedRows } = await supabase
    .from("gamificacao_sim_nao_cache")
    .select("materia, perguntas")
    .eq("nivel", 1)
    .eq("materia", cacheKey);

  const cached = cachedRows?.find((row: any) => Array.isArray(row.perguntas) && row.perguntas.length > 0);
  if (cached?.perguntas) {
    const casosCache = (cached.perguntas as any[]).map((item) => ({
      cenario: String(item?.cenario || "").trim(),
      pergunta: String(item?.pergunta || "").trim(),
      alternativas: Array.isArray(item?.alternativas)
        ? item.alternativas.map((a: any) => ({ letra: String(a?.letra || ""), texto: String(a?.texto || "") }))
        : [],
      gabarito: String(item?.gabarito || "").trim(),
      explicacao: String(item?.explicacao || "").trim(),
      subtema,
    }));
    return { casos: casosCache, fromCache: true, generatedNow: false };
  }

  const { data: resumoData } = await supabase
    .from("RESUMO")
    .select("conteudo")
    .eq("area", area)
    .eq("tema", tema)
    .eq("subtema", subtema)
    .limit(4);

  const contexto = (resumoData || []).map((row: any) => row.conteudo).filter(Boolean).join("\n\n").slice(0, 5000);

  const prompt = `Você é um professor de ${area}. Crie EXATAMENTE 5 questões de CASO PRÁTICO sobre "${subtema}" (tema: ${tema}).

${contexto ? `CONTEXTO BASEADO NO RESUMO:\n${contexto}\n\n` : ""}Cada caso prático deve ter:
1. Um CENÁRIO narrativo com 3-4 linhas descrevendo uma situação jurídica real
2. Uma PERGUNTA objetiva sobre o cenário
3. Exatamente 4 ALTERNATIVAS (A, B, C, D) — apenas uma correta
4. O GABARITO (letra correta)
5. Uma EXPLICAÇÃO jurídica fundamentada (1-2 frases)

REGRAS:
- Cenários realistas com nomes fictícios (João, Maria, etc.)
- Alternativas plausíveis (não óbvias)
- Misture dificuldade: 2 fáceis, 2 médias, 1 difícil
- Não repita cenários

Retorne APENAS um JSON válido:
[
  {
    "cenario": "João firmou contrato...",
    "pergunta": "Qual o vício presente?",
    "alternativas": [
      {"letra": "A", "texto": "Erro substancial"},
      {"letra": "B", "texto": "Dolo"},
      {"letra": "C", "texto": "Coação"},
      {"letra": "D", "texto": "Lesão"}
    ],
    "gabarito": "A",
    "explicacao": "Conforme art. 138 do CC..."
  }
]`;

  const aiResponse = await callGeminiWithFallback(prompt);
  const casos = parseCasos(aiResponse, subtema);

  await supabase
    .from("gamificacao_sim_nao_cache")
    .upsert({ materia: cacheKey, nivel: 1, perguntas: casos }, { onConflict: "materia,nivel" });

  return { casos, fromCache: false, generatedNow: true };
}

async function buscarCacheDoTema(
  supabase: ReturnType<typeof createClient>, area: string, tema: string, subtemasValidosNorm: Set<string>
): Promise<Map<string, CasoPratico[]>> {
  const prefix = `questoes-cp:${encodeURIComponent(area)}:${encodeURIComponent(tema)}:`;

  const { data } = await supabase
    .from("gamificacao_sim_nao_cache")
    .select("materia, perguntas")
    .eq("nivel", 1)
    .like("materia", `${prefix}%`);

  const map = new Map<string, CasoPratico[]>();
  for (const row of data || []) {
    const materia = String(row?.materia || "");
    if (!Array.isArray(row?.perguntas)) continue;
    if (!materia.startsWith(prefix)) continue;

    const encodedSubtema = materia.slice(prefix.length);
    const subtema = safeDecode(encodedSubtema);
    if (!subtema) continue;

    const subtemaNorm = normalize(subtema);
    if (!subtemasValidosNorm.has(subtemaNorm)) continue;

    const casos = (row.perguntas as any[])
      .map((item: any) => ({
        cenario: String(item?.cenario || "").trim(),
        pergunta: String(item?.pergunta || "").trim(),
        alternativas: Array.isArray(item?.alternativas)
          ? item.alternativas.map((a: any) => ({ letra: String(a?.letra || ""), texto: String(a?.texto || "") }))
          : [],
        gabarito: String(item?.gabarito || "").trim(),
        explicacao: String(item?.explicacao || "").trim(),
        subtema,
      }))
      .filter((c: CasoPratico) => c.cenario.length > 0 && c.alternativas.length === 4);

    if (casos.length > 0 && !map.has(subtemaNorm)) {
      map.set(subtemaNorm, casos);
    }
  }
  return map;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const area = String(body?.area || "").trim();
    const tema = String(body?.tema || "").trim();
    const includeQuestions = Boolean(body?.include_questions);
    const maxSubtemasPorChamada = Number(body?.max_subtemas || MAX_SUBTEMAS_POR_CHAMADA);

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
      return new Response(
        JSON.stringify({
          modo: "tema", tema, total_subtemas: 0, subtemas_processados: 0,
          subtemas_faltantes: 0, questoes_geradas: 0, geracao_completa: true, perguntas: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subtemasNormSet = new Set(subtemas.map((s) => normalize(s)));
    const cacheMap = await buscarCacheDoTema(supabase, area, tema, subtemasNormSet);

    const pendingSubtemas = subtemas.filter((s) => !cacheMap.has(normalize(s)));
    const batch = pendingSubtemas.slice(0, Math.max(1, maxSubtemasPorChamada));

    let questoesGeradasNaChamada = 0;

    for (let i = 0; i < batch.length; i++) {
      const subtemaAtual = batch[i];
      try {
        const result = await generateCasosParaSubtema(supabase, area, tema, subtemaAtual);
        cacheMap.set(normalize(subtemaAtual), result.casos);
        if (result.generatedNow) questoesGeradasNaChamada += result.casos.length;
      } catch (error) {
        console.error(`[gerar-questoes-caso-pratico] erro no subtema "${subtemaAtual}":`, error);
      }
      if (i + 1 < batch.length) await sleep(500);
    }

    const subtemasFaltantes = subtemas.filter((s) => !cacheMap.has(normalize(s))).length;
    const subtemasProcessados = subtemas.length - subtemasFaltantes;
    const geracaoCompleta = subtemasFaltantes === 0;

    const perguntas = includeQuestions
      ? subtemas.flatMap((s) => cacheMap.get(normalize(s)) || [])
      : undefined;

    return new Response(
      JSON.stringify({
        modo: "tema", tema, total_subtemas: subtemas.length,
        subtemas_processados: subtemasProcessados, subtemas_faltantes: subtemasFaltantes,
        questoes_geradas: questoesGeradasNaChamada, geracao_completa: geracaoCompleta,
        ...(includeQuestions ? { perguntas } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[gerar-questoes-caso-pratico] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
