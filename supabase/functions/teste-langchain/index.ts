import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema } = await req.json();
    if (!tema) {
      return new Response(JSON.stringify({ error: 'Tema é obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const apiKey = Deno.env.get('GEMINI_KEY_1');
    if (!apiKey) throw new Error('GEMINI_KEY_1 não configurada');

    const callGemini = async (prompt: string) => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    };

    // Chain 1: Resumo
    const resumo = await callGemini(
      `Você é um professor de Direito. Faça um resumo didático e completo sobre o tema jurídico "${tema}" em até 300 palavras. Use linguagem clara e acessível.`
    );

    // Chain 2: Flashcards baseados no resumo
    const flashcardsRaw = await callGemini(
      `Com base neste resumo sobre "${tema}":\n\n${resumo}\n\nCrie exatamente 3 flashcards no formato JSON array. Cada flashcard deve ter "frente" (pergunta) e "verso" (resposta). Retorne APENAS o JSON array, sem markdown.`
    );

    let flashcards = [];
    try {
      const match = flashcardsRaw.match(/\[[\s\S]*\]/);
      if (match) flashcards = JSON.parse(match[0]);
    } catch { flashcards = [{ frente: 'Erro ao gerar', verso: flashcardsRaw }]; }

    // Chain 3: Questão baseada no resumo
    const questaoRaw = await callGemini(
      `Com base neste resumo sobre "${tema}":\n\n${resumo}\n\nCrie 1 questão de múltipla escolha (A, B, C, D) no formato JSON com campos: "enunciado", "alternativas" (objeto com A/B/C/D), "resposta_correta" (letra), "explicacao". Retorne APENAS o JSON, sem markdown.`
    );

    let questao = {};
    try {
      const match = questaoRaw.match(/\{[\s\S]*\}/);
      if (match) questao = JSON.parse(match[0]);
    } catch { questao = { enunciado: questaoRaw, alternativas: {}, resposta_correta: '', explicacao: '' }; }

    return new Response(JSON.stringify({ resumo, flashcards, questao }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
