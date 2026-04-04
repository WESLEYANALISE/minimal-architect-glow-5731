import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState, useRef } from 'react';
import { usePaymentSDK } from '@/hooks/usePaymentSDK';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, ChevronLeft, GraduationCap, Scale, FileText, BookOpen, Sparkles, Play, ImageIcon, Crown, Shield, Check } from 'lucide-react';
import { DemoVideoModal } from '@/components/welcome/DemoVideoModal';
import themisFull from '@/assets/themis-full.webp';
import { useAuth } from '@/contexts/AuthContext';
import { useMercadoPagoPix } from '@/hooks/use-mercadopago-pix';
import { PaymentMethodModal } from '@/components/assinatura/PaymentMethodModal';
import { CheckoutCartaoModal } from '@/components/assinatura/CheckoutCartaoModal';
import PixPaymentScreen from '@/components/assinatura/PixPaymentScreen';
import newLogo from '@/assets/logo-direito-premium-new.png?format=webp&quality=80';
import appMockup1 from '@/assets/app-mockup-screenshot.png?format=webp&quality=75';
import appMockup2 from '@/assets/app-mockup-2.png?format=webp&quality=75';
import appMockup3 from '@/assets/app-mockup-3.png?format=webp&quality=75';
import lourosDourados from '@/assets/louros-dourados.png?format=webp&quality=75';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { TestimonialsSection } from '@/components/ui/testimonials-columns';
import { BadgeCarousel } from '@/components/home/BadgeCarousel';
import { AppShowcaseSection } from '@/components/welcome/AppShowcaseSection';
import { FeatureCardsCarousel } from '@/components/welcome/FeatureCardsCarousel';
import { WelcomeAuthModal } from '@/components/welcome/WelcomeAuthModal';

const features = [
  { icon: GraduationCap, label: 'Aprovação na Faculdade', desc: 'Resumos, aulas e simulados para você tirar nota alta e nunca mais pegar DP.' },
  { icon: Scale, label: 'OAB 1ª Fase', desc: 'Questões comentadas, vade mecum atualizado e treino focado em aprovação.' },
  { icon: FileText, label: 'OAB 2ª Fase', desc: 'Peças práticas, recursos e tudo que você precisa para cruzar a linha de chegada.' },
  { icon: Sparkles, label: 'Flashcards e Mapas Mentais', desc: 'Memorize o que importa com método ativo — sem decoreba, com fixação real.' },
  { icon: BookOpen, label: 'Biblioteca Jurídica Completa', desc: 'Códigos, leis, súmulas e doutrina em um só lugar, sempre atualizado.' },
];

const BENEFITS = [
  'Vade Mecum completo e atualizado',
  'Biblioteca com +1.200 obras jurídicas',
  'Flashcards inteligentes',
  'Professora IA 24h (Evelyn)',
  'Simulados OAB e concursos',
  'Audioaulas e videoaulas',
  'Mapas mentais interativos',
  'Atualizações vitalícias',
];

const VITALICIO_PRICE = 249.90;
const VITALICIO_INSTALLMENTS = 12;
const VITALICIO_INSTALLMENT = 20.83;
const PLAN_TYPE = 'vitalicio';

const WelcomeVitalicio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [mockupIndex, setMockupIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  const [showDemoVideo, setShowDemoVideo] = useState(false);
  // Inline checkout states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showPixScreen, setShowPixScreen] = useState(false);
  const [showCpfInput, setShowCpfInput] = useState(false);
  const [pixCpf, setPixCpf] = useState('');
  const { pixData, loading: pixLoading, createPix, copyPixCode, reset: resetPix } = useMercadoPagoPix();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { trackEvent } = useFacebookPixel();

  // Facebook Pixel: ViewContent on mount
  useEffect(() => {
    trackEvent('ViewContent', {
      content_name: 'Welcome Vitalício',
      content_category: 'plano_vitalicio',
      content_type: 'product',
      currency: 'BRL',
      value: VITALICIO_PRICE,
    });
  }, [trackEvent]);

  // Background audio
  useEffect(() => {
    const audio = (window as any).__welcomeBgAudio || new Audio('/audio/welcome-background.mp3');
    (window as any).__welcomeBgAudio = audio;
    audio.loop = true;
    audio.volume = 0.15;
    bgAudioRef.current = audio;
    const tryPlay = () => { if (audio.paused) audio.play().catch(() => {}); };
    tryPlay();
    const onInteract = () => tryPlay();
    document.addEventListener('click', onInteract, { once: true });
    document.addEventListener('touchstart', onInteract, { once: true });
    document.addEventListener('scroll', onInteract, { once: true, passive: true });
    const MAX_VOLUME = 0.15;
    const handleScroll = () => {
      if (!bgAudioRef.current) return;
      const vol = Math.max(0, MAX_VOLUME * (1 - window.scrollY / (window.innerHeight * 1.5)));
      bgAudioRef.current.volume = vol;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      audio.pause(); audio.currentTime = 0; bgAudioRef.current = null;
      document.removeEventListener('click', onInteract);
      document.removeEventListener('touchstart', onInteract);
      document.removeEventListener('scroll', onInteract);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    [appMockup1, appMockup2, appMockup3].forEach((src) => { const img = new Image(); img.src = src; });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = themisFull;
    img.onload = () => setImgLoaded(true);
    if (img.complete) setImgLoaded(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setMockupIndex(prev => (prev + 1) % 3), 3000);
    return () => clearInterval(timer);
  }, []);

  const [slidingOut, setSlidingOut] = useState(false);

  const handleLogin = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  const smoothScrollTo = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;
    const element = ref.current;
    const start = window.scrollY;
    const target = element.getBoundingClientRect().top + window.scrollY - 40;
    const distance = target - start;
    const duration = 1200;
    let startTime: number | null = null;
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, start + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  const scrollToPricing = useCallback(() => smoothScrollTo(pricingRef), [smoothScrollTo]);
  const scrollToDemo = useCallback(() => smoothScrollTo(demoRef), [smoothScrollTo]);

  const handleCTAFinal = useCallback(() => {
    trackEvent('AddToCart', {
      content_name: 'Plano Vitalício',
      content_type: 'product',
      currency: 'BRL',
      value: VITALICIO_PRICE,
    });
    setShowPaymentModal(true);
  }, [trackEvent]);

  const handleSelectPix = useCallback(async () => {
    if (!user) { setShowAuthModal(true); return; }
    trackEvent('InitiateCheckout', {
      content_name: 'Plano Vitalício',
      payment_method: 'pix',
      currency: 'BRL',
      value: VITALICIO_PRICE,
    });
    setShowPaymentModal(false);
    setShowCpfInput(true);
  }, [user, trackEvent]);

  const handleConfirmCpfAndGeneratePix = useCallback(async () => {
    if (!user) return;
    const cleanCpf = pixCpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return;
    setShowCpfInput(false);
    setShowPixScreen(true);
    const success = await createPix(user.id, user.email || '', PLAN_TYPE, undefined, cleanCpf);
    if (!success) {
      setShowPixScreen(false);
    }
  }, [user, createPix, pixCpf]);

  const handleSelectCard = useCallback(() => {
    trackEvent('InitiateCheckout', {
      content_name: 'Plano Vitalício',
      payment_method: 'cartao',
      currency: 'BRL',
      value: VITALICIO_PRICE,
    });
    setShowPaymentModal(false);
    setShowCardModal(true);
  }, [trackEvent]);

  const handlePaymentSuccess = useCallback(() => {
    setShowCardModal(false);
    resetPix();
  }, [resetPix]);

  return (
    <div
      className="min-h-[100dvh] w-full bg-black overflow-x-hidden relative"
      style={slidingOut ? { animation: 'slideOutLeft 0.6s cubic-bezier(0.76, 0, 0.24, 1) forwards' } : undefined}
    >
      {/* ───── HERO SECTION ───── */}
      <motion.div className="relative min-h-[100dvh] flex flex-col">
        <div className="absolute inset-x-0 bottom-0" style={{ top: '88px' }}>
          <video
            ref={videoRef}
            src="/videos/themis-background.mp4"
            muted loop playsInline preload="auto"
            onCanPlayThrough={() => { setVideoReady(true); videoRef.current?.play().catch(() => {}); }}
            className="absolute inset-0 w-full h-full object-cover object-top lg:object-center"
          />
          <img
            src={themisFull} alt="" fetchPriority="high"
            className={`absolute inset-0 w-full h-full object-cover object-top lg:object-center transition-opacity duration-1000 ease-in-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ opacity: videoReady ? 0 : (imgLoaded ? 1 : 0) }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black lg:from-black/70 lg:via-black/50 lg:to-black" />
        </div>

        {/* Navbar */}
        <nav className="relative z-20 px-4 lg:px-8 pt-6 pb-4">
          <div className="relative flex items-center justify-between bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5">
              <div className="relative -mt-6">
                <img src={newLogo} alt="Direito Premium" className="h-14 w-14 object-contain drop-shadow-xl" />
              </div>
              <div className="flex flex-col leading-tight justify-center">
                <span className="text-white font-black text-lg" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '-0.02em' }}>Direito Prime</span>
                <span className="text-white/50 text-xs font-medium" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '0.04em' }}>Estudos Jurídicos</span>
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-white hover:bg-white/90 transition-all shadow-lg"
            >
              Entrar
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between px-6 lg:px-12 xl:px-20 pb-6 pt-16 sm:pt-20 max-w-[1400px] mx-auto w-full lg:py-16">
          <motion.div
            className="lg:flex-1 lg:max-w-2xl"
            initial="hidden" animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } } }}
          >
            <div className="mb-6 text-center lg:text-left" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '-0.02em' }}>
              <div className="headline-shine">
                <motion.h1
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                  className="text-[clamp(1.7rem,5vw,2.8rem)] font-black text-white leading-[1.15] mb-3"
                >
                  <span className="headline-shine inline" style={{ color: '#fde68a' }}>Você</span> está pronto para dominar os{' '}
                  <span className="headline-shine inline" style={{ color: '#fde68a' }}>estudos jurídicos</span><span style={{ color: '#fde68a' }}>?</span>
                </motion.h1>
              </div>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="text-white text-center lg:text-left text-[clamp(1rem,3.2vw,1.25rem)] leading-relaxed mb-2"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '0.01em' }}
              >
                Aulas, resumos, flashcards, questões, audioaulas, vade mecum e muito mais, tudo em um só lugar para você{' '}
                <span className="font-bold" style={{ color: '#fde68a' }}>dominar o Direito</span>.
              </motion.p>

              {/* CTA — Quero ser Prime */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                className="flex flex-col items-center lg:items-start mt-5 mb-6"
              >
                <button
                  onClick={scrollToPricing}
                  className="group relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-base font-bold text-white transition-all active:scale-[0.97] overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #d4a84b 0%, #92650a 60%, #6b4a0a 100%)',
                    boxShadow: '0 0 20px rgba(212,168,75,0.5), 0 0 60px rgba(212,168,75,0.2), 0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%)',
                      animation: 'shimmerSlide 3s ease-in-out infinite',
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    <Crown className="w-4.5 h-4.5" />
                    Quero ser Prime
                    <motion.span
                      animate={{ x: [0, 6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="inline-flex"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </span>
                </button>
                <p className="text-white text-xs mt-2.5 tracking-wide font-medium">
                  ⭐ +10.000 alunos já estudam com a gente
                </p>
                <button
                  onClick={() => {
                    if (bgAudioRef.current) bgAudioRef.current.pause();
                    setShowDemoVideo(true);
                  }}
                  className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white/80 hover:text-white border border-white/20 hover:border-white/40 transition-all bg-white/5 hover:bg-white/10 active:scale-[0.97]"
                >
                  <Play className="w-4 h-4" />
                  Ver demonstração
                </button>
              </motion.div>

              {/* Carrossel de cards de funcionalidades */}
              <FeatureCardsCarousel />

              {/* Louros + V-shape */}
              <motion.div
                variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
                className="relative w-full max-w-[280px] md:max-w-[400px] lg:max-w-[280px] mx-auto lg:mx-0 my-2"
              >
                <img src={lourosDourados} alt="" className="w-full h-auto object-contain pointer-events-none select-none" loading="eager" fetchPriority="high" decoding="async" style={{ filter: 'drop-shadow(0 0 12px rgba(212,168,75,0.3))' }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="flex justify-between w-full -mt-2 px-1">
                    {['Faculdade', 'Concursos'].map((word, i) => (
                      <motion.span key={word} initial={{ opacity: 0, y: -20, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.8 + i * 0.3, duration: 0.6, type: 'spring', stiffness: 120 }}
                        className="text-[clamp(1rem,3.2vw,1.5rem)] font-black text-white uppercase whitespace-nowrap"
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif", animation: `neonPulseText 3s ease-in-out ${i * 1}s infinite`, textShadow: '0 0 20px rgba(212,168,75,0.5), 0 2px 8px rgba(0,0,0,0.6)' }}
                      >{word}</motion.span>
                    ))}
                  </div>
                  <motion.svg initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 1.4, duration: 0.8, ease: 'easeOut' }} viewBox="0 0 400 36" className="w-[80%] h-8" preserveAspectRatio="none">
                    <line x1="50" y1="0" x2="200" y2="32" stroke="url(#goldLineV)" strokeWidth="3.5" style={{ animation: 'lineGlow 3s ease-in-out 0.5s infinite' }} />
                    <line x1="350" y1="0" x2="200" y2="32" stroke="url(#goldLineV)" strokeWidth="3.5" style={{ animation: 'lineGlow 3s ease-in-out 1.5s infinite' }} />
                    <defs>
                      <linearGradient id="goldLineV" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#d4a84b" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                  <motion.span initial={{ opacity: 0, scale: 0.5, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.7, type: 'spring', stiffness: 100, damping: 10 }}
                    className="text-[clamp(1.8rem,7vw,2.6rem)] font-black text-white uppercase"
                    style={{ fontFamily: "'Georgia', 'Times New Roman', serif", animation: 'neonPulseText 3s ease-in-out 2s infinite', textShadow: '0 0 25px rgba(212,168,75,0.6), 0 0 50px rgba(212,168,75,0.2), 0 2px 8px rgba(0,0,0,0.6)' }}
                  >OAB</motion.span>
                </div>
              </motion.div>
            </div>

            <BadgeCarousel />

            <motion.p
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="relative text-center lg:text-left text-[clamp(1.1rem,3.5vw,1.4rem)] font-semibold tracking-wide mb-4 overflow-hidden"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: 'rgba(255,255,255,0.9)', textShadow: '0 0 12px rgba(255,255,255,0.3), 0 0 30px rgba(255,255,255,0.1)' }}
            >
              <span className="relative z-10">Alcance a excelência nos estudos jurídicos.</span>
              <span className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 70%)', animation: 'shimmerSlide 3s ease-in-out infinite' }} />
            </motion.p>
          </motion.div>

          {/* Mockup — desktop */}
          <motion.div className="hidden lg:block w-[300px] xl:w-[360px] flex-shrink-0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}>
            <div className="relative">
              {[appMockup1, appMockup2, appMockup3].map((src, i) => (
                <motion.img key={src} src={src} alt="Direito Premium App" className="w-full h-auto rounded-2xl shadow-2xl"
                  style={{ position: i === 0 ? 'relative' : 'absolute', top: 0, left: 0 }}
                  animate={{ opacity: i === mockupIndex ? 1 : 0, scale: i === mockupIndex ? 1 : 1.03 }}
                  transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Marquee */}
        <div className="relative z-10 bg-black/60 py-3">
          <p className="text-center text-[9px] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 0 12px rgba(255,255,255,0.5)' }}>
            Domine as matérias da faculdade de Direito
          </p>
          <div style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)' }}>
            <InfiniteSlider gap={32} duration={28}>
              {['USP', 'UNICAMP', 'UFRJ', 'UFMG', 'UFRGS', 'UnB', 'UFSC', 'UFPR', 'PUC-RS', 'FGV Direito', 'Mackenzie', 'PUC-SP', 'UERJ', 'UFC', 'UFPE'].map((uni, i) => (
                <span key={i} className="flex items-center gap-2 text-white/60 text-sm font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 inline-block" />
                  {uni}
                </span>
              ))}
            </InfiniteSlider>
          </div>
        </div>
      </motion.div>

      {/* ── CARD PERSUASIVO ── */}
      <div className="bg-black px-6 lg:px-12 pt-10 pb-2">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl px-6 py-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(212,168,75,0.12) 0%, rgba(0,0,0,0.85) 100%)', border: '1px solid rgba(212,168,75,0.22)' }}>
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: 'linear-gradient(to bottom, transparent, #d4a84b, #fbbf24, #d4a84b, transparent)', boxShadow: '0 0 10px 4px rgba(212,168,75,0.8), 0 0 22px 8px rgba(212,168,75,0.35)' }} />
            <p className="text-white font-black text-[17px] leading-snug mb-2" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>O que é Direito Prime?</p>
            <p className="text-white/60 text-[13px] leading-relaxed">
              O Direito Prime nasce para guiar você do primeiro contato com o Direito até o nível avançado. Quando há direção, há progresso. Aqui o{' '}
              <span className="font-bold" style={{ color: '#d4a84b' }}>conteúdo certo encontra sua dedicação</span>{' '}
              e transforma estudo em conquista.
            </p>
          </div>
        </div>
      </div>

      {/* ───── APP SHOWCASE ───── */}
      <div ref={demoRef}>
        <AppShowcaseSection />
      </div>

      {/* ───── TESTIMONIALS ───── */}
      <TestimonialsSection />

      {/* ═══════ SEÇÃO DE PREÇOS — VITALÍCIO ═══════ */}
      <div ref={pricingRef} id="pricing" className="bg-black px-4 lg:px-12 pt-16 pb-20">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Section title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 mb-4">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Acesso Vitalício</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                Invista uma vez, estude para sempre
              </h2>
              <p className="text-white/50 text-sm">Pagamento único • Sem mensalidades • Sem surpresas</p>
            </div>

            {/* Pricing card */}
            <div
              className="relative rounded-3xl p-6 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(30,25,10,0.95) 0%, rgba(15,12,5,0.98) 100%)',
                border: '2px solid rgba(212,168,75,0.4)',
                boxShadow: '0 0 40px rgba(212,168,75,0.15), 0 0 80px rgba(212,168,75,0.05)',
              }}
            >
              {/* Glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[2px]" style={{ background: 'linear-gradient(to right, transparent, #d4a84b, #fbbf24, #d4a84b, transparent)' }} />

              {/* Badge pagamento único */}
              <div className="flex justify-center mb-5">
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{ background: 'linear-gradient(135deg, #d4a84b 0%, #92650a 100%)', color: '#fff' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Pagamento único
                </div>
              </div>

              {/* Price */}
              <div className="text-center mb-1">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-white/50 text-lg">R$</span>
                  <span className="text-5xl font-black text-white" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>249</span>
                  <span className="text-2xl font-bold text-white/80">,90</span>
                </div>
                <p className="text-white/40 text-sm mt-1">pagamento único, acesso vitalício</p>
                <p className="text-amber-400/70 text-xs mt-1">ou 12x de R$ 20,83</p>
              </div>

              {/* Divider */}
              <div className="h-px my-5" style={{ background: 'linear-gradient(to right, transparent, rgba(212,168,75,0.3), transparent)' }} />

              {/* Garantia */}
              <div className="flex items-center justify-center gap-2.5 mb-5 px-4 py-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Shield className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-green-400 text-sm font-bold">7 dias de garantia</p>
                  <p className="text-green-400/60 text-xs">Seu dinheiro de volta, sem perguntas</p>
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-2.5 mb-6">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #d4a84b, #92650a)' }}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white/80 text-sm">{b}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Final */}
              <button
                onClick={handleCTAFinal}
                className="group relative w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-extrabold text-white transition-all active:scale-[0.97] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #d4a84b 0%, #92650a 60%, #6b4a0a 100%)',
                  boxShadow: '0 0 25px rgba(212,168,75,0.4), 0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                <span className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 55%, transparent 70%)', animation: 'shimmerSlide 3s ease-in-out infinite' }} />
                <span className="relative z-10 flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Quero ser Prime
                  <motion.span animate={{ x: [0, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} className="inline-flex">
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </span>
              </button>

              <p className="text-center text-white/30 text-[11px] mt-3">
                Pagamento 100% seguro via Mercado Pago
              </p>
            </div>
          </motion.div>
        </div>
      </div>

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

      {/* ───── PIX PAYMENT SCREEN (inline overlay) ───── */}
      <AnimatePresence>
        {showPixScreen && user && (
          <PixPaymentScreen
            userId={user.id}
            planType={PLAN_TYPE}
            qrCodeBase64={pixData?.qrCodeBase64}
            qrCode={pixData?.qrCode}
            qrCodeImageUrl={pixData?.qrCodeImageUrl}
            amount={pixData?.amount ?? VITALICIO_PRICE}
            expiresAt={pixData?.expiresAt}
            onCancel={() => { setShowPixScreen(false); resetPix(); }}
            onCopyCode={copyPixCode}
            onPaymentApproved={handlePaymentSuccess}
            isGenerating={pixLoading}
          />
        )}
      </AnimatePresence>

      {/* ───── PAYMENT METHOD MODAL ───── */}
      <PaymentMethodModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectPix={handleSelectPix}
        onSelectCard={handleSelectCard}
        planLabel="Anual — 12x de R$ 8,33"
        amount={VITALICIO_PRICE}
        installments={VITALICIO_INSTALLMENTS}
        pixLoading={pixLoading}
      />

      {/* ───── CARD CHECKOUT MODAL ───── */}
      {user && (
        <CheckoutCartaoModal
          open={showCardModal}
          onOpenChange={setShowCardModal}
          amount={VITALICIO_PRICE}
          planType={PLAN_TYPE}
          planLabel="Anual — 12x de R$ 8,33"
          userEmail={user.email || ''}
          userId={user.id}
          onSuccess={handlePaymentSuccess}
          installments={VITALICIO_INSTALLMENTS}
        />
      )}

      {/* ───── AUTH MODAL (inline) ───── */}
      <WelcomeAuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* ───── FEATURES SECTION ───── */}
      <div className="bg-black px-6 lg:px-12 pt-10 pb-14">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="h-px mb-10 mx-auto max-w-[200px]" style={{ background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.6), transparent)' }} />
            <h2 className="text-2xl font-black text-white text-center mb-2" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>O que você vai ter:</h2>
            <p className="text-center text-white/45 text-sm mb-10">para não reprovar e passar na OAB</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 mb-12">
              {features.map((f, i) => (
                <motion.div key={f.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="flex items-start gap-4 text-left">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)' }}>
                    <f.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">{f.label}</h3>
                    <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <button
                onClick={scrollToPricing}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-base font-extrabold text-black transition-all active:scale-[0.97]"
                style={{ background: '#fff', boxShadow: '0 0 30px rgba(255,255,255,0.2)' }}
              >
                <Crown className="w-5 h-5 text-amber-500" />
                Quero ser Prime
              </button>
              <button
                onClick={handleLogin}
                className="w-full py-4 rounded-2xl text-sm font-semibold text-white/50 hover:text-white transition-colors border border-white/10"
              >
                Já sou aluno →
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Demo Video Modal */}
      <DemoVideoModal
        isOpen={showDemoVideo}
        onClose={() => {
          setShowDemoVideo(false);
          if (bgAudioRef.current) bgAudioRef.current.play().catch(() => {});
        }}
      />
    </div>
  );
};

export default WelcomeVitalicio;
