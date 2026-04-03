import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topFuncoes, tempoTelaMinutos, diasAtivos } = await req.json();

    const funcoesTexto = topFuncoes && topFuncoes.length > 0
      ? topFuncoes.join(', ')
      : 'várias funcionalidades';

    const prompt = `Você é um copywriter especialista em conversão. Gere uma mensagem persuasiva de 3-4 linhas em português brasileiro para convencer um estudante de Direito a assinar uma plataforma jurídica.

Dados do usuário:
- Tempo de uso: ${tempoTelaMinutos || 0} minutos no app
- Funções mais acessadas: ${funcoesTexto}
- Dias ativos: ${diasAtivos || 0} dias

Regras:
- Elogie o esforço e dedicação do usuário
- Mencione as funções que ele mais usou de forma natural
- Diga que ele já faz parte de um grupo seleto de pessoas que buscam conhecimento jurídico
- Incentive a assinar para não perder o progresso
- Tom motivacional e empático, sem ser forçado
- NÃO use emojis
- NÃO mencione preços
- Máximo 4 linhas curtas
- Retorne APENAS a mensagem, sem aspas`;

    let mensagem = '';

    for (const key of API_KEYS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.9, maxOutputTokens: 200 },
            }),
          }
        );

        if (!res.ok) continue;

        const data = await res.json();
        mensagem = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (mensagem) break;
      } catch {
        continue;
      }
    }

    if (!mensagem) {
      mensagem = `Você demonstrou um comprometimento admirável com seus estudos jurídicos. Seu tempo dedicado a ${funcoesTexto} mostra que você leva sua formação a sério. Continue essa jornada de excelência — assine agora e garanta acesso completo a todo o conteúdo que já faz parte da sua rotina de estudos.`;
    }

    return new Response(JSON.stringify({ mensagem }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ mensagem: 'Seu período de teste terminou, mas sua jornada no Direito não precisa parar. Assine agora e continue evoluindo com acesso completo a toda a plataforma.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
