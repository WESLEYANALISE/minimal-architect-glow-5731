import { useState, useRef, useCallback } from "react";
import { FlickrPhoto, getFlickrPhotoUrl, getFlickrPhotoLink } from "@/lib/api/flickr";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Heart, MessageCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from "lucide-react";
import { useToggleTribunaFavorito, useIsFavorito } from "@/hooks/useTribunaFavoritos";
import { TribunaComentariosSection } from "./TribunaComentariosSection";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  photo: FlickrPhoto | null;
  photos: FlickrPhoto[];
  instituicaoSlug: string;
  onClose: () => void;
  onNavigate: (photo: FlickrPhoto) => void;
}

export const TribunaFotoModal = ({ photo, photos, instituicaoSlug, onClose, onNavigate }: Props) => {
  const [showComments, setShowComments] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFavorito = useIsFavorito(photo?.id);
  const toggleFav = useToggleTribunaFavorito();

  if (!photo) return null;

  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handleFavorite = () => {
    toggleFav.mutate({
      fotoFlickrId: photo.id,
      instituicaoSlug,
      fotoUrl: getFlickrPhotoUrl(photo, "z"),
      fotoTitulo: photo.title,
      isFavorito,
    });
  };

  const handleNavigate = (nextPhoto: FlickrPhoto) => {
    onNavigate(nextPhoto);
    setShowComments(false);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  };

  const handleToggleZoom = () => {
    if (zoomed) {
      setZoomed(false);
      setPan({ x: 0, y: 0 });
    } else {
      setZoomed(true);
      setPan({ x: 0, y: 0 });
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!zoomed) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || !zoomed) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.startPanX + dx, y: dragRef.current.startPanY + dy });
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!zoomed || e.touches.length !== 1) return;
    const touch = e.touches[0];
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, startPanX: pan.x, startPanY: pan.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current || !zoomed || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - dragRef.current.startX;
    const dy = touch.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.startPanX + dx, y: dragRef.current.startPanY + dy });
  };

  const handleTouchEnd = () => {
    dragRef.current = null;
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // Only toggle zoom if not dragging
    if (dragRef.current) return;
    handleToggleZoom();
  };

  return (
    <Dialog open={!!photo} onOpenChange={() => { onClose(); setShowComments(false); setZoomed(false); setPan({ x: 0, y: 0 }); }}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden bg-neutral-900 border-white/10 [&>button]:hidden">
        <div className="relative flex flex-col">
          {/* Close button */}
          <button
            onClick={() => { onClose(); setShowComments(false); setZoomed(false); setPan({ x: 0, y: 0 }); }}
            className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Main image area */}
          <div className="relative">
            {/* Navigation arrows */}
            {hasPrev && (
              <button
                onClick={() => handleNavigate(photos[currentIndex - 1])}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {hasNext && (
              <button
                onClick={() => handleNavigate(photos[currentIndex + 1])}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div
              ref={containerRef}
              className={`w-full bg-black overflow-hidden ${zoomed ? "max-h-[70vh] cursor-grab active:cursor-grabbing" : "max-h-[55vh] cursor-zoom-in"}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={!zoomed ? handleImageClick : undefined}
            >
              <img
                src={getFlickrPhotoUrl(photo, "b")}
                alt={photo.title || "Foto"}
                draggable={false}
                className={`transition-transform duration-300 select-none ${zoomed ? "w-auto max-w-none scale-[2]" : "w-full object-contain"}`}
                style={zoomed ? { transform: `scale(2) translate(${pan.x / 2}px, ${pan.y / 2}px)`, transformOrigin: "center center" } : undefined}
              />
            </div>
          </div>

          {/* Info below image */}
          <div className="p-4 space-y-1">
            {photo.title && <h3 className="text-foreground font-semibold text-sm break-words">{photo.title}</h3>}
            {photo.datetaken && (
              <p className="text-muted-foreground text-xs">
                {new Date(photo.datetaken).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            )}
            {photo.description?._content && (
              <p className="text-muted-foreground text-xs break-words">{photo.description._content}</p>
            )}
          </div>

          {/* Action buttons below - horizontal */}
          <div className="flex items-center gap-4 px-4 pb-3 border-t border-white/5 pt-3">
            <button onClick={handleFavorite} className="flex items-center gap-2 group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isFavorito ? "bg-red-500/20" : "bg-white/5 group-hover:bg-white/10"
              }`}>
                <Heart className={`w-5 h-5 transition-all ${
                  isFavorito ? "fill-red-500 text-red-500" : "text-white group-hover:scale-110"
                }`} />
              </div>
              <span className="text-xs text-white/60">Curtir</span>
            </button>

            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                showComments ? "bg-primary/20" : "bg-white/5 group-hover:bg-white/10"
              }`}>
                <MessageCircle className={`w-5 h-5 transition-all ${
                  showComments ? "text-primary" : "text-white group-hover:scale-110"
                }`} />
              </div>
              <span className="text-xs text-white/60">Comentar</span>
            </button>

            <button onClick={handleToggleZoom} className="flex items-center gap-2 group ml-auto">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                zoomed ? "bg-primary/20" : "bg-white/5 group-hover:bg-white/10"
              }`}>
                {zoomed ? (
                  <ZoomOut className="w-5 h-5 text-primary" />
                ) : (
                  <ZoomIn className="w-5 h-5 text-white group-hover:scale-110" />
                )}
              </div>
              <span className="text-xs text-white/60">Zoom</span>
            </button>
          </div>
        </div>

        {/* Comments panel - slides open below */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-white/10"
            >
              <div className="p-4 max-h-[30vh] overflow-y-auto">
                <TribunaComentariosSection fotoFlickrId={photo.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};