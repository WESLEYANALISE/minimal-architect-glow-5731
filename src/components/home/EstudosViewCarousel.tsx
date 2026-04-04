import { useState, useRef, useCallback, useLayoutEffect } from "react";
import { ChevronLeft, ChevronRight, GraduationCap, ScrollText, Scale, Volume2, Pause } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ResenhaHojeSection } from "@/components/ResenhaHojeSection";
import brasaoRepublica from "@/assets/brasao-republica.png?format=webp&quality=80";

const VIEWS = [
  { id: "estudos", label: "Estudos", desc: "FACULDADE • OAB • CONCURSOS", icon: GraduationCap, headerBg: "linear-gradient(135deg, hsl(350 50% 12%), hsl(345 45% 15%), hsl(350 50% 12%))", footerBg: "linear-gradient(135deg, hsl(350 45% 10%), hsl(345 40% 12%), hsl(350 45% 10%))" },
  { id: "leis", label: "Leis do Dia", desc: "Publicações do Diário Oficial", icon: ScrollText, headerBg: "linear-gradient(135deg, hsl(38 65% 28%), hsl(42 70% 34%), hsl(38 65% 28%))", footerBg: "linear-gradient(135deg, hsl(38 65% 18%), hsl(42 70% 22%), hsl(38 65% 18%))" },
  { id: "vademecum", label: "Vade Mecum", desc: "Legislação brasileira completa", icon: Scale, headerBg: "linear-gradient(135deg, hsl(160 55% 22%), hsl(160 65% 28%), hsl(160 55% 22%))", footerBg: "linear-gradient(135deg, hsl(160 55% 14%), hsl(160 65% 18%), hsl(160 55% 14%))" },
] as const;

type ViewId = typeof VIEWS[number]["id"];

interface EstudosViewCarouselProps {
  children: React.ReactNode;
  isDesktop?: boolean;
}

const CARD_HEIGHT = "";

export function EstudosViewCarousel({ children, isDesktop = false }: EstudosViewCarouselProps) {
  const [activeView, setActiveView] = useState<ViewId>("estudos");
  const navigate = useNavigate();
  const [isPlayingNarration, setIsPlayingNarration] = useState(false);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingScrollYRef = useRef<number | null>(null);
  const restoreScrollFrameRef = useRef<number | null>(null);

  const currentIndex = VIEWS.findIndex(v => v.id === activeView);

  const changeView = useCallback((newView: ViewId) => {
    pendingScrollYRef.current = window.scrollY;
    setActiveView(newView);
  }, []);

  useLayoutEffect(() => {
    if (pendingScrollYRef.current === null) return;
    const targetY = pendingScrollYRef.current;
    restoreScrollFrameRef.current = requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, behavior: "auto" });
      pendingScrollYRef.current = null;
      restoreScrollFrameRef.current = null;
    });
    return () => {
      if (restoreScrollFrameRef.current !== null) {
        cancelAnimationFrame(restoreScrollFrameRef.current);
        restoreScrollFrameRef.current = null;
      }
    };
  }, [activeView]);

  const goNext = useCallback(() => {
    const next = (currentIndex + 1) % VIEWS.length;
    changeView(VIEWS[next].id);
  }, [currentIndex, changeView]);

  const goPrev = useCallback(() => {
    const prev = (currentIndex - 1 + VIEWS.length) % VIEWS.length;
    changeView(VIEWS[prev].id);
  }, [currentIndex, changeView]);

  const startNarration = async () => {
    if (!narrationAudioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.onended = () => setIsPlayingNarration(false);
      audio.onerror = () => setIsPlayingNarration(false);
      narrationAudioRef.current = audio;
    }
    const audio = narrationAudioRef.current;
    setIsPlayingNarration(true);
    try {
      if (!audio.src) {
        audio.play().catch(() => {});
        audio.pause();
        audio.currentTime = 0;
        const textoNarracao = "O Vade Mecum é a coletânea completa da legislação brasileira: Constituição, Códigos, Estatutos e Leis Ordinárias, reunida em um só lugar para consulta rápida e estudo. As Leis do Dia trazem automaticamente todas as novas leis, decretos, medidas provisórias e leis complementares publicadas no Diário Oficial da União, direto do portal oficial do Governo Federal.";
        const { data, error } = await supabase.functions.invoke("gerar-audio-feedback", {
          body: { tipo: "leis-do-dia-sobre", texto: textoNarracao, voz: "Kore" },
        });
        if (error) throw error;
        const audioUrl = data?.url_audio;
        if (!audioUrl) throw new Error("Sem URL de áudio");
        audio.src = audioUrl;
        audio.load();
      } else {
        audio.currentTime = 0;
      }
      await audio.play();
    } catch (err) {
      console.error("Erro na narração TTS:", err);
      setIsPlayingNarration(false);
    }
  };

  const toggleNarration = () => {
    if (isPlayingNarration && narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
      setIsPlayingNarration(false);
    } else {
      void startNarration();
    }
  };

  const CurrentIcon = VIEWS[currentIndex].icon;

  return (
    <div className={isDesktop ? "px-0" : "px-2 sm:px-3"}>
      {/* Container unificado */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7),0_4px_12px_rgba(0,0,0,0.3)]">
        {/* Header - cor dinâmica por view */}
        <div
          className={`px-3 ${isDesktop ? 'px-5 py-4' : 'py-3'} flex items-center justify-between relative overflow-hidden transition-all duration-500`}
          style={{ background: VIEWS[currentIndex].headerBg }}
        >
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={goPrev}
            className={`${isDesktop ? 'w-12 h-12' : 'w-10 h-10 sm:w-11 sm:h-11'} flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all border border-white/10 z-10 cursor-pointer`}
          >
            <ChevronLeft className={`${isDesktop ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
          </button>
          <div className="flex flex-col items-center z-10">
            <div className="flex items-center gap-2">
              <CurrentIcon className={`${isDesktop ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'} text-amber-300`} />
              <span className={`${isDesktop ? 'text-lg' : 'text-base sm:text-lg'} font-bold text-white tracking-wide`}>{VIEWS[currentIndex].label}</span>
            </div>
            {currentIndex === 0 ? (
              <span className="text-[10px] text-white/50 mt-0.5 flex items-center gap-1.5 tracking-widest font-semibold">
                FACULDADE
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                OAB
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" style={{ animation: 'pulse 2s ease-in-out 0.5s infinite' }} />
                CURSOS
              </span>
            ) : (
              <span className="text-[10px] text-white/50 mt-0.5">{VIEWS[currentIndex].desc}</span>
            )}
          </div>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={goNext}
            className={`${isDesktop ? 'w-12 h-12' : 'w-10 h-10 sm:w-11 sm:h-11'} flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-90 transition-all border border-white/10 z-10 cursor-pointer`}
          >
            <ChevronRight className={`${isDesktop ? 'w-6 h-6' : 'w-5 h-5 sm:w-6 sm:h-6'} text-white`} />
          </button>
        </div>

        {/* Card content area - fixed height */}
        <AnimatePresence mode="wait">
          {activeView === "estudos" && (
            <motion.div
              key="estudos"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={CARD_HEIGHT}
            >
              {children}
            </motion.div>
          )}

          {activeView === "leis" && (
            <motion.div
              key="leis"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={CARD_HEIGHT}
            >
              <ResenhaHojeSection
                isDesktop={false}
                navigate={navigate}
                handleLinkHover={() => {}}
                hideHeader
              />
            </motion.div>
          )}

          {activeView === "vademecum" && (
            <motion.div
              key="vademecum"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`${CARD_HEIGHT} overflow-y-auto`}
            >
              {/* Vade Mecum info card */}
              <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950/95 p-5 h-full overflow-hidden relative flex flex-col">
                {/* Brasão + Título + Audio */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={brasaoRepublica}
                    alt="Brasão da República"
                    className="w-12 h-12 object-contain drop-shadow-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Vade Mecum</h3>
                    <p className="text-xs text-white/60">Legislação brasileira completa</p>
                  </div>
                  <button
                    onClick={toggleNarration}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 transition-colors shrink-0"
                  >
                    {isPlayingNarration ? (
                      <Pause className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-amber-400" />
                    )}
                  </button>
                </div>

                {/* Conteúdo explicativo */}
                <div className="space-y-3 text-sm text-white/70 leading-relaxed flex-1">
                  <p>
                    O <span className="text-white font-semibold">Vade Mecum</span> é a coletânea completa da
                    legislação brasileira: Constituição, Códigos, Estatutos e Leis Ordinárias, reunida em um só lugar para consulta rápida e estudo.
                  </p>
                </div>

                {/* Botão único */}
                <Button
                  size="sm"
                  onClick={() => navigate("/vade-mecum")}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-10 text-sm font-semibold gap-2 mt-4 group"
                >
                  <Scale className="w-4 h-4" />
                  Acessar Vade Mecum
                  <ChevronRight className="w-4 h-4 animate-[bounceRight_1.5s_ease-in-out_infinite]" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dots indicator - cor mais escura com reflexo */}
        <div
          className="flex justify-center gap-1.5 py-2 relative overflow-hidden transition-all duration-500"
          style={{ background: VIEWS[currentIndex].footerBg }}
        >
          {/* Shine reflection */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 70%, rgba(255,255,255,0.03) 100%)" }} />
          <div className="absolute top-0 -left-full w-full h-full pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", animation: "shineFooterCarousel 4s ease-in-out infinite" }} />
          {VIEWS.map((v, i) => (
            <button
              key={v.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => changeView(v.id)}
              className={`h-1.5 rounded-full transition-all duration-300 relative z-10 ${
                i === currentIndex
                  ? "bg-amber-400 w-6 shadow-sm shadow-amber-400/40"
                  : "bg-white/20 w-2 hover:bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
