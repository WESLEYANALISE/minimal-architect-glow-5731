import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

const COOLDOWN_KEY = 'trial_upsell_dismissed_at';
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours

const MESSAGES = [
  'Seus colegas já estão estudando agora. Não fique para trás!',
  'Cada dia sem estudar é um dia mais longe da sua aprovação.',
  'Mais de 1.000 questões, resumos e aulas te esperando.',
  'A OAB não espera. Comece a estudar hoje mesmo!',
  'Invista no seu futuro jurídico. Você merece essa conquista.',
  'Quem estuda com método, passa. Desbloqueie tudo agora.',
  'Faltam poucos passos para você alcançar a aprovação.',
  'Conhecimento ilimitado por menos de R$ 1 por dia.',
  'Não deixe o sonho da aprovação para depois.',
  'Milhares de alunos já desbloquearam. E você?',
];

const TrialExpiredModal: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { trialExpired } = useTrialStatus();
  const [dismissed, setDismissed] = useState(true);

  const message = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dismissed]
  );

  useEffect(() => {
    if (!user || isPremium || !trialExpired) {
      setDismissed(true);
      return;
    }
    const last = localStorage.getItem(COOLDOWN_KEY);
    if (last && Date.now() - Number(last) < COOLDOWN_MS) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, [user, isPremium, trialExpired]);

  const handleDismiss = () => {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleAssinar = () => {
    localStorage.setItem('pending_conversion_source', 'trial_expired_modal');
    navigate('/assinatura');
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[320px] rounded-2xl p-5 shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, hsl(25 20% 10%) 0%, hsl(20 15% 7%) 100%)',
              border: '1.5px solid hsl(43 80% 45% / 0.5)',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>

            {/* Gold glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-60" />

            <div className="flex flex-col items-center text-center gap-3 pt-1">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(43 80% 45% / 0.15)' }}
              >
                <BookOpen className="w-6 h-6 text-amber-400" />
              </div>

              {/* Persuasive message */}
              <p className="text-white/90 text-sm leading-relaxed font-medium max-w-[260px]">
                {message}
              </p>

              {/* Price */}
              <p className="text-amber-400 text-xs font-bold">
                A partir de R$ 21,90/mês
              </p>

              {/* CTA */}
              <Button
                onClick={handleAssinar}
                className="w-full h-11 font-bold text-sm rounded-xl gap-2 mt-1 transition-all active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, hsl(43 80% 45%), hsl(35 90% 50%))',
                  color: 'hsl(25 30% 10%)',
                  boxShadow: '0 4px 16px hsl(43 80% 40% / 0.35)',
                }}
              >
                <Zap className="w-4 h-4" />
                Assinar Agora
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TrialExpiredModal;
