import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, descricao, temasDisponiveis } = await req.json();

    if (!area || !descricao || !temasDisponiveis?.length) {
      return new Response(
        JSON.stringify({ error: 'area, descricao e temasDisponiveis são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const temasListStr = temasDisponiveis.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n');

    const prompt = `Você é uma professora de Direito especialista em concursos. O aluno quer criar um deck de flashcards de lacunas para estudar.

Área: ${area}
Objetivo do aluno: "${descricao}"

Temas disponíveis:
${temasListStr}

Sua tarefa:
1. Selecione os temas mais relevantes para o objetivo descrito pelo aluno
2. Crie um nome curto e descritivo para o deck (máx 40 chars)
3. Escreva um feedback explicativo em 2-3 frases explicando por que escolheu esses temas

Responda APENAS em JSON válido, sem markdown:
{
  "nome": "Nome do Deck",
  "temas": ["Tema 1", "Tema 2"],
  "feedback": "Explicação sobre a seleção..."
}

IMPORTANTE: Os nomes dos temas na lista "temas" devem ser EXATAMENTE iguais aos nomes listados acima. Selecione entre 3 e 10 temas relevantes.`;

    const keys = getRotatedKeyStrings();
    let result = null;

    for (const key of keys) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
            }),
          }
        );

        if (response.status === 429 || response.status === 503) continue;
        if (!response.ok) continue;

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          result = text;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Todas as chaves falharam' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: 'Resposta inválida da IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate temas exist in available list
    const temasValidos = (parsed.temas || []).filter((t: string) =>
      temasDisponiveis.some((td: string) => td.toLowerCase().trim() === t.toLowerCase().trim())
    );

    // Map back to original casing
    const temasFinais = temasValidos.map((t: string) =>
      temasDisponiveis.find((td: string) => td.toLowerCase().trim() === t.toLowerCase().trim()) || t
    );

    return new Response(
      JSON.stringify({
        nome: parsed.nome || `Deck ${area}`,
        temas: temasFinais,
        feedback: parsed.feedback || 'Deck criado com sucesso!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[gerar-deck-ia] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
