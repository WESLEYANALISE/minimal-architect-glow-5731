import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REVISION = "v6.0.0-cafe-com-professor";
const MODEL = "gemini-2.5-flash-lite";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pool de chaves API (1, 2, 3) com fallback
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

async function callGeminiWithFallback(prompt: string, config: { temperature: number; maxOutputTokens: number }): Promise<string> {
  console.log(`[gerar-aula-artigo] Iniciando com ${GEMINI_KEYS.length} chaves disponíveis`);
  
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const apiKey = GEMINI_KEYS[i];
    console.log(`[gerar-aula-artigo] Tentando chave ${i + 1}...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              ...config,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[gerar-aula-artigo] Chave ${i + 1} rate limited, tentando próxima...`);
        continue;
      }

      if (response.status === 400) {
        const errorText = await response.text();
        if (errorText.includes('API key expired') || errorText.includes('INVALID_ARGUMENT')) {
          console.log(`[gerar-aula-artigo] Chave ${i + 1} expirada/inválida, tentando próxima...`);
          continue;
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[gerar-aula-artigo] Erro na chave ${i + 1}: ${response.status} - ${errorText.substring(0, 200)}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        console.log(`[gerar-aula-artigo] ✅ Sucesso com chave ${i + 1}`);
        return text;
      } else {
        console.log(`[gerar-aula-artigo] Resposta vazia da chave ${i + 1}`);
        continue;
      }
    } catch (error) {
      console.error(`[gerar-aula-artigo] Exceção na chave ${i + 1}:`, error);
      continue;
    }
  }
  
  throw new Error('Todas as chaves API esgotadas ou com erro');
}

serve(async (req) => {
  console.log(`📍 Function: gerar-aula-artigo@${REVISION}`);
  console.log(`🤖 Usando modelo: ${MODEL}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigoTabela, numeroArtigo, conteudoArtigo } = await req.json();
    
    if (!codigoTabela || !numeroArtigo || !conteudoArtigo) {
      throw new Error('Código da tabela, número do artigo e conteúdo são obrigatórios');
    }

    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY configurada');
    }

    console.log(`✅ ${GEMINI_KEYS.length} chaves Gemini disponíveis`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Verificando se já existe aula para:', codigoTabela, numeroArtigo);

    // Check if lesson already exists
    const { data: existingAula, error: fetchError } = await supabase
      .from('aulas_artigos')
      .select('*')
      .eq('codigo_tabela', codigoTabela)
      .eq('numero_artigo', numeroArtigo)
      .single();

    if (existingAula && !fetchError) {
      console.log('✅ Aula encontrada no cache, retornando...');
      
      await supabase
        .from('aulas_artigos')
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

    console.log('📝 Gerando CURSO COMPLETO V4 para o artigo...');

    const prompt = `Você é um professor experiente explicando Direito para uma pessoa LEIGA.
Seu estilo é como uma CONVERSA DE CAFÉ - descontraído, acolhedor e didático.

═══ PÚBLICO-ALVO ═══
Pessoas que NUNCA estudaram o tema. Assuma ZERO conhecimento prévio.
IMPORTANTE: Esta aula é para QUALQUER pessoa que quer aprender sobre este artigo - estudantes de direito, cidadãos, profissionais, etc.

CÓDIGO: ${codigoTabela}
ARTIGO: ${numeroArtigo}
TEXTO COMPLETO DO ARTIGO:
${conteudoArtigo}

═══════════════════════════════════════════════════════════════════
                    DIRETRIZES FUNDAMENTAIS
═══════════════════════════════════════════════════════════════════

═══ TOM DE VOZ ═══
- Descontraído, claro e acolhedor
- Use expressões naturais: "Percebeu?", "Faz sentido, né?", "Na prática...", "Veja bem...", "Note que..."
- Perguntas guiadas: "E por que isso importa?", "Percebeu a diferença?"
- Seguro e correto tecnicamente
- Próximo, como conversa entre amigos reais
- NUNCA infantilizado ou condescendente

═══ ESTRUTURA DIDÁTICA OBRIGATÓRIA ═══

1. **SIMPLES PRIMEIRO → TÉCNICO DEPOIS (REGRA DE OURO)**
   ❌ ERRADO: "A jurisdição voluntária caracteriza-se por..."
   ✅ CERTO: "Sabe quando duas pessoas concordam com tudo, mas ainda precisam do juiz para oficializar? Isso é o que o Direito chama de 'jurisdição voluntária'."

2. **TRADUÇÃO IMEDIATA de termos técnicos e latim:**
   - "O 'pacta sunt servanda' (significa 'os pactos devem ser cumpridos' - ou seja, combinado é combinado!)"
   - "Isso é o que chamamos de 'trânsito em julgado' (quando não dá mais para recorrer de uma decisão)"
   - "O 'habeas corpus' (do latim 'que tenhas o corpo' - basicamente: traga a pessoa presa para o juiz ver)"

3. **DESMEMBRE conceitos difíceis:**
   Divida em partes menores, explicando passo a passo, como se estivesse "mastigando" o conteúdo para o aluno.

4. **ANALOGIAS DO COTIDIANO:**
   - "Pense na competência como o território de cada juiz. Assim como um policial de SP não pode multar alguém no RJ..."
   - "É tipo quando você pede um lanche: se vier errado, você pode reclamar - isso é o seu 'direito de consumidor'."

5. **ANTECIPE DÚVIDAS:**
   "Você pode estar pensando: 'Mas isso não seria injusto?' Veja bem..."

═══ CUIDADOS IMPORTANTES ═══
- NÃO use emojis no texto corrido (a interface já adiciona os ícones visuais)
- NÃO mencione "PDF", "material", "documento" - escreva como conhecimento SEU
- NUNCA seja formal demais ou use "juridiquês" sem explicação imediata

═══ GRIFO E ÊNFASE (OBRIGATÓRIO) ═══
Para destacar termos-chave, use NEGRITO + ASPAS SIMPLES:

• TERMOS TÉCNICOS CRÍTICOS: **'competência absoluta'**, **'litispendência'**
• IDADES: **'16 anos'**, **'18 anos'**, **'35 anos de idade'**
• LEIS E ARTIGOS: **'Art. 5º da CF'**, **'Lei 9.504/97'**
• PRAZOS: **'30 dias'**, **'prazo de 15 dias'**
• VALORES: **'R$ 5.000'**, **'10 salários mínimos'**
• PORCENTAGENS: **'50%'**, **'10,5%'**
• DATAS: **'15 de agosto'**, **'1º de janeiro'**

REGRA: Informações numéricas e termos técnicos DEVEM estar em negrito + aspas.

═══ CITAÇÕES DE ARTIGOS (OBRIGATÓRIO) ═══
Sempre que citar um artigo de lei, use BLOCKQUOTE do Markdown para destacar:

FORMATO:
> "Art. 5º - Todos são iguais perante a lei..." (CF/88)

REGRA: Toda citação literal de artigo DEVE estar em blockquote (>).

═══ STORYTELLING (USE COM MODERAÇÃO) ═══
- Personagens recorrentes: Maria (advogada), João (empresário), Pedro (cidadão comum), Ana (juíza), Carlos (estudante de direito)
- Histórias realistas do cotidiano brasileiro
- NUNCA invente jurisprudência ou decisões judiciais específicas

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA OBRIGATÓRIA POR SEÇÃO
═══════════════════════════════════════════════════════════════════

Para CADA parte do artigo (caput, incisos, parágrafos), crie uma seção com 8-12 slides nesta SEQUÊNCIA:

1. introducao - Contexto e ganho (o que vai aprender e por quê)
2. texto - O texto exato do artigo destacado
3. explicacao - Explicação profunda com tom conversacional
4. termos - 3-5 termos jurídicos com definições didáticas
5. tabela - Quadro comparativo (quando aplicável)
6. linha_tempo - Etapas/procedimento (quando aplicável)
7. caso - Exemplo prático do cotidiano (situação real)
8. atencao - Pegadinhas e cuidados importantes
9. dica_estudo - Técnica de memorização (mnemônico)
10. resumo_visual - 4-6 pontos principais
11. quickcheck - Verificação de aprendizado (UMA pergunta por slide)

═══════════════════════════════════════════════════════════════════
                    ESTRUTURA JSON A RETORNAR
═══════════════════════════════════════════════════════════════════

{
  "versao": 2,
  "titulo": "Art. ${numeroArtigo} - [Título descritivo atraente]",
  "tempoEstimado": "[X] min",
  "objetivos": [
    "Entender de forma clara [conceito principal]",
    "Aplicar [tema] em situações do dia a dia",
    "Identificar [elementos/requisitos] essenciais",
    "Evitar [erros comuns] na interpretação"
  ],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "[Texto exato dessa parte do artigo]",
      "titulo": "[Título resumido desta seção]",
      "slides": [
        {
          "tipo": "introducao",
          "titulo": "O que você vai aprender",
          "conteudo": "☕ Prepare seu café, pois vamos mergulhar juntos em um tema muito importante!\\n\\nNesta aula sobre **Art. ${numeroArtigo}**, vamos estudar de forma clara e prática. Ao final, você vai dominar:\\n\\n• **Conceito principal**: O que é e para que serve\\n• **Requisitos legais**: O que a lei exige\\n• **Casos práticos**: Como aplicar na vida real\\n• **Pontos de atenção**: O que muita gente confunde\\n\\nVamos lá? Bora começar!"
        },
        {
          "tipo": "texto",
          "titulo": "O Que Diz a Lei",
          "conteudo": "[Texto do artigo com destaques e formatação]"
        },
        {
          "tipo": "termos",
          "titulo": "Termos Importantes",
          "conteudo": "",
          "termos": [
            {"termo": "Termo técnico 1", "definicao": "Explicação em linguagem simples, como se explicasse para um amigo"},
            {"termo": "Termo técnico 2", "definicao": "Definição clara e didática"},
            {"termo": "Termo técnico 3", "definicao": "Definição acessível"}
          ]
        },
        {
          "tipo": "explicacao",
          "titulo": "Entendendo em Profundidade",
          "conteudo": "Vamos entender isso passo a passo...",
          "topicos": [
            {"titulo": "Na essência, o que é?", "detalhe": "Explicação didática em linguagem simples"},
            {"titulo": "Quando se aplica?", "detalhe": "Em quais situações do dia a dia"},
            {"titulo": "O que exige?", "detalhe": "Requisitos e elementos necessários"},
            {"titulo": "E se não cumprir?", "detalhe": "Consequências práticas"}
          ]
        },
        {
          "tipo": "tabela",
          "titulo": "Quadro Comparativo",
          "conteudo": "Veja as diferenças de forma visual:",
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
          "titulo": "Etapa por Etapa",
          "conteudo": "Na prática, funciona assim:",
          "etapas": [
            {"titulo": "1ª Etapa", "descricao": "Descrição clara do que acontece primeiro"},
            {"titulo": "2ª Etapa", "descricao": "O que vem em seguida"},
            {"titulo": "3ª Etapa", "descricao": "Continuação do processo"},
            {"titulo": "4ª Etapa", "descricao": "Conclusão"}
          ]
        },
        {
          "tipo": "caso",
          "titulo": "Na Prática: Caso Real",
          "conteudo": "Imagine que João, um trabalhador comum, se encontra na seguinte situação...\n\nAqui, aplica-se exatamente o que vimos: [explicação]\n\nPercebeu como funciona na vida real?",
          "contexto": "Situação Cotidiana"
        },
        {
          "tipo": "atencao",
          "titulo": "Atenção: Cuidado com Isso!",
          "conteudo": "Muita gente confunde [conceito A] com [conceito B], mas são coisas diferentes!\n\nO erro mais comum é pensar que... Na verdade, a lei diz que...\n\nFique esperto!"
        },
        {
          "tipo": "dica_estudo",
          "titulo": "Como Memorizar",
          "conteudo": "Para lembrar disso com facilidade, use esse macete...",
          "tecnica": "Mnemônico",
          "dica": "Associe assim: [frase ou acrônimo]"
        },
        {
          "tipo": "resumo_visual",
          "titulo": "Pontos Principais",
          "conteudo": "",
          "pontos": [
            "Ponto 1 - resumo claro e objetivo",
            "Ponto 2 - o que você precisa lembrar",
            "Ponto 3 - elemento essencial",
            "Ponto 4 - destaque importante",
            "Ponto 5 - conclusão"
          ]
        },
        {
          "tipo": "quickcheck",
          "pergunta": "Vamos testar se ficou claro? [Pergunta de verificação]",
          "opcoes": ["Alternativa A (uma correta)", "Alternativa B", "Alternativa C", "Alternativa D"],
          "resposta": 0,
          "feedback": "Isso mesmo! A resposta correta é a A porque...",
          "conteudo": ""
        }
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [
      {"termo": "Termo técnico 1", "definicao": "Definição curta (max 60 chars)"},
      {"termo": "Termo técnico 2", "definicao": "Definição curta"},
      {"termo": "Termo técnico 3", "definicao": "Definição curta"},
      {"termo": "Termo técnico 4", "definicao": "Definição curta"}
    ],
    "flashcards": [
      {"frente": "O que é [conceito]?", "verso": "Resposta clara e didática", "exemplo": "Exemplo prático do cotidiano"},
      {"frente": "Quando se aplica [regra]?", "verso": "Resposta detalhada", "exemplo": "Situação real"},
      {"frente": "Qual a diferença entre [A] e [B]?", "verso": "Resposta comparativa", "exemplo": "Exemplo ilustrativo"},
      {"frente": "O que acontece se [situação]?", "verso": "Consequência prevista", "exemplo": "Caso prático"}
    ],
    "questoes": [
      {
        "question": "Questão 1 sobre o tema",
        "options": ["a) Alternativa correta", "b) Alternativa B", "c) Alternativa C", "d) Alternativa D"],
        "correctAnswer": 0,
        "explicacao": "A alternativa A está correta porque..."
      },
      {
        "question": "Questão 2 de aplicação prática",
        "options": ["a) Alternativa A", "b) Alternativa correta", "c) Alternativa C", "d) Alternativa D"],
        "correctAnswer": 1,
        "explicacao": "A alternativa B está correta porque..."
      },
      {
        "question": "Questão 3 sobre exceções e cuidados",
        "options": ["a) Alternativa A", "b) Alternativa B", "c) Alternativa correta", "d) Alternativa D"],
        "correctAnswer": 2,
        "explicacao": "A alternativa C está correta porque..."
      }
    ]
  },
  "provaFinal": [
    {
      "question": "[Questão final 1 - integração de conhecimentos]",
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
      "question": "[Questão final 5 - pegadinha elaborada]",
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
2. Crie 2-4 seções dependendo da complexidade do artigo
3. Use tom conversacional "café com professor" - próximo, mas correto
4. Tabelas só quando houver REALMENTE comparação a fazer
5. Linha do tempo só quando houver REALMENTE etapas/procedimento
6. Slides "quickcheck" devem ter exatamente 4 opções
7. O campo "resposta" é o índice (0-3) da opção correta
8. atividadesFinais.matching deve ter 4 pares
9. atividadesFinais.flashcards deve ter 4 cards
10. atividadesFinais.questoes deve ter 3 questões
11. Retorne APENAS o JSON, sem markdown ou código`;

    console.log('🚀 Enviando prompt para Gemini com fallback...');

    let estruturaText = await callGeminiWithFallback(prompt, { temperature: 0.8, maxOutputTokens: 65000 });
    
    console.log('📝 Resposta recebida, processando JSON...');
    
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let estrutura;
    try {
      estrutura = JSON.parse(estruturaText);
    } catch (parseError: any) {
      console.error('⚠️ Erro ao parsear JSON, tentando limpeza:', parseError.message);
      
      const startIndex = estruturaText.indexOf('{');
      const endIndex = estruturaText.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        estruturaText = estruturaText.substring(startIndex, endIndex + 1);
      }
      
      estruturaText = estruturaText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
      
      try {
        estrutura = JSON.parse(estruturaText);
      } catch (secondError: any) {
        console.error('⚠️ Segunda tentativa falhou:', secondError.message);
        
        let inString = false;
        let escaped = false;
        let result = '';
        
        for (let i = 0; i < estruturaText.length; i++) {
          const char = estruturaText[i];
          
          if (escaped) {
            result += char;
            escaped = false;
            continue;
          }
          
          if (char === '\\' && inString) {
            result += char;
            escaped = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            result += char;
            continue;
          }
          
          if (inString) {
            if (char === '\n' || char === '\r' || char === '\t') {
              result += ' ';
            } else {
              result += char;
            }
          } else {
            if (!/\s/.test(char)) {
              result += char;
            }
          }
        }
        
        try {
          estrutura = JSON.parse(result);
        } catch (finalError: any) {
          console.error('❌ Falha definitiva no parsing:', finalError.message);
          throw new Error('A IA gerou uma resposta inválida. Tente novamente.');
        }
      }
    }
    
    // Ensure versao is set
    estrutura.versao = 2;
    
    console.log('✅ Estrutura café com professor gerada com sucesso:', estrutura.titulo);
    console.log(`📊 Seções: ${estrutura.secoes?.length || 0}, Slides por seção: ${estrutura.secoes?.[0]?.slides?.length || 0}`);

    const { data: savedAula, error: saveError } = await supabase
      .from('aulas_artigos')
      .insert({
        codigo_tabela: codigoTabela,
        numero_artigo: numeroArtigo,
        conteudo_artigo: conteudoArtigo,
        estrutura_completa: estrutura,
        visualizacoes: 1
      })
      .select()
      .single();

    if (saveError) {
      console.error('⚠️ Erro ao salvar aula:', saveError);
      return new Response(JSON.stringify({
        ...estrutura,
        cached: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('💾 Aula CURSO COMPLETO V4 salva no banco com ID:', savedAula.id);
    console.log(`📊 Atividades: ${estrutura.atividadesFinais?.matching?.length || 0} matchings, ${estrutura.atividadesFinais?.flashcards?.length || 0} flashcards, ${estrutura.atividadesFinais?.questoes?.length || 0} questões`);
    return new Response(JSON.stringify({
      ...estrutura,
      cached: false,
      aulaId: savedAula.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro em gerar-aula-artigo:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar aula do artigo' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
