import { useState, useEffect, useRef } from 'react';
import { Crown, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import AudioWaveAnimation from '@/components/AudioWaveAnimation';
import { usePremiumModalAnalytics } from '@/hooks/usePremiumModalAnalytics';
import type { Feature } from '@/hooks/usePlanAccess';

// Guard global para garantir que apenas um áudio toque por vez
let globalAudioPlaying = false;

// Cache global do áudio fixo "Ops, essa é uma função premium"
let premiumAudioCache: string | null = null;
let premiumAudioLoading = false;

// Preload audio eagerly on module load for instant playback
const preloadPremiumAudio = () => {
  if (premiumAudioCache || premiumAudioLoading) return;
  premiumAudioLoading = true;
  supabase.functions.invoke('gerar-frase-assinatura', {
    body: { frase: 'Ops, essa é uma função premium!' }
  }).then(({ data, error }) => {
    premiumAudioLoading = false;
    if (!error && data?.audioBase64) {
      premiumAudioCache = data.audioBase64;
    }
  }).catch(() => { premiumAudioLoading = false; });
};

// Preload on module import
preloadPremiumAudio();

const PLAN_LABELS: Record<string, string> = {
  essencial: 'Essencial',
  pro: 'Pro',
  vitalicio: 'Vitalício',
};

// Mapear features para o plano mínimo que desbloqueia
const FEATURE_MIN_PLAN: Record<Feature, string> = {
  'resumos': 'essencial',
  'resumos-complementares': 'pro',
  'flashcards': 'essencial',
  'flashcards-complementares': 'pro',
  'questoes': 'essencial',
  'questoes-complementares': 'pro',
  'biblioteca-classicos': 'essencial',
  'biblioteca-completa': 'pro',
  'aulas': 'essencial',
  'professora': 'pro',
  'audioaulas': 'essencial',
  'evelyn': 'pro',
  'vademecum-completo': 'essencial',
  'peticoes': 'pro',
  'codigos-completos': 'essencial',
};

interface PremiumFloatingCardProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  sourceFeature?: string;
  feature?: Feature;
}

export const PremiumFloatingCard = ({
  isOpen,
  onClose,
  title = "Conteúdo Premium",
  description,
  sourceFeature,
  feature
}: PremiumFloatingCardProps) => {
  const navigate = useNavigate();
  const { trackModalOpen } = usePremiumModalAnalytics();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const hasPlayedRef = useRef(false);

  // Derivar plano necessário e descrição dinâmica
  const requiredPlan = feature ? FEATURE_MIN_PLAN[feature] : 'essencial';
  const planLabel = PLAN_LABELS[requiredPlan] || 'Premium';
  const dynamicDescription = description || `Disponível a partir do plano ${planLabel}. Assine e desbloqueie este recurso.`;

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
    globalAudioPlaying = false;
  };

  const playAudio = (audioBase64: string) => {
    if (globalAudioPlaying) return;
    globalAudioPlaying = true;
    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
    audio.volume = 0.8;
    audioRef.current = audio;
    setIsPlayingAudio(true);
    audio.onended = () => { setIsPlayingAudio(false); globalAudioPlaying = false; };
    audio.onerror = () => { setIsPlayingAudio(false); globalAudioPlaying = false; };
    audio.play().catch(() => { setIsPlayingAudio(false); globalAudioPlaying = false; });
  };

  useEffect(() => {
    if (isOpen && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      trackModalOpen('floating_card', sourceFeature || title);

      // Play immediately from cache, or fetch then play
      if (premiumAudioCache) {
        playAudio(premiumAudioCache);
      } else if (!premiumAudioLoading) {
        premiumAudioLoading = true;
        supabase.functions.invoke('gerar-frase-assinatura', {
          body: { frase: 'Ops, essa é uma função premium!' }
        }).then(({ data, error }) => {
          premiumAudioLoading = false;
          if (!error && data?.audioBase64) {
            premiumAudioCache = data.audioBase64;
            playAudio(data.audioBase64);
          }
        }).catch(() => { premiumAudioLoading = false; });
      }
    } else if (!isOpen) {
      stopAudio();
      hasPlayedRef.current = false;
    }
  }, [isOpen]);

  const handleVerPlanos = () => {
    stopAudio();
    onClose();
    setTimeout(() => navigate('/assinatura'), 50);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{ background: 'rgba(10, 6, 2, 0.92)' }}
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", damping: 20, stiffness: 260 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-5 pointer-events-none"
          >
            <div className="relative w-full max-w-[360px] overflow-hidden rounded-3xl pointer-events-auto"
              style={{
                background: 'linear-gradient(170deg, hsl(25 20% 12%) 0%, hsl(20 15% 6%) 100%)',
                border: '1.5px solid hsl(43 80% 40% / 0.45)',
                boxShadow: '0 0 80px hsl(43 80% 40% / 0.15), 0 30px 60px rgba(0,0,0,0.6)',
              }}
            >
              {/* Top gold glow strip */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

              {/* Shine sweep animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1] rounded-3xl">
                <div
                  className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent skew-x-[-20deg]"
                  style={{ animation: 'shinePratique 3.5s ease-in-out infinite 0.5s' }}
                />
              </div>

              {/* Ambient glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-60 h-60 bg-amber-500/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-40 h-40 bg-orange-600/15 rounded-full blur-[60px]" />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>

              <div className="relative p-7 pt-10 text-center z-[2]">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", damping: 12 }}
                  className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-xl mb-5"
                  style={{ boxShadow: '0 0 40px hsl(43 80% 45% / 0.5), 0 8px 32px rgba(0,0,0,0.4)' }}
                >
                  <Crown className="w-9 h-9 text-white" />
                </motion.div>

                {isPlayingAudio && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 mb-3 text-amber-400"
                  >
                    <AudioWaveAnimation />
                    <span className="text-xs text-amber-400/70">Reproduzindo...</span>
                  </motion.div>
                )}

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-[22px] sm:text-2xl font-bold text-white mb-2"
                >
                  {title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-amber-100/50 mb-3 leading-relaxed"
                >
                  {dynamicDescription}
                </motion.p>

                {/* Badge do plano necessário */}
                {feature && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.22 }}
                    className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full px-4 py-1.5 mb-4"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-300">
                      Disponível no plano {planLabel}
                    </span>
                  </motion.div>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-amber-400/80 italic text-sm mb-6"
                >
                  "Invista no seu futuro jurídico. O conhecimento é o melhor investimento."
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={handleVerPlanos}
                    className="w-full h-13 text-base font-bold rounded-2xl relative overflow-hidden border border-amber-400/30"
                    style={{
                      background: 'linear-gradient(135deg, hsl(43 80% 45%), hsl(25 90% 50%))',
                      color: 'white',
                      boxShadow: '0 4px 28px hsl(43 80% 40% / 0.4)',
                    }}
                  >
                    {/* Button shine */}
                    <div
                      className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] pointer-events-none"
                      style={{ animation: 'shinePratique 3s ease-in-out infinite 2s' }}
                    />
                    <Sparkles className="w-5 h-5 mr-2 relative z-[1]" />
                    <span className="relative z-[1]">Ver Planos</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PremiumFloatingCard;
