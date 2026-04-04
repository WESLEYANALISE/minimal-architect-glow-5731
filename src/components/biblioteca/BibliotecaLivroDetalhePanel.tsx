import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Download, Crown, Video, X, Loader2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface BibliotecaLivroDetalhePanelProps {
  bookId: number;
  collectionKey: string;
  onClose: () => void;
}

export const BibliotecaLivroDetalhePanel = ({ bookId, collectionKey, onClose }: BibliotecaLivroDetalhePanelProps) => {
  const config = BOOK_CONFIGS[collectionKey];
  const { isPremium } = useSubscription();
  const isBookFree = useIsBookFree(bookId, config?.bibliotecaKey);
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
    if (!canAccess) {
      setShowPremiumModal(true);
      return;
    }
    setShowModeSelector(true);
  };

  const handleDownload = () => {
    if (!canAccess) {
      setShowPremiumModal(true);
      return;
    }
    if (downloadUrl) window.open(downloadUrl, "_blank");
  };

  return (
    <div className="h-full flex flex-col border-l border-white/10 bg-black/20 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground truncate">Detalhes do livro</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : !livro ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Livro não encontrado</div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Capa */}
            <div className="flex justify-center">
              <div className="relative w-36 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10">
                {capa ? (
                  <img src={capa} alt={titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-amber-400/60" />
                  </div>
                )}
                {!canAccess && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-[9px] font-semibold">
                    <Crown className="w-2.5 h-2.5" /> Premium
                  </div>
                )}
              </div>
            </div>

            {/* Título e Autor */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-foreground leading-tight">{titulo}</h2>
              {autor && <p className="text-sm text-muted-foreground">{autor}</p>}
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              {linkPdf && (
                <Button onClick={handleRead} size="sm" className="flex-1 shadow-lg">
                  {!canAccess && <Crown className="w-3.5 h-3.5 mr-1 text-amber-300" />}
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  Ler
                </Button>
              )}
              {downloadUrl && (
                <Button onClick={handleDownload} size="sm" variant="outline" className="border-amber-900/30">
                  <Download className="w-4 h-4" />
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

            {/* Videoaula */}
            {aulaUrl && (
              <div className="space-y-2">
                {showVideo ? (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <div className="aspect-video">
                      <VideoPlayer src={aulaUrl} autoPlay={false} />
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowVideo(true)}
                    variant="outline"
                    size="sm"
                    className="w-full border-amber-900/30 text-amber-200 hover:bg-amber-500/10"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Assistir Videoaula
                  </Button>
                )}
              </div>
            )}

            {/* Sobre */}
            {sobre && (
              <div className="bg-card/30 rounded-xl p-4 border border-white/5">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Sobre</h4>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{sobre}</p>
              </div>
            )}
          </div>
        </ScrollArea>
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
