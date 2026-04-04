import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Search, Loader2, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { AREAS_PLAYLISTS } from "@/data/videoaulasAreasPlaylists";
import { supabase } from "@/integrations/supabase/client";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

const simplifyAreaName = (areaName: string): string => {
  const prefixesToRemove = ['Direito ', 'Legislação '];
  for (const prefix of prefixesToRemove) {
    if (areaName.startsWith(prefix)) return areaName.replace(prefix, '');
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
          const thumbnail = video.thumb || (video.video_id ? `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg` : null);
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
    return areas.filter(area => area.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [areasWithStats, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(350, 40%, 12%)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-24" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-sm pb-4" style={{ background: 'linear-gradient(to bottom, hsla(345, 65%, 25%, 0.9), transparent)' }}>
          <div className="flex items-center gap-3 p-4">
            <Crown className="w-6 h-6" style={{ color: GOLD }} />
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
                Áreas do Direito
              </h1>
              <p className="text-sm" style={{ color: 'hsl(40, 30%, 70%)' }}>
                {AREAS_PLAYLISTS.length} áreas disponíveis
              </p>
            </div>
          </div>

          <div className="px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(40, 20%, 50%)' }} />
              <Input
                placeholder="Pesquisar área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                style={{ background: 'hsla(345, 20%, 15%, 0.5)', borderColor: 'hsla(40, 60%, 50%, 0.2)', color: 'hsl(40, 60%, 90%)' }}
              />
            </div>
          </div>
        </div>

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
                  className="cursor-pointer rounded-xl shadow-lg transition-all duration-300 overflow-hidden hover:scale-[1.03]"
                  style={{ background: 'hsla(345, 30%, 18%, 0.7)', border: '1px solid hsla(40, 60%, 50%, 0.12)' }}
                >
                  <div className="relative aspect-video" style={{ background: 'hsl(345, 30%, 15%)' }}>
                    {area.thumbnail ? (
                      <img src={area.thumbnail} alt={area.nome} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 25%), hsl(350, 40%, 15%))' }}>
                        <Play className="w-8 h-8" style={{ color: 'hsla(40, 80%, 55%, 0.4)' }} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'hsla(345, 65%, 30%, 0.8)' }}>
                        <Play className="w-5 h-5 ml-0.5" style={{ color: GOLD }} fill={GOLD} />
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[10px] font-bold rounded" style={{ background: GOLD, color: 'hsl(350, 40%, 12%)' }}>
                      {area.count > 0 ? `${area.count} aulas` : 'Playlist'}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-center leading-tight" style={{ color: 'hsl(40, 60%, 90%)' }}>
                      {displayName}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredAreas?.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p style={{ color: 'hsl(40, 20%, 55%)' }}>Nenhuma área encontrada para "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoaulasAreasLista;
