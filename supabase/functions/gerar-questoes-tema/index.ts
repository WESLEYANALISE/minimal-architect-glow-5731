import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const REVISION = "v4.0.0-15-20-questions";
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

// Configuração: máximo de subtemas por chamada para evitar timeout
const MAX_SUBTEMAS_POR_CHAMADA = 5;

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

  for (const { name, key } of API_KEYS) {
    try {
      console.log(`📝 Tentando ${name}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 15000 }
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log(`✅ Sucesso com ${name}`);
        registrarTokenUsage({
          edge_function: 'gerar-questoes-tema',
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
      
      if (response.status === 429 || errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
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
  console.log(`📍 Function: gerar-questoes-tema@${REVISION} | Model: ${MODEL}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, tema, resumos } = await req.json();

    if (!area || !tema || !resumos || resumos.length === 0) {
      throw new Error('área, tema e resumos são obrigatórios');
    }

    console.log(`\n📚 Iniciando geração progressiva para ${area} > ${tema}`);
    console.log(`📝 ${resumos.length} resumos recebidos`);

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Agrupar resumos por subtema
    const resumosPorSubtema = resumos.reduce((acc: any, resumo: any) => {
      const subtema = resumo.subtema || resumo.tema;
      if (!acc[subtema]) {
        acc[subtema] = [];
      }
      acc[subtema].push(resumo);
      return acc;
    }, {});

    const todosSubtemas = Object.keys(resumosPorSubtema);
    const totalSubtemas = todosSubtemas.length;
    
    console.log(`📊 Total de subtemas no tema: ${totalSubtemas}`);

    // 1. Verificar quais subtemas JÁ têm questões geradas
    const { data: subtemasExistentes } = await supabase
      .from('QUESTOES_GERADAS')
      .select('subtema')
      .eq('area', area)
      .eq('tema', tema);

    const subtemasJaProcessados = new Set(
      (subtemasExistentes || []).map((r: any) => r.subtema)
    );
    
    console.log(`✅ Subtemas já processados: ${subtemasJaProcessados.size}/${totalSubtemas}`);

    // 2. Filtrar subtemas que ainda faltam processar
    const subtemasPendentes = todosSubtemas.filter(
      subtema => !subtemasJaProcessados.has(subtema)
    );
    
    console.log(`⏳ Subtemas pendentes: ${subtemasPendentes.length}`);

    // 3. Buscar questões já existentes
    const { data: questoesExistentes } = await supabase
      .from('QUESTOES_GERADAS')
      .select('*')
      .eq('area', area)
      .eq('tema', tema)
      .eq('aprovada', true);

    const questoesAtuais = questoesExistentes || [];

    // 4. Se TODOS os subtemas já foram processados, retornar do cache
    if (subtemasPendentes.length === 0) {
      console.log(`🎉 Todos os ${totalSubtemas} subtemas já processados! Retornando cache.`);
      
      return new Response(
        JSON.stringify({ 
          questoes: questoesAtuais,
          questoes_geradas: questoesAtuais.length,
          total_subtemas: totalSubtemas,
          subtemas_processados: totalSubtemas,
          geracao_completa: true,
          subtemas_faltantes: 0,
          fromCache: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Limitar a MAX_SUBTEMAS_POR_CHAMADA para evitar timeout
    const subtemasParaProcessar = subtemasPendentes.slice(0, MAX_SUBTEMAS_POR_CHAMADA);
    
    console.log(`\n🎯 Processando ${subtemasParaProcessar.length} subtemas nesta chamada:`);
    subtemasParaProcessar.forEach((s, i) => console.log(`   ${i+1}. ${s}`));

    const questoesGeradasNestaChamada: any[] = [];

    // 6. Processar cada subtema E SALVAR IMEDIATAMENTE
    for (let i = 0; i < subtemasParaProcessar.length; i++) {
      const subtema = subtemasParaProcessar[i];
      const resumosDoSubtema = resumosPorSubtema[subtema];
      
      console.log(`\n🔄 [${i+1}/${subtemasParaProcessar.length}] Processando: "${subtema}"`);

      const conteudoCombinado = resumosDoSubtema
        .map((r: any) => r.conteudo)
        .join('\n\n---\n\n');

      const prompt = `Você é um professor de Direito criando questões CURTAS e OBJETIVAS para concursos.

📚 CONTEXTO:
Área: ${area} | Tema: ${tema} | Subtema: ${subtema}

📖 MATERIAL BASE:
${conteudoCombinado}

🎯 TAREFA: Criar entre 15 e 20 questões CURTAS sobre "${subtema}". GERAR EXATAMENTE 18 QUESTÕES (valor ideal).

=== REGRAS DE TAMANHO - CRÍTICO ===

📏 ENUNCIADOS (MÁXIMO 3 frases curtas):
❌ ERRADO: "Considerando as disposições legais vigentes no ordenamento jurídico brasileiro acerca da responsabilidade civil extracontratual, especialmente no que tange aos elementos caracterizadores do dever de indenizar, assinale a alternativa correta:"
✅ CERTO: "Quais são os elementos da responsabilidade civil?"
✅ CERTO: "Conforme a doutrina, o dano moral exige:"

📏 ALTERNATIVAS (MÁXIMO 15-18 palavras cada):
❌ ERRADO: "A responsabilidade civil subjetiva exige a comprovação de dolo ou culpa do agente causador do dano para que haja obrigação de indenizar"
✅ CERTO: "Exige comprovação de dolo ou culpa do agente"
✅ CERTO: "Conduta, dano, nexo causal e culpa"
✅ CERTO: "Sim, é admitida a cumulação"

=== DISTRIBUIÇÃO DAS 18 QUESTÕES ===
- 6 questões LITERAIS: Perguntas diretas sobre conceitos (máx 2 frases)
- 5 questões DECOREBA: Uma frase só - prazos, valores, classificações
- 4 questões de APLICAÇÃO: Caso prático CURTO (máx 4 frases)
- 3 questões JURISPRUDÊNCIA: Súmulas, entendimentos dos tribunais

Exemplos de questões CURTAS:
- "Qual o prazo prescricional para [...]?"
- "O dano moral é compatível com dano material?"
- "Quanto ao ônus da prova, é correto afirmar:"
- "De acordo com a Súmula XXX do STJ:"

=== REGRAS ===
1. GERAR EXATAMENTE 18 QUESTÕES (mínimo 15, máximo 20)
2. 4 alternativas (A, B, C, D) - cada uma com MÁXIMO 18 palavras
3. Apenas 1 correta por questão
4. Comentário: 2-3 frases explicativas e didáticas
5. Exemplo prático OBRIGATÓRIO: história curta ilustrando o conceito

❌ NÃO RETORNE NADA ALÉM DO JSON!

✅ FORMATO JSON:
{
  "questoes": [
    {
      "enunciado": "Pergunta curta e direta?",
      "alternativa_a": "Resposta curta (máx 18 palavras)",
      "alternativa_b": "Resposta curta",
      "alternativa_c": "Resposta curta",
      "alternativa_d": "Resposta curta",
      "resposta_correta": "A",
      "comentario": "A alternativa A está correta porque [conceito].",
      "exemplo_pratico": "João recebeu um caso onde..."
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

        const questoesData = JSON.parse(jsonMatch[0]);
        const questoes = questoesData.questoes || [];
        
        console.log(`   ✅ ${questoes.length} questões geradas`);

        // Preparar questões com metadados
        const questoesComMetadados = questoes.map((q: any) => ({
          area,
          tema,
          subtema,
          enunciado: q.enunciado,
          alternativa_a: q.alternativa_a,
          alternativa_b: q.alternativa_b,
          alternativa_c: q.alternativa_c,
          alternativa_d: q.alternativa_d,
          resposta_correta: q.resposta_correta,
          comentario: q.comentario,
          exemplo_pratico: q.exemplo_pratico || null
        }));

        // ⚡ SALVAR IMEDIATAMENTE após cada subtema
        if (questoesComMetadados.length > 0) {
          console.log(`   💾 Salvando ${questoesComMetadados.length} questões...`);
          
          const { error: insertError } = await supabase
            .from('QUESTOES_GERADAS')
            .insert(questoesComMetadados);

          if (insertError) {
            console.error(`   ❌ Erro ao salvar: ${insertError.message}`);
          } else {
            console.log(`   ✅ Questões salvas com sucesso!`);
            questoesGeradasNestaChamada.push(...questoesComMetadados);
          }
        }

        // Delay entre subtemas
        if (i + 1 < subtemasParaProcessar.length) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error(`❌ Erro ao processar subtema "${subtema}":`, error);
        continue;
      }
    }

    // 7. Calcular status final
    const subtemasProcessadosAgora = subtemasJaProcessados.size + subtemasParaProcessar.length;
    const subtemasFaltantes = totalSubtemas - subtemasProcessadosAgora;
    const geracaoCompleta = subtemasFaltantes <= 0;

    // 8. Buscar TODAS as questões atualizadas
    const { data: todasQuestoes } = await supabase
      .from('QUESTOES_GERADAS')
      .select('*')
      .eq('area', area)
      .eq('tema', tema)
      .eq('aprovada', true);

    const questoesFinais = todasQuestoes || [];

    console.log(`\n📊 RESUMO DA CHAMADA:`);
    console.log(`   - Questões geradas nesta chamada: ${questoesGeradasNestaChamada.length}`);
    console.log(`   - Total de questões disponíveis: ${questoesFinais.length}`);
    console.log(`   - Subtemas processados: ${subtemasProcessadosAgora}/${totalSubtemas}`);
    console.log(`   - Geração completa: ${geracaoCompleta ? 'SIM ✅' : 'NÃO ⏳'}`);

    return new Response(
      JSON.stringify({ 
        questoes: questoesFinais,
        questoes_geradas: questoesGeradasNestaChamada.length,
        total_questoes: questoesFinais.length,
        total_subtemas: totalSubtemas,
        subtemas_processados: subtemasProcessadosAgora,
        subtemas_faltantes: subtemasFaltantes,
        geracao_completa: geracaoCompleta,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro em gerar-questoes-tema:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
