import { memo } from "react";
import { Video, ChevronRight, MonitorPlay, Headphones } from "lucide-react";
import { useDeviceType } from "@/hooks/use-device-type";
import coverIniciante from "@/assets/covers/cover-midia-iniciante.jpg";
import coverVideoaulas from "@/assets/covers/cover-midia-videoaulas.jpg";
import coverAudioaulas from "@/assets/covers/cover-midia-audioaulas.jpg";

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
    gradient: "from-emerald-600 via-emerald-700 to-emerald-800",
    capa: coverIniciante,
  },
  {
    id: "videoaulas",
    title: "Videoaulas",
    description: "Aulas completas por professores",
    icon: Video,
    route: "/videoaulas",
    gradient: "from-purple-600 via-purple-700 to-purple-800",
    capa: coverVideoaulas,
  },
  {
    id: "audioaulas",
    title: "Audioaulas",
    description: "Aprenda ouvindo",
    icon: Headphones,
    route: "/audioaulas",
    gradient: "from-amber-600 via-amber-700 to-amber-800",
    capa: coverAudioaulas,
  },
];

export const PortalDeVideosSection = memo(({ navigate }: PortalDeVideosSectionProps) => {
  const { isDesktop } = useDeviceType();
  const visibleItens = isDesktop ? itens : itens.filter(i => i.id !== 'audioaulas');
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-xl">
          <MonitorPlay className="w-5 h-5 xl:w-6 xl:h-6 text-blue-100" />
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
        {visibleItens.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="group rounded-2xl text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex flex-col border border-white/10 hover:border-white/20 overflow-hidden"
              style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}
            >
              {/* Capa - parte de cima */}
              <div className="w-full h-[90px] xl:h-[110px] 2xl:h-[120px] overflow-hidden">
                <img
                  src={item.capa}
                  alt={item.title}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Info - parte de baixo com gradiente */}
              <div className={`bg-gradient-to-br ${item.gradient} p-3 flex-1 flex flex-col justify-center relative`}>
                <h4
                  className="font-bold text-white text-sm mb-0.5 group-hover:translate-x-0.5 transition-transform tracking-wide"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                >
                  {item.title}
                </h4>
                <p
                  className="text-white/80 text-xs line-clamp-2 leading-snug"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                >
                  {item.description}
                </p>
                {/* Ícone no canto inferior direito */}
                <div className="absolute bottom-2.5 right-2.5 p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                  <Icon className="w-4 h-4 text-white/80 drop-shadow-md" />
                </div>
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
