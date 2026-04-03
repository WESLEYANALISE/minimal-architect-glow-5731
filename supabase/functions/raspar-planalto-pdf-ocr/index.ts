import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

// ETAPA 1: Raspar conteúdo usando fetch direto (funciona com Planalto!)
async function rasparConteudoDireto(url: string): Promise<string> {
  console.log(`[Fetch] Raspando diretamente: ${url}`);
  
  // Corrigir URL se for "compilado" (que dá erro)
  let urlCorrigida = url;
  if (url.includes('compilado.htm')) {
    urlCorrigida = url.replace('compilado.htm', '.htm');
    console.log(`[Fetch] URL corrigida de compilado: ${urlCorrigida}`);
  }
  
  // Tentar fetch direto com headers de browser
  const response = await fetch(urlCorrigida, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
    },
  });

  if (!response.ok) {
    console.error(`[Fetch] Erro HTTP: ${response.status}`);
    throw new Error(`Fetch error: ${response.status}`);
  }

  const html = await response.text();
  console.log(`[Fetch] HTML obtido: ${html.length} caracteres`);
  
  // Se ainda for pequeno, logar para debug
  if (html.length < 1000) {
    console.log(`[Fetch] Conteúdo pequeno - primeiros 500 chars:`);
    console.log(html.substring(0, 500));
  }
  
  return html;
}

// ETAPA 2: Converter HTML em PDF via Browserless (não acessa Planalto!)
async function gerarPdfDeHtml(html: string): Promise<ArrayBuffer> {
  console.log(`[Browserless] Convertendo HTML para PDF (${html.length} chars)...`);
  
  if (!BROWSERLESS_API_KEY) {
    throw new Error('BROWSERLESS_API_KEY não configurada');
  }
  
  // Injetar CSS para garantir que as cores apareçam
  const htmlComEstilos = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.5;
          padding: 20px;
          color: #000;
        }
        /* Preservar cores das alterações - geralmente azul */
        a { color: #0000FF !important; text-decoration: none; }
        .alteracao, .revogado, .incluido { color: #0000FF !important; }
        /* Estilos do Planalto */
        p { margin: 0.5em 0; }
        .ementa { font-style: italic; }
        .artigo { margin-top: 1em; }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
  
  const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_API_KEY}`;
  
  const response = await fetch(browserlessUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      html: htmlComEstilos, // HTML direto, não URL!
      options: {
        format: 'A4',
        printBackground: true,
        scale: 0.8,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        displayHeaderFooter: false,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Browserless] Erro: ${response.status}`, errorText);
    throw new Error(`Browserless error: ${response.status} - ${errorText}`);
  }

  const pdfBuffer = await response.arrayBuffer();
  console.log(`[Browserless] PDF gerado: ${pdfBuffer.byteLength} bytes`);
  
  return pdfBuffer;
}

// Chamar Gemini Vision API para extrair texto de PDF
async function callGeminiVision(base64Data: string, mimeType: string, keyIndex = 0): Promise<string> {
  if (keyIndex >= GEMINI_KEYS.length) {
    throw new Error('Todas as chaves Gemini falharam');
  }

  const apiKey = GEMINI_KEYS[keyIndex];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const prompt = `Você é um especialista em OCR e transcrição de legislação brasileira.

TAREFA: Extraia TODO o texto desta página de lei/código do Planalto, COM ESPECIAL ATENÇÃO às anotações de alterações legislativas.

REGRAS CRÍTICAS:
1. Extraia o texto COMPLETO E EXATO como aparece no documento
2. PRESERVE a estrutura: títulos, capítulos, seções, artigos, parágrafos, incisos, alíneas
3. MANTENHA a formatação hierárquica (Art. 1º, § 1º, I -, a), etc.)

IMPORTANTE - ANOTAÇÕES DE ALTERAÇÕES:
4. PRESERVE TODAS as anotações de alterações que aparecem no texto, geralmente em cor diferente (azul/vermelho):
   - "(Revogado)" ou "(Revogado pela Lei nº X)"
   - "(Incluído pela Lei nº X)"  
   - "(Redação dada pela Lei nº X)"
   - "(Vide Lei nº X)"
   - "(Vigência)"
   - "(VETADO)"
   - "(Produção de efeitos)"
   - Qualquer texto entre parênteses que indica alteração legislativa
5. Marque essas anotações no formato: [ALTERACAO: texto da anotação]
   Exemplo: Art. 155 [ALTERACAO: (Incluído pela Lei nº 15.181, de 2025)]

OUTRAS REGRAS:
6. NÃO omita nenhum texto, mesmo que pareça repetitivo
7. IGNORE apenas: logotipos, menus de navegação, rodapés do site
8. Se houver tabelas, transcreva-as em formato texto simples
9. Retorne APENAS o texto da lei/código com as anotações marcadas

Texto extraído:`;

  try {
    console.log(`[Gemini] Tentando key ${keyIndex}...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 32768,
        }
      })
    });

    if (response.status === 429 || response.status === 503) {
      console.log(`[Gemini] Key ${keyIndex} rate limited, trying next...`);
      await new Promise(r => setTimeout(r, 1000));
      return callGeminiVision(base64Data, mimeType, keyIndex + 1);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error(`[Gemini] Error:`, data.error);
      if (keyIndex < GEMINI_KEYS.length - 1) {
        return callGeminiVision(base64Data, mimeType, keyIndex + 1);
      }
      throw new Error(data.error.message);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`[Gemini] Sucesso! Extraiu ${text.length} caracteres`);
    return text;
  } catch (error) {
    console.error(`[Gemini] Error calling:`, error);
    if (keyIndex < GEMINI_KEYS.length - 1) {
      return callGeminiVision(base64Data, mimeType, keyIndex + 1);
    }
    throw error;
  }
}

// Processar PDF grande
async function processarPdfGrande(base64Pdf: string): Promise<string> {
  const tamanhoMB = (base64Pdf.length * 0.75) / (1024 * 1024);
  console.log(`[OCR] Tamanho do PDF: ${tamanhoMB.toFixed(2)} MB`);
  
  if (tamanhoMB > 20) {
    throw new Error(`PDF muito grande (${tamanhoMB.toFixed(2)} MB). Limite: 20 MB`);
  }
  
  return await callGeminiVision(base64Pdf, 'application/pdf');
}

interface Alteracao {
  tipo: string;
  lei: string | null;
  contexto: string;
  artigo: string | null;
  data: string | null;
}

// Extrair referência completa do artigo (artigo + parágrafo + inciso + alínea)
function extrairReferenciaCompleta(contexto: string): string | null {
  // Padrão para capturar: Art. X, § Y, inciso Z, alínea W
  const linhas = contexto.split('\n');
  let artigo: string | null = null;
  let paragrafo: string | null = null;
  let inciso: string | null = null;
  let alinea: string | null = null;
  
  // Buscar de trás pra frente para pegar o mais próximo
  for (let i = linhas.length - 1; i >= 0; i--) {
    const linha = linhas[i];
    
    // Capturar artigo
    if (!artigo) {
      const artigoMatch = linha.match(/Art\.?\s*(\d+[º°ªo]?(?:-[A-Z])?)/i);
      if (artigoMatch) artigo = `Art. ${artigoMatch[1]}`;
    }
    
    // Capturar parágrafo
    if (!paragrafo) {
      const paragrafoMatch = linha.match(/§\s*(\d+[º°ªo]?)|Parágrafo\s+único/i);
      if (paragrafoMatch) {
        paragrafo = paragrafoMatch[0].includes('único') ? 'Parágrafo único' : `§${paragrafoMatch[1]}`;
      }
    }
    
    // Capturar inciso (números romanos)
    if (!inciso) {
      const incisoMatch = linha.match(/^\s*(X{0,3}(?:IX|IV|V?I{0,3}))\s*[-–—]/);
      if (incisoMatch) inciso = incisoMatch[1];
    }
    
    // Capturar alínea
    if (!alinea) {
      const alineaMatch = linha.match(/^\s*([a-z])\s*\)/i);
      if (alineaMatch) alinea = alineaMatch[1].toLowerCase();
    }
  }
  
  // Montar referência completa
  if (!artigo) return null;
  
  let ref = artigo;
  if (paragrafo) ref += `, ${paragrafo}`;
  if (inciso) ref += `, inciso ${inciso}`;
  if (alinea) ref += `, alínea ${alinea}`;
  
  return ref;
}

// Extrair data/ano da lei
function extrairDataLei(textoLei: string): string | null {
  // Buscar padrão "Lei nº X.XXX, de DD de MES de AAAA" ou "Lei nº X.XXX/AAAA"
  const padraoCompleto = textoLei.match(/de\s+(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i);
  if (padraoCompleto) {
    const meses: Record<string, string> = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
      'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
      'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    const dia = padraoCompleto[1].padStart(2, '0');
    const mes = meses[padraoCompleto[2].toLowerCase()];
    const ano = padraoCompleto[3];
    return `${ano}-${mes}-${dia}`;
  }
  
  // Buscar padrão simples /AAAA
  const padraoSimples = textoLei.match(/\/(\d{4})/);
  if (padraoSimples) {
    return `${padraoSimples[1]}-01-01`;
  }
  
  return null;
}

// Extrair alterações legislativas do texto
function extrairAlteracoes(texto: string): Alteracao[] {
  const alteracoes: Alteracao[] = [];
  
  // Padrões para detectar alterações marcadas pelo OCR
  const padraoMarcado = /\[ALTERACAO:\s*([^\]]+)\]/gi;
  
  // Padrões para detectar alterações diretamente no texto
  const padroes = [
    /\(Revogado(?:\s+pel[ao]\s+([^)]+))?\)/gi,
    /\(Incluído(?:\s+pel[ao]\s+([^)]+))?\)/gi,
    /\(Redação\s+dada\s+pel[ao]\s+([^)]+)\)/gi,
    /\(Vide\s+([^)]+)\)/gi,
    /\(VETADO\)/gi,
    /\(Vigência\)/gi,
    /\(Produção\s+de\s+efeitos?\)/gi,
    /\(Suprimido\)/gi,
    /\(Renumerado(?:\s+pel[ao]\s+([^)]+))?\)/gi,
  ];
  
  // Primeiro, buscar marcações do OCR [ALTERACAO: ...]
  let match;
  while ((match = padraoMarcado.exec(texto)) !== null) {
    const conteudo = match[1].trim();
    const contextoAntes = texto.substring(Math.max(0, match.index - 300), match.index);
    
    const refCompleta = extrairReferenciaCompleta(contextoAntes);
    
    let tipo = 'alteração';
    let lei: string | null = null;
    
    if (/revogad/i.test(conteudo)) tipo = 'Revogado';
    else if (/incluíd/i.test(conteudo)) tipo = 'Incluído';
    else if (/redação.*dada/i.test(conteudo)) tipo = 'Redação alterada';
    else if (/vide/i.test(conteudo)) tipo = 'Vide';
    else if (/vetado/i.test(conteudo)) tipo = 'Vetado';
    else if (/vigência/i.test(conteudo)) tipo = 'Vigência';
    else if (/suprimid/i.test(conteudo)) tipo = 'Suprimido';
    else if (/renumerad/i.test(conteudo)) tipo = 'Renumerado';
    
    const leiMatch = conteudo.match(/Lei\s+(?:Complementar\s+)?n[º°]?\s*([\d.]+(?:\/\d+)?)/i);
    if (leiMatch) lei = `Lei nº ${leiMatch[1]}`;
    
    const data = extrairDataLei(conteudo);
    
    alteracoes.push({
      tipo,
      lei,
      contexto: conteudo,
      artigo: refCompleta,
      data
    });
  }
  
  // Se não encontrou marcações, buscar diretamente no texto
  if (alteracoes.length === 0) {
    for (const padrao of padroes) {
      padrao.lastIndex = 0;
      while ((match = padrao.exec(texto)) !== null) {
        const conteudo = match[0];
        const contextoAntes = texto.substring(Math.max(0, match.index - 300), match.index);
        
        const refCompleta = extrairReferenciaCompleta(contextoAntes);
        
        let tipo = 'alteração';
        if (/revogad/i.test(conteudo)) tipo = 'Revogado';
        else if (/incluíd/i.test(conteudo)) tipo = 'Incluído';
        else if (/redação.*dada/i.test(conteudo)) tipo = 'Redação alterada';
        else if (/vide/i.test(conteudo)) tipo = 'Vide';
        else if (/vetado/i.test(conteudo)) tipo = 'Vetado';
        else if (/vigência/i.test(conteudo)) tipo = 'Vigência';
        else if (/suprimid/i.test(conteudo)) tipo = 'Suprimido';
        else if (/renumerad/i.test(conteudo)) tipo = 'Renumerado';
        
        const leiTexto = match[1] || conteudo;
        const leiMatch = leiTexto.match(/Lei\s+(?:Complementar\s+)?n[º°]?\s*([\d.]+(?:\/\d+)?)/i);
        const data = extrairDataLei(leiTexto);
        
        alteracoes.push({
          tipo,
          lei: leiMatch ? `Lei nº ${leiMatch[1]}` : null,
          contexto: conteudo.replace(/[()]/g, ''),
          artigo: refCompleta,
          data
        });
      }
    }
  }
  
  // Remover duplicatas
  const unicas = alteracoes.filter((a, i, arr) => 
    arr.findIndex(b => b.contexto === a.contexto && b.artigo === a.artigo) === i
  );
  
  console.log(`[Alterações] Total encontradas: ${unicas.length}`);
  return unicas;
}

serve(async (req) => {
  console.log('[PDF-OCR] Requisição recebida');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urlPlanalto, retornarPdfBase64 = false } = await req.json();
    console.log(`[PDF-OCR] URL: ${urlPlanalto}`);
    
    if (!urlPlanalto) {
      return new Response(
        JSON.stringify({ error: 'urlPlanalto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Não precisa mais de FIRECRAWL, usando fetch direto

    if (!BROWSERLESS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'BROWSERLESS_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (GEMINI_KEYS.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma chave Gemini configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();

    // ==========================================
    // NOVA ABORDAGEM HÍBRIDA
    // ==========================================

    // ETAPA 1: Raspar HTML diretamente (funciona com Planalto!)
    console.log('\n🔗 ETAPA 1: Raspando HTML diretamente...');
    const htmlContent = await rasparConteudoDireto(urlPlanalto);
    const tempoEtapa1 = Date.now() - startTime;
    console.log(`✅ HTML raspado em ${tempoEtapa1}ms (${htmlContent.length} chars)`);

    if (htmlContent.length < 1000) {
      throw new Error('Fetch retornou muito pouco conteúdo. Verifique a URL.');
    }

    // ETAPA 2: Converter HTML em PDF via Browserless
    console.log('\n📄 ETAPA 2: Convertendo HTML para PDF via Browserless...');
    const tempoAntesPdf = Date.now();
    const pdfBuffer = await gerarPdfDeHtml(htmlContent);
    const tempoEtapa2 = Date.now() - tempoAntesPdf;
    console.log(`✅ PDF gerado em ${tempoEtapa2}ms (${pdfBuffer.byteLength} bytes)`);

    // ETAPA 3: Converter para base64
    console.log('\n🔄 ETAPA 3: Convertendo para base64...');
    const uint8Array = new Uint8Array(pdfBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Pdf = btoa(binary);
    console.log(`✅ Convertido: ${base64Pdf.length} caracteres base64`);

    // ETAPA 4: Extrair texto via Gemini Vision OCR
    console.log('\n🔍 ETAPA 4: Extraindo texto via Gemini Vision...');
    const tempoAntesOcr = Date.now();
    const textoExtraido = await processarPdfGrande(base64Pdf);
    const tempoOCR = Date.now() - tempoAntesOcr;
    console.log(`✅ Texto extraído em ${tempoOCR}ms: ${textoExtraido.length} caracteres`);

    // ETAPA 5: Extrair alterações legislativas do texto
    console.log('\n📝 ETAPA 5: Extraindo alterações legislativas...');
    const alteracoes = extrairAlteracoes(textoExtraido);
    console.log(`✅ Encontradas ${alteracoes.length} alterações legislativas`);

    const tempoTotal = Date.now() - startTime;

    // Preparar resposta
    const response: any = {
      success: true,
      url: urlPlanalto,
      caracteres: textoExtraido.length,
      textoExtraido,
      alteracoes,
      totalAlteracoes: alteracoes.length,
      estatisticas: {
        tempoFirecrawlMs: tempoEtapa1,
        tempoGeracaoPdfMs: tempoEtapa2,
        tempoOcrMs: tempoOCR,
        tempoTotalMs: tempoTotal,
        tamanhoHtmlChars: htmlContent.length,
        tamanhoPdfBytes: pdfBuffer.byteLength,
        tamanhoPdfMB: (pdfBuffer.byteLength / (1024 * 1024)).toFixed(2)
      }
    };

    if (retornarPdfBase64) {
      response.pdfBase64 = base64Pdf;
    }

    console.log(`\n✅ CONCLUÍDO em ${tempoTotal}ms`);
    console.log(`   - HTML: ${htmlContent.length} chars (Firecrawl)`);
    console.log(`   - PDF: ${(pdfBuffer.byteLength / 1024).toFixed(1)} KB (Browserless)`);
    console.log(`   - Texto: ${textoExtraido.length} chars (Gemini OCR)`);
    console.log(`   - Alterações: ${alteracoes.length}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PDF-OCR] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
