import carouselPf from "@/assets/carousel-pf.png?format=webp&quality=75&w=128&h=128";
import carouselPrf from "@/assets/carousel-prf.png?format=webp&quality=75&w=128&h=128";
import carouselOab from "@/assets/carousel-oab.png?format=webp&quality=75&w=128&h=128";
import carouselJuiz from "@/assets/carousel-juiz.png?format=webp&quality=75&w=128&h=128";
import carouselArbitro from "@/assets/carousel-arbitro.png?format=webp&quality=75&w=128&h=128";
import carouselPcivil from "@/assets/carousel-pcivil.png?format=webp&quality=75&w=128&h=128";

const BADGES = [
  { src: carouselPf, alt: "Polícia Federal" },
  { src: carouselPrf, alt: "Polícia Rodoviária Federal" },
  { src: carouselOab, alt: "OAB" },
  { src: carouselJuiz, alt: "Juiz Federal" },
  { src: carouselArbitro, alt: "Tribunal Arbitral" },
  { src: carouselPcivil, alt: "Polícia Civil" },
];

export const BadgeCarousel = () => {
  return (
    <div className="w-full overflow-hidden my-4">
      <div
        className="flex gap-5 animate-[scrollLeft_30s_linear_infinite]"
        style={{ width: "max-content", willChange: "transform" }}
      >
        {/* Duplicate for seamless loop */}
        {[...BADGES, ...BADGES].map((badge, i) => (
          <img
            key={`${badge.alt}-${i}`}
            src={badge.src}
            alt={badge.alt}
            width={64}
            height={64}
            loading="eager"
            fetchPriority={i < 6 ? "high" : "auto"}
            decoding="async"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-amber-500/40 shadow-lg shadow-amber-900/30 flex-shrink-0"
          />
        ))}
      </div>
    </div>
  );
};
