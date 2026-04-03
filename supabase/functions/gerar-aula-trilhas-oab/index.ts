import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumoData {
  id: number;
  area: string;
  tema: string;
  subtema: string;
  conteudo: string;
  url_imagem_resumo?: string;
}

// Pool de chaves API com fallback
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

// Função para extrair artigos mencionados no conteúdo base
function extrairArtigosDoConteudo(conteudo: string): string[] {
  const regex = /Art\.?\s*\d+[°ºª]?(\s*,?\s*(§|par[aá]grafo|inciso|al[ií]nea)?\s*[\dIVXivx]+)?/gi;
  const matches = conteudo.match(regex) || [];
  return [...new Set(matches)];
}

// Função para extrair citações de leis do conteúdo
function extrairLeisDoConteudo(conteudo: string): string[] {
  const regexLeis = /(Lei\s*n?[°º]?\s*[\d\.]+\/?\d*|Decreto\s*n?[°º]?\s*[\d\.]+|C[óo]digo\s+(Civil|Penal|Processo|Trabalho|Consumidor|Tributário|El[ae]itoral)|(CF|Constitui[çc][ãa]o\s+Federal)|CLT|CDC|CP|CC|CPC|CPP)/gi;
  const matches = conteudo.match(regexLeis) || [];
  return [...new Set(matches)];
}

// Chamada à API Gemini com fallback entre múltiplas chaves
async function callGeminiWithFallback(prompt: string, systemPrompt: string): Promise<string> {
  if (GEMINI_KEYS.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }

  for (let attempt = 0; attempt < GEMINI_KEYS.length; attempt++) {
    const apiKey = GEMINI_KEYS[attempt];
    
    try {
      console.log(`Tentando com chave ${attempt + 1}/${GEMINI_KEYS.length}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8000,
            }
          }),
        }
      );

      if (response.status === 429) {
        console.log(`Rate limit na chave ${attempt + 1}, tentando próxima...`);
        continue;
      }

      if (response.status === 400) {
        const errorText = await response.text();
        console.log(`Erro 400 na chave ${attempt + 1}: ${errorText.substring(0, 100)}, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Gemini: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Resposta vazia da IA');
      }
      
      return content;
    } catch (error) {
      console.error(`Erro na tentativa ${attempt + 1}:`, error);
      if (attempt === GEMINI_KEYS.length - 1) {
        throw error;
      }
    }
  }

  throw new Error('Todas as chaves API falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumoId } = await req.json();

    if (!resumoId) {
      throw new Error('resumoId é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados do resumo
    const { data: resumo, error: resumoError } = await supabase
      .from('RESUMO')
      .select('id, area, tema, subtema, conteudo, url_imagem_resumo')
      .eq('id', resumoId)
      .single();

    if (resumoError || !resumo) {
      throw new Error(`Resumo não encontrado: ${resumoError?.message}`);
    }

    // Verificar cache primeiro
    const { data: cached } = await supabase
      .from('jornada_aulas_cache')
      .select('estrutura_completa, id')
      .eq('area', resumo.area)
      .eq('resumo_id', resumo.id)
      .single();

    if (cached) {
      return new Response(JSON.stringify({
        ...(cached.estrutura_completa as object),
        cached: true,
        aulaId: cached.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extrair artigos e leis do conteúdo base para validação
    const artigosPermitidos = extrairArtigosDoConteudo(resumo.conteudo);
    const leisPermitidas = extrairLeisDoConteudo(resumo.conteudo);
    
    console.log(`Artigos encontrados no conteúdo base: ${artigosPermitidos.length}`);
    console.log(`Leis encontradas no conteúdo base: ${leisPermitidas.length}`);

    // Gerar aula via Google Gemini API
    const prompt = buildPrompt(resumo, artigosPermitidos, leisPermitidas);

    const systemPrompt = `Você é um PROFESSOR TÉCNICO de Direito especialista em preparação para OAB.
Gere aulas TÉCNICAS e DETALHADAS com foco nos TERMOS JURÍDICOS mais cobrados na prova.

🎯 FOCO PRINCIPAL DA AULA:
- Explicar CADA TERMO JURÍDICO de forma detalhada e clara
- Definições técnicas precisas com linguagem acessível
- Como cada conceito é COBRADO em provas OAB
- Conexões e diferenças entre institutos jurídicos
- Tabelas comparativas para facilitar memorização
- Pontos de atenção mais frequentes em provas

⛔ PROIBIDO ABSOLUTAMENTE:
- STORYTELLING com personagens fictícios (Mariana, João, Pedro, etc.)
- Histórias inventadas ou narrativas ficcionais
- INVENTAR artigos de lei, jurisprudência ou doutrina
- Usar informações que NÃO estejam no CONTEÚDO BASE

✅ ESTRUTURA OBRIGATÓRIA:
- Mínimo 4 seções temáticas
- 7-8 slides por seção = aproximadamente 30 slides no total
- Priorizar slides de: termos, explicacao, tabela, atencao
- Cada seção deve terminar com quickcheck e resumo_visual

SOBRE CITAÇÕES LEGAIS:
- Use SOMENTE os artigos listados em "ARTIGOS PERMITIDOS"
- Se a lista estiver vazia, NÃO cite nenhum artigo específico

Responda APENAS com JSON válido, sem markdown ou texto adicional`;

    const content = await callGeminiWithFallback(prompt, systemPrompt);

    // Parse JSON da resposta com sanitização robusta
    let estrutura;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON não encontrado na resposta');
      
      // Sanitizar JSON para evitar erros de parse
      let jsonStr = jsonMatch[0];
      
      // Remover caracteres de controle invisíveis que a IA pode gerar
      jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
        // Preservar newlines e tabs que são válidos em strings JSON
        if (char === '\n' || char === '\r' || char === '\t') return char;
        return '';
      });
      
      // Corrigir aspas tipográficas que a IA às vezes gera
      jsonStr = jsonStr.replace(/[""]/g, '"');
      jsonStr = jsonStr.replace(/['']/g, "'");
      
      // Remover trailing commas em arrays e objetos (erro comum da IA)
      jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');
      
      estrutura = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      console.error('Content sample (first 500 chars):', content.substring(0, 500));
      console.error('Content sample (last 500 chars):', content.substring(content.length - 500));
      throw new Error('Erro ao processar resposta da IA - JSON inválido');
    }

    // Adicionar metadados
    estrutura.versao = 2;
    estrutura.area = resumo.area;

    // Salvar no cache
    const { data: savedCache, error: cacheError } = await supabase
      .from('jornada_aulas_cache')
      .insert({
        area: resumo.area,
        resumo_id: resumo.id,
        tema: resumo.subtema,
        estrutura_completa: estrutura
      })
      .select('id')
      .single();

    if (cacheError) {
      console.error('Cache error:', cacheError);
    }

    return new Response(JSON.stringify({
      ...estrutura,
      cached: false,
      aulaId: savedCache?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildPrompt(resumo: ResumoData, artigosPermitidos: string[], leisPermitidas: string[]): string {
  const listaArtigos = artigosPermitidos.length > 0 
    ? `ARTIGOS PERMITIDOS (USE SOMENTE ESTES, NENHUM OUTRO): ${artigosPermitidos.join(', ')}`
    : '⛔ NENHUM ARTIGO ESPECÍFICO ENCONTRADO - PROIBIDO CITAR QUALQUER ARTIGO DE LEI';
    
  const listaLeis = leisPermitidas.length > 0
    ? `LEIS/CÓDIGOS MENCIONADOS: ${leisPermitidas.join(', ')}`
    : 'NENHUMA LEI ESPECÍFICA MENCIONADA';

  return `Crie uma aula TÉCNICA DETALHADA sobre "${resumo.subtema}" da área "${resumo.area}".

⛔⛔⛔ PROIBIÇÕES ABSOLUTAS ⛔⛔⛔
1. NENHUM STORYTELLING - não use personagens fictícios
2. NENHUMA HISTÓRIA INVENTADA - foque apenas em conteúdo técnico
3. NÃO INVENTE artigos de lei, jurisprudência ou doutrina
4. Se não tem no conteúdo base, NÃO ADICIONE

CONTEÚDO ORIGINAL (ÚNICA FONTE DE VERDADE):
${resumo.conteudo}

${listaArtigos}
${listaLeis}

ESTRUTURA OBRIGATÓRIA - AULA TÉCNICA COM ~30 SLIDES:

Gere exatamente 4 seções, cada uma com 7-8 slides técnicos:

{
  "titulo": "Título técnico e claro",
  "tempoEstimado": "40-50 min",
  "descricao": "O que será aprendido nesta aula técnica",
  "objetivos": ["Objetivo técnico 1", "Objetivo técnico 2", "Objetivo técnico 3", "Objetivo técnico 4"],
  "secoes": [
    {
      "id": 1,
      "tipo": "caput",
      "trechoOriginal": "Trecho relevante do conteúdo",
      "titulo": "Parte 1: Conceitos Fundamentais",
      "slides": [
        {
          "tipo": "texto",
          "titulo": "Introdução ao Tema",
          "conteudo": "Explicação técnica introdutória sobre o tema, contextualizando sua importância no Direito e na prova OAB."
        },
        {
          "tipo": "termos",
          "titulo": "Vocabulário Essencial",
          "conteudo": "Termos fundamentais que você PRECISA dominar para a OAB",
          "termos": [
            {"termo": "Termo técnico 1", "definicao": "Definição clara e completa"},
            {"termo": "Termo técnico 2", "definicao": "Definição clara e completa"},
            {"termo": "Termo técnico 3", "definicao": "Definição clara e completa"},
            {"termo": "Termo técnico 4", "definicao": "Definição clara e completa"},
            {"termo": "Termo técnico 5", "definicao": "Definição clara e completa"}
          ]
        },
        {
          "tipo": "explicacao",
          "titulo": "Entendendo os Conceitos",
          "conteudo": "Detalhamento técnico dos conceitos apresentados",
          "topicos": [
            {"titulo": "Aspecto 1", "detalhe": "Explicação técnica detalhada"},
            {"titulo": "Aspecto 2", "detalhe": "Explicação técnica detalhada"},
            {"titulo": "Aspecto 3", "detalhe": "Explicação técnica detalhada"},
            {"titulo": "Aspecto 4", "detalhe": "Explicação técnica detalhada"}
          ]
        },
        {
          "tipo": "tabela",
          "titulo": "Quadro Comparativo",
          "conteudo": "Comparação para facilitar memorização",
          "tabela": {
            "cabecalhos": ["Critério", "Instituto A", "Instituto B"],
            "linhas": [
              ["Definição", "...", "..."],
              ["Características", "...", "..."],
              ["Aplicação", "...", "..."],
              ["Consequências", "...", "..."]
            ]
          }
        },
        {
          "tipo": "atencao",
          "titulo": "⚠️ Ponto Mais Cobrado na OAB",
          "conteudo": "Este aspecto é frequentemente cobrado em provas: [explicação técnica do ponto de atenção]"
        },
        {
          "tipo": "dica_estudo",
          "titulo": "Dica de Memorização",
          "conteudo": "Técnica para lembrar este conceito",
          "tecnica": "Mnemônico",
          "dica": "Frase ou técnica para memorizar o conceito chave"
        },
        {
          "tipo": "resumo_visual",
          "titulo": "Resumo da Seção",
          "conteudo": "Pontos-chave desta parte",
          "pontos": [
            "Ponto essencial 1",
            "Ponto essencial 2",
            "Ponto essencial 3",
            "Ponto essencial 4"
          ]
        },
        {
          "tipo": "quickcheck",
          "titulo": "Verificação de Aprendizado",
          "conteudo": "Teste seu conhecimento",
          "pergunta": "Pergunta técnica sobre o conteúdo da seção",
          "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
          "resposta": 0,
          "feedback": "Explicação técnica da resposta correta"
        }
      ]
    },
    {
      "id": 2,
      "tipo": "inciso",
      "trechoOriginal": "Outro trecho relevante",
      "titulo": "Parte 2: Características e Aplicação",
      "slides": [
        {"tipo": "texto", "titulo": "Características Principais", "conteudo": "Explicação das características..."},
        {"tipo": "termos", "titulo": "Mais Termos Importantes", "conteudo": "Continue dominando o vocabulário", "termos": [{"termo": "...", "definicao": "..."}]},
        {"tipo": "explicacao", "titulo": "Aplicação Prática", "conteudo": "Como aplicar...", "topicos": [{"titulo": "...", "detalhe": "..."}]},
        {"tipo": "tabela", "titulo": "Diferenças Importantes", "conteudo": "Compare...", "tabela": {"cabecalhos": ["...", "...", "..."], "linhas": [["...", "...", "..."]]}},
        {"tipo": "atencao", "titulo": "⚠️ Cuidado nas Provas", "conteudo": "Pegadinha frequente..."},
        {"tipo": "exemplo", "titulo": "Caso Prático", "conteudo": "Exemplo baseado no conteúdo...", "contexto": "Aplicação profissional"},
        {"tipo": "resumo_visual", "titulo": "Resumo", "conteudo": "Pontos-chave", "pontos": ["...", "...", "..."]},
        {"tipo": "quickcheck", "titulo": "Verificação", "conteudo": "Teste", "pergunta": "...", "opcoes": ["...", "...", "...", "..."], "resposta": 0, "feedback": "..."}
      ]
    },
    {
      "id": 3,
      "tipo": "paragrafo",
      "trechoOriginal": "Mais conteúdo relevante",
      "titulo": "Parte 3: Aspectos Específicos",
      "slides": [
        {"tipo": "texto", "titulo": "Detalhamento", "conteudo": "Aspectos específicos..."},
        {"tipo": "termos", "titulo": "Terminologia Avançada", "conteudo": "Termos que diferenciam", "termos": [{"termo": "...", "definicao": "..."}]},
        {"tipo": "linha_tempo", "titulo": "Etapas/Procedimento", "conteudo": "Sequência lógica", "etapas": [{"titulo": "Etapa 1", "descricao": "..."}, {"titulo": "Etapa 2", "descricao": "..."}]},
        {"tipo": "mapa_mental", "titulo": "Conceitos Relacionados", "conteudo": "Conexões importantes", "conceitos": [{"central": "Conceito principal", "relacionados": ["Relacionado 1", "Relacionado 2", "Relacionado 3"]}]},
        {"tipo": "atencao", "titulo": "⚠️ Distinção Importante", "conteudo": "Não confunda..."},
        {"tipo": "tabela", "titulo": "Resumo Comparativo", "conteudo": "Síntese...", "tabela": {"cabecalhos": ["...", "...", "..."], "linhas": [["...", "...", "..."]]}},
        {"tipo": "resumo_visual", "titulo": "Resumo", "conteudo": "Pontos-chave", "pontos": ["...", "...", "..."]},
        {"tipo": "quickcheck", "titulo": "Verificação", "conteudo": "Teste", "pergunta": "...", "opcoes": ["...", "...", "...", "..."], "resposta": 0, "feedback": "..."}
      ]
    },
    {
      "id": 4,
      "tipo": "alinea",
      "trechoOriginal": "Conteúdo de consolidação",
      "titulo": "Parte 4: Revisão e Consolidação",
      "slides": [
        {"tipo": "texto", "titulo": "Síntese Geral", "conteudo": "Revisão dos principais pontos..."},
        {"tipo": "termos", "titulo": "Glossário Completo", "conteudo": "Todos os termos essenciais", "termos": [{"termo": "...", "definicao": "..."}]},
        {"tipo": "tabela", "titulo": "Quadro-Resumo Final", "conteudo": "Síntese visual", "tabela": {"cabecalhos": ["Conceito", "Definição", "Aplicação"], "linhas": [["...", "...", "..."]]}},
        {"tipo": "atencao", "titulo": "⚠️ Checklist para a Prova", "conteudo": "Antes da prova, lembre-se..."},
        {"tipo": "dica_estudo", "titulo": "Estratégia de Revisão", "conteudo": "Como revisar efetivamente", "tecnica": "Revisão espaçada", "dica": "Revise este tema em 1, 3 e 7 dias"},
        {"tipo": "resumo_visual", "titulo": "Resumo Final", "conteudo": "O essencial para a OAB", "pontos": ["...", "...", "...", "...", "..."]},
        {"tipo": "quickcheck", "titulo": "Desafio Final", "conteudo": "Última verificação", "pergunta": "Questão desafiadora...", "opcoes": ["...", "...", "...", "..."], "resposta": 0, "feedback": "..."}
      ]
    }
  ],
  "atividadesFinais": {
    "matching": [
      {"termo": "Termo 1", "definicao": "Definição 1"},
      {"termo": "Termo 2", "definicao": "Definição 2"},
      {"termo": "Termo 3", "definicao": "Definição 3"},
      {"termo": "Termo 4", "definicao": "Definição 4"},
      {"termo": "Termo 5", "definicao": "Definição 5"},
      {"termo": "Termo 6", "definicao": "Definição 6"},
      {"termo": "Termo 7", "definicao": "Definição 7"},
      {"termo": "Termo 8", "definicao": "Definição 8"}
    ],
    "flashcards": [
      {"frente": "Pergunta técnica 1", "verso": "Resposta completa", "exemplo": "Aplicação prática"},
      {"frente": "Pergunta técnica 2", "verso": "Resposta completa", "exemplo": "Aplicação prática"},
      {"frente": "Pergunta técnica 3", "verso": "Resposta completa", "exemplo": "Aplicação prática"},
      {"frente": "Pergunta técnica 4", "verso": "Resposta completa", "exemplo": "Aplicação prática"},
      {"frente": "Pergunta técnica 5", "verso": "Resposta completa", "exemplo": "Aplicação prática"},
      {"frente": "Pergunta técnica 6", "verso": "Resposta completa", "exemplo": "Aplicação prática"},
      {"frente": "Pergunta técnica 7", "verso": "Resposta completa", "exemplo": "Aplicação prática"},
      {"frente": "Pergunta técnica 8", "verso": "Resposta completa", "exemplo": "Aplicação prática"}
    ],
    "questoes": [
      {"question": "Questão técnica 1", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 0, "explicacao": "Explicação técnica"},
      {"question": "Questão técnica 2", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 1, "explicacao": "Explicação técnica"},
      {"question": "Questão técnica 3", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 2, "explicacao": "Explicação técnica"},
      {"question": "Questão técnica 4", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 3, "explicacao": "Explicação técnica"},
      {"question": "Questão técnica 5", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 0, "explicacao": "Explicação técnica"},
      {"question": "Questão técnica 6", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 1, "explicacao": "Explicação técnica"}
    ]
  },
  "provaFinal": [
    {"question": "Questão final 1 - nível OAB", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 0, "explicacao": "Explicação completa", "tempoLimite": 90},
    {"question": "Questão final 2 - nível OAB", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 1, "explicacao": "Explicação completa", "tempoLimite": 90},
    {"question": "Questão final 3 - nível OAB", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 2, "explicacao": "Explicação completa", "tempoLimite": 90},
    {"question": "Questão final 4 - nível OAB", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 3, "explicacao": "Explicação completa", "tempoLimite": 90},
    {"question": "Questão final 5 - nível OAB", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 0, "explicacao": "Explicação completa", "tempoLimite": 90},
    {"question": "Questão final 6 - desafio máximo", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctAnswer": 1, "explicacao": "Explicação completa", "tempoLimite": 120}
  ]
}

IMPORTANTE:
- Gere EXATAMENTE 4 seções com 7-8 slides cada = ~30 slides
- PRIORIZE slides de: termos, explicacao, tabela, atencao
- FOQUE nos termos mais cobrados na OAB
- NÃO USE storytelling ou histórias fictícias
- Retorne APENAS o JSON, sem markdown`;
}
