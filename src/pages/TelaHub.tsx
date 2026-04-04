import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Scale, FileText, Play, ArrowLeft } from "lucide-react";

import conceitosThumb from "@/assets/thumbnails/conceitos-thumb.jpg?format=webp&quality=75";
import areasThumb from "@/assets/thumbnails/areas-thumb.jpg?format=webp&quality=75";
import oabPrimeiraThumb from "@/assets/thumbnails/oab-primeira-fase-thumb.jpg?format=webp&quality=75";
import oabSegundaThumb from "@/assets/thumbnails/oab-segunda-fase-thumb.jpg?format=webp&quality=75";

const videoaulasThumbnails: Record<string, string> = {
  conceitos: conceitosThumb,
  areas: areasThumb,
  'oab-primeira': oabPrimeiraThumb,
  'oab-segunda': oabSegundaThumb,
};

const VideoaulasHub = () => {
  const navigate = useNavigate();

  const categoriasVideoaulas = useMemo(() => [
    { id: "conceitos", title: "Para Iniciantes", icon: BookOpen, route: "/videoaulas/iniciante" },
    { id: "areas", title: "Áreas do Direito", icon: Scale, route: "/videoaulas/areas/lista" },
    { id: "oab-primeira", title: "OAB 1ª Fase", icon: Scale, route: "/videoaulas-oab-1fase" },
    { id: "oab-segunda", title: "OAB 2ª Fase", icon: FileText, route: "/videoaulas-oab" },
  ], []);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header com botão voltar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Videoaulas</h1>
            <p className="text-xs text-muted-foreground">Conteúdo audiovisual</p>
          </div>
        </div>
      </div>

      {/* Trilha serpentina */}
      <div className="relative px-4 pt-8 pb-4 max-w-md mx-auto">
        {/* Linha central vertical */}
        <div className="absolute left-1/2 top-8 bottom-4 w-[2px] -translate-x-1/2 bg-gradient-to-b from-accent/40 via-accent/20 to-transparent" />

        <div className="space-y-6">
          {categoriasVideoaulas.map((categoria, index) => {
            const Icon = categoria.icon;
            const thumbnail = videoaulasThumbnails?.[categoria.id];
            const isLeft = index % 2 === 0;

            return (
              <div
                key={categoria.id}
                className={`flex items-center gap-3 ${isLeft ? 'flex-row pr-[52%]' : 'flex-row-reverse pl-[52%]'}`}
              >
                {/* Card */}
                <button
                  onClick={() => navigate(categoria.route)}
                  className="relative rounded-xl overflow-hidden border border-border/50 hover:border-accent/40 transition-all duration-300 hover:scale-[1.03] active:scale-95 w-full aspect-[4/3] shadow-lg"
                  style={{ boxShadow: '0 6px 20px -4px rgba(0,0,0,0.5)' }}
                >
                  {thumbnail ? (
                    <>
                      <img
                        src={thumbnail}
                        alt={categoria.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/80 to-accent/40" />
                  )}

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-2.5 rounded-full bg-black/30 backdrop-blur-sm border border-white/20">
                      <Play className="w-5 h-5 text-white/80 fill-white/60" />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-accent/80 shrink-0">
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                      {categoria.title}
                    </h3>
                  </div>
                </button>

                {/* Dot connector on the line */}
                <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent border-2 border-background z-10 shadow-sm shadow-accent/50" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VideoaulasHub;
