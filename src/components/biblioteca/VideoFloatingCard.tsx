import { X } from "lucide-react";
import { memo } from "react";

interface VideoFloatingCardProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  titulo: string;
  autor?: string;
  capaUrl?: string | null;
  sobre?: string | null;
}

const getYoutubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
  return match?.[1] || "";
};

export const VideoFloatingCard = memo(({ isOpen, onClose, videoUrl, titulo, autor, capaUrl, sobre }: VideoFloatingCardProps) => {
  if (!isOpen) return null;

  const videoId = getYoutubeId(videoUrl);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
    : "";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50 animate-fade-in" onClick={onClose} />
      
      {/* Card flutuante */}
      <div className="fixed inset-x-3 top-[10vh] bottom-[10vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[min(90vw,640px)] z-50 flex flex-col bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10 shrink-0">
          <span className="text-sm font-semibold text-white truncate pr-3">{titulo}</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Video */}
        <div className="w-full aspect-video shrink-0">
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

        {/* Info do livro */}
        <div className="px-4 py-3 flex gap-3 overflow-y-auto flex-1 min-h-0">
          {capaUrl && (
            <img
              src={capaUrl}
              alt={titulo}
              className="w-12 h-[72px] object-cover rounded-lg shadow-lg shrink-0"
            />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white">{titulo}</h3>
            {autor && <p className="text-xs text-white/60 mt-0.5">{autor}</p>}
            {sobre && <p className="text-[11px] text-white/40 mt-1 leading-relaxed line-clamp-3">{sobre}</p>}
          </div>
        </div>
      </div>
    </>
  );
});

VideoFloatingCard.displayName = "VideoFloatingCard";
