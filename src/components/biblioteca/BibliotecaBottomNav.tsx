import { Heart, ListVideo, Search, BookMarked, Compass, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";

export type BibliotecaBottomTab = 'buscar' | 'plano' | 'favoritos' | 'livrodia' | 'explorar';

interface BibliotecaBottomNavProps {
  activeTab: BibliotecaBottomTab;
  onTabChange: (tab: BibliotecaBottomTab) => void;
}

export const BibliotecaBottomNav = ({ activeTab, onTabChange }: BibliotecaBottomNavProps) => {
  const { isNative } = useCapacitorPlatform();
  const hasSubTabActive = activeTab !== null && activeTab !== 'buscar';

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-amber-500/20 bg-[hsl(30_20%_8%/0.95)] backdrop-blur-md rounded-t-2xl animate-[slideUpNav_400ms_cubic-bezier(0.16,1,0.3,1)]",
        isNative && "pb-safe"
      )}
      style={isNative ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
    >
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="grid grid-cols-5 items-end">
          {/* Plano */}
          <button
            onClick={() => onTabChange('plano')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all nav-item-tap",
              activeTab === 'plano'
                ? "text-amber-400 bg-amber-500/15 ring-1 ring-amber-500/20"
                : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
            )}
          >
            <ListVideo className={cn("w-6 h-6 transition-transform", activeTab === 'plano' && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Plano</span>
          </button>

          {/* Favoritos */}
          <button
            onClick={() => onTabChange('favoritos')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all nav-item-tap",
              activeTab === 'favoritos'
                ? "text-amber-400 bg-amber-500/15 ring-1 ring-amber-500/20"
                : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
            )}
          >
            <Heart className={cn("w-6 h-6 transition-transform", activeTab === 'favoritos' && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Favoritos</span>
          </button>

          {/* Botão Central - Buscar ou Acervo */}
          <div className="flex flex-col items-center -mt-6">
            <button
              onClick={() => hasSubTabActive ? onTabChange(null as any) : onTabChange('buscar')}
              className="relative overflow-hidden w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-[0_6px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_10px_30px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-90 transition-all duration-300 flex items-center justify-center"
            >
              {hasSubTabActive ? (
                <Library className="w-7 h-7 text-white relative z-10" />
              ) : (
                <Search className="w-7 h-7 text-white relative z-10" />
              )}
              <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <span className="absolute top-0 left-[-100%] w-[60%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[searchShine_3s_ease-in-out_infinite] skew-x-[-20deg]" />
              </span>
            </button>
            <span className="text-[10px] font-medium text-amber-400 mt-1">{hasSubTabActive ? 'Acervo' : 'Buscar'}</span>
          </div>

          {/* Livro do Dia */}
          <button
            onClick={() => onTabChange('livrodia')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all nav-item-tap",
              activeTab === 'livrodia'
                ? "text-amber-400 bg-amber-500/15 ring-1 ring-amber-500/20"
                : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
            )}
          >
            <BookMarked className={cn("w-6 h-6 transition-transform", activeTab === 'livrodia' && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Livro do Dia</span>
          </button>

          {/* Explorar */}
          <button
            onClick={() => onTabChange('explorar')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all nav-item-tap",
              activeTab === 'explorar'
                ? "text-amber-400 bg-amber-500/15 ring-1 ring-amber-500/20"
                : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
            )}
          >
            <Compass className={cn("w-6 h-6 transition-transform", activeTab === 'explorar' && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Explorar</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
