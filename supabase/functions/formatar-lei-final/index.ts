import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVISION = "v3.4.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
].filter(Boolean) as string[];

interface Artigo {
  numero: string;
  texto: string;
}

// 📄 Extrair artigos diretamente do texto usando regex robusto
function extrairArtigosDoTexto(texto: string): Artigo[] {
  const artigos: Artigo[] = [];
  
  // Regex RIGOROSO para capturar APENAS artigos com número:
  // Art. 1º, Art. 2º, Art. 10, Art. 100-A, etc.
  // O artigo DEVE ter um número após "Art."
  // Exclui linhas que são títulos, capítulos, etc.
  const regexArtigo = /(?:^|\n)\s*(Art\.?\s+(\d+)[º°]?(?:-[A-Z])?\.?)\s*[-–.]?\s*/gi;
  
  const matches: { match: RegExpMatchArray; index: number }[] = [];
  let match;
  const regexCopy = new RegExp(regexArtigo.source, regexArtigo.flags);
  
  while ((match = regexCopy.exec(texto)) !== null) {
    // Validar que capturou um número real (grupo 2)
    const numeroCapturado = match[2];
    if (!numeroCapturado || isNaN(parseInt(numeroCapturado))) {
      console.log(`⚠️ [IGNORADO] Linha sem número válido: "${match[1]}"`);
      continue;
    }
    matches.push({ match, index: match.index });
  }
  
  console.log(`📊 [EXTRAÇÃO REGEX] Encontrados ${matches.length} artigos com número válido`);
  
  for (let i = 0; i < matches.length; i++) {
    const { match: m, index } = matches[i];
    const numero = m[1].replace(/\s+/g, ' ').trim();
    const inicio = index + m[0].length;
    const fim = i < matches.length - 1 ? matches[i + 1].index : texto.length;
    let textoArtigo = texto.substring(inicio, fim).trim();
    
    // Limpar texto do artigo - preservar data e assinatura no último artigo
    const isUltimoArtigo = i === matches.length - 1;
    
    if (!isUltimoArtigo) {
      textoArtigo = textoArtigo
        .replace(/\nBrasília,\s*\d+.*$/gis, '')
        .replace(/\n(LUIZ\s*INÁCIO\s*LULA\s*DA\s*SILVA|JAIR\s*MESSIAS\s*BOLSONARO|MICHEL\s*TEMER|DILMA\s*ROUSSEFF|FERNANDO\s*HENRIQUE\s*CARDOSO|FERNANDO\s*COLLOR|JOSÉ\s*SARNEY|ITAMAR\s*FRANCO)[\s\S]*$/gis, '')
        .replace(/\nEste texto não substitui[\s\S]*$/gis, '')
        .trim();
    } else {
      // No último artigo, preservar data e assinatura em linhas separadas
      textoArtigo = textoArtigo
        .replace(/\nEste texto não substitui[\s\S]*$/gis, '')
        .trim();
      
      // Formatar data em linha separada
      textoArtigo = textoArtigo.replace(/(Brasília,\s*\d+\s*de\s*\w+\s*de\s*\d{4}[.;]?\s*\d*º?\s*(?:da\s+(?:República|Independência)[^.]*\.)?)/gi, '\n$1');
      
      // Formatar assinatura presidencial em linha separada
      textoArtigo = textoArtigo.replace(/\n?(O\s+PRESIDENTE\s+DA\s+REPÚBLICA)/gi, '\n\n$1');
      
      // Formatar nomes dos presidentes em linhas separadas
      textoArtigo = textoArtigo.replace(/\n?(LUIZ\s*INÁCIO\s*LULA\s*DA\s*SILVA|JAIR\s*MESSIAS\s*BOLSONARO|MICHEL\s*TEMER|DILMA\s*ROUSSEFF|FERNANDO\s*HENRIQUE\s*CARDOSO|FERNANDO\s*COLLOR|JOSÉ\s*SARNEY|ITAMAR\s*FRANCO)/gi, '\n$1');
    }
    
    textoArtigo = limparParentesesTexto(textoArtigo);
    
    // Garantir quebras de linha DUPLAS antes de parágrafos, incisos e alíneas
    textoArtigo = textoArtigo
      // Primeiro: normalizar quebras de linha simples que já existem antes de § e Parágrafo único
      .replace(/\n(§\s*\d+[º°]?)/g, '\n\n$1')
      .replace(/\n(Parágrafo único)/gi, '\n\n$1')
      // Quebra de linha DUPLA antes de parágrafos (§ 1º, § 2º, etc.) - mesmo sem pontuação
      .replace(/([.;:\s])[ \t]*(§\s*\d+[º°]?)/g, '$1\n\n$2')
      .replace(/([.;:\s])[ \t]*(Parágrafo único)/gi, '$1\n\n$2')
      // Quebra de linha antes de incisos romanos (I -, II -, etc.)
      .replace(/([.;:])[ \t]*([IVXLC]+\s*[-–])/g, '$1\n$2')
      // Quebra de linha antes de alíneas (a), b), etc.)
      .replace(/([.;:])[ \t]*([a-z]\))/g, '$1\n$2')
      // Remover reticências isoladas (...)
      .replace(/\.{3,}/g, '.')
      // Limpar quebras excessivas (máximo 2)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    if (numero && textoArtigo && textoArtigo.length > 3) {
      const numeroNormalizado = numero
        .replace(/Art\.?\s*/i, 'Art. ')
        .replace(/\.?$/, '')
        .replace(/[°]/g, 'º');
      
      artigos.push({
        numero: numeroNormalizado,
        texto: textoArtigo.substring(0, 15000)
      });
    }
  }
  
  return artigos;
}

// Limpar parênteses preservando anotações importantes
function limparParentesesTexto(texto: string): string {
  const devePreservar = (match: string): boolean => {
    const upper = match.toUpperCase();
    return upper.includes('VETADO') || 
           upper.includes('REVOGAD') || 
           upper.includes('SUPRIMID') ||
           upper.includes('PREJUDICAD') ||
           upper.includes('INCLUÍD') ||
           upper.includes('REDAÇÃO');
  };
  
  let resultado = texto.replace(/\([^)]*\)/g, (match) => {
    if (devePreservar(match)) {
      const upper = match.toUpperCase();
      if (upper.includes('VETADO')) return '(Vetado)';
      if (upper.includes('REVOGADA')) return '(Revogada)';
      if (upper.includes('REVOGADO')) return '(Revogado)';
      if (upper.includes('SUPRIMIDO')) return '(Suprimido)';
      if (upper.includes('PREJUDICADO')) return '(Prejudicado)';
      if (upper.includes('INCLUÍD')) return '';
      if (upper.includes('REDAÇÃO')) return '';
      return match;
    }
    return '';
  });
  
  // CORREÇÃO: Preservar quebras de linha, só normalizar espaços horizontais
  resultado = resultado
    .replace(/[^\S\n]+/g, ' ')  // Apenas espaços horizontais (não \n)
    .replace(/\n{3,}/g, '\n\n') // Máximo 2 quebras consecutivas
    .trim();
  return resultado;
}

// 📋 Extrair ementa do texto
function extrairEmenta(texto: string): string {
  const matchEmenta = texto.match(/(?:LEI\s+N[ºo°]?\s*[\d.,]+[^\n]*\n\s*)((?:(?:Dispõe|Altera|Institui|Acrescenta|Revoga|Regulamenta|Estabelece|Cria|Define|Fixa|Determina|Autoriza|Abre)[^\n]+(?:\n(?![A-Z\s]+Art\.)[^\n]+)*))/i);
  
  if (matchEmenta) {
    return matchEmenta[1].trim();
  }
  
  const matchAlt = texto.match(/LEI\s+N[ºo°]?\s*[\d.,]+[^\n]*\n+([^]*?)(?=\s*O\s+PRESIDENTE|Art\.\s*1)/i);
  if (matchAlt && matchAlt[1].trim().length > 10) {
    return matchAlt[1].trim().substring(0, 1000);
  }
  
  return '';
}

// 🤖 Chamar Gemini para validar e corrigir se necessário
async function validarECorrigirComGemini(
  artigos: Artigo[], 
  textoOriginal: string,
  ementa: string
): Promise<{ artigos: Artigo[]; corrigido: boolean; detalhes: string }> {
  
  if (API_KEYS.length === 0) {
    console.log('⚠️ Sem API keys, pulando validação Gemini');
    return { artigos, corrigido: false, detalhes: 'Sem API keys disponíveis' };
  }
  
  // Verificar métricas básicas
  const numerosExtraidos = artigos.map(a => {
    const match = a.numero.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }).filter(n => n > 0);
  
  const max = Math.max(...numerosExtraidos, 0);
  const totalExtraido = artigos.length;
  const lacunas = max - totalExtraido;
  const percentualExtracao = max > 0 ? (totalExtraido / max) * 100 : 100;
  
  console.log(`📊 [MÉTRICAS] Total: ${totalExtraido}, Máximo: ${max}, Lacunas: ${lacunas}, Percentual: ${percentualExtracao.toFixed(1)}%`);
  
  // Se extração parece completa (>95%), não precisa corrigir
  if (percentualExtracao >= 95 && lacunas <= 2) {
    console.log('✅ Extração parece completa, pulando correção Gemini');
    return { 
      artigos, 
      corrigido: false, 
      detalhes: `Extração completa: ${totalExtraido}/${max} artigos (${percentualExtracao.toFixed(1)}%)` 
    };
  }
  
  console.log('🔧 Extração incompleta, chamando Gemini para correção...');
  
  // Preparar prompt para Gemini corrigir
  const artigosJson = JSON.stringify(artigos.slice(0, 50), null, 2); // Limitar para não estourar contexto
  
  const prompt = `Você é um especialista em legislação brasileira. 

TAREFA: Verificar e completar a extração de artigos de uma lei.

ARTIGOS JÁ EXTRAÍDOS (${artigos.length} artigos, máximo detectado: Art. ${max}):
${artigosJson}

${lacunas > 5 ? `TEXTO ORIGINAL DA LEI (para encontrar artigos faltantes):
${textoOriginal.substring(0, 50000)}` : ''}

INSTRUÇÕES:
1. Verifique se há artigos faltantes entre Art. 1 e Art. ${max}
2. Se encontrar artigos faltantes no texto original, adicione-os
3. Retorne APENAS um JSON válido com o array completo de artigos
4. Formato: [{"numero": "Art. X", "texto": "conteúdo do artigo"}]
5. Não inclua explicações, apenas o JSON

RESPOSTA (JSON array):`;

  for (const apiKey of API_KEYS) {
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
              maxOutputTokens: 32000,
            }
          })
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Gemini erro ${response.status}:`, errorText.substring(0, 200));
        continue;
      }
      
      const data = await response.json();
      const textoResposta = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Tentar extrair JSON da resposta
      const jsonMatch = textoResposta.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const artigosCorrigidos = JSON.parse(jsonMatch[0]) as Artigo[];
          
          if (Array.isArray(artigosCorrigidos) && artigosCorrigidos.length > artigos.length) {
            console.log(`✅ Gemini corrigiu: ${artigos.length} → ${artigosCorrigidos.length} artigos`);
            return { 
              artigos: artigosCorrigidos, 
              corrigido: true, 
              detalhes: `Corrigido pela Gemini: ${artigos.length} → ${artigosCorrigidos.length} artigos` 
            };
          }
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON da Gemini:', parseError);
        }
      }
      
      // Se chegou aqui, Gemini não conseguiu melhorar
      console.log('ℹ️ Gemini não encontrou melhorias');
      return { artigos, corrigido: false, detalhes: 'Gemini validou, sem correções necessárias' };
      
    } catch (error) {
      console.error('❌ Erro ao chamar Gemini:', error);
      continue;
    }
  }
  
  return { artigos, corrigido: false, detalhes: 'Falha ao chamar Gemini, usando extração regex' };
}

serve(async (req) => {
  console.log(`📍 Function: formatar-lei-final@${REVISION}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto } = await req.json();

    if (!texto || texto.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Texto não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📄 [INÍCIO] Processando texto com ${texto.length} caracteres...`);

    // 1. Extrair ementa
    const ementa = extrairEmenta(texto);
    console.log(`📋 [EMENTA] ${ementa ? ementa.substring(0, 100) + '...' : 'Não encontrada'}`);

    // 2. Extrair artigos via regex (ETAPA PRINCIPAL)
    let artigos = extrairArtigosDoTexto(texto);
    console.log(`📊 [REGEX] ${artigos.length} artigos extraídos`);
    
    // Log dos primeiros e últimos artigos
    if (artigos.length > 0) {
      console.log(`📊 Primeiro: ${artigos[0].numero}, Último: ${artigos[artigos.length - 1].numero}`);
    }

    // 3. Validar e corrigir com Gemini (ETAPA DE VERIFICAÇÃO)
    const resultado = await validarECorrigirComGemini(artigos, texto, ementa);
    artigos = resultado.artigos;
    
    console.log(`✅ [FINAL] ${artigos.length} artigos. ${resultado.detalhes}`);

    // 4. Reconstruir texto formatado
    let textoFormatado = '';
    
    const headerMatch = texto.match(/(Presidência da República[\s\S]*?(?=LEI\s+N[ºo°]))/i);
    if (headerMatch) {
      textoFormatado += headerMatch[1].trim() + '\n\n';
    }
    
    const tituloMatch = texto.match(/(LEI\s+N[ºo°]?\s*[\d.,]+[^,\n]*,\s*DE\s+\d+\s+DE\s+\w+\s+DE\s+\d{4})/i);
    if (tituloMatch) {
      textoFormatado += tituloMatch[1].trim() + '\n\n';
    }
    
    if (ementa) {
      textoFormatado += ementa + '\n\n';
    }
    
    for (const artigo of artigos) {
      textoFormatado += `${artigo.numero} ${artigo.texto}\n\n`;
    }

    return new Response(
      JSON.stringify({ 
        textoFormatado: textoFormatado.trim(),
        artigos,
        totalArtigos: artigos.length,
        caracteresOriginal: texto.length,
        caracteresFormatado: textoFormatado.length,
        ementa: ementa || null,
        corrigidoPorGemini: resultado.corrigido,
        detalhesProcessamento: resultado.detalhes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Erro ao formatar:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
