import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface SlideData {
  image: string;
  title?: string;
  subtitle?: string;
}

interface Props {
  imagens?: string[];
  slides?: SlideData[];
  titulo?: string;
  intervalo?: number;
}

export default function ImagensCarousel({ imagens, slides, titulo = "", intervalo = 5000 }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const resolvedSlides: SlideData[] = slides
    ? slides
    : (imagens || []).map((img) => ({ image: img }));

  const total = resolvedSlides.length;

  const next = useCallback(() => setCurrent((p) => (p + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const timer = setInterval(next, intervalo);
    return () => clearInterval(timer);
  }, [paused, total, intervalo, next]);

  if (total === 0) return null;

  const slide = resolvedSlides[current];
  const hasText = slide.title || slide.subtitle;

  return (
    <div
      className="relative rounded-xl overflow-hidden aspect-[16/10] bg-black/30"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ willChange: "transform, opacity" }}
        >
          <img
            src={slide.image}
            alt={slide.title || `${titulo} - ${current + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />

          {/* Dark gradient overlay from bottom */}
          {hasText && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          )}

          {/* Text content */}
          {hasText && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-4 pb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              {slide.title && (
                <h3 className="text-sm font-bold text-white leading-tight mb-1">{slide.title}</h3>
              )}
              {slide.subtitle && (
                <p className="text-[11px] text-white/80 leading-relaxed">{slide.subtitle}</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/80 hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {resolvedSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
