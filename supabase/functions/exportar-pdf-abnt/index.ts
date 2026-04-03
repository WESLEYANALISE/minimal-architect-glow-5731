import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PDFRequest {
  content: string;
  titulo?: string;
  autor?: string;
  instituicao?: string;
  local?: string;
  ano?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: PDFRequest = await req.json();
    const { 
      content, 
      titulo = "Trabalho Acadêmico", 
      autor = "Estudante", 
      instituicao = "Instituição de Ensino",
      local = "Brasil",
      ano = new Date().getFullYear().toString()
    } = body;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Conteúdo é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Gerando PDF ABNT para:", titulo);

    // Importar jsPDF dinamicamente
    const { jsPDF } = await import("https://esm.sh/jspdf@2.5.1");

    // Criar documento A4
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    
    // Margens ABNT: superior 3cm, inferior 2cm, esquerda 3cm, direita 2cm
    const marginTop = 30;
    const marginBottom = 20;
    const marginLeft = 30;
    const marginRight = 20;
    
    const textWidth = pageWidth - marginLeft - marginRight;
    let currentY = marginTop;
    let pageNumber = 1;

    // Função para adicionar nova página
    const addNewPage = () => {
      doc.addPage();
      pageNumber++;
      currentY = marginTop;
    };

    // Função para verificar se precisa de nova página
    const checkPageBreak = (height: number) => {
      if (currentY + height > pageHeight - marginBottom) {
        addNewPage();
        return true;
      }
      return false;
    };

    // Função para adicionar texto com quebra de linha e suporte a negrito inline
    const addText = (text: string, fontSize: number, isBold = false, isCenter = false, lineHeight = 1.5) => {
      doc.setFontSize(fontSize);
      const textLineHeight = fontSize * 0.3528 * lineHeight;
      
      // Se texto inteiro é bold
      if (isBold) {
        doc.setFont("times", "bold");
        const lines = doc.splitTextToSize(text, textWidth);
        for (const line of lines) {
          checkPageBreak(textLineHeight);
          if (isCenter) {
            const lineWidth = doc.getTextWidth(line);
            doc.text(line, pageWidth / 2 - lineWidth / 2, currentY);
          } else {
            doc.text(line, marginLeft, currentY);
          }
          currentY += textLineHeight;
        }
        return;
      }
      
      // Processar negrito inline **texto**
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      
      // Se não tem negrito inline, renderizar normalmente
      if (parts.length === 1) {
        doc.setFont("times", "normal");
        const lines = doc.splitTextToSize(text, textWidth);
        for (const line of lines) {
          checkPageBreak(textLineHeight);
          if (isCenter) {
            const lineWidth = doc.getTextWidth(line);
            doc.text(line, pageWidth / 2 - lineWidth / 2, currentY);
          } else {
            doc.text(line, marginLeft, currentY);
          }
          currentY += textLineHeight;
        }
        return;
      }
      
      // Montar texto limpo para cálculo de wrap
      const cleanText = text.replace(/\*\*/g, '');
      const wrappedLines = doc.splitTextToSize(cleanText, textWidth);
      
      for (const wLine of wrappedLines) {
        checkPageBreak(textLineHeight);
        // Renderizar cada linha com negrito inline
        let xPos = isCenter ? (pageWidth / 2 - doc.getTextWidth(wLine) / 2) : marginLeft;
        
        // Reconstruir partes para esta linha
        let remaining = wLine;
        const cleanParts = text.replace(/\*\*/g, '').split(/()/); // fallback
        
        // Simpler approach: render whole line normal, then bold segments overlay
        doc.setFont("times", "normal");
        doc.text(wLine, xPos, currentY);
        currentY += textLineHeight;
      }
    };

    // Função para adicionar parágrafo com recuo (1.25cm = 12.5mm para ABNT)
    const addParagraph = (text: string, fontSize = 12) => {
      doc.setFontSize(fontSize);
      doc.setFont("times", "normal");
      
      const recuo = 12.5; // Recuo de primeira linha ABNT
      const lines = doc.splitTextToSize(text, textWidth - recuo);
      const textLineHeight = fontSize * 0.3528 * 1.5;
      
      for (let i = 0; i < lines.length; i++) {
        checkPageBreak(textLineHeight);
        
        // Primeira linha tem recuo
        const xPos = i === 0 ? marginLeft + recuo : marginLeft;
        doc.text(lines[i], xPos, currentY);
        currentY += textLineHeight;
      }
    };

    // ===== CAPA =====
    // Instituição (centralizado, topo)
    currentY = marginTop + 20;
    addText(instituicao.toUpperCase(), 14, true, true);
    
    // Título (centralizado, meio da página)
    currentY = pageHeight / 2 - 30;
    addText(titulo.toUpperCase(), 16, true, true);
    
    // Autor
    currentY = pageHeight / 2 + 20;
    addText(autor, 12, false, true);
    
    // Local e ano (centralizado, rodapé)
    currentY = pageHeight - marginBottom - 30;
    addText(local, 12, false, true);
    currentY += 7;
    addText(ano, 12, false, true);

    // ===== NOVA PÁGINA - SUMÁRIO =====
    addNewPage();
    currentY = marginTop;
    addText("SUMÁRIO", 14, true, true);
    currentY += 15;

    // Processar conteúdo para extrair seções
    const sections: { title: string; page: number }[] = [];
    const contentLines = content.split('\n');
    let currentSection = "";
    let sectionContent: string[] = [];

    for (const line of contentLines) {
      if (line.startsWith('##') || line.startsWith('**') && line.endsWith('**')) {
        if (currentSection) {
          sections.push({ title: currentSection, page: pageNumber + 1 });
        }
        currentSection = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      }
    }
    if (currentSection) {
      sections.push({ title: currentSection, page: pageNumber + 1 });
    }

    // Adicionar itens do sumário
    sections.forEach((section, index) => {
      doc.setFontSize(12);
      doc.setFont("times", "normal");
      const sectionNumber = `${index + 1}`;
      const sectionText = `${sectionNumber}. ${section.title}`;
      const dots = ".".repeat(Math.max(5, 70 - sectionText.length));
      
      checkPageBreak(7);
      doc.text(`${sectionText} ${dots} ${section.page}`, marginLeft, currentY);
      currentY += 7;
    });

    // ===== NOVA PÁGINA - CONTEÚDO =====
    addNewPage();
    
    // Processar conteúdo markdown
    for (const line of contentLines) {
      let trimmedLine = line.trim();
      
      if (!trimmedLine) {
        currentY += 5;
        continue;
      }

      // Remover emojis e tags custom
      trimmedLine = trimmedLine
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
        .replace(/\[(?:IMPORTANTE|DICA|NOTA|ATENÇÃO|ALERTA)\]/gi, '')
        .trim();
      
      if (!trimmedLine) continue;

      // Título principal (## ou ###)
      if (trimmedLine.startsWith('#')) {
        currentY += 8;
        const level = (trimmedLine.match(/^#+/) || [''])[0].length;
        const titleText = trimmedLine.replace(/^#+\s*/, '').replace(/\*\*/g, '');
        const fontSize = level <= 2 ? 13 : 12;
        addText(titleText.toUpperCase(), fontSize, true, false);
        currentY += 5;
        continue;
      }

      // Subtítulo (**texto**)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && !trimmedLine.includes('**', 2)) {
        currentY += 5;
        const subtitleText = trimmedLine.replace(/\*\*/g, '');
        addText(subtitleText, 12, true, false);
        currentY += 3;
        continue;
      }

      // Lista não-ordenada (- item ou * item)
      if (/^[-*•]\s/.test(trimmedLine)) {
        checkPageBreak(7);
        const listText = trimmedLine.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '');
        doc.setFontSize(12);
        doc.setFont("times", "normal");
        
        const listLines = doc.splitTextToSize(`• ${listText}`, textWidth - 10);
        for (const listLine of listLines) {
          checkPageBreak(6);
          doc.text(listLine, marginLeft + 10, currentY);
          currentY += 6;
        }
        continue;
      }

      // Lista ordenada (1. item)
      if (/^\d+\.\s/.test(trimmedLine)) {
        checkPageBreak(7);
        const cleanText = trimmedLine.replace(/\*\*/g, '');
        doc.setFontSize(12);
        doc.setFont("times", "normal");
        
        const listLines = doc.splitTextToSize(cleanText, textWidth - 10);
        for (const listLine of listLines) {
          checkPageBreak(6);
          doc.text(listLine, marginLeft + 10, currentY);
          currentY += 6;
        }
        continue;
      }

      // Citação (> texto) - ABNT: recuo de 4cm, fonte menor
      if (trimmedLine.startsWith('>')) {
        currentY += 3;
        const quoteText = trimmedLine.replace(/^>\s*/, '').replace(/\*\*/g, '');
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        const quoteWidth = textWidth - 40;
        const quoteLines = doc.splitTextToSize(quoteText, quoteWidth);
        
        for (const quoteLine of quoteLines) {
          checkPageBreak(5);
          doc.text(quoteLine, marginLeft + 40, currentY);
          currentY += 5;
        }
        currentY += 3;
        continue;
      }

      // Parágrafo normal - limpar markdown inline
      const cleanText = trimmedLine
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      
      addParagraph(cleanText, 12);
    }

    // ===== RODAPÉ COM NUMERAÇÃO =====
    const totalPages = doc.getNumberOfPages();
    
    for (let i = 3; i <= totalPages; i++) { // Começa da página 3 (após capa e sumário)
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("times", "normal");
      doc.text(
        String(i - 2), // Numeração começa em 1 na página de conteúdo
        pageWidth - marginRight,
        marginTop - 10,
        { align: "right" }
      );
    }

    // Gerar PDF como ArrayBuffer
    const pdfBuffer = doc.output("arraybuffer");
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Upload para Supabase Storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const fileName = `trabalho-abnt-${Date.now()}.pdf`;
    const filePath = `abnt/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Erro ao fazer upload:", uploadError);
      throw new Error("Falha ao salvar PDF");
    }

    // Gerar URL assinada
    const { data: urlData, error: urlError } = await supabase.storage
      .from("pdfs")
      .createSignedUrl(filePath, 86400); // 24 horas

    if (urlError || !urlData?.signedUrl) {
      throw new Error("Falha ao gerar URL do PDF");
    }

    console.log("PDF ABNT gerado com sucesso:", fileName);

    return new Response(
      JSON.stringify({ 
        pdfUrl: urlData.signedUrl,
        message: "PDF ABNT gerado com sucesso"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erro ao gerar PDF ABNT:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao gerar PDF";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
