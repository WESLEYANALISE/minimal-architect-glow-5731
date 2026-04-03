import { useNavigate, useLocation } from "react-router-dom";
import { Library, GraduationCap, Scale, Brain, Target, ArrowLeft } from "lucide-react";
import { DesktopAuthButtons } from "@/components/DesktopAuthButtons";
import { Spotlight } from "@/components/ui/spotlight";
import logoDireitoPremium from '@/assets/logo-direito-premium-new.webp';

const TABS = [
  { id: 'estudos', icon: GraduationCap, label: 'Estudos', route: null },
  { id: 'biblioteca', icon: Library, label: 'Biblioteca', route: '/bibliotecas' },
  { id: 'leis', icon: Scale, label: 'Legislação', route: '/vade-mecum' },
  { id: 'flashcards', icon: Brain, label: 'Flashcards', route: '/flashcards' },
  { id: 'questoes', icon: Target, label: 'Questões', route: '/questoes' },
] as const;

export const DesktopTopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/inicio';

  const handleTabClick = (tab: typeof TABS[number]) => {
    if (tab.route) {
      navigate(tab.route);
    } else {
      if (!isHome) navigate('/inicio');
    }
  };

  const getActiveTab = () => {
    if (location.pathname.startsWith('/bibliotecas')) return 'biblioteca';
    if (location.pathname.startsWith('/vade-mecum')) return 'leis';
    if (location.pathname.startsWith('/flashcards')) return 'flashcards';
    if (location.pathname.startsWith('/questoes')) return 'questoes';
    if (isHome) return 'estudos';
    return null;
  };

  const activeTab = getActiveTab();

  return (
    <header className="w-full relative z-10">
      <div className="relative h-[4.5rem] overflow-hidden bg-[hsl(0,5%,6%)] border-b border-[hsl(0,10%,15%)]/50">
        {/* Spotlight effect */}
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="hsl(var(--primary))" />

        {/* Shine effect on header */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-[-20deg]"
            style={{ animation: 'searchShine 8s ease-in-out infinite' }}
          />
        </div>

        <div className="relative h-full max-w-screen-2xl mx-auto px-4 lg:px-8 flex items-center gap-6">
          {/* Logo ou Voltar à esquerda */}
          {isHome ? (
            <button onClick={() => navigate('/inicio')} className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={logoDireitoPremium} alt="Direito Prime" className="w-9 h-9 rounded-full object-contain shadow-lg ring-1 ring-white/10" />
              <span className="text-sm font-bold text-white/90 tracking-wide hidden xl:block">Direito Prime</span>
            </button>
          ) : (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 flex-shrink-0 cursor-pointer text-white/70 hover:text-white transition-colors"
            >
              <div className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium hidden xl:block">Voltar</span>
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Tabs centralizadas — sempre visíveis */}
          <nav className="flex items-center gap-1.5 xl:gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`relative flex items-center gap-2 px-4 xl:px-5 2xl:px-6 py-2 xl:py-2.5 rounded-full text-xs xl:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer overflow-hidden ${
                    isActive
                      ? 'bg-white/15 text-white shadow-lg shadow-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {/* Shine on active tab */}
                  {isActive && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                      <div
                        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]"
                        style={{ animation: 'searchShine 4s ease-in-out infinite' }}
                      />
                    </div>
                  )}
                  <Icon className="w-4 h-4 xl:w-[18px] xl:h-[18px] relative z-[1]" />
                  <span className="relative z-[1]">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Auth buttons à direita */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <DesktopAuthButtons />
          </div>
        </div>
      </div>
    </header>
  );
};
