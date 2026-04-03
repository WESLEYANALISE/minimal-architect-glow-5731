import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema } = await req.json();
    
    if (!tema) {
      throw new Error('Tema é obrigatório');
    }

    const DIREITO_PREMIUM_API_KEY = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!DIREITO_PREMIUM_API_KEY) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    console.log('Gerando estrutura de aula para:', tema);

    const prompt = `Crie uma estrutura de aula sobre: ${tema}

REGRAS CRÍTICAS:
- Retorne APENAS JSON válido, sem markdown
- Seja CONCISO - cada campo de texto com máximo 200 palavras
- 3 módulos com conteúdo objetivo

ESTRUTURA JSON:
{
  "titulo": "Título curto",
  "descricao": "Descrição em 1-2 frases",
  "area": "Direito",
  "imagemPrompt": "Educational illustration about ${tema}, legal theme, modern style",
  "modulos": [
    {
      "id": 1,
      "nome": "Nome do Módulo",
      "icone": "BookOpen",
      "teoria": "Conteúdo teórico em markdown. Use ## para títulos. Inclua 1-2 cards especiais: > ⚠️ **ATENÇÃO**: ou > 💡 **IMPORTANTE**:",
      "resumo": ["Ponto 1", "Ponto 2", "Ponto 3", "Ponto 4", "Ponto 5"],
      "matching": [
        {"termo": "Termo1", "definicao": "Definição curta"},
        {"termo": "Termo2", "definicao": "Definição curta"},
        {"termo": "Termo3", "definicao": "Definição curta"},
        {"termo": "Termo4", "definicao": "Definição curta"}
      ],
      "questoes": [
        {
          "question": "Questão?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explicacao": "Explicação breve"
        }
      ]
    }
  ],
  "provaFinal": [
    {
      "question": "Questão final?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explicacao": "Explicação"
    }
  ]
}

IMPORTANTE:
- Cada módulo: teoria com ~300 palavras, 5 resumos, 4 matchings, 3 questões
- Prova final: 5 questões
- JSON PURO, sem \`\`\`json`;

    const systemPrompt = 'Você é um professor jurídico expert que cria aulas estruturadas e didáticas. Sempre retorne APENAS JSON puro válido, sem markdown, sem ```json.';
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${DIREITO_PREMIUM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 32000,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Gemini:', response.status, errorText);
      throw new Error('Erro ao gerar estrutura da aula');
    }

    const data = await response.json();
    let estruturaText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!estruturaText) {
      console.error('Resposta vazia do Gemini:', JSON.stringify(data));
      throw new Error('Resposta vazia da IA');
    }
    
    // Limpar markdown se presente
    estruturaText = estruturaText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Tentar reparar JSON truncado
    let estrutura;
    try {
      estrutura = JSON.parse(estruturaText);
    } catch (parseError) {
      console.log('JSON truncado, tentando reparar...');
      
      // Contar chaves e colchetes para fechar estrutura
      let openBraces = (estruturaText.match(/{/g) || []).length;
      let closeBraces = (estruturaText.match(/}/g) || []).length;
      let openBrackets = (estruturaText.match(/\[/g) || []).length;
      let closeBrackets = (estruturaText.match(/\]/g) || []).length;
      
      // Remover última propriedade incompleta (string não terminada)
      estruturaText = estruturaText.replace(/,\s*"[^"]*":\s*"[^"]*$/, '');
      estruturaText = estruturaText.replace(/,\s*"[^"]*":\s*\[[^\]]*$/, '');
      estruturaText = estruturaText.replace(/,\s*{[^}]*$/, '');
      
      // Fechar arrays e objetos pendentes
      while (closeBrackets < openBrackets) {
        estruturaText += ']';
        closeBrackets++;
      }
      while (closeBraces < openBraces) {
        estruturaText += '}';
        closeBraces++;
      }
      
      try {
        estrutura = JSON.parse(estruturaText);
        console.log('JSON reparado com sucesso');
      } catch (e) {
        console.error('Falha ao reparar JSON:', e);
        throw new Error('Não foi possível processar a resposta da IA');
      }
    }
    
    console.log('Estrutura gerada com sucesso:', estrutura.titulo);

    return new Response(JSON.stringify(estrutura), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro em gerar-estrutura-aula:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao gerar estrutura da aula' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
