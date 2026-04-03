import { FlickrPhoto, getFlickrPhotoUrl } from "@/lib/api/flickr";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";

interface Props {
  photo: FlickrPhoto;
  index: number;
  onClick: () => void;
}

const formatDate = (photo: FlickrPhoto): string | null => {
  if (photo.datetaken) {
    const d = new Date(photo.datetaken);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
      " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  if (photo.dateupload) {
    const d = new Date(Number(photo.dateupload) * 1000);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
      " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return null;
};

export const TribunaFotoCard = ({ photo, index, onClick }: Props) => {
  const dateStr = formatDate(photo);

  return (
    <motion.button
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: (index % 12) * 0.05, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className="group overflow-hidden rounded-xl bg-neutral-800/50 border border-white/5 hover:border-white/15 transition-all duration-200 text-left"
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={getFlickrPhotoUrl(photo, "n")}
          alt={photo.title || "Foto"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
          <Camera className="w-3.5 h-3.5 text-white/80" />
        </div>
      </div>
      <div className="p-2 bg-neutral-800/90 space-y-0.5">
        {photo.title && (
          <p className="text-foreground text-xs font-medium break-words">{photo.title}</p>
        )}
        {dateStr && (
          <p className="text-muted-foreground text-[10px]">{dateStr}</p>
        )}
        {!photo.title && !dateStr && (
          <p className="text-muted-foreground text-[10px]">Sem informações</p>
        )}
      </div>
    </motion.button>
  );
};
