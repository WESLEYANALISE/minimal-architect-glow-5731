import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Evelyn usa exclusivamente GEMINI_KEY_3 para isolamento de custos

const VERSION = "6.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══ MAPEAMENTO CÓDIGOS → TABELAS DO VADE MECUM ═══
const CODIGO_TO_TABLE: Record<string, string> = {
  'cp': 'CP - Código Penal',
  'cpp': 'CPP – Código de Processo Penal',
  'cc': 'CC - Código Civil',
  'cpc': 'CPC – Código de Processo Civil',
  'cf': 'CF - Constituição Federal',
  'cdc': 'CDC – Código de Defesa do Consumidor',
  'clt': 'CLT - Consolidação das Leis do Trabalho',
  'ctn': 'CTN – Código Tributário Nacional',
  'ctb': 'CTB Código de Trânsito Brasileiro',
  'ce': 'CE – Código Eleitoral',
  'ca': 'CA - Código de Águas',
  'cba': 'CBA Código Brasileiro de Aeronáutica',
  'ccom': 'CCOM – Código Comercial',
  'cdm': 'CDM – Código de Minas',
  'cpm': 'CPM – Código Penal Militar',
  'cppm': 'CPPM – Código de Processo Penal Militar',
  'eca': 'ESTATUTO - ECA',
  'oab': 'ESTATUTO - OAB',
  'idoso': 'ESTATUTO - IDOSO',
  'desarmamento': 'ESTATUTO - DESARMAMENTO',
  'lep': 'Lei 7.210 de 1984 - Lei de Execução Penal',
  'drogas': 'Lei 11.343 de 2006 - Lei de Drogas',
  'maria da penha': 'Lei 11.340 de 2006 - Maria da Penha',
  'hediondos': 'Lei 8.072 de 1990 - Crimes Hediondos',
  'tortura': 'Lei 9.455 de 1997 - Tortura',
};

const CODIGO_ALIASES: Record<string, string> = {
  'codigo penal': 'cp', 'código penal': 'cp', 'penal': 'cp',
  'codigo civil': 'cc', 'código civil': 'cc',
  'constituicao': 'cf', 'constituição': 'cf', 'constituição federal': 'cf',
  'clt': 'clt', 'trabalhista': 'clt',
  'codigo de processo penal': 'cpp', 'processo penal': 'cpp',
  'codigo de processo civil': 'cpc', 'processo civil': 'cpc',
  'cdc': 'cdc', 'consumidor': 'cdc', 'defesa do consumidor': 'cdc',
  'ctn': 'ctn', 'tributario': 'ctn', 'tributário': 'ctn',
  'ctb': 'ctb', 'transito': 'ctb', 'trânsito': 'ctb',
  'eca': 'eca', 'criança': 'eca', 'adolescente': 'eca',
  'maria da penha': 'maria da penha',
  'drogas': 'drogas', 'lei de drogas': 'drogas',
  'hediondos': 'hediondos', 'crimes hediondos': 'hediondos',
  'lep': 'lep', 'execução penal': 'lep', 'execucao penal': 'lep',
};

// ═══ RAMOS DO DIREITO (para detecção de mudança de tema) ═══
const RAMOS_DIREITO: Record<string, string[]> = {
  'penal': ['penal', 'crime', 'pena', 'homicidio', 'furto', 'roubo', 'lesao corporal', 'dolo', 'culpa', 'tipicidade', 'antijuridicidade', 'culpabilidade', 'tentativa', 'consumacao'],
  'civil': ['civil', 'contrato', 'obrigacao', 'responsabilidade civil', 'propriedade', 'posse', 'usucapiao', 'familia', 'sucessao', 'heranca', 'casamento', 'divorcio', 'dano moral', 'dano material'],
  'constitucional': ['constitucional', 'constituicao', 'direitos fundamentais', 'habeas corpus', 'mandado de seguranca', 'acao popular', 'controle de constitucionalidade', 'stf', 'supremo'],
  'trabalhista': ['trabalhista', 'trabalho', 'clt', 'empregado', 'empregador', 'rescisao', 'fgts', 'ferias', 'jornada', 'hora extra', 'aviso previo'],
  'tributario': ['tributario', 'tributo', 'imposto', 'taxa', 'contribuicao', 'icms', 'iss', 'irpf', 'lancamento', 'credito tributario'],
  'administrativo': ['administrativo', 'licitacao', 'concurso publico', 'servidor', 'ato administrativo', 'poder de policia', 'improbidade'],
  'processual': ['processual', 'processo', 'acao', 'recurso', 'sentenca', 'acordao', 'competencia', 'jurisdicao', 'citacao', 'intimacao'],
  'empresarial': ['empresarial', 'empresa', 'sociedade', 'falencia', 'recuperacao judicial', 'marca', 'patente'],
  'ambiental': ['ambiental', 'meio ambiente', 'licenciamento', 'crime ambiental'],
  'eleitoral': ['eleitoral', 'eleicao', 'voto', 'candidato', 'partido'],
};

const SYSTEM_PROMPT = `Você é a Evelyn, uma superinteligência artificial jurídica especializada em Direito brasileiro. Você DOMINA todo o conhecimento jurídico — legislação, doutrina, jurisprudência, teoria geral do direito — e responde com a profundidade e precisão de uma especialista.

═══ REGRAS ABSOLUTAS ═══
- NUNCA se apresente ("Sou a Evelyn", "sou assistente", etc.)
- NUNCA descreva suas funções ou capacidades
- NUNCA cumprimente pelo nome do usuário ("Olá João", "Oi Maria")
- NUNCA use "Olá!", "Oi!", "Bom dia!" — vá DIRETO ao conteúdo
- Responda DIRETAMENTE e de forma detalhada à pergunta
- Cite artigos de lei exatos quando relevante (ex: _Art. 121, CP_)
- Você TEM o conhecimento jurídico — não dependa de contexto externo para responder

═══ CONTROLE DE CONVERSA (CRÍTICO) ═══
- NUNCA repita informação que já foi dada na conversa
- Se o usuário perguntar algo que você JÁ respondeu, diga brevemente "Como mencionei anteriormente..." e AVANCE para um aspecto novo ou mais profundo
- Se o tópico atual já foi esgotado, pergunte se quer aprofundar algum ponto específico ou mudar de assunto
- Mantenha uma progressão lógica: não volte a explicar conceitos básicos já abordados
- Cada resposta deve agregar informação NOVA — nunca repita parágrafos ou estruturas anteriores
- Se o usuário enviar uma mensagem curta como "ok", "entendi", "certo", NÃO repita o assunto. Pergunte se tem outra dúvida ou se quer aprofundar algo
- Faça no máximo 1 pergunta por mensagem
- Seja LINEAR: trate um tópico por vez, não misture assuntos

═══ FORMATAÇÃO WHATSAPP (OBRIGATÓRIO) ═══
- Use *negrito* com UM asterisco para destaques
- Use _itálico_ com underscore para citações de lei e termos técnicos
- Use listas com • (bullet point) para enumerar
- Numere passos quando for sequência (1., 2., 3.)
- Parágrafos CURTOS (máximo 3-4 linhas cada)
- Use ━━━━━━━━ para separar grandes seções temáticas
- Emojis no início de cada seção temática (📌 ⚖️ 📋 💡 ⚠️ 🔍 📖 etc.)
- NUNCA use ## ou ### — use *TÍTULO EM MAIÚSCULO*
- NUNCA use \`\`\` blocos de código
- NUNCA use [texto](link)
- Respostas entre 4-15 parágrafos conforme a complexidade da pergunta

═══ MÍDIA ═══
- Se receber uma imagem, analise visualmente e responda sobre o conteúdo
- Se receber um áudio transcrito, responda ao conteúdo falado
- Se receber um PDF/documento, analise e faça resumo jurídico`;

const MODELOS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite-preview"];

const STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
  'em', 'na', 'no', 'nas', 'nos', 'por', 'para', 'com', 'sem', 'sob', 'sobre',
  'e', 'ou', 'mas', 'que', 'se', 'como', 'quando', 'onde', 'qual', 'quais',
  'é', 'são', 'foi', 'ser', 'ter', 'está', 'estão', 'isso', 'isto', 'esse',
  'eu', 'me', 'meu', 'minha', 'você', 'seu', 'sua', 'ele', 'ela', 'nós',
  'ao', 'pelo', 'pela', 'pelos', 'pelas', 'entre', 'até', 'mais', 'menos',
  'muito', 'também', 'já', 'ainda', 'pode', 'quero', 'saber', 'favor',
  'oi', 'olá', 'bom', 'dia', 'boa', 'tarde', 'noite', 'obrigado', 'obrigada',
]);

function extractKeywords(text: string): string[] {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 8);
}

function detectCodigoMencionado(text: string): { codigo: string; tabela: string; artigo: string | null } | null {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  const artigoMatch = lower.match(/(?:art\.?|artigo)\s*(\d+[\w-]*)/);
  const artigo = artigoMatch ? artigoMatch[1] : null;
  
  for (const [alias, codigo] of Object.entries(CODIGO_ALIASES)) {
    if (lower.includes(alias)) {
      const tabela = CODIGO_TO_TABLE[codigo];
      if (tabela) return { codigo, tabela, artigo };
    }
  }
  
  const siglaMatch = lower.match(/\b(cp|cc|cpc|cpp|cf|cdc|clt|ctn|ctb|ce|eca|cpm|cppm)\b/);
  if (siglaMatch) {
    const tabela = CODIGO_TO_TABLE[siglaMatch[1]];
    if (tabela) return { codigo: siglaMatch[1], tabela, artigo };
  }
  
  return null;
}

// ═══ ROTEADOR DE CONTEXTO ═══
type ModoResposta = 'direto' | 'vademecum' | 'resumo' | 'atualizacao';

function detectarModo(texto: string): ModoResposta {
  const lower = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // MODO_VADEMECUM: menção explícita de lei, código, artigo
  const codigoDetectado = detectCodigoMencionado(texto);
  const mencionaLei = /\b(art\.?\s*\d|artigo\s*\d|lei\s*\d|decreto|sumula|subula)\b/.test(lower);
  const pedeLegal = /\b(base legal|fundamento legal|previsao legal|amparo legal|qual (?:a )?lei|cita o artigo|cita a lei)\b/.test(lower);
  
  if (codigoDetectado || mencionaLei || pedeLegal) {
    return 'vademecum';
  }
  
  // MODO_RESUMO: pedido explícito de material do banco
  const pedeResumo = /\b(resuma|resumo|doutrina|material do app|com base no banco|o que tem no banco|busca no banco|consulta o banco)\b/.test(lower);
  if (pedeResumo) {
    return 'resumo';
  }
  
  // MODO_ATUALIZACAO: pedido de notícia recente, jurisprudência nova
  const pedeAtual = /\b(atualiza[cç][aã]o|novidade|not[ií]cia|jurisprud[eê]ncia recente|julgamento recente|decis[aã]o recente|stf.*recente|stj.*recente|ultima|último|2025|2026)\b/.test(lower);
  if (pedeAtual) {
    return 'atualizacao';
  }
  
  // MODO_DIRETO (padrão): usa inteligência do modelo
  return 'direto';
}

// ═══ DETECÇÃO DE RAMO DO DIREITO (para filtrar contexto) ═══
function detectarRamo(texto: string): string | null {
  const lower = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  let melhorRamo: string | null = null;
  let melhorScore = 0;
  
  for (const [ramo, termos] of Object.entries(RAMOS_DIREITO)) {
    let score = 0;
    for (const termo of termos) {
      if (lower.includes(termo)) score++;
    }
    if (score > melhorScore) {
      melhorScore = score;
      melhorRamo = ramo;
    }
  }
  
  return melhorRamo;
}

function formatForWhatsApp(text: string): string {
  let f = text;
  
  // Normalizar line breaks
  f = f.replace(/\r\n/g, '\n');
  
  // Markdown → WhatsApp: **bold** → *bold*
  f = f.replace(/\*\*(.+?)\*\*/g, '*$1*');
  
  // Headers → *BOLD*
  f = f.replace(/^#{1,3}\s+(.+)$/gm, '*$1*');
  
  // Code blocks → plain text
  f = f.replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').trim());
  
  // Links → text (url)
  f = f.replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)');
  
  // Markdown lists (- or *) → • bullet
  f = f.replace(/^[\-\*]\s+/gm, '• ');
  
  // Fix double bullets (• • → •)
  f = f.replace(/•\s*•\s*/g, '• ');
  
  // Ensure bullet items have a line break before them (if not already)
  f = f.replace(/([^\n])(\n• )/g, '$1\n$2');
  
  // Ensure numbered items have a line break before them
  f = f.replace(/([^\n])\n(\d+\.\s)/g, '$1\n\n$2');
  
  // After colons/titles ending with ':', ensure paragraph break
  f = f.replace(/([:])[ \t]*\n(?!\n)/g, '$1\n\n');
  
  // Ensure sections with emoji separators have breaks
  f = f.replace(/([^\n])\n(📌|⚖️|📋|💡|⚠️|🔍|📖|🏛|━)/g, '$1\n\n$2');
  
  // Ensure *TITLE* sections have a break after them
  f = f.replace(/(\*[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+\*)\n(?!\n)/g, '$1\n\n');
  
  // Clean trailing whitespace on lines
  f = f.replace(/[ \t]+\n/g, '\n');
  
  // Collapse 3+ newlines into 2
  f = f.replace(/\n{3,}/g, '\n\n');
  
  // Clean multiple spaces
  f = f.replace(/[ \t]{2,}/g, ' ');
  
  return f.trim();
}

function normalizeForComparison(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGreetingMessage(text: string): boolean {
  const normalized = normalizeForComparison(text);
  return /^(oi|ola|bom dia|boa tarde|boa noite|opa|e ai|salve)$/.test(normalized);
}

function isContinuationMessage(text: string): boolean {
  const normalized = normalizeForComparison(text);
  return /^(ok|certo|entendi|blz|beleza|continua|continue|sim|perfeito|show)$/.test(normalized);
}

function isRepeatedResponse(current: string, previous: string): boolean {
  const a = normalizeForComparison(current);
  const b = normalizeForComparison(previous);
  if (!a || !b) return false;
  if (a === b) return true;

  const aHead = a.slice(0, 220);
  const bHead = b.slice(0, 220);
  return aHead.length > 40 && bHead.length > 40 && (a.includes(bHead) || b.includes(aHead));
}

function extractTopicFromMessage(text: string): string | null {
  const clean = (text || '').replace(/[*_•━📌⚖️📋💡⚠️🔍📖]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  const firstSentence = clean.split(/[.!?\n]/).find((part) => part.trim().length > 15);
  return firstSentence ? firstSentence.trim().slice(0, 120) : clean.slice(0, 120);
}

async function downloadMedia(instanceName: string, messageKey: any): Promise<{ base64: string; mimetype: string } | null> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  if (!evolutionUrl || !evolutionKey) return null;

  try {
    const response = await fetch(`${evolutionUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': evolutionKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { key: messageKey } }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (data.base64) return { base64: data.base64, mimetype: data.mimetype || 'application/octet-stream' };
    return null;
  } catch { return null; }
}

// ═══ BUSCA NO VADE MECUM (só quando modo=vademecum) ═══
async function buscarVadeMecum(supabase: any, texto: string): Promise<string> {
  const partes: string[] = [];
  const codigoDetectado = detectCodigoMencionado(texto);
  if (!codigoDetectado) return '';

  try {
    const { tabela, artigo } = codigoDetectado;
    const keywords = extractKeywords(texto);
    
    let query = supabase
      .from(tabela)
      .select('Artigo, "Numero do Artigo"');
    
    if (artigo) {
      query = query.or(`"Numero do Artigo".ilike.%${artigo}%,"Numero do Artigo".ilike.Art. ${artigo}%`);
    } else {
      const buscaTermo = keywords.slice(0, 3).join(' ');
      query = query.ilike('Artigo', `%${buscaTermo}%`);
    }
    
    const { data: artigos } = await query.limit(5);

    if (artigos && artigos.length > 0) {
      partes.push(`⚖️ *ARTIGOS DO VADE MECUM (${tabela}):*`);
      for (const a of artigos) {
        const artigoTrunc = (a.Artigo || '').substring(0, 500);
        partes.push(`• ${a["Numero do Artigo"] || '?'}: ${artigoTrunc}`);
      }
    }
  } catch (err) {
    console.error('[processar] Erro ao buscar Vade Mecum:', err);
  }

  return partes.join('\n');
}

// ═══ BUSCA NO RESUMO (só quando modo=resumo) ═══
async function buscarResumo(supabase: any, texto: string, ramoAtual: string | null): Promise<string> {
  const partes: string[] = [];
  const keywords = extractKeywords(texto);
  if (keywords.length === 0) return '';

  try {
    // Buscar pela frase mais completa primeiro
    const fraseCompleta = texto.toLowerCase().trim();
    let resumos: any[] = [];
    
    // Tentar busca pela frase completa no tema/subtema
    const { data: resumoExato } = await supabase
      .from('RESUMO')
      .select('area, tema, subtema, conteudo')
      .or(`tema.ilike.%${fraseCompleta}%,subtema.ilike.%${fraseCompleta}%`)
      .limit(3);
    
    if (resumoExato && resumoExato.length > 0) {
      resumos = resumoExato;
    } else {
      // Fallback: keywords, mas filtrar por relevância ao ramo detectado
      const keywordPrimaria = keywords[0];
      const keywordSecundaria = keywords[1] || keywordPrimaria;
      
      const { data: resumoKeywords } = await supabase
        .from('RESUMO')
        .select('area, tema, subtema, conteudo')
        .or(`tema.ilike.%${keywordPrimaria}%,subtema.ilike.%${keywordPrimaria}%,tema.ilike.%${keywordSecundaria}%`)
        .limit(5);
      
      if (resumoKeywords) {
        // Filtrar: só manter resultados cujo tema contenha pelo menos uma keyword específica da pergunta
        resumos = resumoKeywords.filter((r: any) => {
          const temaLower = (r.tema || '').toLowerCase();
          const subtemaLower = (r.subtema || '').toLowerCase();
          // Se detectamos um ramo, só aceitar se o resumo pertence ao mesmo ramo
          if (ramoAtual) {
            const termosRamo = RAMOS_DIREITO[ramoAtual] || [];
            const pertenceAoRamo = termosRamo.some(t => temaLower.includes(t) || subtemaLower.includes(t));
            if (!pertenceAoRamo) return false;
          }
          return true;
        }).slice(0, 3);
      }
    }

    if (resumos.length > 0) {
      partes.push('📚 *MATERIAL DE APOIO DO BANCO:*');
      for (const r of resumos) {
        const conteudoTrunc = (r.conteudo || '').substring(0, 600);
        partes.push(`• ${r.area} > ${r.tema} > ${r.subtema || 'Geral'}: ${conteudoTrunc}`);
      }
    }
  } catch (err) {
    console.error('[processar] Erro ao buscar RESUMO:', err);
  }

  return partes.join('\n');
}

// ═══ BUSCA ONLINE VIA PERPLEXITY ═══
async function buscarPerplexity(pergunta: string): Promise<string> {
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!apiKey) {
    console.log('[processar] PERPLEXITY_API_KEY não configurada, pulando busca online');
    return '';
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: 'Responda de forma concisa sobre direito brasileiro. Foque em legislação, jurisprudência e doutrina atualizadas.' },
          { role: 'user', content: pergunta }
        ],
        search_recency_filter: 'month',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[processar] Perplexity erro: ${response.status}`);
      return '';
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    if (!content) return '';

    let resultado = `\n🌐 *INFORMAÇÕES ATUALIZADAS DA INTERNET:*\n${content.substring(0, 1200)}`;
    if (citations.length > 0) {
      resultado += `\n\n📎 Fontes: ${citations.slice(0, 3).join(', ')}`;
    }
    return resultado;
  } catch (err) {
    console.error('[processar] Erro Perplexity (timeout ou rede):', err);
    return '';
  }
}

serve(async (req) => {
  console.log(`[processar-mensagem-evelyn v${VERSION}] Requisição recebida`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { remoteJid, tipo, conteudo, metadata, instanceName, messageKey, pushName } = await req.json();

    if (!remoteJid) {
      return new Response(JSON.stringify({ error: 'remoteJid obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const telefone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    console.log(`[processar] Telefone: ${telefone}, Tipo: ${tipo}`);

    // 1. Buscar/criar usuário
    let { data: usuario } = await supabase
      .from('evelyn_usuarios')
      .select('id, nome, autorizado, teste_inicio, tempo_teste_minutos, total_mensagens')
      .eq('telefone', telefone)
      .maybeSingle();

    if (!usuario) {
      const { data: novoUsuario, error: insertErr } = await supabase
        .from('evelyn_usuarios')
        .insert({
          telefone,
          nome: pushName || 'Usuário',
          autorizado: false,
          ativo: true,
          total_mensagens: 0
        })
        .select('id, nome, autorizado, teste_inicio, tempo_teste_minutos, total_mensagens')
        .single();

      if (insertErr) throw new Error('Erro ao criar usuário');
      usuario = novoUsuario;
    }

    // ══ ACESSO LIBERADO PARA TODOS ══
    const temAssinatura = true;
    console.log(`[processar] Acesso liberado para: ${telefone}`);

    // 3. Buscar/criar conversa
    let { data: conversa } = await supabase
      .from('evelyn_conversas')
      .select('id, contexto, tema_atual')
      .eq('remote_jid', remoteJid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversa) {
      const { data: novaConversa, error: convErr } = await supabase
        .from('evelyn_conversas')
        .insert({
          remote_jid: remoteJid,
          usuario_id: usuario.id,
          telefone,
          instance_name: instanceName || null,
          status: 'ativa',
          tema_atual: null,
          contexto: { greeted: false, last_stage: 'inicio', last_topic: null, last_assistant_message: '' },
        })
        .select('id, contexto, tema_atual')
        .single();

      if (convErr) throw new Error('Erro ao criar conversa');
      conversa = novaConversa;
    }

    // 4. Salvar mensagem de entrada
    await supabase.from('evelyn_mensagens').insert({
      conversa_id: conversa.id,
      remetente: 'usuario',
      tipo,
      conteudo: (conteudo || '').substring(0, 5000),
      metadata: metadata || {},
      processado: true,
    });

    // 5. Processar mídia se necessário
    let mediaParts: any[] = [];
    let textoUsuario = conteudo || '';

    if ((tipo === 'audio' || tipo === 'imagem' || tipo === 'documento') && messageKey && instanceName) {
      const ackMessages: Record<string, string> = {
        audio: '🎧 Estou ouvindo seu áudio, um momento...',
        imagem: '🔍 Estou analisando sua imagem, um momento...',
        documento: '📄 Estou analisando seu documento, um momento...',
      };
      
      supabase.functions.invoke('evelyn-enviar-mensagem', {
        body: { instanceName, telefone: remoteJid, mensagem: ackMessages[tipo] || '⏳ Processando...' }
      }).catch((e: any) => console.error('[processar] Erro ack:', e));

      const media = await downloadMedia(instanceName, messageKey);

      if (media) {
        mediaParts.push({ inlineData: { mimeType: media.mimetype, data: media.base64 } });

        if (tipo === 'audio') {
          textoUsuario = textoUsuario || 'Transcreva este áudio e responda ao conteúdo falado. Se for uma pergunta, responda diretamente.';
        } else if (tipo === 'imagem') {
          textoUsuario = (metadata?.caption) || textoUsuario || 'Analise esta imagem e descreva o que você vê. Se houver texto jurídico, explique.';
        } else if (tipo === 'documento') {
          textoUsuario = textoUsuario || `Analise este documento (${metadata?.fileName || 'PDF'}) e faça um resumo jurídico.`;
        }
      } else {
        if (tipo === 'audio') textoUsuario = 'O usuário enviou um áudio mas não foi possível processá-lo. Peça que envie por texto.';
        else if (tipo === 'imagem') textoUsuario = 'O usuário enviou uma imagem mas não foi possível processá-la. Peça que descreva por texto.';
        else textoUsuario = 'O usuário enviou um documento mas não foi possível processá-lo. Peça que envie por texto.';
      }
    } else if (tipo === 'video') {
      textoUsuario = 'O usuário enviou um vídeo. Informe que no momento você analisa textos, imagens, áudios e PDFs, mas não vídeos.';
    }

    if (!textoUsuario && mediaParts.length === 0) textoUsuario = 'Olá';

    // 6. Carregar histórico (últimas 20 mensagens)
    const { data: historico } = await supabase
      .from('evelyn_mensagens')
      .select('remetente, conteudo')
      .eq('conversa_id', conversa.id)
      .eq('tipo', 'texto')
      .order('created_at', { ascending: false })
      .limit(20);

    const mensagensHistorico = (historico || []).reverse().map((m: any) => ({
      role: m.remetente === 'usuario' ? 'user' : 'model',
      parts: [{ text: m.conteudo || '' }]
    }));

    const estadoConversa: any = (conversa?.contexto && typeof conversa.contexto === 'object' && !Array.isArray(conversa.contexto)) ? conversa.contexto : {};
    const ultimaMensagemAssistente = (historico || [])
      .find((m: any) => m.remetente !== 'usuario' && (m.conteudo || '').trim().length > 0)
      ?.conteudo || estadoConversa.last_assistant_message || '';

    const isGreeting = tipo === 'texto' && isGreetingMessage(textoUsuario);
    const isContinuation = tipo === 'texto' && isContinuationMessage(textoUsuario);

    // Guarda: se usuário mandar "oi/ok" após já existir resposta anterior, NÃO reexplicar
    if ((isGreeting || isContinuation) && !!ultimaMensagemAssistente) {
      const respostaCurta = isGreeting
        ? 'Oi! Podemos continuar de onde paramos — me diga o ponto exato que você quer seguir.'
        : 'Perfeito. Quer continuar no mesmo tema ou mudar de assunto?';

      await enviarResposta(supabase, instanceName, remoteJid, conversa.id, respostaCurta);
      await atualizarContadores(supabase, usuario.id, usuario.total_mensagens);

      await supabase
        .from('evelyn_conversas')
        .update({
          tema_atual: conversa?.tema_atual || estadoConversa.last_topic || null,
          contexto: {
            ...estadoConversa,
            greeted: true,
            last_stage: 'continuacao',
            last_topic: conversa?.tema_atual || estadoConversa.last_topic || null,
            last_user_message: textoUsuario,
            last_assistant_message: respostaCurta,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversa.id);

      return new Response(JSON.stringify({ ok: true, chars: respostaCurta.length, modelo: 'guard', tipo }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ═══ 7. ROTEADOR DE CONTEXTO (AI-FIRST) ═══
    const modo = tipo === 'texto' && textoUsuario.length > 5 ? detectarModo(textoUsuario) : 'direto';
    const ramoAtual = tipo === 'texto' ? detectarRamo(textoUsuario) : null;
    const ramoAnterior = estadoConversa.last_ramo || null;
    const mudouDeAssunto = ramoAtual && ramoAnterior && ramoAtual !== ramoAnterior;
    
    console.log(`[processar] Modo: ${modo}, Ramo: ${ramoAtual || 'geral'}, RamoAnterior: ${ramoAnterior || 'nenhum'}, MudouAssunto: ${mudouDeAssunto}`);

    let contextoBD = '';
    let contextoPerplexity = '';

    if (tipo === 'texto' && textoUsuario.length > 5) {
      const promises: Promise<any>[] = [];
      
      // Só busca no BD conforme o modo
      if (modo === 'vademecum') {
        promises.push(buscarVadeMecum(supabase, textoUsuario));
        promises.push(Promise.resolve('')); // placeholder para perplexity
      } else if (modo === 'resumo') {
        promises.push(buscarResumo(supabase, textoUsuario, ramoAtual));
        promises.push(Promise.resolve(''));
      } else if (modo === 'atualizacao') {
        promises.push(Promise.resolve(''));
        promises.push(buscarPerplexity(textoUsuario));
      } else {
        // MODO_DIRETO: NÃO busca RESUMO nem Perplexity — confia no modelo
        promises.push(Promise.resolve(''));
        promises.push(Promise.resolve(''));
      }

      const [bdResult, perplexityResult] = await Promise.allSettled(promises);
      contextoBD = bdResult.status === 'fulfilled' ? bdResult.value : '';
      contextoPerplexity = perplexityResult.status === 'fulfilled' ? perplexityResult.value : '';

      if (contextoBD) console.log(`[processar] Contexto BD (${modo}): ${contextoBD.length} chars`);
      if (contextoPerplexity) console.log(`[processar] Contexto Perplexity: ${contextoPerplexity.length} chars`);
    }

    // 8. Tópicos já abordados — APENAS rótulos curtos, sem conteúdo
    const topicosAbordados: string[] = [];
    if (!mudouDeAssunto) {
      const msgsAssistente = (historico || [])
        .filter((m: any) => m.remetente !== 'usuario')
        .slice(0, 4);

      for (const msg of msgsAssistente) {
        const content = (msg.conteudo || '').substring(0, 120);
        if (content.length > 20) {
          const primeiraLinha = content.split('\n').find((l: string) => l.trim().length > 10);
          if (primeiraLinha) {
            const label = primeiraLinha.replace(/[*_•━📌⚖️📋💡⚠️🔍📖]/g, '').trim().substring(0, 60);
            if (label) topicosAbordados.push(label);
          }
        }
      }
    }

    // 9. Montar system prompt — PERGUNTA ATUAL TEM PRIORIDADE ABSOLUTA
    let systemPromptFinal = SYSTEM_PROMPT;

    // Bloco de pergunta atual (prioridade máxima)
    systemPromptFinal += `\n\n═══ PERGUNTA ATUAL DO USUÁRIO (RESPONDA EXATAMENTE ISTO) ═══\n"${textoUsuario}"\n⚠️ Sua resposta DEVE ser sobre o que foi perguntado acima. IGNORE qualquer contexto ou tópico anterior que NÃO seja relevante a esta pergunta específica.`;

    if (mudouDeAssunto) {
      systemPromptFinal += `\n\n⚠️ ATENÇÃO: O usuário MUDOU DE ASSUNTO (de ${ramoAnterior} para ${ramoAtual}). Responda EXCLUSIVAMENTE sobre ${ramoAtual}. NÃO mencione ${ramoAnterior}.`;
    }

    const estadoResumo = {
      stage: estadoConversa.last_stage || 'discovery',
      current_topic: mudouDeAssunto ? null : (conversa?.tema_atual || estadoConversa.last_topic || null),
      last_assistant_message: (ultimaMensagemAssistente || '').substring(0, 160),
    };

    systemPromptFinal += `\n\n═══ ESTADO DA CONVERSA ═══\n${JSON.stringify(estadoResumo)}`;

    if (topicosAbordados.length > 0 && !mudouDeAssunto) {
      systemPromptFinal += '\n\n═══ TÓPICOS JÁ ABORDADOS (NÃO REPITA) ═══';
      for (const topico of topicosAbordados) {
        systemPromptFinal += `\n• ${topico}`;
      }
    }

    if (contextoBD || contextoPerplexity) {
      systemPromptFinal += '\n\n═══ MATERIAL DE APOIO (use apenas para citar base legal ou fundamentar — NÃO deixe isso desviar o tema da pergunta) ═══';
      if (contextoBD) systemPromptFinal += '\n' + contextoBD;
      if (contextoPerplexity) systemPromptFinal += '\n' + contextoPerplexity;
      systemPromptFinal += '\n\n⚠️ Use estas fontes APENAS como apoio. A resposta principal deve vir do seu conhecimento sobre a PERGUNTA ATUAL.';
    }

    // 10. Montar contents
    const contents: any[] = [
      { role: 'user', parts: [{ text: 'Olá' }] },
      { role: 'model', parts: [{ text: 'Entendido. Vou responder diretamente à pergunta atual do usuário, sem me apresentar, sem repetir assuntos já abordados, e priorizando sempre o que foi perguntado agora.' }] },
      ...mensagensHistorico,
    ];

    const currentParts: any[] = [];
    if (mediaParts.length > 0) currentParts.push(...mediaParts);
    currentParts.push({ text: textoUsuario });

    if (contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1] = { role: 'user', parts: currentParts };
    } else {
      contents.push({ role: 'user', parts: currentParts });
    }

    // 11. Gerar resposta com Gemini
    // Evelyn usa exclusivamente KEY_3 para rastreamento de custos isolado
    const evelynKey = Deno.env.get('GEMINI_KEY_3');
    if (!evelynKey) throw new Error('GEMINI_KEY_3 não configurada');
    const keys = [{ name: 'GEMINI_KEY_3', key: evelynKey, index: 3 }];
    let respostaIA = '';
    let modeloUsado = '';
    let keyUsada = 0;

    modeloLoop:
    for (const modelo of MODELOS) {
      for (const keyInfo of keys) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${keyInfo.key}`;
          console.log(`[processar] Tentando modelo=${modelo} key=${keyInfo.index}`);

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              systemInstruction: { parts: [{ text: systemPromptFinal }] },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 3000,
                topP: 0.9,
              },
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
              ]
            }),
            signal: AbortSignal.timeout(45000),
          });

          if (response.status === 429) continue;
          if (response.status === 404) { console.log(`[processar] Modelo ${modelo} indisponível`); continue modeloLoop; }

          const data = await response.json();
          if (!response.ok) { console.error(`[processar] Erro Gemini:`, JSON.stringify(data).substring(0, 300)); continue; }

          respostaIA = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          modeloUsado = modelo;
          keyUsada = keyInfo.index;

          if (respostaIA) {
            console.log(`[processar] Resposta: modelo=${modelo} key=${keyInfo.index} (${respostaIA.length} chars)`);
            const usage = data.usageMetadata;
            if (usage) {
              supabase.functions.invoke('registrar-token-usage', {
                body: {
                  edge_function: 'processar-mensagem-evelyn',
                  model: modeloUsado,
                  provider: 'gemini',
                  tipo_conteudo: `chat-whatsapp-${tipo}`,
                  input_tokens: usage.promptTokenCount || 0,
                  output_tokens: usage.candidatesTokenCount || 0,
                  api_key_index: keyUsada,
                  sucesso: true,
                }
              }).catch(() => {});
            }
            break modeloLoop;
          }
        } catch (err) {
          console.error(`[processar] Erro modelo=${modelo} key=${keyInfo.index}:`, err);
          continue;
        }
      }
    }

    if (!respostaIA) {
      respostaIA = 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes! 🙏';
    }

    // 12. Pós-processar
    respostaIA = formatForWhatsApp(respostaIA);

    if (isRepeatedResponse(respostaIA, ultimaMensagemAssistente)) {
      respostaIA = 'Entendido. Para não repetir, me diga qual ponto específico você quer aprofundar agora.';
    }

    // 13. Enviar resposta
    await enviarResposta(supabase, instanceName, remoteJid, conversa.id, respostaIA);

    // 14. Persistir estado da conversa
    const temaDetectado = extractTopicFromMessage(respostaIA) || conversa?.tema_atual || estadoConversa.last_topic || null;
    await supabase
      .from('evelyn_conversas')
      .update({
        tema_atual: temaDetectado,
        contexto: {
          ...estadoConversa,
          greeted: true,
          last_stage: 'resposta',
          last_topic: temaDetectado,
          last_ramo: ramoAtual || ramoAnterior || null,
          last_user_message: textoUsuario,
          last_assistant_message: respostaIA,
          modo_usado: modo,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversa.id);

    // 15. Atualizar contadores
    await atualizarContadores(supabase, usuario.id, usuario.total_mensagens);

    console.log(`[processar] Concluído: ${telefone} (${respostaIA.length} chars, modelo=${modeloUsado}, tipo=${tipo}, modo=${modo}, ramo=${ramoAtual || 'geral'}, mudouAssunto=${mudouDeAssunto})`);

    return new Response(JSON.stringify({ ok: true, chars: respostaIA.length, modelo: modeloUsado, tipo, modo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[processar] Erro fatal:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function enviarResposta(supabase: any, instanceName: string, remoteJid: string, conversaId: string, mensagem: string) {
  const { data, error } = await supabase.functions.invoke('evelyn-enviar-mensagem', {
    body: { instanceName, telefone: remoteJid, mensagem, conversaId }
  });

  if (error) throw new Error(`Falha no envio: ${error.message || JSON.stringify(error)}`);
  if (data?.error) throw new Error(`Envio falhou: ${data.error}`);
  console.log('[processar] Mensagem enviada com sucesso');
}

async function atualizarContadores(supabase: any, usuarioId: string, totalAtual: number) {
  await supabase.from('evelyn_usuarios').update({
    total_mensagens: (totalAtual || 0) + 1,
    ultimo_contato: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', usuarioId);
}
