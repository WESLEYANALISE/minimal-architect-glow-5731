import { Heart } from "lucide-react";
import { useVideoaulaFavorito } from "@/hooks/useVideoaulaFavorito";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface VideoFavoritoButtonProps {
  tabela: string;
  videoId: string;
  titulo: string;
  thumbnail?: string | null;
}

const VideoFavoritoButton = ({ tabela, videoId, titulo, thumbnail }: VideoFavoritoButtonProps) => {
  const { user } = useAuth();
  const { isFavorited, toggle, isLoading } = useVideoaulaFavorito(tabela, videoId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return;
    toggle({ titulo, thumbnail });
  };

  if (!user) return null;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all",
        isFavorited
          ? "bg-red-600 shadow-lg scale-100"
          : "bg-black/50 hover:bg-black/70 scale-90 hover:scale-100"
      )}
    >
      <Heart
        className={cn(
          "w-3.5 h-3.5 transition-all",
          isFavorited ? "fill-white text-white" : "text-white/80"
        )}
      />
    </button>
  );
};

export default VideoFavoritoButton;
