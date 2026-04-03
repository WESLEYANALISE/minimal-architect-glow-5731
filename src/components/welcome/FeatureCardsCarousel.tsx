import { useRef, useState, useCallback } from "react";
import atalhoAulas from "@/assets/atalho-aulas.webp";
import atalhoFlashcards from "@/assets/atalho-flashcards.webp";
import atalhoQuestoes from "@/assets/atalho-questoes.webp";
import atalhoBiblioteca from "@/assets/atalho-biblioteca.webp";
import atalhoVademecum from "@/assets/atalho-vademecum.webp";
import atalhoVideoaulas from "@/assets/atalho-videoaulas.webp";
import atalhoResumos from "@/assets/atalho-resumos.webp";
import atalhoAudioaulas from "@/assets/atalho-audioaulas.webp";
import atalhoCarreiras from "@/assets/atalho-carreiras.webp";
import atalhoJuriflix from "@/assets/atalho-juriflix.webp";
import atalhoProfessora from "@/assets/atalho-professora.webp";
import atalhoIniciando from "@/assets/atalho-iniciando.webp";
import atalhoEvelyn from "@/assets/atalho-evelyn.webp";
import atalhoBibliotecaJuridica from "@/assets/atalho-biblioteca-juridica.webp";

const CARDS = [
  { src: atalhoAulas, label: "Aulas Interativas", desc: "Aprenda com aulas dinâmicas e práticas" },
  { src: atalhoFlashcards, label: "Flashcards", desc: "Memorize com método ativo" },
  { src: atalhoQuestoes, label: "Questões", desc: "Pratique com questões reais" },
  { src: atalhoBiblioteca, label: "Biblioteca", desc: "Acervo jurídico completo" },
  { src: atalhoVademecum, label: "Vade Mecum", desc: "Leis sempre atualizadas" },
  { src: atalhoVideoaulas, label: "Videoaulas", desc: "Assista e aprenda no seu ritmo" },
  { src: atalhoResumos, label: "Resumos", desc: "Conteúdo direto ao ponto" },
  { src: atalhoAudioaulas, label: "Audioaulas", desc: "Estude ouvindo em qualquer lugar" },
  { src: atalhoCarreiras, label: "Carreiras", desc: "Concursos e editais abertos" },
  { src: atalhoJuriflix, label: "JuriFlix", desc: "Documentários e vídeos jurídicos" },
  { src: atalhoProfessora, label: "Professora IA", desc: "Tire dúvidas com inteligência artificial" },
  { src: atalhoIniciando, label: "Primeiros Passos", desc: "Comece sua jornada no Direito" },
  { src: atalhoEvelyn, label: "Assistente", desc: "Sua assistente jurídica pessoal" },
  { src: atalhoBibliotecaJuridica, label: "Biblioteca Jurídica", desc: "Doutrina e legislação completa" },
];

export const FeatureCardsCarousel = () => {
  const [isTouching, setIsTouching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleTouchStart = useCallback(() => {
    setIsTouching(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsTouching(false), 3000);
  }, []);

  return (
    <div
      className="w-full overflow-x-auto my-4 -mx-6 px-0 scrollbar-hide"
      style={{ width: 'calc(100% + 3rem)', WebkitOverflowScrolling: 'touch' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`flex gap-4 ${isTouching ? '' : 'animate-[scrollLeft_60s_linear_infinite]'}`}
        style={{ width: "max-content", willChange: isTouching ? 'auto' : 'transform' }}
      >
        {[...CARDS, ...CARDS].map((card, i) => (
          <div
            key={`${card.label}-${i}`}
            className="flex-shrink-0 w-[140px] sm:w-[160px] rounded-2xl overflow-hidden shadow-xl shadow-black/40 border border-white/15 bg-black/40 backdrop-blur-sm relative shine-effect"
          >
            <div className="relative w-full aspect-square overflow-hidden">
              <img
                src={card.src}
                alt={card.label}
                width={160}
                height={160}
                loading="eager"
                fetchPriority={i < 14 ? "high" : "auto"}
                decoding="async"
                className="w-full h-full object-cover brightness-110 contrast-105"
              />
              {/* Glow overlay for extra shine */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)',
                }}
              />
            </div>
            <div className="px-2.5 py-2">
              <h4 className="text-white text-xs font-bold leading-tight truncate">{card.label}</h4>
              <p className="text-white/60 text-[10px] leading-tight mt-0.5 line-clamp-2">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
