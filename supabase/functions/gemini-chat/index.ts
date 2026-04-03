import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { getRotatedGeminiKeys } from "../_shared/gemini-keys.ts";

// Pool de chaves API com rotação round-robin
const GEMINI_KEYS = getRotatedGeminiKeys();

// Fire-and-forget: registrar uso de tokens
function registrarTokenUsage(params: Record<string, any>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) return;
  
  fetch(`${supabaseUrl}/functions/v1/registrar-token-usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify(params),
  }).catch(err => console.error('[token-tracker] Erro:', err.message));
}

async function callOpenAIFallback(message: string): Promise<{ text: string; keyIndex: number; usageMetadata: any }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada para fallback');
  
  console.log('[gemini-chat] Usando fallback OpenAI...');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI fallback erro: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return {
    text,
    keyIndex: -1,
    usageMetadata: {
      promptTokenCount: data.usage?.prompt_tokens || 0,
      candidatesTokenCount: data.usage?.completion_tokens || 0,
    },
  };
}

async function callGeminiWithFallback(message: string): Promise<{ text: string; keyIndex: number; usageMetadata: any }> {
  console.log(`[gemini-chat] Iniciando com ${GEMINI_KEYS.length} chaves (rotação round-robin)`);
  
  for (const keyInfo of GEMINI_KEYS) {
    console.log(`[gemini-chat] Tentando ${keyInfo.name}...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${keyInfo.key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4000,
            },
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[gemini-chat] ${keyInfo.name} rate limited, próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gemini-chat] Erro ${keyInfo.name}: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const usageMetadata = data.usageMetadata || {};
      
      if (text) {
        console.log(`[gemini-chat] ✅ Sucesso com ${keyInfo.name}`);
        return { text, keyIndex: keyInfo.index, usageMetadata };
      } else {
        console.log(`[gemini-chat] ${keyInfo.name} resposta vazia`);
        continue;
      }
    } catch (error) {
      console.error(`[gemini-chat] Exceção ${keyInfo.name}:`, error);
      continue;
    }
  }
  
  // Fallback para OpenAI
  console.log('[gemini-chat] Todas as chaves Gemini falharam, tentando OpenAI...');
  return await callOpenAIFallback(message);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensagem é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gemini-chat] Processando mensagem de ${message.length} chars`);
    
    const { text: response, keyIndex, usageMetadata } = await callGeminiWithFallback(message);
    
    // Registrar uso de tokens (fire-and-forget)
    const inputTokens = usageMetadata.promptTokenCount || Math.ceil(message.length / 4);
    const outputTokens = usageMetadata.candidatesTokenCount || Math.ceil(response.length / 4);
    registrarTokenUsage({
      edge_function: 'gemini-chat',
      model: 'gemini-2.5-flash-lite',
      provider: 'gemini',
      tipo_conteudo: 'texto',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      custo_estimado_brl: (inputTokens * 0.0004 + outputTokens * 0.0024) / 1000,
      api_key_index: keyIndex,
      sucesso: true,
      metadata: { prompt_length: message.length, response_length: response.length },
    });
    
    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[gemini-chat] Erro:', error);
    
    // Registrar erro
    registrarTokenUsage({
      edge_function: 'gemini-chat',
      model: 'gemini-2.5-flash-lite',
      provider: 'gemini',
      tipo_conteudo: 'texto',
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
    });
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
