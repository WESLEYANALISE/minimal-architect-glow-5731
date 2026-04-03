import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declaração do EdgeRuntime para background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
].filter(Boolean) as string[];


async function chamarGemini(prompt: string, maxTokens: number = 12000): Promise<string> {
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const keyIndex = attempt % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log(`Rate limit na key ${keyIndex + 1}, tentando próxima...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`Erro Gemini: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
      console.error(`Erro na tentativa ${attempt + 1}:`, error);
      if (attempt === GEMINI_KEYS.length * 2 - 1) throw error;
    }
  }
  throw new Error("Todas as tentativas falharam");
}

// Função principal de geração (roda em background)
async function processarGeracaoConteudo(topico_id: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Buscar tópico com dados da disciplina (incluindo complemento)
    const { data: topico, error: topicoError } = await supabase
      .from("faculdade_topicos")
      .select(`
        *,
        disciplina:faculdade_disciplinas(*)
      `)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      console.error(`[Background] Tópico ${topico_id} não encontrado`);
      return;
    }

    const disciplina = topico.disciplina;
    const complemento = topico.complemento || "";
    const tituloCompleto = complemento ? `${topico.titulo}. ${complemento}` : topico.titulo;

    // Buscar contexto de resumos relacionados
    const areasRelacionadas = {
      "Direito Civil": ["Direito Civil", "Obrigações", "Contratos"],
      "Direito do Estado": ["Direito Constitucional", "Teoria do Estado"],
      "Filosofia e Teoria Geral do Direito": ["Filosofia do Direito", "Introdução ao Direito"],
      "Direito Econômico e Financeiro": ["Economia", "Direito Econômico"],
    };

    const areas = areasRelacionadas[disciplina.departamento as keyof typeof areasRelacionadas] || [];
    
    let contextoAdicional = "";
    if (areas.length > 0) {
      const { data: resumos } = await supabase
        .from("RESUMO")
        .select("titulo, conteudo_gerado")
        .in("area", areas)
        .not("conteudo_gerado", "is", null)
        .limit(3);

      if (resumos && resumos.length > 0) {
        contextoAdicional = resumos
          .map((r) => `### ${r.titulo}\n${r.conteudo_gerado?.substring(0, 500)}...`)
          .join("\n\n");
      }
    }

    // ============ PROMPT DE CONTEÚDO ============
    const promptConteudo = `Você é um professor da Faculdade de Direito da USP, especialista em ${disciplina.departamento}.

Você está explicando o tópico "${tituloCompleto}" da disciplina "${disciplina.nome}".
${complemento ? `\nCOMPLEMENTO DO TÓPICO (deve ser abordado em profundidade): ${complemento}` : ""}

CONTEXTO DA DISCIPLINA:
- Ementa: ${disciplina.ementa}
- Objetivos: ${disciplina.objetivos}

${contextoAdicional ? `CONTEXTO ADICIONAL DE MATERIAIS RELACIONADOS:\n${contextoAdicional}\n` : ""}

Gere uma EXPLICAÇÃO COMPLETA, DIDÁTICA E RICA do tópico em Markdown.

## REGRA CRÍTICA - TÍTULO:
- NUNCA comece o conteúdo com um título que repita o nome do tópico. O título já será exibido na interface.
- A PRIMEIRA seção do conteúdo DEVE ser "## Conceito e Definição" (exatamente assim)
- ERRADO: "## ${topico.titulo}" ou "## ${topico.titulo}: Características"
- CORRETO: Começar direto com "## Conceito e Definição"

## REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:

1. **TÍTULOS**: Use ## para seções principais e ### para subseções. SEMPRE deixe uma linha em branco após cada título.

2. **PARÁGRAFOS**: SEMPRE use quebra de linha dupla (\\n\\n) entre parágrafos.

3. **CITAÇÕES DE DOUTRINA** (formato especial - use exatamente assim):
   > **Miguel Reale (2002):** "O direito subjetivo é a possibilidade de agir..."

4. **BLOCOS DE ATENÇÃO** (use para pontos importantes):
   > ⚠️ **ATENÇÃO:** Texto explicando o ponto crítico aqui.

5. **BLOCOS DE DICA** (use para memorização):
   > 💡 **DICA:** Macete ou forma de lembrar o conceito.

6. **CITAÇÕES DE LEI** (em blockquote):
   > "Art. 5º Todos são iguais perante a lei..." (CF/88)

7. **JURISPRUDÊNCIA**: Em itálico com referência:
   *"Ementa resumida do julgado"* (STF, RE 123456, Rel. Min. Fulano, 2023)

8. **TERMOS IMPORTANTES**: Em **negrito** na primeira menção.

## ESTRUTURA OBRIGATÓRIA (a primeira seção DEVE ser exatamente "Conceito e Definição"):

## Conceito e Definição

[2-3 parágrafos com definição clara, citando doutrinadores no formato especial]

## Classificações e Tipos

[Explicação das classificações com listas e tabelas quando apropriado]

## Fundamentos Teóricos

[3-4 parágrafos com citações de doutrinadores]

> **AUTOR (ano):** "citação relevante"

> ⚠️ **ATENÇÃO:** Ponto crítico que costuma cair em provas.

## Base Legal

[Artigos de lei pertinentes]

> "Art. X - texto do artigo" (Código/Lei)

## Aspectos Práticos

[2-3 parágrafos sobre aplicação prática]

> 💡 **DICA:** Forma de memorizar ou aplicar o conceito.

## Jurisprudência Relevante

[2-3 julgados importantes em itálico, com análise]

## Síntese

[Resumo dos pontos principais em 1-2 parágrafos]

REGRAS ADICIONAIS:
- NÃO inclua mapas mentais, diagramas ou blocos mermaid
- Use linguagem clara e didática, adequada a estudantes de 1º ano
- Cite doutrinadores brasileiros: **Miguel Reale**, **Sílvio Venosa**, **Maria Helena Diniz**, **Celso Bandeira de Mello**, etc.
- Use o formato especial para citações: > **AUTOR (ano):** "texto"
- Inclua pelo menos 1 bloco de ATENÇÃO e 1 bloco de DICA
- Texto com 1200-1800 palavras
- NUNCA cole texto imediatamente após títulos
- Apenas o conteúdo em Markdown, sem explicações adicionais`;

    console.log(`[Background] Gerando conteúdo para tópico ${topico_id}...`);
    const conteudo = await chamarGemini(promptConteudo);

    // ============ PROMPT DE EXEMPLOS PRÁTICOS ============
    const promptExemplos = `Você é um professor da Faculdade de Direito da USP.

Para o tópico "${tituloCompleto}" da disciplina "${disciplina.nome}", crie 3 EXEMPLOS PRÁTICOS que ilustrem o conceito.

Responda em JSON válido:
[
  {
    "titulo": "Título do exemplo",
    "situacao": "Descrição da situação prática em 2-3 frases",
    "analise": "Análise jurídica da situação aplicando o conceito estudado",
    "conclusao": "Conclusão e lição a ser aprendida"
  }
]

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando exemplos para tópico ${topico_id}...`);
    const exemplosRaw = await chamarGemini(promptExemplos);
    let exemplos = [];
    try {
      const jsonMatch = exemplosRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        exemplos = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Erro ao parsear exemplos:", e);
    }

    // ============ PROMPT DE TERMOS IMPORTANTES ============
    const promptTermos = `Você é um professor da Faculdade de Direito da USP.

Para o tópico "${tituloCompleto}" da disciplina "${disciplina.nome}", liste os 8-10 TERMOS JURÍDICOS mais importantes com suas definições.

Responda em JSON válido:
[
  {
    "termo": "Nome do termo",
    "definicao": "Definição clara e objetiva em 1-2 frases",
    "origem": "Origem etimológica ou histórica, se relevante (opcional)"
  }
]

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando termos para tópico ${topico_id}...`);
    const termosRaw = await chamarGemini(promptTermos);
    let termos = [];
    try {
      const jsonMatch = termosRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        termos = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Erro ao parsear termos:", e);
    }

    // ============ PROMPT DE FLASHCARDS ============
    const promptFlashcards = `Você é um professor da Faculdade de Direito da USP.

Para o tópico "${tituloCompleto}" da disciplina "${disciplina.nome}", crie EXATAMENTE 20 FLASHCARDS para estudo intensivo.

Responda em JSON válido:
[
  {
    "frente": "Pergunta clara e objetiva sobre o conceito",
    "verso": "Resposta completa e precisa",
    "exemplo": "Exemplo prático curto que ilustra o conceito (1-2 frases)"
  }
]

Os flashcards devem cobrir:
- Definições fundamentais (4-5 cards)
- Classificações e tipos (3-4 cards)
- Características e elementos essenciais (3-4 cards)
- Diferenças entre institutos similares (2-3 cards)
- Requisitos e pressupostos (2-3 cards)
- Aplicação prática e casos (3-4 cards)

IMPORTANTE:
- Cada flashcard DEVE ter o campo "exemplo" preenchido
- Os exemplos devem ser situações concretas do cotidiano jurídico
- Variar a dificuldade: fácil, médio e difícil

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando flashcards para tópico ${topico_id}...`);
    const flashcardsRaw = await chamarGemini(promptFlashcards, 15000);
    let flashcards = [];
    try {
      const jsonMatch = flashcardsRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Erro ao parsear flashcards:", e);
    }

    // ============ PROMPT DE QUESTÕES ============
    const promptQuestoes = `Você é um professor da Faculdade de Direito da USP elaborando uma prova.

Para o tópico "${tituloCompleto}" da disciplina "${disciplina.nome}", crie entre 15 e 20 QUESTÕES DE MÚLTIPLA ESCOLHA de alta qualidade.

Responda em JSON válido:
[
  {
    "enunciado": "Texto completo da questão, podendo incluir caso prático",
    "opcoes": ["A) Opção 1", "B) Opção 2", "C) Opção 3", "D) Opção 4"],
    "correta": 0,
    "explicacao": "Explicação detalhada: por que a alternativa correta está certa E por que cada alternativa incorreta está errada. Cite base legal ou doutrina quando aplicável.",
    "dificuldade": "facil|medio|dificil"
  }
]

DISTRIBUIÇÃO DE DIFICULDADE:
- Fácil (5-6 questões): conceitos básicos, definições diretas
- Médio (6-8 questões): aplicação de conceitos, análise de situações
- Difícil (4-6 questões): casos complexos, jurisprudência, exceções

TIPOS DE QUESTÕES A INCLUIR:
- Conceituais: "O que é...", "Define-se como..."
- Classificatórias: "Quanto à classificação...", "São espécies de..."
- De aplicação: "No caso apresentado...", "Considerando a situação..."
- Comparativas: "A diferença entre X e Y..."
- De jurisprudência/doutrina: "Segundo entendimento do STF...", "Para a doutrina majoritária..."

REGRAS:
- O campo "correta" é o índice da opção correta (0=A, 1=B, 2=C, 3=D)
- A explicação DEVE explicar TODAS as alternativas
- Incluir referências a artigos de lei quando pertinente
- Evitar pegadinhas óbvias, mas incluir distratores bem elaborados

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando questões para tópico ${topico_id}...`);
    const questoesRaw = await chamarGemini(promptQuestoes, 20000);
    let questoes = [];
    try {
      let cleanedQuestoes = questoesRaw
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const jsonMatch = cleanedQuestoes.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const fixedJson = jsonMatch[0]
          .replace(/,\s*]/g, ']')
          .replace(/,\s*}/g, '}');
        questoes = JSON.parse(fixedJson);
        console.log(`[Questões] Parseadas ${questoes.length} questões com sucesso`);
      }
    } catch (e) {
      console.error("Erro ao parsear questões:", e);
      console.log("Raw questões:", questoesRaw.substring(0, 500));
    }

    // Atualizar tópico com conteúdo gerado
    console.log(`[Background] Salvando conteúdo do tópico ${topico_id}...`);
    const { error: updateError } = await supabase
      .from("faculdade_topicos")
      .update({
        conteudo_gerado: conteudo,
        exemplos,
        termos,
        flashcards,
        questoes,
        status: "concluido",
        updated_at: new Date().toISOString()
      })
      .eq("id", topico_id);

    if (updateError) {
      throw new Error(`Erro ao atualizar tópico: ${updateError.message}`);
    }

    console.log(`[Background] Conteúdo do tópico ${topico_id} salvo com sucesso!`);

    // Gerar capa do tópico
    try {
      console.log(`[Capa] Iniciando geração de capa para tópico ${topico_id}...`);
      
      const capaResponse = await fetch(
        `${supabaseUrl}/functions/v1/gerar-capa-topico-faculdade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ topico_id })
        }
      );
      
      if (capaResponse.ok) {
        const capaResult = await capaResponse.json();
        console.log("[Capa] Capa gerada com sucesso:", capaResult);
      } else {
        console.error("[Capa] Erro ao gerar capa:", await capaResponse.text());
      }
    } catch (capaError) {
      console.error("[Capa] Erro ao iniciar geração de capa:", capaError);
    }

    // Gerar narração do tópico
    try {
      console.log(`[Narração] Iniciando geração de narração para tópico ${topico_id}...`);
      
      const narracaoResponse = await fetch(
        `${supabaseUrl}/functions/v1/gerar-narracao-faculdade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ 
            topico_id, 
            conteudo,
            titulo: topico.titulo 
          })
        }
      );
      
      if (narracaoResponse.ok) {
        const narracaoResult = await narracaoResponse.json();
        console.log("[Narração] Narração gerada com sucesso:", narracaoResult);
      } else {
        console.error("[Narração] Erro ao gerar narração:", await narracaoResponse.text());
      }
    } catch (narracaoError) {
      console.error("[Narração] Erro ao iniciar geração de narração:", narracaoError);
    }

    console.log(`[Background] ✅ Geração completa do tópico ${topico_id} finalizada!`);
  } catch (error) {
    console.error(`[Background] ❌ Erro na geração do tópico ${topico_id}:`, error);
    
    // Em caso de erro, marcar como pendente para permitir nova tentativa
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    await supabase
      .from("faculdade_topicos")
      .update({ status: "pendente" })
      .eq("id", topico_id);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id } = await req.json();
    
    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se o tópico existe
    const { data: topico, error: topicoError } = await supabase
      .from("faculdade_topicos")
      .select("id, titulo, status")
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se já está gerando ou concluído, não iniciar novamente
    if (topico.status === "gerando") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Geração já está em andamento",
          topico_id,
          status: "gerando"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "concluido") {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Conteúdo já foi gerado",
          topico_id,
          status: "concluido"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Marcar como gerando IMEDIATAMENTE
    await supabase
      .from("faculdade_topicos")
      .update({ status: "gerando" })
      .eq("id", topico_id);

    console.log(`[Main] Tópico ${topico_id} marcado como 'gerando'. Iniciando processamento em background...`);

    // Iniciar geração em background usando EdgeRuntime.waitUntil
    // Isso permite que a função continue executando mesmo após retornar a resposta
    EdgeRuntime.waitUntil(processarGeracaoConteudo(topico_id));

    // Retornar imediatamente para o cliente
    return new Response(
      JSON.stringify({
        success: true,
        message: "Geração iniciada em background",
        topico_id,
        titulo: topico.titulo,
        status: "gerando"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Erro ao iniciar geração:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});