import { useNavigate } from "react-router-dom";
import { ArrowLeft, Footprints, Scale, Gavel, BookOpen, GraduationCap, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";


import conceitosThumb from "@/assets/thumbnails/conceitos-thumb.webp";
import areasThumb from "@/assets/thumbnails/areas-thumb.webp";
import oabThumb from "@/assets/thumbnails/oab-thumb.webp";
import portuguesThumb from "@/assets/thumbnails/portugues-thumb.webp";
import termosThumb from "@/assets/thumbnails/termos-thumb.webp";

interface CursoItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thumb: string;
  route: string;
  accent: string;
  icon: React.ReactNode;
}

const AulasPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // === CURSOS ===
  const cursos: CursoItem[] = [
    {
      id: "conceitos",
      title: "Trilha de Conceitos",
      subtitle: "Fundamentos do Direito",
      description: "Domine as bases essenciais de cada matéria jurídica",
      thumb: conceitosThumb,
      route: "/conceitos/trilhante",
      accent: "from-red-500/20 to-red-600/10",
      icon: <Footprints className="w-5 h-5 text-red-400" />,
    },
    {
      id: "areas",
      title: "Áreas do Direito",
      subtitle: "27 matérias disponíveis",
      description: "Explore todas as áreas com aulas aprofundadas",
      thumb: areasThumb,
      route: "/aulas/areas",
      accent: "from-amber-500/20 to-amber-600/10",
      icon: <Scale className="w-5 h-5 text-amber-400" />,
    },
    {
      id: "termos",
      title: "Termos Jurídicos",
      subtitle: "Vocabulário essencial",
      description: "Aprenda os termos mais usados no Direito",
      thumb: termosThumb,
      route: "/termos-juridicos",
      accent: "from-amber-600/20 to-yellow-600/10",
      icon: <BookOpen className="w-5 h-5 text-yellow-400" />,
    },
  ];

  // Admin-only courses
  if (user?.email === ADMIN_EMAIL) {
    cursos.push(
      {
        id: "oab",
        title: "Trilhas OAB",
        subtitle: "1ª e 2ª Fase",
        description: "Preparação completa para o Exame da Ordem",
        thumb: oabThumb,
        route: "/aulas/oab",
        accent: "from-red-600/20 to-red-700/10",
        icon: <Gavel className="w-5 h-5 text-red-400" />,
      },
      {
        id: "portugues",
        title: "Português Jurídico",
        subtitle: "Gramática • Redação",
        description: "Domine a escrita e interpretação jurídica",
        thumb: portuguesThumb,
        route: "/aulas/portugues",
        accent: "from-purple-500/20 to-purple-600/10",
        icon: <BookOpen className="w-5 h-5 text-purple-400" />,
      }
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/?tab=estudos')}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Cursos</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">Sua jornada de aprendizado</p>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto py-5 space-y-6 relative z-10">

        {/* === CATÁLOGO DE CURSOS === */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Catálogo de Cursos</h2>
          </div>

          <div className="space-y-3">
            {cursos.map((curso, index) => (
              <button
                key={curso.id}
                onClick={() => navigate(curso.route)}
                className="w-full flex items-stretch bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 transition-all active:scale-[0.98] text-left group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'backwards' }}
              >
                {/* Thumbnail */}
                <div className="relative w-[110px] min-h-[100px] flex-shrink-0 overflow-hidden">
                  <img
                    src={curso.thumb}
                    alt={curso.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
                </div>

                {/* Content */}
                <div className="flex-1 p-3.5 flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${curso.accent}`}>
                      {curso.icon}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{curso.subtitle}</span>
                  </div>
                  <h3 className="font-bold text-[15px] text-foreground leading-tight">{curso.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{curso.description}</p>
                </div>

                {/* Arrow */}
                <div className="flex items-center pr-3">
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default AulasPage;
