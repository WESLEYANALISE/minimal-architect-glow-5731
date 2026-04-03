import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
            generationConfig: { temperature: 0.8, maxOutputTokens: 2000 },
          }),
        }
      );
      if (response.status === 429 || response.status === 503) continue;
      if (!response.ok) continue;
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        registrarTokenUsage({
          edge_function: 'gerar-forca-gamificacao',
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
    } catch { continue; }
  }
  throw new Error('Todas as chaves API esgotadas');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materia, nivel } = await req.json();
    if (!materia || !nivel) {
      return new Response(JSON.stringify({ error: 'materia e nivel são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Verificar cache primeiro
    const { data: cached } = await supabase
      .from('gamificacao_palavras_cache')
      .select('palavras')
      .eq('materia', materia)
      .eq('nivel', nivel)
      .maybeSingle();

    if (cached?.palavras) {
      console.log(`[cache hit] ${materia} nível ${nivel}`);
      return new Response(JSON.stringify({ palavras: cached.palavras, tema: materia, fromCache: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Sem cache - gerar via Gemini
    const { data: resumos } = await supabase
      .from('RESUMO')
      .select('tema, subtema')
      .ilike('materia', `%${materia.replace('Direito ', '')}%`)
      .limit(100);

    const temas = resumos?.map(r => r.subtema || r.tema).filter(Boolean) || [];
    const temaIndex = Math.min(Math.floor((nivel - 1) / 10), temas.length - 1);
    const temaEscolhido = temas[Math.max(temaIndex, 0)] || materia;

    const prompt = `Você é um professor de ${materia}. Gere exatamente 5 palavras jurídicas relacionadas ao tema "${temaEscolhido}" para um jogo da forca.

REGRAS:
- Palavras devem ter entre 5 e 15 letras
- Apenas letras (sem espaços, hífens ou caracteres especiais)
- Nível de dificuldade: ${nivel <= 30 ? 'fácil' : nivel <= 60 ? 'médio' : 'difícil'}
- Cada palavra deve ter uma dica curta (máximo 8 palavras)

Responda APENAS em JSON válido, sem markdown:
[
  {"palavra": "EXEMPLO", "dica": "Dica curta aqui", "categoria": "${temaEscolhido}"},
  {"palavra": "OUTRA", "dica": "Outra dica", "categoria": "${temaEscolhido}"},
  {"palavra": "MAIS", "dica": "Mais uma dica", "categoria": "${temaEscolhido}"},
  {"palavra": "QUARTA", "dica": "Quarta dica", "categoria": "${temaEscolhido}"},
  {"palavra": "QUINTA", "dica": "Quinta dica", "categoria": "${temaEscolhido}"}
]`;

    const response = await callGeminiWithFallback(prompt);
    
    let palavras;
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      palavras = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
    } catch {
      throw new Error('Erro ao parsear resposta da IA');
    }

    palavras = palavras.map((p: any) => ({
      palavra: p.palavra.toUpperCase().replace(/[^A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/g, ''),
      dica: p.dica,
      categoria: p.categoria || temaEscolhido,
    })).filter((p: any) => p.palavra.length >= 4);

    // 3. Salvar no cache para reutilizar
    if (palavras.length > 0) {
      await supabase
        .from('gamificacao_palavras_cache')
        .upsert({ materia, nivel, palavras }, { onConflict: 'materia,nivel' });
      console.log(`[cache saved] ${materia} nível ${nivel}`);
    }

    return new Response(JSON.stringify({ palavras, tema: temaEscolhido }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[gerar-forca-gamificacao] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
