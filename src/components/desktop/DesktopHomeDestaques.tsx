import { Scale, Briefcase, BookOpen } from "lucide-react";
import { NavigateFunction } from "react-router-dom";

interface Props {
  navigate: NavigateFunction;
}

const DESTAQUES = [
  {
    icon: Scale,
    titulo: "OAB em Alta",
    descricao: "Prepare-se para a aprovação na OAB com material atualizado",
    route: "/oab",
  },
  {
    icon: Briefcase,
    titulo: "Concursos Públicos",
    descricao: "Carreiras jurídicas e editais abertos para sua próxima conquista",
    route: "/carreiras-juridicas",
  },
  {
    icon: BookOpen,
    titulo: "Legislação Atualizada",
    descricao: "Acesse o Vade Mecum completo com todos os códigos e leis",
    route: "/vade-mecum",
  },
];

export const DesktopHomeDestaques = ({ navigate }: Props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[hsl(0,10%,15%)]/30 bg-[hsl(0,8%,11%)] rounded-2xl mb-6 overflow-hidden border border-[hsl(0,15%,18%)]/40 shadow-sm hover:shadow-md transition-shadow duration-300">
      {DESTAQUES.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.titulo}
            onClick={() => navigate(item.route)}
            className="p-5 xl:p-6 text-left hover:bg-muted/50 hover:scale-[1.01] transition-all duration-300 group relative"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 xl:w-5 xl:h-5 text-amber-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="font-playfair font-bold text-foreground text-base xl:text-lg group-hover:text-amber-400 transition-colors">
                {item.titulo}
              </h3>
            </div>
            <p className="text-sm xl:text-base text-muted-foreground leading-relaxed">
              {item.descricao}
            </p>
            <div className="absolute bottom-0 left-5 h-0.5 w-12 bg-amber-500 rounded-t opacity-0 group-hover:opacity-100 group-hover:w-20 transition-all duration-300" />
          </button>
        );
      })}
    </div>
  );
};
