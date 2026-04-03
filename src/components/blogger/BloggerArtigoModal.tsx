import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Image, Volume2, Loader2, Sparkles, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface BloggerArtigo {
  id: number;
  ordem: number;
  titulo: string;
  descricao_curta: string | null;
  conteudo_gerado: string | null;
  conteudo_descomplicado?: string | null;
  url_capa: string | null;
  url_audio: string | null;
  url_audio_descomplicado?: string | null;
  topicos: string[] | null;
}

interface BloggerArtigoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artigo: BloggerArtigo;
  cor: string;
  tabela: string;
}

export const BloggerArtigoModal = ({
  open,
  onOpenChange,
  artigo,
  cor,
  tabela,
}: BloggerArtigoModalProps) => {
  const [conteudo, setConteudo] = useState<string | null>(null);
  const [urlCapa, setUrlCapa] = useState<string | null>(null);
  const [urlAudio, setUrlAudio] = useState<string | null>(null);
  const [isLoadingConteudo, setIsLoadingConteudo] = useState(false);
  const [isGeneratingCapa, setIsGeneratingCapa] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    if (open && artigo) {
      setConteudo(artigo.conteudo_gerado);
      setUrlCapa(artigo.url_capa);
      setUrlAudio(artigo.url_audio);

      if (!artigo.conteudo_gerado) {
        gerarConteudo();
      }

      setTimeout(() => {
        const el = document.getElementById('blogger-scroll-container');
        if (el) el.scrollTop = 0;
      }, 50);
    }

    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
    };
  }, [open, artigo]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const gerarConteudo = async () => {
    if (!artigo) return;
    setIsLoadingConteudo(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-blogger", {
        body: {
          tabela,
          artigoId: artigo.id,
          titulo: artigo.titulo,
          descricao_curta: artigo.descricao_curta,
        },
      });

      if (error) throw error;
      setConteudo(data.conteudo);
      toast.success("Conteúdo gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar conteúdo:", error);
      toast.error("Erro ao gerar conteúdo");
    } finally {
      setIsLoadingConteudo(false);
    }
  };

  const gerarCapa = async () => {
    if (!artigo) return;
    setIsGeneratingCapa(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-capa-explicacao", {
        body: { ordem: artigo.ordem, titulo: artigo.titulo, tabela },
      });

      if (error) throw error;
      const capaUrl = data.url_capa || data.capaUrl;
      setUrlCapa(capaUrl);
      toast.success("Capa gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar capa:", error);
      toast.error("Erro ao gerar capa");
    } finally {
      setIsGeneratingCapa(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = useCallback(() => {
    if (!urlAudio) return;

    if (audio && audio.src === urlAudio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(console.error);
        setIsPlaying(true);
      }
    } else {
      if (audio) audio.pause();
      const newAudio = new Audio(urlAudio);
      newAudio.onloadedmetadata = () => {
        if (newAudio.duration && isFinite(newAudio.duration)) {
          setAudioDuration(newAudio.duration);
        }
      };
      newAudio.ontimeupdate = () => setCurrentTime(newAudio.currentTime);
      newAudio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      newAudio.onerror = () => { toast.error("Erro ao reproduzir áudio"); setIsPlaying(false); };
      newAudio.play().catch(() => toast.error("Erro ao reproduzir áudio"));
      setAudio(newAudio);
      setIsPlaying(true);
    }
  }, [urlAudio, audio, isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [audio]);

  const markdownComponents = {
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-4 -mx-4 px-4">
        <table className="min-w-full border-collapse border border-border/50 text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-muted/50" {...props}>{children}</thead>
    ),
    th: ({ children, ...props }: any) => (
      <th className="border border-border/50 px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border border-border/50 px-3 py-2 text-muted-foreground" {...props}>
        {children}
      </td>
    ),
  };

  if (!open || !artigo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: cor }}>
                Aula {artigo.ordem} de 30
              </p>
              <h2 className="font-semibold text-foreground truncate">
                {artigo.titulo}
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div id="blogger-scroll-container" className="overflow-y-auto h-[calc(100vh-80px)]">
          <div className="max-w-3xl mx-auto p-4 space-y-6 pb-24">
            {/* Cover Image - 16:9 */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
              {urlCapa ? (
                <img
                  src={urlCapa}
                  alt={artigo.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-3">
                  <Image className="w-12 h-12" style={{ color: `${cor}80` }} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={gerarCapa}
                    disabled={isGeneratingCapa}
                    className="border-border/50 hover:bg-accent/50"
                    style={{ borderColor: `${cor}50`, color: cor }}
                  >
                    {isGeneratingCapa ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Capa com IA
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Audio Player */}
            <div className="p-3 rounded-lg bg-card border border-border/50 space-y-3">
              {urlAudio ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="default"
                      size="icon"
                      onClick={toggleAudio}
                      className="shrink-0 text-white"
                      style={{ backgroundColor: cor }}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </Button>

                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground min-w-[35px] text-right">
                        {formatDuration(currentTime)}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={audioDuration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        style={{
                          background: audioDuration
                            ? `linear-gradient(to right, ${cor} ${(currentTime / audioDuration) * 100}%, hsl(var(--muted)) ${(currentTime / audioDuration) * 100}%)`
                            : 'hsl(var(--muted))'
                        }}
                      />
                      <span className="text-xs text-muted-foreground min-w-[35px]">
                        {formatDuration(audioDuration)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-1">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Áudio não disponível
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {artigo.titulo}
            </h1>

            {/* Content */}
            {isLoadingConteudo ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-1/2 mt-6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : conteudo ? (
              <article className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:mt-8 prose-headings:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6 [&>p]:mb-6 [&>*+p]:mt-6 prose-strong:text-foreground prose-li:text-muted-foreground prose-ul:my-6 prose-li:my-2 prose-blockquote:border-l-amber-500 prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-muted-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {conteudo}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-muted-foreground">Conteúdo não disponível</p>
                <Button onClick={() => gerarConteudo()} disabled={isLoadingConteudo}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Conteúdo
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BloggerArtigoModal;
