const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telefone, filme_id, nome_usuario, mensagem, imagem_url } = await req.json();

    if (!telefone || !filme_id) {
      return new Response(JSON.stringify({ error: 'telefone e filme_id são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = telefone.replace(/\D/g, '');
    const whatsappNumber = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';

    if (!evolutionUrl || !evolutionKey) {
      return new Response(JSON.stringify({ error: 'Evolution API não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Se tem imagem, envia como media com caption
    if (imagem_url) {
      const isUrl = imagem_url.startsWith('http');
      const isBase64 = imagem_url.startsWith('data:');

      const mediaBody: Record<string, unknown> = {
        number: `${whatsappNumber}@s.whatsapp.net`,
        mediatype: 'image',
        caption: mensagem,
        fileName: 'filme-recomendacao.png',
      };

      if (isUrl) {
        // Envia direto pela URL (poster do TMDB, etc)
        mediaBody.media = imagem_url;
      } else if (isBase64) {
        // Base64 data URI → extrair apenas o base64 puro
        mediaBody.media = imagem_url.split(',')[1] || imagem_url;
        mediaBody.mimetype = 'image/png';
      } else {
        mediaBody.media = imagem_url;
        mediaBody.mimetype = 'image/png';
      }

      const mediaResponse = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify(mediaBody),
      });

      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text();
        console.error('Erro Evolution API sendMedia:', errorText);
        
        // Fallback: tentar enviar só texto se a imagem falhar
        console.log('Tentando fallback com texto apenas...');
        const textFallback = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            number: `${whatsappNumber}@s.whatsapp.net`,
            text: mensagem,
          }),
        });
        
        if (!textFallback.ok) {
          const fallbackError = await textFallback.text();
          console.error('Erro Evolution API sendText fallback:', fallbackError);
          throw new Error(`Evolution API error: ${textFallback.status}`);
        }
      }
    } else {
      // Fallback: só texto
      const textResponse = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          number: `${whatsappNumber}@s.whatsapp.net`,
          text: mensagem,
        }),
      });

      if (!textResponse.ok) {
        const errorText = await textResponse.text();
        console.error('Erro Evolution API sendText:', errorText);
        throw new Error(`Evolution API error: ${textResponse.status}`);
      }
    }

    console.log(`[enviar-compartilhamento-filme] Enviado para ${whatsappNumber}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[enviar-compartilhamento-filme] Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
