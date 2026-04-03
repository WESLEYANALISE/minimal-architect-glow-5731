import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function extrairEmentaReal(textoFormatado: string): string | null {
  if (!textoFormatado) return null;

  const regex = /(?:Vigência|Conversão da Medida Provisória|Regulamento|Texto compilado|Mensagem de veto)\s*\n*((?:Altera|Institui|Dispõe|Cria|Autoriza|Ratifica|Revoga|Estabelece|Acrescenta|Denomina|Dá nova redação|Regulamenta|Modifica|Inclui|Reabre|Abre|Torna|Extingue|Transforma|Prorroga|Renomeia)[^\n]*(?:\n[^\n]*)?)/i;
  const match = textoFormatado.match(regex);

  if (match?.[1]) {
    return match[1].replace(/\s+/g, ' ').trim().substring(0, 500);
  }

  const regexDireto = /((?:Altera|Institui|Dispõe|Cria|Autoriza|Ratifica|Revoga|Estabelece|Acrescenta|Denomina|Dá nova redação|Regulamenta|Modifica|Inclui|Reabre|Abre|Torna|Extingue|Transforma|Prorroga|Renomeia)[^\n]*)/i;
  const matchDireto = textoFormatado.match(regexDireto);

  if (matchDireto?.[1]) {
    return matchDireto[1].replace(/\s+/g, ' ').trim().substring(0, 500);
  }

  return null;
}

async function processarLei(lei: any): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    // 1. Verificar se já está na resenha diária
    const { data: existing } = await supabase
      .from('resenha_diaria')
      .select('id')
      .eq('numero_lei', lei.numero_lei)
      .maybeSingle();

    if (existing) {
      // Já processada, apenas marcar como aprovada
      await supabase
        .from('leis_push_2025')
        .update({ status: 'aprovado' })
        .eq('id', lei.id);
      return { sucesso: true };
    }

    // 2. Raspar texto bruto se não tiver
    let textoBruto = lei.texto_bruto;

    if (!textoBruto) {
      console.log(`Raspando texto bruto: ${lei.numero_lei}`);

      const respRaspar = await fetch(
        `${SUPABASE_URL}/functions/v1/raspar-planalto-bruto`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            urlPlanalto: lei.url_planalto,
            tableName: 'leis_push_2025',
          }),
        }
      );

      const resultRaspar = await respRaspar.json();

      if (!resultRaspar.success) {
        throw new Error(resultRaspar.error || 'Falha na raspagem');
      }

      textoBruto = resultRaspar.textoBruto;
    }

    // 3. Formatar com IA (stream SSE)
    console.log(`Formatando com IA: ${lei.numero_lei}`);

    const respFormatar = await fetch(
      `${SUPABASE_URL}/functions/v1/formatar-lei-push`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ textoBruto }),
      }
    );

    if (!respFormatar.ok) {
      const errorData = await respFormatar.json();
      throw new Error(errorData.error || 'Erro no processamento IA');
    }

    // Processar stream SSE
    const reader = respFormatar.body?.getReader();
    if (!reader) throw new Error('Stream não disponível');

    const decoder = new TextDecoder();
    let buffer = '';
    let textoFinal = '';
    let artigos: Array<{ numero: string; texto: string }> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'complete') {
            textoFinal = data.texto;
            artigos = data.artigos || [];
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        } catch {
          // Ignorar linhas SSE inválidas
        }
      }
    }

    if (!textoFinal) {
      throw new Error('Nenhum texto formatado retornado pelo stream');
    }

    // 4. Salvar no banco
    await supabase
      .from('leis_push_2025')
      .update({
        texto_bruto: textoBruto,
        texto_formatado: textoFinal,
        artigos: artigos,
        status: 'aprovado',
      })
      .eq('id', lei.id);

    // 5. Upsert na resenha diária
    const ementaReal = extrairEmentaReal(textoFinal) || lei.ementa;

    await supabase
      .from('resenha_diaria')
      .insert({
        numero_lei: lei.numero_lei,
        ementa: ementaReal,
        data_publicacao: lei.data_publicacao || lei.data_dou,
        url_planalto: lei.url_planalto,
        artigos: artigos,
        areas_direito: lei.areas_direito,
        texto_formatado: textoFinal,
        status: 'ativo',
        ordem_dou: lei.ordem_dou || null,
      });

    // 6. Tentar revisão de ementa (não crítico)
    try {
      const ementaAtual = lei.ementa || '';
      const pareceInvalida =
        !ementaAtual ||
        ementaAtual.length < 20 ||
        /^Lei\s+(nº|Ordinária|Complementar)/i.test(ementaAtual) ||
        /^Ementa pendente/i.test(ementaAtual);

      if (pareceInvalida && textoBruto) {
        await fetch(
          `${SUPABASE_URL}/functions/v1/revisar-ementa-lei`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ leiId: lei.id }),
          }
        );
      }
    } catch {
      // Revisão de ementa é opcional
    }

    console.log(`✅ ${lei.numero_lei}: ${artigos.length} artigos`);
    return { sucesso: true };

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`❌ ${lei.numero_lei}: ${msg}`);
    return { sucesso: false, erro: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let limite = 10;
    try {
      const body = await req.json();
      if (body?.limite) limite = Math.min(body.limite, 20);
    } catch {
      // Sem body = usar default
    }

    // Buscar leis pendentes
    const { data: leis, error } = await supabase
      .from('leis_push_2025')
      .select('id, numero_lei, ementa, data_publicacao, data_dou, url_planalto, status, texto_bruto, texto_formatado, artigos, areas_direito, ordem_dou')
      .eq('status', 'pendente')
      .order('data_dou', { ascending: false, nullsFirst: false })
      .order('ordem_dou', { ascending: true, nullsFirst: false })
      .limit(limite);

    if (error) {
      throw new Error(`Erro ao buscar leis: ${error.message}`);
    }

    if (!leis || leis.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma lei pendente', processadas: 0, erros: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 ${leis.length} leis pendentes para processar`);

    let processadas = 0;
    let errosCount = 0;
    const detalhes: Array<{ lei: string; status: string; erro?: string }> = [];

    for (const lei of leis) {
      const resultado = await processarLei(lei);

      if (resultado.sucesso) {
        processadas++;
        detalhes.push({ lei: lei.numero_lei, status: 'ok' });
      } else {
        errosCount++;
        detalhes.push({ lei: lei.numero_lei, status: 'erro', erro: resultado.erro });
      }
    }

    console.log(`✅ Concluído: ${processadas} processadas, ${errosCount} erros`);

    return new Response(
      JSON.stringify({
        processadas,
        erros: errosCount,
        total: leis.length,
        detalhes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Erro geral:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
