interface AssinaturaHeroImageProps {
  imageUrl: string | null;
  loading: boolean;
}

const AssinaturaHeroImage = ({ imageUrl, loading }: AssinaturaHeroImageProps) => {
  const placeholderGradient = "bg-gradient-to-br from-amber-900/30 via-zinc-900 to-black";

  if (!imageUrl) {
    return (
      <div className={`relative w-full overflow-hidden ${placeholderGradient}
        h-[220px] sm:h-[280px] md:h-[350px] lg:h-[420px] xl:h-[480px]
      `}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden h-[220px] sm:h-[280px] md:h-[350px] lg:h-[420px] xl:h-[480px]">
      {/* Imagem com zoom-out via CSS puro — GPU accelerated */}
      <img
        src={imageUrl}
        alt="Profissionais do Direito"
        className="absolute inset-0 w-full h-full object-cover object-top hero-zoom-animate"
      />
      
      {/* Gradient overlay no topo */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />
      
      {/* Gradient overlay na parte de baixo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]" />
    </div>
  );
};

export default AssinaturaHeroImage;
