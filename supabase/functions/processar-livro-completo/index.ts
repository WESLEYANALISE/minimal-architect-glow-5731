import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== DRIVE DOWNLOAD ====================

function converterUrlDrive(url: string): string {
  if (url.includes('/folders/')) {
    throw new Error('URL de pasta não suportada. Use URL direta do arquivo.');
  }
  let fileId: string | null = null;
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) fileId = matchD[1];
  if (!fileId) {
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId) fileId = matchId[1];
  }
  if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  return url;
}

async function baixarPdfDrive(url: string): Promise<ArrayBuffer> {
  const downloadUrl = converterUrlDrive(url);
  console.log(`[Download] URL: ${downloadUrl}`);

  let response = await fetch(downloadUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/pdf,*/*',
    },
    redirect: 'follow',
  });

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const html = await response.text();
    const confirmMatch = html.match(/href="([^"]*confirm=t[^"]*)"/);
    if (confirmMatch) {
      let confirmUrl = confirmMatch[1].replace(/&amp;/g, '&');
      if (!confirmUrl.startsWith('http')) confirmUrl = 'https://drive.google.com' + confirmUrl;
      response = await fetch(confirmUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        redirect: 'follow',
      });
    } else {
      const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
      if (fileId) {
        response = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}&confirm=yes`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': 'download_warning_token=true',
          },
          redirect: 'follow',
        });
      }
    }
  }

  if (!response.ok) throw new Error(`Erro ao baixar PDF: ${response.status}`);

  const buffer = await response.arrayBuffer();
  const header = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 5)));
  if (!header.startsWith('%PDF')) throw new Error('Arquivo baixado não é PDF válido.');
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ==================== MISTRAL OCR ====================

async function uploadImagemParaStorage(
  supabase: any, imageBase64: string, imageId: string, tituloLivro: string, paginaIndex: number
): Promise<string | null> {
  try {
    const mimeType = imageId.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    const slugLivro = tituloLivro.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const fileName = `${slugLivro}/pagina-${paginaIndex}/${imageId}`;

    const { error } = await supabase.storage.from('leitura-imagens').upload(fileName, bytes, { contentType: mimeType, upsert: true });
    if (error) { console.error(`[Upload] Erro: ${error.message}`); return null; }

    const { data: urlData } = supabase.storage.from('leitura-imagens').getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`[Upload] Erro imagem ${imageId}:`, error);
    return null;
  }
}

async function extrairTextoComMistral(pdfBase64: string, supabase: any, tituloLivro: string): Promise<Array<{ index: number; markdown: string }>> {
  const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
  if (!MISTRAL_API_KEY) throw new Error('MISTRAL_API_KEY não configurada');

  console.log('[Mistral OCR] Iniciando extração...');
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: { type: 'document_url', document_url: `data:application/pdf;base64,${pdfBase64}` },
      include_image_base64: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral OCR falhou: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.pages || !Array.isArray(data.pages)) {
    if (data.text) return [{ index: 0, markdown: data.text }];
    throw new Error('Formato Mistral OCR não reconhecido');
  }

  console.log(`[Mistral OCR] ${data.pages.length} páginas extraídas`);

  const paginasProcessadas: Array<{ index: number; markdown: string }> = [];
  for (const pagina of data.pages) {
    let textoMarkdown = pagina.markdown || '';
    if (pagina.images?.length > 0) {
      for (const img of pagina.images) {
        if (img.image_base64 && img.id) {
          const urlPublica = await uploadImagemParaStorage(supabase, img.image_base64, img.id, tituloLivro, pagina.index);
          if (urlPublica) {
            textoMarkdown = textoMarkdown.replace(
              new RegExp(`!\\[[^\\]]*\\]\\(${img.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
              `![${img.id}](${urlPublica})`
            );
          }
        }
      }
    }
    paginasProcessadas.push({ index: pagina.index, markdown: textoMarkdown });
  }
  return paginasProcessadas;
}

// ==================== LIMPEZA ====================

const PADROES_LIXO = [
  /título original:.*?\n/gi, /republished with permission.*?\n/gi, /grafia atualizada.*?\n/gi,
  /acordo ortográfico.*?\n/gi, /ISBN[:\s][\d\-Xx]+/gi, /copyright.*?\n/gi, /©\s*\d{4}/g,
  /todos os direitos reservados/gi, /all rights reserved/gi,
  /tradução[:\s][^\n]{3,80}\n/gi, /revisão[:\s][^\n]{3,80}\n/gi, /capa[:\s][^\n]{3,80}\n/gi,
  /projeto gráfico[:\s][^\n]{3,80}\n/gi, /diagramação[:\s][^\n]{3,80}\n/gi,
  /produção digital[:\s][^\n]{3,80}\n/gi, /preparação[:\s][^\n]{3,80}\n/gi,
  /coordenação[:\s][^\n]{3,80}\n/gi, /edição[:\s][^\n]{3,80}\n/gi,
  /editor[:\s][^\n]{3,80}\n/gi, /impressão[:\s][^\n]{3,80}\n/gi,
  /geração editorial/gi, /câmara brasileira do livro/gi, /CIP-Brasil/gi,
  /ficha catalográfica/gi, /dados internacionais de catalogação/gi,
  /!\[.*?\]\((?!https?:\/\/)[^)]+\)/g,
  /\[?IMAGEM[^\]]*\]?/gi, /\[?IMG[^\]]*\]?/gi,
  /https?:\/\/[^\s]+/gi, /www\.[^\s]+/gi, /[\w.-]+@[\w.-]+\.\w+/gi,
  /^\s*\d{1,3}\s*$/gm,
];

function removerLixoEditorial(texto: string): string {
  let t = texto;
  for (const padrao of PADROES_LIXO) t = t.replace(padrao, ' ');
  return t.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').replace(/^\s+$/gm, '').trim();
}

function isSumario(texto: string): boolean {
  const t = texto.trim().toLowerCase();
  // Palavras-chave de título de sumário
  const marcadores = ['sumário', 'sumario', 'índice', 'indice', 'conteúdo', 'table of contents'];
  const temTituloSumario = marcadores.some(m => t.includes(m));

  // Contar linhas que parecem entradas de sumário
  const linhas = t.split('\n').filter(l => l.trim().length > 0);
  const linhasCapitulo = linhas.filter(l =>
    /cap[íi]tulo|parte\s+[ivx\d]|pref[áa]cio|pr[oó]logo|introdu[çc][ãa]o|conclus[ãa]o|notas|ap[eê]ndice|ep[íi]logo/i.test(l)
  );

  // Padrão de número de página ao final (ex: "Capítulo I ..... 15")
  const linhasComPagina = linhas.filter(l => /\.{2,}\s*\d+\s*$|\s{2,}\d+\s*$/.test(l));

  // Detectar listas numeradas sequenciais (1. Título, 2. Título, 3. Título...)
  const linhasNumeradas = linhas.filter(l => /^\s*\d{1,2}[\.\)]\s+\S/.test(l));

  // Detectar numeração romana (I, II, III, IV...) comum em livros acadêmicos
  const linhasRomanas = linhas.filter(l => /^\s*[IVXLC]{1,6}\s*[-–—.]\s+\S/i.test(l));

  return temTituloSumario || linhasCapitulo.length >= 3 || linhasComPagina.length >= 3 || linhasNumeradas.length >= 5 || linhasRomanas.length >= 3;
}

function isPaginaLixo(texto: string): boolean {
  const t = texto.trim();
  // Nunca descartar páginas de sumário/índice
  if (isSumario(t)) return false;
  if (t.length < 100) return true;
  const padroesLixo = [/ISBN/i, /Copyright/i, /Todos os direitos/i, /Ficha catalográfica/i, /Impresso no Brasil/i];
  if (padroesLixo.filter(p => p.test(t)).length >= 2) return true;
  const paragrafos = t.split(/\n\n+/);
  if (paragrafos.filter(p => p.trim().length > 150).length === 0) return true;
  return false;
}

// ==================== GEMINI ====================

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

async function callGemini(prompt: string, maxRetries = 3): Promise<string> {
  for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
    const apiKey = GEMINI_KEYS[keyIndex];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 100000 }
            })
          }
        );

        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        if (!response.ok) { const e = await response.text(); console.error(`Gemini key ${keyIndex + 1}:`, e); break; }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (error) {
        console.error(`Erro key ${keyIndex + 1}, attempt ${attempt + 1}:`, error);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

// ==================== DIVISÃO EM PÁGINAS ====================

// Divide um parágrafo grande em pontos de quebra seguros (nunca no meio de frase)
function dividirParagrafoGrande(texto: string, limite: number): string[] {
  const partes: string[] = [];
  let restante = texto;
  while (restante.length > limite) {
    // Procurar último ponto de quebra seguro antes do limite
    let pontoCorte = -1;
    const buscaRegex = /[.!?;]\s/g;
    let m;
    while ((m = buscaRegex.exec(restante)) !== null) {
      if (m.index + 2 <= limite) {
        pontoCorte = m.index + 1; // inclui o ponto
      } else {
        break;
      }
    }
    // Se não encontrou ponto de frase, procurar último espaço
    if (pontoCorte <= 0) {
      pontoCorte = restante.lastIndexOf(' ', limite);
    }
    // Se nem espaço encontrou, corta no limite mesmo
    if (pontoCorte <= 0) {
      pontoCorte = limite;
    }
    partes.push(restante.substring(0, pontoCorte).trim());
    restante = restante.substring(pontoCorte).trim();
  }
  if (restante.length > 0) partes.push(restante);
  return partes;
}

function dividirEmPaginas(texto: string, capitulosInfo: Map<number, string>): Array<{conteudo: string, capitulo: number, tituloCapitulo: string, isChapterStart: boolean}> {
  const TAMANHO_MINIMO = 1200;
  const TAMANHO_IDEAL = 1800;
  const TAMANHO_MAXIMO = 2500;

  const paginas: Array<{conteudo: string, capitulo: number, tituloCapitulo: string, isChapterStart: boolean}> = [];

  const marcadorRegex = /\[INICIO_CAPITULO:(\d+):([^\]]+)\]/g;
  const partes: Array<{texto: string, capitulo: number, titulo: string}> = [];

  let ultimoIndice = 0;
  let capituloAtual = 1;
  let tituloAtual = capitulosInfo.get(1) || 'Introdução';
  let match;

  while ((match = marcadorRegex.exec(texto)) !== null) {
    if (match.index > ultimoIndice) {
      const textoAntes = texto.substring(ultimoIndice, match.index).trim();
      if (textoAntes.length > 50) partes.push({ texto: textoAntes, capitulo: capituloAtual, titulo: tituloAtual });
    }
    capituloAtual = parseInt(match[1]);
    tituloAtual = match[2].trim();
    ultimoIndice = match.index + match[0].length;
  }

  if (ultimoIndice < texto.length) {
    const textoRestante = texto.substring(ultimoIndice).trim();
    if (textoRestante.length > 50) partes.push({ texto: textoRestante, capitulo: capituloAtual, titulo: tituloAtual });
  }

  if (partes.length === 0) partes.push({ texto: texto, capitulo: 1, titulo: 'Conteúdo' });

  for (const parte of partes) {
    const paragrafos = parte.texto.split(/\n\n+/).filter(p => p.trim().length > 0);
    let paginaAtual = '';
    let isFirstPageOfChapter = true;

    for (let i = 0; i < paragrafos.length; i++) {
      const paragrafo = paragrafos[i].trim();

      // Se o parágrafo sozinho excede o máximo, dividir em sentenças
      if (paragrafo.length > TAMANHO_MAXIMO) {
        // Salvar página atual se tiver conteúdo
        if (paginaAtual.length >= TAMANHO_MINIMO) {
          paginas.push({ conteudo: paginaAtual.trim(), capitulo: parte.capitulo, tituloCapitulo: parte.titulo, isChapterStart: isFirstPageOfChapter });
          isFirstPageOfChapter = false;
          paginaAtual = '';
        }
        // Dividir parágrafo grande em pedaços seguros
        const subPartes = dividirParagrafoGrande(paginaAtual ? paginaAtual + '\n\n' + paragrafo : paragrafo, TAMANHO_MAXIMO);
        for (let s = 0; s < subPartes.length; s++) {
          if (s < subPartes.length - 1) {
            paginas.push({ conteudo: subPartes[s].trim(), capitulo: parte.capitulo, tituloCapitulo: parte.titulo, isChapterStart: isFirstPageOfChapter });
            isFirstPageOfChapter = false;
          } else {
            paginaAtual = subPartes[s]; // último pedaço continua acumulando
          }
        }
        continue;
      }

      if ((paginaAtual.length + paragrafo.length + 2) > TAMANHO_MAXIMO) {
        if (paginaAtual.length >= TAMANHO_MINIMO) {
          paginas.push({ conteudo: paginaAtual.trim(), capitulo: parte.capitulo, tituloCapitulo: parte.titulo, isChapterStart: isFirstPageOfChapter });
          isFirstPageOfChapter = false;
          paginaAtual = paragrafo;
        } else {
          paginaAtual += (paginaAtual ? '\n\n' : '') + paragrafo;
        }
      } else {
        paginaAtual += (paginaAtual ? '\n\n' : '') + paragrafo;
      }

      if (paginaAtual.length >= TAMANHO_IDEAL && i < paragrafos.length - 1) {
        paginas.push({ conteudo: paginaAtual.trim(), capitulo: parte.capitulo, tituloCapitulo: parte.titulo, isChapterStart: isFirstPageOfChapter });
        isFirstPageOfChapter = false;
        paginaAtual = '';
      }
    }

    if (paginaAtual.trim().length > 0) {
      if (paginaAtual.trim().length < TAMANHO_MINIMO && paginas.length > 0) {
        const ultima = paginas[paginas.length - 1];
        if (ultima.capitulo === parte.capitulo && ultima.conteudo.length + paginaAtual.length < TAMANHO_MAXIMO * 1.2) {
          ultima.conteudo += '\n\n' + paginaAtual.trim();
        } else {
          paginas.push({ conteudo: paginaAtual.trim(), capitulo: parte.capitulo, tituloCapitulo: parte.titulo, isChapterStart: isFirstPageOfChapter });
        }
      } else {
        paginas.push({ conteudo: paginaAtual.trim(), capitulo: parte.capitulo, tituloCapitulo: parte.titulo, isChapterStart: isFirstPageOfChapter });
      }
    }
  }

  return paginas;
}

function dividirEmChunks(texto: string, tamanhoMax: number): string[] {
  const OVERLAP = 500;
  const chunks: string[] = [];
  let posicao = 0;
  while (posicao < texto.length) {
    let fim = Math.min(posicao + tamanhoMax, texto.length);
    if (fim < texto.length) {
      const ultimoParragrafo = texto.lastIndexOf('\n\n', fim);
      if (ultimoParragrafo > posicao + tamanhoMax * 0.5) fim = ultimoParragrafo + 2;
    }
    chunks.push(texto.substring(posicao, fim).trim());
    // Retroceder overlap para não perder conteúdo na fronteira
    posicao = fim < texto.length ? Math.max(posicao + 1, fim - OVERLAP) : fim;
  }
  return chunks;
}

// ==================== MODO ANALISAR ====================

async function modoAnalisar(supabase: any, tituloLivro: string, driveUrl: string, livroId: number | null) {
  console.log(`[Analisar] Iniciando para: ${tituloLivro}`);

  // Etapa 1: Baixar PDF
  console.log('[Analisar] Baixando PDF do Google Drive...');
  const pdfBuffer = await baixarPdfDrive(driveUrl);
  console.log(`[Analisar] PDF: ${Math.round(pdfBuffer.byteLength / 1024)}KB`);

  // Etapa 2: Mistral OCR
  console.log('[Analisar] Extraindo texto com Mistral OCR...');
  const pdfBase64 = arrayBufferToBase64(pdfBuffer);
  const paginasOCR = await extrairTextoComMistral(pdfBase64, supabase, tituloLivro);
  console.log(`[Analisar] ${paginasOCR.length} páginas OCR`);

  // Etapa 3: Salvar OCR bruto
  console.log('[Analisar] Salvando OCR bruto...');
  await supabase.from('BIBLIOTECA-LEITURA-DINAMICA').delete().eq('Titulo da Obra', tituloLivro);

  let paginasSalvas = 0;
  for (const pagina of paginasOCR) {
    const numeroPagina = (pagina.index || 0) + 1;
    const textoLimpo = removerLixoEditorial(pagina.markdown || '');
    if (isPaginaLixo(textoLimpo) && !isSumario(textoLimpo)) continue;
    if (textoLimpo.length > 100 || isSumario(textoLimpo)) {
      await supabase.from('BIBLIOTECA-LEITURA-DINAMICA').upsert({
        'Titulo da Obra': tituloLivro, 'Pagina': numeroPagina, 'Conteúdo': textoLimpo, 'Titulo do Capitulo': null
      }, { onConflict: 'Titulo da Obra,Pagina', ignoreDuplicates: false });
      paginasSalvas++;
    }
  }
  console.log(`[Analisar] ${paginasSalvas} páginas salvas`);

  // Etapa 4: Gemini identifica capítulos usando SUMÁRIO REAL
  console.log('[Analisar] Identificando capítulos com Gemini (priorizando sumário)...');
  // Separar sumários e conteúdo - sumário vai PRIMEIRO para o Gemini
  const paginasTexto = paginasOCR.map(p => removerLixoEditorial(p.markdown || ''));
  const paginasSumario = paginasTexto.filter(t => isSumario(t));
  const paginasConteudo = paginasTexto.filter(t => !isPaginaLixo(t) && t.length > 100 && !isSumario(t));

  const textoParaAnalise = [
    ...(paginasSumario.length > 0 ? ['=== SUMÁRIO/ÍNDICE DO LIVRO ===', ...paginasSumario, '=== CONTEÚDO DO LIVRO ==='] : []),
    ...paginasConteudo
  ].join('\n\n---PAGINA---\n\n');

  const promptCapitulos = `Você é um especialista em análise de livros. Sua tarefa é identificar os capítulos REAIS deste livro.

LIVRO: "${tituloLivro}"

INSTRUÇÕES CRÍTICAS (siga na ordem):

1. PRIMEIRO, procure o SUMÁRIO, ÍNDICE ou TABELA DE CONTEÚDO no texto abaixo. Ele geralmente aparece nas primeiras páginas e lista os capítulos com números de página.

2. Se encontrar o sumário, use EXATAMENTE os capítulos/seções listados nele. Copie os títulos como estão no sumário do autor.

3. NÃO INCLUA como capítulos:
   - Textos editoriais como "Livros para todos", "Vida e obra do autor"
   - Prefácios de editoras ou coleções
   - Fichas catalográficas, créditos, ISBN
   - Biografias do autor inseridas pela editora
   - Apresentações de coleções editoriais
   
4. INCLUA apenas o que o AUTOR do livro escreveu como estrutura:
   - Introdução (se listada no sumário)
   - Capítulos numerados (I, II, III... ou 1, 2, 3...)
   - Partes do livro (Parte I, Part One, Livro Primeiro...)
   - Notas, Apêndices, Conclusão (se listados no sumário)

5. Se NÃO encontrar sumário, identifique capítulos pelos marcadores no texto:
   - "CAPÍTULO I", "CAPÍTULO 1", "Chapter 1"
   - "PARTE I", "PART ONE", "LIVRO PRIMEIRO"
   - Números romanos isolados em linhas: "I", "II", "III"
   - Títulos em caixa alta seguidos de texto corrido

6. PARA LIVROS DE FICÇÃO/ROMANCE: É MUITO comum ter PARTES (Part One, Parte I, Primeira Parte) e CAPÍTULOS dentro de cada parte. Identifique AMBOS.
   - Exemplo: "Parte I - Capítulo 1", "Parte I - Capítulo 2", "Parte II - Capítulo 1" etc.
   - Se o livro tem "Part One" + capítulos numerados dentro, liste como: "Parte I - Capítulo 1", "Parte I - Capítulo 2"...
   - Se os capítulos são apenas numerados (1, 2, 3...) sem partes, liste normalmente

7. DETECTE capítulos em formato romano (I, II, III, IV, V...) que é muito comum em livros acadêmicos.
   
8. DETECTE seções em formato "TÍTULO EM CAIXA ALTA" seguido de subtópicos — isso indica capítulo mesmo sem número.

9. NUNCA retorne apenas 1 capítulo genérico como "Conteúdo" ou "Conteúdo do Livro". Se você não conseguir identificar capítulos, tente dividir por partes lógicas do texto (a cada ~20-30 páginas crie um capítulo baseado no tema abordado).

Retorne um JSON válido:
[
  {"numero": 1, "titulo": "Título exato como no sumário"},
  {"numero": 2, "titulo": "Título exato como no sumário"}
]

REGRAS DO JSON:
- Use os títulos EXATAMENTE como aparecem no sumário/índice do livro
- Numere sequencialmente começando em 1
- Retorne APENAS o JSON, sem markdown, sem explicação, sem \`\`\`
- Se o livro tem Partes + Capítulos, combine: "Parte I - Capítulo 1: Título"

TEXTO DO LIVRO (primeiras 80000 chars):
${textoParaAnalise.substring(0, 80000)}`;

  let capitulosIdentificados: Array<{numero: number, titulo: string}> = [];
  try {
    const respostaCapitulos = await callGemini(promptCapitulos);
    const jsonMatch = respostaCapitulos.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      capitulosIdentificados = JSON.parse(jsonMatch[0]);
      console.log(`[Analisar] ${capitulosIdentificados.length} capítulos identificados do sumário`);
      for (const cap of capitulosIdentificados) {
        console.log(`  - Cap ${cap.numero}: ${cap.titulo}`);
      }
    }
  } catch (e) {
    console.error('[Analisar] Erro ao analisar capítulos:', e);
    capitulosIdentificados = [{ numero: 1, titulo: 'Conteúdo do Livro' }];
  }

  // Atualizar status do livro
  if (livroId) {
    await supabase.from('BIBLIOTECA-CLASSICOS').update({
      analise_status: 'analisado',
      total_capitulos: capitulosIdentificados.length
    }).eq('id', livroId);
  }

  return {
    success: true,
    mode: 'analisar',
    livroTitulo: tituloLivro,
    paginasOCR: paginasSalvas,
    capitulos: capitulosIdentificados
  };
}

// ==================== MODO FORMATAR ====================

async function modoFormatar(supabase: any, tituloLivro: string, livroId: number | null, capitulosConfirmados: Array<{numero: number, titulo: string}>) {
  console.log(`[Formatar] Iniciando para: ${tituloLivro} com ${capitulosConfirmados.length} capítulos confirmados`);

  // Buscar texto OCR salvo
  const { data: paginasOCR, error: ocrError } = await supabase
    .from('BIBLIOTECA-LEITURA-DINAMICA')
    .select('"Conteúdo", "Pagina"')
    .eq('Titulo da Obra', tituloLivro)
    .order('Pagina', { ascending: true });

  if (ocrError || !paginasOCR?.length) {
    throw new Error('Texto OCR não encontrado. Execute a análise primeiro.');
  }

  console.log(`[Formatar] ${paginasOCR.length} páginas OCR encontradas`);

  const textoCompleto = paginasOCR.map((p: any) => p['Conteúdo'] || '').join('\n\n');

  const capitulosInfo = new Map<number, string>();
  let listaCapitulos = 'CAPÍTULOS CONFIRMADOS DO LIVRO (use EXATAMENTE estes):\n';
  for (const cap of capitulosConfirmados) {
    capitulosInfo.set(cap.numero, cap.titulo);
    listaCapitulos += `- Capítulo ${cap.numero}: ${cap.titulo}\n`;
  }

  // Gemini formata
  console.log('[Formatar] Formatando com Gemini...');

  const promptBase = `Você é um formatador especializado em livros para apps de leitura mobile premium.

TAREFA: Formate este texto para uma experiência de leitura RICA e ENVOLVENTE em dispositivos móveis. O resultado deve parecer um e-book de alta qualidade, NÃO texto bruto.

${listaCapitulos}

📋 INSTRUÇÕES DE FORMATAÇÃO MARKDOWN — OBRIGATÓRIO:

1. PRESERVE 100% DO CONTEÚDO - NÃO resuma, NÃO omita, NÃO altere. Se o texto original tem 10 parágrafos, o formatado deve ter os mesmos 10 parágrafos completos.

2. SEPARE CADA PARÁGRAFO com duas quebras de linha (\\n\\n). Isso é CRÍTICO — cada parágrafo DEVE ser separado por uma linha em branco.

3. REMOVA: créditos editoriais, ISBN, copyright, sumário, números de página, textos editoriais de coleção

4. MARQUE CAPÍTULOS: [INICIO_CAPITULO:N:Título] no início de cada capítulo
   - Use APENAS os capítulos confirmados acima
   - NÃO crie capítulos novos que não estão na lista

5. 🎨 MARKDOWN RICO — APLIQUE COM FREQUÊNCIA (isso é o mais importante!):
   - ## para subtítulos dentro de capítulos
   - > para TODAS as citações, falas de personagens entre aspas, trechos de documentos/cartas, slogans. Use blockquote GENEROSAMENTE.
   - **negrito** para: termos importantes, conceitos-chave, nomes de personagens na primeira aparição, palavras estrangeiras, lugares importantes
   - *itálico* para: ênfase do narrador, pensamentos internos, expressões em latim/outros idiomas, títulos de obras mencionadas
   - Preserve diálogos com travessão (—) em linhas separadas
   - --- para separar cenas ou seções temáticas dentro de um capítulo
   - Listas com - quando o texto enumera itens

6. 📝 EXEMPLOS CONCRETOS DE FORMATAÇÃO ESPERADA:

   TEXTO OCR BRUTO:
   "Winston Smith pensou que o Grande Irmão estava observando. GUERRA É PAZ. LIBERDADE É ESCRAVIDÃO."
   
   FORMATAÇÃO CORRETA:
   **Winston Smith** pensou que o **Grande Irmão** estava observando.
   
   > GUERRA É PAZ. LIBERDADE É ESCRAVIDÃO.

   TEXTO OCR BRUTO:
   "Como disse Montesquieu: 'Não há liberdade se o poder de julgar não está separado do poder legislativo'."
   
   FORMATAÇÃO CORRETA:
   Como disse **Montesquieu**:
   
   > "Não há liberdade se o poder de julgar não está separado do poder legislativo."

7. JUNTE parágrafos cortados incorretamente pelo OCR
8. CORRIJA hifenização de fim de linha (pa-\\nlavra → palavra)
9. Mantenha imagens com URLs completas (![alt](https://...))
10. NÃO siga a estrutura de páginas do PDF - o texto deve fluir naturalmente

⚠️ NORMALIZAÇÃO DE OCR:
- Texto em CAIXA ALTA por OCR → converta para sentence case (exceto slogans/gritos que devem ficar em maiúsculas como no original)
- Títulos de capítulos → Title Case
- JUNTE linhas curtas quebradas pelo OCR em parágrafos fluidos
- REMOVA números de página soltos
- CORRIJA hifenização: "IN-\\nTERPRETAÇÃO" → "Interpretação"

⚠️ CHECKLIST FINAL — Antes de enviar, confirme que você:
- [ ] Aplicou **negrito** em pelo menos 3-5 termos por página
- [ ] Usou > blockquote para TODA citação, fala entre aspas, ou slogan
- [ ] Separou parágrafos com linhas em branco
- [ ] Usou *itálico* para expressões em outros idiomas e ênfases`;

  let textoFormatado = '';
  const CHUNK_SIZE = 50000;

  if (textoCompleto.length > CHUNK_SIZE) {
    const chunks = dividirEmChunks(textoCompleto, CHUNK_SIZE);
    console.log(`[Formatar] ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const prompt = `${promptBase}\n\nTEXTO PARA FORMATAR (chunk ${i + 1}/${chunks.length}):\n\n${chunks[i]}\n\nTEXTO FORMATADO:`;
      try {
        const resultado = await callGemini(prompt);
        textoFormatado += resultado + '\n\n';
        console.log(`[Formatar] Chunk ${i + 1} processado`);
      } catch (error) {
        console.error(`[Formatar] Erro chunk ${i + 1}:`, error);
        textoFormatado += chunks[i] + '\n\n';
      }
      if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 800));
    }
  } else {
    const prompt = `${promptBase}\n\nTEXTO PARA FORMATAR:\n\n${textoCompleto}\n\nTEXTO FORMATADO:`;
    try {
      textoFormatado = await callGemini(prompt);
    } catch (error) {
      console.error('[Formatar] Erro:', error);
      textoFormatado = textoCompleto;
    }
  }

  textoFormatado = textoFormatado.replace(/TEXTO FORMATADO:/g, '').replace(/^\s*```\s*/gm, '').trim();
  console.log(`[Formatar] Texto formatado: ${textoFormatado.length} chars`);

  // Dividir em páginas
  console.log('[Formatar] Dividindo em páginas...');
  const paginasVirtuais = dividirEmPaginas(textoFormatado, capitulosInfo);
  console.log(`[Formatar] ${paginasVirtuais.length} páginas criadas`);

  // Salvar páginas formatadas
  console.log('[Formatar] Salvando páginas formatadas...');
  await supabase.from('leitura_paginas_formatadas').delete().eq('livro_titulo', tituloLivro);

  const paginasParaInserir = paginasVirtuais.map((pagina, index) => ({
    livro_titulo: tituloLivro,
    numero_pagina: index + 1,
    html_formatado: pagina.conteudo,
    capitulo_titulo: pagina.tituloCapitulo,
    is_chapter_start: pagina.isChapterStart,
    numero_capitulo: pagina.capitulo
  }));

  const BATCH_SIZE = 50;
  for (let i = 0; i < paginasParaInserir.length; i += BATCH_SIZE) {
    const batch = paginasParaInserir.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from('leitura_paginas_formatadas').insert(batch);
    if (insertError) console.error(`Erro batch ${i / BATCH_SIZE + 1}:`, insertError);
  }

  // Salvar índice
  await supabase.from('leitura_livros_indice').delete().eq('livro_titulo', tituloLivro);
  const indiceParaSalvar = capitulosConfirmados.map(cap => ({
    livro_titulo: tituloLivro,
    numero_capitulo: cap.numero,
    titulo_capitulo: cap.titulo,
    analise_concluida: true,
    indice_capitulos: capitulosConfirmados
  }));
  if (indiceParaSalvar.length > 0) {
    await supabase.from('leitura_livros_indice').insert(indiceParaSalvar);
  }

  // Atualizar status
  if (livroId) {
    await supabase.from('BIBLIOTECA-CLASSICOS').update({
      analise_status: 'formatado',
      total_paginas: paginasVirtuais.length,
      total_capitulos: capitulosConfirmados.length,
      capitulos_gerados: capitulosConfirmados.length
    }).eq('id', livroId);
  }

  const capitulosEncontrados = new Set(paginasVirtuais.map(p => p.capitulo)).size;

  return {
    success: true,
    mode: 'formatar',
    livroTitulo: tituloLivro,
    paginasFormatadas: paginasVirtuais.length,
    capitulosEncontrados
  };
}

// ==================== PIPELINE PRINCIPAL ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { mode, livroId, tituloLivro, driveUrl, capitulosConfirmados } = body;

    if (!tituloLivro) {
      return new Response(
        JSON.stringify({ error: 'tituloLivro é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let result;

    if (mode === 'formatar') {
      // Modo 2: Formatar com capítulos confirmados
      if (!capitulosConfirmados || !Array.isArray(capitulosConfirmados) || capitulosConfirmados.length === 0) {
        return new Response(
          JSON.stringify({ error: 'capitulosConfirmados é obrigatório no modo formatar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      result = await modoFormatar(supabase, tituloLivro, livroId, capitulosConfirmados);
    } else {
      // Modo 1 (default): Analisar - OCR + identificar capítulos
      if (!driveUrl) {
        return new Response(
          JSON.stringify({ error: 'driveUrl é obrigatório no modo analisar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      result = await modoAnalisar(supabase, tituloLivro, driveUrl, livroId);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Pipeline] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
