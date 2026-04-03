import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MODEL = "gemini-2.5-flash-lite";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function buscarMaterialReferencia(supabase: any, tema: string): Promise<string> {
  let materialRef = '';

  try {
    // Buscar resumos relacionados na tabela RESUMO
    const { data: resumos } = await supabase
      .from('RESUMO')
      .select('resumo_markdown, exemplos, termos')
      .or(`tema.ilike.%${tema}%,area.ilike.%${tema}%`)
      .limit(3);

    if (resumos && resumos.length > 0) {
      materialRef += '\n\n=== RESUMOS DO BANCO DE DADOS ===\n';
      for (const r of resumos) {
        if (r.resumo_markdown) materialRef += `\nResumo: ${r.resumo_markdown.substring(0, 1500)}`;
        if (r.termos) materialRef += `\nTermos: ${JSON.stringify(r.termos).substring(0, 500)}`;
        if (r.exemplos) materialRef += `\nExemplos: ${r.exemplos.substring(0, 500)}`;
      }
    }

    // Buscar artigos do Vademecum
    const { data: artigos } = await supabase
      .from('AULAS INTERATIVAS')
      .select('Livro, Conteúdo')
      .ilike('Livro', `%${tema}%`)
      .limit(5);

    if (artigos && artigos.length > 0) {
      materialRef += '\n\n=== ARTIGOS DO VADEMECUM ===\n';
      for (const a of artigos) {
        if (a.Livro) materialRef += `\nLivro: ${a.Livro}`;
        if (a['Conteúdo']) materialRef += `\nConteúdo: ${a['Conteúdo'].substring(0, 500)}`;
      }
    }
  } catch (err) {
    console.error('Erro ao buscar material de referência:', err);
  }

  return materialRef;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, area } = await req.json();
    
    if (!tema) {
      throw new Error('Tema é obrigatório');
    }

    const API_KEYS = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: existingAula } = await supabase
      .from('aulas_interativas')
      .select('*')
      .eq('tema', tema)
      .single();

    if (existingAula) {
      console.log('✅ Aula encontrada no cache');
      
      await supabase
        .from('aulas_interativas')
        .update({ visualizacoes: (existingAula.visualizacoes || 0) + 1 })
        .eq('id', existingAula.id);

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const event = `data: ${JSON.stringify({ 
            type: 'complete',
            cached: true,
            aulaId: existingAula.id,
            estrutura: existingAula.estrutura_completa
          })}\n\n`;
          controller.enqueue(encoder.encode(event));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
      });
    }

    console.log('📝 Gerando aula com streaming para:', tema);

    // Buscar material de referência do banco
    const materialReferencia = await buscarMaterialReferencia(supabase, tema);
    console.log(`📚 Material de referência encontrado: ${materialReferencia.length} chars`);

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Consultando banco de conhecimento...',
            progress: 0
          })}\n\n`));

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Criando primeira seção...',
            progress: 10
          })}\n\n`));

          const secaoRapida = await gerarSecaoRapida(API_KEYS, tema, area, materialReferencia);
          
          if (secaoRapida) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'secao',
              secaoIndex: 0,
              secao: secaoRapida.secao,
              estruturaBasica: secaoRapida.estruturaBasica
            })}\n\n`));
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'status', 
            message: 'Gerando conteúdo completo...',
            progress: 40
          })}\n\n`));

          const estruturaCompleta = await gerarAulaCompleta(API_KEYS, tema, area, materialReferencia);
          
          if (estruturaCompleta) {
            const { data: aulaSalva, error: saveError } = await supabase
              .from('aulas_interativas')
              .insert({
                area: estruturaCompleta.area || area || 'Direito',
                tema: tema,
                titulo: estruturaCompleta.titulo,
                descricao: estruturaCompleta.descricao || '',
                estrutura_completa: estruturaCompleta
              })
              .select()
              .single();

            if (!saveError && aulaSalva) {
              estruturaCompleta.aulaId = aulaSalva.id;
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete',
              aulaId: estruturaCompleta.aulaId,
              estrutura: estruturaCompleta
            })}\n\n`));
          } else {
            throw new Error('Falha ao gerar conteúdo');
          }

          controller.close();
        } catch (err: unknown) {
          console.error('❌ Erro na geração:', err);
          const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar aula';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error',
            message: errorMessage
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function gerarSecaoRapida(apiKeys: string[], tema: string, area?: string, materialReferencia?: string): Promise<any> {
  const refBlock = materialReferencia ? `\n\nMATERIAL DE REFERÊNCIA (use como base, cite artigos e termos reais quando disponíveis):\n${materialReferencia}` : '';
  
  const prompt = `Você é um professor jurídico. Crie APENAS A PRIMEIRA SEÇÃO de uma aula sobre: ${tema}
${refBlock}

Retorne JSON com esta estrutura EXATA:
{
  "estruturaBasica": {
    "titulo": "${tema} - [Título Atraente]",
    "tempoEstimado": "30 min",
    "area": "${area || 'Direito'}",
    "descricao": "[Descrição breve em 1 frase]",
    "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"]
  },
  "secao": {
    "id": 1,
    "tipo": "caput",
    "trechoOriginal": "[Conceito principal]",
    "titulo": "[Título da seção]",
    "slides": [
      {
        "tipo": "introducao",
        "titulo": "☕ Café com Professor",
        "conteudo": "[Apresentação acolhedora do tema em 2 parágrafos, explicando o que será estudado e por que é importante]"
      },
      {
        "tipo": "texto",
        "titulo": "Entendendo o Conceito",
        "conteudo": "[Explicação clara e didática de 2-3 parágrafos sobre o fundamento do tema]"
      },
      {
        "tipo": "explicacao",
        "titulo": "Em Profundidade",
        "conteudo": "[Parágrafo introdutório]",
        "topicos": [
          {"titulo": "Natureza Jurídica", "detalhe": "Explicação"},
          {"titulo": "Aplicabilidade", "detalhe": "Explicação"}
        ]
      },
      {
        "tipo": "termos",
        "titulo": "Vocabulário Jurídico",
        "conteudo": "",
        "termos": [
          {"termo": "TERMO 1", "definicao": "Definição"},
          {"termo": "TERMO 2", "definicao": "Definição"}
        ]
      },
      {
        "tipo": "caso",
        "titulo": "Caso Prático",
        "conteudo": "[Caso prático detalhado de 2-3 parágrafos]",
        "contexto": "Situação Cotidiana"
      },
      {
        "tipo": "quickcheck",
        "pergunta": "[Pergunta de verificação]",
        "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
        "resposta": 0,
        "feedback": "[Explicação]",
        "conteudo": ""
      }
    ]
  }
}

REGRA CRÍTICA: NUNCA comece uma seção com caso prático ou storytelling. Sempre comece com introdução ou texto explicativo.
IMPORTANTE: Use o material de referência acima como base. Cite artigos e termos reais quando disponíveis.
Retorne APENAS o JSON.`;

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8000,
              responseMimeType: "application/json",
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
        }
      }
    } catch (e) {
      console.error('Erro com chave:', e);
      continue;
    }
  }
  return null;
}

async function gerarAulaCompleta(apiKeys: string[], tema: string, area?: string, materialReferencia?: string): Promise<any> {
  const refBlock = materialReferencia ? `\n\nMATERIAL DE REFERÊNCIA (use como base, cite artigos e termos reais quando disponíveis):\n${materialReferencia}` : '';

  const prompt = `Você é um PROFESSOR JURÍDICO PREMIADO, conhecido pelo estilo "Café com Professor" — didático, envolvente e profundo. Crie uma AULA COMPLETA sobre: ${tema}
${area ? `ÁREA: ${area}` : ''}
${refBlock}

═══════════════════════════════════════════════════════════════════
                    TOM E ESTILO: "CAFÉ COM PROFESSOR"
═══════════════════════════════════════════════════════════════════

☕ Comece com: "Prepare seu café, porque hoje vamos mergulhar em [tema]..."
- Tom conversacional mas rigoroso tecnicamente
- Use personagens recorrentes: Maria (advogada), João (empresário), Pedro (cidadão), Ana (juíza)
- Cite artigos de lei reais, súmulas e jurisprudência quando aplicável
- Termos técnicos em **negrito**
- Pontos de atenção com ⚠️
- Dicas com 💡
- Casos práticos reais e detalhados (3-4 parágrafos cada)

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA - 4 SEÇÕES com 10-12 slides cada (40-48 slides total)
═══════════════════════════════════════════════════════════════════

SEÇÃO 1: INTRODUÇÃO E FUNDAMENTOS
- introducao (apresentação acolhedora "☕ Café com Professor", 2-3 parágrafos explicando o tema)
- texto (explicação clara do conceito base, 3 parágrafos)
- termos (4-5 termos jurídicos com definições completas)
- explicacao (4 tópicos detalhados: natureza jurídica, elementos, aplicabilidade, consequências)
- atencao (pegadinhas e cuidados, com ⚠️)
- quickcheck

SEÇÃO 2: APROFUNDAMENTO
- texto (explicação do aspecto específico)
- explicacao (3-4 tópicos)
- termos (3-4 novos termos)
- tabela (quadro comparativo com pelo menos 4 linhas e 3 colunas)
- caso (caso prático cotidiano detalhado, 3-4 parágrafos)
- linha_tempo (etapas/procedimento quando aplicável)
- quickcheck

SEÇÃO 3: ASPECTOS PRÁTICOS E JURISPRUDÊNCIA
- texto (como funciona na prática forense)
- explicacao (pontos controversos e doutrina)
- caso (caso real de tribunal, 3-4 parágrafos)
- storytelling (história envolvente que mostra aplicação prática, 3-4 parágrafos com diálogos)
- atencao (erros comuns na prática e em provas)
- dica_estudo (mnemônico + técnica de memorização)
- quickcheck

SEÇÃO 4: SÍNTESE FINAL
- resumo (resumo geral com 5-6 pontos principais)
- termos (termos-chave revisados)
- texto (dicas finais para provas e prática)
- tabela (tabela comparativa geral)
- resumo_visual (conclusão com pontos de revisão)

═══════════════════════════════════════════════════════════════════

Retorne JSON:
{
  "versao": 2,
  "titulo": "${tema} - [Título Criativo e Atraente]",
  "tempoEstimado": "45 min",
  "area": "${area || 'Direito'}",
  "descricao": "[Descrição envolvente em 2 frases]",
  "objetivos": ["Obj 1", "Obj 2", "Obj 3", "Obj 4"],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "[Conceito]",
      "titulo": "[Título seção]",
      "slides": [
        {"tipo": "introducao", "titulo": "☕ Café com Professor", "conteudo": "[Apresentação acolhedora do tema, 2-3 parágrafos]"},
        {"tipo": "texto", "titulo": "...", "conteudo": "[2-3 parágrafos densos]"},
        {"tipo": "termos", "titulo": "...", "conteudo": "", "termos": [{"termo": "...", "definicao": "[definição completa 2-3 linhas]"}]},
        {"tipo": "explicacao", "titulo": "...", "conteudo": "...", "topicos": [{"titulo": "...", "detalhe": "[2-3 linhas]"}]},
        {"tipo": "caso", "titulo": "CASO PRÁTICO", "conteudo": "[3-4 parágrafos detalhados]", "contexto": "Situação Cotidiana"},
        {"tipo": "tabela", "titulo": "...", "conteudo": "...", "tabela": {"cabecalhos": ["..."], "linhas": [["..."]]}},
        {"tipo": "linha_tempo", "titulo": "...", "conteudo": "...", "etapas": [{"titulo": "...", "descricao": "..."}]},
        {"tipo": "storytelling", "titulo": "...", "conteudo": "[3-4 parágrafos com diálogos - SOMENTE após explicações teóricas]", "personagem": "Maria", "narrativa": "..."},
        {"tipo": "atencao", "titulo": "⚠️ Cuidado!", "conteudo": "[pontos de atenção detalhados]"},
        {"tipo": "dica_estudo", "titulo": "💡 Dica de Estudo", "conteudo": "[mnemônico ou técnica]"},
        {"tipo": "resumo_visual", "titulo": "...", "conteudo": "", "pontos": ["...", "...", "..."]},
        {"tipo": "quickcheck", "pergunta": "...", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "[explicação detalhada]", "conteudo": ""}
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [{"termo": "...", "definicao": "..."}],
    "flashcards": [{"frente": "...", "verso": "...", "exemplo": "..."}],
    "questoes": [{"question": "...", "options": ["a)...", "b)...", "c)...", "d)..."], "correctAnswer": 0, "explicacao": "...", "fonte": ""}]
  },
  "provaFinal": [{"question": "...", "options": ["a)...", "b)...", "c)...", "d)...", "e)..."], "correctAnswer": 0, "explicacao": "...", "tempoLimite": 90}]
}

REGRAS CRÍTICAS:
- NUNCA comece uma seção com caso prático ou storytelling. SEMPRE comece com introdução, texto explicativo ou resumo.
- A Seção 1 DEVE começar com slide tipo "introducao" (Café com Professor)
- Storytelling e casos práticos só aparecem DEPOIS das explicações teóricas
- Cada slide de "caso" e "storytelling" DEVE ter conteúdo LONGO (3-4 parágrafos mínimos)
- Termos DEVEM ter definições completas (2-3 linhas cada)
- Use blockquotes (>) para citações doutrinárias
- NUNCA invente jurisprudência específica
- Retorne APENAS JSON válido.`;

  for (const apiKey of apiKeys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 50000,
              responseMimeType: "application/json",
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          return JSON.parse(text);
        }
      }
    } catch (e) {
      console.error('Erro com chave:', e);
      continue;
    }
  }
  return null;
}
