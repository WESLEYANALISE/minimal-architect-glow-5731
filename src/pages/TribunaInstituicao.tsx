import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { findInstituicaoBySlug, findCategoriaBySlug, CATEGORIA_COLORS } from "@/lib/tribuna-config";
import { useFlickrPhotos, useFlickrSearch } from "@/hooks/useFlickrPhotos";
import { useFlickrAlbums } from "@/hooks/useFlickrAlbums";
import { FlickrPhoto } from "@/lib/api/flickr";
import { TribunaFotoGrid } from "@/components/tribuna/TribunaFotoGrid";
import { TribunaFotoModal } from "@/components/tribuna/TribunaFotoModal";
import { TribunaAlbumCard } from "@/components/tribuna/TribunaAlbumCard";
import { ArrowLeft, Camera, Search, Images, Loader2, ImageIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

const AnimatedCounter = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace(".0", "")} mil`;
    return Math.round(v).toString();
  });

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
};

const TribunaInstituicao = () => {
  const navigate = useNavigate();
  const { instituicao: slug } = useParams<{ instituicao: string }>();
  const [searchText, setSearchText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<FlickrPhoto | null>(null);
  const [tab, setTab] = useState("recentes");

  const inst = slug ? findInstituicaoBySlug(slug) : undefined;
  const cat = slug ? findCategoriaBySlug(slug) : undefined;
  const colors = CATEGORIA_COLORS[cat?.color || "purple"];

  const { data: photosPages, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: loadingPhotos } = useFlickrPhotos(inst?.username);
  const { data: searchPages, fetchNextPage: fetchNextSearch, hasNextPage: hasNextSearch, isFetchingNextPage: isFetchingSearch, isLoading: loadingSearch } = useFlickrSearch(inst?.username, searchText);
  const { data: albums, isLoading: loadingAlbums } = useFlickrAlbums(inst?.username);

  const allPhotos = useMemo(() => {
    return photosPages?.pages.flatMap(p => p?.photo || []) || [];
  }, [photosPages]);

  const totalPhotos = photosPages?.pages[0]?.total ? Number(photosPages.pages[0].total) : 0;

  const searchPhotos = useMemo(() => {
    return searchPages?.pages.flatMap(p => p?.photo || []) || [];
  }, [searchPages]);

  if (!inst) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero with cover image */}
      <div className="relative h-64 overflow-hidden">
        {inst.capa ? (
          <img
            src={inst.capa}
            alt={inst.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <Camera className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />

        {/* Back button */}
        <button
          onClick={() => navigate("/tribuna")}
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-black/70 transition-colors"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wider">Voltar</span>
        </button>

        {/* Title centered at bottom */}
        <div className="absolute bottom-8 left-0 right-0 text-center px-4" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.7)' }}>
          <h1 className="font-playfair text-3xl font-bold text-white leading-tight uppercase tracking-wide">{inst.slug}</h1>
          <p className="font-playfair text-base text-white/80 leading-tight mt-1">{inst.nome}</p>
          <div className="relative mx-auto mt-2 w-[60%]">
            <div
              className="h-[1.5px]"
              style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.8), transparent)' }}
            />
            <div className="relative h-5 overflow-hidden">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    backgroundColor: 'rgba(212,175,55,0.8)',
                    width: `${Math.random() * 2 + 1}px`,
                    height: `${Math.random() * 2 + 1}px`,
                    left: `${Math.random() * 100}%`,
                    top: '-1px',
                    opacity: 0,
                    animation: `sparkle-fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content card overlapping hero */}
      <div className="relative rounded-t-[32px] bg-muted -mt-6 min-h-screen pb-20">
        <div className="pt-6 px-4 md:px-6 space-y-5">
          {/* Photo count + description */}
          {totalPhotos > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center gap-2 py-4"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#d4af37]" />
                <span className="text-lg font-bold text-[#d4af37]">
                  <AnimatedCounter value={totalPhotos} />
                </span>
                <span className="text-sm text-muted-foreground">fotos no acervo</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Acervo institucional com registros oficiais de sessões, posses, eventos e bastidores. Atualizado diariamente — acompanhe de perto o que acontece no {inst.slug.toUpperCase()}.
              </p>
            </motion.div>
          )}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3 bg-neutral-900/70 rounded-2xl p-1.5 border border-white/5 backdrop-blur-sm h-auto">
              <TabsTrigger value="recentes" className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-[#d4af37] data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-[#d4af37]/20 text-white/50 transition-all duration-200">Recentes</TabsTrigger>
              <TabsTrigger value="albuns" className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-[#d4af37] data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-[#d4af37]/20 text-white/50 transition-all duration-200">Álbuns</TabsTrigger>
              <TabsTrigger value="buscar" className="rounded-xl py-2.5 text-sm font-semibold data-[state=active]:bg-[#d4af37] data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:shadow-[#d4af37]/20 text-white/50 transition-all duration-200">Buscar</TabsTrigger>
            </TabsList>

            <TabsContent value="recentes" className="space-y-4 mt-4">
              {loadingPhotos ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <TribunaFotoGrid photos={allPhotos} onPhotoClick={setSelectedPhoto} />
                  {hasNextPage && (
                    <div className="flex justify-center pt-4">
                      <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                        {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Carregar mais
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="albuns" className="space-y-4 mt-4">
              {loadingAlbums ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-video rounded-xl" />
                  ))}
                </div>
              ) : albums?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {albums.map((album: any, i: number) => (
                    <TribunaAlbumCard
                      key={album.id}
                      album={album}
                      index={i}
                      onClick={() => navigate(`/tribuna/${slug}/album/${album.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Images className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Nenhum álbum encontrado</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="buscar" className="space-y-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fotos..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="pl-10 bg-neutral-800/50 border-white/10"
                />
              </div>
              {loadingSearch ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-xl" />
                  ))}
                </div>
              ) : searchText.length >= 2 ? (
                <>
                  <TribunaFotoGrid photos={searchPhotos} onPhotoClick={setSelectedPhoto} />
                  {hasNextSearch && (
                    <div className="flex justify-center pt-4">
                      <Button variant="outline" onClick={() => fetchNextSearch()} disabled={isFetchingSearch}>
                        {isFetchingSearch ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Carregar mais
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-8">Digite pelo menos 2 caracteres para buscar</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <TribunaFotoModal
        photo={selectedPhoto}
        photos={tab === "buscar" ? searchPhotos : allPhotos}
        instituicaoSlug={slug || ""}
        onClose={() => setSelectedPhoto(null)}
        onNavigate={setSelectedPhoto}
      />
    </div>
  );
};

export default TribunaInstituicao;
