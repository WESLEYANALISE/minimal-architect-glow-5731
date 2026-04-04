import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Headphones,
  Scale,
  BookOpen,
  Brain,
  Gavel,
  Heart,
  Briefcase,
  ShieldAlert,
  Search,
  Shuffle,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Music,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { AudioItem } from "@/contexts/AudioPlayerContext";
import { AudioAula } from "@/types/database.types";
import { useDeviceType } from "@/hooks/use-device-type";
import { motion, AnimatePresence } from "framer-motion";

interface AreaInfo {
  gradient: string;
  icon: React.ElementType;
  emoji: string;
}

const areaConfig: Record<string, AreaInfo> = {
  "Direito Constitucional": {
    gradient: "from-violet-600 to-purple-800",
    icon: Scale,
    emoji: "⚖️",
  },
  "Processo Penal": {
    gradient: "from-rose-600 to-red-800",
    icon: Gavel,
    emoji: "🔨",
  },
  "Processo Civil": {
    gradient: "from-blue-600 to-blue-800",
    icon: BookOpen,
    emoji: "📚",
  },
  "Direito Penal": {
    gradient: "from-orange-600 to-orange-800",
    icon: ShieldAlert,
    emoji: "🛡️",
  },
  "Filosofia do Direito": {
    gradient: "from-indigo-600 to-indigo-800",
    icon: Brain,
    emoji: "🧠",
  },
  "Direito Médico": {
    gradient: "from-emerald-600 to-green-800",
    icon: Heart,
    emoji: "🏥",
  },
  "Lei Penal Especial": {
    gradient: "from-amber-600 to-yellow-700",
    icon: Briefcase,
    emoji: "📋",
  },
  "Direito do Trabalho": {
    gradient: "from-cyan-600 to-teal-800",
    icon: Briefcase,
    emoji: "💼",
  },
};

const defaultAreaConfig: AreaInfo = {
  gradient: "from-gray-600 to-gray-800",
  icon: Headphones,
  emoji: "🎧",
};

const AudioaulasSpotify = () => {
  const navigate = useNavigate();
  const { playAudio, pauseAudio, togglePlayPause, setPlaylist, openPlayer, currentAudio, isPlaying } = useAudioPlayer();
  const [search, setSearch] = useState("");
  const { isDesktop } = useDeviceType();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [openTemas, setOpenTemas] = useState<Set<string>>(new Set());

  const { data: allAudios, isLoading } = useQuery({
    queryKey: ["audioaulas-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("AUDIO-AULA" as any)
        .select("*")
        .not("url_audio", "is", null)
        .order("sequencia", { ascending: true });
      if (error) throw error;
      return data as unknown as AudioAula[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Agrupar por área
  const areaGroups = useMemo(() => {
    if (!allAudios) return [];
    const groups: Record<string, AudioAula[]> = {};
    allAudios.forEach((audio) => {
      const area = audio.area || "Outros";
      if (!groups[area]) groups[area] = [];
      groups[area].push(audio);
    });
    return Object.entries(groups)
      .map(([area, audios]) => ({
        area,
        audios,
        totalTemas: new Set(audios.map((a) => a.tema).filter(Boolean)).size,
      }))
      .sort((a, b) => b.audios.length - a.audios.length);
  }, [allAudios]);

  // Filtro de busca
  const filteredAreas = useMemo(() => {
    if (!search.trim()) return areaGroups;
    const q = search.toLowerCase();
    return areaGroups.filter(
      (g) =>
        g.area.toLowerCase().includes(q) ||
        g.audios.some(
          (a) =>
            a.titulo?.toLowerCase().includes(q) ||
            a.tema?.toLowerCase().includes(q)
        )
    );
  }, [areaGroups, search]);

  // Episódios da área selecionada agrupados por tema
  const selectedAreaData = useMemo(() => {
    if (!selectedArea || !allAudios) return null;
    const audios = allAudios.filter((a) => a.area === selectedArea);
    const groups: Record<string, AudioAula[]> = {};
    audios.forEach((audio) => {
      const tema = audio.tema || "Geral";
      if (!groups[tema]) groups[tema] = [];
      groups[tema].push(audio);
    });
    return { audios, temaGroups: Object.entries(groups) };
  }, [selectedArea, allAudios]);

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
    if (!allAudios || allAudios.length === 0) return;
    const shuffled = [...allAudios].sort(() => Math.random() - 0.5);
    const items = shuffled.map(toAudioItem);
    setPlaylist(items);
    playAudio(items[0]);
  };

  const handlePlayArea = (audios: AudioAula[], e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (audios.length === 0) return;
    const items = audios.map(toAudioItem);
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
    const items = allInTema.map(toAudioItem);
    setPlaylist(items);
    playAudio(toAudioItem(audio));
  };

  const toggleTema = (tema: string) => {
    setOpenTemas((prev) => {
      const next = new Set(prev);
      if (next.has(tema)) next.delete(tema);
      else next.add(tema);
      return next;
    });
  };

  // ─── DESKTOP ───
  if (isDesktop) {
    const activeArea = selectedArea || areaGroups[0]?.area || null;
    const activeData = (() => {
      if (!activeArea || !allAudios) return null;
      const audios = allAudios.filter((a) => a.area === activeArea);
      const groups: Record<string, AudioAula[]> = {};
      audios.forEach((audio) => {
        const tema = audio.tema || "Geral";
        if (!groups[tema]) groups[tema] = [];
        groups[tema].push(audio);
      });
      return { audios, temaGroups: Object.entries(groups) };
    })();
    const activeConfig = activeArea ? (areaConfig[activeArea] || defaultAreaConfig) : defaultAreaConfig;
    const ActiveIcon = activeConfig.icon;

    return (
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
        {/* ─── Sidebar esquerda: lista de áreas ─── */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          {/* Header da sidebar */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Audioaulas</h1>
                <p className="text-xs text-muted-foreground">
                  {allAudios?.length || 0} episódios
                </p>
              </div>
            </div>
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar área..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* Botão shuffle */}
          <div className="px-4 py-3 border-b border-border">
            <Button
              onClick={handlePlayAll}
              variant="outline"
              size="sm"
              className="w-full gap-2 text-sm"
            >
              <Shuffle className="w-4 h-4" />
              Modo Aleatório
            </Button>
          </div>

          {/* Lista de áreas */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredAreas.map((group) => {
                  const config = areaConfig[group.area] || defaultAreaConfig;
                  const Icon = config.icon;
                  const isActive = activeArea === group.area;
                  const isAreaPlaying = currentAudio?.area === group.area && isPlaying;

                  return (
                    <button
                      key={group.area}
                      onClick={() => setSelectedArea(group.area)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 active:scale-[0.98] ${
                        isActive
                          ? "bg-accent/15 border border-accent/30"
                          : "hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                          {group.area}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.audios.length} ep. · {group.totalTemas} temas
                        </p>
                      </div>
                      {isAreaPlaying ? (
                        <div className="flex gap-0.5 items-center shrink-0">
                          <div className="w-0.5 h-3 bg-accent rounded-full animate-pulse" />
                          <div className="w-0.5 h-4 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                          <div className="w-0.5 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Now Playing mini */}
          {currentAudio && (
            <div className="p-3 border-t border-border bg-accent/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{currentAudio.titulo}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentAudio.area}</p>
                </div>
                <div className="flex gap-0.5 items-center shrink-0">
                  <div className="w-1 h-4 bg-accent rounded-full animate-pulse" />
                  <div className="w-1 h-6 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1 h-5 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Conteúdo principal: episódios da área selecionada ─── */}
        <div className="flex-1 overflow-y-auto">
          {activeArea && activeData ? (
            <>
              {/* Header da área */}
              <div className={`relative overflow-hidden bg-gradient-to-br ${activeConfig.gradient}`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
                <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

                <div className="relative px-8 py-8 flex items-end gap-6">
                  <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl shrink-0">
                    <ActiveIcon className="w-14 h-14 text-white" />
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                      Área de Estudo
                    </p>
                    <h2 className="text-3xl font-bold text-white leading-tight mb-1">
                      {activeArea}
                    </h2>
                    <p className="text-white/70 text-sm">
                      {activeData.audios.length} episódios · {activeData.temaGroups.length} temas
                    </p>
                  </div>
                  <div className="flex gap-3 pb-1">
                    <Button
                      onClick={() => handlePlayArea(activeData.audios)}
                      className="bg-white text-gray-900 hover:bg-white/90 font-bold gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Reproduzir
                    </Button>
                    <Button
                      onClick={() => {
                        const shuffled = [...activeData.audios].sort(() => Math.random() - 0.5);
                        handlePlayArea(shuffled);
                      }}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 gap-2"
                    >
                      <Shuffle className="w-4 h-4" />
                      Aleatório
                    </Button>
                  </div>
                </div>
              </div>

              {/* Lista de temas e episódios */}
              <div className="p-6 space-y-3 max-w-4xl">
                {activeData.temaGroups.map(([tema, temaAudios]) => {
                  const isOpen = openTemas.has(tema) || activeData.temaGroups.length === 1;
                  const hasCurrentInTema = temaAudios.some((a) => a.id === currentAudio?.id);

                  return (
                    <div
                      key={tema}
                      className={`rounded-2xl overflow-hidden border transition-all ${
                        hasCurrentInTema ? "border-accent/40 bg-accent/5" : "border-border bg-card"
                      }`}
                    >
                      <button
                        onClick={() => toggleTema(tema)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeConfig.gradient} flex items-center justify-center shrink-0`}>
                            <ActiveIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">{tema}</h3>
                            <p className="text-xs text-muted-foreground">
                              {temaAudios.length} {temaAudios.length === 1 ? "episódio" : "episódios"}
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

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            key="episodes"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-border/50 overflow-hidden"
                          >
                            {temaAudios.map((audio, epIndex) => {
                              const isCurrent = currentAudio?.id === audio.id;
                              const isCurrentPlaying = isCurrent && isPlaying;

                              return (
                                <button
                                  key={audio.id}
                                  onClick={() => handlePlayEpisode(audio, temaAudios)}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors group ${
                                    isCurrent ? "bg-accent/10" : ""
                                  } ${epIndex < temaAudios.length - 1 ? "border-b border-border/15" : ""}`}
                                >
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
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isCurrent ? "text-accent" : "text-foreground"}`}>
                                      {audio.titulo}
                                    </p>
                                    {audio.descricao && (
                                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {audio.descricao}
                                      </p>
                                    )}
                                  </div>
                                  {audio.tag && (
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                                      {audio.tag}
                                    </span>
                                  )}
                                  {isCurrentPlaying && (
                                    <Pause className="w-4 h-4 text-accent shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Headphones className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Selecione uma área</p>
                <p className="text-sm mt-1">Escolha uma área de direito na barra lateral</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── MOBILE ───
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-900/80 via-purple-900/60 to-background px-4 pt-8 pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Audioaulas</h1>
              <p className="text-white/60 text-sm">
                {allAudios?.length || 0} episódios · {areaGroups.length} áreas
              </p>
            </div>
          </div>

          {/* Busca */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar episódios, temas ou áreas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30"
            />
          </div>

          {/* Botão reproduzir tudo */}
          <Button
            onClick={handlePlayAll}
            className="bg-white text-violet-900 hover:bg-white/90 font-bold gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Reproduzir Tudo Aleatório
          </Button>
        </div>
      </div>

      {/* Continuar ouvindo */}
      {currentAudio && (
        <div className="px-4 pt-6 max-w-4xl mx-auto">
          <h2 className="text-base font-bold mb-3 text-foreground">
            🎵 Tocando Agora
          </h2>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{currentAudio.titulo}</p>
              <p className="text-xs text-muted-foreground truncate">{currentAudio.area}</p>
            </div>
            <div className="flex gap-0.5 items-center shrink-0">
              <div className="w-1 h-4 bg-accent rounded-full animate-pulse" />
              <div className="w-1 h-6 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-1 h-5 bg-accent rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      )}

      {/* Grid de áreas */}
      <div className="px-4 pt-6 max-w-4xl mx-auto">
        <h2 className="text-base font-bold mb-4 text-foreground">
          {search ? `Resultados para "${search}"` : "Áreas de Direito"}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Headphones className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum resultado encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAreas.map((group, index) => {
              const config = areaConfig[group.area] || defaultAreaConfig;
              const Icon = config.icon;
              const isAreaPlaying = currentAudio?.area === group.area;

              return (
                <Card
                  key={group.area}
                  onClick={() =>
                    navigate(`/audioaulas/area/${encodeURIComponent(group.area)}`)
                  }
                  className={`
                    relative overflow-hidden cursor-pointer
                    bg-gradient-to-br ${config.gradient}
                    border-0 shadow-xl hover:shadow-2xl
                    transform hover:scale-[1.02] transition-all duration-300
                    animate-fade-in
                  `}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "backwards",
                  }}
                >
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/5" />

                  <div className="relative p-4 flex flex-col h-36">
                    <div className="flex justify-between items-start mb-auto">
                      <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <button
                        onClick={(e) => handlePlayArea(group.audios, e)}
                        className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all active:scale-95"
                      >
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </button>
                    </div>

                    <div className="mt-2">
                      <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">
                        {group.area}
                      </h3>
                      <p className="text-white/70 text-xs mt-1">
                        {group.audios.length} ep.
                        {group.totalTemas > 0 && ` · ${group.totalTemas} temas`}
                      </p>
                    </div>

                    {isAreaPlaying && (
                      <div className="absolute top-3 left-3 flex gap-0.5 items-center">
                        <div className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
                        <div className="w-0.5 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <div className="w-0.5 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioaulasSpotify;
