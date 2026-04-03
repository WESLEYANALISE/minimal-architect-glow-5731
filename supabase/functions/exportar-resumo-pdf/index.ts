import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Buscar imagem e converter para base64 data URL
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    console.log(`[img] Buscando imagem: ${url.substring(0, 80)}...`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Detect format from content-type or URL
    const contentType = response.headers.get('content-type') || '';
    let format = 'PNG';
    if (contentType.includes('jpeg') || contentType.includes('jpg') || url.includes('.jpg') || url.includes('.jpeg')) {
      format = 'JPEG';
    } else if (contentType.includes('webp') || url.includes('.webp')) {
      format = 'WEBP';
    }
    
    // Convert to base64 data URL
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const mimeType = format === 'JPEG' ? 'image/jpeg' : format === 'WEBP' ? 'image/webp' : 'image/png';
    console.log(`[img] OK - ${format} ${bytes.length} bytes`);
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error(`[img] Erro ao buscar imagem:`, err);
    return null;
  }
}

// Paleta de cores - Tema Escuro com Dourado
const CORES = {
  fundoCapa: [26, 26, 46],       // #1a1a2e
  fundoHeader: [15, 15, 26],     // #0f0f1a
  douradoPrimario: [212, 168, 83], // #d4a853
  douradoClaro: [240, 214, 138],  // #f0d68a
  textoPrincipal: [232, 232, 232], // #e8e8e8
  textoSecundario: [160, 160, 160], // #a0a0a0
  fundoBlocos: [37, 37, 64],     // #252540
  branco: [255, 255, 255],
  preto: [0, 0, 0],
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumo, titulo, videoId, resumoId, area, tema, urlAudio, forceRegenerate, imagemUrls: clientImageUrls } = await req.json();
    
    if (!resumo || !titulo) {
      throw new Error("Resumo e título são obrigatórios");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe PDF em cache (pular se forceRegenerate)
    if (resumoId && !forceRegenerate) {
      const { data: existingResumo } = await supabase
        .from("RESUMO")
        .select("url_pdf")
        .eq("id", resumoId)
        .single();

      if (existingResumo?.url_pdf) {
        console.log("PDF já existe em cache:", existingResumo.url_pdf);
        return new Response(
          JSON.stringify({ 
            pdfUrl: existingResumo.url_pdf,
            fromCache: true,
            message: "PDF recuperado do cache!"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Gerando PDF premium (tema escuro/dourado) para:", titulo);

    // =====================
    // BUSCAR IMAGENS DO BANCO
    // =====================
    let imagemResumo: string | null = null;
    let imagemExemplo1: string | null = null;
    let imagemExemplo2: string | null = null;
    let imagemExemplo3: string | null = null;

    // Usar URLs do cliente ou buscar do banco
    if (clientImageUrls) {
      const fetches = await Promise.all([
        clientImageUrls.resumo ? fetchImageAsBase64(clientImageUrls.resumo) : null,
        clientImageUrls.exemplo1 ? fetchImageAsBase64(clientImageUrls.exemplo1) : null,
        clientImageUrls.exemplo2 ? fetchImageAsBase64(clientImageUrls.exemplo2) : null,
        clientImageUrls.exemplo3 ? fetchImageAsBase64(clientImageUrls.exemplo3) : null,
      ]);
      [imagemResumo, imagemExemplo1, imagemExemplo2, imagemExemplo3] = fetches;
    } else if (resumoId) {
      // Buscar URLs do banco
      const { data: resumoData } = await supabase
        .from("RESUMO")
        .select("url_imagem_resumo, url_imagem_exemplo_1, url_imagem_exemplo_2, url_imagem_exemplo_3")
        .eq("id", resumoId)
        .single();

      if (resumoData) {
        const urls = [
          resumoData.url_imagem_resumo,
          resumoData.url_imagem_exemplo_1,
          resumoData.url_imagem_exemplo_2,
          resumoData.url_imagem_exemplo_3,
        ];
        const fetches = await Promise.all(
          urls.map(url => url ? fetchImageAsBase64(url) : Promise.resolve(null))
        );
        [imagemResumo, imagemExemplo1, imagemExemplo2, imagemExemplo3] = fetches;
      }
    }

    // Logo não é mais necessário - usamos texto "DIREITO PRIME"

    const jsPDF = (await import("https://esm.sh/jspdf@2.5.1")).default;
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const PAGE_W = 210;
    const PAGE_H = 297;
    const ML = 25; // margem esquerda
    const MR = 20; // margem direita
    const MT = 25; // margem superior
    const MB = 25; // margem inferior
    const LU = PAGE_W - ML - MR; // largura útil
    let y = MT;

    // Helper: desenhar fundo escuro na página inteira
    const fillPageDark = (color = CORES.fundoCapa) => {
      pdf.setFillColor(...color);
      pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
    };

    // =====================
    // CAPA PROFISSIONAL - TEMA ESCURO + DOURADO
    // =====================
    fillPageDark();

    // Borda dourada decorativa
    pdf.setDrawColor(...CORES.douradoPrimario);
    pdf.setLineWidth(1);
    pdf.rect(10, 10, PAGE_W - 20, PAGE_H - 20);
    pdf.setLineWidth(0.3);
    pdf.rect(12, 12, PAGE_W - 24, PAGE_H - 24);

    // Nome do app (substituindo logo)
    y = 35;
    pdf.setTextColor(...CORES.douradoPrimario);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("DIREITO PRIME", PAGE_W / 2, y, { align: "center" });
    y += 8;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...CORES.douradoClaro);
    pdf.text("Estudos Jurídicos", PAGE_W / 2, y, { align: "center" });
    y += 12;

    // Linha dourada decorativa
    pdf.setDrawColor(...CORES.douradoPrimario);
    pdf.setLineWidth(0.5);
    pdf.line(60, y, PAGE_W - 60, y);
    y += 8;

    // Título "RESUMO JURÍDICO"
    pdf.setTextColor(...CORES.douradoPrimario);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("RESUMO JURÍDICO", PAGE_W / 2, y, { align: "center" });
    y += 10;

    // Linha dourada decorativa
    pdf.setDrawColor(...CORES.douradoPrimario);
    pdf.setLineWidth(0.5);
    pdf.line(60, y, PAGE_W - 60, y);
    y += 15;

    // Área do Direito
    pdf.setFillColor(...CORES.fundoBlocos);
    pdf.roundedRect(30, y - 8, PAGE_W - 60, 22, 3, 3, 'F');
    pdf.setDrawColor(...CORES.douradoPrimario);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(30, y - 8, PAGE_W - 60, 22, 3, 3, 'S');
    
    pdf.setTextColor(...CORES.douradoClaro);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(area?.toUpperCase() || "DIREITO", PAGE_W / 2, y + 1, { align: "center" });
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...CORES.textoSecundario);
    pdf.text(tema || "", PAGE_W / 2, y + 9, { align: "center" });
    y += 30;

    // Título do resumo
    pdf.setTextColor(...CORES.textoPrincipal);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    const tituloLines = pdf.splitTextToSize(titulo, 140);
    tituloLines.forEach((line: string, i: number) => {
      pdf.text(line, PAGE_W / 2, y + (i * 9), { align: "center" });
    });
    y += tituloLines.length * 9 + 10;

    // Imagem de capa (se disponível) - sem fundo branco, borda dourada direta
    if (imagemResumo) {
      try {
        const imgW = 120;
        const imgH = 70;
        const imgX = (PAGE_W - imgW) / 2;
        
        // Borda dourada direta (sem fundo branco)
        pdf.setDrawColor(...CORES.douradoPrimario);
        pdf.setLineWidth(0.8);
        pdf.roundedRect(imgX - 1, y - 1, imgW + 2, imgH + 2, 2, 2, 'S');
        
        const format = imagemResumo.includes('image/jpeg') ? 'JPEG' : imagemResumo.includes('image/webp') ? 'WEBP' : 'PNG';
        pdf.addImage(imagemResumo, format, imgX, y, imgW, imgH);
        y += imgH + 10;
      } catch (e) {
        console.log('[capa] Erro ao inserir imagem de capa:', e);
      }
    }

    // Link do áudio (se disponível)
    if (urlAudio) {
      pdf.setFillColor(...CORES.fundoBlocos);
      pdf.roundedRect(40, y - 5, PAGE_W - 80, 16, 3, 3, 'F');
      pdf.setDrawColor(...CORES.douradoPrimario);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(40, y - 5, PAGE_W - 80, 16, 3, 3, 'S');
      pdf.setTextColor(...CORES.douradoClaro);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Escutar Narracao do Resumo", PAGE_W / 2, y + 2, { align: "center" });
      pdf.setFontSize(8);
      pdf.setTextColor(...CORES.textoSecundario);
      pdf.textWithLink("Clique aqui para ouvir", PAGE_W / 2, y + 7, { align: "center", url: urlAudio });
      y += 20;
    }

    // Data
    const dataY = 240;
    pdf.setTextColor(...CORES.textoSecundario);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const dataAtual = new Date().toLocaleDateString("pt-BR", {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    pdf.text(`Gerado em ${dataAtual}`, PAGE_W / 2, dataY, { align: "center" });

    // Rodapé da capa - dentro da borda dourada
    pdf.setFillColor(...CORES.fundoHeader);
    pdf.roundedRect(12, PAGE_H - 38, PAGE_W - 24, 16, 0, 0, 'F');
    pdf.setTextColor(...CORES.douradoPrimario);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("DIREITO PRIME", PAGE_W / 2, PAGE_H - 28, { align: "center" });
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...CORES.douradoClaro);
    pdf.text("Estudos Juridicos", PAGE_W / 2, PAGE_H - 22, { align: "center" });

    // =====================
    // PÁGINAS DE CONTEÚDO
    // =====================
    pdf.addPage();
    y = MT;

    // Header escuro com texto dourado em cada página
    const addPageHeader = () => {
      // Fundo escuro em toda a página
      fillPageDark();
      // Header bar
      pdf.setFillColor(...CORES.fundoHeader);
      pdf.rect(0, 0, PAGE_W, 15, 'F');
      pdf.setDrawColor(...CORES.douradoPrimario);
      pdf.setLineWidth(0.3);
      pdf.line(0, 15, PAGE_W, 15);
      pdf.setTextColor(...CORES.douradoPrimario);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      const tituloHeader = titulo.length > 60 ? titulo.substring(0, 57) + "..." : titulo;
      pdf.text("DIREITO PRIME  |  " + tituloHeader, PAGE_W / 2, 10, { align: "center" });
    };

    addPageHeader();
    y = 25;

    // Nova página quando necessário
    const checkNewPage = (requiredSpace: number) => {
      if (y + requiredSpace > PAGE_H - MB) {
        pdf.addPage();
        addPageHeader();
        y = 25;
        return true;
      }
      return false;
    };

    // Processar texto formatado
    const processFormattedText = (text: string, x: number, maxWidth: number, fontSize: number = 11) => {
      let cleanText = text
        .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/_(.*?)_/g, '$1');
      
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...CORES.textoPrincipal);
      
      const lines = pdf.splitTextToSize(cleanText, maxWidth);
      lines.forEach((line: string) => {
        checkNewPage(7);
        pdf.text(line, x, y);
        y += 6;
      });
    };

    // Inserir imagem de exemplo antes do texto correspondente
    const inserirImagemExemplo = (exemploNum: number) => {
      const imgs = [imagemExemplo1, imagemExemplo2, imagemExemplo3];
      const img = imgs[exemploNum - 1];
      if (!img) return;

      try {
        checkNewPage(55);
        const imgW = 80;
        const imgH = 45;
        // Borda dourada ao redor da imagem
        pdf.setDrawColor(...CORES.douradoPrimario);
        pdf.setLineWidth(0.5);
        pdf.roundedRect((PAGE_W - imgW - 4) / 2, y - 2, imgW + 4, imgH + 4, 2, 2, 'S');
        
        const format = img.includes('image/jpeg') ? 'JPEG' : img.includes('image/webp') ? 'WEBP' : 'PNG';
        pdf.addImage(img, format, (PAGE_W - imgW) / 2, y, imgW, imgH);
        y += imgH + 8;
      } catch (e) {
        console.log(`[exemplo${exemploNum}] Erro ao inserir imagem:`, e);
      }
    };

    // Processar Markdown
    const lines = resumo.split('\n');
    let currentExemploNum = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        y += 4;
        continue;
      }

      // Remover emojis
      const cleanLine = trimmedLine.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();

      // Detectar "Exemplo N" para inserir imagem
      const exemploMatch = cleanLine.match(/^#{1,3}\s*Exemplo\s*(\d+)/i);
      if (exemploMatch) {
        currentExemploNum = parseInt(exemploMatch[1]);
        inserirImagemExemplo(currentExemploNum);
      }

      // Separador horizontal
      if (cleanLine === '---' || cleanLine === '***' || cleanLine === '___') {
        checkNewPage(10);
        pdf.setDrawColor(...CORES.douradoPrimario);
        pdf.setLineWidth(0.3);
        pdf.line(ML, y, PAGE_W - MR, y);
        y += 8;
        continue;
      }

      // Blockquote (citação) com barra lateral dourada
      if (cleanLine.startsWith('>')) {
        checkNewPage(20);
        const quoteText = cleanLine.replace(/^>\s*/, '');
        
        pdf.setFontSize(10);
        const quoteLines = pdf.splitTextToSize(quoteText, LU - 15);
        const blockHeight = quoteLines.length * 5 + 10;
        
        // Fundo escuro do bloco
        pdf.setFillColor(...CORES.fundoBlocos);
        pdf.roundedRect(ML, y - 3, LU, blockHeight, 2, 2, 'F');
        
        // Barra lateral dourada
        pdf.setFillColor(...CORES.douradoPrimario);
        pdf.rect(ML, y - 3, 3, blockHeight, 'F');
        
        // Texto da citação
        pdf.setTextColor(...CORES.textoPrincipal);
        pdf.setFont("helvetica", "italic");
        quoteLines.forEach((qLine: string) => {
          pdf.text(qLine, ML + 8, y + 3);
          y += 5;
        });
        y += 8;
        continue;
      }

      // H1 - Fundo escuro com texto dourado
      if (cleanLine.startsWith('# ') && !cleanLine.startsWith('## ')) {
        checkNewPage(20);
        pdf.setFillColor(...CORES.fundoHeader);
        pdf.roundedRect(ML - 5, y - 6, LU + 10, 14, 2, 2, 'F');
        pdf.setDrawColor(...CORES.douradoPrimario);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(ML - 5, y - 6, LU + 10, 14, 2, 2, 'S');
        pdf.setTextColor(...CORES.douradoPrimario);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        const text = cleanLine.replace(/^#\s*/, '');
        pdf.text(text, ML, y + 2);
        y += 18;
        continue;
      }

      // H2 - Texto dourado com linha
      if (cleanLine.startsWith('## ')) {
        checkNewPage(18);
        y += 5;
        pdf.setDrawColor(...CORES.douradoPrimario);
        pdf.setLineWidth(0.8);
        pdf.line(ML, y + 6, ML + 40, y + 6);
        pdf.setTextColor(...CORES.douradoPrimario);
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        const text = cleanLine.replace(/^##\s*/, '');
        const textLines = pdf.splitTextToSize(text, LU);
        textLines.forEach((textLine: string) => {
          checkNewPage(10);
          pdf.text(textLine, ML, y);
          y += 7;
        });
        y += 6;
        continue;
      }

      // H3 - Texto dourado claro
      if (cleanLine.startsWith('### ')) {
        checkNewPage(15);
        y += 3;
        pdf.setTextColor(...CORES.douradoClaro);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        const text = cleanLine.replace(/^###\s*/, '');
        const textLines = pdf.splitTextToSize(text, LU);
        textLines.forEach((textLine: string) => {
          checkNewPage(8);
          pdf.text(textLine, ML, y);
          y += 6;
        });
        y += 4;
        continue;
      }

      // Listas numeradas - número dourado em círculo
      if (/^\d+\.\s/.test(cleanLine)) {
        checkNewPage(12);
        const match = cleanLine.match(/^(\d+)\.\s(.*)$/);
        if (match) {
          const numero = match[1];
          const texto = match[2].replace(/\*\*/g, '');
          
          // Número em círculo dourado
          pdf.setFillColor(...CORES.douradoPrimario);
          pdf.circle(ML + 3, y - 1.5, 3, 'F');
          pdf.setTextColor(...CORES.fundoCapa);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.text(numero, ML + 3, y, { align: "center" });
          
          // Texto
          pdf.setTextColor(...CORES.textoPrincipal);
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          const textLines = pdf.splitTextToSize(texto, LU - 12);
          textLines.forEach((textLine: string, idx: number) => {
            if (idx > 0) checkNewPage(6);
            pdf.text(textLine, ML + 10, y);
            y += 6;
          });
          y += 3;
        }
        continue;
      }

      // Listas com marcadores - bullet dourado
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        checkNewPage(12);
        const text = cleanLine.replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
        
        // Bullet dourado
        pdf.setFillColor(...CORES.douradoPrimario);
        pdf.circle(ML + 2, y - 1, 1.5, 'F');
        
        pdf.setTextColor(...CORES.textoPrincipal);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "normal");
        const textLines = pdf.splitTextToSize(text, LU - 10);
        textLines.forEach((textLine: string, idx: number) => {
          if (idx > 0) checkNewPage(6);
          pdf.text(textLine, ML + 8, y);
          y += 6;
        });
        y += 2;
        continue;
      }

      // Listas aninhadas
      if (cleanLine.startsWith('  - ') || cleanLine.startsWith('  * ')) {
        checkNewPage(10);
        const text = cleanLine.replace(/^\s+[-*]\s*/, '').replace(/\*\*/g, '');
        
        pdf.setDrawColor(...CORES.douradoPrimario);
        pdf.circle(ML + 10, y - 1, 1, 'S');
        
        pdf.setTextColor(...CORES.textoSecundario);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const textLines = pdf.splitTextToSize(text, LU - 18);
        textLines.forEach((textLine: string, idx: number) => {
          if (idx > 0) checkNewPage(5);
          pdf.text(textLine, ML + 15, y);
          y += 5;
        });
        y += 2;
        continue;
      }

      // Texto normal
      checkNewPage(10);
      processFormattedText(cleanLine, ML, LU);
      y += 2;
    }

    // Numeração de páginas com estilo dourado
    const totalPages = pdf.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      pdf.setPage(i);
      // Rodapé com linha dourada
      pdf.setDrawColor(...CORES.douradoPrimario);
      pdf.setLineWidth(0.2);
      pdf.line(ML, PAGE_H - 15, PAGE_W - MR, PAGE_H - 15);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...CORES.douradoPrimario);
      pdf.text(`Direito Premium`, ML, PAGE_H - 10);
      pdf.setTextColor(...CORES.textoSecundario);
      pdf.text(`Pagina ${i - 1} de ${totalPages - 1}`, PAGE_W - MR, PAGE_H - 10, { align: "right" });
    }

    // Gerar PDF
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const uint8Array = new Uint8Array(pdfArrayBuffer);
    
    console.log("PDF premium gerado, fazendo upload...");

    // Upload para Supabase Storage
    const timestamp = Date.now();
    const safeTitle = titulo.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    const path = `resumos/${safeTitle}_${timestamp}.pdf`;
    const pdfUrl = await uploadParaSupabase(supabase, uint8Array, 'pdfs', path, 'application/pdf');

    console.log("PDF uploaded:", pdfUrl);

    // Salvar URL no banco de dados
    if (resumoId) {
      const { error: updateError } = await supabase
        .from("RESUMO")
        .update({ url_pdf: pdfUrl })
        .eq("id", resumoId);

      if (updateError) {
        console.error("Erro ao salvar URL do PDF:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        pdfUrl,
        fromCache: false,
        message: "PDF premium gerado com sucesso!"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
