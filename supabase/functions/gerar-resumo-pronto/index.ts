import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fire-and-forget: registrar uso de tokens
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumoId, area, tema, subtema, conteudo } = await req.json();

    if (!resumoId) {
      throw new Error('resumoId é obrigatório');
    }

    // Se não tiver conteúdo, usar área/tema/subtema como contexto
    const conteudoBase = conteudo || `Tema: ${subtema || tema || 'Não especificado'}\nÁrea: ${area || 'Direito'}\n\nGere um conteúdo completo sobre este tema.`;

    console.log(`Gerando resumo para ${area} > ${tema} > ${subtema}`);

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe conteúdo gerado
    const { data: existingData, error: checkError } = await supabase
      .from('RESUMO')
      .select('conteudo_gerado')
      .eq('id', resumoId)
      .single();

    if (checkError) {
      console.error('Erro ao verificar conteúdo existente:', checkError);
    }

    // Se já existe, retornar o cache
    if (existingData?.conteudo_gerado?.markdown) {
      console.log('Retornando resumo do cache');
      return new Response(
        JSON.stringify({ 
          resumo: existingData.conteudo_gerado.markdown,
          exemplos: existingData.conteudo_gerado.exemplos || '',
          termos: existingData.conteudo_gerado.termos || '',
          fromCache: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔑 Sistema de fallback com múltiplas chaves Gemini
    const GEMINI_KEYS = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('DIREITO_PREMIUM_API_KEY'),
    ].filter(Boolean) as string[];
    
    if (GEMINI_KEYS.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }
    
    const chamarGemini = async (prompt: string, promptType: string): Promise<string> => {
      let lastError: Error | null = null;
      
      for (let i = 0; i < GEMINI_KEYS.length; i++) {
        const apiKey = GEMINI_KEYS[i];
        console.log(`📝 Chamando Gemini para ${promptType} com chave ${i + 1}...`);
        
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 4000 }
              })
            }
          );
          
          if (response.status === 429 || response.status === 503) {
            console.log(`⚠️ Chave ${i + 1} com rate limit, tentando próxima...`);
            continue;
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Erro ${response.status} com chave ${i + 1}:`, errorText.substring(0, 200));
            lastError = new Error(`Erro na API Gemini: ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const usage = data.usageMetadata || {};
          console.log(`✅ ${promptType} gerado com sucesso usando chave ${i + 1} (${result.length} chars)`);
          
          // Registrar uso
          registrarTokenUsage({
            edge_function: 'gerar-resumo-pronto',
            model: 'gemini-2.5-flash-lite',
            provider: 'gemini',
            tipo_conteudo: 'texto',
            input_tokens: usage.promptTokenCount || Math.ceil(prompt.length / 4),
            output_tokens: usage.candidatesTokenCount || Math.ceil(result.length / 4),
            custo_estimado_brl: ((usage.promptTokenCount || Math.ceil(prompt.length / 4)) * 0.0004 + (usage.candidatesTokenCount || Math.ceil(result.length / 4)) * 0.0024) / 1000,
            api_key_index: i + 1,
            sucesso: true,
            metadata: { promptType, area: subtema || tema },
          });
          
          return result;
        } catch (err: any) {
          console.error(`❌ Erro com chave ${i + 1}:`, err.message);
          lastError = err;
        }
      }
      
      throw lastError || new Error('Todas as chaves Gemini falharam');
    };

          const promptResumo = `Você é um professor de direito criando material educacional em formato de artigo/blog. Crie um texto COMPLETO e DETALHADO sobre "${subtema}" dentro do tema "${tema}" na área de "${area}".

REGRAS CRÍTICAS:
- NÃO escreva introduções como "Aqui está o resumo" ou "Com certeza"
- NÃO use saudações ou conclusões
- Vá DIRETO ao conteúdo
- Escreva em formato de BLOG/ARTIGO com parágrafos corridos e fluidos
- Use ## para seções principais (ex: ## Conceito e Fundamentos, ## Aspectos Relevantes)
- Use ### apenas quando necessário para subdivisões importantes
- Use **negrito** APENAS para termos técnicos essenciais (máximo 3-4 por parágrafo)
- Use > (blockquote) para destacar pontos importantes, citações legais e artigos de lei
- Prefira parágrafos narrativos ao invés de listas excessivas
- Use listas SOMENTE quando realmente necessário (máximo 3-4 itens por lista)
- NÃO use tabelas, converta TODAS as tabelas em texto corrido
- NÃO use linhas horizontais/divisórias (--- ou ***)
- Escreva de forma didática, clara e profissional

ESTRUTURA EXEMPLO:

## Conceito e Fundamentos

O **termo técnico** refere-se a... [explicação em parágrafo corrido]. Este conceito é fundamental porque...

> Art. XX da Lei YYYY estabelece que: "citação legal importante"

A aplicação deste instituto no ordenamento jurídico brasileiro tem como base... [continuar em parágrafo].

## Características e Aplicação

Ao analisar este tema, observamos que... [parágrafo explicativo]. A doutrina majoritária entende que...

> "Citação doutrinária ou jurisprudencial relevante"

Na prática forense, este conceito se manifesta quando... [parágrafo com exemplos práticos].`;

          const promptExemplos = `INSTRUÇÃO CRÍTICA: Sua primeira palavra DEVE ser "##". NÃO escreva absolutamente NADA antes de "## Exemplo 1:".

EXEMPLOS DO QUE VOCÊ NÃO PODE FAZER:
❌ "Com certeza! Aqui estão 3 exemplos práticos sobre..."
❌ "Com certeza! Aqui estão os três exemplos..."
❌ "Claro! Vou apresentar..."
❌ "Seguem os exemplos..."
❌ Qualquer palavra, letra ou caractere antes de "##"

A PRIMEIRA LINHA DA SUA RESPOSTA DEVE SER:
## Exemplo 1: [Título]

Você é um professor de direito criando 3-4 EXEMPLOS PRÁTICOS detalhados sobre "${subtema}" no contexto de "${tema}" e "${area}".

FORMATO OBRIGATÓRIO:

## Exemplo 1: [Título Descritivo do Caso]

João, empresário do ramo... [descrição narrativa completa da situação]. O conflito surgiu quando... A questão jurídica central envolvia o **conceito técnico**...

> Conforme jurisprudência do STJ: "citação relevante se houver"

Ao analisar o caso, verificou-se que... A solução encontrada foi... Este exemplo demonstra como...

REGRAS:
- Usar formato narrativo com parágrafos corridos
- Usar **negrito** APENAS para pontos-chave (máximo 2-3 por exemplo)
- Usar > para citações de jurisprudência quando aplicável
- Evitar listas, prefira texto corrido
- NÃO usar tabelas
- NÃO usar linhas horizontais/divisórias (--- ou ***)`;

          const promptTermos = `INSTRUÇÃO CRÍTICA: Sua primeira linha DEVE ser "## Glossário Jurídico". NÃO escreva NADA antes disso.

Você é um professor de direito criando um glossário completo. Analise o tema "${subtema}" e liste de 10 a 15 TERMOS JURÍDICOS, EXPRESSÕES TÉCNICAS e CONCEITOS FUNDAMENTAIS relacionados.

Para CADA termo, forneça:
1. Nome do termo em **negrito** dentro de ###
2. Definição completa em parágrafo corrido (2-4 frases)
3. Contexto de aplicação prática quando relevante
4. Relação com outros conceitos se aplicável

PROIBIDO:
❌ "Aqui estão os termos"
❌ "Com certeza"
❌ Qualquer introdução
❌ Numerar os termos
❌ Agrupar em categorias
❌ Usar listas com marcadores
❌ Usar tabelas
❌ Usar linhas horizontais (---)

OBRIGATÓRIO:
✅ Primeira linha: "## Glossário Jurídico"
✅ Usar ### **Nome do Termo** para cada termo
✅ Escrever 10-15 termos
✅ Explicações em parágrafo corrido
✅ Definições completas e didáticas
✅ Ordem lógica de complexidade (do mais básico ao mais complexo)

FORMATO EXATO:

## Glossário Jurídico

### **Termo Jurídico 1**

Definição completa e didática do termo em parágrafo corrido (2-4 frases), explicando o que significa, quando é usado no direito brasileiro e sua relevância prática. Este conceito se relaciona com...

### **Termo Jurídico 2**

Definição completa em formato narrativo...`;

    console.log('Chamando Gemini para gerar conteúdo completo...');
    
    // Gerar resumo, exemplos e termos em paralelo
    const [resumoGerado, exemplosGerados, termosGerados] = await Promise.all([
      chamarGemini(promptResumo, 'resumo'),
      chamarGemini(promptExemplos, 'exemplos'),
      chamarGemini(promptTermos, 'termos')
    ]);

    console.log('Conteúdo completo gerado com sucesso');

    // Salvar no banco
    const { error: updateError } = await supabase
      .from('RESUMO')
      .update({ 
        conteudo_gerado: { 
          markdown: resumoGerado,
          exemplos: exemplosGerados,
          termos: termosGerados,
          gerado_em: new Date().toISOString(),
          versao: 1
        },
        ultima_atualizacao: new Date().toISOString()
      })
      .eq('id', resumoId);

    if (updateError) {
      console.error('Erro ao salvar resumo:', updateError);
    } else {
      console.log('Resumo salvo no banco com sucesso');
    }

    return new Response(
      JSON.stringify({ 
        resumo: resumoGerado,
        exemplos: exemplosGerados,
        termos: termosGerados,
        fromCache: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro em gerar-resumo-pronto:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
