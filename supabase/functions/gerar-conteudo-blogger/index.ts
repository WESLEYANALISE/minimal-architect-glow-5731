import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

const TABELAS_PERMITIDAS = [
  'BLOGGER_JURIDICO',
  'blogger_faculdade',
  'blogger_stf',
  'blogger_senado',
  'blogger_camara',
  'blogger_constitucional',
  'blogger_tribunais',
  // Novas categorias
  'blogger_penal',
  'blogger_civil',
  'blogger_trabalho',
  'blogger_tributario',
  'blogger_consumidor',
  'blogger_administrativo',
  'blogger_ambiental',
  'blogger_empresarial',
  'blogger_eleitoral',
  'blogger_previdenciario',
  'blogger_processo_civil',
  'blogger_processo_penal',
  'blogger_processo_trabalho',
  'blogger_familia',
  'blogger_sucessoes',
  'blogger_digital',
  'blogger_lgpd',
  'blogger_direitos_humanos',
  'blogger_internacional',
  'blogger_financeiro',
  'blogger_imobiliario',
  'blogger_bancario',
  'blogger_agronegocio',
  'blogger_militar',
  'blogger_maritimo',
  'blogger_saude',
  'blogger_urbanistico',
  'blogger_desportivo',
  'blogger_energia',
  'blogger_startups',
  'blogger_compliance',
  'blogger_contratual',
  'blogger_filosofia',
  'blogger_sociologia',
  'blogger_hermeneutica',
  'blogger_comparado',
  'blogger_mediacao',
  'blogger_pratica',
  'blogger_jurisprudencia',
  'blogger_leis_explicadas',
  'oab_carreira_blog',
  'advogado_blog',
];

const CONTEXTOS: Record<string, string> = {
  BLOGGER_JURIDICO: 'carreiras jurídicas',
  blogger_faculdade: 'faculdade de Direito, graduação em Direito, curso de Direito no Brasil',
  blogger_stf: 'Supremo Tribunal Federal (STF), jurisdição constitucional, controle de constitucionalidade no Brasil',
  blogger_senado: 'Senado Federal do Brasil, processo legislativo, representação dos estados',
  blogger_camara: 'Câmara dos Deputados do Brasil, processo legislativo, representação popular',
  blogger_constitucional: 'Direito Constitucional brasileiro, Constituição Federal de 1988, direitos fundamentais',
  blogger_tribunais: 'Tribunais Superiores do Brasil (STJ, TST, TSE, STM), sistema judiciário brasileiro',
  blogger_penal: 'Direito Penal brasileiro, crimes, penas, teoria do delito',
  blogger_civil: 'Direito Civil brasileiro, obrigações, contratos, responsabilidade civil, direitos reais',
  blogger_trabalho: 'Direito do Trabalho brasileiro, CLT, relações trabalhistas, direitos do trabalhador',
  blogger_tributario: 'Direito Tributário brasileiro, impostos, tributos, obrigações fiscais',
  blogger_consumidor: 'Direito do Consumidor brasileiro, CDC, relações de consumo, proteção ao consumidor',
  blogger_administrativo: 'Direito Administrativo brasileiro, administração pública, atos administrativos, licitações',
  blogger_ambiental: 'Direito Ambiental brasileiro, proteção ambiental, crimes ambientais, sustentabilidade',
  blogger_empresarial: 'Direito Empresarial brasileiro, sociedades, falência, recuperação judicial',
  blogger_eleitoral: 'Direito Eleitoral brasileiro, eleições, partidos políticos, justiça eleitoral',
  blogger_previdenciario: 'Direito Previdenciário brasileiro, INSS, aposentadoria, benefícios previdenciários',
  blogger_processo_civil: 'Processo Civil brasileiro, CPC, procedimentos judiciais cíveis',
  blogger_processo_penal: 'Processo Penal brasileiro, CPP, inquérito, ação penal',
  blogger_processo_trabalho: 'Processo do Trabalho brasileiro, reclamação trabalhista, recursos trabalhistas',
  blogger_familia: 'Direito de Família brasileiro, casamento, divórcio, guarda, alimentos',
  blogger_sucessoes: 'Direito das Sucessões brasileiro, herança, testamento, inventário',
  blogger_digital: 'Direito Digital brasileiro, crimes cibernéticos, Marco Civil da Internet',
  blogger_lgpd: 'LGPD, proteção de dados pessoais, privacidade digital no Brasil',
  blogger_direitos_humanos: 'Direitos Humanos, tratados internacionais, direitos fundamentais',
  blogger_internacional: 'Direito Internacional Público e Privado, tratados, cooperação internacional',
  blogger_financeiro: 'Direito Financeiro brasileiro, orçamento público, finanças públicas',
  blogger_imobiliario: 'Direito Imobiliário brasileiro, compra e venda de imóveis, registros',
  blogger_bancario: 'Direito Bancário brasileiro, operações financeiras, contratos bancários',
  blogger_agronegocio: 'Direito do Agronegócio brasileiro, propriedade rural, contratos agrários',
  blogger_militar: 'Direito Militar brasileiro, justiça militar, crimes militares',
  blogger_maritimo: 'Direito Marítimo brasileiro, navegação, comércio marítimo',
  blogger_saude: 'Direito à Saúde no Brasil, SUS, planos de saúde, judicialização da saúde',
  blogger_urbanistico: 'Direito Urbanístico brasileiro, Estatuto da Cidade, planejamento urbano',
  blogger_desportivo: 'Direito Desportivo brasileiro, justiça desportiva, contratos esportivos',
  blogger_energia: 'Direito da Energia no Brasil, regulação energética, ANEEL',
  blogger_startups: 'Direito para Startups, Marco Legal das Startups, investimentos',
  blogger_compliance: 'Compliance e anticorrupção, Lei Anticorrupção, programas de integridade',
  blogger_contratual: 'Direito Contratual brasileiro, contratos, obrigações contratuais',
  blogger_filosofia: 'Filosofia do Direito, justiça, ética, fundamentos filosóficos do Direito',
  blogger_sociologia: 'Sociologia Jurídica, Direito e sociedade, movimentos sociais e Direito',
  blogger_hermeneutica: 'Hermenêutica Jurídica, interpretação da lei, métodos interpretativos',
  blogger_comparado: 'Direito Comparado, sistemas jurídicos do mundo, Common Law vs Civil Law',
  blogger_mediacao: 'Mediação e arbitragem, resolução de conflitos, métodos alternativos',
  blogger_pratica: 'Prática Jurídica, petições, audiências, rotina forense',
  blogger_jurisprudencia: 'Jurisprudência brasileira, decisões dos tribunais, súmulas',
  blogger_leis_explicadas: 'Leis brasileiras explicadas, legislação comentada',
  oab_carreira_blog: 'Exame da OAB, carreira na advocacia, preparação para OAB',
  advogado_blog: 'Advocacia, carreira do advogado, prática advocatícia',
};

// ============= FONTES DE DADOS: Vade Mecum + Resumos =============
const FONTES_DADOS: Record<string, { vadeMecum: string[], areaResumo: string }> = {
  blogger_penal: { vadeMecum: ['CP - Código Penal', 'CPP – Código de Processo Penal'], areaResumo: 'Direito Penal' },
  blogger_civil: { vadeMecum: ['CC - Código Civil'], areaResumo: 'Direito Civil' },
  blogger_trabalho: { vadeMecum: ['CLT - Consolidação das Leis do Trabalho'], areaResumo: 'Direito do Trabalho' },
  blogger_tributario: { vadeMecum: ['CTN – Código Tributário Nacional'], areaResumo: 'Direito Tributário' },
  blogger_constitucional: { vadeMecum: ['CF - Constituição Federal'], areaResumo: 'Direito Constitucional' },
  blogger_consumidor: { vadeMecum: ['CDC – Código de Defesa do Consumidor'], areaResumo: 'Direito do Consumidor' },
  blogger_administrativo: { vadeMecum: [], areaResumo: 'Direito Administrativo' },
  blogger_ambiental: { vadeMecum: [], areaResumo: 'Direito Ambiental' },
  blogger_empresarial: { vadeMecum: [], areaResumo: 'Direito Empresarial' },
  blogger_eleitoral: { vadeMecum: ['CE – Código Eleitoral'], areaResumo: 'Direito Eleitoral' },
  blogger_previdenciario: { vadeMecum: [], areaResumo: 'Direito Previdenciário' },
  blogger_processo_civil: { vadeMecum: ['CPC – Código de Processo Civil'], areaResumo: 'Processo Civil' },
  blogger_processo_penal: { vadeMecum: ['CPP – Código de Processo Penal'], areaResumo: 'Processo Penal' },
  blogger_processo_trabalho: { vadeMecum: ['CLT - Consolidação das Leis do Trabalho'], areaResumo: 'Processo do Trabalho' },
  blogger_familia: { vadeMecum: ['CC - Código Civil'], areaResumo: 'Direito de Família' },
  blogger_sucessoes: { vadeMecum: ['CC - Código Civil'], areaResumo: 'Direito das Sucessões' },
  blogger_digital: { vadeMecum: [], areaResumo: 'Direito Digital' },
  blogger_lgpd: { vadeMecum: [], areaResumo: 'LGPD' },
  blogger_direitos_humanos: { vadeMecum: ['CF - Constituição Federal'], areaResumo: 'Direitos Humanos' },
  blogger_internacional: { vadeMecum: [], areaResumo: 'Direito Internacional' },
  blogger_financeiro: { vadeMecum: ['CTN – Código Tributário Nacional'], areaResumo: 'Direito Financeiro' },
  blogger_imobiliario: { vadeMecum: ['CC - Código Civil'], areaResumo: 'Direito Imobiliário' },
  blogger_bancario: { vadeMecum: ['CDC – Código de Defesa do Consumidor'], areaResumo: 'Direito Bancário' },
  blogger_agronegocio: { vadeMecum: [], areaResumo: 'Direito Agrário' },
  blogger_militar: { vadeMecum: ['CPM – Código Penal Militar', 'CPPM – Código de Processo Penal Militar'], areaResumo: 'Direito Militar' },
  blogger_maritimo: { vadeMecum: [], areaResumo: 'Direito Marítimo' },
  blogger_saude: { vadeMecum: ['CF - Constituição Federal'], areaResumo: 'Direito da Saúde' },
  blogger_urbanistico: { vadeMecum: ['ESTATUTO - CIDADE'], areaResumo: 'Direito Urbanístico' },
  blogger_desportivo: { vadeMecum: [], areaResumo: 'Direito Desportivo' },
  blogger_contratual: { vadeMecum: ['CC - Código Civil'], areaResumo: 'Direito Contratual' },
  blogger_mediacao: { vadeMecum: [], areaResumo: 'Mediação' },
  blogger_compliance: { vadeMecum: [], areaResumo: 'Compliance' },
  blogger_filosofia: { vadeMecum: [], areaResumo: 'Filosofia do Direito' },
  blogger_sociologia: { vadeMecum: [], areaResumo: 'Sociologia Jurídica' },
  blogger_hermeneutica: { vadeMecum: [], areaResumo: 'Hermenêutica Jurídica' },
  blogger_comparado: { vadeMecum: [], areaResumo: 'Direito Comparado' },
  blogger_jurisprudencia: { vadeMecum: [], areaResumo: 'Jurisprudência' },
  blogger_pratica: { vadeMecum: [], areaResumo: 'Prática Jurídica' },
  blogger_leis_explicadas: { vadeMecum: [], areaResumo: '' },
  blogger_stf: { vadeMecum: ['CF - Constituição Federal'], areaResumo: 'Direito Constitucional' },
};

// ============= Buscar contexto do Vade Mecum e Resumos =============
async function buscarContextoEnriquecido(
  supabase: any,
  tabela: string,
  titulo: string
): Promise<string> {
  const fontes = FONTES_DADOS[tabela];
  if (!fontes) return '';

  // Extrair palavras-chave do título (remover palavras curtas/stop words)
  const stopWords = new Set(['o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'uns', 'umas', 'e', 'é', 'que', 'para', 'por', 'com', 'como', 'quando', 'onde', 'qual', 'quais', 'se', 'não', 'mais', 'pode', 'ser', 'foi', 'são', 'tem', 'já', 'seu', 'sua', 'entre', 'sobre', 'ao', 'aos', 'às', 'pela', 'pelo', 'pelas', 'pelos']);
  
  const palavras = titulo
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(p => p.length > 2 && !stopWords.has(p));

  if (palavras.length === 0) return '';

  // Criar termo de busca para textSearch (OR entre palavras)
  const searchQuery = palavras.slice(0, 5).join(' | ');

  const artigosEncontrados: string[] = [];
  const resumosEncontrados: string[] = [];

  // 1. Buscar artigos do Vade Mecum
  for (const tabelaVade of fontes.vadeMecum) {
    try {
      // Tentar busca com ilike em vez de textSearch (mais compatível)
      const likeConditions = palavras.slice(0, 3).map(p => `Artigo.ilike.%${p}%`);
      
      const { data, error } = await supabase
        .from(tabelaVade)
        .select('"Número do Artigo", Artigo')
        .or(likeConditions.join(','))
        .limit(5);

      if (!error && data && data.length > 0) {
        for (const artigo of data) {
          const num = artigo['Número do Artigo'] || '?';
          const texto = (artigo.Artigo || '').substring(0, 400);
          artigosEncontrados.push(`Art. ${num}: ${texto}`);
        }
        console.log(`✅ ${data.length} artigos encontrados em ${tabelaVade}`);
      }
    } catch (e) {
      console.log(`⚠️ Erro ao buscar artigos de ${tabelaVade}:`, e);
    }
  }

  // 2. Buscar resumos acadêmicos
  if (fontes.areaResumo) {
    try {
      const { data, error } = await supabase
        .from('RESUMO')
        .select('tema, subtema, resumo')
        .ilike('area', `%${fontes.areaResumo}%`)
        .or(palavras.slice(0, 3).map(p => `subtema.ilike.%${p}%`).join(','))
        .limit(3);

      if (!error && data && data.length > 0) {
        for (const resumo of data) {
          const textoResumo = (resumo.resumo || '').substring(0, 400);
          resumosEncontrados.push(`${resumo.tema} > ${resumo.subtema}: ${textoResumo}`);
        }
        console.log(`✅ ${data.length} resumos encontrados para ${fontes.areaResumo}`);
      }
    } catch (e) {
      console.log(`⚠️ Erro ao buscar resumos:`, e);
    }
  }

  // Montar bloco de contexto
  if (artigosEncontrados.length === 0 && resumosEncontrados.length === 0) {
    console.log(`ℹ️ Nenhum contexto encontrado para "${titulo}" em ${tabela}`);
    return '';
  }

  let contexto = '\n\n📚 BASE DE PESQUISA (use como referência obrigatória no artigo):\n';

  if (artigosEncontrados.length > 0) {
    contexto += '\nLEGISLAÇÃO APLICÁVEL:\n';
    contexto += artigosEncontrados.join('\n');
    contexto += '\n';
  }

  if (resumosEncontrados.length > 0) {
    contexto += '\nRESUMOS ACADÊMICOS RELACIONADOS:\n';
    contexto += resumosEncontrados.join('\n');
    contexto += '\n';
  }

  contexto += `
INSTRUÇÕES DE USO DA BASE:
- Cite os artigos de lei acima diretamente no texto (ex: "conforme o Art. 121 do CP...")
- Use os resumos para aprofundar a explicação técnica
- Mencione os números dos artigos quando relevante
- NÃO invente artigos que não estejam na base — se precisar de outros, use referências genéricas`;

  return contexto;
}

async function chamarGeminiComFallback(prompt: string): Promise<string> {
  let lastError: Error | null = null;
  
  for (const apiKey of API_KEYS) {
    try {
      console.log('Tentando gerar conteúdo com chave Gemini...');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 16384,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro da API Gemini:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const conteudo = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!conteudo) {
        throw new Error('Conteúdo não gerado pela IA');
      }

      console.log('✅ Conteúdo gerado com sucesso');
      return conteudo;
    } catch (error) {
      console.error('Erro com chave API:', error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  throw lastError || new Error('Todas as chaves API falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Modo novo: tabela genérica por ID
    if (body.tabela && body.artigoId) {
      const { tabela, artigoId, titulo, descricao_curta } = body;

      if (!TABELAS_PERMITIDAS.includes(tabela)) {
        return new Response(
          JSON.stringify({ error: 'Tabela não permitida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (API_KEYS.length === 0) throw new Error('Nenhuma chave API Gemini configurada');

      const contexto = CONTEXTOS[tabela] || 'Direito brasileiro';

      // Buscar contexto enriquecido do Vade Mecum e Resumos
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const contextoEnriquecido = await buscarContextoEnriquecido(supabase, tabela, titulo);

      const prompt = `Você é um professor e especialista em ${contexto}. Escreva um artigo educacional VISUALMENTE RICO sobre: "${titulo}"${descricao_curta ? ` (${descricao_curta})` : ''}.

ESTILO DE ESCRITA:
- Meio-termo entre linguagem técnica e acessível
- Use termos jurídicos quando necessário, mas SEMPRE explique na prática
- Exemplos do dia a dia e analogias para facilitar o entendimento
- Cite legislação aplicável, traduzindo o "juridiquês"

TAMANHO IDEAL:
- Entre 1000 e 1200 palavras (NÃO ultrapasse 1200 palavras)
- O artigo deve ser completo mas conciso - sem enrolação
- Cada parágrafo deve agregar valor real ao leitor
- TERMINE o artigo completamente - nunca deixe frases cortadas

ESTRUTURA:
1. Organize com subtítulos (##, ###)
2. Comece contextualizando de forma envolvente (2-3 parágrafos)
3. Desenvolva o tema com seções objetivas
4. Inclua 1 seção prática ("Na prática" ou "Como funciona")
5. Termine com conclusão breve (1 parágrafo)

ELEMENTOS VISUAIS OBRIGATÓRIOS:
- **1 tabela comparativa** no meio do artigo (conceitos, tipos, características)
- **1 tabela "Resumo Rápido"** no final antes da conclusão
- **Citações destacadas** (>) para artigos de lei ou curiosidades (2-3 no total)
- **Negrito** para conceitos-chave
- Listas numeradas para processos/etapas

EXEMPLO DE TABELA:
| Aspecto | Descrição |
|---------|-----------|
| O que é | Definição |
| Base legal | Artigo/Lei |

IMPORTANTE: O artigo DEVE terminar com uma conclusão completa. Nunca corte no meio.
${contextoEnriquecido}

Escreva o artigo completo agora:`;

      console.log(`Gerando conteúdo para ${tabela}: ${titulo}${contextoEnriquecido ? ' (com contexto enriquecido)' : ''}`);
      const conteudo = await chamarGeminiComFallback(prompt);

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
        conteudo_gerado: conteudo,
      };

      const { error: updateError } = await supabase
        .from(tabela)
        .update(updateData)
        .eq('id', artigoId);

      if (updateError) console.error('Erro ao salvar:', updateError);

      return new Response(
        JSON.stringify({ conteudo }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Modo legado: BLOGGER_JURIDICO por categoria/ordem
    const { categoria, ordem, titulo, topicos } = body;

    if (!categoria || !ordem || !titulo) {
      return new Response(
        JSON.stringify({ error: 'Categoria, ordem e título são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (API_KEYS.length === 0) throw new Error('Nenhuma chave API Gemini configurada');

    const promptsCategoria: Record<string, string> = {
      advogado: 'advocacia, profissão de advogado, carreira jurídica, OAB',
      prf: 'Polícia Rodoviária Federal, carreira PRF, concurso PRF',
      pf: 'Polícia Federal, carreira PF, concurso Polícia Federal',
      juiz: 'magistratura, carreira de juiz, concurso magistratura',
      delegado: 'delegado de polícia, carreira policial, concurso delegado',
      civilizacoes: 'história do direito, sistemas jurídicos antigos, evolução do direito nas civilizações'
    };

    const contextoCategoria = promptsCategoria[categoria] || 'carreiras jurídicas';

    const prompt = `Você é um especialista em ${contextoCategoria} no Brasil. Escreva um artigo educacional completo e detalhado sobre o tema: "${titulo}".

TÓPICOS QUE DEVEM SER ABORDADOS:
${topicos ? topicos.map((t: string) => `- ${t}`).join('\n') : 'Aborde os principais aspectos do tema.'}

INSTRUÇÕES:
1. Escreva um artigo completo com pelo menos 1500 palavras
2. Use linguagem clara e acessível para iniciantes
3. Inclua informações práticas e atualizadas
4. Organize com subtítulos usando markdown (##, ###)
5. Adicione exemplos práticos quando relevante
6. Inclua dicas úteis e conselhos práticos
7. Cite fontes confiáveis quando mencionar dados ou estatísticas
8. Termine com uma conclusão motivadora

FORMATO:
- Use markdown para formatação
- Inclua listas quando apropriado
- Destaque pontos importantes em **negrito**
- Use citações para informações oficiais

Escreva o artigo completo agora:`;

    console.log('Gerando conteúdo para:', titulo);
    const conteudo = await chamarGeminiComFallback(prompt);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('BLOGGER_JURIDICO')
      .update({
        conteudo_gerado: conteudo,
        gerado_em: new Date().toISOString(),
        cache_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('categoria', categoria)
      .eq('ordem', ordem);

    if (updateError) console.error('Erro ao salvar conteúdo:', updateError);

    return new Response(
      JSON.stringify({ conteudo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função gerar-conteudo-blogger:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
