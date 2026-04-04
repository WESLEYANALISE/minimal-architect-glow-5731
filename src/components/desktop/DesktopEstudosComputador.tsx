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
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Modo Desktop */}
        <button
          onClick={() => navigate("/funcoes")}
          className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-rose-500/30 transition-all duration-500 text-left cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(350,50%,12%)] via-[hsl(345,45%,9%)] to-[hsl(340,40%,7%)]" />

          <div className="relative px-3 py-2.5 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/20 shrink-0">
              <Monitor className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-white/95 leading-tight">Modo Desktop</h3>
              <p className="text-[10px] text-white/45 leading-snug">Estude pelo computador</p>
            </div>
            <div className="flex items-center gap-0.5 text-rose-400/80 text-[10px] font-medium shrink-0">
              Acessar
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </button>

        {/* Card 2: Evelyn - Assistente Jurídica */}
        <button
          onClick={handleEvelynClick}
          className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-rose-500/30 transition-all duration-500 text-left cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(350,50%,12%)] via-[hsl(345,45%,9%)] to-[hsl(340,40%,7%)]" />

          <div className="relative px-3 py-2.5 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/20 shrink-0">
              <Bot className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-bold text-white/95 leading-tight">Evelyn</h3>
              <p className="text-[10px] text-white/45 leading-snug">Assistente jurídica com IA</p>
            </div>
            <div className="flex items-center gap-0.5 text-rose-400/80 text-[10px] font-medium shrink-0">
              Conversar
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
});

DesktopEstudosComputador.displayName = "DesktopEstudosComputador";
