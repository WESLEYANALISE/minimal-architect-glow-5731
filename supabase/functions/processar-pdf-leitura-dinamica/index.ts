import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Converter URL do Google Drive para download direto
function converterUrlDrive(url: string): string {
  if (url.includes('/folders/')) {
    throw new Error('URL de pasta não suportada. Use URL direta do arquivo.');
  }
  
  let fileId: string | null = null;
  
  const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) {
    fileId = matchD[1];
  }
  
  if (!fileId) {
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId) {
      fileId = matchId[1];
    }
  }
  
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }
  
  return url;
}

// Baixar PDF com retry e seguir redirects
async function baixarPdfDrive(url: string): Promise<ArrayBuffer> {
  const downloadUrl = converterUrlDrive(url);
  console.log(`Tentando baixar de: ${downloadUrl}`);
  
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
    console.log('Recebeu HTML, tentando extrair link de confirmação...');
    
    const confirmMatch = html.match(/href="([^"]*confirm=t[^"]*)"/);
    if (confirmMatch) {
      let confirmUrl = confirmMatch[1].replace(/&amp;/g, '&');
      if (!confirmUrl.startsWith('http')) {
        confirmUrl = 'https://drive.google.com' + confirmUrl;
      }
      
      response = await fetch(confirmUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow',
      });
    } else {
      const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
      if (fileId) {
        const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=yes`;
        response = await fetch(directUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': 'download_warning_token=true',
          },
          redirect: 'follow',
        });
      }
    }
  }

  if (!response.ok) {
    throw new Error(`Erro ao baixar PDF: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  
  const firstBytes = new Uint8Array(buffer.slice(0, 5));
  const header = new TextDecoder().decode(firstBytes);
  
  if (!header.startsWith('%PDF')) {
    console.error('Arquivo baixado não é um PDF válido. Primeiros bytes:', header);
    throw new Error('O arquivo baixado não é um PDF válido. Verifique se o link está público.');
  }
  
  return buffer;
}

// Converter ArrayBuffer para Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Interface para imagem extraída pelo Mistral
interface ImagemExtraida {
  id: string;
  image_base64?: string;
}

// Interface para página do Mistral
interface PaginaMistral {
  index: number;
  markdown: string;
  images?: ImagemExtraida[];
}

// Upload de imagem para Supabase Storage
async function uploadImagemParaStorage(
  supabase: any,
  imageBase64: string,
  imageId: string,
  tituloLivro: string,
  paginaIndex: number
): Promise<string | null> {
  try {
    const mimeType = imageId.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const slugLivro = tituloLivro.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const fileName = `${slugLivro}/pagina-${paginaIndex}/${imageId}`;
    
    console.log(`[Upload] Enviando imagem: ${fileName} (${Math.round(bytes.length / 1024)}KB)`);
    
    const { data, error } = await supabase.storage
      .from('leitura-imagens')
      .upload(fileName, bytes, {
        contentType: mimeType,
        upsert: true
      });
    
    if (error) {
      console.error(`[Upload] Erro ao fazer upload: ${error.message}`);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('leitura-imagens')
      .getPublicUrl(fileName);
    
    console.log(`[Upload] Sucesso: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error(`[Upload] Erro ao fazer upload da imagem ${imageId}:`, error);
    return null;
  }
}

// Extrair texto usando Mistral OCR COM IMAGENS
async function extrairTextoComMistral(
  pdfBase64: string, 
  supabase: any, 
  tituloLivro: string
): Promise<Array<{ index: number; markdown: string }>> {
  const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY');
  
  if (!MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY não configurada');
  }

  console.log('[Mistral OCR] Iniciando extração do PDF COM IMAGENS...');
  
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: `data:application/pdf;base64,${pdfBase64}`
      },
      include_image_base64: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Mistral OCR] Erro:', response.status, errorText);
    throw new Error(`Mistral OCR falhou: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('[Mistral OCR] Resposta recebida:', JSON.stringify(data).substring(0, 500));
  
  if (data.pages && Array.isArray(data.pages)) {
    console.log(`[Mistral OCR] ${data.pages.length} páginas extraídas com sucesso`);
    
    const paginasProcessadas: Array<{ index: number; markdown: string }> = [];
    
    for (const pagina of data.pages as PaginaMistral[]) {
      let textoMarkdown = pagina.markdown || '';
      
      if (pagina.images && pagina.images.length > 0) {
        console.log(`[Mistral OCR] Página ${pagina.index}: ${pagina.images.length} imagens encontradas`);
        
        for (const img of pagina.images) {
          if (img.image_base64 && img.id) {
            const urlPublica = await uploadImagemParaStorage(
              supabase,
              img.image_base64,
              img.id,
              tituloLivro,
              pagina.index
            );
            
            if (urlPublica) {
              textoMarkdown = textoMarkdown.replace(
                new RegExp(`!\\[${img.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\(${img.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
                `![${img.id}](${urlPublica})`
              );
              textoMarkdown = textoMarkdown.replace(
                new RegExp(`!\\[[^\\]]*\\]\\(${img.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
                `![${img.id}](${urlPublica})`
              );
            }
          }
        }
      }
      
      paginasProcessadas.push({
        index: pagina.index,
        markdown: textoMarkdown
      });
    }
    
    return paginasProcessadas;
  }
  
  if (data.text) {
    return [{ index: 0, markdown: data.text }];
  }
  
  throw new Error('Formato de resposta do Mistral OCR não reconhecido');
}

// Fallback: Extrair páginas específicas com Gemini Vision
async function extrairPaginasComGemini(
  pdfBase64: string,
  paginasAlvo: number[]
): Promise<Array<{ index: number; markdown: string }>> {
  const { getRotatedKeyStrings } = await import("../_shared/gemini-keys.ts");
  const GEMINI_KEY = getRotatedKeyStrings()[0];
  
  if (!GEMINI_KEY) {
    console.warn('[Gemini Fallback] Sem chave Gemini disponível');
    return [];
  }

  console.log(`[Gemini Fallback] Extraindo ${paginasAlvo.length} páginas: ${paginasAlvo.join(', ')}`);
  
  const resultados: Array<{ index: number; markdown: string }> = [];
  
  // Processar em lotes de 3 para não sobrecarregar
  const LOTE = 3;
  for (let i = 0; i < paginasAlvo.length; i += LOTE) {
    const lote = paginasAlvo.slice(i, i + LOTE);
    
    const promises = lote.map(async (pagina) => {
      try {
        const prompt = `Extraia TODO o texto da página ${pagina} deste PDF. Formate em Markdown preservando a estrutura original (títulos, parágrafos, listas, citações). Transcreva EXATAMENTE como aparece, sem resumir ou omitir nada. Se a página estiver vazia, responda apenas: [VAZIA]`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ 
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: "application/pdf", data: pdfBase64 } }
                ] 
              }],
              generationConfig: { temperature: 0, maxOutputTokens: 16000 }
            })
          }
        );

        if (!response.ok) {
          console.warn(`[Gemini Fallback] Erro página ${pagina}: ${response.status}`);
          return null;
        }
        
        const data = await response.json();
        const texto = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        
        if (texto === "[VAZIA]" || texto.length < 10) return null;
        
        return { index: pagina - 1, markdown: texto }; // 0-based index
      } catch (e) {
        console.warn(`[Gemini Fallback] Erro página ${pagina}:`, e);
        return null;
      }
    });
    
    const results = await Promise.allSettled(promises);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        resultados.push(r.value);
      }
    }
    
    // Delay entre lotes
    if (i + LOTE < paginasAlvo.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log(`[Gemini Fallback] ${resultados.length}/${paginasAlvo.length} páginas recuperadas`);
  return resultados;
}

// Limpar texto de lixo editorial — CALIBRADO com scoring
function limparTextoLixo(texto: string): string {
  let limpo = texto
    // === REMOÇÃO DE METADADOS EDITORIAIS ===
    .replace(/ISBN[:\s]*[\d\-X]+/gi, '')
    .replace(/©.*?(?:\n|$)/gi, '')
    .replace(/Copyright.*?(?:\n|$)/gi, '')
    .replace(/Todos os direitos reservados.*?(?:\n|$)/gi, '')
    .replace(/All rights reserved.*?(?:\n|$)/gi, '')
    .replace(/CIP-Brasil.*?(?:\n|$)/gi, '')
    .replace(/Dados Internacionais de Catalogação.*?(?:\n\n|\n(?=[A-Z]))/gis, '')
    .replace(/Ficha catalográfica.*?(?:\n\n|\n(?=[A-Z]))/gis, '')
    .replace(/Catalogação na Publicação.*?(?:\n\n|\n(?=[A-Z]))/gis, '')
    .replace(/CDU[\s:]*[\d\.]+/gi, '')
    .replace(/CDD[\s:]*[\d\.]+/gi, '')
    .replace(/Impresso no Brasil.*?(?:\n|$)/gi, '')
    .replace(/Printed in Brazil.*?(?:\n|$)/gi, '')
    .replace(/Impresso em.*?(?:\n|$)/gi, '')
    // URLs e contatos
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '')
    
    // === REMOÇÃO DE CRÉDITOS EDITORIAIS (somente quando isolados em linha) ===
    .replace(/^Tradução[:\s]*[^\n]+$/gim, '')
    .replace(/^Traduzido por[:\s]*[^\n]+$/gim, '')
    .replace(/^Preparação[:\s]*[^\n]+$/gim, '')
    .replace(/^Projeto gráfico[:\s]*[^\n]+$/gim, '')
    .replace(/^Diagramação[:\s]*[^\n]+$/gim, '')
    .replace(/^Editoração[:\s]*[^\n]+$/gim, '')
    .replace(/^Produção editorial[:\s]*[^\n]+$/gim, '')
    .replace(/^Produção digital[:\s]*[^\n]+$/gim, '')
    .replace(/^Coordenação editorial[:\s]*[^\n]+$/gim, '')
    
    // === MANTER IMAGENS COM URL COMPLETA, REMOVER REFERÊNCIAS LOCAIS ===
    .replace(/!\[[^\]]*\]\((?!https?:\/\/)[^)]+\)/g, '')
    .replace(/\[IMAGEM[^\]]*\]/gi, '')
    .replace(/\[IMG[^\]]*\]/gi, '')
    .replace(/\[FIGURA[^\]]*\]/gi, '')
    .replace(/\[IMAGE[^\]]*\]/gi, '')
    
    // === LIMPEZA DE FORMATAÇÃO ===
    .replace(/^\s*\d+\s*$/gm, '') // Números de página isolados
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/^[\s\-_=\.•\*]+$/gm, '')
    .trim();
  
  return limpo;
}

// Verificar se página é lixo editorial usando SCORING (menos agressivo)
function isPaginaLixo(texto: string): boolean {
  const textoLimpo = texto.trim();
  
  // Página muito curta — threshold reduzido de 100 para 30
  if (textoLimpo.length < 30) return true;
  
  // Páginas curtas (30-100 chars) podem ser epígrafes, citações, etc.
  // Só descartar se tiver muitos padrões de lixo
  const thresholdScore = textoLimpo.length < 100 ? 3 : 5;
  
  // Padrões que indicam página editorial/pré-textual — cada um soma pontos
  let score = 0;
  
  const padroesFortes = [ // 3 pontos cada
    /ISBN/i,
    /Copyright/i,
    /Todos os direitos/i,
    /All rights reserved/i,
    /Ficha catalográfica/i,
    /Dados Internacionais/i,
    /CIP-Brasil/i,
    /Impresso no Brasil/i,
    /Printed in Brazil/i,
    /Republished with permission/i,
  ];
  
  const padroesMedianose = [ // 1 ponto cada
    /^\s*Tradução:/im,
    /^\s*Capa:/im,
    /^\s*Projeto gráfico/im,
    /Grafia atualizada/i,
    /Acordo Ortográfico/i,
    /Produção digital/i,
    /^\s*Diretora?\s+\w+/im,
    /^\s*Assistente\s+\w+/im,
    /^\s*Gerente\s+\w+/im,
  ];
  
  for (const p of padroesFortes) {
    if (p.test(textoLimpo)) score += 3;
  }
  for (const p of padroesMedianose) {
    if (p.test(textoLimpo)) score += 1;
  }
  
  if (score >= thresholdScore) return true;
  
  // NÃO descartar páginas curtas que possam ser epígrafes/citações literárias
  // Só descartar se não tem nenhum parágrafo significativo E é muito curto
  if (textoLimpo.length < 100) {
    // Se tem aspas, travessão ou itálico — provavelmente é epígrafe/citação
    if (/["""]|—|_.*_|\*.*\*/.test(textoLimpo)) return false;
    // Se parece ser só um título de capítulo, preservar
    if (/^(Capítulo|Parte|CAPÍTULO|PARTE)\s/m.test(textoLimpo)) return false;
  }
  
  return false;
}

// Detectar total de páginas do PDF via header
function detectarTotalPaginas(pdfBuffer: ArrayBuffer): number | null {
  try {
    const bytes = new Uint8Array(pdfBuffer);
    // Procurar /Count no trailer/catalog do PDF (busca dos últimos 10KB)
    const searchArea = bytes.slice(Math.max(0, bytes.length - 10240));
    const text = new TextDecoder('latin1').decode(searchArea);
    
    // Procurar padrão /Count <número>
    const matches = text.match(/\/Count\s+(\d+)/g);
    if (matches && matches.length > 0) {
      // O maior Count geralmente é o total de páginas
      const counts = matches.map(m => parseInt(m.match(/\d+/)?.[0] || '0'));
      const maxCount = Math.max(...counts);
      if (maxCount > 0 && maxCount < 10000) {
        return maxCount;
      }
    }
  } catch (e) {
    console.warn('[PDF] Não foi possível detectar total de páginas do header:', e);
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tituloLivro, pdfUrl, paginaInicial, paginaFinal, apenasReprocessar, paginasFaltantes } = await req.json();

    if (!tituloLivro || !pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'tituloLivro e pdfUrl são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`[OCR] Processando PDF: ${tituloLivro}`);
    console.log(`[OCR] URL: ${pdfUrl}`);
    console.log(`[OCR] Modo: ${apenasReprocessar ? 'reprocessar faltantes' : 'extração completa'}`);

    // 1. Baixar PDF do Google Drive
    const pdfBuffer = await baixarPdfDrive(pdfUrl);
    const tamanhoMB = Math.round(pdfBuffer.byteLength / (1024 * 1024) * 10) / 10;
    console.log(`[OCR] PDF baixado: ${tamanhoMB}MB`);

    // 2. Detectar total de páginas do header do PDF
    const totalPaginasPdf = detectarTotalPaginas(pdfBuffer);
    console.log(`[OCR] Total páginas detectado no header: ${totalPaginasPdf || 'não detectado'}`);

    // 3. Converter para Base64
    const pdfBase64 = arrayBufferToBase64(pdfBuffer);

    // 4. Se modo reprocessar faltantes, usar Gemini para páginas específicas
    if (apenasReprocessar && paginasFaltantes && Array.isArray(paginasFaltantes) && paginasFaltantes.length > 0) {
      console.log(`[OCR] Reprocessando ${paginasFaltantes.length} páginas faltantes com Gemini`);
      
      const paginasRecuperadas = await extrairPaginasComGemini(pdfBase64, paginasFaltantes);
      
      let salvas = 0;
      for (const pagina of paginasRecuperadas) {
        const numeroPagina = pagina.index + 1;
        const textoLimpo = limparTextoLixo(pagina.markdown);
        
        if (textoLimpo.length >= 30) {
          const { error } = await supabase
            .from('BIBLIOTECA-LEITURA-DINAMICA')
            .upsert({
              'Titulo da Obra': tituloLivro,
              'Pagina': numeroPagina,
              'Conteúdo': textoLimpo,
              'Titulo do Capitulo': null
            }, { onConflict: 'Titulo da Obra,Pagina', ignoreDuplicates: false });

          if (!error) salvas++;
        }
      }
      
      // Verificar estado final
      const { count: totalNoBanco } = await supabase
        .from('BIBLIOTECA-LEITURA-DINAMICA')
        .select('Pagina', { count: 'exact', head: true })
        .eq('Titulo da Obra', tituloLivro);

      return new Response(
        JSON.stringify({ 
          success: true,
          paginasProcessadas: totalNoBanco || 0,
          paginasRecuperadas: salvas,
          totalPaginas: totalPaginasPdf || 0,
          temMais: false,
          metodo: 'gemini-fallback'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Extrair texto com Mistral OCR (uma chamada para todo o PDF) COM IMAGENS
    const paginas = await extrairTextoComMistral(pdfBase64, supabase, tituloLivro);
    console.log(`[OCR] ${paginas.length} páginas extraídas pelo Mistral (com imagens)`);

    // 6. NÃO deletar páginas existentes — usar UPSERT incremental
    // Isso preserva páginas já processadas em caso de retry
    let paginasSalvas = 0;
    let paginasIgnoradas = 0;
    const paginasIgnoradasLista: number[] = [];
    
    for (const pagina of paginas) {
      const numeroPagina = (pagina.index || 0) + 1;
      const textoOriginal = pagina.markdown || '';
      
      // Limpar texto de lixo editorial
      const textoLimpo = limparTextoLixo(textoOriginal);
      
      // Verificar se é página de lixo editorial (scoring calibrado)
      if (isPaginaLixo(textoLimpo)) {
        console.log(`[OCR] Página ${numeroPagina} ignorada (score lixo alto, ${textoLimpo.length} chars)`);
        paginasIgnoradas++;
        paginasIgnoradasLista.push(numeroPagina);
        continue;
      }
      
      // Salvar se tiver conteúdo (threshold reduzido de 100 para 30)
      if (textoLimpo.length >= 30) {
        const { error } = await supabase
          .from('BIBLIOTECA-LEITURA-DINAMICA')
          .upsert({
            'Titulo da Obra': tituloLivro,
            'Pagina': numeroPagina,
            'Conteúdo': textoLimpo,
            'Titulo do Capitulo': null
          }, { 
            onConflict: 'Titulo da Obra,Pagina',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error(`[OCR] Erro ao salvar página ${numeroPagina}:`, error);
        } else {
          paginasSalvas++;
        }
      } else {
        console.log(`[OCR] Página ${numeroPagina} ignorada (conteúdo insuficiente: ${textoLimpo.length} chars)`);
        paginasIgnoradas++;
        paginasIgnoradasLista.push(numeroPagina);
      }
    }

    // 7. Verificação pós-extração: comparar esperado vs salvo
    const { count: totalNoBanco } = await supabase
      .from('BIBLIOTECA-LEITURA-DINAMICA')
      .select('Pagina', { count: 'exact', head: true })
      .eq('Titulo da Obra', tituloLivro);

    const totalEsperado = totalPaginasPdf || paginas.length;
    const paginasNoBanco = totalNoBanco || 0;
    
    // Detectar páginas que o Mistral pode ter truncado (não retornou)
    const paginasRetornadas = new Set(paginas.map(p => (p.index || 0) + 1));
    const paginasTruncadas: number[] = [];
    
    if (totalPaginasPdf && totalPaginasPdf > paginas.length) {
      for (let i = 1; i <= totalPaginasPdf; i++) {
        if (!paginasRetornadas.has(i)) {
          paginasTruncadas.push(i);
        }
      }
      console.log(`[OCR] ATENÇÃO: Mistral retornou ${paginas.length} de ${totalPaginasPdf} páginas. Truncadas: ${paginasTruncadas.length}`);
    }

    // Se houve truncamento, tentar recuperar com Gemini
    let paginasRecuperadasGemini = 0;
    if (paginasTruncadas.length > 0 && paginasTruncadas.length <= 50) {
      console.log(`[OCR] Tentando recuperar ${paginasTruncadas.length} páginas truncadas com Gemini...`);
      const recuperadas = await extrairPaginasComGemini(pdfBase64, paginasTruncadas);
      
      for (const pagina of recuperadas) {
        const numeroPagina = pagina.index + 1;
        const textoLimpo = limparTextoLixo(pagina.markdown);
        
        if (textoLimpo.length >= 30 && !isPaginaLixo(textoLimpo)) {
          const { error } = await supabase
            .from('BIBLIOTECA-LEITURA-DINAMICA')
            .upsert({
              'Titulo da Obra': tituloLivro,
              'Pagina': numeroPagina,
              'Conteúdo': textoLimpo,
              'Titulo do Capitulo': null
            }, { onConflict: 'Titulo da Obra,Pagina', ignoreDuplicates: false });

          if (!error) {
            paginasRecuperadasGemini++;
            paginasSalvas++;
          }
        }
      }
      console.log(`[OCR] Gemini recuperou ${paginasRecuperadasGemini} páginas truncadas`);
    }

    // Recalcular total no banco após possível recuperação
    const { count: totalFinal } = await supabase
      .from('BIBLIOTECA-LEITURA-DINAMICA')
      .select('Pagina', { count: 'exact', head: true })
      .eq('Titulo da Obra', tituloLivro);

    // Listar páginas que ainda faltam (para retry no frontend)
    const { data: paginasSalvasData } = await supabase
      .from('BIBLIOTECA-LEITURA-DINAMICA')
      .select('Pagina')
      .eq('Titulo da Obra', tituloLivro);

    const paginasSalvasSet = new Set((paginasSalvasData || []).map((p: any) => p.Pagina));
    const paginasAindaFaltantes: number[] = [];
    const totalRef = totalPaginasPdf || paginas.length;
    
    for (let i = 1; i <= totalRef; i++) {
      if (!paginasSalvasSet.has(i)) {
        paginasAindaFaltantes.push(i);
      }
    }

    console.log(`[OCR] RESULTADO FINAL:`);
    console.log(`  - Páginas no PDF: ${totalRef}`);
    console.log(`  - Páginas extraídas Mistral: ${paginas.length}`);
    console.log(`  - Páginas salvas: ${totalFinal || 0}`);
    console.log(`  - Páginas ignoradas (lixo): ${paginasIgnoradas}`);
    console.log(`  - Páginas recuperadas Gemini: ${paginasRecuperadasGemini}`);
    console.log(`  - Páginas faltantes: ${paginasAindaFaltantes.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        paginasProcessadas: totalFinal || 0,
        totalPaginas: totalRef,
        paginaAtual: totalRef,
        temMais: false,
        proximaPagina: null,
        metodo: 'mistral-ocr',
        verificacao: {
          totalPdf: totalRef,
          extraidasMistral: paginas.length,
          salvasNoBanco: totalFinal || 0,
          ignoradasLixo: paginasIgnoradas,
          recuperadasGemini: paginasRecuperadasGemini,
          paginasFaltantes: paginasAindaFaltantes,
          completo: paginasAindaFaltantes.length === 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[OCR] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
