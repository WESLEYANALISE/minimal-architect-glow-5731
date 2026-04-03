import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar agendados pendentes com hora <= agora
    const { data: agendados, error } = await supabase
      .from('push_agendados')
      .select('*')
      .eq('status', 'pendente')
      .lte('agendar_para', new Date().toISOString())
      .limit(10);

    if (error) {
      console.error('Erro ao buscar agendados:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!agendados || agendados.length === 0) {
      return new Response(JSON.stringify({ processados: 0, mensagem: 'Nenhum push agendado pendente' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processando ${agendados.length} push(es) agendado(s)...`);

    let processados = 0;

    for (const agendado of agendados) {
      try {
        // Marcar como "enviando" para evitar duplicatas
        await supabase
          .from('push_agendados')
          .update({ status: 'enviando' })
          .eq('id', agendado.id)
          .eq('status', 'pendente');

        // Chamar a edge function de envio
        const response = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-push-fcm`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              titulo: agendado.titulo,
              mensagem: agendado.mensagem,
              link: agendado.link,
              imagem_url: agendado.imagem_url,
              cor: agendado.cor,
              icone_url: agendado.icone_url,
            }),
          }
        );

        const resultado = await response.json();

        await supabase
          .from('push_agendados')
          .update({
            status: 'enviado',
            resultado,
          })
          .eq('id', agendado.id);

        processados++;
        console.log(`Push agendado ${agendado.id} enviado:`, resultado);
      } catch (err) {
        console.error(`Erro ao processar agendado ${agendado.id}:`, err);
        await supabase
          .from('push_agendados')
          .update({
            status: 'erro',
            resultado: { error: String(err) },
          })
          .eq('id', agendado.id);
      }
    }

    return new Response(
      JSON.stringify({ processados, total: agendados.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
