import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Image, Volume2, Loader2, Sparkles, Play, Pause, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Explicacao {
  id: number;
  ordem: number;
  titulo: string;
  descricao_curta: string | null;
  conteudo_gerado: string | null;
  conteudo_descomplicado?: string | null;
  url_capa: string | null;
  url_audio: string | null;
  url_audio_descomplicado?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  explicacao: Explicacao | null;
}

type ModoExplicacao = "tecnico" | "descomplicado";

const ExplicacaoModal = ({ open, onOpenChange, explicacao }: Props) => {
  const [modo, setModo] = useState<ModoExplicacao>("tecnico");
  const [conteudoTecnico, setConteudoTecnico] = useState<string | null>(null);
  const [conteudoDescomplicado, setConteudoDescomplicado] = useState<string | null>(null);
  const [urlCapa, setUrlCapa] = useState<string | null>(null);
  const [urlAudioTecnico, setUrlAudioTecnico] = useState<string | null>(null);
  const [urlAudioDescomplicado, setUrlAudioDescomplicado] = useState<string | null>(null);
  const [isLoadingConteudo, setIsLoadingConteudo] = useState(false);
  const [isGeneratingCapa, setIsGeneratingCapa] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState<{
    etapa: "tecnico" | "descomplicado" | null;
    tecnicoConcluido: boolean;
  }>({ etapa: null, tecnicoConcluido: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const conteudoAtual = modo === "tecnico" ? conteudoTecnico : conteudoDescomplicado;
  const urlAudioAtual = modo === "tecnico" ? urlAudioTecnico : urlAudioDescomplicado;

  useEffect(() => {
    if (open && explicacao) {
      setConteudoTecnico(explicacao.conteudo_gerado);
      setConteudoDescomplicado(explicacao.conteudo_descomplicado || null);
      setUrlCapa(explicacao.url_capa);
      setUrlAudioTecnico(explicacao.url_audio);
      setUrlAudioDescomplicado(explicacao.url_audio_descomplicado || null);
      setModo("tecnico");
      
      if (!explicacao.conteudo_gerado) {
        gerarConteudo("tecnico");
      }
      
      // Scroll to top when opening
      setTimeout(() => {
        const scrollContainer = document.getElementById('explicacao-scroll-container');
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
      }, 50);
    }
    
    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
    };
  }, [open, explicacao]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const gerarConteudo = async (tipo: ModoExplicacao) => {
    if (!explicacao) return;
    
    setIsLoadingConteudo(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-artigo-explicacao", {
        body: { ordem: explicacao.ordem, modo: tipo },
      });

      if (error) throw error;
      
      if (tipo === "tecnico") {
        setConteudoTecnico(data.conteudo);
      } else {
        setConteudoDescomplicado(data.conteudo);
      }
      toast.success("Conteúdo gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar conteúdo:", error);
      toast.error("Erro ao gerar conteúdo");
    } finally {
      setIsLoadingConteudo(false);
    }
  };

  const handleModoChange = (novoModo: string) => {
    if (!novoModo) return;
    const modoSelecionado = novoModo as ModoExplicacao;
    setModo(modoSelecionado);
    
    // Se não tem conteúdo para este modo, gerar
    if (modoSelecionado === "tecnico" && !conteudoTecnico) {
      gerarConteudo("tecnico");
    } else if (modoSelecionado === "descomplicado" && !conteudoDescomplicado) {
      gerarConteudo("descomplicado");
    }
  };

  const gerarCapa = async () => {
    if (!explicacao) return;
    
    setIsGeneratingCapa(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-capa-explicacao", {
        body: { ordem: explicacao.ordem, titulo: explicacao.titulo },
      });

      if (error) throw error;
      // API retorna url_capa (snake_case)
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

  // Gera narração para um modo específico
  const gerarNarracaoModo = async (
    modoNarracao: "tecnico" | "descomplicado",
    texto: string
  ): Promise<string | null> => {
    if (!explicacao || !texto) return null;

    setAudioProgress(prev => ({ 
      etapa: modoNarracao, 
      tecnicoConcluido: prev.tecnicoConcluido 
    }));

    try {
      const { data, error } = await supabase.functions.invoke("gerar-narracao-explicacao", {
        body: { texto, ordem: explicacao.ordem, modo: modoNarracao },
      });

      if (error) throw error;

      const audioUrl = data.audioUrl || data.url_audio;
      return audioUrl;
    } catch (error) {
      console.error(`Erro ao gerar narração ${modoNarracao}:`, error);
      throw error;
    }
  };

  // Gera as duas narrações (Técnico e Descomplicado) em sequência
  const gerarNarracoes = async () => {
    if (!explicacao) {
      console.error("gerarNarracoes: explicacao é null");
      toast.error("Explicação não carregada");
      return;
    }
    
    // Verificar se ambos os conteúdos estão disponíveis
    if (!conteudoTecnico) {
      toast.error("Conteúdo técnico não disponível. Aguarde o carregamento.");
      return;
    }
    if (!conteudoDescomplicado) {
      toast.error("Conteúdo descomplicado não disponível. Gere o conteúdo primeiro.");
      return;
    }

    console.log("gerarNarracoes iniciando para ambos os modos...");
    setIsGeneratingAudio(true);
    setAudioProgress({ etapa: null, tecnicoConcluido: false });

    try {
      // 1. Gerar narração técnica
      console.log("Gerando narração técnica...");
      const audioUrlTecnico = await gerarNarracaoModo("tecnico", conteudoTecnico);
      if (audioUrlTecnico) {
        setUrlAudioTecnico(audioUrlTecnico);
        setAudioProgress({ etapa: null, tecnicoConcluido: true });
        toast.success("✅ Narração Técnica gerada!");
      }

      // Pequena pausa entre gerações
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Gerar narração descomplicada
      console.log("Gerando narração descomplicada...");
      const audioUrlDescomplicado = await gerarNarracaoModo("descomplicado", conteudoDescomplicado);
      if (audioUrlDescomplicado) {
        setUrlAudioDescomplicado(audioUrlDescomplicado);
        toast.success("✅ Narração Descomplicada gerada!");
      }

      toast.success("🎉 Todas as narrações foram geradas!");
    } catch (error: any) {
      console.error("Erro ao gerar narrações:", error);
      const errorMsg = error?.message || String(error);
      
      // Mensagem específica para erro de quota
      if (errorMsg.includes("quota") || errorMsg.includes("429")) {
        toast.error("Quotas de API esgotadas. Tente novamente em alguns minutos.", {
          duration: 6000,
        });
      } else if (errorMsg.includes("timeout") || errorMsg.includes("connection")) {
        toast.error("Conexão instável. Tente novamente.", {
          duration: 5000,
        });
      } else {
        toast.error("Erro ao gerar narrações. Tente novamente.");
      }
    } finally {
      setIsGeneratingAudio(false);
      setAudioProgress({ etapa: null, tecnicoConcluido: false });
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleAudio = useCallback(() => {
    if (!urlAudioAtual) return;

    if (audio && audio.src === urlAudioAtual) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play().catch(console.error);
        setIsPlaying(true);
      }
    } else {
      // Parar áudio anterior se existir
      if (audio) {
        audio.pause();
      }
      const newAudio = new Audio(urlAudioAtual);
      newAudio.onloadedmetadata = () => {
        if (newAudio.duration && isFinite(newAudio.duration)) {
          setAudioDuration(newAudio.duration);
        }
      };
      newAudio.ontimeupdate = () => {
        setCurrentTime(newAudio.currentTime);
      };
      newAudio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      newAudio.onerror = (e) => {
        console.error("Erro ao carregar áudio:", e);
        toast.error("Erro ao reproduzir áudio");
        setIsPlaying(false);
      };
      newAudio.play().catch((e) => {
        console.error("Erro ao reproduzir:", e);
        toast.error("Erro ao reproduzir áudio");
      });
      setAudio(newAudio);
      setIsPlaying(true);
    }
  }, [urlAudioAtual, audio, isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [audio]);

  // Parar áudio quando mudar de modo - usando ref para evitar loop
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    audioRef.current = audio;
  }, [audio]);

  useEffect(() => {
    // Parar áudio anterior ao mudar de modo
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setAudio(null);
      setIsPlaying(false);
    }
    setAudioDuration(0);
    setCurrentTime(0);
  }, [modo]);

  // Custom components for ReactMarkdown to handle tables with horizontal scroll
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

  if (!open || !explicacao) return null;

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const content = (
    <>
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
            <p className="text-sm text-amber-500 font-medium">
              Aula {explicacao.ordem} de 30
            </p>
            <h2 className="font-semibold text-foreground truncate">
              {explicacao.titulo}
            </h2>
          </div>
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <div id="explicacao-scroll-container" className={isDesktop ? "pb-24" : "overflow-y-auto h-[calc(100vh-80px)]"}>
        <div className="max-w-3xl mx-auto p-4 space-y-6 pb-24">
          {/* Capa - Formato 16:9 (YouTube) */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted">
            {urlCapa ? (
              <img
                src={urlCapa}
                alt={explicacao.titulo}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-3">
                <Image className="w-12 h-12 text-amber-400/50" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={gerarCapa}
                  disabled={isGeneratingCapa}
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
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

          {/* Toggle Técnico/Descomplicado */}
          <div className="flex justify-center">
            <ToggleGroup 
              type="single" 
              value={modo} 
              onValueChange={handleModoChange}
              className="bg-muted/50 p-1 rounded-lg grid grid-cols-2"
            >
              <ToggleGroupItem 
                value="tecnico" 
                className="data-[state=on]:bg-amber-500 data-[state=on]:text-white px-4 py-2 rounded-md gap-2 justify-center flex-1"
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Técnico</span>
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="descomplicado" 
                className="data-[state=on]:bg-green-500 data-[state=on]:text-white px-4 py-2 rounded-md gap-2 justify-center flex-1"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Descomplicado</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Player de Áudio */}
          <div className="p-3 rounded-lg bg-card border border-border/50 space-y-3">
            {urlAudioAtual ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="default"
                    size="icon"
                    onClick={toggleAudio}
                    className="shrink-0 rounded-full w-10 h-10"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDuration(currentTime)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDuration(audioDuration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Áudio não disponível</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={gerarNarracoes}
                  disabled={isGeneratingAudio}
                >
                  {isGeneratingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {audioProgress.etapa === "tecnico"
                        ? "Gerando técnico..."
                        : audioProgress.etapa === "descomplicado"
                        ? "Gerando descomplicado..."
                        : "Preparando..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Gerar Áudio
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Markdown Content */}
          {isLoadingConteudo ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : conteudoAtual ? (
            <article className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {conteudoAtual}
              </ReactMarkdown>
            </article>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-muted-foreground">
                Conteúdo não disponível
              </p>
              <Button onClick={() => gerarConteudo(modo)} disabled={isLoadingConteudo}>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Conteúdo
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-background/95 backdrop-blur-md shadow-2xl overflow-y-auto border-l border-border/30"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background overflow-hidden"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  );
};

export default ExplicacaoModal;
