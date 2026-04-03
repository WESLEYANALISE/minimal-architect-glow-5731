import { FilmeDoDia } from "@/hooks/useFilmeDoDia";
import { useRef, useEffect, useState, useCallback } from "react";
import { Star, Clock, Calendar, Play, Pause, Volume2, Film, Users, Lightbulb, ExternalLink, Quote, CheckCircle2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import ShareFilmeButton from "./ShareFilmeButton";
import { FilmeOndeAssistir } from "./FilmeOndeAssistir";
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import { motion, AnimatePresence } from "framer-motion";
import FilmeElenco from "./FilmeElenco";
import FilmeTrailer from "./FilmeTrailer";
import FilmeCenasSlide from "./FilmeCenasSlide";
import AvaliacaoButtons from "./FilmeAvaliacaoButtons";
import ImagensCarousel from "@/components/ui/ImagensCarousel";
import { cn } from "@/lib/utils";

type TabFilme = "recomendacao" | "cenas" | "elenco";
type TabSinopse = "sinopse" | "beneficios";

const TABS: { id: TabFilme; icon: typeof Lightbulb; label: string }[] = [
  { id: "recomendacao", icon: Lightbulb, label: "Recomendação" },
  { id: "cenas", icon: Film, label: "Cenas" },
  { id: "elenco", icon: Users, label: "Elenco" },
];

interface Props {
  filme: FilmeDoDia;
}

// ... keep existing code (formatTime, SoundWave)

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function SoundWave({ isPlaying }: { isPlaying: boolean }) {
  const bars = [1, 2, 3, 4, 5, 6, 7];
  return (
    <div className="flex items-end gap-[2px] h-6">
      {bars.map((bar) => (
        <motion.div
          key={bar}
          className="w-[3px] rounded-full bg-red-500"
          animate={isPlaying ? {
            height: [4, 12 + Math.random() * 12, 6, 18 + Math.random() * 6, 4],
          } : { height: 4 }}
          transition={isPlaying ? {
            duration: 0.8 + Math.random() * 0.4,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: bar * 0.08,
          } : { duration: 0.3 }}
        />
      ))}
    </div>
  );
}

/** Substitui PLACEHOLDER_IMAGEM_N por <img> das imagens_cenas */
function substituirPlaceholdersFilme(texto: string, imagens: string[] | null): string {
  if (!imagens || imagens.length === 0) {
    return texto.replace(/\n*PLACEHOLDER_IMAGEM_\d+\n*/g, '\n\n');
  }
  let result = texto;
  for (let i = 1; i <= 5; i++) {
    const img = imagens[i - 1];
    if (img) {
      result = result.replace(
        new RegExp(`\n*PLACEHOLDER_IMAGEM_${i}\n*`, 'g'),
        `\n\n![Cena do filme](${img})\n\n`
      );
    } else {
      result = result.replace(new RegExp(`\n*PLACEHOLDER_IMAGEM_${i}\n*`, 'g'), '\n\n');
    }
  }
  return result;
}

/** Tenta parsear beneficios_juridicos como JSON array de {titulo, descricao} */
function parseBeneficiosEstruturados(beneficios: string | null): { titulo: string; descricao: string }[] | null {
  if (!beneficios) return null;
  try {
    const parsed = JSON.parse(beneficios);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].titulo) return parsed;
  } catch {
    // Não é JSON, tentar extrair do markdown
  }
  return null;
}

const FilmeDiaCard = ({ filme }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [tab, setTab] = useState<TabFilme>("recomendacao");
  const [tabSinopse, setTabSinopse] = useState<TabSinopse>("sinopse");
  const [showOndeAssistir, setShowOndeAssistir] = useState(false);

  // Set fallback duration
  useEffect(() => {
    if (filme.audio_duracao_segundos && duration === 0) {
      setDuration(filme.audio_duracao_segundos);
    }
  }, [filme.audio_duracao_segundos]);

  // Reset on film change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(filme.audio_duracao_segundos || 0);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (bgMusicRef.current) { bgMusicRef.current.pause(); }
  }, [filme.id]);

  // Background music
  useEffect(() => {
    const bgMusic = new Audio('/audio/bg-music-dica.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.12;
    bgMusic.preload = 'auto';
    bgMusicRef.current = bgMusic;
    return () => { bgMusic.pause(); bgMusicRef.current = null; };
  }, []);

  // Narration audio
  useEffect(() => {
    if (!filme.audio_url) return;
    const audio = new Audio(filme.audio_url);
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) setDuration(dur);
    };
    const onEnd = () => { setIsPlaying(false); bgMusicRef.current?.pause(); };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.pause();
      audioRef.current = null;
    };
  }, [filme.audio_url]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      bgMusicRef.current?.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      bgMusicRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const beneficiosEstruturados = parseBeneficiosEstruturados(filme.beneficios_juridicos);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black">
      {/* Backdrop */}
      {filme.backdrop_path && (
        <div className="absolute inset-0 z-0">
          <img src={filme.backdrop_path} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
        </div>
      )}

      <div className="relative z-10 p-4 space-y-4">
        {/* Header: Poster + Info */}
        <div className="flex gap-4">
          {filme.poster_path && (
            <img
              src={filme.poster_path}
              alt={filme.titulo}
              className="w-28 h-[168px] rounded-lg object-cover shadow-2xl flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <h2 className="text-lg font-bold text-white leading-tight">{filme.titulo}</h2>
            {filme.titulo_original && filme.titulo_original !== filme.titulo && (
              <p className="text-xs text-white/50 italic">{filme.titulo_original}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {filme.nota_tmdb && (
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 text-[10px] gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {filme.nota_tmdb.toFixed(1)}
                </Badge>
              )}
              {filme.ano && (
                <Badge variant="secondary" className="bg-white/10 text-white/70 text-[10px] gap-1">
                  <Calendar className="w-3 h-3" /> {filme.ano}
                </Badge>
              )}
              {filme.duracao && filme.duracao > 0 && (
                <Badge variant="secondary" className="bg-white/10 text-white/70 text-[10px] gap-1">
                  <Clock className="w-3 h-3" /> {filme.duracao}min
                </Badge>
              )}
            </div>
            {/* Ícones de plataformas disponíveis */}
            {filme.onde_assistir && (() => {
              const seen = new Set<number>();
              const providers: { provider_id: number; provider_name: string; logo_path: string | null }[] = [];
              for (const list of [filme.onde_assistir.flatrate, filme.onde_assistir.rent, filme.onde_assistir.buy]) {
                if (list) for (const p of list) {
                  if (!seen.has(p.provider_id) && p.logo_path) {
                    seen.add(p.provider_id);
                    providers.push(p);
                  }
                }
              }
              return providers.length > 0 ? (
                <div className="flex items-center gap-1.5 mt-1">
                  {providers.map(p => (
                    <img
                      key={p.provider_id}
                      src={p.logo_path!}
                      alt={p.provider_name}
                      title={p.provider_name}
                      className="w-6 h-6 rounded-md object-cover"
                    />
                  ))}
                </div>
              ) : null;
            })()}
            {filme.diretor && (
              <p className="text-xs text-white/60">🎬 Dirigido por <span className="text-white/80 font-medium">{filme.diretor}</span></p>
            )}
            <div className="flex flex-wrap gap-1">
              {filme.generos?.slice(0, 3).map((g, i) => (
                <Badge key={i} variant="outline" className="text-[9px] text-red-300 border-red-500/30">{g}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Abas Sinopse / Benefícios */}
        {(filme.sinopse || filme.beneficios_juridicos) && (
          <div>
            <div className="flex bg-white/5 rounded-full p-0.5 gap-0.5 mb-3">
              <button
                onClick={() => setTabSinopse("sinopse")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-all",
                  tabSinopse === "sinopse"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                <Film className="w-3.5 h-3.5" />
                Sinopse
              </button>
              <button
                onClick={() => setTabSinopse("beneficios")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-all",
                  tabSinopse === "beneficios"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                <Scale className="w-3.5 h-3.5" />
                Benefícios
              </button>
            </div>

            <AnimatePresence mode="wait">
              {tabSinopse === "sinopse" && filme.sinopse && (
                <motion.div key="sinopse" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <Card className="p-3 sm:p-4 border-white/10 bg-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">Sinopse</h4>
                    <p className="text-sm text-white/70 leading-relaxed">{filme.sinopse}</p>
                  </Card>
                </motion.div>
              )}
              {tabSinopse === "beneficios" && (
                <motion.div key="beneficios" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <Card className="p-3 sm:p-4 border-amber-500/20 bg-amber-500/5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      Benefícios para sua carreira jurídica
                    </h4>
                    {beneficiosEstruturados ? (
                      <ul className="space-y-3">
                        {beneficiosEstruturados.map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="text-sm font-semibold text-white/90">{b.titulo}</span>
                              <p className="text-xs text-white/60 mt-0.5">{b.descricao}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : filme.beneficios_juridicos ? (
                      <div className="text-sm text-white/80 leading-relaxed">
                        <EnrichedMarkdownRenderer content={filme.beneficios_juridicos} fontSize={14} theme="classicos" />
                      </div>
                    ) : (
                      <p className="text-sm text-white/50">Benefícios não disponíveis para este filme.</p>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Botões de avaliação */}
        <AvaliacaoButtons tipo="filme" itemData={filme.data} />

        {/* Botões: Onde Assistir + Compartilhar */}
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="flex-1">
            <button
              onClick={() => setShowOndeAssistir(true)}
              className="group relative w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold overflow-hidden shadow-md transition-all"
              style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)" }}
            >
              <ExternalLink className="w-4 h-4 text-white" />
              <span className="text-white">Onde Assistir</span>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </button>
          </motion.div>
          <div className="flex-1">
            <ShareFilmeButton filme={filme} />
          </div>
        </div>

        {/* Carrossel de cenas geradas */}
        {filme.imagens_cenas && filme.imagens_cenas.filter(Boolean).length > 0 && (
          <ImagensCarousel imagens={filme.imagens_cenas.filter(Boolean)} titulo={filme.titulo} />
        )}

        {/* Trailer */}
        {filme.trailer_url && <FilmeTrailer trailerUrl={filme.trailer_url} />}

        {/* Toggle de abas */}
        <div className="w-full">
          <div className="flex w-full bg-white/5 rounded-full p-1 gap-0.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition-all",
                  tab === t.id
                    ? "bg-red-600 text-white shadow-md"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Recomendação */}
        {tab === "recomendacao" && (
          <div className="space-y-3">
            {/* Audio player */}
            {filme.audio_url && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-red-500/20"
                style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.12) 0%, rgba(15,15,15,1) 60%, rgba(220, 38, 38, 0.06) 100%)',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500/10">
                  <motion.div className="h-full bg-red-500" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={togglePlay}
                      className="relative h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
                    >
                      <AnimatePresence mode="wait">
                        {isPlaying ? (
                          <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Pause className="h-5 w-5 text-white" />
                          </motion.div>
                        ) : (
                          <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Play className="h-5 w-5 text-white ml-0.5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {isPlaying && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-red-500/40"
                          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                        />
                      )}
                    </motion.button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-red-400/70" />
                        <span className="text-[11px] font-medium text-red-400/80 uppercase tracking-wider">Ouça a narração</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPlaying && <SoundWave isPlaying={isPlaying} />}
                        <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="flex-1" />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-white/40 font-mono">{formatTime(currentTime)}</span>
                        <span className="text-[10px] text-white/40 font-mono">{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Carrossel de cenas */}
            {filme.imagens_cenas && filme.imagens_cenas.length > 0 && (
              <FilmeCenasSlide imagens={filme.imagens_cenas} titulo={filme.titulo} />
            )}

            {/* Por que assistir - com imagens inline */}
            {filme.porque_assistir && (
              <div className="bg-[#12121a] rounded-xl border border-white/10 p-5 [&_img]:rounded-xl [&_img]:w-full [&_img]:my-4 [&_img]:shadow-lg [&_img]:aspect-[16/10] [&_img]:object-cover [&_img]:bg-white/5">
                {(() => {
                  const beneficiosMatch = filme.porque_assistir?.match(/<!-- BENEFICIOS_START -->\n([\s\S]*?)\n<!-- BENEFICIOS_END -->/);
                  const beneficios = beneficiosMatch ? beneficiosMatch[1].split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2)) : [];
                  let textoSemBeneficios = filme.porque_assistir?.replace(/<!-- BENEFICIOS_START -->[\s\S]*?<!-- BENEFICIOS_END -->\n*/, '') || '';
                  
                  // Substituir placeholders por imagens reais
                  textoSemBeneficios = substituirPlaceholdersFilme(textoSemBeneficios, filme.imagens_cenas);
                  
                  return (
                    <>
                      {beneficios.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4"
                        >
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            O que você vai ganhar assistindo
                          </h4>
                          <ul className="space-y-2">
                            {beneficios.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                      <EnrichedMarkdownRenderer content={textoSemBeneficios} fontSize={15} theme="classicos" />
                    </>
                  );
                })()}
              </div>
            )}

            {/* Frase do dia */}
            {filme.frase_dia && (
              <Card className="p-3 sm:p-4 border-red-500/15 bg-red-500/5">
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm italic text-white/80">{filme.frase_dia}</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Tab: Cenas */}
        {tab === "cenas" && (
          <div>
            {filme.imagens_cenas && filme.imagens_cenas.length > 0 ? (
              <FilmeCenasSlide imagens={filme.imagens_cenas} titulo={filme.titulo} />
            ) : (
              <p className="text-sm text-white/40 text-center py-8">Nenhuma cena disponível.</p>
            )}
          </div>
        )}

        {/* Tab: Elenco */}
        {tab === "elenco" && (
          <div>
            {filme.elenco && filme.elenco.length > 0 ? (
              <FilmeElenco elenco={filme.elenco} />
            ) : (
              <p className="text-sm text-white/40 text-center py-8">Elenco não disponível.</p>
            )}
          </div>
        )}
      </div>

      {/* Floating card Onde Assistir */}
      <FilmeOndeAssistir
        isOpen={showOndeAssistir}
        onClose={() => setShowOndeAssistir(false)}
        ondeAssistir={filme.onde_assistir}
        tmdbId={filme.tmdb_id}
      />
    </div>
  );
};

export default FilmeDiaCard;
