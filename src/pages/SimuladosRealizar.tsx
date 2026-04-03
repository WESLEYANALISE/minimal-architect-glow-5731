import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { ChevronLeft, ChevronRight, Clock, Loader2, CheckCircle2, XCircle, Trophy, Pause, PlayCircle, BookOpen, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

interface Questao {
  id: number;
  area: string;
  enunciado: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  alternativaE?: string;
  resposta: string;
  comentario: string;
  url_audio_comentario?: string;
  numeroQuestao: number;
  questaoNarrada: string | null;
  alternativasNarradas: string | null;
}

const SimuladosRealizar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exame = searchParams.get("exame");
  const ano = searchParams.get("ano");
  const areas = searchParams.get("areas")?.split(",");
  const quantidade = parseInt(searchParams.get("quantidade") || "20");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<{ [key: number]: string }>({});
  const [showFinalizarDialog, setShowFinalizarDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [respostasConfirmadas, setRespostasConfirmadas] = useState<{ [key: number]: boolean }>({});
  const [comentarioExpandido, setComentarioExpandido] = useState<{ [key: number]: boolean }>({});
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [questoesState, setQuestoesState] = useState<Questao[]>([]);
  const [gerandoComentario, setGerandoComentario] = useState(false);
  const [isPlayingComentario, setIsPlayingComentario] = useState(false);

  const audioComentarioRef = useRef<HTMLAudioElement>(null);
  const comentarioRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const origemTJSP = searchParams.get("origem") === "tjsp";
  const areaFiltro = searchParams.get("area");

  // Build progress key for save/restore
  const progressKey = `simulado-progress-${exame || 'custom'}-${ano || '0'}${origemTJSP ? '-tjsp' : ''}`;

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

  // Save progress periodically
  useEffect(() => {
    if (questoesState.length === 0) return;
    const data = { currentIndex, respostas, respostasConfirmadas, score, tempoDecorrido };
    localStorage.setItem(progressKey, JSON.stringify(data));
  }, [currentIndex, respostas, respostasConfirmadas, score, tempoDecorrido, progressKey, questoesState.length]);

  const { data: questoes, isLoading } = useQuery({
    queryKey: ["simulado-questoes", exame, ano, areas, quantidade, origemTJSP, areaFiltro],
    queryFn: async () => {
      if (origemTJSP) {
        let query = supabase.from("SIMULADO-TJSP" as any).select("*");
        if (areaFiltro) query = query.eq('Materia', areaFiltro);
        const { data, error } = await query;
        if (error) throw error;
        return data.map((q: any) => ({
          id: q.id, area: q.area || "N/A", enunciado: q.enunciado || "",
          alternativaA: q.alternativa_a || "", alternativaB: q.alternativa_b || "",
          alternativaC: q.alternativa_c || "", alternativaD: q.alternativa_d || "",
          alternativaE: q.alternativa_e || "", resposta: q.resposta || "",
          comentario: q.comentario || "", url_audio_comentario: q.url_audio_comentario || null,
          numeroQuestao: q.numero_questao || 0,
          questaoNarrada: q.questao_narrada || null, alternativasNarradas: q.alternativas_narradas || null,
        }));
      }

      let query = supabase.from("SIMULADO-OAB" as any).select("*");
      if (exame && ano) {
        query = query.eq("Exame", exame).eq("Ano", parseInt(ano));
      } else if (areas && areas.length > 0) {
        query = query.in("area", areas).limit(quantidade);
      }
      const { data, error } = await query as any;
      if (error) throw error;
      return data
        .map((q: any) => ({
          id: q.id, area: q.area || "N/A", enunciado: q["Enunciado"] || "",
          alternativaA: q["Alternativa A"] || "", alternativaB: q["Alternativa B"] || "",
          alternativaC: q["Alternativa C"] || "", alternativaD: q["Alternativa D"] || "",
          resposta: q.resposta || "", comentario: q.comentario || "",
          url_audio_comentario: q.url_audio_comentario || null,
          numeroQuestao: q["Numero da questao"] || 0,
          questaoNarrada: q["Questao Narrada"] || null, alternativasNarradas: q["Alternativas Narradas"] || null,
        }))
        .filter((q: any) => q.enunciado && q.alternativaA);
    },
  });

  useEffect(() => {
    if (questoes && questoes.length > 0) setQuestoesState(questoes);
  }, [questoes]);

  // Beep sonoro
  const playFeedbackSound = (type: 'correct' | 'error'): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) { resolve(); return; }
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        if (type === 'correct') {
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08);
          oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16);
        } else {
          oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(262, audioContext.currentTime + 0.12);
        }
        gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.25);
        setTimeout(() => { audioContext.close(); resolve(); }, 300);
      } catch { resolve(); }
    });
  };

  const scrollToComentario = () => {
    setTimeout(() => {
      comentarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // Select answer (just select, don't confirm)
  const handleSelectAnswer = (alternativa: string) => {
    if (!questoesState) return;
    const questaoAtual = questoesState[currentIndex];
    if (questaoAtual.resposta?.toLowerCase() === 'anulada') return;
    if (respostasConfirmadas[currentIndex]) return;
    setRespostas(prev => ({ ...prev, [currentIndex]: alternativa }));
  };

  // Confirm answer
  const handleConfirmAnswer = async () => {
    if (!questoesState || !respostas[currentIndex]) return;
    const questaoAtual = questoesState[currentIndex];
    if (respostasConfirmadas[currentIndex]) return;

    const acertou = respostas[currentIndex] === questaoAtual.resposta;

    setRespostasConfirmadas(prev => ({ ...prev, [currentIndex]: true }));
    setScore(prev => ({
      correct: prev.correct + (acertou ? 1 : 0),
      wrong: prev.wrong + (acertou ? 0 : 1)
    }));

    await playFeedbackSound(acertou ? 'correct' : 'error');
    scrollToComentario();

    if (!questaoAtual.comentario || !questaoAtual.url_audio_comentario) {
      gerarComentario();
    }
  };

  const gerarComentario = async () => {
    if (!questoesState || gerandoComentario) return;
    const questaoAtual = questoesState[currentIndex];
    setGerandoComentario(true);
    try {
      const alternativas = [
        { letra: 'A', texto: questaoAtual.alternativaA },
        { letra: 'B', texto: questaoAtual.alternativaB },
        { letra: 'C', texto: questaoAtual.alternativaC },
        { letra: 'D', texto: questaoAtual.alternativaD },
      ];
      const { data, error } = await supabase.functions.invoke('gerar-comentario-oab', {
        body: {
          questaoId: questaoAtual.id, enunciado: questaoAtual.enunciado,
          alternativas, resposta_correta: questaoAtual.resposta, area: questaoAtual.area
        }
      });
      if (error) throw error;
      setQuestoesState(prev => prev.map(q =>
        q.id === questaoAtual.id
          ? { ...q, comentario: data.comentario, url_audio_comentario: data.url_audio }
          : q
      ));
    } catch (err) {
      console.error('Erro ao gerar comentário:', err);
    } finally {
      setGerandoComentario(false);
    }
  };

  const handleNext = () => {
    audioComentarioRef.current?.pause();
    setIsPlayingComentario(false);
    setComentarioExpandido({});
    if (currentIndex < questoesState.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    audioComentarioRef.current?.pause();
    setIsPlayingComentario(false);
    setComentarioExpandido({});
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Scroll to top on question change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex]);

  const handleBack = () => {
    setShowExitDialog(true);
  };

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
    if (!questoesState) return;
    let acertos = 0;
    let respostasParaResultado: { [key: number]: string } = {};
    questoesState.forEach((questao, index) => {
      if (respostas[index]) {
        respostasParaResultado[index] = respostas[index];
        if (respostas[index] === questao.resposta) acertos++;
      }
    });
    const resultadoData = {
      respostas: respostasParaResultado,
      acertos, total: questoesState.length, tempoDecorrido,
      questoes: questoesState.map(q => ({
        id: q.id, area: q.area, enunciado: q.enunciado,
        alternativaA: q.alternativaA, alternativaB: q.alternativaB,
        alternativaC: q.alternativaC, alternativaD: q.alternativaD,
        resposta: q.resposta, comentario: q.comentario,
        url_audio_comentario: q.url_audio_comentario,
      })),
    };
    localStorage.removeItem(progressKey);
    sessionStorage.setItem('simuladoResultado', JSON.stringify(resultadoData));
    navigate('/simulados/resultado');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando questões...</p>
        </div>
      </div>
    );
  }

  if (!questoesState || questoesState.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <p className="text-muted-foreground mb-4">Nenhuma questão encontrada</p>
        <Button onClick={() => navigate(origemTJSP ? '/simulados/tjsp' : '/oab')}>Voltar</Button>
      </div>
    );
  }

  const questaoAtual = questoesState[currentIndex];
  const alternativas = [
    { letra: "A", texto: questaoAtual.alternativaA },
    { letra: "B", texto: questaoAtual.alternativaB },
    { letra: "C", texto: questaoAtual.alternativaC },
    { letra: "D", texto: questaoAtual.alternativaD },
  ];
  if (questaoAtual.alternativaE) {
    alternativas.push({ letra: "E", texto: questaoAtual.alternativaE });
  }

  const progresso = ((currentIndex + 1) / questoesState.length) * 100;
  const isQuestaoAnulada = questaoAtual.resposta?.toLowerCase() === 'anulada';
  const isConfirmed = respostasConfirmadas[currentIndex];
  const isCorrect = respostas[currentIndex] === questaoAtual.resposta;
  const hasSelected = !!respostas[currentIndex];

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      <audio ref={audioComentarioRef} onEnded={() => setIsPlayingComentario(false)} onPause={() => setIsPlayingComentario(false)} />

      {/* Header fixo */}
      <div className="flex-shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={handleBack} className="flex items-center gap-1 text-xs text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
            <div className="leading-none">
              <span className="text-[10px] uppercase text-muted-foreground">Voltar</span>
              <span className="block text-xs font-semibold text-foreground">Simulados</span>
            </div>
          </button>
          <span className="text-sm font-medium text-foreground">Simulados</span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {String(currentIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-sm text-muted-foreground">
              de {questoesState.length}
            </span>
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

        {questaoAtual.area && questaoAtual.area !== 'N/A' && !isQuestaoAnulada && (
          <div className="inline-block bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded-full mb-2">
            {questaoAtual.area}
          </div>
        )}

        <Progress value={progresso} className="h-1.5 bg-muted [&>div]:bg-emerald-500" />
      </div>

      {/* Conteúdo scrollável */}
      <div ref={contentRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-4 pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={cn(isQuestaoAnulada && "opacity-50")}
            >
              {/* Questão Anulada */}
              {isQuestaoAnulada && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-500 text-sm font-medium">
                    ⚠️ Esta questão foi ANULADA pela banca examinadora
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pule para a próxima questão.
                  </p>
                </div>
              )}

              {/* Enunciado - sem botão de narração */}
              <div className="bg-card rounded-xl p-4 border mb-4">
                <p className="text-sm leading-relaxed">{questaoAtual.enunciado}</p>
              </div>

              {/* Alternativas */}
              {!isQuestaoAnulada && (
                <div className="space-y-2">
                  {alternativas.map((alt, index) => {
                    const isSelected = respostas[currentIndex] === alt.letra;
                    const isCorrectAnswer = alt.letra === questaoAtual.resposta;
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

                    return (
                      <motion.button
                        key={alt.letra}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.2 }}
                        onClick={() => handleSelectAnswer(alt.letra)}
                        disabled={isConfirmed || isQuestaoAnulada}
                        className={cn(
                          "w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
                          bgClass,
                          borderClass,
                          !isConfirmed && !isQuestaoAnulada && "active:scale-[0.98]"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0",
                          showCorrectAnswer
                            ? "bg-emerald-500 text-white"
                            : showWrongAnswer
                            ? "bg-destructive text-white"
                            : "bg-muted"
                        )}>
                          {showCorrectAnswer ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : showWrongAnswer ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            alt.letra
                          )}
                        </div>
                        <span className={cn("text-sm flex-1 pt-1", isSelected && "font-medium")}>
                          {alt.texto}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Feedback + Comentário */}
              {isConfirmed && (
                <motion.div
                  ref={comentarioRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-3"
                >
                  <div className="p-4 rounded-xl border bg-card border-border">
                    <div className="flex items-center gap-2 mb-1">
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
                            Incorreta. Correta: {questaoAtual.resposta}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {!comentarioExpandido[currentIndex] && (
                    <Button
                      onClick={() => {
                        setComentarioExpandido({ ...comentarioExpandido, [currentIndex]: true });
                        setTimeout(() => comentarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                      }}
                      variant="outline"
                      className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      disabled={gerandoComentario && !questaoAtual.comentario}
                    >
                      {gerandoComentario && !questaoAtual.comentario ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando comentário...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Ver Comentário
                        </>
                      )}
                    </Button>
                  )}

                  <AnimatePresence>
                    {comentarioExpandido[currentIndex] && questaoAtual.comentario && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-blue-400 flex items-center gap-2 text-sm">
                              <BookOpen className="w-4 h-4" />
                              Comentário
                            </h4>
                            <div className="flex items-center gap-2">
                              {questaoAtual.url_audio_comentario && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (isPlayingComentario) {
                                      audioComentarioRef.current?.pause();
                                      setIsPlayingComentario(false);
                                    } else if (audioComentarioRef.current && questaoAtual.url_audio_comentario) {
                                      audioComentarioRef.current.src = questaoAtual.url_audio_comentario;
                                      audioComentarioRef.current.play();
                                      setIsPlayingComentario(true);
                                    }
                                  }}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  {isPlayingComentario ? <Pause className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setComentarioExpandido({ ...comentarioExpandido, [currentIndex]: false })}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <ChevronDown className="w-4 h-4 rotate-180" />
                              </Button>
                            </div>
                          </div>
                          <div className="prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="text-blue-300 font-semibold">{children}</strong>,
                                em: ({ children }) => <em className="text-blue-200">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-sm">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 text-sm">{children}</ol>,
                                li: ({ children }) => <li className="text-sm">{children}</li>,
                              }}
                            >
                              {questaoAtual.comentario}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer fixo - sempre visível */}
      <div className="flex-shrink-0 p-3 border-t border-border/50 bg-card" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center gap-2">
          {/* Anterior */}
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 h-11"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {/* Responder / Finalizar */}
          {isQuestaoAnulada ? (
            <Button onClick={handleNext} className="flex-1 h-11">
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : !isConfirmed ? (
            <Button
              onClick={handleConfirmAnswer}
              disabled={!hasSelected}
              className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-background font-bold"
            >
              Responder
            </Button>
          ) : currentIndex < questoesState.length - 1 ? (
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

          {/* Próximo */}
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex >= questoesState.length - 1}
            className="flex-1 h-11"
          >
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
              Você respondeu {Object.keys(respostasConfirmadas).length} de {questoesState.length} questões.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleExitAndSave}
              className="w-full bg-amber-500 hover:bg-amber-600 text-background"
            >
              Pausar e continuar depois
            </Button>
            <Button
              variant="destructive"
              onClick={handleExitWithoutSave}
              className="w-full"
            >
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
              Você respondeu {Object.keys(respostas).length} de {questoesState.length} questões.
              {Object.keys(respostas).length < questoesState.length && (
                <span className="block mt-1 text-amber-500">
                  Ainda há {questoesState.length - Object.keys(respostas).length} questões sem resposta.
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

export default SimuladosRealizar;
