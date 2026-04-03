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

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean);

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
              temperature: 0.8,
              maxOutputTokens: 16000,
            },
          }),
        }
      );

      if (response.status === 429 || response.status === 503) continue;
      if (!response.ok) continue;

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        registrarTokenUsage({
          edge_function: 'gerar-batalha-juridica',
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
    } catch {
      continue;
    }
  }
  throw new Error('Todas as chaves API esgotadas');
}

function extractJSON(text: string): any {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = match ? match[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, tema, continuar, contexto } = await req.json();

    if (!area || !tema) {
      return new Response(
        JSON.stringify({ error: 'Área e tema são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt: string;

    if (continuar && contexto) {
      prompt = `Você é um gerador de debates jurídicos educativos. Continue o debate abaixo com mais uma rodada de argumentos.

CONTEXTO DO CASO:
${contexto.caso}

DEBATE ANTERIOR:
Parte 1 (${contexto.parte1.nome} - ${contexto.parte1.papel}) - Tese: ${contexto.parte1.tese}
Argumentos anteriores: ${contexto.parte1.argumentos.join('; ')}

Parte 2 (${contexto.parte2.nome} - ${contexto.parte2.papel}) - Tese: ${contexto.parte2.tese}
Argumentos anteriores: ${contexto.parte2.argumentos.join('; ')}

Gere NOVOS argumentos (diferentes dos anteriores) para cada parte, aprofundando o debate com novas perspectivas jurídicas, citando artigos de lei, doutrinas ou jurisprudências relevantes.

Responda APENAS com JSON válido (sem markdown):
{
  "parte1_novos": ["argumento novo 1 da parte 1"],
  "parte2_novos": ["argumento novo 1 da parte 2"]
}`;
    } else {
      prompt = `Você é um gerador de casos jurídicos educativos para estudantes de Direito. O jogador será o JUIZ do caso.

Crie TRÊS casos jurídicos sobre a área "${area}", tema "${tema}", com níveis de dificuldade diferentes: fácil, médio e difícil.

Cada caso deve ser realista, com nomes fictícios, fatos concretos e uma situação que gere debate jurídico.

Para CADA caso:
- Defina o tipo_processo (criminal, civil, trabalhista, etc.)
- Crie duas partes: SEMPRE devem ser advogados (ex: "Advogado(a) do Autor" vs "Advogado(a) do Réu", ou "Advogado(a) da Acusação" vs "Advogado(a) da Defesa"). NUNCA use "Ministério Público", "Defensoria Pública" ou órgãos institucionais como papel — sempre use "Advogado(a) de [parte]".
- Cada parte deve ter nome brasileiro completo (Dr./Dra.), papel de advogado, tese e argumentos
- Crie 3-5 provas com tipos variados (documental, pericial, testemunhal, material)
- Cada prova deve ter relevância (forte, media, fraca) e indicação se deve ser deferida ou não
- Crie 3-4 opções de sentença contextual com pontuação

NÍVEL FÁCIL: Caso simples com resposta mais evidente.
NÍVEL MÉDIO: Caso moderado com argumentos equilibrados.
NÍVEL DIFÍCIL: Caso complexo com nuances jurídicas.

Responda APENAS com JSON válido (sem markdown):
{
  "casos": [
    {
      "nivel": "facil",
      "caso": "Descrição completa do caso com contexto factual (3-5 parágrafos)",
      "pontos_chave": ["ponto-chave 1", "ponto-chave 2", "ponto-chave 3"],
      "tipo_processo": "criminal",
      "parte1": {
        "papel": "Advogado da Acusação",
        "nome": "Dr. Nome Sobrenome",
        "tese": "Resumo da tese em 1-2 frases",
        "argumentos": ["Primeiro argumento fundamentado com base legal", "Segundo argumento"]
      },
      "parte2": {
        "papel": "Advogada da Defesa",
        "nome": "Dra. Nome Sobrenome",
        "tese": "Resumo da tese oposta em 1-2 frases",
        "argumentos": ["Primeiro argumento fundamentado com base legal", "Segundo argumento"]
      },
      "provas": [
        {
          "nome": "Laudo Pericial",
          "descricao": "Descrição detalhada da prova",
          "tipo": "pericial",
          "relevancia": "forte",
          "apresentada_por": 1,
          "deve_deferir": true,
          "motivo": "Explicação de por que deve ou não ser deferida"
        },
        {
          "nome": "Depoimento de Testemunha",
          "descricao": "Descrição da prova testemunhal",
          "tipo": "testemunhal",
          "relevancia": "media",
          "apresentada_por": 2,
          "deve_deferir": true,
          "motivo": "Explicação"
        },
        {
          "nome": "Documento sem autenticação",
          "descricao": "Documento apresentado sem autenticação",
          "tipo": "documental",
          "relevancia": "fraca",
          "apresentada_por": 1,
          "deve_deferir": false,
          "motivo": "Documento sem autenticação não tem valor probatório"
        }
      ],
      "opcoes_sentenca": [
        { "texto": "Condeno o réu a X anos de reclusão em regime fechado", "correta": true, "pontos": 40, "feedback": "Fundamentação detalhada de por que esta é a decisão correta" },
        { "texto": "Absolvo o réu por insuficiência de provas", "correta": false, "pontos": 10, "feedback": "Explicação de por que esta não seria a melhor decisão" },
        { "texto": "Desclassifico para crime culposo", "correta": false, "pontos": 20, "feedback": "Explicação parcial" }
      ],
      "explicacao": "Explicação jurídica detalhada completa (2-3 parágrafos)"
    },
    {
      "nivel": "medio",
      "caso": "...",
      "pontos_chave": ["...", "...", "..."],
      "tipo_processo": "civil",
      "parte1": { "papel": "Advogado do Autor", "nome": "...", "tese": "...", "argumentos": ["...", "..."] },
      "parte2": { "papel": "Advogado do Réu", "nome": "...", "tese": "...", "argumentos": ["...", "..."] },
      "provas": [
        { "nome": "...", "descricao": "...", "tipo": "documental", "relevancia": "forte", "apresentada_por": 1, "deve_deferir": true, "motivo": "..." },
        { "nome": "...", "descricao": "...", "tipo": "testemunhal", "relevancia": "media", "apresentada_por": 2, "deve_deferir": true, "motivo": "..." },
        { "nome": "...", "descricao": "...", "tipo": "material", "relevancia": "fraca", "apresentada_por": 2, "deve_deferir": false, "motivo": "..." }
      ],
      "opcoes_sentenca": [
        { "texto": "...", "correta": true, "pontos": 40, "feedback": "..." },
        { "texto": "...", "correta": false, "pontos": 10, "feedback": "..." },
        { "texto": "...", "correta": false, "pontos": 25, "feedback": "..." }
      ],
      "explicacao": "..."
    },
    {
      "nivel": "dificil",
      "caso": "...",
      "pontos_chave": ["...", "...", "...", "..."],
      "tipo_processo": "criminal",
      "parte1": { "papel": "...", "nome": "...", "tese": "...", "argumentos": ["...", "...", "..."] },
      "parte2": { "papel": "...", "nome": "...", "tese": "...", "argumentos": ["...", "...", "..."] },
      "provas": [
        { "nome": "...", "descricao": "...", "tipo": "pericial", "relevancia": "forte", "apresentada_por": 1, "deve_deferir": true, "motivo": "..." },
        { "nome": "...", "descricao": "...", "tipo": "documental", "relevancia": "media", "apresentada_por": 2, "deve_deferir": true, "motivo": "..." },
        { "nome": "...", "descricao": "...", "tipo": "testemunhal", "relevancia": "forte", "apresentada_por": 1, "deve_deferir": true, "motivo": "..." },
        { "nome": "...", "descricao": "...", "tipo": "material", "relevancia": "fraca", "apresentada_por": 2, "deve_deferir": false, "motivo": "..." }
      ],
      "opcoes_sentenca": [
        { "texto": "...", "correta": true, "pontos": 40, "feedback": "..." },
        { "texto": "...", "correta": false, "pontos": 5, "feedback": "..." },
        { "texto": "...", "correta": false, "pontos": 20, "feedback": "..." },
        { "texto": "...", "correta": false, "pontos": 15, "feedback": "..." }
      ],
      "explicacao": "..."
    }
  ]
}

IMPORTANTE:
- SEMPRE use "Advogado(a)" como papel das partes. NUNCA use "Ministério Público", "Defensoria Pública" ou qualquer órgão institucional. Exemplos corretos: "Advogado da Acusação" vs "Advogada da Defesa" (criminal), "Advogado do Autor" vs "Advogado do Réu" (civil), "Advogado do Reclamante" vs "Advogada da Reclamada" (trabalhista)
- Cada caso deve ter partes com nomes DIFERENTES dos outros casos
- As provas devem ser realistas e variadas
- As opções de sentença devem ser contextualmente adequadas ao tipo de processo
- Sempre inclua pelo menos uma prova que NÃO deve ser deferida para testar o jogador`;
    }

    console.log(`[batalha-juridica] Gerando para ${area}/${tema}, continuar=${!!continuar}`);
    const responseText = await callGeminiWithFallback(prompt);
    const parsed = extractJSON(responseText);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[batalha-juridica] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
