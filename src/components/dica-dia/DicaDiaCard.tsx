import { DicaDoDia } from "@/hooks/useDicaDoDia";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, BookOpen, Quote, Lightbulb, ExternalLink, Tag, Volume2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import { motion, AnimatePresence } from "framer-motion";
import ShareDicaButton from "./ShareDicaButton";
import AvaliacaoButtons from "@/components/filme-dia/FilmeAvaliacaoButtons";
import ImagensCarousel from "@/components/ui/ImagensCarousel";

interface DicaDiaCardProps {
  dica: DicaDoDia;
}

const BIBLIOTECA_LABELS: Record<string, string> = {
  'classicos': 'Clássicos',
  'fora-da-toga': 'Fora da Toga',
  'oratoria': 'Oratória',
  'lideranca': 'Liderança',
};

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Direito Penal': { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/25' },
  'Direito Civil': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/25' },
  'Direito Constitucional': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25' },
  'Direito Administrativo': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  'Direito do Trabalho': { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/25' },
  'Direito Processual': { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/25' },
  'Direito Tributário': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/25' },
  'Direito Empresarial': { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/25' },
  'Filosofia': { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/25' },
  'Filosofia do Direito': { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/25' },
  'Sociologia': { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/25' },
  'Oratória': { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/25' },
  'Liderança': { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/25' },
  'Desenvolvimento Pessoal': { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/25' },
  'Literatura': { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-400', border: 'border-fuchsia-500/25' },
};

const DEFAULT_TAG_COLOR = { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };

function getTagColor(tag: string) {
  const normalized = tag.trim();
  return TAG_COLORS[normalized] || DEFAULT_TAG_COLOR;
}

const BIBLIOTECA_ROUTES: Record<string, string> = {
  'classicos': '/biblioteca-classicos',
  'fora-da-toga': '/biblioteca-fora-da-toga',
  'oratoria': '/biblioteca-oratoria',
  'lideranca': '/biblioteca-lideranca',
};

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === Infinity) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function extractTags(areaLivro: string | null): string[] {
  if (!areaLivro) return [];
  return areaLivro.split(/[,]/).map(t => t.trim()).filter(t => t.length > 0);
}

function SoundWave({ isPlaying }: { isPlaying: boolean }) {
  const bars = [1, 2, 3, 4, 5, 6, 7];
  return (
    <div className="flex items-end gap-[2px] h-6">
      {bars.map((bar) => (
        <motion.div
          key={bar}
          className="w-[3px] rounded-full bg-primary"
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

/** Substitui PLACEHOLDER_IMAGEM_N por <img> das imagens_conteudo */
function substituirPlaceholdersLivro(texto: string, imagens: string[] | null | undefined): string {
  if (!imagens || imagens.length === 0) {
    return texto.replace(/\n*PLACEHOLDER_IMAGEM_\d+\n*/g, '\n\n');
  }
  let result = texto;
  for (let i = 1; i <= 5; i++) {
    const img = imagens[i - 1];
    if (img) {
      result = result.replace(
        new RegExp(`\\n*PLACEHOLDER_IMAGEM_${i}\\n*`, 'g'),
        `\n\n![Ilustração](${img})\n\n`
      );
    } else {
      result = result.replace(new RegExp(`\\n*PLACEHOLDER_IMAGEM_${i}\\n*`, 'g'), '\n\n');
    }
  }
  return result;
}

export default function DicaDiaCard({ dica }: DicaDiaCardProps) {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const prevDicaIdRef = useRef<number | null>(null);

  // Set fallback duration immediately
  useEffect(() => {
    if (dica.audio_duracao_segundos && duration === 0) {
      setDuration(dica.audio_duracao_segundos);
    }
  }, [dica.audio_duracao_segundos]);

  // Pause previous audio and auto-play new one when dica changes
  useEffect(() => {
    if (prevDicaIdRef.current !== null && prevDicaIdRef.current !== dica.id) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      if (bgMusicRef.current) { bgMusicRef.current.pause(); }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(dica.audio_duracao_segundos || 0);
    }
    prevDicaIdRef.current = dica.id;
  }, [dica.id]);

  // Create background music on mount
  useEffect(() => {
    const bgMusic = new Audio('/audio/bg-music-dica.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.15;
    bgMusic.preload = 'auto';
    bgMusicRef.current = bgMusic;
    return () => { bgMusic.pause(); bgMusicRef.current = null; };
  }, []);

  // Create narration audio on mount and auto-play
  useEffect(() => {
    if (!dica.audio_url) return;
    const audio = new Audio(dica.audio_url);
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) setDuration(dur);
    };
    const onEnd = () => { setIsPlaying(false); bgMusicRef.current?.pause(); };
    const onCanPlay = () => {
      audio.play().then(() => {
        setIsPlaying(true);
        bgMusicRef.current?.play().catch(() => {});
      }).catch(() => {});
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('canplaythrough', onCanPlay, { once: true });

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.pause();
      audioRef.current = null;
    };
  }, [dica.audio_url]);

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

  const bibliotecaRoute = BIBLIOTECA_ROUTES[dica.biblioteca] || '/bibliotecas';
  const tags = extractTags(dica.area_livro);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Acessar imagens_conteudo (campo novo, pode não existir no tipo)
  const imagensConteudo = (dica as any).imagens_conteudo as string[] | null | undefined;

  return (
    <div className="space-y-3">
      {/* Header com capa */}
      <div className="flex gap-4 lg:gap-6">
        {dica.livro_capa && (
          <img
            src={dica.livro_capa}
            alt={dica.livro_titulo}
            className="w-24 h-36 sm:w-28 sm:h-40 lg:w-36 lg:h-52 object-cover rounded-lg shadow-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <Badge variant="outline" className="mb-2 text-[10px] border-primary/30 text-primary">
            {BIBLIOTECA_LABELS[dica.biblioteca] || dica.biblioteca}
          </Badge>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight">
            {dica.livro_titulo}
          </h2>
          {dica.livro_autor && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1">{dica.livro_autor}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag, i) => {
                const color = getTagColor(tag);
                return (
                  <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${color.bg} ${color.text} ${color.border}`}>
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Botões de avaliação */}
      <AvaliacaoButtons tipo="livro" itemData={dica.data} />

      {/* Botões lado a lado */}
      <div className="flex gap-2">
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="flex-1">
          <button
            onClick={() => navigate(`${bibliotecaRoute}/${dica.livro_id}`)}
            className="group relative w-full h-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-primary-foreground overflow-hidden shadow-md transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' }}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ver na Biblioteca</span>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </button>
        </motion.div>
        <div className="flex-1">
          <ShareDicaButton dica={dica} />
        </div>
      </div>

      {/* Carrossel de imagens geradas */}
      {imagensConteudo && imagensConteudo.filter(Boolean).length > 0 && (
        <ImagensCarousel imagens={imagensConteudo.filter(Boolean)} titulo={dica.livro_titulo} />
      )}

      {/* Por que ler? + Player de áudio */}
      {dica.porque_ler && (
        <div className="bg-[#12121a] rounded-xl border border-white/10 p-5 [&_img]:rounded-xl [&_img]:w-full [&_img]:my-4 [&_img]:shadow-lg [&_img]:aspect-[16/10] [&_img]:object-cover [&_img]:bg-white/5">
          {dica.audio_url && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-primary/20 mb-4"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--card)) 60%, hsl(var(--primary) / 0.06) 100%)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary/10">
                <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={togglePlay}
                    className="relative h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' }}
                  >
                    <AnimatePresence mode="wait">
                      {isPlaying ? (
                        <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Pause className="h-5 w-5 text-primary-foreground" />
                        </motion.div>
                      ) : (
                        <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {isPlaying && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/40"
                        animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                  </motion.button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-primary/70" />
                      <span className="text-[11px] font-medium text-primary/80 uppercase tracking-wider">Ouça a narração</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPlaying && <SoundWave isPlaying={isPlaying} />}
                      <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="flex-1" />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono">{formatTime(currentTime)}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Seção de Benefícios + Texto com imagens inline */}
          {(() => {
            const beneficiosMatch = dica.porque_ler?.match(/<!-- BENEFICIOS_START -->\n([\s\S]*?)\n<!-- BENEFICIOS_END -->/);
            const beneficios = beneficiosMatch ? beneficiosMatch[1].split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2)) : [];
            let textoSemBeneficios = (dica.porque_ler?.replace(/<!-- BENEFICIOS_START -->[\s\S]*?<!-- BENEFICIOS_END -->\n*/, '') || '');
            
            // Substituir placeholders por imagens reais
            textoSemBeneficios = substituirPlaceholdersLivro(textoSemBeneficios, imagensConteudo);
            
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
                      O que você vai ganhar com essa leitura
                    </h4>
                    <ul className="space-y-2">
                      {beneficios.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
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
      {dica.frase_dia && (
        <Card className="p-3 sm:p-4 border-primary/10 bg-primary/5">
          <div className="flex items-start gap-2">
            <Quote className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm italic text-foreground/80">{dica.frase_dia}</p>
          </div>
        </Card>
      )}

      {/* Dica de estudo */}
      {dica.dica_estudo && (
        <Card className="p-3 sm:p-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80">{dica.dica_estudo}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
