import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REVISION = "v1.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapeamento: slug → { tabela, url_planalto }
const LEIS_CONFIG: Record<string, { tabela: string; url: string }> = {
  // === Leis já configuradas (prioridade alta) ===
  'lei-servidor': {
    tabela: 'LEI 8112 - SERVIDOR PUBLICO',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm'
  },
  'lei-contravencoes': {
    tabela: 'DL 3688 - CONTRAVENCOES PENAIS',
    url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3688.htm'
  },
  'lei-prisao-temporaria': {
    tabela: 'LEI 7960 - PRISAO TEMPORARIA',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l7960.htm'
  },
  'lei-identificacao-criminal': {
    tabela: 'LEI 12037 - IDENTIFICACAO CRIMINAL',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12037.htm'
  },
  'lei-sa': {
    tabela: 'LEI 6404 - SOCIEDADES ANONIMAS',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l6404consol.htm'
  },
  'lei-concessoes': {
    tabela: 'LEI 8987 - CONCESSOES',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8987cons.htm'
  },
  'lei-ppp': {
    tabela: 'LEI 11079 - PPP',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11079.htm'
  },
  'lei-mpu': {
    tabela: 'LC 75 - MINISTERIO PUBLICO UNIAO',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp75.htm'
  },
  'lei-defensoria': {
    tabela: 'LC 80 - DEFENSORIA PUBLICA',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp80.htm'
  },
  'decreto-etica': {
    tabela: 'DECRETO 1171 - ETICA SERVIDOR',
    url: 'https://www.planalto.gov.br/ccivil_03/decreto/d1171.htm'
  },

  // === Tabelas vazias que precisam ser populadas ===
  'cpesca': {
    tabela: 'CP - Código de Pesca',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11959.htm'
  },
  'eterra': {
    tabela: 'EST - Estatuto da Terra',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l4504.htm'
  },
  'empe': {
    tabela: 'EST - Estatuto da MPE',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm'
  },
  'lindb': {
    tabela: 'LEI 4657 - LINDB',
    url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del4657compilado.htm'
  },

  // === Tabelas novas (19 leis) ===
  'mandadoseguranca': {
    tabela: 'LEI 12016 - MANDADO DE SEGURANCA',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12016.htm'
  },
  'habeasdata': {
    tabela: 'LEI 9507 - HABEAS DATA',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l9507.htm'
  },
  'pregao': {
    tabela: 'LEI 10520 - PREGAO',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10520.htm'
  },
  'marcocivilinternet': {
    tabela: 'LEI 12965 - MARCO CIVIL INTERNET',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm'
  },
  'arbitragem': {
    tabela: 'LEI 9307 - ARBITRAGEM',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l9307.htm'
  },
  'inquilinato': {
    tabela: 'LEI 8245 - INQUILINATO',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8245.htm'
  },
  'desapropriacao': {
    tabela: 'LEI 3365 - DESAPROPRIACAO',
    url: 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3365.htm'
  },
  'meioambiente': {
    tabela: 'LEI 6938 - MEIO AMBIENTE',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l6938.htm'
  },
  'falencia': {
    tabela: 'LEI 11101 - RECUPERACAO FALENCIA',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm'
  },
  'crimesambientais': {
    tabela: 'LEI 9605 - CRIMES AMBIENTAIS',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l9605.htm'
  },
  'feminicidio': {
    tabela: 'LEI 13104 - FEMINICIDIO',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13104.htm'
  },
  'antiterrorismo': {
    tabela: 'LEI 13260 - ANTITERRORISMO',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13260.htm'
  },
  'crimesfinanceiro': {
    tabela: 'LEI 7492 - CRIMES SISTEMA FINANCEIRO',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l7492.htm'
  },
  'crimestributario': {
    tabela: 'LEI 8137 - CRIMES ORDEM TRIBUTARIA',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8137.htm'
  },
  'fichalimpa': {
    tabela: 'LC 135 - FICHA LIMPA',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp135.htm'
  },
  'crimesresponsabilidade': {
    tabela: 'LEI 1079 - CRIMES RESPONSABILIDADE',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l1079.htm'
  },
  'crimestransnacionais': {
    tabela: 'LEI 5015 - CRIMES TRANSNACIONAIS',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/decreto/d5015.htm'
  },
  'cdc': {
    tabela: 'CDC – Código de Defesa do Consumidor',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm'
  },
  'ctn': {
    tabela: 'CTN – Código Tributário Nacional',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm'
  },
  'cf': {
    tabela: 'CF - Constituição Federal',
    url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm'
  },
};

serve(async (req) => {
  console.log(`🚀 [importar-lei-vademecum ${REVISION}] Iniciando...`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, forceReimport } = await req.json();

    if (!slug) {
      return new Response(
        JSON.stringify({ success: false, error: "slug é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = LEIS_CONFIG[slug];
    if (!config) {
      return new Response(
        JSON.stringify({ success: false, error: `Slug desconhecido: ${slug}`, slugsDisponiveis: Object.keys(LEIS_CONFIG) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já tem dados
    if (!forceReimport) {
      const { count } = await supabase
        .from(config.tabela)
        .select('*', { count: 'exact', head: true });
      
      if (count && count > 0) {
        console.log(`✅ Tabela ${config.tabela} já tem ${count} artigos. Use forceReimport=true para reimportar.`);
        return new Response(
          JSON.stringify({ success: true, message: `Tabela já populada com ${count} artigos`, totalArtigos: count }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`📍 Raspando: ${config.url}`);
    console.log(`📋 Tabela: ${config.tabela}`);

    // Chamar raspar-planalto-browserless
    const { data: raspData, error: raspError } = await supabase.functions.invoke('raspar-planalto-browserless', {
      body: { urlPlanalto: config.url }
    });

    if (raspError || !raspData?.success) {
      console.error('❌ Erro ao raspar:', raspError || raspData?.error);
      return new Response(
        JSON.stringify({ success: false, error: raspData?.error || raspError?.message || "Erro ao raspar" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const artigos = raspData.artigos || [];
    console.log(`✅ Raspagem OK: ${artigos.length} artigos`);

    if (artigos.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum artigo encontrado na raspagem" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se forceReimport, limpar tabela primeiro
    if (forceReimport) {
      await supabase.from(config.tabela).delete().neq('id', 0);
    }

    // Normaliza ordinal: ° → º, Xo → Xº (1-9), remove prefixo Art.
    function normalizarOrdinal(num: string): string {
      let s = num.trim().replace(/^Art\.?\s*/i, '').trim();
      s = s.replace(/°/g, 'º');
      s = s.replace(/^(\d)o\b/i, (_, d) => {
        const n = parseInt(d);
        return n >= 1 && n <= 9 ? `${n}º` : `${d}o`;
      });
      if (!/º/.test(s)) {
        const m = s.match(/^(\d+)([-–]?[A-Z])?$/i);
        if (m) {
          const n = parseInt(m[1]);
          if (n >= 1 && n <= 9) s = `${n}º${m[2] || ''}`;
        }
      }
      return s;
    }

    // Construir lista completa com cabeçalhos estruturais (TÍTULO, CAPÍTULO, SEÇÃO)
    // intercalados entre os artigos, igual ao padrão do Código Penal
    const registrosCompletos: Array<{ "Número do Artigo": string; "Artigo": string; ordem_artigo: number }> = [];
    let ordemAtual = 1;
    let ultimoTitulo = '';
    let ultimoCapitulo = '';
    let ultimaSecao = '';

    for (const art of artigos) {
      // Inserir cabeçalho de TÍTULO se mudou
      if (art.titulo_estrutural && art.titulo_estrutural !== ultimoTitulo) {
        ultimoTitulo = art.titulo_estrutural;
        registrosCompletos.push({
          "Número do Artigo": "",
          "Artigo": ultimoTitulo,
          ordem_artigo: ordemAtual++,
        });
      }

      // Inserir cabeçalho de CAPÍTULO se mudou
      if (art.capitulo && art.capitulo !== ultimoCapitulo) {
        ultimoCapitulo = art.capitulo;
        registrosCompletos.push({
          "Número do Artigo": "",
          "Artigo": ultimoCapitulo,
          ordem_artigo: ordemAtual++,
        });
      }

      // Inserir cabeçalho de SEÇÃO se mudou
      if (art.secao && art.secao !== ultimaSecao) {
        ultimaSecao = art.secao;
        registrosCompletos.push({
          "Número do Artigo": "",
          "Artigo": ultimaSecao,
          ordem_artigo: ordemAtual++,
        });
      }

      // Inserir o artigo em si
      registrosCompletos.push({
        "Número do Artigo": normalizarOrdinal(art.numeroCompleto || art.numero?.toString() || `${ordemAtual}`),
        "Artigo": art.texto || '',
        ordem_artigo: ordemAtual++,
      });
    }

    console.log(`📊 Total de registros (artigos + cabeçalhos): ${registrosCompletos.length}`);

    // Inserir em lotes de 50
    const BATCH_SIZE = 50;
    let totalInseridos = 0;

    for (let i = 0; i < registrosCompletos.length; i += BATCH_SIZE) {
      const batchFull = registrosCompletos.slice(i, i + BATCH_SIZE);

      const { error: insertError } = await supabase
        .from(config.tabela)
        .insert(batchFull);

      if (insertError) {
        // Tentar sem ordem_artigo (tabelas antigas sem essa coluna)
        console.warn(`⚠️ Tentando sem ordem_artigo...`);
        const batchSimples = batchFull.map(({ ordem_artigo, ...rest }: any) => rest);
        const { error: insertError2 } = await supabase
          .from(config.tabela)
          .insert(batchSimples);

        if (insertError2) {
          console.error(`❌ Erro ao inserir batch ${i}:`, insertError2);
        } else {
          totalInseridos += batchSimples.length;
        }
      } else {
        totalInseridos += batchFull.length;
      }
    }

    console.log(`✅ ${totalInseridos} artigos inseridos em ${config.tabela}`);

    return new Response(
      JSON.stringify({
        success: true,
        revisao: REVISION,
        slug,
        tabela: config.tabela,
        totalArtigos: totalInseridos,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro geral: ${errorMessage}`);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
