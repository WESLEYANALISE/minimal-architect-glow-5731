import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Brain } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { normalizeToBaseLetter } from "@/components/dicionario/DicionarioLetterGrid";
import { motion } from "framer-motion";
import heroFlashcards from "@/assets/hero-flashcards.webp";
import themisEstudos from "@/assets/themis-estudos-background.webp";
import heroResumos from "@/assets/hero-resumos.webp";
import heroVideoaulas from "@/assets/hero-videoaulas.webp";

const LETTER_GRADIENTS: Record<string, string> = {
  A: "from-red-600 to-red-800",
  B: "from-blue-600 to-blue-800",
  C: "from-purple-600 to-purple-800",
  D: "from-teal-600 to-teal-800",
  E: "from-orange-500 to-orange-700",
  F: "from-emerald-600 to-emerald-800",
  G: "from-indigo-500 to-indigo-700",
  H: "from-pink-600 to-pink-800",
  I: "from-amber-500 to-amber-700",
  J: "from-cyan-600 to-cyan-800",
  K: "from-violet-500 to-violet-700",
  L: "from-lime-600 to-lime-800",
  M: "from-yellow-600 to-yellow-800",
  N: "from-sky-600 to-sky-800",
  O: "from-fuchsia-600 to-fuchsia-800",
  P: "from-slate-500 to-slate-700",
  Q: "from-rose-500 to-rose-700",
  R: "from-teal-500 to-teal-700",
  S: "from-green-600 to-green-800",
  T: "from-blue-500 to-blue-700",
  U: "from-orange-600 to-orange-800",
  V: "from-indigo-600 to-indigo-800",
  W: "from-stone-500 to-stone-700",
  X: "from-gray-500 to-gray-700",
  Y: "from-red-500 to-red-700",
  Z: "from-purple-500 to-purple-700",
};

const HERO_SLIDES = [
  { title: "Termos Jurídicos", subtitle: "Domine o vocabulário do Direito com flashcards interativos", image: heroFlashcards },
  { title: "De A a Z", subtitle: "Todos os termos jurídicos organizados por letra", image: themisEstudos },
  { title: "Memorize com Eficiência", subtitle: "Técnica de repetição espaçada para fixar o conteúdo", image: heroResumos },
  { title: "Dicionário Completo", subtitle: "Milhares de termos com significados e exemplos práticos", image: heroVideoaulas },
];

const FlashcardsTermosJuridicos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [slideIndex, setSlideIndex] = useState(0);

  // Letter counts - paginated
  const { data: letterCounts = [], isLoading } = useQuery({
    queryKey: ["dicionario-letter-counts"],
    queryFn: async () => {
      const countMap = new Map<string, number>();
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("DICIONARIO" as any)
          .select("Letra")
          .not("Letra", "is", null)
          .range(from, from + pageSize - 1);
        if (error) throw error;

        (data as any[]).forEach((item) => {
          const base = normalizeToBaseLetter(item.Letra || "");
          if (base && /^[A-Z]$/.test(base)) {
            countMap.set(base, (countMap.get(base) || 0) + 1);
          }
        });

        hasMore = (data as any[]).length === pageSize;
        from += pageSize;
      }

      return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => ({
        letter,
        count: countMap.get(letter) || 0,
        available: (countMap.get(letter) || 0) > 0,
      })).filter(l => l.available);
    },
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Redirect non-admin
  if (!isAdmin) {
    navigate("/flashcards/areas", { replace: true });
    return null;
  }

  const totalTermos = letterCounts.reduce((s, l) => s + l.count, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Termos Jurídicos</h1>
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-400 font-semibold">{totalTermos.toLocaleString('pt-BR')}</span> termos disponíveis
            </p>
          </div>
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="px-4 pb-4">
        <div className="relative overflow-hidden rounded-2xl">
          <div
            key={slideIndex}
            className="relative min-h-[140px] overflow-hidden rounded-2xl animate-fade-in"
          >
            <img src={HERO_SLIDES[slideIndex].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="relative z-10 p-5 flex flex-col justify-end h-full min-h-[140px]">
              <h2 className="text-base font-bold text-white leading-tight mb-1">
                {HERO_SLIDES[slideIndex].title}
              </h2>
              <p className="text-xs text-white/80 leading-relaxed">
                {HERO_SLIDES[slideIndex].subtitle}
              </p>
            </div>
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                className={`rounded-full transition-all ${i === slideIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Letters grid - 2 per row like area cards */}
      <div className="px-4">
        <h2 className="text-sm font-bold text-foreground">Letras</h2>
        <p className="text-xs text-muted-foreground mb-3">Selecione uma letra para estudar</p>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[100px] rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {letterCounts.map((item, idx) => {
              const gradient = LETTER_GRADIENTS[item.letter] || "from-slate-500 to-slate-700";
              return (
                <button
                  key={item.letter}
                  onClick={() => navigate(`/flashcards/termos-juridicos/estudar?letra=${item.letter}`)}
                  className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${gradient} shadow-lg h-[100px] animate-fade-in`}
                  style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="absolute -right-3 -bottom-3 opacity-20">
                    <BookOpen className="w-20 h-20 text-white" />
                  </div>
                  <div className="relative z-10 bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
                    <span className="text-lg font-bold text-white">{item.letter}</span>
                  </div>
                  <h3 className="relative z-10 font-semibold text-white text-sm leading-tight pr-6">
                    {item.count.toLocaleString('pt-BR')} termos
                  </h3>
                  <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsTermosJuridicos;
