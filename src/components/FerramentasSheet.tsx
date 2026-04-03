import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { 
  Rss, Bot, Target, BookOpen, Film, Landmark, Camera, Newspaper, 
  ChevronRight, Wrench, Briefcase, ArrowLeft
} from "lucide-react";

interface FerramentasSheetProps {
  open: boolean;
  onClose: () => void;
}

const FERRAMENTAS_ITEMS = [
  { id: "evelyn", label: "Evelyn", description: "Sua assistente jurídica IA", icon: Bot, route: "/evelyn", color: "text-violet-400", iconBg: "bg-violet-400/15" },
  { id: "documentarios", label: "Documentários", description: "Filmes e séries jurídicas", icon: Film, route: "/ferramentas/documentarios-juridicos", color: "text-red-400", iconBg: "bg-red-400/15" },
  { id: "dicionario", label: "Dicionário", description: "Termos jurídicos", icon: BookOpen, route: "/dicionario", color: "text-blue-400", iconBg: "bg-blue-400/15" },
  { id: "simulados", label: "Simulados", description: "Concursos e provas", icon: Target, route: "/ferramentas/simulados", color: "text-amber-400", iconBg: "bg-amber-400/15" },
  { id: "boletins", label: "Boletins", description: "Notícias jurídicas diárias", icon: Rss, route: "/ferramentas/boletins", color: "text-orange-400", iconBg: "bg-orange-400/15" },
  { id: "politica", label: "Política", description: "Cenário político e legislativo", icon: Landmark, route: "/politica", color: "text-emerald-400", iconBg: "bg-emerald-400/15" },
  
  { id: "analises", label: "Análises", description: "Explorar conteúdo jurídico", icon: Newspaper, route: "/vade-mecum/blogger/leis", color: "text-cyan-400", iconBg: "bg-cyan-400/15" },
  { id: "carreiras", label: "Carreiras Jurídicas", description: "Guia de carreiras no Direito", icon: Briefcase, route: "/carreiras-juridicas", color: "text-amber-500", iconBg: "bg-amber-500/15" },
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

        {/* Lista */}
        <div className="px-3 py-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {FERRAMENTAS_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.route)}
              className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl bg-card hover:bg-secondary active:bg-secondary/80 transition-colors text-left group"
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
      </SheetContent>
    </Sheet>
  );
};
