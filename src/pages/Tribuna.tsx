import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TRIBUNA_CATEGORIAS, CATEGORIA_COLORS } from "@/lib/tribuna-config";
import { Camera, ImageIcon } from "lucide-react";
import { useFlickrPhotoCount } from "@/hooks/useFlickrPhotos";
import { motion } from "framer-motion";

const Tribuna = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="bg-[#d4af37]/10 rounded-2xl p-3 shadow-lg ring-1 ring-[#d4af37]/20">
            <Camera className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h1 className="font-playfair text-2xl font-bold text-foreground tracking-tight">Tribuna</h1>
            <p className="text-muted-foreground text-sm">Galeria institucional via Flickr</p>
          </div>
        </div>

        {/* Categories */}
        {TRIBUNA_CATEGORIAS.map((cat) => {
          const catColors = CATEGORIA_COLORS[cat.color] || CATEGORIA_COLORS.purple;
          const Icon = cat.icon;
          return (
            <div key={cat.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`${catColors.bg} rounded-lg p-1.5`}>
                  <Icon className={`w-4 h-4 ${catColors.text}`} />
                </div>
                <h2 className="text-base font-bold text-foreground">{cat.label}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {cat.instituicoes.map((inst, i) => (
                  <TribunaInstCard key={inst.slug} inst={inst} index={i} onNavigate={() => navigate(`/tribuna/${inst.slug}`)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface TribunaInstCardProps {
  inst: { slug: string; nome: string; descricao: string; capa?: string; username: string };
  index: number;
  onNavigate: () => void;
}

const TribunaInstCard = ({ inst, index, onNavigate }: TribunaInstCardProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const { data: photoCount } = useFlickrPhotoCount(inst.username);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
      className="group overflow-hidden rounded-2xl border border-white/5 hover:border-white/15 transition-all shadow-lg cursor-pointer relative"
      onClick={onNavigate}
    >
      {/* Image with zoom-out effect */}
      {inst.capa ? (
        <div className="overflow-hidden relative">
          {!imgLoaded && (
            <div className="w-full aspect-[16/10] bg-neutral-800 animate-pulse" />
          )}
          <img
            src={inst.capa}
            alt={inst.nome}
            className={`w-full aspect-[16/10] object-cover transition-all duration-700 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            onLoad={() => setImgLoaded(true)}
          />
          {/* Gradient + Acessar button over image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <span className="relative overflow-hidden inline-flex items-center justify-center bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg shadow-red-600/30 transition-colors">
              Acessar
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
                  animation: 'shimmer-slide 3s ease-in-out infinite',
                }}
              />
            </span>
          </div>
        </div>
      ) : (
        <div className="h-40 bg-neutral-800/70 flex items-center justify-center">
          <Camera className="w-10 h-10 text-muted-foreground/20" />
        </div>
      )}
      {/* Info below image */}
      <div className="bg-neutral-800/90 p-4 space-y-2">
        <h4 className="text-sm font-bold text-foreground">
          {inst.slug.toUpperCase()} — <span className="font-normal text-foreground">{inst.nome}</span>
        </h4>
        <p className="text-xs text-muted-foreground break-words">
          {inst.descricao}
        </p>
        {photoCount != null && photoCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ImageIcon className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground">
              {photoCount >= 1000 ? `${(photoCount / 1000).toFixed(1).replace('.0', '')} mil` : photoCount}
            </span>
            <span>fotos no acervo</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Tribuna;
