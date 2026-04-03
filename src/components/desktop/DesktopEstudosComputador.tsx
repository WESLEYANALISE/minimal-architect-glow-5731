import { memo } from "react";
import { Monitor, Film, ArrowRight, Sparkles } from "lucide-react";

interface DesktopEstudosComputadorProps {
  navigate: (path: string) => void;
}

export const DesktopEstudosComputador = memo(({ navigate }: DesktopEstudosComputadorProps) => {
  return (
    <div className="relative z-10 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Funções Web */}
        <button
          onClick={() => navigate("/funcoes")}
          className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-red-500/30 transition-all duration-500 text-left cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,60%,12%)] via-[hsl(0,50%,10%)] to-[hsl(0,40%,7%)]" />
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-700" />

          <div className="relative p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/20">
                <Monitor className="w-5 h-5 text-red-400" />
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/15 text-[9px] font-medium text-red-400/80">
                <Sparkles className="w-2.5 h-2.5" />
                Exclusivo
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white/95">Modo Desktop</h3>
              <p className="text-[11px] text-white/45 leading-snug">Estude pelo computador</p>
            </div>

            <div className="flex items-center gap-1 text-red-400/80 text-[11px] font-medium">
              Acessar
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </button>

        {/* Card 2: Estudo em Mídia */}
        <button
          onClick={() => navigate("/estudos-midia")}
          className="group relative rounded-xl overflow-hidden border border-white/[0.06] hover:border-rose-500/30 transition-all duration-500 text-left cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(350,50%,12%)] via-[hsl(345,45%,9%)] to-[hsl(340,40%,7%)]" />
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-700" />

          <div className="relative p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/20">
                <Film className="w-5 h-5 text-rose-400" />
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/15 text-[9px] font-medium text-rose-400/80">
                <Sparkles className="w-2.5 h-2.5" />
                Multimídia
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white/95">Estudo em Mídia</h3>
              <p className="text-[11px] text-white/45 leading-snug">Vídeos, podcasts e audiências</p>
            </div>

            <div className="flex items-center gap-1 text-rose-400/80 text-[11px] font-medium">
              Acessar
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
});

DesktopEstudosComputador.displayName = "DesktopEstudosComputador";
