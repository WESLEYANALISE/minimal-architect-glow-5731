import { useState, useRef, useEffect, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Lightbulb, 
  AlertTriangle, 
  Briefcase,
  CheckCircle2,
  XCircle,
  BookOpen,
  Scale,
  Table2,
  Clock,
  Sparkles,
  LayoutList,
  ChevronRight,
  ChevronLeft,
  List,
  Loader2,
  Play,
  Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideLinhaTempo } from "@/components/aula-v2/SlideLinhaTempo";
import { SlideTabela } from "@/components/aula-v2/SlideTabela";
import { UniversalImage } from "@/components/ui/universal-image";
import { isImageCached } from "@/hooks/useImagePreload";
import EnrichedMarkdownRenderer from "@/components/EnrichedMarkdownRenderer";
import DragDropMatchingGame from "@/components/DragDropMatchingGame";
import confetti from "canvas-confetti";
import type { ConceitoSlide, CollapsibleItem } from "./types";

interface ConceitoSlideCardProps {
  slide: ConceitoSlide;
  paginaIndex: number;
  totalPaginas: number;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
  fontSize?: number;
  direction?: 'next' | 'prev';
  onQuestionAnswered?: (answered: boolean) => void;
  isLastSlide?: boolean;
  onGoToFlashcards?: () => void;
  capaUrl?: string;
  generatedImageUrl?: string;
  isImageGenerating?: boolean;
  // Narration props (per-slide)
  narrationProgress?: number;
  narrationCurrentTime?: number;
  narrationDuration?: number;
  isNarrating?: boolean;
  isNarrationGenerating?: boolean;
  onToggleNarration?: () => void;
  isAdmin?: boolean;
}

const iconMap: Record<string, ElementType> = {
  introducao: Sparkles,
  texto: FileText,
  termos: BookOpen,
  correspondencias: Scale,
  explicacao: Lightbulb,
  linha_tempo: Clock,
  tabela: Table2,
  atencao: AlertTriangle,
  dica: Sparkles,
  caso: Briefcase,
  resumo: LayoutList,
  quickcheck: CheckCircle2
};

const getPaginaLabel = (tipo: string): string => {
  switch (tipo) {
    case 'introducao': return 'Introdução';
    case 'texto': return 'Conteúdo';
    case 'termos': return 'Termos importantes';
    case 'correspondencias': return 'Exercício interativo';
    case 'explicacao': return 'Isso significa';
    case 'linha_tempo': return 'Passo a passo';
    case 'tabela': return 'Quadro comparativo';
    case 'atencao': return 'Atenção!';
    case 'dica': return 'Dica de memorização';
    case 'caso': return 'Caso prático';
    case 'resumo': return 'Resumo';
    case 'quickcheck': return 'Verificação rápida';
    default: return 'Conteúdo';
  }
};

// Converte collapsible items para formato Markdown (legado)
const convertCollapsibleToMarkdown = (items: CollapsibleItem[]): string => {
  if (!items || items.length === 0) return '';
  return items.map(item => {
    return `### ${item.titulo}\n\n${item.conteudo}`;
  }).join('\n\n');
};

// Variantes de animação fluida (igual OAB Trilhas - deslocamento curto + fade)
const slideVariants = {
  enter: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? 80 : -80,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: 'next' | 'prev') => ({
    x: direction === 'next' ? -80 : 80,
    opacity: 0
  })
};

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const ConceitoSlideCard = ({
  slide,
  paginaIndex,
  totalPaginas,
  onNext,
  onPrevious,
  canGoBack,
  fontSize = 15,
  direction = 'next',
  onQuestionAnswered,
  isLastSlide = false,
  onGoToFlashcards,
  capaUrl,
  generatedImageUrl,
  isImageGenerating = false,
  narrationProgress = 0,
  narrationCurrentTime = 0,
  narrationDuration = 0,
  isNarrating = false,
  isNarrationGenerating = false,
  onToggleNarration,
  isAdmin = false,
}: ConceitoSlideCardProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const Icon = iconMap[slide.tipo] || FileText;

  // Scroll to top when page changes - INSTANT para garantir posição
  useEffect(() => {
    // Scroll imediato (não suave) para garantir que comece do topo
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    
    // Também scrollar o container interno se existir
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    
    // E o container pai de overflow
    const scrollContainer = document.querySelector('.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [paginaIndex]);

  // Reset state quando slide muda
  useEffect(() => {
    setSelectedOption(null);
    setShowFeedback(false);
    // Notificar se é slide de questão
    const isQuiz = slide.tipo === 'quickcheck';
    onQuestionAnswered?.(!isQuiz); // Se não é quiz, considera "respondido"
  }, [paginaIndex, slide.tipo, onQuestionAnswered]);

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    
    setSelectedOption(index);
    setShowFeedback(true);
    onQuestionAnswered?.(true); // Questão foi respondida
    
    if (index === slide.resposta) {
      // Confete com tratamento de erro para evitar tela branca em mobile/iFrame
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          disableForReducedMotion: true
        });
      } catch (error) {
        console.warn('Confetti animation failed:', error);
      }
    }
  };

  const handleContinue = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    onNext();
  };

  const isQuickCheck = slide.tipo === 'quickcheck';
  const isCorrect = selectedOption === slide.resposta;
  
  // Image priority: slide's own image > generated image from hook > capa for intro/first slide
  // Non-admin users don't see images at all
  const resolvedImageUrl = isAdmin 
    ? (slide.imagemUrl || generatedImageUrl || ((slide.tipo === 'introducao' || paginaIndex === 0) ? capaUrl : undefined))
    : undefined;
  const showImage = isAdmin && !isQuickCheck && (resolvedImageUrl || isImageGenerating);
  
  // Verificar se imagem já está em cache para desabilitar blur placeholder
  const imageIsCached = resolvedImageUrl ? isImageCached(resolvedImageUrl) : false;

  // Render specialized content based on page type - collapsible agora vira texto
  const renderContent = () => {
    // Para slides legados do tipo collapsible, converte para texto
    if ((slide as any).tipo === 'collapsible' || (slide.collapsibleItems && slide.collapsibleItems.length > 0)) {
      const collapsibleMarkdown = slide.collapsibleItems && slide.collapsibleItems.length > 0
        ? convertCollapsibleToMarkdown(slide.collapsibleItems)
        : slide.conteudo;
      
      return (
        <EnrichedMarkdownRenderer 
          content={collapsibleMarkdown || ''}
          fontSize={fontSize}
          theme="classicos"
        />
      );
    }

    switch (slide.tipo) {

      case 'linha_tempo':
        if (slide.etapas && slide.etapas.length > 0) {
          return (
            <SlideLinhaTempo 
              etapas={slide.etapas}
              titulo={slide.titulo}
              conteudo={slide.conteudo}
            />
          );
        }
        break;

      case 'tabela':
        if (slide.tabela) {
          return (
            <SlideTabela 
              tabela={slide.tabela}
              titulo={slide.titulo}
              conteudo={slide.conteudo}
            />
          );
        }
        break;

      case 'resumo':
        // Se tem pontos significativos (não são apenas títulos de seções), renderiza como lista
        // Caso contrário, renderiza o conteúdo como texto corrido (síntese real)
        const temPontosReais = slide.pontos && slide.pontos.length > 0 && 
          slide.pontos.some(p => p && p.length > 50); // Pontos reais têm mais de 50 caracteres
        
        if (temPontosReais) {
          const resumoMarkdown = slide.pontos!.map((ponto, idx) => 
            `**${idx + 1}.** ${ponto}`
          ).join('\n\n');
          
          return (
            <EnrichedMarkdownRenderer 
              content={resumoMarkdown}
              fontSize={fontSize}
              theme="classicos"
            />
          );
        } else if (slide.conteudo) {
          // Síntese como texto corrido
          return (
            <EnrichedMarkdownRenderer 
              content={slide.conteudo}
              fontSize={fontSize}
              theme="classicos"
            />
          );
        }
        break;

      case 'dica':
        // Dica renderizada diretamente sem header adicional (o label do slide já identifica o tipo)
        return (
          <EnrichedMarkdownRenderer 
            content={slide.conteudo}
            fontSize={fontSize}
            theme="classicos"
          />
        );

      case 'termos':
        if (slide.termos && slide.termos.length > 0) {
          return (
            <div className="space-y-4">
              {slide.termos.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white uppercase text-sm tracking-wide" style={{ fontFamily: "'Crimson Text', serif" }}>
                        {item.termo}
                      </h4>
                      <p className="text-gray-300 text-sm mt-1 leading-relaxed">
                        {item.definicao}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          );
        }
        break;

      case 'correspondencias': {
        const pares = (slide.correspondencias || []).filter((p) => p?.termo && p?.definicao);
        if (pares.length > 0) {
          return (
            <div className="space-y-6">
              {slide.conteudo ? (
                <EnrichedMarkdownRenderer content={slide.conteudo} fontSize={fontSize} theme="classicos" />
              ) : null}
              <DragDropMatchingGame
                items={pares.map((p) => ({ conceito: p.termo, definicao: p.definicao }))}
              />
            </div>
          );
        }
        break;
      }

      case 'quickcheck':
        return (
          <div className="space-y-4">
            <p className="text-white font-medium text-lg" style={{ fontFamily: "'Crimson Text', serif" }}>
              {slide.pergunta}
            </p>
            
            <div className="space-y-3 mt-6">
              {slide.opcoes?.map((opcao, index) => {
                const isSelected = selectedOption === index;
                const isCorrectOption = index === slide.resposta;
                
                let optionStyle = "bg-white/5 border-white/10 hover:border-red-500/50 hover:bg-red-500/5";
                
                if (showFeedback) {
                  if (isCorrectOption) {
                    optionStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                  } else if (isSelected && !isCorrectOption) {
                    optionStyle = "bg-red-500/20 border-red-500 text-red-400";
                  } else {
                    optionStyle = "bg-white/5 border-white/10 opacity-50";
                  }
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        showFeedback && isCorrectOption 
                          ? 'border-emerald-500 bg-emerald-500' 
                          : showFeedback && isSelected 
                            ? 'border-red-500 bg-red-500' 
                            : 'border-white/30'
                      }`}>
                        {showFeedback && isCorrectOption && (
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        )}
                        {showFeedback && isSelected && !isCorrectOption && (
                          <XCircle className="w-5 h-5 text-white" />
                        )}
                        {!showFeedback && (
                          <span className="text-sm font-medium text-white/70">
                            {String.fromCharCode(65 + index)}
                          </span>
                        )}
                      </div>
                      <span className="flex-1 text-white/90">{opcao}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-6 p-4 rounded-xl ${
                    isCorrect 
                      ? 'bg-emerald-500/10 border border-emerald-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-semibold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCorrect ? 'Correto!' : 'Incorreto'}
                      </p>
                      {slide.feedback && (
                        <p className="text-gray-400 text-sm mt-1">
                          {slide.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
    }

    // Default: render text content with EnrichedMarkdownRenderer
    // Para introdução, garantir que bullets fiquem em linhas separadas
    let processedContent = slide.conteudo || '';
    if (slide.tipo === 'introducao') {
      // Separar bullets · que estejam concatenados na mesma linha
      processedContent = processedContent.replace(/\s*[·•]\s*/g, '\n\n· ');
      // Limpar possível \n\n no início
      processedContent = processedContent.replace(/^\n+/, '');
    }
    
    return (
      <EnrichedMarkdownRenderer 
        content={processedContent}
        fontSize={fontSize}
        theme="classicos"
      />
    );
  };

  return (
    <motion.div
      ref={containerRef}
      key={paginaIndex}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ 
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
      className="min-h-[calc(100vh-8rem)] flex flex-col px-0 py-2 pb-0 max-w-2xl mx-auto"
    >
      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {Array.from({ length: Math.min(totalPaginas, 20) }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === paginaIndex 
                ? 'w-6 bg-red-500' 
                : i < paginaIndex 
                  ? 'w-1.5 bg-red-500/50' 
                  : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
        {totalPaginas > 20 && (
          <span className="text-xs text-gray-500 ml-1">
            +{totalPaginas - 20}
          </span>
        )}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col">
        {/* Imagem ilustrativa - todos os slides (exceto quickcheck) */}
        {showImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative mb-4 -mx-2 overflow-hidden shine-effect"
          >
            {resolvedImageUrl ? (
              <UniversalImage
                src={resolvedImageUrl}
                alt={slide.titulo || "Ilustração"}
                aspectRatio="16/9"
                blurCategory="juridico"
                disableBlur={imageIsCached}
                containerClassName="w-full"
              />
            ) : (
              // Loading state for image being generated
              <div className="aspect-video bg-[#1a1a2e] flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Gerando ilustração...</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Narration progress bar below cover - admin only */}
        {isAdmin && slide.tipo !== 'quickcheck' && (
          <div className="mb-3 px-1">
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleNarration}
                disabled={isNarrationGenerating}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                  isNarrationGenerating
                    ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                    : isNarrating 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}
              >
                {isNarrationGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isNarrating ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, Number.isFinite(narrationProgress) ? narrationProgress : 0))}%` }}
                  />
                </div>
              </div>
              
              <span className="text-[10px] text-gray-500 font-mono flex-shrink-0 min-w-[60px] text-right">
                {isNarrationGenerating ? 'Gerando...' : `${formatTime(narrationCurrentTime)}/${formatTime(narrationDuration)}`}
              </span>
            </div>
          </div>
        )}

        {/* Decorative element - borda lateral por tipo */}
        <div className={`flex items-center gap-2 mb-4 ${
          slide.tipo === 'dica' ? 'border-l-4 border-amber-500/60 pl-3' :
          slide.tipo === 'atencao' ? 'border-l-4 border-red-500/60 pl-3' :
          slide.tipo === 'caso' ? 'border-l-4 border-blue-500/60 pl-3' :
          ''
        }`}>
          <span className={`${
            slide.tipo === 'dica' ? 'text-amber-400' :
            slide.tipo === 'atencao' ? 'text-red-400' :
            slide.tipo === 'caso' ? 'text-blue-400' :
            'text-red-400'
          }`}>
            {slide.tipo === 'dica' ? '💡' : slide.tipo === 'atencao' ? '⚠️' : slide.tipo === 'caso' ? '⚖️' : '✦'}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-red-500/50 to-transparent" />
        </div>

        {/* Main content card com título DENTRO */}
        <div className="bg-transparent px-4 py-4 flex-1 overflow-y-auto" style={{ fontFamily: "'Source Serif 4', 'Crimson Text', serif" }}>
          {/* Label e título - agora no card de conteúdo */}
          <div className="mb-4">
            <p className={`text-xs uppercase tracking-[0.2em] font-medium mb-1.5 ${
              slide.tipo === 'dica' ? 'text-amber-400' :
              slide.tipo === 'atencao' ? 'text-red-400' :
              slide.tipo === 'caso' ? 'text-blue-400' :
              'text-red-400'
            }`}>
              {getPaginaLabel(slide.tipo)}
            </p>
            {slide.titulo && (
              <h2 
                className="text-xl md:text-2xl font-bold text-white leading-snug tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {slide.titulo}
              </h2>
            )}
          </div>

          {/* Linha decorativa abaixo do título */}
          <div className="h-px w-full bg-gradient-to-r from-red-500/30 via-orange-500/20 to-transparent mb-5" />

          {/* Conteúdo */}
          {renderContent()}
          
        </div>
      </div>
      
      {/* Botão FLUTUANTE para Flashcards no último slide - aparece com animação */}
      {isLastSlide && onGoToFlashcards && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            delay: 0.5, 
            type: "spring", 
            stiffness: 200, 
            damping: 20 
          }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 rounded-2xl p-4 shadow-2xl shadow-purple-500/40 border border-purple-400/30">
            <div className="text-center mb-3">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white font-medium"
              >
                🎉 Parabéns! Leitura concluída!
              </motion.p>
              <p className="text-purple-200 text-xs mt-1">
                Continue para fixar o conteúdo
              </p>
            </div>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.95, 1.02, 1] }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Button
                onClick={onGoToFlashcards}
                className="w-full bg-white hover:bg-gray-100 text-purple-700 font-bold py-3 rounded-xl shadow-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Ir para Flashcards
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Navigation buttons removed - now in ConceitosSlidesFooter */}
    </motion.div>
  );
};

export default ConceitoSlideCard;
