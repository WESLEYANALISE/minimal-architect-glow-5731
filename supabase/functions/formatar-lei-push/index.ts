import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

const REVISION = "v5.1.0"; // Fix: preservar artigos, só remover anexos APÓS último Art.

// ============================================================
// FUNÇÃO: Extrair anexos/tabelas - CONSERVADORA (só após último Art.)
// ============================================================
function extrairAnexosComoLinks(texto: string): { textoSemAnexos: string; anexos: string[] } {
  const anexos: string[] = [];
  let textoSemAnexos = texto;
  
  const tamanhoOriginal = texto.length;
  
  // Encontrar posição do ÚLTIMO artigo real no texto (só maiúsculo "Art.")
  const artigoMatches = [...texto.matchAll(/\nArt\.?\s*\d+[º°]?/g)];
  const ultimoArtigoMatch = artigoMatches[artigoMatches.length - 1];
  
  if (!ultimoArtigoMatch || ultimoArtigoMatch.index === undefined) {
    console.log(`[EXTRAIR-ANEXOS] Nenhum artigo encontrado, mantendo texto integral`);
    return { textoSemAnexos: texto, anexos: [] };
  }
  
  // Encontrar onde termina o último artigo (próximo parágrafo ou assinatura)
  const posicaoUltimoArtigo = ultimoArtigoMatch.index;
  const textoAposUltimoArtigo = texto.substring(posicaoUltimoArtigo);
  
  // Encontrar fim do conteúdo do último artigo (assinatura ou "Este texto não substitui")
  const fimConteudoMatch = textoAposUltimoArtigo.match(/\n\s*(Brasília,|Este texto não substitui|LUIZ\s*INÁCIO|JAIR\s*MESSIAS)/i);
  const posicaoFimConteudo = fimConteudoMatch?.index 
    ? posicaoUltimoArtigo + fimConteudoMatch.index 
    : texto.length;
  
  console.log(`[EXTRAIR-ANEXOS] Último Art. na posição ${posicaoUltimoArtigo}, fim do conteúdo em ${posicaoFimConteudo}`);
  
  // Dividir texto: antes do fim do conteúdo principal (PROTEGIDO) vs. após (pode ter anexos)
  const textoProtegido = texto.substring(0, posicaoFimConteudo);
  const textoAposConteudo = texto.substring(posicaoFimConteudo);
  
  // Só procurar anexos na parte APÓS o conteúdo principal
  // Regex mais específica: ANEXO deve estar em linha própria como título
  const anexoRegex = /\n\s*(ANEXO\s+[IVXLCDM]+\b[^\n]*(?:\n(?!\s*ANEXO\s+[IVXLCDM]+\b)[^\n]*)*)/gi;
  
  const textoAposProcessado = textoAposConteudo.replace(anexoRegex, (match, anexoContent) => {
    const primeiraLinha = anexoContent.trim().split('\n')[0].trim();
    // Só considerar como anexo se for título significativo (não referência inline)
    if (primeiraLinha.length < 100 && /^ANEXO\s+[IVXLCDM]+/i.test(primeiraLinha)) {
      anexos.push(primeiraLinha);
      console.log(`[ANEXO] Extraído após artigos: "${primeiraLinha}" (${match.length} chars)`);
      return '';
    }
    return match; // Manter se não for um título claro
  });
  
  textoSemAnexos = textoProtegido + textoAposProcessado;
  
  // Remover tabelas grandes APENAS na seção após os artigos
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  const posicaoFimArtigosNoProcessado = textoProtegido.length;
  
  textoSemAnexos = textoSemAnexos.replace(tableRegex, (tableMatch, offset) => {
    // Só remover tabelas que estão APÓS o conteúdo principal dos artigos
    if (offset > posicaoFimArtigosNoProcessado && tableMatch.length > 1000) {
      console.log(`[EXTRAIR-ANEXOS] Tabela grande removida (após artigos): ${tableMatch.length} chars`);
      return '';
    }
    return tableMatch; // Preservar tabelas dentro dos artigos
  });
  
  // Log de segurança
  const percentualRemovido = ((tamanhoOriginal - textoSemAnexos.length) / tamanhoOriginal * 100);
  console.log(`[EXTRAIR-ANEXOS] ${anexos.length} anexos, ${percentualRemovido.toFixed(1)}% removido`);
  
  if (percentualRemovido > 30) {
    console.warn(`⚠️ ALERTA: Mais de 30% do texto foi removido! Verificar se há problema.`);
  }
  
  // Se removeu demais (>50%), provavelmente erro - retornar texto original
  if (percentualRemovido > 50) {
    console.error(`❌ ERRO: Remoção excessiva (${percentualRemovido.toFixed(1)}%), revertendo para texto original`);
    return { textoSemAnexos: texto, anexos: [] };
  }
  
  return { textoSemAnexos, anexos };
}

// ============================================================
// FUNÇÃO: PRÉ-LIMPAR HTML (100% determinístico)
// ============================================================
function preLimparHTML(texto: string): string {
  console.log(`[PRE-LIMPAR] Entrada: ${texto.length} caracteres`);
  let r = texto;
  
  r = r.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  r = r.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  r = r.replace(/<!--[\s\S]*?-->/g, '');
  r = r.replace(/<(div|span|p|font|a|strong|b|i|em|u)[^>]*>\s*<\/\1>/gi, '');
  r = r.replace(/<table[^>]*>/gi, '<table>');
  r = r.replace(/<tr[^>]*>/gi, '<tr>');
  r = r.replace(/<td[^>]*>/gi, '<td>');
  r = r.replace(/<th[^>]*>/gi, '<th>');
  r = r.replace(/<thead[^>]*>/gi, '<thead>');
  r = r.replace(/<tbody[^>]*>/gi, '<tbody>');
  
  const tabelasTemp: string[] = [];
  r = r.replace(/<table>[\s\S]*?<\/table>/gi, (match) => {
    tabelasTemp.push(match);
    return `__TABELA_TEMP_${tabelasTemp.length - 1}__`;
  });
  
  r = r.replace(/<\/?(?:font|span|strong|b|i|em|u|a|center)[^>]*>/gi, '');
  r = r.replace(/<\/(?:div|p)>/gi, '\n');
  r = r.replace(/<(?:div|p)[^>]*>/gi, '');
  
  tabelasTemp.forEach((tabela, i) => {
    r = r.replace(`__TABELA_TEMP_${i}__`, tabela);
  });
  
  r = r.replace(/&nbsp;/gi, ' ');
  r = r.replace(/&amp;/gi, '&');
  r = r.replace(/&lt;/gi, '<');
  r = r.replace(/&gt;/gi, '>');
  r = r.replace(/&quot;/gi, '"');
  r = r.replace(/&#\d+;/gi, '');
  r = r.replace(/<img[^>]*>/gi, '');
  r = r.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
  r = r.replace(/\*\*([^*]+)\*\*/g, '$1');
  r = r.replace(/\*([^*]+)\*/g, '$1');
  r = r.replace(/#{1,6}\s*/g, '');
  r = r.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  r = r.replace(/https?:\/\/[^\s\n]+/gi, '');
  r = r.replace(/\.{5,}/g, '');
  r = r.replace(/_{5,}/g, '');
  r = r.replace(/-{5,}/g, '');
  r = r.replace(/\n{4,}/g, '\n\n\n');
  r = r.replace(/[ \t]+\n/g, '\n');
  r = r.replace(/\n[ \t]+/g, '\n');
  r = r.replace(/  +/g, ' ');
  r = r.trim();
  
  console.log(`[PRE-LIMPAR] Saída: ${r.length} caracteres (redução: ${Math.round((1 - r.length/texto.length) * 100)}%)`);
  return r;
}

// ============================================================
// FORMATAÇÃO 100% REGEX - SEM IA
// ============================================================
function formatarLeiRegex(texto: string): string {
  console.log('[REGEX] Iniciando formatação determinística...');
  let r = texto;
  
  r = r.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  r = r.replace(/\t/g, ' ');
  r = r.replace(/  +/g, ' ');
  
  r = r.replace(/\n*(TÍTULO\s+[IVXLCDM]+)/gi, '\n\n\n$1');
  r = r.replace(/\n*(CAPÍTULO\s+[IVXLCDM]+)/gi, '\n\n\n$1');
  r = r.replace(/\n*(SEÇÃO\s+[IVXLCDM]+)/gi, '\n\n\n$1');
  r = r.replace(/\n*(SUBSEÇÃO\s+[IVXLCDM]+)/gi, '\n\n\n$1');
  r = r.replace(/\n*(LIVRO\s+[IVXLCDM]+)/gi, '\n\n\n$1');
  r = r.replace(/\n*(PARTE\s+(?:[IVXLCDM]+|GERAL|ESPECIAL))/gi, '\n\n\n$1');
  
  r = r.replace(/(Art\.?\s*1[º°]?\.?)\s+(O\s+PRESIDENTE\s+DA\s+REPÚBLICA[^:]+(?:Lei|Decreto|seguinte):?)/gi, 
    '$2\n\n$1 ');
  r = r.replace(/([.:])\s*(O\s+PRESIDENTE\s+DA\s+REPÚBLICA[^:]+(?:Lei|Decreto|seguinte):?)\s*(Art\.?\s*1[º°]?)/gi,
    '$1\n\n$2\n\n$3');
  
  r = r.replace(/([.!?:;])\s+(Art\.?\s*\d+[º°]?[-–]?[A-Z]?\.?)\s+/gi, (match, pontuacao, artigo) => {
    return `${pontuacao}\n\n${artigo.trim()} `;
  });
  
  r = r.replace(/([^\n\s])\s*(§\s*\d+[º°]?\.?)/g, '$1\n\n$2');
  r = r.replace(/(\."?)\s*(§\s*\d+)/g, '$1\n\n$2');
  r = r.replace(/\n+(§\s*\d+)/g, '\n\n$1');
  r = r.replace(/([^\n\s])\s*(Parágrafo\s+único)/gi, '$1\n\n$2');
  r = r.replace(/\n+(Parágrafo\s+único)/gi, '\n\n$1');
  
  const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 
                   'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
                   'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX'];
  
  r = r.replace(/([.;:,a-záàâãéèêíïóôõöúç\)])\s+([IVXLCDM]{1,5})\s*[-–−]\s*/gi, (match, antes, romano) => {
    const romanoUpper = romano.toUpperCase();
    if (romanos.includes(romanoUpper)) {
      return `${antes}\n\n${romanoUpper} – `;
    }
    return match;
  });
  
  r = r.replace(/\n([IVXLCDM]{1,5})\s*[-−]\s*/g, (match, romano) => {
    const romanoUpper = romano.toUpperCase();
    if (romanos.includes(romanoUpper)) {
      return `\n${romanoUpper} – `;
    }
    return match;
  });
  
  r = r.replace(/([.;:,)\w])\s*([a-z]\))/gi, '$1\n\n$2');
  r = r.replace(/\n+([a-z]\))/gi, '\n\n$1');
  
  r = r.replace(/(da\s+República\.?)\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\s]+[A-Z])\s+([A-Z][a-záàâãéèêíïóôõöúç]+)/g, 
    '$1\n\n$2\n\n$3');
  r = r.replace(/([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]{4,}(?:\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]+)+)\s+([A-Z][a-záàâãéèêíïóôõöúç]+\s+[A-Z][a-záàâãéèêíïóôõöúç\s]+)/g,
    '$1\n\n$2');
  r = r.replace(/([^\n])\s+(Este texto não substitui)/gi, '$1\n\n$2');
  r = r.replace(/([^\n])\s+(ACORDO\s+PARA)/gi, '$1\n\n\n$2');
  r = r.replace(/([^\n])\s+(ACORDAM:)/gi, '$1\n\n$2');
  
  r = r.replace(/\n{5,}/g, '\n\n\n');
  r = r.split('\n').map(linha => linha.trim()).join('\n');
  r = r.trim();
  r = r.replace(/  +/g, ' ');
  
  console.log(`[REGEX] Formatação concluída: ${r.length} caracteres`);
  return r;
}

// ============================================================
// EXTRAIR ARTIGOS DO TEXTO (100% determinístico - MELHORADO)
// ============================================================
function extrairArtigos(textoFormatado: string): { artigos: Array<{ numero: string; texto: string }>, assinatura: string | null } {
  const artigos: Array<{ numero: string; texto: string }> = [];
  const numerosVistos = new Set<string>();
  let assinatura: string | null = null;
  
  // Extrair assinatura
  const assinaturaMatch = textoFormatado.match(/\n(Brasília,\s*\d+[^\n]*)\n*([\s\S]*?)(LUIZ\s*INÁCIO\s*LULA\s*DA\s*SILVA|JAIR\s*MESSIAS\s*BOLSONARO|MICHEL\s*TEMER|DILMA\s*ROUSSEFF|FERNANDO\s*HENRIQUE\s*CARDOSO)([\s\S]*?)(?:Este texto não substitui|$)/i);
  
  if (assinaturaMatch) {
    const dataBrasilia = assinaturaMatch[1].trim();
    const presidente = assinaturaMatch[3].trim();
    const ministros = assinaturaMatch[4]?.trim() || '';
    
    assinatura = `${dataBrasilia}\n\n${presidente}`;
    if (ministros && ministros.length > 5) {
      const ministrosLimpos = ministros
        .replace(/Este texto não substitui[\s\S]*/i, '')
        .replace(/\*+/g, '')
        .trim();
      if (ministrosLimpos) {
        assinatura += `\n\n${ministrosLimpos}`;
      }
    }
  }
  
  // REGEX ROBUSTA: Captura Art. seguido de número (com possíveis sufixos como º, °, -A, -B)
  const artigoRegex = /(?:^|\n)\s*Art\.?\s*(\d+[A-Z]?)[º°]?\s*[-–.]?\s*([\s\S]*?)(?=\n\s*Art\.?\s*\d+[A-Z]?[º°]?\s*[-–.]?\s|\nBrasília,|\nEste texto não substitui|$)/gi;
  
  let match;
  while ((match = artigoRegex.exec(textoFormatado)) !== null) {
    const numero = match[1].replace(/[º°]/g, '');
    let texto = match[2]?.trim() || '';
    
    if (numero && texto) {
      const numeroNormalizado = `Art. ${numero}`;
      
      if (numerosVistos.has(numero)) {
        continue;
      }
      numerosVistos.add(numero);
      
      // Limpar texto
      texto = texto.replace(/\n\*\s*$/g, '').trim();
      texto = texto.replace(/^\*\s*$/gm, '').trim();
      texto = texto.replace(/\n(LUIZ\s*INÁCIO\s*LULA\s*DA\s*SILVA|JAIR\s*MESSIAS\s*BOLSONARO|MICHEL\s*TEMER|DILMA\s*ROUSSEFF|FERNANDO\s*HENRIQUE\s*CARDOSO)[\s\S]*$/gis, '').trim();
      
      if (texto && texto !== '*' && texto.length > 3) {
        artigos.push({
          numero: numeroNormalizado,
          texto: texto
        });
      }
    }
  }
  
  console.log(`[EXTRAÇÃO] ${artigos.length} artigos encontrados via regex`);
  return { artigos, assinatura };
}

// ============================================================
// CALCULAR MÉTRICAS DE EXTRAÇÃO
// ============================================================
function calcularMetricas(artigos: Array<{ numero: string; texto: string }>): { 
  total: number; 
  max: number; 
  lacunas: number; 
  percentual: number;
  precisaGemini: boolean;
} {
  const numerosExtraidos = artigos.map(a => {
    const match = a.numero.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }).filter(n => n > 0);
  
  const max = Math.max(...numerosExtraidos, 0);
  const total = artigos.length;
  const lacunas = max - total;
  const percentual = max > 0 ? (total / max) * 100 : 100;
  
  // Só precisa Gemini se tiver lacunas significativas (>10% faltando OU >5 artigos faltando)
  const precisaGemini = percentual < 90 && lacunas > 5;
  
  return { total, max, lacunas, percentual, precisaGemini };
}

// ============================================================
// VALIDAÇÃO FINAL COM GEMINI (APENAS SE HOUVER LACUNAS)
// ============================================================
async function corrigirComGemini(
  artigos: Array<{ numero: string; texto: string }>,
  textoOriginal: string,
  metricas: { total: number; max: number; lacunas: number; percentual: number }
): Promise<{ artigos: Array<{ numero: string; texto: string }>; corrigido: boolean; detalhes: string }> {
  
  if (GEMINI_KEYS.length === 0) {
    return { artigos, corrigido: false, detalhes: 'Sem API keys Gemini' };
  }
  
  console.log(`🔧 Chamando Gemini para corrigir ${metricas.lacunas} artigos faltantes...`);
  
  const artigosJson = JSON.stringify(artigos.slice(0, 30), null, 2);
  
  const prompt = `Você é um especialista em legislação brasileira.

TAREFA: Completar a extração de artigos que está incompleta.

ARTIGOS JÁ EXTRAÍDOS (${metricas.total} de ~${metricas.max}):
${artigosJson}

TEXTO ORIGINAL (para encontrar artigos faltantes):
${textoOriginal.substring(0, 80000)}

INSTRUÇÕES:
1. Encontre APENAS os artigos faltantes
2. Retorne JSON array com TODOS os artigos (existentes + faltantes)
3. Formato: [{"numero": "Art. X", "texto": "conteúdo"}]
4. Não inclua explicações

JSON:`;

  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 65536,
            }
          })
        }
      );
      
      if (!response.ok) {
        console.error(`❌ Gemini erro ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const textoResposta = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const jsonMatch = textoResposta.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const artigosCorrigidos = JSON.parse(jsonMatch[0]) as Array<{ numero: string; texto: string }>;
          
          if (Array.isArray(artigosCorrigidos) && artigosCorrigidos.length > artigos.length) {
            console.log(`✅ Gemini corrigiu: ${artigos.length} → ${artigosCorrigidos.length} artigos`);
            return { 
              artigos: artigosCorrigidos, 
              corrigido: true, 
              detalhes: `Gemini adicionou ${artigosCorrigidos.length - artigos.length} artigos faltantes` 
            };
          }
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError);
        }
      }
      
      return { artigos, corrigido: false, detalhes: 'Gemini não encontrou artigos faltantes' };
      
    } catch (error) {
      console.error('❌ Erro Gemini:', error);
      continue;
    }
  }
  
  return { artigos, corrigido: false, detalhes: 'Falha ao chamar Gemini' };
}

// ============================================================
// HANDLER PRINCIPAL - PIPELINE 100% REGEX + GEMINI OPCIONAL
// ============================================================
Deno.serve(async (req) => {
  console.log(`📍 formatar-lei-push@${REVISION}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leiId, textoBruto: textoDireto } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Modo streaming
    if (textoDireto && !leiId) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[PIPELINE v5] 100% REGEX + Gemini apenas se necessário');
      console.log(`[ENTRADA] ${textoDireto.length} caracteres`);
      
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // ETAPA 1: PRÉ-PROCESSAMENTO
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'etapa', etapa: 1, nome: 'Pré-processamento', status: 'processando'
            })}\n\n`));
            
            const textoPreLimpo = preLimparHTML(textoDireto);
            const { textoSemAnexos, anexos } = extrairAnexosComoLinks(textoPreLimpo);
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'etapa', etapa: 1, nome: 'Pré-processamento', status: 'completo',
              info: `${anexos.length} anexos`
            })}\n\n`));
            
            // ETAPA 2: FORMATAÇÃO (REGEX)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'etapa', etapa: 2, nome: 'Formatação', status: 'processando'
            })}\n\n`));
            
            const textoFormatado = formatarLeiRegex(textoSemAnexos);
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'etapa', etapa: 2, nome: 'Formatação', status: 'completo',
              caracteres: textoFormatado.length
            })}\n\n`));
            
            // ETAPA 3: EXTRAÇÃO DE ARTIGOS (REGEX)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'etapa', etapa: 3, nome: 'Extração de Artigos', status: 'processando' 
            })}\n\n`));
            
            let { artigos, assinatura } = extrairArtigos(textoFormatado);
            const metricas = calcularMetricas(artigos);
            
            console.log(`📊 Métricas: ${metricas.total}/${metricas.max} (${metricas.percentual.toFixed(1)}%), lacunas: ${metricas.lacunas}`);
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'etapa', etapa: 3, nome: 'Extração de Artigos', status: 'completo',
              info: `${artigos.length} artigos (${metricas.percentual.toFixed(0)}%)`
            })}\n\n`));
            
            // ETAPA 4: VALIDAÇÃO GEMINI (APENAS SE NECESSÁRIO)
            let detalhesProcessamento = `Extração regex: ${metricas.total}/${metricas.max} artigos`;
            let corrigidoPorGemini = false;
            
            if (metricas.precisaGemini) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'etapa', etapa: 4, nome: 'Correção Gemini', status: 'processando',
                info: `${metricas.lacunas} artigos faltantes`
              })}\n\n`));
              
              const resultado = await corrigirComGemini(artigos, textoDireto, metricas);
              artigos = resultado.artigos;
              corrigidoPorGemini = resultado.corrigido;
              detalhesProcessamento = resultado.detalhes;
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'etapa', etapa: 4, nome: 'Correção Gemini', status: 'completo',
                info: corrigidoPorGemini ? `Corrigido: ${artigos.length} artigos` : 'Sem correções'
              })}\n\n`));
            } else {
              // Pular etapa 4 - extração já está completa
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'etapa', etapa: 4, nome: 'Validação', status: 'completo',
                info: `✓ Completo (${metricas.percentual.toFixed(0)}%)`
              })}\n\n`));
              detalhesProcessamento = `Extração completa: ${metricas.total} artigos`;
            }
            
            // RESULTADO FINAL
            console.log(`[PIPELINE COMPLETO] ${artigos.length} artigos, ${anexos.length} anexos`);
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete', 
              texto: textoFormatado,
              textoLimpo: textoPreLimpo,
              textoFormatado: textoFormatado,
              artigos: artigos,
              assinatura: assinatura,
              anexos: anexos,
              total_artigos: artigos.length,
              total_anexos: anexos.length,
              corrigidoPorGemini: corrigidoPorGemini,
              detalhesProcessamento: detalhesProcessamento
            })}\n\n`));
            
            controller.close();
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('[ERRO]', errMsg);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`));
            controller.close();
          }
        }
      });
      
      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    // Modo com leiId
    if (!leiId) {
      return new Response(
        JSON.stringify({ success: false, error: 'leiId ou textoBruto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: lei, error: leiError } = await supabase
      .from('leis_push_2025')
      .select('*')
      .eq('id', leiId)
      .single();

    if (leiError || !lei) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lei não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const textoBruto = lei.texto_bruto;
    if (!textoBruto) {
      return new Response(
        JSON.stringify({ success: false, error: 'Texto bruto não disponível' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[LEI ${leiId}] Processando...`);
    
    // Pipeline regex
    const textoPreLimpo = preLimparHTML(textoBruto);
    const { textoSemAnexos, anexos } = extrairAnexosComoLinks(textoPreLimpo);
    const textoFormatado = formatarLeiRegex(textoSemAnexos);
    
    let { artigos, assinatura } = extrairArtigos(textoFormatado);
    const metricas = calcularMetricas(artigos);
    
    let corrigidoPorGemini = false;
    if (metricas.precisaGemini) {
      const resultado = await corrigirComGemini(artigos, textoBruto, metricas);
      artigos = resultado.artigos;
      corrigidoPorGemini = resultado.corrigido;
    }

    // Salvar
    const { error: updateError } = await supabase
      .from('leis_push_2025')
      .update({
        texto_formatado: textoFormatado,
        artigos: artigos,
        assinatura: assinatura,
        anexos: anexos,
        status: 'aprovado'
      })
      .eq('id', leiId);

    if (updateError) throw updateError;

    console.log(`[LEI ${leiId}] Concluído: ${artigos.length} artigos`);

    return new Response(
      JSON.stringify({
        success: true,
        texto: textoFormatado,
        artigos: artigos,
        assinatura: assinatura,
        anexos: anexos,
        total_artigos: artigos.length,
        total_anexos: anexos.length,
        corrigidoPorGemini: corrigidoPorGemini
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERRO GERAL]', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
