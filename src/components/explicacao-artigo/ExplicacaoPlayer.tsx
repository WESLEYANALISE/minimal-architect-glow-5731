import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeAudioUrl } from "@/lib/audioUtils";

interface Segmento {
  tipo?: string;
  texto: string;
  prompt_imagem?: string;
  imagem_url?: string;
  audio_url?: string;
  duracao_estimada: number;
}

interface ExplicacaoPlayerProps {
  segmentos: Segmento[];
  audioUrl?: string | null;
  titulo: string;
  numeroArtigo: string;
}

export default function ExplicacaoPlayer({ segmentos, audioUrl, titulo, numeroArtigo }: ExplicacaoPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userInteracted = useRef(false);

  const totalDuration = segmentos.reduce((acc, s) => acc + s.duracao_estimada, 0);

  // Check if we have per-segment audio
  const hasPerSegmentAudio = segmentos.some(s => s.audio_url);
  // Use legacy global audio only if no per-segment audio exists
  const useLegacyAudio = !!audioUrl && !hasPerSegmentAudio;

  const currentSegment = segmentos[currentIndex];
  const currentAudioSrc = useLegacyAudio
    ? normalizeAudioUrl(audioUrl!)
    : currentSegment?.audio_url
      ? normalizeAudioUrl(currentSegment.audio_url)
      : null;

  // Calculate segment time boundaries (used for legacy audio sync)
  const segmentBoundaries = segmentos.reduce<number[]>((acc, seg, i) => {
    const prev = i === 0 ? 0 : acc[i - 1];
    acc.push(prev + seg.duracao_estimada);
    return acc;
  }, []);

  // Typing effect
  useEffect(() => {
    if (!currentSegment) return;
    setDisplayedText("");
    const text = currentSegment.texto;
    let charIndex = 0;
    const speed = Math.max(20, (currentSegment.duracao_estimada * 1000) / text.length);
    
    const timer = setInterval(() => {
      charIndex++;
      setDisplayedText(text.slice(0, charIndex));
      if (charIndex >= text.length) clearInterval(timer);
    }, speed);

    return () => clearInterval(timer);
  }, [currentIndex, currentSegment]);

  // Per-segment audio: update src when segment changes
  useEffect(() => {
    if (useLegacyAudio || !audioRef.current) return;
    
    const segAudioUrl = currentSegment?.audio_url ? normalizeAudioUrl(currentSegment.audio_url) : '';
    if (!segAudioUrl) return;

    const audio = audioRef.current;
    const wasPlaying = isPlaying;
    
    // Always reset and load the new source
    audio.pause();
    audio.src = segAudioUrl;
    audio.load();
    
    if (wasPlaying && userInteracted.current) {
      const onCanPlay = () => {
        audio.play().catch(e => console.error('[ExplicacaoPlayer] Auto-play next segment failed:', e));
        audio.removeEventListener('canplaythrough', onCanPlay);
      };
      audio.addEventListener('canplaythrough', onCanPlay);
    }
  }, [currentIndex, currentSegment, useLegacyAudio]);

  // Legacy audio: sync audio time to segment index
  const syncSegmentFromAudio = useCallback((currentTime: number) => {
    if (!useLegacyAudio) return;
    const ratio = currentTime / (audioRef.current?.duration || totalDuration);
    const elapsed = ratio * totalDuration;
    
    for (let i = 0; i < segmentBoundaries.length; i++) {
      const start = i === 0 ? 0 : segmentBoundaries[i - 1];
      if (elapsed >= start && elapsed < segmentBoundaries[i]) {
        if (i !== currentIndex) setCurrentIndex(i);
        break;
      }
    }
    setAudioProgress(ratio * 100);
  }, [segmentBoundaries, totalDuration, currentIndex, useLegacyAudio]);

  // Per-segment audio: track progress within current segment
  const onSegmentTimeUpdate = useCallback(() => {
    if (useLegacyAudio || !audioRef.current) return;
    const audio = audioRef.current;
    if (!audio.duration) return;
    
    // Overall progress across all segments
    const segStart = currentIndex === 0 ? 0 : segmentBoundaries[currentIndex - 1];
    const segDur = currentSegment?.duracao_estimada || 1;
    const segProgress = audio.currentTime / audio.duration;
    const overallElapsed = segStart + segProgress * segDur;
    setAudioProgress((overallElapsed / totalDuration) * 100);
  }, [useLegacyAudio, currentIndex, segmentBoundaries, currentSegment, totalDuration]);

  // Per-segment audio: auto-advance on end
  const onSegmentEnded = useCallback(() => {
    if (useLegacyAudio) return;
    if (currentIndex < segmentos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Keep isPlaying true so next segment auto-plays via useEffect
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setAudioProgress(100);
    }
  }, [useLegacyAudio, currentIndex, segmentos.length]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (useLegacyAudio) {
        syncSegmentFromAudio(audio.currentTime);
      } else {
        onSegmentTimeUpdate();
      }
    };
    const onEnded = () => {
      if (useLegacyAudio) {
        setIsPlaying(false);
        setAudioProgress(100);
      } else {
        onSegmentEnded();
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [syncSegmentFromAudio, onSegmentTimeUpdate, onSegmentEnded, useLegacyAudio]);

  // Fallback timer when no audio at all
  useEffect(() => {
    if (currentAudioSrc || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const startTime = Date.now();
    const segStart = currentIndex === 0 ? 0 : segmentBoundaries[currentIndex - 1];
    
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000 + segStart;
      const ratio = elapsed / totalDuration;
      setAudioProgress(Math.min(ratio * 100, 100));

      for (let i = 0; i < segmentBoundaries.length; i++) {
        const s = i === 0 ? 0 : segmentBoundaries[i - 1];
        if (elapsed >= s && elapsed < segmentBoundaries[i]) {
          if (i !== currentIndex) setCurrentIndex(i);
          break;
        }
      }

      if (elapsed >= totalDuration) {
        setIsPlaying(false);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentAudioSrc, currentIndex, segmentBoundaries, totalDuration]);

  const togglePlay = async () => {
    userInteracted.current = true;
    if (currentAudioSrc && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Ensure src is loaded
        if (!audioRef.current.src || audioRef.current.src === window.location.href) {
          audioRef.current.src = currentAudioSrc;
          audioRef.current.load();
        }
        try {
          await audioRef.current.play();
        } catch (err) {
          console.error('[ExplicacaoPlayer] Play error:', err);
        }
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const goToSegment = (index: number) => {
    if (index < 0 || index >= segmentos.length) return;
    setCurrentIndex(index);
    
    if (useLegacyAudio && audioRef.current && audioRef.current.duration) {
      const segStart = index === 0 ? 0 : segmentBoundaries[index - 1];
      const ratio = segStart / totalDuration;
      audioRef.current.currentTime = ratio * audioRef.current.duration;
    }
    // For per-segment audio, the useEffect will handle src change
  };

  const restart = () => {
    setCurrentIndex(0);
    setAudioProgress(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const segmentLabel = (tipo?: string) => {
    switch (tipo) {
      case 'gancho': return '🎯 Gancho';
      case 'explicacao': return '📖 O Artigo';
      case 'contexto': return '🏛️ Contexto';
      case 'exemplo': return '💡 Caso Prático';
      case 'consequencia': return '⚖️ Consequências';
      case 'resumo': return '🧠 Pra Gravar';
      default: return `📌 Parte ${currentIndex + 1}`;
    }
  };

  // No autoplay on mount — wait for user gesture to satisfy browser policy

  // Zoom-out effect: starts zoomed in (1.18) and slowly zooms out to 1.0
  // Duration matches the segment's estimated audio duration for a smooth linear de-zoom
  const getKenBurnsAnimation = (_index: number) => {
    const duration = currentSegment?.duracao_estimada || 10;
    return {
      initial: { scale: 1.18 },
      animate: { scale: 1.0 },
      transition: { duration, ease: "linear" as const },
    };
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl">
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={useLegacyAudio ? normalizeAudioUrl(audioUrl!) : (currentSegment?.audio_url ? normalizeAudioUrl(currentSegment.audio_url) : undefined)}
        preload="auto"
      />

      {/* Background Image with Ken Burns */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0 }}
          className="absolute inset-0 overflow-hidden"
        >
          {currentSegment?.imagem_url ? (
            <motion.img
              key={`kb-${currentIndex}`}
              src={currentSegment.imagem_url}
              alt={`Segmento ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              {...getKenBurnsAnimation(currentIndex)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
              <span className="text-6xl">⚖️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60" />
        </motion.div>
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="relative h-[3px] rounded-full overflow-hidden bg-white/20 mb-3">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${audioProgress}%` }}
          />
          {segmentos.length <= 12 && segmentos.map((_, i) => i > 0 && (
            <div
              key={i}
              className="absolute top-0 w-[1px] h-full bg-white/30"
              style={{ left: `${(segmentBoundaries[i - 1] / totalDuration) * 100}%` }}
            />
          ))}
        </div>

        <motion.div
          key={`label-${currentIndex}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10"
        >
          <span className="text-xs font-medium text-white/90">
            {segmentLabel(currentSegment?.tipo)}
          </span>
        </motion.div>
      </div>

      {/* Article badge */}
      <div className="absolute top-16 right-4 z-10">
        <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 backdrop-blur-md border border-amber-500/30">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
            Art. {numeroArtigo}
          </span>
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-6">
        <motion.div
          key={`text-${currentIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-white text-base leading-relaxed font-medium drop-shadow-lg">
            {displayedText}
            <span className="animate-pulse text-amber-400">|</span>
          </p>
        </motion.div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => goToSegment(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={restart}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-amber-500/30"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-black" />
              ) : (
                <Play className="w-6 h-6 text-black ml-0.5" />
              )}
            </button>
          </div>

          <button
            onClick={() => goToSegment(currentIndex + 1)}
            disabled={currentIndex === segmentos.length - 1}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <p className="text-center text-white/40 text-[11px] mt-3">
          {currentIndex + 1} de {segmentos.length}
        </p>
      </div>
    </div>
  );
}
