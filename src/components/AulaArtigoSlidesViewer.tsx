import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, GraduationCap, ChevronRight, BookOpen, Play, Clock, Target, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConceitosSlidesViewer } from "@/components/conceitos/slides/ConceitosSlidesViewer";
import { UniversalImage } from "@/components/ui/universal-image";
import type { ConceitoSecao } from "@/components/conceitos/slides/types";

interface AulaArtigoSlidesViewerProps {
  isOpen: boolean;
  onClose: () => void;
  codigoTabela: string;
  codigoNome: string;
  numeroArtigo: string;
  conteudoArtigo: string;
}

type EtapaAula = 'loading' | 'intro' | 'slides';

interface SlidesData {
  versao: number;
  titulo: string;
  tempoEstimado: string;
  area: string;
  objetivos: string[];
  secoes: ConceitoSecao[];
  flashcards: Array<{ frente: string; verso: string; exemplo?: string }>;
  questoes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explicacao: string;
  }>;
  aulaId?: string;
  cached?: boolean;
}

// Mapeamento de códigos para URLs de capa padrão
const CAPAS_CODIGOS: Record<string, string> = {
  'CP': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&h=720&fit=crop&q=80',
  'CC': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1280&h=720&fit=crop&q=80',
  'CF': 'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=1280&h=720&fit=crop&q=80',
  'CDC': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1280&h=720&fit=crop&q=80',
  'CLT': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1280&h=720&fit=crop&q=80',
  'CPP': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&h=720&fit=crop&q=80',
  'CPC': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1280&h=720&fit=crop&q=80',
  'ECA': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1280&h=720&fit=crop&q=80',
  'CTN': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1280&h=720&fit=crop&q=80',
};

const loadingMessages = [
  "Analisando o artigo em profundidade...",
  "Criando seções de estudo completas...",
  "Preparando exemplos práticos...",
  "Gerando conteúdo didático...",
  "Montando slides interativos...",
  "Finalizando sua aula personalizada..."
];

export const AulaArtigoSlidesViewer = ({
  isOpen,
  onClose,
  codigoTabela,
  codigoNome,
  numeroArtigo,
  conteudoArtigo
}: AulaArtigoSlidesViewerProps) => {
  const [slidesData, setSlidesData] = useState<SlidesData | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<EtapaAula>('loading');
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [slidesProgress, setSlidesProgress] = useState(0);
  const [capaUrl, setCapaUrl] = useState<string | null>(null);
  
  // Progress state for realistic loading indicator
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const queryClient = useQueryClient();

  // Query para verificar se a aula já existe no cache do banco
  const { data: cachedAula, isLoading: isCheckingCache } = useQuery({
    queryKey: ['aula-artigo', codigoTabela, numeroArtigo],
    queryFn: async () => {
      const codigoNorm = codigoTabela.toUpperCase().split(' ')[0].split('-')[0].trim();
      
      const { data: aulaNorm } = await supabase
        .from('aulas_artigos')
        .select('id, slides_json')
        .eq('codigo_tabela', codigoNorm)
        .eq('numero_artigo', numeroArtigo)
        .single();
      
      if (aulaNorm?.slides_json) {
        const slidesSecoes = (aulaNorm.slides_json as any)?.secoes;
        const hasSufficientSlides = slidesSecoes && 
          slidesSecoes.length >= 3 &&
          slidesSecoes.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0) >= 20;
        
        if (hasSufficientSlides) {
          return {
            ...(aulaNorm.slides_json as unknown as SlidesData),
            cached: true,
            aulaId: aulaNorm.id
          };
        }
      }
      
      const { data: aulaOrig } = await supabase
        .from('aulas_artigos')
        .select('id, slides_json')
        .eq('codigo_tabela', codigoTabela)
        .eq('numero_artigo', numeroArtigo)
        .single();
      
      if (aulaOrig?.slides_json) {
        const slidesSecoes = (aulaOrig.slides_json as any)?.secoes;
        const hasSufficientSlides = slidesSecoes && 
          slidesSecoes.length >= 3 &&
          slidesSecoes.reduce((acc: number, s: any) => acc + (s.slides?.length || 0), 0) >= 20;
        
        if (hasSufficientSlides) {
          return {
            ...(aulaOrig.slides_json as unknown as SlidesData),
            cached: true,
            aulaId: aulaOrig.id
          };
        }
      }
      
      return null;
    },
    enabled: isOpen,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30
  });

  const currentSlidesData = useMemo(() => {
    return cachedAula || slidesData;
  }, [cachedAula, slidesData]);

  useEffect(() => {
    if (!isCheckingCache && cachedAula && isOpen && etapaAtual === 'loading') {
      console.log('[AulaArtigo] ✅ Carregado do cache React Query');
      setEtapaAtual('intro');
      toast.success("Aula carregada!");
    }
  }, [isCheckingCache, cachedAula, isOpen, etapaAtual]);

  useEffect(() => {
    if (etapaAtual === 'loading') {
      const interval = setInterval(() => {
        setLoadingIndex(prev => {
          const next = (prev + 1) % loadingMessages.length;
          setLoadingMessage(loadingMessages[next]);
          return next;
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [etapaAtual]);

  // Buscar ou gerar capa do código
  useEffect(() => {
    const fetchOrGenerateCapaCodigo = async () => {
      const codigoNorm = codigoTabela.toUpperCase().split(' ')[0].split('-')[0].trim();
      
      const { data: capaData } = await supabase
        .from('codigos_capas')
        .select('capa_url')
        .eq('codigo_tabela', codigoNorm)
        .single();
      
      if (capaData?.capa_url) {
        setCapaUrl(capaData.capa_url);
      } else {
        const capaDefault = CAPAS_CODIGOS[codigoNorm];
        if (capaDefault) {
          setCapaUrl(capaDefault);
        }
        
        supabase.functions.invoke('gerar-capa-codigo', {
          body: { codigo_tabela: codigoTabela }
        }).then(response => {
          if (response.data?.capa_url) {
            setCapaUrl(response.data.capa_url);
          }
        }).catch(console.error);
      }
    };
    
    if (codigoTabela) {
      fetchOrGenerateCapaCodigo();
    }
  }, [codigoTabela]);

  useEffect(() => {
    if (!isCheckingCache && isOpen && !cachedAula && !slidesData && !isGenerating) {
      console.log('[AulaArtigo] 🔄 Iniciando geração (não há cache)');
      generateSlidesFromScratch();
    }
  }, [isCheckingCache, isOpen, cachedAula, slidesData, isGenerating]);

  const generateSlidesFromScratch = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    let progressInterval: number | undefined;
    let currentProgress = 0;
    
    const startProgressAnimation = () => {
      progressInterval = window.setInterval(() => {
        if (currentProgress < 95) {
          const increment = currentProgress < 15 ? 2.5 : currentProgress < 35 ? 2 : currentProgress < 55 ? 1.5 : currentProgress < 75 ? 1 : currentProgress < 90 ? 0.6 : 0.3;
          currentProgress = Math.min(95, currentProgress + increment);
          setProgress(Math.round(currentProgress));
          
          if (currentProgress < 15) {
            setProgressMessage("📖 Analisando o artigo...");
          } else if (currentProgress < 35) {
            setProgressMessage("🏗️ Criando estrutura da aula...");
          } else if (currentProgress < 55) {
            setProgressMessage("✍️ Gerando slides didáticos...");
          } else if (currentProgress < 75) {
            setProgressMessage("📚 Preparando conteúdo...");
          } else if (currentProgress < 90) {
            setProgressMessage("✨ Finalizando slides...");
          } else {
            setProgressMessage("🎯 Quase pronto...");
          }
        }
      }, 350);
    };
    
    try {
      setEtapaAtual('loading');
      setProgress(0);
      setProgressMessage("Iniciando...");
      
      startProgressAnimation();
      
      const response = await supabase.functions.invoke('gerar-slides-artigo', {
        body: {
          codigoTabela,
          numeroArtigo,
          conteudoArtigo,
          codigoNome
        }
      });

      if (response.error) throw response.error;

      if (progressInterval) clearInterval(progressInterval);
      
      for (let i = Math.round(currentProgress); i <= 100; i += 2) {
        setProgress(Math.min(i, 100));
        if (i < 98) setProgressMessage("🎉 Quase pronto!");
        await new Promise(r => setTimeout(r, 30));
      }
      setProgressMessage("✅ Concluído!");
      await new Promise(r => setTimeout(r, 300));

      const data = response.data as SlidesData;
      setSlidesData(data);
      
      queryClient.setQueryData(['aula-artigo', codigoTabela, numeroArtigo], data);

      if (data.cached) {
        toast.success("Aula carregada!");
      } else {
        toast.success("Aula criada com sucesso!");
      }

      setEtapaAtual('intro');
    } catch (error: any) {
      console.error('Erro ao gerar slides:', error);
      if (progressInterval) clearInterval(progressInterval);
      toast.error("Erro ao gerar aula. Tente novamente.");
      setIsGenerating(false);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartSlides = () => {
    const secoes = currentSlidesData?.secoes;
    console.log('[AulaArtigoSlides] Starting slides, secoes:', secoes?.length);
    if (!Array.isArray(secoes) || !secoes.length) {
      toast.error("Leitura indisponível. Regenere a aula.");
      console.error('[AulaArtigoSlides] No secoes found:', currentSlidesData);
      return;
    }
    if (!slidesData && currentSlidesData) {
      setSlidesData(currentSlidesData);
    }
    setEtapaAtual('slides');
  };

  const handleSlidesComplete = useCallback(() => {
    setSlidesProgress(100);
    toast.success("Leitura concluída! 🎉");
    onClose();
  }, [onClose]);

  const handleSair = () => {
    setSlidesData(null);
    setEtapaAtual('loading');
    setSlidesProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  // Slides viewer (full screen)
  if (etapaAtual === 'slides' && currentSlidesData) {
    return (
      <ConceitosSlidesViewer
        secoes={currentSlidesData.secoes}
        titulo={currentSlidesData.titulo}
        materiaName={currentSlidesData.area}
        onClose={() => setEtapaAtual('intro')}
        onComplete={handleSlidesComplete}
        onProgressChange={setSlidesProgress}
        initialProgress={slidesProgress}
        hideNarration
      />
    );
  }

  const totalSlides = currentSlidesData?.secoes?.reduce((acc, s) => acc + (s.slides?.length || 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] z-[60] flex flex-col overflow-y-auto">
      <AnimatePresence mode="wait">
        {/* Loading State */}
        {etapaAtual === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center px-6 max-w-md">
              <h2 className="text-2xl font-bold text-white mb-2">
                Art. {numeroArtigo}
              </h2>
              <p className="text-gray-400 mb-8">{codigoNome}</p>

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-6"
              >
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-28 h-28 -rotate-90">
                    <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="5" fill="none" className="text-gray-700" />
                    <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="5" fill="none" strokeDasharray={314.16} strokeDashoffset={314.16 * (1 - progress / 100)} className="text-red-500 transition-all duration-300" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-red-400">{progress}%</span>
                  </div>
                </div>
              </motion.div>

              <div className="text-center space-y-1 mb-6">
                <motion.p
                  key={progressMessage}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-base font-semibold text-white"
                >
                  {progressMessage}
                </motion.p>
                <p className="text-xs text-gray-500">Isso pode levar alguns instantes</p>
              </div>

              <Button 
                variant="ghost" 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleSair();
                }} 
                className="text-gray-400 relative z-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}

        {/* Intro Screen */}
        {etapaAtual === 'intro' && currentSlidesData && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            {/* Hero image com degradê */}
            <div className="relative w-full aspect-video max-h-72 overflow-hidden">
              <UniversalImage
                src={capaUrl}
                alt={currentSlidesData.titulo}
                priority
                blurCategory="juridico"
                containerClassName="w-full h-full"
                className="object-cover scale-110"
                fallback={
                  <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-red-400/30" />
                  </div>
                }
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
              <button
                onClick={handleSair}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/50 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 pb-8 -mt-20 relative z-10 overflow-y-auto">
              <div className="max-w-lg mx-auto">
                {/* Decorative line */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                  <span className="text-red-400 text-lg">⚖️</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                </div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center mb-6"
                >
                  <p className="text-xs text-red-400 uppercase tracking-widest font-medium mb-2">
                    {codigoNome}
                  </p>
                  <h1 
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Art. {numeroArtigo}
                  </h1>
                  <p className="text-sm text-gray-400 mt-2">
                    Prepare-se para dominar este artigo!
                  </p>
                </motion.div>

                {/* Stats row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center justify-center gap-4 mb-6 text-sm"
                >
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{currentSlidesData?.tempoEstimado || "25 min"}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-600" />
                  <div className="flex items-center gap-1 text-gray-400">
                    <BookOpen className="w-4 h-4" />
                    <span>{totalSlides} slides</span>
                  </div>
                </motion.div>

                {/* Objetivos */}
                {currentSlidesData.objetivos && currentSlidesData.objetivos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-white">Objetivos</span>
                    </div>
                    <ul className="space-y-2">
                      {currentSlidesData.objetivos.slice(0, 4).map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-red-400 mt-0.5">•</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Botão Começar Leitura */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <button
                    onClick={() => handleStartSlides()}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 rounded-xl p-4 transition-all active:scale-[0.98] shadow-lg shadow-red-500/20"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Play className="w-5 h-5 text-white" />
                      <span className="text-base font-bold text-white">Começar Leitura</span>
                    </div>
                    {slidesProgress > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Progress 
                          value={slidesProgress} 
                          className="h-1.5 flex-1 bg-white/20 [&>div]:bg-white" 
                        />
                        <span className="text-xs text-white/80 w-10 text-right">{slidesProgress}%</span>
                      </div>
                    )}
                  </button>
                </motion.div>

                {/* Footer tip */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-xs text-gray-600 mt-8"
                >
                  Os slides são interativos e ideais para memorização
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
