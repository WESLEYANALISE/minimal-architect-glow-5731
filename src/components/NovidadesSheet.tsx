import { ArrowLeft, Bell, BookOpen, Film, Newspaper, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import novidadesHeroBackground from '@/assets/novidades-hero-background.webp';
import NovidadesContent from '@/pages/Novidades';
import SparkleHeroTitle from '@/components/SparkleHeroTitle';
import { useNotificacoesApp, NotificacaoItem } from "@/hooks/useNotificacoesApp";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface NovidadesSheetProps {
  open: boolean;
  onClose: () => void;
}

const iconMap: Record<string, any> = {
  livro: BookOpen,
  filme: Film,
  boletim: Newspaper,
};

export const NovidadesSheet = ({ open, onClose }: NovidadesSheetProps) => {
  const [activeTab, setActiveTab] = useState<NovidadesTab>("melhorias");
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoesApp();
  const navigate = useNavigate();

  if (!open) return null;

  const handleNotifClick = (n: NotificacaoItem) => {
    marcarLida(n.id);
    onClose();
    navigate(n.rota);
  };

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ animation: 'slideUpFull 300ms ease-out forwards' }}
    >
      <div className="absolute inset-0 bg-background overflow-y-auto">
        {/* Hero */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={novidadesHeroBackground}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/80" />

          {/* Back button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-black/70 transition-colors"
            style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Voltar</span>
          </button>

          {/* Hero text */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <SparkleHeroTitle
              line1="Atualizações e"
              line2="melhorias do app"
              colorHex="rgba(196,181,253,0.8)"
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative rounded-t-[32px] bg-muted -mt-6 min-h-screen pb-20">
          <div className="px-4 pt-6 space-y-3">
            {/* Mark all as read */}
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-md"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como lidas
              </button>
            )}

            {/* All notifications */}
            {notificacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma notificação para hoje.
              </p>
            ) : (
              notificacoes.map((n) => {
                const Icon = iconMap[n.tipo] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={cn(
                      "w-full flex items-start gap-3 p-4 rounded-xl text-left transition-colors border border-border/20",
                      n.lida ? "bg-card/40 opacity-50" : "bg-card hover:bg-card/80"
                    )}
                  >
                    {n.imagemUrl ? (
                      <img
                        src={n.imagemUrl}
                        alt={n.descricao}
                        className="w-12 h-16 rounded-md object-cover shrink-0 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-16 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {n.titulo}
                        </span>
                        {!n.lida && (
                          <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 leading-4 shrink-0">
                            Nova
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {n.descricao}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Novidades / Melhorias history */}
          <div className="mt-6">
            <NovidadesContent />
          </div>
        </div>
      </div>
    </div>
  );
};
