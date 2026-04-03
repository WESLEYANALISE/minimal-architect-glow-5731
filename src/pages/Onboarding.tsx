import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  GraduationCap, Scale, Check,
  Gavel, Briefcase, ArrowRight,
} from 'lucide-react';
import { markOnboardingComplete } from '@/hooks/useOnboardingStatus';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';

const PERFIS = [
  {
    value: 'universitario',
    label: 'Sou Universitário',
    desc: 'Estudo Direito na faculdade e quero aprofundar meus conhecimentos',
    icon: GraduationCap,
  },
  {
    value: 'oab',
    label: 'Estou estudando para a OAB',
    desc: 'Estou me preparando para o Exame da Ordem',
    icon: Scale,
  },
  {
    value: 'concurseiro',
    label: 'Sou Concurseiro',
    desc: 'Estudo para concursos públicos da área jurídica',
    icon: Gavel,
  },
  {
    value: 'advogado',
    label: 'Sou Advogado',
    desc: 'Atuo na advocacia e busco ferramentas para o dia a dia',
    icon: Briefcase,
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const advancingRef = useRef(false);

  const handleConfirm = useCallback(async () => {
    if (advancingRef.current || !user || !selected) return;
    advancingRef.current = true;
    setIsLoading(true);

    try {
      const profilePromise = supabase
        .from('profiles')
        .update({ intencao: selected, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      const quizPromise = supabase.from('onboarding_quiz_respostas' as any).insert({
        user_id: user.id,
        intencao: selected,
        faixa_etaria: null,
        semestre: null,
        fase_oab: null,
        dificuldade: null,
        concurso_alvo: null,
        materia_dificil: null,
        area_atuacao: null,
        ferramentas_preferidas: null,
        confirmacao_18: true,
      });

      await Promise.all([profilePromise, quizPromise]);

      // Notificar admin em background
      supabase
        .from('profiles')
        .select('nome, email, dispositivo, device_info')
        .eq('id', user.id)
        .single()
        .then(({ data: profileData }) => {
          supabase.functions.invoke('notificar-admin-whatsapp', {
            body: {
              tipo: 'novo_cadastro_quiz',
              dados: {
                nome: profileData?.nome || user.email,
                email: user.email,
                perfil: selected,
                faixa_etaria: 'não informado',
                created_at: new Date().toISOString(),
                dispositivo: profileData?.dispositivo,
                device_info: profileData?.device_info,
              },
            },
          }).catch(() => {});
        });

      markOnboardingComplete(user.id);

      // Confetti
      const end = Date.now() + 1200;
      const colors = ['hsl(var(--primary))', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      setTimeout(() => navigate('/onboarding-paywall', { replace: true }), 1300);
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast.error('Erro ao salvar. Tente novamente.');
      advancingRef.current = false;
      setIsLoading(false);
    }
  }, [user, navigate, selected]);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold uppercase tracking-widest text-primary/70"
          >
            Personalização
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-2xl font-bold text-foreground"
          >
            Quem é você?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-sm"
          >
            Selecione para personalizar sua experiência
          </motion.p>
        </div>

        {/* Profile list */}
        <div className="space-y-3">
          {PERFIS.map((opt, i) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.value;
            return (
              <motion.button
                key={opt.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                onClick={() => !isLoading && setSelected(opt.value)}
                disabled={isLoading}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border/50 bg-card hover:border-border hover:bg-muted/30'
                } disabled:opacity-60`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    {opt.desc}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'border-primary bg-primary' : 'border-border'
                }`}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Confirm button */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base gap-2"
              >
                {isLoading ? 'Salvando...' : 'Confirmar'}
                {!isLoading && (
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
