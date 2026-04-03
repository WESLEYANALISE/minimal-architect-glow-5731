import { BookOpen, Film as FilmIcon, Search, ChevronRight, Clapperboard } from "lucide-react";
import { NavigateFunction } from "react-router-dom";
import capaBiblioteca from "@/assets/capa-biblioteca.jpg";
import capaDocumentarios from "@/assets/capa-documentarios.jpg";
import capaDicionario from "@/assets/capa-dicionario.jpg";
import capaJuriflix from "@/assets/capa-juriflix.jpg";
import { CardHoverEffect } from "@/components/ui/card-hover-effect";
import { BorderBeam } from "@/components/ui/border-beam";

interface Props {
  navigate: NavigateFunction;
  onProfessora: () => void;
}

const FUNCOES = [
  {
    icon: BookOpen,
    titulo: "Biblioteca",
    subtitulo: "Livros e materiais",
    route: "/bibliotecas",
    capa: capaBiblioteca,
  },
  {
    icon: Clapperboard,
    titulo: "JuriFlix",
    subtitulo: "Filmes e séries jurídicas",
    route: "/juriflix",
    capa: capaJuriflix,
  },
  {
    icon: FilmIcon,
    titulo: "Documentários",
    subtitulo: "Vídeos e análises",
    route: "/documentarios",
    capa: capaDocumentarios,
  },
  {
    icon: Search,
    titulo: "Dicionário",
    subtitulo: "Termos jurídicos",
    route: "/dicionario-juridico",
    capa: capaDicionario,
  },
];

export const DesktopHomeBannerCTA = ({ navigate }: Props) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary/15 rounded-xl">
          <BookOpen className="w-5 h-5 xl:w-6 xl:h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-base xl:text-lg 2xl:text-xl font-bold text-foreground tracking-tight">
            Funções
          </h3>
          <p className="text-muted-foreground text-xs xl:text-sm">
            Recursos e ferramentas
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
        {FUNCOES.map((funcao) => {
          const Icon = funcao.icon;
          return (
            <CardHoverEffect key={funcao.titulo} rotateIntensity={8}>
              <button
                onClick={() => navigate(funcao.route)}
                className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-300 text-left cursor-pointer w-full"
                style={{ boxShadow: '4px 6px 12px rgba(0, 0, 0, 0.4)' }}
              >
                {/* Cover image */}
                <div className="w-full h-[140px] xl:h-[160px] 2xl:h-[180px] overflow-hidden">
                  <img
                    src={funcao.capa}
                    alt={funcao.titulo}
                    loading="lazy"
                    width={896}
                    height={512}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent pointer-events-none" />

                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/15 backdrop-blur-sm">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-white leading-snug">{funcao.titulo}</h4>
                      <p className="text-[11px] text-white/60 mt-0.5 truncate">{funcao.subtitulo}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors flex-shrink-0" />
                  </div>
                </div>

                <BorderBeam size={200} duration={10} colorFrom="hsl(var(--primary))" colorTo="transparent" />
              </button>
            </CardHoverEffect>
          );
        })}
      </div>
    </div>
  );
};
