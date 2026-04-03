import { useNavigate } from "react-router-dom";
import { X, BookOpen, Film, Newspaper, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificacaoItem } from "@/hooks/useNotificacoesApp";

const iconMap = {
  livro: BookOpen,
  filme: Film,
  boletim: Newspaper,
};

interface Props {
  open: boolean;
  onClose: () => void;
  notificacoes: NotificacaoItem[];
  onMarcarLida: (id: string) => void;
  onMarcarTodasLidas: () => void;
}

export const NotificacoesPanel = ({
  open,
  onClose,
  notificacoes,
  onMarcarLida,
  onMarcarTodasLidas,
}: Props) => {
  const navigate = useNavigate();

  if (!open) return null;

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const handleClick = (n: NotificacaoItem) => {
    onMarcarLida(n.id);
    onClose();
    navigate(n.rota);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-[360px] max-w-[90vw] bg-card border-l border-border shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Notificações</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mark all */}
        {naoLidas > 0 && (
          <button
            onClick={onMarcarTodasLidas}
            className="flex items-center gap-2 mx-4 my-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-md"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notificacoes.filter((n) => !n.lida).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {notificacoes.length === 0
                ? "Nenhuma notificação para hoje."
                : "Todas as notificações foram lidas! ✅"}
            </p>
          ) : (
            notificacoes.filter((n) => !n.lida).map((n) => {
              const Icon = iconMap[n.tipo];
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-colors ${
                    n.lida
                      ? "bg-secondary/30 opacity-60"
                      : "bg-secondary/60 hover:bg-secondary"
                  }`}
                >
                  {/* Capa / imagem */}
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
      </div>
    </div>
  );
};
