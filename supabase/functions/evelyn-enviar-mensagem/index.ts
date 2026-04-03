import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    let { instanceName, telefone, mensagem, conversaId } = await req.json();

    if (!telefone || !mensagem) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: telefone, mensagem' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se instanceName não veio, buscar da config
    if (!instanceName) {
      console.log('[enviar] instanceName não fornecido, buscando da evelyn_config...');
      const { data: config } = await supabase
        .from('evelyn_config')
        .select('instance_name')
        .eq('ativo', true)
        .limit(1)
        .maybeSingle();

      instanceName = config?.instance_name;
      if (!instanceName) {
        console.error('[enviar] Nenhuma instância ativa encontrada em evelyn_config');
        return new Response(
          JSON.stringify({ error: 'Nenhuma instância WhatsApp ativa configurada' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log(`[enviar] Usando instância da config: ${instanceName}`);
    }

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API não configurada');
    }

    // Formatar número
    let numero = telefone.replace(/\D/g, '');
    if (!numero.endsWith('@s.whatsapp.net')) {
      numero = `${numero}@s.whatsapp.net`;
    }

    const destMascarado = numero.substring(0, 6) + '***';
    console.log(`[enviar] Enviando para ${destMascarado} via instância ${instanceName}`);

    // Enviar via Evolution API
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: numero,
        text: mensagem,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[enviar] Erro Evolution API:', response.status, JSON.stringify(result).substring(0, 300));
      throw new Error(result.message || `Evolution API retornou ${response.status}`);
    }

    console.log(`[enviar] Mensagem enviada com sucesso, messageId: ${result.key?.id}`);

    // Salvar mensagem no banco (remetente deve ser 'evelyn', não 'bot')
    if (conversaId) {
      const { error: insertErr } = await supabase.from('evelyn_mensagens').insert({
        conversa_id: conversaId,
        remetente: 'evelyn',
        tipo: 'texto',
        conteudo: mensagem,
        processado: true,
        metadata: { messageId: result.key?.id }
      });

      if (insertErr) {
        console.error('[enviar] Erro ao salvar mensagem no banco:', JSON.stringify(insertErr));
      }

      const { error: updateErr } = await supabase.from('evelyn_conversas').update({
        updated_at: new Date().toISOString()
      }).eq('id', conversaId);

      if (updateErr) {
        console.error('[enviar] Erro ao atualizar conversa:', JSON.stringify(updateErr));
      }
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.key?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[enviar] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
