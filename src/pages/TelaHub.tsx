import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Scale, FileText, Play } from "lucide-react";
import telaBackground from "@/assets/tela-background.webp";

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
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${telaBackground})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />

      {/* Content */}
      <div className="relative z-10 min-h-screen pb-32">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm pb-4">
          <div className="flex items-center gap-4 p-4">
            <div>
              <h1 className="text-xl font-bold text-white">Videoaulas</h1>
              <p className="text-sm text-white/70">Conteúdo audiovisual</p>
            </div>
          </div>
        </div>

        {/* Grid de categorias */}
        <div className="px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {categoriasVideoaulas.map((categoria, index) => {
              const Icon = categoria.icon;
              const thumbnail = videoaulasThumbnails?.[categoria.id];

              return (
                <motion.div
                  key={categoria.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  onClick={() => navigate(categoria.route)}
                  className="cursor-pointer rounded-2xl shadow-lg shadow-red-900/20 transition-all duration-300 border border-red-600/30 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-600/25 hover:scale-[1.03] overflow-hidden relative aspect-video"
                >
                  {/* Thumbnail de fundo */}
                  {thumbnail ? (
                    <>
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${thumbnail})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-800 to-red-900" />
                  )}
                  
                  {/* Botão de Player central */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/20">
                      <Play className="w-6 h-6 text-white/80 fill-white/60" />
                    </div>
                  </div>
                  
                  {/* Ícone e Título */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-600/80 shrink-0">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                      {categoria.title}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoaulasHub;
