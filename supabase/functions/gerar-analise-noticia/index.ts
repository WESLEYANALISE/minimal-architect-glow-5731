import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean);

async function callGeminiWithFallback(prompt: string): Promise<string> {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const apiKey = GEMINI_KEYS[i];
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        registrarTokenUsage({
          edge_function: 'gerar-analise-noticia',
          model: 'gemini-2.5-flash-lite',
          provider: 'gemini',
          tipo_conteudo: 'texto',
          input_tokens: data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
          output_tokens: data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4),
          custo_estimado_brl: (((data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4)) * 0.0004 + (data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4)) * 0.0024) / 1000),
          api_key_index: i,
          sucesso: true,
        });
        return text;
      }
      
      if (response.status === 429 || response.status === 503) {
        console.log(`API key rate limited, trying next...`);
        continue;
      }
    } catch (error) {
      console.error('Gemini API error:', error);
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { titulo, url } = await req.json();

    if (!titulo) {
      throw new Error('Título não fornecido');
    }

    console.log('Gerando análise para:', titulo);

    const prompt = `Você é um analista político brasileiro. Analise a notícia e responda em JSON:

TÍTULO: ${titulo}
URL: ${url || 'não disponível'}

RESPONDA EXATAMENTE NESTE FORMATO JSON:
{
  "resumoExecutivo": "Análise técnica em 3-4 frases SEM Markdown. Contexto político, envolvidos e implicações de forma clara.",
  "resumoFacil": "Explicação em 2-3 frases BEM SIMPLES, sem Markdown. O que aconteceu? Por que eu deveria me importar? Como isso afeta minha vida?",
  "pontosPrincipais": ["ponto 1", "ponto 2", "ponto 3", "ponto 4"],
  "termos": [
    {"termo": "Termo técnico/político", "significado": "Explicação simples do termo"}
  ]
}

IMPORTANTE:
- NÃO use asteriscos (**), hífens (-) ou qualquer formatação Markdown
- resumoFacil deve ser BEM SIMPLES, para leigos, explicando "por que eu deveria me importar com isso?"
- termos deve incluir TODOS os termos políticos, jurídicos ou técnicos da notícia
- Retorne APENAS o JSON, sem texto adicional`;

    const resposta = await callGeminiWithFallback(prompt);
    
    // Extrair JSON da resposta
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    let analiseData = {
      resumoExecutivo: '',
      resumoFacil: '',
      pontosPrincipais: [] as string[],
      termos: [] as Array<{termo: string; significado: string}>
    };
    
    if (jsonMatch) {
      try {
        analiseData = JSON.parse(jsonMatch[0]);
      } catch {
        // Se falhar o parse, usar texto bruto
        analiseData.resumoExecutivo = resposta;
      }
    } else {
      analiseData.resumoExecutivo = resposta;
    }

    console.log('Análise gerada com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        ...analiseData,
        titulo
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Erro ao gerar análise:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
