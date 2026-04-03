import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { Newspaper, ChevronRight, Loader2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import NoticiaCarouselCard from "@/components/NoticiaCarouselCard";
import { useFeaturedNews } from "@/hooks/useFeaturedNews";

export function HomeNoticiasSlide() {
  const navigate = useTransitionNavigate();
  const { featuredNews, loading } = useFeaturedNews();

  return (
    <div className="bg-gradient-to-b from-red-950 via-red-900/95 to-red-950 backdrop-blur-sm rounded-2xl border border-red-800/30 overflow-hidden h-full flex flex-col">
      {/* Animated top line */}
      <div className="relative h-6 flex items-center justify-center">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-red-800/40 to-transparent" />
        <div className="absolute inset-x-0 top-1/2 h-px overflow-hidden">
          <div
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent"
            style={{ animation: "shimmerLineNews 3s ease-in-out infinite" }}
          />
        </div>
        <div className="relative z-10 px-3 bg-red-950 rounded">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
            <span className="text-[8px] text-white uppercase tracking-widest font-bold">
              Notícias Jurídicas
            </span>
            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
          </div>
        </div>
      </div>

      <div className="px-3.5 pb-3.5 space-y-3 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Newspaper className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Últimas Notícias</h3>
              <p className="text-[10px] text-white/60">Atualizações do mundo jurídico</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/noticias-juridicas")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-medium hover:bg-white/20 transition-colors"
          >
            Ver todas
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* News carousel */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-white/50" />
          </div>
        ) : featuredNews.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-white/40">Nenhuma notícia disponível</p>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-2.5 pb-1 [&>*]:!w-[190px] [&>*]:flex-shrink-0">
              {featuredNews.slice(0, 6).map((noticia) => (
                <NoticiaCarouselCard key={noticia.id} noticia={noticia} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      <style>{`
        @keyframes shimmerLineNews {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
