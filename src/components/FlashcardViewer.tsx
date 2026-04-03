import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import ReactCardFlip from "react-card-flip";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle2, RotateCw, Loader2, Lightbulb, ChevronDown, Share2, BarChart3, Clock, Trophy } from "lucide-react";
import { playFeedbackSound } from "@/hooks/useFeedbackSound";
import { useNarrationPlayer } from "@/contexts/NarrationPlayerContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { getAreaHex } from "@/lib/flashcardsAreaColors";
import { useFlashcardStudyProgress, useAreaStudyStats } from "@/hooks/useFlashcardStudyProgress";
import { useSpacedRepetition, type SM2Quality } from "@/hooks/useSpacedRepetition";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

interface Flashcard {
  id?: number;
  front: string;
  back: string;
  exemplo?: string;
  base_legal?: string;
  url_imagem_exemplo?: string;
  url_audio_exemplo?: string;
  "audio-pergunta"?: string;
  "audio-resposta"?: string;
  tema?: string;
  subtema?: string;
}

export type StudyMode = 'imersao' | 'guiado' | 'leitura';

export interface FlashcardSettings {
  autoNarration: boolean;
  showExamples: boolean;
  studyMode?: StudyMode;
}

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  tema?: string;
  area?: string;
  settings?: FlashcardSettings;
  tabela?: 'gerados' | 'artigos-lei';
  codigoNome?: string;
  numeroArtigo?: string;
}

const defaultSettings: FlashcardSettings = {
  autoNarration: true,
  showExamples: true,
};

export const FlashcardViewer = memo(({
  flashcards,
  tema,
  area,
  settings = defaultSettings,
  tabela = 'gerados',
  codigoNome,
  numeroArtigo,
}: FlashcardViewerProps) => {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { saveProgress, resetProgress } = useFlashcardStudyProgress();
  const { registrarRevisao } = useSpacedRepetition();
  const { data: areaStudyData } = useAreaStudyStats(area || '');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showStatsSheet, setShowStatsSheet] = useState(false);
  const [sessionStats, setSessionStats] = useState<Record<number, 'compreendi' | 'revisar'>>({});
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingExampleAudio, setIsGeneratingExampleAudio] = useState(false);
  const [isPlayingExampleAudio, setIsPlayingExampleAudio] = useState(false);
  const [localImageUrls, setLocalImageUrls] = useState<Record<number, string>>({});
  const [localAudioUrls, setLocalAudioUrls] = useState<Record<string, string>>({});
  const [localExampleAudioUrls, setLocalExampleAudioUrls] = useState<Record<number, string>>({});
  const [localBaseLegal, setLocalBaseLegal] = useState<Record<number, string>>({});
  const [localExemplos, setLocalExemplos] = useState<Record<number, string>>({});
  const [isGeneratingBaseLegal, setIsGeneratingBaseLegal] = useState(false);
  const [isGeneratingExemplo, setIsGeneratingExemplo] = useState(false);
  const [isBaseLegalOpen, setIsBaseLegalOpen] = useState(false);
  const [narrationEnabled, setNarrationEnabled] = useState(settings.autoNarration);
  const [showCompletion, setShowCompletion] = useState(false);

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
  const [audioProgress, setAudioProgress] = useState(0);
  const [exampleAudioProgress, setExampleAudioProgress] = useState(0);
  const [isPreGenerating, setIsPreGenerating] = useState(false);
  const [preGeneratedCards, setPreGeneratedCards] = useState<Set<number>>(new Set());
  const { playNarration, stopNarration } = useNarrationPlayer();
  const hasGeneratedImageRef = useRef<Record<number, boolean>>({});
  const hasGeneratedBaseLegalRef = useRef<Record<number, boolean>>({});
  const hasGeneratedExemploRef = useRef<Record<number, boolean>>({});
  const hasStartedPreGeneration = useRef(false);
  const currentAudioTypeRef = useRef<'pergunta' | 'resposta' | 'exemplo' | null>(null);
  const exampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const isFlippedRef = useRef(isFlipped);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isFlippedRef.current = isFlipped;
  }, [isFlipped]);

  const stopAllAudio = useCallback(() => {
    if (mainAudioRef.current) {
      mainAudioRef.current.onended = null;
      mainAudioRef.current.onerror = null;
      mainAudioRef.current.ontimeupdate = null;
      mainAudioRef.current.pause();
      mainAudioRef.current.currentTime = 0;
      mainAudioRef.current = null;
    }
    if (exampleAudioRef.current) {
      exampleAudioRef.current.onended = null;
      exampleAudioRef.current.onerror = null;
      exampleAudioRef.current.ontimeupdate = null;
      exampleAudioRef.current.pause();
      exampleAudioRef.current.currentTime = 0;
      exampleAudioRef.current = null;
    }
    stopNarration();
    setIsPlayingAudio(false);
    setIsPlayingExampleAudio(false);
    setAudioProgress(0);
    setExampleAudioProgress(0);
    currentAudioTypeRef.current = null;
  }, [stopNarration]);

  const stopAllAudioRef = useRef(stopAllAudio);
  stopAllAudioRef.current = stopAllAudio;

  useEffect(() => {
    return () => {
      stopAllAudioRef.current();
    };
  }, []);

  const playAudio = async (url: string, tipo: 'pergunta' | 'resposta' | 'exemplo', onEnded?: () => void, expectedIndex?: number, expectedFlipped?: boolean) => {
    if (!url || !narrationEnabled) return;
    
    const capturedIndex = expectedIndex ?? currentIndexRef.current;
    const capturedFlipped = expectedFlipped ?? isFlippedRef.current;
    
    stopAllAudio();
    
    if (tipo === 'exemplo') {
      setExampleAudioProgress(0);
    } else {
      setAudioProgress(0);
    }
    
    currentAudioTypeRef.current = tipo;
    
    const audio = new Audio(url);
    
    if (tipo === 'exemplo') {
      exampleAudioRef.current = audio;
      setIsPlayingExampleAudio(true);
    } else {
      mainAudioRef.current = audio;
      setIsPlayingAudio(true);
    }
    
    audio.ontimeupdate = () => {
      if (audio.duration > 0) {
        const progress = (audio.currentTime / audio.duration) * 100;
        if (tipo === 'exemplo') {
          setExampleAudioProgress(progress);
        } else {
          setAudioProgress(progress);
        }
      }
    };
    
    audio.onended = () => {
      if (tipo === 'exemplo') {
        setIsPlayingExampleAudio(false);
        setExampleAudioProgress(0);
        exampleAudioRef.current = null;
      } else {
        setIsPlayingAudio(false);
        setAudioProgress(0);
        mainAudioRef.current = null;
      }
      currentAudioTypeRef.current = null;
      
      if (onEnded && currentIndexRef.current === capturedIndex && isFlippedRef.current === capturedFlipped) {
        onEnded();
      }
    };
    audio.onerror = () => {
      if (tipo === 'exemplo') {
        setIsPlayingExampleAudio(false);
        setExampleAudioProgress(0);
        exampleAudioRef.current = null;
      } else {
        setIsPlayingAudio(false);
        setAudioProgress(0);
        mainAudioRef.current = null;
      }
      currentAudioTypeRef.current = null;
    };
    
    try {
      await playNarration(audio);
    } catch (error) {
      try {
        await audio.play();
      } catch (playError) {
        if (tipo === 'exemplo') {
          setIsPlayingExampleAudio(false);
          setExampleAudioProgress(0);
          exampleAudioRef.current = null;
        } else {
          setIsPlayingAudio(false);
          setAudioProgress(0);
          mainAudioRef.current = null;
        }
        currentAudioTypeRef.current = null;
      }
    }
  };

  const generateAudioSilent = async (flashcardId: number, tipo: 'pergunta' | 'resposta', texto: string) => {
    return null;
  };

  const generateAudio = async (flashcardId: number, tipo: 'pergunta' | 'resposta', texto: string) => {
    return null;
  };

  const generateExampleAudio = async (flashcardId: number, texto: string) => {
    return null;
  };

  const playExampleAudio = async () => {
    console.log('🔇 Reprodução de áudio desativada temporariamente');
    return;
  };

  const generateImage = async (flashcardId: number, exemplo: string) => {
    if (hasGeneratedImageRef.current[flashcardId]) return;
    if (localImageUrls[flashcardId]) return;
    
    hasGeneratedImageRef.current[flashcardId] = true;
    setIsGeneratingImage(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("gerar-imagem-flashcard", {
        body: { 
          flashcard_id: flashcardId, 
          exemplo,
          tabela: tabela === 'artigos-lei' ? 'artigos-lei' : undefined
        }
      });

      if (error) throw error;

      if (data?.url) {
        setLocalImageUrls(prev => ({
          ...prev,
          [flashcardId]: data.url
        }));
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      hasGeneratedImageRef.current[flashcardId] = false;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateBaseLegal = async (flashcardId: number, pergunta: string, resposta: string) => {
    if (hasGeneratedBaseLegalRef.current[flashcardId]) return;
    if (localBaseLegal[flashcardId]) return;
    
    hasGeneratedBaseLegalRef.current[flashcardId] = true;
    setIsGeneratingBaseLegal(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("gerar-base-legal", {
        body: { 
          flashcard_id: flashcardId, 
          pergunta,
          resposta,
          tabela: tabela === 'artigos-lei' ? 'artigos-lei' : undefined,
          area: area
        }
      });

      if (error) throw error;

      if (data?.base_legal) {
        setLocalBaseLegal(prev => ({
          ...prev,
          [flashcardId]: data.base_legal
        }));
      }
    } catch (error) {
      console.error("Erro ao gerar base legal:", error);
      hasGeneratedBaseLegalRef.current[flashcardId] = false;
    } finally {
      setIsGeneratingBaseLegal(false);
    }
  };

  const generateExemplo = async (flashcardId: number, pergunta: string, resposta: string, area?: string) => {
    if (hasGeneratedExemploRef.current[flashcardId]) return;
    if (localExemplos[flashcardId]) return;
    
    hasGeneratedExemploRef.current[flashcardId] = true;
    setIsGeneratingExemplo(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("gerar-exemplo-flashcard", {
        body: { 
          flashcard_id: flashcardId, 
          pergunta,
          resposta,
          area,
          tabela: tabela === 'artigos-lei' ? 'artigos-lei' : undefined
        }
      });

      if (error) throw error;

      if (data?.exemplo) {
        setLocalExemplos(prev => ({
          ...prev,
          [flashcardId]: data.exemplo
        }));
      }
    } catch (error) {
      console.error("Erro ao gerar exemplo:", error);
      hasGeneratedExemploRef.current[flashcardId] = false;
    } finally {
      setIsGeneratingExemplo(false);
    }
  };

  const preGenerateAllCards = async () => {
    console.log('🔇 Pré-geração de áudio desativada temporariamente');
    return;
  };

  const generateExampleAudioSilent = async (flashcardId: number, texto: string) => {
    return null;
  };

  useEffect(() => {
    if (flashcards.length > 0 && !hasStartedPreGeneration.current) {
      const timer = setTimeout(() => {
        preGenerateAllCards();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [flashcards]);

  useEffect(() => {
    if (!isFlipped || !settings.showExamples) return;
    
    const currentCard = flashcards[currentIndex];
    if (!currentCard.id) return;

    const exemplo = localExemplos[currentCard.id] || currentCard.exemplo;
    
    if (!exemplo) {
      generateExemplo(currentCard.id, currentCard.front, currentCard.back);
      return;
    }
    
    const imageUrl = localImageUrls[currentCard.id] || currentCard.url_imagem_exemplo;
    if (imageUrl) return;
    
    generateImage(currentCard.id, exemplo);
  }, [isFlipped, currentIndex, settings.showExamples, localExemplos]);

  // Preload sounds for instant playback
  const slideSoundRef = useRef<HTMLAudioElement | null>(null);
  const flipSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const slide = new Audio('/sounds/deslize.mp3');
    slide.volume = 0.3;
    slide.preload = 'auto';
    slideSoundRef.current = slide;

    const flip = new Audio('/sounds/virar_card.mp3');
    flip.volume = 0.3;
    flip.preload = 'auto';
    flipSoundRef.current = flip;

    return () => {
      slideSoundRef.current = null;
      flipSoundRef.current = null;
    };
  }, []);

  const playSlideSound = useCallback(() => {
    try {
      if (slideSoundRef.current) {
        slideSoundRef.current.currentTime = 0;
        slideSoundRef.current.play().catch(() => {});
      }
    } catch {}
  }, []);

  const playFlipSound = useCallback(() => {
    try {
      if (flipSoundRef.current) {
        flipSoundRef.current.currentTime = 0;
        flipSoundRef.current.play().catch(() => {});
      }
    } catch {}
  }, []);

  const handleNext = useCallback(() => {
    stopAllAudio();
    playSlideSound();
    setIsFlipped(false);
    setDirection('right');
    setCurrentIndex(prev => (prev + 1) % flashcards.length);
  }, [flashcards.length, stopAllAudio, playSlideSound]);

  const handlePrevious = useCallback(() => {
    stopAllAudio();
    playSlideSound();
    setIsFlipped(false);
    setDirection('left');
    setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
  }, [flashcards.length, stopAllAudio, playSlideSound]);

  const handleFlip = useCallback(() => {
    stopAllAudio();
    playFlipSound();
    setIsFlipped(prev => !prev);
    setIsBaseLegalOpen(false);
  }, [stopAllAudio, playFlipSound]);

  const handleShare = useCallback(() => {
    const currentCard = flashcards[currentIndex];
    const currentExemplo = currentCard.id 
      ? (localExemplos[currentCard.id] || currentCard.exemplo) 
      : currentCard.exemplo;
    
    const codigoInfo = codigoNome && numeroArtigo ? `*${codigoNome} - Art. ${numeroArtigo}*\n\n` : '';
    const perguntaText = `📝 *Pergunta:*\n${currentCard.front}\n\n`;
    const respostaText = `✅ *Resposta:*\n${currentCard.back}\n\n`;
    const exemploText = currentExemplo ? `💡 *Exemplo Prático:*\n${currentExemplo}\n\n` : '';
    const footer = `_Estudando com o App Direito_ 📚`;
    
    const message = encodeURIComponent(`${codigoInfo}${perguntaText}${respostaText}${exemploText}${footer}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }, [flashcards, currentIndex, localExemplos, codigoNome, numeroArtigo]);

  if (flashcards.length === 0) return null;
  
  const currentCard = flashcards[currentIndex];
  
  const imageUrl = currentCard.id 
    ? localImageUrls[currentCard.id] || currentCard.url_imagem_exemplo 
    : currentCard.url_imagem_exemplo;

  const currentExemplo = currentCard.id 
    ? (localExemplos[currentCard.id] || currentCard.exemplo) 
    : currentCard.exemplo;

  // Completion screen
  const totalAnswered = Object.keys(sessionStats).length;
  const totalCompreendi = Object.values(sessionStats).filter(s => s === 'compreendi').length;
  const totalRevisar = Object.values(sessionStats).filter(s => s === 'revisar').length;

  if (showCompletion || totalAnswered >= flashcards.length) {
    const percent = totalAnswered > 0 ? Math.round((totalCompreendi / totalAnswered) * 100) : 0;
    return (
      <div className="w-full max-w-full mx-auto px-2 sm:px-4 py-8 space-y-6 overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <Trophy className="w-16 h-16 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Sessão concluída!</h2>
          
          <div className="flex items-center gap-2 text-white/60">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Tempo de estudo: {formatTime(elapsedSeconds)}</span>
          </div>

          <div className="w-full max-w-xs">
            <Progress value={percent} className="h-2 bg-muted mb-2" />
            <p className="text-center text-xs text-muted-foreground">{percent}% de aproveitamento</p>
          </div>

          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{totalCompreendi}</p>
              <p className="text-xs text-muted-foreground">Compreendi</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{totalRevisar}</p>
              <p className="text-xs text-muted-foreground">Revisar</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setSessionStats({});
                setElapsedSeconds(0);
                setShowCompletion(false);
                setIsFlipped(false);
              }}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Recomeçar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto px-2 sm:px-4 py-4 space-y-4 overflow-hidden">
      {/* Header com área, contador e timer */}
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">
            {currentIndex + 1}/{flashcards.length}
          </span>
          <span className="flex items-center gap-1 text-xs text-white/40">
            <Clock className="w-3 h-3" />
            {formatTime(elapsedSeconds)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowStatsSheet(true)}
          >
            <BarChart3 className="w-4 h-4 text-white/50" />
          </Button>
          {area && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-red-200">
              {area}
            </span>
          )}
        </div>
      </div>

      {/* Card principal com flip - directional slide animation */}
      <div 
        key={`${currentIndex}-${direction}`} 
        className={direction === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right-card'}
        style={{ willChange: 'transform, opacity' }}
      >
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
          {/* Frente - Pergunta */}
          <div 
            onClick={handleFlip} 
            className="min-h-[300px] max-h-[70vh] overflow-y-auto rounded-2xl p-5 sm:p-6 flex flex-col cursor-pointer relative break-words border border-red-800/30 shadow-2xl shine-effect overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden', 
              background: 'linear-gradient(135deg, rgba(127,29,29,0.85), rgba(69,10,10,0.95))'
            }}
          >
            {/* Tag de tema */}
            {currentCard.tema && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-red-200">
                  {currentCard.tema}
                </span>
              </div>
            )}
            {/* Header com código/artigo e botão compartilhar */}
            {codigoNome && numeroArtigo && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-red-300">
                  {codigoNome} • Art. {numeroArtigo}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-white/50 hover:text-white/80 hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartilhar
                </Button>
              </div>
            )}
            
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="w-full space-y-3">
                <p className="text-lg font-semibold mb-2 text-white">{currentCard.front}</p>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-4 text-center">Toque para ver a resposta</p>
          </div>

          {/* Verso - Resposta */}
          <div 
            className="min-h-[300px] max-h-[70vh] overflow-y-auto rounded-2xl p-5 sm:p-6 relative break-words flex flex-col overflow-hidden border border-red-800/30 shadow-2xl shine-effect"
            style={{ 
              backfaceVisibility: 'hidden', 
              background: 'linear-gradient(135deg, rgba(127,29,29,0.85), rgba(69,10,10,0.95))'
            }}
          >
            {/* Tag de tema */}
            {currentCard.tema && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-red-200">
                  {currentCard.tema}
                </span>
              </div>
            )}
            {/* Header com código/artigo e botão compartilhar */}
            {codigoNome && numeroArtigo && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-red-300">
                  {codigoNome} • Art. {numeroArtigo}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-white/50 hover:text-white/80 hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartilhar
                </Button>
              </div>
            )}
            
            <div 
              onClick={handleFlip} 
              className="flex-1 flex items-center justify-center cursor-pointer"
            >
              <p className="text-white leading-relaxed text-sm text-center">
                {currentCard.back}
              </p>
            </div>

            {/* Botão Dica - disponível para todos */}
            {tabela !== 'artigos-lei' && (
              <div className="mt-3 relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs gap-2 bg-white/5 border border-amber-500/30 hover:bg-amber-500/10 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newOpen = !isBaseLegalOpen;
                    setIsBaseLegalOpen(newOpen);
                    
                    if (newOpen && currentCard.id && !currentCard.base_legal && !localBaseLegal[currentCard.id]) {
                      generateBaseLegal(currentCard.id, currentCard.front, currentCard.back);
                    }
                  }}
                  disabled={isGeneratingBaseLegal}
                >
                  {isGeneratingBaseLegal ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Gerando dica...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-400">Dica</span>
                      <ChevronDown className={`w-3 h-3 text-amber-400 transition-transform duration-200 ${isBaseLegalOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </Button>
                
                {/* Card flutuante de Dica */}
                {isBaseLegalOpen && (
                  <div className="mt-2 overflow-hidden animate-[slideUp_200ms_ease-out]">
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      {isGeneratingBaseLegal ? (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Gerando dica...
                        </div>
                      ) : (
                        <div className="text-xs text-white leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white">
                          <ReactMarkdown>
                            {currentCard.id && localBaseLegal[currentCard.id] 
                              ? localBaseLegal[currentCard.id] 
                              : currentCard.base_legal || "Clique para gerar uma dica de memorização."}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <p 
              onClick={handleFlip}
              className="text-xs text-white/40 text-center mt-3 cursor-pointer"
            >
              Toque para voltar
            </p>
          </div>
        </ReactCardFlip>
      </div>

      {/* Botões SM-2: Não Lembro / Difícil / Flip / Bom / Fácil */}
      <div className="space-y-2">
        <div className="flex flex-wrap justify-center items-center gap-2">
          <Button 
            onClick={() => {
              const card = flashcards[currentIndex];
              if (card.id) {
                saveProgress(card.id, area || '', card.tema || '', 'revisar');
                registrarRevisao(card.id, area || '', card.tema || '', 0);
                setSessionStats(prev => ({ ...prev, [card.id!]: 'revisar' }));
              }
              playFeedbackSound('error');
              handleNext();
            }} 
            variant="ghost" 
            className="flex-1 min-w-[70px] bg-red-900/60 border border-red-800/30 text-white hover:bg-red-900/80 shadow-lg text-xs px-2"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <div className="flex flex-col items-start leading-tight">
              <span>Não lembro</span>
              <span className="text-[9px] opacity-60">1 dia</span>
            </div>
          </Button>

          <Button 
            onClick={() => {
              const card = flashcards[currentIndex];
              if (card.id) {
                saveProgress(card.id, area || '', card.tema || '', 'revisar');
                registrarRevisao(card.id, area || '', card.tema || '', 3);
                setSessionStats(prev => ({ ...prev, [card.id!]: 'revisar' }));
              }
              handleNext();
            }} 
            variant="ghost" 
            className="flex-1 min-w-[60px] bg-amber-900/50 border border-amber-800/30 text-white hover:bg-amber-900/70 shadow-lg text-xs px-2"
          >
            <div className="flex flex-col items-center leading-tight">
              <span>Difícil</span>
              <span className="text-[9px] opacity-60">~3 dias</span>
            </div>
          </Button>

          <Button 
            onClick={handleFlip} 
            variant="ghost" 
            size="icon"
            className="bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-full w-9 h-9 shrink-0"
          >
            <RotateCw className="w-4 h-4" />
          </Button>

          <Button 
            onClick={() => {
              const card = flashcards[currentIndex];
              if (card.id) {
                saveProgress(card.id, area || '', card.tema || '', 'compreendi');
                registrarRevisao(card.id, area || '', card.tema || '', 4);
                setSessionStats(prev => ({ ...prev, [card.id!]: 'compreendi' }));
              }
              playFeedbackSound('correct');
              handleNext();
            }} 
            variant="ghost" 
            className="flex-1 min-w-[60px] bg-blue-900/50 border border-blue-800/30 text-white hover:bg-blue-900/70 shadow-lg text-xs px-2"
          >
            <div className="flex flex-col items-center leading-tight">
              <span>Bom</span>
              <span className="text-[9px] opacity-60">~6 dias</span>
            </div>
          </Button>

          <Button 
            onClick={() => {
              const card = flashcards[currentIndex];
              if (card.id) {
                saveProgress(card.id, area || '', card.tema || '', 'compreendi');
                registrarRevisao(card.id, area || '', card.tema || '', 5);
                setSessionStats(prev => ({ ...prev, [card.id!]: 'compreendi' }));
              }
              playFeedbackSound('correct');
              handleNext();
            }} 
            variant="ghost" 
            className="flex-1 min-w-[70px] bg-emerald-900/60 border border-emerald-800/30 text-white hover:bg-emerald-900/80 shadow-lg text-xs px-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <div className="flex flex-col items-start leading-tight">
              <span>Fácil</span>
              <span className="text-[9px] opacity-60">~15 dias</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Mini progress bar da sessão */}
      {Object.keys(sessionStats).length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{Object.keys(sessionStats).length} de {flashcards.length} respondidos</span>
            <span>{Object.values(sessionStats).filter(s => s === 'compreendi').length} compreendi · {Object.values(sessionStats).filter(s => s === 'revisar').length} revisar</span>
          </div>
          <Progress value={(Object.keys(sessionStats).length / flashcards.length) * 100} className="h-1.5" />
        </div>
      )}

      {/* Stats Sheet */}
      <Sheet open={showStatsSheet} onOpenChange={setShowStatsSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Estatísticas — {area}</SheetTitle>
            <SheetDescription>Seu progresso nesta área</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-card rounded-xl p-3 border">
                <p className="text-lg font-bold">{areaStudyData?.total || 0}</p>
                <p className="text-[10px] text-muted-foreground">Estudados</p>
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                <p className="text-lg font-bold text-emerald-500">{areaStudyData?.compreendi || 0}</p>
                <p className="text-[10px] text-emerald-600">Compreendi</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                <p className="text-lg font-bold text-amber-500">{areaStudyData?.revisar || 0}</p>
                <p className="text-[10px] text-amber-600">Revisar</p>
              </div>
            </div>
            {areaStudyData && areaStudyData.total > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Domínio</p>
                <Progress value={(areaStudyData.compreendi / areaStudyData.total) * 100} className="h-2" />
                <p className="text-[10px] text-muted-foreground mt-1">{Math.round((areaStudyData.compreendi / areaStudyData.total) * 100)}% dominado</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs border-red-500/30 text-red-500 hover:bg-red-500/10"
                onClick={() => {
                  resetProgress(area);
                  setSessionStats({});
                  setShowStatsSheet(false);
                }}
              >
                Reiniciar esta área
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Card de exemplo prático */}
      {settings.showExamples && isFlipped && (
        <Card className="border-amber-500/30 bg-amber-500/5 animate-[fadeIn_200ms_ease-out]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <span>💡</span> Exemplo Prático
              </p>
            </div>
            
            {isGeneratingExemplo ? (
              <div className="flex items-center gap-2 text-white/60 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Gerando exemplo prático com IA...</span>
              </div>
            ) : (
              <div className="text-sm text-white/90 leading-relaxed text-left prose prose-invert prose-sm max-w-none prose-p:my-1 [&_strong]:text-amber-400 [&_strong]:font-bold">
                <ReactMarkdown>
                  {currentCard.id ? (localExemplos[currentCard.id] || currentCard.exemplo) : currentCard.exemplo}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

FlashcardViewer.displayName = 'FlashcardViewer';
