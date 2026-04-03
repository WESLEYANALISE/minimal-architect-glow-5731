import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Lock, AlertCircle, Timer, Check, User, Calendar, ShieldCheck, ArrowRight, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import { useSubscriptionFunnelTracking } from '@/hooks/useSubscriptionFunnelTracking';
import { useAuth } from '@/contexts/AuthContext';
import PremiumSuccessCard from '@/components/PremiumSuccessCard';
import PendingPaymentCard from '@/components/assinatura/PendingPaymentCard';
import { motion, AnimatePresence } from 'framer-motion';

const HIGH_RISK_COOLDOWN_SECONDS = 30;

// Card brand SVG icons
const CardBrandIcon = ({ brand }: { brand: string | null }) => {
  if (!brand) return <CreditCard className="w-5 h-5 text-gray-300" />;

  const icons: Record<string, { colors: string[]; label: string }> = {
    visa: { colors: ['#1A1F71', '#F7B600'], label: 'Visa' },
    mastercard: { colors: ['#EB001B', '#F79E1B'], label: 'Master' },
    amex: { colors: ['#006FCF', '#006FCF'], label: 'Amex' },
    elo: { colors: ['#000000', '#FFCB05'], label: 'Elo' },
    hipercard: { colors: ['#822124', '#822124'], label: 'Hiper' },
    diners: { colors: ['#004B87', '#004B87'], label: 'Diners' },
    discover: { colors: ['#FF6600', '#FF6600'], label: 'Discover' },
    jcb: { colors: ['#0E4C96', '#BC1F2E'], label: 'JCB' },
  };

  const info = icons[brand];
  if (!info) return <CreditCard className="w-5 h-5 text-gray-400" />;

  if (brand === 'mastercard') {
    return (
      <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
        <rect width="28" height="18" rx="3" fill="#F5F5F5"/>
        <circle cx="11" cy="9" r="5.5" fill="#EB001B"/>
        <circle cx="17" cy="9" r="5.5" fill="#F79E1B"/>
        <path d="M14 4.5C15.3 5.5 16.1 7.1 16.1 9C16.1 10.9 15.3 12.5 14 13.5C12.7 12.5 11.9 10.9 11.9 9C11.9 7.1 12.7 5.5 14 4.5Z" fill="#FF5F00"/>
      </svg>
    );
  }

  if (brand === 'visa') {
    return (
      <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
        <rect width="28" height="18" rx="3" fill="#F5F5F5"/>
        <text x="14" y="12" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1A1F71" fontFamily="sans-serif">VISA</text>
      </svg>
    );
  }

  // Generic brand icon
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded px-1.5 py-0.5">
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.colors[0] }} />
      <span className="text-[10px] font-bold text-gray-600">{info.label}</span>
    </div>
  );
};

// Progress Steps Component
const FormProgress = ({ filledFields, totalFields, dark }: { filledFields: number; totalFields: number; dark?: boolean }) => {
  const percentage = Math.round((filledFields / totalFields) * 100);
  const isComplete = filledFields === totalFields;
  const remaining = totalFields - filledFields;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-medium ${dark ? 'text-zinc-400' : 'text-gray-500'}`}>
          {isComplete ? (
            <motion.span 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-emerald-500 flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Tudo preenchido!
            </motion.span>
          ) : (
            <motion.span 
              key={remaining}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1"
            >
              Faltam <span className={`${dark ? 'text-zinc-200' : 'text-gray-800'} font-semibold`}>{remaining}</span> campo{remaining > 1 ? 's' : ''}
            </motion.span>
          )}
        </span>
        <motion.span 
          key={percentage}
          initial={{ scale: 1.3, color: '#f59e0b' }}
          animate={{ scale: 1, color: isComplete ? '#10b981' : dark ? '#71717a' : '#9ca3af' }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="text-xs font-bold"
        >
          {percentage}%
        </motion.span>
      </div>
      <div className={`h-2 ${dark ? 'bg-zinc-700' : 'bg-gray-100'} rounded-full overflow-hidden relative`}>
        <motion.div
          className={`h-full rounded-full relative ${isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut', type: 'spring', stiffness: 100 }}
        >
          {/* Shimmer on the progress bar */}
          {!isComplete && (
            <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.4)_50%,transparent_70%)] bg-[length:250%_100%] animate-[shimmer_2s_ease-in-out_infinite]" />
          )}
        </motion.div>
        {/* Pulse dot at the end of progress */}
        {!isComplete && percentage > 0 && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
            style={{ left: `${percentage}%`, marginLeft: '-6px' }}
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: totalFields }).map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: i < filledFields ? [1, 1.3, 1] : 1,
              backgroundColor: i < filledFields 
                ? 'rgb(16 185 129)' 
                : dark ? 'rgb(63 63 70)' : 'rgb(229 231 235)',
            }}
            transition={{ duration: 0.3, delay: i < filledFields ? 0.05 : 0 }}
            className="w-2 h-2 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
};

export interface CardFieldState {
  cardNumber: boolean;
  cardholderName: boolean;
  expirationDate: boolean;
  securityCode: boolean;
  cpf: boolean;
  cep: boolean;
  phone: boolean;
  submitted: boolean;
}

interface CheckoutCartaoProps {
  amount: number;
  planType: string;
  planLabel: string;
  userEmail: string;
  userId: string;
  defaultInstallments?: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  onCancel: () => void;
  onFieldStateChange?: (state: CardFieldState) => void;
  darkMode?: boolean;
}

export function CheckoutCartao({ 
  amount, 
  planType, 
  planLabel,
  userEmail, 
  userId,
  defaultInstallments = 1,
  onSuccess, 
  onError,
  onCancel,
  onFieldStateChange,
  darkMode = false
}: CheckoutCartaoProps) {
  const { user } = useAuth();
  const { trackEvent } = useFacebookPixel();
  const { trackEvent: trackFunnel } = useSubscriptionFunnelTracking();
  const [loading, setLoading] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [profilePhoneLoaded, setProfilePhoneLoaded] = useState(false);
  const [hasProfilePhone, setHasProfilePhone] = useState(false);

  // Refs for auto-focus
  const nameRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('telefone').eq('id', user.id).single().then(({ data }) => {
      if (data?.telefone) {
        const digits = data.telefone.replace(/\D/g, '').replace(/^55/, '');
        if (digits.length >= 10) {
          setHasProfilePhone(true);
          if (digits.length === 11) {
            setUserPhone(`(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`);
          } else if (digits.length === 10) {
            setUserPhone(`(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`);
          } else {
            setUserPhone(digits);
          }
        }
      }
      setProfilePhoneLoaded(true);
    });
  }, [user?.id]);

  const showPhoneInput = profilePhoneLoaded && !hasProfilePhone;

  // Cooldown state
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldownSeconds(HIGH_RISK_COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [fetchedAddress, setFetchedAddress] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  
  const [installments, setInstallments] = useState(planType === 'mensal' ? 1 : defaultInstallments);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [isHighRisk, setIsHighRisk] = useState(false);

  const TOTAL_FIELDS = showPhoneInput ? 7 : 6;

  // Progress tracking
  const filledFields = useMemo(() => {
    let count = 0;
    if (cardNumber.replace(/\s/g, '').length >= 13) count++;
    if (cardholderName.trim().length >= 3) count++;
    if (expirationDate.length === 5) count++;
    if (securityCode.length >= 3) count++;
    if (cpf.replace(/\D/g, '').length === 11) count++;
    if (cep.replace(/\D/g, '').length === 8) count++;
    if (showPhoneInput && phoneInput.replace(/\D/g, '').length >= 10) count++;
    return count;
  }, [cardNumber, cardholderName, expirationDate, securityCode, cpf, cep, phoneInput, showPhoneInput]);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const hasTrackedFormProgressRef = useRef(false);

  // Track card_form_progress when 3+ fields are filled (fire once)
  useEffect(() => {
    if (hasTrackedFormProgressRef.current) return;
    if (filledFields >= 3) {
      hasTrackedFormProgressRef.current = true;
      trackFunnel({
        event_type: 'card_form_progress',
        plan_type: planType,
        payment_method: 'cartao',
        amount,
        metadata: { fields_filled: filledFields, total_fields: TOTAL_FIELDS },
      });
    }
  }, [filledFields, trackFunnel, planType, amount, TOTAL_FIELDS]);

  // Report field state to parent for abandonment tracking
  useEffect(() => {
    onFieldStateChange?.({
      cardNumber: cardNumber.replace(/\s/g, '').length >= 13,
      cardholderName: cardholderName.trim().length >= 3,
      expirationDate: expirationDate.length === 5,
      securityCode: securityCode.length >= 3,
      cpf: cpf.replace(/\D/g, '').length === 11,
      cep: cep.replace(/\D/g, '').length === 8,
      phone: hasProfilePhone || phoneInput.replace(/\D/g, '').length >= 10,
      submitted: formSubmitted,
    });
  }, [cardNumber, cardholderName, expirationDate, securityCode, cpf, cep, phoneInput, hasProfilePhone, formSubmitted, onFieldStateChange]);

  const detectCardBrandVisual = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    if (/^(?:2131|1800|35)/.test(cleaned)) return 'jcb';
    if (/^3(?:0[0-5]|[68])/.test(cleaned)) return 'diners';
    if (/^(50|5[6-9]|6[0-9])/.test(cleaned)) return 'elo';
    if (/^606282/.test(cleaned)) return 'hipercard';
    return null;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpirationDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);
    setCardBrand(detectCardBrandVisual(formatted));
    // Auto-advance to name when card number is complete
    if (formatted.replace(/\s/g, '').length === 16) {
      nameRef.current?.focus();
    }
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpirationDate(value);
    setExpirationDate(formatted);
    // Auto-advance to CVV when expiry is complete
    if (formatted.length === 5) {
      cvvRef.current?.focus();
    }
  };

  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setSecurityCode(cleaned);
    // Auto-advance to CPF when CVV is complete
    if (cleaned.length >= 3) {
      cpfRef.current?.focus();
    }
  };

  const formatPhoneInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length <= 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length > 5) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    return cleaned;
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);
    if (formatted.replace(/\D/g, '').length === 11) {
      // Auto-advance to CEP
      document.getElementById('cep-input')?.focus();
    }
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCEP(value);
    setCep(formatted);
    setFetchedAddress('');
    
    const cleanedCep = formatted.replace(/\D/g, '');
    if (cleanedCep.length === 8) {
      setLoadingCep(true);
      try {
        const { data, error } = await supabase.functions.invoke('geocode-cep', {
          body: { cep: cleanedCep },
        });
        if (!error && data && !data.error) {
          const addr = data.endereco || '';
          const city = data.cidade || '';
          const state = data.estado || '';
          setFetchedAddress(`${addr} - ${city}/${state}`);
        }
      } catch {
        // Silently fail - CEP lookup is just a convenience
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) newErrors.cardNumber = 'Número do cartão inválido';
    if (!cardholderName.trim() || cardholderName.length < 3) newErrors.cardholderName = 'Nome obrigatório';
    const [month, year] = expirationDate.split('/');
    if (!month || !year || parseInt(month) > 12 || parseInt(month) < 1) newErrors.expirationDate = 'Data inválida';
    if (securityCode.length < 3) newErrors.securityCode = 'CVV inválido';
    if (!email.includes('@')) newErrors.email = 'E-mail inválido';
    const cleanedCPF = cpf.replace(/\D/g, '');
    if (cleanedCPF.length !== 11) newErrors.cpf = 'CPF inválido';
    const cleanedCEP = cep.replace(/\D/g, '');
    if (cleanedCEP.length !== 8) newErrors.cep = 'CEP inválido';
    if (showPhoneInput && phoneInput.replace(/\D/g, '').length < 10) newErrors.phone = 'Telefone inválido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormSubmitted(true);

    setPaymentError(null);
    setIsHighRisk(false);
    setLoading(true);

    try {
      const [expMonth, expYear] = expirationDate.split('/');
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');
      const cleanedCPF = cpf.replace(/\D/g, '');
      const cleanedCEP = cep.replace(/\D/g, '');

      // If user entered a phone in checkout, save to profile
      let phoneToSend: string | undefined;
      if (showPhoneInput && phoneInput) {
        const cleanedPhone = phoneInput.replace(/\D/g, '');
        phoneToSend = cleanedPhone;
        // Save phone to profile (with DDI 55)
        try {
          await supabase.from('profiles').update({ telefone: '55' + cleanedPhone }).eq('id', userId);
        } catch {}
      }

      const conversionSource = localStorage.getItem('pending_conversion_source') || undefined;
      
      // Try to get user IP for anti-fraud
      let remoteIp: string | undefined;
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        remoteIp = ipData.ip;
      } catch {}

      const { data, error } = await supabase.functions.invoke('asaas-criar-pagamento-cartao', {
        body: {
          userId,
          userEmail: email,
          planType,
          installments,
          cardNumber: cleanedCardNumber,
          cardholderName: cardholderName.toUpperCase(),
          expiryMonth: expMonth,
          expiryYear: `20${expYear}`,
          ccv: securityCode,
          cpf: cleanedCPF,
          cep: cleanedCEP,
          addressNumber: 'S/N',
          phone: phoneToSend,
          conversionSource,
          remoteIp,
          amount,
        }
      });

      trackFunnel({
        event_type: 'card_form_filled',
        plan_type: planType,
        payment_method: 'cartao',
        amount,
        metadata: { installments },
      });
      if (conversionSource) localStorage.removeItem('pending_conversion_source');

      if (error) {
        const errorMsg = data?.error || 'Erro ao processar pagamento. Tente novamente.';
        trackFunnel({
          event_type: 'card_payment_error',
          plan_type: planType,
          payment_method: 'cartao',
          amount,
          metadata: { error_type: 'transport', error_message: errorMsg, installments },
        });
        setPaymentError(errorMsg);
        setLoading(false);
        return;
      }

      if (data?.success) {
        trackFunnel({
          event_type: 'card_payment_success',
          plan_type: planType,
          payment_method: 'cartao',
          amount,
          metadata: { paymentId: data.paymentId, status: data.status, installments },
        });

        if (data.status === 'approved') {
          trackEvent('Purchase', {
            content_name: `Plano ${planLabel}`,
            currency: 'BRL',
            value: amount,
          });
          toast.success('Pagamento aprovado! Sua assinatura foi ativada.');
          setShowSuccess(true);
        } else if (data.status === 'pending') {
          toast.info('Seu pagamento está em análise. Esse processo pode levar até 48h.', { duration: 8000 });
          setShowPending(true);
        } else {
          toast.success('Pagamento processado!');
          setShowSuccess(true);
        }
      } else {
        const errorMsg = data?.error || 'Pagamento não aprovado. Tente outro cartão.';
        
        trackFunnel({
          event_type: 'card_payment_error',
          plan_type: planType,
          payment_method: 'cartao',
          amount,
          metadata: { error_message: errorMsg, installments },
        });

        setIsHighRisk(true);
        startCooldown();
        setPaymentError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('Erro no checkout:', err);
      const errorMessage = err.message || 'Erro ao processar pagamento';
      if (!paymentError) setPaymentError(errorMessage);
      toast.error(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getInstallmentOptions = () => {
    const options = [];
    const maxParcelas = Math.min(12, Math.floor(amount / 5));
    for (let i = 1; i <= maxParcelas; i++) {
      const installmentValue = amount / i;
      if (i === 1) {
        options.push({ value: 1, label: `1x de R$ ${amount.toFixed(2).replace('.', ',')} (sem juros)`, installmentAmount: amount });
      } else {
        options.push({ value: i, label: `${i}x de R$ ${installmentValue.toFixed(2).replace('.', ',')}`, installmentAmount: installmentValue });
      }
    }
    return options;
  };

  const getSelectedInstallmentInfo = () => {
    const options = getInstallmentOptions();
    return options.find(o => o.value === installments) || { value: 1, installmentAmount: amount, label: '' };
  };

  const allFieldsFilled = filledFields === TOTAL_FIELDS;
  const isButtonDisabled = loading || cooldownSeconds > 0 || !allFieldsFilled;

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (showPending) {
    return <PendingPaymentCard onClose={onCancel} />;
  }

  if (showSuccess) {
    return (
      <PremiumSuccessCard 
        isVisible={true}
        planType={planType}
        amount={amount}
        onClose={onSuccess}
      />
    );
  }

  // Dark mode style helpers
  const inputClass = darkMode
    ? 'bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400'
    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder:text-gray-500';
  const emptyPulse = darkMode 
    ? 'ring-1 ring-amber-500/30' 
    : 'ring-1 ring-amber-400/40';
  const labelClass = darkMode ? 'text-zinc-300' : 'text-gray-600';
  const panelClass = darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-50';
  const cancelClass = darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600';

  const getInputPulse = (value: string, minLen = 1) => value.replace(/[\s\D]/g, '').length < minLen ? emptyPulse : '';
  const getTextPulse = (value: string, minLen = 1) => value.trim().length < minLen ? emptyPulse : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Progress Indicator removed per UX simplification */}

      {/* Cooldown alert */}
      {isHighRisk && cooldownSeconds > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Timer className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="text-amber-700 font-medium">Aguarde antes de tentar novamente</p>
            <p className="text-amber-600 text-sm">
              O sistema de segurança bloqueou a tentativa. Aguarde{' '}
              <span className="font-bold text-amber-700">{formatCooldown(cooldownSeconds)}</span>{' '}
              ou use outro método de pagamento.
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-2 border-emerald-400 text-emerald-600 hover:bg-emerald-50" onClick={() => onCancel()}>
              💠 Pagar com PIX (aprovação instantânea)
            </Button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {paymentError && !isHighRisk && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${darkMode ? 'bg-red-950/40 border-red-500/30' : 'bg-red-50 border-red-200'} border rounded-2xl p-5 text-center space-y-3`}
        >
          <div className="flex justify-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
              <AlertCircle className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
            </div>
          </div>
          <div>
            <p className={`${darkMode ? 'text-white' : 'text-red-800'} font-bold text-base`}>Transação não aprovada</p>
            <p className={`${darkMode ? 'text-zinc-400' : 'text-red-600'} text-sm mt-1.5 leading-relaxed`}>
              Verifique se os dados do cartão estão corretos e se há saldo/limite disponível. Confira o número, validade, CVV e o CPF do titular.
            </p>
            {paymentError && (
              <p className={`${darkMode ? 'text-zinc-500' : 'text-red-400'} text-xs mt-2 italic`}>
                Detalhe: {paymentError}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <Button 
              type="button" 
              size="sm" 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl h-10"
              onClick={() => {
                setPaymentError(null);
                setIsHighRisk(false);
              }}
            >
              Tentar novamente
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className={`w-full rounded-xl h-10 ${darkMode ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10' : 'border-emerald-500/50 text-emerald-600 hover:bg-emerald-50'}`}
              onClick={() => onCancel()}
            >
              Pagar com PIX
            </Button>
          </div>
        </motion.div>
      )}

      {/* Card Number with brand detection */}
      <div>
        <label className={`text-xs font-medium ${labelClass} mb-1 flex items-center gap-1.5`}>
          <CreditCard className="w-3.5 h-3.5" />
          Número do cartão
        </label>
        <div className="relative">
          <Input 
            value={cardNumber}
            onChange={(e) => handleCardNumberChange(e.target.value)}
            placeholder="0000 0000 0000 0000"
            inputMode="numeric"
            className={`${inputClass} ${getInputPulse(cardNumber, 13)} pr-16 h-12 text-base tracking-wider font-mono focus:border-primary focus:ring-primary ${errors.cardNumber ? 'border-red-400' : ''}`}
            maxLength={19}
            disabled={loading}
            autoFocus={typeof window !== 'undefined' && window.innerWidth >= 768}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AnimatePresence mode="wait">
              <motion.div
                key={cardBrand || 'default'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <CardBrandIcon brand={cardBrand} />
              </motion.div>
            </AnimatePresence>
          </div>
          {cardNumber.replace(/\s/g, '').length >= 13 && (
            <Check className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          )}
        </div>
        {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
      </div>

      {/* Cardholder Name */}
      <div>
        <label className={`text-xs font-medium ${labelClass} mb-1 flex items-center gap-1.5`}>
          <User className="w-3.5 h-3.5" />
          Nome como está no cartão
        </label>
        <div className="relative">
          <Input 
            ref={nameRef}
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
            placeholder="NOME NO CARTÃO"
            className={`${inputClass} ${getTextPulse(cardholderName, 3)} uppercase h-12 text-base focus:border-primary ${errors.cardholderName ? 'border-red-400' : ''}`}
            disabled={loading}
          />
          {cardholderName.trim().length >= 3 && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          )}
        </div>
        {errors.cardholderName && <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>}
      </div>

      {/* Expiry + CVV in same row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`text-xs font-medium ${labelClass} mb-1 flex items-center gap-1.5`}>
            <Calendar className="w-3.5 h-3.5" />
            Validade
          </label>
          <div className="relative">
            <Input 
              ref={expiryRef}
              value={expirationDate}
              onChange={(e) => handleExpiryChange(e.target.value)}
              placeholder="MM/AA"
              inputMode="numeric"
              className={`${inputClass} ${getTextPulse(expirationDate, 5)} h-12 text-base text-center tracking-widest font-mono focus:border-primary ${errors.expirationDate ? 'border-red-400' : ''}`}
              maxLength={5}
              disabled={loading}
            />
            {expirationDate.length === 5 && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            )}
          </div>
          {errors.expirationDate && <p className="text-red-500 text-xs mt-1">{errors.expirationDate}</p>}
        </div>
        <div>
          <label className={`text-xs font-medium ${labelClass} mb-1 flex items-center gap-1.5`}>
            <Lock className="w-3.5 h-3.5" />
            CVV
          </label>
          <div className="relative">
            <Input 
              ref={cvvRef}
              type="password"
              value={securityCode}
              onChange={(e) => handleCvvChange(e.target.value)}
              placeholder="•••"
              inputMode="numeric"
              className={`${inputClass} ${getTextPulse(securityCode, 3)} h-12 text-base text-center tracking-widest focus:border-primary ${errors.securityCode ? 'border-red-400' : ''}`}
              maxLength={4}
              disabled={loading}
            />
            {securityCode.length >= 3 && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            )}
          </div>
          {errors.securityCode && <p className="text-red-500 text-xs mt-1">{errors.securityCode}</p>}
        </div>
      </div>

      {/* CPF */}
      <div>
        <label className={`text-xs font-medium ${labelClass} mb-1 flex items-center gap-1.5`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          CPF do titular
        </label>
        <div className="relative">
          <Input 
            ref={cpfRef}
            value={cpf}
            onChange={(e) => handleCpfChange(e.target.value)}
            placeholder="000.000.000-00"
            inputMode="numeric"
            className={`${inputClass} ${getInputPulse(cpf, 11)} h-12 text-base font-mono tracking-wider focus:border-primary ${errors.cpf ? 'border-red-400' : ''}`}
            maxLength={14}
            disabled={loading}
          />
          {cpf.replace(/\D/g, '').length === 11 && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          )}
        </div>
        {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
      </div>

      {/* CEP */}
      <div>
        <label className={`text-xs font-medium ${labelClass} mb-1 flex items-center gap-1.5`}>
          <MapPin className="w-3.5 h-3.5" />
          CEP do titular
        </label>
        <div className="relative">
          <Input 
            id="cep-input"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="00000-000"
            inputMode="numeric"
            className={`${inputClass} ${getInputPulse(cep, 8)} h-12 text-base font-mono tracking-wider focus:border-primary ${errors.cep ? 'border-red-400' : ''}`}
            maxLength={9}
            disabled={loading}
          />
          {loadingCep && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />
          )}
          {!loadingCep && cep.replace(/\D/g, '').length === 8 && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          )}
        </div>
        {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
      </div>

      {/* Phone input (only when no phone in profile) */}
      {showPhoneInput && (
        <div>
          <label className={`text-xs font-medium ${labelClass} mb-1 flex items-center gap-1.5`}>
            <Phone className="w-3.5 h-3.5" />
            Celular com DDD
          </label>
          <div className="relative">
            <Input 
              ref={phoneRef}
              value={phoneInput}
              onChange={(e) => setPhoneInput(formatPhoneInput(e.target.value))}
              placeholder="(11) 99999-9999"
              inputMode="numeric"
              className={`${inputClass} ${getInputPulse(phoneInput, 10)} h-12 text-base font-mono tracking-wider focus:border-primary ${errors.phone ? 'border-red-400' : ''}`}
              maxLength={15}
              disabled={loading}
            />
            {phoneInput.replace(/\D/g, '').length >= 10 && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            )}
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
      )}

      <div className={`${darkMode ? 'bg-zinc-800/50' : 'bg-gray-50'} rounded-lg px-3 py-2 space-y-1`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>E-mail</span>
          <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'} truncate ml-2`}>{email}</span>
        </div>
        {userPhone && !showPhoneInput && (
          <div className="flex items-center justify-between">
            <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>Celular</span>
            <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>{userPhone}</span>
          </div>
        )}
      </div>

      {/* Installments - hidden for monthly plan */}
      {planType !== 'mensal' && (
        <div className={`${darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-gray-100 border-gray-300'} border rounded-xl p-3`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Parcelas</span>
            <select
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className={`${darkMode ? 'bg-zinc-700 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-900'} border-2 rounded-xl font-bold text-sm px-3 py-2 focus:border-primary min-w-[180px] cursor-pointer`}
            >
              {getInstallmentOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="space-y-2 pt-1">
        {loading ? (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-600 font-semibold text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando pagamento...
            </div>
            <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-300 to-amber-400 rounded-full"
                style={{ animation: 'progressBar 3s ease-in-out infinite' }}
              />
            </div>
            <style>{`
              @keyframes progressBar {
                0% { width: 0%; }
                50% { width: 85%; }
                100% { width: 100%; }
              }
            `}</style>
          </div>
        ) : (
          <>
            {!allFieldsFilled && (
              <p className={`text-center text-xs font-medium ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                Preencha todos os campos obrigatórios para continuar
              </p>
            )}
            <Button 
              type="submit" 
              disabled={isButtonDisabled}
              className={`w-full py-5 font-semibold text-base transition-all duration-300 relative overflow-hidden ${
                allFieldsFilled 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-zinc-600 text-zinc-400 cursor-not-allowed opacity-60'
              }`}
            >
              {allFieldsFilled && (
                <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.25)_50%,transparent_70%)] bg-[length:250%_100%] animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />
              )}
              {cooldownSeconds > 0 ? (
                <>
                  <Timer className="w-4 h-4 mr-2" />
                  Aguarde {formatCooldown(cooldownSeconds)}
                </>
              ) : allFieldsFilled ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pagar
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="ml-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Preencha os dados acima
                </>
              )}
            </Button>
          </>
        )}
        
        <Button 
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className={`w-full ${cancelClass} text-sm`}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}