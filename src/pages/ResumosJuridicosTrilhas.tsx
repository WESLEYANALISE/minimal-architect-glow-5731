import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Footprints, Scale, Loader2, FileText, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import themisBackground from "@/assets/themis-estudos-background.webp";
import { useResumosAreasCache } from "@/hooks/useResumosAreasCache";

export default function ResumosJuridicosTrilhas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { areas, isLoading, totalResumos, totalAreas } = useResumosAreasCache();

  const AREAS_OCULTAS_RESUMOS = ["Lei Penal Especial"];
  const areasFiltradas = areas?.filter(a => 
    !AREAS_OCULTAS_RESUMOS.includes(a.area) &&
    a.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ícones por área
  const areaIcons: Record<string, string> = {
    "Direito Penal": "⚖️",
    "Direito Civil": "📜",
    "Direito Constitucional": "🏛️",
    "Direito Administrativo": "📋",
    "Direito Tributário": "💰",
    "Direito do Trabalho": "💼",
    "Direito Empresarial": "🏢",
    "Direito Processual Civil": "📄",
    "Direito Processual Penal": "🔍",
    "Direito Ambiental": "🌿",
  };

  const getIcon = (area: string) => areaIcons[area] || "📕";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d0d14]">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0">
        <img 
          src={themisBackground}
          alt="Background Resumos"
          className="w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
      </div>
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#0d0d14]" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="pt-6 pb-4 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => navigate('/resumos-juridicos')}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                  Resumos Jurídicos
                </h1>
                <p className="text-sm text-gray-400">
                  Escolha uma área do Direito
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Info Stats */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-400" />
              <span>{totalAreas} áreas</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-yellow-400" />
              <span>{totalResumos.toLocaleString('pt-BR')} resumos</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Buscar área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 h-10 rounded-full border border-white/10 bg-black/40 text-white text-sm placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Timeline de Áreas */}
        <div className="px-4 pb-24 pt-4">
          <div className="max-w-lg mx-auto relative">
            {/* Linha central da timeline */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
              <div className="w-full h-full bg-gradient-to-b from-red-500/80 via-red-600/60 to-red-700/40 rounded-full" />
              <motion.div
                className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 via-red-300/30 to-transparent rounded-full"
                animate={{ y: ["0%", "300%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            
            {areasFiltradas?.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                Nenhuma área encontrada
              </div>
            ) : (
              <div className="space-y-6">
                {areasFiltradas?.map((area, index) => {
                  const isLeft = index % 2 === 0;
                  
                  return (
                    <motion.div
                      key={area.area}
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className={`relative flex items-center ${
                        isLeft ? 'justify-start pr-[52%]' : 'justify-end pl-[52%]'
                      }`}
                    >
                      <div className="absolute left-1/2 -translate-x-1/2 z-10">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.15, 1],
                            boxShadow: [
                              "0 0 0 0 rgba(239, 68, 68, 0.4)",
                              "0 0 0 10px rgba(239, 68, 68, 0)",
                              "0 0 0 0 rgba(239, 68, 68, 0.4)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40"
                        >
                          <Footprints className="w-5 h-5 text-white" />
                        </motion.div>
                      </div>
                      
                      <div className="w-full">
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/resumos-juridicos/prontos/${encodeURIComponent(area.area)}`)}
                          className="cursor-pointer rounded-2xl bg-[#12121a]/90 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all overflow-hidden min-h-[180px] flex flex-col"
                        >
                          <div className="h-20 w-full overflow-hidden relative flex-shrink-0">
                            {area.capa ? (
                              <>
                                <img 
                                  src={area.capa} 
                                  alt={area.area}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <span className="text-4xl">{getIcon(area.area)}</span>
                              </div>
                            )}
                            <div className="absolute bottom-2 left-3">
                              <p className="text-xs font-semibold drop-shadow-lg text-red-400">
                                Área {index + 1}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex-1 p-3 flex flex-col">
                            <div className="flex-1">
                              <h3 className="font-medium text-[13px] leading-snug text-white line-clamp-2 min-h-[2.5em]">
                                {area.area}
                              </h3>
                              <div className="flex items-center gap-1 mt-2">
                                <BookOpen className="w-3 h-3 text-yellow-400" />
                                <span className="text-xs text-yellow-400 font-medium">
                                  {area.count.toLocaleString('pt-BR')} resumos
                                </span>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-500">Progresso</span>
                                <span className="text-[10px] text-green-400 font-medium">0%</span>
                              </div>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                                  style={{ width: '0%' }}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
