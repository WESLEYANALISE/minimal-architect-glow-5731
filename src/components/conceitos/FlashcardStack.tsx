import { useState, useEffect, useRef, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Flashcard {
  pergunta: string;
  resposta: string;
  exemplo?: string;
}

interface FlashcardStackProps {
  flashcards: Flashcard[];
  titulo?: string;
  onGoToQuestions?: () => void;
  onComplete?: () => void;
}

const FlashcardStack = memo(({ flashcards, titulo, onGoToQuestions, onComplete }: FlashcardStackProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const hasCalledComplete = useRef(false);
  
  const totalCards = flashcards?.length || 0;
  const isLastCard = currentIndex === totalCards - 1;
  const currentCard = flashcards?.[currentIndex];

  useEffect(() => {
    if (isLastCard && !hasCalledComplete.current && onComplete && totalCards > 0) {
      hasCalledComplete.current = true;
      onComplete();
    }
  }, [isLastCard, onComplete, totalCards]);

  // Preload sounds
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

  const goToNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      playSlideSound();
      setIsFlipped(false);
      setSlideDirection('left');
      setTimeout(() => setCurrentIndex(prev => prev + 1), 50);
    }
  }, [currentIndex, totalCards, playSlideSound]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      playSlideSound();
      setIsFlipped(false);
      setSlideDirection('right');
      setTimeout(() => setCurrentIndex(prev => prev - 1), 50);
    }
  }, [currentIndex, playSlideSound]);

  const handleFlip = useCallback(() => {
    playFlipSound();
    setIsFlipped(prev => !prev);
  }, [playFlipSound]);

  const goToCard = useCallback((idx: number) => {
    setIsFlipped(false);
    setSlideDirection(idx > currentIndex ? 'left' : 'right');
    setTimeout(() => setCurrentIndex(idx), 100);
  }, [currentIndex]);

  // Early return after all hooks
  if (!flashcards || flashcards.length === 0 || !currentCard) return null;

  return (
    <div className="my-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Flashcards</h4>
          {titulo && <p className="text-xs text-gray-400">{titulo}</p>}
        </div>
        <div className="ml-auto text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">
          {currentIndex + 1} / {totalCards}
        </div>
      </div>

      {/* Card Container */}
      <div className="relative perspective-1000">
        <div
          key={currentIndex}
          className={`w-full ${slideDirection === 'right' ? 'animate-slide-in-left' : 'animate-slide-in-right-card'}`}
        >
          {/* Flashcard with CSS 3D flip */}
          <div
            className="relative w-full min-h-[200px] cursor-pointer preserve-3d"
            onClick={handleFlip}
            style={{ perspective: '1000px' }}
          >
            <div
              className="w-full min-h-[200px] relative preserve-3d transition-transform duration-300 ease-out"
              style={{ 
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front - Pergunta */}
              <div
                className="absolute inset-0 w-full h-full rounded-xl p-6 flex flex-col backface-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  background: 'linear-gradient(135deg, #1a1207 0%, #2d1f0a 50%, #3d2a0e 100%)',
                  border: '1px solid rgba(212, 168, 75, 0.3)',
                  boxShadow: '0 10px 40px -10px rgba(212, 168, 75, 0.2)'
                }}
              >
                <div className="text-xs text-amber-400/80 uppercase tracking-wider mb-3">
                  Pergunta
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-white text-lg text-center leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                    {currentCard.pergunta}
                  </p>
                </div>
                <div className="text-center mt-4">
                  <span className="text-xs text-amber-400/50 inline-flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Toque para virar
                  </span>
                </div>
              </div>

              {/* Back - Resposta */}
              <div
                className="absolute inset-0 w-full h-full rounded-xl p-6 flex flex-col backface-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  boxShadow: '0 10px 40px -10px rgba(16, 185, 129, 0.3)'
                }}
              >
                <div className="text-xs text-emerald-300 uppercase tracking-wider mb-3">
                  Resposta
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-white text-base text-center leading-relaxed" style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}>
                    {currentCard.resposta}
                  </p>
                </div>
                <div className="text-center mt-4">
                  <span className="text-xs text-emerald-300/60 inline-flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Toque para virar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exemplo prático */}
        {isFlipped && currentCard.exemplo && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 animate-[slideUp_200ms_ease-out]">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-amber-500">Exemplo Prático</p>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              {currentCard.exemplo}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="text-gray-400 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {flashcards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToCard(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-150 ${
                idx === currentIndex
                  ? 'bg-amber-500 w-4'
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          disabled={currentIndex === totalCards - 1}
          className="text-gray-400 hover:text-white disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Botão de navegação para Questões no último flashcard */}
      {isLastCard && onGoToQuestions && (
        <div className="mt-6 pt-4 border-t border-white/10 animate-[fadeIn_200ms_ease-out]">
          <div className="text-center mb-3">
            <p className="text-sm text-gray-400">
              Você revisou todos os flashcards! 🎉
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Agora é hora de praticar com questões
            </p>
          </div>
          <Button
            onClick={onGoToQuestions}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/20"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Ir para Questões
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
});

FlashcardStack.displayName = 'FlashcardStack';

export default FlashcardStack;
