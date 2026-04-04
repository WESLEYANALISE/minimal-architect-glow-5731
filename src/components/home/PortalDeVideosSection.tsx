import { memo } from "react";
import { Video, ChevronRight, MonitorPlay, Headphones, Crown } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
import capaIniciante from "@/assets/portal-videos-iniciante.webp";
import capaVideoaulas from "@/assets/portal-videos-videoaulas.webp";
import capaAudioaulas from "@/assets/portal-videos-audioaulas.webp";

interface PortalDeVideosSectionProps {
  navigate: (path: string) => void;
}

const itens = [
  {
    id: "iniciante",
    title: "Iniciante",
    description: "Aulas de Direito pra iniciantes",
    icon: Video,
    route: "/aulas-em-tela",
    gradient: "from-[#0d4a3f] to-[#062a24]",
    accent: "#d4af37",
    capa: capaIniciante,
  },
  {
    id: "videoaulas",
    title: "Videoaulas",
    description: "Aulas completas por professores",
    icon: Video,
    route: "/videoaulas",
    gradient: "from-[#2a1548] to-[#160a2a]",
    accent: "#c9a0dc",
    capa: capaVideoaulas,
  },
  {
    id: "audioaulas",
    title: "Audioaulas",
    description: "Aprenda ouvindo",
    icon: Headphones,
    route: "/audioaulas",
    gradient: "from-[#5e3a1a] to-[#33200e]",
    accent: "#f5d060",
    capa: capaAudioaulas,
  },
];

export const PortalDeVideosSection = memo(({ navigate }: PortalDeVideosSectionProps) => {
  const { isDesktop } = useDeviceType();
  const { onTouchStart } = usePrefetchRoute();
  const visibleItens = isDesktop ? itens : itens.filter(i => i.id !== 'audioaulas');
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-xl">
          <Crown className="w-5 h-5 xl:w-6 xl:h-6 text-amber-200" />
        </div>
        <div>
          <h3 className="text-base xl:text-lg 2xl:text-xl font-bold text-foreground tracking-tight">
            Estudos em Mídia
          </h3>
          <p className="text-muted-foreground text-xs xl:text-sm">
            Aprenda com videoaulas práticas
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 xl:gap-4">
        {visibleItens.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              onTouchStart={() => onTouchStart(item.route)}
              className="group rounded-xl text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex flex-col overflow-hidden animate-fade-in border border-white/[0.08]"
              style={{
                animationDelay: `${index * 0.06}s`,
                animationFillMode: "backwards",
                boxShadow: '0 8px 24px -6px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Cover image */}
              <div className="relative w-full h-[95px] xl:h-[110px] 2xl:h-[120px] overflow-hidden">
                <img
                  src={item.capa}
                  alt={item.title}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-[1.15]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.14] via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Info bar */}
              <div className={`bg-gradient-to-br ${item.gradient} p-3 flex-1 flex items-center gap-2.5 relative border-t border-white/[0.06]`}>
                <div className="p-1.5 rounded-lg bg-white/10 border border-white/[0.08]">
                  <Icon className="w-4 h-4 text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-[13px] leading-tight">{item.title}</h4>
                  <p className="text-white/50 text-[10px] line-clamp-1">{item.description}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />

                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${item.accent}80, transparent)` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

PortalDeVideosSection.displayName = 'PortalDeVideosSection';
export default PortalDeVideosSection;
