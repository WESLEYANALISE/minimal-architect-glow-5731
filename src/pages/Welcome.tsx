import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, ChevronLeft, GraduationCap, Scale, FileText, BookOpen, Sparkles, Play, Smartphone, Globe, Monitor } from 'lucide-react';
import { useDeviceType } from '@/hooks/use-device-type';
import { DemoVideoModal } from '@/components/welcome/DemoVideoModal';
import welcomeHero from '@/assets/welcome-hero.jpeg';
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

const features = [
  {
    icon: GraduationCap,
    label: 'Aprovação na Faculdade',
    desc: 'Resumos, aulas e simulados para você tirar nota alta e nunca mais pegar DP.',
  },
  {
    icon: Scale,
    label: 'OAB 1ª Fase',
    desc: 'Questões comentadas, vade mecum atualizado e treino focado em aprovação.',
  },
  {
    icon: FileText,
    label: 'OAB 2ª Fase',
    desc: 'Peças práticas, recursos e tudo que você precisa para cruzar a linha de chegada.',
  },
  {
    icon: Sparkles,
    label: 'Flashcards e Mapas Mentais',
    desc: 'Memorize o que importa com método ativo — sem decoreba, com fixação real.',
  },
  {
    icon: BookOpen,
    label: 'Biblioteca Jurídica Completa',
    desc: 'Códigos, leis, súmulas e doutrina em um só lugar, sempre atualizado.',
  },
];

const PERSUASIVE_PHRASES = [
  { main: 'Tudo em um só lugar.', sub: 'Leis, questões, flashcards e vade mecum sempre atualizados.' },
  { main: 'Seu conteúdo completo.', sub: 'Códigos, súmulas, doutrina e simulados OAB num só app.' },
  { main: 'Chega de estudar disperso.', sub: 'Ferramentas integradas para você focar no que realmente importa.' },
  { main: 'Do 1º semestre à OAB.', sub: 'Tudo que você precisa para estudar bem, em um único lugar.' },
  { main: 'Estude sem depender de ninguém.', sub: 'Flashcards, mapas mentais, biblioteca e muito mais.' },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const [imgLoaded, setImgLoaded] = useState(true);
  const [mockupIndex, setMockupIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  
  

  useEffect(() => {
    [appMockup1, appMockup2, appMockup3].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = welcomeHero;
    img.onload = () => setImgLoaded(true);
    if (img.complete) setImgLoaded(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setMockupIndex(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % PERSUASIVE_PHRASES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [slidingOut, setSlidingOut] = useState(false);

  // Preload Auth chunk as soon as Welcome mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      import('./Auth').catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleJoin = useCallback(() => {
    // Start loading Auth chunk immediately on click
    const authChunk = import('./Auth').catch(() => {});
    setSlidingOut(true);
    setTimeout(async () => {
      await authChunk;
      navigate('/auth');
    }, 350);
  }, [navigate]);

  const handleLogin = useCallback(() => {
    const authChunk = import('./Auth').catch(() => {});
    setSlidingOut(true);
    setTimeout(async () => {
      await authChunk;
      navigate('/auth?mode=login');
    }, 350);
  }, [navigate]);

  // Desktop — render the same Welcome page (no longer blocked)

  return (
    <div
      className="min-h-[100dvh] w-full bg-black overflow-x-hidden relative"
      style={slidingOut ? {
        animation: 'slideOutLeft 0.6s cubic-bezier(0.76, 0, 0.24, 1) forwards',
      } : undefined}
    >

      {/* ───── HERO SECTION ───── */}
      <motion.div
        className="relative min-h-[100dvh] flex flex-col"
      >
        {/* Background image */}
         <div className="absolute inset-0 overflow-hidden">
          <img
            src={welcomeHero}
            alt=""
            fetchPriority="high"
            className={`w-full h-auto max-w-none object-cover object-top transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 via-40% to-black" />
        </div>

        {/* Navbar — Logo maior e centralizado */}
        <nav className="relative z-20 px-4 lg:px-8 pt-6 pb-2">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center lg:items-start gap-1 max-w-7xl mx-auto"
          >
            <div className="relative shine-effect rounded-full overflow-hidden">
              <img src={newLogo} alt="Direito Premium" className="h-20 w-20 object-contain drop-shadow-2xl" />
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 30px rgba(212,168,75,0.25)' }} />
            </div>
            <div className="flex flex-col leading-tight items-center lg:items-start">
              <span className="text-white font-black text-xl" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '-0.02em' }}>Direito Prime</span>
              <span className="text-white/50 text-xs font-medium" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '0.04em' }}>Estudos Jurídicos</span>
            </div>
          </motion.div>
        </nav>

        {/* Hero content — mobile: coluna única; desktop: 2 colunas com mockup */}
        <div className="relative z-10 flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between px-6 lg:px-12 xl:px-20 pb-6 pt-16 sm:pt-20 max-w-[1400px] mx-auto w-full lg:py-16">

          {/* Coluna de texto */}
          <motion.div
            className="lg:flex-1 lg:max-w-2xl"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0 } },
            }}
          >
            {/* ── Headline + Neon Pillar ── */}
            <div
              className="mb-6 text-center lg:text-left"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '-0.02em' }}
            >
              <div className="headline-shine">
                <motion.h1
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                  className="text-[clamp(1.8rem,5.5vw,3rem)] font-black text-white leading-[1.1] mb-4"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
                >
                  Tudo para você{' '}
                  <span className="inline" style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.4)' }}>estudar Direito</span>{' '}
                  em um{' '}
                  <span className="inline" style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.4)' }}>só lugar</span>.
                </motion.h1>
              </div>
              <motion.p
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className="text-white/85 text-center lg:text-left text-[clamp(0.95rem,3vw,1.15rem)] leading-relaxed mb-2"
                style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
              >
                Aulas, resumos, flashcards, questões, audioaulas, vade mecum e muito mais, tudo em um só lugar para você{' '}
                <span className="font-bold" style={{ color: '#ef4444' }}>dominar o Direito</span>.
              </motion.p>



              {/* CTA Estudar agora — com reflexo brilhante */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                className="flex flex-col items-center lg:items-start mt-5 mb-6"
              >
                <button
                   onClick={handleJoin}
                  className="group relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-base font-bold text-white transition-all active:scale-[0.97] overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #b91c1c, #991b1b)',
                    boxShadow: '0 0 20px rgba(185,28,28,0.4), 0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* Shimmer / reflexo animado */}
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 55%, transparent 70%)',
                      animation: 'shimmerSlide 3s ease-in-out infinite',
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    <Scale className="w-4.5 h-4.5" />
                    Iniciar Agora
                    <motion.span
                      animate={{ x: [0, 6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="inline-flex"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    setShowDemoVideo(true);
                  }}
                  className="mt-2 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.97]"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  <Play className="w-4 h-4" />
                  Ver demonstração
                </button>
                <p className="text-white text-xs mt-2.5 tracking-wide font-medium">
                  ⭐ +10.000 alunos já estudam com a gente
                </p>
              </motion.div>

              {/* Carrossel de cards de funcionalidades */}
              <FeatureCardsCarousel />

              {/* Louros + V-shape overlay */}
              <motion.div
                variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
                className="relative w-full max-w-[280px] md:max-w-[400px] lg:max-w-[320px] mx-auto my-2"
              >
                {/* Laurel wreath image */}
                <img
                  src={lourosDourados}
                  alt=""
                  className="w-full h-auto object-contain pointer-events-none select-none"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(212,168,75,0.3))' }}
                />

                {/* V-shape text overlaid on the wreath */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* Top row: Faculdade left, Concursos right */}
                  <div className="flex justify-between w-full -mt-2 px-1">
                    {['Faculdade', 'Concursos'].map((word, i) => (
                      <motion.span
                        key={word}
                        initial={{ opacity: 0, y: -20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.3, duration: 0.6, type: 'spring', stiffness: 120 }}
                        className="text-[clamp(1rem,3.2vw,1.5rem)] font-black text-white uppercase whitespace-nowrap"
                        style={{
                          fontFamily: "'Georgia', 'Times New Roman', serif",
                          animation: `neonPulseText 3s ease-in-out ${i * 1}s infinite`,
                          textShadow: '0 0 20px rgba(212,168,75,0.5), 0 2px 8px rgba(0,0,0,0.6)',
                        }}
                      >
                        {word}
                      </motion.span>
                    ))}
                  </div>

                  {/* Connecting V lines (SVG) */}
                  <motion.svg
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 1.4, duration: 0.8, ease: 'easeOut' }}
                    viewBox="0 0 400 36" className="w-[80%] h-8" preserveAspectRatio="none"
                  >
                    <line x1="50" y1="0" x2="200" y2="32" stroke="url(#goldLine)" strokeWidth="3.5" style={{ animation: 'lineGlow 3s ease-in-out 0.5s infinite' }} />
                    <line x1="350" y1="0" x2="200" y2="32" stroke="url(#goldLine)" strokeWidth="3.5" style={{ animation: 'lineGlow 3s ease-in-out 1.5s infinite' }} />
                    <defs>
                      <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="#d4a84b" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </motion.svg>

                  {/* Bottom center: OAB */}
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 1.8, duration: 0.7, type: 'spring', stiffness: 100, damping: 10 }}
                    className="text-[clamp(1.8rem,7vw,2.6rem)] font-black text-white uppercase"
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      animation: 'neonPulseText 3s ease-in-out 2s infinite',
                      textShadow: '0 0 25px rgba(212,168,75,0.6), 0 0 50px rgba(212,168,75,0.2), 0 2px 8px rgba(0,0,0,0.6)',
                    }}
                  >
                    OAB
                  </motion.span>
                </div>
              </motion.div>
            </div>


            {/* Carrossel de insígnias */}
            <BadgeCarousel />

            {/* Texto "Alcance a excelência" com reflexo */}
            <motion.p
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="relative text-center text-[clamp(1.1rem,3.5vw,1.4rem)] font-semibold tracking-wide mb-4 overflow-hidden"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 0 12px rgba(255,255,255,0.3), 0 0 30px rgba(255,255,255,0.1)',
              }}
            >
              <span className="relative z-10">Alcance a excelência nos estudos jurídicos.</span>
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 70%)',
                  animation: 'shimmerSlide 3s ease-in-out infinite',
                }}
              />
            </motion.p>
          </motion.div>

          {/* Mockup — só desktop, como coluna direita */}
          <motion.div
            className="hidden lg:block w-[300px] xl:w-[360px] flex-shrink-0 -mt-12"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          >
            <div className="relative">
              {[appMockup1, appMockup2, appMockup3].map((src, i) => (
                <motion.img
                  key={src}
                  src={src}
                  alt="Direito Premium App"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                  style={{ position: i === 0 ? 'relative' : 'absolute', top: 0, left: 0 }}
                  animate={{
                    opacity: i === mockupIndex ? 1 : 0,
                    scale: i === mockupIndex ? 1 : 1.03,
                  }}
                  transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Marquee universidades */}
        <div className="relative z-10 bg-black/60 py-3">
          <p className="text-center text-[9px] uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 0 12px rgba(255,255,255,0.5)' }}>
            Domine as matérias da faculdade de Direito
          </p>
          <div
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
          >
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
          <div
            className="rounded-2xl px-6 py-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(212,168,75,0.12) 0%, rgba(0,0,0,0.85) 100%)',
              border: '1px solid rgba(212,168,75,0.22)',
            }}
          >
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: 'linear-gradient(to bottom, transparent, #d4a84b, #fbbf24, #d4a84b, transparent)', boxShadow: '0 0 10px 4px rgba(212,168,75,0.8), 0 0 22px 8px rgba(212,168,75,0.35)' }} />
            <p className="text-white font-black text-[17px] leading-snug mb-2" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              O que é Direito Prime?
            </p>
            <p className="text-white/60 text-[13px] leading-relaxed">
              O Direito Prime nasce para guiar você do primeiro contato com o Direito até o nível avançado. Quando há direção, há progresso. Aqui o{' '}
              <span className="font-bold" style={{ color: '#d4a84b' }}>conteúdo certo encontra sua dedicação</span>{' '}
              e transforma estudo em conquista.
            </p>
          </div>
        </div>
      </div>

      {/* ───── APP SHOWCASE ───── */}
      <AppShowcaseSection />

      {/* ───── TESTIMONIALS ───── */}
      <TestimonialsSection />

      {/* ───── MOCKUP SLIDESHOW (Images only) ───── */}
      <div className="bg-black w-full relative overflow-hidden">
        <div className="flex justify-center pt-8 pb-4">
          <p className="text-white/60 text-sm font-semibold">Conheça o app por dentro</p>
        </div>

        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${mockupIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="px-6 pb-4 text-center"
            >
              {mockupIndex === 0 && (
                <>
                  <p className="text-white/80 text-sm font-semibold leading-relaxed">
                    Tudo que você precisa para a <span className="text-amber-400">faculdade</span> e a <span className="text-amber-400">OAB</span>
                  </p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    Biblioteca com +1.200 livros, estudos, Vade Mecum completo e todas as leis comentadas
                  </p>
                </>
              )}
              {mockupIndex === 1 && (
                <>
                  <p className="text-white/80 text-sm font-semibold leading-relaxed">
                    Pratique com <span className="text-amber-400">questões comentadas</span>
                  </p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    Banco de questões da OAB e concursos, com gabarito e explicação detalhada
                  </p>
                </>
              )}
              {mockupIndex === 2 && (
                <>
                  <p className="text-white/80 text-sm font-semibold leading-relaxed">
                    Sua <span className="text-amber-400">Professora IA</span> disponível 24h
                  </p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    Tire dúvidas, receba resumos e domine qualquer matéria no seu ritmo
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="relative w-full" style={{ minHeight: 340 }}>
            {[appMockup1, appMockup2, appMockup3].map((src, i) => (
              <motion.img
                key={src}
                src={src}
                alt="Direito Premium App"
                className="w-full h-auto block"
                style={{ position: i === 0 ? 'relative' : 'absolute', top: 0, left: 0 }}
                animate={{
                  opacity: i === mockupIndex ? 1 : 0,
                  scale: i === mockupIndex ? 1 : 1.03,
                }}
                transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
              />
            ))}
            <button
              onClick={() => setMockupIndex(prev => (prev - 1 + 3) % 3)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-white/70" />
            </button>
            <button
              onClick={() => setMockupIndex(prev => (prev + 1) % 3)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/15 flex items-center justify-center transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      </div>

      {/* ───── FEATURES SECTION ───── */}
      <div className="bg-black px-6 lg:px-12 pt-10 pb-14">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="h-px mb-10 mx-auto max-w-[200px]"
              style={{ background: 'linear-gradient(to right, transparent, rgba(251,191,36,0.6), transparent)' }}
            />
            <h2
              className="text-2xl font-black text-white text-center mb-2"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              O que você vai ter:
            </h2>
            <p className="text-center text-white/45 text-sm mb-10">para não reprovar e passar na OAB</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 mb-12">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4 text-left"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.25)' }}
                  >
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
                onClick={handleJoin}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-base font-extrabold text-black transition-all active:scale-[0.97]"
                style={{ background: '#fff', boxShadow: '0 0 30px rgba(255,255,255,0.2)' }}
              >
                <Smartphone className="w-5 h-5 text-amber-500" />
                Acessar App
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
        }}
      />
    </div>
  );
};

export default Welcome;
