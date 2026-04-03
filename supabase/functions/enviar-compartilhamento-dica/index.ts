import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const getAreaEmoji = (area?: string): string => {
  if (!area) return '⚖️';
  const lower = area.toLowerCase();
  if (lower.includes('constitucional')) return '⚖️';
  if (lower.includes('penal')) return '⚖️';
  if (lower.includes('civil')) return '📜';
  if (lower.includes('trabalho')) return '👷';
  if (lower.includes('administrativo')) return '🏛️';
  if (lower.includes('tributário') || lower.includes('tributario')) return '💰';
  if (lower.includes('processual')) return '⚙️';
  if (lower.includes('empresarial')) return '🏢';
  if (lower.includes('ambiental')) return '🌿';
  return '⚖️';
};

// Mapa de tabelas de biblioteca
const BIBLIOTECA_TABELAS: Record<string, string> = {
  classicos: 'BIBLIOTECA-CLASSICOS',
  oab: 'BIBILIOTECA-OAB',
  estudos: 'BIBLIOTECA-ESTUDOS',
  lideranca: 'BIBLIOTECA-LIDERANÇA',
  oratoria: 'BIBLIOTECA-ORATORIA',
  politica: 'BIBLIOTECA-POLITICA',
  portugues: 'BIBLIOTECA-PORTUGUES',
  'pesquisa-cientifica': 'BIBLIOTECA-PESQUISA-CIENTIFICA',
  'fora-da-toga': 'BIBLIOTECA-FORA-DA-TOGA',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { telefone, dica_id, nome_usuario, imagem_personalizada, tipo_envio, resumo_texto, resumo_titulo, resumo_area, resumo_tema, resumo_id } = await req.json();

    if (!telefone) {
      return new Response(JSON.stringify({ error: 'telefone é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Modo resumo: enviar resumo jurídico via WhatsApp
    const isResumoMode = !dica_id && (resumo_texto || resumo_titulo);

    if (!dica_id && !isResumoMode) {
      return new Response(JSON.stringify({ error: 'dica_id ou resumo_titulo são obrigatórios' }), {
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

    // ========== MODO RESUMO ==========
    if (isResumoMode) {
      const nome = nome_usuario || 'Estudante';

      // ---------- PDF ----------
      if (tipo_envio === 'pdf' && resumo_texto) {
        let pdfUrl = '';

        // Check if resumo_texto is already a URL (pre-generated PDF, e.g. mind map)
        if (resumo_texto.startsWith('http')) {
          pdfUrl = resumo_texto;
          console.log('[resumo-pdf] Using pre-generated PDF URL:', pdfUrl);
        } else {
          console.log('[resumo-pdf] Gerando PDF via exportar-pdf-educacional...');
          
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

          const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/exportar-resumo-pdf`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              resumo: resumo_texto,
              titulo: resumo_titulo || 'Resumo Jurídico',
              resumoId: resumo_id,
              area: resumo_area,
              tema: resumo_tema,
            }),
          });

          if (!pdfResponse.ok) {
            const errText = await pdfResponse.text();
            console.error('[resumo-pdf] Erro ao gerar PDF:', errText);
            throw new Error(`Erro ao gerar PDF: ${pdfResponse.status}`);
          }

          const pdfData = await pdfResponse.json();
          pdfUrl = pdfData.pdfUrl;
        }

        if (!pdfUrl) {
          throw new Error('URL do PDF não retornada');
        }

        console.log('[resumo-pdf] PDF URL:', pdfUrl);

        // Enviar PDF como documento via Evolution API
        const mediaResponse = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            number: `${whatsappNumber}@s.whatsapp.net`,
            mediatype: 'document',
            media: pdfUrl,
            mimetype: 'application/pdf',
            fileName: `${resumo_titulo || 'Resumo Jurídico'}.pdf`,
            caption: `${getAreaEmoji(resumo_area)} *${resumo_area || 'Direito'}*\n📂 ${resumo_tema || ''}\n📝 ${resumo_titulo || 'Resumo Jurídico'}\n\n✨ _Evelyn - Sua assistente jurídica pessoal_`,
          }),
        });

        if (!mediaResponse.ok) {
          const errorText = await mediaResponse.text();
          console.error('[resumo-pdf] Erro Evolution sendMedia:', errorText);
          
          throw new Error(`Falha ao enviar PDF via Evolution: ${mediaResponse.status}`);
        }

        console.log(`[resumo-pdf] Enviado para ${whatsappNumber}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ---------- TEXTO ----------
      const resumoLines: string[] = [];
      
      resumoLines.push(`╔══════════════════╗`);
      resumoLines.push(`   📚 *Resumo Jurídico*`);
      resumoLines.push(`╚══════════════════╝`);
      resumoLines.push('');
      if (resumo_area) resumoLines.push(`${getAreaEmoji(resumo_area)} *${resumo_area}*`);
      if (resumo_tema) resumoLines.push(`📂 ${resumo_tema}`);
      resumoLines.push(`📝 *${resumo_titulo || 'Resumo'}*`);
      resumoLines.push('');
      resumoLines.push('━━━━━━━━━━━━━━━━━━');

      if (resumo_texto) {
        // Formatação completa de Markdown para WhatsApp
        let textoLimpo = resumo_texto;

        // Títulos
        textoLimpo = textoLimpo.replace(/^### (.+)$/gm, '🔹 *$1*');
        textoLimpo = textoLimpo.replace(/^## (.+)$/gm, '\n━━━━━━━━━━\n📌 *$1*\n━━━━━━━━━━');
        textoLimpo = textoLimpo.replace(/^# (.+)$/gm, '\n╔════════════╗\n   *$1*\n╚════════════╝');

        // Negrito
        textoLimpo = textoLimpo.replace(/\*\*(.+?)\*\*/g, '*$1*');

        // Itálico duplo underscore
        textoLimpo = textoLimpo.replace(/_{2}(.*?)_{2}/g, '_$1_');

        // Riscado
        textoLimpo = textoLimpo.replace(/~~(.+?)~~/g, '~$1~');

        // Listas
        textoLimpo = textoLimpo.replace(/^- (.+)$/gm, '  • $1');
        textoLimpo = textoLimpo.replace(/^\* (.+)$/gm, '  • $1');

        // Citações
        textoLimpo = textoLimpo.replace(/^> (.+)$/gm, '💬 _$1_');

        // Código inline
        textoLimpo = textoLimpo.replace(/`(.+?)`/g, '```$1```');

        // Links
        textoLimpo = textoLimpo.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');

        // Separadores
        textoLimpo = textoLimpo.replace(/^---$/gm, '━━━━━━━━━━━━━━');
        textoLimpo = textoLimpo.replace(/^\*\*\*$/gm, '━━━━━━━━━━━━━━');

        // Limpar múltiplas linhas vazias
        textoLimpo = textoLimpo.replace(/\n{3,}/g, '\n\n');
        
        if (textoLimpo.length > 3000) {
          textoLimpo = textoLimpo.substring(0, 3000) + '\n\n_... (resumo truncado)_';
        }
        
        resumoLines.push('');
        resumoLines.push(textoLimpo);
      }

      resumoLines.push('');
      resumoLines.push('━━━━━━━━━━━━━━━━━━');
      resumoLines.push(`✨ Enviado por *${nome}* via _Evelyn - Direito Premium_`);
      resumoLines.push(`📱 _Direito Premium_`);

      const resumoCaption = resumoLines.join('\n');

      const textResponse = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          number: `${whatsappNumber}@s.whatsapp.net`,
          text: resumoCaption,
        }),
      });

      if (!textResponse.ok) {
        const errorText = await textResponse.text();
        console.error('Erro Evolution API sendText (resumo):', errorText);
        throw new Error(`Evolution API error: ${textResponse.status}`);
      }

      console.log(`[enviar-compartilhamento-dica] Resumo texto enviado para ${whatsappNumber}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== MODO DICA (original) ==========
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar dados da dica
    const { data: dica, error: dicaError } = await supabase
      .from('dicas_do_dia')
      .select('livro_id, biblioteca, livro_titulo, livro_autor, livro_capa, frase_dia, livro_sobre, area_livro')
      .eq('id', dica_id)
      .single();

    if (dicaError || !dica) {
      console.error('Erro ao buscar dica:', dicaError);
      return new Response(JSON.stringify({ error: 'Dica não encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar link do livro na tabela da biblioteca
    let livroLink = '';
    if (dica.livro_id && dica.biblioteca) {
      const tabela = BIBLIOTECA_TABELAS[dica.biblioteca];
      if (tabela) {
        const { data: livro } = await supabase
          .from(tabela)
          .select('link')
          .eq('id', dica.livro_id)
          .single();
        
        if (livro?.link) {
          livroLink = livro.link;
        }
      }
    }

    // ========== MODO DICA (original) ==========
    // Montar caption formatado para WhatsApp
    const nome = nome_usuario || 'Um amigo';
    const lines: string[] = [];
    
    lines.push(`╔══════════════════╗`);
    lines.push(`   📚 *Recomendação do Dia*`);
    lines.push(`╚══════════════════╝`);
    lines.push('');
    lines.push(`📖 *${dica.livro_titulo}*`);
    if (dica.livro_autor) {
      lines.push(`✍️ _${dica.livro_autor}_`);
    }
    if (dica.area_livro) {
      lines.push(`📂 ${dica.area_livro}`);
    }
    lines.push('');
    if (dica.livro_sobre) {
      // Resumo persuasivo de até 5 linhas sem abreviar
      const sobreResumo = dica.livro_sobre.length > 500 
        ? dica.livro_sobre.substring(0, 500).trim() 
        : dica.livro_sobre;
      lines.push(`📝 *Sobre o livro:*`);
      lines.push(sobreResumo);
      lines.push('');
    }
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push(`✨ *${nome}* recomendou este livro pra você!`);
    lines.push('');
    if (dica.frase_dia) {
      lines.push(`_"${dica.frase_dia}"_`);
      lines.push('');
    }
    if (livroLink) {
      lines.push(`📖 *Link do livro:*`);
      lines.push(livroLink);
    } else {
      lines.push(`📖 *Link do livro:*`);
      lines.push(`https://sleek-space-design-65.lovable.app`);
    }

    const caption = lines.join('\n');

    // Enviar imagem + caption via sendMedia
    const imagemParaEnviar = imagem_personalizada || dica.livro_capa;
    if (imagemParaEnviar) {
      const mediaResponse = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          number: `${whatsappNumber}@s.whatsapp.net`,
          mediatype: 'image',
          media: imagemParaEnviar,
          caption: caption,
        }),
      });

      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text();
        console.error('Erro Evolution API sendMedia:', errorText);
        throw new Error(`Evolution API error: ${mediaResponse.status}`);
      }

      console.log(`[enviar-compartilhamento-dica] Enviado para ${whatsappNumber}`);
    } else {
      // Fallback: enviar só texto
      const textResponse = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          number: `${whatsappNumber}@s.whatsapp.net`,
          text: caption,
        }),
      });

      if (!textResponse.ok) {
        const errorText = await textResponse.text();
        console.error('Erro Evolution API sendText:', errorText);
        throw new Error(`Evolution API error: ${textResponse.status}`);
      }

      console.log(`[enviar-compartilhamento-dica] Texto enviado para ${whatsappNumber}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[enviar-compartilhamento-dica] Erro:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
