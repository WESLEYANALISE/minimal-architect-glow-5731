import { memo } from "react";
import { Monitor, Bot, ArrowRight } from "lucide-react";

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
      <div className="grid grid-cols-2 gap-2">
        {/* Card 1: Modo Desktop */}
        <button
          onClick={() => navigate("/funcoes")}
          className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-rose-500/30 transition-all duration-500 text-left cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(350,50%,12%)] via-[hsl(345,45%,9%)] to-[hsl(340,40%,7%)]" />

          <div className="relative px-2.5 py-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/20 shrink-0">
              <Monitor className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-white/95 leading-tight truncate">Desktop</h3>
              <p className="text-[9px] text-white/45 leading-snug truncate">Pelo computador</p>
            </div>
            <ArrowRight className="w-3 h-3 text-rose-400/70 shrink-0 group-hover:translate-x-0.5 transition-transform duration-300" />
          </div>
        </button>

        {/* Card 2: Evelyn - Assistente Jurídica */}
        <button
          onClick={handleEvelynClick}
          className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-rose-500/30 transition-all duration-500 text-left cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(350,50%,12%)] via-[hsl(345,45%,9%)] to-[hsl(340,40%,7%)]" />

          <div className="relative px-2.5 py-2 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/20 shrink-0">
              <Bot className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-white/95 leading-tight truncate">Evelyn</h3>
              <p className="text-[9px] text-white/45 leading-snug truncate">Assistente IA</p>
            </div>
            <ArrowRight className="w-3 h-3 text-rose-400/70 shrink-0 group-hover:translate-x-0.5 transition-transform duration-300" />
          </div>
        </button>
      </div>
    </div>
  );
});

DesktopEstudosComputador.displayName = "DesktopEstudosComputador";
