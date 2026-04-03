import { Newspaper, FileCheck2, Landmark, ChevronRight } from "lucide-react";
import { NavigateFunction } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  navigate: NavigateFunction;
}

const ADMIN_EMAIL = "wn7corporation@gmail.com";

const BASE_DESTAQUES = [
  {
    icon: Newspaper,
    titulo: "Boletins",
    descricao: "Notícias jurídicas diárias mais relevantes",
    route: "/ferramentas/boletins",
    adminOnly: false,
  },
  {
    icon: FileCheck2,
    titulo: "Petições",
    descricao: "Modelos de petições prontos para usar",
    route: "/peticoes",
    adminOnly: true,
  },
  {
    icon: Newspaper,
    titulo: "Notícias",
    descricao: "Últimas notícias do mundo jurídico",
    route: "/ferramentas/boletins",
    adminOnly: false,
    replacesPeticoes: true,
  },
  {
    icon: Landmark,
    titulo: "Política",
    descricao: "Cenário político e legislativo do Brasil",
    route: "/politica",
    adminOnly: false,
  },
];

export const MobileHomeDestaques = ({ navigate }: Props) => {
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const DESTAQUES = BASE_DESTAQUES.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.replacesPeticoes && isAdmin) return false;
    return true;
  });

  return (
    <div className="mt-5 mb-2 -mx-2">
      <div className="grid grid-cols-3 divide-x divide-border bg-card overflow-hidden border-y border-border">
        {DESTAQUES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.titulo}
              onClick={() => navigate(item.route)}
              className="p-4 active:bg-muted/50 transition-colors group relative text-left"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <h3 className="font-playfair font-bold text-foreground text-sm leading-tight flex-1">
                  {item.titulo}
                </h3>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {item.descricao}
              </p>
              <div className="absolute bottom-0 left-4 h-0.5 w-8 bg-amber-500 rounded-t opacity-0 group-active:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
