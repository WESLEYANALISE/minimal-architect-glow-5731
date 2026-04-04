import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SupportSheet } from "./SupportSheet";
import { 
  Crown, 
  BookOpen, 
  Video,
  Library,
  Film,
  BookText,
  FileCheck2,
  ClipboardCheck,
  User,
  Settings,
  Star,
  LogOut,
  HelpCircle,
  Newspaper,
  Trophy,
  Camera,
  Brain,
  Wifi,
  Search,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
  ChevronRight,
  ScrollText,
  Scale,
  Headphones,
  Clapperboard,
  GraduationCap,
  Mic,
  BookMarked,
  Gavel,
  CalendarDays,
} from "lucide-react";

const FRASES_PERSUASIVAS = [
  "Quem investe em conhecimento nunca perde.",
  "Seu futuro depende do que você faz hoje.",
  "Os melhores não esperam. Eles se preparam.",
  "Cada minuto de estudo é um passo rumo à aprovação.",
  "O sucesso no Direito começa com dedicação diária.",
  "Não deixe para amanhã o que pode te aprovar hoje.",
  "A diferença entre passar e reprovar está no preparo.",
  "Grandes advogados foram, antes, grandes estudantes.",
  "Invista em você. O retorno é garantido.",
  "Conhecimento é o único bem que ninguém pode tirar de você.",
];

const FRASES_MOTIVACIONAIS = [
  "Você já está um passo à frente. Continue!",
  "Disciplina hoje, vitória amanhã.",
  "A elite do Direito se constrói com constância.",
  "Você faz parte dos que não se contentam com o básico.",
  "Seu compromisso com o estudo é admirável. Siga firme!",
  "Cada dia de estudo te aproxima da excelência.",
  "Você escolheu ser diferente. Isso já é vencer.",
  "O conhecimento que você constrói hoje é eterno.",
  "Parabéns por investir no seu futuro jurídico!",
  "Consistência é o segredo dos aprovados. Você tem isso.",
];

import { toast } from "sonner";

const ADMIN_EMAIL = "wn7corporation@gmail.com";
import { cn } from "@/lib/utils";
import { ProfessoraChatDesktop } from "./ProfessoraChatDesktop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useExternalBrowser } from "@/hooks/use-external-browser";
import { useCapacitorPlatform } from "@/hooks/use-capacitor-platform";
import { useDeviceType } from "@/hooks/use-device-type";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { ScrollArea } from "@/components/ui/scroll-area";
import logoDireitoPremium from '@/assets/logo-direito-premium-new.png?format=webp&quality=80';
import SearchBarAnimatedText from '@/components/SearchBarAnimatedText';

const APP_STORE_URL = "https://apps.apple.com/id/app/direito-conte%C3%BAdo-jur%C3%ADdico/id6450845861";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=br.com.app.gpu2675756.gpu0e7509bfb7bde52aef412888bb17a456";

const WhatsAppIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface AppSidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}


export const AppSidebar = ({ onClose, collapsed = false, onToggle }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isPremium, subscription, loading: subLoading } = useSubscription();
  const { isAuthDialogOpen, closeAuthDialog, requireAuth } = useRequireAuth();
  const { trialDaysLeft, loading: trialLoading } = useTrialStatus();
  const statusResolved = !subLoading && !trialLoading;
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [professoraModalOpen, setProfessoraModalOpen] = useState(false);
  const [supportSheetOpen, setSupportSheetOpen] = useState(false);
  const [fraseSidebar] = useState(() => {
    const lista = isPremium ? FRASES_MOTIVACIONAIS : FRASES_PERSUASIVAS;
    return lista[Math.floor(Math.random() * lista.length)];
  });
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const adminClickRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null });
  const { openUrl } = useExternalBrowser();
  const { isIOS, isAndroid } = useCapacitorPlatform();
  const { isDesktop } = useDeviceType();

  const getStoreUrl = () => {
    if (isIOS) return APP_STORE_URL;
    if (isAndroid) return PLAY_STORE_URL;
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) ? APP_STORE_URL : PLAY_STORE_URL;
  };

  const handleShareWhatsApp = async () => {
    const storeUrl = getStoreUrl();
    const shareText = `📚 Conheça o app *Direito - Conteúdo Jurídico*!\n\nVade Mecum, Resumos, Flashcards, Questões e muito mais — tudo grátis.\n\n👉 Baixe agora: ${storeUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    onClose?.();
  };

  const handleRateApp = async () => {
    const storeUrl = getStoreUrl();
    await openUrl(storeUrl);
  };

  const { data: profileData } = useQuery({
    queryKey: ['sidebar-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles')
        .select('nome, avatar_url')
        .eq('id', user!.id).single();
      return data;
    },
    enabled: !!user,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
  });

  const avatarUrl = profileData?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const profileName = profileData?.nome || null;

  const isActive = (path: string) => {
    const [pathname, query] = path.split('?');
    if (query) {
      return location.pathname === pathname && location.search.includes(query);
    }
    return location.pathname === pathname;
  };

  const displayName = profileName || user?.user_metadata?.name || user?.user_metadata?.full_name || user?.user_metadata?.display_name || 'Usuário';
  const userEmail = user?.email || '';
  const initials = displayName.substring(0, 2).toUpperCase();

  const getPlanLabel = () => {
    if (!isPremium) return "Gratuito";
    const planType = subscription?.planType;
    if (planType === 'vitalicio') return "Vitalício";
    if (planType === 'pro') return "Pro";
    if (planType === 'essencial') return "Essencial";
    return "Premium";
  };

  const getPlanBadgeStyle = () => {
    if (!isPremium) return "bg-muted/80 text-muted-foreground";
    const planType = subscription?.planType;
    if (planType === 'vitalicio') return "bg-amber-500/20 text-amber-400";
    if (planType === 'pro') return "bg-violet-500/20 text-violet-400";
    if (planType === 'essencial') return "bg-indigo-500/20 text-indigo-400";
    return "bg-amber-500/20 text-amber-400";
  };

  const getAvatarRingColor = () => {
    if (!isPremium) return "ring-muted-foreground/30";
    const planType = subscription?.planType;
    if (planType === 'vitalicio') return "ring-amber-500";
    if (planType === 'pro') return "ring-violet-500";
    if (planType === 'essencial') return "ring-indigo-500";
    return "ring-amber-500";
  };


  const allSectionsMobile = [
    {
      label: 'Vade Mecum',
      icon: BookOpen,
      path: "/vade-mecum",
    },
    {
      label: 'Aulas',
      icon: Video,
      path: "/aulas-em-tela",
    },
    {
      label: 'Resumos',
      icon: FileCheck2,
      path: "/resumos-juridicos",
    },
    {
      label: 'Questões',
      icon: ClipboardCheck,
      path: "/ferramentas/questoes",
    },
    {
      label: 'Biblioteca',
      icon: Library,
      path: "/bibliotecas",
    },
    {
      label: 'Audioaulas',
      icon: Mic,
      path: "/audioaulas",
    },
    {
      label: 'Estudos em Mídia',
      icon: Film,
      path: "/ferramentas/documentarios-juridicos",
    },
    {
      label: 'Simulados',
      icon: Trophy,
      path: "/ferramentas/simulados",
    },
    {
      label: 'Recomendação do Dia',
      icon: Star,
      path: "/recomendacao-do-dia",
    },
    {
      label: 'Evelyn',
      icon: Brain,
      path: "/evelyn",
    },
    {
      label: 'Documentário',
      icon: Camera,
      path: "/ferramentas/documentarios-juridicos",
    },
    {
      label: 'Dicionário',
      icon: Search,
      path: "/ferramentas/dicionario-juridico",
    },
    {
      label: 'Boletins',
      icon: Newspaper,
      path: "/ferramentas/boletins",
    },
    ...(isAdmin ? [{
      label: 'Administração',
      icon: Settings,
      iconColor: "text-emerald-500",
      path: "/admin",
    }] : []),
  ];

  const allSectionsDesktop = [
    {
      label: 'Professora IA',
      icon: MessageCircle,
      path: "/chat-professora",
      highlight: true,
    },
    {
      label: 'Vade Mecum',
      icon: BookOpen,
      path: "/vade-mecum",
    },
    {
      label: 'Leis do Dia',
      icon: CalendarDays,
      path: "/leis-do-dia",
    },
    {
      label: 'Simulados',
      icon: Trophy,
      path: "/ferramentas/simulados",
    },
    {
      label: 'Recomendação do Dia',
      icon: Star,
      path: "/recomendacao-do-dia",
    },
    {
      label: 'Evelyn',
      icon: Brain,
      path: "/evelyn",
    },
    {
      label: 'Juriflix',
      icon: Clapperboard,
      path: "/ferramentas/documentarios-juridicos",
    },
    // Bibliotecas
    {
      label: 'Biblioteca Estudos',
      icon: GraduationCap,
      path: "/bibliotecas?tab=estudos",
    },
    {
      label: 'Biblioteca Clássicos',
      icon: BookMarked,
      path: "/bibliotecas?tab=classicos",
    },
    {
      label: 'Biblioteca OAB',
      icon: Gavel,
      path: "/bibliotecas?tab=oab",
    },
    {
      label: 'Biblioteca Português',
      icon: BookText,
      path: "/bibliotecas?tab=portugues",
    },
    {
      label: 'Biblioteca Oratória',
      icon: Mic,
      path: "/bibliotecas?tab=oratoria",
    },
    {
      label: 'Biblioteca Pesquisa',
      icon: Scale,
      path: "/bibliotecas?tab=pesquisa",
    },
    {
      label: 'Audioaulas',
      icon: Headphones,
      path: "/audioaulas",
    },
    {
      label: 'Dicionário',
      icon: Search,
      path: "/ferramentas/dicionario-juridico",
    },
    {
      label: 'Boletins',
      icon: Newspaper,
      path: "/ferramentas/boletins",
    },
    {
      label: 'Ferramentas',
      icon: Settings,
      path: "/ferramentas",
    },
    ...(isAdmin ? [{
      label: 'Administração',
      icon: Settings,
      iconColor: "text-emerald-500",
      path: "/admin",
    }] : []),
  ];

  const allSections = isDesktop ? allSectionsDesktop : allSectionsMobile;

  const handleAvatarClick = () => {
    if (!isAdmin) return;
    const ref = adminClickRef.current;
    if (ref.timer) clearTimeout(ref.timer);
    ref.count += 1;
    if (ref.count >= 3) {
      ref.count = 0;
      setAdminUnlocked(prev => !prev);
      toast(adminUnlocked ? '🔒 Admin ocultado' : '🔓 Admin desbloqueado', { duration: 1500 });
    }
    ref.timer = setTimeout(() => { ref.count = 0; }, 600);
  };

  const handleSignOut = async () => {
    onClose?.();
    await signOut();
    navigate('/');
  };

  const navigateTo = (path: string) => {
    if (!user) {
      requireAuth(() => { navigate(path); onClose?.(); });
    } else {
      navigate(path);
      onClose?.();
    }
  };


  const isLocked = statusResolved && !isPremium;

  return (
    <>
      <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full bg-[hsl(0,5%,6%)]">
        {/* Header — Profile area */}
        <div className={cn("flex-shrink-0", collapsed ? "p-2" : "p-4 pb-3")}>
        {isDesktop ? (
            /* Desktop: CTA Prime no topo */
            <div className="space-y-2">
              {!collapsed && statusResolved && !isPremium && (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-950/60 via-amber-900/40 to-amber-950/60 border border-amber-500/20 p-3.5">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg]" style={{ animation: 'searchShine 5s ease-in-out infinite' }} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Prime</span>
                    </div>
                    <p className="text-[12px] text-amber-100/80 leading-snug mb-2.5">
                      Acesso completo a todas as ferramentas
                    </p>
                    <button
                      onClick={() => { navigate('/assinatura'); onClose?.(); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Ver Planos
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : user ? (
            <div className="space-y-3">
              {/* Close + Profile row */}
              <div className="flex items-start gap-3">
                <Avatar onClick={handleAvatarClick} className={cn(
                  "w-12 h-12 ring-2 ring-offset-2 ring-offset-[hsl(0,40%,8%)] cursor-pointer flex-shrink-0",
                  getAvatarRingColor(),
                  adminUnlocked && isAdmin && "ring-emerald-500"
                )}>
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="bg-red-900/30 text-red-200 text-xs font-semibold">
                    {avatarUrl ? initials : <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-red-50 truncate">{displayName}</p>
                    {!isAdmin && (
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap", getPlanBadgeStyle())}>
                        {getPlanLabel()}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-red-300/40 truncate">{userEmail}</p>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 -mr-1 rounded-lg hover:bg-white/10 transition-colors text-red-200/50 hover:text-red-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Quick actions row — highlighted buttons */}
              <div className={cn("grid gap-2", isAdmin ? "grid-cols-2" : "grid-cols-3")}>
                <button
                  onClick={() => { navigate('/perfil'); onClose?.(); }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-white/10 backdrop-blur-sm text-red-100 hover:bg-white/20 transition-all active:scale-95 border border-white/5"
                >
                  <User className="w-4 h-4" />
                  Perfil
                </button>
                {!isAdmin && (
                  <button
                    onClick={() => { navigate('/assinatura'); onClose?.(); }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-amber-500/20 backdrop-blur-sm text-amber-300 hover:bg-amber-500/30 transition-all active:scale-95 border border-amber-500/20"
                  >
                    <Crown className="w-4 h-4" />
                    Planos
                  </button>
                )}
                <button
                  onClick={() => setSupportSheetOpen(true)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-white/10 backdrop-blur-sm text-red-100 hover:bg-white/20 transition-all active:scale-95 border border-white/5"
                >
                  <HelpCircle className="w-4 h-4" />
                  Suporte
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center ring-2 ring-red-400/20 ring-offset-2 ring-offset-[hsl(0,40%,8%)] flex-shrink-0">
                <User className="w-5 h-5 text-red-300/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-50">Olá, Visitante</p>
                <button
                  onClick={() => { navigate('/auth'); onClose?.(); }}
                  className="text-xs text-red-300 hover:text-red-200 hover:underline"
                >
                  Faça login ou cadastre-se
                </button>
              </div>
              {onClose && (
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-red-200/50 hover:text-red-100">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Divider — hide in collapsed and desktop mode */}
        {!collapsed && !isDesktop && (
          <div className="flex-shrink-0 px-4 pb-2">
            <div className="h-px bg-border/30 mb-2" />
            <p className={cn(
              "text-[10px] italic leading-relaxed",
              isPremium ? "text-amber-400/50" : "text-muted-foreground/50"
            )}>
              "{fraseSidebar}"
            </p>
          </div>
        )}

        {/* Scrollable navigation */}
        <ScrollArea className="flex-1">
          <div className={cn("py-1 pb-6", collapsed && "px-1")}>
            {/* CTA Premium — only on mobile (desktop shows in header) */}
            {!collapsed && !isDesktop && statusResolved && !isPremium && (
              <div className="px-3 mb-3">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-950/60 via-amber-900/40 to-amber-950/60 border border-amber-500/20 p-3.5">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Prime</span>
                    </div>
                    <p className="text-[12px] text-amber-100/80 leading-snug mb-2.5">
                      Acesso completo a todas as ferramentas
                    </p>
                    <button
                      onClick={() => { navigate('/assinatura'); onClose?.(); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Ver Planos
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* Navigation items */}
            <div className="space-y-0.5">
              {allSections.map((section) => {
                const Icon = section.icon;
                const isActive = location.pathname === section.path;
                const isHighlight = (section as any).highlight;
                return (
                  <button
                    key={section.label}
                    onClick={() => { navigate(section.path!); if (!isDesktop) onClose?.(); }}
                    className={cn(
                      "w-full flex items-center gap-3.5 rounded-xl transition-all text-[15px]",
                      collapsed ? "justify-center p-3" : "px-4 py-3",
                      isHighlight
                        ? "bg-destructive/15 text-destructive font-semibold hover:bg-destructive/25 border border-destructive/30"
                        : isActive
                          ? "bg-white/15 text-white font-medium"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0", isHighlight ? "text-destructive" : isActive ? "text-white" : "text-white/60")} />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{section.label}</span>
                        {isHighlight && <ChevronRight className="w-4 h-4 text-destructive/70 flex-shrink-0" />}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className={cn("flex-shrink-0 border-t border-border/30", collapsed ? "p-1.5" : "p-3")}>
          {isDesktop ? (
            /* Desktop: only Sair button */
            user && (
              collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center p-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Sair</TooltipContent>
                </Tooltip>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95 text-xs font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              )
            )
          ) : (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition-all active:scale-95 text-xs font-medium border border-[#25D366]/10"
                >
                  <WhatsAppIcon />
                  Compartilhar
                </button>
                <button
                  onClick={handleRateApp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-all active:scale-95 text-xs font-medium border border-amber-500/10"
                >
                  <Star className="w-4 h-4 fill-amber-400" />
                  Avaliar
                </button>
              </div>
              {user && (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-1.5 py-2 mt-1.5 rounded-xl text-red-300/40 hover:bg-red-500/10 hover:text-red-300 transition-all active:scale-95 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              )}
            </>
          )}
        </div>
      </div>
      </TooltipProvider>

      <SupportSheet open={supportSheetOpen} onOpenChange={setSupportSheetOpen} />
      <ProfessoraChatDesktop isOpen={professoraModalOpen} onClose={() => setProfessoraModalOpen(false)} />
      <AuthRequiredDialog open={isAuthDialogOpen} onOpenChange={closeAuthDialog} />
    </>
  );
};
