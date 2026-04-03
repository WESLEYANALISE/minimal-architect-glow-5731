import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Star, Swords, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CasoPreview {
  nivel: string;
  caso: string;
  pontos_chave: string[];
}

interface BatalhaCasosCarouselProps {
  casos: CasoPreview[];
  onSelecionar: (index: number) => void;
}

const nivelConfig = {
  facil: {
    label: "Fácil",
    color: "from-emerald-600 to-emerald-700",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    borderClass: "border-emerald-500/30 hover:border-emerald-400/60",
    bgClass: "bg-emerald-900/10",
    icon: Star,
    stars: 1,
  },
  medio: {
    label: "Médio",
    color: "from-amber-600 to-amber-700",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    borderClass: "border-amber-500/30 hover:border-amber-400/60",
    bgClass: "bg-amber-900/10",
    icon: Swords,
    stars: 2,
  },
  dificil: {
    label: "Difícil",
    color: "from-red-600 to-red-700",
    badgeClass: "bg-red-500/20 text-red-300 border-red-500/30",
    borderClass: "border-red-500/30 hover:border-red-400/60",
    bgClass: "bg-red-900/10",
    icon: Shield,
    stars: 3,
  },
};

const BatalhaCasosCarousel = ({ casos, onSelecionar }: BatalhaCasosCarouselProps) => {
  const [emblaRef] = useEmblaCarousel({ loop: false, align: "center" });
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-xl font-bold text-white mb-1">Escolha o Nível</h2>
        <p className="text-gray-400 text-sm">Deslize para ver os 3 casos disponíveis</p>
      </motion.div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {casos.map((caso, i) => {
            const config = nivelConfig[caso.nivel as keyof typeof nivelConfig] || nivelConfig.medio;
            const Icon = config.icon;
            const isSelected = selected === i;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="min-w-[85%] sm:min-w-[80%]"
              >
                <div
                  onClick={() => setSelected(i)}
                  className={`cursor-pointer rounded-2xl border-2 transition-all duration-300 overflow-hidden ${config.bgClass} ${
                    isSelected ? config.borderClass.replace("hover:", "") + " ring-2 ring-white/20" : config.borderClass
                  }`}
                >
                  {/* Card Header */}
                  <div className={`p-4 bg-gradient-to-r ${config.color} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-base">Caso {i + 1}</p>
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: config.stars }).map((_, s) => (
                            <Star key={s} className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <Badge className={config.badgeClass + " text-xs font-bold"}>
                      {config.label}
                    </Badge>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {caso.caso.substring(0, 200)}...
                    </p>

                    <div className="space-y-1.5">
                      {caso.pontos_chave.slice(0, 3).map((ponto, j) => (
                        <div key={j} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5 flex-shrink-0" />
                          <p className="text-gray-400 text-xs line-clamp-1">{ponto}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="px-4 pb-4"
                    >
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelecionar(i);
                        }}
                        className={`w-full h-11 bg-gradient-to-r ${config.color} text-white font-bold gap-2`}
                      >
                        <Swords className="w-4 h-4" />
                        Selecionar Este Caso
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2">
        {casos.map((caso, i) => {
          const config = nivelConfig[caso.nivel as keyof typeof nivelConfig] || nivelConfig.medio;
          return (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                selected === i ? "w-6 bg-white" : "bg-gray-600"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BatalhaCasosCarousel;
