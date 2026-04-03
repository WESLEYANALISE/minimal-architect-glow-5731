import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DIREITO_PREMIUM_API_KEY = Deno.env.get("DIREITO_PREMIUM_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, titulo } = await req.json();
    
    console.log("Explicando notícia:", titulo);

    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error("DIREITO_PREMIUM_API_KEY não configurada");
    }

    if (!url) {
      throw new Error("URL da notícia não fornecida");
    }

    // Buscar conteúdo da notícia via web scraping usando Supabase client
    console.log("Buscando conteúdo da notícia...");
    
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: scrapingData, error: scrapingError } = await supabaseClient.functions.invoke(
      'buscar-conteudo-noticia',
      { body: { url } }
    );

    if (scrapingError) {
      console.error("Erro ao buscar conteúdo:", scrapingError);
      throw new Error(`Falha ao buscar conteúdo da notícia: ${scrapingError.message}`);
    }
    
    if (!scrapingData.success || !scrapingData.html) {
      throw new Error("Não foi possível extrair o conteúdo da notícia");
    }

    // Limpar HTML para extrair apenas texto
    const textoLimpo = scrapingData.html
      .replace(/<[^>]*>/g, ' ') // Remove tags HTML
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim()
      .slice(0, 12000); // Limita tamanho para não exceder contexto

    console.log(`Texto extraído: ${textoLimpo.length} caracteres`);

    // Prompt para explicação detalhada
    const prompt = `Você é um especialista jurídico que explica notícias de forma clara e acessível.

NOTÍCIA: ${titulo}

CONTEÚDO COMPLETO:
${textoLimpo}

INSTRUÇÕES:
Analise esta notícia jurídica e crie uma explicação super descomplicada, didática e completa, seguindo esta estrutura:

# 📰 ${titulo}

## 🎯 O que aconteceu?
[Explicação clara e direta do fato principal em 2-3 parágrafos]

## 📋 Pontos Principais
[Liste os pontos-chave da notícia, explicando cada um de forma simples]
- **Ponto 1**: Explicação...
- **Ponto 2**: Explicação...
- **Ponto 3**: Explicação...

## ⚖️ Contexto Jurídico
[Explique o contexto legal, leis envolvidas, precedentes se houver]

## 🔍 O que isso significa na prática?
[Explique as implicações práticas, quem é afetado, como funciona]

## 💡 Possíveis Impactos
[Analise os impactos e consequências]
- **Para cidadãos**: ...
- **Para profissionais**: ...
- **Para o sistema jurídico**: ...

## 📌 Conclusão
[Resumo final claro do que a pessoa precisa entender]

IMPORTANTE:
- Use linguagem simples e acessível
- Explique termos técnicos quando necessário
- Seja objetivo mas completo
- Use emojis profissionais para destacar seções
- Formate em Markdown com negrito, listas e destaques`;

    console.log("Gerando explicação com Gemini...");

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2500,
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro ao gerar explicação:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de uso atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione créditos para continuar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Falha ao gerar explicação com IA");
    }

    const aiData = await aiResponse.json();
    const explicacao = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log("Explicação gerada com sucesso");

    return new Response(
      JSON.stringify({
        explicacao,
        tokens_usados: aiData.usage?.total_tokens || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função explicar-noticia:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido ao explicar notícia",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
