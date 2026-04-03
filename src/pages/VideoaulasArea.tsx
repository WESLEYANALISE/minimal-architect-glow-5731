import { useEffect, useState, startTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Search, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDeviceType } from "@/hooks/use-device-type";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Playlist {
  titulo?: string;
  area: string;
  link: string;
  thumb?: string;
  categoria?: string;
  tempo?: string;
}

const extractVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : '';
};

const VideoaulasArea = () => {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { isDesktop } = useDeviceType();

  useEffect(() => {
    fetchPlaylists();
  }, [area]);

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('VIDEO AULAS-NOVO' as any)
        .select('titulo, area, link, thumb, categoria, tempo')
        .eq('area', decodeURIComponent(area || ''));

      if (error) throw error;

      const playlistsData = (data || []).map((p: any) => ({
        titulo: p.titulo,
        area: p.area,
        link: p.link,
        thumb: p.thumb,
        categoria: p.categoria,
        tempo: p.tempo,
      }));
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Erro ao buscar playlists:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as playlists",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePlaylist = filteredPlaylists[selectedIndex] || filteredPlaylists[0];
  const activeVideoId = activePlaylist ? extractVideoId(activePlaylist.link) : '';

  if (loading) {
    return (
      <div className="px-3 py-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-1">{decodeURIComponent(area || '')}</h1>
          <p className="text-sm text-muted-foreground">Carregando playlists...</p>
        </div>
      </div>
    );
  }

  // ===== DESKTOP LAYOUT =====
  if (isDesktop) {
    return (
      <div className="h-[calc(100vh-4rem)] flex bg-background">
        {/* Sidebar */}
        <div className="w-[380px] flex-shrink-0 border-r border-border flex flex-col bg-card/50">
          <div className="p-3 border-b border-border">
            <h2 className="text-base font-bold">{decodeURIComponent(area || '')}</h2>
            <p className="text-xs text-muted-foreground">
              {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-xl mt-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar playlist..."
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredPlaylists.map((playlist, idx) => {
                const isActive = idx === selectedIndex;
                return (
                  <button
                    key={`${playlist.link}-${idx}`}
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      "w-full flex gap-2 p-2 rounded-lg transition-all group text-left",
                      isActive
                        ? "bg-red-500/20 border border-red-500/40"
                        : "hover:bg-secondary/80 border border-transparent"
                    )}
                  >
                    <div className="shrink-0 relative w-24 aspect-video rounded overflow-hidden bg-neutral-800">
                      {playlist.thumb ? (
                        <img src={playlist.thumb} alt={playlist.titulo || playlist.area} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Video className="w-6 h-6 text-muted-foreground" /></div>
                      )}
                      <div className={cn("absolute inset-0 flex items-center justify-center", isActive ? "bg-black/20" : "bg-black/30 group-hover:bg-black/20")}>
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", isActive ? "bg-red-600" : "bg-red-600/70 group-hover:bg-red-600")}>
                          <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className={cn("absolute bottom-0 left-0 px-1 py-0.5 text-[9px] font-bold rounded-tr", isActive ? "bg-red-600 text-white" : "bg-neutral-900 text-white/80")}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <h3 className={cn("text-xs font-medium line-clamp-2 leading-tight", isActive ? "text-red-400" : "text-foreground group-hover:text-red-400")}>
                        {playlist.titulo || playlist.area}
                      </h3>
                      {playlist.tempo && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{playlist.tempo}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main content: Player */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {activeVideoId ? (
            <>
              <div className="flex-1 bg-black flex items-center justify-center">
                <iframe
                  key={activeVideoId}
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                  title={activePlaylist?.titulo || ''}
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
                        Aula {String(selectedIndex + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
                      {activePlaylist?.titulo || activePlaylist?.area}
                    </h2>
                    {activePlaylist?.tempo && (
                      <p className="text-xs text-muted-foreground mt-1">{activePlaylist.tempo}</p>
                    )}
                  </div>
                  <button
                    onClick={() => startTransition(() => navigate(`/videoaulas/player?link=${encodeURIComponent(activePlaylist.link)}`))}
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
    <div className="px-3 py-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">{decodeURIComponent(area || '')}</h1>
        <p className="text-sm text-muted-foreground">
          {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? 's' : ''} disponíve{filteredPlaylists.length !== 1 ? 'is' : 'l'}
        </p>
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-xl mb-4">
        <Search className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar playlist por nome..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredPlaylists.length > 0 ? (
          filteredPlaylists.map((playlist, idx) => (
            <Card
              key={`${playlist.link}-${idx}`}
              className="cursor-pointer hover:scale-105 hover:shadow-2xl hover:-translate-y-1 transition-all border border-accent/20 hover:border-accent/50 bg-card group shadow-xl overflow-hidden"
              onClick={() => startTransition(() => navigate(`/videoaulas/player?link=${encodeURIComponent(playlist.link)}`))}
            >
              <div className="relative aspect-video bg-secondary">
                {playlist.thumb ? (
                  <img
                    src={playlist.thumb}
                    alt={playlist.titulo || playlist.area}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-12 h-12 text-accent" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="bg-red-600 rounded-full p-3 shadow-lg">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-base text-foreground leading-tight min-h-[2.5rem]">
                  {playlist.titulo || playlist.area}
                </h3>
                {playlist.tempo && (
                  <p className="text-xs text-muted-foreground mt-1">{playlist.tempo}</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Nenhuma playlist encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoaulasArea;
