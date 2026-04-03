import { useRef, useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Share2, Loader2, Download, FileImage, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useExternalBrowser } from '@/hooks/use-external-browser';
import ShareMapaWhatsAppModal from '@/components/mapas-mentais/ShareMapaWhatsAppModal';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  contentRef: React.RefObject<HTMLDivElement>;
  tema: string;
  area: string;
  subtema?: string;
  metodo: string;
  whatsAppText: string;
  onClose: () => void;
}

const MetodologiaViewerWrapper = ({ children, contentRef, tema, area, subtema, metodo, whatsAppText, onClose }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'img' | null>(null);
  const { openUrl } = useExternalBrowser();

  // Pinch-to-zoom support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let initialZoom = 1;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = getDistance(e.touches);
        initialZoom = zoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(0.3, Math.min(3, initialZoom * scale));
        setZoom(newZoom);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [zoom]);

  const saveToSupabaseAndOpen = useCallback(async (blob: Blob, filename: string, mimeType: string) => {
    try {
      const filePath = `metodologias/${Date.now()}-${filename}`;
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, blob, { contentType: mimeType, upsert: true });

      if (uploadError) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(filePath);
      if (urlData?.publicUrl) await openUrl(urlData.publicUrl);
    } catch {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [openUrl]);

  const exportarPNG = async () => {
    if (!contentRef.current) return;
    setExporting('img');
    setShowShareMenu(false);
    try {
      toast.loading('Gerando imagem...');
      const prevZoom = zoom;
      setZoom(1);
      await new Promise(r => setTimeout(r, 150));
      const canvas = await html2canvas(contentRef.current, { backgroundColor: '#0f0f1a', scale: 3, useCORS: true });
      canvas.toBlob(async (blob) => {
        if (blob) {
          const name = `${metodo}-${(tema || 'tema').replace(/\s+/g, '-')}.png`;
          await saveToSupabaseAndOpen(blob, name, 'image/png');
          toast.dismiss();
          toast.success('Imagem exportada!');
        }
        setExporting(null);
      }, 'image/png');
      setZoom(prevZoom);
    } catch {
      toast.dismiss();
      toast.error('Erro ao exportar imagem');
      setExporting(null);
    }
  };

  const exportarPDF = async () => {
    if (!contentRef.current) return;
    setExporting('pdf');
    setShowShareMenu(false);
    try {
      toast.loading('Gerando PDF...');
      const prevZoom = zoom;
      setZoom(1);
      await new Promise(r => setTimeout(r, 150));

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const cx = pageW / 2;
      const gold = '#d4a853';
      const bgColor = '#060611';

      // ===== PAGE 1: COVER =====
      pdf.setFillColor(6, 6, 17);
      pdf.rect(0, 0, pageW, pageH, 'F');

      // Gold decorative lines
      pdf.setDrawColor(212, 168, 83);
      pdf.setLineWidth(0.5);
      pdf.line(30, 25, pageW - 30, 25);
      pdf.line(30, pageH - 25, pageW - 30, pageH - 25);

      // Load logo
      let logoLoaded = false;
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
          logoImg.src = '/logo.webp';
        });
        const logoSize = 50;
        pdf.addImage(logoImg, 'WEBP', cx - logoSize / 2, 35, logoSize, logoSize);
        logoLoaded = true;
      } catch { /* logo not available, skip */ }

      let y = logoLoaded ? 95 : 55;

      // App name
      pdf.setTextColor(212, 168, 83);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DIREITO PRIME', cx, y, { align: 'center' });
      y += 10;

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(212, 168, 83);
      pdf.text('Estudos Jurídicos', cx, y, { align: 'center' });
      y += 8;

      // Small gold line
      pdf.setDrawColor(212, 168, 83);
      pdf.setLineWidth(0.3);
      pdf.line(cx - 30, y, cx + 30, y);
      y += 15;

      // Area / Tema / Subtema
      if (area) {
        pdf.setFontSize(11);
        pdf.setTextColor(180, 180, 200);
        pdf.text(area, cx, y, { align: 'center' });
        y += 7;
      }
      if (tema) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(240, 230, 208);
        const temaLines = pdf.splitTextToSize(tema, pageW - 60);
        pdf.text(temaLines, cx, y, { align: 'center' });
        y += temaLines.length * 8 + 2;
      }
      if (subtema) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(212, 168, 83);
        pdf.text(subtema, cx, y, { align: 'center' });
        y += 7;
      }

      y += 10;

      // Method badge
      const metodoNome = metodo === 'cornell' ? 'Método Cornell' : 'Método Feynman';
      const metodoEmoji = metodo === 'cornell' ? '🔖' : '🧠';
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(212, 168, 83);
      pdf.text(`${metodoEmoji} ${metodoNome}`, cx, y, { align: 'center' });
      y += 12;

      // Method explanation
      const explicacao = metodo === 'cornell'
        ? 'O Método Cornell divide o estudo em três seções: anotações principais, palavras-chave para revisão rápida e um resumo síntese. É ideal para organizar e memorizar conteúdos jurídicos de forma estruturada.'
        : 'O Método Feynman consiste em explicar um conceito como se fosse para um leigo. Ao simplificar, você identifica lacunas no seu conhecimento e fixa o conteúdo de forma profunda e duradoura.';

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(180, 180, 200);
      const explLines = pdf.splitTextToSize(explicacao, pageW - 60);
      pdf.text(explLines, cx, y, { align: 'center' });
      y += explLines.length * 5 + 15;

      // Date/time
      const agora = new Date().toLocaleString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      pdf.setFontSize(9);
      pdf.setTextColor(140, 140, 160);
      pdf.text(`Gerado em ${agora}`, cx, pageH - 35, { align: 'center' });

      // Footer branding
      pdf.setFontSize(8);
      pdf.setTextColor(212, 168, 83);
      pdf.text('Direito Prime — direitoprime.com', cx, pageH - 30, { align: 'center' });

      // ===== PAGE 2: CONTENT =====
      pdf.addPage('a4', 'portrait');

      const canvas = await html2canvas(contentRef.current, { backgroundColor: '#0f0f1a', scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      // Fill background
      pdf.setFillColor(6, 6, 17);
      pdf.rect(0, 0, pageW, pageH, 'F');

      const margin = 8;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;
      const imgAspect = canvas.width / canvas.height;
      let imgW = availW;
      let imgH = imgW / imgAspect;

      if (imgH > availH) {
        imgH = availH;
        imgW = imgH * imgAspect;
      }

      const imgX = (pageW - imgW) / 2;
      const imgY = (pageH - imgH) / 2;
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgW, imgH);

      const pdfBlob = pdf.output('blob');
      const name = `${metodo}-${(tema || 'tema').replace(/\s+/g, '-')}.pdf`;
      await saveToSupabaseAndOpen(pdfBlob, name, 'application/pdf');
      setZoom(prevZoom);
      toast.dismiss();
      toast.success('PDF exportado!');
    } catch {
      toast.dismiss();
      toast.error('Erro ao exportar PDF');
    }
    setExporting(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top toolbar - single row */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-2 bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportarPDF}
            disabled={!!exporting}
            className="h-9 px-2.5"
          >
            {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareMenu(true)}
            disabled={!!exporting}
            className="h-9 gap-1.5 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          </Button>
        </div>
        <Button variant="destructive" size="sm" onClick={onClose} className="h-9 w-9 p-0 rounded-full shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Scrollable + zoomable container - full width, no margins */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto metodologia-scroll-area"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: zoom > 1 ? 'none' : 'pan-x pan-y',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
          }}
        >
          {children}
        </div>
      </div>

      {/* Floating zoom controls - right side */}
      <div className="absolute right-3 bottom-24 z-10 flex flex-col items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full p-1.5 shadow-lg border border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z + 0.15))} className="h-8 w-8 rounded-full">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <span className="text-[10px] font-medium text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="h-8 w-8 rounded-full">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <div className="w-5 h-px bg-border" />
        <Button variant="ghost" size="icon" onClick={() => setZoom(1)} className="h-8 w-8 rounded-full">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Share options modal */}
      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShareMenu(false)} />
            <motion.div
              className="relative w-full max-w-sm bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <button
                onClick={() => setShowShareMenu(false)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-5">
                <h3 className="text-base font-bold text-foreground mb-1">Compartilhar</h3>
                <p className="text-xs text-muted-foreground mb-5 line-clamp-1">
                  {metodo === 'cornell' ? '🔖' : '🧠'} {tema}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => { setShowShareMenu(false); setShowWhatsApp(true); }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-[#25D366]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Enviar texto formatado via Evelyn</p>
                    </div>
                  </button>

                  <button
                    onClick={exportarPDF}
                    disabled={!!exporting}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-muted/30 hover:bg-muted/60 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      {exporting === 'pdf' ? <Loader2 className="w-5 h-5 text-destructive animate-spin" /> : <Download className="w-5 h-5 text-destructive" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">PDF</p>
                      <p className="text-xs text-muted-foreground">Baixar documento em PDF</p>
                    </div>
                  </button>

                  <button
                    onClick={exportarPNG}
                    disabled={!!exporting}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-muted/30 hover:bg-muted/60 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {exporting === 'img' ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <FileImage className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Imagem</p>
                      <p className="text-xs text-muted-foreground">Baixar como imagem PNG</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareMapaWhatsAppModal
        open={showWhatsApp}
        onClose={() => setShowWhatsApp(false)}
        titulo={tema}
        area={area}
        conteudoTexto={whatsAppText}
      />

      <style>{`
        .metodologia-scroll-area::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .metodologia-scroll-area::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        .metodologia-scroll-area::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.4);
          border-radius: 4px;
        }
        .metodologia-scroll-area::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.6);
        }
      `}</style>
    </div>
  );
};

export default MetodologiaViewerWrapper;
