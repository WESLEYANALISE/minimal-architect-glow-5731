import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== PARSER DE NOVIDADES (mesmo do extrair-lei-padrao) ====================

function gerarUrl(lei: string | null): string | null {
  if (!lei) return null;
  const numMatch = lei.match(/n[ºo°]?\s*([\d.]+)/i);
  if (!numMatch) return null;
  const numero = numMatch[1].replace(/\./g, '');
  const leiLower = lei.toLowerCase();

  if (leiLower.includes('emenda constitucional')) {
    return `https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc${numero}.htm`;
  }
  if (leiLower.includes('lei complementar') || leiLower.startsWith('lc')) {
    return `https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp${numero}.htm`;
  }
  if (leiLower.includes('decreto-lei') || leiLower.includes('decreto lei')) {
    return `https://www.planalto.gov.br/ccivil_03/decreto-lei/del${numero}.htm`;
  }
  if (leiLower.includes('medida provisória') || leiLower.includes('medida provisoria')) {
    return `https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/mpv/mpv${numero}.htm`;
  }
  if (leiLower.includes('lei')) {
    const numInt = parseInt(numero);
    if (numInt >= 13000) return `https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l${numero}.htm`;
    if (numInt >= 10000) return `https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l${numero}.htm`;
    return `https://www.planalto.gov.br/ccivil_03/leis/l${numero}.htm`;
  }
  return null;
}

function extrairAlteracoes(texto: string): any[] {
  const alteracoes: any[] = [];
  const padraoAnotacao = /\((?:Redação dada|Incluído|Revogado|Acrescido|Suprimido|Vetado|Vide|Vigência|Renumerado|Expressão suprimida)[^)]+\)/gi;

  // Pré-processar: juntar anotações multi-linha
  const textoNormalizado = texto.replace(
    /\((?=(?:Redação dada|Incluído|Revogado|Acrescido|Suprimido|Vetado|Vide|Vigência|Renumerado|Expressão suprimida))([\s\S]*?)\)/gi,
    (match) => match.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ')
  );

  const linhas = textoNormalizado.split(/\n/);
  let artigoAtual = '';
  let incisoAtual = '';
  let paragrafoAtual = '';
  let alineaAtual = '';
  let linhaDoArtigo = false;

  for (const linha of linhas) {
    linhaDoArtigo = false;

    const matchArtigo = linha.match(/^Art\.?\s*(\d+[ºª°]?(?:-[A-Z])?)/i);
    if (matchArtigo) {
      artigoAtual = matchArtigo[1].replace(/[ºª°]/g, '');
      incisoAtual = '';
      paragrafoAtual = '';
      alineaAtual = '';
      linhaDoArtigo = true;
    }

    const matchParagrafo = linha.match(/§\s*(\d+[ºª°]?)/i);
    if (matchParagrafo) {
      paragrafoAtual = matchParagrafo[1];
      incisoAtual = '';
      alineaAtual = '';
    }

    const matchInciso = linha.match(/^\s*(X{0,3}(?:IX|IV|V?I{0,3}))\s*[-–—]/);
    if (matchInciso && matchInciso[1]) {
      incisoAtual = matchInciso[1];
      alineaAtual = '';
    }

    const matchAlinea = linha.match(/^\s*([a-z])\)\s/);
    if (matchAlinea) {
      alineaAtual = matchAlinea[1];
    }

    const anotacoes = linha.match(padraoAnotacao);
    if (anotacoes && artigoAtual) {
      for (const anotacao of anotacoes) {
        let tipoAlteracao = 'Outro';
        if (/Redação dada/i.test(anotacao)) tipoAlteracao = 'Redação';
        else if (/Incluído/i.test(anotacao)) tipoAlteracao = 'Inclusão';
        else if (/Revogado/i.test(anotacao)) tipoAlteracao = 'Revogação';
        else if (/Acrescido/i.test(anotacao)) tipoAlteracao = 'Acréscimo';
        else if (/Suprimido/i.test(anotacao)) tipoAlteracao = 'Supressão';
        else if (/Vetado/i.test(anotacao)) tipoAlteracao = 'Vetado';
        else if (/Vide/i.test(anotacao)) tipoAlteracao = 'Vide';
        else if (/Vigência/i.test(anotacao)) tipoAlteracao = 'Vigência';
        else if (/Renumerado/i.test(anotacao)) tipoAlteracao = 'Renumeração';
        else if (/Expressão suprimida/i.test(anotacao)) tipoAlteracao = 'Supressão';

        const matchLei = anotacao.match(/(?:Lei|Decreto(?:-Lei)?|Medida Provisória|Emenda Constitucional|Lei Complementar)\s+n[ºo°]?\s*[\d.]+(?:[,\s]+de\s+[\d.]+)?/i);
        const leiAlteradora = matchLei ? matchLei[0] : null;

        const matchAno = anotacao.match(/\b(19\d{2}|20\d{2})\b/);
        const anoAlteracao = matchAno ? parseInt(matchAno[1]) : null;

        let elementoTipo = 'artigo';
        let elementoNumero: string | null = null;

        if (alineaAtual) {
          elementoTipo = 'alínea';
          elementoNumero = `${alineaAtual})`;
        } else if (paragrafoAtual) {
          elementoTipo = 'parágrafo';
          elementoNumero = `§ ${paragrafoAtual}`;
        } else if (incisoAtual) {
          elementoTipo = 'inciso';
          elementoNumero = incisoAtual;
        } else if (linhaDoArtigo && !matchParagrafo && !matchInciso) {
          elementoTipo = 'caput';
          elementoNumero = null;
        }

        alteracoes.push({
          numero_artigo: artigoAtual,
          elemento_tipo: elementoTipo,
          elemento_numero: elementoNumero,
          tipo_alteracao: tipoAlteracao,
          lei_alteradora: leiAlteradora,
          ano_alteracao: anoAlteracao,
          texto_completo: anotacao,
        });
      }
    }
  }

  return alteracoes;
}

// ==================== MAIN HANDLER ====================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, urlPlanalto, stream = false } = await req.json();

    if (!tableName || !urlPlanalto) {
      return new Response(
        JSON.stringify({ error: 'tableName e urlPlanalto são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!stream) {
      return new Response(
        JSON.stringify({ error: 'Use stream: true' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== STREAMING MODE ==========
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // ========== FASE 1: RASPAR VIA FIRECRAWL ==========
          send('fase', { fase: 'raspando', titulo: 'Fase 1: Raspando texto via Firecrawl' });

          const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
          if (!firecrawlApiKey) {
            throw new Error('FIRECRAWL_API_KEY não configurada. Conecte o Firecrawl no projeto.');
          }

          send('log', { mensagem: 'Chamando Firecrawl API...', tipo: 'info' });

          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: urlPlanalto,
              formats: ['markdown'],
              onlyMainContent: true,
              waitFor: 3000,
            }),
          });

          if (!scrapeResponse.ok) {
            const errData = await scrapeResponse.text();
            throw new Error(`Firecrawl API erro HTTP ${scrapeResponse.status}: ${errData}`);
          }

          const scrapeData = await scrapeResponse.json();
          const markdown = scrapeData?.data?.markdown || scrapeData?.markdown;

          if (!markdown || markdown.length < 100) {
            throw new Error('Firecrawl retornou conteúdo insuficiente');
          }

          // Limpar markdown
          const textoLei = markdown
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/~~([^~]+)~~/g, '')
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

          send('log', { mensagem: `✓ Texto recebido via Firecrawl: ${textoLei.length.toLocaleString()} caracteres`, tipo: 'success' });

          const anotacoesEncontradas = (textoLei.match(/\((?:Redação dada|Incluído|Revogado|Acrescido|Vetado)[^)]+\)/gi) || []).length;
          send('log', { mensagem: `📝 Anotações de alteração encontradas: ${anotacoesEncontradas}`, tipo: 'info' });

          send('texto_bruto', {
            texto: textoLei.substring(0, 5000),
            total: textoLei.length,
            anotacoes: anotacoesEncontradas,
          });

          // ========== FASE 2: EXTRAÇÃO VIA REGEX ==========
          send('fase', { fase: 'extraindo', titulo: 'Fase 2: Extraindo alterações' });
          send('log', { mensagem: 'Analisando texto com regex...' });

          const todasAlteracoes = extrairAlteracoes(textoLei);

          send('log', {
            mensagem: `✓ Extração: ${todasAlteracoes.length} alteração(ões)`,
            tipo: 'success',
          });

          for (const alt of todasAlteracoes) {
            send('alteracao', alt);
          }

          // Estatísticas por tipo
          const tiposCount: Record<string, number> = {};
          for (const alt of todasAlteracoes) {
            tiposCount[alt.tipo_alteracao] = (tiposCount[alt.tipo_alteracao] || 0) + 1;
          }
          send('log', {
            mensagem: `Tipos: ${Object.entries(tiposCount).map(([t, c]) => `${t}: ${c}`).join(', ')}`,
            tipo: 'info',
          });

          // ========== FASE 3: SALVAR NO BANCO ==========
          send('fase', { fase: 'salvando', titulo: 'Fase 3: Salvando no banco de dados' });

          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          const supabase = createClient(supabaseUrl, supabaseKey);

          if (todasAlteracoes.length > 0) {
            todasAlteracoes.sort((a, b) => (b.ano_alteracao || 0) - (a.ano_alteracao || 0));

            send('log', { mensagem: 'Apagando registros antigos...' });
            await supabase.from('historico_alteracoes').delete().eq('tabela_lei', tableName);

            const dadosParaInserir = todasAlteracoes.map((alt) => ({
              tabela_lei: tableName,
              numero_artigo: String(alt.numero_artigo || ''),
              tipo_alteracao: alt.tipo_alteracao || 'Outro',
              lei_alteradora: alt.lei_alteradora || null,
              ano_alteracao: alt.ano_alteracao || null,
              texto_completo: alt.texto_completo || null,
              elemento_tipo: alt.elemento_tipo || 'artigo',
              elemento_numero: alt.elemento_numero || null,
              elemento_texto: null,
              url_lei_alteradora: gerarUrl(alt.lei_alteradora),
            }));

            const batchSize = 100;
            for (let i = 0; i < dadosParaInserir.length; i += batchSize) {
              const batch = dadosParaInserir.slice(i, i + batchSize);
              await supabase.from('historico_alteracoes').insert(batch);

              send('salvando', {
                lote: Math.floor(i / batchSize) + 1,
                totalLotes: Math.ceil(dadosParaInserir.length / batchSize),
                registrosSalvos: Math.min(i + batchSize, dadosParaInserir.length),
              });
            }

            send('log', { mensagem: `✓ ${dadosParaInserir.length} registros salvos`, tipo: 'success' });
          }

          // Estatísticas finais
          const porElemento = {
            artigo: todasAlteracoes.filter((a) => a.elemento_tipo === 'artigo').length,
            inciso: todasAlteracoes.filter((a) => a.elemento_tipo === 'inciso').length,
            paragrafo: todasAlteracoes.filter((a) => a.elemento_tipo === 'parágrafo').length,
            alinea: todasAlteracoes.filter((a) => a.elemento_tipo === 'alínea').length,
            caput: todasAlteracoes.filter((a) => a.elemento_tipo === 'caput').length,
          };

          send('concluido', {
            success: true,
            caracteresRaspados: textoLei.length,
            totalAlteracoes: todasAlteracoes.length,
            tiposEncontrados: [...new Set(todasAlteracoes.map((a) => a.tipo_alteracao))],
            porElemento,
          });
        } catch (error: any) {
          send('erro', { message: error.message || 'Erro desconhecido' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error(`[raspar-lei-planalto] Erro:`, error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
