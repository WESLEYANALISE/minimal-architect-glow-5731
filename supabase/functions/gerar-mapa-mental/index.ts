import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { getRotatedKeyStrings } from "../_shared/gemini-keys.ts";

function getApiKeys(): string[] {
  return getRotatedKeyStrings(true);
}

async function chamarGemini(prompt: string, apiKeys: string[]): Promise<string> {
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      console.log(`[mapa-mental] Tentando chave ${i + 1}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKeys[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            }
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[mapa-mental] Chave ${i + 1} rate limited, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        console.error(`[mapa-mental] Chave ${i + 1} falhou (${response.status}): ${err.substring(0, 150)}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Resposta vazia do Gemini');
      
      console.log(`[mapa-mental] ✅ Sucesso com chave ${i + 1}`);
      return text;
    } catch (error) {
      console.error(`[mapa-mental] Erro chave ${i + 1}:`, error instanceof Error ? error.message : error);
    }
  }
  throw new Error('Todas as chaves falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, tema, subtema } = await req.json();

    if (!area || !tema || !subtema) {
      return new Response(
        JSON.stringify({ error: 'area, tema e subtema são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const apiKeys = getApiKeys();

    if (apiKeys.length === 0) {
      throw new Error('Nenhuma chave de API configurada');
    }

    // Buscar conteúdo do subtema na tabela RESUMO
    console.log(`[mapa-mental] Buscando conteúdo de ${area} / ${tema} / ${subtema}...`);
    const { data: resumoData, error: resumoErr } = await supabase
      .from('RESUMO')
      .select('subtema, conteudo_gerado')
      .eq('area', area)
      .eq('tema', tema)
      .eq('subtema', subtema)
      .maybeSingle();

    if (resumoErr) throw new Error(`Erro ao buscar subtema: ${resumoErr.message}`);

    let conteudoBase = 'Sem conteúdo disponível';
    if (resumoData?.conteudo_gerado) {
      const texto = typeof resumoData.conteudo_gerado === 'string' ? resumoData.conteudo_gerado : JSON.stringify(resumoData.conteudo_gerado);
      conteudoBase = texto.substring(0, 2000);
    }

    const prompt = `Você é um especialista em educação jurídica. Crie um mapa mental completo para o subtema "${subtema}" do tema "${tema}" na área "${area}".

CONTEÚDO BASE DO SUBTEMA:
${conteudoBase}

GERE um JSON com a seguinte estrutura EXATA (5 ramos obrigatórios).
Cada subseção DEVE conter: itens explicativos, um campo "exemplo" com caso prático real, um campo "termos" com termos técnicos, e um campo "dica_prova" com dica objetiva para provas/concursos.

{
  "titulo": "${subtema}",
  "area": "${area}",
  "secoes": [
    {
      "numero": "1",
      "titulo": "FUNDAMENTOS",
      "subsecoes": [
        {
          "numero": "1.1",
          "titulo": "Definição",
          "itens": [
            { "numero": "1.1.1", "texto": "Explicação clara (máx 2 linhas)" }
          ],
          "exemplo": "Exemplo prático concreto que ilustra este ponto",
          "termos": ["Termo Técnico 1", "Termo Técnico 2"],
          "dica_prova": "Dica objetiva de como este tema costuma cair em provas"
        },
        { "numero": "1.2", "titulo": "Importância", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "1.3", "titulo": "Contexto histórico/legal", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." }
      ]
    },
    {
      "numero": "2",
      "titulo": "CONCEITOS-CHAVE",
      "subsecoes": [
        { "numero": "2.1", "titulo": "Conceito principal 1", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "2.2", "titulo": "Conceito principal 2", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "2.3", "titulo": "Conceito principal 3", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." }
      ]
    },
    {
      "numero": "3",
      "titulo": "APLICAÇÃO",
      "subsecoes": [
        { "numero": "3.1", "titulo": "Como funciona", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "3.2", "titulo": "Quando se aplica", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "3.3", "titulo": "Exemplos práticos", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "3.4", "titulo": "Procedimentos", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." }
      ]
    },
    {
      "numero": "4",
      "titulo": "EXCEÇÕES E CASOS ESPECIAIS",
      "subsecoes": [
        { "numero": "4.1", "titulo": "Situações especiais", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "4.2", "titulo": "Limitações", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "4.3", "titulo": "Interpretações", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." }
      ]
    },
    {
      "numero": "5",
      "titulo": "CONSEQUÊNCIAS E IMPACTOS",
      "subsecoes": [
        { "numero": "5.1", "titulo": "Efeitos legais", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "5.2", "titulo": "Implicações práticas", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." },
        { "numero": "5.3", "titulo": "Referências normativas", "itens": [...], "exemplo": "...", "termos": [...], "dica_prova": "..." }
      ]
    }
  ]
}

REGRAS:
- OBRIGATÓRIO: exatamente 5 seções (FUNDAMENTOS, CONCEITOS-CHAVE, APLICAÇÃO, EXCEÇÕES E CASOS ESPECIAIS, CONSEQUÊNCIAS E IMPACTOS)
- Cada subseção DEVE ter: itens (2-4), exemplo (caso prático real), termos (2-3 termos técnicos) e dica_prova (dica objetiva para provas)
- Os textos dos itens devem ser concisos (máximo 2 linhas cada)
- Exemplos devem ser concretos e reais (jurisprudência, artigos de lei, situações do dia-a-dia)
- Termos técnicos devem ser palavras-chave que o estudante precisa memorizar
- dica_prova deve ser uma dica curta e direta de como o assunto é cobrado em provas OAB/concursos
- Máximo 2-3 níveis de profundidade
- Use linguagem jurídica precisa mas acessível
- Retorne APENAS o JSON válido, sem markdown`;

    const jsonText = await chamarGemini(prompt, apiKeys);
    
    // Parse e validar JSON
    let dadosJson: any;
    try {
      dadosJson = JSON.parse(jsonText);
    } catch {
      // Tentar extrair JSON de markdown
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        dadosJson = JSON.parse(match[0]);
      } else {
        throw new Error('Resposta do Gemini não é JSON válido');
      }
    }

    if (!dadosJson.titulo || !dadosJson.secoes) {
      throw new Error('Estrutura JSON inválida: falta titulo ou secoes');
    }

    // Salvar no banco com subtema
    const { error: insertErr } = await supabase
      .from('MAPAS_MENTAIS_GERADOS')
      .upsert({
        area,
        tema,
        subtema,
        dados_json: dadosJson,
      }, { onConflict: 'area,tema,subtema' });

    if (insertErr) {
      console.error('[mapa-mental] Erro ao salvar:', insertErr);
    } else {
      console.log(`[mapa-mental] ✅ Mapa salvo para ${area} / ${tema} / ${subtema}`);
    }

    return new Response(
      JSON.stringify({ success: true, dados_json: dadosJson, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[mapa-mental] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
