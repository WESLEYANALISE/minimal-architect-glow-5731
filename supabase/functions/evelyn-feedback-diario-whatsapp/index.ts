import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_PHONE = '5511991897603';

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean);

async function callGemini(prompt: string): Promise<string> {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 3000 },
          }),
        }
      );
      if (res.status === 429 || res.status === 503) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch { continue; }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[evelyn-feedback-diario-whatsapp] Iniciando...');

    // Data de ontem (dia anterior completo)
    const agora = new Date();
    const ontem = new Date(agora);
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().split('T')[0];
    const inicioOntem = `${ontemStr}T00:00:00.000Z`;
    const fimOntem = `${ontemStr}T23:59:59.999Z`;

    // Anteontem para comparação
    const anteontem = new Date(agora);
    anteontem.setDate(anteontem.getDate() - 2);
    const anteontemStr = anteontem.toISOString().split('T')[0];
    const inicioAnteontem = `${anteontemStr}T00:00:00.000Z`;
    const fimAnteontem = `${anteontemStr}T23:59:59.999Z`;

    // Fetch metrics in parallel
    const [
      { count: totalUsuarios },
      { count: novosOntem },
      { count: novosAnteontem },
      { data: premiumOntem },
      { data: totalPremium },
      { count: pageViewsOntem },
      { count: pageViewsAnteontem },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', inicioOntem).lte('created_at', fimOntem),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', inicioAnteontem).lte('created_at', fimAnteontem),
      supabase.from('subscriptions').select('*').eq('status', 'authorized').gte('created_at', inicioOntem).lte('created_at', fimOntem),
      supabase.from('subscriptions').select('*').eq('status', 'authorized'),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', inicioOntem).lte('created_at', fimOntem),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', inicioAnteontem).lte('created_at', fimAnteontem),
    ]);

    // Usuarios ativos ontem (distintos)
    // Fetch in batches
    let allPvOntem: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('page_views')
        .select('user_id')
        .gte('created_at', inicioOntem)
        .lte('created_at', fimOntem)
        .not('user_id', 'is', null)
        .range(from, from + 999);
      if (error || !data || data.length === 0) break;
      allPvOntem.push(...data);
      if (data.length < 1000) break;
      from += 1000;
    }
    const usuariosAtivosOntem = new Set(allPvOntem.map(p => p.user_id)).size;

    // Paginas populares ontem
    const { data: paginasData } = await supabase.rpc('get_admin_paginas_populares', { p_dias: 1 });
    const paginasTop = (paginasData || []).slice(0, 10).map((p: any) => `${p.page_title || p.page_path}: ${p.total} views`).join('\n');

    // Taxa de conversão
    const taxaConversao = totalUsuarios ? (((totalPremium?.length || 0) / totalUsuarios) * 100).toFixed(2) : '0';

    // Comparações
    const crescimentoCadastros = (novosAnteontem || 0) > 0 
      ? (((novosOntem || 0) - (novosAnteontem || 0)) / (novosAnteontem || 1) * 100).toFixed(1)
      : 'N/A';
    const crescimentoPV = (pageViewsAnteontem || 0) > 0 
      ? (((pageViewsOntem || 0) - (pageViewsAnteontem || 0)) / (pageViewsAnteontem || 1) * 100).toFixed(1)
      : 'N/A';

    const prompt = `Você é a Evelyn, assistente de um aplicativo jurídico educacional brasileiro. Gere um relatório diário conciso e direto em português brasileiro para o administrador, para ser enviado via WhatsApp.

DADOS DE ONTEM (${ontemStr}):
- Total de usuários cadastrados: ${totalUsuarios || 0}
- Novos cadastros ontem: ${novosOntem || 0}
- Novos cadastros anteontem: ${novosAnteontem || 0} (${crescimentoCadastros}% de variação)
- Usuários ativos ontem: ${usuariosAtivosOntem}
- Page views ontem: ${pageViewsOntem || 0}
- Page views anteontem: ${pageViewsAnteontem || 0} (${crescimentoPV}% de variação)
- Novos assinantes premium ontem: ${premiumOntem?.length || 0}
- Total de assinantes premium ativos: ${totalPremium?.length || 0}
- Taxa de conversão premium: ${taxaConversao}%

PÁGINAS MAIS ACESSADAS:
${paginasTop || 'Sem dados suficientes'}

INSTRUÇÕES:
1. Comece com "📊 *Relatório Diário - ${ontemStr}*"
2. Use formatação WhatsApp: *negrito*, _itálico_, emojis
3. Destaque números com comparações (ontem vs anteontem)
4. Analise tendências de uso
5. Dê 2-3 recomendações práticas
6. Seja direto, máximo 250 palavras
7. Inclua porcentagens de crescimento/queda
8. Finalize com uma frase motivacional curta`;

    const feedback = await callGemini(prompt);

    console.log('[evelyn-feedback-diario-whatsapp] Feedback gerado, enviando via WhatsApp...');

    // Enviar via Evolution API
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API não configurada');
    }

    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: `${ADMIN_PHONE}@s.whatsapp.net`,
        text: feedback,
      }),
    });

    const result = await response.json();
    console.log('[evelyn-feedback-diario-whatsapp] Resultado envio:', result);

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao enviar mensagem WhatsApp');
    }

    // Salvar no cache também
    const hoje = agora.toISOString().split('T')[0];
    await supabase.from('admin_daily_feedback').upsert(
      { data: hoje, feedback_text: feedback },
      { onConflict: 'data' }
    );

    return new Response(
      JSON.stringify({ success: true, messageId: result.key?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[evelyn-feedback-diario-whatsapp] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
