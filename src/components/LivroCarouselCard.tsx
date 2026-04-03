import { memo } from "react";
import { Crown } from "lucide-react";

interface LivroCarouselCardProps {
  titulo: string;
  capaUrl: string | null;
  onClick: () => void;
  numero?: number;
  priority?: boolean;
  isPremiumLocked?: boolean;
  showYear?: string;
}

export const LivroCarouselCard = memo(({ titulo, capaUrl, onClick, numero, priority, isPremiumLocked, showYear }: LivroCarouselCardProps) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer active:scale-95 transition-transform duration-150 flex flex-col gap-1.5"
    >
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-gradient-to-br from-amber-900/30 via-stone-800/40 to-stone-900/50 cover-reflection">
        {isPremiumLocked && (
          <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white text-[9px] font-semibold shadow-lg">
            <Crown className="w-2.5 h-2.5" />
          </div>
        )}
        {showYear && (
          <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-full bg-black/70 border border-red-500/60 text-[9px] font-bold text-red-400 shadow-lg">
            {showYear}
          </div>
        )}
        {!isPremiumLocked && numero && (
          <div className="absolute top-1.5 right-1.5 z-10 bg-black/50 rounded-full w-6 h-6 flex items-center justify-center">
            <span className="text-white/70 text-[10px]">{numero}</span>
          </div>
        )}
        {capaUrl ? (
          <img
            src={capaUrl}
            alt={titulo}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            fetchPriority={priority ? "high" : undefined}
            className={`w-full h-full object-cover ${isPremiumLocked ? 'opacity-60' : ''}`}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center ${isPremiumLocked ? 'opacity-60' : ''}`}>
            <span className="text-3xl">📚</span>
          </div>
        )}
        {/* Shine sweep animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[3] rounded-xl">
          <div
            className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent skew-x-[-20deg]"
            style={{ animation: 'shinePratique 4s ease-in-out infinite 1s' }}
          />
        </div>
        {/* Reflection handled by cover-reflection class */}
        {/* Título dentro da capa, na parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2 pt-6 pb-2 pointer-events-none">
          <p
            className="text-white text-[11px] leading-tight line-clamp-2 drop-shadow-lg"
            style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontWeight: 700 }}
          >
            {titulo}
          </p>
        </div>
      </div>
    </div>
  );
});