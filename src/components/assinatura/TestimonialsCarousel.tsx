import { useRef, useState, useCallback } from "react";
import { Star } from "lucide-react";

import dep1 from "@/assets/depoimentos/depoimento-1.png";
import dep2 from "@/assets/depoimentos/depoimento-2.png";
import dep3 from "@/assets/depoimentos/depoimento-3.png";
import dep4 from "@/assets/depoimentos/depoimento-4.png";
import dep5 from "@/assets/depoimentos/depoimento-5.png";
import dep6 from "@/assets/depoimentos/depoimento-6.png";
import dep7 from "@/assets/depoimentos/depoimento-7.png";
import dep8 from "@/assets/depoimentos/depoimento-8.png";
import dep9 from "@/assets/depoimentos/depoimento-9.png";

const DEPOIMENTOS = [dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8, dep9];

export const TestimonialsCarousel = () => {
  const [isTouching, setIsTouching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTouchStart = useCallback(() => {
    setIsTouching(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsTouching(false), 3000);
  }, []);

  return (
    <div className="w-full py-6">
      {/* Frase persuasiva */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        <p
          className="text-amber-400/90 text-sm font-semibold tracking-wide"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          O que nossos alunos dizem
        </p>
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
      </div>

      {/* Carrossel */}
      <div
        className="w-full overflow-x-auto -mx-6 scrollbar-hide"
        style={{
          width: "calc(100% + 3rem)",
          WebkitOverflowScrolling: "touch",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex gap-3 px-6 animate-[scrollLeft_90s_linear_infinite]"
          style={{
            width: "max-content",
            willChange: "transform",
            animationPlayState: isTouching ? "paused" : "running",
          }}
        >
          {[...DEPOIMENTOS, ...DEPOIMENTOS].map((src, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[260px] testimonial-glow-card shine-effect"
            >
              <img
                src={src}
                alt={`Depoimento de aluno ${(i % DEPOIMENTOS.length) + 1}`}
                loading="eager"
                decoding="async"
                className="w-full h-auto block rounded-xl"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsCarousel;
