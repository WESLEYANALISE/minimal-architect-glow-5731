import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, BookOpen, Video, FileText, Crown, X, Play } from "lucide-react";
import BibliotecaFavoritoButton from "@/components/biblioteca/BibliotecaFavoritoButton";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { useState, useEffect } from "react";
import PDFViewerModal from "@/components/PDFViewerModal";
import PDFReaderModeSelector from "@/components/PDFReaderModeSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoPlayer from "@/components/VideoPlayer";
import { motion, AnimatePresence } from "framer-motion";
import LeituraDinamicaReader from "@/components/biblioteca/LeituraDinamicaReader";
import LeituraDinamicaSetup from "@/components/biblioteca/LeituraDinamicaSetup";
import { useAuth } from "@/contexts/AuthContext";
import { useBibliotecaAcesso } from "@/hooks/useBibliotecaAcesso";
import { useIsBookFree } from "@/hooks/useIsBookFree";
import { useDominantColor } from "@/hooks/useDominantColor";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const BibliotecaClassicosLivro = () => {
  const { livroId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAuthDialogOpen, closeAuthDialog, isAuthenticated } = useRequireAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { registrarAcesso } = useBibliotecaAcesso();
  const [showPDF, setShowPDF] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium } = useSubscription();
  const isBookFree = useIsBookFree(livroId ? parseInt(livroId) : undefined, 'classicos');
  const canAccess = isPremium || isBookFree;
  const canDownload = isPremium || isBookFree;
  const [viewMode, setViewMode] = useState<'normal' | 'vertical'>('normal');
  const [searchParams] = useSearchParams();
  const fromSearch = searchParams.get('fromSearch') === 'true';
  const [activeTab, setActiveTab] = useState("sobre");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [transcricao, setTranscricao] = useState<Array<{text: string; start: number; dur: number}>>([]);
  const [loadingTranscricao, setLoadingTranscricao] = useState(false);
  const [showLeituraDinamica, setShowLeituraDinamica] = useState(false);
  const [showLeituraDinamicaSetup, setShowLeituraDinamicaSetup] = useState(false);
  const [hasLeituraDinamica, setHasLeituraDinamica] = useState(false);
  const [tituloLeituraDinamica, setTituloLeituraDinamica] = useState<string>("");

  const { data: livro, isLoading } = useQuery({
    queryKey: ["biblioteca-classicos-livro", livroId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("BIBLIOTECA-CLASSICOS")
        .select("*")
        .eq("id", livroId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const dominantColor = useDominantColor(livro?.imagem);

  // Buscar transcrição quando abrir o modal de vídeo
  useEffect(() => {
    if (!showVideoModal || transcricao.length > 0) return;
    const videoSrc = livro?.aula || livro?.url_videoaula || "";
    let youtubeId = "";
    try {
      const urlObj = new URL(videoSrc);
      if (urlObj.hostname.includes("youtube.com")) youtubeId = urlObj.searchParams.get("v") || "";
      if (urlObj.hostname.includes("youtu.be")) youtubeId = urlObj.pathname.slice(1);
    } catch {}
    if (!youtubeId) return;

    setLoadingTranscricao(true);
    supabase.functions.invoke("buscar-transcricao-youtube", {
      body: { videoId: youtubeId },
    }).then(({ data }) => {
      if (data?.segments?.length) setTranscricao(data.segments);
    }).finally(() => setLoadingTranscricao(false));
  }, [showVideoModal, livro]);

  useEffect(() => {
    const checkLeituraDinamica = async () => {
      if (!livro?.livro) return;

      const tituloLivro = livro.livro;
      const palavrasChave = tituloLivro
        .toLowerCase()
        .replace(/[^a-záàâãéèêíïóôõöúç\s]/gi, ' ')
        .split(/\s+/)
        .filter((p: string) => p.length > 3 && !['das', 'dos', 'para', 'com', 'por'].includes(p))
        .slice(0, 2);

      for (const palavra of palavrasChave) {
        const { data, error } = await (supabase as any)
          .from("BIBLIOTECA-LEITURA-DINAMICA")
          .select("\"Titulo da Obra\"")
          .ilike("Titulo da Obra", `%${palavra}%`)
          .limit(1);

        if (!error && data && data.length > 0) {
          setHasLeituraDinamica(true);
          setTituloLeituraDinamica(data[0]["Titulo da Obra"] || "");
          return;
        }
      }
    };

    checkLeituraDinamica();
  }, [livro?.livro]);

  if (!authLoading && !user) {
    navigate('/', { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!livro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Livro não encontrado</p>
        <Button onClick={() => navigate('/biblioteca-classicos')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 pb-20 animate-fade-in">
      {fromSearch && (
        <div className="bg-accent/10 border-b border-accent/20 py-2 px-4 text-sm text-muted-foreground animate-fade-in">
          🔍 Busca → Bibliotecas → Clássicos → {livro?.livro}
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
        <div className="flex flex-col gap-8">
          {/* Hero: capa + info com fundo da cor da capa */}
          <div
            className="flex flex-row items-end gap-6 rounded-2xl p-5 overflow-hidden transition-all duration-700"
            style={{
              background: `linear-gradient(135deg, ${dominantColor} 0%, color-mix(in srgb, ${dominantColor} 60%, transparent) 100%)`,
            }}
          >
            {/* Capa */}
            <div className={`relative flex-shrink-0 w-36 md:w-44 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl transition-all duration-500 animate-scale-in ${fromSearch ? 'animate-pulse ring-4 ring-accent/50' : 'hover:shadow-accent/50'}`}>
              {livro.imagem ? (
                <img
                  src={livro.imagem}
                  alt={livro.livro || ""}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-accent/50" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 z-10">
                <BibliotecaFavoritoButton
                  itemId={livro.id}
                  titulo={livro.livro || ""}
                  bibliotecaTabela="BIBLIOTECA-CLASSICOS"
                  capaUrl={livro.imagem}
                  size="sm"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between gap-4 flex-1">
              <div className="text-center">
                <h1 className="text-xl md:text-2xl font-bold leading-tight mb-1">{livro.livro}</h1>
                {livro.autor && (
                  <p className="text-sm text-muted-foreground">{livro.autor}</p>
                )}
              </div>

              <div>
                {livro.link && (
                  <Button
                    onClick={() => {
                      if (!canAccess) {
                        setShowPremiumModal(true);
                        return;
                      }
                      setShowModeSelector(true);
                    }}
                    size="default"
                    className="w-full shadow-lg hover:shadow-accent/50 transition-all"
                  >
                    {!canAccess && <Crown className="w-4 h-4 mr-1.5 text-amber-300" />}
                    <BookOpen className="w-4 h-4 mr-2" />
                    Ler agora
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs de Conteúdo */}
          <Tabs value={activeTab} onValueChange={(val) => {
            if (val === "aula") {
              setShowVideoModal(true);
            } else {
              setActiveTab(val);
            }
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="sobre">Sobre</TabsTrigger>
              <TabsTrigger value="aula" disabled={!(livro.aula || livro.url_videoaula)}>Aula</TabsTrigger>
              <TabsTrigger value="download" disabled={!livro.download}>Download</TabsTrigger>
            </TabsList>

            <TabsContent value="sobre">
              <div className="space-y-4">
                {livro.sobre ? (
                  <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
                    <h2 className="text-xl font-semibold mb-4">Sobre o livro</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {livro.sobre}
                    </p>
                  </div>
                ) : !hasLeituraDinamica ? (
                  <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-accent/20">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-accent" />
                      </div>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Conteúdo em preparação</h2>
                    <p className="text-muted-foreground mb-6">
                      Clique para processar o PDF e preparar para leitura dinâmica.
                    </p>
                    <Button
                      onClick={() => setShowLeituraDinamicaSetup(true)}
                      size="lg"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Processar Conteúdo
                    </Button>
                  </div>
                ) : (
                  <div className="text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-accent/20">
                    <p className="text-muted-foreground">
                      Informações não disponíveis para este livro.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="download">
              <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 border border-accent/20">
                <Download className="w-16 h-16 mx-auto mb-4 text-accent" />
                <h2 className="text-xl font-semibold mb-4">Download do Livro</h2>
                <p className="text-muted-foreground mb-6">
                  Faça o download do livro para ler offline
                </p>
                {canDownload ? (
                  livro.download && (
                    <Button
                      onClick={() => window.open(livro.download!, "_blank")}
                      size="lg"
                      className="min-w-[200px]"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Baixar Agora
                    </Button>
                  )
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      O download de livros é exclusivo para assinantes Premium
                    </p>
                    <Button
                      onClick={() => setShowPremiumModal(true)}
                      size="lg"
                      variant="default"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      Premium
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal imersivo de vídeo */}
      <AnimatePresence>
        {showVideoModal && (livro.aula || livro.url_videoaula) && (() => {
          const videoSrc = livro.aula || livro.url_videoaula || "";
          // Extrair YouTube video ID para thumbnail
          let youtubeId = "";
          try {
            const urlObj = new URL(videoSrc);
            if (urlObj.hostname.includes("youtube.com")) youtubeId = urlObj.searchParams.get("v") || "";
            if (urlObj.hostname.includes("youtu.be")) youtubeId = urlObj.pathname.slice(1);
          } catch {}
          const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : "";

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex flex-col"
              onClick={() => { setShowVideoModal(false); setVideoPlaying(false); }}
            >
              {/* Fundo com capa desfocada */}
              {livro.imagem && (
                <img
                  src={livro.imagem}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover scale-110"
                  style={{ filter: "blur(20px) brightness(0.45)" }}
                />
              )}
              <div className="absolute inset-0 bg-black/30" />

              {/* Botão fechar */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={() => { setShowVideoModal(false); setVideoPlaying(false); }}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Conteúdo centralizado */}
              <div className="relative flex-1 flex flex-col items-center justify-center gap-3 px-0 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Capa do livro + info */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-2"
                >
                  {livro.imagem && (
                    <div className="relative overflow-hidden rounded-sm">
                      <img
                        src={livro.imagem}
                        alt={livro.livro || ""}
                        className="w-20 h-28 object-cover shadow-lg"
                      />
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/10 to-transparent animate-shimmer-down" />
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-white font-semibold text-base leading-tight">{livro.livro}</h3>
                    {livro.autor && <p className="text-white/60 text-xs mt-0.5">{livro.autor}</p>}
                  </div>
                </motion.div>

                {/* Vídeo ou Thumbnail */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative w-full aspect-video overflow-hidden shadow-2xl"
                >
                  {videoPlaying ? (
                    <VideoPlayer src={videoSrc} autoPlay />
                  ) : (
                    <button
                      onClick={() => setVideoPlaying(true)}
                      className="relative w-full h-full group cursor-pointer"
                    >
                      <img
                        src={thumbnailUrl || livro.imagem || ""}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 text-primary-foreground ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </button>
                  )}
                </motion.div>

                {/* Transcrição / Legendas */}
                {loadingTranscricao && (
                  <div className="flex items-center gap-2 text-white/50 text-xs py-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Carregando legendas...</span>
                  </div>
                )}
                {transcricao.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full max-h-[30vh] overflow-y-auto px-4 py-2"
                  >
                    <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-2">Legendas</p>
                    <div className="space-y-1">
                      {transcricao.map((seg, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="text-white/30 font-mono min-w-[40px] text-right">
                            {Math.floor(seg.start / 60)}:{String(Math.floor(seg.start % 60)).padStart(2, '0')}
                          </span>
                          <span className="text-white/70">{seg.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <PDFReaderModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        onSelectMode={(mode) => {
          setShowModeSelector(false);
          if (mode === 'dinamica') {
            if (hasLeituraDinamica) {
              setShowLeituraDinamica(true);
            } else {
              setShowLeituraDinamicaSetup(true);
            }
          } else {
            setViewMode(mode);
            setShowPDF(true);
            if (livro) registrarAcesso("BIBLIOTECA-CLASSICOS", livro.id, livro.area, livro.livro, livro.imagem);
          }
        }}
        bookTitle={livro?.livro || ''}
        hasLeituraDinamica={hasLeituraDinamica}
        isAdmin={isAdmin}
      />

      <LeituraDinamicaSetup
        isOpen={showLeituraDinamicaSetup}
        onClose={() => setShowLeituraDinamicaSetup(false)}
        livroId={parseInt(livroId || '0')}
        tituloLivro={livro?.livro || ''}
        downloadUrl={livro?.download || ''}
        onComplete={() => {
          setShowLeituraDinamicaSetup(false);
          setHasLeituraDinamica(true);
          setTituloLeituraDinamica(livro?.livro || '');
          setShowLeituraDinamica(true);
        }}
      />

      {showPDF && livro.link && (
        <PDFViewerModal
          isOpen={showPDF}
          onClose={() => setShowPDF(false)}
          normalModeUrl={livro.link}
          verticalModeUrl={livro.download || livro.link}
          title={livro.livro || "Livro"}
          viewMode={viewMode}
        />
      )}

      <LeituraDinamicaReader
        isOpen={showLeituraDinamica}
        onClose={() => setShowLeituraDinamica(false)}
        tituloLivro={livro.livro || ''}
        tituloLeituraDinamica={tituloLeituraDinamica}
        imagemCapa={livro.imagem}
        autorLivro={livro.autor}
      />

      <PremiumFloatingCard
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        title="Conteúdo Premium"
        sourceFeature="Biblioteca Clássicos"
      />

      <AuthRequiredDialog
        open={isAuthDialogOpen}
        onOpenChange={(open) => { if (!open) closeAuthDialog(); }}
      />
    </div>
  );
};

export default BibliotecaClassicosLivro;
