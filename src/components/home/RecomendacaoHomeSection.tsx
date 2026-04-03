import { memo, useState, useCallback, useRef, useMemo } from "react";
import { BookOpen, ArrowRight, Book, Crown, Zap } from "lucide-react";
import { useInstantCache } from "@/hooks/useInstantCache";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface RecomendacaoHomeSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

type TabType = 'classicos' | 'oratoria' | 'lideranca';

interface Livro {
  id: number;
  livro: string | null;
  autor: string | null;
  imagem: string | null;
}

const tabs: { id: TabType; label: string; table: string; route: string }[] = [
  { id: 'classicos', label: 'Clássicos', table: 'BIBLIOTECA-CLASSICOS', route: '/biblioteca-classicos' },
  { id: 'oratoria', label: 'Oratória', table: 'BIBLIOTECA-ORATORIA', route: '/biblioteca-oratoria' },
  { id: 'lideranca', label: 'Liderança', table: 'BIBLIOTECA-LIDERANÇA', route: '/biblioteca-lideranca' },
];

export const RecomendacaoHomeSection = memo(({ isDesktop, navigate, handleLinkHover }: RecomendacaoHomeSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('classicos');
  const [isTouching, setIsTouching] = useState(false);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { trialExpired } = useTrialStatus();
  const isLocked = !!user && !isPremium && trialExpired;

  const handleTouchStart = useCallback(() => {
    setIsTouching(true);
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    touchTimeoutRef.current = setTimeout(() => setIsTouching(false), 3000);
  }, []);

  const { data: classicosRaw, isLoading: loadingClassicos } = useInstantCache({
    cacheKey: 'recomendacao-classicos',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-CLASSICOS')
        .select('id, livro, autor, imagem')
        .order('id', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data as Livro[];
    },
    cacheDuration: 1000 * 60 * 60,
  });
  const classicos = classicosRaw || [];

  const { data: oratoriaRaw, isLoading: loadingOratoria } = useInstantCache({
    cacheKey: 'recomendacao-oratoria',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-ORATORIA')
        .select('id, livro, autor, imagem')
        .order('id', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data as Livro[];
    },
    cacheDuration: 1000 * 60 * 60,
  });
  const oratoria = oratoriaRaw || [];

  const { data: liderancaRaw, isLoading: loadingLideranca } = useInstantCache({
    cacheKey: 'recomendacao-lideranca',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BIBLIOTECA-LIDERANÇA')
        .select('id, livro, autor, imagem')
        .order('id', { ascending: true })
        .limit(12);
      if (error) throw error;
      return data as Livro[];
    },
    cacheDuration: 1000 * 60 * 60,
  });
  const lideranca = liderancaRaw || [];

  const currentData = activeTab === 'classicos' ? classicos : activeTab === 'oratoria' ? oratoria : lideranca;
  const isLoading = activeTab === 'classicos' ? loadingClassicos : activeTab === 'oratoria' ? loadingOratoria : loadingLideranca;
  const currentTab = tabs.find(t => t.id === activeTab)!;

  const loopData = useMemo(() => currentData.length > 0 ? [...currentData, ...currentData] : [], [currentData]);

  const getDetailRoute = (id: number) => {
    switch (activeTab) {
      case 'classicos': return `/biblioteca-classicos/${id}`;
      case 'oratoria': return `/biblioteca-oratoria/${id}`;
      case 'lideranca': return `/biblioteca-lideranca/${id}`;
    }
  };

  return (
    <div className="space-y-3 mt-6 relative" data-tutorial="recomendacao-section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-xl">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              Recomendação
            </h3>
            <p className="text-muted-foreground text-xs">
              Obras essenciais para você
            </p>
          </div>
        </div>

        <button
          onClick={() => !isLocked && navigate(currentTab.route)}
          onMouseEnter={() => handleLinkHover(currentTab.route)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
        >
          <span>Ver tudo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Container com gradiente */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        {/* Tabs */}
        <div className="flex items-center justify-center mb-4">
          <div className="grid grid-cols-3 gap-1 bg-red-950/60 rounded-full p-1 w-full max-w-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-2 py-2 rounded-full text-[11px] font-medium transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-white text-red-900 shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Book className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Carrossel auto-scroll */}
        {isLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="flex-shrink-0 w-28 h-44 rounded-xl" />
            ))}
          </div>
        ) : (
          <div
            className="w-full overflow-x-auto scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={`flex gap-3 ${isTouching ? '' : 'animate-[scrollLeft_60s_linear_infinite]'}`}
              style={{ width: "max-content", willChange: isTouching ? 'auto' : 'transform', transform: 'translateZ(0)' }}
            >
              {loopData.map((livro, idx) => (
                <button
                  key={`${livro.id}-${idx}`}
                  onClick={() => !isLocked && navigate(getDetailRoute(livro.id))}
                  className="flex-shrink-0 w-28 group"
                >
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-secondary mb-2 shine-effect">
                    {livro.imagem ? (
                      <img
                        src={livro.imagem}
                        alt={livro.livro || ''}
                        className={cn(
                          "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-125 contrast-110 saturate-[1.3]",
                          isLocked && "blur-[2px] brightness-50 saturate-0"
                        )}
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800/50 to-red-950">
                        <Book className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                    {/* Gradiente de título mais leve */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent h-1/3 pointer-events-none" />
                  </div>
                  <h4 className="text-xs font-medium text-white line-clamp-2 text-left group-hover:text-amber-100 transition-colors">
                    {livro.livro}
                  </h4>
                  {livro.autor && (
                    <p className="text-[10px] text-white/50 line-clamp-1 text-left mt-0.5">
                      {livro.autor}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Premium overlay when locked */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-3 rounded-3xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <p className="text-white font-bold text-sm">Conteúdo Premium</p>
            <Button
              onClick={() => navigate('/assinatura')}
              size="sm"
              className="gap-1.5 rounded-full font-semibold text-xs"
              style={{
                background: 'linear-gradient(135deg, hsl(43 80% 45%), hsl(35 90% 50%))',
                color: 'hsl(25 30% 10%)',
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              Assinar agora
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

RecomendacaoHomeSection.displayName = 'RecomendacaoHomeSection';

export default RecomendacaoHomeSection;
