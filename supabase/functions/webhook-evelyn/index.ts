import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Versão 4.0 - Deduplicação via banco de dados
const VERSION = "4.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[webhook-evelyn v${VERSION}] Requisição recebida: ${req.method}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('[webhook-evelyn] Evento recebido:', payload.event);

    if (payload.event !== 'messages.upsert') {
      console.log('[webhook-evelyn] Evento ignorado:', payload.event);
      return new Response(JSON.stringify({ ok: true, ignored: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const message = payload.data;
    if (!message || !message.key) {
      console.log('[webhook-evelyn] Mensagem sem key, ignorando');
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const remoteJid = message.key.remoteJid || '';
    const messageId = message.key.id || '';
    const isFromMe = message.key.fromMe;
    const isGroup = remoteJid.endsWith('@g.us');
    const isNewsletter = remoteJid.includes('@newsletter');
    const isBroadcast = remoteJid.includes('@broadcast');

    // Ignorar mensagens enviadas por nós, de grupos, newsletters ou broadcasts
    if (isFromMe || isGroup || isNewsletter || isBroadcast) {
      console.log('[webhook-evelyn] Mensagem própria, grupo, newsletter ou broadcast, ignorando');
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // ==== DEDUPLICAÇÃO VIA BANCO DE DADOS ====
    const { error: dedupError } = await supabase
      .from('evelyn_mensagens_processadas')
      .insert({ message_id: messageId, remote_jid: remoteJid });

    if (dedupError) {
      if (dedupError.code === '23505') {
        // Conflito de chave primária = duplicata real
        console.log(`[webhook-evelyn] Mensagem duplicada ignorada - messageId: ${messageId}, remoteJid: ${remoteJid}`);
        return new Response(JSON.stringify({ ok: true, duplicate: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      // Outro erro - logar mas continuar processando
      console.error(`[webhook-evelyn] Erro inesperado na dedup:`, dedupError);
    }

    console.log(`[webhook-evelyn] Mensagem nova registrada - messageId: ${messageId}, remoteJid: ${remoteJid}`);

    // Limpeza periódica (1 em cada 20 chamadas)
    if (Math.random() < 0.05) {
      supabase.rpc('limpar_evelyn_mensagens_processadas').then(() => {
        console.log('[webhook-evelyn] Limpeza periódica executada');
      }).catch(() => {});
    }

    // Processar diferentes tipos de mensagem
    let tipo = 'texto';
    let conteudo = '';
    let metadata: Record<string, any> = {};

    if (message.message?.conversation) {
      tipo = 'texto';
      conteudo = message.message.conversation;
    } else if (message.message?.extendedTextMessage) {
      tipo = 'texto';
      conteudo = message.message.extendedTextMessage.text;
    } else if (message.message?.audioMessage) {
      tipo = 'audio';
      conteudo = message.message.audioMessage.url || '';
      metadata = {
        mimetype: message.message.audioMessage.mimetype,
        seconds: message.message.audioMessage.seconds,
        ptt: message.message.audioMessage.ptt,
      };
    } else if (message.message?.documentMessage) {
      tipo = 'documento';
      conteudo = message.message.documentMessage.url || '';
      metadata = {
        mimetype: message.message.documentMessage.mimetype,
        fileName: message.message.documentMessage.fileName,
        pageCount: message.message.documentMessage.pageCount,
      };
    } else if (message.message?.imageMessage) {
      tipo = 'imagem';
      conteudo = message.message.imageMessage.url || '';
      metadata = {
        mimetype: message.message.imageMessage.mimetype,
        caption: message.message.imageMessage.caption,
      };
    } else if (message.message?.videoMessage) {
      tipo = 'video';
      conteudo = message.message.videoMessage.url || '';
      metadata = {
        mimetype: message.message.videoMessage.mimetype,
        seconds: message.message.videoMessage.seconds,
      };
    } else {
      console.log('[webhook-evelyn] Tipo de mensagem não suportado:', JSON.stringify(message.message));
      return new Response(JSON.stringify({ ok: true, unsupported: true }), { headers: corsHeaders });
    }

    console.log(`[webhook-evelyn] Processando: tipo=${tipo}, remoteJid=${remoteJid}, conteudo=${conteudo.substring(0, 100)}...`);

    const { data, error } = await supabase.functions.invoke('processar-mensagem-evelyn', {
      body: { 
        remoteJid,
        tipo, 
        conteudo,
        metadata,
        instanceName: payload.instance,
        messageId: message.key.id,
        messageKey: message.key,
        pushName: message.pushName || null,
      }
    });

    if (error) {
      console.error('[webhook-evelyn] Erro ao invocar processar-mensagem-evelyn:', error);
      throw error;
    }

    console.log('[webhook-evelyn] Mensagem processada com sucesso:', data);

    return new Response(JSON.stringify({ ok: true, processado: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[webhook-evelyn] Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
