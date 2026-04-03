import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FilmeCenasSlideProps {
  imagens: string[];
  titulo: string;
}

const FilmeCenasSlide = ({ imagens, titulo }: FilmeCenasSlideProps) => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % imagens.length), [imagens.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + imagens.length) % imagens.length), [imagens.length]);

  useEffect(() => {
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next]);

  if (imagens.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
        🎞️ Cenas do Filme
      </h3>
      <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {imagens.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${titulo} - cena ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
          />
        ))}

        {imagens.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imagens.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === current ? "bg-white w-3" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FilmeCenasSlide;
