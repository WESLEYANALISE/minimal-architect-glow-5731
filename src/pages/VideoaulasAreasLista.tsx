import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import videoaulasBackground from "@/assets/videoaulas-oab-background.webp";
import { AREAS_PLAYLISTS } from "@/data/videoaulasAreasPlaylists";
import { supabase } from "@/integrations/supabase/client";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";

const simplifyAreaName = (areaName: string): string => {
  const prefixesToRemove = ['Direito ', 'Legislação '];
  for (const prefix of prefixesToRemove) {
    if (areaName.startsWith(prefix)) {
      return areaName.replace(prefix, '');
    }
  }
  return areaName;
};

const VideoaulasAreasLista = () => {
  const navigate = useTransitionNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: areasWithStats, isLoading } = useQuery({
    queryKey: ["videoaulas-areas-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videoaulas_areas_direito")
        .select("area, thumb, video_id, ordem")
        .order("ordem", { ascending: true });
      
      if (error) throw error;

      const areaStatsMap: Record<string, { thumbnail: string | null; count: number }> = {};
      
      (data || []).forEach((video: any) => {
        const areaName = video.area?.trim();
        if (!areaName) return;
        
        if (!areaStatsMap[areaName]) {
          const thumbnail = video.thumb || 
            (video.video_id ? `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg` : null);
          areaStatsMap[areaName] = { thumbnail, count: 0 };
        }
        areaStatsMap[areaName].count++;
      });

      return AREAS_PLAYLISTS.map(playlist => ({
        ...playlist,
        thumbnail: areaStatsMap[playlist.nome]?.thumbnail || null,
        count: areaStatsMap[playlist.nome]?.count || 0
      }));
    },
    staleTime: 1000 * 60 * 10,
  });

  const filteredAreas = useMemo(() => {
    const areas = areasWithStats || AREAS_PLAYLISTS.map(p => ({ ...p, thumbnail: null, count: 0 }));
    if (!searchTerm.trim()) return areas;
    return areas.filter((area) =>
      area.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [areasWithStats, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${videoaulasBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />

      {/* Content */}
      <div className="relative z-10 min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm pb-4">
          <div className="flex items-center gap-4 p-4">
            <div>
              <h1 className="text-xl font-bold text-white">Áreas do Direito</h1>
              <p className="text-sm text-white/70">
                {AREAS_PLAYLISTS.length} áreas disponíveis
              </p>
            </div>
          </div>

          {/* Barra de pesquisa */}
          <div className="px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Pesquisar área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-black/50 border-red-700/30 text-white placeholder:text-white/40 focus:border-red-500/50"
              />
            </div>
          </div>
        </div>

        {/* Grid responsivo: 2 cols mobile, 4 cols desktop */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {filteredAreas?.map((area, index) => {
              const displayName = simplifyAreaName(area.nome);

              return (
                <motion.div
                  key={area.playlistId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  onClick={() => navigate(`/videoaulas/areas/${encodeURIComponent(area.nome)}`)}
                  className="cursor-pointer rounded-xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/5 hover:border-red-500/30 shadow-lg transition-all duration-300 overflow-hidden hover:scale-[1.03]"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-neutral-800">
                    {area.thumbnail ? (
                      <img
                        src={area.thumbnail}
                        alt={area.nome}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/40 to-neutral-900">
                        <Play className="w-8 h-8 text-red-400/50" />
                      </div>
                    )}
                    
                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600/80 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                    
                    {/* Badge de quantidade */}
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded">
                      {area.count > 0 ? `${area.count} aulas` : 'Playlist'}
                    </div>
                  </div>

                  {/* Nome */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-white text-center leading-tight">
                      {displayName}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mensagem se nenhum resultado */}
          {filteredAreas?.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-white/60">
                Nenhuma área encontrada para "{searchTerm}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoaulasAreasLista;
