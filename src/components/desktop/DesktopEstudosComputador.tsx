import { memo } from "react";
import { Monitor, Bot, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import coverDesktop from "@/assets/covers/cover-modo-desktop.jpg";
import coverEvelyn from "@/assets/covers/cover-evelyn.jpg";

interface DesktopEstudosComputadorProps {
  navigate: (path: string) => void;
  onEvelyn?: () => void;
}

export const DesktopEstudosComputador = memo(({ navigate, onEvelyn }: DesktopEstudosComputadorProps) => {
  const handleEvelynClick = () => {
    if (onEvelyn) {
      onEvelyn();
    } else {
      navigate("/chat-professora");
    }
  };

  return (
    <div className="relative z-10 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Modo Desktop */}
        <button
          onClick={() => navigate("/funcoes")}
          className="group relative rounded-xl overflow-hidden border border-white/[0.06] active:scale-95 transition-transform text-left cursor-pointer min-h-[110px]"
          style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          <img src={coverDesktop} alt="" loading="lazy" width={512} height={512} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          {/* Shine effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
            <div
              className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
              style={{ animation: 'shinePratique 4s ease-in-out infinite 1s' }}
            />
          </div>

          <div className="relative z-[1] p-3 sm:p-4 flex flex-col items-start justify-end h-full min-h-[110px]">
            <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-xl mb-2">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div className="text-left w-full flex items-end justify-between">
              <div>
                <span className="text-[15px] sm:text-base font-bold text-white block leading-tight drop-shadow-md">Modo Desktop</span>
                <span className="text-[11px] sm:text-xs text-white/70 block drop-shadow-sm">Estude pelo computador</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[3px] z-[2]" style={{ background: 'linear-gradient(90deg, transparent, #f9a8d480, transparent)' }} />
        </button>

        {/* Card 2: Evelyn - Assistente Jurídica */}
        <button
          onClick={handleEvelynClick}
          className="group relative rounded-xl overflow-hidden border border-white/[0.06] active:scale-95 transition-transform text-left cursor-pointer min-h-[110px]"
          style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          <img src={coverEvelyn} alt="" loading="lazy" width={512} height={512} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          {/* Shine effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
            <div
              className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent skew-x-[-20deg]"
              style={{ animation: 'shinePratique 4s ease-in-out infinite 1.2s' }}
            />
          </div>

          <div className="relative z-[1] p-3 sm:p-4 flex flex-col items-start justify-end h-full min-h-[110px]">
            <div className="bg-white/15 backdrop-blur-sm p-2.5 rounded-xl mb-2">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="text-left w-full flex items-end justify-between">
              <div>
                <span className="text-[15px] sm:text-base font-bold text-white block leading-tight drop-shadow-md">Evelyn</span>
                <span className="text-[11px] sm:text-xs text-white/70 block drop-shadow-sm">Assistente jurídica com IA</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/25 group-hover:text-white/60 transition-colors shrink-0 mb-0.5" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[3px] z-[2]" style={{ background: 'linear-gradient(90deg, transparent, #c084fc80, transparent)' }} />
        </button>
      </div>
    </div>
  );
});

DesktopEstudosComputador.displayName = "DesktopEstudosComputador";
