import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REVISION = "v1.0.0-aula-professora";
const MODEL = "gemini-2.5-flash-lite";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para reparar JSON malformado/truncado
function repairJSON(text: string): string {
  // Remove markdown
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // Encontrar início e fim do JSON
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  
  if (startIndex === -1) {
    throw new Error('Não encontrou início do JSON');
  }
  
  if (endIndex === -1 || endIndex <= startIndex) {
    // JSON truncado - tentar fechar
    text = text.substring(startIndex);
    
    // Contar chaves e colchetes abertos
    let braces = 0;
    let brackets = 0;
    let inString = false;
    let escape = false;
    
    for (const char of text) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      
      if (char === '{') braces++;
      if (char === '}') braces--;
      if (char === '[') brackets++;
      if (char === ']') brackets--;
    }
    
    // Fechar arrays e objetos abertos
    let closing = '';
    while (brackets > 0) {
      closing += ']';
      brackets--;
    }
    while (braces > 0) {
      closing += '}';
      braces--;
    }
    
    // Remover possível vírgula/caractere inválido no final
    text = text.replace(/,\s*$/, '');
    text = text.replace(/:\s*$/, ': null');
    text = text.replace(/"[^"]*$/, '""');
    
    text += closing;
  } else {
    text = text.substring(startIndex, endIndex + 1);
  }
  
  // Tentar corrigir erros comuns
  text = text.replace(/,\s*([}\]])/g, '$1'); // Remove vírgulas antes de } ou ]
  text = text.replace(/([{,])\s*}/g, '$1"":null}'); // Corrige chave vazia
  
  return text;
}

serve(async (req) => {
  console.log(`📍 Function: gerar-aula-professora@${REVISION}`);
  console.log(`🤖 Usando modelo: ${MODEL}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, area } = await req.json();
    
    if (!tema) {
      throw new Error('Tema é obrigatório');
    }

    // Tentar múltiplas chaves Gemini com fallback
    const API_KEYS = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    console.log(`🔑 ${API_KEYS.length} chaves Gemini disponíveis`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Verificando se já existe aula para:', tema);

    // Check if lesson already exists
    const { data: existingAula, error: fetchError } = await supabase
      .from('aulas_interativas')
      .select('*')
      .eq('tema', tema)
      .single();

    if (existingAula && !fetchError) {
      console.log('✅ Aula encontrada no cache, retornando...');
      
      await supabase
        .from('aulas_interativas')
        .update({ visualizacoes: (existingAula.visualizacoes || 0) + 1 })
        .eq('id', existingAula.id);

      return new Response(JSON.stringify({
        ...existingAula.estrutura_completa,
        cached: true,
        aulaId: existingAula.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Gerando AULA INTERATIVA V2 para o tema:', tema);

    const prompt = `Você é um PROFESSOR JURÍDICO PREMIADO, reconhecido nacionalmente pela sua didática excepcional. Sua missão é criar uma AULA COMPLETA e ENVOLVENTE sobre este tema de Direito.

TEMA DA AULA: ${tema}
${area ? `ÁREA DO DIREITO: ${area}` : ''}

═══════════════════════════════════════════════════════════════════
                    DIRETRIZES FUNDAMENTAIS
═══════════════════════════════════════════════════════════════════

🎯 STORYTELLING OBRIGATÓRIO:
- Crie personagens recorrentes: Maria (advogada), João (empresário), Pedro (cidadão comum), Ana (juíza), Carlos (estudante de direito)
- Cada seção DEVE começar com uma história envolvente que ilustre o conceito
- As histórias devem ser realistas, do cotidiano brasileiro
- NUNCA invente jurisprudência ou decisões judiciais específicas

📚 PROFUNDIDADE DE CONTEÚDO:
- Explique CADA conceito como se o aluno nunca tivesse visto antes
- Use analogias do dia-a-dia para conceitos complexos
- Conecte com outros temas e princípios do Direito
- Mostre as consequências práticas de cada conceito

📊 ELEMENTOS VISUAIS OBRIGATÓRIOS:
- Tabelas comparativas quando houver diferenças (tipos, modalidades, prazos)
- Linha do tempo para procedimentos e etapas
- Mapa mental mostrando conexões com outros institutos
- Resumo visual com os pontos principais

💡 DICAS DE ESTUDO:
- Mnemônicos para memorização
- Associações visuais
- Pegadinhas de concursos sobre o tema

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA OBRIGATÓRIA POR SEÇÃO
═══════════════════════════════════════════════════════════════════

Crie 3-4 seções sobre o tema, cada uma abordando um aspecto diferente. Para CADA seção, crie 10-15 slides nesta SEQUÊNCIA:

1. storytelling - História com personagem que ilustra o conceito
2. texto - Explicação inicial do conceito
3. termos - 3-5 termos jurídicos com definições detalhadas
4. explicacao - Explicação profunda com 3-4 tópicos
5. tabela - Quadro comparativo (quando aplicável)
6. linha_tempo - Etapas/procedimento (quando aplicável)
7. exemplo (cotidiano) - Situação do dia-a-dia
8. exemplo (profissional) - Caso na advocacia/empresas
9. mapa_mental - Conexões com outros conceitos/princípios
10. atencao - Pegadinhas e cuidados importantes
11. dica_estudo - Técnica de memorização
12. resumo_visual - 4-6 pontos principais
13. quickcheck - Verificação de aprendizado

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA JSON A RETORNAR
═══════════════════════════════════════════════════════════════════

{
  "versao": 2,
  "titulo": "${tema} - [Título Atraente]",
  "tempoEstimado": "[X] min",
  "area": "${area || 'Direito'}",
  "descricao": "[Descrição breve e atraente da aula em 1-2 frases]",
  "objetivos": [
    "Compreender profundamente [conceito principal]",
    "Aplicar [tema] em situações práticas do cotidiano",
    "Identificar [elementos/requisitos] essenciais",
    "Evitar [erros comuns/pegadinhas] em provas e na prática"
  ],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "[Conceito principal desta seção]",
      "titulo": "[Título resumido desta seção]",
      "slides": [
        {
          "tipo": "storytelling",
          "titulo": "Uma História Real",
          "conteudo": "[Narrativa envolvente de 3-4 parágrafos com diálogos]",
          "personagem": "Maria",
          "narrativa": "[A mesma narrativa formatada]"
        },
        {
          "tipo": "texto",
          "titulo": "Entendendo o Conceito",
          "conteudo": "[Explicação inicial clara e objetiva do conceito - 2-3 parágrafos]"
        },
        {
          "tipo": "termos",
          "titulo": "Vocabulário Jurídico",
          "conteudo": "",
          "termos": [
            {"termo": "TERMO 1", "definicao": "Definição completa e didática do termo"},
            {"termo": "TERMO 2", "definicao": "Definição completa e didática"},
            {"termo": "TERMO 3", "definicao": "Definição completa e didática"}
          ]
        },
        {
          "tipo": "explicacao",
          "titulo": "Entendendo em Profundidade",
          "conteudo": "[Parágrafo introdutório explicando a importância]",
          "topicos": [
            {"titulo": "Natureza Jurídica", "detalhe": "Explicação detalhada de 2-3 linhas"},
            {"titulo": "Elementos Essenciais", "detalhe": "Quais são os requisitos necessários"},
            {"titulo": "Aplicabilidade", "detalhe": "Quando e como se aplica na prática"},
            {"titulo": "Consequências", "detalhe": "O que acontece quando aplicado ou violado"}
          ]
        },
        {
          "tipo": "tabela",
          "titulo": "Quadro Comparativo",
          "conteudo": "Veja as diferenças entre as modalidades/tipos:",
          "tabela": {
            "cabecalhos": ["Aspecto", "Tipo A", "Tipo B", "Tipo C"],
            "linhas": [
              ["Característica 1", "Valor A1", "Valor B1", "Valor C1"],
              ["Característica 2", "Valor A2", "Valor B2", "Valor C2"],
              ["Característica 3", "Valor A3", "Valor B3", "Valor C3"]
            ]
          }
        },
        {
          "tipo": "linha_tempo",
          "titulo": "Passo a Passo",
          "conteudo": "Siga estas etapas:",
          "etapas": [
            {"titulo": "Etapa 1", "descricao": "Descrição do que fazer"},
            {"titulo": "Etapa 2", "descricao": "Descrição detalhada"},
            {"titulo": "Etapa 3", "descricao": "Como aplicar na prática"},
            {"titulo": "Etapa 4", "descricao": "Finalização"}
          ]
        },
        {
          "tipo": "exemplo",
          "titulo": "Na Vida Real",
          "conteudo": "[Situação detalhada do cotidiano brasileiro. Mínimo 3 parágrafos.]",
          "contexto": "Situação Cotidiana"
        },
        {
          "tipo": "exemplo",
          "titulo": "Na Prática Profissional",
          "conteudo": "[Situação detalhada do ambiente profissional. Mínimo 3 parágrafos.]",
          "contexto": "Ambiente Profissional"
        },
        {
          "tipo": "mapa_mental",
          "titulo": "Conexões Jurídicas",
          "conteudo": "Este conceito se conecta com diversos outros institutos:",
          "conceitos": [
            {
              "central": "[Conceito Central]",
              "relacionados": ["Princípio 1", "Conceito relacionado", "Tema conexo", "Doutrina"]
            }
          ]
        },
        {
          "tipo": "atencao",
          "titulo": "Cuidado com Isso!",
          "conteudo": "[Pegadinhas comuns em provas, exceções importantes. Mínimo 2 parágrafos.]"
        },
        {
          "tipo": "dica_estudo",
          "titulo": "Como Memorizar",
          "conteudo": "[Técnica específica de memorização]",
          "tecnica": "Mnemônico",
          "dica": "[A dica específica]"
        },
        {
          "tipo": "resumo_visual",
          "titulo": "Pontos Principais",
          "conteudo": "",
          "pontos": [
            "[Ponto principal 1]",
            "[Ponto principal 2]",
            "[Ponto principal 3]",
            "[Ponto principal 4]",
            "[Ponto principal 5]"
          ]
        },
        {
          "tipo": "quickcheck",
          "pergunta": "[Pergunta de verificação estilo concurso]",
          "opcoes": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
          "resposta": 0,
          "feedback": "[Explicação detalhada]",
          "conteudo": ""
        }
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [
      {"termo": "Termo 1", "definicao": "Def curta 1 (max 60 chars)"},
      {"termo": "Termo 2", "definicao": "Def curta 2"},
      {"termo": "Termo 3", "definicao": "Def curta 3"},
      {"termo": "Termo 4", "definicao": "Def curta 4"},
      {"termo": "Termo 5", "definicao": "Def curta 5"},
      {"termo": "Termo 6", "definicao": "Def curta 6"}
    ],
    "flashcards": [
      {"frente": "Pergunta 1", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 2", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 3", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 4", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 5", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"},
      {"frente": "Pergunta 6", "verso": "Resposta detalhada", "exemplo": "Exemplo prático"}
    ],
    "questoes": [
      {
        "question": "[Questão elaborada estilo CESPE]",
        "options": ["a) Alternativa A", "b) Alternativa B", "c) Alternativa C", "d) Alternativa D"],
        "correctAnswer": 0,
        "explicacao": "[Explicação completa]",
        "fonte": "Estilo CESPE"
      },
      {
        "question": "[Questão estilo FCC]",
        "options": ["a) Alternativa", "b) Alternativa", "c) Alternativa", "d) Alternativa"],
        "correctAnswer": 1,
        "explicacao": "[Explicação completa]",
        "fonte": "Estilo FCC"
      },
      {
        "question": "[Questão estilo OAB]",
        "options": ["a) Alternativa", "b) Alternativa", "c) Alternativa", "d) Alternativa"],
        "correctAnswer": 2,
        "explicacao": "[Explicação completa]",
        "fonte": "Estilo OAB"
      },
      {
        "question": "[Questão de raciocínio]",
        "options": ["a) Alternativa", "b) Alternativa", "c) Alternativa", "d) Alternativa"],
        "correctAnswer": 0,
        "explicacao": "[Explicação completa]",
        "fonte": ""
      },
      {
        "question": "[Questão interpretativa]",
        "options": ["a) Alternativa", "b) Alternativa", "c) Alternativa", "d) Alternativa"],
        "correctAnswer": 3,
        "explicacao": "[Explicação completa]",
        "fonte": ""
      }
    ]
  },
  "provaFinal": [
    {
      "question": "[Questão final 1 - integração]",
      "options": ["a) Alt", "b) Alt", "c) Alt", "d) Alt", "e) Alt"],
      "correctAnswer": 0,
      "explicacao": "[Explicação detalhada]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 2 - caso complexo]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 1,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 3 - análise crítica]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 2,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 4 - aplicação prática]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 3,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 5 - pegadinha]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 0,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    },
    {
      "question": "[Questão final 6 - interdisciplinar]",
      "options": ["a)", "b)", "c)", "d)", "e)"],
      "correctAnswer": 4,
      "explicacao": "[Explicação]",
      "tempoLimite": 90
    }
  ]
}

═══════════════════════════════════════════════════════════════════
                    REGRAS CRÍTICAS
═══════════════════════════════════════════════════════════════════

1. NUNCA invente jurisprudência, súmulas ou decisões específicas de tribunais
2. Crie 3-4 seções dependendo da complexidade do tema
3. CADA seção DEVE ter TODOS os tipos de slides na sequência correta
4. Histórias devem ter personagens com nomes e contexto realista
5. Tabelas só quando houver REALMENTE comparação a fazer
6. Linha do tempo só quando houver REALMENTE etapas/procedimento
7. Mapa mental SEMPRE com conexões reais
8. Textos devem ser didáticos, detalhados e focados em concursos
9. Slides tipo "quickcheck" devem ter exatamente 4 opções
10. O campo "resposta" é o índice (0-3) da opção correta
11. Retorne APENAS o JSON, sem markdown ou código`;

    console.log('🚀 Enviando prompt para Gemini 2.5 Flash...');

    // Tentar com múltiplas chaves
    let response: Response | null = null;
    let lastError: string = '';
    
    for (let i = 0; i < API_KEYS.length; i++) {
      const apiKey = API_KEYS[i];
      console.log(`🔑 Tentando com chave ${i + 1}...`);
      
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
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

        if (response.ok) {
          console.log(`✅ Sucesso com chave ${i + 1}`);
          break;
        }
        
        const errorText = await response.text();
        lastError = errorText;
        console.error(`❌ Erro com chave ${i + 1}:`, response.status, errorText.substring(0, 200));
        
        // Se for erro de chave inválida/expirada, tentar próxima
        if (response.status === 400 || response.status === 403) {
          response = null;
          continue;
        }
        
        // Outros erros, parar tentativas
        break;
      } catch (err) {
        console.error(`❌ Exceção com chave ${i + 1}:`, err);
        lastError = String(err);
        continue;
      }
    }

    if (!response || !response.ok) {
      console.error('❌ Todas as chaves falharam');
      throw new Error(`Erro ao gerar estrutura da aula: ${lastError.substring(0, 100)}`);
    }

    const data = await response.json();
    let estruturaText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!estruturaText) {
      throw new Error('Resposta vazia da IA');
    }
    
    console.log('📝 Resposta recebida, processando JSON...');
    
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let estrutura;
    try {
      estrutura = JSON.parse(estruturaText);
    } catch (parseError: any) {
      console.error('⚠️ Erro ao parsear JSON, tentando reparo:', parseError.message);
      
      // Tentar reparar JSON truncado ou malformado
      try {
        estruturaText = repairJSON(estruturaText);
        estrutura = JSON.parse(estruturaText);
        console.log('✅ JSON reparado com sucesso');
      } catch (repairError) {
        console.error('❌ Falha ao reparar JSON:', repairError);
        throw new Error(`Erro ao processar resposta da IA: ${parseError.message}`);
      }
    }
    // Save to database
    console.log('💾 Salvando aula no banco de dados...');
    
    const { data: aulaSalva, error: saveError } = await supabase
      .from('aulas_interativas')
      .insert({
        area: estrutura.area || area || 'Direito',
        tema: tema,
        titulo: estrutura.titulo,
        descricao: estrutura.descricao || '',
        estrutura_completa: estrutura
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('⚠️ Erro ao salvar aula:', saveError);
    } else {
      console.log('✅ Aula salva com ID:', aulaSalva.id);
      estrutura.aulaId = aulaSalva.id;
    }
    
    console.log('✅ Aula gerada com sucesso!');
    
    return new Response(JSON.stringify(estrutura), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
