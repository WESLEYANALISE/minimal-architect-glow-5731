import { useState, useEffect, useRef } from "react";
import { usePaymentSDK } from "@/hooks/usePaymentSDK";
import { PaymentMethodModal } from "@/components/assinatura/PaymentMethodModal";
import { CheckoutCartaoModal } from "@/components/assinatura/CheckoutCartaoModal";
import PixPaymentScreen from "@/components/assinatura/PixPaymentScreen";
import { useMercadoPagoPix } from "@/hooks/use-mercadopago-pix";
import type { PlanType } from "@/hooks/use-mercadopago-pix";
import {
  Shield, ArrowRight, Crown, Clock, Lock, Sparkles, BookOpen, Brain,
  Headphones, FileText, Scale, CheckCircle, Target, MessageCircle,
  Monitor, Map, Video, Layers, ScrollText, Infinity, Calendar, Check
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import AssinaturaGerenciamento from "@/components/AssinaturaGerenciamento";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useSubscriptionFunnelTracking } from "@/hooks/useSubscriptionFunnelTracking";
import newLogo from "@/assets/logo-direito-premium-new.webp";
import heroBackground from '@/assets/assinatura-bg.webp';
import { motion, AnimatePresence } from 'framer-motion';

const PLANS: Record<string, { price: number; label: string; days: number; badge: string | null; featured?: boolean; installments: number; sub: string }> = {
  mensal: { price: 21.90, label: 'Mensal', days: 30, badge: null, installments: 1, sub: 'Cobrado todo mês' },
  anual: { price: 149.90, label: 'Anual', days: 365, badge: 'Mais popular', featured: true, installments: 12, sub: 'Economia de 43%' },
  vitalicio: { price: 249.90, label: 'Vitalício', days: 36500, badge: 'Melhor custo', installments: 12, sub: 'Pague uma vez só' },
};

const BENEFITS = [
  { Icon: Scale, title: 'Vade Mecum', value: '2026' },
  { Icon: BookOpen, title: 'Cursos', value: '+36' },
  { Icon: FileText, title: 'Resumos', value: '+13 mil' },
  { Icon: Layers, title: 'Biblioteca', value: '+1.200' },
  { Icon: Brain, title: 'Flashcards', value: '+101 mil' },
  { Icon: Target, title: 'Questões', value: '+136 mil' },
  { Icon: Headphones, title: 'Audioaulas', value: '' },
  { Icon: Sparkles, title: 'IA Evelyn', value: '24h' },
  { Icon: Map, title: 'Mapas mentais', value: '+500' },
  { Icon: Video, title: 'Videoaulas', value: '+80' },
  { Icon: Monitor, title: 'Acesso Desktop', value: '' },
  { Icon: ScrollText, title: 'Legislação', value: '' },
  { Icon: MessageCircle, title: 'Assistente', value: '' },
  { Icon: CheckCircle, title: 'Simulados', value: '' },
];

const FRASES = [
  { titulo: "Enquanto você improvisa, seus concorrentes já estão estudando com método.", sub: "Tenha tudo organizado num só lugar e saia na frente." },
  { titulo: "Você não precisa de mais material. Precisa do material certo.", sub: "Resumos, questões, flashcards e cursos feitos pra quem quer passar." },
  { titulo: "Cada dia sem estudar direito é um dia mais longe da sua aprovação.", sub: "Comece agora com o plano que já aprovou milhares." },
  { titulo: "Seus colegas já estão usando. A diferença vai aparecer na prova.", sub: "Mais de 10.000 alunos já transformaram seus estudos." },
  { titulo: "Estudar por PDF solto e anotação velha não vai te aprovar.", sub: "Aqui você tem método, tecnologia e conteúdo atualizado 2026." },
  { titulo: "A faculdade não te prepara pra OAB. Mas a gente sim.", sub: "Do básico ao avançado, tudo que a faculdade deveria ter te dado." },
  { titulo: "Não existe atalho. Mas existe o caminho mais inteligente.", sub: "IA, flashcards, simulados e Vade Mecum num só app." },
  { titulo: "Você já sabe o que precisa fazer. Só falta a ferramenta certa.", sub: "Pare de perder tempo e comece a estudar com estratégia." },
  { titulo: "Quem passa em concurso não estuda mais. Estuda melhor.", sub: "Tenha acesso a tudo que os aprovados usam." },
  { titulo: "O Direito muda todo dia. Seu material de estudo também deveria.", sub: "Conteúdo sempre atualizado, do jeito que a banca cobra." },
];

// ===== PLAN CARD =====

const PLAN_THEMES: Record<string, { border: string; activeBorder: string; glow: string; gradient: string; iconColor: string; badge: string; btnBg: string; checkBg: string }> = {
  mensal: {
    border: 'hsl(210 60% 30% / 0.4)', activeBorder: 'hsl(210 80% 55%)', glow: '0 0 35px -8px rgba(59,130,246,0.35)',
    gradient: 'from-blue-300 via-blue-400 to-blue-500', iconColor: 'text-blue-400',
    badge: '', btnBg: 'linear-gradient(135deg, #3b82f6, #60a5fa)', checkBg: 'bg-blue-500 shadow-blue-500/30',
  },
  anual: {
    border: 'hsl(43 80% 45% / 0.5)', activeBorder: 'hsl(43 90% 50%)', glow: '0 0 40px -8px rgba(245,158,11,0.4)',
    gradient: 'from-amber-300 via-amber-400 to-amber-500', iconColor: 'text-amber-400',
    badge: 'bg-amber-500 text-black', btnBg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', checkBg: 'bg-amber-500 shadow-amber-500/30',
  },
  vitalicio: {
    border: 'hsl(270 50% 35% / 0.4)', activeBorder: 'hsl(270 70% 55%)', glow: '0 0 35px -8px rgba(168,85,247,0.35)',
    gradient: 'from-purple-300 via-purple-400 to-purple-500', iconColor: 'text-purple-400',
    badge: 'bg-purple-500 text-white', btnBg: 'linear-gradient(135deg, #a855f7, #c084fc)', checkBg: 'bg-purple-500 shadow-purple-500/30',
  },
};

const PlanCard = ({ planKey, plan, selected, onSelect }: {
  planKey: string;
  plan: typeof PLANS[string];
  selected: boolean;
  onSelect: () => void;
}) => {
  const isAnual = planKey === 'anual';
  const theme = PLAN_THEMES[planKey] || PLAN_THEMES.mensal;
  const IconComp = isAnual ? Crown : planKey === 'vitalicio' ? Infinity : Calendar;

  return (
    <button
      onClick={onSelect}
      className={`relative w-full rounded-2xl text-center transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98] flex flex-col items-center justify-center gap-1 ${
        isAnual && selected ? 'py-7 sm:py-8' : 'py-5 sm:py-6'
      }`}
      style={{
        background: selected
          ? `linear-gradient(160deg, hsl(0 0% 10%), hsl(0 0% 5%))`
          : 'hsl(0 0% 7%)',
        border: `1.5px solid ${selected ? theme.activeBorder : theme.border}`,
        boxShadow: selected ? theme.glow : 'none',
      }}
    >
      {/* Shimmer overlay */}
      {selected && (
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.06)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_2.5s_ease-in-out_infinite] z-10 pointer-events-none" />
      )}

      {/* Badge — single line */}
      {plan.badge && (
        <div className={`absolute -top-[1px] left-1/2 -translate-x-1/2 ${theme.badge} text-[7px] sm:text-[8px] font-bold rounded-b-lg px-2.5 sm:px-3 py-0.5 tracking-wider uppercase z-20 whitespace-nowrap`}>
          {plan.badge}
        </div>
      )}

      {/* Icon */}
      <IconComp className={`w-7 h-7 sm:w-8 sm:h-8 ${theme.iconColor} transition-all duration-300 ${selected ? 'scale-110' : 'opacity-50'}`} />

      {/* Label */}
      <h3 className={`text-xs sm:text-sm font-bold tracking-wide transition-colors ${selected ? 'text-white' : 'text-zinc-500'}`}>
        {plan.label}
      </h3>

      {/* Price */}
      <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
        <span className={`text-[9px] sm:text-[10px] self-start mt-1.5 ${selected ? 'text-zinc-400' : 'text-zinc-600'}`}>R$</span>
        <span className={`text-2xl sm:text-3xl font-black bg-gradient-to-b ${theme.gradient} bg-clip-text text-transparent transition-opacity ${selected ? 'opacity-100' : 'opacity-50'}`}>
          {plan.price.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {/* Subtitle */}
      <p className={`text-[9px] sm:text-[10px] font-medium tracking-wide transition-colors ${selected ? 'text-zinc-400' : 'text-zinc-600'}`}>
        {plan.sub}
      </p>

      {/* Selected indicator */}
      {selected && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${theme.checkBg} shadow-lg z-20`}>
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
};

// ===== MAIN COMPONENT =====

const AssinaturaNova = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPreview = location.pathname.includes('/admin/');
  const { user } = useAuth();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const { trackEvent } = useFacebookPixel();
  const { trackEvent: trackFunnelEvent } = useSubscriptionFunnelTracking({ enabled: !isPremium && !subscriptionLoading });
  const { isInTrial, trialExpired, trialDaysLeft, trialHoursLeft, loading: trialLoading } = useTrialStatus();

  const planSectionRef = useRef<HTMLDivElement>(null);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPixScreen, setShowPixScreen] = useState(false);
  const [showCpfInput, setShowCpfInput] = useState(false);
  const [pixCpf, setPixCpf] = useState('');
  const [cardInstallments, setCardInstallments] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('anual');
  const [fraseIndex] = useState(() => Math.floor(Math.random() * FRASES.length));

  usePaymentSDK();
  const { pixData, loading: pixLoading, createPix, copyPixCode, reset: resetPix } = useMercadoPagoPix();

  const currentPlan = PLANS[selectedPlan] || PLANS.anual;
  const frase = FRASES[fraseIndex];

  // Trial timer
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isInTrial) return;
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, [isInTrial]);

  useEffect(() => {
    if (!subscriptionLoading && !isPremium) {
      trackEvent('ViewContent', { content_name: 'Assinatura Premium', content_category: 'subscription', currency: 'BRL', value: currentPlan.price });
    }
  }, [subscriptionLoading, isPremium]);

  if (subscriptionLoading && !showPixScreen && !showCpfInput) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (isPremium && !isAdminPreview) return <AssinaturaGerenciamento />;

  const handleAssinar = () => {
    if (!user) {
      toast({ title: "Faça login primeiro", description: "Você precisa estar logado para assinar.", variant: "destructive" });
      navigate('/auth');
      return;
    }
    trackFunnelEvent({ event_type: 'payment_method_select', plan_type: selectedPlan, payment_method: 'asaas', amount: currentPlan.price });
    setCardInstallments(selectedPlan === 'mensal' ? 1 : currentPlan.installments);
    setShowCardModal(true);
  };

  const handleSelectPix = () => {
    if (!user) return;
    setShowPaymentMethod(false);
    setShowCpfInput(true);
  };

  const handleConfirmCpfAndGeneratePix = async () => {
    if (!user || pixLoading) return;
    const cleanCpf = pixCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      toast({ title: "CPF inválido", description: "Digite um CPF válido com 11 dígitos.", variant: "destructive" });
      return;
    }
    setShowCpfInput(false);
    setShowPixScreen(true);
    const success = await createPix(user.id, user.email || '', selectedPlan, currentPlan.price, cleanCpf);
    if (!success) setShowPixScreen(false);
  };

  const handleSelectCard = (installments?: number) => {
    if (installments) setCardInstallments(installments);
    setShowPaymentMethod(false);
    setShowCardModal(true);
  };

  const now = new Date();
  const trialMinutes = 59 - now.getMinutes();
  const trialSeconds = 59 - now.getSeconds();

  return (
    <>
      <div className="min-h-screen text-white relative overflow-x-hidden bg-black">

        {/* ===== HERO ===== */}
        <div className="relative w-full h-[280px] sm:h-[320px] overflow-hidden">
          <img
            src={heroBackground}
            alt=""
            className="w-full h-full object-cover object-center brightness-110 saturate-[1.15]"
            loading="eager"
          />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.12)_50%,transparent_70%)] bg-[length:250%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
            <img
              src={newLogo}
              alt="Direito Prime"
              className="w-14 h-14 mb-2.5 object-contain"
              style={{ filter: 'drop-shadow(0 2px 16px rgba(212,168,75,0.7))' }}
            />
            <h1 className="text-2xl font-black text-white tracking-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>
              Acesso <span className="text-amber-400">Prime</span>
            </h1>
            <p className="text-zinc-400 text-xs mt-1 font-medium">Tudo que você precisa para o Direito</p>
          </div>
        </div>


        {/* ===== CONTENT ===== */}
        <div className="relative z-10 px-5 sm:px-6 pb-10 pt-6 max-w-md mx-auto">

          {/* Frase de impacto */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
            <h2 className="text-lg font-black text-center text-white leading-snug mb-1.5 tracking-tight">
              {frase.titulo}
            </h2>
            <p className="text-[13px] text-amber-400/70 text-center font-medium italic mb-5 tracking-tight">
              {frase.sub}
            </p>
          </motion.div>

          {/* ===== BENEFITS GRID ===== */}
          <div className="grid grid-cols-2 gap-2 px-1 mb-8">
            {BENEFITS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 + i * 0.04, duration: 0.35 }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-3 border relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, hsl(38 8% 10%), hsl(0 0% 6%))',
                  borderColor: 'hsl(38 10% 16%)',
                }}
              >
                {/* Shimmer on benefits */}
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.04)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" style={{ animationDelay: `${i * 0.2}s` }} />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'hsl(43 70% 50% / 0.1)' }}>
                  <item.Icon className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white font-semibold leading-tight truncate">{item.title}</p>
                  {item.value && (
                    <p className="text-[10px] font-bold text-amber-400/80 leading-tight mt-0.5">{item.value}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ===== PLAN SELECTION ===== */}
          <div ref={planSectionRef} className="mb-5">
            <h3 className="text-center text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider">Escolha seu plano</h3>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(PLANS) as [string, typeof PLANS[string]][]).map(([key, plan]) => (
                <PlanCard
                  key={key}
                  planKey={key}
                  plan={plan}
                  selected={selectedPlan === key}
                  onSelect={() => setSelectedPlan(key as PlanType)}
                />
              ))}
            </div>
          </div>

          {/* Features summary */}
          <p className="text-[11px] leading-[1.7] text-white/80 text-center mb-5 bg-zinc-800/40 rounded-xl p-3 border border-zinc-700/30">
            Acesso a <span className="text-amber-400 font-bold">+1.200 livros</span>, <span className="text-amber-400 font-bold">+136 mil questões</span>, <span className="text-amber-400 font-bold">+101 mil flashcards</span>, <span className="text-amber-400 font-bold">+13 mil resumos</span>, IA jurídica ilimitada, Vade Mecum completo, audioaulas e <span className="text-amber-400 font-bold">mais de 137 funções</span>. 🔥⚖️
          </p>

          {/* CTA — color matches selected plan */}
          <button
            onClick={handleAssinar}
            className="w-full relative py-3.5 rounded-xl font-black text-sm tracking-tight overflow-hidden transition-all duration-300 active:scale-[0.97] text-black mb-1"
            style={{ background: PLAN_THEMES[selectedPlan]?.btnBg || PLAN_THEMES.anual.btnBg, boxShadow: PLAN_THEMES[selectedPlan]?.glow || 'none' }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.25)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_2.5s_ease-in-out_infinite]" />
            <span className="relative flex items-center justify-center gap-2">
              Assinar {currentPlan.label} — R$ {currentPlan.price.toFixed(2).replace('.', ',')}
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>

          {/* Guarantee */}
          <div className="flex items-center justify-center gap-2 text-center mb-8">
            <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
            <span className="text-zinc-600 text-[11px] font-medium">Pagamento seguro • PIX ou Cartão • Garantia 7 dias</span>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

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
          installments={cardInstallments || currentPlan.installments}
        />
      )}

      {showCpfInput && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Informe seu CPF</h3>
            <p className="text-sm text-gray-500 mb-4">O CPF é exigido para sua segurança na transação via PIX.</p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={pixCpf}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 11);
                const formatted = cleaned
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                setPixCpf(formatted);
              }}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl text-lg text-gray-900 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder:text-gray-400"
            />
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowCpfInput(false); setPixCpf(''); }} className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-600 font-medium text-sm">Cancelar</button>
              <button onClick={handleConfirmCpfAndGeneratePix} disabled={pixCpf.replace(/\D/g, '').length !== 11 || pixLoading} className="flex-1 h-11 rounded-xl bg-amber-500 text-black font-bold text-sm disabled:opacity-40">
                {pixLoading ? 'Gerando...' : 'Gerar PIX'}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default AssinaturaNova;
