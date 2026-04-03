import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function registrarTokenUsage(params: Record<string, any>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) return;
  fetch(`${supabaseUrl}/functions/v1/registrar-token-usage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` },
    body: JSON.stringify(params),
  }).catch(err => console.error('[token-tracker] Erro:', err.message));
}

const getApiKeys = () => {
  const keys = [
    Deno.env.get("GEMINI_KEY_1"),
    Deno.env.get("GEMINI_KEY_2"),
  ].filter(Boolean);
  return keys;
};

const sanitizeJsonString = (text: string): string => {
  let cleaned = text.replace(/[\x00-\x1F\x7F]/g, (ch) => {
    if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
    return '';
  });
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  return cleaned;
};

const extractJson = (text: string): any => {
  let jsonText = text.trim();
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  }
  const jsonStart = jsonText.indexOf('{');
  const jsonEnd = jsonText.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonText = jsonText.slice(jsonStart, jsonEnd + 1);
  }
  jsonText = sanitizeJsonString(jsonText);
  return JSON.parse(jsonText);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conteudo, tipo } = await req.json();

    if (!conteudo || conteudo.trim().length < 50) {
      throw new Error("Conteúdo insuficiente para gerar conteúdo");
    }

    if (!tipo || !["flashcards", "questoes"].includes(tipo)) {
      throw new Error("Tipo deve ser 'flashcards' ou 'questoes'");
    }

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      throw new Error("Nenhuma API key configurada");
    }

    const prompt = tipo === "flashcards"
      ? `Você é um professor especializado em direito brasileiro. Com base no conteúdo abaixo, crie EXATAMENTE 20 flashcards educacionais.

Cada flashcard deve ter:
- "front": pergunta clara e objetiva
- "back": resposta completa e didática
- "exemplo": exemplo prático curto ilustrando o conceito

Retorne APENAS um JSON válido no formato:
{"flashcards": [{"front": "...", "back": "...", "exemplo": "..."}]}

Conteúdo:
${conteudo.substring(0, 6000)}`
      : `Você é um professor especializado em criar questões de múltipla escolha sobre direito brasileiro, no estilo OAB e concursos públicos.

Com base no conteúdo abaixo, crie entre 10 e 15 questões objetivas.

Cada questão deve ter:
- "question": enunciado claro
- "options": array com 4 alternativas (prefixadas com "A) ", "B) ", "C) ", "D) ")
- "correctAnswer": índice da resposta correta (0-3)
- "explanation": explicação detalhada da resposta correta

Retorne APENAS um JSON válido no formato:
{"questoes": [{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 0, "explanation": "..."}]}

Conteúdo:
${conteudo.substring(0, 6000)}`;

    let lastError = null;

    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      try {
        console.log(`🔄 Tentando gerar ${tipo}...`);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: tipo === "flashcards" ? 8000 : 6000,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Erro API (${response.status}):`, errorText.substring(0, 200));
          lastError = new Error(`API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Track token usage
        registrarTokenUsage({
          edge_function: 'gerar-conteudo-aula-tab',
          model: 'gemini-2.5-flash-lite',
          provider: 'gemini',
          tipo_conteudo: 'texto',
          input_tokens: data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
          output_tokens: data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4),
          custo_estimado_brl: (((data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4)) * 0.0004 + (data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4)) * 0.0024) / 1000),
          api_key_index: i,
          sucesso: true,
        });

        const parsed = extractJson(text);

        if (tipo === "flashcards") {
          const flashcards = parsed.flashcards || [];
          if (!Array.isArray(flashcards) || flashcards.length === 0) {
            throw new Error("Nenhum flashcard gerado");
          }
          console.log(`✅ ${flashcards.length} flashcards gerados`);
          return new Response(JSON.stringify({ flashcards }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const questoes = parsed.questoes || [];
          if (!Array.isArray(questoes) || questoes.length === 0) {
            throw new Error("Nenhuma questão gerada");
          }
          console.log(`✅ ${questoes.length} questões geradas`);
          return new Response(JSON.stringify({ questoes }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (keyError) {
        console.error("❌ Erro com esta key:", keyError);
        lastError = keyError;
        continue;
      }
    }

    throw lastError || new Error("Todas as tentativas falharam");
  } catch (error) {
    console.error("Erro gerar-conteudo-aula-tab:", error);
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
