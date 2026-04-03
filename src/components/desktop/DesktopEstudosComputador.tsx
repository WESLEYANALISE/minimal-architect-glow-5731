import { memo } from "react";
import { Monitor, Film, ArrowRight, Sparkles } from "lucide-react";

interface DesktopEstudosComputadorProps {
  navigate: (path: string) => void;
}

export const DesktopEstudosComputador = memo(({ navigate }: DesktopEstudosComputadorProps) => {
  return (
    <div className="relative z-10 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-primary/20 rounded-xl">
          <Monitor className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-base xl:text-lg font-bold text-foreground tracking-tight">
            Estudos no Computador
          </h2>
          <p className="text-xs text-muted-foreground">Ferramentas exclusivas para desktop</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 1: Funções Web */}
        <button
          onClick={() => navigate("/funcoes")}
          className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-red-500/30 transition-all duration-500 text-left cursor-pointer"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,60%,12%)] via-[hsl(0,50%,10%)] to-[hsl(0,40%,7%)]" />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent -skew-x-12"
              style={{ animation: "shimmerSlide 3s ease-in-out infinite" }}
            />
          </div>

          {/* Glow orb */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-700" />

          {/* Content */}
          <div className="relative p-5 xl:p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/20 group-hover:bg-red-500/25 group-hover:border-red-500/30 transition-all duration-300">
                <Monitor className="w-6 h-6 xl:w-7 xl:h-7 text-red-400 group-hover:text-red-300 transition-colors" />
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/15 text-[10px] font-medium text-red-400/80">
                <Sparkles className="w-3 h-3" />
                Exclusivo
              </div>
            </div>

            <div>
              <h3 className="text-lg xl:text-xl font-bold text-white/95 mb-1 group-hover:text-white transition-colors">
                Funções Web
              </h3>
              <p className="text-xs xl:text-sm text-white/50 leading-relaxed group-hover:text-white/60 transition-colors">
                Ferramentas avançadas, mapas mentais, IA jurídica e muito mais
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-red-400/80 text-xs font-medium group-hover:text-red-300 transition-colors">
              Acessar
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </button>

        {/* Card 2: Estudo em Mídia */}
        <button
          onClick={() => navigate("/estudos-midia")}
          className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-rose-500/30 transition-all duration-500 text-left cursor-pointer"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(350,50%,12%)] via-[hsl(345,45%,9%)] to-[hsl(340,40%,7%)]" />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent -skew-x-12"
              style={{ animation: "shimmerSlide 3s ease-in-out infinite" }}
            />
          </div>

          {/* Glow orb */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all duration-700" />

          {/* Content */}
          <div className="relative p-5 xl:p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/20 group-hover:bg-rose-500/25 group-hover:border-rose-500/30 transition-all duration-300">
                <Film className="w-6 h-6 xl:w-7 xl:h-7 text-rose-400 group-hover:text-rose-300 transition-colors" />
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/15 text-[10px] font-medium text-rose-400/80">
                <Sparkles className="w-3 h-3" />
                Multimídia
              </div>
            </div>

            <div>
              <h3 className="text-lg xl:text-xl font-bold text-white/95 mb-1 group-hover:text-white transition-colors">
                Estudo em Mídia
              </h3>
              <p className="text-xs xl:text-sm text-white/50 leading-relaxed group-hover:text-white/60 transition-colors">
                Videoaulas, podcasts jurídicos, audiências e conteúdos em vídeo
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-rose-400/80 text-xs font-medium group-hover:text-rose-300 transition-colors">
              Acessar
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
});

DesktopEstudosComputador.displayName = "DesktopEstudosComputador";
