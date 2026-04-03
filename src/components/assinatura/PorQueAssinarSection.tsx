import { BookOpen, Brain, GraduationCap, Headphones, Gavel, Sparkles, MessageSquare, Library, FileText, Scale, Star, Award, Zap, Crown, Calendar, HelpCircle, Volume2, ScrollText } from "lucide-react";

const FEATURES = [
  { icon: Gavel, text: 'Vade Mecum completo' },
  { icon: ScrollText, text: 'Leis atualizadas diariamente' },
  { icon: GraduationCap, text: 'Questões comentadas (80.000+)' },
  { icon: BookOpen, text: 'Resumos completos (5.000+)' },
  { icon: Brain, text: 'Flashcards de revisão (10.000+)' },
  { icon: Headphones, text: 'Audioaulas completas (800+)' },
  { icon: MessageSquare, text: 'Professora IA + Evelyn' },
  { icon: Volume2, text: 'Videoaulas exclusivas (1.000+)' },
  { icon: Library, text: '8 bibliotecas jurídicas' },
  { icon: FileText, text: 'Petições e modelos prontos' },
  { icon: Sparkles, text: 'Aulas interativas com IA' },
  { icon: Star, text: 'Simulados e provas OAB' },
  { icon: Award, text: 'Certificados de conclusão' },
  { icon: Scale, text: 'Jurisprudência comentada' },
  { icon: Zap, text: 'Dicionário jurídico completo' },
  { icon: Crown, text: 'Filosofia do Direito ilustrada' },
  { icon: Calendar, text: 'Cronograma personalizado' },
  { icon: HelpCircle, text: 'Batalha jurídica (game)' },
];

export const PorQueAssinarSection = () => {
  return (
    <div className="max-w-lg mx-auto mb-10 sm:mb-14">
      <h2
        className="text-center text-xl sm:text-2xl font-black text-white mb-5"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Por que assinar?
      </h2>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        {FEATURES.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div key={i} className="flex items-center gap-1.5 py-1">
              <Icon className="w-3 h-3 flex-shrink-0 text-amber-400" />
              <span className="text-zinc-300 text-[10px] sm:text-[11px] leading-tight">{feat.text}</span>
            </div>
          );
        })}
      </div>

      <p className="text-center mt-4 text-amber-400 text-[11px] sm:text-xs font-bold tracking-wide">
        ✦ E muito mais funções exclusivas ✦
      </p>
    </div>
  );
};
