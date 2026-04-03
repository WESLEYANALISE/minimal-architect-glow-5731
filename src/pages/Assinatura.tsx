import { useState, useEffect, memo, useRef } from "react";
import { PaymentMethodModal } from "@/components/assinatura/PaymentMethodModal";
import { CheckoutCartaoModal } from "@/components/assinatura/CheckoutCartaoModal";
import PixPaymentScreen from "@/components/assinatura/PixPaymentScreen";
import { useMercadoPagoPix } from "@/hooks/use-mercadopago-pix";
import type { PlanType } from "@/hooks/use-mercadopago-pix";
import { Shield, ArrowRight, Crown, Clock, Lock, Sparkles, BookOpen, Brain, Headphones, FileText, Scale, CheckCircle, ChevronRight, Eye, Layers, Target, MessageCircle, Gavel, Map, Briefcase, Video, BarChart3, Mic, Lightbulb, Users, Compass, Award, Hammer, Baby, GraduationCap, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import AssinaturaGerenciamento from "@/components/AssinaturaGerenciamento";
import { useAssinaturaBackgroundAudio } from "@/hooks/useAssinaturaBackgroundAudio";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useSubscriptionFunnelTracking } from "@/hooks/useSubscriptionFunnelTracking";
import newLogo from '@/assets/logo-direito-premium-new.png?format=webp&quality=80';
import heroBackground from '@/assets/assinatura-bg.webp';

import PlanoCardNovo from "@/components/assinatura/PlanoCardNovo";

import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const PLANS: Record<string, { price: number; label: string; days: number; badge: string | null; featured?: boolean; installments: number }> = {
  mensal: { price: 21.90, label: 'Mensal', days: 30, badge: null, installments: 1 },
  anual: { price: 149.90, label: 'Anual', days: 365, badge: 'Mais popular', featured: true, installments: 12 },
  vitalicio: { price: 249.90, label: 'Vitalício', days: 36500, badge: 'Para sempre', installments: 12 },
};

const BENEFIT_FEATURES = [
  { icon: BookOpen, label: 'Aulas interativas' },
  { icon: Brain, label: 'Flashcards' },
  { icon: CheckCircle, label: 'Questões comentadas' },
  { icon: Sparkles, label: 'IA ilimitada' },
  { icon: Scale, label: 'Vade Mecum completo' },
  { icon: Headphones, label: 'Audioaulas' },
  { icon: FileText, label: 'Resumos e mapas' },
  { icon: Crown, label: 'Petições e modelos' },
];

// ===== SUB-COMPONENTS =====

const TrialExpiredBanner = memo(() => {
  const { trialExpired, loading } = useTrialStatus();
  if (loading || !trialExpired) return null;

  return (
    <div className="w-full py-3 px-4 text-center" style={{ background: 'linear-gradient(90deg, hsl(0 70% 18%), hsl(0 60% 24%), hsl(0 70% 18%))' }}>
      <div className="flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5 text-red-300" />
        <p className="text-red-200 font-bold text-xs tracking-wide">Seu período gratuito expirou</p>
      </div>
    </div>
  );
});

const TrialActiveBanner = memo(() => {
  const { isInTrial, trialExpired, trialDaysLeft, trialHoursLeft, loading } = useTrialStatus();
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!isInTrial) return;
    intervalRef.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isInTrial]);

  if (loading || !isInTrial || trialExpired) return null;

  const now = new Date();
  const minutes = 59 - now.getMinutes();
  const seconds = 59 - now.getSeconds();

  return (
    <div className="w-full py-2.5 px-4 text-center" style={{ background: 'linear-gradient(90deg, hsl(30 50% 10%), hsl(35 45% 14%), hsl(30 50% 10%))' }}>
      <div className="flex items-center justify-center gap-3">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-amber-300/80 text-[11px] font-semibold">
          Trial: {trialDaysLeft > 0 ? `${trialDaysLeft}d ` : ''}{String(trialHoursLeft).padStart(2,'0')}:{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}
        </span>
      </div>
    </div>
  );
});


// Full features list for the sheet
const ALL_FEATURES = [
  { icon: BookOpen, label: 'Aulas interativas completas' },
  { icon: Brain, label: 'Flashcards de todas as matérias' },
  { icon: CheckCircle, label: 'Questões comentadas por banca' },
  { icon: Sparkles, label: 'IA jurídica ilimitada (Evelyn)' },
  { icon: Scale, label: 'Vade Mecum completo e atualizado' },
  { icon: Headphones, label: 'Audioaulas de todos os temas' },
  { icon: FileText, label: 'Resumos inteligentes' },
  { icon: Map, label: 'Mapas mentais interativos' },
  { icon: Crown, label: 'Petições e modelos práticos' },
  { icon: Target, label: 'Simulados por área e banca' },
  { icon: Video, label: 'Videoaulas exclusivas' },
  { icon: Gavel, label: 'Audiências dos tribunais' },
  { icon: MessageCircle, label: 'Assistente jurídica 24h' },
  { icon: BarChart3, label: 'Justiça em números' },
  { icon: Layers, label: 'Códigos completos formatados' },
  { icon: ScrollText, label: 'Legislação atualizada' },
  { icon: Briefcase, label: 'Carreiras jurídicas' },
  { icon: GraduationCap, label: 'Preparatório OAB' },
  { icon: Mic, label: 'Podcast jurídico' },
  { icon: Lightbulb, label: 'Dicas diárias de estudo' },
  { icon: Users, label: 'Três Poderes em detalhe' },
  { icon: Compass, label: 'Bússola de carreira' },
  { icon: Award, label: 'Certificados de conclusão' },
  { icon: Hammer, label: 'Jurisprudência comentada' },
  { icon: Baby, label: 'Conteúdo para iniciantes' },
  { icon: Eye, label: 'Notícias jurídicas diárias' },
];

// ===== MAIN COMPONENT =====

const Assinatura = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  const { trackEvent } = useFacebookPixel();
  const { trackEvent: trackFunnelEvent } = useSubscriptionFunnelTracking({ enabled: !isPremium && !subscriptionLoading });
  const { isInTrial } = useTrialStatus();
  const { stopAudio } = useAssinaturaBackgroundAudio(true);

  const planSectionRef = useRef<HTMLDivElement>(null);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPixScreen, setShowPixScreen] = useState(false);
  const [showCpfInput, setShowCpfInput] = useState(false);
  const [pixCpf, setPixCpf] = useState('');

  const { pixData, loading: pixLoading, createPix, copyPixCode, reset: resetPix } = useMercadoPagoPix();

  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [cardInstallments, setCardInstallments] = useState(1);
  const [fraseIndex] = useState(() => Math.floor(Math.random() * 10));
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('mensal');

  const currentPlan = PLANS[selectedPlan] || PLANS.mensal;

  useEffect(() => {
    if (!subscriptionLoading && !isPremium) {
      trackEvent('ViewContent', { content_name: 'Assinatura Premium', content_category: 'subscription', currency: 'BRL', value: currentPlan.price });
      setTimeout(() => {
        planSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 800);
    }
  }, [subscriptionLoading, isPremium]);

  if (subscriptionLoading && !showPixScreen && !showCpfInput) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-zinc-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isPremium) return <AssinaturaGerenciamento />;

  const handleAssinar = async () => {
    if (!user) {
      toast({ title: "Faça login primeiro", description: "Você precisa estar logado para assinar.", variant: "destructive" });
      navigate('/auth');
      return;
    }
    trackFunnelEvent({ event_type: 'payment_method_select', plan_type: selectedPlan, payment_method: 'asaas', amount: currentPlan.price });
    // Todos os planos abrem direto o checkout de cartão
    setCardInstallments(selectedPlan === 'mensal' ? 1 : currentPlan.installments);
    setShowCardModal(true);
  };

  const handleSelectPix = async () => {
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

  return (
    <>
    <div className="min-h-screen text-white relative overflow-x-hidden bg-black">
      
      {/* ===== HERO IMAGE SECTION ===== */}
      <div className="relative w-full h-[250px] overflow-hidden">
        <img src={heroBackground} alt="" className="w-full h-full object-cover object-center brightness-110 saturate-[1.15]" loading="eager" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.12)_50%,transparent_70%)] bg-[length:250%_100%] animate-[shimmer_3s_ease-in-out_infinite]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-7">
          <img src={newLogo} alt="Direito Prime" className="w-11 h-11 mb-2 object-contain" 
            style={{ filter: 'drop-shadow(0 2px 12px rgba(212,168,75,0.6))' }} />
          <h1 className="text-xl font-black text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            Acesso <span className="text-amber-400">Prime</span>
          </h1>
        </div>
      </div>
      
      {/* Trial active banner only */}

      <div className="relative z-10 px-5 sm:px-6 pb-10 pt-5 max-w-md mx-auto">

        {/* ===== BENEFITS SECTION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          {(() => {
            const frases = [
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
            const frase = frases[fraseIndex % frases.length];
            return (
              <>
                <h2 className="text-lg font-black text-center text-white leading-snug mb-1.5 tracking-tight">
                  {frase.titulo}
                </h2>
                <p className="text-[13px] text-amber-400/70 text-center font-medium italic mb-5 tracking-tight">
                  {frase.sub}
                </p>
              </>
            );
          })()}

          <div className="space-y-1.5 px-1">
            {[
              { Icon: Scale, title: 'Vade Mecum completo', desc: 'Atualizado 2026', value: '2026' },
              { Icon: BookOpen, title: 'Cursos interativos', desc: 'Todas as áreas do direito', value: '+36' },
              { Icon: FileText, title: 'Resumos inteligentes', desc: 'Prontos para revisão', value: '+13 mil' },
              { Icon: Layers, title: 'Livros na biblioteca', desc: 'Acervo jurídico completo', value: '+1.200' },
              { Icon: Brain, title: 'Flashcards', desc: 'Memorização espaçada', value: '+101 mil' },
              { Icon: Target, title: 'Questões comentadas', desc: 'Por banca e concurso', value: '+136 mil' },
              { Icon: Headphones, title: 'Audioaulas completas', desc: 'Estude em qualquer lugar', value: '' },
              { Icon: Sparkles, title: 'IA jurídica ilimitada', desc: 'Sua assistente 24h', value: 'Evelyn' },
              { Icon: Map, title: 'Mapas mentais interativos', desc: 'Revisão visual', value: '+500' },
              { Icon: Video, title: 'Videoaulas exclusivas', desc: 'Conteúdo premium', value: '+80' },
              { Icon: Gavel, title: 'Audiências dos tribunais', desc: 'Prática forense', value: '' },
              
              { Icon: MessageCircle, title: 'Assistente jurídica 24h', desc: 'Tire dúvidas na hora', value: 'Evelyn' },
              { Icon: ScrollText, title: 'Legislação atualizada', desc: 'Códigos e estatutos', value: '' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
                className="flex items-center gap-3.5 rounded-2xl px-5 py-4 border relative overflow-hidden"
                style={{
                  background: 'linear-gradient(145deg, hsl(38 8% 10%), hsl(0 0% 6%))',
                  borderColor: 'hsl(38 10% 16%)',
                }}
              >
                {/* Shine sweep animation */}
                <div
                  className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.08)_50%,transparent_75%)] bg-[length:250%_100%] pointer-events-none"
                  style={{ animation: `shimmer 3s ease-in-out ${i * 0.4}s infinite` }}
                />
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{ background: 'hsl(43 70% 50% / 0.1)' }}>
                  <item.Icon className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-[13px] text-white font-semibold leading-tight">{item.title}</p>
                  <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">{item.desc}</p>
                </div>
                {item.value && (
                  <span className="text-[12px] font-bold text-amber-400 flex-shrink-0 relative z-10">{item.value}</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ===== PLAN SELECTION ===== */}
        <div ref={planSectionRef} className="mb-5">
          <h3 className="text-center text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider">Escolha seu plano</h3>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(PLANS) as [PlanType, typeof PLANS[string]][]).map(([key, plan]) => (
              <PlanoCardNovo
                key={key}
                planKey={key as PlanType}
                plan={plan}
                selected={selectedPlan === key}
                onSelect={() => setSelectedPlan(key as PlanType)}
              />
            ))}
          </div>
        </div>

        {/* Features text */}
        <p className="text-[11px] leading-[1.7] text-white/80 text-center mb-5 bg-zinc-800/40 rounded-xl p-3 border border-zinc-700/30">
          Acesso a <span className="text-amber-400 font-bold">+1.200 livros</span> na biblioteca jurídica, <span className="text-amber-400 font-bold">+136 mil questões</span> comentadas por banca, <span className="text-amber-400 font-bold">+101 mil flashcards</span>, <span className="text-amber-400 font-bold">+13 mil resumos</span> inteligentes, <span className="text-amber-400 font-bold">+36 tópicos</span> de cursos interativos, IA jurídica ilimitada, Vade Mecum completo, audioaulas, mapas mentais e <span className="text-amber-400 font-bold">mais de 137 funções</span> pra transformar seus estudos. 🔥⚖️
        </p>

        {/* CTA */}
        <button
          onClick={handleAssinar}
          className="w-full relative py-3.5 rounded-xl font-black text-sm tracking-tight overflow-hidden transition-all active:scale-[0.97] text-black shadow-[0_4px_24px_rgba(245,158,11,0.3)] mb-1"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.25)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_2.5s_ease-in-out_infinite]" />
          <span className="relative flex items-center justify-center gap-2">
            Assinar {currentPlan.label} — R$ {currentPlan.price.toFixed(2).replace('.', ',')}
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>

        {/* Guarantee + Security */}
        <div className="flex items-center justify-center gap-2 text-center mb-8">
          <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
          <span className="text-zinc-600 text-[11px] font-medium">Pagamento seguro • PIX ou Cartão • Garantia 7 dias</span>
        </div>


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
        installments={cardInstallments || currentPlan.installments}
      />
    )}

    {/* CPF Input for PIX */}
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
            <button
              onClick={() => { setShowCpfInput(false); setPixCpf(''); }}
              className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-600 font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmCpfAndGeneratePix}
              disabled={pixCpf.replace(/\D/g, '').length !== 11 || pixLoading}
              className="flex-1 h-11 rounded-xl bg-amber-500 text-black font-bold text-sm disabled:opacity-40"
            >
              {pixLoading ? 'Gerando...' : 'Gerar PIX'}
            </button>
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

    {/* All Features Sheet */}
    <AnimatePresence>
      {showAllFeatures && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 35, stiffness: 180 }}
            className="flex-1 flex flex-col mt-10 rounded-t-3xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg, hsl(0 0% 9%), hsl(0 0% 5%))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
              <div>
                <h2 className="text-lg font-black text-white">Todas as Funções</h2>
                <p className="text-xs text-zinc-500">{ALL_FEATURES.length} funcionalidades desbloqueadas</p>
              </div>
              <button
                onClick={() => setShowAllFeatures(false)}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 bg-zinc-800 active:scale-95 transition-all"
              >
                Fechar
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-1 gap-2">
                {ALL_FEATURES.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{
                        background: 'linear-gradient(135deg, hsl(43 40% 14% / 0.3), hsl(0 0% 8% / 0.5))',
                        border: '1px solid hsl(43 50% 30% / 0.1)',
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, hsl(43 70% 40% / 0.25), hsl(43 50% 25% / 0.15))' }}
                      >
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-sm font-medium text-zinc-300">{feature.label}</span>
                      
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="px-5 py-4 border-t border-zinc-800/50">
              <button
                onClick={() => { setShowAllFeatures(false); handleAssinar(); }}
                className="w-full py-3.5 rounded-xl font-black text-sm text-black relative overflow-hidden active:scale-[0.97] transition-all"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 4px 24px rgba(245,158,11,0.3)' }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.25)_50%,transparent_75%)] bg-[length:200%_100%] animate-[shimmer_2.5s_ease-in-out_infinite]" />
                <span className="relative flex items-center justify-center gap-2">
                  Desbloquear tudo agora
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default Assinatura;
