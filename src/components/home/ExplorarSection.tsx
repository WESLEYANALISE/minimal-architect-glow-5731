import { memo, useCallback, startTransition } from "react";
import { Bot, Film, Landmark, Camera, ChevronRight, Radar } from "lucide-react";

interface ExplorarSectionProps {
  navigate: (path: string) => void;
}

const itensExplorar = [
  { id: "evelyn", title: "Evelyn", description: "Sua assistente jurídica IA", icon: Bot, route: "/evelyn" },
  { id: "documentarios", title: "Documentários", description: "Os mais assistidos", icon: Film, route: "/documentarios" },
  { id: "politica", title: "Política", description: "Cenário político e legislativo", icon: Landmark, route: "/politica" },
  { id: "tribuna", title: "Tribuna", description: "Galeria institucional", icon: Camera, route: "/tribuna" },
];

export const ExplorarSection = memo(({ navigate }: ExplorarSectionProps) => {
  const handleNavigate = useCallback((route: string) => {
    startTransition(() => {
      navigate(route);
    });
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
            Conteúdo e informação
          </p>
        </div>
      </div>

      {/* Container — mesma estética de Estudos */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950/95 rounded-3xl p-4 relative overflow-hidden shadow-2xl border border-red-800/30">
        <div className="grid grid-cols-2 gap-3 relative z-10">
          {itensExplorar.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.route)}
                className="group bg-white/15 rounded-2xl p-3 text-left transition-all duration-150 hover:bg-white/20 flex flex-col gap-2 border border-white/10 hover:border-white/20 overflow-hidden relative h-[130px]"
                style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}
              >
                <div className="p-2 bg-white/20 rounded-xl w-fit group-hover:bg-white/30 transition-colors shadow-lg">
                  <Icon className="w-5 h-5 text-amber-100 drop-shadow-md" />
                </div>
                <div>
                  <h4
                    className="font-extrabold text-white text-[15px] leading-tight mb-0.5 group-hover:translate-x-0.5 transition-transform tracking-tight"
                    style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}
                  >
                    {item.title}
                  </h4>
                  <p
                    className="text-white text-xs line-clamp-2 leading-snug"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="absolute bottom-2 right-2 w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ExplorarSection.displayName = 'ExplorarSection';
export default ExplorarSection;
