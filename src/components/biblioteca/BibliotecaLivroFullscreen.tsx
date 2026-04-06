import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Download, Crown, Video, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BibliotecaFavoritoButton from "@/components/biblioteca/BibliotecaFavoritoButton";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useState } from "react";
import PDFViewerModal from "@/components/PDFViewerModal";
import PDFReaderModeSelector from "@/components/PDFReaderModeSelector";
import VideoPlayer from "@/components/VideoPlayer";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { useBibliotecaAcesso } from "@/hooks/useBibliotecaAcesso";
import { useIsBookFree } from "@/hooks/useIsBookFree";

interface BookConfig {
  table: string;
  titleCol: string;
  capaCol: string;
  autorCol?: string;
  sobreCol?: string;
  linkCol?: string;
  downloadCol?: string;
  aulaCol?: string;
  bibliotecaKey: string;
}

const BOOK_CONFIGS: Record<string, BookConfig> = {
  classicos: { table: "BIBLIOTECA-CLASSICOS", titleCol: "livro", capaCol: "imagem", autorCol: "autor", sobreCol: "sobre", linkCol: "link", downloadCol: "download", aulaCol: "url_videoaula", bibliotecaKey: "classicos" },
  estudos: { table: "BIBLIOTECA-ESTUDOS", titleCol: "Tema", capaCol: "Capa-livro", sobreCol: "Sobre", linkCol: "Link", downloadCol: "Download", aulaCol: "aula", bibliotecaKey: "estudos" },
  oab: { table: "BIBILIOTECA-OAB", titleCol: "Tema", capaCol: "Capa-livro", sobreCol: "Sobre", linkCol: "Link", downloadCol: "Download", aulaCol: "aula", bibliotecaKey: "oab" },
  politica: { table: "BIBLIOTECA-POLITICA", titleCol: "livro", capaCol: "imagem", autorCol: "autor", sobreCol: "sobre", linkCol: "link", downloadCol: "download", aulaCol: "aula", bibliotecaKey: "politica" },
  oratoria: { table: "BIBLIOTECA-ORATORIA", titleCol: "livro", capaCol: "imagem", autorCol: "autor", sobreCol: "sobre", linkCol: "link", downloadCol: "download", aulaCol: "aula", bibliotecaKey: "oratoria" },
  portugues: { table: "BIBLIOTECA-PORTUGUES", titleCol: "livro", capaCol: "imagem", autorCol: "autor", sobreCol: "sobre", linkCol: "link", downloadCol: "download", aulaCol: "aula", bibliotecaKey: "portugues" },
  lideranca: { table: "BIBLIOTECA-LIDERANÇA", titleCol: "livro", capaCol: "imagem", autorCol: "autor", sobreCol: "sobre", linkCol: "link", downloadCol: "download", aulaCol: "aula", bibliotecaKey: "lideranca" },
  fora: { table: "BIBLIOTECA-FORA-DA-TOGA", titleCol: "livro", capaCol: "capa-livro", autorCol: "autor", sobreCol: "sobre", linkCol: "link", downloadCol: "download", aulaCol: "aula", bibliotecaKey: "fora-da-toga" },
  pesquisa: { table: "BIBLIOTECA-PESQUISA-CIENTIFICA", titleCol: "livro", capaCol: "imagem", autorCol: "autor", sobreCol: "sobre", linkCol: "link", downloadCol: "download", aulaCol: "aula", bibliotecaKey: "pesquisa" },
};

interface BibliotecaLivroFullscreenProps {
  bookId: number;
  collectionKey: string;
  onClose: () => void;
}

export const BibliotecaLivroFullscreen = ({ bookId, collectionKey, onClose }: BibliotecaLivroFullscreenProps) => {
  const config = BOOK_CONFIGS[collectionKey];
  const { isPremium } = useSubscription();
  const isBookFree = useIsBookFree(bookId, config?.bibliotecaKey as any);
  const canAccess = isPremium || isBookFree;
  const { registrarAcesso } = useBibliotecaAcesso();
  const [showPDF, setShowPDF] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'vertical'>('normal');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const { data: livro, isLoading } = useQuery({
    queryKey: ["biblioteca-detalhe-panel", config?.table, bookId],
    queryFn: async () => {
      if (!config) return null;
      const { data, error } = await (supabase as any)
        .from(config.table)
        .select("*")
        .eq("id", bookId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!config,
  });

  if (!config) return null;

  const titulo = livro?.[config.titleCol] || "";
  const capa = livro?.[config.capaCol] || livro?.url_capa_gerada || null;
  const autor = config.autorCol ? livro?.[config.autorCol] : null;
  const sobre = config.sobreCol ? livro?.[config.sobreCol] : null;
  const linkPdf = config.linkCol ? livro?.[config.linkCol] : null;
  const downloadUrl = config.downloadCol ? livro?.[config.downloadCol] : null;
  const aulaUrl = config.aulaCol ? livro?.[config.aulaCol] : (livro?.aula || null);

  const handleRead = () => {
    if (!canAccess) { setShowPremiumModal(true); return; }
    setShowModeSelector(true);
  };

  const handleDownload = () => {
    if (!canAccess) { setShowPremiumModal(true); return; }
    if (downloadUrl) window.open(downloadUrl, "_blank");
  };

  return (
    <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md overflow-y-auto">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/20 px-6 py-3">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao acervo
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : !livro ? (
        <div className="flex items-center justify-center py-32 text-muted-foreground">Livro não encontrado</div>
      ) : (
        <div className="max-w-5xl mx-auto px-8 py-10">
          <div className="flex gap-10">
            {/* Left: cover */}
            <div className="flex-shrink-0">
              <div className="relative w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                {capa ? (
                  <img src={capa} alt={titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-amber-400/60" />
                  </div>
                )}
                {!canAccess && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xs font-semibold">
                    <Crown className="w-3 h-3" /> Premium
                  </div>
                )}
              </div>
            </div>

            {/* Right: info */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground leading-tight">{titulo}</h1>
                {autor && <p className="text-lg text-muted-foreground mt-1">{autor}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {linkPdf && (
                  <Button onClick={handleRead} size="lg" className="shadow-lg">
                    {!canAccess && <Crown className="w-4 h-4 mr-1.5 text-amber-300" />}
                    <BookOpen className="w-5 h-5 mr-2" />
                    Ler Livro
                  </Button>
                )}
                {downloadUrl && (
                  <Button onClick={handleDownload} size="lg" variant="outline" className="border-amber-900/30">
                    <Download className="w-5 h-5 mr-2" />
                    Download
                  </Button>
                )}
                <BibliotecaFavoritoButton
                  itemId={bookId}
                  titulo={titulo}
                  bibliotecaTabela={config.table}
                  capaUrl={capa}
                  size="sm"
                />
              </div>

              {/* Video */}
              {aulaUrl && (
                <div>
                  {showVideo ? (
                    <div className="rounded-xl overflow-hidden border border-white/10 max-w-xl">
                      <div className="aspect-video">
                        <VideoPlayer src={aulaUrl} autoPlay={false} />
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowVideo(true)}
                      variant="outline"
                      className="border-amber-900/30 text-amber-200 hover:bg-amber-500/10"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Assistir Videoaula
                    </Button>
                  )}
                </div>
              )}

              {/* Sobre */}
              {sobre && (
                <div className="bg-card/30 rounded-xl p-6 border border-white/5 max-w-2xl">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Sobre o livro</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{sobre}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PDFReaderModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelectMode={(mode) => {
          if (mode === 'dinamica') return;
          setViewMode(mode);
          setShowModeSelector(false);
          setShowPDF(true);
          if (livro) registrarAcesso(config.table, bookId, livro.area || livro["Área"], titulo, capa);
        }}
        bookTitle={titulo}
      />
      {linkPdf && (
        <PDFViewerModal
          isOpen={showPDF}
          onClose={() => setShowPDF(false)}
          normalModeUrl={linkPdf}
          verticalModeUrl={downloadUrl || linkPdf}
          title={titulo}
          viewMode={viewMode}
        />
      )}
      <PremiumFloatingCard
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Conteúdo Premium"
        sourceFeature={`Biblioteca ${collectionKey}`}
      />
    </div>
  );
};
