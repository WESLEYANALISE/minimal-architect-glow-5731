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
    subtitle: "Para iniciantes",
    icon: Video,
    route: "/aulas-em-tela",
    cover: coverIniciante,
    accent: "#5eead4",
    delay: 0.1,
  },
  {
    id: "videoaulas",
    title: "Videoaulas",
    subtitle: "Aulas completas",
    icon: Video,
    route: "/videoaulas",
    cover: coverVideoaulas,
    accent: "#c084fc",
    delay: 0.15,
  },
  {
    id: "audioaulas",
    title: "Audioaulas",
    subtitle: "Aprenda ouvindo",
    icon: Headphones,
    route: "/audioaulas",
    cover: coverAudioaulas,
    accent: "#fdba74",
    delay: 0.2,
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

      {/* Cards - mesmo estilo dos cards de Estudos */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {visibleItens.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="group relative rounded-xl overflow-hidden border border-white/[0.06] animate-fade-in active:scale-95 transition-transform min-h-[110px] text-left"
              style={{
                animationDelay: `${item.delay}s`,
                animationFillMode: 'backwards',
                boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              {/* Cover image background */}
              <img
                src={item.cover}
                alt=""
                loading="lazy"
                width={512}
                height={512}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

              {/* Shine effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                <div
                  className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
                  style={{ animation: `shinePratique 4s ease-in-out infinite ${item.delay + 1}s` }}
                />
              </div>

              {/* Content */}
              <div className="relative z-[1] p-3 sm:p-4 flex flex-col items-start justify-end h-full min-h-[110px]">
                <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-xl mb-2">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="text-left w-full flex items-end justify-between">
                  <div>
                    <span className="text-[15px] sm:text-base font-bold text-white block leading-tight drop-shadow-md">{item.title}</span>
                    <span className="text-[11px] sm:text-xs text-white/70 block drop-shadow-sm">{item.subtitle}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
                </div>
              </div>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[3px] z-[2]"
                style={{ background: `linear-gradient(90deg, transparent, ${item.accent}80, transparent)` }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
});

PortalDeVideosSection.displayName = 'PortalDeVideosSection';
export default PortalDeVideosSection;
