import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Phone, ArrowRight, Users } from 'lucide-react';
import { checkPhoneDuplicate } from '@/lib/utils/phoneValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function formatPhone(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

const FAIXAS_ETARIAS = [
  '18 a 24',
  '25 a 34',
  '35 a 44',
  '45 a 54',
  '55 ou mais',
];

const OnboardingTelefone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [confirmaMaioridade, setConfirmaMaioridade] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const advancingRef = useRef(false);

  const digits = phone.replace(/\D/g, '');
  const isValid = digits.length >= 10 && digits.length <= 11 && faixaEtaria !== '' && confirmaMaioridade;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(formatPhone(raw));
    if (phoneError) setPhoneError('');
  };

  const handleContinue = async () => {
    if (advancingRef.current || !user || !isValid) return;
    advancingRef.current = true;
    setIsLoading(true);

    try {
      const fullNumber = '55' + digits;

      const { exists, message } = await checkPhoneDuplicate(fullNumber, user.id);
      if (exists) {
        setPhoneError(message || 'Este número já está cadastrado por outro usuário');
        advancingRef.current = false;
        setIsLoading(false);
        return;
      }

      await supabase
        .from('profiles')
        .update({ 
          telefone: fullNumber, 
          faixa_etaria: faixaEtaria,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      navigate('/onboarding', { replace: true });
    } catch (err) {
      console.error('Erro ao salvar telefone:', err);
      toast.error('Erro ao salvar. Tente novamente.');
      advancingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm space-y-7">
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"
          >
            <Phone className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-foreground"
          >
            Complete seu perfil
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm"
          >
            Para personalizar sua experiência
          </motion.p>
        </div>

        {/* Phone input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            Telefone
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🇧🇷 +55</span>
            <Input
              type="tel"
              value={phone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              className="h-14 pl-20 pr-4 bg-muted/30 border-border rounded-2xl text-lg"
              disabled={isLoading}
              autoFocus
            />
            {phoneError && (
              <p className="text-destructive text-xs mt-1">{phoneError}</p>
            )}
          </div>
        </motion.div>

        {/* Age range */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Faixa etária
          </label>
          <div className="grid grid-cols-3 gap-2">
            {FAIXAS_ETARIAS.map((faixa) => (
              <button
                key={faixa}
                type="button"
                onClick={() => setFaixaEtaria(faixa)}
                disabled={isLoading}
                className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-all border ${
                  faixaEtaria === faixa
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/50'
                }`}
              >
                {faixa}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Confirmação de maioridade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setConfirmaMaioridade(!confirmaMaioridade)}
              className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                confirmaMaioridade
                  ? 'bg-primary border-primary'
                  : 'border-border bg-muted/30'
              }`}
            >
              {confirmaMaioridade && (
                <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className="text-xs text-muted-foreground leading-relaxed">
              Declaro que tenho 18 anos ou mais e estou ciente dos{' '}
              <span className="text-primary/80 font-medium">termos de uso</span> da plataforma.
            </span>
          </label>
        </motion.div>

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleContinue}
            disabled={!isValid || isLoading}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base gap-2"
          >
            Continuar
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-3">
            Essas informações são necessárias para seu acesso
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingTelefone;
