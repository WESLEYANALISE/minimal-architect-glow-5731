import { ReactNode, useState, useEffect, useMemo, memo, lazy, Suspense, useCallback } from "react";
import { AtualizacaoBibliotecaNotification } from "@/components/AtualizacaoBibliotecaNotification";

import AudioMiniPlayer from "./AudioMiniPlayer";

import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { DesktopTopNav } from "./DesktopTopNav";
import { AppSidebar } from "./AppSidebar";
import { DesktopChatPanel } from "./DesktopChatPanel";
import { DesktopNewsSidebar } from "./DesktopNewsSidebar";
import { DesktopRecomendacoesSidebar } from "./DesktopRecomendacoesSidebar";
import { VideoPlaylistSidebar } from "./VideoPlaylistSidebar";
import { VideoaulasInicianteSidebar } from "./VideoaulasInicianteSidebar";
import { VideoaulasOABSidebar } from "./VideoaulasOABSidebar";
import { ResumosSidebar } from "./ResumosSidebar";
import { PageBreadcrumb } from "./PageBreadcrumb";
import { useDeviceType } from "@/hooks/use-device-type";
import { PageTransition } from "./PageTransition";
import { FloatingProfessoraDesktop } from "./FloatingProfessoraDesktop";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";

// Lazy load AulasPlaylistSidebar since it uses useCursosCache
const AulasPlaylistSidebar = lazy(() => import("./AulasPlaylistSidebar").then(m => ({ default: m.AulasPlaylistSidebar })));

import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts";

interface LayoutProps {
  children: ReactNode;
}

// Memoizar componentes pesados para evitar re-renders desnecessários
const MemoizedHeader = memo(Header);
const MemoizedBottomNav = memo(BottomNav);
const MemoizedDesktopTopNav = memo(DesktopTopNav);
const MemoizedAppSidebar = memo(AppSidebar) as React.MemoExoticComponent<typeof AppSidebar>;
const MemoizedDesktopChatPanel = memo(DesktopChatPanel);
const MemoizedDesktopNewsSidebar = memo(DesktopNewsSidebar);
const MemoizedPageBreadcrumb = memo(PageBreadcrumb);

// Delayed news sidebar — mounts 2s after page load to avoid competing with main content
const DelayedNewsSidebar = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);
  if (!show) return <div className="sticky top-0 h-screen w-72 shrink-0 border-l border-border/50 bg-background" />;
  return (
    <div className="sticky top-0 h-screen w-72 shrink-0 border-l border-border/50 bg-background">
      <MemoizedDesktopNewsSidebar />
    </div>
  );
};

// Whitelist: rotas onde o BottomNav DEVE aparecer
const SHOW_BOTTOM_NAV_ROUTES = new Set([
  "/",
  "/inicio",
  "/carreiras-juridicas",
]);

const SHOW_BOTTOM_NAV_PREFIXES = [
  "/carreiras-juridicas/",
];

const HIDE_HEADER_ROUTES = new Set([
  "/professora",
  "/chat-professora",
  "/evelyn",
  "/explicacao-artigo",
  "/primeiros-passos",
]);

const HIDE_HEADER_PREFIXES = [
  "/resumo-do-dia",
  "/aulas-em-tela/",
];

// Helper function to check if path matches prefixes
const matchesPrefixes = (path: string, prefixes: string[]) => 
  prefixes.some(prefix => path.startsWith(prefix));

// Helper function to check library routes
const isLibraryBookRoute = (path: string) => 
  /\/biblioteca-(estudos|classicos|oab|oratoria|lideranca|fora-da-toga)\/\d+/.test(path);

const isSimuladoResolverRoute = (path: string) =>
  path.includes("/ferramentas/simulados/") && path.includes("/resolver");

const isEscreventeRoute = (path: string) =>
  /\/ferramentas\/simulados\/escrevente\/\d+/.test(path);

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, isTablet, isDesktop } = useDeviceType();
  const { user } = useAuth();
  const [professoraModalOpen, setProfessoraModalOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(isDesktop);

  // Atalhos de teclado globais para desktop
  useGlobalKeyboardShortcuts();

  // Ouvir eventos de abertura/fechamento do modal da professora
  useEffect(() => {
    const handleOpen = () => setProfessoraModalOpen(true);
    const handleClose = () => setProfessoraModalOpen(false);

    window.addEventListener('professora-modal-open', handleOpen);
    window.addEventListener('professora-modal-close', handleClose);

    return () => {
      window.removeEventListener('professora-modal-open', handleOpen);
      window.removeEventListener('professora-modal-close', handleClose);
    };
  }, []);

  // Escutar toggle do menu hamburger desktop
  useEffect(() => {
    const handleToggle = () => setDesktopSidebarOpen(prev => !prev);
    window.addEventListener('toggle-desktop-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-desktop-sidebar', handleToggle);
  }, []);

  // Detectar se está na view de videoaula iniciante
  const videoaulaInicianteMatch = location.pathname.match(/^\/videoaulas\/iniciante\/([^/]+)$/);
  const isVideoaulaInicianteView = !!videoaulaInicianteMatch;
  const videoaulaInicianteId = videoaulaInicianteMatch ? videoaulaInicianteMatch[1] : '';

  // Detectar se está na view de videoaula OAB
  const videoaulaOABMatch = location.pathname.match(/^\/videoaulas\/oab\/([^/]+)\/([^/]+)$/);
  const isVideoaulaOABView = !!videoaulaOABMatch;
  const videoaulaOABArea = videoaulaOABMatch ? decodeURIComponent(videoaulaOABMatch[1]) : '';
  const videoaulaOABId = videoaulaOABMatch ? videoaulaOABMatch[2] : '';

  // Detectar se deve mostrar sidebar de playlists
  const isVideoPlayer = location.pathname === '/videoaulas/player';
  const isResumoView = location.pathname.includes('/resumos-juridicos/prontos/') && 
                       location.pathname.split('/').length > 4;
  
  // Detectar se está na view de aula individual
  const aulaMatch = location.pathname.match(/^\/iniciando-direito\/([^/]+)\/([^/]+)$/);
  const isAulaView = !!aulaMatch;
  const aulaArea = aulaMatch ? decodeURIComponent(aulaMatch[1]) : '';
  const aulaTema = aulaMatch ? decodeURIComponent(aulaMatch[2]) : '';

  // Memoizar cálculo de layout
  const layout = useMemo(() => {
    const path = location.pathname;
    
    // Página inicial - sidebar + notícias (não chat)
    if (path === '/' || path === '/inicio') {
      return { 
        showLeftSidebar: false,
        rightPanelType: 'news' as const,
        contentMaxWidth: 'max-w-full',
        noPadding: true
      };
    }
    
    // Vade Mecum e Códigos - Layout full-width (sem sidebars, sem padding para 3-column layout)
    if (path === '/vade-mecum' || 
        path === '/vade-mecum/sobre' ||
        path.startsWith('/codigo/') || 
        path === '/codigos' || 
        path === '/constituicao' ||
        path === '/estatutos' ||
        path.startsWith('/estatuto/') ||
        path === '/sumulas' ||
        path.startsWith('/sumula/') ||
        path.startsWith('/lei-penal/') ||
        path.startsWith('/lei-')) {
      // Páginas de visualização de artigos: esconder sidebar principal do app
      const isLawViewPage = path.startsWith('/codigo/') || 
                            path === '/constituicao' || 
                            path.startsWith('/estatuto/') ||
                            path.startsWith('/sumula/') ||
                            path.startsWith('/lei-penal/') ||
                            path.startsWith('/lei-');
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'w-full',
        noPadding: true,
        hideMainSidebar: isLawViewPage
      };
    }
    
    // Página principal de ferramentas - SEM sidebars
    if (path === '/ferramentas') {
      return { 
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-7xl'
      };
    }
    
    // Subpáginas de ferramentas - Layout focado SEM sidebars
    if (path.startsWith('/ferramentas/')) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Simulados - Layout focado sem chat
    if (path.startsWith('/simulados')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Cursos página inicial - com sidebar
    if (path === '/cursos') {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-full px-6'
      };
    }
    
    // Videoaulas lista - Layout centralizado SEM sidebar
    if (path === '/videoaulas/iniciante' || 
        path === '/videoaulas-oab' ||
        path.match(/^\/videoaulas\/oab\/[^/]+$/) ||
        (path.startsWith('/videoaulas') && !path.match(/^\/videoaulas\/iniciante\/[^/]+$/) && !path.match(/^\/videoaulas\/oab\/[^/]+\/[^/]+$/)) ||
        path.startsWith('/cursos/') ||
        path.startsWith('/iniciando-direito')) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Videoaula iniciante view - COM sidebar de playlist
    if (isVideoaulaInicianteView) {
      return {
        showLeftSidebar: true,
        showVideoaulaInicianteSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Videoaula OAB view - COM sidebar de playlist
    if (isVideoaulaOABView) {
      return {
        showLeftSidebar: true,
        showVideoaulaOABSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Audioaulas - Layout focado
    if (path.startsWith('/audioaulas')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Flashcards - Layout focado
    if (path.startsWith('/flashcards')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Mapas Mentais - Layout focado
    if (path.startsWith('/mapa-mental')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Plano de Estudos - Layout focado
    if (path === '/plano-estudos') {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Bibliotecas - Layout focado para leitura
    if (path.startsWith('/biblioteca') || path === '/bibliotecas') {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-6xl'
      };
    }
    
    // OAB - Layout focado
    if (path.startsWith('/oab')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Resumos Jurídicos - Layout focado
    if (path.startsWith('/resumos-juridicos')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Novas Leis (lista com sidebar próprio) - sem sidebar do app, sem chat
    if (path === '/novas-leis') {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-full px-6'
      };
    }
    
    // Novas Leis (detalhes) - Layout focado sem sidebars
    if (path.match(/^\/novas-leis\/[^/]+$/)) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Resumo do Dia / Boletim Jurídico - Layout focado centralizado
    if (path.startsWith('/resumo-do-dia')) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-4xl'
      };
    }
    
    // Admin - Layout fullscreen sem sidebars
    if (path.startsWith('/admin')) {
      return {
        showLeftSidebar: false,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-full px-6'
      };
    }
    
    // Notícias - layout mais largo sem painel direito
    if (path === '/noticias-juridicas' || path.startsWith('/noticias-juridicas/')) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-full px-6'
      };
    }

    // Novidades - centralizado
    if (path === '/novidades') {
      return {
        showLeftSidebar: true,
        rightPanelType: 'chat' as const,
        contentMaxWidth: 'max-w-5xl'
      };
    }
    
    // Aula individual - sidebar de aulas, sem chat
    if (isAulaView) {
      return {
        showLeftSidebar: true,
        rightPanelType: false as const,
        contentMaxWidth: 'max-w-6xl'
      };
    }
    
    // Default: sidebar + chat
    return { 
      showLeftSidebar: true,
      rightPanelType: 'chat' as const,
      contentMaxWidth: 'max-w-7xl'
    };
  }, [location.pathname, isAulaView, isVideoaulaInicianteView, isVideoaulaOABView]);

  // Memoizar verificação de breadcrumb
  const hideBreadcrumb = useMemo(() => 
    location.pathname === '/' ||
    location.pathname === '/inicio' ||
    location.pathname.startsWith('/resumo-do-dia') ||
    location.pathname.startsWith('/videoaulas-player') ||
    location.pathname.startsWith('/videoaulas/iniciante') ||
    location.pathname.startsWith('/videoaulas/areas') ||
    location.pathname.startsWith('/videoaulas-oab') ||
    location.pathname.startsWith('/novas-leis') ||
    location.pathname.startsWith('/politica/artigo') ||
    location.pathname.startsWith('/politica/estudos') ||
    location.pathname === '/ferramentas/questoes' ||
    location.pathname === '/ferramentas/questoes/temas' ||
    location.pathname === '/ferramentas/questoes/modo' ||
    location.pathname.startsWith('/ferramentas/questoes/resolver') ||
    location.pathname.startsWith('/arsenal') ||
    location.pathname.startsWith('/ferramentas/documentarios-juridicos') ||
    location.pathname === '/documentarios' ||
    location.pathname.startsWith('/tribuna') ||
    location.pathname.startsWith('/vade-mecum/raio-x') ||
    location.pathname.startsWith('/vade-mecum-jurisprudencia') ||
    location.pathname.startsWith('/admin'),
  [location.pathname]);

  // Estado para ocultar sidebars via eventos (home page tabs expandidas)
  const [forceHideSidebars, setForceHideSidebars] = useState(false);

  // Listener para eventos de controle das sidebars (usado pela página inicial)
  useEffect(() => {
    const handleHide = () => setForceHideSidebars(true);
    const handleShow = () => setForceHideSidebars(false);
    
    window.addEventListener('hide-desktop-sidebars', handleHide);
    window.addEventListener('show-desktop-sidebars', handleShow);
    
    return () => {
      window.removeEventListener('hide-desktop-sidebars', handleHide);
      window.removeEventListener('show-desktop-sidebars', handleShow);
    };
  }, []);
  
  // Trial status for hiding bottom nav on videoaulas
  const { trialExpired } = useTrialStatus();
  const { isPremium } = useSubscription();
  const isTrialExpiredUser = trialExpired && !isPremium;

  // Esconder BottomNav - whitelist approach: só mostra em rotas específicas
  const hideBottomNav = useMemo(() => {
    const path = location.pathname;
    
    // Se trial expirou e está em videoaulas, esconder o menu
    if (isTrialExpiredUser && path.startsWith('/videoaulas')) {
      return true;
    }

    // Esconder na página de pesquisa
    if (path === '/pesquisar' || path.startsWith('/pesquisar/')) {
      return true;
    }
    
    // Mostrar apenas nas rotas da whitelist
    const shouldShow = 
      SHOW_BOTTOM_NAV_ROUTES.has(path) ||
      matchesPrefixes(path, SHOW_BOTTOM_NAV_PREFIXES);
    
    return !shouldShow;
  }, [location.pathname, isTrialExpiredUser]);
  
  // Esconder Header
  const hideHeader = useMemo(() => {
    const path = location.pathname;
    return HIDE_HEADER_ROUTES.has(path) || matchesPrefixes(path, HIDE_HEADER_PREFIXES);
  }, [location.pathname]);

  const isHomePage = location.pathname === '/inicio' || location.pathname === '/';

  // Flag para esconder sidebar principal em todas as páginas exceto home
  const hideMainSidebar = !isHomePage;

  // Derive page title from route for back bar
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/resumos-juridicos': 'Resumos Jurídicos',
      '/flashcards': 'Flashcards',
      '/ferramentas': 'Ferramentas',
      '/bibliotecas': 'Bibliotecas',
      '/audioaulas': 'Audioaulas',
      '/videoaulas': 'Videoaulas',
      '/mapa-mental': 'Mapas Mentais',
      '/plano-estudos': 'Plano de Estudos',
      '/noticias-juridicas': 'Notícias Jurídicas',
      '/novidades': 'Novidades',
      '/cursos': 'Cursos',
      '/estudos': 'Estudos',
      '/vade-mecum': 'Vade Mecum',
      '/constituicao': 'Constituição Federal',
      '/codigos': 'Códigos',
      '/estatutos': 'Estatutos',
      '/sumulas': 'Súmulas',
      '/dominando': 'Dominando o Direito',
      '/aulas': 'Aulas',
    };
    for (const [route, title] of Object.entries(titles)) {
      if (path === route || path.startsWith(route + '/')) return title;
    }
    if (path.startsWith('/oab')) return 'OAB';
    if (path.startsWith('/biblioteca')) return 'Biblioteca';
    if (path.startsWith('/codigo/')) return 'Código';
    if (path.startsWith('/estatuto/')) return 'Estatuto';
    if (path.startsWith('/sumula/')) return 'Súmula';
    if (path.startsWith('/ferramentas/')) return 'Ferramentas';
    if (path.startsWith('/admin')) return 'Administração';
    return 'Direito Prime';
  }, [location.pathname]);

  // Simulado resolver — fullscreen, sem header/footer/padding
  if (isSimuladoResolverRoute(location.pathname) || isEscreventeRoute(location.pathname)) {
    return <>{children}</>;
  }

  // DESKTOP LAYOUT (>= 1024px)
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AtualizacaoBibliotecaNotification />
        <MemoizedDesktopTopNav />

        {/* Breadcrumb global — visível fora da home, sempre no topo */}
        {!hideBreadcrumb && !hideMainSidebar && <MemoizedPageBreadcrumb />}


        <div className="flex w-full">
          {/* Sidebar inline no desktop — escondida em todas as funções */}
          {!hideMainSidebar && (
            <aside
              className={`flex-shrink-0 sticky top-0 overflow-hidden border-r border-border/50 transition-all duration-300 ease-in-out z-20 ${
                desktopSidebarOpen ? 'w-64 xl:w-72' : 'w-[60px]'
              }`}
              style={{ backgroundColor: 'hsl(0, 0%, 7%)', height: '100vh' }}
            >
              <div className={`${desktopSidebarOpen ? 'w-64 xl:w-72' : 'w-[60px]'} h-full overflow-y-auto overflow-x-hidden`} style={{ backgroundColor: 'hsl(0, 0%, 7%)' }}>
                <MemoizedAppSidebar collapsed={!desktopSidebarOpen} onToggle={() => setDesktopSidebarOpen(prev => !prev)} />
              </div>
            </aside>
          )}
        
          {/* Sidebars contextuais (vídeo, resumo, aula) - inline */}
          {layout.showLeftSidebar && !forceHideSidebars && (
            (() => {
              const contextualSidebar = isVideoPlayer ? (
                <VideoPlaylistSidebar />
              ) : isResumoView ? (
                <ResumosSidebar />
              ) : isAulaView ? (
                <Suspense fallback={<div className="w-64 h-screen bg-background" />}>
                  <AulasPlaylistSidebar 
                    area={aulaArea}
                    aulaAtual={aulaTema}
                  />
                </Suspense>
              ) : (layout as any).showVideoaulaInicianteSidebar ? (
                <VideoaulasInicianteSidebar aulaAtualId={videoaulaInicianteId} />
              ) : (layout as any).showVideoaulaOABSidebar ? (
                <VideoaulasOABSidebar area={videoaulaOABArea} aulaAtualId={videoaulaOABId} />
              ) : null;

              return contextualSidebar ? (
                <div className={`flex-shrink-0 ${((layout as any).showVideoaulaInicianteSidebar || (layout as any).showVideoaulaOABSidebar) ? 'w-72' : 'w-56'}`}>
                  {contextualSidebar}
                </div>
              ) : null;
            })()
          )}

          {/* Conteúdo Central */}
          <main className="flex-1 min-w-0 min-h-screen overflow-hidden">
            <div className={`${hideMainSidebar ? 'max-w-[1400px]' : layout.contentMaxWidth} mx-auto ${(layout as any).noPadding && !hideMainSidebar ? '' : 'px-6 lg:px-10'}`}>
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>

          {/* Painel Direito - FIXO — só na home, com delay de 2s */}
          {!hideMainSidebar && (layout.rightPanelType as string) === 'news' && !professoraModalOpen && !forceHideSidebars && (
            <div className="sticky top-0 h-screen w-72 shrink-0 border-l border-border/50 bg-background">
              <MemoizedDesktopNewsSidebar />
            </div>
          )}
        </div>

        {/* Professora flutuante */}
        <FloatingProfessoraDesktop />
      </div>
    );
  }

  // TABLET LAYOUT (640px - 1024px)
  if (isTablet) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <AtualizacaoBibliotecaNotification />
      {!hideHeader && <MemoizedHeader />}
      <main className={`${hideBottomNav ? "flex-1 w-full max-w-5xl mx-auto px-4" : "flex-1 pb-28 w-full max-w-5xl mx-auto px-4"} overflow-x-hidden`}>
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        {!hideBottomNav && <MemoizedBottomNav />}
      </div>
    );
  }
  
  // MOBILE LAYOUT (< 640px)
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <AtualizacaoBibliotecaNotification />
      {!hideHeader && <MemoizedHeader />}
      <main className={`${hideBottomNav ? "flex-1 w-full max-w-7xl mx-auto" : "flex-1 pb-28 w-full max-w-7xl mx-auto"} overflow-x-hidden`}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      {!hideBottomNav && <MemoizedBottomNav />}
      <AudioMiniPlayer />
    </div>
  );
};
