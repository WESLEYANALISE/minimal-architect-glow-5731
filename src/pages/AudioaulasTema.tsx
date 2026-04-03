import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Pause, Headphones, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { AudioAula } from "@/types/database.types";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

const AudioaulasTema = () => {
  const { area } = useParams();
  const navigate = useNavigate();
  const { playAudio, currentAudio, isPlaying, setPlaylist } = useAudioPlayer();
  const hasAutoPlayed = useRef(false);

  const { data: audios, isLoading } = useQuery({
    queryKey: ["audioaulas-tema", area],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("AUDIO-AULA" as any)
        .select("*")
        .eq("area", decodeURIComponent(area || ""))
        .order("sequencia", { ascending: true });
      if (error) throw error;
      return data as unknown as AudioAula[];
    },
  });

  // Auto-play primeiro áudio ao entrar na página
  useEffect(() => {
    if (audios && audios.length > 0 && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      const firstAudio = audios[0];
      
      // Set playlist
      const playlistItems = audios.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        url_audio: a.url_audio,
        imagem_miniatura: a.imagem_miniatura,
        descricao: a.descricao,
        area: a.area,
        tema: a.tema,
      }));
      setPlaylist(playlistItems);

      // Auto-play
      playAudio({
        id: firstAudio.id,
        titulo: firstAudio.titulo,
        url_audio: firstAudio.url_audio,
        imagem_miniatura: firstAudio.imagem_miniatura,
        descricao: firstAudio.descricao,
        area: firstAudio.area,
        tema: firstAudio.tema,
      });
    }
  }, [audios]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  const decodedArea = decodeURIComponent(area || "");

  // Group by tema
  const temas = audios?.reduce((acc, audio) => {
    const tema = audio.tema || "Geral";
    if (!acc[tema]) acc[tema] = [];
    acc[tema].push(audio);
    return acc;
  }, {} as Record<string, AudioAula[]>) || {};

  const temaKeys = Object.keys(temas);

  return (
    <div className="min-h-screen pb-24">
      {/* Header hero */}
      <div className="relative px-4 pt-4 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Áudio Aulas</span>
        </button>

        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Headphones className="w-9 h-9 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">
              Área de Estudo
            </p>
            <h1 className="text-xl font-bold leading-tight mb-1">{decodedArea}</h1>
            <p className="text-xs text-muted-foreground">
              {audios?.length} episódios · {temaKeys.length} {temaKeys.length === 1 ? "tema" : "temas"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            size="sm"
            className="flex-1 rounded-full bg-foreground text-background hover:bg-foreground/80 font-semibold"
            onClick={() => {
              if (audios && audios.length > 0) {
                const first = audios[0];
                playAudio({
                  id: first.id,
                  titulo: first.titulo,
                  url_audio: first.url_audio,
                  imagem_miniatura: first.imagem_miniatura,
                  descricao: first.descricao,
                  area: first.area,
                  tema: first.tema,
                });
              }
            }}
          >
            <Play className="w-4 h-4 mr-1.5 fill-current" />
            Reproduzir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-full font-semibold"
            onClick={() => {
              if (audios && audios.length > 0) {
                const shuffled = [...audios].sort(() => Math.random() - 0.5);
                const first = shuffled[0];
                playAudio({
                  id: first.id,
                  titulo: first.titulo,
                  url_audio: first.url_audio,
                  imagem_miniatura: first.imagem_miniatura,
                  descricao: first.descricao,
                  area: first.area,
                  tema: first.tema,
                });
              }
            }}
          >
            <Music2 className="w-4 h-4 mr-1.5" />
            Aleatório
          </Button>
        </div>
      </div>

      {/* Audio list grouped by tema */}
      <div className="px-4 space-y-5">
        {temaKeys.map((tema) => {
          const items = temas[tema];
          return (
            <div key={tema}>
              {temaKeys.length > 1 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 rounded-full bg-accent" />
                  <h2 className="text-sm font-bold text-foreground">{tema}</h2>
                  <span className="text-[10px] text-muted-foreground">
                    {items.length} ep.
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {items.map((audio, index) => {
                  const isCurrentAudio = currentAudio?.id === audio.id;
                  const isCurrentlyPlaying = isCurrentAudio && isPlaying;

                  return (
                    <button
                      key={audio.id}
                      className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                        isCurrentAudio
                          ? "bg-accent/10 border border-accent/20"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        playAudio({
                          id: audio.id,
                          titulo: audio.titulo,
                          url_audio: audio.url_audio,
                          imagem_miniatura: audio.imagem_miniatura,
                          descricao: audio.descricao,
                          area: audio.area,
                          tema: audio.tema,
                        });
                      }}
                    >
                      {/* Track number / play icon */}
                      <div className="w-8 flex items-center justify-center shrink-0">
                        {isCurrentlyPlaying ? (
                          <div className="flex gap-[2px] items-end h-4">
                            <div className="w-[3px] h-3 bg-accent rounded-full animate-pulse" />
                            <div className="w-[3px] h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
                            <div className="w-[3px] h-2.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                          </div>
                        ) : isCurrentAudio ? (
                          <Pause className="w-4 h-4 text-accent" />
                        ) : (
                          <span className="text-sm text-muted-foreground group-hover:hidden">
                            {audio.sequencia || index + 1}
                          </span>
                        )}
                        {!isCurrentAudio && (
                          <Play className="w-4 h-4 text-foreground hidden group-hover:block fill-current" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-semibold truncate ${
                            isCurrentAudio ? "text-accent" : "text-foreground"
                          }`}
                        >
                          {audio.titulo}
                        </h3>
                        {audio.descricao && (
                          <div
                            className={`text-xs text-muted-foreground line-clamp-1 mt-0.5 [&_strong]:font-semibold [&_em]:italic [&_p]:inline`}
                          >
                            <ReactMarkdown>{audio.descricao}</ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {/* Tag */}
                      {audio.tag && (
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0 border-border/50"
                        >
                          {audio.tag}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AudioaulasTema;
