import { useState, useMemo, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Headphones, Brain, BookOpen, Flame, Shuffle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AudioaulasAreaCard from "@/components/audioaulas/AudioaulasAreaCard";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { toast } from "sonner";
import { useDeviceType } from "@/hooks/use-device-type";

const AudioaulasSpotify = lazy(() => import("./AudioaulasSpotify"));

const CATEGORY_CONFIG: Record<string, { title: string; icon: React.ElementType; gradient: string }> = {
  audioaulas: {
    title: "Audioaulas",
    icon: Headphones,
    gradient: "from-violet-600 to-purple-700",
  },
  flashcards: {
    title: "Artigos de Lei",
    icon: Brain,
    gradient: "from-pink-600 to-rose-700",
  },
  resumos: {
    title: "Resumos",
    icon: BookOpen,
    gradient: "from-blue-600 to-cyan-700",
  },
};

const AudioaulasCategoriaPage = () => {
  const { categoria } = useParams<{ categoria: string }>();
  const navigate = useNavigate();
  const { playAudio, setPlaylist } = useAudioPlayer();

  const activeCategoria = categoria || "audioaulas";
  const config = CATEGORY_CONFIG[activeCategoria] || CATEGORY_CONFIG.audioaulas;
  const Icon = config.icon;

  const { data: areas, isLoading } = useQuery({
    queryKey: ["audioaulas-categoria-areas", activeCategoria],
    queryFn: async () => {
      let query;
      
      if (activeCategoria === "audioaulas") {
        query = supabase
          .from("AUDIO-AULA" as any)
          .select("area")
          .not("url_audio", "is", null)
          .order("area");
      } else if (activeCategoria === "flashcards") {
        query = supabase
          .from("FLASHCARDS - ARTIGOS LEI" as any)
          .select('area, "audio-pergunta"')
          .not('"audio-pergunta"', "is", null)
          .order("area");
      } else if (activeCategoria === "resumos") {
        query = supabase
          .from("RESUMO" as any)
          .select("area, url_audio_resumo")
          .not("url_audio_resumo", "is", null)
          .order("area");
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;

      const areasMap = new Map<string, number>();
      (data as any[])?.forEach((item) => {
        if (item.area) {
          areasMap.set(item.area, (areasMap.get(item.area) || 0) + 1);
        }
      });

      return Array.from(areasMap.entries())
        .map(([area, count]) => ({ area, count, tipo: activeCategoria }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const totalAudios = useMemo(() => {
    return areas?.reduce((sum, item) => sum + item.count, 0) || 0;
  }, [areas]);

  const handleShuffle = async () => {
    toast.info("Carregando áudios aleatórios...");
    
    try {
      let query;
      
      if (activeCategoria === "audioaulas") {
        query = supabase.from("AUDIO-AULA" as any).select("*").not("url_audio", "is", null).limit(30);
      } else if (activeCategoria === "flashcards") {
        query = supabase.from("FLASHCARDS - ARTIGOS LEI" as any).select('*, "audio-pergunta"').not('"audio-pergunta"', "is", null).limit(30);
      } else if (activeCategoria === "resumos") {
        query = supabase.from("RESUMO" as any).select("*").not("url_audio_resumo", "is", null).limit(30);
      } else {
        return;
      }

      const { data, error } = await query;
      if (error) throw error;

      const allAudios: any[] = [];

      if (activeCategoria === "audioaulas") {
        (data as any[])?.forEach((item) => {
          allAudios.push({
            id: item.id,
            titulo: item.titulo || item.tema || "Sem título",
            url_audio: item.url_audio,
            imagem_miniatura: item.imagem_miniatura || "",
            descricao: item.descricao || "",
            area: item.area || "",
            tema: item.tema || "",
            tipo: "audioaula" as const,
          });
        });
      } else if (activeCategoria === "flashcards") {
        (data as any[])?.forEach((item) => {
          allAudios.push({
            id: item.id,
            titulo: item.subtema || item.pergunta?.substring(0, 50) || "Flashcard",
            url_audio: item["audio-pergunta"],
            imagem_miniatura: item.imagem_exemplo || "",
            descricao: item.pergunta || "",
            area: item.area || "",
            tema: item.subtema || "",
            tipo: "flashcard" as const,
            texto_exemplo: item.exemplo,
            url_imagem_exemplo: item.imagem_exemplo,
            pergunta: item.pergunta,
            resposta: item.resposta,
          });
        });
      } else if (activeCategoria === "resumos") {
        (data as any[])?.forEach((item) => {
          allAudios.push({
            id: item.id,
            titulo: item.titulo || item.tema || "Resumo",
            url_audio: item.url_audio_resumo,
            imagem_miniatura: item.url_imagem || "",
            descricao: item.texto || "",
            area: item.area || "",
            tema: item.tema || "",
            tipo: "resumo" as const,
            texto_exemplo: item.texto,
            url_imagem_exemplo: item.url_imagem,
          });
        });
      }

      const shuffled = allAudios.sort(() => Math.random() - 0.5);
      
      if (shuffled.length > 0) {
        setPlaylist(shuffled);
        playAudio(shuffled[0]);
        toast.success(`${shuffled.length} áudios carregados!`);
      } else {
        toast.error("Nenhum áudio encontrado");
      }
    } catch (error) {
      toast.error("Erro ao carregar áudios");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-4 py-4 max-w-4xl mx-auto w-full flex-1">
        {/* Header */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.gradient} p-5 sm:p-6 mb-6`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{config.title}</h1>
              <p className="text-white/80 text-sm mt-1">
                {totalAudios} áudios disponíveis
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleShuffle}
            className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            Modo Aleatório
          </Button>
        </div>

        {/* Em Alta Carousel */}
        {!isLoading && areas && areas.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-bold text-foreground">Em Alta</h2>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-4">
                {areas.slice(0, 8).map((item, index) => (
                  <div
                    key={item.area}
                    onClick={() => navigate(`/audioaulas/categoria/${activeCategoria}/${encodeURIComponent(item.area)}`)}
                    className={`
                      flex-shrink-0 w-28 sm:w-32 p-3 sm:p-4 rounded-xl cursor-pointer
                      bg-gradient-to-br ${config.gradient}
                      hover:scale-105 transition-transform duration-300
                      animate-fade-in
                    `}
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: 'backwards'
                    }}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white/80 mb-2" />
                    <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2">{item.area}</p>
                    <p className="text-xs text-white/70 mt-1">{item.count} áudios</p>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Lista de Áreas */}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground mb-4">Todas as Áreas</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
            </div>
          ) : areas && areas.length > 0 ? (
            <div className="space-y-3 pb-24">
              {areas.map((item, index) => (
                <AudioaulasAreaCard
                  key={item.area}
                  area={item.area}
                  count={item.count}
                  tipo={activeCategoria}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum áudio disponível nesta categoria
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioaulasCategoriaPage;
