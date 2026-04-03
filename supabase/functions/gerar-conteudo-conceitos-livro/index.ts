import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
].filter(Boolean) as string[];

async function chamarGemini(prompt: string, maxTokens: number = 16000): Promise<string> {
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

// Função de fallback para destacar termos automaticamente
function aplicarDestaqueAutomatico(conteudo: string, tituloTema: string): string {
  let resultado = conteudo;
  
  // Lista extensa de termos jurídicos comuns para destacar
  const termosJuridicos = [
    // Conceitos fundamentais
    "Direito Subjetivo", "Direito Objetivo", "Direito Potestativo", "Direito Adquirido",
    "Capacidade Jurídica", "Capacidade de Fato", "Capacidade de Direito", "Capacidade Civil",
    "Personalidade Jurídica", "Pessoa Natural", "Pessoa Jurídica", "Pessoa Física",
    "Sujeito de Direito", "Objeto de Direito", "Relação Jurídica", "Fato Jurídico",
    "Ato Jurídico", "Negócio Jurídico", "Ato Ilícito", "Abuso de Direito",
    
    // Institutos
    "Posse", "Propriedade", "Usufruto", "Servidão", "Hipoteca", "Penhor", "Usucapião",
    "Prescrição", "Decadência", "Nulidade", "Anulabilidade", "Mora", "Inadimplemento",
    "Obrigação", "Contrato", "Responsabilidade Civil", "Dano Moral", "Dano Material",
    
    // Processo
    "Habeas Corpus", "Mandado de Segurança", "Ação Popular", "Ação Civil Pública",
    "Recurso", "Apelação", "Agravo", "Embargos", "Sentença", "Acórdão",
    
    // Leis e Códigos
    "Constituição Federal", "Código Civil", "Código Penal", "Código de Processo Civil",
    "Código de Defesa do Consumidor", "CLT", "Estatuto da Criança", "Lei de Execuções Penais",
    
    // Termos latinos
    "Jus", "Lex", "Pacta Sunt Servanda", "In Dubio Pro Reo", "Erga Omnes",
    "Inter Partes", "Ad Hoc", "Ex Officio", "Ope Legis", "Ipso Jure",
    
    // Princípios
    "Boa-fé", "Boa-fé Objetiva", "Função Social", "Dignidade Humana", "Legalidade",
    "Proporcionalidade", "Razoabilidade", "Segurança Jurídica", "Devido Processo Legal",
    
    // Doutrinadores famosos
    "Miguel Reale", "Pontes de Miranda", "Caio Mário", "Sílvio Venosa", "Pablo Stolze",
    "Maria Helena Diniz", "Carlos Roberto Gonçalves", "Flávio Tartuce", "Nelson Nery",
    "José Afonso da Silva", "Gilmar Mendes", "Paulo Bonavides", "Celso de Mello",
    "Kelsen", "Jhering", "Savigny", "Hart", "Dworkin", "Alexy",
    "Clóvis Beviláqua", "Teixeira de Freitas", "Orlando Gomes", "Washington de Barros",
    
    // Classificações
    "Direito Público", "Direito Privado", "Direito Material", "Direito Processual",
    "Direito Real", "Direito Pessoal", "Direito Absoluto", "Direito Relativo"
  ];
  
  // Contador para evitar duplicatas excessivas
  const termosUsados: Record<string, number> = {};
  
  for (const termo of termosJuridicos) {
    // Pular se já foi destacado no texto original
    if (resultado.includes(`[[${termo}]]`)) {
      termosUsados[termo.toLowerCase()] = 3;
      continue;
    }
    
    // Criar regex case-insensitive que não pega termos já destacados
    const regex = new RegExp(`(?<!\\[\\[)\\b(${termo})\\b(?!\\]\\])`, 'gi');
    
    resultado = resultado.replace(regex, (match) => {
      const termoLower = termo.toLowerCase();
      termosUsados[termoLower] = (termosUsados[termoLower] || 0) + 1;
      
      // Destacar apenas as 2 primeiras ocorrências de cada termo
      if (termosUsados[termoLower] <= 2) {
        return `[[${match}]]`;
      }
      return match;
    });
  }
  
  return resultado;
}

// Declaração para TypeScript reconhecer EdgeRuntime
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

async function processarConteudoBackground(temaId: string) {
  console.log(`[Background] Iniciando processamento do tema ${temaId}`);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Buscar informações do tema
    const { data: tema, error: temaError } = await supabase
      .from('conceitos_livro_temas')
      .select('*')
      .eq('id', temaId)
      .single();

    if (temaError || !tema) {
      throw new Error(`Tema não encontrado: ${temaError?.message}`);
    }

    // Atualizar status para "gerando"
    await supabase
      .from('conceitos_livro_temas')
      .update({ status: 'gerando' })
      .eq('id', temaId);

    // Buscar páginas do tema
    const { data: paginas, error: paginasError } = await supabase
      .from('conceitos_livro_paginas')
      .select('pagina, conteudo')
      .eq('trilha', tema.trilha)
      .gte('pagina', tema.pagina_inicial)
      .lte('pagina', tema.pagina_final)
      .order('pagina');

    if (paginasError || !paginas?.length) {
      throw new Error(`Páginas não encontradas: ${paginasError?.message}`);
    }

    console.log(`Páginas ${tema.pagina_inicial}-${tema.pagina_final} carregadas (${paginas.length} páginas)`);

    // Concatenar conteúdo das páginas
    const conteudoCompleto = paginas.map(p => p.conteudo).join('\n\n');
    console.log(`[Background] Conteúdo total: ${conteudoCompleto.length} caracteres`);

    // ============ PROMPT DE CONTEÚDO (ESTRUTURA DINÂMICA BASEADA NO CONTEÚDO) ============
    
    // Calcular número dinâmico de seções baseado no tamanho do conteúdo
    const tamConteudo = conteudoCompleto.length;
    const minSecoes = 5;
    const maxSecoes = 15;
    const secoesRecomendadas = Math.min(maxSecoes, Math.max(minSecoes, Math.floor(tamConteudo / 3000)));
    
    console.log(`[Background] Conteúdo: ${tamConteudo} chars -> ${secoesRecomendadas} seções recomendadas`);
    
    const promptConteudo = `## ⚠️ INSTRUÇÃO CRÍTICA - DESTAQUE DE TERMOS (OBRIGATÓRIO):

Você DEVE usar a sintaxe [[termo]] para destacar TODOS os termos jurídicos importantes no texto.
Esta é uma funcionalidade ESSENCIAL - o texto final DEVE conter entre 25 e 50 termos destacados.

### EXEMPLOS CORRETOS DE COMO DESTACAR:
- "A história do [[Direito Subjetivo]] é ligada à evolução do [[Direito Romano]]."
- "[[Miguel Reale]] definiu como um poder de agir conforme as normas."
- "O conceito de [[capacidade jurídica]] pressupõe a [[personalidade jurídica]]."
- "O [[habeas corpus]] é garantia prevista na [[Constituição Federal]]."
- "A [[posse]] difere da [[propriedade]] em seus elementos constitutivos."
- "Segundo [[Pontes de Miranda]], o [[direito potestativo]] não admite contestação."

### O QUE VOCÊ DEVE DESTACAR (mínimo 25 termos):
✅ CONCEITOS JURÍDICOS: [[Direito Subjetivo]], [[capacidade]], [[personalidade jurídica]], [[posse]], [[propriedade]]
✅ DOUTRINADORES/FILÓSOFOS: [[Miguel Reale]], [[Kelsen]], [[Pontes de Miranda]], [[Caio Mário]], [[Jhering]]
✅ INSTITUTOS JURÍDICOS: [[habeas corpus]], [[mandado de segurança]], [[usucapião]], [[servidão]]
✅ LEIS E CÓDIGOS: [[Código Civil]], [[Constituição Federal]], [[CLT]], [[Código Penal]]
✅ TERMOS LATINOS: [[jus]], [[lex]], [[pacta sunt servanda]], [[in dubio pro reo]]
✅ CLASSIFICAÇÕES: [[direito potestativo]], [[obrigação natural]], [[negócio jurídico]]
✅ PRINCÍPIOS: [[boa-fé]], [[função social]], [[dignidade humana]]

### O QUE NÃO DESTACAR:
❌ Palavras comuns (pessoa, lei, direito quando genérico)
❌ Conectivos e preposições
❌ O mesmo termo mais de 3 vezes no texto

---

Você é um professor de Direito especializado em criar material didático de alta qualidade.

## CONTEÚDO ORIGINAL DO LIVRO (FONTE PRIMÁRIA - USE 100%):
${conteudoCompleto}

---

## SUA TAREFA:
Transforme o conteúdo acima sobre "${tema.titulo}" em uma EXPLICAÇÃO DIDÁTICA COMPLETA em Markdown.
LEMBRE-SE: Use [[termo]] para destacar TODOS os termos jurídicos importantes!

## REGRA CRÍTICA DE FIDELIDADE AO CONTEÚDO:
1. USE 100% do conteúdo original - NADA pode ser omitido
2. EXTRAIA TODOS os conceitos, definições, classificações e explicações do texto
3. O conteúdo gerado deve cobrir TODOS os pontos abordados no material original
4. NÃO resuma excessivamente - mantenha a profundidade do original
5. Use as próprias palavras e explicações do texto quando possível
6. Citações doutrinárias são COMPLEMENTARES, NUNCA substituem o conteúdo original

## ESTRUTURA DINÂMICA (${minSecoes} a ${maxSecoes} SEÇÕES):

Analise o conteúdo original e identifique os SUB-TÓPICOS NATURAIS presentes no texto.

### SEÇÕES OBRIGATÓRIAS:
1. **## O Que É** - Definição clara (DEVE ser a primeira seção)
2. **## Síntese Final** - Resumo em bullets (DEVE ser a última seção)

### SEÇÕES DINÂMICAS (incluir conforme o conteúdo):
- **## Contexto Histórico** - SE houver evolução histórica
- **## Fundamento Legal** - SE houver artigos de lei citados
- **## Características Essenciais** - SE houver elementos distintivos
- **## Classificações** - SE houver tipos ou espécies
- **## Elementos/Requisitos** - SE houver requisitos
- **## Natureza Jurídica** - SE for discutida no texto
- **## Efeitos** - SE houver consequências jurídicas
- **## Exceções** - SE houver exceções
- **## Visão Doutrinária** - Para citações complementares
- **## Na Prática** - Exemplos práticos
- **## Pontos de Atenção** - Alertas sobre erros comuns

## DOUTRINADORES PARA CITAÇÕES:
- **Teoria Geral**: Tércio Sampaio Ferraz Jr., Paulo Nader, Maria Helena Diniz
- **Filosofia**: Miguel Reale, Chaïm Perelman, Rudolf von Jhering
- **Civil**: Sílvio de Salvo Venosa, Caio Mário, Pablo Stolze
- **Constitucional**: José Afonso da Silva, Gilmar Mendes
- **Clássicos**: Pontes de Miranda, Clóvis Beviláqua

## BLOCOS ESPECIAIS:
> 📌 **EM RESUMO:** Síntese do conceito.
> 🎯 **VOCÊ SABIA?** Curiosidade interessante.
> 💼 **CASO PRÁTICO:** Situação real de aplicação.
> 💡 **DICA DE PROVA:** Macete para memorização.
> ⚠️ **ATENÇÃO:** Ponto que gera confusão.

## CITAÇÕES DE DOUTRINA:
> **Autor (ano):** "Citação relevante..."

## RESULTADO ESPERADO:
- Texto com 3000-4000 palavras
- ${secoesRecomendadas} seções aproximadamente
- MÍNIMO 25 termos destacados com [[termo]]
- Linguagem clara e didática
- 100% do conteúdo original transformado`;

    console.log(`[Background] Gerando conteúdo...`);
    let conteudo = await chamarGemini(promptConteudo, 20000);

    // ============ VALIDAÇÃO E FALLBACK DE DESTAQUE DE TERMOS ============
    const termosDestacados = (conteudo.match(/\[\[[^\]]+\]\]/g) || []);
    const termosCount = termosDestacados.length;
    console.log(`[Background] Termos destacados encontrados: ${termosCount}`);

    if (termosCount < 15) {
      console.log(`[Background] Poucos termos (${termosCount}), aplicando destaque automático...`);
      conteudo = aplicarDestaqueAutomatico(conteudo, tema.titulo);
      const novosTermos = (conteudo.match(/\[\[[^\]]+\]\]/g) || []).length;
      console.log(`[Background] Após fallback: ${novosTermos} termos destacados`);
    }

    // ============ PROMPT DE EXEMPLOS PRÁTICOS ============
    const promptExemplos = `Você é um professor de Direito.

Para o tema "${tema.titulo}", crie 3 EXEMPLOS PRÁTICOS que ilustrem o conceito.

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

    console.log(`[Background] Gerando exemplos...`);
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
    const promptTermos = `Você é um professor de Direito.

Para o tema "${tema.titulo}", liste os 8-10 TERMOS JURÍDICOS mais importantes com suas definições.

Responda em JSON válido:
[
  {
    "termo": "Nome do termo",
    "definicao": "Definição clara e objetiva em 1-2 frases",
    "origem": "Origem etimológica ou histórica, se relevante (opcional)"
  }
]

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando termos...`);
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
    const promptFlashcards = `Você é um professor de Direito.

Para o tema "${tema.titulo}", crie EXATAMENTE 20 FLASHCARDS para estudo intensivo.

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

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando flashcards...`);
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
    const promptQuestoes = `Você é um professor de Direito elaborando uma prova.

Para o tema "${tema.titulo}", crie entre 15 e 20 QUESTÕES DE MÚLTIPLA ESCOLHA de alta qualidade.

Responda em JSON válido:
[
  {
    "enunciado": "Texto completo da questão, podendo incluir caso prático",
    "opcoes": ["A) Opção 1", "B) Opção 2", "C) Opção 3", "D) Opção 4"],
    "correta": 0,
    "explicacao": "Explicação detalhada: por que a alternativa correta está certa E por que cada alternativa incorreta está errada.",
    "dificuldade": "facil|medio|dificil"
  }
]

REGRAS:
- O campo "correta" é o índice da opção correta (0=A, 1=B, 2=C, 3=D)
- A explicação DEVE explicar TODAS as alternativas
- Incluir referências a artigos de lei quando pertinente

Apenas o JSON, sem texto adicional.`;

    console.log(`[Background] Gerando questões...`);
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
    }

    // Atualizar tema com conteúdo gerado
    console.log(`[Background] Salvando conteúdo do tema ${temaId}...`);
    const { error: updateError } = await supabase
      .from('conceitos_livro_temas')
      .update({
        conteudo_markdown: conteudo,
        exemplos: JSON.stringify(exemplos),
        termos,
        flashcards,
        questoes,
        status: 'concluido',
        updated_at: new Date().toISOString()
      })
      .eq('id', temaId);

    if (updateError) {
      throw new Error(`Erro ao salvar conteúdo: ${updateError.message}`);
    }

    console.log(`[Background] Conteúdo do tema ${temaId} salvo com sucesso!`);
    console.log(`   - Exemplos: ${exemplos.length}`);
    console.log(`   - Termos: ${termos.length}`);
    console.log(`   - Flashcards: ${flashcards.length}`);
    console.log(`   - Questões: ${questoes.length}`);

    // Gerar capa do tema
    try {
      console.log(`[Capa] Iniciando geração de capa para tema ${temaId}...`);
      
      const capaResponse = await fetch(
        `${supabaseUrl}/functions/v1/gerar-capa-conceitos-livro`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ temaId })
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

    console.log(`[Background] ✅ Geração completa do tema ${temaId} finalizada!`);

  } catch (error) {
    console.error("[Background] Erro no processamento:", error);
    
    // Marcar como erro
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await supabase.from('conceitos_livro_temas').update({ status: 'erro' }).eq('id', temaId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { temaId } = await req.json();
    
    if (!temaId) {
      throw new Error("ID do tema não fornecido");
    }

    console.log(`[gerar-conteudo-conceitos-livro] Recebida requisição para tema ${temaId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se o tema existe
    const { data: tema, error: temaError } = await supabase
      .from('conceitos_livro_temas')
      .select('id, titulo, status')
      .eq('id', temaId)
      .single();

    if (temaError || !tema) {
      throw new Error(`Tema não encontrado: ${temaError?.message}`);
    }

    // Se já está gerando, retornar status
    if (tema.status === 'gerando') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Conteúdo já está sendo gerado em segundo plano",
          status: 'gerando'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Marcar como gerando imediatamente
    await supabase
      .from('conceitos_livro_temas')
      .update({ status: 'gerando' })
      .eq('id', temaId);

    // Iniciar processamento em background
    EdgeRuntime.waitUntil(processarConteudoBackground(temaId));

    // Retornar resposta imediata
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Geração de conteúdo iniciada em segundo plano. O conteúdo será exibido automaticamente quando estiver pronto.",
        status: 'gerando'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[gerar-conteudo-conceitos-livro] Erro:", error);
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
