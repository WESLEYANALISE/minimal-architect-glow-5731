import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const REVISION = "v3.0.0-dica";
const MODEL = "gemini-2.5-flash-lite";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com 4 chaves API
async function chamarGeminiComFallback(prompt: string): Promise<string> {
  const API_KEYS = [
    { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
    { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
    { name: 'DIREITO_PREMIUM_API_KEY', key: Deno.env.get('DIREITO_PREMIUM_API_KEY') }
  ].filter(k => k.key);

  if (API_KEYS.length === 0) {
    throw new Error('Nenhuma API key configurada');
  }

  console.log(`🔑 ${API_KEYS.length} chaves API disponíveis`);

  for (const { name, key } of API_KEYS) {
    try {
      console.log(`📝 Tentando ${name}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        console.log(`✅ Sucesso com ${name}`);
        return result;
      }
      
      const errorText = await response.text();
      
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
        console.log(`⚠️ Quota excedida em ${name}, tentando próxima...`);
        continue;
      }
      
      console.error(`❌ Erro ${response.status} em ${name}: ${errorText.substring(0, 200)}`);
      continue;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Exceção em ${name}: ${msg}`);
      continue;
    }
  }
  
  throw new Error(`Todas as ${API_KEYS.length} chaves API falharam`);
}

serve(async (req) => {
  console.log(`📍 Function: gerar-base-legal@${REVISION} (modo DICA) | Model: ${MODEL}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flashcard_id, pergunta, resposta, tabela, area } = await req.json();

    if (!flashcard_id || !pergunta || !resposta) {
      throw new Error('flashcard_id, pergunta e resposta são obrigatórios');
    }

    const tabelaDestino = tabela === 'artigos-lei' ? 'FLASHCARDS - ARTIGOS LEI' : 'FLASHCARDS_GERADOS';

    console.log(`[gerar-dica] Gerando dica de memorização para flashcard ${flashcard_id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe dica salva
    const { data: flashcard } = await supabase
      .from(tabelaDestino)
      .select('base_legal')
      .eq('id', flashcard_id)
      .single();

    if (flashcard?.base_legal) {
      console.log(`[gerar-dica] Dica já existe, retornando cache`);
      return new Response(
        JSON.stringify({ base_legal: flashcard.base_legal, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar dica de memorização com Gemini
    console.log(`[gerar-dica] Gerando dica com Gemini...`);

    const prompt = `Você é um especialista em técnicas de memorização e estudo para concursos e provas jurídicas.

Com base na pergunta e resposta abaixo de um flashcard, crie UMA dica curta e prática de memorização.

PERGUNTA: ${pergunta}

RESPOSTA: ${resposta}
${area ? `\nÁREA: ${area}` : ''}

Regras:
- Use técnicas como: mnemônicos (siglas, acrônimos), associações visuais, analogias do dia a dia, rimas, pontos-chave diferenciadores
- Seja CURTO e DIRETO (máximo 2-3 frases)
- A dica deve ser realmente útil para fixar o conteúdo na memória
- NÃO repita a resposta, crie algo NOVO que ajude a lembrar dela
- Use emojis quando apropriado para tornar mais visual

Exemplos de boas dicas:
- "🧠 LIMPE = Legalidade, Impessoalidade, Moralidade, Publicidade, Eficiência"
- "⚡ Roubo = Furto + Violência. Sem violência? É furto!"
- "📅 Prazo de 5 dias úteis — mesmo da contestação no JEC"

Responda APENAS com a dica, sem introdução ou explicação adicional.`;

    const dica = await chamarGeminiComFallback(prompt);

    if (!dica) {
      throw new Error('Nenhuma dica gerada');
    }

    console.log(`[gerar-dica] Dica gerada: ${dica.substring(0, 100)}...`);

    const { error: updateError } = await supabase
      .from(tabelaDestino)
      .update({ base_legal: dica })
      .eq('id', flashcard_id);

    if (updateError) {
      console.error(`[gerar-dica] Erro ao salvar:`, updateError);
    } else {
      console.log(`[gerar-dica] Dica salva no banco`);
    }

    return new Response(
      JSON.stringify({ base_legal: dica, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[gerar-dica] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});