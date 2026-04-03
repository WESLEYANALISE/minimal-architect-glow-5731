import { useState, useCallback, useRef, startTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, BookOpen, FileText, ChevronLeft, ChevronRight, Layers, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewerEnhanced } from "@/components/QuizViewerEnhanced";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { toast } from "sonner";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import VideoProgressBar from "@/components/videoaulas/VideoProgressBar";
import ContinueWatchingModal from "@/components/videoaulas/ContinueWatchingModal";

type TabValue = "resumo" | "flashcards" | "questoes" | "material";

const AulasEmTelaAula = () => {
  const navigate = useNavigate();
  const params = useParams<{ modulo: string; id: string; aulaId: string }>();
  const moduloNum = parseInt(params.modulo || "1");
  const aulaId = parseInt(params.aulaId || params.id || "0");

  const [activeTab, setActiveTab] = useState<TabValue>("resumo");
  const [flashcards, setFlashcards] = useState<any[] | null>(null);
  const [questoes, setQuestoes] = useState<any[] | null>(null);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  
  // Video refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  const { data: aula, isLoading } = useQuery({
    queryKey: ["aulas-em-tela-aula", aulaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas_em_tela" as any)
        .select("*")
        .eq("id", aulaId)
        .single();

      if (error) throw error;
      return data as any;
    },
    enabled: aulaId > 0,
  });

  const { data: aulasModulo } = useQuery({
    queryKey: ["aulas-em-tela-nav", moduloNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas_em_tela" as any)
        .select("id, aula, assunto")
        .eq("modulo", moduloNum)
        .order("aula", { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });

  // Video progress hook
  const {
    progress,
    showContinueModal,
    dismissContinueModal,
    saveProgress,
    startAutoSave,
    stopAutoSave,
  } = useVideoProgress({
    tabela: "aulas_em_tela",
    registroId: String(aulaId),
    videoId: String(aulaId),
    enabled: aulaId > 0 && !!aula?.video,
  });

  const currentIndex = aulasModulo?.findIndex((a: any) => a.id === aulaId) ?? -1;
  const prevAula = currentIndex > 0 ? aulasModulo?.[currentIndex - 1] : null;
  const nextAula = currentIndex >= 0 && aulasModulo && currentIndex < aulasModulo.length - 1 ? aulasModulo[currentIndex + 1] : null;

  const getVideoUrl = (url: string): string => {
    try {
      if (url.includes("dropbox.com")) {
        // Use audio-proxy edge function for Dropbox videos (handles CORS + Range headers)
        const proxyBase = "https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/audio-proxy";
        return `${proxyBase}?url=${encodeURIComponent(url)}`;
      }
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      return url;
    } catch {
      return url;
    }
  };

  const preprocessMarkdown = (text: string): string => {
    return text
      .replace(/\s{2,}(#{1,3}\s)/g, "\n\n$1")
      // Fix list items: "text *   item" → "text\n*   item" (handles * with variable spaces)
      .replace(/\s{2,}(\*\s{1,})/g, "\n$1")
      // Also handle "text * item" with single space before asterisk
      .replace(/([^\n])\s+(\*\s{1,}\S)/g, "$1\n$2")
      .replace(/\s{2,}(\d+\.\s)/g, "\n$1")
      .replace(/\s{2,}>/g, "\n\n>")
      .trim();
  };

  // Video event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handlePlay = useCallback(() => {
    startAutoSave(() => {
      if (videoRef.current) {
        return {
          current: videoRef.current.currentTime,
          duration: videoRef.current.duration,
        };
      }
      return null;
    });
  }, [startAutoSave]);

  const handlePause = useCallback(() => {
    stopAutoSave();
    if (videoRef.current && videoRef.current.duration > 0) {
      saveProgress(videoRef.current.currentTime, videoRef.current.duration, true);
    }
  }, [stopAutoSave, saveProgress]);

  const handleEnded = useCallback(() => {
    stopAutoSave();
    if (videoRef.current && videoRef.current.duration > 0) {
      saveProgress(videoRef.current.duration, videoRef.current.duration, true);
    }
  }, [stopAutoSave, saveProgress]);

  const handleContinue = useCallback(() => {
    if (videoRef.current && progress?.tempo_atual) {
      videoRef.current.currentTime = progress.tempo_atual;
      videoRef.current.play();
    }
  }, [progress]);

  const handleStartOver = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  }, []);

  const generateFlashcards = useCallback(async () => {
    if (flashcards || loadingFlashcards || !aula?.conteudo) return;
    setLoadingFlashcards(true);
    try {
      // Verificar cache primeiro
      const { data: cache } = await supabase
        .from("aulas_em_tela_conteudo_cache" as any)
        .select("flashcards")
        .eq("aula_id", aulaId)
        .single();

      if ((cache as any)?.flashcards && Array.isArray((cache as any).flashcards) && (cache as any).flashcards.length > 0) {
        setFlashcards((cache as any).flashcards);
        return;
      }

      // Sem cache, gerar via IA
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-aula-tab", {
        body: { conteudo: aula.conteudo, tipo: "flashcards" },
      });
      if (error) throw error;
      if (data?.flashcards?.length > 0) {
        setFlashcards(data.flashcards);
        // Salvar no cache
        await supabase.from("aulas_em_tela_conteudo_cache" as any).upsert(
          { aula_id: aulaId, flashcards: data.flashcards } as any,
          { onConflict: "aula_id" }
        );
      } else {
        toast.error("Não foi possível gerar os flashcards");
      }
    } catch (err) {
      console.error("Erro ao gerar flashcards:", err);
      toast.error("Erro ao gerar flashcards");
    } finally {
      setLoadingFlashcards(false);
    }
  }, [flashcards, loadingFlashcards, aula?.conteudo, aulaId]);

  const generateQuestoes = useCallback(async () => {
    if (questoes || loadingQuestoes || !aula?.conteudo) return;
    setLoadingQuestoes(true);
    try {
      // Verificar cache primeiro
      const { data: cache } = await supabase
        .from("aulas_em_tela_conteudo_cache" as any)
        .select("questoes")
        .eq("aula_id", aulaId)
        .single();

      if ((cache as any)?.questoes && Array.isArray((cache as any).questoes) && (cache as any).questoes.length > 0) {
        setQuestoes((cache as any).questoes);
        return;
      }

      // Sem cache, gerar via IA
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-aula-tab", {
        body: { conteudo: aula.conteudo, tipo: "questoes" },
      });
      if (error) throw error;
      if (data?.questoes?.length > 0) {
        setQuestoes(data.questoes);
        // Salvar no cache
        await supabase.from("aulas_em_tela_conteudo_cache" as any).upsert(
          { aula_id: aulaId, questoes: data.questoes } as any,
          { onConflict: "aula_id" }
        );
      } else {
        toast.error("Não foi possível gerar as questões");
      }
    } catch (err) {
      console.error("Erro ao gerar questões:", err);
      toast.error("Erro ao gerar questões");
    } finally {
      setLoadingQuestoes(false);
    }
  }, [questoes, loadingQuestoes, aula?.conteudo, aulaId]);

  const handleTabChange = (value: string) => {
    if (!value) return;
    const tab = value as TabValue;
    setActiveTab(tab);
    if (tab === "flashcards") generateFlashcards();
    if (tab === "questoes") generateQuestoes();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando aula...</p>
      </div>
    );
  }

  if (!aula) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header fixo */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => startTransition(() => navigate(`/aulas-em-tela/${moduloNum}`))}
            className="shrink-0 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              Módulo {aula.modulo} · Aula {aula.aula}
            </p>
            <h1 className="font-semibold text-sm text-foreground truncate">
              {aula.assunto || aula.tema}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Vídeo */}
        {aula.video && (
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden bg-black border border-border shadow-lg">
              <div className="relative aspect-video">
                <video
                  ref={videoRef}
                  src={getVideoUrl(aula.video)}
                  controls
                  playsInline
                  autoPlay
                  className="w-full h-full"
                  controlsList="nodownload noremoteplayback"
                  onContextMenu={(e) => e.preventDefault()}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onEnded={handleEnded}
                />
              </div>
            </div>
            {/* Barra de progresso */}
            {videoDuration > 0 && (
              <VideoProgressBar
                currentTime={videoCurrentTime}
                duration={videoDuration}
              />
            )}
          </div>
        )}

        {/* Continue watching modal */}
        <ContinueWatchingModal
          isOpen={showContinueModal}
          onClose={dismissContinueModal}
          onContinue={handleContinue}
          onStartOver={handleStartOver}
          savedTime={progress?.tempo_atual || 0}
          percentage={progress?.percentual || 0}
        />

        {/* Título */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
            {aula.assunto || aula.tema}
          </h2>
          <p className="text-sm text-muted-foreground">
            {aula.tema} · Módulo {aula.modulo}, Aula {aula.aula}
          </p>
        </div>

        {/* Menu de abas */}
        <div className="w-full">
          <ToggleGroup
            type="single"
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full justify-start gap-1.5 bg-card/50 p-1 rounded-lg border border-border/50 flex-wrap"
          >
            <ToggleGroupItem
              value="resumo"
              aria-label="Resumo"
              className={cn(
                "flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=on]:bg-amber-500 data-[state=on]:text-white",
                "transition-all duration-200"
              )}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">Resumo</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="flashcards"
              aria-label="Flashcards"
              className={cn(
                "flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=on]:bg-amber-500 data-[state=on]:text-white",
                "transition-all duration-200"
              )}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">Flashcards</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="questoes"
              aria-label="Questões"
              className={cn(
                "flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=on]:bg-amber-500 data-[state=on]:text-white",
                "transition-all duration-200"
              )}
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">Questões</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="material"
              aria-label="Material"
              className={cn(
                "flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=on]:bg-amber-500 data-[state=on]:text-white",
                "transition-all duration-200"
              )}
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">Material</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Conteúdo da aba ativa */}
        {activeTab === "resumo" && aula.conteudo && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-6 md:p-10">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">Resumo da Aula</h3>
              </div>
              <div className="max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-bold text-amber-400 mt-8 mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg sm:text-xl font-semibold text-foreground mt-6 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base sm:text-lg font-semibold text-foreground/90 mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-sm sm:text-base text-foreground/90 leading-relaxed mb-3">{children}</p>,
                    li: ({ children }) => <li className="text-sm sm:text-base text-foreground/90 mb-1 ml-5 list-disc">{children}</li>,
                    ul: ({ children }) => <ul className="my-3">{children}</ul>,
                    ol: ({ children }) => <ol className="my-3 list-decimal ml-5">{children}</ol>,
                    strong: ({ children }) => <strong className="text-foreground font-bold">{children}</strong>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-amber-500/50 pl-4 italic text-muted-foreground my-3">{children}</blockquote>,
                  }}
                >
                  {preprocessMarkdown(aula.conteudo)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {activeTab === "flashcards" && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden">
            {loadingFlashcards ? (
              <ContentGenerationLoader message="Gerando flashcards..." />
            ) : flashcards && flashcards.length > 0 ? (
              <FlashcardViewer
                flashcards={flashcards}
                area={aula.area}
                tema={aula.tema}
                settings={{ autoNarration: false, showExamples: true }}
              />
            ) : !aula.conteudo ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <Layers className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Esta aula não possui conteúdo para gerar flashcards.</p>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === "questoes" && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden">
            {loadingQuestoes ? (
              <ContentGenerationLoader message="Gerando questões..." />
            ) : questoes && questoes.length > 0 ? (
              <QuizViewerEnhanced questions={questoes} />
            ) : !aula.conteudo ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <HelpCircle className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Esta aula não possui conteúdo para gerar questões.</p>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === "material" && (
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden p-6">
            {aula.material ? (
              <div className="flex flex-col items-center gap-4">
                <FileText className="w-12 h-12 text-amber-400" />
                <p className="text-foreground font-medium">Material de apoio disponível</p>
                <Button
                  onClick={() => window.open(aula.material, "_blank")}
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Download className="w-4 h-4" />
                  Baixar Material
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Nenhum material disponível para esta aula.</p>
              </div>
            )}
          </div>
        )}

        {/* Navegação entre aulas */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
          {prevAula ? (
            <button
              onClick={() => startTransition(() => navigate(`/aulas-em-tela/${moduloNum}/aula/${prevAula.id}`))}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Anterior</p>
                <p className="font-medium text-foreground line-clamp-1">{prevAula.assunto}</p>
              </div>
            </button>
          ) : (
            <div />
          )}
          {nextAula ? (
            <button
              onClick={() => startTransition(() => navigate(`/aulas-em-tela/${moduloNum}/aula/${nextAula.id}`))}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group text-right"
            >
              <div>
                <p className="text-xs text-muted-foreground">Próxima</p>
                <p className="font-medium text-foreground line-clamp-1">{nextAula.assunto}</p>
              </div>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
};

export default AulasEmTelaAula;
