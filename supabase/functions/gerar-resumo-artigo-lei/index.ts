import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const REVISION = "v2.4.0";
const MODEL = "gemini-2.5-flash-lite";
const PROMPT_VERSION = "v3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeamento de nome da tabela para nome da área nos resumos
const getAreaName = (tableName: string): string => {
  const mapping: Record<string, string> = {
    "CP - Código Penal": "Código Penal",
    "CC - Código Civil": "Código Civil",
    "CF - Constituição Federal": "Constituição Federal",
    "CPC – Código de Processo Civil": "Código de Processo Civil",
    "CPP – Código de Processo Penal": "Código de Processo Penal",
    "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
    "CLT - Consolidação das Leis do Trabalho": "CLT",
    "CTN – Código Tributário Nacional": "Código Tributário Nacional",
    "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
    "CE – Código Eleitoral": "Código Eleitoral",
    "CPM – Código Penal Militar": "Código Penal Militar",
    "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
    "CA - Código de Águas": "Código de Águas",
    "CBA Código Brasileiro de Aeronáutica": "Código Brasileiro de Aeronáutica",
    "CBT Código Brasileiro de Telecomunicações": "Código de Telecomunicações",
    "CCOM – Código Comercial": "Código Comercial",
    "CDM – Código de Minas": "Código de Minas",
    "ESTATUTO - ECA": "ECA",
    "ESTATUTO - IDOSO": "Estatuto do Idoso",
    "ESTATUTO - OAB": "Estatuto da OAB",
    "ESTATUTO - PESSOA COM DEFICIÊNCIA": "Estatuto da Pessoa com Deficiência",
    "ESTATUTO - IGUALDADE RACIAL": "Estatuto da Igualdade Racial",
    "ESTATUTO - CIDADE": "Estatuto da Cidade",
    "ESTATUTO - TORCEDOR": "Estatuto do Torcedor",
    "Lei 7.210 de 1984 - Lei de Execução Penal": "Lei de Execução Penal",
    "LCP - Lei das Contravenções Penais": "Lei das Contravenções Penais",
    "Lei 11.343 de 2006 - Lei de Drogas": "Lei de Drogas",
    "Lei 11.340 de 2006 - Maria da Penha": "Lei Maria da Penha",
    "Lei 8.072 de 1990 - Crimes Hediondos": "Crimes Hediondos",
    "Lei 9.455 de 1997 - Tortura": "Lei de Tortura",
    "Lei 12.850 de 2013 - Organizações Criminosas": "Organizações Criminosas",
    "LLD - Lei de Lavagem de Dinheiro": "Lavagem de Dinheiro",
    "Lei 9.296 de 1996 - Interceptação Telefônica": "Interceptação Telefônica",
    "Lei 13.869 de 2019 - Abuso de Autoridade": "Abuso de Autoridade",
    "Lei 9.099 de 1995 - Juizados Especiais": "Juizados Especiais",
    "ESTATUTO - DESARMAMENTO": "Estatuto do Desarmamento",
    "LEI 8213 - Benefícios": "Lei de Benefícios",
    "LEI 8212 - Custeio": "Lei de Custeio",
    "SÚMULAS STF": "Súmulas STF",
    "SÚMULAS VINCULANTES": "Súmulas Vinculantes",
    "SÚMULAS STJ": "Súmulas STJ",
    "SÚMULAS TST": "Súmulas TST",
    "SÚMULAS TSE": "Súmulas TSE",
    "SÚMULAS STM": "Súmulas STM",
    "ENUNCIADOS CNJ": "Enunciados CNJ",
    "ENUNCIADOS CNMP": "Enunciados CNMP",
  };
  return mapping[tableName] || tableName;
};

// 🔑 USANDO ROTAÇÃO ROUND-ROBIN DE CHAVES GEMINI
import { getRotatedGeminiKeys } from "../_shared/gemini-keys.ts";
const GEMINI_KEYS_INFO = getRotatedGeminiKeys(true);

async function chamarGemini(prompt: string, promptType: string): Promise<string> {
  let lastError: Error | null = null;
  
  for (const keyInfo of GEMINI_KEYS_INFO) {
    const API_KEY = keyInfo.key;

    console.log(`📝 Chamando Gemini para ${promptType} com chave ${keyInfo.name}...`);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8000 }
        }),
      });
      
      if (response.status === 429 || response.status === 503) {
        console.log(`⚠️ Chave ${keyInfo.name} rate limited (${response.status}), tentando próxima...`);
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro ${response.status} com chave ${keyInfo.name}:`, errorText.substring(0, 200));
        lastError = new Error(`Erro na API Gemini: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`✅ ${promptType} gerado com sucesso usando ${keyInfo.name} (${result.length} chars)`);
      return result;
    } catch (err) {
      console.error(`❌ Erro com chave ${keyInfo.name}:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }
  
  throw lastError || new Error('Nenhuma chave Gemini disponível');
}

serve(async (req) => {
  console.log(`📍 Function: gerar-resumo-artigo-lei@${REVISION} | Model: ${MODEL}`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, artigo } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const areaName = getAreaName(tableName);

    console.log(`🚀 Gerando resumo para ${areaName} - Art. ${artigo}`);

    // Verificar se já existe resumo para este artigo
    const { data: existing } = await supabase
      .from("RESUMOS_ARTIGOS_LEI")
      .select("id, resumo_markdown, exemplos, termos, url_imagem_resumo, url_audio_resumo")
      .eq("area", areaName)
      .eq("tema", artigo)
      .limit(1);

    if (existing && existing.length > 0 && existing[0].resumo_markdown) {
      console.log(`✅ Resumo já existe para ${areaName} Art. ${artigo}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          cached: true, 
          artigo,
          resumo: existing[0].resumo_markdown,
          exemplos: existing[0].exemplos,
          termos: existing[0].termos,
          url_imagem_resumo: existing[0].url_imagem_resumo,
          url_audio_resumo: existing[0].url_audio_resumo
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar conteúdo do artigo
    const { data: artigosData, error: artigoError } = await supabase
      .from(tableName)
      .select('"Artigo", "Número do Artigo", id')
      .eq('"Número do Artigo"', artigo);

    if (artigoError || !artigosData || artigosData.length === 0) {
      console.error(`❌ Artigo não encontrado: ${artigo}`, artigoError);
      return new Response(
        JSON.stringify({ success: false, error: "Artigo não encontrado", artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Combinar conteúdo de todos os artigos com mesmo número
    const contents = artigosData
      .filter((a: any) => a.Artigo)
      .map((a: any) => a.Artigo);
    
    if (contents.length === 0) {
      console.error(`❌ Artigo sem conteúdo: ${artigo}`);
      return new Response(
        JSON.stringify({ success: false, error: "Artigo sem conteúdo", artigo }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = contents.length === 1 
      ? contents[0] 
      : contents.map((c: string, i: number) => `[Versão ${i + 1}]\n${c}`).join('\n\n');
    
    console.log(`📄 Encontrado(s) ${artigosData.length} registro(s) para Art. ${artigo}`);

    // ====== PERPLEXITY: buscar referências reais na internet ======
    let referenciasWeb = '';
    let citationsFormatted = '';
    try {
      const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
      if (PERPLEXITY_API_KEY) {
        console.log(`🔍 Buscando referências via Perplexity para ${areaName} Art. ${artigo}...`);
        const perplexityRes = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              { role: 'system', content: 'Você é um assistente jurídico brasileiro especializado. Busque súmulas, jurisprudência e decisões relevantes dos tribunais superiores (STF, STJ, TSE, TST, STM). Cite as fontes com URLs quando disponíveis. Seja objetivo e liste apenas referências reais e verificáveis.' },
              { role: 'user', content: `Quais súmulas, jurisprudências e decisões dos tribunais superiores brasileiros são aplicáveis ao Art. ${artigo} do ${areaName}? Texto do artigo: "${content.substring(0, 800)}". Liste as mais relevantes com fontes.` }
            ],
          }),
        });

        if (perplexityRes.ok) {
          const perplexityData = await perplexityRes.json();
          referenciasWeb = perplexityData.choices?.[0]?.message?.content || '';
          const citations = perplexityData.citations || [];
          if (citations.length > 0) {
            citationsFormatted = citations.map((url: string, i: number) => `[${i + 1}] ${url}`).join('\n');
          }
          console.log(`✅ Perplexity retornou ${referenciasWeb.length} chars, ${citations.length} citações`);
        } else {
          console.warn(`⚠️ Perplexity retornou ${perplexityRes.status}, continuando sem referências`);
          await perplexityRes.text();
        }
      } else {
        console.warn('⚠️ PERPLEXITY_API_KEY não configurada, gerando sem referências web');
      }
    } catch (perplexityErr) {
      console.warn('⚠️ Erro ao buscar Perplexity, continuando sem referências:', perplexityErr);
    }

    const blocoReferencias = referenciasWeb 
      ? `\n\nREFERÊNCIAS REAIS ENCONTRADAS NA INTERNET (use-as na explicação, cite com links markdown quando disponível):\n${referenciasWeb}\n\nFontes:\n${citationsFormatted}`
      : '';

    // Prompts para geração
    const promptResumo = `Você é um professor de direito especialista em preparação para OAB e concursos públicos.

Analise o artigo de lei abaixo e crie uma explicação COMPLETA e DETALHADA, organizando o conteúdo POR CADA PARTE ESTRUTURAL do artigo.

ARTIGO:
${content}
${blocoReferencias}

INSTRUÇÕES FUNDAMENTAIS:

1. ANALISE O TEXTO DO ARTIGO E IDENTIFIQUE EXATAMENTE QUAIS PARTES ESTRUTURAIS EXISTEM (caput, incisos, parágrafos, alíneas).
2. Crie uma seção ## SOMENTE para cada parte que REALMENTE EXISTE no texto do artigo.
3. Se o artigo possui APENAS o caput (sem incisos, parágrafos ou alíneas), crie SOMENTE "## Caput". NÃO invente seções extras.
4. NÃO crie seções para dispositivos que NÃO existem no texto fornecido. Isso é PROIBIDO.

FORMATO DE CADA SEÇÃO:
Para cada parte existente, use o formato ## seguido do nome da parte:
- ## Caput
- ## Inciso I (somente se existir)
- ## Inciso II (somente se existir)
- ## § 1º (somente se existir)
- ## Alínea a) (somente se existir)

CONTEÚDO DE CADA SEÇÃO:
- Explique com linguagem acessível e didática
- Identifique termos técnicos e explique cada um em **negrito**
- Aponte pegadinhas de prova relacionadas
- Cite súmulas ou jurisprudência aplicável com links markdown: [Súmula Vinculante 10](url)
- Se NÃO houver súmulas ou jurisprudência aplicável nas referências fornecidas, escreva: "Não há súmulas ou jurisprudências específicas dos tribunais superiores diretamente aplicáveis a este dispositivo."

REGRAS DE FORMATAÇÃO:
- NÃO escreva introduções como "Aqui está o resumo"
- Vá DIRETO ao conteúdo começando com ## Caput
- Use > (blockquote) para citações legais
- NÃO use tabelas nem linhas horizontais
- DUPLA QUEBRA DE LINHA entre parágrafos
- Mínimo 200 palavras por seção`;

    const promptExemplos = `INSTRUÇÃO CRÍTICA: Sua primeira palavra DEVE ser "##". NÃO escreva absolutamente NADA antes de "## Exemplo 1:".

Você é um professor de direito criando 3 EXEMPLOS PRÁTICOS DETALHADOS sobre o seguinte artigo de lei:

${content}
${blocoReferencias}

FORMATO OBRIGATÓRIO:

## Exemplo 1: [Título Descritivo do Caso]

Descreva uma situação prática COMPLETA com:
- Contexto fático detalhado (quem são as partes, o que aconteceu)
- O conflito jurídico que surgiu
- Qual dispositivo legal se aplica e POR QUÊ
- Como o tribunal decidiu (ou decidiria) o caso
- A fundamentação jurídica completa
- Se possível, cite jurisprudência real (STF, STJ, TST)

> Conforme entendimento do STJ: "citação relevante"

Ao final, explique a **lição prática** que o exemplo ensina para provas.

## Exemplo 2: [Caso com pegadinha de prova]

Crie um caso que envolva uma PEGADINHA típica de concurso/OAB sobre este artigo. Explique por que muitos candidatos erram e qual é a resposta correta.

## Exemplo 3: [Caso com jurisprudência divergente]

Crie um caso que mostre como tribunais diferentes interpretam o artigo, ou como o entendimento mudou ao longo do tempo.

REGRAS:
- Narrativa detalhada com parágrafos corridos (mínimo 300 palavras por exemplo)
- Use **negrito** para pontos-chave
- Use > para citações de jurisprudência
- NÃO use tabelas nem linhas horizontais
- DUPLA QUEBRA DE LINHA entre parágrafos`;

    const promptTermos = `INSTRUÇÃO CRÍTICA: Sua primeira palavra DEVE ser "##". NÃO escreva absolutamente NADA antes do primeiro "## ".

Você é um professor de direito criando um glossário APROFUNDADO. Analise o seguinte artigo de lei e liste de 8 a 15 TERMOS JURÍDICOS e CONCEITOS FUNDAMENTAIS presentes:

${content}

FORMATO OBRIGATÓRIO — cada termo deve ser uma seção ## separada:

## Nome do Termo

**Definição**: Explicação completa em 3-5 frases com linguagem acessível.

**Diferenciação**: Compare com termos similares que geram confusão em provas (ex: posse vs propriedade).

**Exemplo prático**: Situação real de aplicação do termo.

**Dica de prova**: Como bancas costumam cobrar este conceito (CESPE, FGV, FCC).

## Próximo Termo
(mesma estrutura)

REGRAS:
- Use ## para CADA termo (não ### nem outro formato)
- NÃO use "## Glossário Jurídico" como título
- NÃO numere os termos
- NÃO agrupe em categorias
- NÃO use tabelas nem linhas horizontais
- DUPLA QUEBRA DE LINHA entre cada termo
- Cada termo deve ter no mínimo 4 frases de explicação`;

    console.log('Chamando Gemini API...');
    
    // Gerar resumo, exemplos e termos em paralelo
    const [resumoGerado, exemplosGerados, termosGerados] = await Promise.all([
      chamarGemini(promptResumo, 'resumo'),
      chamarGemini(promptExemplos, 'exemplos'),
      chamarGemini(promptTermos, 'termos')
    ]);
    console.log('✅ Conteúdo gerado com sucesso');

    // Salvar no banco primeiro
    const resumoData: any = {
      area: areaName,
      tema: artigo,
      conteudo_original: content,
      resumo_markdown: resumoGerado,
      exemplos: exemplosGerados,
      termos: termosGerados,
      versao_prompt: PROMPT_VERSION,
      referencias_web: referenciasWeb || null,
    };

    let resumoId: number | null = null;

    // Verificar se já existe registro e atualizar ou inserir
    if (existing && existing.length > 0) {
      const { error: updateError } = await supabase
        .from("RESUMOS_ARTIGOS_LEI")
        .update(resumoData)
        .eq("id", existing[0].id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar resumo:`, updateError);
      }
      resumoId = existing[0].id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("RESUMOS_ARTIGOS_LEI")
        .insert(resumoData)
        .select("id")
        .single();

      if (insertError) {
        console.error(`❌ Erro ao salvar resumo:`, insertError);
      } else {
        resumoId = inserted?.id;
      }
    }

    console.log(`✅ Resumo salvo para ${areaName} Art. ${artigo}, ID: ${resumoId}`);

    // 🔇 GERAÇÃO DE MÍDIA DESATIVADA TEMPORARIAMENTE
    // As imagens e áudios não serão gerados automaticamente
    // Para reativar, descomente a linha abaixo:
    // if (resumoId) {
    //   generateMediaInBackground(supabase, resumoId, resumoGerado, exemplosGerados, termosGerados, areaName, artigo);
    // }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cached: false, 
        artigo,
        resumo: resumoGerado,
        exemplos: exemplosGerados,
        termos: termosGerados
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro em gerar-resumo-artigo-lei:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
