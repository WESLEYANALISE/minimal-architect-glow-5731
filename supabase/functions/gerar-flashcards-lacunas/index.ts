import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const REVISION = "v1.0.0-lacunas";
const MODEL = "gemini-2.5-flash-lite";

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

const MAX_SUBTEMAS_POR_CHAMADA = 5;

async function chamarGeminiComFallback(prompt: string): Promise<string> {
  const { getRotatedGeminiKeys } = await import("../_shared/gemini-keys.ts");
  const keys = getRotatedGeminiKeys(true);

  if (keys.length === 0) {
    throw new Error('Nenhuma API key configurada');
  }

  for (const { name, key } of keys) {
    try {
      console.log(`📝 Tentando ${name}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 12000 }
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`✅ Sucesso com ${name}`);
        registrarTokenUsage({
          edge_function: 'gerar-flashcards-lacunas',
          model: MODEL,
          provider: 'gemini',
          tipo_conteudo: 'texto',
          input_tokens: data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
          output_tokens: data.usageMetadata?.candidatesTokenCount || Math.ceil(result.length / 4),
          custo_estimado_brl: (((data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4)) * 0.0004 + (data.usageMetadata?.candidatesTokenCount || Math.ceil(result.length / 4)) * 0.0024) / 1000),
          sucesso: true,
        });
        return result;
      }
      
      const errorText = await response.text();
      
      if (response.status === 429 || response.status === 403 || response.status === 503 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
        console.log(`⚠️ Rate limit/suspensão em ${name}, tentando próxima...`);
        continue;
      }
      
      console.error(`❌ Erro ${response.status} em ${name}`);
      continue;
    } catch (error) {
      console.error(`❌ Exceção em ${name}`);
      continue;
    }
  }
  
  throw new Error(`Todas as ${keys.length} chaves API falharam`);
}

serve(async (req) => {
  console.log(`📍 Function: gerar-flashcards-lacunas@${REVISION} | Model: ${MODEL}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('📦 Body keys:', Object.keys(body || {}));
    
    const area = body?.area;
    const tema = body?.tema;
    const resumos = body?.resumos;

    if (!area || !tema || !resumos || resumos.length === 0) {
      console.error('❌ Validação falhou:', { area: !!area, tema: !!tema, resumos: !!resumos, resumosLen: resumos?.length });
      return new Response(
        JSON.stringify({ error: 'área, tema e resumos são obrigatórios', flashcards_gerados: 0, geracao_completa: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\n📚 [Lacunas] Iniciando geração para ${area} > ${tema}`);
    console.log(`📝 ${resumos.length} resumos recebidos`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Agrupar resumos por subtema
    const resumosPorSubtema = resumos.reduce((acc: any, resumo: any) => {
      const subtema = resumo.subtema || resumo.tema;
      if (!acc[subtema]) acc[subtema] = [];
      acc[subtema].push(resumo);
      return acc;
    }, {});

    const todosSubtemas = Object.keys(resumosPorSubtema);
    const totalSubtemas = todosSubtemas.length;

    // Verificar quais subtemas JÁ têm lacunas geradas
    const { data: subtemasExistentes } = await supabase
      .from('FLASHCARDS_LACUNAS')
      .select('subtema')
      .ilike('area', area)
      .ilike('tema', tema);

    const subtemasJaProcessados = new Set(
      (subtemasExistentes || []).map((r: any) => (r.subtema || '').toLowerCase().trim())
    );

    const subtemasPendentes = todosSubtemas.filter(
      subtema => !subtemasJaProcessados.has((subtema || '').toLowerCase().trim())
    );

    if (subtemasPendentes.length === 0) {
      console.log(`🎉 Todos os ${totalSubtemas} subtemas já processados!`);
      return new Response(
        JSON.stringify({ 
          flashcards_gerados: 0,
          total_subtemas: totalSubtemas,
          subtemas_processados: totalSubtemas,
          geracao_completa: true,
          fromCache: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subtemasParaProcessar = subtemasPendentes.slice(0, MAX_SUBTEMAS_POR_CHAMADA);
    console.log(`🎯 Processando ${subtemasParaProcessar.length} subtemas nesta chamada`);

    let totalGeradosNestaChamada = 0;

    for (let i = 0; i < subtemasParaProcessar.length; i++) {
      const subtema = subtemasParaProcessar[i];
      const resumosDoSubtema = resumosPorSubtema[subtema];
      
      console.log(`🔄 [${i+1}/${subtemasParaProcessar.length}] Processando: "${subtema}"`);

      const conteudoCombinado = resumosDoSubtema
        .map((r: any) => r.conteudo)
        .join('\n\n---\n\n');

      const prompt = `Você é um professor experiente de Direito criando exercícios de LACUNA (fill-in-the-blank) para estudantes.

📚 CONTEXTO:
Área: ${area}
Tema: ${tema}
Subtema: ${subtema}

📖 MATERIAL BASE:
${conteudoCombinado}

🎯 TAREFA: Criar EXATAMENTE 20 exercícios de lacuna sobre "${subtema}" baseados EXCLUSIVAMENTE no conteúdo acima.

✅ REGRAS OBRIGATÓRIAS:
1. SEMPRE gerar EXATAMENTE 20 exercícios (nem mais, nem menos!)
2. Cada exercício TEM QUE TER: frase, palavra_correta, palavra_errada, comentario
3. A "frase" deve conter EXATAMENTE UM "___" (três underscores) marcando onde a lacuna está
4. A "palavra_correta" é o termo jurídico correto que preenche a lacuna
5. A "palavra_errada" é um distrator plausível mas INCORRETO (mesmo campo semântico)
6. O "comentario" explica POR QUE a resposta correta é aquela (2-3 frases)
7. As palavras devem ser termos técnicos/jurídicos, NÃO palavras genéricas
8. A frase deve fazer sentido gramatical com AMBAS as opções (para gerar dúvida)

📊 EXEMPLOS:
- Frase: "O princípio da ___ impede que o réu seja julgado duas vezes pelo mesmo fato."
  palavra_correta: "vedação ao bis in idem"
  palavra_errada: "reformatio in pejus"
  comentario: "O princípio da vedação ao bis in idem (ne bis in idem) proíbe a dupla punição pelo mesmo fato. Já a reformatio in pejus refere-se à proibição de reforma da decisão em prejuízo do recorrente."

- Frase: "A ___ é o ato pelo qual o juiz resolve o mérito da causa."
  palavra_correta: "sentença"
  palavra_errada: "decisão interlocutória"
  comentario: "A sentença resolve o mérito da causa, encerrando a fase cognitiva. A decisão interlocutória resolve questões incidentais sem encerrar o processo."

❌ NÃO RETORNE NADA ALÉM DO JSON!

✅ RETORNE APENAS ESTE FORMATO JSON:
{
  "lacunas": [
    {
      "frase": "Frase com ___ marcando a lacuna.",
      "palavra_correta": "termo correto",
      "palavra_errada": "distrator plausível",
      "comentario": "Explicação de por que a resposta correta é aquela."
    }
  ]
}`;

      try {
        const textoResposta = await chamarGeminiComFallback(prompt);
        
        const jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error(`❌ Resposta inválida para subtema "${subtema}"`);
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const lacunas = parsed.lacunas || [];
        
        console.log(`   ✅ ${lacunas.length} lacunas geradas`);

        const lacunasComMetadados = lacunas.map((l: any) => ({
          area,
          tema,
          subtema,
          frase: l.frase,
          palavra_correta: l.palavra_correta,
          palavra_errada: l.palavra_errada,
          comentario: l.comentario,
        }));

        if (lacunasComMetadados.length > 0) {
          // Use individual inserts with ON CONFLICT to handle partial duplicates
          let insertedCount = 0;
          for (const lacuna of lacunasComMetadados) {
            const { error: insertError } = await supabase
              .from('FLASHCARDS_LACUNAS')
              .upsert(lacuna, { 
                onConflict: 'area,tema,subtema,frase,palavra_correta',
                ignoreDuplicates: true 
              });
            if (!insertError) insertedCount++;
          }
          console.log(`   ✅ ${insertedCount}/${lacunasComMetadados.length} lacunas salvas`);
          totalGeradosNestaChamada += insertedCount;
        }

        if (i + 1 < subtemasParaProcessar.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`❌ Erro ao processar subtema "${subtema}":`, error);
        continue;
      }
    }

    const subtemasProcessadosAgora = subtemasJaProcessados.size + subtemasParaProcessar.length;
    const subtemasFaltantes = totalSubtemas - subtemasProcessadosAgora;
    const geracaoCompleta = subtemasFaltantes <= 0;

    console.log(`\n📊 RESUMO: ${totalGeradosNestaChamada} lacunas geradas | Completo: ${geracaoCompleta}`);

    return new Response(
      JSON.stringify({ 
        flashcards_gerados: totalGeradosNestaChamada,
        total_subtemas: totalSubtemas,
        subtemas_processados: subtemasProcessadosAgora,
        subtemas_faltantes: subtemasFaltantes,
        geracao_completa: geracaoCompleta,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro em gerar-flashcards-lacunas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
