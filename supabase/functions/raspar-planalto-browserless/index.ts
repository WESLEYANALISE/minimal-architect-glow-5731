import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVISION = "v1.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`🚀 [raspar-planalto-browserless ${REVISION}] Iniciando...`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urlPlanalto, tableName } = await req.json();
    
    if (!urlPlanalto) {
      return new Response(
        JSON.stringify({ success: false, error: "URL do Planalto é obrigatória" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "BROWSERLESS_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📍 URL: ${urlPlanalto}`);
    console.log(`📋 Tabela: ${tableName || 'não especificada'}`);

    // Usar a API /content do Browserless para obter HTML completo
    console.log('🌐 Chamando Browserless API /content para HTML...');

    const browserlessUrl = `https://production-sfo.browserless.io/content?token=${browserlessApiKey}`;
    
    const payload = {
      url: urlPlanalto,
      gotoOptions: {
        waitUntil: 'networkidle2',
        timeout: 30000
      }
    };
    
    console.log('📤 Payload enviado:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(browserlessUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Browserless erro: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro Browserless: ${response.status}`,
          details: errorText.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // /content retorna o HTML diretamente como texto
    const htmlContent = await response.text();
    console.log(`📄 HTML recebido: ${htmlContent.length} caracteres`);

    // Processar HTML para extrair texto com quebras de parágrafo e tabelas preservadas
    const textoCompleto = processarHtmlParaTexto(htmlContent);
    console.log(`📊 Texto processado: ${textoCompleto.length} caracteres`);

    // Processar o texto para extrair estrutura
    const linhas = textoCompleto.split('\n').map((l: string) => l.trim()).filter((l: string) => l);
    
    // Extrair metadados
    let titulo = '';
    let ementa = '';
    let tipoNorma = '';
    let dataPublicacao = '';
    
    // Encontrar título (primeira linha com nome da norma)
    let tituloIndex = -1;
    for (let i = 0; i < Math.min(linhas.length, 30); i++) {
      const linha = linhas[i];
      if (/^(LEI|DECRETO|MEDIDA|EMENDA|CONSTITUIÇÃO)/i.test(linha) && !titulo) {
        titulo = linha;
        tituloIndex = i;
        break;
      }
    }
    
    // EXTRAIR EMENTA - texto após título e antes do primeiro artigo
    if (tituloIndex >= 0) {
      const partes: string[] = [];
      for (let i = tituloIndex + 1; i < linhas.length; i++) {
        const linha = linhas[i];
        // Parar se encontrar primeiro artigo, preâmbulo conhecido, ou estrutura
        if (/^Art\.?\s*\d+/i.test(linha)) break;
        if (/^(O\s+PRESIDENTE|O\s+CONGRESSO|TÍTULO\s+|CAPÍTULO\s+|LIVRO\s+|PARTE\s+)/i.test(linha)) break;
        // Ignorar linhas muito curtas ou decorativas
        if (linha.length > 10 && !/^[\-=_\*]+$/.test(linha)) {
          partes.push(linha);
        }
        // Ementa geralmente termina com "o seguinte:" ou similar
        if (/o\s+seguinte:?\s*$/i.test(linha)) break;
        // Limitar a 800 caracteres
        if (partes.join(' ').length > 800) break;
      }
      ementa = partes.join(' ').trim();
      // Limpar ementa
      ementa = ementa.replace(/\s+/g, ' ').substring(0, 800);
    }
    console.log(`📝 Ementa extraída: ${ementa.length} caracteres`);
    
    // Tipo de norma
    if (/^LEI\s+COMPLEMENTAR/i.test(titulo)) tipoNorma = 'Lei Complementar';
    else if (/^LEI\s+Nº/i.test(titulo)) tipoNorma = 'Lei Ordinária';
    else if (/^DECRETO-LEI/i.test(titulo)) tipoNorma = 'Decreto-Lei';
    else if (/^DECRETO\s+Nº/i.test(titulo)) tipoNorma = 'Decreto';
    else if (/^MEDIDA\s+PROVISÓRIA/i.test(titulo)) tipoNorma = 'Medida Provisória';
    else if (/^EMENDA\s+CONSTITUCIONAL/i.test(titulo)) tipoNorma = 'Emenda Constitucional';
    else if (/^CONSTITUIÇÃO/i.test(titulo)) tipoNorma = 'Constituição';
    else tipoNorma = 'Norma';

    // Data
    const matchData = titulo.match(/DE\s+(\d{1,2})\s+DE\s+(\w+)\s+DE\s+(\d{4})/i);
    if (matchData) {
      const meses: Record<string, string> = {
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03', 'abril': '04',
        'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
        'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
      };
      const dia = matchData[1].padStart(2, '0');
      const mes = meses[matchData[2].toLowerCase()] || '01';
      const ano = matchData[3];
      dataPublicacao = `${ano}-${mes}-${dia}`;
    }

    // Extrair estrutura hierárquica
    const livros: string[] = [];
    const titulos: string[] = [];
    const capitulos: string[] = [];
    const secoes: string[] = [];
    
    for (const linha of linhas) {
      if (/^LIVRO\s+[IVX]+/i.test(linha) && !livros.includes(linha)) {
        livros.push(linha.substring(0, 200));
      }
      if (/^TÍTULO\s+[IVX]+/i.test(linha) && !titulos.includes(linha)) {
        titulos.push(linha.substring(0, 200));
      }
      if (/^CAPÍTULO\s+[IVX]+/i.test(linha) && !capitulos.includes(linha)) {
        capitulos.push(linha.substring(0, 200));
      }
      if (/^SEÇÃO\s+[IVX]+/i.test(linha) && !secoes.includes(linha)) {
        secoes.push(linha.substring(0, 200));
      }
    }

    // Extrair artigos com parágrafos preservados
    const artigos = extrairArtigosComParagrafos(textoCompleto);

    console.log(`✅ Processamento concluído`);
    console.log(`📊 Estrutura: ${livros.length} livros, ${titulos.length} títulos, ${capitulos.length} capítulos`);
    console.log(`📊 Artigos: ${artigos.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        metodo: 'browserless',
        revisao: REVISION,
        urlRaspada: urlPlanalto,
        metadados: {
          titulo,
          ementa,
          presidencia: '',
          dataPublicacao,
          tipoNorma
        },
        estrutura: {
          livros,
          titulos,
          capitulos,
          secoes
        },
        artigos,
        textoCompleto,
        totalCaracteres: textoCompleto.length,
        estatisticas: {
          livros: livros.length,
          titulos: titulos.length,
          capitulos: capitulos.length,
          secoes: secoes.length,
          artigos: artigos.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro geral: ${errorMessage}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        revisao: REVISION
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função para processar HTML e preservar quebras de parágrafo E TABELAS
function processarHtmlParaTexto(html: string): string {
  let texto = html;
  
  // PRIMEIRO: Processar tabelas ANTES de remover outras tags
  texto = processarTabelas(texto);
  
  // Substituir <br>, <br/>, <br /> por ESPAÇO (não quebra de linha)
  // Isso evita quebras de linha no meio de frases
  texto = texto.replace(/<br\s*\/?>/gi, ' ');
  
  // Substituir </p> por UMA quebra de linha apenas
  texto = texto.replace(/<\/p>/gi, '\n');
  
  // Substituir </div> por espaço (para não quebrar linha)
  texto = texto.replace(/<\/div>/gi, ' ');
  
  // Substituir headers por quebra de linha
  texto = texto.replace(/<\/h[1-6]>/gi, '\n');
  
  // Substituir </li> por quebra
  texto = texto.replace(/<\/li>/gi, '\n');
  
  // Remover todas as outras tags HTML
  texto = texto.replace(/<[^>]+>/g, '');
  
  // Decodificar entidades HTML
  texto = texto.replace(/&nbsp;/gi, ' ');
  texto = texto.replace(/&amp;/gi, '&');
  texto = texto.replace(/&lt;/gi, '<');
  texto = texto.replace(/&gt;/gi, '>');
  texto = texto.replace(/&quot;/gi, '"');
  texto = texto.replace(/&#39;/gi, "'");
  texto = texto.replace(/&ordm;/gi, 'º');
  texto = texto.replace(/&ordf;/gi, 'ª');
  texto = texto.replace(/&sect;/gi, '§');
  texto = texto.replace(/&#\d+;/gi, '');
  
  // Normalizar espaços múltiplos
  texto = texto.replace(/[ \t]+/g, ' ');
  
  // Normalizar quebras de linha - MÁXIMO 1 consecutiva
  texto = texto.replace(/\n\s*\n/g, '\n');
  texto = texto.replace(/\n{2,}/g, '\n');
  
  // Limpar espaços no início/fim de cada linha
  texto = texto.split('\n').map(l => l.trim()).join('\n');
  
  // Limpar linhas vazias
  texto = texto.trim();
  
  return texto;
}

// Nova função para processar tabelas HTML e convertê-las para texto estruturado
function processarTabelas(html: string): string {
  let texto = html;
  
  // Encontrar todas as tabelas e processar uma a uma
  const tabelaRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  
  texto = texto.replace(tabelaRegex, (match, conteudoTabela) => {
    let tabelaFormatada = '\n\n[TABELA]\n';
    
    // Processar cada linha da tabela
    const linhaRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let linhaMatch;
    let isHeader = true;
    
    while ((linhaMatch = linhaRegex.exec(conteudoTabela)) !== null) {
      const conteudoLinha = linhaMatch[1];
      const celulas: string[] = [];
      
      // Extrair células (th ou td)
      const celulaRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
      let celulaMatch;
      
      while ((celulaMatch = celulaRegex.exec(conteudoLinha)) !== null) {
        // Limpar o conteúdo da célula de tags internas
        let conteudoCelula = celulaMatch[1];
        conteudoCelula = conteudoCelula.replace(/<[^>]+>/g, '').trim();
        conteudoCelula = conteudoCelula.replace(/\s+/g, ' ');
        celulas.push(conteudoCelula);
      }
      
      if (celulas.length > 0) {
        tabelaFormatada += '| ' + celulas.join(' | ') + ' |\n';
        
        // Adicionar separador após cabeçalho
        if (isHeader) {
          tabelaFormatada += '|' + celulas.map(() => ' --- ').join('|') + '|\n';
          isHeader = false;
        }
      }
    }
    
    tabelaFormatada += '[/TABELA]\n\n';
    return tabelaFormatada;
  });
  
  return texto;
}

// Função para extrair artigos preservando parágrafos e SUFIXOS (-A, -B, etc.)
function extrairArtigosComParagrafos(texto: string): Array<{numero: number; numeroCompleto: string; texto: string; titulo_estrutural: string | null; capitulo: string | null; secao: string | null}> {
  const artigos: Array<{numero: number; numeroCompleto: string; texto: string; titulo_estrutural: string | null; capitulo: string | null; secao: string | null}> = [];
  
  // Regex para encontrar início de artigos - SOMENTE "Art." com A MAIÚSCULO
  // Captura "Art. 1", "Art. 1º", "Art 1o", "Art. 1.", "Art. 1° O...", "Art. 7º-A", etc.
  // IMPORTANTE: NÃO pode pegar "art." minúsculo - são referências, não artigos!
  // Removido flag 'i' para ser case-sensitive
  const regexArtigoInicio = /Art\.?\s*(\d+)[º°ªo]?(?:[-–]([A-Z])(?=[.\s\-–—]))?\.?[.\s\-–—]*/g;
  
  // Encontrar todas as posições onde começam artigos
  const matches: Array<{index: number; numero: number; sufixo: string; numeroCompleto: string}> = [];
  let match;
  
  while ((match = regexArtigoInicio.exec(texto)) !== null) {
    const numero = parseInt(match[1]);
    const sufixo = match[2] || ''; // -A, -B, etc. (vazio se não houver)
    const numeroCompleto = sufixo ? `${numero}-${sufixo}` : `${numero}`;
    if (!isNaN(numero)) {
      matches.push({ index: match.index, numero, sufixo, numeroCompleto });
    }
  }
  
  console.log(`🔍 Encontrados ${matches.length} matches de artigos`);
  
  if (matches.length === 0) {
    // Tentar regex ainda mais simples - também case-sensitive (só "Art." maiúsculo)
    const regexSimples = /Art\.?\s*(\d+)(?:[-–]([A-Z])(?=[.\s]))?/g;
    while ((match = regexSimples.exec(texto)) !== null) {
      const numero = parseInt(match[1]);
      const sufixo = match[2] || '';
      const numeroCompleto = sufixo ? `${numero}-${sufixo}` : `${numero}`;
      if (!isNaN(numero)) {
        matches.push({ index: match.index, numero, sufixo, numeroCompleto });
      }
    }
    console.log(`🔍 Com regex simples: ${matches.length} matches`);
  }

  
  let tituloAtual = '';
  let capituloAtual = '';
  let secaoAtual = '';
  
  for (let i = 0; i < matches.length; i++) {
    const atual = matches[i];
    const proximo = matches[i + 1];
    
    // Extrair texto do artigo atual até o próximo
    const inicio = atual.index;
    const fim = proximo ? proximo.index : texto.length;
    let textoArtigo = texto.substring(inicio, fim).trim();
    
    // Verificar se há capítulo ou seção antes deste artigo
    const textoPrevio = texto.substring(matches[i - 1]?.index || 0, inicio);
    
    const matchTitulo = textoPrevio.match(/TÍTULO\s+[IVX]+[^\n]*(?:\n(?!Art\.|CAPÍTULO|SEÇÃO|TÍTULO)[^\n]+)*/gi);
    if (matchTitulo) {
      tituloAtual = matchTitulo[matchTitulo.length - 1].replace(/\n/g, '\n').substring(0, 200).trim();
    }
    
    const matchCapitulo = textoPrevio.match(/CAPÍTULO\s+[IVX]+[^\n]*(?:\n(?!Art\.|CAPÍTULO|SEÇÃO|TÍTULO)[^\n]+)*/gi);
    if (matchCapitulo) {
      capituloAtual = matchCapitulo[matchCapitulo.length - 1].replace(/\n/g, '\n').substring(0, 200).trim();
    }
    
    const matchSecao = textoPrevio.match(/SEÇÃO\s+[IVX]+[^\n]*(?:\n(?!Art\.|CAPÍTULO|SEÇÃO|TÍTULO)[^\n]+)*/gi);
    if (matchSecao) {
      secaoAtual = matchSecao[matchSecao.length - 1].replace(/\n/g, '\n').substring(0, 200).trim();
    }
    
    // NORMALIZAR TEXTO DO ARTIGO:
    // 1. Substituir quebras de linha simples por espaço (são quebras do HTML, não da lei)
    textoArtigo = textoArtigo.replace(/\n+/g, ' ');
    
    // 2. Normalizar espaços múltiplos
    textoArtigo = textoArtigo.replace(/\s+/g, ' ');
    
    // 3. Colocar § em nova linha APENAS quando inicia um novo parágrafo (não referência)
    // Referências são tipo: "art. 2º, § 3º," ou "inciso I do § 1º" ou "ao § 2º" ou "constantes no § 10."
    // NÃO quebrar quando § vem após vírgula, preposições, ou quando é referência no final de frase
    
    // PROTEÇÃO: Marcar referências para NÃO quebrar
    // Após vírgula: ", § 2º" é referência
    textoArtigo = textoArtigo.replace(/,\s*(§\s*\d+[º°]?)/g, ',###REFPAR### $1');
    // Após preposições: "do § 2º", "no § 1º", "ao § 3º"
    textoArtigo = textoArtigo.replace(/(d[oae]s?|n[oae]s?|a[os]?)\s+(§\s*\d+[º°]?)/gi, '$1###REFPAR### $2');
    // Referência a artigo + parágrafo: "art. 165, § 2º"
    textoArtigo = textoArtigo.replace(/(art\.?\s*\d+[º°]?,?\s*)(§\s*\d+[º°]?)/gi, '$1###REFPAR###$2');
    
    // Agora quebra APENAS quando § é NOVO PARÁGRAFO (após pontuação E seguido de texto substancial com maiúscula)
    textoArtigo = textoArtigo.replace(/([.;:])\s*(§\s*\d+[º°]?\.?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1\n$2');
    
    // Restaurar referências protegidas (removendo marcador)
    textoArtigo = textoArtigo.replace(/###REFPAR###\s*/g, ' ');
    
    // 4. Colocar "Parágrafo único" em nova linha (só após pontuação final)
    textoArtigo = textoArtigo.replace(/([.;:])\s+(Parágrafo\s+único)/gi, '$1\n$2');
    
    // 5. Colocar incisos (I -, II -, etc) em nova linha (só após pontuação ou dois-pontos)
    textoArtigo = textoArtigo.replace(/([.:;])\s+([IVXLC]+\s*[-–])/g, '$1\n$2');
    
    // 5b. Colocar incisos em nova linha mesmo quando há anotações (Vide...) entre a pontuação e o inciso
    textoArtigo = textoArtigo.replace(/([.:;])\s*(\([^)]*\)\s*)+([IVXLC]+\s*[-–])/g, '$1 $2\n$3');
    
    // 6. Colocar alíneas (a), b), etc) em nova linha (só após pontuação)
    textoArtigo = textoArtigo.replace(/([.:;])\s+([a-z]\)\s)/g, '$1\n$2');
    
    // 6b. Colocar alíneas em nova linha mesmo quando há anotações (Vide...) entre a pontuação e a alínea
    textoArtigo = textoArtigo.replace(/([.:;])\s*(\([^)]*\)\s*)+([a-z]\)\s)/g, '$1 $2\n$3');
    
    textoArtigo = textoArtigo.trim();
    
    // 7. Normalizar ordinais: "Art. Xo " → "Art. Xº " e "§ Xo " → "§ Xº "
    textoArtigo = textoArtigo.replace(/\bArt\.?\s*(\d+)o\b/g, 'Art. $1º');
    textoArtigo = textoArtigo.replace(/§\s*(\d+)o\b/g, '§ $1º');
    
    artigos.push({
      numero: atual.numero,
      numeroCompleto: atual.numeroCompleto,
      texto: textoArtigo,
      titulo_estrutural: tituloAtual || null,
      capitulo: capituloAtual || null,
      secao: secaoAtual || null
    });
  }
  
  // Ordenar por número e remover duplicatas usando numeroCompleto como chave
  // Isso garante que Art. 7 e Art. 7-A são tratados como artigos DIFERENTES
  const artigosUnicos = new Map<string, typeof artigos[0]>();
  for (const art of artigos) {
    if (!artigosUnicos.has(art.numeroCompleto)) {
      artigosUnicos.set(art.numeroCompleto, art);
    }
  }
  
  // Ordenar: primeiro por número, depois por sufixo (7 < 7-A < 7-B < 8)
  const resultado = Array.from(artigosUnicos.values()).sort((a, b) => {
    if (a.numero !== b.numero) return a.numero - b.numero;
    // Mesmo número, ordenar por sufixo (vazio vem antes de A, B, etc.)
    const sufixoA = a.numeroCompleto.includes('-') ? a.numeroCompleto.split('-')[1] : '';
    const sufixoB = b.numeroCompleto.includes('-') ? b.numeroCompleto.split('-')[1] : '';
    return sufixoA.localeCompare(sufixoB);
  });
  console.log(`📊 Artigos únicos: ${resultado.length}`);
  
  return resultado;
}
