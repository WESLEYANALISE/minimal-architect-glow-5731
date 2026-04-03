import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ETAPA 3: Limpar e Formatar Texto
 * 
 * Responsabilidade ÚNICA: Usar Gemini para limpar e formatar o texto puro.
 * 
 * FAZ:
 * - Remover referências legislativas (Incluído pela Lei..., Redação dada pela...)
 * - Remover duplicatas (manter última versão quando há texto riscado)
 * - Organizar quebras de linha corretamente
 * - Separar assinaturas do texto
 * - Expandir intervalos de artigos revogados
 * 
 * NÃO FAZ: validação (isso é a Etapa 4)
 */

const REVISION = '1.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { getRotatedGeminiKeys } from "../_shared/gemini-keys.ts";
const GEMINI_KEYS_INFO = getRotatedGeminiKeys();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📝 ETAPA 3: LIMPAR E FORMATAR (v${REVISION})`);
  console.log('═══════════════════════════════════════════════════════════');

  try {
    const { textoLimpo, textoBrutoOriginal } = await req.json();

    if (!textoLimpo) {
      return new Response(
        JSON.stringify({ success: false, error: 'Texto limpo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Contar artigos no texto original ANTES de processar
    const artigosOriginaisCount = (textoLimpo.match(/\bArt\.?\s*\d+/gi) || []).length;
    console.log(`📊 Texto recebido: ${textoLimpo.length.toLocaleString()} caracteres`);
    console.log(`📊 Artigos detectados no texto original: ${artigosOriginaisCount}`);

    // Dividir em chunks MENORES para garantir resposta completa do Gemini
    const CHUNK_SIZE = 30000; // Reduzido de 60000 para 30000
    const chunks: string[] = [];
    
    // Tentar dividir por artigos para não cortar no meio
    const partes = textoLimpo.split(/(?=\nArt\.\s*\d+)/);
    let chunkAtual = '';
    
    for (const parte of partes) {
      if ((chunkAtual + parte).length > CHUNK_SIZE && chunkAtual.length > 0) {
        chunks.push(chunkAtual);
        chunkAtual = parte;
      } else {
        chunkAtual += parte;
      }
    }
    if (chunkAtual.length > 0) {
      chunks.push(chunkAtual);
    }

    console.log(`📦 Dividido em ${chunks.length} chunk(s)`);

    let textoFormatado = '';

    for (let i = 0; i < chunks.length; i++) {
      console.log(`🤖 Formatando chunk ${i + 1}/${chunks.length}...`);
      
      // Detectar último artigo do chunk original para verificar completude
      const artigosChunkOriginal = chunks[i].match(/Art\.?\s*(\d+[°º]?(?:-[A-Z])?)/gi) || [];
      const ultimoArtigoOriginal = artigosChunkOriginal[artigosChunkOriginal.length - 1]?.replace(/Art\.?\s*/i, '').trim();
      
      const textoChunk = await formatarComGemini(chunks[i], i === 0, i === chunks.length - 1);
      
      // Verificar completude do chunk
      const artigosChunkFormatado = textoChunk.match(/Art\.?\s*(\d+[°º]?(?:-[A-Z])?)/gi) || [];
      const ultimoArtigoFormatado = artigosChunkFormatado[artigosChunkFormatado.length - 1]?.replace(/Art\.?\s*/i, '').trim();
      
      if (ultimoArtigoOriginal && ultimoArtigoFormatado) {
        const numOriginal = parseInt(ultimoArtigoOriginal.replace(/[^0-9]/g, ''));
        const numFormatado = parseInt(ultimoArtigoFormatado.replace(/[^0-9]/g, ''));
        
        if (numFormatado < numOriginal) {
          console.warn(`⚠️ Chunk ${i + 1} INCOMPLETO: esperado até Art. ${ultimoArtigoOriginal}, obtido até Art. ${ultimoArtigoFormatado}`);
        } else {
          console.log(`✅ Chunk ${i + 1} completo: ${artigosChunkOriginal.length} artigos -> ${artigosChunkFormatado.length} artigos`);
        }
      }
      
      textoFormatado += textoChunk + '\n\n';
    }

    // Pós-processamento leve
    textoFormatado = posProcessar(textoFormatado);

    console.log(`✅ Formatação concluída: ${textoFormatado.length.toLocaleString()} caracteres`);

    // Extrair artigos para estatísticas
    let artigos = extrairArtigos(textoFormatado);
    
    // Extrair identificação da lei
    const identificacaoLei = extrairIdentificacaoLei(textoFormatado);
    const ementa = extrairEmenta(textoFormatado);
    
    console.log(`📊 Artigos extraídos: ${artigos.length}`);
    console.log(`📋 Identificação: ${identificacaoLei}`);
    
    // VERIFICAÇÃO DE COMPLETUDE: Se extraiu muito menos artigos que o detectado, alertar
    const artigosNumerados = artigos.filter(a => a.numero && a.tipo === 'artigo').length;
    const discrepancia = artigosOriginaisCount - artigosNumerados;
    
    let avisoDiscrepancia = '';
    if (discrepancia > 5 && artigosNumerados < artigosOriginaisCount * 0.9) {
      avisoDiscrepancia = `⚠️ ATENÇÃO: Detectados ${artigosOriginaisCount} artigos no texto original, mas apenas ${artigosNumerados} foram extraídos. Possível truncamento na formatação.`;
      console.warn(avisoDiscrepancia);
    }

    return new Response(
      JSON.stringify({
        success: true,
        textoFormatado,
        artigos,
        identificacaoLei,
        ementa,
        estatisticas: {
          caracteres: textoFormatado.length,
          totalArtigos: artigos.length,
          artigosNumerados,
          artigosDetectadosOriginal: artigosOriginaisCount, // NOVO: para comparação
          cabecalhos: artigos.filter(a => !a.numero && a.tipo === 'cabecalho').length,
          chunksProcessados: chunks.length,
          avisoDiscrepancia, // NOVO: aviso se houver discrepância
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function formatarComGemini(texto: string, isPrimeiroChunk: boolean, isUltimoChunk: boolean): Promise<string> {
  const prompt = `Você é um especialista em formatação de textos legais brasileiros.

## TAREFA: Formatar o texto da lei abaixo seguindo estas regras:

### 1. REMOVER REFERÊNCIAS LEGISLATIVAS:
Remova COMPLETAMENTE qualquer texto entre parênteses que contenha:
- "(Incluído pela Lei...)"
- "(Redação dada pela Lei...)"
- "(Vide Lei...)"
- "(Vide Decreto...)"
- "(Regulamento)"
- "(Vigência)"
- Qualquer referência a alterações legislativas

EXCETO - PRESERVAR estes textos:
- (VETADO)
- (Revogado)
- (revogado)

### 2. ELIMINAR DUPLICATAS (TEXTO RISCADO):
No site do Planalto, texto antigo aparece antes da versão nova.
- Se houver duplicatas (mesmo artigo/parágrafo/inciso aparecendo 2+ vezes)
- MANTENHA APENAS A ÚLTIMA OCORRÊNCIA
- A versão válida é SEMPRE A ÚLTIMA

### 3. ORGANIZAR QUEBRAS DE LINHA:
CADA ELEMENTO EM SUA PRÓPRIA LINHA:
- Art. X em linha própria
- § X em linha própria  
- I -, II -, III - (incisos romanos) em linha própria
- a), b), c) (alíneas) em linha própria
- TÍTULO, CAPÍTULO, SEÇÃO em linha própria

MAS: O texto de cada elemento deve ser CONTÍNUO (sem quebras no meio da frase)

### 4. EXPANDIR INTERVALOS REVOGADOS:
Quando encontrar "Arts. 1° a 5° (Revogados)", expandir assim:
Art. 1° (Revogado)
Art. 2° (Revogado)
Art. 3° (Revogado)
Art. 4° (Revogado)
Art. 5° (Revogado)

### 5. PRESERVAR ESTRUTURA:
- Manter a hierarquia: TÍTULO > CAPÍTULO > SEÇÃO > Art. > § > inciso > alínea
- Preservar preâmbulo ("O PRESIDENTE DA REPÚBLICA...")
- Preservar ementa ("Dispõe sobre...")
${isUltimoChunk ? '- Preservar data e assinaturas ao final' : ''}

### 6. SEM MARKDOWN:
- NUNCA use **, #, *, _
- Retorne TEXTO PURO

TEXTO A FORMATAR:
${texto}

TEXTO FORMATADO (apenas texto puro, sem explicações):`;

  for (const keyInfo of GEMINI_KEYS_INFO) {
    const apiKey = keyInfo.key;

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
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429 || response.status === 403) {
          console.warn(`⚠️ ${keyName} rate limited, tentando próxima...`);
          continue;
        }
        throw new Error(`API Gemini retornou ${response.status}`);
      }

      const data = await response.json();
      const textoResultado = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textoResultado) {
        return textoResultado.trim();
      }
    } catch (error) {
      console.error(`❌ Erro com ${keyName}:`, error);
      continue;
    }
  }

  throw new Error('Todas as chaves Gemini falharam');
}

function posProcessar(texto: string): string {
  return texto
    // Normalizar Art. Xo para Art. X°
    .replace(/\bArt\.?\s*(\d+)o\b/g, 'Art. $1°')
    .replace(/§\s*(\d+)o\b/g, '§ $1°')
    // Remover markdown que possa ter escapado
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Limpar espaços extras
    .replace(/  +/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

interface ArtigoExtraido {
  numero: string | null;
  texto: string;
  ordem: number;
  tipo: 'artigo' | 'cabecalho' | 'ementa' | 'preambulo' | 'assinatura' | 'data' | 'capitulo' | 'secao' | 'subsecao' | 'orgao' | 'identificacao' | 'aviso';
}

function extrairArtigos(texto: string): ArtigoExtraido[] {
  const resultado: ArtigoExtraido[] = [];
  const linhas = texto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let ordem = 1;
  let textoArtigoAtual = '';
  let numeroArtigoAtual: string | null = null;
  let artigoIniciado = false;

  const finalizarArtigo = () => {
    if (numeroArtigoAtual && textoArtigoAtual) {
      // Processar quebras de parágrafos - só quebrar se sequenciais
      const textoProcessado = processarQuebrasParagrafos(textoArtigoAtual.trim());
      resultado.push({
        numero: numeroArtigoAtual,
        texto: textoProcessado,
        ordem: ordem++,
        tipo: 'artigo',
      });
      textoArtigoAtual = '';
      numeroArtigoAtual = null;
    }
  };

  // Primeiro, extrair cabeçalho institucional
  const linhasOrgao = ['Presidência da República', 'Secretaria-Geral', 'Subchefia para Assuntos Jurídicos'];
  for (const orgaoLinha of linhasOrgao) {
    const encontrou = linhas.find(l => l.includes(orgaoLinha));
    if (encontrou) {
      resultado.push({
        numero: null,
        texto: encontrou,
        ordem: ordem++,
        tipo: 'orgao',
      });
    }
  }

  for (const linha of linhas) {
    // Skip linhas já usadas no cabeçalho
    if (linhasOrgao.some(org => linha.includes(org))) continue;

    // Identificação da lei (LEI Nº, DECRETO-LEI, etc)
    if (/^(LEI|DECRETO-LEI|MEDIDA PROVISÓRIA|LEI COMPLEMENTAR)\s+(N[ºª°]?\s*)?\d+/i.test(linha) && !artigoIniciado) {
      finalizarArtigo();
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'identificacao',
      });
      continue;
    }

    // Ementa (Dispõe sobre...)
    if (/^(Dispõe sobre|Altera |Institui |Regulamenta |Estabelece |Acrescenta )/i.test(linha) && !artigoIniciado) {
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'ementa',
      });
      continue;
    }

    // Preâmbulo (O PRESIDENTE DA REPÚBLICA...)
    if (/PRESIDENT[EA] DA REPÚBLICA/i.test(linha) && !artigoIniciado) {
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'preambulo',
      });
      continue;
    }

    // CAPÍTULO
    if (/^CAPÍTULO\s+[IVXLCDM0-9]+/i.test(linha)) {
      finalizarArtigo();
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'capitulo',
      });
      continue;
    }

    // SEÇÃO
    if (/^SEÇÃO\s+[IVXLCDM0-9]+/i.test(linha)) {
      finalizarArtigo();
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'secao',
      });
      continue;
    }

    // SUBSEÇÃO
    if (/^SUBSEÇÃO\s+[IVXLCDM0-9]+/i.test(linha)) {
      finalizarArtigo();
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'subsecao',
      });
      continue;
    }

    // Outros cabeçalhos estruturais (TÍTULO, LIVRO, PARTE)
    if (/^(TÍTULO|LIVRO|PARTE)\s+[IVXLCDM0-9]+/i.test(linha)) {
      finalizarArtigo();
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'cabecalho',
      });
      continue;
    }

    // Nome de estrutura em maiúsculas (ex: "DOS DIREITOS DO USUÁRIO")
    if (linha === linha.toUpperCase() && 
        linha.length >= 4 && 
        linha.length < 100 &&
        /^(DAS?|DOS?|DE)\s/.test(linha) &&
        !artigoIniciado) {
      finalizarArtigo();
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'cabecalho',
      });
      continue;
    }

    // Artigo
    const matchArtigo = linha.match(/^Art\.?\s*(\d+(?:-[A-Z])?)[ºª°]?\s*[-–.]?\s*(.*)/i);
    if (matchArtigo) {
      finalizarArtigo();
      artigoIniciado = true;
      numeroArtigoAtual = matchArtigo[1] + '°';
      textoArtigoAtual = 'Art. ' + matchArtigo[1] + '° ' + (matchArtigo[2] || '');
      continue;
    }

    // Continuação do artigo (parágrafos, incisos, alíneas)
    if (numeroArtigoAtual) {
      if (/^(§|Parágrafo|[IVXLCDM]+\s*[-–]|[a-z]\))/i.test(linha)) {
        textoArtigoAtual += '\n' + linha;
        continue;
      }
      // Linha normal que pode ser continuação
      if (!linha.startsWith('Art.') && !linha.startsWith('Brasília')) {
        textoArtigoAtual += '\n' + linha;
        continue;
      }
    }

    // Data (Brasília, X de Y de Z) - capturar inclusive sufixos como "146º da Independência..."
    if (/^Brasília,?\s*\d+\s+de\s+\w+\s+de\s+\d{4}/i.test(linha)) {
      finalizarArtigo();
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'data',
      });
      continue;
    }

    // Aviso do DOU (texto em vermelho)
    if (/Este texto não substitui o publicado no/i.test(linha)) {
      finalizarArtigo();
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'aviso',
      });
      continue;
    }

    // Assinatura (nome em MAIÚSCULAS - ex: H. CASTELLO BRANCO, MICHEL TEMER)
    if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]{2,}(?:[\s.]+[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]{1,})+$/.test(linha) && linha.length < 60 && artigoIniciado) {
      finalizarArtigo();
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'assinatura',
      });
      continue;
    }

    // Assinatura secundária (nome próprio em formato normal - ex: Severo Fagundes Gomes)
    // Geralmente são ministros que assinam após o presidente
    if (/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+(?:\s+(?:de|da|do|dos|das)?\s*[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+)+$/.test(linha) && 
        linha.length >= 10 && linha.length < 50 && 
        artigoIniciado &&
        resultado.some(r => r.tipo === 'data')) {
      resultado.push({
        numero: null,
        texto: linha,
        ordem: ordem++,
        tipo: 'assinatura',
      });
      continue;
    }
  }

  finalizarArtigo();
  return resultado;
}

// Função para processar quebras de parágrafos - só quebra se forem sequenciais
function processarQuebrasParagrafos(texto: string): string {
  // Encontrar todos os parágrafos no texto
  const paragrafos: { numero: number; posicao: number }[] = [];
  const regexParagrafo = /§\s*(\d+)[ºª°]?/g;
  let match;
  
  while ((match = regexParagrafo.exec(texto)) !== null) {
    paragrafos.push({
      numero: parseInt(match[1]),
      posicao: match.index
    });
  }
  
  // Se não há parágrafos ou só tem um, não precisa verificar sequência
  if (paragrafos.length <= 1) {
    return texto
      .replace(/\s+(I{1,3}|IV|V|VI{0,3}|IX|X{1,3})\s*[-–]\s*/g, '\n\n$1 - ')
      .replace(/\s+([a-z])\)\s*/g, '\n\n$1) ');
  }
  
  // Verificar se são sequenciais
  let saoSequenciais = true;
  for (let i = 1; i < paragrafos.length; i++) {
    if (paragrafos[i].numero !== paragrafos[i-1].numero + 1) {
      saoSequenciais = false;
      break;
    }
  }
  
  // Se são sequenciais, adiciona quebra dupla; se não, mantém junto
  if (saoSequenciais) {
    return texto
      .replace(/\s*§\s*/g, '\n\n§ ')
      .replace(/\s+(I{1,3}|IV|V|VI{0,3}|IX|X{1,3})\s*[-–]\s*/g, '\n\n$1 - ')
      .replace(/\s+([a-z])\)\s*/g, '\n\n$1) ');
  } else {
    // Não sequenciais - não quebra parágrafos, mas quebra incisos e alíneas
    return texto
      .replace(/\s+(I{1,3}|IV|V|VI{0,3}|IX|X{1,3})\s*[-–]\s*/g, '\n\n$1 - ')
      .replace(/\s+([a-z])\)\s*/g, '\n\n$1) ');
  }
}

function extrairIdentificacaoLei(texto: string): string {
  // Buscar padrão de identificação da lei
  const patterns = [
    /LEI\s+(?:COMPLEMENTAR\s+)?N[ºª°]?\s*[\d.]+,?\s+DE\s+\d+\s+DE\s+\w+\s+DE\s+\d{4}/i,
    /DECRETO-LEI\s+N[ºª°]?\s*[\d.]+,?\s+DE\s+\d+\s+DE\s+\w+\s+DE\s+\d{4}/i,
    /MEDIDA\s+PROVISÓRIA\s+N[ºª°]?\s*[\d.]+,?\s+DE\s+\d+\s+DE\s+\w+\s+DE\s+\d{4}/i,
    /CONSTITUIÇÃO\s+(?:DA\s+REPÚBLICA\s+)?FEDERATIVA\s+DO\s+BRASIL/i,
    /CÓDIGO\s+(CIVIL|PENAL|DE\s+PROCESSO|TRIBUTÁRIO|ELEITORAL)/i,
  ];
  
  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      return match[0].toUpperCase();
    }
  }
  
  return '';
}

function extrairEmenta(texto: string): string {
  // Buscar ementa que começa com "Dispõe sobre", "Institui", etc.
  const match = texto.match(/(Dispõe sobre|Altera |Institui |Regulamenta |Estabelece )[^.]+\./i);
  if (match) {
    return match[0];
  }
  return '';
}
