import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, ArrowRight, Lock, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGenericCache } from "@/hooks/useGenericCache";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

interface Area {
  area: string;
  capa: string;
  totalModulos: number;
  totalAulas: number;
  fonte: 'CURSOS-APP' | 'CURSOS';
  cor?: string;
  primeirosTemas?: string[];
}

const Cursos = () => {
  const navigate = useNavigate();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const hasAccess = isPremium || loadingSubscription;
  
  const { data: areas, isLoading: loading } = useGenericCache<Area[]>({
    cacheKey: 'cursos-areas',
    fetchFn: async () => {
      const areasArray: Area[] = [];
      const { data: cursosAppData, error: cursosAppError } = await supabase
        .from("CURSOS-APP" as any).select("area, tema, ordem").order("area").order("ordem");
      const { data: cursosData, error: cursosError } = await supabase
        .from("CURSOS" as any).select("Area, Modulo, Aula, \"capa-area\"").order("Area", { ascending: true });

      if (cursosAppData && !cursosAppError) {
        const areasMap = new Map<string, { temas: string[]; totalAulas: number }>();
        cursosAppData.forEach((item: any) => {
          if (item.area) {
            if (!areasMap.has(item.area)) areasMap.set(item.area, { temas: [], totalAulas: 0 });
            const areaData = areasMap.get(item.area)!;
            areaData.temas.push(item.tema);
            areaData.totalAulas++;
          }
        });
        areasMap.forEach((data, area) => {
          areasArray.push({ area, capa: "", totalModulos: 1, totalAulas: data.totalAulas, fonte: 'CURSOS-APP', primeirosTemas: data.temas.slice(0, 3) });
        });
      }

      if (cursosData && !cursosError) {
        const areasMap = new Map<string, { capa: string; modulos: Set<number>; totalAulas: number }>();
        cursosData.forEach((item: any) => {
          if (item.Area) {
            if (!areasMap.has(item.Area)) areasMap.set(item.Area, { capa: item["capa-area"] || "", modulos: new Set(), totalAulas: 0 });
            const areaData = areasMap.get(item.Area)!;
            if (item.Modulo) areaData.modulos.add(item.Modulo);
            if (item.Aula) areaData.totalAulas++;
          }
        });
        areasMap.forEach((data, area) => {
          areasArray.push({ area, capa: data.capa, totalModulos: data.modulos.size, totalAulas: data.totalAulas, fonte: 'CURSOS' });
        });
      }
      return areasArray;
    },
  });

  const areasIniciando = (areas || []).filter(a => a.fonte === 'CURSOS-APP');
  const limiteGratis = Math.max(1, Math.ceil(areasIniciando.length * 0.20));
  const [showPremiumCard, setShowPremiumCard] = useState(false);

  const handleAreaClick = (area: Area, index: number) => {
    if (!hasAccess && index >= limiteGratis) { setShowPremiumCard(true); return; }
    navigate(`/iniciando-direito/${encodeURIComponent(area.area)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(350, 40%, 12%)' }}>
        <p style={{ color: GOLD }}>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 lg:pb-8" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'hsla(40, 80%, 55%, 0.15)' }}>
              <BookOpen className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
                Cursos Jurídicos
              </h1>
              <p className="text-sm" style={{ color: 'hsl(40, 30%, 70%)' }}>Aprenda direito de forma estruturada</p>
            </div>
          </div>
        </div>

        {areasIniciando.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'hsl(40, 60%, 85%)' }}>
                <GraduationCap className="w-7 h-7" style={{ color: GOLD }} />
                📚 Iniciando o Direito
              </h2>
              <p className="mt-1" style={{ color: 'hsl(40, 20%, 60%)' }}>
                Curso completo para quem está começando no mundo jurídico
              </p>
            </div>

            <div className="relative space-y-6">
              <div className="absolute left-[9px] top-0 bottom-0 w-0.5" style={{ background: 'hsla(40, 60%, 50%, 0.2)' }} />

              {areasIniciando.map((area, index) => {
                const isLocked = !hasAccess && index >= limiteGratis;
                return (
                  <div key={index} className="relative pl-8">
                    <div className="absolute left-0 top-2 w-5 h-5 rounded-full border-4" style={{ background: `linear-gradient(135deg, hsl(345, 65%, 30%), hsl(350, 40%, 20%))`, borderColor: 'hsl(350, 40%, 12%)' }} />
                    <button
                      onClick={() => handleAreaClick(area, index)}
                      className={`w-full text-left rounded-lg p-5 hover:shadow-lg transition-all group relative backdrop-blur-sm ${isLocked ? 'opacity-80' : ''}`}
                      style={{ background: 'hsla(345, 30%, 18%, 0.7)', border: '1px solid hsla(40, 60%, 50%, 0.12)' }}
                    >
                      {isLocked && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium z-10" style={{ background: 'hsla(40, 80%, 55%, 0.2)', color: GOLD }}>
                          <Crown className="w-3 h-3" /> Premium
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2.5 rounded-lg relative" style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 30%), hsl(350, 40%, 20%))' }}>
                            <GraduationCap className="w-5 h-5" style={{ color: GOLD }} />
                            {isLocked && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: GOLD }}>
                                <Lock className="w-2.5 h-2.5" style={{ color: 'hsl(350, 40%, 12%)' }} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold transition-colors" style={{ color: 'hsl(40, 60%, 90%)' }}>
                              {area.area}
                            </h3>
                            <p className="text-sm mt-1" style={{ color: 'hsl(40, 20%, 55%)' }}>
                              {area.totalAulas} {area.totalAulas === 1 ? 'tema' : 'temas'} disponíveis
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 30%), hsl(350, 40%, 20%))', color: GOLD }}>
                          {index + 1}
                        </span>
                      </div>

                      {area.primeirosTemas && area.primeirosTemas.length > 0 && (
                        <div className="space-y-2 mt-4 pt-4" style={{ borderTop: '1px solid hsla(40, 60%, 50%, 0.1)' }}>
                          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'hsl(40, 20%, 50%)' }}>
                            Primeiros temas:
                          </p>
                          {area.primeirosTemas.map((tema, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'hsl(40, 20%, 60%)' }}>
                              <span style={{ color: GOLD }} className="mt-1">•</span>
                              <span className="flex-1">{tema}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 text-right">
                        <span className="text-xs font-semibold group-hover:underline" style={{ color: GOLD }}>
                          {isLocked ? 'Desbloquear →' : 'Ver todos os temas →'}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(areas || []).filter(a => a.fonte === 'CURSOS').length > 0 && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'hsl(40, 60%, 85%)' }}>
                <BookOpen className="w-7 h-7" style={{ color: GOLD }} />
                🎓 Cursos Avançados
              </h2>
              <p className="mt-1" style={{ color: 'hsl(40, 20%, 60%)' }}>
                Aprofunde seus conhecimentos com cursos completos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(areas || []).filter(a => a.fonte === 'CURSOS').map((area, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/cursos/modulos?area=${encodeURIComponent(area.area)}`)}
                  className="group cursor-pointer rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                  style={{ background: 'hsla(345, 30%, 18%, 0.7)', border: '1px solid hsla(40, 60%, 50%, 0.12)' }}
                >
                  <div className="relative h-48 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 25%), hsl(350, 40%, 15%))' }}>
                    {area.capa ? (
                      <img src={area.capa} alt={area.area} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-16 h-16" style={{ color: 'hsla(40, 80%, 55%, 0.2)' }} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <div className="backdrop-blur-sm p-2 rounded-full" style={{ background: 'hsla(345, 65%, 30%, 0.9)' }}>
                        <GraduationCap className="w-6 h-6" style={{ color: GOLD }} />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold mb-1 drop-shadow-lg" style={{ color: 'hsl(40, 60%, 90%)' }}>
                        {area.area}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'hsl(40, 20%, 55%)' }}>
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        <span>{area.totalModulos} {area.totalModulos === 1 ? 'módulo' : 'módulos'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{area.totalAulas} {area.totalAulas === 1 ? 'aula' : 'aulas'}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold group-hover:underline" style={{ color: GOLD }}>Acessar curso</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: GOLD }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cursos;
