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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { codigo, numero_artigo, texto_artigo, dificuldade = 'normal' } = await req.json();

    if (!texto_artigo || !numero_artigo) {
      return new Response(
        JSON.stringify({ error: 'texto_artigo e numero_artigo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_KEY_1');
    if (!GEMINI_API_KEY) {
      throw new Error('Chave da API Gemini não configurada');
    }

    let instrucaoDificuldade: string;

    switch (dificuldade) {
      case 'boss':
        instrucaoDificuldade = `NÍVEL: CHEFE (questão DIFÍCIL - aplicação prática)
- Crie uma questão que exija APLICAÇÃO PRÁTICA do artigo a um caso concreto
- Apresente uma situação hipotética detalhada e pergunte como o artigo se aplica
- As alternativas devem ser MUITO PRÓXIMAS entre si, exigindo análise cuidadosa do texto literal
- As alternativas erradas devem conter informações que PARECEM corretas mas contradizem detalhes específicos do artigo
- A explicação deve citar o trecho exato do artigo que justifica a resposta`;
        break;
      case 'elite':
        instrucaoDificuldade = `NÍVEL: ELITE (questão INTERMEDIÁRIA - interpretação)
- Crie uma questão que exija INTERPRETAÇÃO do artigo, não apenas memorização
- As alternativas erradas devem conter informações de OUTROS artigos do mesmo código
- A questão pode envolver comparação com situações que NÃO se enquadram no artigo
- A explicação deve ser clara, citando o trecho relevante do artigo`;
        break;
      default:
        instrucaoDificuldade = `NÍVEL: NORMAL (questão DIRETA sobre o texto)
- Crie uma questão objetiva que teste se o aluno LEIOU o artigo
- A resposta correta deve estar explicitamente no texto do artigo
- As alternativas erradas devem ser plausíveis mas claramente NÃO ditas no artigo
- A explicação deve ser breve e apontar onde no artigo está a resposta`;
    }

    const prompt = `Você é um professor de Direito especialista em questões de concurso. Crie UMA questão de múltipla escolha sobre o seguinte artigo de lei:

Código: ${codigo || 'Código Brasileiro'}
Artigo ${numero_artigo}:
"${texto_artigo}"

${instrucaoDificuldade}

REGRA CRÍTICA: A questão DEVE ser sobre o conteúdo LITERAL e ESPECÍFICO deste artigo ${numero_artigo}. 
NÃO faça questões genéricas sobre o tema geral do direito.
As alternativas erradas devem conter informações que poderiam ser de OUTROS artigos do mesmo código, para testar se o aluno realmente leu ESTE artigo específico.
A pergunta DEVE mencionar o número do artigo ou citar trecho dele.

REGRAS:
- 4 alternativas (A, B, C, D)
- Apenas UMA correta
- A resposta correta DEVE ser baseada no texto literal do artigo fornecido
- Inclua uma explicação que cite o trecho do artigo

Responda SOMENTE em JSON válido, sem markdown:
{
  "pergunta": "texto da pergunta",
  "alternativas": ["alternativa A", "alternativa B", "alternativa C", "alternativa D"],
  "resposta_correta": 0,
  "explicacao": "explicação citando trecho do artigo"
}

O campo resposta_correta é o ÍNDICE (0-3) da alternativa correta.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: dificuldade === 'boss' ? 0.8 : dificuldade === 'elite' ? 0.75 : 0.7,
            maxOutputTokens: dificuldade === 'boss' ? 1500 : 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Track token usage
    registrarTokenUsage({
      edge_function: 'gerar-questao-invasores',
      model: 'gemini-2.5-flash-lite',
      provider: 'gemini',
      tipo_conteudo: 'texto',
      input_tokens: data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
      output_tokens: data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4),
      custo_estimado_brl: (((data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4)) * 0.0004 + (data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4)) * 0.0024) / 1000),
      sucesso: true,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta da IA não contém JSON válido');
    }

    const questao = JSON.parse(jsonMatch[0]);

    if (!questao.pergunta || !Array.isArray(questao.alternativas) || questao.alternativas.length !== 4 || typeof questao.resposta_correta !== 'number') {
      throw new Error('Estrutura da questão inválida');
    }

    return new Response(
      JSON.stringify({ questao }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
