import { GraduationCap, Scale, Award, BookOpen } from "lucide-react";

const PERSONAS = [
  {
    icon: GraduationCap,
    title: "Estudantes de Direito",
    desc: "Resumos, aulas e flashcards para dominar cada semestre",
  },
  {
    icon: Award,
    title: "Preparação OAB",
    desc: "Simulados, questões comentadas e método aprovado",
  },
  {
    icon: Scale,
    title: "Concurseiros",
    desc: "Conteúdo atualizado e cronograma personalizado",
  },
  {
    icon: BookOpen,
    title: "Advogados",
    desc: "Vade Mecum, petições e jurisprudência na palma da mão",
  },
];

export const ParaQuemESection = () => {
  return (
    <div className="max-w-lg mx-auto mb-10 sm:mb-14">
      <h2
        className="text-center text-xl sm:text-2xl font-black text-white mb-5"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Perfeito para você
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {PERSONAS.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={i}
              className="rounded-2xl p-4 border border-zinc-800/50 backdrop-blur-sm"
              style={{
                background:
                  "linear-gradient(160deg, rgba(24,24,27,0.5), rgba(9,9,11,0.7))",
              }}
            >
              <Icon className="w-6 h-6 text-amber-400 mb-2" />
              <h3 className="text-white text-xs sm:text-sm font-bold leading-tight">
                {p.title}
              </h3>
              <p className="text-zinc-500 text-[10px] sm:text-[11px] mt-1 leading-tight">
                {p.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
