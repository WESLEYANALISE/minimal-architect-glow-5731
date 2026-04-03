import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const REVISION = "v2.0.0-batch-resumos";
const MODEL = "gemini-2.5-flash-lite";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AREAS_FALTANTES = [
  "Direito Eleitoral",
  "Direito Empresarial",
  "Direito Previdenciário",
  "Direito Processual do Trabalho",
  "Direito Tributário",
  "Direitos Humanos",
  "Filosofia do Direito",
  "Pesquisa Científica",
  "Português",
];

const MAX_SUBTEMAS_POR_CHAMADA = 5;

// Sistema de fallback com 4 chaves API
async function chamarGeminiComFallback(prompt: string): Promise<string> {
  const API_KEYS = [
    { name: "GEMINI_KEY_1", key: Deno.env.get("GEMINI_KEY_1") },
    { name: "GEMINI_KEY_2", key: Deno.env.get("GEMINI_KEY_2") },
    { name: "DIREITO_PREMIUM_API_KEY", key: Deno.env.get("DIREITO_PREMIUM_API_KEY") },
  ].filter((k) => k.key);

  if (API_KEYS.length === 0) {
    throw new Error("Nenhuma API key configurada");
  }

  for (const { name, key } of API_KEYS) {
    try {
      console.log(`📝 Tentando ${name}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 12000 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log(`✅ Sucesso com ${name}`);
        return result;
      }

      const errorText = await response.text();

      if (response.status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota")) {
        console.log(`⚠️ Quota excedida em ${name}, tentando próxima...`);
        continue;
      }

      console.error(`❌ Erro ${response.status} em ${name}`);
      continue;
    } catch (error) {
      console.error(`❌ Exceção em ${name}`);
      continue;
    }
  }

  throw new Error(`Todas as ${API_KEYS.length} chaves API falharam`);
}

serve(async (req) => {
  console.log(`📍 Function: gerar-flashcards-lote@${REVISION} | Model: ${MODEL}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const areasParam: string[] = body.areas || AREAS_FALTANTES;
    const areaEspecifica: string | null = body.area || null;
    const temaEspecifico: string | null = body.tema || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Se área específica foi informada, processar apenas ela
    const areasParaProcessar = areaEspecifica ? [areaEspecifica] : areasParam;

    console.log(`🚀 Áreas para processar: ${areasParaProcessar.length}`);

    // Para cada área, encontrar o primeiro tema com subtemas pendentes
    for (const area of areasParaProcessar) {
      console.log(`\n📚 Verificando área: ${area}`);

      // Buscar todos os temas/subtemas da área no RESUMO
      const { data: resumos, error: resumoError } = await supabase
        .from("RESUMO")
        .select("tema, subtema, conteudo")
        .eq("area", area)
        .order("tema")
        .order("subtema");

      if (resumoError || !resumos || resumos.length === 0) {
        console.log(`⏩ Sem resumos para ${area}, pulando...`);
        continue;
      }

      // Agrupar por tema > subtema
      const temasPorArea: Record<string, Record<string, string[]>> = {};
      for (const r of resumos) {
        const tema = r.tema;
        const subtema = r.subtema || r.tema;
        if (!temasPorArea[tema]) temasPorArea[tema] = {};
        if (!temasPorArea[tema][subtema]) temasPorArea[tema][subtema] = [];
        temasPorArea[tema][subtema].push(r.conteudo || "");
      }

      const temasOrdenados = Object.keys(temasPorArea).sort();

      // Se tema específico, filtrar
      const temasParaVerificar = temaEspecifico
        ? temasOrdenados.filter((t) => t === temaEspecifico)
        : temasOrdenados;

      for (const tema of temasParaVerificar) {
        const subtemasDoTema = Object.keys(temasPorArea[tema]);

        // Verificar quais subtemas JÁ têm flashcards
        const { data: existentes } = await supabase
          .from("FLASHCARDS_GERADOS")
          .select("subtema")
          .eq("area", area)
          .eq("tema", tema);

        const jaProcessados = new Set((existentes || []).map((e: any) => e.subtema));

        const subtemasPendentes = subtemasDoTema.filter((s) => !jaProcessados.has(s));

        if (subtemasPendentes.length === 0) {
          console.log(`   ✅ ${tema}: todos os ${subtemasDoTema.length} subtemas já processados`);
          continue;
        }

        console.log(`   ⏳ ${tema}: ${subtemasPendentes.length}/${subtemasDoTema.length} subtemas pendentes`);

        // Processar até MAX_SUBTEMAS_POR_CHAMADA
        const subtemasParaProcessar = subtemasPendentes.slice(0, MAX_SUBTEMAS_POR_CHAMADA);
        let flashcardsGeradosTotal = 0;

        for (let i = 0; i < subtemasParaProcessar.length; i++) {
          const subtema = subtemasParaProcessar[i];
          const conteudos = temasPorArea[tema][subtema];
          const conteudoCombinado = conteudos.join("\n\n---\n\n");

          console.log(`\n🔄 [${i + 1}/${subtemasParaProcessar.length}] ${area} > ${tema} > ${subtema}`);

          const prompt = `Você é um professor experiente de Direito criando flashcards de memorização para estudantes.

📚 CONTEXTO DO CONTEÚDO:
Área: ${area}
Tema: ${tema}
Subtema: ${subtema}

📖 MATERIAL BASE PARA OS FLASHCARDS:
${conteudoCombinado}

🎯 TAREFA: Criar EXATAMENTE 20 flashcards de memorização sobre o subtema "${subtema}" baseados EXCLUSIVAMENTE no conteúdo acima.

✅ REGRAS OBRIGATÓRIAS:
1. SEMPRE gerar EXATAMENTE 20 flashcards (nem mais, nem menos!)
2. Cada flashcard TEM QUE TER: pergunta, resposta e exemplo_pratico
3. Pergunta: clara, objetiva, máximo 150 caracteres
4. Resposta: concisa mas completa, ideal 2-4 frases
5. Exemplo prático OBRIGATÓRIO: história curta ilustrando o conceito (mínimo 2 frases)
6. Baseado APENAS no conteúdo fornecido

📊 DISTRIBUIÇÃO DOS 20 FLASHCARDS:
- 6 flashcards sobre conceitos e definições
- 5 flashcards sobre requisitos e elementos
- 4 flashcards sobre procedimentos e prazos
- 3 flashcards sobre jurisprudência e súmulas
- 2 flashcards sobre casos práticos e exceções

❌ NÃO RETORNE NADA ALÉM DO JSON!

✅ RETORNE APENAS ESTE FORMATO JSON:
{
  "flashcards": [
    {
      "pergunta": "Pergunta clara e objetiva?",
      "resposta": "Resposta concisa e completa com conceitos-chave.",
      "exemplo_pratico": "História curta ilustrando o conceito..."
    }
  ]
}`;

          try {
            const textoResposta = await chamarGeminiComFallback(prompt);

            const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              console.error(`❌ Resposta inválida para "${subtema}"`);
              continue;
            }

            const flashcardsData = JSON.parse(jsonMatch[0]);
            const flashcards = flashcardsData.flashcards || [];

            console.log(`   ✅ ${flashcards.length} flashcards gerados`);

            const flashcardsComMetadados = flashcards.map((f: any) => ({
              area,
              tema,
              subtema,
              pergunta: f.pergunta,
              resposta: f.resposta,
              exemplo: f.exemplo_pratico || f.exemplo || null,
              url_imagem_exemplo: null,
            }));

            if (flashcardsComMetadados.length > 0) {
              const { error: insertError } = await supabase
                .from("FLASHCARDS_GERADOS")
                .insert(flashcardsComMetadados);

              if (insertError) {
                console.error(`   ❌ Erro ao salvar: ${insertError.message}`);
              } else {
                flashcardsGeradosTotal += flashcardsComMetadados.length;
                console.log(`   💾 ${flashcardsComMetadados.length} flashcards salvos!`);
              }
            }

            // Delay entre subtemas
            if (i + 1 < subtemasParaProcessar.length) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          } catch (error) {
            console.error(`❌ Erro ao processar subtema "${subtema}":`, error);
            continue;
          }
        }

        // Calcular status
        const subtemasRestantes = subtemasPendentes.length - subtemasParaProcessar.length;
        const proximoTemaIndex = temasParaVerificar.indexOf(tema) + 1;
        const proximoTema = proximoTemaIndex < temasParaVerificar.length ? temasParaVerificar[proximoTemaIndex] : null;
        const areaIndex = areasParaProcessar.indexOf(area);
        const proximaArea = areaIndex + 1 < areasParaProcessar.length ? areasParaProcessar[areaIndex + 1] : null;

        // Contar total de flashcards da área
        const { count: totalFlashcardsArea } = await supabase
          .from("FLASHCARDS_GERADOS")
          .select("id", { count: "exact", head: true })
          .eq("area", area);

        return new Response(
          JSON.stringify({
            success: true,
            area_atual: area,
            tema_atual: tema,
            subtemas_processados: subtemasParaProcessar.length,
            subtemas_restantes_tema: subtemasRestantes,
            flashcards_gerados_chamada: flashcardsGeradosTotal,
            total_flashcards_area: totalFlashcardsArea || 0,
            proximo_tema: subtemasRestantes > 0 ? tema : proximoTema,
            proxima_area: subtemasRestantes > 0 || proximoTema ? area : proximaArea,
            geracao_completa: subtemasRestantes === 0 && !proximoTema && !proximaArea,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Se chegou aqui, todos os temas da área estão completos
      console.log(`🎉 Área ${area} completamente processada!`);
    }

    // Se chegou aqui, TODAS as áreas estão completas
    return new Response(
      JSON.stringify({
        success: true,
        geracao_completa: true,
        message: "Todas as áreas já possuem flashcards gerados!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Erro em gerar-flashcards-lote:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
