import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

const GEMINI_KEYS = getRotatedKeyStrings();

const PROMPTS: Record<string, (conteudo: string, opcoes: Record<string, unknown>) => string> = {
  resumo: (conteudo, opcoes) => {
    const tipo = opcoes.tipo || 'simples';
    const instrucoes: Record<string, string> = {
      simples: 'Gere um resumo simples e objetivo com visão geral rápida do conteúdo. Use bullet points e seja conciso.',
      aprofundado: 'Gere um resumo aprofundado detalhando conceitos, exemplos e aplicações práticas. Use seções com títulos ##, subseções ### e bullet points.',
      revisao: 'Gere bullet points ESSENCIAIS para revisão pré-prova. Apenas o que é mais cobrado. Formato: ✅ ponto-chave por linha.',
      mapa: 'Gere um mapa de conceitos hierárquico em formato markdown com títulos, subtítulos e relações entre conceitos. Use ## para conceitos principais, ### para subcategorias.',
    };
    return `${instrucoes[tipo as string] || instrucoes.simples}

CONTEÚDO:
${conteudo}

Responda em português brasileiro. Formate bem com markdown.`;
  },

  plano: (conteudo, opcoes) => {
    const { dataProva, horasDia, dificuldade } = opcoes as { dataProva?: string; horasDia?: number; dificuldade?: string };
    return `Crie um plano de estudos detalhado e personalizado.

CONTEÚDO A ESTUDAR:
${conteudo}

CONFIGURAÇÕES:
- Data da prova: ${dataProva || 'não informada'}
- Horas disponíveis por dia: ${horasDia || 2} horas
- Nível de dificuldade da matéria: ${dificuldade || 'médio'}

Retorne um JSON com a seguinte estrutura:
{
  "resumo": "breve descrição do plano",
  "totalSemanas": número,
  "semanas": [
    {
      "numero": 1,
      "titulo": "Semana 1 - Fundamentos",
      "dias": [
        {
          "dia": "Segunda-feira",
          "tema": "Título do tema",
          "atividades": ["atividade 1", "atividade 2"],
          "duracao": "2h",
          "dica": "dica de estudo"
        }
      ]
    }
  ],
  "dicas": ["dica geral 1", "dica geral 2"]
}

Retorne APENAS o JSON válido, sem markdown ou texto adicional.`;
  },

  flashcards: (conteudo, opcoes) => {
    const tipo = opcoes.tipo || 'conceitual';
    const quantidade = opcoes.quantidade || 10;
    const instrucoes: Record<string, string> = {
      conceitual: 'Crie flashcards conceituais perguntando definições e conceitos fundamentais.',
      comparativo: 'Crie flashcards comparativos entre diferentes conceitos, institutos ou teorias.',
      exemplos: 'Crie flashcards com casos práticos e exemplos de aplicação.',
      memorizacao: 'Crie flashcards focados em memorização ativa: datas, artigos, números, requisitos.',
    };
    return `${instrucoes[tipo as string] || instrucoes.conceitual}

CONTEÚDO:
${conteudo}

Crie exatamente ${quantidade} flashcards. Retorne um JSON com a estrutura:
{
  "flashcards": [
    {
      "id": 1,
      "frente": "Pergunta ou termo",
      "verso": "Resposta completa e clara",
      "dica": "dica opcional"
    }
  ]
}

Retorne APENAS o JSON válido, sem markdown ou texto adicional.`;
  },

  questoes: (conteudo, opcoes) => {
    const tipo = opcoes.tipo || 'multipla';
    const dificuldade = opcoes.dificuldade || 'medio';
    const quantidade = opcoes.quantidade || 5;
    const instrucoes: Record<string, string> = {
      multipla: 'Crie questões de múltipla escolha estilo OAB com 4 alternativas (A, B, C, D).',
      concurso: 'Crie questões estilo concurso público com 5 alternativas (A, B, C, D, E).',
      vf: 'Crie questões de Verdadeiro ou Falso com justificativa.',
    };
    return `${instrucoes[tipo as string] || instrucoes.multipla}

CONTEÚDO:
${conteudo}

Dificuldade: ${dificuldade}
Quantidade: ${quantidade} questões

Retorne um JSON:
{
  "questoes": [
    {
      "id": 1,
      "enunciado": "texto da questão",
      "alternativas": [
        {"letra": "A", "texto": "alternativa A"},
        {"letra": "B", "texto": "alternativa B"},
        {"letra": "C", "texto": "alternativa C"},
        {"letra": "D", "texto": "alternativa D"}
      ],
      "gabarito": "A",
      "explicacao": "explicação detalhada do gabarito"
    }
  ]
}

Para questões V/F, use alternativas: [{"letra":"V","texto":"Verdadeiro"},{"letra":"F","texto":"Falso"}]
Retorne APENAS o JSON válido.`;
  },

  explicacao: (conteudo, opcoes) => {
    const estilo = opcoes.estilo || 'iniciante';
    const instrucoes: Record<string, string> = {
      iniciante: 'Explique como se fosse para um iniciante absoluto em Direito. Use linguagem simples, sem jargões técnicos.',
      preprova: 'Explique de forma direta focando no que é cobrado em provas. Destaque pontos críticos com ⚠️.',
      analogias: 'Explique usando analogias do cotidiano para facilitar a compreensão. Seja criativo.',
      semjargoes: 'Explique sem usar termos técnicos jurídicos. Substitua cada jargão por linguagem comum.',
    };
    return `${instrucoes[estilo as string] || instrucoes.iniciante}

CONTEÚDO:
${conteudo}

Use markdown para formatar: títulos ##, negrito **texto**, listas, etc.
Responda em português brasileiro.`;
  },

  simulador: (conteudo, opcoes) => {
    const quantidade = opcoes.quantidade || 10;
    const tempo = opcoes.tempo || 0;
    return `Crie um simulado completo de prova.

CONTEÚDO BASE:
${conteudo}

CONFIGURAÇÕES:
- Quantidade de questões: ${quantidade}
- Tempo em minutos: ${tempo || 'sem limite'}

Crie questões variadas (múltipla escolha estilo OAB/concurso) de diferentes subtópicos do conteúdo.
Varie a dificuldade entre fácil, médio e difícil.

Retorne um JSON:
{
  "titulo": "Simulado de [tema]",
  "totalQuestoes": ${quantidade},
  "tempoMinutos": ${tempo || 0},
  "questoes": [
    {
      "id": 1,
      "enunciado": "texto da questão",
      "dificuldade": "facil|medio|dificil",
      "topico": "subtópico do conteúdo",
      "alternativas": [
        {"letra": "A", "texto": "alternativa"},
        {"letra": "B", "texto": "alternativa"},
        {"letra": "C", "texto": "alternativa"},
        {"letra": "D", "texto": "alternativa"}
      ],
      "gabarito": "A",
      "explicacao": "explicação detalhada"
    }
  ]
}

Retorne APENAS o JSON válido.`;
  },
};

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
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8000,
            },
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[arsenal] Chave ${i + 1} rate limited, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[arsenal] Erro na chave ${i + 1}: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        console.log(`[arsenal] Sucesso com chave ${i + 1}`);
        registrarTokenUsage({
          edge_function: 'arsenal-academico',
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
    } catch (error) {
      console.error(`[arsenal] Exceção na chave ${i + 1}:`, error);
      continue;
    }
  }
  throw new Error('Todas as chaves API esgotadas ou com erro');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ferramenta, conteudo, opcoes = {} } = await req.json();

    if (!ferramenta || !conteudo) {
      return new Response(
        JSON.stringify({ error: 'ferramenta e conteudo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const promptFn = PROMPTS[ferramenta];
    if (!promptFn) {
      return new Response(
        JSON.stringify({ error: `Ferramenta '${ferramenta}' não reconhecida` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = promptFn(conteudo, opcoes);
    console.log(`[arsenal] Processando ferramenta: ${ferramenta}, conteúdo: ${conteudo.length} chars`);

    const resultado = await callGeminiWithFallback(prompt);

    const ferramentasJson = ['plano', 'flashcards', 'questoes', 'simulador'];
    if (ferramentasJson.includes(ferramenta)) {
      try {
        const cleanJson = resultado.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return new Response(
          JSON.stringify({ resultado: parsed, tipo: 'json' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch {
        return new Response(
          JSON.stringify({ resultado, tipo: 'texto' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ resultado, tipo: 'texto' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[arsenal] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
