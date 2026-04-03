import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function converterUrlDrive(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  return url;
}

function normalizarResposta(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const resposta = valor.trim().toUpperCase();
  if (["A", "B", "C", "D", "E", "ANULADA"].includes(resposta)) return resposta;
  return null;
}

function extrairRespostasViaRegex(markdown: string, totalEsperado: number): Array<{ numero: number; resposta: string }> {
  const limiteMaximo = Math.max(totalEsperado, 300);
  const regex = /(?:^|[|\s])(\d{1,3})(?:\s*[|:\-]\s*|\s+)(ANULADA|[ABCDE])(?=$|[|\s])/gim;
  const mapa = new Map<number, string>();

  for (const match of markdown.matchAll(regex)) {
    const numero = Number(match[1]);
    const resposta = normalizarResposta(match[2]);

    if (!Number.isFinite(numero) || numero < 1 || numero > limiteMaximo || !resposta) continue;
    if (!mapa.has(numero)) {
      mapa.set(numero, resposta);
    }
  }

  return Array.from(mapa.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([numero, resposta]) => ({ numero, resposta }));
}

function extractJsonFromResponse(rawText: string): any {
  const stripCodeFences = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = stripCodeFences.indexOf("{");
  const lastBrace = stripCodeFences.lastIndexOf("}");
  let candidate =
    firstBrace >= 0 && lastBrace > firstBrace
      ? stripCodeFences.slice(firstBrace, lastBrace + 1)
      : stripCodeFences;

  candidate = candidate
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/,\s*([}\]])/g, "$1");

  const attempts = [
    candidate,
    candidate.replace(/\\(?!["\\/bfnrtu])/g, "\\\\"),
    candidate
      .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
      .replace(/,\s*([}\]])/g, "$1"),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`JSON inválido retornado pelo Gemini: ${String(lastError)}`);
}

async function chamarGeminiComFallback(prompt: string, keys: string[]) {
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];

  const chamarGemini = async (
    model: string,
    key: string,
    maxOutputTokens: number,
    promptText: string,
  ) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(90000),
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("Resposta vazia do Gemini");
    }

    return { text, finishReason: result?.candidates?.[0]?.finishReason };
  };

  const repararJsonInvalido = async (jsonInvalido: string, model: string, key: string) => {
    const repairPrompt = `Corrija o JSON abaixo para ficar 100% válido, SEM inventar dados novos.
Se houver item incompleto/truncado, remova esse item parcial.
Retorne APENAS JSON válido, sem markdown e sem explicações.

JSON:
${jsonInvalido}`;

    const { text: repairedText } = await chamarGemini(model, key, 6144, repairPrompt);
    return extractJsonFromResponse(repairedText);
  };

  for (const [keyIndex, key] of keys.entries()) {
    for (const model of models) {
      try {
        console.log(`Tentando ${model} com key index ${keyIndex + 1}...`);
        const { text, finishReason } = await chamarGemini(model, key, 16384, prompt);

        try {
          return extractJsonFromResponse(text);
        } catch (parseError) {
          console.error(`JSON inválido ${model} key${keyIndex + 1}:`, parseError);
          if (finishReason === "MAX_TOKENS") {
            console.error(`Resposta truncada por MAX_TOKENS em ${model} key${keyIndex + 1}`);
          }

          try {
            console.log(`Tentando reparar JSON ${model} key${keyIndex + 1}...`);
            return await repararJsonInvalido(text, model, key);
          } catch (repairError) {
            console.error(`Falha ao reparar JSON ${model} key${keyIndex + 1}:`, repairError);
            continue;
          }
        }
      } catch (e) {
        console.error(`Erro ${model} key${keyIndex + 1}:`, e);
        continue;
      }
    }
  }

  throw new Error("Falha em todos os modelos Gemini");
}

async function baixarPdf(url: string): Promise<Uint8Array> {
  const downloadUrl = converterUrlDrive(url);
  let response = await fetch(downloadUrl, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Falha ao baixar PDF: ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const html = await response.text();
    const confirmMatch = html.match(/href="(\/uc\?export=download[^"]+)"/);
    if (confirmMatch) {
      const confirmUrl = `https://drive.google.com${confirmMatch[1].replace(/&amp;/g, '&')}`;
      response = await fetch(confirmUrl, { redirect: 'follow' });
    } else throw new Error("Link de download não encontrado");
  }
  const buffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 5));
  if (!pdfHeader.startsWith('%PDF')) throw new Error("Arquivo não é um PDF válido");
  return uint8Array;
}

async function stageOcr(body: any) {
  const { pdf_base64, pdf_url } = body;
  if (!pdf_base64 && !pdf_url) throw new Error("Envie pdf_base64 ou pdf_url");

  let pdfBytes: Uint8Array;
  if (pdf_url) {
    pdfBytes = await baixarPdf(pdf_url);
  } else {
    const binaryStr = atob(pdf_base64);
    pdfBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) pdfBytes[i] = binaryStr.charCodeAt(i);
  }

  const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
  if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY não configurada");

  const pdfBase64 = bytesToBase64(pdfBytes);
  console.log(`PDF base64: ${pdfBase64.length} chars. Chamando Mistral OCR...`);

  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: { type: "document_url", document_url: `data:application/pdf;base64,${pdfBase64}` },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro Mistral OCR: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  let markdown = '';
  if (result.pages) {
    for (const page of result.pages) {
      if (page.markdown) markdown += page.markdown + '\n\n';
    }
  }
  console.log(`OCR concluído: ${markdown.length} chars`);
  return { sucesso: true, markdown, total_chars: markdown.length };
}

async function stageGemini(body: any) {
  const { markdown, extract_metadata = true } = body;
  if (!markdown) throw new Error("Envie o markdown extraído");

  if (keys.length === 0) throw new Error("Nenhuma GEMINI_KEY configurada");

  // Não truncar - o frontend já divide em chunks menores
  const contentMarkdown = markdown;

  const prompt = extract_metadata
    ? `Você é um especialista em concursos públicos. Analise o conteúdo abaixo (trecho extraído de uma prova de concurso em PDF) e retorne SOMENTE JSON válido no formato:

{
  "metadados": {
    "nome": "Nome do concurso",
    "cargo": "Cargo",
    "banca": "Banca",
    "ano": 2024,
    "orgao": "Órgão"
  },
  "questoes": [
    {
      "numero": 1,
      "texto_base": "Texto de apoio/leitura que precede as questões (pode ser compartilhado por várias questões). Se não houver texto de apoio, use null.",
      "enunciado": "Apenas o enunciado da questão, SEM o texto de apoio e SEM as alternativas",
      "alternativa_a": "Texto da alternativa A SEM o prefixo (A)",
      "alternativa_b": "Texto da alternativa B SEM o prefixo (B)",
      "alternativa_c": "Texto da alternativa C SEM o prefixo (C)",
      "alternativa_d": "Texto da alternativa D SEM o prefixo (D)",
      "alternativa_e": "Texto da alternativa E SEM o prefixo (E) ou null",
      "gabarito": "A ou null",
      "materia": "Nome SIMPLES da matéria (ex: Língua Portuguesa, Direito Administrativo, Informática, Raciocínio Lógico). NÃO inclua leis, artigos ou detalhes específicos.",
      "tem_imagem": false
    }
  ]
}

REGRAS IMPORTANTES:
1. Extraia ABSOLUTAMENTE TODAS as questões presentes no trecho, sem pular nenhuma. Cada questão numerada deve aparecer no resultado.
2. O campo "texto_base" deve conter o texto de leitura/apoio que precede as questões (ex: textos de interpretação de Língua Portuguesa). Se várias questões compartilham o mesmo texto, repita-o em cada uma. INCLUA o texto completo, não resuma.
3. O "enunciado" deve conter APENAS a pergunta, sem o texto de apoio e sem as alternativas
4. As alternativas devem estar LIMPAS: sem prefixos como "(A)", "(B)", "(C)", "(D)", "(E)" no início
5. Use null quando faltar informação
6. "tem_imagem": true se a questão referencia uma figura, imagem, gráfico, tabela visual ou mapa que NÃO pode ser representado como texto. false caso contrário.
7. Se uma questão aparecer parcialmente (cortada no início ou fim do trecho), extraia-a mesmo assim com o que estiver disponível.
8. Retorne APENAS JSON válido

CONTEÚDO:
${contentMarkdown}`
    : `Você é um especialista em concursos públicos. Analise o conteúdo abaixo e retorne SOMENTE JSON válido no formato:

{
  "questoes": [
    {
      "numero": 1,
      "texto_base": "Texto de apoio/leitura completo ou null",
      "enunciado": "Apenas o enunciado, SEM alternativas",
      "alternativa_a": "Texto SEM prefixo (A)",
      "alternativa_b": "Texto SEM prefixo (B)",
      "alternativa_c": "Texto SEM prefixo (C)",
      "alternativa_d": "Texto SEM prefixo (D)",
      "alternativa_e": "Texto SEM prefixo (E) ou null",
      "gabarito": "A ou null",
      "materia": "Nome simples da matéria (sem leis ou detalhes)",
      "tem_imagem": false
    }
  ]
}

REGRAS: Extraia ABSOLUTAMENTE TODAS as questões, sem pular nenhuma. Separe texto_base (texto de leitura COMPLETO) do enunciado. Remova prefixos das alternativas. "tem_imagem": true se a questão referencia figura/gráfico/mapa/tabela visual. Se uma questão aparece parcialmente cortada, extraia mesmo assim. Retorne APENAS JSON.

CONTEÚDO:
${contentMarkdown}`;

  const dados = await chamarGeminiComFallback(prompt, keys);
  const questoes = Array.isArray(dados?.questoes) ? dados.questoes : [];
  const metadados = extract_metadata && dados?.metadados ? dados.metadados : null;

  return {
    sucesso: true,
    metadados,
    total_questoes: questoes.length,
    questoes,
  };
}

async function stageGabarito(body: any) {
  const { simulado_id, pdf_base64, pdf_url } = body;
  if (!simulado_id) throw new Error("simulado_id é obrigatório");
  if (!pdf_base64 && !pdf_url) throw new Error("PDF do gabarito é obrigatório");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // OCR the gabarito
  const ocrResult = await stageOcr({ pdf_base64, pdf_url });
  const markdown = ocrResult.markdown;
  if (!markdown?.trim()) throw new Error("OCR não extraiu texto do gabarito");

  // Extract answers with Gemini
  if (keys.length === 0) throw new Error("Nenhuma GEMINI_KEY configurada");

  // Count total questions to validate extraction
  const { data: simuladoMeta, error: errMeta } = await supabase
    .from("simulados_concursos")
    .select("id, total_questoes")
    .eq("id", simulado_id)
    .maybeSingle();

  if (errMeta) throw new Error(`Erro ao buscar simulado: ${errMeta.message}`);

  const { data: questoes, error: errQ } = await supabase
    .from("simulados_questoes")
    .select("id, numero")
    .eq("simulado_id", simulado_id)
    .order("numero");

  if (errQ) throw new Error(`Erro ao buscar questões: ${errQ.message}`);
  if (!questoes?.length) throw new Error("Nenhuma questão encontrada para este simulado");

  const totalQuestoesSimulado = Number(simuladoMeta?.total_questoes);
  const totalQuestoes = Number.isFinite(totalQuestoesSimulado) && totalQuestoesSimulado > 0
    ? totalQuestoesSimulado
    : questoes.length;
  console.log(`Total de questões (meta): ${totalQuestoes} | cadastradas: ${questoes.length}`);

  const prompt = `Analise este gabarito oficial de concurso público e extraia ABSOLUTAMENTE TODAS as respostas corretas.
O formato pode ser tabela, lista, grade, colunas, etc. O gabarito contém respostas para ${totalQuestoes} questões.

REGRAS:
1. Extraia TODAS as ${totalQuestoes} questões, de 1 até ${totalQuestoes}. NÃO pule nenhuma.
2. A resposta deve ser apenas a LETRA (A, B, C, D, E) ou "ANULADA" se a questão foi anulada/nula.
3. Preste atenção em gabaritos em múltiplas colunas ou tabelas — leia TODAS as colunas.
4. Se o gabarito tiver versões (tipo 1, tipo 2, etc), extraia a PRIMEIRA versão/tipo disponível.

Texto do gabarito (OCR):
${markdown}

Retorne APENAS JSON válido:
{"respostas": [{"numero": 1, "resposta": "A"}, {"numero": 2, "resposta": "C"}, ... até a questão ${totalQuestoes}]}

ATENÇÃO: São ${totalQuestoes} questões. Extraia TODAS, sem exceção.`;

  const dados = await chamarGeminiComFallback(prompt, keys);
  const respostasGemini = Array.isArray(dados?.respostas) ? dados.respostas : [];
  const respostasRegex = extrairRespostasViaRegex(markdown, totalQuestoes);

  console.log(`Gemini retornou ${respostasGemini.length} respostas`);
  console.log(`Regex OCR detectou ${respostasRegex.length} pares número-resposta`);

  const respostasMap = new Map<number, string>();

  for (const resp of respostasGemini) {
    const numero = Number(resp?.numero);
    const resposta = normalizarResposta(resp?.resposta);
    if (!Number.isFinite(numero) || numero < 1 || numero > totalQuestoes || !resposta) continue;
    if (!respostasMap.has(numero)) {
      respostasMap.set(numero, resposta);
    }
  }

  // OCR regex tem prioridade para manter aderência ao texto identificado
  for (const resp of respostasRegex) {
    if (resp.numero >= 1 && resp.numero <= totalQuestoes) {
      respostasMap.set(resp.numero, resp.resposta);
    }
  }

  const respostasConsolidadas = Array.from(respostasMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([numero, resposta]) => ({ numero, resposta }));

  if (respostasConsolidadas.length === 0) {
    throw new Error("Nenhuma resposta encontrada no gabarito");
  }

  const faltantesExtracao: number[] = [];
  for (let i = 1; i <= totalQuestoes; i++) {
    if (!respostasMap.has(i)) faltantesExtracao.push(i);
  }

  if (faltantesExtracao.length > 0) {
    const preview = faltantesExtracao.slice(0, 20).join(", ");
    console.warn(`Extração parcial do gabarito: faltam ${faltantesExtracao.length} questão(ões). Números: ${preview}${faltantesExtracao.length > 20 ? ", ..." : ""}`);
  }

  console.log(`Extraídas ${respostasConsolidadas.length} de ${totalQuestoes} respostas esperadas`);

  // Update each question
  const questoesPorNumero = new Map<number, { id: string; numero: number }>();
  for (const q of questoes) {
    questoesPorNumero.set(Number(q.numero), q);
  }

  let atualizadas = 0;
  const semQuestaoCadastrada: number[] = [];

  for (const resp of respostasConsolidadas) {
    const questao = questoesPorNumero.get(resp.numero);
    if (!questao) {
      semQuestaoCadastrada.push(resp.numero);
      continue;
    }

    const gabarito = resp.resposta === "ANULADA" ? "ANULADA" : resp.resposta;
    const { error: errUpdate } = await supabase
      .from("simulados_questoes")
      .update({ gabarito })
      .eq("id", questao.id);

    if (!errUpdate) atualizadas++;
  }

  // Update url_gabarito
  if (pdf_url) {
    await supabase
      .from("simulados_concursos")
      .update({ url_gabarito: pdf_url })
      .eq("id", simulado_id);
  }

  console.log(`Gabarito aplicado: ${atualizadas} questões atualizadas | sem cadastro: ${semQuestaoCadastrada.length}`);

  return {
    sucesso: true,
    total_respostas_extraidas: respostasConsolidadas.length,
    total_questoes_esperadas: totalQuestoes,
    questoes_atualizadas: atualizadas,
    questoes_sem_cadastro: semQuestaoCadastrada.length,
    numeros_sem_cadastro: semQuestaoCadastrada,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { stage } = body;

    let result;
    if (stage === "ocr") {
      result = await stageOcr(body);
    } else if (stage === "gemini") {
      result = await stageGemini(body);
    } else if (stage === "gabarito") {
      result = await stageGabarito(body);
    } else {
      return new Response(JSON.stringify({ error: "Parâmetro 'stage' obrigatório: 'ocr', 'gemini' ou 'gabarito'" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
