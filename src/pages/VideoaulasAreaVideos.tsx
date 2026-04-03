import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, Loader2, Search, Play, History, Clock, X, Youtube, AlertCircle, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AREAS_PLAYLISTS } from "@/data/videoaulasAreasPlaylists";
import { useVideoaulasFavoritas } from "@/hooks/useVideoaulaFavorito";
import VideoFavoritoButton from "@/components/VideoFavoritoButton";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { useDeviceType } from "@/hooks/use-device-type";

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
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

interface UnifiedVideo {
  id: string;
  isLocal: boolean;
  titulo: string;
  thumb: string | null;
  tempo: string | null;
  link: string;
  videoId: string;
  description?: string;
  hasContent?: boolean;
}

const TABELA = "videoaulas_areas_direito";

const extractVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : '';
};

const simplifyAreaName = (areaName: string): string => {
  const prefixesToRemove = ['Direito ', 'Legislação '];
  for (const prefix of prefixesToRemove) {
    if (areaName.startsWith(prefix)) {
      return areaName.replace(prefix, '');
    }
  }
  return areaName;
};

const cleanVideoTitle = (titulo: string): string => {
  const kultiviMatch = titulo.match(/Kultivi\s*-\s*([^|]+)/i);
  if (kultiviMatch) {
    return kultiviMatch[1].trim().replace(/CURSO\s*GRATUITO\s*COMPLETO/gi, '').trim();
  }
  const dashMatch = titulo.match(/\s+-\s+(.+?)(?:\s*\||\s*$)/);
  if (dashMatch) {
    return dashMatch[1].replace(/CURSO\s*GRATUITO\s*COMPLETO/gi, '').trim();
  }
  return titulo
    .replace(/\s*\|\s*Kultivi.*$/i, '')
    .replace(/\s*-\s*Kultivi.*$/i, '')
    .replace(/CURSO\s*GRATUITO\s*COMPLETO/gi, '')
    .replace(/CURSO\s*GRATUITO/gi, '')
    .replace(/\s*\|\s*$/g, '')
    .replace(/\s*-\s*$/g, '')
    .trim();
};

const VideoaulasAreaVideos = () => {
  const navigate = useTransitionNavigate();
  const { area } = useParams();
  const decodedArea = decodeURIComponent(area || "");
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState<MainTabType>("videos");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const { isDesktop } = useDeviceType();

  const areaPlaylist = AREAS_PLAYLISTS.find(
    p => p.nome.toLowerCase() === decodedArea.toLowerCase()
  );

  const { data: videoaulas, isLoading: isLoadingLocal } = useQuery({
    queryKey: ["videoaulas-areas-direito", decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_areas_direito")
        .select("id, video_id, titulo, descricao, area, thumb, ordem, sobre_aula, flashcards, questoes")
        .eq("area", decodedArea)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!decodedArea,
  });

  const { data: youtubeVideos, isLoading: isLoadingYoutube, error: youtubeError } = useQuery({
    queryKey: ["youtube-playlist-videos", areaPlaylist?.playlistId],
    queryFn: async () => {
      if (!areaPlaylist) throw new Error("Playlist não encontrada");
      const { data, error } = await supabase.functions.invoke('buscar-videos-playlist', {
        body: { playlistLink: areaPlaylist.playlistUrl }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.videos as YouTubeVideo[];
    },
    enabled: !!areaPlaylist && (!videoaulas || videoaulas.length === 0) && !isLoadingLocal,
    retry: 2,
    staleTime: 1000 * 60 * 30,
  });

  const isLoading = isLoadingLocal || ((!videoaulas || videoaulas.length === 0) && isLoadingYoutube);

  const allVideos = useMemo(() => {
    if (videoaulas && videoaulas.length > 0) {
      return videoaulas.map((v: any) => ({
        id: String(v.id),
        isLocal: true,
        titulo: v.titulo,
        thumb: v.thumb,
        tempo: null,
        link: `https://www.youtube.com/watch?v=${v.video_id}`,
        videoId: v.video_id,
        description: v.descricao,
        hasContent: !!(v.sobre_aula || v.flashcards || v.questoes),
      }));
    }
    if (youtubeVideos && youtubeVideos.length > 0) {
      return youtubeVideos.map(v => ({
        id: v.videoId,
        isLocal: false,
        titulo: v.title,
        thumb: v.thumbnail,
        tempo: null,
        link: `https://www.youtube.com/watch?v=${v.videoId}`,
        videoId: v.videoId,
        description: v.description,
        hasContent: false,
      }));
    }
    return [];
  }, [videoaulas, youtubeVideos]);

  // Auto-select first video on desktop
  const activeVideoId = selectedVideoId || (isDesktop && allVideos.length > 0 ? allVideos[0].videoId : null);
  const activeVideo = allVideos.find(v => v.videoId === activeVideoId);

  const filteredVideos = useMemo(() => {
    if (!allVideos.length) return [];
    if (!search.trim()) return allVideos;
    return allVideos.filter(v =>
      v.titulo.toLowerCase().includes(search.toLowerCase())
    );
  }, [allVideos, search]);

  const totalVideos = allVideos.length;

  const { data: favoritos, isLoading: loadingFavoritos } = useVideoaulasFavoritas(TABELA);

  const { data: historico, isLoading: loadingHistorico } = useQuery({
    queryKey: ['videoaulas-areas-historico', decodedArea, allVideos.length],
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
        const videoInfo = allVideos.find(v => v.id === item.registro_id || v.videoId === item.registro_id);
        if (videoInfo) {
          historicoFormatado.push({
            id: item.id,
            video_id: videoInfo.videoId,
            titulo: videoInfo.titulo,
            thumbnail: videoInfo.thumb || `https://img.youtube.com/vi/${videoInfo.videoId}/mqdefault.jpg`,
            assistido_em: item.updated_at,
            progresso_segundos: item.tempo_atual || 0,
            duracao_total: item.duracao_total || undefined,
            rota: `/videoaulas/areas/${encodeURIComponent(decodedArea)}/${videoInfo.id}`
          });
        }
      }
      return historicoFormatado;
    },
    enabled: mainTab === 'historico' && allVideos.length > 0,
    staleTime: 1000 * 60 * 2,
  });

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

  const handleVideoClick = (video: UnifiedVideo) => {
    if (isDesktop) {
      setSelectedVideoId(video.videoId);
    } else {
      const routeId = video.isLocal ? video.id : video.videoId;
      navigate(`/videoaulas/areas/${encodeURIComponent(decodedArea)}/${routeId}`);
    }
  };

  const handleFullscreen = () => {
    if (activeVideo) {
      const routeId = activeVideo.isLocal ? activeVideo.id : activeVideo.videoId;
      navigate(`/videoaulas/areas/${encodeURIComponent(decodedArea)}/${routeId}`);
    }
  };

  // ===== DESKTOP LAYOUT =====
  if (isDesktop) {
    return (
      <div className="h-[calc(100vh-4rem)] flex bg-background">
        {/* Sidebar */}
        <div className="w-[380px] flex-shrink-0 border-r border-border flex flex-col bg-card/50">
          {/* Sidebar header */}
          <div className="p-3 border-b border-border">
            <div className="mb-2">
              <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">ÁREAS DO DIREITO</span>
              <h2 className="text-base font-bold mt-1">{simplifyAreaName(decodedArea)}</h2>
              <p className="text-xs text-muted-foreground">{totalVideos} aulas</p>
            </div>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="text" placeholder="Pesquisar aula..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-10 bg-secondary/50 h-9 text-sm" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTabType)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-neutral-900/80 border border-red-700/30 p-0.5 h-9">
                <TabsTrigger value="videos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-1 text-xs h-7">
                  <Video className="w-3 h-3" />Vídeos
                </TabsTrigger>
                <TabsTrigger value="favoritos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-1 text-xs h-7">
                  <Heart className="w-3 h-3" />Favoritos
                </TabsTrigger>
                <TabsTrigger value="historico" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white text-muted-foreground gap-1 text-xs h-7">
                  <History className="w-3 h-3" />Histórico
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Sidebar content */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {mainTab === "videos" && (
                isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
                ) : filteredVideos.length > 0 ? (
                  filteredVideos.map((video, index) => (
                    <SidebarVideoItem
                      key={video.id}
                      video={video}
                      index={index}
                      isActive={video.videoId === activeVideoId}
                      onClick={() => handleVideoClick(video)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma aula encontrada</div>
                )
              )}

              {mainTab === "favoritos" && (
                loadingFavoritos ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
                ) : !favoritos || favoritos.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhum favorito</p>
                  </div>
                ) : (
                  favoritos.map((fav) => (
                    <button key={fav.id} onClick={() => { setSelectedVideoId(fav.video_id); setMainTab("videos"); }}
                      className="w-full flex gap-2 p-2 rounded-lg hover:bg-secondary/80 border border-transparent hover:border-red-500/20 transition-all text-left group">
                      <div className="shrink-0 relative w-24 aspect-video rounded overflow-hidden bg-neutral-800">
                        <img src={fav.thumbnail || ''} alt={fav.titulo} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-red-600/70 flex items-center justify-center"><Play className="w-3 h-3 text-white ml-0.5" fill="white" /></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h3 className="text-xs font-medium line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">{fav.titulo}</h3>
                      </div>
                    </button>
                  ))
                )
              )}

              {mainTab === "historico" && (
                loadingHistorico ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>
                ) : !historico || historico.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhum vídeo assistido</p>
                  </div>
                ) : (
                  historico.map((video) => (
                    <button key={video.id} onClick={() => { setSelectedVideoId(video.video_id); setMainTab("videos"); }}
                      className="w-full flex gap-2 p-2 rounded-lg hover:bg-secondary/80 border border-transparent hover:border-red-500/20 transition-all text-left group">
                      <div className="shrink-0 relative w-24 aspect-video rounded overflow-hidden bg-neutral-800">
                        <img src={video.thumbnail || ''} alt={video.titulo} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-red-600/70 flex items-center justify-center"><Play className="w-3 h-3 text-white ml-0.5" fill="white" /></div>
                        </div>
                        {video.duracao_total && video.duracao_total > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50"><div className="h-full bg-red-600" style={{ width: `${Math.min((video.progresso_segundos / video.duracao_total) * 100, 100)}%` }} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <h3 className="text-xs font-medium line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">{video.titulo}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" /><span>{formatRelativeDate(video.assistido_em)}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main content: Player */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {activeVideo ? (
            <>
              <div className="flex-1 bg-black flex items-center justify-center">
                <iframe
                  key={activeVideo.videoId}
                  src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`}
                  title={activeVideo.titulo}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {/* Info do vídeo */}
              <div className="px-6 py-4 bg-neutral-950 border-t border-border/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-mono">
                        Aula {String((filteredVideos.findIndex(v => v.videoId === activeVideoId) + 1) || 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
                      {cleanVideoTitle(activeVideo.titulo)}
                    </h2>
                    {activeVideo.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{activeVideo.description}</p>
                    )}
                  </div>
                  <button
                    onClick={handleFullscreen}
                    className="flex-shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" fill="white" />
                    Tela cheia
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Selecione um vídeo para assistir</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== MOBILE LAYOUT =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-500/5">
      <div className="pt-4 pb-4 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded">ÁREAS DO DIREITO</span>
                <h1 className="text-lg font-bold mt-1">{simplifyAreaName(decodedArea)}</h1>
                <p className="text-xs text-muted-foreground">{totalVideos} aulas disponíveis</p>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="text" placeholder="Pesquisar aula..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-10 bg-secondary/50" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted">
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
          </motion.div>
        </div>
      </div>

      {/* Videos Tab */}
      {mainTab === "videos" && (
        <div className="px-4 pb-24">
          <div className="max-w-lg mx-auto">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              {youtubeVideos && youtubeVideos.length > 0 && (!videoaulas || videoaulas.length === 0) ? (
                <><Youtube className="w-4 h-4 text-red-500" />Vídeos do YouTube</>
              ) : (
                <><Video className="w-4 h-4" />Lista de Aulas</>
              )}
            </h2>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-sm text-muted-foreground">Carregando vídeos...</p>
              </div>
            ) : youtubeError ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500/50" />
                <p className="mb-2">Erro ao carregar vídeos do YouTube</p>
                <p className="text-xs text-muted-foreground/70 mb-4">
                  {youtubeError instanceof Error ? youtubeError.message : "Tente novamente mais tarde"}
                </p>
                <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                  Tentar novamente
                </button>
              </div>
            ) : filteredVideos.length > 0 ? (
              <div className="space-y-2">
                {filteredVideos.map((video, index) => (
                  <MobileVideoListItem key={video.id} video={video} index={index} area={decodedArea} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{search ? "Nenhuma aula encontrada" : "Nenhuma videoaula disponível"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Favoritos Tab */}
      {mainTab === "favoritos" && (
        <div className="px-4 pb-24">
          <div className="max-w-lg mx-auto">
            {loadingFavoritos ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>
            ) : !favoritos || favoritos.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-lg font-medium mb-2">Nenhum favorito</p>
                <p className="text-muted-foreground/70 text-sm">Toque no coração nos vídeos para salvar aqui</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-3 pb-8">
                  {favoritos.map((fav) => (
                    <button key={fav.id} onClick={() => navigate(`/videoaulas/areas/${encodeURIComponent(decodedArea)}/${fav.video_id}`)} className="w-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 rounded-xl p-2.5 flex gap-3 items-start transition-all group">
                      <div className="shrink-0 relative w-28 aspect-video rounded-lg overflow-hidden bg-neutral-800">
                        <VideoFavoritoButton tabela={TABELA} videoId={fav.video_id} titulo={fav.titulo} thumbnail={fav.thumbnail} />
                        <img src={fav.thumbnail || ''} alt={fav.titulo} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-red-600/70 flex items-center justify-center shadow-lg"><Play className="w-3 h-3 text-white ml-0.5" fill="white" /></div>
                        </div>
                      </div>
                      <div className="flex-1 text-left min-w-0 py-0.5">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">{fav.titulo}</h3>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      )}

      {/* Histórico Tab */}
      {mainTab === "historico" && (
        <div className="px-4 pb-24">
          <div className="max-w-lg mx-auto">
            {loadingHistorico ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-red-500 animate-spin" /></div>
            ) : !historico || historico.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-lg font-medium mb-2">Nenhum vídeo assistido</p>
                <p className="text-muted-foreground/70 text-sm">Os vídeos que você assistir aparecerão aqui</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-320px)]">
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
        </div>
      )}
    </div>
  );
};

// Desktop sidebar item
const SidebarVideoItem = ({ video, index, isActive, onClick }: { video: UnifiedVideo; index: number; isActive: boolean; onClick: () => void }) => {
  const thumbnail = video.thumb || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex gap-2 p-2 rounded-lg transition-all group text-left",
        isActive
          ? "bg-red-500/20 border border-red-500/40"
          : "hover:bg-secondary/80 border border-transparent"
      )}
    >
      <div className="shrink-0 relative w-24 aspect-video rounded overflow-hidden bg-neutral-800">
        <img src={thumbnail} alt={video.titulo} className="w-full h-full object-cover" loading="lazy" />
        <div className={cn("absolute inset-0 flex items-center justify-center transition-colors", isActive ? "bg-black/20" : "bg-black/30 group-hover:bg-black/20")}>
          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", isActive ? "bg-red-600" : "bg-red-600/70 group-hover:bg-red-600")}>
            <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
          </div>
        </div>
        <div className={cn("absolute bottom-0 left-0 px-1 py-0.5 text-[9px] font-bold rounded-tr", isActive ? "bg-red-600 text-white" : "bg-neutral-900 text-white/80")}>
          {String(index + 1).padStart(2, '0')}
        </div>
        {!video.isLocal && (
          <div className="absolute top-0.5 right-0.5 bg-red-600/90 px-1 py-0.5 rounded text-[8px] text-white"><Youtube className="w-2.5 h-2.5" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <h3 className={cn("text-xs font-medium line-clamp-2 leading-tight", isActive ? "text-red-400" : "text-foreground group-hover:text-red-400")}>
          {cleanVideoTitle(video.titulo)}
        </h3>
      </div>
    </button>
  );
};

// Mobile list item
const MobileVideoListItem = ({ video, index, area }: { video: UnifiedVideo; index: number; area: string }) => {
  const navigate = useTransitionNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  const thumbnail = video.thumb || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;

  const handleClick = () => {
    const routeId = video.isLocal ? video.id : video.videoId;
    navigate(`/videoaulas/areas/${encodeURIComponent(area)}/${routeId}`);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={handleClick}
      className="w-full text-left border rounded-xl transition-all overflow-hidden bg-neutral-800/90 hover:bg-neutral-700/90 border-neutral-700/50 hover:border-red-500/30"
    >
      <div className="flex items-center">
        <div className="relative w-24 h-16 flex-shrink-0 bg-neutral-800 rounded-l-xl overflow-hidden">
          <VideoFavoritoButton tabela={TABELA} videoId={video.id} titulo={video.titulo} thumbnail={thumbnail} />
          <div className={cn("absolute inset-0 bg-neutral-700 animate-pulse transition-opacity", imageLoaded ? "opacity-0" : "opacity-100")} />
          <img src={thumbnail} alt={video.titulo} className={cn("w-full h-full object-cover transition-opacity", imageLoaded ? "opacity-100" : "opacity-0")} loading="lazy" onLoad={() => setImageLoaded(true)} />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-600/80 flex items-center justify-center">
              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 bg-red-600/90 text-white text-xs font-bold px-2 py-0.5 rounded-tr-lg">
            {String(index + 1).padStart(2, '0')}
          </div>
          {!video.isLocal && (
            <div className="absolute top-0.5 right-0.5 bg-red-600/90 px-1 py-0.5 rounded text-[9px] text-white font-medium flex items-center gap-0.5">
              <Youtube className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
        <div className="flex-1 py-2 px-3 min-w-0">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
            {cleanVideoTitle(video.titulo)}
          </h3>
        </div>
      </div>
    </motion.button>
  );
};

export default VideoaulasAreaVideos;
