import { startTransition } from "react";
import { useNavigate, useSearchParams, NavigateFunction } from "react-router-dom";
import jornadaHeroBackground from "@/assets/hero-biblioteca-cover.webp";
import leisHeroBackground from "@/assets/leis-hero-background.webp";
import destaquesHeroBackground from "@/assets/destaques-hero-background.webp";
import juriflixHeroBackground from "@/assets/juriflix-hero-cover.webp";
import bloggerHeroBackground from "@/assets/blogger-hero-courtroom.webp";
import heroBannerThemisAdvogado from "@/assets/hero-estudos-law-student.webp";
import logoDireitoPremium from '@/assets/logo-direito-premium-new.webp';
import { UniversalImage } from '@/components/ui/universal-image';
import { DotPattern } from "@/components/ui/dot-pattern";

import { DesktopVadeMecumHome } from "@/components/desktop/DesktopVadeMecumHome";
import { DesktopEstudosComputador } from "@/components/desktop/DesktopEstudosComputador";
import { ResenhaHojeSection } from "@/components/ResenhaHojeSection";
import themisEstudosDesktop from "@/assets/themis-estudos-desktop.webp";
import coverAulas from "@/assets/covers/cover-aulas.webp";
import coverResumos from "@/assets/covers/cover-resumos.webp";
import coverFlashcards from "@/assets/covers/cover-flashcards.webp";
import coverQuestoes from "@/assets/covers/cover-questoes.webp";
import coverBiblioteca from "@/assets/covers/cover-biblioteca.webp";
import coverAudioaulas from "@/assets/covers/cover-audioaulas.webp";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";

import { Crown, Gavel, FileText, Scale, GraduationCap, BookOpen as BookOpenIcon, Library, Hammer, Target, Search, Headphones, Play, Loader2, Newspaper, ArrowRight, Sparkles, Scroll, Brain, Monitor, Video, BookOpen, Calendar, Settings, Flame, MonitorSmartphone, Users, Landmark, Clapperboard, BarChart3, Film, MessageCircle, Clock, Map, MapPin, Award, Wrench, Baby, BookText, FileCheck, ClipboardList, Layers, Route, Footprints, Briefcase, ChevronRight, ChevronDown, Compass } from "lucide-react";
import cardAulasThumb from "@/assets/card-aulas-thumb.webp";
import bibliotecaThumb from "@/assets/biblioteca-office-sunset.webp";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useEmblaCarousel from 'embla-carousel-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AudioAula } from "@/types/database.types";
import BibliotecasCarousel from "@/components/BibliotecasCarousel";
import ProposicoesRecentesCarousel from "@/components/ProposicoesRecentesCarousel";
import { useFeaturedNews } from "@/hooks/useFeaturedNews";
import { Button } from "@/components/ui/button";
import { CursosCarousel } from "@/components/CursosCarousel";
import { VideoaulasOABAreasCarousel } from "@/components/VideoaulasOABAreasCarousel";
import { DocumentariosCarousel } from "@/components/DocumentariosCarousel";
import NoticiaCarouselCard from "@/components/NoticiaCarouselCard";
import { useDeviceType } from "@/hooks/use-device-type";
import { CarreirasJuridicasCarousel } from "@/components/CarreirasJuridicasCarousel";
import ResumosDisponiveisCarousel from "@/components/ResumosDisponiveisCarousel";
import ResenhaDiariaCarousel from "@/components/ResenhaDiariaCarousel";
import { ArabellaAssistenteHome } from "@/components/home/ArabellaAssistenteHome";
import { HomeHeroSlider } from "@/components/home/HomeHeroSlider";
import { HomePratiqueSlide } from "@/components/home/HomePratiqueSlide";

import BlogInicianteCarousel from "@/components/BlogInicianteCarousel";
import BussolaCarreiraCarousel from "@/components/BussolaCarreiraCarousel";
import { OabCarreiraBlogList } from "@/components/oab/OabCarreiraBlogList";
import { EmAltaSection } from "@/components/EmAltaSection";
import { LivroDoDiaHomeSection } from "@/components/home/LivroDoDiaHomeSection";
import { EmAltaCarousel, ALL_ATALHOS, getActiveKeys } from "@/components/EmAltaCarousel";
import { SimuladosCarousel } from "@/components/home/SimuladosCarousel";
import { PortalDeVideosSection } from "@/components/home/PortalDeVideosSection";
import { HomeAtalhosSection } from "@/components/home/HomeAtalhosSection";
import { ProfessoraSheet } from "@/components/ProfessoraSheet";
import { CarreirasSection } from "@/components/CarreirasSection";
import { PoliticaHomeSection } from "@/components/home/PoliticaHomeSection";
import { RecomendacaoHomeSection } from "@/components/home/RecomendacaoHomeSection";

import { OABHomeSection } from "@/components/home/OABHomeSection";
import { RadarJuridicoSection } from "@/components/home/RadarJuridicoSection";
import { DesktopTrilhasAprender } from "@/components/desktop/DesktopTrilhasAprender";
import { DesktopTrilhasOAB } from "@/components/desktop/DesktopTrilhasOAB";
import { DesktopHomeDestaque } from "@/components/desktop/DesktopHomeDestaque";
import { DesktopHomeBannerCTA } from "@/components/desktop/DesktopHomeBannerCTA";
import { DesktopHomeDestaques } from "@/components/desktop/DesktopHomeDestaques";
import { DesktopNewsCarouselBanner } from "@/components/desktop/DesktopNewsCarouselBanner";
import { MobileTrilhasAprender } from "@/components/mobile/MobileTrilhasAprender";
import { MobileLeisHome } from "@/components/mobile/MobileLeisHome";
import { MobileHomeDestaques } from "@/components/mobile/MobileHomeDestaques";
import { JornadaHomeSection } from "@/components/home/JornadaHomeSection";
import { EstudosViewCarousel } from "@/components/home/EstudosViewCarousel";
import { BibliotecaHomeSection } from "@/components/home/BibliotecaHomeSection";
import { JuriflixHomeSection } from "@/components/home/JuriflixHomeSection";
import { BloggerHomeSection } from "@/components/home/BloggerHomeSection";
import { LegislacaoHomeSection } from "@/components/home/LegislacaoHomeSection";
import { ExplorarSection } from "@/components/home/ExplorarSection";
import { useRoutePrefetch } from "@/hooks/useRoutePrefetch";
import { AggressivePreloader } from "@/components/AggressivePreloader";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { toast } from "sonner";
import SearchBarAnimatedText from "@/components/SearchBarAnimatedText";
import { preloadImages } from "@/hooks/useInstantCache";
import PremiumCelebration from "@/components/onboarding/PremiumCelebration";

import RateAppFloatingCard from "@/components/RateAppFloatingCard";
import { LeisNovosNotification } from "@/components/LeisNovosNotification";
import { PhoneMissingBanner } from "@/components/PhoneMissingBanner";
import { PersuasiveTextCarousel } from "@/components/home/PersuasiveTextCarousel";
import { useTrialStatus } from "@/hooks/useTrialStatus";

/**
 * LazyTab: monta o conteúdo apenas na primeira vez que fica visível,
 * depois mantém montado (keep alive) para evitar re-fetch.
 */
const LazyTab = ({ visible, children, className }: { visible: boolean; children: React.ReactNode; className?: string }) => {
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  useEffect(() => {
    if (visible && !hasBeenVisible) setHasBeenVisible(true);
  }, [visible, hasBeenVisible]);
  if (!hasBeenVisible) return null;
  return <div className={visible ? (className || '') : 'hidden'}>{children}</div>;
};


// Imagens de carreiras para preload
import carreiraAdvogado from "@/assets/carreira-advogado.webp";
import carreiraJuiz from "@/assets/carreira-juiz.webp";
import carreiraDelegado from "@/assets/carreira-delegado.webp";
import carreiraPromotor from "@/assets/carreira-promotor.webp";
import carreiraPrf from "@/assets/carreira-prf.webp";
import carreiraPf from "@/assets/pf-004-opt.webp";
import sidebarThemisBg from "@/assets/sidebar-themis-bg.webp";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia,";
  if (hour >= 12 && hour < 18) return "Boa tarde,";
  return "Boa noite,";
};

// Lista de imagens de carreiras para preload
const CARREIRAS_IMAGES = [
  carreiraAdvogado, carreiraJuiz, carreiraDelegado,
  carreiraPromotor, carreiraPrf, carreiraPf
];

const HERO_IMAGES_STATIC: Record<string, string> = {
  biblioteca: jornadaHeroBackground,
  estudos: heroBannerThemisAdvogado,
  juriflix: juriflixHeroBackground,
  blogger: bloggerHeroBackground,
};

type JornadaTipo = 'conceitos' | 'oab';

const JORNADAS_OPTIONS = [
  { id: 'conceitos' as JornadaTipo, label: 'Conceitos', sublabel: 'Fundamentos do Direito', icon: GraduationCap },
  { id: 'oab' as JornadaTipo, label: 'OAB', sublabel: '1ª e 2ª Fase', icon: Scale },
];

type MainTab = 'biblioteca' | 'estudos' | 'leis' | 'juriflix' | 'blogger';
type FaculdadeSubTab = 'estudos' | 'ferramentas';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDesktop } = useDeviceType();
  const { handleLinkHover } = useRoutePrefetch();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { isAuthDialogOpen, closeAuthDialog, requireAuth } = useRequireAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const { trialExpired } = useTrialStatus();
  

  // Navigate com auth gate: visitantes veem o dialog em vez de navegar
  const gatedNavigate: NavigateFunction = useCallback((...args: any[]) => {
    if (user) {
      startTransition(() => {
        (navigate as any)(...args);
      });
      return;
    }
    // Visitante tentou navegar - mostrar dialog
    requireAuth(() => {});
  }, [user, navigate, requireAuth]) as NavigateFunction;
  // Parallax removido — sem JS no scroll para máxima performance

  // Memoize sparkle styles to avoid recalculating random values on every render
  const sparkleStyles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 2 + 1}px`,
      left: `${Math.random() * 100}%`,
      top: `-1px`,
      opacity: 0 as number,
      animation: `sparkle-fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 2}s infinite`,
    }))
  , []);

  // Buscar nome do usuário para saudação + verificar intencao para onboarding
  const [userName, setUserName] = useState<string | null>(null);
  useEffect(() => {
    if (!user) { setUserName(null); return; }
    supabase.from('profiles').select('nome').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.nome) setUserName(data.nome.split(' ')[0]);
      });
  }, [user]);

  // Premium celebration for new subscribers
  const [showCelebration, setShowCelebration] = useState(() => {
    if (!user) return false;
    const key = `just_subscribed_${user.id}`;
    if (localStorage.getItem(key) === 'true') {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  });

  
  // Ler tab da URL para navegação de volta (default agora é 'ferramentas' / Estudos)
  const tabFromUrl = searchParams.get('tab') as MainTab | null;
  const [mainTab, setMainTab] = useState<MainTab>(tabFromUrl || 'estudos');
  
  const [faculdadeSubTab, setFaculdadeSubTab] = useState<FaculdadeSubTab>('estudos');
  
  const [professoraOpen, setProfessoraOpen] = useState(false);
  const topAnchorRef = useRef<HTMLDivElement | null>(null);

  // Jornada selector state (Conceitos / OAB)
  const [jornadaAtiva, setJornadaAtiva] = useState<JornadaTipo>(() => {
    return (localStorage.getItem('jornada_ativa') as JornadaTipo) || 'conceitos';
  });
  const [showJornadaSelector, setShowJornadaSelector] = useState(false);

  const handleSelectJornada = (tipo: JornadaTipo) => {
    setJornadaAtiva(tipo);
    localStorage.setItem('jornada_ativa', tipo);
    setShowJornadaSelector(false);
  };

  const jornadaInfo = JORNADAS_OPTIONS.find(j => j.id === jornadaAtiva)!;


  // Função central para troca de tab (preserva posição para evitar "desce/sobe")
  const changeMainTab = useCallback((tab: MainTab) => {
    if (tab === mainTab) return;

    const currentScrollY = window.scrollY;

    // Evita foco causar scroll-into-view durante a troca
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Evita animação de scroll e scroll anchoring durante reflow da troca
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.style.overflowAnchor = 'none';

    setMainTab(tab);
    window.dispatchEvent(new CustomEvent('desktop-nav-tab-change', { detail: { tab } }));

    const restoreScroll = () => {
      window.scrollTo({ top: currentScrollY, left: 0, behavior: 'auto' });
    };

    restoreScroll();
    requestAnimationFrame(restoreScroll);

    setTimeout(() => {
      restoreScroll();
      document.documentElement.style.overflowAnchor = '';
      document.documentElement.style.scrollBehavior = '';
    }, 120);
  }, [mainTab]);


  // Preload das imagens de atalhos + carreiras + sidebar assim que o app monta
  const atalhoImages = useMemo(() => {
    const keys = getActiveKeys();
    return keys.map(k => ALL_ATALHOS.find(a => a.key === k)?.coverImage).filter(Boolean) as string[];
  }, []);

  useEffect(() => {
    // Preload agressivo — inicia após 200ms
    setTimeout(() => {
      preloadImages(atalhoImages);
      preloadImages([...CARREIRAS_IMAGES, sidebarThemisBg]);
    }, 200);
  }, []);

  // Atualizar tab quando URL mudar
  useEffect(() => {
    if (tabFromUrl && ['biblioteca', 'estudos', 'leis', 'juriflix', 'blogger'].includes(tabFromUrl)) {
      changeMainTab(tabFromUrl);
    }
  }, [tabFromUrl, changeMainTab]);

  // Escutar cliques do header desktop (tabs)
  useEffect(() => {
    const handleHeaderClick = (e: CustomEvent<{ tab: string }>) => {
      const tab = e.detail.tab as MainTab;
      if (['biblioteca', 'estudos', 'leis', 'juriflix', 'blogger'].includes(tab)) {
        changeMainTab(tab);
      }
    };
    const handleOpenProfessora = () => setProfessoraOpen(true);
    
    window.addEventListener('header-nav-tab-click' as any, handleHeaderClick);
    window.addEventListener('open-professora-sheet' as any, handleOpenProfessora);
    return () => {
      window.removeEventListener('header-nav-tab-click' as any, handleHeaderClick);
      window.removeEventListener('open-professora-sheet' as any, handleOpenProfessora);
    };
  }, [changeMainTab]);


  // Track pesquisar sub-tab and sheet state
  const [isPesquisarActive, setIsPesquisarActive] = useState(false);
  const [isPesquisarSheetActive, setIsPesquisarSheetActive] = useState(false);

  useEffect(() => {
    const handlePesquisarTab = (e: CustomEvent<{ active: boolean }>) => setIsPesquisarActive(e.detail.active);
    const handlePesquisarSheet = (e: CustomEvent<{ active: boolean }>) => setIsPesquisarSheetActive(e.detail.active);
    const handleTribunaTab = (e: CustomEvent<{ active: boolean }>) => setIsPesquisarActive(e.detail.active);
    window.addEventListener('pesquisar-tab-active' as any, handlePesquisarTab);
    window.addEventListener('pesquisar-sheet-active' as any, handlePesquisarSheet);
    window.addEventListener('tribuna-tab-active' as any, handleTribunaTab);
    return () => {
      window.removeEventListener('pesquisar-tab-active' as any, handlePesquisarTab);
      window.removeEventListener('pesquisar-sheet-active' as any, handlePesquisarSheet);
      window.removeEventListener('tribuna-tab-active' as any, handleTribunaTab);
    };
  }, []);

  // Vade Mecum tab state
  const [isVadeMecumActive, setIsVadeMecumActive] = useState(false);

  useEffect(() => {
    const handler = (e: CustomEvent<{ active: boolean }>) => setIsVadeMecumActive(e.detail.active);
    window.addEventListener('vademecum-tab-active' as any, handler);
    return () => window.removeEventListener('vademecum-tab-active' as any, handler);
  }, []);

  // Esconder menu de rodapé quando não estiver em "Estudos" ou quando pesquisar/vademecum está ativo
  useEffect(() => {
    const bottomNav = document.querySelector('[data-bottom-nav]');
    if (bottomNav) {
      const shouldHide = mainTab !== 'estudos' || isPesquisarActive || isPesquisarSheetActive || isVadeMecumActive;
      (bottomNav as HTMLElement).classList.toggle('translate-y-full', shouldHide);
      (bottomNav as HTMLElement).classList.toggle('opacity-0', shouldHide);
      (bottomNav as HTMLElement).classList.toggle('pointer-events-none', shouldHide);
    }
    return () => {
      const bottomNav = document.querySelector('[data-bottom-nav]');
      if (bottomNav) {
        (bottomNav as HTMLElement).classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
      }
    };
  }, [mainTab, isPesquisarActive, isPesquisarSheetActive, isVadeMecumActive]);

  // Sidebars sempre visíveis no desktop (notícias à direita)
  
  const heroImage = mainTab === 'leis' ? leisHeroBackground : (mainTab === 'estudos' ? heroBannerThemisAdvogado : (HERO_IMAGES_STATIC[mainTab] || heroBannerThemisAdvogado));

  // Crossfade puro CSS
  const [prevHero, setPrevHero] = useState(heroImage);
  const hasChangedTab = useRef(false);

  useEffect(() => {
    if (heroImage !== prevHero) {
      hasChangedTab.current = true;
      const timer = setTimeout(() => {
        setPrevHero(heroImage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [heroImage]);

  const {
    featuredNews,
    loading: loadingNews,
  } = useFeaturedNews();

  // Componente de botão de aba principal
  const TabButton = ({ tab, icon: Icon, label, onClick }: { tab: MainTab; icon: React.ElementType; label: string; onClick?: () => void }) => {
    const isActive = mainTab === tab;

    return (
      <button
        onClick={(e) => {
          // Remover focus para evitar browser scroll-into-view automático
          (e.currentTarget as HTMLButtonElement).blur();
          onClick ? onClick() : changeMainTab(tab);
        }}
        className={`flex-1 min-w-0 basis-0 px-2 md:px-4 py-2.5 md:py-3 rounded-full text-xs md:text-base font-bold transition-all flex items-center justify-center gap-1 md:gap-2 whitespace-nowrap ${
          isActive
            ? 'bg-[hsl(350,50%,18%)] text-white shadow-[0_0_15px_rgba(190,50,70,0.4),0_0_30px_rgba(190,50,70,0.2)] border border-rose-500/20'
            : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/15'
        }`}
      >
        {isActive ? (
          <>
            <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 text-white" strokeWidth={2.5} />
            <span className="text-white font-bold">{label}</span>
          </>
        ) : (
          <>
            <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 animate-icon-shimmer" strokeWidth={2.5} />
            <span
              className="animate-shimmer bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, rgb(163 163 163) 40%, rgb(250 250 250) 50%, rgb(163 163 163) 60%)',
                backgroundSize: '200% 100%',
              }}
            >
              {label}
            </span>
          </>
        )}
      </button>
    );
  };



  return (
    <div className="flex flex-col min-h-screen bg-muted pb-20 lg:pb-0 relative">
      <AggressivePreloader />
      <div ref={topAnchorRef} aria-hidden="true" className="absolute top-0" />
      {showCelebration && <PremiumCelebration onComplete={() => setShowCelebration(false)} />}
      
      <RateAppFloatingCard />
      <LeisNovosNotification />
      <PhoneMissingBanner />
      
      

      {/* Mobile-only content */}
      {!isDesktop && (
        <>
          {/* Hero Banner Mobile - fixo, cobre do topo até incluir os tabs */}
          <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex: 1 }}>
            <style>{`@media (max-width: 374px) { .hero-banner-mobile { height: 15rem !important; } } @media (min-width: 375px) { .hero-banner-mobile { height: 18rem; } }`}</style>
          </div>
          <div className="fixed top-0 left-0 right-0 pointer-events-none hero-banner-mobile" style={{ zIndex: 1, height: '18rem' }}>
            <div className="w-full h-full overflow-hidden rounded-b-[32px]" style={{ position: 'relative', contain: 'layout style paint' }}>
              <div className="absolute inset-0">
                <UniversalImage 
                  src={prevHero}
                  alt=""
                  priority
                  disableBlur
                  showSkeleton={false}
                  containerClassName="w-full h-full"
                  className="object-cover object-top"
                  style={{ transform: 'scale(1.1)' }}
                />
                <UniversalImage 
                  src={heroImage}
                  alt="Juridiquê"
                  priority
                  disableBlur
                  showSkeleton={false}
                  containerClassName="absolute inset-0 w-full h-full"
                  className="object-cover object-top transition-opacity duration-500 ease-in-out"
                  style={{
                    opacity: 1,
                    transform: 'scale(1.1)',
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/80" />
              <div key={mainTab} className={`absolute ${isPremium ? 'bottom-[5.5rem]' : 'bottom-16'} left-0 right-0 text-center pointer-events-auto ${hasChangedTab.current ? 'animate-fade-in' : ''}`} style={{ textShadow: '0 4px 16px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.5)' }}>
                {mainTab === 'biblioteca' ? (
                  <>
                    <p className="font-playfair text-xl sm:text-2xl font-semibold text-white/90 leading-tight">Biblioteca</p>
                    <p className="font-playfair text-3xl sm:text-4xl font-bold text-white leading-tight">Jurídica</p>
                    <div className="relative mx-auto mt-2 w-[60%]">
                      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
                      <div className="relative h-5 overflow-hidden">
                        {sparkleStyles.map((style, i) => (
                          <div key={i} className="absolute rounded-full bg-orange-400" style={style} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : mainTab === 'estudos' && userName ? (
                  <>
                    <p className="font-playfair text-xl sm:text-2xl font-semibold text-white/90 leading-tight">{getGreeting()}</p>
                    <p className="font-playfair text-3xl sm:text-4xl font-bold text-white leading-tight">{userName}</p>
                    <div className="relative mx-auto mt-2 w-[60%]">
                      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                      <div className="relative h-5 overflow-hidden">
                        {sparkleStyles.map((style, i) => (
                          <div key={i} className="absolute rounded-full bg-amber-400" style={style} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : mainTab === 'leis' ? (
                  <>
                    <p className="font-playfair text-xl sm:text-2xl font-semibold text-white/90 leading-tight">Vade Mecum</p>
                    <p className="font-playfair text-3xl sm:text-4xl font-bold text-white leading-tight">Legislação</p>
                    <div className="relative mx-auto mt-2 w-[60%]">
                      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                      <div className="relative h-5 overflow-hidden">
                        {sparkleStyles.map((style, i) => (
                          <div key={i} className="absolute rounded-full bg-emerald-400" style={style} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : mainTab === 'juriflix' ? (
                  <>
                    <p className="font-playfair text-2xl sm:text-3xl font-bold text-white leading-tight">JuriFlix</p>
                    <div className="relative mx-auto mt-2 w-[60%]">
                      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" />
                      <div className="relative h-5 overflow-hidden">
                        {sparkleStyles.map((style, i) => (
                          <div key={i} className="absolute rounded-full bg-rose-400" style={style} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : mainTab === 'blogger' ? (
                  <>
                    <p className="font-playfair text-xl sm:text-2xl font-semibold text-white/90 leading-tight">Sua Central de</p>
                    <p className="font-playfair text-3xl sm:text-4xl font-bold text-white leading-tight">Legislação</p>
                    <div className="relative mx-auto mt-2 w-[60%]">
                      <div className="h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                      <div className="relative h-5 overflow-hidden">
                        {sparkleStyles.map((style, i) => (
                          <div key={i} className="absolute rounded-full bg-emerald-400" style={style} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Spacer para revelar a imagem hero */}
          <div className="h-36" style={{ zIndex: 1 }} />

          {/* Banner CTA Assinar - Topo */}
          <div className="relative" style={{ zIndex: 3 }}>
            <PersuasiveTextCarousel />
          </div>
        </>
      )}

      {/* Conteúdo principal - Mobile */}
      {!isDesktop && (
      <div className="relative flex-1 pb-20 rounded-t-[32px] bg-[hsl(0,0%,8%)]" style={{ zIndex: 2 }}>

        {/* Tabs dentro do container principal */}
        <div className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 pb-2">
          <div className="flex gap-1 sm:gap-1.5 h-[40px] sm:h-[44px]">
            <TabButton tab="biblioteca" icon={Library} label="Biblioteca" />
            <TabButton tab="estudos" icon={GraduationCap} label="Estudos" />
            <TabButton tab="blogger" icon={Scale} label="Legislação" />
          </div>
        </div>

        {/* Conteúdo das abas mobile — mount on first open + keep alive */}
        <LazyTab visible={mainTab === 'biblioteca'} className="px-2 space-y-6">
          <BibliotecaHomeSection navigate={gatedNavigate} />
        </LazyTab>

        <div className={mainTab === 'estudos' ? '' : 'hidden'}>
            <HomeAtalhosSection
              onProfessora={() => setProfessoraOpen(true)}
              gatedNavigate={gatedNavigate}
              user={user}
              requireAuth={requireAuth}
              variant="mobile"
            />

            {/* Logo + Barra de pesquisa integrada */}
            <div className="px-4 py-6">
              <div className="flex items-center relative overflow-hidden rounded-full group cursor-pointer"
                onClick={() => window.dispatchEvent(new Event('open-pesquisar-sheet'))}
              >
                {/* Shine animation cobrindo logo + barra */}
                <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-full">
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" style={{ animation: 'searchShine 4s ease-in-out infinite' }} />
                </div>

                {/* Logo circular - maior que a barra */}
                <div className="relative z-20 flex-shrink-0 -mr-4">
                  <img
                    src={logoDireitoPremium}
                    alt="Direito Prime"
                    className="w-[4.5rem] h-[4.5rem] rounded-full object-contain shadow-xl ring-[3px] ring-[hsl(350,50%,22%)] bg-[hsl(345,45%,6%)]"
                    loading="eager"
                    decoding="sync"
                  />
                </div>

                {/* Barra de pesquisa */}
                <div
                  className="flex-1 -ml-4 pl-7 pr-3 py-2 rounded-r-2xl rounded-l-lg bg-gradient-to-r from-[hsl(350,50%,18%)] to-[hsl(345,45%,12%)] border border-rose-500/25 relative shadow-lg shadow-[hsl(350,50%,10%)]/40"
                >
                  <div className="w-full flex items-center gap-3 px-3 py-1 rounded-xl bg-white/60 border border-white/30 relative z-10">
                    <SearchBarAnimatedText />
                    <div className="w-6 h-6 rounded-full bg-[hsl(350,50%,40%)] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm shadow-rose-500/30">
                      <Search className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Estudos no Computador — Funções Web + Estudo em Mídia (mobile only) */}
            <div className="px-3 pt-2">
              <DesktopEstudosComputador navigate={gatedNavigate} onEvelyn={() => setProfessoraOpen(true)} />
            </div>

            {/* Portal de Vídeos (Estudos em Mídia) */}
            <div className="px-2 pt-6 pb-4">
              <PortalDeVideosSection navigate={gatedNavigate} />
            </div>

            {/* Estudos / Leis do Dia / Vade Mecum - Carousel com setas */}
            <div className="pt-8 pb-4">
              <EstudosViewCarousel>
                <HomePratiqueSlide />
              </EstudosViewCarousel>
            </div>

            {/* Simulados - apenas admin */}
            {isAdmin && <div className="pt-6"><SimuladosCarousel /></div>}

            {/* Seções que ficam sempre visíveis abaixo */}
            <div className="px-2 space-y-6 mt-6">
              <LivroDoDiaHomeSection userName={userName} />
            </div>
          </div>

        <LazyTab visible={mainTab === 'leis'} className="px-2 space-y-6">
          <MobileLeisHome navigate={gatedNavigate} />
        </LazyTab>

        <LazyTab visible={mainTab === 'juriflix'}>
            <JuriflixHomeSection />
        </LazyTab>

        <LazyTab visible={mainTab === 'blogger'}>
            <LegislacaoHomeSection />
        </LazyTab>
      </div>
      )}

      {/* ===== Desktop Layout ===== */}
      {isDesktop && (
      <div className="flex-1 py-3 xl:py-4 2xl:py-5 relative bg-[hsl(0,0%,8%)]" style={{ zIndex: 2, zoom: '90%' }}>
        <DotPattern className="opacity-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)]" />

        <div className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 2xl:px-10">
          {/* Estudos - Atalhos / Legislação */}
          <div className="relative z-10 mb-6">
            <HomeAtalhosSection
              onProfessora={() => setProfessoraOpen(true)}
              gatedNavigate={gatedNavigate}
              user={user}
              requireAuth={requireAuth}
              variant="desktop"
            />
          </div>

          {/* Estudos: mesmos cards do mobile */}
          <div className="relative z-10 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-accent/20 rounded-xl">
                <GraduationCap className="w-5 h-5 text-white/90" />
              </div>
              <div>
                <h2 className="text-base xl:text-lg font-bold text-foreground tracking-tight">Estudos</h2>
                <p className="text-xs text-muted-foreground">Aulas, revisões e prática</p>
              </div>
            </div>
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { titulo: "Aulas", subtitulo: "Estudos", icon: GraduationCap, route: "/aulas", capa: coverAulas },
                { titulo: "Resumos", subtitulo: "Jurídicos", icon: FileText, route: "/resumos-juridicos", capa: coverResumos },
                { titulo: "Flashcards", subtitulo: "Cards", icon: Brain, route: "/flashcards", capa: coverFlashcards },
                { titulo: "Questões", subtitulo: "Prática", icon: Target, route: "/questoes", capa: coverQuestoes },
                { titulo: "Biblioteca", subtitulo: "Livros", icon: BookOpenIcon, route: "/bibliotecas", capa: coverBiblioteca },
                { titulo: "Audioaulas", subtitulo: "Áudio", icon: Headphones, route: "/audioaulas", capa: coverAudioaulas },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.titulo}
                    onClick={() => gatedNavigate(item.route)}
                    className="group relative rounded-xl overflow-hidden border border-white/[0.08] hover:border-primary/30 transition-all duration-200 text-left cursor-pointer min-h-[120px]"
                    style={{ boxShadow: '0 8px 24px -6px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}
                  >
                    <img src={item.capa} alt={item.titulo} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                      <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]" style={{ animation: 'shinePratique 4s ease-in-out infinite' }} />
                    </div>
                    <div className="relative z-[1] h-full flex flex-col items-start justify-end p-3">
                      <div className="bg-white/15 backdrop-blur-sm p-2 rounded-xl mb-2">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-white leading-tight drop-shadow-md">{item.titulo}</h4>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conteúdo da tab ativa — CSS transitions (sem AnimatePresence) */}
          <div>
            {mainTab === 'biblioteca' && (
              <div className="relative z-10">
                <BibliotecaHomeSection navigate={gatedNavigate} />
              </div>
            )}

            {mainTab === 'estudos' && (
              <div className="relative z-10">
                {/* Portal de Vídeos (Estudos em Mídia) */}
                <PortalDeVideosSection navigate={gatedNavigate} />

                {/* Funções */}
                <div className="mt-8">
                  <DesktopHomeBannerCTA navigate={gatedNavigate} onProfessora={() => setProfessoraOpen(true)} />
                </div>

                {/* Simulados - apenas admin */}
                {isAdmin && <div className="mt-8"><SimuladosCarousel /></div>}

                {/* Grid principal de conteúdo */}
                <div className="mt-8 space-y-8 xl:space-y-10 2xl:space-y-12 min-w-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-6 items-stretch [&>*]:min-h-[400px] xl:[&>*]:min-h-[450px]">
                    <ResenhaHojeSection isDesktop={true} navigate={gatedNavigate} handleLinkHover={() => {}} hideHeader={true} />
                    <LivroDoDiaHomeSection userName={userName} hideHeader />
                  </div>
                </div>
              </div>
            )}

            {mainTab === 'leis' && (
              <div className="relative z-10">
                <DesktopVadeMecumHome />
              </div>
            )}

            {mainTab === 'juriflix' && (
              <div className="relative z-10">
                <JuriflixHomeSection />
              </div>
            )}

            {mainTab === 'blogger' && (
              <div className="relative z-10">
                <LegislacaoHomeSection />
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Header com gradiente sutil - Desktop */}
      {isDesktop && <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none h-96" />}

      <AuthRequiredDialog open={isAuthDialogOpen} onOpenChange={closeAuthDialog} />
      <ProfessoraSheet open={professoraOpen} onClose={() => setProfessoraOpen(false)} />
    </div>
  );
};

export default Index;