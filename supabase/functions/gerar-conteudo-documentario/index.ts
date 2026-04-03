import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rotação de chaves Gemini
function getGeminiKey(): string {
  const keys = [
    Deno.env.get("GEMINI_KEY_1"),
    Deno.env.get("GEMINI_KEY_2"),
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    throw new Error("Nenhuma chave Gemini configurada");
  }

  return keys[Math.floor(Math.random() * keys.length)];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentarioId, transcricao, titulo, duracao } = await req.json();

    if (!documentarioId || !transcricao) {
      return new Response(
        JSON.stringify({ error: "documentarioId e transcricao são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiKey = getGeminiKey();
    console.log("Gerando conteúdo para documentário:", documentarioId);

    // Limitar tamanho da transcrição para evitar timeout (max ~15000 chars)
    const transcricaoLimitada = transcricao.length > 15000 
      ? transcricao.substring(0, 15000) + "\n\n[... transcrição truncada para processamento]" 
      : transcricao;

    // Prompt para gerar todo o conteúdo
    const prompt = `Você é um especialista em direito brasileiro e educação jurídica.

Com base na transcrição do documentário jurídico "${titulo}", gere o seguinte conteúdo estruturado em JSON:

TRANSCRIÇÃO:
${transcricaoLimitada}

GERE UM JSON COM A SEGUINTE ESTRUTURA:

{
  "sobre": "Um resumo executivo de 2-3 parágrafos sobre o documentário, destacando o tema central, os principais pontos abordados e a relevância jurídica.",
  
  "analise": "Uma análise detalhada em formato Markdown com as seguintes seções:\\n## 📺 Sobre o Documentário\\n[Resumo do tema]\\n\\n## 📋 Temas Principais\\n[Lista dos temas abordados]\\n\\n## ⚖️ Relevância Jurídica\\n[Importância para o direito]\\n\\n## 🎓 Pontos de Aprendizado\\n[O que pode ser aprendido]\\n\\n## 📝 Conclusão\\n[Síntese final]",
  
  "questoes": [
    {
      "id": "q1",
      "pergunta": "Pergunta sobre o conteúdo do documentário",
      "alternativas": ["A) Opção A", "B) Opção B", "C) Opção C", "D) Opção D"],
      "respostaCorreta": 0,
      "explicacao": "Explicação detalhada da resposta correta"
    }
  ],
  
  "questoes_dinamicas": [
    {
      "id": "qd1",
      "timestamp": 60,
      "pergunta": "Questão relacionada ao trecho do vídeo neste momento",
      "alternativas": ["A) Opção A", "B) Opção B", "C) Opção C", "D) Opção D"],
      "respostaCorreta": 0,
      "explicacao": "Explicação da resposta"
    }
  ]
}

INSTRUÇÕES:
1. Gere exatamente 10 questões para "questoes" (questões gerais sobre todo o documentário)
2. Gere 5-8 questões para "questoes_dinamicas" com timestamps distribuídos ao longo do vídeo
3. Os timestamps devem ser em segundos e representar momentos-chave do documentário
4. As questões dinâmicas devem estar relacionadas ao conteúdo discutido naquele momento específico
5. Todas as questões devem ter 4 alternativas (A, B, C, D)
6. A "respostaCorreta" é o índice da alternativa correta (0, 1, 2 ou 3)
7. A análise deve ser rica e bem formatada em Markdown
8. O "sobre" deve ser conciso mas informativo

RESPONDA APENAS COM O JSON, SEM TEXTO ADICIONAL.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro na API Gemini:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Erro na API Gemini: ${response.status}`);
    }

    const data = await response.json();
    let conteudoTexto = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!conteudoTexto) {
      throw new Error("Resposta vazia da IA");
    }

    // Limpar markdown do JSON
    conteudoTexto = conteudoTexto.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let conteudo;
    try {
      conteudo = JSON.parse(conteudoTexto);
    } catch (parseError) {
      console.error("Erro ao parsear JSON:", conteudoTexto);
      throw new Error("Erro ao processar resposta da IA");
    }

    console.log("Conteúdo gerado com sucesso:", {
      temSobre: !!conteudo.sobre,
      temAnalise: !!conteudo.analise,
      questoes: conteudo.questoes?.length || 0,
      questoesDinamicas: conteudo.questoes_dinamicas?.length || 0
    });

    // Salvar no Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from("documentarios_juridicos")
      .update({
        sobre_texto: conteudo.sobre,
        analise_ia: conteudo.analise,
        questoes: conteudo.questoes,
        questoes_dinamicas: conteudo.questoes_dinamicas,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentarioId);

    if (updateError) {
      console.error("Erro ao salvar conteúdo:", updateError);
      throw new Error("Erro ao salvar conteúdo no banco de dados");
    }

    console.log("Conteúdo salvo com sucesso para:", titulo);

    return new Response(
      JSON.stringify({
        success: true,
        sobre: conteudo.sobre,
        analise: conteudo.analise,
        questoes: conteudo.questoes,
        questoes_dinamicas: conteudo.questoes_dinamicas
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao gerar conteúdo:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
