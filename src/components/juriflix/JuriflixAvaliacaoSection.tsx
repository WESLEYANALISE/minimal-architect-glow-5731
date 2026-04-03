import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useJuriflixAvaliacaoMedia, useJuriflixMinhaAvaliacao, useAvaliarJuriflix } from "@/hooks/useJuriflixAvaliacoes";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  juriflixId: number;
}

export const JuriflixAvaliacaoSection = ({ juriflixId }: Props) => {
  const { user } = useAuth();
  const { data: mediaData } = useJuriflixAvaliacaoMedia(juriflixId);
  const { data: minhaAvaliacao } = useJuriflixMinhaAvaliacao(juriflixId);
  const avaliarMutation = useAvaliarJuriflix();
  const [hoverStar, setHoverStar] = useState(0);

  const notaAtual = minhaAvaliacao?.nota || 0;
  const media = mediaData?.media || 0;
  const total = mediaData?.total || 0;

  const handleAvaliar = (nota: number) => {
    if (!user) return;
    avaliarMutation.mutate({ juriflixId, nota });
  };

  return (
    <div className="space-y-6">
      {/* Média da comunidade */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
          <span className="text-4xl font-bold">{media > 0 ? media.toFixed(1) : '—'}</span>
          <span className="text-muted-foreground text-lg">/5</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {total > 0 ? `${total} avaliação${total > 1 ? 'ões' : ''}` : 'Nenhuma avaliação ainda'}
        </p>
      </div>

      {/* Avaliação do usuário */}
      {user ? (
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">
            {notaAtual > 0 ? 'Sua avaliação' : 'Avalie este título'}
          </p>
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = hoverStar > 0 ? star <= hoverStar : star <= notaAtual;
              return (
                <button
                  key={star}
                  onClick={() => handleAvaliar(star)}
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  disabled={avaliarMutation.isPending}
                  className="p-1 transition-transform hover:scale-125 disabled:opacity-50"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      filled
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              );
            })}
          </div>
          {notaAtual > 0 && (
            <p className="text-xs text-muted-foreground">Toque para alterar</p>
          )}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Faça login para avaliar
        </p>
      )}
    </div>
  );
};
