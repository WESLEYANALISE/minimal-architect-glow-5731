import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import NoticiaCarouselCard from "@/components/NoticiaCarouselCard";
import { useFeaturedNews } from "@/hooks/useFeaturedNews";
import useEmblaCarousel from 'embla-carousel-react';

export const DesktopNewsCarouselBanner = memo(() => {
  const navigate = useNavigate();
  const { featuredNews, loading } = useFeaturedNews();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
    slidesToScroll: 2,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 pt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 xl:w-6 xl:h-6 text-amber-400" />
          <h3 className="text-base xl:text-lg 2xl:text-xl font-bold text-white/90">Notícias Jurídicas</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button onClick={scrollPrev} className="p-1 rounded-full hover:bg-white/10 transition-colors" aria-label="Anterior">
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
            <button onClick={scrollNext} className="p-1 rounded-full hover:bg-white/10 transition-colors" aria-label="Próximo">
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          </div>
          <button
            onClick={() => navigate('/noticias')}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Ver todas
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-white/40" />
        </div>
      ) : featuredNews.length === 0 ? (
        <p className="text-xs text-white/40 text-center py-4">Nenhuma notícia disponível</p>
      ) : (
        <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
          <div className="flex gap-3 xl:gap-4">
            {featuredNews.slice(0, 8).map((noticia, idx) => (
              <div key={noticia.id} className="flex items-stretch gap-3 xl:gap-4 flex-shrink-0">
                {idx > 0 && <div className="w-px bg-white/10 self-stretch flex-shrink-0" />}
                <div className="w-[180px] xl:w-[200px] 2xl:w-[220px] flex-shrink-0">
                  <NoticiaCarouselCard noticia={noticia} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

DesktopNewsCarouselBanner.displayName = 'DesktopNewsCarouselBanner';
