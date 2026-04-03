import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSimuladoFreeLimit } from "@/hooks/useSimuladoFreeLimit";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, Trophy, BookOpen, FileText } from "lucide-react";
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

interface QuestaoEscrevente {
  id: number;
  Questao: number;
  Enunciado: string;
  "Alternativa A": string;
  "Alternativa B": string;
  "Alternativa C": string;
  "Alternativa D": string;
  "Alternativa E": string;
  Gabarito: string;
  Materia: string;
  Ano: number;
  Cargo: string;
  Banca: string;
  Orgao: string;
  Nivel: string;
  "Texto Português": string | null;
  Imagem: string | null;
}

const SimuladoEscreventeResolver = () => {
  const navigate = useNavigate();
  const { ano } = useParams();
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

  const progressKey = `simulado-progress-escrevente-${ano}`;

  // Timer
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

  // Load saved progress
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

  // Buscar questões do ano selecionado
  const { data: questoes, isLoading } = useQuery({
    queryKey: ["simulado-escrevente-questoes", ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-ESCREVENTE" as any)
        .select("*")
        .eq("Ano", parseInt(ano || "0"))
        .order("Questao", { ascending: true });

      if (error) throw error;
      return data as unknown as QuestaoEscrevente[];
    },
    enabled: !!ano,
  });

  // Save progress
  useEffect(() => {
    if (!questoes || questoes.length === 0) return;
    const data = { currentIndex, respostas, respostasConfirmadas, score, tempoDecorrido };
    localStorage.setItem(progressKey, JSON.stringify(data));
  }, [currentIndex, respostas, respostasConfirmadas, score, tempoDecorrido, progressKey, questoes]);

  // Scroll to top on question change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setAbaAtiva("questao");
  }, [currentIndex]);

  const totalQuestoes = questoes?.length || 0;
  const questaoAtualData = questoes?.[currentIndex];
  const progresso = totalQuestoes > 0 ? ((currentIndex + 1) / totalQuestoes) * 100 : 0;
  const isConfirmed = respostasConfirmadas[currentIndex];
  const hasSelected = !!respostas[currentIndex];

  const temTextoBase = useMemo(() => {
    return questaoAtualData?.["Texto Português"] && questaoAtualData["Texto Português"].trim().length > 0;
  }, [questaoAtualData]);

  // Processar enunciado para [IMAGEM]
  const processarTextoComImagem = useCallback((texto: string, imagemUrl: string | null) => {
    if (!texto) return { texto: "", temImagem: false };
    const temImagem = /\[IMAGEM\]/gi.test(texto);
    if (temImagem && imagemUrl) {
      return { partes: texto.split(/\[IMAGEM\]/gi), imagemUrl, temImagem: true };
    }
    return { texto, temImagem: false };
  }, []);

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
    navigate(`/ferramentas/simulados/escrevente/${ano}/resultado`, {
      state: { acertos, total: totalQuestoes, tempo: tempoDecorrido, respostas, ano },
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
        <p className="text-muted-foreground">Nenhuma questão encontrada para {ano}</p>
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

  const enunciadoProcessado = processarTextoComImagem(questaoAtualData.Enunciado, questaoAtualData.Imagem);

  const renderizarTextoComImagem = (processado: any, className?: string) => {
    if (processado.temImagem && processado.partes) {
      return (
        <div className={className}>
          {processado.partes.map((parte: string, idx: number) => (
            <span key={idx}>
              <span className="whitespace-pre-wrap">{parte}</span>
              {idx < processado.partes.length - 1 && processado.imagemUrl && (
                <div className="my-4">
                  <img src={processado.imagemUrl} alt="Imagem da questão" className="max-w-full rounded-lg border border-border/50" />
                </div>
              )}
            </span>
          ))}
        </div>
      );
    }
    return <div className={cn("whitespace-pre-wrap", className)}>{processado.texto || ""}</div>;
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header fixo */}
      <div className="flex-shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={handleBack} className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
            <div className="leading-none">
              <span className="text-[10px] uppercase text-muted-foreground">Sair</span>
              <span className="block text-xs font-semibold text-foreground">Simulado</span>
            </div>
          </button>
          <span className="text-sm font-medium text-foreground">{ano}</span>
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

        <div className="flex flex-wrap items-center gap-2 mb-2">
          {questaoAtualData.Materia && (
            <span className="inline-block bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
              {questaoAtualData.Materia}
            </span>
          )}
        </div>

        {/* Toggle Questão / Ver Texto */}
        {temTextoBase && (
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 mb-2">
            <button
              onClick={() => setAbaAtiva("questao")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                abaAtiva === "questao"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Questão
            </button>
            <button
              onClick={() => setAbaAtiva("texto")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                abaAtiva === "texto"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-3 h-3" />
              Ver Texto
            </button>
          </div>
        )}


        <Progress value={progresso} className="h-1.5 bg-muted [&>div]:bg-emerald-500" />
      </div>

      {/* Conteúdo scrollável */}
      <div ref={contentRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-4 pb-4">
          {/* Texto Base */}
          {temTextoBase && abaAtiva === "texto" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-xl p-4 border border-amber-500/20"
            >
              <h4 className="font-semibold text-sm text-amber-400 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Texto para as questões
              </h4>
              <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert">
                {(questaoAtualData["Texto Português"] || "").split("\n\n").map((p: string, idx: number) => (
                  <p key={idx} className="mb-3 text-foreground/90">{p}</p>
                ))}
              </div>
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
                <div className="bg-card rounded-xl p-4 border mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Questão {questaoAtualData.Questao}
                  </p>
                  {renderizarTextoComImagem(enunciadoProcessado, "text-sm leading-relaxed")}
                </div>

                {/* Alternativas */}
                <div className="space-y-2">
                  {alternativas.map((alt, index) => {
                    const isSelected = respostas[currentIndex]?.toUpperCase() === alt.letra;
                    const isCorrectAnswer = alt.letra === respostaCorreta;
                    const showCorrectAnswer = isConfirmed && isCorrectAnswer;
                    const showWrongAnswer = isConfirmed && isSelected && !isCorrectAnswer;

                    let bgClass = "bg-card hover:bg-accent";
                    let borderClass = "border-border";

                    if (isConfirmed) {
                      if (isCorrectAnswer) {
                        bgClass = "bg-emerald-500/10";
                        borderClass = "border-emerald-500";
                      } else if (isSelected && !isCorrectAnswer) {
                        bgClass = "bg-destructive/10";
                        borderClass = "border-destructive";
                      }
                    } else if (isSelected) {
                      bgClass = "bg-primary/10";
                      borderClass = "border-primary";
                    }

                    const altProcessada = processarTextoComImagem(alt.texto, questaoAtualData.Imagem);

                    return (
                      <motion.button
                        key={alt.letra}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.2 }}
                        onClick={() => handleSelectAnswer(alt.letra)}
                        disabled={isConfirmed}
                        className={cn(
                          "w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
                          bgClass,
                          borderClass,
                          !isConfirmed && "active:scale-[0.98]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0",
                            showCorrectAnswer
                              ? "bg-emerald-500 text-white"
                              : showWrongAnswer
                              ? "bg-destructive text-white"
                              : "bg-muted"
                          )}
                        >
                          {showCorrectAnswer ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : showWrongAnswer ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            alt.letra
                          )}
                        </div>
                        <span className={cn("text-sm flex-1 pt-1", isSelected && "font-medium")}>
                          {renderizarTextoComImagem(altProcessada)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {isConfirmed && (
                  <motion.div
                    ref={comentarioRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <div className="p-4 rounded-xl border bg-card border-border">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <span className="font-semibold text-sm">
                          {isCorrect ? (
                            <span className="text-emerald-500">Resposta correta!</span>
                          ) : (
                            <span className="text-destructive">
                              Incorreta. Correta: {respostaCorreta}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer fixo */}
      <div className="flex-shrink-0 p-3 border-t border-border/50 bg-card" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0} className="flex-1 h-11">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {!isConfirmed ? (
            <Button
              onClick={handleConfirmAnswer}
              disabled={!hasSelected}
              className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-background font-bold"
            >
              Responder
            </Button>
          ) : currentIndex < totalQuestoes - 1 ? (
            <Button onClick={handleNext} className="flex-1 h-11">
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowFinalizarDialog(true)}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Finalizar
            </Button>
          )}

          <Button variant="outline" onClick={handleNext} disabled={currentIndex >= totalQuestoes - 1} className="flex-1 h-11">
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
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

export default SimuladoEscreventeResolver;