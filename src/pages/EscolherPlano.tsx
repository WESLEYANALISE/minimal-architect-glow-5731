import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import { Check, Crown, Star, Shield, Sparkles, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssinaturaBackgroundAudio } from '@/hooks/useAssinaturaBackgroundAudio';
import themisFaceCloseup from '@/assets/themis-face-closeup.webp';
import themisFull from '@/assets/themis-full.webp';
import { useSubscriptionFunnelTracking } from '@/hooks/useSubscriptionFunnelTracking';
import { PaymentMethodModal } from '@/components/assinatura/PaymentMethodModal';
import { CheckoutCartaoModal } from '@/components/assinatura/CheckoutCartaoModal';
import PixPaymentScreen from '@/components/assinatura/PixPaymentScreen';
import { useMercadoPagoPix } from '@/hooks/use-mercadopago-pix';
import type { PlanType } from '@/hooks/use-mercadopago-pix';
import PlanoCardNovo from '@/components/assinatura/PlanoCardNovo';

const PLANS: Record<string, { price: number; label: string; days: number; badge: string | null; featured?: boolean; installments: number }> = {
  mensal: { price: 21.90, label: 'Mensal', days: 30, badge: null, installments: 1 },
  anual: { price: 149.90, label: 'Anual', days: 365, badge: 'Mais popular', featured: true, installments: 12 },
  vitalicio: { price: 249.90, label: 'Vitalício', days: 36500, badge: 'Para sempre', installments: 12 },
};


const PLAN_CHOSEN_KEY = 'plan_chosen';

const FEATURES = [
  "Vade Mecum completo 2026",
  "Evelyn IA 24h no WhatsApp",
  "+60.000 flashcards ilimitados",
  "+48.000 questões comentadas",
  "+4.000 resumos jurídicos",
  "+1.200 livros jurídicos",
  "+1.000 videoaulas",
  "Audioaulas jurídicas",
  "Notícias jurídicas",
  "JuriFlix — Documentários",
  "Análise política completa",
  "Petições e contratos",
  "Aulas dinâmicas interativas",
  "Suporte prioritário WhatsApp",
];

export const markPlanChosen = (userId: string) => {
  localStorage.setItem(`${PLAN_CHOSEN_KEY}_${userId}`, 'true');
};

export const hasPlanChosen = (userId: string): boolean => {
  return localStorage.getItem(`${PLAN_CHOSEN_KEY}_${userId}`) === 'true';
};

const EscolherPlano: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useFacebookPixel();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('mensal');
  const [pulse, setPulse] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPixScreen, setShowPixScreen] = useState(false);
  const [showCpfInput, setShowCpfInput] = useState(false);
  const [pixCpf, setPixCpf] = useState('');
  const { trackEvent: trackFunnelEvent } = useSubscriptionFunnelTracking();

  const currentPlan = PLANS[selectedPlan] || PLANS.mensal;

  const {
    pixData,
    loading: pixLoading,
    createPix,
    copyPixCode,
    reset: resetPix,
  } = useMercadoPagoPix();

  useEffect(() => {
    trackEvent('ViewContent', { content_name: 'Escolher Plano', content_category: 'subscription' });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(interval);
  }, []);

  useAssinaturaBackgroundAudio(true);

  const handleFree = () => {
    if (user?.id) markPlanChosen(user.id);
    navigate('/', { replace: true });
  };

  const handleSelectPlan = async () => {
    if (!user) return;
    if (user.id) markPlanChosen(user.id);
    trackFunnelEvent({ event_type: 'payment_method_select', plan_type: selectedPlan, payment_method: 'asaas', amount: currentPlan.price });
    setShowPaymentMethod(true);
  };

  const handleSelectPix = async () => {
    if (!user) return;
    setShowPaymentMethod(false);
    setShowCpfInput(true);
  };

  const handleConfirmCpfAndGeneratePix = async () => {
    if (!user) return;
    const cleanCpf = pixCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return;
    setShowCpfInput(false);
    setShowPixScreen(true);
    const success = await createPix(user.id, user.email || '', selectedPlan, currentPlan.price, cleanCpf);
    if (!success) {
      setShowPixScreen(false);
    }
  };

  const handleSelectCard = () => {
    setShowPaymentMethod(false);
    setShowCardModal(true);
  };


  return (
    <>
    <div className="min-h-screen relative text-white overflow-x-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={themisFull} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(245,158,11,0.12)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-4 py-1.5 mb-3">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-amber-300 text-xs font-semibold">Acesso completo · Desbloqueie tudo</span>
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
            Como você quer<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">começar?</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-xs mx-auto">
            Escolha o plano ideal para sua jornada jurídica
          </p>
        </motion.div>

        {/* Cards */}
        <div className="flex flex-col gap-4 w-full max-w-md">

          {/* Plan Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2"
          >
            {(Object.entries(PLANS) as [PlanType, typeof PLANS[string]][]).map(([key, plan]) => (
              <PlanoCardNovo
                key={key}
                planKey={key as PlanType}
                plan={plan}
                selected={selectedPlan === key}
                onSelect={() => setSelectedPlan(key as PlanType)}
              />
            ))}
          </motion.div>

          {/* Features Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/70 backdrop-blur-sm p-4"
          >
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="text-zinc-300 text-[11px]">{f}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleSelectPlan}
              className="w-full relative py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black text-sm shadow-[0_6px_25px_rgba(245,158,11,0.4)] hover:shadow-[0_8px_35px_rgba(245,158,11,0.6)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Assinar {currentPlan.label} — R$ {currentPlan.price.toFixed(2).replace('.', ',')}
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span className="text-zinc-500 text-[10px]">Pagamento seguro · PIX ou Cartão</span>
            </div>
          </motion.div>

          {/* Card Gratuito */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-zinc-700/50 overflow-hidden bg-zinc-900/70 backdrop-blur-sm"
          >
            <div className="p-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-300 mb-0.5">Videoaulas Gratuitas</h2>
                <p className="text-zinc-500 text-xs">Acesse videoaulas gratuitamente</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFree}
                className="border-zinc-600 text-zinc-400 hover:bg-zinc-800 text-xs"
              >
                Entrar grátis
              </Button>
            </div>
          </motion.div>

        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 flex items-center gap-4 text-center"
        >
          {[
            { value: "10.000+", label: "alunos" },
            { value: "4.9★", label: "avaliação" },
            { value: "100%", label: "garantia" },
          ].map((item, i) => (
            <div key={i}>
              <p className="text-amber-400 font-bold text-sm">{item.value}</p>
              <p className="text-zinc-600 text-[10px]">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>

    {/* Payment Method Modal */}
    <PaymentMethodModal
      open={showPaymentMethod}
      onClose={() => setShowPaymentMethod(false)}
      onSelectPix={handleSelectPix}
      onSelectCard={handleSelectCard}
      planLabel={currentPlan.label}
      planType={selectedPlan}
      amount={currentPlan.price}
      installments={currentPlan.installments}
      pixLoading={pixLoading}
    />

    {/* Card Checkout Modal */}
    {user && (
      <CheckoutCartaoModal
        open={showCardModal}
        onOpenChange={setShowCardModal}
        amount={currentPlan.price}
        planType={selectedPlan}
        planLabel={currentPlan.label}
        userEmail={user.email || ''}
        userId={user.id}
        onSuccess={() => { setShowCardModal(false); navigate('/'); }}
      />
    )}

    {/* CPF Input for PIX */}
    {showCpfInput && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Informe seu CPF</h3>
          <p className="text-sm text-gray-500 mb-4">Necessário para gerar o PIX.</p>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={pixCpf}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 11);
              const formatted = cleaned.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
              setPixCpf(formatted);
            }}
            className="w-full h-12 px-4 border border-gray-300 rounded-xl text-lg text-gray-900 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-400"
          />
          <div className="flex gap-3 mt-5">
            <button onClick={() => { setShowCpfInput(false); setPixCpf(''); }} className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-600 font-medium text-sm">Cancelar</button>
            <button onClick={handleConfirmCpfAndGeneratePix} disabled={pixCpf.replace(/\D/g, '').length !== 11} className="flex-1 h-11 rounded-xl bg-amber-500 text-black font-bold text-sm disabled:opacity-40">Gerar PIX</button>
          </div>
        </div>
      </div>
    )}

    {/* PIX Screen */}
    {showPixScreen && user && (
      <PixPaymentScreen
        userId={user.id}
        planType={selectedPlan}
        qrCodeBase64={pixData?.qrCodeBase64}
        qrCode={pixData?.qrCode}
        qrCodeImageUrl={pixData?.qrCodeImageUrl}
        expiresAt={pixData?.expiresAt}
        amount={currentPlan.price}
        onCopyCode={copyPixCode}
        onCancel={() => { setShowPixScreen(false); resetPix(); }}
        isGenerating={pixLoading}
      />
    )}
    </>
  );
};

export default EscolherPlano;
