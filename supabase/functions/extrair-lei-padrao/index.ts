import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== HELPERS ====================

function normalizeOrdinal(text: string): string {
  // ° (degree U+00B0) → º (ordinal U+00BA)
  text = text.replace(/°/g, 'º');
  // Letra "o" após dígito → ordinal "º" (7o → 7º, 1o → 1º)
  text = text.replace(/(\d)o(?=[-–—.\s\)\,;:\b])/g, '$1º');
  return text;
}

function sanitizeArticleBody(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/^\s*Art\.?\s*\d+[º°ªo]?(?:-[A-Z])?\s*[-–—.:\s]+/i, '')
    .replace(/\(Vide[^)]*\)/gi, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      if (/^\(?\d{1,2}[./]\d{1,2}[./]\d{2,4}\)?$/.test(l)) return false;
      if (/^(?:\.{2,}\/|https?:\/\/|www\.)/i.test(l)) return false;
      return true;
    })
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizarParentesesAnotacao(text: string): string {
  // Adicionar "(" antes de anotações legislativas que não têm parêntese de abertura
  // Ex: "Revogado pela Lei nº 9.985, de 18.7.2000)" → "(Revogado pela Lei nº 9.985, de 18.7.2000)"
  text = text.replace(
    /(?<!\()(?=(?:Revogado|Revogada|Incluído|Incluída|Redação dada|Acrescido|Acrescida|Suprimido|Suprimida|Vetado|Vetada|Renumerado|Renumerada|Expressão suprimida)\s+pel)/gi,
    '('
  );
  // Fechar parênteses faltantes: "(Revogado pela Lei nº X, de Y" sem ")"
  // Detectar anotação que começa com "(" + keyword mas não tem ")" correspondente na mesma linha
  text = text.replace(
    /(\((?:Revogado|Revogada|Incluído|Incluída|Redação dada|Acrescido|Acrescida|Suprimido|Suprimida|Vetado|Vetada|Renumerado|Renumerada|Expressão suprimida)[^)]*?)(\s*$)/gim,
    '$1)$2'
  );
  return text;
}

function isNewArticleLine(trimmed: string, previousNum: string): { isArticle: boolean; num: string } {
  const artMatch = trimmed.match(/^Art\.?\s*(\d+(?:\.\d+)*[ºª°o]?(?:-[A-Z])?)\s*(?:[-–—.:]|\s|$)/i);
  if (!artMatch) return { isArticle: false, num: '' };

  const num = normalizeOrdinal(artMatch[1]);

  if (previousNum) {
    const prevNumClean = parseInt(previousNum.replace(/[^\d]/g, ''));
    const currNumClean = parseInt(num.replace(/[^\d]/g, ''));

    if (currNumClean < prevNumClean && currNumClean <= 10 && prevNumClean > 20) {
      const afterPrefix = trimmed.replace(/^Art\.?\s*\d+[ºª°o]?(?:-[A-Z])?\s*[-–—.:\s]*/i, '');
      if (/^(?:e\s|ou\s|do\s|da\s|de\s|no\s|na\s|ao\s|à\s|com\s|sem\s|para\s|que\s|este\s)/i.test(afterPrefix)) {
        return { isArticle: false, num: '' };
      }
    }
  }

  return { isArticle: true, num };
}

function getFaixaAtoPorAno(ano: number): string | null {
  if (ano >= 2023) return '_Ato2023-2026';
  if (ano >= 2019) return '_Ato2019-2022';
  if (ano >= 2015) return '_Ato2015-2018';
  if (ano >= 2011) return '_Ato2011-2014';
  if (ano >= 2007) return '_Ato2007-2010';
  if (ano >= 2004) return '_Ato2004-2006';
  return null;
}

function gerarUrlLeiAlteradora(lei: string | null, ano?: number | null): string | null {
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
    if (ano) {
      const faixa = getFaixaAtoPorAno(ano);
      if (faixa) {
        return `https://www.planalto.gov.br/ccivil_03/${faixa}/${ano}/Mpv/mpv${numero}.htm`;
      }
    }
    return `https://www.planalto.gov.br/ccivil_03/_Ato2019-2022/2020/Mpv/mpv${numero}.htm`;
  }
  if (leiLower.includes('lei')) {
    if (ano) {
      const faixa = getFaixaAtoPorAno(ano);
      if (faixa) {
        return `https://www.planalto.gov.br/ccivil_03/${faixa}/${ano}/Lei/L${numero}.htm`;
      }
    }
    const numInt = parseInt(numero, 10);
    if (numInt >= 13000) {
      return `https://www.planalto.gov.br/ccivil_03/_Ato2019-2022/2022/Lei/L${numero}.htm`;
    }
    if (numInt >= 10000) {
      return `https://www.planalto.gov.br/ccivil_03/_Ato2004-2006/2006/Lei/L${numero}.htm`;
    }
    return `https://www.planalto.gov.br/ccivil_03/leis/l${numero}.htm`;
  }
  return null;
}

// ==================== HTML PARSER (DIRETO DO PLANALTO) ====================

interface HtmlBlock {
  text: string;
  rawText: string; // texto original sem remover <strike> (para extrair artigos revogados)
  links: Array<{ text: string; href: string }>;
  isStrikethrough: boolean;
  hasStrikeArticle: boolean; // bloco contém artigo dentro de <strike> (parcialmente revogado)
  strikeArticleNum: string; // número do artigo dentro do <strike>
  isBoldOnly: boolean; // bloco inteiramente em <b> (rubrica temática)
}

function decodeHtml(buffer: ArrayBuffer): string {
  // Tentar UTF-8 primeiro
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(buffer);
  } catch {
    // Fallback para Windows-1252 (comum em leis antigas do Planalto)
    const decoder = new TextDecoder('windows-1252');
    return decoder.decode(buffer);
  }
}

function htmlEntityDecode(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ordm;/g, 'º')
    .replace(/&ordf;/g, 'ª')
    .replace(/&sect;/g, '§')
    .replace(/&deg;/g, '°')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function extractBlocksFromHtml(html: string): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];

  // Remove <head>, <script>, <style>
  let clean = html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Extrair blocos de <p>, <h1>-<h6>, <center>, <blockquote>
  const blockRegex = /<(p|h[1-6]|center|blockquote)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(clean)) !== null) {
    const blockHtml = match[0];

    // Verificar se o bloco inteiro está dentro de <strike>/<s>/<del>
    const hasStrike = /<(strike|s|del)\b[^>]*>[\s\S]*<\/\1>/i.test(blockHtml);
    const isStrikethrough = hasStrike &&
      !/<\/(strike|s|del)>[\s\S]*?[A-Za-zÀ-ú]/i.test(blockHtml);

    // Detectar artigo dentro de <strike> (bloco parcialmente revogado)
    let hasStrikeArticle = false;
    let strikeArticleNum = '';
    if (hasStrike && !isStrikethrough) {
      // Extrair conteúdo do <strike> para verificar se contém artigo
      const strikeContentMatch = blockHtml.match(/<(strike|s|del)\b[^>]*>([\s\S]*?)<\/\1>/i);
      if (strikeContentMatch) {
        const strikeText = strikeContentMatch[2].replace(/<[^>]+>/g, '').trim();
        const strikeNorm = normalizeOrdinal(strikeText);
        const artMatch = strikeNorm.match(/^Art\.?\s*(\d+(?:\.\d+)*[ºª°o]?(?:-[A-Z])?)/i);
        if (artMatch) {
          hasStrikeArticle = true;
          strikeArticleNum = normalizeOrdinal(artMatch[1]);
        }
      }
    }

    // Extrair links <a href="...">texto</a>
    const links: Array<{ text: string; href: string }> = [];
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = linkRegex.exec(blockHtml)) !== null) {
      const href = htmlEntityDecode(linkMatch[1]);
      const linkText = linkMatch[2].replace(/<[^>]+>/g, '').trim();
      if (href && linkText) {
        links.push({ text: linkText, href });
      }
    }

    // Extrair texto RAW (sem remover strike) para uso em blocos revogados
    let rawTextHtml = blockHtml
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\r/g, '');
    rawTextHtml = htmlEntityDecode(rawTextHtml);
    rawTextHtml = normalizeOrdinal(rawTextHtml);
    const rawText = rawTextHtml.split('\n').map(l => l.trim()).filter(l => l).join('\n').trim();

    // Remover conteúdo dentro de <strike>, <s>, <del> (textos revogados)
    let textHtml = blockHtml
      .replace(/<(strike|s|del)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\r/g, '');

    textHtml = htmlEntityDecode(textHtml);
    textHtml = normalizeOrdinal(textHtml);

    // Limpar espaços e juntar incisos isolados
    let cleaned = textHtml
      .split('\n')
      .map(l => l.trim())
      .filter(l => l)
      .join('\n')
      .trim();

    // Juntar "Art.\n1º" → "Art. 1º" (comum em leis antigas do Planalto onde Art. e número estão em linhas separadas)
    cleaned = cleaned.replace(/\bArt\.?\s*\n\s*(\d+[ºª°o]?(?:-[A-Z])?)/gi, 'Art. $1');

    // Juntar inciso romano isolado com próxima linha: "I\n- texto" → "I - texto"
    cleaned = cleaned.replace(/\n([IVXLCDM]+)\s*\n\s*[-–—]\s*/g, '\n$1 - ');
    // Também juntar quando inciso está no final de uma linha e traço na próxima
    cleaned = cleaned.replace(/\n([IVXLCDM]+)\s*\n/g, (match, roman) => {
      if (/^[IVXLCDM]+$/.test(roman) && roman.length <= 5) {
        return `\n${roman} `;
      }
      return match;
    });
    // Deduplicar traços: "I - - texto" → "I - texto"
    cleaned = cleaned.replace(/([IVXLCDM]+)\s*[-–—]\s*[-–—]\s*/g, '$1 - ');

    const text = cleaned;

    // Detectar se o bloco é inteiramente bold (rubrica temática)
    // Ex: <p><font><b>Fontes de Direito Judiciário Militar</b></font></p>
    // Ou: <p><font>&nbsp;&nbsp;<b>Divergência de normas</b></font></p>
    let isBoldOnly = false;
    if (text && text.length < 120 && !text.match(/^Art\.?\s/i)) {
      // Remover tags container, font, br e &nbsp;
      const stripped = blockHtml
        .replace(/<\/?(p|center|blockquote|h[1-6]|font)\b[^>]*>/gi, '')
        .replace(/<br\s*\/?>/gi, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      // Texto fora de <b>: remover blocos <b>...</b> e tags restantes
      const textOutsideBold = stripped
        .replace(/<b\b[^>]*>[\s\S]*?<\/b>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (textOutsideBold === '' && /<b\b[^>]*>/i.test(stripped)) {
        isBoldOnly = true;
      }
    }

    if (text || rawText) {
      blocks.push({ text, rawText, links, isStrikethrough, hasStrikeArticle, strikeArticleNum, isBoldOnly });
    }
  }

  return blocks;
}

// ==================== PARSER DE ARTIGOS ====================

interface Registro {
  "Número do Artigo": string;
  "Artigo": string;
  ordem_artigo: number;
}

function parseArtigosFromBlocks(blocks: HtmlBlock[]): { registros: Registro[]; urlMap: Map<string, string> } {
  const registros: Registro[] = [];
  const urlMap = new Map<string, string>();

  let currentArticleNum = '';
  let currentArticleLines: string[] = [];
  let lastArticleNum = '';
  let lastHeaderIndex = -1;
  let foundFirstStructure = false;
  let pendingRevogadoAnnotation = ''; // anotação de revogação que aparece após <strike>
  let pendingRubric = ''; // rubrica temática em bold para prepend no próximo artigo

  const headerPattern = /^(TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO|LIVRO|PARTE|DISPOSIÇÃO|DISPOSIÇÕES)\s/i;

  function flushArticle() {
    if (currentArticleNum && currentArticleLines.length > 0) {
      let fullText = currentArticleLines.join('\n');
      // Juntar "§\n1º" → "§ 1º" (parágrafo isolado do número)
      fullText = fullText.replace(/§\s*\n\s*(\d+[ºo°]?)/g, '§ $1');
      fullText = fullText.replace(/§\s*\n\s*(único)/gi, '§ $1');
      // Juntar inciso romano isolado com próxima linha
      fullText = fullText.replace(/\n([IVXLCDM]+)\n[-–—]\s*/g, '\n$1 - ');
      fullText = fullText.replace(/\n([IVXLCDM]+)\s*\n\s*[-–—]\s*/g, '\n$1 - ');
      // Inciso romano sozinho seguido de texto sem traço
      fullText = fullText.replace(/\n([IVXLCDM]{1,5})\n(?=[a-záéíóúâêîôûãõ])/g, '\n$1 - ');
      // Deduplicar traços
      fullText = fullText.replace(/([IVXLCDM]+)\s*[-–—]\s*[-–—]\s*/g, '$1 - ');

      const sanitized = sanitizeArticleBody(fullText);
      if (sanitized) {
        registros.push({
          "Número do Artigo": currentArticleNum,
          "Artigo": sanitized,
          ordem_artigo: 0,
        });
      }
    }
    currentArticleNum = '';
    currentArticleLines = [];
  }

  for (const block of blocks) {
    // Blocos inteiramente revogados: extrair artigos marcados como "(Revogado)"
    if (block.isStrikethrough) {
      const text = block.rawText || block.text;
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Cabeçalhos estruturais dentro de revogados
        if (headerPattern.test(trimmed)) {
          flushArticle();
          foundFirstStructure = true;
          lastHeaderIndex = registros.length;
          registros.push({
            "Número do Artigo": trimmed.substring(0, 80),
            "Artigo": trimmed + '\n(Revogado)',
            ordem_artigo: 0,
          });
          continue;
        }

        const { isArticle, num } = isNewArticleLine(trimmed, lastArticleNum);
        if (isArticle) {
          flushArticle();
          foundFirstStructure = true;
          currentArticleNum = num;
          currentArticleLines = ['(Revogado)'];
          lastArticleNum = num;
        }
      }
      continue;
    }

    // Blocos parcialmente revogados: <strike>Art. X...</strike> (Revogado pela Lei...)
    if (block.hasStrikeArticle && block.strikeArticleNum) {
      flushArticle();
      foundFirstStructure = true;
      currentArticleNum = block.strikeArticleNum;
      // O texto visível (fora do <strike>) contém a anotação "(Revogado pela Lei...)"
      const annotation = block.text.trim();
      currentArticleLines = [annotation || '(Revogado)'];
      lastArticleNum = block.strikeArticleNum;

      // Capturar URLs dos links do bloco
      for (const link of block.links) {
        if (link.href.includes('planalto.gov.br')) {
          const leiMatch = link.text.match(/(?:Lei|Decreto(?:-Lei)?|Medida Provisória|Medida Provisoria|Emenda Constitucional|Lei Complementar)\s+n[ºo°]?\s*[\d.]+(?:\s*,?\s*de\s*[\d.]+)?/i);
          if (leiMatch) {
            const key = normalizarLeiChave(leiMatch[0]);
            if (key && !urlMap.has(key)) {
              urlMap.set(key, link.href);
            }
          }
        }
      }
      continue;
    }

    // Blocos bold-only: rubricas temáticas (ex: "Fontes de Direito Judiciário Militar")
    if (block.isBoldOnly && block.text.trim()) {
      const rubricText = block.text.trim();
      // Não tratar como rubrica se parece com cabeçalho estrutural
      if (!headerPattern.test(rubricText)) {
        // Guardar como pendingRubric - será resolvido no próximo bloco:
        // Se próximo bloco for novo artigo → prepend ao artigo
        // Se for continuação (§, inciso) → adicionar ao artigo atual com espaçamento
        pendingRubric = rubricText;
        continue;
      }
    }

    let text = block.text;

    // Capturar URLs de leis alteradoras dos links do bloco
    // E normalizar texto de links que são anotações legislativas sem parênteses
    for (const link of block.links) {
      if (link.href.includes('planalto.gov.br')) {
        const leiMatch = link.text.match(/(?:Lei|Decreto(?:-Lei)?|Medida Provisória|Medida Provisoria|Emenda Constitucional|Lei Complementar)\s+n[ºo°]?\s*[\d.]+(?:\s*,?\s*de\s*[\d.]+)?/i);
        if (leiMatch) {
          const key = normalizarLeiChave(leiMatch[0]);
          if (key && !urlMap.has(key)) {
            urlMap.set(key, link.href);
          }
        }
      }
      // Se o texto do link é uma anotação legislativa, garantir que está com parênteses no texto do bloco
      const anotKeywords = /^(Revogado|Revogada|Incluído|Incluída|Redação dada|Acrescido|Acrescida|Suprimido|Suprimida|Vetado|Vetada|Renumerado|Renumerada)\s+pel/i;
      if (anotKeywords.test(link.text.trim())) {
        // Normalizar o texto do link no corpo do bloco
        text = normalizarParentesesAnotacao(text);
      }
    }

    // Processar linhas do bloco
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

    // Cabeçalhos estruturais
      if (headerPattern.test(trimmed)) {
        flushArticle();
        foundFirstStructure = true;
        lastHeaderIndex = registros.length;
        registros.push({
          "Número do Artigo": trimmed.substring(0, 80),
          "Artigo": trimmed,
          ordem_artigo: 0,
        });
        continue;
      }

      // Subtítulo de cabeçalho (linha logo após CAPÍTULO/TÍTULO que não é artigo nem outro cabeçalho)
      if (lastHeaderIndex >= 0 && !currentArticleNum) {
        const { isArticle: isArt } = isNewArticleLine(trimmed, lastArticleNum);
        if (!isArt && !headerPattern.test(trimmed) && trimmed.length < 120) {
          const header = registros[lastHeaderIndex];
          header["Artigo"] = header["Artigo"] + '\n' + trimmed;
          lastHeaderIndex = -1;
          continue;
        }
        lastHeaderIndex = -1;
      }

      // Novo artigo?
      const { isArticle, num } = isNewArticleLine(trimmed, lastArticleNum);
      if (isArticle) {
        // Proteção contra preâmbulo: antes de encontrar a primeira estrutura,
        // só aceitar Art. 1º (ignora referências como "art. 9º do Ato Institucional")
        if (!foundFirstStructure) {
          const numClean = parseInt(num.replace(/[^\d]/g, ''));
          if (numClean !== 1) {
            continue; // referência no preâmbulo, ignorar
          }
          foundFirstStructure = true;
        }
        flushArticle();
        currentArticleNum = num;
        // Prepend rubrica temática pendente ao corpo do artigo
        if (pendingRubric) {
          currentArticleLines = [pendingRubric, '', trimmed];
          pendingRubric = '';
        } else {
          currentArticleLines = [trimmed];
        }
        lastArticleNum = num;
        continue;
      }

      // Continuar artigo atual
      if (currentArticleNum) {
        // Se há rubrica pendente, inserir com espaçamento antes da linha atual
        if (pendingRubric) {
          currentArticleLines.push('');
          currentArticleLines.push(pendingRubric);
          currentArticleLines.push('');
          pendingRubric = '';
        }
        currentArticleLines.push(trimmed);
      }
    }
  }

  flushArticle();

  // Atribuir ordem
  for (let i = 0; i < registros.length; i++) {
    registros[i].ordem_artigo = i + 1;
  }

  return { registros, urlMap };
}

// ==================== FALLBACK: PARSER DO MARKDOWN (FIRECRAWL) ====================

function limparMarkdown(markdown: string): string {
  let text = markdown;

  text = text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1 (Revogado)')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\\\n/g, ' ')
    .replace(/\\([.()\[\]\-])/g, '$1')
    .replace(/_([^_]+)_/g, '$1');

  text = text.replace(/\n([IVXLCDM]+)\s*\n\s*[-–—]\s*/g, '\n$1 - ');
  text = text.replace(/([IVXLCDM]+)\s*[-–—]\s*[-–—]\s*/g, '$1 - ');

  text = text.replace(/\bArt\.\s*\n\s*(\d+)/gi, 'Art. $1');
  text = text.replace(/\n\s*§\s*\n\s*(\d+[ºo°]?|único)\b/gi, '\n§ $1');
  text = text.replace(/(^|\n)\s*§\s*\n/gm, '$1');
  text = text.replace(/(\bArt\.\s*\d+[ºª°.]?(?:-[A-Z])?)\s*\n\s*(?=[A-ZÁÉÍÓÚÂÊÎÔÛÃÕa-záéíóúâêîôûãõ])/gi, '$1 ');
  text = text.replace(/([^\n])\s+(Art\.\s*\d+)/g, '$1\n$2');

  const firstArt = text.search(/\bArt\.?\s*\d+[ºª°]?\s/i);
  if (firstArt > 0) {
    const before = text.substring(0, firstArt);
    const lastHeader = before.lastIndexOf('\n\n');
    const keepFrom = lastHeader > 0 ? lastHeader : firstArt;
    text = text.substring(keepFrom);
  }

  text = normalizeOrdinal(text);

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function parseArtigosFromMarkdown(markdown: string): { registros: Registro[]; urlMap: Map<string, string> } {
  const urlMap = extrairUrlsLeisAlteradoras(markdown);
  const textForArticles = limparMarkdown(markdown);
  const registros: Registro[] = [];
  const lines = textForArticles.split('\n');
  let currentArticleNum = '';
  let currentArticleText = '';
  let lastArticleNum = '';
  let lastHeaderIndex = -1;

  const headerPattern = /^(TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO|LIVRO|PARTE|DISPOSIÇÃO|DISPOSIÇÕES)\s/i;

  function flushArticle() {
    if (currentArticleNum && currentArticleText.trim()) {
      const sanitized = sanitizeArticleBody(currentArticleText);
      if (sanitized) {
        registros.push({
          "Número do Artigo": currentArticleNum,
          "Artigo": sanitized,
          ordem_artigo: 0,
        });
      }
    }
    currentArticleNum = '';
    currentArticleText = '';
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (headerPattern.test(trimmed)) {
      flushArticle();
      lastHeaderIndex = registros.length;
      registros.push({
        "Número do Artigo": trimmed.substring(0, 80),
        "Artigo": trimmed,
        ordem_artigo: 0,
      });
      continue;
    }

    // Subtítulo de cabeçalho (linha logo após CAPÍTULO/TÍTULO que não é artigo nem outro cabeçalho)
    if (lastHeaderIndex >= 0 && !currentArticleNum) {
      const { isArticle: isArt } = isNewArticleLine(trimmed, lastArticleNum);
      if (!isArt && !headerPattern.test(trimmed) && trimmed.length < 120) {
        const header = registros[lastHeaderIndex];
        header["Artigo"] = header["Artigo"] + '\n' + trimmed;
        lastHeaderIndex = -1;
        continue;
      }
      lastHeaderIndex = -1;
    }

    const { isArticle, num } = isNewArticleLine(trimmed, lastArticleNum);
    if (isArticle) {
      flushArticle();
      currentArticleNum = num;
      currentArticleText = trimmed;
      lastArticleNum = num;
      continue;
    }

    if (currentArticleNum) {
      currentArticleText += '\n' + trimmed;
    }
  }

  flushArticle();

  for (let i = 0; i < registros.length; i++) {
    registros[i].ordem_artigo = i + 1;
  }

  return { registros, urlMap };
}

// ==================== PARSER DE NOVIDADES ====================

function normalizarLeiChave(texto: string | null): string {
  return (texto || '')
    .replace(/\r/g, '')
    .replace(/\n/g, ' ')
    .replace(/\\\s+/g, ' ')
    .replace(/\\([.()\[\]\-])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°]/g, 'o')
    .toLowerCase();
}

function extrairUrlsLeisAlteradoras(markdownRaw: string): Map<string, string> {
  const urlMap = new Map<string, string>();
  const textoNormalizado = markdownRaw
    .replace(/\r/g, '')
    .replace(/\n/g, ' ')
    .replace(/\\([\[\]()])/g, '$1')
    .replace(/\s{2,}/g, ' ');

  const regex = /\[((?:Lei|Decreto(?:-Lei)?|Medida Provisória|Medida Provisoria|Emenda Constitucional|Lei Complementar)\s+n[ºo°]?\s*[\d.]+(?:\s*,?\s*de\s*[\d.]+)?)\]\((https?:\/\/[^)\s]*planalto[^)\s]*)\)/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(textoNormalizado)) !== null) {
    const leiKey = normalizarLeiChave(match[1]);
    const url = match[2].replace(/\\\)/g, ')');
    if (leiKey && !urlMap.has(leiKey)) {
      urlMap.set(leiKey, url);
    }
  }

  return urlMap;
}

interface Alteracao {
  tabela_lei: string;
  numero_artigo: string;
  elemento_tipo: string;
  elemento_numero: string | null;
  tipo_alteracao: string;
  lei_alteradora: string | null;
  ano_alteracao: number | null;
  texto_completo: string;
  url_lei_alteradora: string | null;
}

function extrairAlteracoes(texto: string, tabelaLei: string, urlLeiMap: Map<string, string>): Alteracao[] {
  const alteracoes: Alteracao[] = [];
  const padraoAnotacao = /\((?:Redação dada|Incluíd[oa]|Revogad[oa]|Acrescid[oa]|Suprimid[oa]|Vetad[oa]|Vide|Vigência|Renumerad[oa]|Expressão suprimida)[^)]+\)/gi;

  const textoNormalizado = texto.replace(
    /\((?=(?:Redação dada|Incluíd[oa]|Revogad[oa]|Acrescid[oa]|Suprimid[oa]|Vetad[oa]|Vide|Vigência|Renumerad[oa]|Expressão suprimida))([\s\S]*?)\)/gi,
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
      for (const anotacaoBruta of anotacoes) {
        const anotacao = anotacaoBruta
          .replace(/\\\s+/g, ' ')
          .replace(/\\([.()\[\]\-])/g, '$1')
          .replace(/\s{2,}/g, ' ')
          .trim();

        let tipoAlteracao = 'Outro';
        if (/Redação dada/i.test(anotacao)) tipoAlteracao = 'Redação';
        else if (/Incluíd[oa]/i.test(anotacao)) tipoAlteracao = 'Inclusão';
        else if (/Revogad[oa]/i.test(anotacao)) tipoAlteracao = 'Revogação';
        else if (/Acrescid[oa]/i.test(anotacao)) tipoAlteracao = 'Acréscimo';
        else if (/Suprimid[oa]/i.test(anotacao)) tipoAlteracao = 'Supressão';
        else if (/Vetad[oa]/i.test(anotacao)) tipoAlteracao = 'Vetado';
        else if (/Vide/i.test(anotacao)) tipoAlteracao = 'Vide';
        else if (/Vigência/i.test(anotacao)) tipoAlteracao = 'Vigência';
        else if (/Renumerad[oa]/i.test(anotacao)) tipoAlteracao = 'Renumeração';
        else if (/Expressão suprimida/i.test(anotacao)) tipoAlteracao = 'Supressão';

        const matchLei = anotacao.match(/(?:Lei|Decreto(?:-Lei)?|Medida Provisória|Emenda Constitucional|Lei Complementar)\s+n[ºo°]?\s*[\d.]+(?:[,\s]+de\s+[\d.]+)?/i);
        const leiAlteradora = matchLei ? matchLei[0] : null;
        const urlReal = leiAlteradora ? (urlLeiMap.get(normalizarLeiChave(leiAlteradora)) || null) : null;

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
          tabela_lei: tabelaLei,
          numero_artigo: artigoAtual,
          elemento_tipo: elementoTipo,
          elemento_numero: elementoNumero,
          tipo_alteracao: tipoAlteracao,
          lei_alteradora: leiAlteradora,
          ano_alteracao: anoAlteracao,
          texto_completo: anotacao,
          url_lei_alteradora: urlReal || gerarUrlLeiAlteradora(leiAlteradora, anoAlteracao),
        });
      }
    }
  }

  return alteracoes;
}

// ==================== FETCH HTML DIRETO DO PLANALTO ====================

async function fetchHtmlDireto(url: string): Promise<string | null> {
  try {
    console.log('[extrair-lei-padrao] Tentando fetch HTML direto...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });

    if (!response.ok) {
      console.warn(`[extrair-lei-padrao] HTTP ${response.status} no fetch direto`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const html = decodeHtml(buffer);

    // Normalizar encoding
    const normalized = html.normalize('NFC').replace(/\uFFFD/g, '');

    if (normalized.length < 500) {
      console.warn('[extrair-lei-padrao] HTML muito curto, descartando');
      return null;
    }

    console.log(`[extrair-lei-padrao] HTML recebido: ${normalized.length} chars`);
    return normalized;
  } catch (err) {
    console.warn('[extrair-lei-padrao] Erro no fetch direto:', err);
    return null;
  }
}

// ==================== FETCH VIA FIRECRAWL (FALLBACK) ====================

async function fetchViaFirecrawl(url: string): Promise<string | null> {
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlApiKey) {
    console.warn('[extrair-lei-padrao] FIRECRAWL_API_KEY não configurada');
    return null;
  }

  console.log('[extrair-lei-padrao] Fallback: chamando Firecrawl API...');

  const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: false,
      waitFor: 3000,
    }),
  });

  if (!scrapeResponse.ok) {
    const errData = await scrapeResponse.text();
    console.error(`[extrair-lei-padrao] Firecrawl erro HTTP ${scrapeResponse.status}: ${errData}`);
    return null;
  }

  const scrapeData = await scrapeResponse.json();
  const markdown = scrapeData?.data?.markdown || scrapeData?.markdown;

  if (!markdown || markdown.length < 500) {
    console.warn(`[extrair-lei-padrao] Firecrawl conteúdo insuficiente (${markdown?.length || 0} chars)`);
    return null;
  }

  console.log(`[extrair-lei-padrao] Markdown Firecrawl: ${markdown.length} chars`);
  return markdown;
}

// ==================== MAIN HANDLER ====================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, urlPlanalto } = await req.json();

    if (!tableName || !urlPlanalto) {
      return new Response(
        JSON.stringify({ error: 'tableName e urlPlanalto são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[extrair-lei-padrao] Iniciando extração: ${tableName}`);
    console.log(`[extrair-lei-padrao] URL: ${urlPlanalto}`);

    // ========== 1. BUSCAR CONTEÚDO (HTML direto → Firecrawl fallback) ==========
    let registros: Registro[] = [];
    let urlMap = new Map<string, string>();
    let metodo = '';

    // Método primário: HTML direto do Planalto
    const html = await fetchHtmlDireto(urlPlanalto);
    if (html) {
      const blocks = extractBlocksFromHtml(html);
      console.log(`[extrair-lei-padrao] Blocos HTML extraídos: ${blocks.length}`);

      if (blocks.length > 10) {
        const result = parseArtigosFromBlocks(blocks);
        registros = result.registros;
        urlMap = result.urlMap;
        metodo = 'HTML direto';
        console.log(`[extrair-lei-padrao] Artigos via HTML direto: ${registros.length}, URLs: ${urlMap.size}`);
      }
    }

    // Fallback: Firecrawl
    if (registros.length < 10) {
      console.log('[extrair-lei-padrao] HTML direto insuficiente, tentando Firecrawl...');
      const markdown = await fetchViaFirecrawl(urlPlanalto);
      if (markdown) {
        const result = parseArtigosFromMarkdown(markdown);
        registros = result.registros;
        urlMap = result.urlMap;
        metodo = 'Firecrawl (fallback)';
        console.log(`[extrair-lei-padrao] Artigos via Firecrawl: ${registros.length}`);
      }
    }

    if (registros.length < 10) {
      throw new Error(`Poucos artigos extraídos (${registros.length}). Nenhum método funcionou.`);
    }

    // ========== PÓS-PROCESSAMENTO: Fundir registros órfãos ==========
    // Registros cujo "Número do Artigo" não começa com dígito e não é cabeçalho estrutural
    // são fragmentos que devem ser concatenados ao registro anterior
    const headerPatternMain = /^(TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO|LIVRO|PARTE|DISPOSIÇÃO|DISPOSIÇÕES)\s/;
    let orphansMerged = 0;
    for (let i = 1; i < registros.length; i++) {
      const num = registros[i]["Número do Artigo"];
      const startsWithDigit = /^\d/.test(num);
      const isHeader = headerPatternMain.test(num);
      
      if (!startsWithDigit && !isHeader) {
        // Encontrar registro anterior válido para fundir
        let targetIdx = i - 1;
        while (targetIdx >= 0 && !(/^\d/.test(registros[targetIdx]["Número do Artigo"]) || headerPatternMain.test(registros[targetIdx]["Número do Artigo"]))) {
          targetIdx--;
        }
        if (targetIdx >= 0) {
          registros[targetIdx]["Artigo"] += '\n' + registros[i]["Artigo"];
          registros.splice(i, 1);
          i--;
          orphansMerged++;
        }
      }
    }
    if (orphansMerged > 0) {
      console.log(`[extrair-lei-padrao] Registros órfãos fundidos: ${orphansMerged}`);
      // Recalcular ordem_artigo
      for (let i = 0; i < registros.length; i++) {
        registros[i].ordem_artigo = i + 1;
      }
    }

    // Log dos primeiros registros
    const first10 = registros.slice(0, 15).map(r => `${r.ordem_artigo}: [${r["Número do Artigo"]}] ${r.Artigo.substring(0, 60)}`);
    console.log(`[extrair-lei-padrao] [${metodo}] Primeiros registros:\n${first10.join('\n')}`);

    // Deduplicar artigos: para artigos com mesmo número, manter o que aparece DEPOIS
    // do primeiro cabeçalho estrutural (corpo da lei), removendo os do preâmbulo/decreto
    const numCounts = new Map<string, number>();
    for (const r of registros) {
      if (/^\d/.test(r["Número do Artigo"])) {
        numCounts.set(r["Número do Artigo"], (numCounts.get(r["Número do Artigo"]) || 0) + 1);
      }
    }
    const duplicates = Array.from(numCounts.entries()).filter(([_, c]) => c > 1);
    if (duplicates.length > 0) {
      console.warn(`[extrair-lei-padrao] Duplicatas encontradas: ${duplicates.map(([n, c]) => `${n}(${c}x)`).join(', ')}`);
      
      // Encontrar índice do primeiro cabeçalho estrutural (TÍTULO, LIVRO, PARTE, etc.)
      const firstHeaderIdx = registros.findIndex(r => 
        /^(TÍTULO|LIVRO|PARTE|DISPOSIÇÃO|DISPOSIÇÕES)\s/i.test(r["Número do Artigo"])
      );
      
      if (firstHeaderIdx > 0) {
        // Remover artigos duplicados que aparecem ANTES do primeiro cabeçalho
        const dupNums = new Set(duplicates.map(([n]) => n));
        const preambuloDups: number[] = [];
        
        for (let i = 0; i < firstHeaderIdx; i++) {
          if (dupNums.has(registros[i]["Número do Artigo"])) {
            preambuloDups.push(i);
          }
        }
        
        if (preambuloDups.length > 0) {
          console.log(`[extrair-lei-padrao] Removendo ${preambuloDups.length} artigos do preâmbulo/decreto: ${preambuloDups.map(i => registros[i]["Número do Artigo"]).join(', ')}`);
          registros = registros.filter((_, i) => !preambuloDups.includes(i));
        }
      }
      
      // Deduplicar restantes: para mesmo número, manter o PRIMEIRO que aparece
      // após o cabeçalho estrutural (é o artigo real do corpo da lei)
      // Artigos que aparecem no final geralmente são fragmentos mal parseados
      const seen = new Map<string, number>();
      const toRemove = new Set<number>();
      for (let i = 0; i < registros.length; i++) {
        const num = registros[i]["Número do Artigo"];
        if (/^\d/.test(num)) {
          if (seen.has(num)) {
            // Já temos este artigo — remover o duplicado (este)
            toRemove.add(i);
            console.log(`[extrair-lei-padrao] Duplicata ignorada: Art. ${num} (idx ${i}), mantendo idx ${seen.get(num)}`);
          } else {
            seen.set(num, i);
          }
        }
      }
      if (toRemove.size > 0) {
        console.log(`[extrair-lei-padrao] Deduplicando ${toRemove.size} registros restantes`);
        registros = registros.filter((_, i) => !toRemove.has(i));
      }
    }

    // ========== 2. EXTRAIR NOVIDADES ==========
    console.log('[extrair-lei-padrao] Extraindo novidades legislativas...');
    // Reconstruir texto plano para extração de alterações
    const textoPlano = registros.map(r => {
      if (/^\d/.test(r["Número do Artigo"])) {
        return `Art. ${r["Número do Artigo"]} ${r.Artigo}`;
      }
      return r.Artigo;
    }).join('\n');

    // Juntar anotações legislativas que foram quebradas entre blocos HTML
    // Ex: "(Incluído pela\nLei nº 14.595, de 2023)" ou "(Redação dada pela\nLei nº 12.727, de 2012)"
    // Detecta "(" + keyword + "pela" sem ")" na mesma linha e junta com as próximas linhas até encontrar ")"
    let textoJuntado = textoPlano.replace(
      /\((?:Redação dada|Incluíd[oa]|Revogad[oa]|Acrescid[oa]|Suprimid[oa]|Vetad[oa]|Renumerad[oa]|Expressão suprimida)[^)]*$/gim,
      (match, offset) => {
        // Buscar o ")" nas próximas linhas do textoPlano
        const rest = textoPlano.substring(offset + match.length);
        const closeIdx = rest.indexOf(')');
        if (closeIdx !== -1 && closeIdx < 300) {
          const continuation = rest.substring(0, closeIdx + 1).replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
          return match.replace(/\n/g, ' ') + continuation;
        }
        return match;
      }
    );
    // Limpar possíveis duplicações do trecho já colado
    textoJuntado = textoJuntado.replace(
      /(\((?:Redação dada|Incluíd[oa]|Revogad[oa]|Acrescid[oa]|Suprimid[oa]|Vetad[oa]|Renumerad[oa]|Expressão suprimida)[^)]*\))\s*\n[^A]*?\1/gi,
      '$1'
    );

    const textoNormParenteses = normalizarParentesesAnotacao(textoJuntado);
    const alteracoes = extrairAlteracoes(textoNormParenteses, tableName, urlMap);
    console.log(`[extrair-lei-padrao] Novidades encontradas: ${alteracoes.length}, URLs mapeadas: ${urlMap.size}`);

    // ========== 3. SALVAR NO BANCO ==========
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3a. Limpar e inserir artigos
    console.log('[extrair-lei-padrao] Deletando registros existentes...');
    const { error: deleteError } = await supabase.from(tableName).delete().gte('id', 0);
    if (deleteError) {
      throw new Error(`Erro ao limpar tabela ${tableName}: ${deleteError.message}`);
    }

    const batchSize = 50;
    let totalInseridos = 0;

    // Detectar se a coluna id aceita valores explícitos
    // Tentar primeiro com id, se falhar, inserir sem id
    let useExplicitId = true;

    for (let i = 0; i < registros.length; i += batchSize) {
      const batch = registros.slice(i, i + batchSize).map((r, idx) => {
        const record: Record<string, any> = {
          "Número do Artigo": r["Número do Artigo"],
          "Artigo": r["Artigo"],
          ordem_artigo: r.ordem_artigo,
          ultima_atualizacao: new Date().toISOString(),
          versao_conteudo: 1,
        };
        if (useExplicitId) {
          record.id = i + idx + 1;
        }
        return record;
      });

      const { error: insertError } = await supabase.from(tableName).insert(batch);
      if (insertError) {
        // Se falhar por id GENERATED ALWAYS, retry sem id
        if (i === 0 && insertError.message.includes('non-DEFAULT') && useExplicitId) {
          console.log('[extrair-lei-padrao] Tabela com id GENERATED ALWAYS, inserindo sem id...');
          useExplicitId = false;
          const batchNoId = batch.map(({ id, ...rest }) => rest);
          const { error: retryError } = await supabase.from(tableName).insert(batchNoId);
          if (retryError) {
            throw new Error(`Erro ao inserir lote artigos: ${retryError.message}`);
          }
          totalInseridos += batchNoId.length;
          continue;
        }
        throw new Error(`Erro ao inserir lote artigos: ${insertError.message}`);
      }
      totalInseridos += batch.length;
    }

    console.log(`[extrair-lei-padrao] ${totalInseridos} artigos inseridos.`);

    // 3b. Limpar e inserir novidades (SEMPRE limpar dados antigos, mesmo se não houver novas)
    let totalNovidades = 0;
    await supabase.from('historico_alteracoes').delete().eq('tabela_lei', tableName);
    
    if (alteracoes.length > 0) {
      await supabase.from('historico_alteracoes').delete().eq('tabela_lei', tableName);

      const uniqueMap = new Map<string, Alteracao>();
      for (const alt of alteracoes) {
        const key = `${alt.numero_artigo}|${alt.texto_completo}`;
        uniqueMap.set(key, alt);
      }
      const uniqueAlteracoes = Array.from(uniqueMap.values());

      for (let i = 0; i < uniqueAlteracoes.length; i += batchSize) {
        const batch = uniqueAlteracoes.slice(i, i + batchSize);
        const { error: insErr } = await supabase
          .from('historico_alteracoes')
          .upsert(batch, { onConflict: 'tabela_lei,numero_artigo,texto_completo', ignoreDuplicates: true });

        if (insErr) {
          console.error(`[extrair-lei-padrao] Erro ao inserir novidades:`, insErr);
        } else {
          totalNovidades += batch.length;
        }
      }
      console.log(`[extrair-lei-padrao] ${totalNovidades} novidades inseridas.`);
    }

    // ========== 4. ESTATÍSTICAS ==========
    const totalArtigos = registros.filter((r) => /^\d/.test(r["Número do Artigo"])).length;
    const totalCabecalhos = registros.length - totalArtigos;

    const porTipo: Record<string, number> = {};
    for (const alt of alteracoes) {
      porTipo[alt.tipo_alteracao] = (porTipo[alt.tipo_alteracao] || 0) + 1;
    }

    const porElemento: Record<string, number> = {};
    for (const alt of alteracoes) {
      porElemento[alt.elemento_tipo] = (porElemento[alt.elemento_tipo] || 0) + 1;
    }

    const result = {
      success: true,
      tableName,
      metodo,
      totalRegistros: registros.length,
      totalArtigos,
      totalCabecalhos,
      totalNovidades,
      urlsMapeadas: urlMap.size,
      duplicatasDetectadas: duplicates.length,
      porTipo,
      porElemento,
      mensagem: `${tableName} extraída via ${metodo}: ${totalArtigos} artigos + ${totalCabecalhos} cabeçalhos + ${totalNovidades} novidades`,
    };

    console.log(`[extrair-lei-padrao] Concluído!`, JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[extrair-lei-padrao] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
