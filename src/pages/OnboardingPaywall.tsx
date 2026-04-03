import { useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, BookOpen, Brain, Headphones, Scale, MessageCircle, FileText, Gift, Target, Video, Sparkles } from 'lucide-react';
import heroBannerThemisAdvogado from '@/assets/hero-banner-themis-advogado-v2.webp';
import formaturaHero from '@/assets/formatura-hero.webp';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';

const FEATURES = [
  { icon: BookOpen, text: 'Resumos completos (5.000+)' },
  { icon: Brain, text: 'Flashcards de revisão (10.000+)' },
  { icon: Target, text: 'Questões comentadas (80.000+)' },
  { icon: Headphones, text: 'Audioaulas (800+)' },
  { icon: Scale, text: 'Vade Mecum completo (35+ leis)' },
  { icon: MessageCircle, text: 'Professora IA com análise' },
  { icon: Video, text: 'Videoaulas em vídeo (500+)' },
  { icon: FileText, text: 'Material de apoio completo' },
];

const OnboardingPaywall = () => {
  const navigate = useNavigate();
  const advancingRef = useRef(false);
  const { trackEvent } = useFacebookPixel();

  // Track ViewContent when paywall is shown
  useEffect(() => {
    trackEvent('ViewContent', {
      content_name: 'Onboarding Paywall',
      content_category: 'Onboarding',
    });
  }, [trackEvent]);

  const handleStart = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;

    // Track Lead when user clicks CTA
    trackEvent('Lead', {
      content_name: 'Onboarding Paywall CTA',
      content_category: 'Onboarding',
    });

    navigate('/', { replace: true });
  }, [navigate, trackEvent]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-2xl flex flex-col min-h-full">
      {/* Hero image section */}
      <div className="relative w-full h-[260px] sm:h-[320px] flex-shrink-0">
        <img
          src={heroBannerThemisAdvogado}
          alt="Direito Prime"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black" />

        {/* Title overlay */}
        <div className="absolute bottom-6 left-0 right-0 text-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-primary/30"
          >
            <Crown className="w-6 h-6 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            Desbloqueie todo o
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-primary"
          >
            seu potencial no Direito
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-8 pt-6 space-y-6">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-2 justify-center"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-white/70 text-sm font-medium">Tudo que você terá acesso</span>
          <Sparkles className="w-4 h-4 text-amber-400" />
        </motion.div>

        {/* Features list - 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-x-4 gap-y-3"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-white/90 text-[12px] leading-tight">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Cancel anytime */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-white/40 text-xs flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400/60" />
          Cancele quando quiser. Sem compromisso.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          onClick={handleStart}
          className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-transform"
        >
          <Gift className="w-5 h-5" />
          Iniciar Trajetória
        </motion.button>

        {/* Graduation image */}
        <div className="rounded-2xl overflow-hidden opacity-60">
          <img src={formaturaHero} alt="Formatura" className="w-full h-24 object-cover" />
        </div>
      </div>
      </div>
    </div>
  );
};

export default OnboardingPaywall;
