import { useState, useRef, useEffect, useCallback } from "react";
import { Music, Play, Pause, Volume2, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Track {
  id: number;
  name: string;
  src: string;
}

const TRACKS: Track[] = [
  { id: 1, name: "A Call to the Soul", src: "/sounds/01_a-call-to-the-soul.mp3" },
  { id: 2, name: "Midnight Forest", src: "/sounds/02_midnight-forest.mp3" },
  { id: 3, name: "Midnight Forest (Extended)", src: "/sounds/03_midnight-forest-extended.mp3" },
];

interface ReadingAmbientSoundProps {
  isOpen: boolean;
}

const ReadingAmbientSound = ({ isOpen }: ReadingAmbientSoundProps) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlaying(false);
      setActiveTrack(null);
      setExpanded(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playTrack = useCallback((track: Track) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    const audio = audioRef.current;

    if (activeTrack?.id === track.id) {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        audio.play().catch(console.error);
        setPlaying(true);
      }
      return;
    }

    audio.src = track.src;
    audio.volume = volume;
    audio.play().catch(console.error);
    setActiveTrack(track);
    setPlaying(true);
  }, [activeTrack, playing, volume]);

  const handleVolumeChange = useCallback((vals: number[]) => {
    const v = vals[0];
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setActiveTrack(null);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Floating button */}
      <motion.div
        className="fixed bottom-20 right-4 z-[60]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "relative h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
            "bg-gradient-to-br from-primary via-primary to-destructive",
            "hover:scale-105 active:scale-95",
            playing && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
          )}
          style={{
            boxShadow: playing
              ? "0 0 20px hsl(8 65% 42% / 0.5), 0 8px 24px hsl(0 0% 0% / 0.4)"
              : "0 8px 24px hsl(0 0% 0% / 0.4)",
          }}
        >
          <Music className="w-6 h-6 text-primary-foreground" />
          {playing && (
            <motion.span
              className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </button>
      </motion.div>

      {/* Expanded card */}
      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              className="fixed inset-0 z-[59] bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
            />
            <motion.div
              className="fixed bottom-36 right-4 z-[60] w-[280px] rounded-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                background: "hsl(8 20% 8%)",
                border: "1px solid hsl(8 30% 18%)",
                boxShadow: "0 20px 60px hsl(0 0% 0% / 0.6), 0 0 40px hsl(8 65% 42% / 0.1)",
              }}
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center"
                      style={{ background: "hsl(8 65% 42% / 0.2)" }}
                    >
                      <Music className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-tight">Som Ambiente</h3>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        Música relaxante para sua leitura
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpanded(false)}
                    className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Track list */}
              <div className="px-3 pb-2 pt-1 space-y-1.5">
                {TRACKS.map((track) => {
                  const isActive = activeTrack?.id === track.id;
                  const isTrackPlaying = isActive && playing;

                  return (
                    <button
                      key={track.id}
                      onClick={() => playTrack(track)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group",
                        isActive
                          ? "bg-primary shadow-lg"
                          : "hover:bg-white/5"
                      )}
                      style={isActive ? {
                        boxShadow: "0 4px 16px hsl(8 65% 42% / 0.4)",
                      } : undefined}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-colors",
                        isActive ? "bg-white/20" : "bg-white/5 group-hover:bg-white/10"
                      )}>
                        {isTrackPlaying ? (
                          <Pause className={cn("w-3.5 h-3.5", isActive ? "text-primary-foreground" : "text-foreground")} />
                        ) : (
                          <Play className={cn("w-3.5 h-3.5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-primary-foreground" : "text-foreground/80"
                      )}>
                        {track.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Volume + stop */}
              {activeTrack && (
                <div
                  className="px-4 py-2.5 flex items-center gap-3 border-t"
                  style={{ borderColor: "hsl(8 30% 18%)" }}
                >
                  <Volume2 className="w-4 h-4 text-primary shrink-0" />
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.05}
                    className="flex-1"
                  />
                  <button
                    onClick={stopAll}
                    className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReadingAmbientSound;
