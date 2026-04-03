import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Loader2, Video, Search, History, Clock, X, Heart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useMultipleVideoProgress } from "@/hooks/useVideoProgress";
import { useVideoaulasFavoritas } from "@/hooks/useVideoaulaFavorito";
import VideoFavoritoButton from "@/components/VideoFavoritoButton";
import { cn } from "@/lib/utils";

const cleanVideoTitle = (title: string): string => {
  return title
    .replace(/\s*\|\s*CURSO GRATUITO COMPLETO\s*/gi, '')
    .replace(/\s*\|\s*CURSO GRATUITO\s*/gi, '')
    .replace(/\s*CURSO GRATUITO COMPLETO\s*/gi, '')
    .replace(/\s*CURSO GRATUITO\s*/gi, '')
    .replace(/\s*PRIMEIROS PASSOS NO DIREITO[:\s]*/gi, '')
    .replace(/\s*o método para que[\|]*/gi, '')
    .trim();
};

interface VideoaulaIniciante {
  id: string;
  video_id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  ordem: number;
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

const TABELA = "videoaulas_iniciante";

const VideoaulasIniciante = () => {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<MainTabType>("videos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoaulaIniciante | null>(null);

  const { data: videoaulas, isLoading } = useQuery({
    queryKey: ["videoaulas-iniciante"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_iniciante")
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as VideoaulaIniciante[];
    },
  });

  // Selecionar primeiro vídeo automaticamente quando dados carregarem
  const firstVideo = useMemo(() => {
    if (!videoaulas || videoaulas.length === 0) return null;
    return selectedVideo || videoaulas[0];
  }, [videoaulas, selectedVideo]);

  const registroIds = useMemo(() => videoaulas?.map(v => v.id) || [], [videoaulas]);
  const { progressMap } = useMultipleVideoProgress(TABELA, registroIds);

  const { data: favoritos, isLoading: loadingFavoritos } = useVideoaulasFavoritas(TABELA);

  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['videoaulas-iniciante-historico'],
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
        const videoInfo = videoaulas?.find(v => v.id === item.registro_id);
        if (videoInfo) {
          historicoFormatado.push({
            id: item.id,
            video_id: videoInfo.video_id,
            titulo: videoInfo.titulo,
            thumbnail: videoInfo.thumbnail || `https://img.youtube.com/vi/${videoInfo.video_id}/mqdefault.jpg`,
            assistido_em: item.updated_at,
            progresso_segundos: item.tempo_atual || 0,
            duracao_total: item.duracao_total || undefined,
            rota: `/videoaulas/iniciante/${videoInfo.id}`
          });
        }
      }
      return historicoFormatado;
    },
    enabled: mainTab === 'historico' && !!videoaulas,
    staleTime: 1000 * 60 * 2,
  });

  const filteredVideos = useMemo(() => {
    if (!videoaulas) return [];
    if (!searchQuery.trim()) return videoaulas;
    return videoaulas.filter(v =>
      cleanVideoTitle(v.titulo).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [videoaulas, searchQuery]);

  const getYouTubeThumbnail = (videoId: string) =>
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

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

  const handleVideoClick = (aula: VideoaulaIniciante) => {
    // Mobile: navega direto; Desktop: seleciona no player inline
    if (window.innerWidth < 1024) {
      navigate(`/videoaulas/iniciante/${aula.id}`);
    } else {
      setSelectedVideo(aula);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // ======= MOBILE LAYOUT =======
  const mobileLayout = (
    <div className="lg:hidden min-h-screen bg-background pb-24">
      {/* Header Mobile */}
      <div className="pt-4 pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-500/60 flex items-center justify-center shadow-lg flex-shrink-0">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                  CONCEITOS
                </span>
                <h1 className="text-lg font-bold mt-1">Videoaulas para Iniciantes</h1>
                <p className="text-xs text-muted-foreground">{videoaulas?.length || 0} aulas disponíveis</p>
              </div>
            </div>

            {/* Busca */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar aula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-secondary/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTabType)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-neutral-900/80 border border-red-700/30 p-1 h-11">
                <TabsTrigger value="videos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs">
                  <Video className="w-3.5 h-3.5" /> Vídeos
                </TabsTrigger>
                <TabsTrigger value="favoritos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs">
                  <Heart className="w-3.5 h-3.5" /> Favoritos
                </TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-1.5 text-xs">
                  <History className="w-3.5 h-3.5" /> Histórico
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Lista Mobile */}
      {mainTab === "videos" && (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="max-w-4xl mx-auto px-4 space-y-3">
            {filteredVideos.map((aula) => {
              const progress = progressMap[aula.id];
              const percentual = progress?.percentual || 0;
              const assistido = progress?.assistido || false;
              const thumb = aula.thumbnail || getYouTubeThumbnail(aula.video_id);
              return (
                <button key={aula.id} onClick={() => navigate(`/videoaulas/iniciante/${aula.id}`)}
                  className="w-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl p-2.5 flex gap-3 items-start transition-all group">
                  <div className="shrink-0 relative w-32 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                    <VideoFavoritoButton tabela={TABELA} videoId={aula.id} titulo={aula.titulo} thumbnail={thumb} />
                    <img src={thumb} alt={aula.titulo} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-red-600/70 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-tr">
                      {String(aula.ordem).padStart(2, '0')}
                    </div>
                    {percentual > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                        <div className={cn("h-full", assistido ? "bg-green-500" : "bg-red-600")} style={{ width: `${percentual}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0 py-0.5">
                    <h3 className="text-sm font-normal text-foreground group-hover:text-red-400 transition-colors leading-snug whitespace-normal break-words">
                      {cleanVideoTitle(aula.titulo)}
                    </h3>
                    {percentual > 0 && (
                      <p className={cn("text-xs mt-1 font-medium", assistido ? "text-green-400" : "text-red-400")}>
                        {assistido ? "Concluído" : `${percentual}%`}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Favoritos and Histórico tabs mobile */}
      {mainTab === "favoritos" && (
        <div className="max-w-4xl mx-auto px-4 pt-2">
          {!favoritos || favoritos.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhum favorito</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-3 pb-8">
                {favoritos.map((fav) => (
                  <button key={fav.id} onClick={() => navigate(`/videoaulas/iniciante/${fav.video_id}`)}
                    className="w-full bg-neutral-900/80 border border-white/5 rounded-xl p-2.5 flex gap-3 items-start">
                    <img src={fav.thumbnail || ''} alt={fav.titulo} className="w-28 aspect-video rounded-lg object-cover" />
                    <p className="text-sm text-foreground leading-snug">{cleanVideoTitle(fav.titulo)}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {mainTab === "historico" && (
        <div className="max-w-4xl mx-auto px-4 pt-2">
          {!historico || historico.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhum vídeo assistido</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-3 pb-8">
                {historico.map((video) => (
                  <button key={video.id} onClick={() => navigate(video.rota)}
                    className="w-full bg-neutral-900/80 border border-white/5 rounded-xl p-2.5 flex gap-3 items-start">
                    <img src={video.thumbnail || ''} alt={video.titulo} className="w-28 aspect-video rounded-lg object-cover" />
                    <div className="flex-1 text-left">
                      <p className="text-sm text-foreground leading-snug">{cleanVideoTitle(video.titulo)}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatRelativeDate(video.assistido_em)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );

  // ======= DESKTOP LAYOUT =======
  const desktopLayout = (
    <div className="hidden lg:flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Sidebar esquerda - Lista de vídeos */}
      <div className="w-[380px] xl:w-[420px] flex-shrink-0 border-r border-border/30 flex flex-col bg-neutral-950">
        {/* Header da lista */}
        <div className="px-5 pt-5 pb-4 border-b border-border/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500/60 flex items-center justify-center shadow-lg flex-shrink-0">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">CONCEITOS</span>
              <h2 className="text-sm font-bold mt-0.5 truncate">Videoaulas para Iniciantes</h2>
              <p className="text-xs text-muted-foreground">{videoaulas?.length || 0} aulas</p>
            </div>
          </div>

          {/* Busca */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar aula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-neutral-900/80 border-neutral-800 h-9 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTabType)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-neutral-900/80 border border-red-700/20 p-1 h-9">
              <TabsTrigger value="videos" className="data-[state=active]:bg-red-700 data-[state=active]:text-white text-muted-foreground text-xs gap-1">
                <Video className="w-3 h-3" /> Vídeos
              </TabsTrigger>
              <TabsTrigger value="favoritos" className="data-[state=active]:bg-red-700 data-[state=active]:text-white text-muted-foreground text-xs gap-1">
                <Heart className="w-3 h-3" /> Favoritos
              </TabsTrigger>
              <TabsTrigger value="historico" className="data-[state=active]:bg-red-700 data-[state=active]:text-white text-muted-foreground text-xs gap-1">
                <History className="w-3 h-3" /> Histórico
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Lista scrollável */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {mainTab === "videos" && filteredVideos.map((aula) => {
              const progress = progressMap[aula.id];
              const percentual = progress?.percentual || 0;
              const assistido = progress?.assistido || false;
              const thumb = aula.thumbnail || getYouTubeThumbnail(aula.video_id);
              const isSelected = firstVideo?.id === aula.id;

              return (
                <button key={aula.id} onClick={() => handleVideoClick(aula)}
                  className={cn(
                    "w-full rounded-xl p-2 flex gap-2.5 items-start transition-all text-left group",
                    isSelected
                      ? "bg-red-600/20 border border-red-500/40"
                      : "bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5 hover:border-red-500/20"
                  )}>
                  <div className="shrink-0 relative w-24 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                    <img src={thumb} alt={aula.titulo} className="w-full h-full object-cover" loading="lazy" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" fill="white" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 px-1 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded-tr">
                      {String(aula.ordem).padStart(2, '0')}
                    </div>
                    {percentual > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/50">
                        <div className={cn("h-full", assistido ? "bg-green-500" : "bg-red-500")} style={{ width: `${percentual}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs leading-snug line-clamp-3", isSelected ? "text-red-300 font-medium" : "text-foreground/80 group-hover:text-red-400")}>
                      {cleanVideoTitle(aula.titulo)}
                    </p>
                    {percentual > 0 && (
                      <p className={cn("text-[10px] mt-1 font-medium", assistido ? "text-green-400" : "text-red-400")}>
                        {assistido ? "✓ Concluído" : `${percentual}%`}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}

            {mainTab === "favoritos" && (
              !favoritos || favoritos.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum favorito</p>
                </div>
              ) : favoritos.map((fav) => (
                <button key={fav.id} onClick={() => handleVideoClick({ id: fav.video_id, video_id: fav.video_id, titulo: fav.titulo, descricao: null, thumbnail: fav.thumbnail, ordem: 0 })}
                  className="w-full bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5 rounded-xl p-2 flex gap-2.5 items-start transition-all">
                  <img src={fav.thumbnail || ''} alt={fav.titulo} className="w-24 aspect-video rounded-lg object-cover shrink-0" />
                  <p className="text-xs text-foreground/80 leading-snug line-clamp-3">{cleanVideoTitle(fav.titulo)}</p>
                </button>
              ))
            )}

            {mainTab === "historico" && (
              !historico || historico.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum vídeo assistido</p>
                </div>
              ) : historico.map((video) => (
                <button key={video.id} onClick={() => navigate(video.rota)}
                  className="w-full bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/5 rounded-xl p-2 flex gap-2.5 items-start transition-all">
                  <img src={video.thumbnail || ''} alt={video.titulo} className="w-24 aspect-video rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80 leading-snug line-clamp-2">{cleanVideoTitle(video.titulo)}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeDate(video.assistido_em)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área principal direita - Player */}
      <div className="flex-1 flex flex-col bg-black overflow-hidden">
        {firstVideo ? (
          <>
            {/* Player embed */}
            <div className="flex-1 relative">
              <iframe
                key={firstVideo.video_id}
                src={`https://www.youtube.com/embed/${firstVideo.video_id}?autoplay=0&rel=0&modestbranding=1`}
                title={firstVideo.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Info do vídeo */}
            <div className="px-6 py-4 bg-neutral-950 border-t border-border/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-mono">
                      Aula {String(firstVideo.ordem).padStart(2, '0')}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
                    {cleanVideoTitle(firstVideo.titulo)}
                  </h2>
                  {firstVideo.descricao && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{firstVideo.descricao}</p>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/videoaulas/iniciante/${firstVideo.id}`)}
                  className="flex-shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" fill="white" />
                  Tela cheia
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Selecione um vídeo</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {mobileLayout}
      {desktopLayout}
    </>
  );
};

export default VideoaulasIniciante;
