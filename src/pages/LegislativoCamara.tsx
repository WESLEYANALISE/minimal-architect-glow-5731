import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, TrendingUp, Receipt, FileText, ChevronRight, Landmark } from "lucide-react";
import capaDeputados from "@/assets/legislativo/capa-deputados.jpg";
import capaProjetosLei from "@/assets/legislativo/capa-projetos-lei.jpg";
import capaRankingGastos from "@/assets/legislativo/capa-ranking-gastos.jpg";
import capaEmAlta from "@/assets/legislativo/capa-em-alta.jpg";

interface CamaraItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  route: string;
  accent: string;
  icon: React.ReactNode;
  capa: string;
}

const LegislativoCamara = () => {
  const navigate = useNavigate();

  const secoes: CamaraItem[] = [
    {
      id: "deputados",
      title: "Deputados Federais",
      subtitle: "513 deputados",
      description: "Lista completa com perfil, partido e estado",
      route: "/legislativo/camara/deputados",
      accent: "from-emerald-500/20 to-emerald-600/10",
      icon: <Users className="w-5 h-5 text-emerald-400" />,
      capa: capaDeputados,
    },
    {
      id: "projetos",
      title: "Projetos de Lei",
      subtitle: "PL, PLP, PEC, MPV",
      description: "Acompanhe os projetos em tramitação",
      route: "/camara-deputados/proposicoes",
      accent: "from-amber-500/20 to-amber-600/10",
      icon: <FileText className="w-5 h-5 text-amber-400" />,
      capa: capaProjetosLei,
    },
    {
      id: "rankings",
      title: "Rankings",
      subtitle: "Desempenho",
      description: "Rankings de gastos, produtividade e mais",
      route: "/camara-deputados/rankings",
      accent: "from-red-500/20 to-red-600/10",
      icon: <Receipt className="w-5 h-5 text-red-400" />,
      capa: capaRankingGastos,
    },
    {
      id: "em-alta",
      title: "Em Alta",
      subtitle: "Mais buscados",
      description: "Deputados mais pesquisados pelos usuários",
      route: "/legislativo/camara/deputados?tab=em-alta",
      accent: "from-purple-500/20 to-purple-600/10",
      icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
      capa: capaEmAlta,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <button onClick={() => navigate('/?tab=leis')} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Câmara dos Deputados</h1>
            <p className="text-[11px] text-muted-foreground -mt-0.5">Poder Legislativo Federal</p>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-4xl mx-auto py-5 space-y-6">
        {/* Header decorativo */}
        <div className="relative bg-gradient-to-br from-emerald-900/60 to-emerald-950/80 rounded-2xl p-5 overflow-hidden border border-emerald-800/30">
          <Landmark className="absolute -bottom-3 -right-3 w-24 h-24 text-emerald-500/10 rotate-[-12deg]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                <Landmark className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base">Câmara dos Deputados</h2>
                <p className="text-emerald-300/70 text-xs">57ª Legislatura (2023-2027)</p>
              </div>
            </div>
            <p className="text-emerald-200/60 text-xs mt-2 leading-relaxed">
              Explore informações sobre deputados federais, projetos de lei em tramitação e a cota parlamentar.
            </p>
          </div>
        </div>

        {/* Catálogo */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Explorar</h2>
          </div>

          <div className="space-y-3">
            {secoes.map((secao, index) => (
              <button
                key={secao.id}
                onClick={() => navigate(secao.route)}
                className="w-full flex items-center bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 transition-all active:scale-[0.98] text-left group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'backwards' }}
              >
                {/* Cover image */}
                <div className="relative w-[90px] min-h-[90px] flex-shrink-0 overflow-hidden">
                  <img
                    src={secao.capa}
                    alt={secao.title}
                    className="w-full h-full object-cover absolute inset-0"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/30" />
                </div>

                {/* Content */}
                <div className="flex-1 p-3.5 flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${secao.accent}`}>
                      {secao.icon}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{secao.subtitle}</span>
                  </div>
                  <h3 className="font-bold text-[15px] text-foreground leading-tight">{secao.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{secao.description}</p>
                </div>

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

export default LegislativoCamara;
