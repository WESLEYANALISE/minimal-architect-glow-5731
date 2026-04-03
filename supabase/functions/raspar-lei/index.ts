import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtigoExtraido {
  "Número do Artigo": string | null;
  Artigo: string;
  ordem_artigo: number;
}

interface LacunaArtigo {
  de: number;
  ate: number;
  quantidade: number;
  motivo?: string;
  tipo?: 'revogado' | 'vetado' | 'nao_localizado' | 'nao_regulamentado';
}

interface AnaliseArtigos {
  primeiroArtigo: string | null;
  ultimoArtigo: string | null;
  ultimoNumero: number;
  artigosEsperados: number;
  artigosEncontrados: number;
  percentualExtracao: number;
  lacunas: LacunaArtigo[];
  relatorioGemini?: string;
  artigosNoTextoOriginal?: number;
  divergencia?: number;
}

// Chaves Gemini com fallback
const GEMINI_KEYS = [
  'GEMINI_KEY_1',
  'GEMINI_KEY_2',
];

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA REMOVER TEXTOS TACHADOS (STRIKE/LINE-THROUGH) USANDO DOM PARSING
// O Planalto usa <strike> e text-decoration:line-through para marcar textos
// revogados ou alterados. Esses textos NÃO devem ser extraídos.
// 
// TÉCNICA: Usa deno-dom para parsear o HTML como DOM real, remover elementos
// tachados, e depois extrair o textContent - simulando "copiar texto com mouse"
// ═══════════════════════════════════════════════════════════════════════════
function removerTextosTachadosComDOM(html: string, logCallback?: (msg: string) => void): { textoLimpo: string; removidos: number; sucesso: boolean } {
  const log = logCallback || ((msg: string) => console.log(msg));
  
  log('🔍 [DOM] Iniciando remoção de textos tachados via DOM parsing...');
  
  try {
    // Parse o HTML como documento
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    if (!doc || !doc.body) {
      log('⚠️ [DOM] Falha ao parsear HTML, documento vazio');
      return { textoLimpo: '', removidos: 0, sucesso: false };
    }
    
    let totalRemovidos = 0;
    
    // 1. Remove todos os elementos <strike>
    const strikeElements = doc.querySelectorAll('strike');
    if (strikeElements.length > 0) {
      log(`   📍 Encontrados ${strikeElements.length} elementos <strike>`);
      strikeElements.forEach((el: Element) => {
        el.remove();
        totalRemovidos++;
      });
    }
    
    // 2. Remove todos os elementos <s>
    const sElements = doc.querySelectorAll('s');
    if (sElements.length > 0) {
      log(`   📍 Encontrados ${sElements.length} elementos <s>`);
      sElements.forEach((el: Element) => {
        el.remove();
        totalRemovidos++;
      });
    }
    
    // 3. Remove todos os elementos <del>
    const delElements = doc.querySelectorAll('del');
    if (delElements.length > 0) {
      log(`   📍 Encontrados ${delElements.length} elementos <del>`);
      delElements.forEach((el: Element) => {
        el.remove();
        totalRemovidos++;
      });
    }
    
    // 4. Remove elementos com style contendo "line-through"
    // Percorre TODOS os elementos e verifica o style
    const allElements = doc.querySelectorAll('*');
    let lineThoughCount = 0;
    allElements.forEach((el: Element) => {
      const style = el.getAttribute('style') || '';
      if (style.toLowerCase().includes('line-through')) {
        el.remove();
        lineThoughCount++;
        totalRemovidos++;
      }
    });
    if (lineThoughCount > 0) {
      log(`   📍 Encontrados ${lineThoughCount} elementos com style="line-through"`);
    }
    
    // 5. Remove elementos com classes comuns de tachado
    const classPatterns = ['tachado', 'strikethrough', 'revogado', 'deleted', 'struck'];
    classPatterns.forEach(className => {
      const elements = doc.querySelectorAll(`.${className}`);
      if (elements.length > 0) {
        log(`   📍 Encontrados ${elements.length} elementos com class="${className}"`);
        elements.forEach((el: Element) => {
          el.remove();
          totalRemovidos++;
        });
      }
    });
    
    // 6. Extrai o texto limpo (como copiar com mouse!)
    // O textContent ignora tags e retorna apenas o texto visível
    let textoLimpo = doc.body.textContent || '';
    
    // 7. NORMALIZA com quebras de linha APENAS em elementos jurídicos
    // Remove TODAS as quebras de linha e espaços extras primeiro
    textoLimpo = textoLimpo
      .replace(/[\r\n]+/g, ' ')  // Remove todas as quebras
      .replace(/\s{2,}/g, ' ')   // Remove espaços múltiplos
      .trim();
    
    // 8. Insere quebras APENAS antes de elementos jurídicos
    textoLimpo = textoLimpo
      // Títulos estruturais (com 2 quebras antes)
      .replace(/\s+(TÍTULO\s+[IVXLCDM]+)/gi, '\n\n$1')
      .replace(/\s+(CAPÍTULO\s+[IVXLCDM]+)/gi, '\n\n$1')
      .replace(/\s+(SEÇÃO\s+[IVXLCDM]+)/gi, '\n\n$1')
      .replace(/\s+(SUBSEÇÃO\s+[IVXLCDM]+)/gi, '\n\n$1')
      .replace(/\s+(LIVRO\s+[IVXLCDM]+)/gi, '\n\n$1')
      .replace(/\s+(PARTE\s+(GERAL|ESPECIAL|[IVXLCDM]+))/gi, '\n\n$1')
      
      // Artigos: "Art. 1º", "Art. 10", etc. (com 2 quebras antes)
      .replace(/\s+(Art\.?\s*\d+[º°]?[ºª]?[-–]?[A-Z]?)/gi, '\n\n$1')
      
      // Parágrafos: "§ 1º", "§ 2º" (com 1 quebra antes)
      .replace(/\s+(§\s*\d+[º°]?)/g, '\n$1')
      
      // Parágrafo único (com 1 quebra antes)
      .replace(/\s+(Parágrafo\s+único)/gi, '\n$1')
      
      // Incisos romanos: "I -", "II -", "III -", "IV -" etc.
      // Captura apenas romanos válidos seguidos de hífen/travessão
      .replace(/\s+([IVXLCDM]+\s*[-–—])/g, '\n$1')
      
      // Alíneas: "a)", "b)", "c)" etc.
      .replace(/\s+([a-z]\))/g, '\n$1')
      
      // Limpa espaços extras no início de cada linha
      .split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n')
      
      // Remove linhas vazias excessivas (mais de 2 seguidas)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    if (totalRemovidos > 0) {
      log(`✅ [DOM] Removidos ${totalRemovidos} elementos tachados`);
      log(`   📊 Texto extraído e normalizado: ${textoLimpo.length} caracteres`);
    } else {
      log(`✅ [DOM] Nenhum elemento tachado encontrado, texto normalizado`);
    }
    
    return { textoLimpo, removidos: totalRemovidos, sucesso: true };
    
  } catch (error) {
    log(`❌ [DOM] Erro no parsing: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return { textoLimpo: '', removidos: 0, sucesso: false };
  }
}

// Fallback: Função original com regex (usada se DOM parsing falhar)
function removerTextosTachadosRegex(html: string, logCallback?: (msg: string) => void): string {
  const log = logCallback || ((msg: string) => console.log(msg));
  
  log('🔍 [Regex Fallback] Removendo textos tachados com regex...');
  
  let htmlLimpo = html;
  let totalRemovidos = 0;
  
  // 1. Remover conteúdo dentro de tags <strike>...</strike>
  const strikeMatches = htmlLimpo.match(/<strike[^>]*>[\s\S]*?<\/strike>/gi) || [];
  if (strikeMatches.length > 0) {
    log(`   📍 Encontradas ${strikeMatches.length} tags <strike>`);
    htmlLimpo = htmlLimpo.replace(/<strike[^>]*>[\s\S]*?<\/strike>/gi, '');
    totalRemovidos += strikeMatches.length;
  }
  
  // 2. Remover conteúdo dentro de tags <s>...</s>
  const sMatches = htmlLimpo.match(/<s\b[^>]*>[\s\S]*?<\/s>/gi) || [];
  if (sMatches.length > 0) {
    log(`   📍 Encontradas ${sMatches.length} tags <s>`);
    htmlLimpo = htmlLimpo.replace(/<s\b[^>]*>[\s\S]*?<\/s>/gi, '');
    totalRemovidos += sMatches.length;
  }
  
  // 3. Remover conteúdo dentro de tags <del>...</del>
  const delMatches = htmlLimpo.match(/<del[^>]*>[\s\S]*?<\/del>/gi) || [];
  if (delMatches.length > 0) {
    log(`   📍 Encontradas ${delMatches.length} tags <del>`);
    htmlLimpo = htmlLimpo.replace(/<del[^>]*>[\s\S]*?<\/del>/gi, '');
    totalRemovidos += delMatches.length;
  }
  
  // 4. Remover elementos com style="text-decoration:line-through"
  const lineThroughPattern = /<([a-z][a-z0-9]*)\b[^>]*style\s*=\s*["'][^"']*text-decoration\s*:\s*line-through[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi;
  const lineThroughMatches = htmlLimpo.match(lineThroughPattern) || [];
  if (lineThroughMatches.length > 0) {
    log(`   📍 Encontrados ${lineThroughMatches.length} elementos com text-decoration:line-through`);
    htmlLimpo = htmlLimpo.replace(lineThroughPattern, '');
    totalRemovidos += lineThroughMatches.length;
  }
  
  if (totalRemovidos > 0) {
    log(`✅ [Regex] Removidos ${totalRemovidos} textos tachados`);
  } else {
    log(`✅ [Regex] Nenhum texto tachado encontrado`);
  }
  
  return htmlLimpo;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FETCH DIRETO DO PLANALTO (sem Firecrawl)
// Faz fetch direto da URL e retorna HTML bruto para processamento com DOM parsing
// ═══════════════════════════════════════════════════════════════════════════════
async function fetchPlanaltoDirecto(
  urlPlanalto: string,
  sendLog?: (msg: string) => Promise<void>
): Promise<{ html: string; sucesso: boolean; erro?: string }> {
  const log = sendLog || (async (msg: string) => console.log(msg));
  
  await log(`🌐 Fazendo fetch direto de: ${urlPlanalto}`);
  
  try {
    const response = await fetch(urlPlanalto, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Accept-Charset': 'utf-8, iso-8859-1;q=0.5',
      },
    });

    if (!response.ok) {
      await log(`❌ Fetch falhou com status ${response.status}`);
      return { html: '', sucesso: false, erro: `HTTP ${response.status}` };
    }

    // Planalto usa ISO-8859-1 em muitas páginas
    const contentType = response.headers.get('content-type') || '';
    let html: string;
    
    if (contentType.includes('iso-8859-1') || contentType.includes('latin1') || contentType.includes('windows-1252')) {
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      html = decoder.decode(buffer);
    } else {
      // Tenta UTF-8 primeiro, depois fallback
      const buffer = await response.arrayBuffer();
      try {
        html = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
      } catch {
        html = new TextDecoder('iso-8859-1').decode(buffer);
      }
    }

    // Verifica se o HTML tem conteúdo relevante
    if (!html || html.length < 500) {
      await log(`⚠️ HTML muito curto: ${html?.length || 0} chars`);
      return { html: '', sucesso: false, erro: 'Conteúdo muito curto' };
    }

    await log(`✅ Fetch direto OK: ${html.length} caracteres`);
    return { html, sucesso: true };
    
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    await log(`❌ Erro no fetch direto: ${msg}`);
    return { html: '', sucesso: false, erro: msg };
  }
}

// Função para converter HTML limpo para texto simples (para extração)
function htmlParaTexto(html: string): string {
  // Remove scripts e styles
  let texto = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  texto = texto.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Substitui <br>, <p>, <div>, <li> por quebras de linha
  texto = texto.replace(/<br\s*\/?>/gi, '\n');
  texto = texto.replace(/<\/p>/gi, '\n\n');
  texto = texto.replace(/<\/div>/gi, '\n');
  texto = texto.replace(/<\/li>/gi, '\n');
  texto = texto.replace(/<\/tr>/gi, '\n');
  texto = texto.replace(/<\/h[1-6]>/gi, '\n\n');
  
  // Remove todas as tags restantes
  texto = texto.replace(/<[^>]+>/g, '');
  
  // Decodifica entidades HTML comuns
  texto = texto.replace(/&nbsp;/gi, ' ');
  texto = texto.replace(/&amp;/gi, '&');
  texto = texto.replace(/&lt;/gi, '<');
  texto = texto.replace(/&gt;/gi, '>');
  texto = texto.replace(/&quot;/gi, '"');
  texto = texto.replace(/&#39;/gi, "'");
  texto = texto.replace(/&ordm;/gi, 'º');
  texto = texto.replace(/&ordf;/gi, 'ª');
  texto = texto.replace(/&sect;/gi, '§');
  texto = texto.replace(/&#\d+;/g, ''); // Remove outras entidades numéricas
  
  // Normaliza espaços e quebras de linha
  texto = texto.replace(/\r\n/g, '\n');
  texto = texto.replace(/\r/g, '\n');
  texto = texto.replace(/[ \t]+/g, ' ');
  texto = texto.replace(/\n +/g, '\n');
  texto = texto.replace(/ +\n/g, '\n');
  texto = texto.replace(/\n{3,}/g, '\n\n');
  
  return texto.trim();
}

// Função para chamar Gemini com fallback entre chaves
async function chamarGeminiComFallback(prompt: string): Promise<string> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🤖 INICIANDO PROCESSAMENTO COM GEMINI');
  console.log('═══════════════════════════════════════════════════════════');
  
  for (const keyName of GEMINI_KEYS) {
    const apiKey = Deno.env.get(keyName);
    if (!apiKey) {
      console.log(`⚠️ Chave ${keyName} não configurada, pulando...`);
      continue;
    }

    try {
      console.log(`🔑 Tentando Gemini com ${keyName}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 65000,
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro com ${keyName}: ${response.status} - ${errorText}`);
        if (response.status === 429 || response.status === 403) {
          console.log(`⏳ Rate limit ou forbidden com ${keyName}, tentando próxima...`);
          continue;
        }
        throw new Error(`API Gemini retornou ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        console.error(`❌ Resposta vazia com ${keyName}`);
        continue;
      }

      console.log(`✅ Sucesso com ${keyName} - Resposta: ${text.length} caracteres`);
      return text;
    } catch (error) {
      console.error(`❌ Exceção com ${keyName}:`, error);
      continue;
    }
  }
  
  throw new Error('Todas as chaves Gemini falharam');
}

// Função para limpar markdown com Gemini
async function limparMarkdownComGemini(markdown: string, logCallback?: (msg: string) => void): Promise<string> {
  const log = logCallback || ((msg: string) => console.log(msg));
  
  log('───────────────────────────────────────────────────────────');
  log('🐱 GATO ANALISANDO... Enviando texto para ajuste de estrutura');
  log(`📊 Tamanho do texto original: ${markdown.length} caracteres`);
  log('───────────────────────────────────────────────────────────');

  // Contar artigos ANTES da limpeza para verificação
  const artigosAntes = (markdown.match(/Art\.?\s*\d+/gi) || []).length;
  log(`🐱 Artigos detectados ANTES: ${artigosAntes}`);

  const prompt = `TAREFA ESPECÍFICA: Ajustar APENAS a ESTRUTURA e FORMATAÇÃO do texto legal abaixo.

O QUE FAZER:
1. Juntar palavras quebradas (ex: "pro-\\nteção" → "proteção", "compe-\\ntência" → "competência")
2. Garantir que § (parágrafos) fiquem em linhas separadas
3. Manter (VETADO) e (Revogado) na MESMA linha do artigo (nunca em linha separada)
4. Garantir que TÍTULO, CAPÍTULO, SEÇÃO fiquem em linhas separadas
5. Remover caracteres estranhos como \\\\, ~~, ;~

O QUE NÃO FAZER:
- NÃO remover NENHUM texto ou artigo
- NÃO adicionar parênteses ou referências
- NÃO alterar o conteúdo das leis
- NÃO remover nenhum inciso, alínea ou parágrafo

CONTAGEM: O texto tem ${artigosAntes} artigos - O RESULTADO DEVE TER EXATAMENTE ${artigosAntes} ARTIGOS!

TEXTO ORIGINAL:
${markdown}

TEXTO COM ESTRUTURA AJUSTADA (mantenha TODO o conteúdo):`;

  try {
    log('🐱 Gato processando com IA...');
    const textoLimpo = await chamarGeminiComFallback(prompt);
    
    // VERIFICAÇÃO CRÍTICA: Contar artigos DEPOIS da limpeza
    const artigosDepois = (textoLimpo.match(/Art\.?\s*\d+/gi) || []).length;
    log(`🐱 Artigos detectados DEPOIS: ${artigosDepois}`);
    
    // Se perdeu artigos, usar texto original!
    if (artigosDepois < artigosAntes * 0.9) { // Tolerância de 10%
      log(`🐱⚠️ ALERTA CRÍTICO: IA REMOVEU artigos! (${artigosAntes} → ${artigosDepois})`);
      log(`🐱🔄 REVERTENDO para texto original para não perder artigos`);
      return markdown; // Retorna original para não perder artigos
    }
    
    // Se o texto ficou muito menor, também reverter
    if (textoLimpo.length < markdown.length * 0.7) {
      log(`🐱⚠️ ALERTA: Texto ficou muito menor! (${markdown.length} → ${textoLimpo.length} chars)`);
      log(`🐱🔄 REVERTENDO para texto original para não perder conteúdo`);
      return markdown;
    }
    
    log('───────────────────────────────────────────────────────────');
    log(`🐱✅ ESTRUTURA AJUSTADA COM SUCESSO (verificação OK)`);
    log(`📊 Tamanho após ajuste: ${textoLimpo.length} caracteres`);
    log('───────────────────────────────────────────────────────────');
    return textoLimpo;
  } catch (error) {
    log(`🐱❌ Erro ao ajustar com IA, usando texto original: ${error}`);
    return markdown;
  }
}

// Função para validar e corrigir artigos formatados com Gemini
async function validarArtigosComGemini(artigos: ArtigoExtraido[], textoOriginal: string, logCallback: (msg: string) => void): Promise<ArtigoExtraido[]> {
  logCallback('───────────────────────────────────────────────────────────');
  logCallback('🔍 ETAPA 3.5: Validando e completando artigos com Gemini...');
  logCallback('───────────────────────────────────────────────────────────');

  // Identificar artigos com problemas
  const artigosComProblemas: Array<{ artigo: ArtigoExtraido; problema: string }> = [];
  
  for (const artigo of artigos) {
    if (!artigo["Número do Artigo"]) continue;
    
    const texto = artigo.Artigo;
    const problemas: string[] = [];
    
    // Detectar textos incompletos marcados
    if (texto.includes('[TEXTO INCOMPLETO]') || texto.includes('TEXTO INCOMPLETO')) {
      problemas.push('texto_incompleto_marcado');
    }
    
    // Detectar textos que terminam abruptamente (sem pontuação final)
    if (!/[.;:)\]]$/.test(texto.trim()) && texto.length > 50) {
      problemas.push('texto_cortado');
    }
    
    // Detectar "(VETADO)" em linha separada
    if (/\n\s*\(VETADO\)/i.test(texto)) {
      problemas.push('vetado_linha_separada');
    }
    
    // Detectar referências "(Incluído pela Lei...)" que ainda restaram
    if (/\(Inclu[íi]d[oa]\s+pel/i.test(texto) || /\[\s*\(Inclu[íi]d/i.test(texto)) {
      problemas.push('referencia_incluido');
    }
    
    // Detectar incisos vazios ou cortados
    if (/[IVXLCDM]+\s*[-–]\s*[.;]?\s*$/m.test(texto) || /[a-z]\)\s*[.;]?\s*$/m.test(texto)) {
      problemas.push('inciso_vazio');
    }
    
    if (problemas.length > 0) {
      artigosComProblemas.push({ artigo, problema: problemas.join(', ') });
    }
  }

  if (artigosComProblemas.length === 0) {
    logCallback('✅ Nenhum problema detectado nos artigos');
    return artigos;
  }

  logCallback(`⚠️ ${artigosComProblemas.length} artigos com problemas detectados`);
  
  // Limitar a 20 artigos por vez para não sobrecarregar
  const artigosParaCorrigir = artigosComProblemas.slice(0, 20);
  
  for (const { artigo, problema } of artigosParaCorrigir) {
    logCallback(`   📋 Art. ${artigo["Número do Artigo"]}: ${problema}`);
  }

  const prompt = `Você é um especialista em formatação de textos legais brasileiros.

TAREFA: Corrija os artigos problemáticos abaixo. BUSQUE NO TEXTO ORIGINAL para completar partes faltantes.

PROBLEMAS A CORRIGIR:
1. **[TEXTO INCOMPLETO]**: Busque no texto original e complete o artigo
2. **Texto cortado**: Complete buscando no original
3. **(VETADO) em linha separada**: Mova para a mesma linha do número do artigo
4. **Referências "(Incluído pela Lei nº X)"**: REMOVA completamente
5. **Incisos vazios ou cortados**: Complete buscando no original

TEXTO ORIGINAL (busque aqui os textos faltantes):
${textoOriginal.substring(0, 25000)}

ARTIGOS COM PROBLEMAS:
${JSON.stringify(artigosParaCorrigir.map(({ artigo, problema }) => ({
  num: artigo["Número do Artigo"],
  problema,
  textoAtual: artigo.Artigo.substring(0, 800)
})), null, 2)}

RESPONDA APENAS EM JSON VÁLIDO:
{
  "correcoes": [
    {
      "num": "1º",
      "problemasCorrigidos": ["vetado_linha_separada", "referencia_incluido"],
      "textoCorrigido": "Art. 1º (VETADO). [texto completo e corrigido]",
      "observacao": "Movido (VETADO) para linha do artigo, removida referência à Lei 12.727"
    }
  ],
  "relatorio": {
    "totalAnalisados": 5,
    "totalCorrigidos": 3,
    "resumo": "Foram corrigidos 3 artigos: 2 com (VETADO) em linha separada, 1 com texto incompleto completado."
  }
}

REGRAS:
- Se encontrar o texto completo no original, USE-O
- Remova TODAS as referências "(Incluído pela Lei...)", "(Redação dada...)", etc.
- Mantenha APENAS: (VETADO), (Revogado)
- O "(VETADO)" deve ficar logo após o número do artigo: "Art. 1º (VETADO)."`;

  try {
    const resposta = await chamarGeminiComFallback(prompt);
    
    // Parsear resposta JSON
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logCallback('⚠️ Resposta da IA não é JSON válido, mantendo artigos originais');
      return artigos;
    }

    const resultado = JSON.parse(jsonMatch[0]);
    const correcoes = resultado.correcoes || [];
    const relatorio = resultado.relatorio;
    
    if (correcoes.length === 0) {
      logCallback('✅ IA não encontrou correções necessárias');
      return artigos;
    }

    logCallback(`\n🔧 APLICANDO ${correcoes.length} CORREÇÕES:`);

    // Aplicar correções
    const artigosCorrigidos = artigos.map(artigo => {
      const correcao = correcoes.find((c: any) => c.num === artigo["Número do Artigo"]);
      if (correcao && correcao.textoCorrigido) {
        // Aplicar limpeza adicional no texto corrigido
        let textoFinal = correcao.textoCorrigido
          // Remover referências entre parênteses/colchetes
          .replace(/\[\s*\(Inclu[íi]d[oa][^)]*\)\s*\.?\s*\]/gi, '')
          .replace(/\s*\(Inclu[íi]d[oa]\s+pel[aoe]\s+[^)]+\)\s*\.?/gi, '')
          .replace(/\s*\(Reda[çc][ãa]o\s+dada\s+pel[aoe]\s+[^)]+\)\s*\.?/gi, '')
          .replace(/\[TEXTO INCOMPLETO\]/gi, '')
          .replace(/TEXTO INCOMPLETO/gi, '')
          // Corrigir barras invertidas antes de pontuação (§ 10\. -> § 10.)
          .replace(/\\([.,;:!?)])/g, '$1')
          .replace(/\\/g, '')
          // Juntar "caput" que ficou em linha separada
          .replace(/\n\s*caput\s*\n/gi, ' caput ')
          .replace(/o\s*\n\s*caput/gi, 'o caput')
          .replace(/do\s*\n\s*caput/gi, 'do caput')
          .replace(/ao\s*\n\s*caput/gi, 'ao caput')
          // Corrigir quebras de linha incorretas no meio de frases
          .replace(/([a-záéíóúàâêôãõç,])\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
          // Manter quebras de linha antes de parágrafos e incisos
          .replace(/\s+(§\s*\d+)/g, '\n\n$1')
          .replace(/\s+([IVXLCDM]+\s*[-–])/g, '\n\n$1')
          .replace(/\s+([a-z]\))/g, '\n\n$1')
          // Remover múltiplas quebras de linha
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        
        logCallback(`  ✏️ Art. ${correcao.num}: ${correcao.observacao || correcao.problemasCorrigidos?.join(', ')}`);
        return {
          ...artigo,
          Artigo: textoFinal
        };
      }
      return artigo;
    });

    // Exibir relatório
    if (relatorio) {
      logCallback(`\n📊 RELATÓRIO DE CORREÇÕES:`);
      logCallback(`   Total analisados: ${relatorio.totalAnalisados || artigosParaCorrigir.length}`);
      logCallback(`   Total corrigidos: ${relatorio.totalCorrigidos || correcoes.length}`);
      if (relatorio.resumo) {
        logCallback(`   Resumo: ${relatorio.resumo}`);
      }
    }

    logCallback(`\n✅ Validação concluída: ${correcoes.length} artigos corrigidos`);
    return artigosCorrigidos;

  } catch (error) {
    logCallback(`⚠️ Erro na validação com IA: ${error instanceof Error ? error.message : 'Erro'}, mantendo artigos originais`);
    return artigos;
  }
}

// Função para analisar lacunas na sequência de artigos
function analisarLacunasArtigos(artigos: ArtigoExtraido[], logCallback: (msg: string) => void): AnaliseArtigos {
  logCallback('───────────────────────────────────────────────────────────');
  logCallback('🔍 ETAPA 4: Analisando lacunas na sequência de artigos...');
  logCallback('───────────────────────────────────────────────────────────');

  // Filtrar apenas artigos com número (não cabeçalhos)
  const artigosComNumero = artigos.filter(a => a["Número do Artigo"]);
  
  if (artigosComNumero.length === 0) {
    logCallback('⚠️ Nenhum artigo com número encontrado');
    return {
      primeiroArtigo: null,
      ultimoArtigo: null,
      ultimoNumero: 0,
      artigosEsperados: 0,
      artigosEncontrados: 0,
      percentualExtracao: 0,
      lacunas: []
    };
  }

  // Extrair números dos artigos
  const numerosArtigos: number[] = [];
  const mapaArtigos: Map<number, string> = new Map();
  
  for (const artigo of artigosComNumero) {
    const numStr = artigo["Número do Artigo"]!;
    // Extrai apenas o número base (ignora sufixos como -A, -B)
    const match = numStr.match(/^(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (!numerosArtigos.includes(num)) {
        numerosArtigos.push(num);
        mapaArtigos.set(num, numStr);
      }
    }
  }

  // Ordenar números
  numerosArtigos.sort((a, b) => a - b);

  const primeiroNumero = numerosArtigos[0] || 1;
  let ultimoNumeroCalculado = numerosArtigos[numerosArtigos.length - 1] || 0;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO: Detectar se o "último artigo" é outlier (referência a outra lei)
  // Se houver um salto muito grande entre o penúltimo e último artigo,
  // provavelmente o último é uma referência a outra lei
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (numerosArtigos.length >= 3) {
    const penultimoNumero = numerosArtigos[numerosArtigos.length - 2];
    const antepenultimoNumero = numerosArtigos[numerosArtigos.length - 3];
    
    // Calcula o "passo médio" entre artigos na sequência normal
    const passoNormal = penultimoNumero - antepenultimoNumero;
    const saltoFinal = ultimoNumeroCalculado - penultimoNumero;
    
    // Se o salto final for mais de 10x maior que o passo normal, é outlier
    // Ou se o salto for maior que 50 artigos de uma vez (muito suspeito)
    if ((passoNormal > 0 && saltoFinal > passoNormal * 10) || saltoFinal > 50) {
      logCallback(`⚠️ OUTLIER DETECTADO: Art. ${ultimoNumeroCalculado} parece ser referência a outra lei`);
      logCallback(`   (salto de ${saltoFinal} artigos após Art. ${penultimoNumero})`);
      
      // Encontrar o verdadeiro último artigo (ignorando outliers)
      // Procura a maior sequência contínua
      let verdadeiroUltimo = penultimoNumero;
      for (let i = numerosArtigos.length - 2; i >= 0; i--) {
        const atual = numerosArtigos[i];
        const anterior = numerosArtigos[i - 1] || atual - 1;
        
        // Se o salto for razoável (até 20 artigos), aceita
        if (atual - anterior <= 20) {
          verdadeiroUltimo = atual;
          break;
        }
      }
      
      logCallback(`📊 Último artigo ajustado: ${ultimoNumeroCalculado} → ${verdadeiroUltimo}`);
      ultimoNumeroCalculado = verdadeiroUltimo;
      
      // Remove outliers do array de números
      const indexCorte = numerosArtigos.findIndex(n => n > verdadeiroUltimo);
      if (indexCorte !== -1) {
        const outliersRemovidos = numerosArtigos.splice(indexCorte);
        logCallback(`   Removidos ${outliersRemovidos.length} números outliers: ${outliersRemovidos.slice(0, 5).join(', ')}${outliersRemovidos.length > 5 ? '...' : ''}`);
      }
    }
  }
  
  const ultimoNumero = ultimoNumeroCalculado;
  
  logCallback(`📊 Primeiro artigo: ${primeiroNumero}º | Último artigo: ${ultimoNumero}`);
  logCallback(`📊 Artigos únicos encontrados: ${numerosArtigos.length}`);

  // Calcular esperados (do primeiro ao último)
  const artigosEsperados = ultimoNumero - primeiroNumero + 1;
  const artigosEncontrados = numerosArtigos.length;
  const percentualExtracao = artigosEsperados > 0 
    ? Math.round((artigosEncontrados / artigosEsperados) * 100 * 10) / 10 
    : 100;

  logCallback(`📊 Artigos esperados: ${artigosEsperados} | Encontrados: ${artigosEncontrados} (${percentualExtracao}%)`);

  // Detectar lacunas (apenas até o último número válido)
  const lacunas: LacunaArtigo[] = [];
  
  for (let i = 0; i < numerosArtigos.length - 1; i++) {
    const atual = numerosArtigos[i];
    const proximo = numerosArtigos[i + 1];
    
    // Só considera lacuna se estiver dentro do range válido
    if (proximo <= ultimoNumero && proximo - atual > 1) {
      const lacuna: LacunaArtigo = {
        de: atual + 1,
        ate: proximo - 1,
        quantidade: proximo - atual - 1,
        tipo: 'nao_localizado'
      };
      lacunas.push(lacuna);
      
      if (lacuna.quantidade === 1) {
        logCallback(`⚠️ Lacuna detectada: Art. ${lacuna.de}`);
      } else {
        logCallback(`⚠️ Lacuna detectada: Art. ${lacuna.de} ao ${lacuna.ate} (${lacuna.quantidade} artigos)`);
      }
    }
  }

  // Se começa depois do 1º, considerar lacuna inicial
  if (primeiroNumero > 1) {
    const lacunaInicial: LacunaArtigo = {
      de: 1,
      ate: primeiroNumero - 1,
      quantidade: primeiroNumero - 1,
      tipo: 'nao_localizado'
    };
    lacunas.unshift(lacunaInicial);
    logCallback(`⚠️ Lacuna inicial: Art. 1º ao ${lacunaInicial.ate}º (${lacunaInicial.quantidade} artigos)`);
  }

  if (lacunas.length === 0) {
    logCallback('✅ Nenhuma lacuna detectada - sequência completa!');
  } else {
    const totalFaltando = lacunas.reduce((acc, l) => acc + l.quantidade, 0);
    logCallback(`📊 Total de lacunas: ${lacunas.length} (${totalFaltando} artigos faltando)`);
  }

  return {
    primeiroArtigo: mapaArtigos.get(primeiroNumero) || `${primeiroNumero}º`,
    ultimoArtigo: mapaArtigos.get(ultimoNumero) || `${ultimoNumero}`,
    ultimoNumero,
    artigosEsperados,
    artigosEncontrados,
    percentualExtracao,
    lacunas
  };
}

// Função para explicar lacunas com Gemini
async function explicarLacunasComGemini(
  lacunas: LacunaArtigo[], 
  textoOriginal: string,
  nomeLei: string,
  logCallback: (msg: string) => void
): Promise<{ lacunasAtualizadas: LacunaArtigo[], relatorio: string }> {
  if (lacunas.length === 0) {
    return { lacunasAtualizadas: [], relatorio: 'Nenhuma lacuna detectada.' };
  }

  logCallback('───────────────────────────────────────────────────────────');
  logCallback('🤖 ETAPA 5: Consultando Gemini para explicar lacunas...');
  logCallback('───────────────────────────────────────────────────────────');

  // Preparar lista de lacunas para o prompt
  const listaLacunas = lacunas.map(l => 
    l.quantidade === 1 
      ? `Art. ${l.de}` 
      : `Art. ${l.de} ao ${l.ate}`
  ).join(', ');

  const prompt = `Você é um especialista em legislação brasileira. Analise as lacunas encontradas na extração de artigos desta lei.

LEI: ${nomeLei}

LACUNAS DETECTADAS (artigos não encontrados no texto extraído):
${listaLacunas}

TRECHO DO TEXTO ORIGINAL DA LEI:
${textoOriginal.substring(0, 20000)}

TAREFA:
1. Para cada lacuna, determine o MOTIVO mais provável:
   - "revogado": Se o artigo foi revogado por outra lei (procure por "(Revogado pela Lei...)")
   - "vetado": Se o artigo foi vetado
   - "nao_regulamentado": Se há menção de que não foi regulamentado
   - "nao_localizado": Se não há evidência no texto (possível erro de extração)

2. Gere um relatório BREVE explicando as lacunas

RESPONDA APENAS EM JSON VÁLIDO (sem markdown):
{
  "lacunas": [
    {
      "de": 4,
      "ate": 6,
      "tipo": "revogado",
      "motivo": "Revogados pela Lei nº 9.605/1998 (Lei de Crimes Ambientais)"
    }
  ],
  "relatorio": "O Código de Caça (Lei 5.197/67) teve vários artigos revogados pela Lei de Crimes Ambientais..."
}

IMPORTANTE:
- Seja PRECISO: só marque como "revogado" se REALMENTE houver evidência no texto
- Se não encontrar evidência, marque como "nao_localizado"
- O relatório deve ser conciso (máximo 200 palavras)`;

  try {
    const resposta = await chamarGeminiComFallback(prompt);
    
    // Parsear resposta JSON
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logCallback('⚠️ Resposta da IA não é JSON válido');
      return { 
        lacunasAtualizadas: lacunas, 
        relatorio: 'Não foi possível analisar as lacunas automaticamente.' 
      };
    }

    const resultado = JSON.parse(jsonMatch[0]);
    const lacunasIA = resultado.lacunas || [];
    const relatorio = resultado.relatorio || '';

    // Atualizar lacunas com informações da IA
    const lacunasAtualizadas = lacunas.map(lacuna => {
      const infoIA = lacunasIA.find((l: any) => l.de === lacuna.de);
      if (infoIA) {
        logCallback(`📋 Art. ${lacuna.de}${lacuna.ate !== lacuna.de ? '-' + lacuna.ate : ''}: ${infoIA.tipo?.toUpperCase() || 'N/A'} - ${infoIA.motivo || 'Sem detalhes'}`);
        return {
          ...lacuna,
          tipo: infoIA.tipo || lacuna.tipo,
          motivo: infoIA.motivo || lacuna.motivo
        };
      }
      return lacuna;
    });

    logCallback('✅ Análise de lacunas com Gemini concluída');
    return { lacunasAtualizadas, relatorio };

  } catch (error) {
    logCallback(`⚠️ Erro ao consultar Gemini para lacunas: ${error instanceof Error ? error.message : 'Erro'}`);
    return { 
      lacunasAtualizadas: lacunas, 
      relatorio: 'Erro ao analisar lacunas automaticamente.' 
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SISTEMA DE FALLBACK PROGRESSIVO - 4 MÉTODOS
// ═══════════════════════════════════════════════════════════════════════════════

interface MetodoResultado {
  artigos: ArtigoExtraido[];
  lacunas: LacunaArtigo[];
  markdown: string;
  metodoUsado: number;
  artigosRecuperados: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MÉTODO 2: Raspagem Completa (sem filtro de conteúdo principal)
// ═══════════════════════════════════════════════════════════════════════════════
async function tentarMetodo2(
  urlPlanalto: string,
  _unused: string, // mantém assinatura para compatibilidade
  artigosExistentes: ArtigoExtraido[],
  lacunasAtuais: LacunaArtigo[],
  sendLog: (msg: string) => Promise<void>
): Promise<{ artigos: ArtigoExtraido[]; lacunas: LacunaArtigo[]; markdown: string; artigosRecuperados: number }> {
  
  await sendLog('');
  await sendLog('═══════════════════════════════════════════════════════════');
  await sendLog('🔄 MÉTODO 2: Re-fetch direto do Planalto');
  await sendLog('═══════════════════════════════════════════════════════════');
  
  try {
    const fetchResult = await fetchPlanaltoDirecto(urlPlanalto, sendLog);

    if (!fetchResult.sucesso || !fetchResult.html) {
      await sendLog('❌ Método 2 falhou: erro no fetch direto');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, markdown: '', artigosRecuperados: 0 };
    }

    // Converte HTML para texto limpo (sem tachados)
    const resultadoDOM = removerTextosTachadosComDOM(fetchResult.html, () => {});
    const markdown = resultadoDOM.sucesso && resultadoDOM.textoLimpo.length > 100 
      ? resultadoDOM.textoLimpo 
      : htmlParaTexto(fetchResult.html);



    
    if (!markdown || markdown.length < 100) {
      await sendLog('❌ Método 2: conteúdo insuficiente');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, markdown: '', artigosRecuperados: 0 };
    }

    await sendLog(`📥 Método 2: ${markdown.length} caracteres extraídos`);

    // Extrair artigos do novo conteúdo
    const logsTemp: string[] = [];
    const novosArtigos = extrairConteudo(markdown, (msg) => logsTemp.push(msg));
    
    // Identificar quais artigos faltantes foram encontrados
    const numerosExistentes = new Set(
      artigosExistentes
        .filter(a => a["Número do Artigo"])
        .map(a => parseInt(a["Número do Artigo"]!.replace(/[^\d]/g, '')) || 0)
    );

    const artigosFaltantes: number[] = [];
    for (const lacuna of lacunasAtuais) {
      for (let n = lacuna.de; n <= lacuna.ate; n++) {
        artigosFaltantes.push(n);
      }
    }

    // Verificar quais foram recuperados
    const artigosRecuperadosList: ArtigoExtraido[] = [];
    for (const artigo of novosArtigos) {
      if (!artigo["Número do Artigo"]) continue;
      const num = parseInt(artigo["Número do Artigo"].replace(/[^\d]/g, '')) || 0;
      if (artigosFaltantes.includes(num) && !numerosExistentes.has(num)) {
        artigosRecuperadosList.push(artigo);
        numerosExistentes.add(num);
        await sendLog(`✅ Recuperado: Art. ${artigo["Número do Artigo"]}`);
      }
    }

    if (artigosRecuperadosList.length === 0) {
      await sendLog('⚠️ Método 2: nenhum artigo novo recuperado');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, markdown, artigosRecuperados: 0 };
    }

    // Mesclar artigos
    const artigosMesclados = [...artigosExistentes, ...artigosRecuperadosList]
      .sort((a, b) => (a.ordem_artigo || 0) - (b.ordem_artigo || 0));

    // Recalcular lacunas
    const novasLacunasLogs: string[] = [];
    const novaAnalise = analisarLacunasArtigos(artigosMesclados, (msg) => novasLacunasLogs.push(msg));

    await sendLog(`✅ Método 2: ${artigosRecuperadosList.length} artigos recuperados`);
    await sendLog(`📊 Lacunas restantes: ${novaAnalise.lacunas.length}`);

    return {
      artigos: artigosMesclados,
      lacunas: novaAnalise.lacunas,
      markdown,
      artigosRecuperados: artigosRecuperadosList.length
    };

  } catch (error) {
    await sendLog(`❌ Método 2 erro: ${error instanceof Error ? error.message : 'Erro'}`);
    return { artigos: artigosExistentes, lacunas: lacunasAtuais, markdown: '', artigosRecuperados: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MÉTODO 3: Raspagem Bruta (HTML + múltiplos regex)
// ═══════════════════════════════════════════════════════════════════════════════
async function tentarMetodo3(
  urlPlanalto: string,
  _unused: string,
  artigosExistentes: ArtigoExtraido[],
  lacunasAtuais: LacunaArtigo[],
  sendLog: (msg: string) => Promise<void>
): Promise<{ artigos: ArtigoExtraido[]; lacunas: LacunaArtigo[]; textosBrutos: string[]; artigosRecuperados: number }> {
  
  await sendLog('');
  await sendLog('═══════════════════════════════════════════════════════════');
  await sendLog('🔄 MÉTODO 3: Re-fetch direto + Regex Múltiplos');
  await sendLog('═══════════════════════════════════════════════════════════');
  
  try {
    const fetchResult = await fetchPlanaltoDirecto(urlPlanalto, sendLog);

    if (!fetchResult.sucesso || !fetchResult.html) {
      await sendLog('❌ Método 3 falhou: erro no fetch');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, textosBrutos: [], artigosRecuperados: 0 };
    }

    const html = fetchResult.html;
    const resultadoDOM = removerTextosTachadosComDOM(html, () => {});
    const markdown = resultadoDOM.sucesso && resultadoDOM.textoLimpo.length > 100 
      ? resultadoDOM.textoLimpo 
      : htmlParaTexto(html);
    
    await sendLog(`📥 HTML: ${html.length} chars | Texto: ${markdown.length} chars`);

    // Identificar artigos faltantes
    const numerosExistentes = new Set(
      artigosExistentes
        .filter(a => a["Número do Artigo"])
        .map(a => parseInt(a["Número do Artigo"]!.replace(/[^\d]/g, '')) || 0)
    );

    const artigosFaltantes: number[] = [];
    for (const lacuna of lacunasAtuais) {
      for (let n = lacuna.de; n <= lacuna.ate; n++) {
        artigosFaltantes.push(n);
      }
    }

    await sendLog(`🎯 Buscando ${artigosFaltantes.length} artigos faltantes no HTML bruto...`);

    // Múltiplos padrões regex para tentar encontrar artigos
    const regexPatterns = [
      // Padrão 1: Art. 123 ou Art. 123º
      /Art\.?\s*(\d+)[ºª°]?\s*[-–.]?\s*([^<\n]{10,2000}?)(?=Art\.?\s*\d+|<\/p>|<\/div>|<br|$)/gis,
      // Padrão 2: ARTIGO 123
      /ARTIGO\s+(\d+)\s*[-–.]?\s*([^<\n]{10,2000}?)(?=ARTIGO\s+\d+|<\/p>|<\/div>|$)/gis,
      // Padrão 3: Art 123 (sem ponto)
      /\bArt\s+(\d+)[ºª°]?\s*[-–.]?\s*([^<\n]{10,2000}?)(?=\bArt\s+\d+|<\/p>|<\/div>|$)/gis,
      // Padrão 4: <p>Art. 123 (em tags HTML)
      /<p[^>]*>\s*Art\.?\s*(\d+)[ºª°]?\s*[-–.]?\s*([^<]{10,2000})/gis,
    ];

    const artigosRecuperadosList: ArtigoExtraido[] = [];
    const textosBrutosEncontrados: string[] = [];

    // Buscar no HTML e Markdown combinados
    const textoBusca = html + '\n\n' + markdown;

    for (const pattern of regexPatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(textoBusca)) !== null) {
        const numeroStr = match[1];
        const numero = parseInt(numeroStr) || 0;
        const texto = match[2]?.trim() || '';

        // Verificar se é um artigo faltante
        if (artigosFaltantes.includes(numero) && !numerosExistentes.has(numero) && texto.length > 20) {
          const numeroNormalizado = normalizarNumeroArtigo(numeroStr);
          
          // Limpar texto HTML
          const textoLimpo = texto
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();

          artigosRecuperadosList.push({
            "Número do Artigo": numeroNormalizado,
            Artigo: `Art. ${numeroNormalizado} ${textoLimpo}`,
            ordem_artigo: numero * 1000
          });
          
          textosBrutosEncontrados.push(`Art. ${numeroNormalizado}: ${textoLimpo.substring(0, 200)}...`);
          numerosExistentes.add(numero);
          await sendLog(`✅ Recuperado (regex bruto): Art. ${numeroNormalizado}`);
        }
      }
    }

    if (artigosRecuperadosList.length === 0) {
      await sendLog('⚠️ Método 3: nenhum artigo novo recuperado');
      // Ainda salvar textos brutos para o Método 4
      return { 
        artigos: artigosExistentes, 
        lacunas: lacunasAtuais, 
        textosBrutos: [textoBusca.substring(0, 50000)], // Guardar texto bruto para IA
        artigosRecuperados: 0 
      };
    }

    // Mesclar artigos
    const artigosMesclados = [...artigosExistentes, ...artigosRecuperadosList]
      .sort((a, b) => (a.ordem_artigo || 0) - (b.ordem_artigo || 0));

    // Recalcular lacunas
    const novasLacunasLogs: string[] = [];
    const novaAnalise = analisarLacunasArtigos(artigosMesclados, (msg) => novasLacunasLogs.push(msg));

    await sendLog(`✅ Método 3: ${artigosRecuperadosList.length} artigos recuperados`);
    await sendLog(`📊 Lacunas restantes: ${novaAnalise.lacunas.length}`);

    return {
      artigos: artigosMesclados,
      lacunas: novaAnalise.lacunas,
      textosBrutos: [textoBusca.substring(0, 80000)],
      artigosRecuperados: artigosRecuperadosList.length
    };

  } catch (error) {
    await sendLog(`❌ Método 3 erro: ${error instanceof Error ? error.message : 'Erro'}`);
    return { artigos: artigosExistentes, lacunas: lacunasAtuais, textosBrutos: [], artigosRecuperados: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MÉTODO 4: IA (Gemini) para Preencher Lacunas
// ═══════════════════════════════════════════════════════════════════════════════
async function preencherLacunasComIA(
  artigosExistentes: ArtigoExtraido[],
  lacunasAtuais: LacunaArtigo[],
  textoBruto: string,
  nomeLei: string,
  sendLog: (msg: string) => Promise<void>
): Promise<{ artigos: ArtigoExtraido[]; lacunas: LacunaArtigo[]; artigosRecuperados: number }> {
  
  await sendLog('');
  await sendLog('═══════════════════════════════════════════════════════════');
  await sendLog('🤖 MÉTODO 4: Preenchendo Lacunas com IA (Gemini)');
  await sendLog('═══════════════════════════════════════════════════════════');

  if (lacunasAtuais.length === 0) {
    await sendLog('✅ Não há lacunas para preencher');
    return { artigos: artigosExistentes, lacunas: [], artigosRecuperados: 0 };
  }

  // Construir lista de artigos faltantes
  const artigosFaltantes: number[] = [];
  for (const lacuna of lacunasAtuais) {
    for (let n = lacuna.de; n <= lacuna.ate; n++) {
      artigosFaltantes.push(n);
    }
  }

  // Limitar para não sobrecarregar
  const artigosBuscar = artigosFaltantes.slice(0, 50);
  
  await sendLog(`🎯 Enviando para IA: buscar ${artigosBuscar.length} artigos faltantes`);
  await sendLog(`📋 Artigos: ${artigosBuscar.slice(0, 20).join(', ')}${artigosBuscar.length > 20 ? '...' : ''}`);

  const listaArtigosBuscar = artigosBuscar.map(n => n <= 9 ? `Art. ${n}º` : `Art. ${n}`).join(', ');

  const prompt = `Você é um especialista em legislação brasileira. Analise o texto bruto abaixo e extraia os artigos ESPECÍFICOS que estão faltando.

LEI: ${nomeLei}

ARTIGOS QUE PRECISAM SER ENCONTRADOS:
${listaArtigosBuscar}

TEXTO BRUTO DA LEI (pode conter erros de formatação):
${textoBruto.substring(0, 40000)}

TAREFA:
1. Procure cada artigo da lista acima no texto bruto
2. Para cada artigo encontrado, extraia o texto COMPLETO (incluindo parágrafos, incisos, alíneas)
3. Se um artigo aparecer como "(Revogado)" ou "(Vetado)", INCLUA-O mesmo assim

RESPONDA APENAS EM JSON VÁLIDO (sem markdown):
{
  "artigosEncontrados": [
    {
      "numero": "91",
      "textoCompleto": "Art. 91 O texto completo do artigo aqui...",
      "status": "normal" 
    },
    {
      "numero": "92",
      "textoCompleto": "Art. 92 (Revogado pela Lei nº X)",
      "status": "revogado"
    }
  ],
  "artigosNaoEncontrados": ["93", "94"],
  "observacao": "Os artigos 93 e 94 não foram encontrados no texto fornecido"
}

IMPORTANTE:
- status pode ser: "normal", "revogado", "vetado"
- Se não encontrar um artigo, adicione em "artigosNaoEncontrados"
- O textoCompleto deve começar com "Art. X" e incluir todo o conteúdo do artigo`;

  try {
    const resposta = await chamarGeminiComFallback(prompt);
    
    // Parsear resposta JSON
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await sendLog('⚠️ Resposta da IA não é JSON válido');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0 };
    }

    const resultado = JSON.parse(jsonMatch[0]);
    const artigosIA = resultado.artigosEncontrados || [];
    const naoEncontrados = resultado.artigosNaoEncontrados || [];

    if (artigosIA.length === 0) {
      await sendLog('⚠️ IA não encontrou artigos adicionais');
      if (naoEncontrados.length > 0) {
        await sendLog(`📋 Artigos não localizados: ${naoEncontrados.slice(0, 10).join(', ')}`);
      }
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0 };
    }

    // Adicionar artigos encontrados pela IA
    const numerosExistentes = new Set(
      artigosExistentes
        .filter(a => a["Número do Artigo"])
        .map(a => parseInt(a["Número do Artigo"]!.replace(/[^\d]/g, '')) || 0)
    );

    const artigosRecuperadosList: ArtigoExtraido[] = [];

    for (const artigoIA of artigosIA) {
      const numero = parseInt(artigoIA.numero) || 0;
      if (!numerosExistentes.has(numero) && artigoIA.textoCompleto) {
        const numeroNormalizado = normalizarNumeroArtigo(artigoIA.numero);
        
        artigosRecuperadosList.push({
          "Número do Artigo": numeroNormalizado,
          Artigo: artigoIA.textoCompleto,
          ordem_artigo: numero * 1000
        });
        
        numerosExistentes.add(numero);
        const statusIcon = artigoIA.status === 'revogado' ? '🔴' : artigoIA.status === 'vetado' ? '🟡' : '✅';
        await sendLog(`${statusIcon} IA recuperou: Art. ${numeroNormalizado} (${artigoIA.status || 'normal'})`);
      }
    }

    if (artigosRecuperadosList.length === 0) {
      await sendLog('⚠️ IA não adicionou artigos novos (já existiam)');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0 };
    }

    // Mesclar artigos
    const artigosMesclados = [...artigosExistentes, ...artigosRecuperadosList]
      .sort((a, b) => (a.ordem_artigo || 0) - (b.ordem_artigo || 0));

    // Recalcular lacunas
    const novasLacunasLogs: string[] = [];
    const novaAnalise = analisarLacunasArtigos(artigosMesclados, (msg) => novasLacunasLogs.push(msg));

    await sendLog(`✅ Método 4 (IA): ${artigosRecuperadosList.length} artigos recuperados`);
    await sendLog(`📊 Lacunas restantes: ${novaAnalise.lacunas.length}`);
    
    if (naoEncontrados.length > 0) {
      await sendLog(`⚠️ Artigos não localizados pela IA: ${naoEncontrados.slice(0, 15).join(', ')}${naoEncontrados.length > 15 ? '...' : ''}`);
      await sendLog('💡 Estes artigos podem ter sido revogados/vetados sem menção no texto');
    }

    return {
      artigos: artigosMesclados,
      lacunas: novaAnalise.lacunas,
      artigosRecuperados: artigosRecuperadosList.length
    };

  } catch (error) {
    await sendLog(`❌ Método 4 erro: ${error instanceof Error ? error.message : 'Erro'}`);
    return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MÉTODO 5: Consulta LexML como fonte alternativa
// ═══════════════════════════════════════════════════════════════════════════════
async function tentarMetodo5LexML(
  tableName: string,
  artigosExistentes: ArtigoExtraido[],
  lacunasAtuais: LacunaArtigo[],
  sendLog: (msg: string) => Promise<void>
): Promise<{ artigos: ArtigoExtraido[]; lacunas: LacunaArtigo[]; artigosRecuperados: number; fonteUsada: boolean }> {
  
  await sendLog('');
  await sendLog('═══════════════════════════════════════════════════════════');
  await sendLog('🔄 MÉTODO 5: Consulta LexML (Fonte Oficial Alternativa)');
  await sendLog('═══════════════════════════════════════════════════════════');
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Chamar edge function buscar-lexml
    const response = await fetch(`${supabaseUrl}/functions/v1/buscar-lexml`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nomeLei: tableName,
        buscarTexto: true
      }),
    });

    if (!response.ok) {
      await sendLog('⚠️ LexML não encontrou esta lei ou não está disponível');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0, fonteUsada: false };
    }

    const data = await response.json();
    
    if (!data.success || !data.artigos || data.artigos.length === 0) {
      await sendLog(`⚠️ LexML: ${data.error || 'Nenhum artigo disponível'}`);
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0, fonteUsada: false };
    }

    await sendLog(`📥 LexML: ${data.artigos.length} artigos encontrados`);
    await sendLog(`📋 Título: ${data.titulo || tableName}`);

    // Identificar artigos faltantes
    const numerosExistentes = new Set(
      artigosExistentes
        .filter(a => a["Número do Artigo"])
        .map(a => parseInt(a["Número do Artigo"]!.replace(/[^\d]/g, '')) || 0)
    );

    const artigosFaltantes: number[] = [];
    for (const lacuna of lacunasAtuais) {
      for (let n = lacuna.de; n <= lacuna.ate; n++) {
        artigosFaltantes.push(n);
      }
    }

    // Verificar quais artigos do LexML preenchem lacunas
    const artigosRecuperadosList: ArtigoExtraido[] = [];
    
    for (const artigoLexml of data.artigos) {
      const numStr = artigoLexml.numero;
      const num = parseInt(numStr.replace(/[^\d]/g, '')) || 0;
      
      if (artigosFaltantes.includes(num) && !numerosExistentes.has(num)) {
        const numeroNormalizado = normalizarNumeroArtigo(numStr);
        
        artigosRecuperadosList.push({
          "Número do Artigo": numeroNormalizado,
          Artigo: artigoLexml.texto,
          ordem_artigo: num * 1000
        });
        
        numerosExistentes.add(num);
        await sendLog(`✅ LexML recuperou: Art. ${numeroNormalizado}`);
      }
    }

    if (artigosRecuperadosList.length === 0) {
      await sendLog('⚠️ LexML não trouxe artigos faltantes');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0, fonteUsada: true };
    }

    // Mesclar artigos
    const artigosMesclados = [...artigosExistentes, ...artigosRecuperadosList]
      .sort((a, b) => (a.ordem_artigo || 0) - (b.ordem_artigo || 0));

    // Recalcular lacunas
    const novaAnalise = analisarLacunasArtigos(artigosMesclados, () => {});

    await sendLog(`✅ Método 5 (LexML): ${artigosRecuperadosList.length} artigos recuperados`);
    await sendLog(`📊 Lacunas restantes: ${novaAnalise.lacunas.length}`);

    return {
      artigos: artigosMesclados,
      lacunas: novaAnalise.lacunas,
      artigosRecuperados: artigosRecuperadosList.length,
      fonteUsada: true
    };

  } catch (error) {
    await sendLog(`⚠️ Método 5 (LexML) erro: ${error instanceof Error ? error.message : 'Erro'}`);
    return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0, fonteUsada: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MÉTODO 6: Dupla Raspagem com Merge Inteligente
// ═══════════════════════════════════════════════════════════════════════════════
async function tentarMetodo6DuplaRaspagem(
  urlPlanalto: string,
  _unused: string,
  artigosExistentes: ArtigoExtraido[],
  lacunasAtuais: LacunaArtigo[],
  sendLog: (msg: string) => Promise<void>
): Promise<{ artigos: ArtigoExtraido[]; lacunas: LacunaArtigo[]; artigosRecuperados: number; textoCombinado: string }> {
  
  await sendLog('');
  await sendLog('═══════════════════════════════════════════════════════════');
  await sendLog('🔄 MÉTODO 6: Re-fetch com extração alternativa');
  await sendLog('═══════════════════════════════════════════════════════════');
  
  try {
    const fetchResult = await fetchPlanaltoDirecto(urlPlanalto, sendLog);
    
    if (!fetchResult.sucesso || !fetchResult.html) {
      await sendLog('❌ Método 6 falhou: erro no fetch');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0, textoCombinado: '' };
    }

    const html2 = fetchResult.html;
    
    // Extrai texto via DOM (sem tachados)
    const resultadoDOM = removerTextosTachadosComDOM(html2, () => {});
    const markdown1 = resultadoDOM.sucesso && resultadoDOM.textoLimpo.length > 100 
      ? resultadoDOM.textoLimpo : '';
    
    // Também converte HTML bruto para texto (abordagem alternativa)
    const markdown2 = htmlParaTexto(html2);
    
    await sendLog(`   DOM: ${markdown1.length} chars, HTML→Texto: ${markdown2.length} chars`);

    // Combinar textos para análise
    const textoCombinado = [markdown1, markdown2].filter(Boolean).join('\n\n===SEPARADOR===\n\n');

    // Identificar artigos faltantes
    const numerosExistentes = new Set(
      artigosExistentes
        .filter(a => a["Número do Artigo"])
        .map(a => parseInt(a["Número do Artigo"]!.replace(/[^\d]/g, '')) || 0)
    );

    const artigosFaltantes: number[] = [];
    for (const lacuna of lacunasAtuais) {
      for (let n = lacuna.de; n <= lacuna.ate; n++) {
        artigosFaltantes.push(n);
      }
    }

    if (artigosFaltantes.length === 0) {
      await sendLog('✅ Nenhum artigo faltante para buscar');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0, textoCombinado };
    }

    await sendLog(`🎯 Buscando ${artigosFaltantes.length} artigos em textos combinados...`);

    // Extrair artigos de ambas as raspagens
    const logsTemp: string[] = [];
    const artigosDaRaspagem1 = markdown1.length > 100 ? extrairConteudo(markdown1, () => {}) : [];
    const artigosDaRaspagem2 = markdown2.length > 100 ? extrairConteudo(markdown2, () => {}) : [];

    // Também tentar extrair do HTML bruto
    const htmlLimpo = html2
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ');
    
    const artigosDoHTML = htmlLimpo.length > 100 ? extrairConteudo(htmlLimpo, () => {}) : [];

    // Merge inteligente: combinar todos os artigos únicos encontrados
    const artigosRecuperadosList: ArtigoExtraido[] = [];
    const todosArtigos = [...artigosDaRaspagem1, ...artigosDaRaspagem2, ...artigosDoHTML];

    for (const artigo of todosArtigos) {
      if (!artigo["Número do Artigo"]) continue;
      const num = parseInt(artigo["Número do Artigo"].replace(/[^\d]/g, '')) || 0;
      
      if (artigosFaltantes.includes(num) && !numerosExistentes.has(num)) {
        artigosRecuperadosList.push(artigo);
        numerosExistentes.add(num);
        await sendLog(`✅ Dupla raspagem recuperou: Art. ${artigo["Número do Artigo"]}`);
      }
    }

    if (artigosRecuperadosList.length === 0) {
      await sendLog('⚠️ Dupla raspagem não encontrou artigos novos');
      return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0, textoCombinado };
    }

    // Mesclar artigos
    const artigosMesclados = [...artigosExistentes, ...artigosRecuperadosList]
      .sort((a, b) => (a.ordem_artigo || 0) - (b.ordem_artigo || 0));

    // Recalcular lacunas
    const novaAnalise = analisarLacunasArtigos(artigosMesclados, () => {});

    await sendLog(`✅ Método 6 (Dupla Raspagem): ${artigosRecuperadosList.length} artigos recuperados`);
    await sendLog(`📊 Lacunas restantes: ${novaAnalise.lacunas.length}`);

    return {
      artigos: artigosMesclados,
      lacunas: novaAnalise.lacunas,
      artigosRecuperados: artigosRecuperadosList.length,
      textoCombinado
    };

  } catch (error) {
    await sendLog(`❌ Método 6 erro: ${error instanceof Error ? error.message : 'Erro'}`);
    return { artigos: artigosExistentes, lacunas: lacunasAtuais, artigosRecuperados: 0, textoCombinado: '' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORQUESTRADOR: Executa os 6 métodos em cascata (otimizado para evitar timeout)
// ═══════════════════════════════════════════════════════════════════════════════
async function executarFallbackProgressivo(
  urlPlanalto: string,
  _firecrawlApiKey: string, // mantido para compatibilidade
  tableName: string,
  artigosIniciais: ArtigoExtraido[],
  analiseInicial: AnaliseArtigos,
  markdownOriginal: string,
  sendLog: (msg: string) => Promise<void>
): Promise<{ artigos: ArtigoExtraido[]; analise: AnaliseArtigos; metodoFinal: number; relatorio: string; fontes: string[] }> {
  
  let artigos = artigosIniciais;
  let lacunas = analiseInicial.lacunas;
  let metodoFinal = 1;
  let textoBrutoParaIA = markdownOriginal;
  const fontesUsadas: string[] = ['Planalto (fetch direto)'];
  
  const estatisticas = {
    metodo1: analiseInicial.artigosEncontrados,
    metodo2: 0,
    metodo3: 0,
    metodo4: 0,
    metodo5: 0,
    metodo6: 0
  };

  const totalFaltandoInicial = lacunas.reduce((acc, l) => acc + l.quantidade, 0);

  await sendLog('');
  await sendLog('╔══════════════════════════════════════════════════════════╗');
  await sendLog('║   SISTEMA DE FALLBACK PROGRESSIVO - 6 MÉTODOS           ║');
  await sendLog('╚══════════════════════════════════════════════════════════╝');
  await sendLog(`📊 Método 1 (padrão): ${analiseInicial.artigosEncontrados} artigos`);
  await sendLog(`⚠️ Lacunas detectadas: ${lacunas.length} (${totalFaltandoInicial} artigos faltando)`);

  // Se não há lacunas, retorna
  if (lacunas.length === 0) {
    await sendLog('✅ Nenhuma lacuna - não precisa de métodos adicionais');
    return {
      artigos,
      analise: analiseInicial,
      metodoFinal: 1,
      relatorio: 'Extração completa no Método 1 (padrão)',
      fontes: fontesUsadas
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OTIMIZAÇÃO: Para poucas lacunas (≤5 artigos), ir direto para IA (mais rápido)
  // Para muitas lacunas, tentar métodos de raspagem primeiro
  // ═══════════════════════════════════════════════════════════════════════════
  const LIMITE_LACUNAS_PARA_IA_DIRETA = 5;
  
  if (totalFaltandoInicial <= LIMITE_LACUNAS_PARA_IA_DIRETA) {
    await sendLog(`💡 Poucas lacunas (${totalFaltandoInicial} artigos) - usando IA diretamente para maior velocidade`);
    
    // ═══════════════ MÉTODO 4 (IA) DIRETO ═══════════════
    const resultado4 = await preencherLacunasComIA(artigos, lacunas, textoBrutoParaIA, tableName, sendLog);
    artigos = resultado4.artigos;
    lacunas = resultado4.lacunas;
    estatisticas.metodo4 = resultado4.artigosRecuperados;
    
    if (resultado4.artigosRecuperados > 0) {
      metodoFinal = 4;
      fontesUsadas.push('Gemini IA');
    }

    // Relatório rápido
    await sendLog('');
    await sendLog('╔══════════════════════════════════════════════════════════╗');
    await sendLog('║               RELATÓRIO FINAL (MODO RÁPIDO)              ║');
    await sendLog('╚══════════════════════════════════════════════════════════╝');
    
    const analiseAtualizada = analisarLacunasArtigos(artigos, () => {});
    
    await sendLog(`📊 Método 1 (padrão):       ${estatisticas.metodo1} artigos`);
    await sendLog(`📊 Método 4 (IA Gemini):    +${estatisticas.metodo4} artigos`);
    await sendLog(`─────────────────────────────────────────────────────`);
    await sendLog(`📊 TOTAL FINAL: ${analiseAtualizada.artigosEncontrados} artigos (${analiseAtualizada.percentualExtracao}%)`);
    await sendLog(`📋 Fontes usadas: ${fontesUsadas.join(', ')}`);
    
    if (lacunas.length > 0) {
      const totalFaltando = lacunas.reduce((acc, l) => acc + l.quantidade, 0);
      await sendLog(`⚠️ Lacunas restantes: ${lacunas.length} (${totalFaltando} artigos não localizados)`);
      await sendLog('💡 Estes artigos podem ter sido revogados/vetados');
    } else {
      await sendLog('✅ Todas as lacunas foram preenchidas!');
    }

    const relatorio = `Extração rápida: M1=${estatisticas.metodo1}, M4(IA)=+${estatisticas.metodo4}. ` +
      `Total: ${analiseAtualizada.artigosEncontrados} artigos (${analiseAtualizada.percentualExtracao}%).`;

    return {
      artigos,
      analise: { ...analiseAtualizada, lacunas },
      metodoFinal,
      relatorio,
      fontes: fontesUsadas
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FLUXO COMPLETO: Muitas lacunas - executar todos os métodos
  // ═══════════════════════════════════════════════════════════════════════════
  await sendLog(`📋 Muitas lacunas (${totalFaltandoInicial} artigos) - executando métodos 2-6...`);

  // ═══════════════ MÉTODO 2 ═══════════════
  const resultado2 = await tentarMetodo2(urlPlanalto, '', artigos, lacunas, sendLog);
  artigos = resultado2.artigos;
  lacunas = resultado2.lacunas;
  estatisticas.metodo2 = resultado2.artigosRecuperados;
  
  if (resultado2.artigosRecuperados > 0) {
    metodoFinal = 2;
  }
  
  if (resultado2.markdown) {
    textoBrutoParaIA = resultado2.markdown;
  }

  if (lacunas.length === 0) {
    await sendLog('✅ Todas as lacunas preenchidas no Método 2!');
    const analiseAtualizada = analisarLacunasArtigos(artigos, () => {});
    return {
      artigos,
      analise: analiseAtualizada,
      metodoFinal,
      relatorio: `Método 2 recuperou ${estatisticas.metodo2} artigos. Total: ${analiseAtualizada.artigosEncontrados}`,
      fontes: fontesUsadas
    };
  }

  // ═══════════════ MÉTODO 3 ═══════════════
  const resultado3 = await tentarMetodo3(urlPlanalto, '', artigos, lacunas, sendLog);
  artigos = resultado3.artigos;
  lacunas = resultado3.lacunas;
  estatisticas.metodo3 = resultado3.artigosRecuperados;
  
  if (resultado3.artigosRecuperados > 0) {
    metodoFinal = 3;
  }
  
  if (resultado3.textosBrutos.length > 0) {
    textoBrutoParaIA = resultado3.textosBrutos.join('\n\n');
  }

  if (lacunas.length === 0) {
    await sendLog('✅ Todas as lacunas preenchidas no Método 3!');
    const analiseAtualizada = analisarLacunasArtigos(artigos, () => {});
    return {
      artigos,
      analise: analiseAtualizada,
      metodoFinal,
      relatorio: `Métodos 2+3 recuperaram ${estatisticas.metodo2 + estatisticas.metodo3} artigos. Total: ${analiseAtualizada.artigosEncontrados}`,
      fontes: fontesUsadas
    };
  }

  // ═══════════════ MÉTODO 4 (IA) - ANTES dos métodos lentos ═══════════════
  // Executar IA primeiro pois é mais rápido que LexML e dupla raspagem
  const resultado4 = await preencherLacunasComIA(artigos, lacunas, textoBrutoParaIA, tableName, sendLog);
  artigos = resultado4.artigos;
  lacunas = resultado4.lacunas;
  estatisticas.metodo4 = resultado4.artigosRecuperados;
  
  if (resultado4.artigosRecuperados > 0) {
    metodoFinal = 4;
    fontesUsadas.push('Gemini IA');
  }

  if (lacunas.length === 0) {
    await sendLog('✅ Todas as lacunas preenchidas com IA!');
    const analiseAtualizada = analisarLacunasArtigos(artigos, () => {});
    return {
      artigos,
      analise: analiseAtualizada,
      metodoFinal,
      relatorio: `Métodos 2-4 recuperaram artigos. Total: ${analiseAtualizada.artigosEncontrados}`,
      fontes: fontesUsadas
    };
  }

  // ═══════════════ MÉTODO 5 (LexML) - Apenas se IA não resolveu ═══════════════
  const totalFaltandoAposIA = lacunas.reduce((acc, l) => acc + l.quantidade, 0);
  
  if (totalFaltandoAposIA > 3) {
    // Só tenta LexML se ainda há muitas lacunas
    const resultado5 = await tentarMetodo5LexML(tableName, artigos, lacunas, sendLog);
    artigos = resultado5.artigos;
    lacunas = resultado5.lacunas;
    estatisticas.metodo5 = resultado5.artigosRecuperados;
    
    if (resultado5.artigosRecuperados > 0) {
      metodoFinal = 5;
      fontesUsadas.push('LexML Brasil');
    }
  } else {
    await sendLog('⏩ Pulando LexML (poucas lacunas restantes)');
  }

  if (lacunas.length === 0) {
    await sendLog('✅ Todas as lacunas preenchidas com LexML!');
    const analiseAtualizada = analisarLacunasArtigos(artigos, () => {});
    return {
      artigos,
      analise: analiseAtualizada,
      metodoFinal,
      relatorio: `LexML recuperou ${estatisticas.metodo5} artigos. Total: ${analiseAtualizada.artigosEncontrados}`,
      fontes: fontesUsadas
    };
  }

  // ═══════════════ MÉTODO 6 (Dupla Raspagem) - Último recurso ═══════════════
  const totalFaltandoAposLexML = lacunas.reduce((acc, l) => acc + l.quantidade, 0);
  
  if (totalFaltandoAposLexML > 5) {
    // Só tenta dupla raspagem se ainda há muitas lacunas
    const resultado6 = await tentarMetodo6DuplaRaspagem(urlPlanalto, '', artigos, lacunas, sendLog);
    artigos = resultado6.artigos;
    lacunas = resultado6.lacunas;
    estatisticas.metodo6 = resultado6.artigosRecuperados;
    
    if (resultado6.artigosRecuperados > 0) {
      metodoFinal = 6;
    }
  } else {
    await sendLog('⏩ Pulando dupla raspagem (poucas lacunas restantes)');
  }

  // ═══════════════ RELATÓRIO FINAL ═══════════════
  await sendLog('');
  await sendLog('╔══════════════════════════════════════════════════════════╗');
  await sendLog('║               RELATÓRIO FINAL - 6 MÉTODOS                ║');
  await sendLog('╚══════════════════════════════════════════════════════════╝');
  
  const analiseAtualizada = analisarLacunasArtigos(artigos, () => {});
  const totalRecuperados = estatisticas.metodo2 + estatisticas.metodo3 + estatisticas.metodo4 + estatisticas.metodo5 + estatisticas.metodo6;
  
  await sendLog(`📊 Método 1 (padrão):       ${estatisticas.metodo1} artigos`);
  await sendLog(`📊 Método 2 (fullPage):     +${estatisticas.metodo2} artigos`);
  await sendLog(`📊 Método 3 (HTML bruto):   +${estatisticas.metodo3} artigos`);
  await sendLog(`📊 Método 4 (IA Gemini):    +${estatisticas.metodo4} artigos`);
  await sendLog(`📊 Método 5 (LexML):        +${estatisticas.metodo5} artigos`);
  await sendLog(`📊 Método 6 (Dupla rasp.):  +${estatisticas.metodo6} artigos`);
  await sendLog(`─────────────────────────────────────────────────────`);
  await sendLog(`📊 TOTAL FINAL: ${analiseAtualizada.artigosEncontrados} artigos (${analiseAtualizada.percentualExtracao}%)`);
  await sendLog(`📋 Fontes usadas: ${fontesUsadas.join(', ')}`);
  await sendLog(`📊 Método final utilizado: ${metodoFinal}`);
  
  if (lacunas.length > 0) {
    const totalFaltando = lacunas.reduce((acc, l) => acc + l.quantidade, 0);
    await sendLog(`⚠️ Lacunas restantes: ${lacunas.length} (${totalFaltando} artigos não localizados)`);
    await sendLog('💡 Estes artigos podem ter sido revogados/vetados sem menção explícita no texto');
  } else {
    await sendLog('✅ Todas as lacunas foram preenchidas!');
  }

  const relatorio = `Extração com fallback: ` +
    `M1=${estatisticas.metodo1}, M2=+${estatisticas.metodo2}, M3=+${estatisticas.metodo3}, ` +
    `M4(IA)=+${estatisticas.metodo4}, M5(LexML)=+${estatisticas.metodo5}, M6(Dupla)=+${estatisticas.metodo6}. ` +
    `Total: ${analiseAtualizada.artigosEncontrados} artigos (${analiseAtualizada.percentualExtracao}%). ` +
    `Fontes: ${fontesUsadas.join(', ')}`;

  return {
    artigos,
    analise: { ...analiseAtualizada, lacunas },
    metodoFinal,
    relatorio,
    fontes: fontesUsadas
  };
}


// Função para normalizar número do artigo (1º-9º com símbolo, 10+ sem símbolo)
// Usa o símbolo ordinal correto: º (U+00BA - masculine ordinal indicator)
function normalizarNumeroArtigo(numero: string): string {
  // Remove espaços e caracteres estranhos
  // Converte todos os símbolos parecidos para o ordinal correto º
  let normalizado = numero.trim()
    .replace(/[°˚ᵒ]/g, 'º') // graus, ring above, modifier -> ordinal
    .replace(/[ª]/g, 'º') // feminino -> masculino
    .replace(/\s+/g, '')
    .replace(/–/g, '-');
  
  // Extrai apenas o número base
  const matchNumero = normalizado.match(/^(\d+)/);
  if (!matchNumero) return normalizado;
  
  const numeroBase = parseInt(matchNumero[1]);
  const sufixo = normalizado.replace(/^\d+[ºª°]?/, ''); // Pega sufixo tipo -A, -B
  
  // Para 1-9: adiciona º (ordinal correto) se não tiver
  if (numeroBase >= 1 && numeroBase <= 9) {
    return `${numeroBase}º${sufixo}`;
  }
  
  // Para 10+: sem símbolo ordinal
  return `${numeroBase}${sufixo}`;
}

// Função para extrair a última data de alteração do texto da lei
function extrairUltimaAtualizacao(texto: string): { data: string | null; ano: number | null; diasAtras: number | null } {
  // Padrões comuns de alteração: (Redação dada pela Lei nº X, de 2023), (Incluído pela Lei nº Y, de 2024)
  const padroes = [
    /\((?:Reda[çc][ãa]o\s+dada|Inclu[íi]do|Alterado|Acrescido|Revogado)\s+pel[ao]\s+[^)]+,?\s*de\s+(\d{1,2})[./](\d{1,2})[./](\d{4})\)/gi,
    /\((?:Reda[çc][ãa]o\s+dada|Inclu[íi]do|Alterado|Acrescido|Revogado)\s+pel[ao]\s+[^)]+,?\s*de\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})\)/gi,
    /\((?:Reda[çc][ãa]o\s+dada|Inclu[íi]do|Alterado|Acrescido|Revogado)\s+pel[ao]\s+[^)]+de\s+(\d{4})\)/gi,
    /Lei\s+n[ºo°]?\s*[\d.]+[^)]*,?\s*de\s+(\d{1,2})[./](\d{1,2})[./](\d{4})/gi,
    /Lei\s+n[ºo°]?\s*[\d.]+[^)]*,?\s*de\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/gi,
    /Lei\s+n[ºo°]?\s*[\d.]+[^)]*de\s+(\d{4})/gi,
  ];

  const meses: Record<string, number> = {
    'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4,
    'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
    'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
  };

  let ultimaData: Date | null = null;
  let ultimoAno: number | null = null;

  for (const padrao of padroes) {
    let match;
    while ((match = padrao.exec(texto)) !== null) {
      let dataExtraida: Date | null = null;
      
      if (match.length === 4 && !isNaN(parseInt(match[1])) && !isNaN(parseInt(match[2])) && !isNaN(parseInt(match[3]))) {
        // Formato: dia/mes/ano
        const dia = parseInt(match[1]);
        const mes = parseInt(match[2]) - 1;
        const ano = parseInt(match[3]);
        dataExtraida = new Date(ano, mes, dia);
      } else if (match.length === 4 && !isNaN(parseInt(match[1])) && isNaN(parseInt(match[2]))) {
        // Formato: dia de mês de ano
        const dia = parseInt(match[1]);
        const mesNome = match[2].toLowerCase();
        const mes = meses[mesNome] || 1;
        const ano = parseInt(match[3]);
        dataExtraida = new Date(ano, mes - 1, dia);
      } else if (match.length === 2 && !isNaN(parseInt(match[1]))) {
        // Só ano
        const ano = parseInt(match[1]);
        if (ano > 1900 && ano <= new Date().getFullYear()) {
          dataExtraida = new Date(ano, 0, 1);
        }
      }

      if (dataExtraida && !isNaN(dataExtraida.getTime())) {
        if (!ultimaData || dataExtraida > ultimaData) {
          ultimaData = dataExtraida;
          ultimoAno = dataExtraida.getFullYear();
        }
      }
    }
  }

  if (ultimaData) {
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - ultimaData.getTime());
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      data: ultimaData.toISOString().split('T')[0],
      ano: ultimoAno,
      diasAtras: diffDias
    };
  }

  return { data: null, ano: null, diasAtras: null };
}

// Função para extrair todos os elementos do texto (lei, ementa, preâmbulo, títulos, capítulos, artigos)
function extrairConteudo(markdown: string, logCallback: (msg: string) => void): ArtigoExtraido[] {
  const resultado: ArtigoExtraido[] = [];
  
  logCallback('═══════════════════════════════════════════════════════════');
  logCallback('📚 INICIANDO EXTRAÇÃO DE CONTEÚDO');
  logCallback('═══════════════════════════════════════════════════════════');
  
  // Limpar markdown de formatação e caracteres estranhos
  // IMPORTANTE: Manter texto de revogação/veto mesmo que estejam como links
  let texto = markdown
    // ═══════════════════════════════════════════════════════════════════════════
    // REMOVER REFERÊNCIAS A ARTIGOS DE OUTRAS LEIS ANTES DE PROCESSAR
    // Isso evita que "arts. 94 a 99 do Decreto-Lei nº 221" seja confundido com artigos da lei atual
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Remove links markdown que referenciam artigos de outras leis: [arts. 1o a 5o,](url)
    .replace(/\[arts?\.?\s*\d+[oºª°]?\s*(?:a\s*\d+[oºª°]?)?\s*,?\s*\]\([^)]+\)/gi, '')
    .replace(/\[art\.?\s*\d+[oºª°]?\s*\]\([^)]+\)/gi, '')
    
    // Remove referências textuais a artigos de outras leis/decretos/medidas
    .replace(/\barts?\.?\s*\d+[oºª°]?\s*(?:a\s*\d+[oºª°]?)?\s*(?:,\s*\d+[oºª°]?\s*(?:a\s*\d+[oºª°]?)?\s*)*(?:e\s*\d+[oºª°]?\s*(?:a\s*\d+[oºª°]?)?\s*)?(?:do|da|dos|das)\s+(?:Decreto-Lei|Lei|Medida\s+Provis[óo]ria|Decreto)\s+n[ºo°]?\s*[\d.,]+[^.;)]*[.;)]/gi, '')
    
    // Remove menções como "e dá outras providências"
    .replace(/\s+e\s+d[áa]\s+outras\s+provid[êe]ncias\.?/gi, '')
    
    // Primeiro: Converter links markdown legislativos para formato (texto)[url] preservando URLs do Planalto
    // Links como [Redação dada pela EC nº 1](https://planalto...) → (Redação dada pela EC nº 1)[https://planalto...]
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]*planalto[^)]*)\)/g, '($1)[$2]')
    // Links não-planalto: manter apenas o texto
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold e italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove headers markdown
    .replace(/#+\s*/g, '')
    // Normaliza quebras de linha
    .replace(/\r\n/g, '\n')
    // Remove caracteres estranhos
    .replace(/[~]+/g, '')
    .replace(/;~/g, '')
    .replace(/~;/g, '')
    // Remove pontuação solta no final de linhas (mas não parênteses!)
    .replace(/\s*[;]\s*$/gm, '')
    .replace(/^\s*[.;]\s*$/gm, '')
    // Normaliza caracteres especiais
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    
    // ═══════════════════════════════════════════════════════════════════════════
    // REMOVER REFERÊNCIAS ENTRE PARÊNTESES (Incluído pela Lei, Redação dada, Vide, etc)
    // MANTÉM APENAS: (VETADO), (Revogado)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Remove referências em formato markdown com colchetes: [(Incluído pela Lei nº 12.727, de 2012).]
    .replace(/\[\s*\(Inclu[íi]d[oa]\s+pel[aoe]\s+[^)]+\)\s*\.?\s*\]/gi, '')
    .replace(/\[\s*\(Reda[çc][ãa]o\s+dada\s+pel[aoe]\s+[^)]+\)\s*\.?\s*\]/gi, '')
    .replace(/\[\s*\([^)]*Lei\s+n[ºo°]?\s*[\d.,]+[^)]*\)\s*\.?\s*\]/gi, '')
    
    // Remove "(Incluído pela Lei nº X)" e variações - padrão mais abrangente
    .replace(/\s*\(Inclu[íi]d[oa]\s+pel[aoe]\s+[^)]+\)\s*\.?/gi, '')
    .replace(/\s*\(Inclu[íi]d[oa]\s+pel[aoe]\s+Lei\s+n[ºo°]?\s*[\d.,]+[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Inclu[íi]d[oa]\s+pel[aoe]\s+Emenda[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Inclu[íi]d[oa]\s+pel[aoe]\s+Medida\s+Provis[óo]ria[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Inclu[íi]d[oa]\s+pel[aoe]\s+Decreto[^)]*\)\s*\.?/gi, '')
    
    // Remove "(Redação dada pela Lei nº X)" e variações
    .replace(/\s*\(Reda[çc][ãa]o\s+dada\s+pel[aoe]\s+[^)]+\)\s*\.?/gi, '')
    .replace(/\s*\(Reda[çc][ãa]o\s+dada\s+pel[aoe]\s+Lei\s+n[ºo°]?\s*[\d.,]+[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Reda[çc][ãa]o\s+dada\s+pel[aoe]\s+Emenda[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Reda[çc][ãa]o\s+dada\s+pel[aoe]\s+Medida\s+Provis[óo]ria[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Reda[çc][ãa]o\s+dada\s+pel[aoe]\s+Decreto[^)]*\)\s*\.?/gi, '')
    
    // Remove "(Vigência encerrada)" e variações
    .replace(/\s*\(Vig[êe]ncia\s+encerrada[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Vig[êe]ncia\)[^)]*\)\s*\.?/gi, '')
    
    // Remove "(Vide Lei nº X)" - referências simples a outras leis
    .replace(/\s*\(Vide\s+Lei\s+n[ºo°]?\s*[\d.,]+[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Vide\s+Medida\s+Provis[óo]ria[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Vide\s+Decreto[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Vide\s+art[^)]*\)\s*\.?/gi, '')
    // Remove "(Vide ADC Nº X)", "(Vide ADIN Nº X)", "(Vide ADI Nº X)", "(Vide ADPF Nº X)"
    .replace(/\s*\(Vide\s+ADC\s+N?[ºo°]?\s*[\d.,]+[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Vide\s+ADIN\s+N?[ºo°]?\s*[\d.,]+[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Vide\s+ADI\s+N?[ºo°]?\s*[\d.,]+[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Vide\s+ADPF\s+N?[ºo°]?\s*[\d.,]+[^)]*\)\s*\.?/gi, '')
    
    // Remove "(Regulamento)" e "(Produção de efeitos)"
    .replace(/\s*\(Regulamento[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Produ[çc][ãa]o\s+de\s+efeitos[^)]*\)\s*\.?/gi, '')
    
    // Remove "(Alterado pela Lei nº X)" e variações
    .replace(/\s*\(Alterad[oa]\s+pel[aoe]\s+[^)]*\)\s*\.?/gi, '')
    
    // Remove "(Acrescentado pela Lei nº X)" e variações
    .replace(/\s*\(Acrescentad[oa]\s+pel[aoe]\s+[^)]*\)\s*\.?/gi, '')
    .replace(/\s*\(Acrescid[oa]\s+pel[aoe]\s+[^)]*\)\s*\.?/gi, '')
    
    // Remove "(Renumerado pela Lei nº X)" 
    .replace(/\s*\(Renumerad[oa]\s+pel[aoe]\s+[^)]*\)\s*\.?/gi, '')
    
    // Remove "(Suprimido)" mas NÃO "(VETADO)"
    .replace(/\s*\(Suprimid[oa][^)]*\)\s*\.?/gi, '')
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PRÉ-PROCESSAMENTO: MARCAR BLOCOS DE ALTERAÇÃO LEGISLATIVA
    // Isso ajuda a evitar que artigos de outras leis sejam capturados
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Marca início de alteração com tag especial (será usada na extração)
    // Substitui "Art. X" dentro de aspas por "[ALTERACAO_Art. X]" para não capturar
    .replace(/([""])\s*(Art\.?\s*\d+[ºª°]?)/gi, '$1[ALTERACAO_$2]')
    
    // Também marca artigos que aparecem logo após frases de alteração
    // Ex: "passa a vigorar com a seguinte redação:\nArt. 5º" 
    .replace(/(seguinte\s+reda[çc][ãa]o[:\s]*[\n\r]+)\s*(Art\.?\s*\d+)/gi, '$1[ALTERACAO_$2]')
    .replace(/(passa[rm]?\s+a\s+vigorar[:\s]*[\n\r]+)\s*(Art\.?\s*\d+)/gi, '$1[ALTERACAO_$2]')
    .replace(/(acrescentad[oa]s?\s+[ao]s?\s+seguintes?[:\s]*[\n\r]+)\s*(Art\.?\s*\d+)/gi, '$1[ALTERACAO_$2]')
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MANTER (VETADO) NA MESMA LINHA DO ARTIGO
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Junta "(VETADO)" que ficou em linha separada com o artigo anterior
    .replace(/(Art\.?\s*\d+[ºª°]?)\s*\n+\s*\(VETADO\)/gi, '$1 (VETADO)')
    .replace(/(Art\.?\s*\d+[ºª°]?[-–]\s*[A-Z]?)\s*\n+\s*\(VETADO\)/gi, '$1 (VETADO)')
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CORRIGIR QUEBRAS DE LINHA INCORRETAS
    // ═══════════════════════════════════════════════════════════════════════════
    
    // CRÍTICO: Junta "Art." ou "Art" separado do número por quebra de linha
    // Isso corrige o problema do Estatuto da Terra onde "Art.\n4º" estava separado
    // MAS NÃO junta se estiver marcado como ALTERACAO
    .replace(/(?<!\[ALTERACAO_)Art\.\s*\n\s*(\d+[ºª°]?)/gi, 'Art. $1')
    .replace(/(?<!\[ALTERACAO_)\bArt\s*\n\s*(\d+[ºª°]?)/gi, 'Art. $1')
    
    // Junta palavras hifenizadas quebradas (ex: "pro-\nteção" → "proteção")
    .replace(/(\w)-\n(\w)/g, '$1$2')
    
    // Junta linhas que terminam com vírgula seguidas de minúscula
    .replace(/,\s*\n\s*([a-záéíóúàâêôãõç])/gi, ', $1')
    
    // Junta linhas que terminam com ponto-e-vírgula seguidas de minúscula
    .replace(/;\s*\n\s*([a-záéíóúàâêôãõç])/gi, '; $1')
    
    // Remove quebras de linha antes de pontuação isolada
    .replace(/\n\s*([,;.):])/g, '$1')
    
    // ═══════════════════════════════════════════════════════════════════════════
    // REMOVER QUEBRAS DE LINHA DESNECESSÁRIAS DENTRO DOS ARTIGOS
    // Problema: Texto original tem quebras de linha para diagramação que não devem ser mantidas
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Junta linhas onde texto termina com letra minúscula/vírgula e próxima começa com minúscula
    // Ex: "a tutela\nespecial" → "a tutela especial"
    .replace(/([a-záéíóúàâêôãõç])\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
    
    // Junta linhas onde texto termina com preposição/artigo e próxima tem continuação
    // Ex: "de\npessoas" → "de pessoas", "o\nambiente" → "o ambiente"
    .replace(/\b(de|da|do|das|dos|em|na|no|nas|nos|a|o|as|os|e|ou|que|se|para|por|com|sem)\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
    
    // Junta linhas onde próxima linha começa com complemento verbal
    // Ex: "poderá\nser" → "poderá ser"
    .replace(/\b(poderá|deverá|será|serão|podem|devem|podem|ficam|são|é)\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
    
    // Junta linhas onde inciso romano está separado do seu texto
    // Ex: "I -\nproteger" → "I - proteger"
    .replace(/([IVXLCDM]+\s*[-–])\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
    
    // Junta linhas onde alínea está separada do texto
    // Ex: "a)\ncultura" → "a) cultura"
    .replace(/([a-z]\))\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
    
    // Junta linhas onde parágrafo está separado do texto
    // Ex: "§ 1º\nO" → "§ 1º O" (mantém quebra apenas se próxima for letra maiúscula após pontuação)
    .replace(/(§\s*\d+[ºª°]?)\s*\n\s*([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ])/g, '$1 $2')
    
    // Remove múltiplos espaços
    .replace(/  +/g, ' ');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NORMALIZAÇÃO JURÍDICA: Remover TODAS as quebras e reinserir apenas nas posições corretas
  // Isso corrige o problema de quebras arbitrárias herdadas do HTML do Planalto
  // ═══════════════════════════════════════════════════════════════════════════
  
  logCallback('🔄 Aplicando normalização jurídica de quebras de linha...');
  
  // 1. Remove TODAS as quebras de linha e espaços extras
  texto = texto
    .replace(/[\r\n]+/g, ' ')  // Remove todas as quebras
    .replace(/\s{2,}/g, ' ')   // Remove espaços múltiplos
    .trim();
  
  // 2. Insere quebras APENAS antes de elementos jurídicos
  texto = texto
    // Títulos estruturais (com 2 quebras antes)
    .replace(/\s+(TÍTULO\s+[IVXLCDM]+)/gi, '\n\n$1')
    .replace(/\s+(CAPÍTULO\s+[IVXLCDM]+)/gi, '\n\n$1')
    .replace(/\s+(SEÇÃO\s+[IVXLCDM]+)/gi, '\n\n$1')
    .replace(/\s+(SUBSEÇÃO\s+[IVXLCDM]+)/gi, '\n\n$1')
    .replace(/\s+(LIVRO\s+[IVXLCDM]+)/gi, '\n\n$1')
    .replace(/\s+(PARTE\s+(GERAL|ESPECIAL|[IVXLCDM]+))/gi, '\n\n$1')
    
    // Artigos: "Art. 1º", "Art. 10", etc. (com 2 quebras antes)
    // Inclui marcação [ALTERACAO_Art. X] também
    .replace(/\s+(Art\.?\s*\d+[º°]?[ºª]?[-–]?[A-Z]?)/gi, '\n\n$1')
    .replace(/\s+(\[ALTERACAO_Art\.?\s*\d+[º°]?)/gi, '\n\n$1')
    
    // Parágrafos: "§ 1º", "§ 2º" (com 1 quebra antes)
    .replace(/\s+(§\s*\d+[º°]?)/g, '\n$1')
    
    // Parágrafo único (com 1 quebra antes)
    .replace(/\s+(Parágrafo\s+único)/gi, '\n$1')
    
    // Incisos romanos: "I -", "II -", "III -", "IV -" etc.
    // Captura apenas romanos válidos seguidos de hífen/travessão
    .replace(/\s+([IVXLCDM]+\s*[-–—]\s)/g, '\n$1')
    
    // Alíneas: "a)", "b)", "c)" etc.
    .replace(/\s+([a-z]\)\s)/g, '\n$1')
    
    // LEI no início
    .replace(/\s+(LEI\s+(?:N[ºo°]?\s*)?\d+)/gi, '\n\n$1')
    
    // Preâmbulo
    .replace(/\s+(O\s+PRESIDENTE\s+DA\s+REPÚBLICA)/gi, '\n\n$1')
    .replace(/\s+(Faço\s+saber\s+que)/gi, '\n$1')
    
    // Limpa espaços extras no início de cada linha
    .split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n')
    
    // Remove linhas vazias excessivas (mais de 2 seguidas)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const linhas = texto.split('\n');
  logCallback(`📄 Total de linhas para processar: ${linhas.length} (após normalização jurídica)`);
  
  // Regex para identificar diferentes elementos
  const regexLei = /^(LEI\s+(?:N[ºo°]?\s*)?\d+[\d.,]*(?:\s*,?\s*DE\s+\d+\s+DE\s+\w+\s+DE\s+\d+)?)/i;
  const regexEmenta = /^(Dispõe\s+sobre|Altera\s+|Institui\s+|Regulamenta\s+|Estabelece\s+)/i;
  const regexPreambulo = /^(O\s+PRESIDENTE\s+DA\s+REP[UÚ]BLICA|Faço\s+saber\s+que|O\s+CONGRESSO\s+NACIONAL)/i;
  const regexTitulo = /^(TÍTULO\s+[IVXLCDM]+)/i;
  const regexCapitulo = /^(CAP[ÍI]TULO\s+[IVXLCDM]+)/i;
  const regexSecao = /^(SE[CÇ][ÃA]O\s+[IVXLCDM]+)/i;
  const regexSubsecao = /^(SUBSE[CÇ][ÃA]O\s+[IVXLCDM]+)/i;
  const regexLivro = /^(LIVRO\s+[IVXLCDM]+)/i;
  const regexParte = /^(PARTE\s+(GERAL|ESPECIAL|[IVXLCDM]+))/i;
  // Regex corrigido: só captura sufixo de letra se tiver hífen antes (Art. 1º-A, Art. 2º-B)
  // IMPORTANTE: Deve começar com "Art." maiúsculo no início da linha para evitar capturar referências como "art. 5º da Lei X"
  // IMPORTANTE: Não deve capturar artigos marcados como [ALTERACAO_Art. X]
  const regexArtigo = /^Art\.?\s*(\d+[ºª°]?)(?:[-–]\s*([A-Z]))?\s*[.:]?\s*/;
  const regexArtigoAlteracao = /^\[ALTERACAO_Art\.?\s*(\d+[ºª°]?)(?:[-–]\s*([A-Z]))?\]/; // Artigos de outras leis
  const regexTituloDescritivo = /^(D[AEOS]+\s+[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ][A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s]+)$/;
  
  // Regex para detectar contexto de alteração legislativa (artigos de outras leis)
  const regexAlteracaoLegislativa = /(passa[rm]?\s+a\s+vigorar|seguinte\s+reda[çc][ãa]o|acrescentad[oa]\s+[ao]\s+seguinte|revogad[oa]s?\s+[ao]s?\s+seguintes?|fica[mn]?\s+assim\s+redigid[oa]s?)/i;
  const regexDentroDeAspas = /[""][^""]*$/; // Detecta se estamos dentro de aspas
  const regexFimDeAspas = /[""]\s*$/;
  
  // Regex para elementos do final da lei
  const regexDataLocal = /^Bras[íi]lia\s*,?\s*\d+\s+de\s+\w+\s+de\s+\d+/i;
  const regexPresidente = /^[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ][A-ZÁÉÍÓÚÀÂÊÔÃÕÇ\s.]+$/; // Nomes em maiúsculas
  const regexAvisoDOU = /^Este\s+texto\s+n[ãa]o\s+substitui/i;
  const regexDOU = /^DOU\s+de\s+/i;

  let artigoAtual: { numero: string; conteudo: string; ordem: number } | null = null;
  let leiEncontrada = false;
  let ementaEncontrada = false;
  let preambuloEncontrado = false;
  let artigosExtraidos = 0;
  let cabecalhosExtraidos = 0;

  // Função para salvar o artigo atual
  const salvarArtigoAtual = () => {
    if (artigoAtual) {
      let conteudo = artigoAtual.conteudo.trim();
      
      conteudo = conteudo
        // Corrigir barras invertidas antes de pontuação (§ 10\. -> § 10.)
        .replace(/\\([.,;:!?)])/g, '$1')
        .replace(/\\/g, '')
        // Juntar "caput" que ficou em linha separada
        .replace(/\n\s*caput\s*\n/gi, ' caput ')
        .replace(/o\s*\n\s*caput/gi, 'o caput')
        .replace(/do\s*\n\s*caput/gi, 'do caput')
        .replace(/ao\s*\n\s*caput/gi, 'ao caput')
        .replace(/que\s+trata\s+o\s*\n\s*caput/gi, 'que trata o caput')
        
        // ═══════════════════════════════════════════════════════════════════════════
        // REMOVER QUEBRAS DE LINHA DESNECESSÁRIAS (pós-processamento)
        // ═══════════════════════════════════════════════════════════════════════════
        
        // Corrigir quebras de linha incorretas no meio de frases
        .replace(/([a-záéíóúàâêôãõç,])\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
        
        // Juntar preposições/artigos com palavra seguinte
        .replace(/\b(de|da|do|das|dos|em|na|no|nas|nos|a|o|as|os|e|ou|que|se|para|por|com|sem)\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
        
        // Juntar verbos com complementos
        .replace(/\b(poderá|deverá|será|serão|podem|devem|ficam|são|é|bem|assim|como)\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
        
        // CORRIGIR: Juntar inciso romano com texto que ficou na linha seguinte
        // Ex: "IX -\nproteger áreas" → "IX - proteger áreas"
        .replace(/([IVXLCDM]+\s*[-–])\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
        
        // Juntar alíneas com texto
        .replace(/([a-z]\))\s*\n\s*([a-záéíóúàâêôãõç])/gi, '$1 $2')
        
        // Juntar parágrafo com texto (quando começa com maiúscula)
        .replace(/(§\s*\d+[ºª°]?)\s*\n\s*([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ])/g, '$1 $2')
        
        // ═══════════════════════════════════════════════════════════════════════════
        // FORMATAR ESTRUTURA CORRETA (adicionar quebras onde necessário)
        // ═══════════════════════════════════════════════════════════════════════════
        
        // Formatar parágrafos e incisos - APENAS quando é nova estrutura
        .replace(/\s+(Parágrafo único)/gi, '\n\n$1')
        // Parágrafos: quebra dupla APENAS antes do símbolo § seguido de número
        // NÃO quebra se for continuação do mesmo parágrafo (texto corrido)
        .replace(/([.;:!?])\s+(§\s*\d+[ºª°]?)/g, '$1\n\n$2')
        // Incisos romanos: quebra dupla ANTES do inciso
        .replace(/([.;:!?])\s+([IVXLCDM]+\s*[-–])/g, '$1\n\n$2')
        // Alíneas: quebra dupla antes de letra minúscula seguida de parêntese
        .replace(/([.;])\s+([a-z]\))/g, '$1\n\n$2')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      resultado.push({
        "Número do Artigo": artigoAtual.numero,
        Artigo: conteudo,
        ordem_artigo: artigoAtual.ordem
      });
      
      artigosExtraidos++;
      const percentual = ((artigosExtraidos / linhas.length) * 100).toFixed(1);
      logCallback(`📌 Artigo ${artigoAtual.numero} extraído (${artigosExtraidos} artigos - ~${percentual}% processado)`);
      
      artigoAtual = null;
    }
  };

  // Função para salvar cabeçalho separado (cada item em sua própria linha)
  const salvarCabecalhoSeparado = (conteudo: string, tipo: string) => {
    const textoLimpo = conteudo.trim();
    if (textoLimpo) {
      resultado.push({
        "Número do Artigo": null,
        Artigo: textoLimpo,
        ordem_artigo: 999999
      });
      cabecalhosExtraidos++;
      logCallback(`📋 ${tipo} extraído: "${textoLimpo.substring(0, 50)}${textoLimpo.length > 50 ? '...' : ''}"`);
    }
  };

  let ementaAcumulada = '';
  let preambuloAcumulado = '';
  let cabecalhoAcumulado = '';
  
  // Estado para rastrear blocos de alteração legislativa
  let dentroDeAlteracaoLegislativa = false;
  let contadorAspas = 0; // Conta aspas abertas para detectar citações
  let ultimaLinhaComAlteracao = -1;
  const LINHAS_APOS_ALTERACAO = 50; // Ignora artigos dentro de N linhas após detectar alteração

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    
    if (!linha) continue;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DETECÇÃO DE CONTEXTO DE ALTERAÇÃO LEGISLATIVA
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Detecta início de bloco de alteração (ex: "passa a vigorar com a seguinte redação:")
    if (regexAlteracaoLegislativa.test(linha)) {
      dentroDeAlteracaoLegislativa = true;
      ultimaLinhaComAlteracao = i;
      logCallback(`⚠️ Bloco de alteração legislativa detectado na linha ${i}: "${linha.substring(0, 60)}..."`);
    }
    
    // Conta aspas para detectar citações de outras leis
    const aspasAbrem = (linha.match(/["]/g) || []).length;
    const aspasFecham = (linha.match(/["]/g) || []).length;
    contadorAspas += aspasAbrem - aspasFecham;
    
    // Se encontrarmos fechamento de aspas e estamos fora de um bloco recente, reseta
    if (contadorAspas <= 0 && i > ultimaLinhaComAlteracao + 10) {
      contadorAspas = 0;
      if (dentroDeAlteracaoLegislativa && i > ultimaLinhaComAlteracao + LINHAS_APOS_ALTERACAO) {
        dentroDeAlteracaoLegislativa = false;
        logCallback(`✅ Fim do bloco de alteração legislativa (linha ${i})`);
      }
    }

    // 1. Verifica se é a lei (nome da lei em caixa alta) - LINHA SEPARADA
    if (regexLei.test(linha) && !leiEncontrada) {
      salvarArtigoAtual();
      
      // Extrai só a parte da lei
      const matchLei = linha.match(regexLei);
      if (matchLei) {
        salvarCabecalhoSeparado(linha, 'LEI (Nome)');
        leiEncontrada = true;
      }
      continue;
    }

    // 2. Verifica se é a ementa (texto em vermelho - "Dispõe sobre...") - LINHA SEPARADA
    if (regexEmenta.test(linha) && !ementaEncontrada && leiEncontrada) {
      ementaAcumulada = linha;
      ementaEncontrada = true;
      
      // Continua acumulando até encontrar o preâmbulo ou artigo
      continue;
    }

    // Continua acumulando ementa se ainda não encontrou preâmbulo
    if (ementaEncontrada && !preambuloEncontrado && !regexPreambulo.test(linha) && !regexArtigo.test(linha)) {
      if (linha.length < 200 && !regexTitulo.test(linha) && !regexCapitulo.test(linha)) {
        ementaAcumulada += ' ' + linha;
        continue;
      }
    }

    // Salvar ementa acumulada quando encontrar próximo elemento
    if (ementaAcumulada && (regexPreambulo.test(linha) || regexArtigo.test(linha))) {
      salvarCabecalhoSeparado(ementaAcumulada.trim(), 'EMENTA');
      ementaAcumulada = '';
    }

    // 3. Verifica se é o preâmbulo - LINHA SEPARADA
    if (regexPreambulo.test(linha) && !preambuloEncontrado) {
      preambuloAcumulado = linha;
      preambuloEncontrado = true;
      continue;
    }

    // Continua acumulando preâmbulo até Art. 1
    if (preambuloEncontrado && preambuloAcumulado && !regexArtigo.test(linha)) {
      if (linha.length < 200) {
        preambuloAcumulado += ' ' + linha;
        continue;
      }
    }

    // Salvar preâmbulo quando encontrar artigo
    if (preambuloAcumulado && regexArtigo.test(linha)) {
      salvarCabecalhoSeparado(preambuloAcumulado.trim(), 'PREÂMBULO');
      preambuloAcumulado = '';
    }

    // 4.1 Primeiro verifica se é um artigo marcado como alteração (de outra lei)
    if (regexArtigoAlteracao.test(linha)) {
      // Artigo de outra lei - apenas adiciona ao conteúdo do artigo atual
      logCallback(`⚠️ Artigo de outra lei ignorado: "${linha.substring(0, 50)}..."`);
      if (artigoAtual) {
        // Remove a marcação [ALTERACAO_] e adiciona ao texto
        const linhaLimpa = linha.replace(/\[ALTERACAO_/g, '').replace(/\]/g, '');
        artigoAtual.conteudo += '\n' + linhaLimpa;
      }
      continue;
    }
    
    // 4.2 Verifica se é um artigo válido
    const matchArtigo = linha.match(regexArtigo);
    if (matchArtigo) {
      const numeroBase = matchArtigo[1].trim();
      const numeroInteiro = parseInt(numeroBase.replace(/[^\d]/g, '')) || 0;
      
      // ═══════════════════════════════════════════════════════════════════════════
      // FILTRO: Ignorar artigos que são referências a outras leis
      // ═══════════════════════════════════════════════════════════════════════════
      
      // Verifica se estamos dentro de um bloco de alteração legislativa
      const estaDentroDeAlteracao = dentroDeAlteracaoLegislativa && 
                                     contadorAspas > 0 && 
                                     i <= ultimaLinhaComAlteracao + LINHAS_APOS_ALTERACAO;
      
      // Verifica se o artigo parece ser de outra lei (número muito diferente do esperado)
      // Se já temos artigos e este número é muito maior que o último + outlier threshold
      const artigosExistentes = resultado.filter(r => r["Número do Artigo"]);
      let pareceOutraLei = false;
      
      if (artigosExistentes.length > 5) {
        const ultimosNumeros = artigosExistentes
          .slice(-10)
          .map(a => parseInt(a["Número do Artigo"]!.replace(/[^\d]/g, '')) || 0)
          .filter(n => n > 0);
        
        if (ultimosNumeros.length > 0) {
          const maxRecente = Math.max(...ultimosNumeros);
          // Se o número atual é muito maior que o máximo recente (salto > 50), pode ser outlier
          if (numeroInteiro > maxRecente + 50) {
            pareceOutraLei = true;
            logCallback(`⚠️ Artigo ${numeroInteiro} ignorado: possível referência a outra lei (último: ${maxRecente})`);
          }
        }
      }
      
      // Se está dentro de aspas ou bloco de alteração, ignora
      if (estaDentroDeAlteracao || pareceOutraLei) {
        if (estaDentroDeAlteracao) {
          logCallback(`⚠️ Art. ${numeroInteiro} ignorado: dentro de bloco de alteração legislativa`);
        }
        // Adiciona ao conteúdo do artigo atual se existir (faz parte da redação)
        if (artigoAtual) {
          artigoAtual.conteudo += '\n' + linha;
        }
        continue;
      }
      
      // Artigo válido - processa normalmente
      salvarArtigoAtual();
      
      // Salva cabeçalho acumulado se existir
      if (cabecalhoAcumulado) {
        salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
        cabecalhoAcumulado = '';
      }
      
      // matchArtigo[2] = sufixo letra se existir (ex: "A" para Art. 4º-A)
      const sufixoLetra = matchArtigo[2] ? matchArtigo[2].trim().toUpperCase() : '';
      
      // Calcula ordem para sufixos tipo -A, -B
      let sufixoOrdem = 0;
      if (sufixoLetra) {
        sufixoOrdem = sufixoLetra.charCodeAt(0) - 64;
      }
      
      // Normaliza o número do artigo corretamente
      let numeroNormalizado = normalizarNumeroArtigo(numeroBase);
      if (sufixoLetra) {
        numeroNormalizado += '-' + sufixoLetra;
      }
      
      // Remove o "Art. Xº" do início e reconstrói com formato correto
      const textoSemPrefixo = linha.replace(regexArtigo, '').trim();
      
      // Reseta estado de alteração quando encontramos artigo válido
      if (dentroDeAlteracaoLegislativa) {
        dentroDeAlteracaoLegislativa = false;
        contadorAspas = 0;
      }
      
      artigoAtual = {
        numero: numeroNormalizado,
        conteudo: `Art. ${numeroNormalizado} ${textoSemPrefixo}`,
        ordem: numeroInteiro * 1000 + sufixoOrdem
      };
      continue;
    }

    // 5. Verifica se é um cabeçalho estrutural (TÍTULO, CAPÍTULO, SEÇÃO, etc) - CADA UM EM LINHA SEPARADA
    if (regexTitulo.test(linha)) {
      salvarArtigoAtual();
      if (cabecalhoAcumulado) {
        salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
        cabecalhoAcumulado = '';
      }
      cabecalhoAcumulado = linha;
      continue;
    }

    if (regexCapitulo.test(linha)) {
      salvarArtigoAtual();
      if (cabecalhoAcumulado) {
        salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
        cabecalhoAcumulado = '';
      }
      cabecalhoAcumulado = linha;
      continue;
    }

    if (regexSecao.test(linha) || regexSubsecao.test(linha)) {
      salvarArtigoAtual();
      if (cabecalhoAcumulado) {
        salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
        cabecalhoAcumulado = '';
      }
      cabecalhoAcumulado = linha;
      continue;
    }

    if (regexLivro.test(linha) || regexParte.test(linha)) {
      salvarArtigoAtual();
      if (cabecalhoAcumulado) {
        salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
        cabecalhoAcumulado = '';
      }
      cabecalhoAcumulado = linha;
      continue;
    }

    // 6. Verifica se é um título descritivo em maiúsculas (DA PROTEÇÃO, DOS DIREITOS, etc)
    if (regexTituloDescritivo.test(linha) && linha.length < 80 && linha === linha.toUpperCase()) {
      if (cabecalhoAcumulado) {
        // Adiciona ao cabeçalho existente
        cabecalhoAcumulado += '\n' + linha;
      } else if (!artigoAtual) {
        cabecalhoAcumulado = linha;
      } else {
        salvarArtigoAtual();
        cabecalhoAcumulado = linha;
      }
      continue;
    }

    // 7. Verifica elementos do FINAL da lei (data, presidente, aviso DOU)
    
    // Data e local: "Brasília, 3 de janeiro de 1967..."
    if (regexDataLocal.test(linha)) {
      salvarArtigoAtual();
      if (cabecalhoAcumulado) {
        salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
        cabecalhoAcumulado = '';
      }
      salvarCabecalhoSeparado(linha, 'DATA/LOCAL');
      continue;
    }

    // Aviso do DOU: "Este texto não substitui o publicado no..." + "DOU de X"
    // Deve ficar tudo na mesma linha (texto vermelho no original)
    if (regexAvisoDOU.test(linha)) {
      salvarArtigoAtual();
      if (cabecalhoAcumulado) {
        salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
        cabecalhoAcumulado = '';
      }
      // Acumula linhas seguintes até encontrar o DOU ou outra coisa
      let avisoCompleto = linha;
      
      // Olha as próximas linhas para juntar o "DOU de X"
      let j = i + 1;
      while (j < linhas.length) {
        const proxLinha = linhas[j].trim();
        if (!proxLinha) {
          j++;
          continue;
        }
        // Se for a linha do DOU, junta
        if (regexDOU.test(proxLinha)) {
          avisoCompleto += ' ' + proxLinha;
          i = j; // Avança o índice principal
          break;
        }
        // Se for outra coisa (nome, artigo, etc), para
        if (regexArtigo.test(proxLinha) || regexPresidente.test(proxLinha)) {
          break;
        }
        // Se for continuação curta, junta
        if (proxLinha.length < 50) {
          avisoCompleto += ' ' + proxLinha;
          i = j;
          j++;
        } else {
          break;
        }
      }
      
      salvarCabecalhoSeparado(avisoCompleto, 'AVISO DOU');
      continue;
    }

    // DOU isolado só se não foi capturado acima: "DOU de 5.1.1967"
    if (regexDOU.test(linha)) {
      salvarArtigoAtual();
      if (cabecalhoAcumulado) {
        salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
        cabecalhoAcumulado = '';
      }
      salvarCabecalhoSeparado(linha, 'DOU');
      continue;
    }

    // Nome do presidente/signatário (em MAIÚSCULAS, curto, sem ser artigo)
    // Detecta nomes como "H. CASTELLO BRANCO", "_Severo Fagundes Gomes_"
    const linhaSemUnderline = linha.replace(/^_|_$/g, '');
    if (
      linha.length > 3 && 
      linha.length < 60 && 
      !regexArtigo.test(linha) &&
      !regexLei.test(linha) &&
      !regexTitulo.test(linha) &&
      !regexCapitulo.test(linha) &&
      (
        (regexPresidente.test(linha) && linha.length > 5 && linha.length < 50) ||
        (linha.startsWith('_') && linha.endsWith('_'))
      )
    ) {
      // Verifica se parece um nome de pessoa (não é um título de seção)
      const palavras = linhaSemUnderline.split(/\s+/);
      if (palavras.length >= 2 && palavras.length <= 6) {
        salvarArtigoAtual();
        if (cabecalhoAcumulado) {
          salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
          cabecalhoAcumulado = '';
        }
        salvarCabecalhoSeparado(linha.replace(/^_|_$/g, ''), 'SIGNATÁRIO');
        continue;
      }
    }

    // 8. Se estamos acumulando um cabeçalho (antes do primeiro artigo)
    if (cabecalhoAcumulado && !artigoAtual) {
      if (linha.length < 100 && !regexArtigo.test(linha)) {
        cabecalhoAcumulado += '\n' + linha;
        continue;
      }
    }

    // 9. Se estamos dentro de um artigo, adiciona a linha ao conteúdo
    if (artigoAtual) {
      artigoAtual.conteudo += '\n' + linha;
    }
  }

  // Salva elementos pendentes
  if (ementaAcumulada) {
    salvarCabecalhoSeparado(ementaAcumulada.trim(), 'EMENTA');
  }
  if (preambuloAcumulado) {
    salvarCabecalhoSeparado(preambuloAcumulado.trim(), 'PREÂMBULO');
  }
  salvarArtigoAtual();
  if (cabecalhoAcumulado) {
    salvarCabecalhoSeparado(cabecalhoAcumulado, 'CABEÇALHO');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS DETALHADAS DE EXTRAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Contar artigos no texto original para comparação
  const regexContagemBruta = /\bArt\.?\s*(\d+)[º°ª]?\s*[-–.]/gi;
  const matchesBruto = Array.from(markdown.matchAll(regexContagemBruta));
  const numerosNoBruto = new Set<number>();
  for (const match of matchesBruto) {
    const num = parseInt(match[1] as string);
    if (num > 0 && num < 1000) { // Ignora números absurdos
      numerosNoBruto.add(num);
    }
  }
  
  // Números extraídos
  const numerosExtraidos = new Set<number>();
  const duplicadosEncontrados: string[] = [];
  const artigosMap = new Map<number, string[]>();
  
  for (const artigo of resultado) {
    if (artigo["Número do Artigo"]) {
      const match = artigo["Número do Artigo"].match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        numerosExtraidos.add(num);
        
        // Rastrear duplicados
        if (!artigosMap.has(num)) {
          artigosMap.set(num, []);
        }
        artigosMap.get(num)!.push(artigo["Número do Artigo"]);
      }
    }
  }
  
  // Detectar duplicados
  for (const [num, ocorrencias] of artigosMap.entries()) {
    if (ocorrencias.length > 1) {
      duplicadosEncontrados.push(`Art. ${num} (${ocorrencias.length}x)`);
    }
  }
  
  // Artigos faltantes (no bruto mas não extraídos)
  const faltantes: number[] = [];
  for (const num of numerosNoBruto) {
    if (!numerosExtraidos.has(num)) {
      faltantes.push(num);
    }
  }
  faltantes.sort((a, b) => a - b);
  
  // Artigos extras (extraídos mas não no bruto) - possíveis referências a outras leis
  const extras: number[] = [];
  for (const num of numerosExtraidos) {
    if (!numerosNoBruto.has(num)) {
      extras.push(num);
    }
  }
  extras.sort((a, b) => a - b);
  
  logCallback('═══════════════════════════════════════════════════════════');
  logCallback(`✅ EXTRAÇÃO CONCLUÍDA`);
  logCallback(`📊 Total de artigos extraídos: ${artigosExtraidos}`);
  logCallback(`📊 Total de cabeçalhos: ${cabecalhosExtraidos}`);
  logCallback(`📊 Total de registros: ${resultado.length}`);
  logCallback('───────────────────────────────────────────────────────────');
  logCallback(`📈 ESTATÍSTICAS DE COMPARAÇÃO:`);
  logCallback(`   Artigos no texto bruto: ${numerosNoBruto.size}`);
  logCallback(`   Artigos extraídos: ${numerosExtraidos.size}`);
  logCallback(`   Cobertura: ${numerosNoBruto.size > 0 ? ((numerosExtraidos.size / numerosNoBruto.size) * 100).toFixed(1) : 0}%`);
  
  if (duplicadosEncontrados.length > 0) {
    logCallback(`⚠️ Duplicados encontrados: ${duplicadosEncontrados.length}`);
    if (duplicadosEncontrados.length <= 10) {
      logCallback(`   ${duplicadosEncontrados.join(', ')}`);
    } else {
      logCallback(`   ${duplicadosEncontrados.slice(0, 10).join(', ')}... e mais ${duplicadosEncontrados.length - 10}`);
    }
  }
  
  if (faltantes.length > 0) {
    logCallback(`⚠️ Artigos faltantes: ${faltantes.length}`);
    if (faltantes.length <= 15) {
      logCallback(`   ${faltantes.join(', ')}`);
    } else {
      logCallback(`   ${faltantes.slice(0, 15).join(', ')}... e mais ${faltantes.length - 15}`);
    }
  }
  
  if (extras.length > 0) {
    logCallback(`ℹ️ Artigos extras (possíveis referências): ${extras.length}`);
    if (extras.length <= 10) {
      logCallback(`   ${extras.join(', ')}`);
    } else {
      logCallback(`   ${extras.slice(0, 10).join(', ')}... e mais ${extras.length - 10}`);
    }
  }
  
  logCallback('═══════════════════════════════════════════════════════════');

  return resultado;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO DE VALIDAÇÃO E CORREÇÃO AUTOMÁTICA DE ARTIGOS FALTANTES
// ═══════════════════════════════════════════════════════════════════════════
function detectarArtigosFaltantes(artigos: Array<{ "Número do Artigo": string | null; Artigo: string; ordem_artigo: number }>): number[] {
  // Extrai apenas os números dos artigos (ignora cabeçalhos)
  const numerosArtigos = artigos
    .filter(a => a["Número do Artigo"] !== null)
    .map(a => {
      const match = a["Número do Artigo"]!.match(/^(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0)
    .sort((a, b) => a - b);

  if (numerosArtigos.length === 0) return [];

  const faltantes: number[] = [];
  const maxArtigo = Math.max(...numerosArtigos);
  const artigosSet = new Set(numerosArtigos);

  // Detecta lacunas na sequência (só até o máximo encontrado)
  for (let i = 1; i <= maxArtigo; i++) {
    if (!artigosSet.has(i)) {
      faltantes.push(i);
    }
  }

  return faltantes;
}

function aplicarCorrecoesAdicionais(textoOriginal: string, artigosFaltantes: number[], logCallback: (msg: string) => void): string {
  let texto = textoOriginal;
  
  logCallback(`🔧 Aplicando correções adicionais para ${artigosFaltantes.length} artigos faltantes...`);
  
  // Padrões adicionais de normalização para casos problemáticos
  const correcoesAdicionais = [
    // Art seguido de quebra de linha e número com sufixo
    { pattern: /Art\s*\.\s*\n+\s*(\d+)\s*[ºª°]/gi, replacement: 'Art. $1º' },
    { pattern: /Art\s*\n+\s*(\d+)\s*[ºª°]/gi, replacement: 'Art. $1º' },
    
    // Art. com espaços extras antes do número
    { pattern: /Art\s*\.\s{2,}(\d+)/gi, replacement: 'Art. $1' },
    
    // Art em negrito/itálico markdown quebrado
    { pattern: /\*\*Art\s*\.\s*\*\*\s*\n*\s*(\d+)/gi, replacement: 'Art. $1' },
    { pattern: /\*Art\s*\.\s*\*\s*\n*\s*(\d+)/gi, replacement: 'Art. $1' },
    { pattern: /_Art\s*\.\s*_\s*\n*\s*(\d+)/gi, replacement: 'Art. $1' },
    
    // Art. dentro de links markdown
    { pattern: /\[Art\s*\.\s*\]\([^)]*\)\s*\n*\s*(\d+)/gi, replacement: 'Art. $1' },
    
    // Artigo escrito por extenso
    { pattern: /Artigo\s+(\d+)[ºª°]?\s*[.:-]/gi, replacement: 'Art. $1º -' },
    
    // Art sem ponto com número na mesma linha
    { pattern: /\bArt\s+(\d+[ºª°]?)\s*[-–:.]/gi, replacement: 'Art. $1 -' },
    
    // Número do artigo isolado após "Art." em outra linha (com possíveis caracteres entre)
    { pattern: /Art\s*\.\s*[\n\r]+\s*[–-]?\s*(\d+[ºª°]?)/gi, replacement: 'Art. $1' },
    
    // Art. com tab ou múltiplos espaços
    { pattern: /Art\s*\.\t+(\d+)/gi, replacement: 'Art. $1' },
    
    // Casos onde há ** ou outros caracteres entre Art. e número
    { pattern: /Art\s*\.\s*\**\s*(\d+[ºª°]?)\s*\**/gi, replacement: 'Art. $1' },
  ];

  for (const correcao of correcoesAdicionais) {
    const antes = texto;
    texto = texto.replace(correcao.pattern, correcao.replacement);
    if (texto !== antes) {
      logCallback(`   ✓ Aplicada correção: ${correcao.pattern.toString().substring(0, 40)}...`);
    }
  }

  // Correção específica para artigos faltantes conhecidos
  // Tenta encontrar padrões específicos para cada artigo faltante
  for (const numFaltante of artigosFaltantes.slice(0, 20)) { // Limita a 20 para não sobrecarregar
    // Padrões específicos para o número do artigo
    const patterns = [
      new RegExp(`Art\\s*\\.?\\s*\\n+\\s*${numFaltante}\\s*[ºª°]`, 'gi'),
      new RegExp(`\\bArt\\s+${numFaltante}\\b`, 'gi'),
      new RegExp(`Artigo\\s+${numFaltante}\\b`, 'gi'),
      new RegExp(`Art\\.\\s*\\*+\\s*${numFaltante}`, 'gi'),
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(texto)) {
        texto = texto.replace(pattern, `Art. ${numFaltante}º`);
        logCallback(`   ✓ Corrigido artigo específico: ${numFaltante}`);
        break;
      }
    }
  }

  return texto;
}

async function extrairConteudoComValidacao(
  markdown: string, 
  logCallback: (msg: string) => void,
  maxTentativas: number = 3
): Promise<Array<{ "Número do Artigo": string | null; Artigo: string; ordem_artigo: number }>> {
  
  let textoAtual = markdown;
  let tentativa = 1;
  let resultado: Array<{ "Número do Artigo": string | null; Artigo: string; ordem_artigo: number }> = [];
  let artigosFaltantesAnterior: number[] = [];

  while (tentativa <= maxTentativas) {
    logCallback(`\n📋 TENTATIVA ${tentativa}/${maxTentativas} de extração...`);
    
    // Executa extração
    resultado = extrairConteudo(textoAtual, logCallback);
    
    // Detecta artigos faltantes
    const artigosFaltantes = detectarArtigosFaltantes(resultado);
    
    if (artigosFaltantes.length === 0) {
      logCallback(`✅ Todos os artigos foram extraídos com sucesso!`);
      break;
    }
    
    // Calcula estatísticas
    const totalArtigos = resultado.filter(r => r["Número do Artigo"] !== null).length;
    const percentualFaltante = ((artigosFaltantes.length / (totalArtigos + artigosFaltantes.length)) * 100).toFixed(1);
    
    logCallback(`⚠️ Detectados ${artigosFaltantes.length} artigos faltantes (${percentualFaltante}%)`);
    
    if (artigosFaltantes.length <= 10) {
      logCallback(`   Faltantes: ${artigosFaltantes.join(', ')}`);
    } else {
      logCallback(`   Primeiros faltantes: ${artigosFaltantes.slice(0, 10).join(', ')}... e mais ${artigosFaltantes.length - 10}`);
    }
    
    // Verifica se houve melhoria em relação à tentativa anterior
    if (tentativa > 1 && artigosFaltantes.length >= artigosFaltantesAnterior.length) {
      logCallback(`⚠️ Correções não melhoraram a extração. Mantendo resultado atual.`);
      break;
    }
    
    // Se há muitos artigos faltantes (>30%), provavelmente é um problema estrutural
    if (parseFloat(percentualFaltante) > 30) {
      logCallback(`⚠️ Muitos artigos faltantes (>${percentualFaltante}%). Pode haver problema estrutural no HTML.`);
      if (tentativa === maxTentativas) break;
    }
    
    // Aplica correções adicionais para próxima tentativa
    if (tentativa < maxTentativas) {
      artigosFaltantesAnterior = [...artigosFaltantes];
      textoAtual = aplicarCorrecoesAdicionais(textoAtual, artigosFaltantes, logCallback);
      tentativa++;
    } else {
      break;
    }
  }

  // Log final de validação
  const faltantesFinais = detectarArtigosFaltantes(resultado);
  if (faltantesFinais.length > 0) {
    logCallback(`\n⚠️ AVISO: ${faltantesFinais.length} artigos ainda faltantes após ${tentativa} tentativa(s)`);
    if (faltantesFinais.length <= 15) {
      logCallback(`   Artigos não encontrados: ${faltantesFinais.join(', ')}`);
    }
  } else {
    logCallback(`\n✅ VALIDAÇÃO: Todos os artigos extraídos com sucesso!`);
  }

  return resultado;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { tableName, urlPlanalto, mode = 'scrape', streaming = false } = await req.json();

  // Para streaming, usamos SSE (Server-Sent Events)
  if (streaming) {
    const encoder = new TextEncoder();
    
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    const sendLog = async (msg: string) => {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const logMsg = `[${timestamp}] ${msg}`;
      console.log(logMsg);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'log', message: logMsg })}\n\n`));
    };

    const sendResult = async (result: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'result', ...result })}\n\n`));
      await writer.close();
    };

    // Processar em background
    (async () => {
      try {
        await sendLog('🚀 INICIANDO RASPAGEM DE LEI (Streaming)');
        await sendLog(`📋 Tabela: ${tableName}`);
        await sendLog(`🔗 URL: ${urlPlanalto}`);
        await sendLog(`⚙️ Modo: ${mode}`);

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseClient = createClient(supabaseUrl, supabaseKey);

        // ETAPA 1: Raspagem DIRETA do Planalto (sem Firecrawl)
        await sendLog('🌐 ETAPA 1: Baixando página direto do Planalto...');
        await sendLog(`🔗 URL completa: ${urlPlanalto}`);
        
        const fetchResult = await fetchPlanaltoDirecto(urlPlanalto, sendLog);
        
        if (!fetchResult.sucesso || !fetchResult.html) {
          await sendResult({ success: false, error: fetchResult.erro || 'Erro ao baixar página do Planalto' });
          return;
        }

        const htmlOriginal = fetchResult.html;
        let markdown = '';
        
        // ═══════════════════════════════════════════════════════════════════
        // ETAPA 1.5: REMOVER TEXTOS TACHADOS (STRIKE/LINE-THROUGH) COM DOM PARSING
        // ═══════════════════════════════════════════════════════════════════
        if (htmlOriginal && htmlOriginal.length > 100) {
          await sendLog('🔧 ETAPA 1.5: Removendo textos tachados com DOM parsing...');
          
          const resultadoDOM = removerTextosTachadosComDOM(htmlOriginal, (msg: string) => sendLog(msg));
          
          if (resultadoDOM.sucesso && resultadoDOM.textoLimpo.length > 100) {
            await sendLog(`   📊 HTML original: ${htmlOriginal.length} chars`);
            await sendLog(`   📊 Texto extraído via DOM: ${resultadoDOM.textoLimpo.length} chars`);
            await sendLog(`   📊 Elementos tachados removidos: ${resultadoDOM.removidos}`);
            
            markdown = resultadoDOM.textoLimpo;
            await sendLog(`✅ Usando texto extraído via DOM (sem tachados) para extração`);
          } else {
            await sendLog('⚠️ DOM parsing falhou ou texto muito curto, tentando regex...');
            
            const htmlLimpo = removerTextosTachadosRegex(htmlOriginal, (msg: string) => sendLog(msg));
            
            if (htmlLimpo.length < htmlOriginal.length) {
              const textoLimpo = htmlParaTexto(htmlLimpo);
              await sendLog(`   📊 HTML original: ${htmlOriginal.length} chars → Regex limpo: ${htmlLimpo.length} chars`);
              await sendLog(`   📊 Texto convertido: ${textoLimpo.length} chars`);
              
              if (textoLimpo.length > 100) {
                markdown = textoLimpo;
                await sendLog(`✅ Usando texto limpo (regex) para extração`);
              } else {
                // Fallback: converte HTML bruto para texto
                markdown = htmlParaTexto(htmlOriginal);
                await sendLog(`⚠️ Texto limpo muito curto, usando conversão bruta de HTML`);
              }
            } else {
              markdown = htmlParaTexto(htmlOriginal);
              await sendLog(`ℹ️ Sem textos tachados, usando conversão de HTML para texto`);
            }
          }
        }
        
        if (!markdown || markdown.length < 100) {
          await sendResult({ success: false, error: 'Conteúdo insuficiente extraído da página' });
          return;
        }

        await sendLog(`✅ Raspagem direta concluída: ${markdown.length} caracteres para extração`);
        
        // Nota: Removida contagem de "artigos no texto original" que gerava divergências falsas
        // A análise de lacunas já detecta gaps na sequência de artigos (ex: Art. 90 -> 146 = gap)

        // MODO preview_raw: SEM Gemini - retorna texto como veio
        if (mode === 'preview_raw') {
          await sendLog('📚 ETAPA 2: Extraindo artigos SEM processamento de IA...');
          
          const syncLogs: string[] = [];
          const syncLogCallback = (msg: string) => syncLogs.push(msg);
          
          const artigos = extrairConteudo(markdown, syncLogCallback);
          
          for (const logMsg of syncLogs) {
            await sendLog(logMsg);
          }

          if (artigos.length === 0) {
            await sendResult({ success: false, error: 'Nenhum artigo encontrado no conteúdo' });
            return;
          }

          // Análise básica de lacunas (sem Gemini)
          const lacunaLogs: string[] = [];
          const analiseArtigos = analisarLacunasArtigos(artigos, (msg) => lacunaLogs.push(msg));
          for (const logMsg of lacunaLogs) {
            await sendLog(logMsg);
          }

          // A análise de lacunas já detecta artigos faltantes na sequência
          // Removida a "divergência" que gerava falsos positivos por contar referências

          const ultimaAtualizacao = extrairUltimaAtualizacao(markdown);

          await sendLog('📋 Modo preview_raw: retornando dados SEM processamento de IA...');
          await sendLog(`📊 RESUMO: ${artigos.length} registros, ${analiseArtigos.artigosEncontrados} artigos`);
          await sendLog('💡 Use o botão "Analisar com IA" para processar com Gemini');
          
          await sendResult({
            success: true,
            totalArtigos: artigos.length,
            preview: artigos.map(a => ({
              "Número do Artigo": a["Número do Artigo"],
              Artigo: a.Artigo,
              ordem_artigo: a.ordem_artigo
            })),
            markdownOriginal: markdown,
            ultimaAtualizacao: ultimaAtualizacao.data,
            anoAtualizacao: ultimaAtualizacao.ano,
            diasAtras: ultimaAtualizacao.diasAtras,
            analiseArtigos,
            message: `${artigos.length} registros encontrados (sem IA). Clique em "Analisar com IA" para processar.`
          });
          return;
        }

        // MODO analyze: Processa com Gemini
        if (mode === 'analyze') {
          await sendLog('🤖 ETAPA 2: Limpando texto com Gemini...');
          const markdownLimpo = await limparMarkdownComGemini(markdown, async (msg) => await sendLog(msg));
          await sendLog(`✅ Gemini concluído: ${markdownLimpo.length} caracteres processados`);

          await sendLog('📚 ETAPA 3: Extraindo artigos com validação automática...');
          const syncLogs: string[] = [];
          let artigos = await extrairConteudoComValidacao(markdownLimpo, (msg) => syncLogs.push(msg));
          for (const logMsg of syncLogs) {
            await sendLog(logMsg);
          }

          if (artigos.length === 0) {
            await sendResult({ success: false, error: 'Nenhum artigo encontrado no conteúdo' });
            return;
          }

          await sendLog('🔍 ETAPA 3.5: Validando formatação com Gemini...');
          const validationLogs: string[] = [];
          artigos = await validarArtigosComGemini(artigos, markdown, (msg) => validationLogs.push(msg));
          for (const logMsg of validationLogs) {
            await sendLog(logMsg);
          }

          await sendLog('📊 ETAPA 4: Analisando lacunas...');
          const lacunaLogs: string[] = [];
          let analiseArtigos = analisarLacunasArtigos(artigos, (msg) => lacunaLogs.push(msg));
          for (const logMsg of lacunaLogs) {
            await sendLog(logMsg);
          }

          // ═══════════════════════════════════════════════════════════════════
          // SISTEMA DE FALLBACK PROGRESSIVO (modo analyze)
          // ═══════════════════════════════════════════════════════════════════
          let metodoFinal = 1;
          let relatorioFallback = '';
          
          if (analiseArtigos.lacunas.length > 0) {
            const totalFaltando = analiseArtigos.lacunas.reduce((acc, l) => acc + l.quantidade, 0);
            await sendLog(`⚠️ ${totalFaltando} artigos faltando - iniciando fallback progressivo...`);
            
            const resultadoFallback = await executarFallbackProgressivo(
              urlPlanalto,
              '',
              tableName,
              artigos,
              analiseArtigos,
              markdownLimpo,
              sendLog
            );
            
            artigos = resultadoFallback.artigos;
            analiseArtigos = resultadoFallback.analise;
            metodoFinal = resultadoFallback.metodoFinal;
            relatorioFallback = resultadoFallback.relatorio;
            
            // Explicar lacunas restantes com Gemini
            if (analiseArtigos.lacunas.length > 0) {
              await sendLog('🤖 Explicando lacunas restantes com Gemini...');
              const { lacunasAtualizadas, relatorio } = await explicarLacunasComGemini(
                analiseArtigos.lacunas,
                markdownLimpo,
                tableName,
                async (msg) => await sendLog(msg)
              );
              analiseArtigos = {
                ...analiseArtigos,
                lacunas: lacunasAtualizadas,
                relatorioGemini: relatorio
              };
            }
          }

          const ultimaAtualizacao = extrairUltimaAtualizacao(markdownLimpo);

          await sendLog('📋 Modo analyze: retornando dados processados com IA...');
          await sendLog(`📊 RESUMO: ${artigos.length} registros, ${analiseArtigos.artigosEncontrados} artigos`);
          if (metodoFinal > 1) {
            await sendLog(`📊 Método final utilizado: ${metodoFinal}`);
          }
          
          await sendResult({
            success: true,
            totalArtigos: artigos.length,
            preview: artigos.map(a => ({
              "Número do Artigo": a["Número do Artigo"],
              Artigo: a.Artigo,
              ordem_artigo: a.ordem_artigo
            })),
            ultimaAtualizacao: ultimaAtualizacao.data,
            anoAtualizacao: ultimaAtualizacao.ano,
            diasAtras: ultimaAtualizacao.diasAtras,
            analiseArtigos,
            metodoFinal,
            relatorioFallback,
            message: `${artigos.length} registros processados com IA. ${metodoFinal > 1 ? `Fallback até método ${metodoFinal}.` : ''}`
          });
          return;
        }

        // MODO preview e scrape: SEM Gemini para limpeza (extração direta)
        // Gemini era usado para limpeza mas cortava textos longos
        await sendLog('📚 ETAPA 2: Extraindo artigos com validação automática...');
        const syncLogs: string[] = [];
        const syncLogCallback = (msg: string) => syncLogs.push(msg);
        
        let artigos = await extrairConteudoComValidacao(markdown, syncLogCallback);
        
        for (const logMsg of syncLogs) {
          await sendLog(logMsg);
        }

        if (artigos.length === 0) {
          await sendResult({ success: false, error: 'Nenhum artigo encontrado no conteúdo' });
          return;
        }

        const totalArtigosAntes = artigos.filter(r => r["Número do Artigo"]).length;
        await sendLog(`✅ Extração concluída: ${totalArtigosAntes} artigos`);

        // Validação com Gemini apenas para formatação (amostra pequena, não corta texto)
        await sendLog('🔍 ETAPA 3: Validando formatação com Gemini (amostra)...');
        const validationLogs: string[] = [];
        artigos = await validarArtigosComGemini(artigos, markdown, (msg) => validationLogs.push(msg));
        for (const logMsg of validationLogs) {
          await sendLog(logMsg);
        }

        await sendLog('📊 ETAPA 4: Analisando lacunas...');
        const lacunaLogs: string[] = [];
        let analiseArtigos = analisarLacunasArtigos(artigos, (msg) => lacunaLogs.push(msg));
        for (const logMsg of lacunaLogs) {
          await sendLog(logMsg);
        }

        // ═══════════════════════════════════════════════════════════════════
        // SISTEMA DE FALLBACK PROGRESSIVO
        // Se detectar lacunas, tenta métodos adicionais para recuperar artigos
        // ═══════════════════════════════════════════════════════════════════
        let metodoFinal = 1;
        let relatorioFallback = '';
        
        if (analiseArtigos.lacunas.length > 0) {
          const totalFaltando = analiseArtigos.lacunas.reduce((acc, l) => acc + l.quantidade, 0);
          await sendLog(`⚠️ ${totalFaltando} artigos faltando - iniciando fallback progressivo...`);
          
          const resultadoFallback = await executarFallbackProgressivo(
            urlPlanalto,
            '',
            tableName,
            artigos,
            analiseArtigos,
            markdown,
            sendLog
          );
          
          artigos = resultadoFallback.artigos;
          analiseArtigos = resultadoFallback.analise;
          metodoFinal = resultadoFallback.metodoFinal;
          relatorioFallback = resultadoFallback.relatorio;
        }

        const ultimaAtualizacao = extrairUltimaAtualizacao(markdown);

        if (mode === 'preview') {
          await sendLog('📋 Modo preview: retornando dados...');
          await sendLog(`📊 RESUMO: ${artigos.length} registros, ${analiseArtigos.artigosEncontrados} artigos`);
          if (metodoFinal > 1) {
            await sendLog(`📊 Método final utilizado: ${metodoFinal}`);
          }
          
          await sendResult({
            success: true,
            totalArtigos: artigos.length,
            preview: artigos.map(a => ({
              "Número do Artigo": a["Número do Artigo"],
              Artigo: a.Artigo,
              ordem_artigo: a.ordem_artigo
            })),
            ultimaAtualizacao: ultimaAtualizacao.data,
            anoAtualizacao: ultimaAtualizacao.ano,
            diasAtras: ultimaAtualizacao.diasAtras,
            analiseArtigos,
            metodoFinal,
            relatorioFallback,
            message: `${artigos.length} registros encontrados. ${metodoFinal > 1 ? `Fallback até método ${metodoFinal}.` : ''}`
          });
          return;
        }

        // Modo scrape: inserir no banco
        await sendLog('💾 Inserindo no banco de dados...');
        const batchSize = 20;
        let totalInseridos = 0;
        
        for (let i = 0; i < artigos.length; i += batchSize) {
          const batch = artigos.slice(i, i + batchSize);
          const loteAtual = Math.floor(i / batchSize) + 1;
          const totalLotes = Math.ceil(artigos.length / batchSize);
          
          await sendLog(`📦 Inserindo lote ${loteAtual}/${totalLotes}...`);
          
          const { data, error } = await supabaseClient
            .from(tableName)
            .insert(batch)
            .select();

          if (error) {
            await sendLog(`❌ Erro no lote ${loteAtual}: ${error.message}`);
          } else {
            totalInseridos += data?.length || 0;
          }
        }

        await sendLog(`✅ CONCLUÍDO: ${totalInseridos} registros inseridos`);
        if (metodoFinal > 1) {
          await sendLog(`📊 Método final utilizado: ${metodoFinal}`);
        }
        await sendResult({
          success: totalInseridos > 0,
          totalArtigos: artigos.length,
          totalInseridos,
          analiseArtigos,
          metodoFinal,
          relatorioFallback
        });

      } catch (error) {
        await sendLog(`❌ ERRO FATAL: ${error instanceof Error ? error.message : 'Erro'}`);
        await sendResult({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' });
      }
    })();

    return new Response(stream.readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Modo normal (sem streaming) - código original
  // Usa os valores já parseados do body (tableName, urlPlanalto, mode)
  const logs: string[] = [];
  const log = (msg: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMsg = `[${timestamp}] ${msg}`;
    console.log(logMsg);
    logs.push(logMsg);
  };

  try {
    log('═══════════════════════════════════════════════════════════');
    log('🚀 INICIANDO RASPAGEM DE LEI');
    log('═══════════════════════════════════════════════════════════');
    log(`📋 Tabela: ${tableName}`);
    log(`🔗 URL: ${urlPlanalto}`);
    log(`⚙️ Modo: ${mode}`);

    if (!tableName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome da tabela é obrigatório', logs }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!urlPlanalto) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL do Planalto é obrigatória', logs }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ═══════════════════════════════════════════════════════════
    // ETAPA 1: RASPAGEM DIRETA DO PLANALTO (sem Firecrawl)
    // ═══════════════════════════════════════════════════════════
    log('───────────────────────────────────────────────────────────');
    log('🌐 ETAPA 1: Baixando página direto do Planalto...');
    log('───────────────────────────────────────────────────────────');
    
    const fetchResult = await fetchPlanaltoDirecto(urlPlanalto);
    
    if (!fetchResult.sucesso || !fetchResult.html) {
      log(`❌ Erro no fetch direto: ${fetchResult.erro}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: fetchResult.erro || 'Erro ao baixar página do Planalto',
          logs 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar HTML: remover tachados e converter para texto
    const resultadoDOM = removerTextosTachadosComDOM(fetchResult.html, (msg) => log(msg));
    const markdown = resultadoDOM.sucesso && resultadoDOM.textoLimpo.length > 100 
      ? resultadoDOM.textoLimpo 
      : htmlParaTexto(fetchResult.html);
    
    if (!markdown || markdown.length < 100) {
      log('❌ Conteúdo insuficiente extraído');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Conteúdo insuficiente extraído da página',
          logs 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log(`✅ Raspagem direta concluída: ${markdown.length} caracteres extraídos`);
    
    // Contar quantos "Art." existem no markdown bruto
    const artigosNoMarkdown = (markdown.match(/Art\.?\s*\d+/gi) || []).length;
    log(`📊 Artigos detectados no markdown bruto: ${artigosNoMarkdown}`);
    
    // Verificar se há menções a revogado/vetado
    const revogadosNoMarkdown = (markdown.match(/revogad[oa]/gi) || []).length;
    const vetadosNoMarkdown = (markdown.match(/vetad[oa]/gi) || []).length;
    log(`📊 Menções a 'revogado': ${revogadosNoMarkdown} | 'vetado': ${vetadosNoMarkdown}`);

    // ═══════════════════════════════════════════════════════════
    // ETAPA 2: LIMPEZA COM GEMINI
    // ═══════════════════════════════════════════════════════════
    log('───────────────────────────────────────────────────────────');
    log('🤖 ETAPA 2: Limpando texto com Gemini...');
    log('───────────────────────────────────────────────────────────');
    
    const markdownLimpo = await limparMarkdownComGemini(markdown, log);
    log(`✅ Gemini concluído: ${markdownLimpo.length} caracteres processados`);
    
    // Verificar se Gemini manteve os artigos
    const artigosAposGemini = (markdownLimpo.match(/Art\.?\s*\d+/gi) || []).length;
    log(`📊 Artigos após limpeza Gemini: ${artigosAposGemini}`);
    
    if (artigosAposGemini < artigosNoMarkdown * 0.5) {
      log(`⚠️ ALERTA: Gemini pode ter removido artigos! (${artigosNoMarkdown} → ${artigosAposGemini})`);
    }

    // ═══════════════════════════════════════════════════════════
    // ETAPA 3: EXTRAÇÃO DE ARTIGOS E CABEÇALHOS
    // ═══════════════════════════════════════════════════════════
    log('───────────────────────────────────────────────────────────');
    log('📚 ETAPA 3: Extraindo artigos com validação automática...');
    log('───────────────────────────────────────────────────────────');
    
    let artigos = await extrairConteudoComValidacao(markdownLimpo, log);
    
    if (artigos.length === 0) {
      log('❌ Nenhum artigo encontrado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Nenhum artigo encontrado no conteúdo',
          markdownPreview: markdownLimpo.substring(0, 2000),
          logs
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalArtigosAntes = artigos.filter(r => r["Número do Artigo"]).length;
    const totalCabecalhos = artigos.filter(r => !r["Número do Artigo"]).length;
    log(`✅ Extração concluída: ${totalArtigosAntes} artigos + ${totalCabecalhos} cabeçalhos = ${artigos.length} registros`);

    // ═══════════════════════════════════════════════════════════
    // ETAPA 3.5: VALIDAÇÃO E CORREÇÃO COM GEMINI
    // ═══════════════════════════════════════════════════════════
    artigos = await validarArtigosComGemini(artigos, markdown, log);

    const totalArtigos = artigos.filter(r => r["Número do Artigo"]).length;
    log(`✅ Após validação: ${totalArtigos} artigos`);

    // ═══════════════════════════════════════════════════════════
    // ETAPA 4: ANÁLISE DE LACUNAS
    // ═══════════════════════════════════════════════════════════
    let analiseArtigos = analisarLacunasArtigos(artigos, log);

    // ═══════════════════════════════════════════════════════════
    // ETAPA 5: EXPLICAÇÃO DE LACUNAS COM GEMINI
    // ═══════════════════════════════════════════════════════════
    if (analiseArtigos.lacunas.length > 0) {
      const { lacunasAtualizadas, relatorio } = await explicarLacunasComGemini(
        analiseArtigos.lacunas,
        markdownLimpo,
        tableName,
        log
      );
      analiseArtigos = {
        ...analiseArtigos,
        lacunas: lacunasAtualizadas,
        relatorioGemini: relatorio
      };
    }

    // Extrair última data de atualização do texto
    const ultimaAtualizacao = extrairUltimaAtualizacao(markdownLimpo);
    if (ultimaAtualizacao.ano) {
      log(`📅 Última atualização detectada: ${ultimaAtualizacao.ano} (${ultimaAtualizacao.diasAtras} dias atrás)`);
    }

    // Modo preview: retorna TODOS os artigos para visualização
    if (mode === 'preview') {
      log('───────────────────────────────────────────────────────────');
      log('📋 Modo preview: retornando dados para visualização');
      log('═══════════════════════════════════════════════════════════');
      log(`📊 RESUMO FINAL:`);
      log(`   • Total de registros: ${artigos.length}`);
      log(`   • Artigos com número: ${analiseArtigos.artigosEncontrados}`);
      log(`   • Primeiro artigo: ${analiseArtigos.primeiroArtigo || 'N/A'}`);
      log(`   • Último artigo: ${analiseArtigos.ultimoArtigo || 'N/A'}`);
      log(`   • Artigos esperados: ${analiseArtigos.artigosEsperados}`);
      log(`   • Taxa de extração: ${analiseArtigos.percentualExtracao}%`);
      log(`   • Lacunas: ${analiseArtigos.lacunas.length}`);
      log('═══════════════════════════════════════════════════════════');
      
      return new Response(
        JSON.stringify({
          success: true,
          totalArtigos: artigos.length,
          preview: artigos.map(a => ({
            "Número do Artigo": a["Número do Artigo"],
            Artigo: a.Artigo,
            ordem_artigo: a.ordem_artigo
          })),
          ultimaAtualizacao: ultimaAtualizacao.data,
          anoAtualizacao: ultimaAtualizacao.ano,
          diasAtras: ultimaAtualizacao.diasAtras,
          analiseArtigos,
          message: `${artigos.length} registros encontrados. Pronto para inserir.`,
          logs
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // ETAPA 4: INSERÇÃO NO BANCO DE DADOS
    // ═══════════════════════════════════════════════════════════
    log('───────────────────────────────────────────────────────────');
    log('💾 ETAPA 4: Inserindo no banco de dados...');
    log('───────────────────────────────────────────────────────────');
    log(`📋 Tabela destino: ${tableName}`);

    const batchSize = 20;
    let totalInseridos = 0;
    const erros: string[] = [];
    const totalLotes = Math.ceil(artigos.length / batchSize);

    for (let i = 0; i < artigos.length; i += batchSize) {
      const batch = artigos.slice(i, i + batchSize);
      const loteAtual = Math.floor(i / batchSize) + 1;
      const percentual = ((loteAtual / totalLotes) * 100).toFixed(1);
      
      log(`📦 Inserindo lote ${loteAtual}/${totalLotes} (${percentual}%) - ${batch.length} registros`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .insert(batch)
          .select();

        if (error) {
          log(`❌ Erro no lote ${loteAtual}: ${error.message || error.code}`);
          erros.push(`Lote ${loteAtual}: ${error.message || error.code || 'Erro desconhecido'}`);
        } else {
          totalInseridos += data?.length || 0;
          log(`✅ Lote ${loteAtual} inserido: ${data?.length || 0} registros`);
        }
      } catch (insertError) {
        log(`❌ Exceção no lote ${loteAtual}: ${insertError instanceof Error ? insertError.message : 'Exceção'}`);
        erros.push(`Lote ${loteAtual}: ${insertError instanceof Error ? insertError.message : 'Exceção'}`);
      }
    }

    log('═══════════════════════════════════════════════════════════');
    log('🏁 RASPAGEM CONCLUÍDA');
    log('═══════════════════════════════════════════════════════════');
    log(`📊 Total de registros: ${artigos.length}`);
    log(`✅ Inseridos com sucesso: ${totalInseridos}`);
    if (erros.length > 0) {
      log(`❌ Erros: ${erros.length}`);
    }

    return new Response(
      JSON.stringify({
        success: totalInseridos > 0,
        totalArtigos: artigos.length,
        totalInseridos,
        preview: artigos.slice(0, 10).map(a => ({ "Número do Artigo": a["Número do Artigo"], Artigo: a.Artigo })),
        erros: erros.length > 0 ? erros : undefined,
        message: erros.length > 0 
          ? `${totalInseridos} registros inseridos com ${erros.length} erros`
          : `${totalInseridos} registros inseridos com sucesso!`,
        logs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log(`❌ ERRO FATAL: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        logs 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
