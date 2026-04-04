import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, MessageCircle, FileText, Send, CheckCircle2, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import whatsappResultado from "@/assets/whatsapp-update-resultado.webp";
import whatsappModal from "@/assets/whatsapp-update-modal.webp";

const STORAGE_KEY = "whatsappPdfUpdateSeen";

const SLIDES = [
  {
    icon: Sparkles,
    emoji: "🎉",
    title: "Nova função disponível!",
    description: "Agora você pode receber seus resumos em PDF diretamente no seu WhatsApp! A Evelyn, sua assistente jurídica pessoal, vai enviar pra você.",
    image: null,
  },
  {
    icon: BookOpen,
    emoji: "📚",
    title: "Passo 1",
    description: "Acesse a área de Resumos Jurídicos e escolha a matéria que deseja estudar.",
    image: null,
  },
  {
    icon: FileText,
    emoji: "📂",
    title: "Passo 2",
    description: "Escolha o tema e depois o subtema desejado para abrir o resumo completo.",
    image: null,
  },
  {
    icon: MessageCircle,
    emoji: "💬",
    title: "Passo 3",
    description: 'Na tela do resumo, clique no botão "WhatsApp" para compartilhar.',
    image: null,
  },
  {
    icon: Send,
    emoji: "📤",
    title: "Passo 4",
    description: 'Escolha entre PDF ou Texto e clique em "Enviar via Evelyn" para receber no seu número.',
    image: whatsappModal,
  },
  {
    icon: CheckCircle2,
    emoji: "✅",
    title: "Pronto!",
    description: "Receba o PDF premium completo no seu WhatsApp. Estude onde e quando quiser, mesmo offline!",
    image: whatsappResultado,
  },
];

const WhatsAppPdfUpdateCard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const alreadySeen = localStorage.getItem(STORAGE_KEY) === "true";
    if (alreadySeen) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleFinish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsVisible(false);
  };

  const isLastSlide = currentStep === SLIDES.length - 1;
  const slide = SLIDES[currentStep];
  const Icon = slide.icon;

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[102] transition-opacity duration-300" />

      {/* Card */}
      <div className="fixed inset-0 z-[103] flex items-center justify-center p-4 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/20"
          style={{
            background: "linear-gradient(160deg, hsl(25 20% 8%) 0%, hsl(20 15% 6%) 100%)",
          }}
        >
          {/* Green glow strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400" />

          <div className="p-6 pt-8">
            {/* Slide content with animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center gap-3"
              >
                {/* Icon */}
                {!slide.image && (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      background: "radial-gradient(circle, hsl(150 60% 30% / 0.35) 0%, hsl(150 60% 20% / 0.15) 100%)",
                    }}
                  >
                    <Icon className="w-8 h-8 text-emerald-400" />
                  </div>
                )}

                {/* Emoji + Title */}
                <div>
                  <p className="text-2xl mb-1">{slide.emoji}</p>
                  <h2 className="text-lg font-bold text-white">{slide.title}</h2>
                </div>

                {/* Screenshot image */}
                {slide.image && (
                  <div className="w-full rounded-xl overflow-hidden border border-white/10 max-h-[320px]">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-auto object-cover object-top"
                    />
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-white/70 leading-relaxed min-h-[40px]">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mt-4 mb-4">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-emerald-400"
                      : i < currentStep
                      ? "w-1.5 bg-emerald-400/50"
                      : "w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="flex-1 h-12 text-white/60 hover:text-white hover:bg-white/5 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
              )}
              {isLastSlide ? (
                <Button
                  onClick={handleFinish}
                  className="flex-1 h-12 font-bold text-base rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, hsl(150 60% 40%), hsl(160 70% 45%))",
                    color: "white",
                    boxShadow: "0 4px 20px hsl(150 60% 35% / 0.4)",
                  }}
                >
                  <CheckCircle2 className="w-5 h-5 mr-1" />
                  Entendi!
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  className="flex-1 h-12 font-bold text-base rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, hsl(150 60% 40%), hsl(160 70% 45%))",
                    color: "white",
                    boxShadow: "0 4px 20px hsl(150 60% 35% / 0.4)",
                  }}
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WhatsAppPdfUpdateCard;
