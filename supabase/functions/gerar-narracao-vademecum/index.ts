import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Chaves Gemini (KEY_1 e KEY_2 apenas, KEY_3 reservada para Evelyn)
const API_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
].filter(Boolean) as string[];

// Seleção automática de modelo por duração estimada
const CHAR_THRESHOLD_PRO = 1750; // ~1min10s
const MODEL_FLASH = 'gemini-2.5-flash-preview-tts';
const MODEL_PRO = 'gemini-2.5-pro-preview-tts';

function escolherModelo(texto: string): string {
  if (texto.length > CHAR_THRESHOLD_PRO) {
    console.log(`[modelo] PRO selecionado (${texto.length} chars > ${CHAR_THRESHOLD_PRO})`);
    return MODEL_PRO;
  }
  console.log(`[modelo] FLASH selecionado (${texto.length} chars <= ${CHAR_THRESHOLD_PRO})`);
  return MODEL_FLASH;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Voz padrão: Aoede (feminina)
const VOICE_NAME = "Aoede";

// Mapeamento de nomes de tabelas para nomes legíveis
const tableToReadableName: { [key: string]: string } = {
  // Códigos
  "CC - Código Civil": "Código Civil",
  "CP - Código Penal": "Código Penal",
  "CPC – Código de Processo Civil": "Código de Processo Civil",
  "CPP – Código de Processo Penal": "Código de Processo Penal",
  "CF - Constituição Federal": "Constituição Federal",
  "CLT - Consolidação das Leis do Trabalho": "Consolidação das Leis do Trabalho",
  "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
  "CTN – Código Tributário Nacional": "Código Tributário Nacional",
  "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
  "CE – Código Eleitoral": "Código Eleitoral",
  "CA - Código de Águas": "Código de Águas",
  "CBA Código Brasileiro de Aeronáutica": "Código Brasileiro de Aeronáutica",
  "CBT Código Brasileiro de Telecomunicações": "Código Brasileiro de Telecomunicações",
  "CCOM – Código Comercial": "Código Comercial",
  "CDM – Código de Minas": "Código de Minas",
  "CP - Código de Pesca": "Código de Pesca",
  "CC - Código de Caça": "Código de Caça",
  "CF - Código Florestal": "Código Florestal",
  "CDUS - Código de Defesa do Usuário": "Código de Defesa do Usuário",
  "CPI - Código de Propriedade Industrial": "Código de Propriedade Industrial",
  "CPM – Código Penal Militar": "Código Penal Militar",
  "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
  
  // Leis específicas
  "LEI 8213 - Benefícios": "Lei de Benefícios da Previdência Social",
  "LEI 8212 - Custeio": "Lei de Custeio da Previdência Social",
  "LEI 8429 - IMPROBIDADE": "Lei de Improbidade Administrativa",
  "LEI 12527 - ACESSO INFORMACAO": "Lei de Acesso à Informação",
  "LEI 12846 - ANTICORRUPCAO": "Lei Anticorrupção",
  "LEI 13140 - MEDIACAO": "Lei de Mediação",
  "LEI 13709 - LGPD": "Lei Geral de Proteção de Dados",
  "LC 101 - LRF": "Lei de Responsabilidade Fiscal",
  "LEI 14133 - LICITACOES": "Lei de Licitações e Contratos",
  "LEI 4717 - ACAO POPULAR": "Lei da Ação Popular",
  "LEI 6015 - REGISTROS PUBLICOS": "Lei de Registros Públicos",
  "LEI 7347 - ACAO CIVIL PUBLICA": "Lei da Ação Civil Pública",
  "LEI 9099 - JUIZADOS CIVEIS": "Lei dos Juizados Especiais",
  "LEI 9430 - LEGISLACAO TRIBUTARIA": "Lei da Legislação Tributária",
  "LEI 9784 - PROCESSO ADMINISTRATIVO": "Lei do Processo Administrativo",
  "LEI 9868 - ADI E ADC": "Lei da ADI e ADC",
  "LEI 9455 - TORTURA": "Lei de Tortura",
  "LEI 12850 - ORGANIZACOES CRIMINOSAS": "Lei das Organizações Criminosas",
  "LEI 13964 - PACOTE ANTICRIME": "Pacote Anticrime",
  "LEI 7170 - SEGURANCA NACIONAL": "Lei de Segurança Nacional",
  "LEI 13869 - ABUSO AUTORIDADE": "Lei de Abuso de Autoridade",
  
  // Estatutos
  "ESTATUTO - OAB": "Estatuto da Ordem dos Advogados do Brasil",
  "ESTATUTO - CIDADE": "Estatuto da Cidade",
  "ESTATUTO - DESARMAMENTO": "Estatuto do Desarmamento",
  "ESTATUTO - ECA": "Estatuto da Criança e do Adolescente",
  "ESTATUTO - IDOSO": "Estatuto do Idoso",
  "ESTATUTO - TORCEDOR": "Estatuto do Torcedor",
  "ESTATUTO - ESTRANGEIRO": "Estatuto do Estrangeiro",
  "ESTATUTO - IGUALDADE RACIAL": "Estatuto da Igualdade Racial",
  "ESTATUTO - PESSOA DEFICIENCIA": "Estatuto da Pessoa com Deficiência",
  "ESTATUTO - MILITARES": "Estatuto dos Militares",
  "ESTATUTO - REFUGIADOS": "Estatuto dos Refugiados",
  "ESTATUTO - TERRA": "Estatuto da Terra",
  "ESTATUTO - INDIO": "Estatuto do Índio",
  "ESTATUTO - JUVENTUDE": "Estatuto da Juventude",
  "ESTATUTO - PRIMEIRA INFANCIA": "Estatuto da Primeira Infância",
}

// ============================================
// LIMPEZA DE ANOTAÇÕES EDITORIAIS PARA TTS
// ============================================

// Remove anotações legislativas que não devem ser narradas
// Alinhado com src/lib/textFormatter.ts
function limparAnotacoesParaNarracao(texto: string): string {
  let resultado = texto;

  // 1. Remover conteúdo entre parênteses que seja anotação editorial
  // Padrões: (Redação dada...), (Incluído...), (Acrescido...), (Alterado...),
  //          (Renumerado...), (Vide...), (Vigência...), (Regulamento...),
  //          (Produção de efeitos), (NR), (Promulgação parcial)
  resultado = resultado.replace(
    /\(\s*(?:Reda[çc][ãa]o\s+dada|Inclu[ií]d[oa]|Acrescid[oa]|Alterad[oa]|Renumerad[oa]|Vide|Vig[êe]ncia|Regulamento|Produ[çc][ãa]o\s+de\s+efeitos|Promulga[çc][ãa]o\s+parcial|NR)[^)]*\)/gi,
    ''
  );

  // 2. Remover conteúdo entre aspas que contenha referência legislativa
  // Ex: "Redação dada pela Lei nº 13.467..."
  resultado = resultado.replace(
    /[""\u201C\u201D][^"""\u201C\u201D]*?(?:Reda[çc][ãa]o\s+dada|Inclu[ií]d[oa]|Acrescid[oa]|Alterad[oa]|Renumerad[oa]|Vide|Vig[êe]ncia)[^"""\u201C\u201D]*?[""\u201C\u201D]/gi,
    ''
  );

  // 3. Preservar status de revogação/veto, mas simplificar
  // (Revogado pela Lei nº...) → "revogado"
  // (Revogada pela...) → "revogada"
  // (Vetado) → "vetado"
  resultado = resultado.replace(/\(\s*Revogad[oa]\s+(?:pel[oa]|por)[^)]*\)/gi, (match) => {
    return match.toLowerCase().includes('revogada') ? 'revogada' : 'revogado';
  });
  resultado = resultado.replace(/\(\s*Revogad[oa]\s*\)/gi, (match) => {
    return match.toLowerCase().includes('revogada') ? 'revogada' : 'revogado';
  });
  resultado = resultado.replace(/\(\s*Vetad[oa]\s*\)/gi, (match) => {
    return match.toLowerCase().includes('vetada') ? 'vetada' : 'vetado';
  });
  resultado = resultado.replace(/\(\s*Vetad[oa]\s+(?:pel[oa]|por)[^)]*\)/gi, (match) => {
    return match.toLowerCase().includes('vetada') ? 'vetada' : 'vetado';
  });
  resultado = resultado.replace(/\(\s*VETADO\s*\)/g, 'vetado');

  // 4. Remover parênteses restantes que contenham apenas referências a leis/decretos sem conteúdo normativo
  resultado = resultado.replace(
    /\(\s*(?:Lei\s+(?:n[ºo°]?\s*)?\d|Decreto|Medida\s+Provis[oó]ria|Emenda\s+Constitucional|Lei\s+Complementar)[^)]*\)/gi,
    ''
  );

  // 5. Limpar espaços múltiplos resultantes
  resultado = resultado.replace(/\s{2,}/g, ' ').trim();

  return resultado;
}

// ============================================
// NORMALIZAÇÃO DE TEXTO PARA TTS
// ============================================

// Mapeamento global de letras para extenso
const letrasParaExtenso: { [key: string]: string } = {
  'a': 'á', 'b': 'bê', 'c': 'cê', 'd': 'dê', 'e': 'é',
  'f': 'éfe', 'g': 'gê', 'h': 'agá', 'i': 'í', 'j': 'jota',
  'k': 'cá', 'l': 'éle', 'm': 'ême', 'n': 'êne', 'o': 'ó',
  'p': 'pê', 'q': 'quê', 'r': 'érre', 's': 'ésse', 't': 'tê',
  'u': 'ú', 'v': 'vê', 'w': 'dáblio', 'x': 'xis', 'y': 'ípsilon', 'z': 'zê'
};

const romanosParaOrdinais: { [key: string]: string } = {
  'I': 'primeiro', 'II': 'segundo', 'III': 'terceiro', 'IV': 'quarto', 'V': 'quinto',
  'VI': 'sexto', 'VII': 'sétimo', 'VIII': 'oitavo', 'IX': 'nono', 'X': 'décimo',
  'XI': 'décimo primeiro', 'XII': 'décimo segundo', 'XIII': 'décimo terceiro',
  'XIV': 'décimo quarto', 'XV': 'décimo quinto', 'XVI': 'décimo sexto',
  'XVII': 'décimo sétimo', 'XVIII': 'décimo oitavo', 'XIX': 'décimo nono',
  'XX': 'vigésimo', 'XXI': 'vigésimo primeiro', 'XXII': 'vigésimo segundo',
  'XXIII': 'vigésimo terceiro', 'XXIV': 'vigésimo quarto', 'XXV': 'vigésimo quinto',
  'XXVI': 'vigésimo sexto', 'XXVII': 'vigésimo sétimo', 'XXVIII': 'vigésimo oitavo',
  'XXIX': 'vigésimo nono', 'XXX': 'trigésimo', 'XXXI': 'trigésimo primeiro',
  'XXXII': 'trigésimo segundo', 'XXXIII': 'trigésimo terceiro', 'XXXIV': 'trigésimo quarto',
  'XXXV': 'trigésimo quinto', 'XXXVI': 'trigésimo sexto', 'XXXVII': 'trigésimo sétimo',
  'XXXVIII': 'trigésimo oitavo', 'XXXIX': 'trigésimo nono', 'XL': 'quadragésimo',
  'XLI': 'quadragésimo primeiro', 'XLII': 'quadragésimo segundo', 'XLIII': 'quadragésimo terceiro',
  'XLIV': 'quadragésimo quarto', 'XLV': 'quadragésimo quinto', 'XLVI': 'quadragésimo sexto',
  'XLVII': 'quadragésimo sétimo', 'XLVIII': 'quadragésimo oitavo', 'XLIX': 'quadragésimo nono',
  'L': 'quinquagésimo',
};

// Números por extenso
const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function numeroParaExtenso(n: number): string {
  if (n === 0) return 'zero';
  if (n < 0) return 'menos ' + numeroParaExtenso(-n);
  
  if (n < 10) return unidades[n];
  if (n < 20) return especiais[n - 10];
  if (n < 100) {
    const dezena = Math.floor(n / 10);
    const unidade = n % 10;
    return dezenas[dezena] + (unidade ? ' e ' + unidades[unidade] : '');
  }
  if (n === 100) return 'cem';
  if (n < 1000) {
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    return centenas[centena] + (resto ? ' e ' + numeroParaExtenso(resto) : '');
  }
  if (n < 2000) {
    const resto = n % 1000;
    return 'mil' + (resto ? (resto < 100 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
  }
  if (n < 1000000) {
    const milhar = Math.floor(n / 1000);
    const resto = n % 1000;
    return numeroParaExtenso(milhar) + ' mil' + (resto ? (resto < 100 ? ' e ' : ' ') + numeroParaExtenso(resto) : '');
  }
  return n.toString();
}

// Converter número para ordinal por extenso (para parágrafos)
const ordinaisUnidades = ['', 'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono'];
const ordinaisDezenas = ['', '', 'vigésimo', 'trigésimo', 'quadragésimo', 'quinquagésimo', 'sexagésimo', 'septuagésimo', 'octogésimo', 'nonagésimo'];
const ordinaisCentenas = ['', 'centésimo', 'ducentésimo', 'tricentésimo', 'quadringentésimo', 'quingentésimo', 'sexcentésimo', 'septingentésimo', 'octingentésimo', 'nongentésimo'];

function numeroParaOrdinal(n: number): string {
  if (n <= 0) return n.toString();
  if (n === 10) return 'décimo';
  if (n < 10) return ordinaisUnidades[n];
  if (n < 20) return 'décimo ' + ordinaisUnidades[n - 10];
  if (n < 100) {
    const dezena = Math.floor(n / 10);
    const unidade = n % 10;
    return ordinaisDezenas[dezena] + (unidade ? ' ' + ordinaisUnidades[unidade] : '');
  }
  if (n < 1000) {
    const centena = Math.floor(n / 100);
    const resto = n % 100;
    return ordinaisCentenas[centena] + (resto ? ' ' + numeroParaOrdinal(resto) : '');
  }
  return n.toString();
}

// Normalizar texto para TTS
function normalizarTextoParaTTS(texto: string): string {
  // ETAPA 0: Limpar anotações editoriais ANTES de qualquer processamento
  let resultado = limparAnotacoesParaNarracao(texto);

  resultado = resultado
    // Remove markdown (NÃO remove hífens soltos - são separadores de incisos)
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove apenas bullets markdown no início de linha (não hífens de incisos)
    .replace(/^[-*+]\s/gm, "")
    .replace(/^\d+\.\s/gm, "")
    // Remover símbolos problemáticos
    .replace(/[º°]/g, '')
    .replace(/[""''""]/g, '')
    // Expande abreviações jurídicas
    .replace(/\bart\.\s?(\d+)/gi, "artigo $1")
    .replace(/\barts\.\s?/gi, "artigos ")
    .replace(/\binc\.\s?/gi, "inciso ")
    .replace(/\bal\.\s?/gi, "alínea ")
    .replace(/\bCF\b/g, "Constituição Federal")
    .replace(/\bCC\b/g, "Código Civil")
    .replace(/\bCP\b/g, "Código Penal")
    .replace(/\bCPC\b/g, "Código de Processo Civil")
    .replace(/\bCPP\b/g, "Código de Processo Penal")
    .replace(/\bCLT\b/g, "Consolidação das Leis do Trabalho")
    .replace(/\bCTN\b/g, "Código Tributário Nacional")
    .replace(/\bCDC\b/g, "Código de Defesa do Consumidor")
    .replace(/\bLINDB\b/g, "Lei de Introdução às Normas do Direito Brasileiro")
    .replace(/\bSTF\b/g, "Supremo Tribunal Federal")
    .replace(/\bSTJ\b/g, "Superior Tribunal de Justiça")
    .replace(/\bTST\b/g, "Tribunal Superior do Trabalho")
    .replace(/\bOAB\b/g, "Ordem dos Advogados do Brasil")
    .replace(/\bPEC\b/g, "Proposta de Emenda Constitucional")
    .replace(/\bDOU\b/g, "Diário Oficial da União")
    // Remove caracteres especiais
    .replace(/[<>{}|\\^~[\]]/g, "")
    .trim();

  // Substituir parágrafos com pausa estrutural
  resultado = resultado.replace(/§\s*único/gi, '. parágrafo único. ');
  resultado = resultado.replace(/§§/g, 'parágrafos');
  resultado = resultado.replace(/§\s*(\d+)/g, (_, num) => {
    const n = parseInt(num);
    const ordinal = numeroParaOrdinal(n);
    return `. parágrafo ${ordinal}. `;
  });

  // Substituir incisos (números romanos) com pausa estrutural
  // Captura romanos seguidos de qualquer separador: hífen, travessão, ponto, dois-pontos, vírgula, ou apenas espaço+texto
  const romanosPorTamanho = Object.keys(romanosParaOrdinais).sort((a, b) => b.length - a.length);
  for (const romano of romanosPorTamanho) {
    const ordinal = romanosParaOrdinais[romano];
    // Padrão 1: romano seguido de separador explícito (-, –, —, ., :)
    const regexComSeparador = new RegExp(`(^|\\n|\\s)(${romano})\\s*[-–—.:;]\\s*`, 'g');
    resultado = resultado.replace(regexComSeparador, `$1. inciso ${ordinal}. `);
    // Padrão 2: romano seguido apenas de espaço e qualquer letra (sem separador)
    // Ex: "I o servidor..." ou "I A soberania..."
    const regexSemSeparador = new RegExp(`(^|\\n|\\s)(${romano})\\s+(?=[a-zA-ZáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ])`, 'gm');
    resultado = resultado.replace(regexSemSeparador, `$1. inciso ${ordinal}. `);
  }

  // Substituir alíneas com pausa estrutural
  resultado = resultado.replace(/(^|\n|\s)([a-z])\)\s*/gm, (_, prefix, letra) => {
    return `${prefix}. alínea ${letrasParaExtenso[letra.toLowerCase()] || letra}. `;
  });

  // Sufixos de artigo: 1º-A → primeiro á
  resultado = resultado.replace(/(\d+)\s*-\s*([A-Z])\b/g, (_, num, letra) => {
    return `${num} ${letrasParaExtenso[letra.toLowerCase()] || letra}`;
  });

  // Limpar hífens e pontuação extra
  resultado = resultado.replace(/\s*[-–—]\s*/g, ', ');
  resultado = resultado.replace(/\s+/g, ' ');
  resultado = resultado.replace(/,\s*,/g, ',');

  return resultado.trim();
}

// ============================================
// GEMINI TTS - GERAÇÃO DE ÁUDIO
// ============================================

// Limite mais conservador para estabilidade em artigos longos
// (reduz timeouts/erros do Gemini em textos jurídicos extensos)
const MAX_TTS_CHARS = 700;

// Dividir texto em múltiplos segmentos menores e robustos para o Gemini TTS
function dividirTextoEmSegmentos(texto: string): string[] {
  const textoLimpo = texto.trim();
  if (!textoLimpo) return [];
  if (textoLimpo.length <= MAX_TTS_CHARS) return [textoLimpo];

  const paragrafos = textoLimpo
    .replace(/\n{2,}/g, "\n")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const segmentos: string[] = [];
  let buffer = "";

  const push = (s: string) => {
    const valor = s.trim();
    if (valor) segmentos.push(valor);
  };

  for (const paragrafo of paragrafos.length ? paragrafos : [textoLimpo]) {
    const unidades = paragrafo.match(/[^.!?;:]+[.!?;:]?\s*/g) || [paragrafo];

    for (const unidade of unidades) {
      const candidato = buffer ? `${buffer}${unidade}` : unidade;

      if (candidato.length <= MAX_TTS_CHARS) {
        buffer = candidato;
        continue;
      }

      if (buffer) {
        push(buffer);
        buffer = "";
      }

      if (unidade.length > MAX_TTS_CHARS) {
        for (let i = 0; i < unidade.length; i += MAX_TTS_CHARS) {
          push(unidade.slice(i, i + MAX_TTS_CHARS));
        }
      } else {
        buffer = unidade;
      }
    }

    if (buffer) {
      push(buffer);
      buffer = "";
    }
  }

  if (!segmentos.length) {
    const fallback = textoLimpo.slice(0, MAX_TTS_CHARS).trim();
    return fallback ? [fallback] : [];
  }

  console.log(`[dividirTextoEmSegmentos] Texto ${textoLimpo.length} chars → ${segmentos.length} segmentos (max ${MAX_TTS_CHARS} chars cada)`);
  return segmentos;
}

// Gerar áudio para um segmento com Gemini TTS (timeout de 3 minutos, retry em 500)
async function gerarAudioSegmento(texto: string, chavesDisponiveis: string[], segmentoIdx: number, totalSegmentos: number): Promise<string> {
  const modelo = escolherModelo(texto);
  const textoComInstrucao = `TTS(leitura jurídica formal brasileira):\nLeia como um narrador jurídico profissional.\nPronuncie claramente: "parágrafo primeiro", "inciso segundo", "alínea á".\nFaça uma breve pausa antes de cada parágrafo, inciso ou alínea.\nNão diga "parte um" ou "continuação". Leia de forma contínua e fluida.\n\n${texto}`;
  
  for (let keyIdx = 0; keyIdx < chavesDisponiveis.length; keyIdx++) {
    const apiKey = chavesDisponiveis[keyIdx];
    
    // Retry até 2x por chave em caso de erro 500
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      try {
        console.log(`Segmento ${segmentoIdx}/${totalSegmentos}: chave ${keyIdx + 1}/${chavesDisponiveis.length}, tentativa ${tentativa + 1}, modelo ${modelo} (${texto.length} chars)`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
          {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: textoComInstrucao }] }],
            generationConfig: {
              response_modalities: ["AUDIO"],
              speech_config: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: VOICE_NAME },
                },
              },
            },
          }),
        }
      );
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (data?.error) {
        const statusCode = Number(data.error?.code) || response.status || 500;
        console.error(`Segmento ${segmentoIdx}: Gemini TTS erro ${statusCode}: ${JSON.stringify(data.error).substring(0, 220)}`);

        if (statusCode === 500 && tentativa === 0) {
          console.log(`Segmento ${segmentoIdx}: Erro 500, aguardando 3s para retry...`);
          await sleep(3000);
          continue;
        }
        break;
      }

      if (!response.ok) {
        const errorText = JSON.stringify(data);
        console.error(`Segmento ${segmentoIdx}: Gemini TTS erro ${response.status}: ${errorText.substring(0, 200)}`);
        
        // Retry na mesma chave se erro 500 (interno do Gemini)
        if (response.status === 500 && tentativa === 0) {
          console.log(`Segmento ${segmentoIdx}: Erro 500, aguardando 3s para retry...`);
          await sleep(3000);
          continue; // retry na mesma chave
        }
        break; // pular para próxima chave
      }

      const audioPart = data.candidates?.[0]?.content?.parts?.find((part: any) => part?.inlineData?.data);
      const audioData = audioPart?.inlineData?.data;

      if (audioData) {
        console.log(`Segmento ${segmentoIdx}: ✅ Áudio gerado com ${modelo} (${audioData.length} chars base64)`);
        return audioData;
      } else {
        console.error(`Segmento ${segmentoIdx}: Resposta sem dados de áudio`);
        break; // pular para próxima chave
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Segmento ${segmentoIdx}: Erro com chave ${keyIdx + 1}: ${errorMsg}`);
      
      if (errorMsg.includes('abort')) {
        console.log(`Segmento ${segmentoIdx}: Timeout, tentando próxima chave...`);
        break; // pular para próxima chave
      }
      
      if (tentativa === 0) {
        console.log(`Segmento ${segmentoIdx}: Aguardando 3s para retry...`);
        await sleep(3000);
        continue;
      }
      break;
    }
    } // fim loop tentativa
  } // fim loop chaves
  throw new Error(`Todas as ${chavesDisponiveis.length} chaves Gemini TTS falharam para segmento ${segmentoIdx}`);
}

function base64ParaBytes(audioBase64: string): Uint8Array {
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Concatenar múltiplos áudios PCM
function concatenarPCM(audios: Uint8Array[]): Uint8Array {
  const totalLength = audios.reduce((acc, audio) => acc + audio.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const audio of audios) {
    result.set(audio, offset);
    offset += audio.length;
  }
  
  return result;
}

// Converter PCM L16 24kHz mono para WAV
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const wavSize = 44 + dataSize;

  const buffer = new ArrayBuffer(wavSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, wavSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // PCM data
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(pcmData, 44);

  return wavBytes;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ============================================
// DIVISÃO DE ARTIGOS GRANDES EM PARTES
// ============================================

interface ParteArtigo {
  texto: string;
  parteAtual: number;
  totalPartes: number;
  prefixo: string;
}

const numerosParaExtensoPartes: { [key: number]: string } = {
  1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco',
  6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
  11: 'onze', 12: 'doze'
};

function dividirArtigoEmPartes(
  textoCompleto: string, 
  nomeCodigoLegivel: string, 
  numeroExtenso: string,
  titulo: string | null,
  maxChars: number = 2500
): ParteArtigo[] {
  // Se o texto é pequeno, não dividir
  if (textoCompleto.length <= maxChars) {
    return [{
      texto: textoCompleto,
      parteAtual: 1,
      totalPartes: 1,
      prefixo: ''
    }];
  }

  console.log(`[dividirArtigoEmPartes] Artigo grande detectado: ${textoCompleto.length} chars`);

  // Calcular partes com base direta no tamanho configurado
  const numPartesAlvo = Math.min(20, Math.max(2, Math.ceil(textoCompleto.length / maxChars)));

  // Remover prefixo do artigo para dividir apenas o conteúdo
  const prefixoArtigo = titulo 
    ? `${nomeCodigoLegivel}, artigo ${numeroExtenso}, ${titulo.toLowerCase()}. `
    : `${nomeCodigoLegivel}, artigo ${numeroExtenso}. `;
  
  const textoSemPrefixo = textoCompleto.startsWith(prefixoArtigo) 
    ? textoCompleto.slice(prefixoArtigo.length) 
    : textoCompleto;

  // Dividir por blocos lógicos
  const blocosLogicos = textoSemPrefixo.split(/(?=(?:^|\n)\s*(?:inciso\s+\w+|parágrafo\s+\w+|alínea\s+\w+))/gi);
  const blocos = blocosLogicos.length > 1 ? blocosLogicos : textoSemPrefixo.split(/(?<=[.;])\s+/);

  console.log(`[dividirArtigoEmPartes] ${blocos.length} blocos encontrados, alvo: ${numPartesAlvo} partes`);

  // Agrupar blocos em partes de tamanho similar
    const tamanhoPorParte = Math.ceil(textoSemPrefixo.length / numPartesAlvo);
  const partes: string[] = [];
  let parteAtual = '';

  for (const bloco of blocos) {
    if (parteAtual.length + bloco.length > tamanhoPorParte && parteAtual.trim()) {
      partes.push(parteAtual.trim());
      parteAtual = bloco;
    } else {
      parteAtual = parteAtual ? parteAtual + ' ' + bloco : bloco;
    }
  }

  if (parteAtual.trim()) {
    partes.push(parteAtual.trim());
  }

  const totalPartes = partes.length;
  console.log(`[dividirArtigoEmPartes] Dividido em ${totalPartes} partes`);

  // Construir resultado — narração contínua sem mencionar "parte X de Y"
  return partes.map((textoPartePura, index) => {
    const parteNum = index + 1;
    
    let prefixoNarracao: string;
    if (parteNum === 1) {
      // Apenas a primeira parte recebe o prefixo identificando o artigo
      if (titulo) {
        prefixoNarracao = `${nomeCodigoLegivel}, artigo ${numeroExtenso}, ${titulo.toLowerCase()}. `;
      } else {
        prefixoNarracao = `${nomeCodigoLegivel}, artigo ${numeroExtenso}. `;
      }
    } else {
      // Partes subsequentes continuam direto, sem prefixo
      prefixoNarracao = '';
    }

    return {
      texto: prefixoNarracao + textoPartePura,
      parteAtual: parteNum,
      totalPartes,
      prefixo: prefixoNarracao
    };
  });
}

// Upload para Supabase Storage
async function uploadParaSupabase(
  supabase: any, 
  bytes: Uint8Array, 
  bucket: string, 
  path: string, 
  contentType: string
): Promise<string> {
  console.log(`[upload] Enviando para Supabase Storage: ${bucket}/${path}`)
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType, upsert: true })
  
  if (error) {
    console.error('[upload] Erro:', error)
    throw new Error(`Erro no upload: ${error.message}`)
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  console.log(`[upload] URL pública: ${data.publicUrl}`)
  return data.publicUrl
}

async function salvarNarracaoNoBanco(
  supabase: any,
  tableName: string,
  articleId: number,
  audioUrls: string[]
): Promise<void> {
  const urlParaSalvar = audioUrls.length > 1 ? JSON.stringify(audioUrls) : audioUrls[0]

  const { error } = await supabase
    .from(tableName)
    .update({ 'Narração': urlParaSalvar })
    .eq('id', articleId)

  if (error) {
    console.error(`[gerar-narracao-vademecum] Erro DB ao salvar progresso:`, error.message)
    throw new Error(`Erro ao salvar no banco: ${error.message}`)
  }
}

function estimarTotalSegmentosNarracao(
  tableName: string,
  numeroArtigo: string,
  textoArtigo: string
): { totalSegments: number } {
  const nomeCodigoLegivel = tableToReadableName[tableName] || tableName
  const matchEC = numeroArtigo.match(/^EC\s*(\d+)/i)
  const isEmendaConstitucional = !!matchEC

  let numeroExtenso: string
  if (isEmendaConstitucional) {
    const numEC = parseInt(matchEC![1]) || 0
    numeroExtenso = numeroParaExtenso(numEC)
  } else {
    const matchArtigo = numeroArtigo.match(/(\d+)[º°]?[-–]?([A-Za-z])?/)
    const numInt = matchArtigo ? parseInt(matchArtigo[1]) || 0 : 0
    const letraSufixo = matchArtigo?.[2]
      ? ` ${letrasParaExtenso[matchArtigo[2].toLowerCase()] || matchArtigo[2].toLowerCase()}`
      : ''
    const ordinaisUnidadesLocal = ['', 'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono']
    numeroExtenso = (numInt >= 1 && numInt <= 9 ? ordinaisUnidadesLocal[numInt] : numeroParaExtenso(numInt)) + letraSufixo
  }

  let titulo: string | null = null
  const linhas = textoArtigo.split(/\n+/)
  if (linhas.length > 1) {
    const primeiraLinha = linhas[0].trim()
    // Só considerar como título se NÃO começa com "Art." E termina com pontuação final
    // Linhas que terminam sem pontuação são continuações do caput, não títulos
    const terminaComPontuacao = /[.;:!?)]\s*$/.test(primeiraLinha)
    if (!primeiraLinha.match(/^Art\.?\s*\d+/i) && primeiraLinha.length > 0 && primeiraLinha.length < 100 && terminaComPontuacao) {
      titulo = primeiraLinha
    }
  }

  let textoArtigoLimpo = textoArtigo
  if (titulo) {
    textoArtigoLimpo = linhas.slice(1).join('\n').trim()
  }
  textoArtigoLimpo = textoArtigoLimpo
    .replace(/^Art\.?\s*\d+[º°]?[\-]?[A-Za-z]?\s*[-–.]?\s*/i, '')
    .trim()

  let textoCompleto: string
  if (isEmendaConstitucional) {
    textoCompleto = titulo
      ? `Emenda Constitucional número ${numeroExtenso}, ${titulo.toLowerCase()}. ${textoArtigoLimpo}`
      : `Emenda Constitucional número ${numeroExtenso}. ${textoArtigoLimpo}`
  } else if (titulo) {
    textoCompleto = `${nomeCodigoLegivel}, artigo ${numeroExtenso}, ${titulo.toLowerCase()}. ${textoArtigoLimpo}`
  } else {
    textoCompleto = `${nomeCodigoLegivel}, artigo ${numeroExtenso}. ${textoArtigoLimpo}`
  }

  const partesArtigo = dividirArtigoEmPartes(textoCompleto, nomeCodigoLegivel, numeroExtenso, titulo, 2500)
  let totalSegments = 0

  for (const parteInfo of partesArtigo) {
    const textoNormalizado = normalizarTextoParaTTS(parteInfo.texto)
    totalSegments += dividirTextoEmSegmentos(textoNormalizado).length
  }

  return { totalSegments: Math.max(1, totalSegments) }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { tableName, numeroArtigo, textoArtigo, articleId, dryRun } = await req.json()

    if (!tableName || !numeroArtigo || !textoArtigo || !articleId) {
      throw new Error('tableName, numeroArtigo, textoArtigo e articleId são obrigatórios')
    }

    if (dryRun) {
      const preview = estimarTotalSegmentosNarracao(tableName, numeroArtigo, textoArtigo)
      return new Response(
        JSON.stringify({ success: true, totalSegments: preview.totalSegments }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[gerar-narracao-vademecum] Gerando para ${tableName} - Art. ${numeroArtigo} com Gemini TTS`)

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave GEMINI_KEY_X configurada')
    }
    
    console.log(`[gerar-narracao-vademecum] ${API_KEYS.length} chaves disponíveis`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Obter nome legível do código
    const nomeCodigoLegivel = tableToReadableName[tableName] || tableName
    
    // Detectar se é Emenda Constitucional (EC 1, EC 132, etc.)
    const matchEC = numeroArtigo.match(/^EC\s*(\d+)/i);
    const isEmendaConstitucional = !!matchEC;
    
    // Converter número do artigo para extenso
    let numeroExtenso: string;
    if (isEmendaConstitucional) {
      const numEC = parseInt(matchEC![1]) || 0;
      numeroExtenso = numeroParaExtenso(numEC);
    } else {
      const matchArtigo = numeroArtigo.match(/(\d+)[º°]?[-–]?([A-Za-z])?/);
      const numInt = matchArtigo ? parseInt(matchArtigo[1]) || 0 : 0;
      const letraSufixo = matchArtigo?.[2] 
        ? ` ${letrasParaExtenso[matchArtigo[2].toLowerCase()] || matchArtigo[2].toLowerCase()}` 
        : '';
      const ordinaisUnidadesLocal = ['', 'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono'];
      numeroExtenso = (numInt >= 1 && numInt <= 9 ? ordinaisUnidadesLocal[numInt] : numeroParaExtenso(numInt)) + letraSufixo;
    }
    
    // Extrair título do artigo
    let titulo: string | null = null
    const linhas = textoArtigo.split(/\n+/)
    if (linhas.length > 1) {
      const primeiraLinha = linhas[0].trim()
      // Só considerar como título se NÃO começa com "Art." E termina com pontuação final
      // Linhas que terminam sem pontuação são continuações do caput, não títulos
      const terminaComPontuacao = /[.;:!?)]\s*$/.test(primeiraLinha)
      if (!primeiraLinha.match(/^Art\.?\s*\d+/i) && primeiraLinha.length > 0 && primeiraLinha.length < 100 && terminaComPontuacao) {
        titulo = primeiraLinha
        console.log(`[gerar-narracao-vademecum] Título encontrado: "${titulo}"`)
      }
    }
    
    // Remover o título e o prefixo "Art. Xº -" do texto
    let textoArtigoLimpo = textoArtigo
    if (titulo) {
      textoArtigoLimpo = linhas.slice(1).join('\n').trim()
    }
    textoArtigoLimpo = textoArtigoLimpo
      .replace(/^Art\.?\s*\d+[º°]?[\-]?[A-Za-z]?\s*[-–.]?\s*/i, '')
      .trim()
    
    // Montar texto com prefixo
    let textoCompleto: string
    if (isEmendaConstitucional) {
      // Para EC: "Emenda Constitucional número X. <texto>"
      if (titulo) {
        textoCompleto = `Emenda Constitucional número ${numeroExtenso}, ${titulo.toLowerCase()}. ${textoArtigoLimpo}`
      } else {
        textoCompleto = `Emenda Constitucional número ${numeroExtenso}. ${textoArtigoLimpo}`
      }
    } else if (titulo) {
      textoCompleto = `${nomeCodigoLegivel}, artigo ${numeroExtenso}, ${titulo.toLowerCase()}. ${textoArtigoLimpo}`
    } else {
      textoCompleto = `${nomeCodigoLegivel}, artigo ${numeroExtenso}. ${textoArtigoLimpo}`
    }
    
    console.log(`[gerar-narracao-vademecum] Texto original: ${textoCompleto.length} chars`)
    const modelo_usado = escolherModelo(textoCompleto);

    // Dividir artigos grandes em partes
    const partesArtigo = dividirArtigoEmPartes(
      textoCompleto, 
      nomeCodigoLegivel, 
      numeroExtenso, 
      titulo,
      2500
    );
    
    console.log(`[gerar-narracao-vademecum] Artigo dividido em ${partesArtigo.length} parte(s)`);

    const allPcmSegments: Uint8Array[] = []
    const tableSlug = tableName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)
    const artigoSlug = numeroArtigo.replace(/[^a-z0-9]/gi, '_')

    // Processar cada parte do artigo e acumular PCM
    for (let parteIdx = 0; parteIdx < partesArtigo.length; parteIdx++) {
      const parteInfo = partesArtigo[parteIdx];
      console.log(`[gerar-narracao-vademecum] Processando parte ${parteInfo.parteAtual}/${parteInfo.totalPartes} (${parteInfo.texto.length} chars)...`);

      const textoNormalizado = normalizarTextoParaTTS(parteInfo.texto);
      console.log(`[gerar-narracao-vademecum] Texto normalizado: ${textoNormalizado.length} chars`);
      console.log(`[gerar-narracao-vademecum] Preview normalizado: ${textoNormalizado.substring(0, 500)}`);

      const segmentos = dividirTextoEmSegmentos(textoNormalizado)
      console.log(`[gerar-narracao-vademecum] Parte ${parteInfo.parteAtual}/${parteInfo.totalPartes}: ${segmentos.length} segmento(s)`)

      for (let segmentoIdx = 0; segmentoIdx < segmentos.length; segmentoIdx++) {
        const segmentoNumero = segmentoIdx + 1
        const totalSegmentosParte = segmentos.length
        const segmentoTexto = segmentos[segmentoIdx]

        console.log(`[gerar-narracao-vademecum] Gerando segmento ${segmentoNumero}/${totalSegmentosParte} da parte ${parteInfo.parteAtual}/${parteInfo.totalPartes}...`)

        const audioBase64 = await gerarAudioSegmento(segmentoTexto, API_KEYS, segmentoNumero, totalSegmentosParte)
        const pcmBytes = base64ParaBytes(audioBase64)
        allPcmSegments.push(pcmBytes)

        console.log(`[gerar-narracao-vademecum] ✅ Segmento ${segmentoNumero} PCM acumulado (${pcmBytes.length} bytes)`)

        if (segmentoIdx < segmentos.length - 1) {
          await sleep(1000)
        }
      }
    }

    if (allPcmSegments.length === 0) {
      throw new Error('Nenhum segmento de áudio foi gerado')
    }

    // Concatenar todos os PCM em um único arquivo WAV
    console.log(`[gerar-narracao-vademecum] Concatenando ${allPcmSegments.length} segmento(s) PCM em WAV único...`)
    const pcmConcatenado = concatenarPCM(allPcmSegments)
    const wavFinal = pcmToWav(pcmConcatenado)

    // Calcular duração: PCM 24kHz, 16-bit mono = 48000 bytes/segundo
    const duracaoSegundos = Math.round(pcmConcatenado.length / 48000)
    console.log(`[gerar-narracao-vademecum] Duração: ${duracaoSegundos}s (${Math.floor(duracaoSegundos / 60)}min ${duracaoSegundos % 60}s)`)

    // Upload único
    const timestamp = Date.now()
    const path = `vademecum/${tableSlug}/art_${artigoSlug}_${timestamp}.wav`
    const audioUrl = await uploadParaSupabase(supabase, wavFinal, 'audios', path, 'audio/wav')

    // Salvar URL única no banco (string simples, não JSON array)
    await salvarNarracaoNoBanco(supabase, tableName, articleId, [audioUrl])

    console.log(`[gerar-narracao-vademecum] ✅ Concluído: WAV único (${allPcmSegments.length} segmentos concatenados, ${duracaoSegundos}s)`)

    return new Response(
      JSON.stringify({ 
        success: true,
        audioUrl, 
        totalPartes: 1,
        duration: duracaoSegundos,
        numeroArtigo,
        engine: modelo_usado,
        voiceName: VOICE_NAME
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[gerar-narracao-vademecum] ERRO:', error?.message)
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
