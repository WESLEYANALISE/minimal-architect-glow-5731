import { memo, useCallback, useMemo } from "react";
import { FileText, Landmark, Camera, ChevronRight, Radar, Film, ScrollText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ADMIN_EMAIL = "wn7corporation@gmail.com";

interface RadarJuridicoSectionProps {
  isDesktop: boolean;
  navigate: (path: string) => void;
  handleLinkHover: (path: string) => void;
}

const itensBase = [
  { id: "boletins", title: "Boletins", description: "Notícias jurídicas diárias mais relevantes", icon: FileText, route: "/blogger-juridico" },
  // index 1 is dynamic
  { id: "politica", title: "Política", description: "Cenário político e legislativo do Brasil", icon: Landmark, route: "/politica" },
  { id: "documentarios", title: "Documentários", description: "Os mais assistidos", icon: Film, route: "/documentarios" },
];

const itemPeticoes = { id: "peticoes", title: "Petições", description: "Modelos de petições prontos para usar", icon: ScrollText, route: "/peticoes" };
const itemTribuna = { id: "tribuna", title: "Tribuna", description: "Galerias dos tribunais", icon: Camera, route: "/tribuna" };

export const RadarJuridicoSection = memo(({ isDesktop, navigate, handleLinkHover }: RadarJuridicoSectionProps) => {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const itensRadar = useMemo(() => {
    const dynamicItem = isAdmin ? itemPeticoes : itemTribuna;
    return [itensBase[0], dynamicItem, itensBase[1], itensBase[2]];
  }, [isAdmin]);

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-xl">
          <Radar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            Radar Jurídico
          </h3>
          <p className="text-muted-foreground text-xs">
            Informação em tempo real
          </p>
        </div>
      </div>

      {/* Container */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        <div className={`grid gap-3 relative z-10 ${isDesktop ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {itensRadar.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.route)}
                onMouseEnter={() => handleLinkHover(item.route)}
                className={`group bg-white/15 rounded-2xl p-3 text-left transition-all duration-150 hover:bg-white/20 flex flex-col gap-2 border border-white/10 hover:border-white/20 overflow-hidden relative ${isDesktop ? 'h-[110px]' : 'h-[120px]'}`}
                style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}
              >
                <div className="bg-white/20 rounded-xl p-2 w-fit group-hover:bg-white/30 transition-colors shadow-lg">
                  <Icon className="w-5 h-5 text-amber-100 drop-shadow-md" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white mb-0.5 tracking-tight text-[15px] leading-tight" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
                    {item.title}
                  </h4>
                  <p className="text-white/70 text-xs line-clamp-2 leading-snug" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="absolute bottom-2 right-2 w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

RadarJuridicoSection.displayName = 'RadarJuridicoSection';

export default RadarJuridicoSection;
