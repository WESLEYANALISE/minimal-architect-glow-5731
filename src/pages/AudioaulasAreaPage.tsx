import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Play,
  Shuffle,
  Headphones,
  Scale,
  BookOpen,
  Brain,
  Gavel,
  Heart,
  Briefcase,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { AudioItem } from "@/contexts/AudioPlayerContext";
import { AudioAula } from "@/types/database.types";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AreaConfig {
  gradient: string;
  gradientDark: string;
  icon: React.ElementType;
}

const areaConfig: Record<string, AreaConfig> = {
  "Direito Constitucional": {
    gradient: "from-violet-600 to-purple-800",
    gradientDark: "bg-violet-900/30",
    icon: Scale,
  },
  "Processo Penal": {
    gradient: "from-rose-600 to-red-800",
    gradientDark: "bg-rose-900/30",
    icon: Gavel,
  },
  "Processo Civil": {
    gradient: "from-blue-600 to-blue-800",
    gradientDark: "bg-blue-900/30",
    icon: BookOpen,
  },
  "Direito Penal": {
    gradient: "from-orange-600 to-orange-800",
    gradientDark: "bg-orange-900/30",
    icon: ShieldAlert,
  },
  "Filosofia do Direito": {
    gradient: "from-indigo-600 to-indigo-800",
    gradientDark: "bg-indigo-900/30",
    icon: Brain,
  },
  "Direito Médico": {
    gradient: "from-emerald-600 to-green-800",
    gradientDark: "bg-emerald-900/30",
    icon: Heart,
  },
  "Lei Penal Especial": {
    gradient: "from-amber-600 to-yellow-700",
    gradientDark: "bg-amber-900/30",
    icon: Briefcase,
  },
  "Direito do Trabalho": {
    gradient: "from-cyan-600 to-teal-800",
    gradientDark: "bg-cyan-900/30",
    icon: Briefcase,
  },
};

const defaultConfig: AreaConfig = {
  gradient: "from-gray-600 to-gray-800",
  gradientDark: "bg-gray-900/30",
  icon: Headphones,
};

const AudioaulasAreaPage = () => {
  const { area } = useParams();
  const navigate = useNavigate();
  const { playAudio, pauseAudio, togglePlayPause, setPlaylist, openPlayer, currentAudio, isPlaying } =
    useAudioPlayer();
  const [openTemas, setOpenTemas] = useState<Set<string>>(new Set());

  const areaName = decodeURIComponent(area || "");
  const config = areaConfig[areaName] || defaultConfig;
  const Icon = config.icon;

  const { data: audios, isLoading } = useQuery({
    queryKey: ["audioaulas-area", areaName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("AUDIO-AULA" as any)
        .select("*")
        .eq("area", areaName)
        .order("sequencia", { ascending: true });
      if (error) throw error;
      return data as unknown as AudioAula[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Agrupar por tema
  const temaGroups = useMemo(() => {
    if (!audios) return [];
    const groups: Record<string, AudioAula[]> = {};
    audios.forEach((audio) => {
      const tema = audio.tema || "Geral";
      if (!groups[tema]) groups[tema] = [];
      groups[tema].push(audio);
    });
    return Object.entries(groups);
  }, [audios]);

  const toAudioItem = (audio: AudioAula): AudioItem => ({
    id: audio.id,
    titulo: audio.titulo || "",
    url_audio: audio.url_audio || "",
    imagem_miniatura: audio.imagem_miniatura || "",
    descricao: audio.descricao || "",
    area: audio.area || "",
    tema: audio.tema || "",
    tipo: "audioaula",
  });

  const handlePlayAll = () => {
    if (!audios || audios.length === 0) return;
    const items = audios.map(toAudioItem);
    setPlaylist(items);
    playAudio(items[0]);
  };

  const handleShuffle = () => {
    if (!audios || audios.length === 0) return;
    const shuffled = [...audios].sort(() => Math.random() - 0.5);
    const items = shuffled.map(toAudioItem);
    setPlaylist(items);
    playAudio(items[0]);
  };

  const handlePlayEpisode = (audio: AudioAula, allInTema: AudioAula[]) => {
    const isCurrentPlaying = currentAudio?.id === audio.id && isPlaying;
    if (isCurrentPlaying) {
      pauseAudio();
      return;
    }
    if (currentAudio?.id === audio.id && !isPlaying) {
      togglePlayPause();
      openPlayer();
      return;
    }
    // Criar playlist com o tema completo
    const items = allInTema.map(toAudioItem);
    setPlaylist(items);
    playAudio(toAudioItem(audio));
    // playAudio já chama openPlayer internamente via setIsPlayerOpen(true)
  };

  const toggleTema = (tema: string) => {
    setOpenTemas((prev) => {
      const next = new Set(prev);
      if (next.has(tema)) next.delete(tema);
      else next.add(tema);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header com gradiente da área */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${config.gradient}`}>
        <div className="absolute inset-0 bg-black/30" />
        {/* Decorações */}
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative px-4 pt-4 pb-8 max-w-4xl mx-auto">
          {/* Botão voltar */}
          <button
            onClick={() => navigate("/audioaulas")}
            className="flex items-center gap-1.5 text-white/80 hover:text-white mb-5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Áudio Aulas</span>
          </button>

          {/* Info da área */}
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl shrink-0">
              <Icon className="w-12 h-12 text-white" />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                Área de Estudo
              </p>
              <h1 className="text-2xl font-bold text-white leading-tight mb-1">
                {areaName}
              </h1>
              <p className="text-white/70 text-sm">
                {audios?.length || 0} episódios
                {temaGroups.length > 0 && ` · ${temaGroups.length} ${temaGroups.length === 1 ? "tema" : "temas"}`}
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 mt-5">
            <Button
              onClick={handlePlayAll}
              className="bg-white text-gray-900 hover:bg-white/90 font-bold gap-2 flex-1"
              disabled={!audios || audios.length === 0}
            >
              <Play className="w-4 h-4 fill-current" />
              Reproduzir
            </Button>
            <Button
              onClick={handleShuffle}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 gap-2 flex-1"
              disabled={!audios || audios.length === 0}
            >
              <Shuffle className="w-4 h-4" />
              Aleatório
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de episódios por tema */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : temaGroups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground px-4">
            <Headphones className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Nenhum episódio encontrado nesta área</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {temaGroups.map(([tema, temaAudios]) => {
              const isOpen = openTemas.has(tema) || temaGroups.length === 1;
              const hasCurrentInTema = temaAudios.some(
                (a) => a.id === currentAudio?.id
              );

              return (
                <div
                  key={tema}
                  className={`rounded-2xl overflow-hidden border transition-all ${
                    hasCurrentInTema
                      ? "border-accent/40 bg-accent/5"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Cabeçalho do tema */}
                  <button
                    onClick={() => toggleTema(tema)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">
                          {tema}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {temaAudios.length}{" "}
                          {temaAudios.length === 1 ? "episódio" : "episódios"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasCurrentInTema && isPlaying && (
                        <div className="flex gap-0.5 items-center">
                          <div className="w-1 h-3 bg-accent rounded-full animate-pulse" />
                          <div className="w-1 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <div className="w-1 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                        </div>
                      )}
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Episódios do tema com animação slide da esquerda */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        key="episodes"
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="border-t border-border/50"
                      >
                        {temaAudios.map((audio, epIndex) => {
                          const isCurrent = currentAudio?.id === audio.id;
                          const isCurrentPlaying = isCurrent && isPlaying;

                          return (
                            <motion.button
                              key={audio.id}
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.18, ease: "easeOut", delay: epIndex * 0.04 }}
                              onClick={() =>
                                handlePlayEpisode(audio, temaAudios)
                              }
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors group ${
                                isCurrent ? "bg-accent/10" : ""
                              } ${epIndex < temaAudios.length - 1 ? "border-b border-border/15" : ""}`}
                            >
                              {/* Número / Play icon */}
                              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                                {isCurrentPlaying ? (
                                  <div className="flex gap-0.5 items-center">
                                    <div className="w-0.5 h-3 bg-accent rounded-full animate-pulse" />
                                    <div className="w-0.5 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                                    <div className="w-0.5 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-sm text-muted-foreground group-hover:hidden font-mono">
                                      {audio.sequencia || epIndex + 1}
                                    </span>
                                    <Play className="w-4 h-4 text-foreground fill-current hidden group-hover:block" />
                                  </>
                                )}
                              </div>

                              {/* Info do episódio */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    isCurrent
                                      ? "text-accent"
                                      : "text-foreground"
                                  }`}
                                >
                                  {audio.titulo}
                                </p>
                                {audio.descricao && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    {audio.descricao}
                                  </p>
                                )}
                              </div>

                              {/* Tag */}
                              {audio.tag && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                                  {audio.tag}
                                </span>
                              )}

                              {/* Ação pause se tocando */}
                              {isCurrentPlaying && (
                                <Pause className="w-4 h-4 text-accent shrink-0" />
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioaulasAreaPage;
