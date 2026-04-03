import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useSubscription } from '@/contexts/SubscriptionContext';
import confetti from 'canvas-confetti';

const BENEFICIOS = [
  'Acesso completo e ilimitado',
  'Professora IA Evelyn 24h',
  'Vade Mecum com +50 leis',
  '+3.000 livros na biblioteca',
  '+2.000 videoaulas completas',
  '+10.000 flashcards inteligentes',
  '+15.000 questões OAB comentadas',
  'Simulados estilo prova real',
  'Mapas mentais e resumos',
  '100% sem anúncios',
];

const TrialPromoActivatedModal: React.FC = () => {
  const { user } = useAuth();
  const { isInTrial, trialExpired, loading } = useTrialStatus();
  const { isPremium } = useSubscription();
  const [open, setOpen] = useState(false);
  
  const confettiFired = useRef(false);

  // Modal desativado — não exibir mais
  useEffect(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open && !confettiFired.current) {
      confettiFired.current = true;
      const end = Date.now() + 2000;
      const fire = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
        });
        if (Date.now() < end) requestAnimationFrame(fire);
      };
      fire();
    }
  }, [open]);

  const handleConfirm = () => {
    if (!user) return;
    localStorage.setItem(`promo_activated_seen_${user.id}`, 'true');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl relative"
            style={{
              background: 'linear-gradient(170deg, hsl(25 20% 10%) 0%, hsl(20 15% 6%) 100%)',
              border: '1.5px solid hsl(43 80% 40% / 0.5)',
              boxShadow: '0 0 60px hsl(43 80% 40% / 0.15), 0 25px 50px rgba(0,0,0,0.5)',
            }}
          >
            {/* Gold glow strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

            <div className="px-6 py-8 flex flex-col gap-5">
              {/* Crown icon */}
              <div className="flex flex-col items-center text-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, hsl(43 80% 40% / 0.4) 0%, hsl(43 80% 20% / 0.1) 100%)',
                    boxShadow: '0 0 30px hsl(43 80% 45% / 0.3)',
                  }}
                >
                  <Crown className="w-10 h-10 text-amber-400" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-black text-white leading-tight">
                    🎉 Sua promoção foi ativada!
                  </h2>
                  <p className="text-amber-400/80 text-sm mt-1.5 font-medium">
                    Oferta exclusiva para novos usuários
                  </p>
                </div>
              </div>

              {/* Plan card */}
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: 'linear-gradient(135deg, hsl(43 60% 15% / 0.5) 0%, hsl(25 30% 10% / 0.8) 100%)',
                  border: '1px solid hsl(43 70% 40% / 0.3)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-bold text-lg">Plano Vitalício</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                    Melhor oferta
                  </span>
                </div>

                {/* Pricing */}
                <div className="flex items-end gap-3">
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    className="text-4xl font-black text-amber-400"
                    style={{ textShadow: '0 0 20px hsl(43 80% 50% / 0.4)' }}
                  >
                    R$ 249,90
                  </motion.span>
                </div>
                <p className="text-xs text-amber-300/60">Pagamento único • Acesso para sempre</p>

                {/* Benefits grid */}
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {BENEFICIOS.map((b) => (
                    <div key={b} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-white/75 text-xs">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="rounded-xl px-4 py-3 bg-amber-400/10 border border-amber-400/20">
                <p className="text-amber-300/90 text-xs text-center leading-relaxed">
                  ⚠️ Essa promoção é <strong>exclusiva</strong> e válida apenas durante seu período gratuito de <strong>48 horas</strong>
                </p>
              </div>

              {/* CTA */}
              <Button
                onClick={handleConfirm}
                className="w-full h-13 font-bold text-base rounded-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, hsl(43 80% 45%), hsl(35 90% 50%))',
                  color: 'hsl(25 30% 10%)',
                  boxShadow: '0 4px 24px hsl(43 80% 40% / 0.4)',
                }}
              >
                Entendi!
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrialPromoActivatedModal;
