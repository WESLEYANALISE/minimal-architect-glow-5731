import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const BibliotecaVideoaula = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoUrl = searchParams.get("video") || "";
  const titulo = searchParams.get("titulo") || "";
  const autor = searchParams.get("autor") || "";
  const sobre = searchParams.get("sobre") || "";
  const capa = searchParams.get("capa") || "";

  // Extract YouTube video ID
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
    return match?.[1] || "";
  };

  const videoId = getYoutubeId(videoUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : "";

  return (
    <div className="flex flex-col h-screen bg-black overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/90 border-b border-white/10 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/10 h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-white/80 truncate">
          Análise em Vídeo
        </span>
      </div>

      {/* YouTube iframe */}
      <div className="w-full aspect-video flex-shrink-0">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={titulo}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white/50">
            Vídeo não disponível
          </div>
        )}
      </div>

      {/* Book info below the video */}
      {titulo && (
        <div className="px-4 py-4 flex gap-3">
          {capa && (
            <img
              src={capa}
              alt={titulo}
              className="w-14 h-20 object-cover rounded-lg shadow-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white">{titulo}</h3>
            {autor && (
              <p className="text-sm text-white/60 mt-0.5">{autor}</p>
            )}
            {sobre && (
              <p className="text-xs text-white/40 mt-2 leading-relaxed line-clamp-3">
                {sobre}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BibliotecaVideoaula;
