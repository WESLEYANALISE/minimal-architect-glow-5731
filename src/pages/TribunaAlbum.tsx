import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { findInstituicaoBySlug } from "@/lib/tribuna-config";
import { useFlickrAlbumPhotos } from "@/hooks/useFlickrAlbums";
import { FlickrPhoto } from "@/lib/api/flickr";
import { TribunaFotoGrid } from "@/components/tribuna/TribunaFotoGrid";
import { TribunaFotoModal } from "@/components/tribuna/TribunaFotoModal";
import { ArrowLeft, Images, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const TribunaAlbum = () => {
  const navigate = useNavigate();
  const { instituicao: slug, albumId } = useParams<{ instituicao: string; albumId: string }>();
  const [selectedPhoto, setSelectedPhoto] = useState<FlickrPhoto | null>(null);

  const inst = slug ? findInstituicaoBySlug(slug) : undefined;
  const { data: pages, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFlickrAlbumPhotos(inst?.username, albumId);

  const allPhotos = useMemo(() => pages?.pages.flatMap(p => p?.photo || []) || [], [pages]);
  const albumTitle = pages?.pages[0]?.title || "Álbum";

  if (!inst) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/tribuna/${slug}`)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="bg-purple-900/20 rounded-2xl p-3 shadow-lg">
            <Images className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight line-clamp-1">{albumTitle}</h1>
            <p className="text-muted-foreground text-xs">{inst.nome}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
          </div>
        ) : (
          <>
            <TribunaFotoGrid photos={allPhotos} onPhotoClick={setSelectedPhoto} />
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <TribunaFotoModal
        photo={selectedPhoto}
        photos={allPhotos}
        instituicaoSlug={slug || ""}
        onClose={() => setSelectedPhoto(null)}
        onNavigate={setSelectedPhoto}
      />
    </div>
  );
};

export default TribunaAlbum;
