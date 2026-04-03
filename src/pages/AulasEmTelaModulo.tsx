import { useMemo, useState, startTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Play, ChevronRight, ArrowLeft, CheckCircle2, Crown } from "lucide-react";
import { getSafeCoverUrl } from "@/lib/aulasEmTelaCovers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMultipleVideoProgress } from "@/hooks/useVideoProgress";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { useDeviceType } from "@/hooks/use-device-type";
import { cn } from "@/lib/utils";

const FREE_AULAS_PER_MODULE = 1;

interface AulaItem {
  id: number;
  aula: number;
  tema: string;
  assunto: string;
  capa: string | null;
  video?: string | null;
}

const getVideoUrl = (url: string): string => {
  try {
    if (url.includes("dropbox.com")) {
      const proxyBase = "https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/audio-proxy";
      return `${proxyBase}?url=${encodeURIComponent(url)}`;
    }
    return url;
  } catch {
    return url;
  }
};

const AulasEmTelaModulo = () => {
  const navigate = useNavigate();
  const { modulo } = useParams<{ modulo: string }>();
  const moduloNum = parseInt(modulo || "1");
  const { isPremium, loading: subLoading } = useSubscription();
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const hasFullAccess = isPremium || subLoading;
  const { isDesktop } = useDeviceType();
  const [selectedAula, setSelectedAula] = useState<AulaItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["aulas-em-tela-modulo", moduloNum],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas_em_tela" as any)
        .select("id, aula, tema, assunto, capa, capa_modulo, video")
        .eq("modulo", moduloNum)
        .order("aula", { ascending: true });

      if (error) throw error;
      return data as unknown as (AulaItem & { capa_modulo?: string })[];
    },
  });

  const aulas = data || [];
  const temaModulo = aulas[0]?.tema || `Módulo ${moduloNum}`;
  const capaModulo = useMemo(() => {
    const raw = aulas.find(a => (a as any).capa_modulo)?.capa_modulo as string | undefined;
    return getSafeCoverUrl(raw, moduloNum);
  }, [aulas, moduloNum]);

  // Auto-select first aula on desktop
  const activeAula = useMemo(() => {
    if (selectedAula) return selectedAula;
    if (aulas.length > 0) return aulas[0];
    return null;
  }, [selectedAula, aulas]);

  // Progress tracking
  const registroIds = useMemo(() => aulas.map(a => String(a.id)), [aulas]);
  const { progressMap } = useMultipleVideoProgress("aulas_em_tela", registroIds);

  const aulasAssistidas = useMemo(() => {
    return aulas.filter(a => progressMap[String(a.id)]?.assistido).length;
  }, [aulas, progressMap]);

  const progressoModulo = aulas.length > 0 ? Math.round((aulasAssistidas / aulas.length) * 100) : 0;

  const handleAulaClick = (aula: AulaItem, index: number) => {
    const isAulaLocked = !hasFullAccess && index >= FREE_AULAS_PER_MODULE;
    if (isAulaLocked) {
      setShowPremiumCard(true);
      return;
    }
    if (isDesktop) {
      setSelectedAula(aula);
    } else {
      startTransition(() => navigate(`/aulas-em-tela/${moduloNum}/aula/${aula.id}`));
    }
  };

  const renderAulaItem = (aula: AulaItem, index: number) => {
    const aulaProgress = progressMap[String(aula.id)];
    const percentual = aulaProgress?.percentual || 0;
    const assistido = aulaProgress?.assistido || false;
    const isAulaLocked = !hasFullAccess && index >= FREE_AULAS_PER_MODULE;
    const isSelected = isDesktop && activeAula?.id === aula.id;

    return (
      <button
        key={aula.id}
        onClick={() => handleAulaClick(aula, index)}
        className={cn(
          "w-full group rounded-xl overflow-hidden transition-all duration-200",
          isDesktop
            ? cn(
                "p-2.5 flex gap-3 items-center text-left",
                isSelected
                  ? "bg-amber-500/15 border border-amber-500/40"
                  : "bg-card/60 hover:bg-card border border-border/30 hover:border-amber-500/30"
              )
            : "bg-card border border-border hover:border-primary/50 hover:shadow-md"
        )}
        style={!isDesktop ? { animationDelay: `${index * 0.04}s`, animationFillMode: "backwards" } : undefined}
      >
        <div className={cn("flex items-center gap-3", !isDesktop && "p-3")}>
          {/* Número da aula / Check */}
          <div className={cn(
            "flex-shrink-0 rounded-lg flex items-center justify-center",
            isDesktop ? "w-8 h-8" : "w-10 h-10",
            assistido
              ? "bg-emerald-500/20 border border-emerald-500/30"
              : "bg-primary/10 border border-primary/20"
          )}>
            {assistido ? (
              <CheckCircle2 className={cn("text-emerald-500", isDesktop ? "w-4 h-4" : "w-5 h-5")} />
            ) : (
              <span className={cn("font-bold text-primary", isDesktop ? "text-xs" : "text-sm")}>{aula.aula}</span>
            )}
          </div>

          {/* Thumbnail */}
          <div className={cn(
            "relative flex-shrink-0 rounded-lg overflow-hidden bg-muted",
            isDesktop ? "w-20 h-12" : "w-16 h-12"
          )}>
            {(() => {
              const thumbUrl = getSafeCoverUrl(aula.capa, moduloNum);
              return thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={aula.assunto}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-muted-foreground/40" />
                </div>
              );
            })()}
            {isSelected && (
              <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                <Play className="w-4 h-4 text-white" fill="white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-left">
            <h3 className={cn(
              "font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors",
              isDesktop ? "text-xs" : "text-sm",
              isSelected ? "text-amber-300" : "text-foreground"
            )}>
              {aula.assunto || aula.tema}
            </h3>
            {!isAulaLocked && percentual > 0 && !assistido && (
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentual}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{percentual}%</span>
              </div>
            )}
            {!isAulaLocked && assistido && (
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Concluída</p>
            )}
            {isAulaLocked && (
              <p className="text-[10px] text-amber-500 font-medium mt-0.5">Premium</p>
            )}
          </div>

          {isAulaLocked ? (
            <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
          ) : !isDesktop ? (
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          ) : null}
        </div>
      </button>
    );
  };

  // ======= DESKTOP LAYOUT =======
  if (isDesktop) {
    return (
      <div className="flex h-[calc(100vh-4.5rem)] bg-background overflow-hidden">
        {/* Sidebar esquerda - Lista de aulas */}
        <div className="w-[380px] xl:w-[420px] flex-shrink-0 border-r border-border/30 flex flex-col bg-neutral-950">
          {/* Header da sidebar */}
          <div className="px-5 pt-5 pb-4 border-b border-border/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                {capaModulo ? (
                  <img src={capaModulo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-700">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  MÓDULO {moduloNum}
                </span>
                <h2 className="text-sm font-bold mt-0.5 truncate text-foreground">{temaModulo}</h2>
                <p className="text-xs text-muted-foreground">
                  {aulas.length} aulas · {aulasAssistidas} concluída{aulasAssistidas !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Barra de progresso */}
            {aulas.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Progresso</span>
                  <span className="text-amber-400 font-medium">{progressoModulo}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progressoModulo}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lista scrollável */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1.5">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))
                : aulas.map((aula, index) => renderAulaItem(aula, index))}
            </div>
          </ScrollArea>
        </div>

        {/* Área principal direita - Player */}
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          {activeAula ? (
            <>
              {/* Player embed */}
              <div className="flex-1 relative">
                {activeAula.video ? (
                  <video
                    key={activeAula.id}
                    src={getVideoUrl(activeAula.video)}
                    controls
                    playsInline
                    className="absolute inset-0 w-full h-full bg-black"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {(() => {
                      const coverUrl = getSafeCoverUrl(activeAula.capa, moduloNum);
                      return coverUrl ? (
                        <>
                          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                          <div className="absolute inset-0 bg-black/60" />
                        </>
                      ) : null;
                    })()}
                    <div className="relative z-10 text-center">
                      <Play className="w-16 h-16 text-white/30 mx-auto mb-4" />
                      <p className="text-white/50 text-sm">Vídeo não disponível</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info do vídeo */}
              <div className="px-6 py-4 bg-neutral-950 border-t border-border/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                        Aula {String(activeAula.aula).padStart(2, '0')}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
                      {activeAula.assunto || activeAula.tema}
                    </h2>
                  </div>
                  <button
                    onClick={() => navigate(`/aulas-em-tela/${moduloNum}/aula/${activeAula.id}`)}
                    className="flex-shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" fill="white" />
                    Tela cheia
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Selecione uma aula</p>
            </div>
          )}
        </div>

        <PremiumFloatingCard
          isOpen={showPremiumCard}
          onClose={() => setShowPremiumCard(false)}
          title="Aulas Avançadas"
          sourceFeature="Primeiros Passos"
        />
      </div>
    );
  }

  // ======= MOBILE LAYOUT =======
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero do módulo */}
      <div className="relative bg-gradient-to-br from-red-950 via-red-900 to-red-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,50,0.12),transparent_60%)]" />
        {capaModulo && (
          <img
            src={capaModulo}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => navigate("/aulas-em-tela"))}
            className="text-white/70 hover:text-white hover:bg-white/10 -ml-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar
          </Button>

          <div className="flex items-start gap-4">
            {capaModulo && (
              <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                <img src={capaModulo} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div className="flex-1">
              <p className="text-amber-300/80 text-xs font-semibold tracking-wider uppercase mb-1">
                Módulo {moduloNum}
              </p>
              <h1 className="font-playfair text-xl md:text-2xl font-bold text-white leading-tight">
                {temaModulo}
              </h1>
              <p className="text-white/50 text-sm mt-1.5 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5" />
                {aulas.length} {aulas.length === 1 ? "aula" : "aulas"}
                {aulasAssistidas > 0 && (
                  <span className="text-emerald-400/80 ml-1">
                    · {aulasAssistidas} concluída{aulasAssistidas !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Barra de progresso do módulo */}
          {aulas.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
                <span>Progresso do módulo</span>
                <span className="text-amber-300/80 font-medium">{progressoModulo}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progressoModulo}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de aulas */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="space-y-2">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))
            : aulas.map((aula, index) => renderAulaItem(aula, index))}
        </div>
      </div>

      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        title="Aulas Avançadas"
        sourceFeature="Primeiros Passos"
      />
    </div>
  );
};

export default AulasEmTelaModulo;
