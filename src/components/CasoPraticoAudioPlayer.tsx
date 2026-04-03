import { useState, useRef, useCallback, useEffect } from "react";
import { Pause, Loader2, Play, AlertCircle } from "lucide-react";

interface CasoPraticoAudioPlayerProps {
  audioUrl: string;
}

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const CasoPraticoAudioPlayer = ({ audioUrl }: CasoPraticoAudioPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up on URL change or unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      setPlaying(false);
      setLoading(false);
      setError(false);
      setCurrentTime(0);
      setDuration(0);
    };
  }, [audioUrl]);

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.preload = "auto";

    audio.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    });
    audio.addEventListener("durationchange", () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    });
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime || 0);
    });
    audio.addEventListener("canplaythrough", () => setLoading(false));
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setCurrentTime(0);
    });
    audio.addEventListener("error", () => {
      setLoading(false);
      setPlaying(false);
      setError(true);
    });

    audio.src = audioUrl;
    audioRef.current = audio;
    return audio;
  }, [audioUrl]);

  const toggle = useCallback(async () => {
    if (error) return;

    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    setLoading(true);
    setError(false);
    const audio = ensureAudio();

    try {
      await audio.play();
      setPlaying(true);
      setLoading(false);
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    } catch {
      // Wait for canplay then retry
      await new Promise<void>((resolve) => {
        const handler = async () => {
          audio.removeEventListener("canplay", handler);
          try {
            await audio.play();
            setPlaying(true);
          } catch {
            setError(true);
          }
          setLoading(false);
          if (Number.isFinite(audio.duration)) setDuration(audio.duration);
          resolve();
        };
        audio.addEventListener("canplay", handler);
        setTimeout(() => {
          audio.removeEventListener("canplay", handler);
          setLoading(false);
          setError(true);
          resolve();
        }, 10000);
      });
    }
  }, [playing, ensureAudio, error]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current && Number.isFinite(t)) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  const statusText = error
    ? "Erro ao carregar áudio"
    : loading
    ? "Carregando..."
    : playing
    ? "Reproduzindo narração..."
    : "Ouvir narração do caso";

  return (
    <div className="w-full bg-card/90 backdrop-blur-sm border border-border/30 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={error}
          aria-label={playing ? "Pausar narração" : "Reproduzir narração"}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shrink-0 transition-colors active:scale-95 disabled:opacity-50"
        >
          {error ? (
            <AlertCircle className="w-4 h-4 text-primary-foreground" />
          ) : loading ? (
            <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
          ) : playing ? (
            <Pause className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium mb-1 ${error ? "text-destructive" : "text-foreground"}`}>
            {statusText}
          </p>
          <input
            type="range"
            min="0"
            max={duration > 0 ? duration : 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
        </div>

        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {formatTime(currentTime)}/{formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default CasoPraticoAudioPlayer;
