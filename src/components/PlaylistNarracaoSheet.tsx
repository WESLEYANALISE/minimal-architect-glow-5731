import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ArrowLeft, Music, Play, Pause } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { formatNumeroArtigo } from "@/lib/formatNumeroArtigo";

interface Article {
  id: number;
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
}

interface PlaylistNarracaoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articles: Article[];
  codigoNome: string;
}

export const PlaylistNarracaoSheet = ({
  open,
  onOpenChange,
  articles,
  codigoNome,
}: PlaylistNarracaoSheetProps) => {
  const { playAudio, setPlaylist, currentAudio, isPlaying, togglePlayPause } = useAudioPlayer();

  const articlesWithAudio = articles.filter(
    (a) => a["Narração"] && a["Narração"].trim() !== ""
  );

  const getPreviewText = (text: string) => {
    return text
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 120);
  };

  const handlePlayAll = () => {
    if (articlesWithAudio.length === 0) return;
    const items = articlesWithAudio.map((article) => ({
      id: article.id,
      titulo: `Art. ${formatNumeroArtigo(article["Número do Artigo"] || "")} - ${codigoNome}`,
      url_audio: article["Narração"] || "",
      imagem_miniatura: "/logo.webp",
      descricao: article["Artigo"] || "",
      area: codigoNome,
      tema: `Artigo ${formatNumeroArtigo(article["Número do Artigo"] || "")}`,
    }));
    setPlaylist(items);
    playAudio(items[0]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-base">Playlist de Narração</h2>
            <p className="text-xs text-muted-foreground">{codigoNome}</p>
          </div>
          {articlesWithAudio.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="px-3 py-1.5 rounded-full bg-amber-500 text-black text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-400 transition-colors"
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              Ouvir tudo
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {articlesWithAudio.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Music className="w-14 h-14 mx-auto mb-4 opacity-40" />
              <p className="text-sm font-medium">Nenhum áudio disponível</p>
              <p className="text-xs mt-1.5">Este código ainda não possui artigos com narração.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                🎧 {articlesWithAudio.length} artigos narrados
              </p>
              {articlesWithAudio.map((article, index) => {
                const isActive = currentAudio?.id === article.id && isPlaying;
                const isCurrentTrack = currentAudio?.id === article.id;
                return (
                  <Card
                    key={article.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-all duration-200 ${
                      isActive
                        ? "ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] bg-amber-500/5"
                        : ""
                    }`}
                    onClick={() => {
                      if (isCurrentTrack) {
                        togglePlayPause();
                      } else {
                        // Set playlist starting from this track
                        const items = articlesWithAudio.map((a) => ({
                          id: a.id,
                          titulo: `Art. ${formatNumeroArtigo(a["Número do Artigo"] || "")} - ${codigoNome}`,
                          url_audio: a["Narração"] || "",
                          imagem_miniatura: "/logo.webp",
                          descricao: a["Artigo"] || "",
                          area: codigoNome,
                          tema: `Artigo ${formatNumeroArtigo(a["Número do Artigo"] || "")}`,
                        }));
                        setPlaylist(items);
                        playAudio(items[index]);
                      }
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isActive ? "bg-amber-500 text-black" : "bg-muted"
                        }`}
                      >
                        {isActive ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-sm ${
                            isActive ? "text-amber-500" : ""
                          }`}
                        >
                          Art. {formatNumeroArtigo(article["Número do Artigo"] || "")}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {getPreviewText(article["Artigo"] || "")}
                        </p>
                      </div>
                      <Music className="w-4 h-4 text-amber-500/60 flex-shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
