import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const diasSemanaMap: { [key: string]: string } = {
  seg: "Segunda-feira",
  ter: "Terça-feira",
  qua: "Quarta-feira",
  qui: "Quinta-feira",
  sex: "Sexta-feira",
  sab: "Sábado",
  dom: "Domingo",
};

function tryRepairJSON(jsonStr: string): any {
  try { return JSON.parse(jsonStr); } catch (_e) { /* continue */ }
  let repaired = jsonStr.trim();
  const lastBrace = repaired.lastIndexOf('}');
  if (lastBrace > 0) repaired = repaired.substring(0, lastBrace + 1);
  let braceCount = 0, bracketCount = 0, inString = false, escaped = false;
  for (const char of repaired) {
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
    }
  }
  while (bracketCount > 0) { repaired += ']'; bracketCount--; }
  while (braceCount > 0) { repaired += '}'; braceCount--; }
  try { return JSON.parse(repaired); } catch (_e) { throw new Error("JSON irreparável"); }
}

async function callGeminiWithFallback(body: any): Promise<any> {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEYS[i]}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (response.status === 429 || response.status === 503) continue;
      if (!response.ok) { console.error(`Chave ${i+1} erro: ${response.status}`); continue; }
      return await response.json();
    } catch (error) { console.error(`Exceção chave ${i+1}:`, error); continue; }
  }
  throw new Error("Todas as chaves Gemini falharam");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { materia, horasPorDia, diasSemana, duracaoSemanas, arquivo, tipoArquivo } = await req.json();
    console.log("Gerando plano -", materia, horasPorDia + "h/dia", diasSemana.length + " dias", duracaoSemanas + " sem");

    if (GEMINI_KEYS.length === 0) throw new Error("Nenhuma chave GEMINI_KEY configurada");

    // Consultar temas disponíveis no app
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let temasDoApp: string[] = [];
    let livrosDoApp: { titulo: string; area: string }[] = [];
    try {
      const { data: resumos } = await supabase
        .from('RESUMO')
        .select('tema, area')
        .ilike('area', `%${materia}%`)
        .limit(30);

      if (resumos && resumos.length > 0) {
        temasDoApp = [...new Set(resumos.map((r: any) => r.tema).filter(Boolean))];
        livrosDoApp = temasDoApp.map(t => ({ titulo: t, area: resumos.find((r: any) => r.tema === t)?.area || materia }));
        console.log(`Encontrados ${temasDoApp.length} temas do app para ${materia}`);
      }
    } catch (e) {
      console.error("Erro ao consultar RESUMO:", e);
    }

    const totalHoras = horasPorDia * diasSemana.length * duracaoSemanas;
    const diasFormatados = diasSemana.map((d: string) => diasSemanaMap[d]).join(", ");
    const semanasLimitadas = Math.min(duracaoSemanas, 8);
    const totalHorasLimitado = horasPorDia * diasSemana.length * semanasLimitadas;

    let conteudoArquivo = "";
    if (arquivo && tipoArquivo) {
      const base64Data = arquivo.split(",")[1];
      const mimeType = arquivo.split(";")[0].split(":")[1];
      try {
        const visionData = await callGeminiWithFallback({
          contents: [{ parts: [
            { text: "Extraia os PRINCIPAIS tópicos deste documento. Liste apenas os temas principais." },
            { inlineData: { mimeType, data: base64Data } }
          ]}],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
        });
        conteudoArquivo = visionData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (e) { console.error("Erro arquivo:", e); }
    }

    const temasTexto = temasDoApp.length > 0
      ? `\n\nTEMAS DISPONÍVEIS NO APP (use como referência para os tópicos do cronograma):\n${temasDoApp.join(", ")}`
      : "";

    const livrosTexto = livrosDoApp.length > 0
      ? `\n\nPara "livrosRecomendados", inclua estes títulos que existem no app:\n${livrosDoApp.slice(0, 10).map(l => `- "${l.titulo}" (${l.area})`).join("\n")}`
      : `\n\nPara "livrosRecomendados", sugira 3-5 temas relevantes de ${materia} como se fossem resumos disponíveis.`;

    const prompt = `Você é um especialista em planejamento de estudos para concursos e OAB. Gere um plano SUPER DETALHADO.

INFORMAÇÕES:
- Matéria: ${materia}
- Horas por dia: ${horasPorDia}h
- Dias: ${diasFormatados}
- Duração: ${semanasLimitadas} semanas
- Carga total: ${totalHorasLimitado}h
${conteudoArquivo ? `\nCONTEÚDO BASE:\n${conteudoArquivo.substring(0, 1500)}` : ""}${temasTexto}${livrosTexto}

REGRAS:
1. Crie EXATAMENTE ${semanasLimitadas} semanas com ${diasSemana.length} dias cada
2. Cada dia tem 2-4 tópicos com horários realistas
3. Cada tópico DEVE ter "descricao" (30-50 palavras: o que estudar, como abordar, dicas práticas)
4. Cada tópico DEVE ter "aprofundamento" (60-100 palavras: técnicas específicas, erros comuns, o que focar, exercícios recomendados, como memorizar)
5. Estratégias devem ser detalhadas e práticas
6. Inclua livrosRecomendados com títulos e áreas

JSON:
{
  "objetivo": "Descrição detalhada do objetivo do plano (2-3 frases)",
  "visaoGeral": {
    "cargaTotal": "${totalHorasLimitado}h",
    "duracao": "${semanasLimitadas} semanas",
    "frequencia": "${diasSemana.length} dias/semana",
    "intensidade": "${horasPorDia}h/dia",
    "descricao": "Metodologia detalhada (2-3 frases sobre como o plano foi estruturado)"
  },
  "cronograma": [
    {
      "semana": 1,
      "titulo": "Tema principal da semana",
      "dias": [
        {
          "dia": "${diasSemanaMap[diasSemana[0]]}",
          "cargaHoraria": "${horasPorDia}h",
          "topicos": [
            {
              "horario": "08:00-10:00",
              "titulo": "Nome do tópico",
              "descricao": "Descrição detalhada do que estudar, abordagem recomendada e dicas práticas para este tópico",
              "aprofundamento": "Técnicas específicas de estudo para este tema. Erros comuns a evitar. Pontos que mais caem em provas. Exercícios recomendados. Método de memorização sugerido."
            }
          ]
        }
      ]
    }
  ],
  "materiais": [
    { "tipo": "Livro", "titulo": "Nome do material", "autor": "Autor", "detalhes": "Por que este material é importante" }
  ],
  "estrategias": [
    { "titulo": "Nome da estratégia", "descricao": "Descrição detalhada de como aplicar esta estratégia no dia a dia de estudos" }
  ],
  "checklist": [
    { "semana": 1, "meta": "Meta detalhada para a semana" }
  ],
  "revisaoFinal": {
    "descricao": "Orientações detalhadas para a revisão final",
    "simulado": { "duracao": "${horasPorDia}h", "formato": "Formato detalhado do simulado" }
  },
  "livrosRecomendados": [
    { "titulo": "Nome do tema/livro", "area": "${materia}" }
  ]
}`;

    const aiData = await callGeminiWithFallback({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 65536, responseMimeType: "application/json" }
    });

    const planoTexto = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log("Resposta recebida, tamanho:", planoTexto.length);

    let planoJSON;
    try {
      planoJSON = tryRepairJSON(planoTexto);
      // Garantir livrosRecomendados se não vier da IA
      if (!planoJSON.livrosRecomendados && livrosDoApp.length > 0) {
        planoJSON.livrosRecomendados = livrosDoApp.slice(0, 10);
      }
      console.log("JSON OK. Semanas:", planoJSON.cronograma?.length, "Livros:", planoJSON.livrosRecomendados?.length);
    } catch (parseError) {
      console.error("Erro JSON:", parseError);
      throw new Error("Falha ao processar resposta da IA");
    }

    return new Response(
      JSON.stringify({ plano: planoJSON, totalHoras: totalHorasLimitado, materia }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro gerar-plano-estudos:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
