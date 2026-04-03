import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Play, Loader2, Search, Video, Heart, History, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeviceType } from "@/hooks/use-device-type";
import { useVideoaulasFavoritas } from "@/hooks/useVideoaulaFavorito";
import VideoFavoritoButton from "@/components/VideoFavoritoButton";
import { motion } from "framer-motion";

interface Videoaula {
  id: number;
  titulo: string | null;
  link: string | null;
  thumb: string | null;
  tempo: string | null;
}

type MainTabType = "videos" | "favoritos" | "historico";

interface HistoricoVideo {
  id: string;
  video_id: string;
  titulo: string;
  thumbnail: string | null;
  assistido_em: string;
  progresso_segundos: number;
  duracao_total?: number;
  rota: string;
}

const TABELA = "VIDEO AULAS-NOVO";

const VideoaulasOABArea = () => {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const decodedArea = area ? decodeURIComponent(area) : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [mainTab, setMainTab] = useState<MainTabType>("videos");
  const { isDesktop } = useDeviceType();

  const { data: videoaulas, isLoading } = useQuery({
    queryKey: ["videoaulas-oab-area", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("VIDEO AULAS-NOVO")
        .select("id, titulo, link, thumb, tempo")
        .ilike("area", `%${decodedArea}%`)
        .order("titulo", { ascending: true });

      if (error) throw error;
      return data as Videoaula[];
    },
    enabled: !!decodedArea,
  });

  // Buscar favoritos
  const { data: favoritos, isLoading: loadingFavoritos } = useVideoaulasFavoritas(TABELA);

  // Buscar histórico
  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['videoaulas-oab-area-historico', decodedArea],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('videoaulas_progresso')
        .select('*')
        .eq('user_id', user.id)
        .eq('tabela', TABELA)
        .order('updated_at', { ascending: false })
        .limit(30);

      if (error) return [];

      const historicoFormatado: HistoricoVideo[] = [];
      for (const item of data || []) {
        const videoInfo = videoaulas?.find(v => String(v.id) === item.registro_id);
        if (videoInfo && videoInfo.titulo && videoInfo.link) {
          const thumb = videoInfo.thumb || getYouTubeThumbnail(videoInfo.link) || '';
          historicoFormatado.push({
            id: item.id,
            video_id: String(videoInfo.id),
            titulo: videoInfo.titulo,
            thumbnail: thumb,
            assistido_em: item.updated_at,
            progresso_segundos: item.tempo_atual || 0,
            duracao_total: item.duracao_total || undefined,
            rota: `/videoaulas/oab/${encodeURIComponent(decodedArea)}/${videoInfo.id}`
          });
        }
      }
      return historicoFormatado;
    },
    enabled: mainTab === 'historico' && !!videoaulas,
    staleTime: 1000 * 60 * 2,
  });

  const filteredVideoaulas = videoaulas
    ?.filter((aula) =>
      aula.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    ?.sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", "pt-BR"));

  const getYouTubeThumbnail = (link: string, quality: 'mq' | 'hq' | 'maxres' = 'mq') => {
    const match = link?.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (match?.[1]) {
      const qualityMap = { mq: 'mqdefault', hq: 'hqdefault', maxres: 'maxresdefault' };
      return `https://img.youtube.com/vi/${match[1]}/${qualityMap[quality]}.jpg`;
    }
    return null;
  };

  const handleVideoClick = (videoaula: Videoaula) => {
    if (!videoaula.id || !videoaula.titulo) return;
    navigate(`/videoaulas/oab/${encodeURIComponent(decodedArea)}/${videoaula.id}`);
  };

  const handleVideoSelect = (index: number) => {
    setSelectedVideoIndex(index);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const selectedVideo = filteredVideoaulas?.[selectedVideoIndex];
  const selectedThumbnail = selectedVideo?.thumb || (selectedVideo?.link ? getYouTubeThumbnail(selectedVideo.link, 'maxres') : null);

  // Desktop layout kept as-is (no tabs, just the two-column view)
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-white/5">
          <div className="px-6 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/videoaulas-oab")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">{decodedArea}</h1>
              <p className="text-xs text-muted-foreground">{filteredVideoaulas?.length || 0} aulas disponíveis</p>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-60px)]">
          <div className="w-80 border-r border-white/5 flex flex-col bg-neutral-950/50">
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Pesquisar aula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-neutral-900/80 border-white/10 focus:border-red-500/50 text-sm" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1.5">
                {filteredVideoaulas?.map((aula, index) => {
                  const thumbnail = aula.thumb || (aula.link ? getYouTubeThumbnail(aula.link) : null);
                  const numero = String(index + 1).padStart(2, "0");
                  const isSelected = index === selectedVideoIndex;
                  if (!aula.titulo || !aula.link) return null;
                  return (
                    <button key={`${aula.id}-${index}`} onClick={() => handleVideoSelect(index)} className={`w-full rounded-lg p-2 flex gap-2.5 items-start transition-all group text-left ${isSelected ? "bg-red-500/20 border border-red-500/40" : "bg-neutral-900/50 hover:bg-neutral-800/70 border border-transparent"}`}>
                      <div className="shrink-0 relative w-24 aspect-video rounded overflow-hidden bg-neutral-800">
                        <VideoFavoritoButton tabela={TABELA} videoId={String(aula.id)} titulo={aula.titulo} thumbnail={thumbnail} />
                        {thumbnail ? (<img src={thumbnail} alt={aula.titulo} className="w-full h-full object-cover" loading="lazy" />) : (<div className="w-full h-full flex items-center justify-center"><Play className="w-4 h-4 text-muted-foreground" /></div>)}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isSelected ? "bg-red-600" : "bg-red-600/60"}`}><Play className="w-3 h-3 text-white ml-0.5" fill="white" /></div>
                        </div>
                        <div className={`absolute bottom-0 left-0 px-1 py-0.5 text-[9px] font-bold rounded-tr ${isSelected ? "bg-red-600 text-white" : "bg-neutral-900 text-white/80"}`}>{numero}</div>
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h3 className={`text-xs font-medium line-clamp-2 leading-tight ${isSelected ? "text-red-400" : "text-foreground group-hover:text-red-400"}`}>{aula.titulo}</h3>
                        {aula.tempo && (<p className="text-[10px] text-muted-foreground mt-1">{aula.tempo}</p>)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
            {selectedVideo ? (
              <div className="w-full max-w-4xl">
                <button onClick={() => handleVideoClick(selectedVideo)} className="w-full relative aspect-video rounded-2xl overflow-hidden bg-neutral-900 group shadow-2xl">
                  {selectedThumbnail ? (<img src={selectedThumbnail} alt={selectedVideo.titulo || ""} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />) : (<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 via-background to-background"><Play className="w-20 h-20 text-red-400/50" /></div>)}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-20 h-20 rounded-full bg-red-600/80 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300"><Play className="w-10 h-10 text-white ml-1" fill="white" /></div></div>
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg shadow-lg">{String(selectedVideoIndex + 1).padStart(2, "0")}</div>
                  {selectedVideo.tempo && (<div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 text-white text-sm font-medium rounded-lg">{selectedVideo.tempo}</div>)}
                </button>
                <div className="mt-6 text-center">
                  <h2 className="text-2xl font-bold text-foreground">{selectedVideo.titulo}</h2>
                  <p className="text-sm text-muted-foreground mt-2">{decodedArea}</p>
                  <Button onClick={() => handleVideoClick(selectedVideo)} className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6"><Play className="w-4 h-4 mr-2" fill="white" />Assistir Aula</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12"><p className="text-muted-foreground">Selecione uma aula para visualizar</p></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layout with 3 tabs
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-white/5">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/videoaulas-oab")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{decodedArea}</h1>
            <p className="text-xs text-muted-foreground">{filteredVideoaulas?.length || 0} aulas disponíveis</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Pesquisar aula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-10 bg-neutral-900/80 border-white/10 focus:border-red-500/50" />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTabType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-neutral-900/80 border border-red-700/30 p-1 h-11">
            <TabsTrigger value="videos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs">
              <Video className="w-3.5 h-3.5" />Vídeos
            </TabsTrigger>
            <TabsTrigger value="favoritos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs">
              <Heart className="w-3.5 h-3.5" />Favoritos
            </TabsTrigger>
            <TabsTrigger value="historico" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs">
              <History className="w-3.5 h-3.5" />Histórico
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Videos Tab */}
      {mainTab === "videos" && (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="px-3 space-y-3">
            {filteredVideoaulas?.map((aula, index) => {
              const thumbnail = aula.thumb || (aula.link ? getYouTubeThumbnail(aula.link) : null);
              const numero = String(index + 1).padStart(2, "0");
              if (!aula.titulo || !aula.link) return null;
              return (
                <button key={`${aula.id}-${index}`} onClick={() => handleVideoClick(aula)} className="w-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl p-2.5 flex gap-3 items-start transition-all group">
                  <div className="shrink-0 relative w-32 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                    <VideoFavoritoButton tabela={TABELA} videoId={String(aula.id)} titulo={aula.titulo} thumbnail={thumbnail} />
                    {thumbnail ? (<img src={thumbnail} alt={aula.titulo} className="w-full h-full object-cover" loading="lazy" />) : (<div className="w-full h-full flex items-center justify-center"><Play className="w-6 h-6 text-muted-foreground" /></div>)}
                    <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-red-600/70 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600/90 transition-all"><Play className="w-4 h-4 text-white ml-0.5" fill="white" /></div>
                    </div>
                    <div className="absolute bottom-0 left-0 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-tr">{numero}</div>
                    {aula.tempo && (<div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/70 text-white text-[10px] font-medium rounded-tl">{aula.tempo}</div>)}
                  </div>
                  <div className="flex-1 text-left min-w-0 py-0.5">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-red-400 transition-colors leading-snug">{aula.titulo}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5">{decodedArea}</p>
                  </div>
                </button>
              );
            })}
            {filteredVideoaulas?.length === 0 && searchTerm && (
              <div className="text-center py-12"><p className="text-muted-foreground">Nenhuma aula encontrada para "{searchTerm}"</p></div>
            )}
            {videoaulas?.length === 0 && !searchTerm && (
              <div className="text-center py-12"><p className="text-muted-foreground">Nenhuma aula encontrada para esta área.</p></div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Favoritos Tab */}
      {mainTab === "favoritos" && (
        <div className="px-4">
          {loadingFavoritos ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>
          ) : !favoritos || favoritos.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg font-medium mb-2">Nenhum favorito</p>
              <p className="text-muted-foreground/70 text-sm">Toque no coração nos vídeos para salvar aqui</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-3 pb-8">
                {favoritos.map((fav) => (
                  <button key={fav.id} onClick={() => navigate(`/videoaulas/oab/${encodeURIComponent(decodedArea)}/${fav.video_id}`)} className="w-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl p-2.5 flex gap-3 items-start transition-all group">
                    <div className="shrink-0 relative w-28 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                      <VideoFavoritoButton tabela={TABELA} videoId={fav.video_id} titulo={fav.titulo} thumbnail={fav.thumbnail} />
                      <img src={fav.thumbnail || ''} alt={fav.titulo} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-red-600/70 flex items-center justify-center shadow-lg"><Play className="w-3 h-3 text-white ml-0.5" fill="white" /></div>
                      </div>
                    </div>
                    <div className="flex-1 text-left min-w-0 py-0.5">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-red-400 transition-colors leading-snug">{fav.titulo}</h3>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Histórico Tab */}
      {mainTab === "historico" && (
        <div className="px-4">
          {loadingHistorico ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>
          ) : !historico || historico.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg font-medium mb-2">Nenhum vídeo assistido</p>
              <p className="text-muted-foreground/70 text-sm">Os vídeos que você assistir aparecerão aqui</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="space-y-3 pb-8">
                {historico.map((video) => (
                  <motion.button key={video.id} onClick={() => navigate(video.rota)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl p-2.5 flex gap-3 items-start transition-all group">
                    <div className="shrink-0 relative w-28 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                      <img src={video.thumbnail || ''} alt={video.titulo} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-red-600/70 flex items-center justify-center shadow-lg"><Play className="w-3 h-3 text-white ml-0.5" fill="white" /></div>
                      </div>
                      {video.duracao_total && video.duracao_total > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50"><div className="h-full bg-red-600" style={{ width: `${Math.min((video.progresso_segundos / video.duracao_total) * 100, 100)}%` }} /></div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0 py-0.5">
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">{video.titulo}</h3>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /><span>{formatRelativeDate(video.assistido_em)}</span>
                        {video.progresso_segundos > 0 && (<><span>•</span><span>{formatTime(video.progresso_segundos)}</span></>)}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoaulasOABArea;
