import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, conteudo_base, area, aula_link } = await req.json();
    console.log(`Gerando conteúdo para: ${area} - ${tema}`);

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    
    if (!DIREITO_PREMIUM_API_KEY) {
      console.error('DIREITO_PREMIUM_API_KEY não configurada nas variáveis de ambiente');
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    console.log('✅ DIREITO_PREMIUM_API_KEY configurada:', DIREITO_PREMIUM_API_KEY ? 'Sim (oculta)' : 'Não');

    // Prompt para melhorar e enriquecer o conteúdo existente
    const promptConteudo = `Você é um professor de Direito experiente e didático. 

IMPORTANTE: Você DEVE melhorar e expandir EXATAMENTE o conteúdo fornecido abaixo, mantendo 100% de fidelidade ao tema "${tema}" da área "${area}". NÃO invente outro tema, NÃO mude o assunto.

CONTEÚDO BASE A SER MELHORADO:
${conteudo_base}

Sua tarefa é MELHORAR e ENRIQUECER ESTE CONTEÚDO ESPECÍFICO, deixando-o muito mais explicado e detalhado para que os alunos entendam profundamente cada ponto. Siga estas diretrizes:

**EXPANSÃO DO CONTEÚDO:**
1. Pegue cada conceito e explique de forma mais aprofundada e didática
2. Adicione explicações passo a passo para cada ponto importante
3. Inclua mais exemplos práticos e situações concretas do dia a dia
4. Explique o "porquê" de cada regra ou conceito, não apenas o "o quê"
5. Adicione contexto histórico ou prático quando relevante
6. Detalhe melhor os artigos de lei mencionados, explicando seu alcance
7. Inclua casos práticos e como aplicar cada conceito na prática
8. Adicione dicas de memorização e conexões entre conceitos

**FORMATAÇÃO EM MARKDOWN:**
1. Organize com títulos e subtítulos usando # ## ###
2. Use **negrito** para termos técnicos e conceitos-chave
3. Use listas numeradas para processos e passos
4. Use listas com marcadores para enumerações
5. Use tabelas para comparações e dados estruturados
6. Use > para citações de artigos de lei
7. Use emojis nos títulos para tornar atrativo (📚 🎯 ⚖️ 💡 ✅ ⚠️ 📋 etc)
8. Quebre em parágrafos curtos para facilitar leitura

**ESTRUTURA SUGERIDA:**
- Introdução clara do tema
- Conceitos fundamentais bem explicados
- Exemplos práticos detalhados
- Artigos de lei com explicação do seu significado
- Casos práticos de aplicação
- Dicas importantes e alertas
- Resumo dos pontos principais

Retorne APENAS o conteúdo enriquecido em markdown limpo, sem introduções sobre você ou meta-comentários.`;

    // Prompt para gerar flashcards com base no conteúdo
    const promptFlashcards = `Com base neste conteúdo sobre "${tema}" da área "${area}":

${conteudo_base}

Crie 8 flashcards educacionais para ajudar estudantes a memorizarem os conceitos principais do texto acima.

Retorne APENAS um JSON no formato:
{
  "flashcards": [
    {
      "pergunta": "Pergunta clara e direta sobre um conceito importante do texto",
      "resposta": "Resposta concisa e completa, com exemplo se possível"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicações, sem \`\`\`json.`;

    // Prompt para gerar questões com base no conteúdo
    const promptQuestoes = `Com base neste conteúdo sobre "${tema}" da área "${area}":

${conteudo_base}

Crie 5 questões de múltipla escolha estilo OAB/concursos para testar o conhecimento do estudante sobre o conteúdo acima.

Retorne APENAS um JSON no formato:
{
  "questoes": [
    {
      "enunciado": "Enunciado da questão com situação prática baseada no conteúdo",
      "alternativas": {
        "a": "Alternativa A",
        "b": "Alternativa B",
        "c": "Alternativa C",
        "d": "Alternativa D"
      },
      "correta": "a",
      "explicacao": "Explicação detalhada do porquê a alternativa está correta e as outras estão erradas"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem markdown, sem explicações, sem \`\`\`json.`;

    // Gerar conteúdo
    console.log('Gerando conteúdo...');
    const responseConteudo = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptConteudo }]
          }]
        }),
      }
    );

    if (!responseConteudo.ok) {
      const errorData = await responseConteudo.json();
      console.error('Erro detalhado ao gerar conteúdo:', {
        status: responseConteudo.status,
        statusText: responseConteudo.statusText,
        error: errorData
      });
      throw new Error(`Erro ao gerar conteúdo: ${responseConteudo.status} - ${JSON.stringify(errorData)}`);
    }

    const dataConteudo = await responseConteudo.json();
    console.log('Resposta da API Gemini:', JSON.stringify(dataConteudo).substring(0, 200));
    
    if (!dataConteudo.candidates || !dataConteudo.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Formato de resposta inválido:', dataConteudo);
      throw new Error('Formato de resposta da API Gemini inválido');
    }
    
    const conteudoText = dataConteudo.candidates[0].content.parts[0].text;
    const conteudo_enriquecido = conteudoText.replace(/```markdown\n?|\n?```/g, '').trim();

    // Gerar flashcards
    console.log('Gerando flashcards...');
    const responseFlashcards = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptFlashcards }]
          }]
        }),
      }
    );

    if (!responseFlashcards.ok) {
      const errorData = await responseFlashcards.json();
      console.error('Erro ao gerar flashcards:', errorData);
      throw new Error(`Erro ao gerar flashcards: ${responseFlashcards.status} - ${JSON.stringify(errorData)}`);
    }

    const dataFlashcards = await responseFlashcards.json();
    const flashcardsText = dataFlashcards.candidates[0].content.parts[0].text.replace(/```json\n?|\n?```/g, '').trim();
    const flashcardsJson = JSON.parse(flashcardsText);

    // Gerar questões
    console.log('Gerando questões...');
    const responseQuestoes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptQuestoes }]
          }]
        }),
      }
    );

    if (!responseQuestoes.ok) {
      const errorData = await responseQuestoes.json();
      console.error('Erro ao gerar questões:', errorData);
      throw new Error(`Erro ao gerar questões: ${responseQuestoes.status} - ${JSON.stringify(errorData)}`);
    }

    const dataQuestoes = await responseQuestoes.json();
    const questoesText = dataQuestoes.candidates[0].content.parts[0].text.replace(/```json\n?|\n?```/g, '').trim();
    const questoesJson = JSON.parse(questoesText);

    // Atualizar banco de dados com todo o conteúdo gerado
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('CURSOS-APP')
      .update({ 
        'conteudo-final': conteudo_enriquecido,
        'flashcards': flashcardsJson.flashcards,
        'questoes': questoesJson.questoes,
        'conteudo_gerado_em': new Date().toISOString()
      })
      .eq('area', area)
      .eq('tema', tema);

    if (updateError) {
      console.error('Erro ao atualizar DB:', updateError);
      throw updateError;
    }

    console.log(`Conteúdo completo gerado e salvo para: ${area} - ${tema}`);

    return new Response(
      JSON.stringify({ 
        conteudo_enriquecido,
        flashcards: flashcardsJson.flashcards,
        questoes: questoesJson.questoes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
