import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  List, 
  Volume2, 
  X,
  Music,
  Waves
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { ConceitoSecao } from "./types";

interface ConceitosSlidesFooterProps {
  secoes: ConceitoSecao[];
  currentIndex: number;
  totalPaginas: number;
  onNavigate: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
}

interface FlatPageInfo {
  titulo: string;
  secaoTitulo: string;
  globalIndex: number;
  tipo: string;
}

const BROWN_NOISE_URL = '/audio/fundo.mp3';
const BACKGROUND_MUSIC_URL = '/audio/fundo.mp3';
const AMBIENT_VOLUME = 0.12;

export const ConceitosSlidesFooter = ({
  secoes,
  currentIndex,
  totalPaginas,
  onNavigate,
  onNext,
  onPrevious,
  canGoBack,
  canGoForward,
  fontSize = 15,
  onFontSizeChange,
}: ConceitosSlidesFooterProps) => {
  const [showIndex, setShowIndex] = useState(false);
  const [showFontControls, setShowFontControls] = useState(false);
  const [showAudioSheet, setShowAudioSheet] = useState(false);
  const [ambientMode, setAmbientMode] = useState<'none' | 'background' | 'brownnoise'>('none');
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Flatten pages for index
  const flatPages: FlatPageInfo[] = [];
  let globalIdx = 0;
  secoes.forEach((secao) => {
    secao.slides.forEach((slide) => {
      flatPages.push({
        titulo: slide.titulo || `Página ${globalIdx + 1}`,
        secaoTitulo: secao.titulo,
        globalIndex: globalIdx,
        tipo: slide.tipo
      });
      globalIdx++;
    });
  });

  // Cleanup ambient on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop ambient audio helper
  const stopAmbient = useCallback(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.src = '';
      ambientAudioRef.current = null;
    }
  }, []);

  // Start ambient audio (background music or brown noise)
  const startAmbient = useCallback((url: string) => {
    stopAmbient();
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = AMBIENT_VOLUME;
    audio.preload = 'auto';
    ambientAudioRef.current = audio;
    audio.play().catch(() => {});
  }, [stopAmbient]);

  // Toggle ambient mode — mutual exclusivity between background and brown noise
  const setAmbient = useCallback((mode: 'none' | 'background' | 'brownnoise') => {
    setAmbientMode(mode);
    if (mode === 'none') {
      stopAmbient();
    } else if (mode === 'background') {
      startAmbient(BACKGROUND_MUSIC_URL);
    } else {
      startAmbient(BROWN_NOISE_URL);
    }
  }, [stopAmbient, startAmbient]);

  const handlePageSelect = (index: number) => {
    onNavigate(index);
    setShowIndex(false);
  };

  // Group pages by section for index display
  const groupedBySections = secoes.map((secao, secaoIdx) => {
    const startIndex = secoes.slice(0, secaoIdx).reduce((sum, s) => sum + s.slides.length, 0);
    return {
      titulo: secao.titulo,
      slides: secao.slides.map((slide, slideIdx) => ({
        titulo: slide.titulo || `Página ${startIndex + slideIdx + 1}`,
        globalIndex: startIndex + slideIdx,
        tipo: slide.tipo
      }))
    };
  });

  const hasActiveAudio = ambientMode !== 'none';

  return (
    <>
      {/* Botão flutuante de controle de fonte */}
      {onFontSizeChange && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
          <AnimatePresence>
            {showFontControls && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="flex flex-col items-center gap-1"
              >
                <button
                  onClick={() => onFontSizeChange(fontSize + 2)}
                  disabled={fontSize >= 24}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                    fontSize >= 24
                      ? 'bg-white/5 text-gray-600 border-white/10'
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30'
                  }`}
                  title="Aumentar fonte"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-[#1a1a2e] border border-white/20 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{fontSize}</span>
                </div>
                
                <button
                  onClick={() => onFontSizeChange(fontSize - 2)}
                  disabled={fontSize <= 12}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                    fontSize <= 12
                      ? 'bg-white/5 text-gray-600 border-white/10'
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30'
                  }`}
                  title="Diminuir fonte"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowFontControls(!showFontControls)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border shadow-lg ${
              showFontControls
                ? 'bg-orange-500 text-white border-orange-500 shadow-orange-500/30'
                : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30'
            }`}
            title="Tamanho da fonte"
          >
            <span className="text-sm font-bold">A</span>
          </button>
        </div>
      )}

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-sm border-t border-white/10 safe-area-pb">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            {/* Botão Anterior */}
            <button
              onClick={onPrevious}
              disabled={!canGoBack}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                canGoBack 
                  ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30' 
                  : 'bg-white/5 text-gray-600 border border-white/10'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Botão Índice */}
            <button
              onClick={() => setShowIndex(true)}
              className="w-11 h-11 rounded-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 flex items-center justify-center transition-all"
            >
              <List className="w-5 h-5" />
            </button>

            {/* Botão Som — abre sheet com opções */}
            <button
              onClick={() => setShowAudioSheet(true)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border relative ${
                hasActiveAudio 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
              title="Opções de áudio"
            >
              <Volume2 className="w-5 h-5" />
              {hasActiveAudio && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Contador de páginas */}
            <div className="flex items-center gap-1 px-3 text-gray-400">
              <span className="text-sm font-medium">{currentIndex + 1}/{totalPaginas}</span>
            </div>

            {/* Botão Próximo */}
            <button
              onClick={onNext}
              disabled={!canGoForward}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                canGoForward 
                  ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20' 
                  : 'bg-white/5 text-gray-600 border border-white/10'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sheet de Áudio — surge de baixo para cima */}
      <AnimatePresence>
        {showAudioSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setShowAudioSheet(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121a] rounded-t-3xl border-t border-white/10"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              <div className="px-5 pb-8 pt-2 space-y-4">
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Áudio ambiente
                </h3>

                <p className="text-xs text-gray-400 leading-relaxed">
                  A narração é controlada pelo botão de play em cada slide. Aqui você pode ativar sons de fundo para concentração.
                </p>

                {/* Áudio de Fundo */}
                <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                  ambientMode === 'background' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-semibold text-white text-sm">Áudio de Fundo</span>
                      <Switch 
                        checked={ambientMode === 'background'}
                        onCheckedChange={(checked) => setAmbient(checked ? 'background' : 'none')}
                      />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Música ambiente suave que acompanha sua leitura, criando um clima agradável para o estudo.
                    </p>
                  </div>
                </div>

                {/* Ruído Marrom */}
                <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                  ambientMode === 'brownnoise' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'
                }`}>
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Waves className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-semibold text-white text-sm">Ruído Marrom</span>
                      <Switch 
                        checked={ambientMode === 'brownnoise'}
                        onCheckedChange={(checked) => setAmbient(checked ? 'brownnoise' : 'none')}
                      />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Som grave e contínuo que mascara barulhos externos, ajudando na concentração profunda.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Drawer de Índice */}
      <AnimatePresence>
        {showIndex && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setShowIndex(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#12121a] rounded-t-3xl max-h-[80vh] flex flex-col border-t border-white/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Índice
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowIndex(false)}
                  className="h-8 w-8 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {groupedBySections.map((secao, secaoIdx) => (
                  <div key={secaoIdx}>
                    <p className="text-xs text-red-400 uppercase tracking-widest font-medium mb-2">
                      {secao.titulo}
                    </p>
                    
                    <div className="space-y-1">
                      {secao.slides.map((slide) => (
                        <button
                          key={slide.globalIndex}
                          onClick={() => handlePageSelect(slide.globalIndex)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                            slide.globalIndex === currentIndex
                              ? 'bg-red-500/20 text-white border border-red-500/30'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-6">
                              {slide.globalIndex + 1}
                            </span>
                            <span className="text-sm truncate flex-1">
                              {slide.titulo}
                            </span>
                            {slide.globalIndex === currentIndex && (
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConceitosSlidesFooter;
