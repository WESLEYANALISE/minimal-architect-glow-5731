import { useState, useEffect, memo } from "react";
import { createPortal } from "react-dom";
import { X, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoPlayer from "@/components/VideoPlayer";

import logoImg from "@/assets/logo-direito-premium-new.webp";

interface VideoImersivProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  titulo: string;
  autor?: string;
  capaUrl?: string | null;
}

const getYoutubeId = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) return urlObj.searchParams.get("v") || "";
    if (urlObj.hostname.includes("youtu.be")) return urlObj.pathname.slice(1);
  } catch {}
  const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/);
  return match?.[1] || "";
};

export const VideoImersivo = memo(({ isOpen, onClose, videoUrl, titulo, autor, capaUrl }: VideoImersivProps) => {
  const [videoPlaying, setVideoPlaying] = useState(false);

  const youtubeId = getYoutubeId(videoUrl);
  const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : "";

  // Auto-play video when modal opens
  useEffect(() => {
    if (isOpen) {
      setVideoPlaying(true);
    } else {
      setVideoPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex flex-col"
        onClick={() => { onClose(); setVideoPlaying(false); }}
      >
        {/* Fundo com capa desfocada */}
        {capaUrl && (
          <img
            src={capaUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-110"
            style={{ filter: "blur(20px) brightness(0.45)" }}
          />
        )}
        <div className="absolute inset-0 bg-black/30" />

        {/* Botão fechar */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => { onClose(); setVideoPlaying(false); }}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Conteúdo centralizado */}
        <div className="relative flex-1 flex flex-col items-center justify-center gap-3 px-0 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          
          {/* Logo Direito Prime - posição cabeçalho esquerda */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="absolute top-4 left-4 z-10 flex items-center gap-2"
          >
            <img src={logoImg} alt="Direito Prime" className="w-8 h-8 object-contain drop-shadow-lg" />
            <span className="text-white/90 font-bold text-sm tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Direito Prime</span>
          </motion.div>

          {/* Capa do livro + holofote + info */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-2 relative"
          >
            {/* Holofote - múltiplas camadas */}
            <div className="absolute pointer-events-none" style={{
              width: '300px',
              height: '80vh',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}>
              {/* Camada principal do feixe */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to bottom, rgba(255,220,150,0.01) 0%, rgba(255,220,150,0.04) 15%, rgba(255,200,100,0.1) 40%, rgba(255,200,100,0.18) 65%, rgba(255,220,150,0.3) 85%, rgba(255,235,180,0.45) 100%)',
                clipPath: 'polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)',
                filter: 'blur(6px)',
                animation: 'spotlight-pulse 3s ease-in-out infinite',
              }} />
              {/* Camada de brilho central mais intensa */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.2) 85%, rgba(255,255,255,0.35) 100%)',
                clipPath: 'polygon(42% 0%, 58% 0%, 75% 100%, 25% 100%)',
                filter: 'blur(4px)',
                animation: 'spotlight-pulse 3s ease-in-out infinite 0.5s',
              }} />
              {/* Partículas de poeira no feixe */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 50% 70%, rgba(255,220,150,0.15) 0%, transparent 40%)',
                animation: 'spotlight-pulse 5s ease-in-out infinite 1s',
              }} />
              {/* Degradê + brilho na base do holofote */}
              <div className="absolute bottom-0 left-0 right-0 h-[20%]" style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(255,220,150,0.12) 50%, rgba(255,235,180,0.25) 100%)',
                filter: 'blur(12px)',
              }} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[8%] rounded-full" style={{
                background: 'radial-gradient(ellipse, rgba(255,220,150,0.5) 0%, rgba(255,200,100,0.2) 50%, transparent 80%)',
                filter: 'blur(8px)',
                animation: 'spotlight-pulse 3s ease-in-out infinite',
              }} />
            </div>

            {capaUrl && (
              <div className="relative z-10">
                <div className="relative overflow-hidden rounded-md" style={{ 
                  boxShadow: '0 0 50px rgba(255,200,100,0.25), 0 0 100px rgba(255,200,100,0.1), 0 20px 60px rgba(0,0,0,0.6)' 
                }}>
                  <img
                    src={capaUrl}
                    alt={titulo}
                    className="w-32 h-44 object-cover"
                  />
                </div>
                {/* Reflexo embaixo da capa */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-3 rounded-full" style={{
                  background: 'radial-gradient(ellipse, rgba(255,220,150,0.4) 0%, transparent 70%)',
                  filter: 'blur(4px)',
                }} />
              </div>
            )}
            <div className="text-center relative z-10">
              <h3 className="text-white font-semibold text-base leading-tight drop-shadow-lg">{titulo}</h3>
              {autor && <p className="text-white/60 text-xs mt-0.5">{autor}</p>}
            </div>
          </motion.div>

          {/* Vídeo ou Thumbnail */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="relative w-full aspect-video overflow-hidden shadow-2xl"
          >
            {videoPlaying ? (
              <VideoPlayer src={videoUrl} autoPlay />
            ) : (
              <button
                onClick={() => setVideoPlaying(true)}
                className="relative w-full h-full group cursor-pointer"
              >
                <img
                  src={thumbnailUrl || capaUrl || ""}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-primary-foreground ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </button>
            )}
          </motion.div>

        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
});

VideoImersivo.displayName = "VideoImersivo";
