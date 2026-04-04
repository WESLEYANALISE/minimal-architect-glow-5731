import { useState, useRef, useCallback } from "react";
import { Monitor, Mail, ExternalLink, X, ChevronRight, ChevronLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import slide1 from "@/assets/desktop-slides/slide-dashboard.webp";
import slide2 from "@/assets/desktop-slides/slide-vademecum.webp";
import slide3 from "@/assets/desktop-slides/slide-flashcards.webp";
import slide4 from "@/assets/desktop-slides/slide-ia.webp";
import slide5 from "@/assets/desktop-slides/slide-videoaulas.webp";
import slide6 from "@/assets/desktop-slides/slide-noticias.webp";
import slide7 from "@/assets/desktop-slides/slide-simulados.webp";

const SLIDES = [
  { src: slide1, label: "Dashboard" },
  { src: slide2, label: "Vade Mecum" },
  { src: slide3, label: "Flashcards" },
  { src: slide4, label: "Assistente IA" },
  { src: slide5, label: "Videoaulas" },
  { src: slide6, label: "Notícias" },
  { src: slide7, label: "Simulados" },
];

const ModoDesktop = () => {
  const { user } = useAuth();
  const [showCard, setShowCard] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const userEmail = user?.email || "seu@email.com";
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const goToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
    setCurrentSlide(clamped);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goToSlide(currentSlide + (diff > 0 ? 1 : -1));
    }
  };

  const handleEnviarAcesso = () => setShowCard(true);

  const handleConfirmSend = () => {
    toast.success("Link de acesso enviado para " + userEmail);
    setShowCard(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 space-y-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/20">
            <Monitor className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Acesso Desktop</h1>
            <p className="text-[11px] text-muted-foreground">Estude pelo computador</p>
          </div>
        </div>
      </div>

      {/* Slides Carousel */}
      <div className="px-4 mb-4">
        <div className="relative rounded-xl overflow-hidden border border-white/[0.08] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)]">
          {/* Slide container */}
          <div
            className="relative w-full aspect-video overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {SLIDES.map((slide, i) => (
              <img
                key={i}
                src={slide.src}
                alt={slide.label}
                loading={i === 0 ? "eager" : "lazy"}
                width={1280}
                height={720}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out ${
                  i === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              />
            ))}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

            {/* Label */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div>
                <p className="text-white font-bold text-sm drop-shadow-lg">{SLIDES[currentSlide].label}</p>
                <p className="text-white/50 text-[10px]">{currentSlide + 1} de {SLIDES.length}</p>
              </div>
            </div>

            {/* Nav arrows */}
            {currentSlide > 0 && (
              <button
                onClick={() => goToSlide(currentSlide - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-black/60 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            )}
            {currentSlide < SLIDES.length - 1 && (
              <button
                onClick={() => goToSlide(currentSlide + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:bg-black/60 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            )}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 py-2.5 bg-black/40 backdrop-blur-sm">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "bg-rose-400 w-5 shadow-sm shadow-rose-400/40"
                    : "bg-white/20 w-1.5 hover:bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-4 mb-6">
        <Button
          onClick={handleEnviarAcesso}
          className="w-full h-12 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-900/30 gap-2"
        >
          <Mail className="w-4 h-4" />
          Enviar Acesso
        </Button>
      </div>

      {/* Melhor Experiência Section */}
      <div className="px-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10">
            <Star className="w-4 h-4 text-rose-400" />
          </div>
          <h2 className="text-base font-bold text-foreground">Melhor Experiência</h2>
        </div>

        <div className="p-4 rounded-xl bg-card/50 border border-white/[0.06] space-y-3">
          <p className="text-sm text-foreground/90 leading-relaxed">
            O modo desktop foi pensado para oferecer a <span className="font-semibold text-rose-300">melhor experiência de estudos</span> possível. Com uma tela ampla, você aproveita cada ferramenta com mais espaço, organização e foco.
          </p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Navegue pelo Vade Mecum com anotações laterais, estude flashcards em tela cheia, acompanhe videoaulas sem distrações e utilize a assistente jurídica com painel expandido. Seu progresso, anotações e favoritos sincronizam automaticamente entre celular e computador.
          </p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Ideal para sessões longas de estudo, preparação para a OAB, concursos e revisão de legislação — tudo em uma interface otimizada para produtividade.
          </p>
        </div>
      </div>

      {/* Sync note */}
      <div className="px-4 mt-5">
        <div className="p-3 rounded-xl bg-rose-950/15 border border-rose-500/10 flex items-start gap-2.5">
          <ChevronRight className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Use o mesmo login do app. Progresso, anotações e favoritos sincronizam automaticamente.
          </p>
        </div>
      </div>

      {/* Floating Card Overlay */}
      {showCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden">
            <button
              onClick={() => setShowCard(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/20">
                  <Mail className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Enviar acesso</h3>
                  <p className="text-[11px] text-muted-foreground">Vamos enviar o link para:</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/10">
                <p className="text-[13px] font-semibold text-rose-300 text-center truncate">{userEmail}</p>
              </div>

              <Button
                onClick={handleConfirmSend}
                className="w-full h-11 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm rounded-xl gap-2"
              >
                <Mail className="w-4 h-4" />
                Confirmar envio
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-[11px] text-muted-foreground">ou acesse diretamente</span>
                </div>
              </div>

              <button
                onClick={() => window.open("https://direitoeprimeiro.com.br", "_blank")}
                className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-rose-400" />
                  <span className="text-[13px] font-medium text-foreground">direitoeprimeiro.com.br</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModoDesktop;
