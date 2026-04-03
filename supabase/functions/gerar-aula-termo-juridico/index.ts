import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { termoId } = await req.json();
    
    if (!termoId) {
      throw new Error('termoId é obrigatório');
    }

    const apiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      throw new Error('Nenhuma API key configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o termo
    const { data: termo, error: fetchError } = await supabase
      .from('termos_juridicos_aulas')
      .select('*')
      .eq('id', termoId)
      .single();

    if (fetchError || !termo) {
      throw new Error('Termo não encontrado');
    }

    // Se já foi gerado, retornar cache
    if (termo.estrutura_completa) {
      console.log(`✅ Aula já gerada para: ${termo.termo}`);
      return new Response(JSON.stringify({
        ...termo.estrutura_completa,
        cached: true,
        termoId: termo.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📝 Gerando aula para termo: ${termo.termo} (${termo.origem})`);

    const prompt = `Você é um PROFESSOR JURÍDICO carismático e acolhedor. Seu estilo é o "Café com Professor" — como se estivesse sentado com o aluno tomando um café e explicando tudo com calma, exemplos do dia a dia e muito carinho pedagógico.

INFORMAÇÕES DO TERMO:
- Termo: ${termo.termo}
- Origem: ${termo.origem || 'Não especificada'}
- Categoria: ${termo.categoria || 'Geral'}
- Descrição: ${termo.descricao_curta || ''}

═══════════════════════════════════════════════════════════════════
              REGRAS ABSOLUTAS (NÃO VIOLAR!)
═══════════════════════════════════════════════════════════════════

1. NUNCA comece a aula com caso prático ou storytelling. SEMPRE comece com uma INTRODUÇÃO acolhedora tipo "Café com Professor"
2. A aula DEVE ter EXATAMENTE 3 seções
3. O total de slides DEVE ser entre 20 e 30 (8-10 por seção)
4. Tom conversacional, acessível, como se estivesse explicando para um amigo
5. Use "você" e linguagem próxima: "Vem comigo que eu vou te explicar..."
6. NUNCA invente jurisprudência ou súmulas específicas
7. SEM campos de imagem (imagemUrl) ou áudio
8. Retorne APENAS JSON válido, sem texto antes ou depois

═══════════════════════════════════════════════════════════════════
              ESTRUTURA OBRIGATÓRIA: 3 SEÇÕES
═══════════════════════════════════════════════════════════════════

SEÇÃO 1: "Introdução e Fundamentos" (8-10 slides)
Objetivo: Acolher o aluno e apresentar o termo com clareza total.

Slides obrigatórios nesta ordem:
1. introducao - "☕ Café com Professor" — Apresentação calorosa: "Hoje vamos conversar sobre ${termo.termo}! Pegue seu café e vem comigo..."
2. texto - Significado completo e didático do termo (explicar como se fosse a primeira vez)
3. texto - Origem etimológica (latim, grego, etc.) com curiosidades
4. termos - 4-5 termos relacionados com definições curtas
5. explicacao - Explicação profunda com tópicos detalhados (conceito, base legal, aplicação)
6. tabela - Comparativo: "${termo.termo}" vs termos similares que causam confusão
7. dica_estudo - Técnica de memorização / mnemônico criativo
8. quickcheck - Verificação rápida do aprendizado (pergunta conceitual)

SEÇÃO 2: "Aplicação Prática" (8-10 slides)
Objetivo: Mostrar como o termo funciona no mundo real.

Slides obrigatórios nesta ordem:
1. introducao - Contextualização: "Agora que você já sabe o que é, vamos ver como funciona na prática..."
2. caso - História com personagem do cotidiano (Maria, João, etc.) — situação do dia a dia
3. caso - História profissional/jurídica — situação no tribunal/escritório
4. texto - Base legal detalhada (artigos, códigos, Constituição)
5. linha_tempo - Etapas de aplicação prática ou evolução histórica (4-6 etapas)
6. atencao - Erros comuns e pegadinhas: "Cuidado! Muita gente confunde..."
7. exemplo - Situação real detalhada com contexto
8. quickcheck - Verificação intermediária (pergunta de aplicação)

SEÇÃO 3: "Aprofundamento e Revisão" (6-8 slides)
Objetivo: Consolidar, conectar e revisar tudo.

Slides obrigatórios nesta ordem:
1. mapa_mental - Conexões de ${termo.termo} com outros conceitos jurídicos
2. texto - Jurisprudência, evolução do conceito e tendências atuais
3. tabela - Resumo comparativo final (quadro-síntese)
4. dica_estudo - Dica de prova/concurso: "Se cair na prova, lembre que..."
5. resumo_visual - Pontos principais (5-6 itens de revisão)
6. quickcheck - Verificação final (pergunta integradora)

═══════════════════════════════════════════════════════════════════
              FORMATO JSON OBRIGATÓRIO
═══════════════════════════════════════════════════════════════════

{
  "versao": 2,
  "titulo": "☕ ${termo.termo} — Descomplicado",
  "tempoEstimado": "15 min",
  "area": "${termo.categoria || 'Geral'}",
  "descricao": "Aula completa sobre ${termo.termo}: significado, origem, aplicação prática e dicas de memorização.",
  "objetivos": [
    "Compreender o significado completo de ${termo.termo}",
    "Conhecer a origem etimológica do termo",
    "Saber aplicar ${termo.termo} na prática jurídica",
    "Diferenciar de termos similares que geram confusão",
    "Memorizar com técnicas eficazes"
  ],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "Introdução e Fundamentos de ${termo.termo}",
      "titulo": "☕ Conhecendo ${termo.termo}",
      "slides": [
        {"tipo": "introducao", "titulo": "☕ Café com Professor", "conteudo": "[Texto acolhedor de 3-4 parágrafos convidando o aluno, explicando o que vai aprender, usando tom amigável]", "icone": "☕"},
        {"tipo": "texto", "titulo": "O que é ${termo.termo}?", "conteudo": "[Explicação completa e didática, 3-4 parágrafos]"},
        {"tipo": "texto", "titulo": "De Onde Vem essa Palavra?", "conteudo": "[Origem etimológica com curiosidades, latim/grego, 2-3 parágrafos]"},
        {"tipo": "termos", "titulo": "Vocabulário Essencial", "conteudo": "Termos que caminham junto:", "termos": [{"termo": "TERMO", "definicao": "definição clara e curta"}]},
        {"tipo": "explicacao", "titulo": "Entendendo a Fundo", "conteudo": "Vamos mergulhar nos detalhes:", "topicos": [{"titulo": "Tópico", "detalhe": "Explicação detalhada"}]},
        {"tipo": "tabela", "titulo": "Não Confunda!", "conteudo": "Veja as diferenças:", "tabela": {"cabecalhos": ["Aspecto", "Conceito A", "Conceito B"], "linhas": [["...", "...", "..."]]}},
        {"tipo": "dica_estudo", "titulo": "💡 Dica de Memorização", "conteudo": "[Técnica]", "tecnica": "Mnemônico", "dica": "[Dica criativa e específica]"},
        {"tipo": "quickcheck", "titulo": "Verificação Rápida", "conteudo": "", "pergunta": "[Pergunta conceitual]", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "[Explicação da resposta]"}
      ]
    },
    {
      "id": 2,
      "tipo": "inciso",
      "trechoOriginal": "Aplicação Prática de ${termo.termo}",
      "titulo": "⚖️ Na Prática",
      "slides": [
        {"tipo": "introducao", "titulo": "Hora da Prática!", "conteudo": "[Contextualização amigável: 'Agora que você já domina a teoria...']", "icone": "⚖️"},
        {"tipo": "caso", "titulo": "Caso do Dia a Dia", "conteudo": "[História com personagem em situação cotidiana, 3-4 parágrafos]"},
        {"tipo": "caso", "titulo": "No Tribunal", "conteudo": "[História profissional/jurídica com personagem, 3-4 parágrafos]"},
        {"tipo": "texto", "titulo": "Base Legal", "conteudo": "[Artigos de lei, códigos, Constituição relevantes, 2-3 parágrafos]"},
        {"tipo": "linha_tempo", "titulo": "Passo a Passo", "conteudo": "Como funciona na prática:", "etapas": [{"titulo": "Etapa", "descricao": "Descrição"}]},
        {"tipo": "atencao", "titulo": "⚠️ Cuidado!", "conteudo": "[Erros comuns, pegadinhas, confusões frequentes, 2-3 parágrafos]"},
        {"tipo": "exemplo", "titulo": "Exemplo Real", "conteudo": "[Situação detalhada com contexto]", "contexto": "Situação Prática"},
        {"tipo": "quickcheck", "titulo": "Você Aprendeu?", "conteudo": "", "pergunta": "[Pergunta de aplicação]", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "[Explicação]"}
      ]
    },
    {
      "id": 3,
      "tipo": "paragrafo",
      "trechoOriginal": "Aprofundamento e Revisão de ${termo.termo}",
      "titulo": "🎯 Revisão Final",
      "slides": [
        {"tipo": "mapa_mental", "titulo": "Mapa de Conexões", "conteudo": "Como ${termo.termo} se conecta:", "conceitos": [{"central": "${termo.termo}", "relacionados": ["Conceito 1", "Conceito 2", "Conceito 3", "Conceito 4"]}]},
        {"tipo": "texto", "titulo": "Evolução e Tendências", "conteudo": "[Jurisprudência, evolução do conceito, tendências atuais, 2-3 parágrafos]"},
        {"tipo": "tabela", "titulo": "Quadro-Síntese", "conteudo": "Resumo final:", "tabela": {"cabecalhos": ["Aspecto", "Detalhe"], "linhas": [["O que é", "..."], ["Origem", "..."], ["Área", "..."], ["Base Legal", "..."]]}},
        {"tipo": "dica_estudo", "titulo": "🎯 Dica de Prova", "conteudo": "[Dica para concurso/OAB]", "tecnica": "Estratégia", "dica": "[Se cair na prova, lembre que...]"},
        {"tipo": "resumo_visual", "titulo": "Pontos Principais", "conteudo": "O que levar dessa aula:", "pontos": ["Ponto 1", "Ponto 2", "Ponto 3", "Ponto 4", "Ponto 5"]},
        {"tipo": "quickcheck", "titulo": "Verificação Final", "conteudo": "", "pergunta": "[Pergunta integradora]", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "[Explicação completa]"}
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [
      {"termo": "Termo 1", "definicao": "Def curta (max 60 chars)"},
      {"termo": "Termo 2", "definicao": "Def curta"},
      {"termo": "Termo 3", "definicao": "Def curta"},
      {"termo": "Termo 4", "definicao": "Def curta"},
      {"termo": "Termo 5", "definicao": "Def curta"},
      {"termo": "Termo 6", "definicao": "Def curta"}
    ],
    "flashcards": [
      {"frente": "Pergunta 1", "verso": "Resposta", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 2", "verso": "Resposta", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 3", "verso": "Resposta", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 4", "verso": "Resposta", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 5", "verso": "Resposta", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 6", "verso": "Resposta", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 7", "verso": "Resposta", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 8", "verso": "Resposta", "exemplo": "Exemplo prático"}
    ],
    "questoes": [
      {"question": "[Questão estilo CESPE]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 0, "explicacao": "[Explicação detalhada]", "fonte": "Estilo CESPE"},
      {"question": "[Questão estilo FCC]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 1, "explicacao": "[Explicação detalhada]", "fonte": "Estilo FCC"},
      {"question": "[Questão estilo OAB]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 2, "explicacao": "[Explicação detalhada]", "fonte": "Estilo OAB"},
      {"question": "[Questão conceitual]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 0, "explicacao": "[Explicação detalhada]", "fonte": ""},
      {"question": "[Questão de aplicação]", "options": ["a)", "b)", "c)", "d)"], "correctAnswer": 3, "explicacao": "[Explicação detalhada]", "fonte": ""}
    ]
  },
  "provaFinal": [
    {"question": "[Questão final 1]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 0, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 2]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 1, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 3]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 2, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 4]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 3, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 5]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 0, "explicacao": "[Explicação]", "tempoLimite": 90},
    {"question": "[Questão final 6]", "options": ["a)", "b)", "c)", "d)", "e)"], "correctAnswer": 4, "explicacao": "[Explicação]", "tempoLimite": 90}
  ]
}

REGRAS FINAIS:
1. Preencha TODOS os campos com conteúdo REAL e RICO sobre "${termo.termo}"
2. Os textos devem ser LONGOS e DETALHADOS (mín. 2-3 parágrafos cada)
3. As histórias dos "caso" devem ter personagens com nomes e situações realistas
4. Os quickcheck devem ter 4 opções e feedback explicativo
5. FOQUE na etimologia e origem do termo (${termo.origem || 'latim'})
6. COMPARE com termos similares que geram confusão
7. Total mínimo: 22 slides distribuídos nas 3 seções`;

    let responseData: any = null;
    let estruturaText: string | null = null;
    let lastError = '';
    let usedModel = MODELS[0];

    // Try each model + key combo, with retry on empty response
    outer:
    for (const model of MODELS) {
      for (const apiKey of apiKeys) {
        try {
          console.log(`🔄 Tentando modelo ${model}...`);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.8,
                  maxOutputTokens: 65000,
                  responseMimeType: "application/json",
                }
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`⚠️ Key falhou (${response.status}): ${errorText.substring(0, 100)}`);
            lastError = errorText;
            continue;
          }

          responseData = await response.json();
          const finishReason = responseData.candidates?.[0]?.finishReason;
          const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          console.log(`📊 finishReason: ${finishReason}, contentLength: ${text?.length || 0}`);

          if (!text) {
            console.warn(`⚠️ Resposta vazia (finishReason: ${finishReason}), tentando próxima combinação...`);
            lastError = `Resposta vazia (finishReason: ${finishReason})`;
            continue;
          }

          estruturaText = text;
          usedModel = model;
          break outer;
        } catch (e: any) {
          lastError = e.message;
          console.warn(`⚠️ Key falhou: ${e.message}`);
        }
      }
    }

    if (!estruturaText) {
      throw new Error(`Todas as tentativas falharam: ${lastError.substring(0, 200)}`);
    }
    
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let estrutura;
    try {
      estrutura = JSON.parse(estruturaText);
    } catch (parseError: any) {
      console.error('⚠️ Erro ao parsear JSON:', parseError.message);
      
      // Sanitize control characters that break JSON
      estruturaText = estruturaText
        .replace(/[\x00-\x1F\x7F]/g, (ch: string) => {
          if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
          return '';
        })
        // Fix trailing commas before } or ]
        .replace(/,\s*([}\]])/g, '$1');

      const startIndex = estruturaText.indexOf('{');
      const endIndex = estruturaText.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        estruturaText = estruturaText.substring(startIndex, endIndex + 1);
      }
      
      try {
        estrutura = JSON.parse(estruturaText);
      } catch (e2: any) {
        console.error('⚠️ JSON ainda inválido após sanitização:', e2.message);
        console.error('⚠️ Trecho próximo ao erro:', estruturaText.substring(Math.max(0, 18950), 19050));
        throw new Error(`JSON inválido na resposta da IA: ${e2.message}`);
      }
    }

    // Registrar uso de tokens
    const usageMetadata = responseData?.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || (inputTokens + outputTokens);
    const custoEstimado = totalTokens * 0.000001; // estimativa

    try {
      await supabase.rpc('registrar_uso_token', {
        p_edge_function: 'gerar-aula-termo-juridico',
        p_model: usedModel,
        p_provider: 'gemini',
        p_tipo_conteudo: 'aula_termo_juridico',
        p_input_tokens: inputTokens,
        p_output_tokens: outputTokens,
        p_custo_estimado_brl: custoEstimado,
        p_sucesso: true,
        p_metadata: { termo: termo.termo, categoria: termo.categoria }
      });
      console.log(`📊 Tokens registrados: ${totalTokens} (in: ${inputTokens}, out: ${outputTokens})`);
    } catch (tokenErr: any) {
      console.warn('⚠️ Erro ao registrar tokens:', tokenErr.message);
    }

    // Salvar no banco
    const { error: saveError } = await supabase
      .from('termos_juridicos_aulas')
      .update({
        estrutura_completa: estrutura,
        gerado_em: new Date().toISOString()
      })
      .eq('id', termoId);

    if (saveError) {
      console.error('⚠️ Erro ao salvar:', saveError);
    } else {
      console.log('✅ Aula salva para:', termo.termo);
    }

    return new Response(JSON.stringify({
      ...estrutura,
      cached: false,
      termoId: termo.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro ao gerar aula do termo'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
