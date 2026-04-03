import { useNavigate, useLocation } from "react-router-dom";
import { Search, Heart, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";
import { useState } from "react";
import { QuestoesFavoritosSheet } from "./QuestoesFavoritosSheet";
import { QuestoesDesafioSheet } from "./QuestoesDesafioSheet";

interface QuestoesBottomNavProps {
  onPesquisar?: () => void;
}

export const QuestoesBottomNav = ({ onPesquisar }: QuestoesBottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isNative } = useCapacitorPlatform();
  const [favoritosOpen, setFavoritosOpen] = useState(false);
  const [desafioOpen, setDesafioOpen] = useState(false);

  const handlePesquisar = () => {
    if (location.pathname !== "/ferramentas/questoes") {
      navigate("/ferramentas/questoes?tab=pesquisar");
    } else {
      onPesquisar?.();
    }
  };

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card rounded-t-2xl",
          isNative && "pb-safe"
        )}
        style={isNative ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" } : undefined}
      >
        <div className="max-w-2xl mx-auto px-2 py-2">
          <div className="grid grid-cols-3 items-end">
            {/* Pesquisar */}
            <button
              onClick={handlePesquisar}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
            >
              <Search className="w-6 h-6" />
              <span className="text-[10px] font-medium leading-tight text-center">Pesquisar</span>
            </button>

            {/* Favoritos */}
            <button
              onClick={() => setFavoritosOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
            >
              <Heart className="w-6 h-6" />
              <span className="text-[10px] font-medium leading-tight text-center">Favoritos</span>
            </button>

            {/* Desafio */}
            <button
              onClick={() => setDesafioOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
            >
              <Flame className="w-6 h-6" />
              <span className="text-[10px] font-medium leading-tight text-center">Desafio</span>
            </button>
          </div>
        </div>
      </nav>

      <QuestoesFavoritosSheet open={favoritosOpen} onOpenChange={setFavoritosOpen} />
      <QuestoesDesafioSheet open={desafioOpen} onOpenChange={setDesafioOpen} />
    </>
  );
};
