import { memo, useCallback } from "react";
import { useTransitionNavigate } from "@/hooks/useTransitionNavigate";
import { ChevronRight, Flame, Star, Zap, BookOpen, TrendingUp, Scale, Briefcase, Monitor, Globe, Building, Heart } from "lucide-react";
import { BLOGGER_TEMAS, type BloggerTema } from "@/components/blogger/bloggerTemas";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const CATEGORIAS = [
  {
    label: "Em Alta",
    icon: Flame,
    color: "from-orange-600 to-red-700",
    temaIds: ["leis", "stf", "constitucional", "penal", "processo-civil", "jurisprudencia"],
  },
  {
    label: "Essencial",
    icon: Star,
    color: "from-amber-600 to-yellow-700",
    temaIds: ["civil", "trabalho", "administrativo", "tributario", "consumidor", "empresarial"],
  },
  {
    label: "Processo e Prática",
    icon: Scale,
    color: "from-violet-600 to-purple-700",
    temaIds: ["processo-civil", "processo-penal", "processo-trabalho", "pratica-juridica", "jurisprudencia", "mediacao"],
  },
  {
    label: "Direito Público",
    icon: Building,
    color: "from-blue-600 to-indigo-700",
    temaIds: ["previdenciario", "financeiro", "urbanistico", "militar", "maritimo", "saude"],
  },
  {
    label: "Direito Privado",
    icon: Heart,
    color: "from-pink-600 to-rose-700",
    temaIds: ["imobiliario", "bancario", "agronegocio", "familia", "sucessoes", "contratual"],
  },
  {
    label: "Digital e Moderno",
    icon: Monitor,
    color: "from-purple-600 to-fuchsia-700",
    temaIds: ["digital", "lgpd", "startups", "compliance", "desportivo", "energia"],
  },
  {
    label: "Fundamentos",
    icon: BookOpen,
    color: "from-amber-700 to-orange-800",
    temaIds: ["filosofia", "sociologia", "hermeneutica", "internacional-publico", "internacional-privado", "comparado"],
  },
  {
    label: "Tendências",
    icon: TrendingUp,
    color: "from-emerald-600 to-teal-700",
    temaIds: ["ambiental", "direitos-humanos", "eleitoral", "digital", "lgpd", "compliance"],
  },
  {
    label: "Carreira e Formação",
    icon: Briefcase,
    color: "from-sky-600 to-blue-700",
    temaIds: ["carreiras", "faculdade", "pratica-juridica"],
  },
  {
    label: "Instituições",
    icon: Globe,
    color: "from-teal-600 to-cyan-700",
    temaIds: ["senado", "camara", "stf", "tribunais"],
  },
];

const TemaCard = memo(({ tema, onClick }: { tema: BloggerTema; onClick: () => void }) => {
  const Icon = tema.icon;

  return (
    <button
      onClick={onClick}
      className="w-[150px] sm:w-[170px] shrink-0 group"
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-lg group-hover:shadow-2xl group-hover:ring-white/30 transition-all duration-300 group-hover:scale-[1.03]">
        <img
          src={tema.capa}
          alt={tema.titulo}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        <div
          className="absolute top-3 left-3 p-2 rounded-xl backdrop-blur-sm"
          style={{ backgroundColor: `${tema.cor}40` }}
        >
          <Icon className="w-4 h-4 text-white drop-shadow-md" />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h4 className="font-bold text-white text-[13px] leading-tight mb-0.5" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
            {tema.titulo}
          </h4>
          <p className="text-white/60 text-[10px] line-clamp-2 leading-snug">
            {tema.descricao}
          </p>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: tema.cor }}
        />
        <ChevronRight className="absolute bottom-3 right-2 w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
});

TemaCard.displayName = 'TemaCard';

export const BloggerHomeSection = memo(() => {
  const navigate = useTransitionNavigate();

  const handleNavigate = useCallback((temaId: string) => {
    navigate(`/vade-mecum/blogger/${temaId}`);
  }, [navigate]);

  return (
    <div className="px-2 space-y-6 pb-8 pt-4">
      {CATEGORIAS.map((categoria) => {
        const CatIcon = categoria.icon;
        const temas = categoria.temaIds
          .map(id => BLOGGER_TEMAS.find(t => t.id === id))
          .filter(Boolean) as BloggerTema[];

        if (temas.length === 0) return null;

        return (
          <div key={categoria.label} className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <div className={`p-1.5 rounded-lg bg-gradient-to-br ${categoria.color}`}>
                <CatIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {categoria.label}
              </h3>
            </div>

            <ScrollArea className="w-full">
              <div className="flex gap-3 px-2 pb-2">
                {temas.map(tema => (
                  <TemaCard
                    key={tema.id}
                    tema={tema}
                    onClick={() => handleNavigate(tema.id)}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
});

BloggerHomeSection.displayName = 'BloggerHomeSection';

export default BloggerHomeSection;
