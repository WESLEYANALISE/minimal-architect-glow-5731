import { Heart } from "lucide-react";
import { useJuriflixFavorito } from "@/hooks/useJuriflixFavorito";
import { cn } from "@/lib/utils";

interface Props {
  juriflixId: number;
  className?: string;
  size?: "sm" | "md";
}

export const JuriflixFavoritoButton = ({ juriflixId, className, size = "sm" }: Props) => {
  const { isFavorited, toggle, isLoading } = useJuriflixFavorito(juriflixId);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={isLoading}
      className={cn(
        "rounded-full backdrop-blur-sm transition-all duration-200 active:scale-90",
        size === "sm" ? "p-1.5 bg-black/60 hover:bg-black/80" : "p-2 bg-black/60 hover:bg-black/80",
        className
      )}
      aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        className={cn(
          "transition-colors",
          size === "sm" ? "w-4 h-4" : "w-5 h-5",
          isFavorited ? "fill-red-500 text-red-500" : "text-white"
        )}
      />
    </button>
  );
};
