import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Play, Pause, SkipForward, SkipBack, X, Headphones } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import SpotifyLikePlayer from "./SpotifyLikePlayer";
import { useAmbientSound } from "@/contexts/AmbientSoundContext";

const AudioMiniPlayer = () => {
  const location = useLocation();
  const {
    currentAudio,
    isPlaying,
    isPlayerOpen,
    togglePlayPause,
    playNext,
    playPrevious,
    closePlayer,
    openPlayer,
    audioRef,
    playlist,
  } = useAudioPlayer();
  const { stopSound } = useAmbientSound();
  const [progress, setProgress] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  // Atualizar progresso
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration && audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [audioRef]);

  // Resetar progresso quando muda de áudio
  useEffect(() => {
    setProgress(0);
  }, [currentAudio?.id]);

  const handleClose = () => {
    stopSound();
    closePlayer();
    setShowFullPlayer(false);
  };

  const handleFullPlayerClose = () => {
    setShowFullPlayer(false);
  };

  if (!currentAudio) return null;

  const isOnAudioaulasPage = location.pathname.startsWith("/audioaulas");

  // Em /audioaulas: o GlobalAudioPlayer gerencia o player completo.
  // Quando minimizado (isPlayerOpen=false), mostrar mini player no TOPO.
  if (isOnAudioaulasPage) {
    // Player completo aberto via GlobalAudioPlayer — não renderizar mini player
    if (isPlayerOpen) return null;

    // Player minimizado — mostrar barra no rodapé (bottom)
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border/50 shadow-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0.5rem)" }}
      >
        {/* Barra de progresso */}
        <div className="h-0.5 w-full bg-muted">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          {/* Thumbnail / ícone — clica p/ reabrir o player */}
          <button
            onClick={openPlayer}
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-transform"
          >
            <Headphones className="w-5 h-5 text-white" />
          </button>

          {/* Info — clica p/ reabrir o player */}
          <button
            onClick={openPlayer}
            className="flex-1 min-w-0 text-left"
          >
            <p className="text-xs font-semibold text-foreground truncate leading-tight">
              {currentAudio.titulo}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {currentAudio.area}
              {currentAudio.tema && ` · ${currentAudio.tema}`}
            </p>
          </button>

          {/* Controles */}
          <div className="flex items-center gap-1 shrink-0">
            {playlist.length > 1 && (
              <button
                onClick={playPrevious}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-90"
              >
                <SkipBack className="w-3.5 h-3.5 text-foreground" />
              </button>
            )}

            <button
              onClick={togglePlayPause}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-foreground hover:bg-foreground/80 transition-colors active:scale-90"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-background fill-background" />
              ) : (
                <Play className="w-4 h-4 text-background fill-background ml-0.5" />
              )}
            </button>

            {playlist.length > 1 && (
              <button
                onClick={playNext}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-90"
              >
                <SkipForward className="w-3.5 h-3.5 text-foreground" />
              </button>
            )}

            {/* X — para o áudio de verdade */}
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-90 ml-1"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fora de /audioaulas: mini player padrão no rodapé
  return (
    <>
      {/* Full player modal */}
      {showFullPlayer && (
        <SpotifyLikePlayer
          isOpen={showFullPlayer}
          onClose={handleFullPlayerClose}
          audioUrl={currentAudio.url_audio}
          audioUrlResposta={currentAudio.url_audio_resposta}
          audioUrlExemplo={currentAudio.url_audio_exemplo}
          title={currentAudio.titulo}
          area={currentAudio.area}
          tema={currentAudio.tema}
          descricao={currentAudio.descricao}
          imagem_miniatura={currentAudio.imagem_miniatura}
          tipo={currentAudio.tipo}
          texto_exemplo={currentAudio.texto_exemplo}
          url_imagem_exemplo={currentAudio.url_imagem_exemplo}
          pergunta={currentAudio.pergunta}
          resposta={currentAudio.resposta}
        />
      )}

      {/* Mini Player rodapé */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-2xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0.5rem)" }}
      >
        {/* Barra de progresso */}
        <div className="h-0.5 w-full bg-muted">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2">
          <button
            onClick={() => setShowFullPlayer(true)}
            className="w-11 h-11 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shrink-0 shadow-lg active:scale-95 transition-transform"
          >
            <Headphones className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={() => setShowFullPlayer(true)}
            className="flex-1 min-w-0 text-left"
          >
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {currentAudio.titulo}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentAudio.area}
              {currentAudio.tema && ` · ${currentAudio.tema}`}
            </p>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {playlist.length > 1 && (
              <button
                onClick={playPrevious}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-90"
              >
                <SkipBack className="w-4 h-4 text-foreground" />
              </button>
            )}

            <button
              onClick={togglePlayPause}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-foreground hover:bg-foreground/80 transition-colors active:scale-90"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-background fill-background" />
              ) : (
                <Play className="w-4 h-4 text-background fill-background ml-0.5" />
              )}
            </button>

            {playlist.length > 1 && (
              <button
                onClick={playNext}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-90"
              >
                <SkipForward className="w-4 h-4 text-foreground" />
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors active:scale-90 ml-1"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AudioMiniPlayer;
