import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { 
  Rss, Bot, Target, BookOpen, Film, Landmark, Camera, Newspaper, 
  ChevronRight, Wrench, Briefcase, ArrowLeft, GraduationCap, MapPin,
  Building2, Calendar, BookMarked, Brain, FileSearch
} from "lucide-react";

interface FerramentasSheetProps {
  open: boolean;
  onClose: () => void;
}

interface FerramentaItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  iconBg: string;
}

interface FerramentaCategory {
  title: string;
  emoji: string;
  items: FerramentaItem[];
}

const CATEGORIAS: FerramentaCategory[] = [
  {
    title: "Faculdade",
    emoji: "🎓",
    items: [
      { id: "simulados", label: "Simulados", description: "Concursos e provas", icon: Target, route: "/ferramentas/simulados", color: "text-amber-400", iconBg: "bg-amber-400/15" },
      { id: "carreiras", label: "Carreiras Jurídicas", description: "Guia de carreiras no Direito", icon: Briefcase, route: "/carreiras-juridicas", color: "text-amber-500", iconBg: "bg-amber-500/15" },
      { id: "ranking", label: "Ranking de Faculdades", description: "Melhores faculdades de Direito", icon: GraduationCap, route: "/ranking-faculdades", color: "text-emerald-400", iconBg: "bg-emerald-400/15" },
      { id: "tcc", label: "Pesquisar TCC", description: "Busque temas e trabalhos", icon: FileSearch, route: "/ferramentas/tcc", color: "text-indigo-400", iconBg: "bg-indigo-400/15" },
      { id: "plano-estudos", label: "Plano de Estudos", description: "Organize sua rotina", icon: BookMarked, route: "/plano-estudos", color: "text-sky-400", iconBg: "bg-sky-400/15" },
      { id: "mapa-mental", label: "Mapa Mental", description: "Visualize conceitos jurídicos", icon: Brain, route: "/mapa-mental", color: "text-pink-400", iconBg: "bg-pink-400/15" },
    ],
  },
  {
    title: "Advogado",
    emoji: "💼",
    items: [
      { id: "evelyn", label: "Evelyn", description: "Sua assistente jurídica IA", icon: Bot, route: "/evelyn", color: "text-violet-400", iconBg: "bg-violet-400/15" },
      { id: "dicionario", label: "Dicionário", description: "Termos jurídicos", icon: BookOpen, route: "/dicionario", color: "text-blue-400", iconBg: "bg-blue-400/15" },
      { id: "cnpj", label: "Consulta CNPJ", description: "Dados de empresas brasileiras", icon: Building2, route: "/advogado/consulta-cnpj", color: "text-teal-400", iconBg: "bg-teal-400/15" },
      { id: "prazos", label: "Calculadora de Prazos", description: "Prazos em dias úteis", icon: Calendar, route: "/advogado/prazos", color: "text-orange-400", iconBg: "bg-orange-400/15" },
      { id: "localizador", label: "Localizador Jurídico", description: "Tribunais e cartórios próximos", icon: MapPin, route: "/ferramentas/locais-juridicos", color: "text-teal-500", iconBg: "bg-teal-500/15" },
    ],
  },
  {
    title: "Informação",
    emoji: "📰",
    items: [
      { id: "boletins", label: "Boletins", description: "Notícias jurídicas diárias", icon: Rss, route: "/ferramentas/boletins", color: "text-orange-400", iconBg: "bg-orange-400/15" },
      { id: "politica", label: "Política", description: "Cenário político e legislativo", icon: Landmark, route: "/politica", color: "text-emerald-400", iconBg: "bg-emerald-400/15" },
      { id: "analises", label: "Análises", description: "Explorar conteúdo jurídico", icon: Newspaper, route: "/vade-mecum/blogger/leis", color: "text-cyan-400", iconBg: "bg-cyan-400/15" },
      { id: "documentarios", label: "Documentários", description: "Filmes e séries jurídicas", icon: Film, route: "/ferramentas/documentarios-juridicos", color: "text-red-400", iconBg: "bg-red-400/15" },
    ],
  },
];

export const FerramentasSheet = ({ open, onClose }: FerramentasSheetProps) => {
  const navigate = useNavigate();

  const handleNavigate = (route: string) => {
    onClose();
    navigate(route);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-full p-0 border-0 bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border/30">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">Ferramentas</h2>
          </div>
        </div>

        {/* Lista categorizada */}
        <div className="px-3 py-3 overflow-y-auto space-y-4" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {CATEGORIAS.map((cat) => (
            <div key={cat.title}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1.5">
                {cat.emoji} {cat.title}
              </p>
              <div className="space-y-1">
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.route)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-card hover:bg-secondary active:bg-secondary/80 transition-colors text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
