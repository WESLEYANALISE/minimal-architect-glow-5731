import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function limparAlternativa(texto: string | null): string | null {
  if (!texto) return null;
  return texto.replace(/^\s*\([A-Ea-e]\)\s*/, '').trim();
}

// Use Gemini to get salary info for the cargo
async function buscarSalario(cargo: string): Promise<{ inicial: string | null; maximo: string | null }> {
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey || !cargo) return { inicial: null, maximo: null };

    const prompt = `Para o cargo público "${cargo}" no Brasil, informe o salário inicial e o salário máximo (com benefícios) atualizados. 
Responda APENAS no formato JSON: {"inicial": "R$ X.XXX,XX", "maximo": "R$ X.XXX,XX"}
Se não souber com certeza, retorne {"inicial": null, "maximo": null}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
        }),
      }
    );

    if (!res.ok) return { inicial: null, maximo: null };

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) return { inicial: null, maximo: null };

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      inicial: parsed.inicial || null,
      maximo: parsed.maximo || null,
    };
  } catch (e) {
    console.error("Erro ao buscar salário:", e);
    return { inicial: null, maximo: null };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { metadados, questoes, url_prova, url_gabarito } = await req.json();

    if (!metadados?.nome || !questoes?.length) {
      return new Response(JSON.stringify({ error: "Metadados e questões são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-search salary
    let salario = { inicial: null as string | null, maximo: null as string | null };
    if (metadados.cargo) {
      console.log(`Buscando salário para cargo: ${metadados.cargo}`);
      salario = await buscarSalario(metadados.cargo);
      console.log(`Salário encontrado:`, salario);
    }

    // Inserir simulado
    const { data: simulado, error: errSimulado } = await supabase
      .from("simulados_concursos")
      .insert({
        nome: metadados.nome,
        cargo: metadados.cargo || null,
        banca: metadados.banca || null,
        ano: metadados.ano || null,
        orgao: metadados.orgao || null,
        total_questoes: questoes.length,
        status: "pronto",
        url_prova: url_prova || null,
        url_gabarito: url_gabarito || null,
        salario_inicial: salario.inicial,
        salario_maximo: salario.maximo,
      })
      .select("id")
      .single();

    if (errSimulado) throw new Error(`Erro ao inserir simulado: ${errSimulado.message}`);

    console.log(`Simulado criado: ${simulado.id} - ${metadados.nome}`);

    // Inserir questões em lotes de 50
    const batchSize = 50;
    const questoesValidas = questoes.filter((q: any) => q.enunciado && q.enunciado.trim().length > 0);
    console.log(`Questões válidas: ${questoesValidas.length} de ${questoes.length} totais`);

    if (questoesValidas.length === 0) {
      throw new Error("Nenhuma questão válida encontrada (todas sem enunciado)");
    }

    if (questoesValidas.length !== questoes.length) {
      await supabase.from("simulados_concursos").update({ total_questoes: questoesValidas.length }).eq("id", simulado.id);
    }

    for (let i = 0; i < questoesValidas.length; i += batchSize) {
      const batch = questoesValidas.slice(i, i + batchSize).map((q: any, idx: number) => ({
        simulado_id: simulado.id,
        numero: q.numero || (i + idx + 1),
        enunciado: (q.enunciado || '').trim(),
        texto_base: q.texto_base || null,
        alternativa_a: limparAlternativa(q.alternativa_a),
        alternativa_b: limparAlternativa(q.alternativa_b),
        alternativa_c: limparAlternativa(q.alternativa_c),
        alternativa_d: limparAlternativa(q.alternativa_d),
        alternativa_e: limparAlternativa(q.alternativa_e),
        gabarito: q.gabarito || null,
        materia: q.materia || null,
      }));

      const { error: errQuestoes } = await supabase
        .from("simulados_questoes")
        .insert(batch);

      if (errQuestoes) {
        console.error(`Erro lote ${i}:`, errQuestoes);
        throw new Error(`Erro ao inserir questões: ${errQuestoes.message}`);
      }
    }

    console.log(`${questoesValidas.length} questões inseridas com sucesso`);

    return new Response(JSON.stringify({
      sucesso: true,
      simulado_id: simulado.id,
      total_questoes: questoesValidas.length,
      salario,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
