import { useMemo, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Monitor, Play, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";
import { getSafeCoverUrl } from "@/lib/aulasEmTelaCovers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useMultipleVideoProgress } from "@/hooks/useVideoProgress";
import { useDeviceType } from "@/hooks/use-device-type";

interface ModuloResumo {
  modulo: number;
  tema: string;
  capa_modulo: string | null;
  total_aulas: number;
  aulaIds: number[];
}

const AulasEmTela = () => {
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["aulas-em-tela-modulos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aulas_em_tela" as any)
        .select("id, modulo, tema, capa_modulo, capa_area")
        .order("modulo", { ascending: true })
        .order("aula", { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });

  const modulos = useMemo(() => {
    if (!rawData) return [];
    const modulosMap = new Map<number, ModuloResumo>();
    rawData.forEach((item: any) => {
      if (!modulosMap.has(item.modulo)) {
        modulosMap.set(item.modulo, {
          modulo: item.modulo,
          tema: item.tema || `Módulo ${item.modulo}`,
          capa_modulo: item.capa_modulo || null,
          total_aulas: 0,
          aulaIds: [],
        });
      }
      const mod = modulosMap.get(item.modulo)!;
      mod.total_aulas++;
      mod.aulaIds.push(item.id);
      if (!mod.capa_modulo && item.capa_modulo) {
        mod.capa_modulo = item.capa_modulo;
      }
    });
    return Array.from(modulosMap.values());
  }, [rawData]);

  const allRegistroIds = useMemo(
    () => modulos.flatMap(m => m.aulaIds.map(String)),
    [modulos]
  );
  const { progressMap } = useMultipleVideoProgress("aulas_em_tela", allRegistroIds);

  const totalAulas = modulos.reduce((s, m) => s + m.total_aulas, 0);

  const renderModuloCard = (mod: ModuloResumo) => {
    const aulasAssistidas = mod.aulaIds.filter(
      id => progressMap[String(id)]?.assistido
    ).length;
    const progressoModulo = mod.total_aulas > 0
      ? Math.round((aulasAssistidas / mod.total_aulas) * 100)
      : 0;
    const moduloConcluido = aulasAssistidas === mod.total_aulas && mod.total_aulas > 0;

    return (
      <button
        key={mod.modulo}
        onClick={() => {
          startTransition(() => navigate(`/aulas-em-tela/${mod.modulo}`));
        }}
        className="w-full group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
      >
        <div className="flex items-stretch">
          {/* Capa lateral */}
          <div className="relative w-32 sm:w-40 flex-shrink-0 overflow-hidden bg-muted">
            {(() => {
              const coverUrl = getSafeCoverUrl(mod.capa_modulo, mod.modulo);
              return coverUrl ? (
                <img
                  src={coverUrl}
                  alt={mod.tema}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted min-h-[100px]">
                  <Play className="w-8 h-8 text-muted-foreground/40" />
                </div>
              );
            })()}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-lg">
              {mod.modulo}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0 text-left">
            <p className="text-xs text-amber-400 font-medium mb-0.5 text-left">
              Módulo {mod.modulo}
            </p>
            <h3 className="font-semibold text-amber-300 text-sm sm:text-base leading-tight line-clamp-2 mb-2 text-left">
              {mod.tema}
            </h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-amber-400/70 flex items-center gap-1.5">
                <Play className="w-3 h-3" />
                {aulasAssistidas > 0
                  ? `${aulasAssistidas}/${mod.total_aulas} aulas`
                  : `${mod.total_aulas} ${mod.total_aulas === 1 ? "aula" : "aulas"}`}
              </p>
              {moduloConcluido && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Concluído
                </span>
              )}
            </div>
            {progressoModulo > 0 && (
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out rounded-full ${
                    moduloConcluido
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-amber-500 to-amber-400"
                  }`}
                  style={{ width: `${progressoModulo}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center pr-3">
            <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        </div>
      </button>
    );
  };

  if (isDesktop) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] bg-background">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          {/* Header desktop */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
              <Monitor className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-playfair text-3xl font-bold text-foreground">
                Primeiros Passos
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">Inicie no Direito</p>
            </div>
            <div className="ml-auto flex items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {modulos.length} módulos
              </span>
              <span className="flex items-center gap-1.5">
                <Play className="w-4 h-4" />
                {totalAulas} aulas
              </span>
            </div>
          </div>

          {/* Grid de módulos */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-28 rounded-2xl" />
                ))
              : modulos.map(renderModuloCard)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero compacto */}
      <div className="relative bg-gradient-to-br from-red-950 via-red-900 to-red-950 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,50,0.12),transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/inicio')}
              className="p-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
              <Monitor className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white">
                Primeiros Passos
              </h1>
              <p className="text-white/60 text-sm">Inicie no Direito</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {modulos.length} módulos
            </span>
            <span className="flex items-center gap-1.5">
              <Play className="w-4 h-4" />
              {totalAulas} aulas
            </span>
          </div>
        </div>
      </div>

      {/* Lista vertical de módulos */}
      <div className="max-w-4xl mx-auto px-4 py-6 -mt-4 relative z-10 space-y-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-28 rounded-2xl" />
            ))
          : modulos.map(renderModuloCard)}
      </div>
    </div>
  );
};

export default AulasEmTela;
