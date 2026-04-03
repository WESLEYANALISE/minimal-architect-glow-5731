import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_API_KEY'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
].filter(Boolean) as string[];

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function callGemini(prompt: string, systemInstruction: string): Promise<string> {
  const key = GEMINI_KEYS[Math.floor(Math.random() * GEMINI_KEYS.length)];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { cacheId, tipo, transcricao, artigo, numeroArtigo, area } = await req.json();

    if (!transcricao && !artigo) {
      return new Response(JSON.stringify({ error: 'transcricao ou artigo obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const conteudoBase = transcricao || artigo;

    let result: any = null;

    if (tipo === 'resumo') {
      const text = await callGemini(
        `Transcrição da videoaula sobre o Art. ${numeroArtigo} de ${area}:\n\n${conteudoBase}`,
        `Você é um professor de Direito especialista. Crie um RESUMO COMPLETO e DIDÁTICO da videoaula baseado na transcrição fornecida.

Estruture com:
## 📋 Visão Geral
Breve introdução do que a aula aborda.

## 📖 Pontos Principais
Explique cada ponto abordado na aula de forma clara e objetiva, usando subtítulos (###) para cada tópico.

## ⚖️ Conexão com a Lei
Relacione o conteúdo da aula com o texto legal do artigo.

## 💡 Dicas Importantes
Destaque pontos-chave mencionados pelo professor.

## 📝 Conclusão
Resumo final dos aprendizados.

Use emojis temáticos. Parágrafos curtos. Linguagem acessível mas precisa. NÃO invente informações que não estejam na transcrição.`
      );
      result = text;

      if (cacheId) {
        await supabase.from('videoaulas_artigos_cache')
          .update({ resumo: text, updated_at: new Date().toISOString() })
          .eq('id', cacheId);
      }
    } else if (tipo === 'flashcards') {
      const text = await callGemini(
        `Conteúdo da videoaula sobre Art. ${numeroArtigo} de ${area}:\n\n${conteudoBase}`,
        `Gere exatamente 8 flashcards baseados no conteúdo da videoaula. Retorne APENAS um JSON array sem markdown:
[{"front": "pergunta", "back": "resposta"}]
As perguntas devem testar o conhecimento dos pontos abordados na aula. Respostas concisas e precisas.`
      );
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const flashcards = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      result = flashcards;

      if (cacheId) {
        await supabase.from('videoaulas_artigos_cache')
          .update({ flashcards, updated_at: new Date().toISOString() })
          .eq('id', cacheId);
      }
    } else if (tipo === 'questoes') {
      const text = await callGemini(
        `Conteúdo da videoaula sobre Art. ${numeroArtigo} de ${area}:\n\n${conteudoBase}`,
        `Gere exatamente 5 questões de múltipla escolha baseadas no conteúdo da videoaula. Retorne APENAS um JSON array sem markdown:
[{"pergunta": "...", "alternativas": ["A", "B", "C", "D"], "resposta_correta": 0, "explicacao": "..."}]
resposta_correta é o índice (0-3). Questões devem testar compreensão real do conteúdo.`
      );
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const questoes = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      result = questoes;

      if (cacheId) {
        await supabase.from('videoaulas_artigos_cache')
          .update({ questoes, updated_at: new Date().toISOString() })
          .eq('id', cacheId);
      }
    }

    return new Response(JSON.stringify({ conteudo: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[gerar-conteudo-videoaula] Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
