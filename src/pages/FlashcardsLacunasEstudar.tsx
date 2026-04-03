import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ChevronLeft, ChevronRight, PenLine, CheckCircle2, XCircle, RotateCcw, Lightbulb, Clock, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ReactCardFlip from "react-card-flip";
import { getAreaHex } from "@/lib/flashcardsAreaColors";
import { playFeedbackSound } from "@/hooks/useFeedbackSound";
import ReactMarkdown from "react-markdown";

interface Lacuna {
  id: number;
  frase: string;
  palavra_correta: string;
  palavra_errada: string;
  comentario: string;
  subtema: string;
  tema: string;
}

const FlashcardsLacunasEstudar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const tema = searchParams.get("tema") || "";
  const temasParam = searchParams.get("temas") || "";

  const [lacunas, setLacunas] = useState<Lacuna[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [isShaking, setIsShaking] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [localExemplos, setLocalExemplos] = useState<Record<number, string>>({});
  const [loadingExemplo, setLoadingExemplo] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState<Record<number, string>>({});
  const [loadingHint, setLoadingHint] = useState(false);

  // Study timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!document.hidden) {
        setElapsedSeconds(s => s + 1);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const { user } = useAuth();
  const hex = getAreaHex(area);

  // Audio refs
  const flipSoundRef = useRef<HTMLAudioElement | null>(null);
  const slideSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      flipSoundRef.current = new Audio('/sounds/virar_card.mp3');
      flipSoundRef.current.volume = 0.4;
      slideSoundRef.current = new Audio('/sounds/deslize.mp3');
      slideSoundRef.current.volume = 0.3;
    } catch {}
    return () => { flipSoundRef.current = null; slideSoundRef.current = null; };
  }, []);

  const playFlip = useCallback(() => {
    try { if (flipSoundRef.current) { flipSoundRef.current.currentTime = 0; flipSoundRef.current.play().catch(() => {}); } } catch {}
  }, []);

  const playSlide = useCallback(() => {
    try { if (slideSoundRef.current) { slideSoundRef.current.currentTime = 0; slideSoundRef.current.play().catch(() => {}); } } catch {}
  }, []);

  // Load lacunas
  useEffect(() => {
    if (!area) return;
    const load = async () => {
      setIsLoading(true);
      let allData: Lacuna[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      const temasToQuery = temasParam
        ? temasParam.split(',').map(t => decodeURIComponent(t))
        : tema ? [tema] : [];

      while (hasMore) {
        let query = supabase.from('FLASHCARDS_LACUNAS').select('*').ilike('area', area);
        if (temasToQuery.length === 1) {
          query = query.ilike('tema', temasToQuery[0]);
        } else if (temasToQuery.length > 1) {
          // Use OR filter with ilike for case-insensitive multi-tema search
          const orFilter = temasToQuery.map(t => `tema.ilike.${t}`).join(',');
          query = query.or(orFilter);
        }
        const { data, error } = await query.range(offset, offset + pageSize - 1);
        if (!error && data && data.length > 0) {
          allData = [...allData, ...(data as Lacuna[])];
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      if (allData.length === 0) {
        const { toast } = await import('sonner');
        toast.error('Nenhuma lacuna encontrada para os filtros selecionados.');
      }
      setLacunas(allData.sort(() => Math.random() - 0.5));
      setIsLoading(false);
    };
    load();
  }, [area, tema, temasParam]);

  const current = lacunas[currentIndex];

  const options = useMemo(() => {
    if (!current) return [];
    const opts = [current.palavra_correta, current.palavra_errada];
    return Math.random() > 0.5 ? opts : opts.reverse();
  }, [currentIndex, current?.id]);

  // Load exemplo prático when card flips
  const loadExemplo = useCallback(async (lacuna: Lacuna) => {
    if (localExemplos[lacuna.id]) return;
    setLoadingExemplo(true);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-exemplo-flashcard', {
        body: {
          flashcard_id: lacuna.id,
          pergunta: lacuna.frase,
          resposta: lacuna.palavra_correta,
          area: area,
          tabela: 'lacunas'
        }
      });
      if (!error && data?.exemplo) {
        setLocalExemplos(prev => ({ ...prev, [lacuna.id]: data.exemplo }));
      }
    } catch (err) {
      console.error('Erro ao carregar exemplo:', err);
    } finally {
      setLoadingExemplo(false);
    }
  }, [localExemplos, area]);

  // Generate hint - short and quick, no API call
  const generateHint = useCallback((lacuna: Lacuna) => {
    if (hintText[lacuna.id]) { setShowHint(true); return; }
    setShowHint(true);
    
    // Generate a short hint from the first sentence of the comment or a generic clue
    const comentario = lacuna.comentario || '';
    const firstSentence = comentario.split(/[.!?]/)[0]?.trim();
    const hint = firstSentence && firstSentence.length > 10
      ? `💡 ${firstSentence.length > 80 ? firstSentence.substring(0, 80) + '...' : firstSentence}.`
      : `💡 A resposta está relacionada a "${lacuna.subtema || lacuna.tema}".`;
    
    setHintText(prev => ({ ...prev, [lacuna.id]: hint }));
  }, [hintText]);

  // Save progress to Supabase
  const saveProgress = useCallback(async (lacunaId: number, acertou: boolean, lacunaTema: string) => {
    if (!user) return;
    try {
      await supabase.from('lacunas_progresso' as any).upsert({
        user_id: user.id,
        lacuna_id: lacunaId,
        area,
        tema: lacunaTema,
        acertou,
        estudado_em: new Date().toISOString(),
      }, { onConflict: 'user_id,lacuna_id' });
    } catch (err) {
      console.error('Erro ao salvar progresso:', err);
    }
  }, [user, area]);

  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    setShowHint(false);
    const isCorrect = answer === current.palavra_correta;

    // Save progress
    saveProgress(current.id, isCorrect, current.tema);

    if (isCorrect) {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
      playFeedbackSound('correct');
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 600);
    } else {
      setScore(s => ({ ...s, incorrect: s.incorrect + 1 }));
      playFeedbackSound('error');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    setTimeout(() => {
      playFlip();
      setIsFlipped(true);
      loadExemplo(current);
    }, 400);
  };

  const goToNext = useCallback(() => {
    if (currentIndex >= lacunas.length - 1) return;
    playSlide();
    setDirection('right');
    setIsFlipped(false);
    setSelectedAnswer(null);
    setShowHint(false);
    setTimeout(() => {
      setCurrentIndex(i => i + 1);
    }, 50);
  }, [currentIndex, lacunas.length, playSlide]);

  const goToPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    playSlide();
    setDirection('left');
    setIsFlipped(false);
    setSelectedAnswer(null);
    setShowHint(false);
    setTimeout(() => {
      setCurrentIndex(i => i - 1);
    }, 50);
  }, [currentIndex, playSlide]);

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsFlipped(false);
    setShowHint(false);
    setScore({ correct: 0, incorrect: 0 });
    setElapsedSeconds(0);
    setLacunas(l => [...l].sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    if (!area) navigate("/flashcards/lacunas", { replace: true });
  }, [area, navigate]);

  if (!area) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'hsl(0 0% 13%)' }}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (lacunas.length === 0) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'hsl(0 0% 13%)' }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <PenLine className="w-12 h-12 text-muted-foreground/50" />
          <p className="text-muted-foreground text-center">Nenhuma lacuna disponível ainda.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </div>
    );
  }

  // Finished all
  if (currentIndex >= lacunas.length) {
    const total = score.correct + score.incorrect;
    const percent = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    return (
      <div className="flex flex-col min-h-screen" style={{ background: 'hsl(0 0% 13%)' }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <PenLine className="w-16 h-16 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Sessão concluída!</h2>
          
          {/* Time spent */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="w-4 h-4" />
            <span className="text-sm">Tempo de estudo: {formatTime(elapsedSeconds)}</span>
          </div>

          <div className="w-full max-w-xs">
            <Progress value={percent} className="h-2 bg-muted mb-2" />
            <p className="text-center text-xs text-muted-foreground">{percent}% de aproveitamento</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{score.correct}</p>
              <p className="text-xs text-muted-foreground">Acertos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{score.incorrect}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
            <Button onClick={restart} className="bg-red-700 hover:bg-red-800 text-white">
              <RotateCcw className="w-4 h-4 mr-2" /> Recomeçar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / lacunas.length) * 100;
  const isCorrect = selectedAnswer === current.palavra_correta;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'hsl(0 0% 13%)' }}>
      <div className="w-full max-w-full mx-auto px-2 sm:px-4 py-4 space-y-4 overflow-hidden">
        {/* Header - minimal */}
        <div className="flex justify-between items-center mb-2 px-1">
          <div className="text-sm text-muted-foreground">
            Lacuna {currentIndex + 1} de {lacunas.length}
          </div>
          {area && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {tema || area}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="px-1">
          <Progress value={progress} className="h-1.5 bg-muted" />
        </div>

        {/* Card with ReactCardFlip */}
        <div 
          key={`${currentIndex}-${direction}`} 
          className={`${direction === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right-card'} ${isShaking ? 'animate-shake' : ''} ${isPulsing ? 'animate-pulse-success' : ''}`}
          style={{ willChange: 'transform, opacity' }}
        >
          <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
            {/* Front - Question */}
            <div 
              className="min-h-[300px] max-h-[70vh] overflow-y-auto rounded-xl p-4 sm:p-6 flex flex-col relative break-words border border-red-800/30 shadow-2xl"
              style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(135deg, rgba(127,29,29,0.85), rgba(69,10,10,0.95))' }}
            >
              {/* Subtema badge */}
              {current.subtema && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-red-200">
                    {current.subtema}
                  </span>
                </div>
              )}

              {/* Phrase with blank */}
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-lg font-semibold text-white leading-relaxed">
                  {current.frase.split('___').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="inline-block w-24 border-b-2 mx-1 border-red-300/60" />
                      )}
                    </span>
                  ))}
                </p>
              </div>


              {/* Two options */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelectAnswer(opt)}
                    disabled={!!selectedAnswer}
                    className={`shine-effect overflow-hidden relative px-4 py-3.5 rounded-xl border text-sm font-medium transition-all shadow-lg shadow-black/30 ${
                      selectedAnswer
                        ? opt === current.palavra_correta
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : opt === selectedAnswer
                            ? 'border-red-400 bg-red-400/20 text-red-300'
                            : 'border-white/10 bg-white/5 text-white/40'
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10 active:scale-95'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Tap hint */}
              {!selectedAnswer && !showHint && (
                <p className="text-center text-xs text-white/40 mt-4">
                  Escolha a palavra correta
                </p>
              )}
            </div>

            {/* Back - Answer */}
            <div 
              className="min-h-[300px] max-h-[70vh] overflow-y-auto rounded-xl p-4 sm:p-6 flex flex-col relative break-words border shadow-2xl"
              style={{ 
                backfaceVisibility: 'hidden', 
                background: 'linear-gradient(135deg, rgba(127,29,29,0.85), rgba(69,10,10,0.95))',
                borderColor: isCorrect ? '#10b981' : '#f87171'
              }}
            >
              {/* Result badge */}
              <div className="flex items-center gap-2 mb-4">
                {isCorrect ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-bold text-lg">Correto!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-300">
                    <XCircle className="w-6 h-6" />
                    <span className="font-bold text-lg">Incorreto</span>
                  </div>
                )}
              </div>

              {/* Completed phrase */}
              <div className="flex-1">
                <p className="text-lg leading-relaxed text-white mb-4">
                  {current.frase.split('___').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className={`font-bold px-1 py-0.5 rounded ${isCorrect ? 'text-emerald-300 bg-emerald-500/20' : 'text-red-300 bg-red-500/20 line-through'}`}>
                          {selectedAnswer}
                        </span>
                      )}
                    </span>
                  ))}
                </p>

                {!isCorrect && (
                  <p className="text-emerald-400 text-sm mb-3">
                    Resposta correta: <span className="font-bold">{current.palavra_correta}</span>
                  </p>
                )}

                <div className="rounded-xl bg-black/20 border border-white/10 p-4 mt-3">
                  <p className="text-sm text-white/70 leading-relaxed">{current.comentario}</p>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <Button
                  onClick={currentIndex < lacunas.length - 1 ? goToNext : () => setCurrentIndex(lacunas.length)}
                  className="bg-red-700 hover:bg-red-800 text-white px-8 shadow-lg"
                >
                  {currentIndex < lacunas.length - 1 ? 'Próximo' : 'Ver Resultado'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </ReactCardFlip>
        </div>

        {/* Hint button - below card */}
        {!selectedAnswer && current && !isFlipped && (
          <div className="flex justify-center">
            <button
              onClick={() => generateHint(current)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-all active:scale-95"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Dica
            </button>
          </div>
        )}

        {/* Hint content - below card */}
        {showHint && !selectedAnswer && current && !isFlipped && (
          <div className="animate-fade-in rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 mx-1">
            {loadingHint && !hintText[current.id] ? (
              <div className="flex items-center gap-2 text-amber-300 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Gerando dica...</span>
              </div>
            ) : hintText[current.id] ? (
              <p className="text-xs text-amber-200/90 leading-relaxed">{hintText[current.id]}</p>
            ) : null}
          </div>
        )}

        {/* Exemplo Prático - below card, only when flipped */}
        {isFlipped && current && (
          <div className="animate-fade-in rounded-xl border border-amber-500/30 bg-card p-4 mx-1">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Exemplo Prático</span>
            </div>
            {loadingExemplo && !localExemplos[current.id] ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando exemplo...</span>
              </div>
            ) : localExemplos[current.id] ? (
              <div className="text-sm text-foreground/80 leading-relaxed prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{localExemplos[current.id]}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Exemplo não disponível</p>
            )}
          </div>
        )}

        {/* Bottom nav with stats */}
        {!isFlipped && !selectedAnswer && (
          <div className="flex items-center justify-between max-w-md mx-auto w-full px-1">
            <button
              onClick={goToPrev}
              disabled={currentIndex <= 0}
              className="p-3 rounded-full bg-red-900/60 border border-red-800/30 disabled:opacity-30 hover:bg-red-800/60 transition-all shadow-lg"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            {/* Stats in the middle-right area */}
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 text-xs font-semibold">{score.correct}✓</span>
              <span className="text-red-400 text-xs font-semibold">{score.incorrect}✗</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <button
              onClick={goToNext}
              disabled={currentIndex >= lacunas.length - 1}
              className="p-3 rounded-full bg-red-900/60 border border-red-800/30 disabled:opacity-30 hover:bg-red-800/60 transition-all shadow-lg"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsLacunasEstudar;
