import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gavel, Target, Scale } from "lucide-react";
import { motion } from "framer-motion";
import lawyerJusticeBg from "@/assets/lawyer-justice-bg.webp";
import oabPrimeiraThumb from "@/assets/thumbnails/oab-primeira-fase-thumb.webp";
import oabSegundaThumb from "@/assets/thumbnails/oab-segunda-fase-thumb.webp";

const AulasOabPage = () => {
  const navigate = useNavigate();

  const phases = [
    {
      title: "1ª Fase",
      subtitle: "Prova objetiva • Trilhas de aprovação",
      icon: <Target className="w-5 h-5 text-red-400" />,
      thumb: oabPrimeiraThumb,
      onClick: () => navigate("/oab/primeira-fase"),
    },
    {
      title: "2ª Fase",
      subtitle: "Peça prática • Preparação completa",
      icon: <Scale className="w-5 h-5 text-red-400" />,
      thumb: oabSegundaThumb,
      onClick: () => navigate("/oab/segunda-fase"),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <img src={lawyerJusticeBg} alt="" className="w-full h-full object-cover opacity-40" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/aulas")} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Trilhas OAB</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 py-6">
        <div className="text-center mb-8">
          <Gavel className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h2 className="font-cinzel text-xl font-bold text-amber-100">Trilhas OAB</h2>
          <p className="text-amber-200/60 text-xs mt-1">Preparação completa para o Exame</p>
        </div>

        <div className="space-y-4">
          {phases.map((phase, index) => (
            <motion.button
              key={phase.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={phase.onClick}
              className="w-full relative overflow-hidden rounded-2xl text-left h-[160px] active:scale-[0.98] transition-transform shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)]"
            >
              <img src={phase.thumb} alt={phase.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
              <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-2.5 w-fit">
                  {phase.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{phase.title}</h3>
                  <p className="text-white/50 text-xs mt-0.5">{phase.subtitle}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AulasOabPage;
