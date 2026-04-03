import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Heart, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface FavoritoItem {
  area: string;
  tema: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuestoesFavoritosSheet = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState<FavoritoItem[]>([]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem("questoes-favoritos");
      if (raw) {
        setFavoritos(JSON.parse(raw));
      } else {
        setFavoritos([]);
      }
    } catch {
      setFavoritos([]);
    }
  }, [open]);

  const handleClick = (fav: FavoritoItem) => {
    onOpenChange(false);
    const areaSlug = encodeURIComponent(fav.area);
    const temaSlug = encodeURIComponent(fav.tema);
    navigate(`/ferramentas/questoes/${areaSlug}/${temaSlug}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Favoritos
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {favoritos.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum tema favoritado ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Toque no ❤️ nos temas da trilha para salvar</p>
            </div>
          ) : (
            favoritos.map((fav, i) => (
              <button
                key={i}
                onClick={() => handleClick(fav)}
                className="w-full flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:bg-accent/50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-xs text-primary font-medium">{fav.area}</p>
                  <p className="text-sm font-semibold text-foreground">{fav.tema}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
