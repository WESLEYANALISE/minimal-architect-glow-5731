import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

async function callGeminiWithFallback(prompt: string): Promise<string> {
  const errors: string[] = [];
  const models = ['gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  for (const model of models) {
    for (const apiKey of GEMINI_KEYS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 16384 }
            })
          }
        );
        if (response.status === 429) { continue; }
        if (!response.ok) { errors.push(`${model} Status ${response.status}`); continue; }
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (error) { errors.push(String(error)); }
    }
  }
  throw new Error(`Todas as chaves Gemini falharam: ${errors.join(', ')}`);
}

function extractJsonFromText(text: string): any {
  try {
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) return JSON.parse(jsonBlockMatch[1].trim());
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (e) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*/);
      if (jsonMatch) {
        let p = jsonMatch[0];
        if ((p.match(/"/g) || []).length % 2 !== 0) p += '"';
        const ob = (p.match(/\[/g) || []).length - (p.match(/\]/g) || []).length;
        for (let i = 0; i < ob; i++) p += ']';
        const cb = (p.match(/\{/g) || []).length - (p.match(/\}/g) || []).length;
        for (let i = 0; i < cb; i++) p += '}';
        return JSON.parse(p);
      }
    } catch {}
    return null;
  }
}

async function fetchHtmlContent(url: string): Promise<string> {
  const BROWSERLESS_KEY = Deno.env.get('BROWSERLESS_API_KEY');

  // 1. Try Browserless (best quality - renders JS)
  if (BROWSERLESS_KEY) {
    try {
      console.log('🌐 Tentando Browserless...');
      const puppeteerScript = `
        export default async function({ page }) {
          await page.goto('${url}', { waitUntil: 'networkidle2', timeout: 20000 });
          await page.waitForTimeout(2000);
          const html = await page.content();
          return { type: 'application/json', data: { html, success: true } };
        }
      `;
      const resp = await fetch(`https://chrome.browserless.io/function?token=${BROWSERLESS_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/javascript' },
        body: puppeteerScript
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result.html && result.html.length > 500) {
          console.log(`✅ Browserless OK: ${result.html.length} chars`);
          return result.html;
        }
      }
    } catch (e) {
      console.log('Browserless falhou:', e);
    }
  }

  // 2. Fallback: direct fetch
  try {
    console.log('📡 Tentando fetch direto...');
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    });
    if (resp.ok) {
      const html = await resp.text();
      if (html.length > 500) {
        console.log(`✅ Fetch direto OK: ${html.length} chars`);
        return html;
      }
    }
  } catch (e) {
    console.log('Fetch direto falhou:', e);
  }

  // 3. Fallback: proxy
  try {
    console.log('🔄 Tentando proxy...');
    const resp = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    if (resp.ok) {
      const html = await resp.text();
      if (html.length > 500) {
        console.log(`✅ Proxy OK: ${html.length} chars`);
        return html;
      }
    }
  } catch (e) {
    console.log('Proxy falhou:', e);
  }

  return '';
}

function extrairTextoLimpo(htmlContent: string): string {
  if (!htmlContent) return '';

  // Known junk patterns to filter out
  const JUNK_PATTERNS = [
    /voc[êe]\s+est[áa]\s+usando\s+um\s+navegador\s+defasado/i,
    /atualize\s+seu\s+navegador\s+para\s+melhorar/i,
    /a\s+reproduç[ãa]o\s+das\s+not[íi]cias\s+[ée]\s+autorizada/i,
    /use\s+esse\s+formul[áa]rio\s+para\s+comunicar\s+erros/i,
    /sua\s+mensagem\s+foi\s+enviada/i,
    /fale\s+conosco/i,
    /saiba\s+mais\s+sobre\s+a\s+tramitaç[ãa]o/i,
    /report[áa]gem\s*[-–]\s*\w+/i,
    /ediç[ãa]o\s*[-–]\s*\w+/i,
    /^reportagem\b/i,
    /^ediç[ãa]o\b/i,
    // Photo/reporter credits: "Name / Câmara dos Deputados", "Name - Agência Senado"
    /^.{2,40}\s*[\/\-–]\s*(Câmara|Agência|Senado|Ag\.|Foto|Crédito)/i,
    /^\*?\*?[A-ZÀ-Ú][a-zà-ú]+\s+[A-ZÀ-Ú][a-zà-ú]+\s*[\/\-–]\s*.+$/i,
    // Short photo captions like "Motta: 'Segurança é...'"
    /^[A-ZÀ-Ú][a-zà-ú]+\s*:\s*['"'].{5,60}['"']\.?$/i,
    // Footer patterns
    /^fonte\s*:/i,
    /^tags?\s*:/i,
    /compartilhe?\s+(essa?|esta)\s+not[íi]cia/i,
    /leia\s+(tamb[ée]m|mais)\s*:/i,
    /^publicad[oa]\s+em\s+\d/i,
    /^atualizado\s+em\s+\d/i,
    // Browser/site junk
    /javascript\s+(obrigat[óo]rio|necess[áa]rio)/i,
    /habilite\s+o\s+javascript/i,
    /cookies?\s+(necess[áa]rios?|obrigat[óo]rios?)/i,
  ];

  // Try to find the main article content area
  const contentSelectors = [
    // Câmara dos Deputados
    /<div[^>]*class="[^"]*g-artigo__texto-principal[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
    /<div[^>]*class="[^"]*g-artigo__texto[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i,
    // Senado Federal
    /<div[^>]*class="[^"]*materia-conteudo[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // Portais comuns
    /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // Original selectors
    /<div[^>]*class="[^"]*texto-materia[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*conteudo-materia[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*conteudo[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    // Article greedy match (captures full content)
    /<article[^>]*>([\s\S]*)<\/article>/i,
    /<div[^>]*class="[^"]*materia[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  let contentBlock = '';
  for (const regex of contentSelectors) {
    const match = htmlContent.match(regex);
    if (match && match[1].length > 200) {
      contentBlock = match[1];
      break;
    }
  }

  if (!contentBlock) contentBlock = htmlContent;

  // Extract paragraphs
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  const paragrafos: string[] = [];
  while ((m = pRegex.exec(contentBlock)) !== null) {
    let texto = m[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d)))
      .replace(/\s+/g, ' ')
      .trim();
    
    if (texto.length < 15) continue;
    
    // Filter out junk
    const isJunk = JUNK_PATTERNS.some(p => p.test(texto));
    if (isJunk) continue;

    // Filter short lines that look like photo captions (< 80 chars with ":" near start)
    if (texto.length < 80 && /^[A-ZÀ-Ú][\w\sà-ü]{1,25}:/.test(texto)) continue;
    
    paragrafos.push(texto);
  }

  // Extract list items (ul/ol > li) — critical for Câmara pages with PL lists
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  while ((m = liRegex.exec(contentBlock)) !== null) {
    let texto = m[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(parseInt(d)))
      .replace(/\s+/g, ' ')
      .trim();
    
    if (texto.length < 5) continue;
    const isJunk = JUNK_PATTERNS.some(p => p.test(texto));
    if (isJunk) continue;
    
    paragrafos.push(`• ${texto}`);
  }

  // Extract blockquotes
  const bqRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  while ((m = bqRegex.exec(contentBlock)) !== null) {
    let texto = m[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    if (texto.length > 15 && !JUNK_PATTERNS.some(p => p.test(texto))) {
      paragrafos.push(`> ${texto}`);
    }
  }

  // Also extract headings for context
  const hRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  while ((m = hRegex.exec(contentBlock)) !== null) {
    let texto = m[1].replace(/<[^>]+>/g, '').trim();
    if (texto.length > 5 && !JUNK_PATTERNS.some(p => p.test(texto))) {
      if (texto.length < 100) {
        paragrafos.unshift(texto);
      }
    }
  }

  // If too few paragraphs from content block, try entire HTML
  if (paragrafos.length < 3) {
    const allP = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let mp;
    while ((mp = allP.exec(htmlContent)) !== null) {
      let texto = mp[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      if (texto.length > 20 && !paragrafos.includes(texto) && !JUNK_PATTERNS.some(p => p.test(texto))) {
        paragrafos.push(texto);
      }
    }
  }

  const resultado = paragrafos.join('\n\n');
  
  // Quality check: if extracted text is too short, try full HTML as fallback
  if (resultado.length < 200 && htmlContent.length > 500) {
    console.log(`⚠️ Texto extraído muito curto (${resultado.length} chars), tentando fallback com HTML completo...`);
    const allP = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let mp;
    const fallbackParagrafos: string[] = [];
    while ((mp = allP.exec(htmlContent)) !== null) {
      let texto = mp[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
      if (texto.length > 20 && !JUNK_PATTERNS.some(p => p.test(texto))) {
        fallbackParagrafos.push(texto);
      }
    }
    if (fallbackParagrafos.join('\n\n').length > resultado.length) {
      console.log(`✅ Fallback recuperou ${fallbackParagrafos.length} parágrafos`);
      return fallbackParagrafos.join('\n\n');
    }
  }
  
  return resultado;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, titulo, forceReprocess } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const { data: cacheExistente } = await supabase
      .from('noticias_legislativas_cache')
      .select('conteudo_formatado, analise_ia, termos_json, conteudo_completo')
      .eq('link', url)
      .single();

    if (cacheExistente && !forceReprocess) {
      if (cacheExistente.conteudo_formatado && cacheExistente.analise_ia && cacheExistente.conteudo_completo) {
        return new Response(
          JSON.stringify({ success: true, fromCache: true, ...cacheExistente }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch HTML with best available method
    console.log(`🔍 Raspando conteúdo de: ${url}`);
    const htmlContent = await fetchHtmlContent(url);
    const textoExtraido = extrairTextoLimpo(htmlContent);
    console.log(`📝 Texto extraído: ${textoExtraido.length} chars, ${textoExtraido.split('\n\n').length} parágrafos`);

    const prompt = `Você é um jornalista legislativo expert. Analise esta notícia da Câmara dos Deputados e retorne um JSON com conteúdo BEM FORMATADO em Markdown.

TÍTULO: ${titulo || 'Não informado'}
CONTEÚDO ORIGINAL:
${textoExtraido || 'Sem conteúdo extraído - crie análise baseada apenas no título'}

Retorne APENAS este JSON válido (sem blocos de código markdown ao redor):

{
  "conteudo_formatado": "O conteúdo formatado em Markdown seguindo EXATAMENTE este formato:\n\n## O que aconteceu\n\nPrimeiro parágrafo descrevendo o fato principal. Use **negrito** para termos-chave e nomes de leis.\n\nSegundo parágrafo com mais detalhes sobre o contexto.\n\n---\n\n## Por que isso importa\n\nExplicação clara da relevância desta notícia para a sociedade brasileira.\n\n---\n\n## Pontos principais\n\n- **Primeiro ponto:** explicação detalhada do ponto\n- **Segundo ponto:** explicação detalhada\n- **Terceiro ponto:** explicação detalhada\n\n---\n\n## Na prática\n\nO que muda concretamente na vida das pessoas. Use exemplos reais e práticos.",

  "analise_ia": {
    "resumoExecutivo": "Resumo técnico-jurídico em 3-4 parágrafos para profissionais do direito. Use linguagem formal e cite artigos/leis quando possível.",
    "resumoFacil": "Explicação LONGA e MUITO didática, como uma conversa com alguém que não entende NADA de leis. Use:\n\n- Parágrafos curtos e separados\n- Exemplos do dia a dia (\"imagine que você...\")\n- Analogias simples\n- Termos técnicos sempre explicados entre parênteses\n- Tom empático e acolhedor\n- Mínimo 5 parágrafos bem desenvolvidos",
    "pontosPrincipais": ["Ponto 1 detalhado", "Ponto 2 detalhado", "Ponto 3 detalhado"],
    "impactoJuridico": "Análise do impacto na legislação vigente e na prática jurídica. Cite leis e artigos relevantes."
  },

  "termos_json": [
    {"termo": "Nome do Termo", "significado": "Definição clara e acessível, como se explicasse para alguém leigo"},
    {"termo": "Outro Termo", "significado": "Definição clara"}
  ]
}

REGRAS IMPORTANTES:
1. conteudo_formatado: Use ## (h2) para títulos de seção, --- para separadores, **texto** para negrito, - para listas. NÃO use ### (h3).
2. resumoFacil: DEVE ter no mínimo 5 parágrafos, ser MUITO didático e usar linguagem do dia a dia
3. Mínimo 4 termos jurídicos relevantes com definições acessíveis
4. Todo o conteúdo DEVE ser em português do Brasil
5. Se o texto original estiver vazio, use o título para criar uma análise educativa completa`;

    console.log('🤖 Chamando Gemini...');
    const geminiResponse = await callGeminiWithFallback(prompt);
    const resultado = extractJsonFromText(geminiResponse);

    if (!resultado) {
      throw new Error('Não foi possível processar a resposta do Gemini');
    }

    let conteudoFormatado = resultado.conteudo_formatado || '';
    if (conteudoFormatado) {
      // Clean up markdown
      conteudoFormatado = conteudoFormatado
        .replace(/\\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    // Save everything including the original scraped text
    const updatePayload: any = {
      conteudo_formatado: conteudoFormatado,
      analise_ia: JSON.stringify(resultado.analise_ia || {}),
      termos_json: resultado.termos_json || [],
      updated_at: new Date().toISOString()
    };

    // Save original text if we have it
    if (textoExtraido && textoExtraido.length > 50) {
      updatePayload.conteudo_completo = textoExtraido;
    }

    const { error: updateError } = await supabase
      .from('noticias_legislativas_cache')
      .update(updatePayload)
      .eq('link', url);

    if (updateError) console.error('❌ Erro ao atualizar cache:', updateError);
    else console.log('✅ Cache atualizado com sucesso');

    return new Response(
      JSON.stringify({
        success: true, fromCache: false,
        conteudo_formatado: conteudoFormatado,
        conteudo_completo: textoExtraido,
        analise_ia: resultado.analise_ia,
        termos_json: resultado.termos_json
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
