// Converte texto em CAIXA ALTA para capitalização adequada
const toTitleCase = (text: string): string => {
  // Palavras que devem ficar em minúscula (exceto quando são a primeira palavra)
  const lowercaseWords = new Set([
    'a', 'ao', 'aos', 'as', 'à', 'às',
    'da', 'das', 'de', 'do', 'dos',
    'e', 'em', 'na', 'nas', 'no', 'nos',
    'o', 'os', 'ou', 'para', 'pela', 'pelas',
    'pelo', 'pelos', 'por', 'sobre', 'um', 'uma'
  ]);

  const words = text.split(/\s+/);
  
  return words.map((word, index) => {
    // Remove pontuação para checar a palavra
    const cleanWord = word.replace(/[,;:\.\(\)]/g, '');
    
    // Se é um número romano (I, II, III, IV, V, etc), mantém maiúsculo
    if (/^[IVXLCDM]+$/i.test(cleanWord)) {
      return cleanWord.toUpperCase();
    }
    
    // Primeira palavra sempre capitalizada
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // Se é uma palavra pequena, mantém minúscula
    if (lowercaseWords.has(cleanWord.toLowerCase())) {
      return word.toLowerCase();
    }
    
    // Caso contrário, capitaliza primeira letra
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

// Converte padrão (texto)[url] ou (texto)\n[url] em links clicáveis antes de formatar parênteses
const convertLinksToHtml = (text: string, hideAnnotations: boolean = false): string => {
  // First, normalize double parentheses: ((texto))[url] → (texto)[url]
  let normalized = text.replace(/\(\(([^)]+)\)\)\s*\[/g, '($1)[');
  // Match (texto)[url] pattern - allows optional whitespace/newlines between ) and [
  return normalized.replace(/\(([^)]+)\)\s*\[(https?:\/\/[^\]]+)\]/g, (_, linkText, url) => {
    // Determine color based on content
    let colorClass = 'text-sky-400';
    const lower = linkText.toLowerCase();
    const isRevogado = /revogad[oa]/i.test(lower);
    const isVetado = /vetad[oa]/i.test(lower);
    if (isRevogado) colorClass = 'text-red-400';
    else if (/incluíd[oa]/i.test(lower)) colorClass = 'text-emerald-400';
    else if (/redação/i.test(lower)) colorClass = 'text-amber-400';
    else if (/renumerad[oa]/i.test(lower)) colorClass = 'text-cyan-400';
    else if (/vigência/i.test(lower)) colorClass = 'text-violet-400';
    else if (/vide/i.test(lower)) colorClass = 'text-sky-400';
    else if (isVetado) colorClass = 'text-gray-400';
    
    // Annotations that are NOT revogado/vetado are hideable
    const isHideable = !isRevogado && !isVetado;
    if (isHideable && hideAnnotations) {
      return '{{ANNOTATION_REMOVED}}';
    }
    
    
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${colorClass} italic text-[0.85em] underline decoration-dotted underline-offset-2 hover:brightness-125 legal-annotation">(${linkText})</a>`;
  });
};

// Formata parênteses legais com cores e estilos baseados no tipo
const formatParentheses = (text: string, hideAnnotations: boolean = false): string => {
  // Padrões que NÃO devem ser formatados (frações, tempo, medidas, percentuais, números por extenso)
  const ignorePatterns = [
    /\([^)]*(?:um|dois|duas|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|catorze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|duzentos|trezentos|mil)\s*[^)]*(?:terço|terços|quarto|quartos|quinto|quintos|sexto|sextos|metade|por cento|%|anos?|meses?|dias?|horas?|reais?|salários?|vezes|avos?)[^)]*\)/gi,
    /\([^)]*\d+\s*(?:por cento|%)[^)]*\)/gi, // Parênteses com percentuais numéricos
    /\([^)]*(?:por cento|percent)[^)]*\)/gi, // Parênteses com "por cento" em qualquer posição
    /\(\s*\d+[^)]*\)/gi, // Parênteses que começam com número
  ];

  // Verificar se o texto dentro do parêntese deve ser ignorado
  const shouldIgnore = (match: string): boolean => {
    return ignorePatterns.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(match);
    });
  };

  // Padrões e cores para cada tipo de marcação legal
  const patterns: Array<{ regex: RegExp; className: string; hideable?: boolean }> = [
    // Revogado - vermelho/rosa, tamanho normal, sempre visível
    { regex: /\(Revogad[oa][^)]*\)/gi, className: 'text-red-400 italic', hideable: false },
    // Vetado - cinza, tamanho normal, sempre visível
    { regex: /\(Vetad[oa][^)]*\)/gi, className: 'text-gray-400 italic', hideable: false },
    // Incluído - verde, menor, ocultável
    { regex: /\(Incluíd[oa][^)]*\)/gi, className: 'text-emerald-400 italic text-[0.85em]', hideable: true },
    // Redação dada - laranja/amarelo, menor, ocultável
    { regex: /\(Redação[^)]*\)/gi, className: 'text-amber-400 italic text-[0.85em]', hideable: true },
    // Renumerado - ciano, menor, ocultável
    { regex: /\(Renumerad[oa][^)]*\)/gi, className: 'text-cyan-400 italic text-[0.85em]', hideable: true },
    // Vigência - azul/roxo, menor, ocultável
    { regex: /\(Vigência[^)]*\)/gi, className: 'text-violet-400 italic text-[0.85em]', hideable: true },
    // Vide - azul claro, menor, ocultável
    { regex: /\(Vide[^)]*\)/gi, className: 'text-sky-400 italic text-[0.85em]', hideable: true },
    // Expressão suprimida - rosa, menor, ocultável
    { regex: /\(Expressão suprimida[^)]*\)/gi, className: 'text-pink-400 italic text-[0.85em]', hideable: true },
    // Outros parênteses genéricos com referência a Lei/Decreto - amarelo claro, menor, ocultável
    { regex: /\((?=.*(?:Lei|Decreto|LC|EC|MP|Emenda)[^)]*)[^)]+\)/gi, className: 'text-amber-300/80 italic text-[0.85em]', hideable: true },
  ];

  let result = text;
  
  for (const { regex, className, hideable } of patterns) {
    result = result.replace(regex, (match, offset) => {
      // Skip if this match is inside an <a> or <span> tag (already processed)
      const before = result.substring(0, offset);
      const lastAOpen = before.lastIndexOf('<a ');
      const lastAClose = before.lastIndexOf('</a>');
      if (lastAOpen > lastAClose) {
        return match; // Inside an <a> tag, skip
      }
      const lastSpanOpen = before.lastIndexOf('<span ');
      const lastSpanClose = before.lastIndexOf('</span>');
      if (lastSpanOpen > lastSpanClose) {
        return match; // Inside a <span> tag (already formatted), skip
      }
      
      // Verificar se deve ser ignorado (frações, tempo, etc.)
      if (shouldIgnore(match)) {
        return match;
      }
      
      if (hideable && hideAnnotations) {
        return '{{ANNOTATION_REMOVED}}';
      }
      
      return `<span class="${className}${hideable ? ' legal-annotation' : ''}">${match}</span>`;
    });
  }
  
  // Placeholder cleanup is done later in formatTextWithUppercase
  
  return result;
};

// Formata texto da Constituição aplicando estilos específicos
export const formatTextWithUppercase = (text: string, hideAnnotations: boolean = false): string => {
  if (!text) return "";
  
  // Normalizar quebras de linha múltiplas LOGO NO INÍCIO
  let result = text.replace(/\n{2,}/g, '\n\n');
  
  // CRÍTICO: Juntar § isolado com número na linha seguinte → "§ 1º"
  result = result.replace(/§\s*\n\s*(\d+[ºo°]?|único)/gi, '§ $1');
  // Também remover § totalmente isolado em linha própria (sem número)
  result = result.replace(/(^|\n)\s*§\s*(\n)/gm, '$1$2');
  
  // Juntar inciso romano isolado (I\n- texto) em "I - texto"
  result = result.replace(/\n([IVXLCDM]+)\s*\n\s*[-–—\\]\s*/g, '\n$1 - ');
  
  // Juntar parêntese de fechamento órfão (ex: "texto;\n)" → "texto;)")
  result = result.replace(/\n\s*\)/g, ')');
  
  // Juntar parêntese de abertura órfão seguido de quebra (ex: "(\nVide" → "(Vide")
  result = result.replace(/\(\s*\n/g, '(');
  
  // Remover quebras de linha dentro de parênteses (nunca deve quebrar)
  result = result.replace(/\(([^)]*)\)/g, (match, content) => {
    const cleanContent = content.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    return `(${cleanContent})`;
  });
  
  // Normalizar quebras de linha desnecessárias dentro de frases
  // Substitui quebra de linha simples seguida de letra minúscula ou pontuação por espaço
  // Preserva \n antes de alíneas (a), b), c)...) e incisos romanos
  result = result.replace(/\n(?=[a-záàâãéèêíïóôõöúç,;:])(?![a-z]\))/g, ' ');
  
  // Aplicar destaque amarelo e negrito a "Art. X" (artigo + número)
  // IMPORTANTE: Só para "Art." maiúsculo - "art." minúsculo é referência, não artigo
  result = result.replace(/(Art\.\s*\d+[º°o]?(?:-[A-Z])?)/g, '<strong class="font-bold text-red-300">$1</strong>');
  
  // Aplicar espaçamento duplo e negrito amarelo a "Parágrafo único"
  // Se não tiver \n\n antes, adiciona
  result = result.replace(/(?<!\n\n)(^|\n)(Parágrafo único\.?)/gim, '$1\n\n<strong class="font-bold text-red-300">$2</strong>');
  // Caso já tenha \n\n antes, só adiciona negrito vermelho
  result = result.replace(/(\n\n)(Parágrafo único\.?)(?!<)/gi, '$1<strong class="font-bold text-red-300">$2</strong>');
  
  // Aplicar espaçamento duplo e negrito amarelo a parágrafos (§)
  // Usar [ \t]* em vez de \s* para NÃO capturar \n dentro do match
  // Se não tiver \n\n antes, adiciona
  result = result.replace(/(?<!\n\n)(^|\n)(§[ \t]*\d+[ºo°]?)/gm, '$1\n\n<strong class="font-bold text-red-300">$2</strong>');
  // Caso já tenha \n\n antes, só adiciona negrito vermelho
  result = result.replace(/(\n\n)(§[ \t]*\d+[ºo°]?)(?!<)/g, '$1<strong class="font-bold text-red-300">$2</strong>');
  
  // Aplicar espaçamento duplo e negrito a incisos romanos (I, II, III, etc) com linha lateral
  // Se não tiver \n\n antes, adiciona
  result = result.replace(/(?<!\n\n)(^|\n)([IVXLCDM]+)\s*[-–—]\s*/gm, '\n</span><span style="display:block;border-left:2px solid rgba(248,113,113,0.5);padding-left:1rem;margin-left:0.5rem;padding-top:0.15rem;padding-bottom:0.15rem;margin-top:0.1rem;margin-bottom:0.1rem"><strong class="font-bold">$2</strong> - ');
  // Caso já tenha \n\n antes, só adiciona negrito
  result = result.replace(/(\n\n)([IVXLCDM]+)\s*[-–—](?!\s*<)/g, '\n</span><span style="display:block;border-left:2px solid rgba(248,113,113,0.5);padding-left:1rem;margin-left:0.5rem;padding-top:0.15rem;padding-bottom:0.15rem;margin-top:0.1rem;margin-bottom:0.1rem"><strong class="font-bold">$2</strong> - ');
  
  // Aplicar espaçamento duplo e negrito a alíneas (a), b), c)) com linha lateral mais indentada
  // Se não tiver \n\n antes, adiciona
  result = result.replace(/(?<!\n\n)(^|\n)\s*([a-z])\)\s*/gm, '\n</span><span style="display:block;border-left:2px solid rgba(248,113,113,0.35);padding-left:1rem;margin-left:1rem;padding-top:0.1rem;padding-bottom:0.1rem;margin-top:0.05rem;margin-bottom:0.05rem"><strong class="font-bold">$2)</strong> ');
  // Caso já tenha \n\n antes, só adiciona negrito
  result = result.replace(/(\n\n)\s*([a-z])\)(?!\s*<)/g, '\n</span><span style="display:block;border-left:2px solid rgba(248,113,113,0.35);padding-left:1rem;margin-left:1rem;padding-top:0.1rem;padding-bottom:0.1rem;margin-top:0.05rem;margin-bottom:0.05rem"><strong class="font-bold">$2)</strong> ');
  
  // Identificar e marcar títulos (incluindo títulos entre artigos como "Tentativa", "Pena de tentativa")
  const lines = result.split('\n');
  const processedLines = lines.map((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    // Ignora linhas vazias ou muito curtas
    if (!trimmedLine || trimmedLine.length < 3) return line;
    
    // Ignora linhas que já foram formatadas com HTML
    if (trimmedLine.startsWith('<')) return line;
    
    // NÃO aplicar se a linha começa com §, números romanos seguidos de -, ou alíneas
    if (/^(§|\d+[ºo°]|[IVXLCDM]+\s*[-–—]|[a-z]\))/.test(trimmedLine)) {
      return line;
    }
    
    // NÃO aplicar se é o artigo em si (começa com "Art.")
    if (/^Art\./.test(trimmedLine)) {
      return line;
    }
    
    // NÃO aplicar se a linha é um conteúdo longo (mais de 80 chars = provavelmente é texto normal)
    if (trimmedLine.length > 100) return line;
    
    // Verificar se a PRÓXIMA linha não-vazia começa com "Art." - isso indica que esta linha é um título
    let nextNonEmptyLine = '';
    for (let i = lineIndex + 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        nextNonEmptyLine = lines[i].trim();
        break;
      }
    }
    
    // Verificar se a LINHA ANTERIOR não-vazia termina com um artigo ou inciso (indica título entre artigos)
    let prevNonEmptyLine = '';
    for (let i = lineIndex - 1; i >= 0; i--) {
      if (lines[i].trim()) {
        prevNonEmptyLine = lines[i].trim();
        break;
      }
    }
    
    // É título se: próxima linha é Art. OU (linha curta sem pontuação final típica de conteúdo + entre artigos)
    const isBeforeArticle = nextNonEmptyLine && /^(<strong class="font-bold text-amber-300">)?Art\./i.test(nextNonEmptyLine);
    const isShortTitle = trimmedLine.length <= 60 && !trimmedLine.endsWith('.') && !trimmedLine.endsWith(';') && !trimmedLine.endsWith(':') && !trimmedLine.endsWith(',');
    const isAfterContent = prevNonEmptyLine && (/[;.]$/.test(prevNonEmptyLine) || /<\/span>$/.test(prevNonEmptyLine) || /^(<strong class="font-bold text-amber-300">)?Art\./i.test(prevNonEmptyLine));
    
    // Linhas que terminam com '.' antes de artigo são provavelmente assinaturas/nomes, não títulos
    const isLikelySignature = trimmedLine.endsWith('.') && trimmedLine.length <= 60;
    
    if ((isBeforeArticle && !isLikelySignature) || (isShortTitle && isAfterContent && nextNonEmptyLine)) {
      return `<span class="text-amber-300 font-bold">${trimmedLine}</span>`;
    }
    
    // Para títulos principais em CAIXA ALTA
    const words = trimmedLine.split(/\s+/);
    const upperWords = words.filter(word => 
      /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\-\(\),;:\.0-9]+$/.test(word.replace(/[,;:\.\(\)]/g, ''))
    );
    
    if (upperWords.length >= 2 && (upperWords.length / words.length) > 0.7) {
      const titleText = toTitleCase(trimmedLine);
      return `<span class="text-amber-300 font-bold">${titleText}</span>`;
    }
    
    return line;
  });
  
  result = processedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // Normaliza múltiplas quebras para apenas dupla
  
  // Converter links (texto)[url] em <a> clicáveis ANTES de formatar parênteses
  result = convertLinksToHtml(result, hideAnnotations);
  
  // Limpar URLs órfãs que não foram convertidas pelo convertLinksToHtml
  // Remove padrões como [https://...] soltos que sobraram
  result = result.replace(/\s*\[https?:\/\/[^\]]+\]/g, '');
  // Remove URLs brutas soltas (https://... até próximo espaço ou fim de linha)
  result = result.replace(/\s*https?:\/\/[^\s<"'>)\]]+/g, (match, offset) => {
    // Não remover se está dentro de uma tag <a href="...">
    const before = result.substring(Math.max(0, offset - 50), offset);
    if (/href=["']$/.test(before) || /<a[^>]*$/.test(before)) return match;
    return '';
  });
  
  // Aplicar formatação de parênteses legais com cores (para os que NÃO têm links)
  result = formatParentheses(result, hideAnnotations);

  // Tratar "Vigência" bare (sem parênteses) - aparece solto no final de linhas
  if (hideAnnotations) {
    // Remove "Vigência" standalone (pode ter pontuação antes como ";Vigência" ou ".Vigência")
    result = result.replace(/[;.,]?\s*Vigência\s*/gi, ' ');
  } else {
    // Quando visível, estilizar como anotação
    result = result.replace(/(?<![("a-záàâãéèêíïóôõöúç])([;.,]?\s*)(Vigência)(?![^<]*<\/a>)(?![^<]*<\/span>)(?!\w)/gi, 
      '$1<span class="text-violet-400 italic text-[0.85em] legal-annotation">$2</span>');
  }

  // Ao ocultar anotações, remover placeholders com whitespace adjacente
  if (hideAnnotations) {
    // Remove placeholder + surrounding horizontal whitespace on its own line
    result = result.replace(/[ \t]*\{\{ANNOTATION_REMOVED\}\}[ \t]*/g, '');
    // Collapse resulting empty lines and trailing spaces
    result = result
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\s+([,.;:])/g, '$1');
  }
  
  // Envolve o texto completo sem forçar tamanho de fonte (herda do container)
  return `<div class="font-normal">${result}</div>`;
};
