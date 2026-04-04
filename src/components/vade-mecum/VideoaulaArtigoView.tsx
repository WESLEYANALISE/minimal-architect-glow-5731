import { useState, useEffect, useCallback, useRef } from "react";
import { X, Loader2, Search, Download, FileText } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Video {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface Flashcard {
  front: string;
  back: string;
}

interface Questao {
  pergunta: string;
  alternativas?: string[];
  resposta_correta?: number;
  correta?: boolean;
  explicacao?: string;
}

interface VideoaulaArtigoViewProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
  codeName: string;
  area: string;
}

export const VideoaulaArtigoView = ({
  isOpen,
  onClose,
  artigo,
  numeroArtigo,
  codeName,
  area,
}: VideoaulaArtigoViewProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [cacheId, setCacheId] = useState<string | null>(null);
  const [transcricao, setTranscricao] = useState<string | null>(null);
  const [noVideo, setNoVideo] = useState(false);

  // Resumo state
  const [resumo, setResumo] = useState<string | null>(null);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [resumoGenerated, setResumoGenerated] = useState(false);

  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [flashcardsGenerated, setFlashcardsGenerated] = useState(false);

  // Questões state
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [questoesGenerated, setQuestoesGenerated] = useState(false);

  // Quiz state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const buscarVideos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("buscar-videoaulas-artigo", {
        body: { numeroArtigo, codeName, area },
      });
      if (error) throw error;

      const fetchedVideos = data?.videos || [];
      if (fetchedVideos.length >= 1) {
        setSelectedVideo(fetchedVideos[0]);
      } else {
        setNoVideo(true);
      }

      // Cache data
      if (data?.cached && data?.resumo) {
        setResumo(data.resumo);
        setResumoGenerated(true);
      }
      if (data?.cached && data?.flashcards) {
        setFlashcards(data.flashcards);
        setFlashcardsGenerated(true);
      }
      if (data?.cached && data?.questoes) {
        setQuestoes(data.questoes);
        setQuestoesGenerated(true);
      }
      if (data?.transcricao) setTranscricao(data.transcricao);

      // Get cache ID for updates
      if (fetchedVideos.length > 0) {
        const { data: cacheRow } = await supabase
          .from('videoaulas_artigos_cache')
          .select('id')
          .eq('codigo_tabela', codeName || '')
          .eq('numero_artigo', numeroArtigo)
          .maybeSingle();
        if (cacheRow) setCacheId(cacheRow.id);
      }
    } catch (err) {
      console.error("Erro ao buscar vídeos:", err);
      toast.error("Erro ao buscar videoaulas");
    } finally {
      setLoading(false);
    }
  }, [numeroArtigo, codeName, area]);

  useEffect(() => {
    if (isOpen) {
      setSelectedVideo(null);
      setNoVideo(false);
      setCacheId(null);
      setTranscricao(null);
      setResumo(null);
      setResumoGenerated(false);
      setFlashcards([]);
      setFlashcardsGenerated(false);
      setQuestoes([]);
      setQuestoesGenerated(false);
      setCurrentQIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setScore({ correct: 0, total: 0 });
      setLoadingResumo(false);
      setLoadingFlashcards(false);
      setLoadingQuestoes(false);
      buscarVideos();
    }
  }, [isOpen]);

  const gerarConteudo = async (tipo: 'resumo' | 'flashcards' | 'questoes') => {
    const setLoadingFn = tipo === 'resumo' ? setLoadingResumo : tipo === 'flashcards' ? setLoadingFlashcards : setLoadingQuestoes;
    setLoadingFn(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-videoaula", {
        body: {
          cacheId,
          tipo,
          transcricao,
          artigo: !transcricao ? artigo : undefined,
          numeroArtigo,
          area,
        },
      });
      if (error) throw error;

      if (tipo === 'resumo') {
        setResumo(data.conteudo);
        setResumoGenerated(true);
      } else if (tipo === 'flashcards') {
        setFlashcards(data.conteudo || []);
        setFlashcardsGenerated(true);
      } else {
        setQuestoes(data.conteudo || []);
        setQuestoesGenerated(true);
      }
    } catch (err) {
      console.error(`Erro ao gerar ${tipo}:`, err);
      toast.error(`Erro ao gerar ${tipo}`);
    } finally {
      setLoadingFn(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === "resumo" && !resumoGenerated && !loadingResumo) gerarConteudo('resumo');
    if (value === "flashcards" && !flashcardsGenerated && !loadingFlashcards) gerarConteudo('flashcards');
    if (value === "questoes" && !questoesGenerated && !loadingQuestoes) gerarConteudo('questoes');
  };

  // Auto-generate resumo when video loads
  useEffect(() => {
    if (selectedVideo && !resumoGenerated && !loadingResumo) {
      gerarConteudo('resumo');
    }
  }, [selectedVideo]);

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    const current = questoes[currentQIndex];
    const isCorrect = index === current.resposta_correta;
    setSelectedAnswer(index);
    setShowExplanation(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentQIndex(prev => prev + 1);
  };

  const downloadPDF = async () => {
    if (!resumo) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - margin * 2;

      doc.setFontSize(16);
      doc.text(`Resumo — Art. ${numeroArtigo}`, margin, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(area, margin, 28);

      doc.setFontSize(11);
      doc.setTextColor(0);
      const cleanText = resumo
        .replace(/#{1,3}\s/g, '')
        .replace(/\*\*/g, '')
        .replace(/[📋📖⚖️💡📝🔍]/gu, '');
      const lines = doc.splitTextToSize(cleanText, maxWidth);
      doc.text(lines, margin, 38);

      doc.save(`resumo-art-${numeroArtigo}.pdf`);
      toast.success("PDF baixado!");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">
              Videoaulas — Art. {numeroArtigo}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{area}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Buscando videoaula...</p>
            </div>
          ) : selectedVideo ? (
            <div className="flex flex-col">
              {/* Player */}
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&rel=0&modestbranding=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Info do vídeo */}
              <div className="p-4 border-b border-border">
                <h4 className="text-sm font-semibold leading-snug line-clamp-2">{selectedVideo.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{selectedVideo.channelTitle}</p>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="resumo" onValueChange={handleTabChange} className="w-full">
                <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
                  <TabsTrigger value="resumo" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 text-xs font-medium">
                    Resumo
                  </TabsTrigger>
                  <TabsTrigger value="flashcards" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 text-xs font-medium">
                    Flashcards
                  </TabsTrigger>
                  <TabsTrigger value="questoes" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 text-xs font-medium">
                    Questões
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="resumo" className="mt-0 p-4 pb-20">
                  {loadingResumo ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-7 h-7 animate-spin text-accent" />
                      <p className="text-sm text-muted-foreground">
                        {transcricao ? 'Analisando transcrição da aula...' : 'Gerando resumo...'}
                      </p>
                    </div>
                  ) : resumo ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{resumo}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">Nenhum resumo disponível.</p>
                  )}
                </TabsContent>

                <TabsContent value="flashcards" className="mt-0 p-4">
                  {loadingFlashcards ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-7 h-7 animate-spin text-accent" />
                      <p className="text-sm text-muted-foreground">Gerando flashcards...</p>
                    </div>
                  ) : flashcards.length > 0 ? (
                    <FlashcardViewer flashcards={flashcards} />
                  ) : flashcardsGenerated ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">Nenhum flashcard gerado.</p>
                  ) : null}
                </TabsContent>

                <TabsContent value="questoes" className="mt-0 p-4">
                  {loadingQuestoes ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-7 h-7 animate-spin text-accent" />
                      <p className="text-sm text-muted-foreground">Gerando questões...</p>
                    </div>
                  ) : questoes.length > 0 ? (
                    <QuizInline
                      questoes={questoes}
                      currentIndex={currentQIndex}
                      selectedAnswer={selectedAnswer}
                      showExplanation={showExplanation}
                      score={score}
                      onAnswer={handleAnswer}
                      onNext={nextQuestion}
                    />
                  ) : questoesGenerated ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma questão gerada.</p>
                  ) : null}
                </TabsContent>
              </Tabs>
            </div>
          ) : noVideo ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Search className="w-10 h-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground text-center px-8">
                Nenhuma videoaula encontrada para este artigo
              </p>
            </div>
          ) : null}

          {/* Floating PDF download button */}
          {resumo && !loadingResumo && (
            <button
              onClick={downloadPDF}
              className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              title="Baixar resumo em PDF"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Inline Quiz component
const QuizInline = ({
  questoes,
  currentIndex,
  selectedAnswer,
  showExplanation,
  score,
  onAnswer,
  onNext,
}: {
  questoes: Questao[];
  currentIndex: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  score: { correct: number; total: number };
  onAnswer: (i: number) => void;
  onNext: () => void;
}) => {
  if (currentIndex >= questoes.length) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl font-bold mb-2">🎉 Resultado</p>
        <p className="text-lg">
          {score.correct}/{score.total} acertos
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {Math.round((score.correct / score.total) * 100)}% de aproveitamento
        </p>
      </div>
    );
  }

  const current = questoes[currentIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Questão {currentIndex + 1} de {questoes.length}</span>
        <span>{score.correct} acerto(s)</span>
      </div>

      <p className="text-sm font-medium leading-relaxed">{current.pergunta}</p>

      <div className="space-y-2">
        {(current.alternativas || []).map((alt, i) => {
          const isSelected = selectedAnswer === i;
          const isCorrect = i === current.resposta_correta;
          let borderClass = "border-border";
          if (showExplanation) {
            if (isCorrect) borderClass = "border-green-500 bg-green-500/10";
            else if (isSelected && !isCorrect) borderClass = "border-red-500 bg-red-500/10";
          } else if (isSelected) {
            borderClass = "border-primary";
          }

          return (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={selectedAnswer !== null}
              className={`w-full text-left p-3 rounded-xl border ${borderClass} text-sm transition-colors disabled:cursor-default`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
              {alt}
            </button>
          );
        })}
      </div>

      {showExplanation && current.explicacao && (
        <div className="p-3 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs font-semibold mb-1">Explicação:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{current.explicacao}</p>
        </div>
      )}

      {showExplanation && currentIndex < questoes.length - 1 && (
        <button
          onClick={onNext}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
        >
          Próxima →
        </button>
      )}
    </div>
  );
};
