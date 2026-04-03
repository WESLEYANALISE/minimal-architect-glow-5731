import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { normalizeAudioUrl } from "@/lib/audioUtils";

interface AudioItem {
  id: number;
  titulo: string;
  url_audio: string;
  url_audio_resposta?: string;
  url_audio_exemplo?: string;
  imagem_miniatura: string;
  descricao: string;
  area: string;
  tema: string;
  // Novos campos para conteúdo visual
  tipo?: "audioaula" | "flashcard" | "resumo" | "artigo";
  texto_exemplo?: string;
  url_imagem_exemplo?: string;
  pergunta?: string;
  resposta?: string;
  subtema?: string;
}

export type { AudioItem };

interface AudioPlayerContextType {
  currentAudio: AudioItem | null;
  isPlaying: boolean;
  isPlayerOpen: boolean;
  playlist: AudioItem[];
  currentIndex: number;
  playAudio: (audio: AudioItem) => void;
  pauseAudio: () => void;
  togglePlayPause: () => void;
  closePlayer: () => void;
  minimizePlayer: () => void;
  openPlayer: () => void;
  openPlayerWithAudio: (audio: AudioItem) => void;
  setPlaylist: (audios: AudioItem[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  preloadAudio: (url: string) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAudio, setCurrentAudio] = useState<AudioItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playlist, setPlaylistState] = useState<AudioItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const preloadCacheRef = useRef<Set<string>>(new Set());
  const lastLoadedUrlRef = useRef<string>('');

  // Preload de áudio em background para aquecer cache do browser
  const preloadAudio = (url: string) => {
    if (!url || preloadCacheRef.current.has(url)) return;
    preloadCacheRef.current.add(url);
    const normalized = normalizeAudioUrl(url);
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = normalized;
    // Apenas carrega metadados, não toca
    audio.load();
  };

  // Efeito A — só troca a fonte quando o áudio muda
  useEffect(() => {
    if (!audioRef.current || !currentAudio) return;
    const streamUrl = normalizeAudioUrl(currentAudio.url_audio);
    // Skip reload se já é a mesma URL
    if (lastLoadedUrlRef.current === streamUrl) return;
    lastLoadedUrlRef.current = streamUrl;
    console.log('🎵 AudioPlayerContext: Loading audio src', currentAudio.titulo, streamUrl);
    audioRef.current.src = streamUrl;
    audioRef.current.load();
  }, [currentAudio?.id]);

  // Efeito B — só controla play/pause, aguarda canplay se necessário
  useEffect(() => {
    if (!audioRef.current || !currentAudio) return;
    const audio = audioRef.current;

    if (isPlaying) {
      const tryPlay = () => {
        audio.play().catch((err) => {
          console.error('❌ Error playing audio:', err);
          setIsPlaying(false);
        });
      };
      // Se o áudio já está pronto (readyState >= HAVE_FUTURE_DATA), toca direto
      if (audio.readyState >= 3) {
        tryPlay();
      } else {
        audio.addEventListener('canplay', tryPlay, { once: true });
        return () => audio.removeEventListener('canplay', tryPlay);
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentAudio?.id]);

  const playAudio = (audio: AudioItem) => {
    console.log('▶️ PlayAudio called:', audio.titulo);
    
    // Find index in playlist if audio is part of it
    const indexInPlaylist = playlist.findIndex(p => p.id === audio.id);
    if (indexInPlaylist !== -1) {
      setCurrentIndex(indexInPlaylist);
      console.log('📍 Audio found in playlist at index:', indexInPlaylist);
    }
    
    setCurrentAudio(audio);
    setIsPlaying(true);
    setIsPlayerOpen(true);
  };

  const pauseAudio = () => {
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const minimizePlayer = () => {
    setIsPlayerOpen(false);
  };

  const openPlayer = () => {
    setIsPlayerOpen(true);
  };

  const openPlayerWithAudio = (audio: AudioItem) => {
    const indexInPlaylist = playlist.findIndex(p => p.id === audio.id);
    if (indexInPlaylist !== -1) {
      setCurrentIndex(indexInPlaylist);
    }
    setCurrentAudio(audio);
    setIsPlayerOpen(true);
    // Don't auto-play - user must click play
  };

  const closePlayer = () => {
    setCurrentAudio(null);
    setIsPlaying(false);
    setIsPlayerOpen(false);
    setPlaylistState([]);
    setCurrentIndex(0);
  };

  const setPlaylist = (audios: AudioItem[]) => {
    setPlaylistState(audios);
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    playAudio(playlist[nextIndex]);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    playAudio(playlist[prevIndex]);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentAudio,
        isPlaying,
        isPlayerOpen,
        playlist,
        currentIndex,
        playAudio,
        pauseAudio,
        togglePlayPause,
        closePlayer,
        minimizePlayer,
        openPlayer,
        openPlayerWithAudio,
        setPlaylist,
        playNext,
        playPrevious,
        preloadAudio,
        audioRef,
      }}
    >
      {/* Elemento de áudio global — controlado pelo contexto */}
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }} />
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
};
