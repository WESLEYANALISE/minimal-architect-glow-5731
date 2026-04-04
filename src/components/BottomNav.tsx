import { useNavigate, useLocation } from "react-router-dom";
import { startTransition } from "react";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
import { Menu, Bell, Newspaper, Scale, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { useState } from "react";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { NovidadesSheet } from "./NovidadesSheet";
import { FerramentasSheet } from "./FerramentasSheet";
import { useNotificacoesApp } from "@/hooks/useNotificacoesApp";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isNative } = useCapacitorPlatform();
  const { isAuthenticated, isAuthDialogOpen, closeAuthDialog, requireAuth } = useRequireAuth();
  const [isNovidadesOpen, setIsNovidadesOpen] = useState(false);
  const [isFerramentasOpen, setIsFerramentasOpen] = useState(false);
  const { naoLidas: notifNaoLidas } = useNotificacoesApp();
  const { onTouchStart: prefetchOnTouch } = usePrefetchRoute();
  const isActive = (path: string) => location.pathname === path;
  
  if (location.pathname.startsWith('/ferramentas/questoes') || location.pathname === '/assinatura' || (location.pathname === '/' && !isAuthenticated)) {
    return null;
  }
  
  const handleNovidadesClick = () => {
    requireAuth(() => setIsNovidadesOpen(true));
  };

  const handleProfessoraClick = () => {
    requireAuth(() => startTransition(() => navigate('/chat-professora')));
  };

  const handleFerramentasClick = () => {
    requireAuth(() => setIsFerramentasOpen(true));
  };

  return (
    <>
    <nav 
      data-footer="main"
      data-bottom-nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-rose-900/30 bg-gradient-to-t from-[hsl(345,45%,5%)] via-[hsl(348,42%,7%)]/90 to-[hsl(350,40%,8%)]/80 backdrop-blur-md rounded-t-2xl transition-all duration-400 shadow-[0_-8px_30px_rgba(0,0,0,0.6),0_-2px_10px_rgba(0,0,0,0.4)]",
        isNative && "pb-safe"
      )}
      style={isNative ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
    >
      <div className="max-w-2xl mx-auto px-2 py-2">
        <div className="grid grid-cols-5 items-end">
          {/* Ferramentas */}
          <button
            onClick={handleFerramentasClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all nav-item-tap",
              isFerramentasOpen
                ? "text-white bg-white/15 ring-1 ring-white/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Wrench className={cn("w-6 h-6 transition-transform", isFerramentasOpen && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Ferramentas</span>
          </button>

          {/* Notícias */}
          <button
            onClick={() => requireAuth(() => startTransition(() => navigate('/noticias-juridicas')))}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all nav-item-tap",
              location.pathname === '/noticias-juridicas'
                ? "text-white bg-white/15 ring-1 ring-white/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Newspaper className={cn("w-6 h-6 transition-transform", location.pathname === '/noticias-juridicas' && "scale-110")} />
            <span className="text-[10px] font-medium leading-tight text-center">Notícias</span>
          </button>

          {/* Botão Central Professora - Elevado */}
          <div className="flex flex-col items-center -mt-6">
            <button
              onClick={handleProfessoraClick}
              className="btn-shine w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(350,50%,35%)] to-[hsl(345,45%,25%)] shadow-[0_6px_20px_rgba(190,50,70,0.4)] hover:shadow-[0_10px_30px_rgba(190,50,70,0.5)] hover:scale-105 active:scale-90 transition-all duration-300 flex items-center justify-center"
            >
              <Scale className="w-7 h-7 text-primary-foreground relative z-10" />
            </button>
            <span className="text-[10px] font-medium text-white mt-1">Professora</span>
          </div>

          {/* Novidades */}
          <button
            onClick={handleNovidadesClick}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all nav-item-tap",
              isActive("/novidades")
                ? "text-white bg-white/15 ring-1 ring-white/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <div className="relative inline-flex">
              <Bell className={cn("w-6 h-6 transition-transform", isActive("/novidades") && "scale-110")} />
              {notifNaoLidas > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold px-0.5 animate-scale-in pointer-events-none">
                  {notifNaoLidas}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-tight text-center">Novidades</span>
          </button>

          {/* Menu */}
          {isAuthenticated ? (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all nav-item-tap",
                    "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Menu className="w-6 h-6 transition-transform" />
                  <span className="text-[10px] font-medium leading-tight">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm p-0">
                <AppSidebar onClose={() => setIsMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          ) : (
            <button
              onClick={() => requireAuth(() => {})}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all nav-item-tap",
                "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Menu className="w-6 h-6 transition-transform" />
              <span className="text-[10px] font-medium leading-tight">Menu</span>
            </button>
          )}
        </div>
      </div>
    </nav>
    <AuthRequiredDialog open={isAuthDialogOpen} onOpenChange={closeAuthDialog} />
    <NovidadesSheet open={isNovidadesOpen} onClose={() => setIsNovidadesOpen(false)} />
    <FerramentasSheet open={isFerramentasOpen} onClose={() => setIsFerramentasOpen(false)} />
    </>
  );
};
