import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
            generationConfig: { temperature: 0.8, maxOutputTokens: 4000 },
          }),
        }
      );
      if (response.status === 429 || response.status === 503) continue;
      if (!response.ok) continue;
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
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

    // 1. Verificar cache
    const { data: cached } = await supabase
      .from('gamificacao_sim_nao_cache')
      .select('perguntas')
      .eq('materia', materia)
      .eq('nivel', nivel)
      .maybeSingle();

    if (cached?.perguntas) {
      console.log(`[cache hit] sim-nao ${materia} nível ${nivel}`);
      return new Response(JSON.stringify({ perguntas: cached.perguntas, tema: materia, fromCache: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Buscar temas na tabela RESUMO
    const { data: resumos } = await supabase
      .from('RESUMO')
      .select('tema, subtema')
      .ilike('materia', `%${materia.replace('Direito ', '')}%`)
      .limit(100);

    const temas = resumos?.map(r => r.subtema || r.tema).filter(Boolean) || [];
    const temaIndex = Math.min(Math.floor((nivel - 1) / 10), temas.length - 1);
    const temaEscolhido = temas[Math.max(temaIndex, 0)] || materia;

    const dificuldade = nivel <= 30 ? 'fácil (conceitos básicos)' : nivel <= 60 ? 'médio (detalhes e exceções)' : 'difícil (jurisprudência e doutrina)';

    const prompt = `Você é um professor de ${materia}. Gere exatamente 10 afirmações jurídicas de VERDADEIRO ou FALSO sobre o tema "${temaEscolhido}".

REGRAS:
- Misture afirmações verdadeiras e falsas (aproximadamente 50/50)
- Nível de dificuldade: ${dificuldade}
- Cada afirmação deve ser clara e objetiva (1-2 frases)
- A explicação deve ser curta (1-2 frases) justificando a resposta
- 60% fácil, 40% médio
- Inclua referências a artigos de lei quando possível

Responda APENAS em JSON válido, sem markdown:
[
  {"afirmacao": "O habeas corpus pode ser impetrado por qualquer pessoa.", "resposta": true, "explicacao": "Sim, qualquer pessoa pode impetrar habeas corpus em seu favor ou de outrem, conforme art. 654 do CPP.", "categoria": "${temaEscolhido}"},
  {"afirmacao": "...", "resposta": false, "explicacao": "...", "categoria": "${temaEscolhido}"}
]`;

    const response = await callGeminiWithFallback(prompt);

    let perguntas;
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      perguntas = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
    } catch {
      throw new Error('Erro ao parsear resposta da IA');
    }

    // Validar e limpar
    perguntas = perguntas
      .filter((p: any) => p.afirmacao && typeof p.resposta === 'boolean' && p.explicacao)
      .map((p: any) => ({
        afirmacao: p.afirmacao.trim(),
        resposta: p.resposta,
        explicacao: p.explicacao.trim(),
        categoria: p.categoria || temaEscolhido,
      }));

    // 3. Salvar no cache
    if (perguntas.length > 0) {
      await supabase
        .from('gamificacao_sim_nao_cache')
        .upsert({ materia, nivel, perguntas }, { onConflict: 'materia,nivel' });
      console.log(`[cache saved] sim-nao ${materia} nível ${nivel}`);
    }

    return new Response(JSON.stringify({ perguntas, tema: temaEscolhido }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[gerar-sim-nao-gamificacao] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
