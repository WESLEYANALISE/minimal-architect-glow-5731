import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('DIREITO_PREMIUM_API_KEY'),
].filter(Boolean) as string[];

// ========== PADRÕES DE LIXO EDITORIAL ==========
const PADROES_LIXO = [
  // Editora e publicação
  /título original:.*?\n/gi,
  /republished with permission.*?\n/gi,
  /grafia atualizada.*?\n/gi,
  /acordo ortográfico.*?\n/gi,
  /ISBN[:\s][\d\-Xx]+/gi,
  /copyright.*?\n/gi,
  /©\s*\d{4}/g,
  /\d{4}\s*©/g,
  /todos os direitos reservados/gi,
  /direitos reservados/gi,
  /all rights reserved/gi,
  
  // Créditos editoriais
  /tradução[:\s][^\n]{3,80}\n/gi,
  /revisão[:\s][^\n]{3,80}\n/gi,
  /revisão técnica[:\s][^\n]{3,80}\n/gi,
  /capa[:\s][^\n]{3,80}\n/gi,
  /projeto gráfico[:\s][^\n]{3,80}\n/gi,
  /diagramação[:\s][^\n]{3,80}\n/gi,
  /produção digital[:\s][^\n]{3,80}\n/gi,
  /preparação[:\s][^\n]{3,80}\n/gi,
  /coordenação[:\s][^\n]{3,80}\n/gi,
  /edição[:\s][^\n]{3,80}\n/gi,
  /editor[:\s][^\n]{3,80}\n/gi,
  /assistente[:\s][^\n]{3,80}\n/gi,
  /diretora?[:\s][^\n]{3,80}\n/gi,
  /gerente[:\s][^\n]{3,80}\n/gi,
  /impressão[:\s][^\n]{3,80}\n/gi,
  /acabamento[:\s][^\n]{3,80}\n/gi,
  
  // Editoras conhecidas
  /loope.*?digitais/gi,
  /geração editorial/gi,
  /câmara brasileira do livro/gi,
  /CIP-Brasil/gi,
  /ficha catalográfica/gi,
  /dados internacionais de catalogação/gi,
  /catalogação na fonte/gi,
  /biblioteca nacional/gi,
  
  // Referências a imagens que não existem
  /\[?IMAGEM[^\]]*\]?/gi,
  /\[?IMG[^\]]*\]?/gi,
  /\[?FIGURA[^\]]*\]?/gi,
  /!\[.*?\]\(.*?\)/g,
  /\.jpg|\.png|\.jpeg|\.gif|\.webp/gi,
  
  // URLs e contatos
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,
  /[\w.-]+@[\w.-]+\.\w+/gi,
  
  // Sumário/Índice (linhas com pontilhado e número)
  /^.{5,60}\.{3,}\s*\d+\s*$/gm,
  /^SUMÁRIO\s*$/gim,
  /^ÍNDICE\s*$/gim,
  /^CONTENTS\s*$/gim,
  /^SUMARIO\s*$/gim,
  
  // Números de página isolados
  /^\s*\d{1,3}\s*$/gm,
  /^\s*—\s*\d{1,3}\s*—\s*$/gm,
  
  // Marcadores de seção vazios
  /^[IVXivx]+\s*$/gm,
  /^\s*\*\s*\*\s*\*\s*$/gm,
];

async function callGeminiWithFallback(prompt: string, maxRetries = 3): Promise<string> {
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
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 100000,
              }
            })
          }
        );

        if (response.status === 429) {
          console.log(`Rate limit na key ${keyIndex + 1}, tentativa ${attempt + 1}`);
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro Gemini key ${keyIndex + 1}:`, errorText);
          break;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
          return text;
        }
      } catch (error) {
        console.error(`Erro na key ${keyIndex + 1}, tentativa ${attempt + 1}:`, error);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  throw new Error('Todas as chaves Gemini falharam');
}

// Remove lixo editorial com regex agressivo
function removerLixoEditorial(texto: string): string {
  let textoLimpo = texto;
  
  for (const padrao of PADROES_LIXO) {
    textoLimpo = textoLimpo.replace(padrao, ' ');
  }
  
  // Limpar linhas vazias múltiplas
  textoLimpo = textoLimpo.replace(/\n{3,}/g, '\n\n');
  
  // Limpar espaços múltiplos
  textoLimpo = textoLimpo.replace(/[ \t]+/g, ' ');
  
  // Limpar linhas que são só espaços
  textoLimpo = textoLimpo.replace(/^\s+$/gm, '');
  
  return textoLimpo.trim();
}

// Corrige hifenização de OCR
function corrigirHifenizacao(texto: string): string {
  return texto
    .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
    .replace(/(\w+)-\s+(\w+)/g, '$1$2');
}

// Dividir texto em páginas equilibradas
function dividirEmPaginasEquilibradas(texto: string, capitulosInfo: Map<number, string>): Array<{conteudo: string, capitulo: number, tituloCapitulo: string, isChapterStart: boolean}> {
  const TAMANHO_MINIMO = 1200;
  const TAMANHO_IDEAL = 1800;
  const TAMANHO_MAXIMO = 2500;
  
  const paginas: Array<{conteudo: string, capitulo: number, tituloCapitulo: string, isChapterStart: boolean}> = [];
  
  // Encontrar marcadores de capítulo no texto
  const marcadorRegex = /\[INICIO_CAPITULO:(\d+):([^\]]+)\]/g;
  const partes: Array<{texto: string, capitulo: number, titulo: string}> = [];
  
  let ultimoIndice = 0;
  let capituloAtual = 1;
  let tituloAtual = capitulosInfo.get(1) || 'Introdução';
  let match;
  
  while ((match = marcadorRegex.exec(texto)) !== null) {
    // Texto antes do marcador pertence ao capítulo anterior
    if (match.index > ultimoIndice) {
      const textoAntes = texto.substring(ultimoIndice, match.index).trim();
      if (textoAntes.length > 50) {
        partes.push({ texto: textoAntes, capitulo: capituloAtual, titulo: tituloAtual });
      }
    }
    
    capituloAtual = parseInt(match[1]);
    tituloAtual = match[2].trim();
    ultimoIndice = match.index + match[0].length;
  }
  
  // Texto restante após último marcador
  if (ultimoIndice < texto.length) {
    const textoRestante = texto.substring(ultimoIndice).trim();
    if (textoRestante.length > 50) {
      partes.push({ texto: textoRestante, capitulo: capituloAtual, titulo: tituloAtual });
    }
  }
  
  // Se não encontrou marcadores, tratar como capítulo único
  if (partes.length === 0) {
    partes.push({ texto: texto, capitulo: 1, titulo: 'Conteúdo' });
  }
  
  // Dividir cada parte em páginas
  for (const parte of partes) {
    const paragrafos = parte.texto.split(/\n\n+/).filter(p => p.trim().length > 0);
    let paginaAtual = '';
    let isFirstPageOfChapter = true;
    
    for (let i = 0; i < paragrafos.length; i++) {
      const paragrafo = paragrafos[i].trim();
      
      // Se adicionar este parágrafo ultrapassa o máximo
      if ((paginaAtual.length + paragrafo.length + 2) > TAMANHO_MAXIMO) {
        // Salvar página atual se tiver conteúdo mínimo
        if (paginaAtual.length >= TAMANHO_MINIMO) {
          paginas.push({
            conteudo: paginaAtual.trim(),
            capitulo: parte.capitulo,
            tituloCapitulo: parte.titulo,
            isChapterStart: isFirstPageOfChapter
          });
          isFirstPageOfChapter = false;
          paginaAtual = paragrafo;
        } else {
          // Página muito curta, continuar adicionando
          paginaAtual += (paginaAtual ? '\n\n' : '') + paragrafo;
        }
      } else {
        paginaAtual += (paginaAtual ? '\n\n' : '') + paragrafo;
      }
      
      // Se atingiu o tamanho ideal e ainda tem mais conteúdo, pode quebrar
      if (paginaAtual.length >= TAMANHO_IDEAL && i < paragrafos.length - 1) {
        paginas.push({
          conteudo: paginaAtual.trim(),
          capitulo: parte.capitulo,
          tituloCapitulo: parte.titulo,
          isChapterStart: isFirstPageOfChapter
        });
        isFirstPageOfChapter = false;
        paginaAtual = '';
      }
    }
    
    // Página restante
    if (paginaAtual.trim().length > 0) {
      // Se a última página é muito curta, juntar com a anterior
      if (paginaAtual.trim().length < TAMANHO_MINIMO && paginas.length > 0) {
        const ultimaPagina = paginas[paginas.length - 1];
        if (ultimaPagina.capitulo === parte.capitulo && ultimaPagina.conteudo.length + paginaAtual.length < TAMANHO_MAXIMO * 1.2) {
          ultimaPagina.conteudo += '\n\n' + paginaAtual.trim();
        } else {
          paginas.push({
            conteudo: paginaAtual.trim(),
            capitulo: parte.capitulo,
            tituloCapitulo: parte.titulo,
            isChapterStart: isFirstPageOfChapter
          });
        }
      } else {
        paginas.push({
          conteudo: paginaAtual.trim(),
          capitulo: parte.capitulo,
          tituloCapitulo: parte.titulo,
          isChapterStart: isFirstPageOfChapter
        });
      }
    }
  }
  
  return paginas;
}

// Dividir texto em chunks para processar
function dividirEmChunks(texto: string, tamanhoMax: number): string[] {
  const chunks: string[] = [];
  let posicao = 0;
  
  while (posicao < texto.length) {
    let fim = Math.min(posicao + tamanhoMax, texto.length);
    
    if (fim < texto.length) {
      const ultimoParragrafo = texto.lastIndexOf('\n\n', fim);
      if (ultimoParragrafo > posicao + tamanhoMax * 0.5) {
        fim = ultimoParragrafo + 2;
      }
    }
    
    chunks.push(texto.substring(posicao, fim).trim());
    posicao = fim;
  }
  
  return chunks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tituloLivro } = await req.json();

    if (!tituloLivro) {
      return new Response(
        JSON.stringify({ error: 'tituloLivro é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FORMATAÇÃO COMPLETA V2] Iniciando para: ${tituloLivro}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar TODO o texto OCR do livro
    const { data: paginasOCR, error: erroOCR } = await supabase
      .from('BIBLIOTECA-LEITURA-DINAMICA')
      .select('Pagina, "Conteúdo", "Titulo do Capitulo"')
      .eq('Titulo da Obra', tituloLivro)
      .order('Pagina', { ascending: true });

    if (erroOCR || !paginasOCR || paginasOCR.length === 0) {
      throw new Error(`Páginas OCR não encontradas para: ${tituloLivro}`);
    }

    console.log(`[FORMATAÇÃO] ${paginasOCR.length} páginas OCR encontradas`);

    // 2. Buscar índice de capítulos
    const { data: indiceCapitulos } = await supabase
      .from('leitura_livros_indice')
      .select('*')
      .eq('livro_titulo', tituloLivro)
      .order('numero_capitulo', { ascending: true });

    const capitulosInfo = new Map<number, string>();
    if (indiceCapitulos && indiceCapitulos.length > 0) {
      for (const cap of indiceCapitulos) {
        capitulosInfo.set(cap.numero_capitulo, cap.titulo_capitulo);
      }
    }

    console.log(`[FORMATAÇÃO] ${capitulosInfo.size} capítulos no índice`);

    // 3. Concatenar TODO o texto OCR
    let textoCompleto = paginasOCR
      .map(p => (p['Conteúdo'] || '').trim())
      .filter(c => c.length > 0)
      .join('\n\n');

    console.log(`[FORMATAÇÃO] Texto completo: ${textoCompleto.length} caracteres`);

    // 4. Aplicar limpeza de lixo com regex
    textoCompleto = removerLixoEditorial(textoCompleto);
    textoCompleto = corrigirHifenizacao(textoCompleto);

    console.log(`[FORMATAÇÃO] Após limpeza regex: ${textoCompleto.length} caracteres`);

    // 5. Preparar lista de capítulos para o prompt
    let listaCapitulos = '';
    if (capitulosInfo.size > 0) {
      listaCapitulos = 'CAPÍTULOS DO LIVRO (use para inserir marcadores):\n';
      for (const [num, titulo] of capitulosInfo) {
        listaCapitulos += `- Capítulo ${num}: ${titulo}\n`;
      }
    }

    // 6. Processar com Gemini em chunks (~50k chars)
    const CHUNK_SIZE = 50000;
    let textoFormatado = '';

    if (textoCompleto.length > CHUNK_SIZE) {
      const chunks = dividirEmChunks(textoCompleto, CHUNK_SIZE);
      console.log(`[FORMATAÇÃO] Dividido em ${chunks.length} chunks`);

      for (let i = 0; i < chunks.length; i++) {
        const promptFormatar = `Você é um formatador especializado em livros para apps de leitura mobile.

TAREFA: Formate este texto para leitura final em dispositivos móveis.

${listaCapitulos}

📋 INSTRUÇÕES OBRIGATÓRIAS:

1. PRESERVE 100% DO CONTEÚDO LITERÁRIO/NARRATIVO
   - NÃO resuma, NÃO omita, NÃO altere o texto original
   - Todo parágrafo da história/conteúdo deve ser mantido

2. REMOVA COMPLETAMENTE (SE AINDA EXISTIR):
   - Créditos editoriais (tradução, revisão, capa, editora)
   - ISBN, copyright, ficha catalográfica
   - Sumário/índice (o app tem menu próprio)
   - Referências a imagens inexistentes
   - Números de página isolados
   - URLs, emails, contatos

3. MARQUE O INÍCIO DE CADA CAPÍTULO:
   - Quando encontrar o início de um capítulo, insira: [INICIO_CAPITULO:N:Título]
   - Exemplo: [INICIO_CAPITULO:1:Introdução]
   - Use a lista de capítulos acima como referência

4. FORMATE PARA LEITURA MOBILE:
   - Parágrafos de 3-5 frases
   - Citações longas: > blockquote
   - Diálogos em linhas separadas
   - Junte parágrafos cortados incorretamente

5. NÃO SIGA A ESTRUTURA DE PÁGINAS DO PDF:
   - O texto deve fluir naturalmente
   - A paginação será feita depois automaticamente

TEXTO PARA FORMATAR (chunk ${i + 1}/${chunks.length}):

${chunks[i]}

TEXTO FORMATADO:`;

        try {
          const resultado = await callGeminiWithFallback(promptFormatar);
          textoFormatado += resultado + '\n\n';
          console.log(`[FORMATAÇÃO] Chunk ${i + 1}/${chunks.length} processado: ${resultado.length} chars`);
        } catch (error) {
          console.error(`[FORMATAÇÃO] Erro no chunk ${i + 1}:`, error);
          textoFormatado += chunks[i] + '\n\n';
        }

        // Pausa entre chunks
        if (i < chunks.length - 1) {
          await new Promise(r => setTimeout(r, 800));
        }
      }
    } else {
      // Texto pequeno: processar de uma vez
      const promptFormatar = `Você é um formatador especializado em livros para apps de leitura mobile.

TAREFA: Formate este texto para leitura final em dispositivos móveis.

${listaCapitulos}

📋 INSTRUÇÕES OBRIGATÓRIAS:

1. PRESERVE 100% DO CONTEÚDO LITERÁRIO/NARRATIVO
   - NÃO resuma, NÃO omita, NÃO altere o texto original
   - Todo parágrafo da história/conteúdo deve ser mantido

2. REMOVA COMPLETAMENTE (SE AINDA EXISTIR):
   - Créditos editoriais (tradução, revisão, capa, editora)
   - ISBN, copyright, ficha catalográfica
   - Sumário/índice (o app tem menu próprio)
   - Referências a imagens inexistentes
   - Números de página isolados
   - URLs, emails, contatos

3. MARQUE O INÍCIO DE CADA CAPÍTULO:
   - Quando encontrar o início de um capítulo, insira: [INICIO_CAPITULO:N:Título]
   - Exemplo: [INICIO_CAPITULO:1:Introdução]
   - Use a lista de capítulos acima como referência

4. FORMATE PARA LEITURA MOBILE:
   - Parágrafos de 3-5 frases
   - Citações longas: > blockquote
   - Diálogos em linhas separadas
   - Junte parágrafos cortados incorretamente

5. NÃO SIGA A ESTRUTURA DE PÁGINAS DO PDF:
   - O texto deve fluir naturalmente
   - A paginação será feita depois automaticamente

TEXTO PARA FORMATAR:

${textoCompleto}

TEXTO FORMATADO:`;

      try {
        textoFormatado = await callGeminiWithFallback(promptFormatar);
      } catch (error) {
        console.error('[FORMATAÇÃO] Erro ao formatar:', error);
        textoFormatado = textoCompleto;
      }
    }

    textoFormatado = textoFormatado.trim();
    
    // Remover marcadores residuais do prompt
    textoFormatado = textoFormatado
      .replace(/TEXTO FORMATADO:/g, '')
      .replace(/^\s*```\s*/gm, '')
      .trim();

    console.log(`[FORMATAÇÃO] Texto formatado: ${textoFormatado.length} caracteres`);

    // 7. Deletar páginas formatadas anteriores
    await supabase
      .from('leitura_paginas_formatadas')
      .delete()
      .eq('livro_titulo', tituloLivro);

    console.log('[FORMATAÇÃO] Páginas antigas deletadas');

    // 8. Dividir em páginas equilibradas
    const paginasVirtuais = dividirEmPaginasEquilibradas(textoFormatado, capitulosInfo);

    console.log(`[FORMATAÇÃO] ${paginasVirtuais.length} páginas virtuais criadas`);

    // 9. Inserir páginas
    const paginasParaInserir = paginasVirtuais.map((pagina, index) => ({
      livro_titulo: tituloLivro,
      numero_pagina: index + 1,
      html_formatado: pagina.conteudo,
      capitulo_titulo: pagina.tituloCapitulo,
      is_chapter_start: pagina.isChapterStart,
      numero_capitulo: pagina.capitulo
    }));

    // Inserir em lotes de 50
    const BATCH_SIZE = 50;
    for (let i = 0; i < paginasParaInserir.length; i += BATCH_SIZE) {
      const batch = paginasParaInserir.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase
        .from('leitura_paginas_formatadas')
        .insert(batch);

      if (insertError) {
        console.error(`Erro ao inserir batch ${i / BATCH_SIZE + 1}:`, insertError);
      }
    }

    console.log(`[FORMATAÇÃO] ${paginasVirtuais.length} páginas salvas`);

    // Estatísticas
    const tamanhoMedio = Math.round(paginasVirtuais.reduce((sum, p) => sum + p.conteudo.length, 0) / paginasVirtuais.length);
    const capitulosEncontrados = new Set(paginasVirtuais.map(p => p.capitulo)).size;

    return new Response(
      JSON.stringify({
        success: true,
        livroTitulo: tituloLivro,
        paginasOCR: paginasOCR.length,
        paginasVirtuais: paginasVirtuais.length,
        capitulosEncontrados,
        tamanhoMedioPagina: tamanhoMedio,
        textoOriginal: textoCompleto.length,
        textoFormatado: textoFormatado.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FORMATAÇÃO COMPLETA V2] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
