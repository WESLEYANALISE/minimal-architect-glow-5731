import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPTS: Record<string, (artigo: string, numero: string) => string> = {
  flashcard_conceito: (artigo, numero) => `Você é um professor de Direito. Com base EXCLUSIVAMENTE no artigo abaixo, gere entre 5 e 10 flashcards no formato frente/verso.

Artigo ${numero}:
${artigo}

Retorne APENAS um JSON array com objetos { "front": "pergunta", "back": "resposta" }.
As perguntas devem testar conceitos-chave do artigo. Respostas objetivas e precisas.
Retorne SOMENTE o JSON, sem markdown, sem explicação.`,

  flashcard_lacuna: (artigo, numero) => `Você é um professor de Direito. Com base EXCLUSIVAMENTE no artigo abaixo, gere entre 5 e 8 exercícios de lacunas.

Artigo ${numero}:
${artigo}

Retorne APENAS um JSON array com objetos:
{ "texto_com_lacuna": "frase com _____ no lugar da palavra", "resposta": "palavra correta", "dica": "dica opcional" }

As lacunas devem testar termos jurídicos importantes do artigo.
Retorne SOMENTE o JSON, sem markdown, sem explicação.`,

  flashcard_correspondencia: (artigo, numero) => `Você é um professor de Direito. Com base EXCLUSIVAMENTE no artigo abaixo, gere 5 pares de correspondência (conceito ↔ definição).

Artigo ${numero}:
${artigo}

Retorne APENAS um JSON array com objetos:
{ "conceito": "termo ou instituto", "definicao": "significado ou explicação" }

Os pares devem cobrir os principais conceitos do artigo.
Retorne SOMENTE o JSON, sem markdown, sem explicação.`,

  questao_alternativa: (artigo, numero) => `Você é um professor de Direito especialista em concursos. Com base EXCLUSIVAMENTE no artigo abaixo, gere 5 questões de múltipla escolha.

Artigo ${numero}:
${artigo}

Retorne APENAS um JSON array com objetos:
{ "enunciado": "pergunta", "alternativas": ["a) ...", "b) ...", "c) ...", "d) ..."], "resposta_correta": 0, "explicacao": "fundamentação" }

O campo resposta_correta é o índice (0-3) da alternativa correta.
Questões devem ser no nível de concurso público.
Retorne SOMENTE o JSON, sem markdown, sem explicação.`,

  questao_sim_nao: (artigo, numero) => `Você é um professor de Direito. Com base EXCLUSIVAMENTE no artigo abaixo, gere entre 8 e 12 afirmações para o aluno julgar como CERTO ou ERRADO.

Artigo ${numero}:
${artigo}

Retorne APENAS um JSON array com objetos:
{ "afirmacao": "texto da afirmação", "correta": true/false, "explicacao": "por que é certo ou errado", "exemplo": "exemplo prático curto" }

Misture afirmações corretas e incorretas. Inclua pegadinhas comuns de concurso.
Retorne SOMENTE o JSON, sem markdown, sem explicação.`,

  questao_caso_pratico: (artigo, numero) => `Você é um professor de Direito especialista em concursos. Com base EXCLUSIVAMENTE no artigo abaixo, gere entre 3 e 5 questões de caso prático.

Artigo ${numero}:
${artigo}

Retorne APENAS um JSON array com objetos:
{ "cenario": "narrativa do caso prático (3-5 linhas)", "pergunta": "pergunta sobre o caso", "alternativas": ["a) ...", "b) ...", "c) ...", "d) ..."], "resposta_correta": 0, "fundamentacao": "explicação detalhada" }

Os cenários devem ser realistas e testar a aplicação prática do artigo.
Retorne SOMENTE o JSON, sem markdown, sem explicação.`,
};

async function callGemini(prompt: string, keys: string[]): Promise<any> {
  for (const key of keys) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
          }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) continue;
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error(`Key failed:`, e);
      continue;
    }
  }
  throw new Error("Todas as chaves Gemini falharam");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artigo, numeroArtigo, codigoTabela, tipo } = await req.json();

    if (!artigo || !numeroArtigo || !codigoTabela || !tipo) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios: artigo, numeroArtigo, codigoTabela, tipo" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!PROMPTS[tipo]) {
      return new Response(JSON.stringify({ error: `Tipo inválido: ${tipo}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache
    const { data: cached } = await supabase
      .from("pratica_artigos")
      .select("conteudo")
      .eq("codigo_tabela", codigoTabela)
      .eq("numero_artigo", numeroArtigo)
      .eq("tipo", tipo)
      .maybeSingle();

    if (cached?.conteudo) {
      return new Response(JSON.stringify({ conteudo: cached.conteudo, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate
    const keys = getRotatedKeyStrings();
    const prompt = PROMPTS[tipo](artigo, numeroArtigo);
    const conteudo = await callGemini(prompt, keys);

    // Save to cache
    await supabase.from("pratica_artigos").upsert({
      codigo_tabela: codigoTabela,
      numero_artigo: numeroArtigo,
      tipo,
      conteudo,
    }, { onConflict: "codigo_tabela,numero_artigo,tipo" });

    return new Response(JSON.stringify({ conteudo, fromCache: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
