/**
 * SparkleHeroTitle
 * Título hero com efeito de brilhos animados, igual às saudações da Home.
 */

interface SparkleHeroTitleProps {
  line1: string;
  line2: string;
  color?: string; // cor dos brilhos, ex: 'amber-400', 'white', 'sky-300'
  colorHex?: string; // cor direta em hex/rgb para o gradiente e partículas
}

const SparkleHeroTitle = ({
  line1,
  line2,
  colorHex = 'rgba(255,255,255,0.8)',
}: SparkleHeroTitleProps) => {
  return (
    <div className="text-center" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.7)' }}>
      <p className="font-playfair text-2xl font-semibold text-white/90 leading-tight">{line1}</p>
      <p className="font-playfair text-3xl font-bold text-white leading-tight">{line2}</p>
      <div className="relative mx-auto mt-2 w-[60%]">
        <div
          className="h-[1.5px]"
          style={{
            background: `linear-gradient(to right, transparent, ${colorHex}, transparent)`,
          }}
        />
        <div className="relative h-5 overflow-hidden">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                backgroundColor: colorHex,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `-1px`,
                opacity: 0,
                animation: `sparkle-fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SparkleHeroTitle;
