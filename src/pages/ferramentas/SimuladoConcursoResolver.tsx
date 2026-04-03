import { useState, useEffect, useRef } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { useNavigate, useParams } from "react-router-dom";
import { useSimuladoFreeLimit } from "@/hooks/useSimuladoFreeLimit";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, Trophy, Volume2, Tag, FileText, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { playFeedbackSound } from "@/hooks/useFeedbackSound";

interface QuestaoTJSP {
  Numero: number;
  Enunciado: string;
  "Alternativa A": string;
  "Alternativa B": string;
  "Alternativa C": string;
  "Alternativa D": string;
  "Alternativa E": string;
  Gabarito: string;
  Materia: string;
  Ano: number;
  "Tipo da Prova": string;
  Imagem: string | null;
}

const SimuladoConcursoResolver = () => {
  const navigate = useNavigate();
  const { concurso } = useParams();
  const { isLocked } = useSimuladoFreeLimit();

  useEffect(() => {
    if (isLocked) navigate('/assinatura', { replace: true });
  }, [isLocked, navigate]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [respostasConfirmadas, setRespostasConfirmadas] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"questao" | "texto">("questao");
  const contentRef = useRef<HTMLDivElement>(null);
  const comentarioRef = useRef<HTMLDivElement>(null);

  const progressKey = `simulado-progress-concurso-${concurso}`;

  useEffect(() => {
    const interval = setInterval(() => {
      setTempoDecorrido((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(progressKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.currentIndex != null) setCurrentIndex(data.currentIndex);
        if (data.respostas) setRespostas(data.respostas);
        if (data.respostasConfirmadas) setRespostasConfirmadas(data.respostasConfirmadas);
        if (data.score) setScore(data.score);
        if (data.tempoDecorrido) setTempoDecorrido(data.tempoDecorrido);
      }
    } catch {}
  }, [progressKey]);

  const { data: questoes, isLoading } = useQuery({
    queryKey: ["simulado-questoes", concurso],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-TJSP" as any)
        .select("*")
        .order("Numero", { ascending: true });
      if (error) throw error;
      return data as unknown as QuestaoTJSP[];
    },
  });

  useEffect(() => {
    if (!questoes || questoes.length === 0) return;
    const data = { currentIndex, respostas, respostasConfirmadas, score, tempoDecorrido };
    localStorage.setItem(progressKey, JSON.stringify(data));
  }, [currentIndex, respostas, respostasConfirmadas, score, tempoDecorrido, progressKey, questoes]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setAbaAtiva("questao");
  }, [currentIndex]);

  const questaoAtualData = questoes?.[currentIndex];
  const totalQuestoes = questoes?.length || 0;
  const progresso = totalQuestoes > 0 ? ((currentIndex + 1) / totalQuestoes) * 100 : 0;
  const isConfirmed = respostasConfirmadas[currentIndex];
  const hasSelected = !!respostas[currentIndex];

  const handleSelectAnswer = (letra: string) => {
    if (isConfirmed) return;
    setRespostas((prev) => ({ ...prev, [currentIndex]: letra }));
  };

  const handleConfirmAnswer = async () => {
    if (!questaoAtualData || !respostas[currentIndex]) return;
    if (isConfirmed) return;

    const acertou = respostas[currentIndex]?.toUpperCase() === questaoAtualData.Gabarito?.toUpperCase();
    setRespostasConfirmadas((prev) => ({ ...prev, [currentIndex]: true }));
    setScore((prev) => ({
      correct: prev.correct + (acertou ? 1 : 0),
      wrong: prev.wrong + (acertou ? 0 : 1),
    }));

    await playFeedbackSound(acertou ? "correct" : "error");
    setTimeout(() => {
      comentarioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestoes - 1) setCurrentIndex((prev) => prev + 1);
  };
  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };
  const handleBack = () => setShowExitDialog(true);

  const handleExitAndSave = () => {
    setShowExitDialog(false);
    navigate(-1);
  };
  const handleExitWithoutSave = () => {
    localStorage.removeItem(progressKey);
    setShowExitDialog(false);
    navigate(-1);
  };

  const handleFinalizar = () => {
    const acertos = questoes?.filter(
      (q, idx) => respostas[idx]?.toUpperCase() === q.Gabarito?.toUpperCase()
    ).length || 0;
    localStorage.removeItem(progressKey);
    navigate(`/ferramentas/simulados/${concurso}/resultado`, {
      state: { acertos, total: totalQuestoes, tempo: tempoDecorrido, respostas },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!questaoAtualData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Nenhuma questão encontrada</p>
        <Button onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const alternativas = [
    { letra: "A", texto: questaoAtualData["Alternativa A"] },
    { letra: "B", texto: questaoAtualData["Alternativa B"] },
    { letra: "C", texto: questaoAtualData["Alternativa C"] },
    { letra: "D", texto: questaoAtualData["Alternativa D"] },
    { letra: "E", texto: questaoAtualData["Alternativa E"] },
  ].filter((a) => a.texto);

  const respostaCorreta = questaoAtualData.Gabarito?.toUpperCase();
  const isCorrect = respostas[currentIndex]?.toUpperCase() === respostaCorreta;

  const temImagemNoEnunciado = /\[IMAGEM\]/gi.test(questaoAtualData.Enunciado);
  const enunciadoProcessado = questaoAtualData.Enunciado?.replace(/\[IMAGEM\]/gi, "") || "";

  const temaQc = (questaoAtualData as any).tema_qc as string | undefined;
  const subtemaQc = (questaoAtualData as any).subtema_qc as string | undefined;
  const textoBase = (questaoAtualData as any).texto_base as string | null;
  const textoApoioImagemUrl = (questaoAtualData as any).texto_apoio_imagem_url as string | null;
  const temTexto = !!textoBase || !!textoApoioImagemUrl || (!!questaoAtualData.Imagem && !temImagemNoEnunciado);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Scrollable content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto min-h-0">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handleBack} className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
              <div className="leading-none">
                <span className="text-[10px] uppercase text-muted-foreground">Sair</span>
                <span className="block text-xs font-semibold text-foreground">Simulado</span>
              </div>
            </button>
            <span className="text-sm font-medium text-foreground">Simulado</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">
                {String(currentIndex + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground">de {totalQuestoes}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(tempoDecorrido)}
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {score.correct} ✓ / {score.wrong} ✗
              </span>
            </div>
          </div>

          {/* Materia + Tema badges - show only temaQc (green) to avoid duplicate with Materia */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {(temaQc || questaoAtualData.Materia) && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                {temaQc || questaoAtualData.Materia}
              </span>
            )}
            {subtemaQc && (
              <span className="bg-sky-500/15 text-sky-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {subtemaQc}
              </span>
            )}
          </div>

          <Progress value={progresso} className="h-1.5 bg-muted [&>div]:bg-emerald-500" />

          {/* Toggle Questão / Ver Texto - below progress bar */}
          {temTexto && (
            <div className="flex items-center gap-1 bg-muted/80 border border-border/50 rounded-xl p-1 mt-3">
              <button
                onClick={() => setAbaAtiva("questao")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all",
                  abaAtiva === "questao"
                    ? "bg-card text-foreground shadow-md border border-border/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Questão
              </button>
              <button
                onClick={() => setAbaAtiva("texto")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all",
                  abaAtiva === "texto"
                    ? "bg-card text-foreground shadow-md border border-border/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Ver Texto
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 pb-4">
          {temTexto && abaAtiva === "texto" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-xl p-4 border border-amber-500/20 space-y-3"
            >
              <h4 className="font-semibold text-sm text-amber-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Texto de Apoio
              </h4>
              {textoApoioImagemUrl && (
                <img src={textoApoioImagemUrl} alt="Texto de apoio" className="w-full rounded-lg" />
              )}
              {questaoAtualData.Imagem && !temImagemNoEnunciado && (
                <img src={questaoAtualData.Imagem} alt="Texto de apoio" className="w-full rounded-lg" />
              )}
              {textoBase && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{textoBase}</p>
              )}
            </motion.div>
          ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Enunciado */}
              <div className="bg-card rounded-xl p-4 border border-border mb-3">
                <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Questão {questaoAtualData.Numero}
                </p>
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap text-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(enunciadoProcessado) }}
                />
                {temImagemNoEnunciado && questaoAtualData.Imagem && (
                  <div className="mt-4">
                    <img
                      src={questaoAtualData.Imagem}
                      alt="Imagem da questão"
                      className="max-w-full rounded-lg border border-border/50"
                    />
                  </div>
                )}
              </div>

              {/* Alternativas */}
              <div className="space-y-2.5">
                {alternativas.map((alt, index) => {
                  const isSelected = respostas[currentIndex]?.toUpperCase() === alt.letra;
                  const isCorrectAnswer = alt.letra === respostaCorreta;
                  const showCorrectAnswer = isConfirmed && isCorrectAnswer;
                  const showWrongAnswer = isConfirmed && isSelected && !isCorrectAnswer;

                  return (
                    <motion.button
                      key={alt.letra}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.2 }}
                      onClick={() => handleSelectAnswer(alt.letra)}
                      disabled={isConfirmed}
                      className={cn(
                        "w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
                        // Default
                        !isConfirmed && !isSelected && "bg-card border-border/60 hover:border-amber-500/40 hover:bg-amber-500/5",
                        // Selected — warm amber
                        !isConfirmed && isSelected && "bg-amber-500/10 border-amber-500 shadow-[0_0_12px_-3px_hsl(var(--primary)/0.2)]",
                        // Correct
                        showCorrectAnswer && "bg-emerald-500/15 border-emerald-500",
                        // Wrong
                        showWrongAnswer && "bg-red-500/15 border-red-500",
                        // Dim non-relevant
                        isConfirmed && !isCorrectAnswer && !isSelected && "opacity-50",
                        !isConfirmed && "active:scale-[0.98]"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
                          showCorrectAnswer
                            ? "bg-emerald-500 text-white"
                            : showWrongAnswer
                            ? "bg-red-500 text-white"
                            : isSelected
                            ? "bg-amber-500 text-background"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {showCorrectAnswer ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : showWrongAnswer ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          alt.letra
                        )}
                      </div>
                      <span className={cn(
                        "text-sm flex-1 pt-1 leading-relaxed",
                        isSelected && !isConfirmed && "font-medium text-foreground",
                        showCorrectAnswer && "font-medium text-emerald-400",
                        showWrongAnswer && "text-red-400 line-through"
                      )}>
                        {alt.texto}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback + Comentário */}
              {isConfirmed && (
                <motion.div
                  ref={comentarioRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-3"
                >
                  {/* Result banner */}
                  <div className={cn(
                    "p-4 rounded-xl border",
                    isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  )}>
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-semibold text-sm">
                        {isCorrect ? (
                          <span className="text-emerald-400">Resposta correta!</span>
                        ) : (
                          <span className="text-red-400">
                            Incorreta. Correta: {respostaCorreta}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>


                  {/* Comentário IA */}
                  {(questaoAtualData as any).comentario_ia && (
                    <div className="p-4 rounded-xl border bg-amber-500/5 border-amber-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-amber-400">Comentário</span>
                        {(questaoAtualData as any).url_audio_comentario && (
                          <button
                            onClick={() => {
                              const audio = new Audio((questaoAtualData as any).url_audio_comentario);
                              audio.play();
                            }}
                            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            Ouvir
                          </button>
                        )}
                      </div>
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground/90 prose-strong:text-foreground prose-headings:text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {(questaoAtualData as any).comentario_ia}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
          )}
        </div>
      </div>

      {/* Fixed footer */}
      <div className="flex-shrink-0 bg-card border-t border-border p-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="flex-1 h-12">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {!isConfirmed ? (
            <Button
              onClick={handleConfirmAnswer}
              disabled={!hasSelected}
              className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-background font-bold text-base"
            >
              Responder
            </Button>
          ) : currentIndex < totalQuestoes - 1 ? (
            <Button onClick={handleNext} className="flex-1 h-12 text-base">
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowFinalizarDialog(true)}
              className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-base"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Finalizar
            </Button>
          )}
        </div>
      </div>

      {/* Dialog de Saída */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do Simulado?</AlertDialogTitle>
            <AlertDialogDescription>
              Você respondeu {Object.keys(respostasConfirmadas).length} de {totalQuestoes} questões.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleExitAndSave} className="w-full bg-amber-500 hover:bg-amber-600 text-background">
              Pausar e continuar depois
            </Button>
            <Button variant="destructive" onClick={handleExitWithoutSave} className="w-full">
              Sair sem salvar
            </Button>
            <AlertDialogCancel className="w-full mt-0">Continuar simulado</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Finalização */}
      <AlertDialog open={showFinalizarDialog} onOpenChange={setShowFinalizarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Simulado?</AlertDialogTitle>
            <AlertDialogDescription>
              Você respondeu {Object.keys(respostas).length} de {totalQuestoes} questões.
              {Object.keys(respostas).length < totalQuestoes && (
                <span className="block mt-1 text-amber-500">
                  Ainda há {totalQuestoes - Object.keys(respostas).length} questões sem resposta.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalizar}>Finalizar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SimuladoConcursoResolver;
