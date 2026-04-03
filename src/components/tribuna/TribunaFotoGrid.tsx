import { FlickrPhoto } from "@/lib/api/flickr";
import { TribunaFotoCard } from "./TribunaFotoCard";

interface Props {
  photos: FlickrPhoto[];
  onPhotoClick: (photo: FlickrPhoto) => void;
}

export const TribunaFotoGrid = ({ photos, onPhotoClick }: Props) => {
  if (!photos.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma foto encontrada</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {photos.map((photo, i) => (
        <TribunaFotoCard
          key={photo.id}
          photo={photo}
          index={i}
          onClick={() => onPhotoClick(photo)}
        />
      ))}
    </div>
  );
};
