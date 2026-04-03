import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Maria Clara",
    role: "Aprovada na OAB — 1ª tentativa",
    text: "O app foi meu principal material de estudo. Os flashcards e simulados fizeram toda a diferença!",
  },
  {
    name: "Lucas Ferreira",
    role: "Estudante de Direito — USP",
    text: "A IA tira minhas dúvidas na hora, melhor do que esperar o professor. Uso todo dia.",
  },
  {
    name: "Ana Beatriz",
    role: "Concurseira — TJ-SP",
    text: "Passei a estudar de forma muito mais eficiente. O cronograma personalizado é incrível.",
  },
];

export const TextTestimonials = () => {
  return (
    <div className="max-w-lg mx-auto mb-10 sm:mb-14">
      <div className="flex items-center justify-center gap-2 mb-5">
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        <h2
          className="text-lg sm:text-xl font-black text-white"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          Histórias reais
        </h2>
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
      </div>

      <div className="space-y-3">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 sm:p-5 border border-zinc-800/40 backdrop-blur-sm relative"
            style={{
              background:
                "linear-gradient(160deg, rgba(24,24,27,0.5), rgba(9,9,11,0.7))",
            }}
          >
            <Quote className="w-5 h-5 text-amber-400/30 absolute top-3 right-3" />
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-3 italic">
              "{t.text}"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-black text-xs">
                {t.name[0]}
              </div>
              <div>
                <p className="text-white text-xs font-bold">{t.name}</p>
                <p className="text-amber-400/70 text-[10px]">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
