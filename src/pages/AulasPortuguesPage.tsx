import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import lawyerJusticeBg from "@/assets/lawyer-justice-bg.webp";

const AulasPortuguesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <img src={lawyerJusticeBg} alt="" className="w-full h-full object-cover opacity-40" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/aulas")} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Português Jurídico</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 py-6">
        <div className="text-center mb-8">
          <BookOpen className="w-8 h-8 text-violet-400 mx-auto mb-2" />
          <h2 className="font-cinzel text-xl font-bold text-amber-100">Português Jurídico</h2>
          <p className="text-amber-200/60 text-xs mt-1">Gramática • Redação • Interpretação</p>
        </div>

        <div className="bg-gradient-to-br from-white/8 to-white/3 border border-white/10 rounded-2xl p-10 text-center shadow-[0_8px_30px_-4px_rgba(0,0,0,0.5)]">
          <BookOpen className="w-12 h-12 text-violet-400/40 mx-auto mb-4" />
          <p className="text-white/60 text-sm font-medium">Em breve</p>
          <p className="text-white/30 text-xs mt-1">Conteúdo de Português para Concurso</p>
        </div>
      </div>
    </div>
  );
};

export default AulasPortuguesPage;
