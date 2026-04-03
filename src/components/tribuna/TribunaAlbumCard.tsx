import { FlickrPhotoset } from "@/lib/api/flickr";
import { motion } from "framer-motion";
import { Images } from "lucide-react";

interface Props {
  album: FlickrPhotoset;
  index: number;
  onClick: () => void;
}

export const TribunaAlbumCard = ({ album, index, onClick }: Props) => {
  const thumbUrl = album.primary_photo_extras?.url_n || album.primary_photo_extras?.url_z || album.primary_photo_extras?.url_q;
  const photoCount = Number(album.photos) || 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35, delay: (index % 8) * 0.06 }}
      onClick={onClick}
      className="group bg-neutral-800/70 hover:bg-neutral-700/80 rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all text-left"
    >
      {thumbUrl ? (
        <div className="aspect-video overflow-hidden">
          <img src={thumbUrl} alt={album.title._content} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </div>
      ) : (
        <div className="aspect-video bg-neutral-700/50 flex items-center justify-center">
          <Images className="w-8 h-8 text-muted-foreground/30" />
        </div>
      )}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-foreground break-words group-hover:text-primary transition-colors">
          {album.title._content}
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">{photoCount} foto{photoCount !== 1 ? "s" : ""}</p>
      </div>
    </motion.button>
  );
};
