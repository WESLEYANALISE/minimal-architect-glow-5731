import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { BookOpen, Film, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDicaHoje } from "@/hooks/useDicaDoDia";
import { useFilmeHoje } from "@/hooks/useFilmeDoDia";
import { useSubscription } from "@/contexts/SubscriptionContext";

const STORAGE_PREFIX = "recomendacao-dia-vista-";

const limparCacheAntigo = () => {
  const now = Date.now();
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      const dateStr = key.replace(STORAGE_PREFIX, "");
      try {
        const diff = (now - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
        if (diff > 7) localStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key);
      }
    }
  });
};

export const RecomendacaoDiaNotification = () => {
  const navigate = useNavigate();
  const { isPremium, loading: loadingSubscription } = useSubscription();
  const { data: dica, isLoading: loadingDica } = useDicaHoje();
  const { data: filme, isLoading: loadingFilme } = useFilmeHoje();

  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const dataKey = format(new Date(), "yyyy-MM-dd");
  const jaViu = localStorage.getItem(`${STORAGE_PREFIX}${dataKey}`) === "true";

  useEffect(() => {
    limparCacheAntigo();
  }, []);

  useEffect(() => {
    if (loadingDica || loadingFilme || loadingSubscription || jaViu) return;
    if (!isPremium) return;
    if (dica || filme) {
      marcarVisto();
      setShow(true);
    }
  }, [loadingDica, loadingFilme, loadingSubscription, isPremium, dica, filme, jaViu]);

  const marcarVisto = () => {
    localStorage.setItem(`${STORAGE_PREFIX}${dataKey}`, "true");
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShow(false);
      setIsClosing(false);
      marcarVisto();
    }, 300);
  };

  const handleVerRecomendacao = () => {
    marcarVisto();
    if (dica) {
      navigate("/dica-do-dia");
    } else if (filme) {
      navigate("/filme-do-dia");
    }
    setShow(false);
  };

  if (!show) return null;

  // Priorizar livro sobre filme
  const isLivro = !!dica;
  const titulo = isLivro ? dica!.livro_titulo : filme!.titulo;
  const subtitulo = isLivro
    ? dica!.livro_autor || "Autor desconhecido"
    : filme!.diretor || "Diretor desconhecido";
  const capa = isLivro ? dica!.livro_capa : filme!.poster_path
    ? `https://image.tmdb.org/t/p/w300${filme!.poster_path}`
    : null;
  const area = isLivro
    ? dica!.area_livro
    : filme!.generos?.join(", ") || null;
  const IconComponent = isLivro ? BookOpen : Film;
  const label = isLivro ? "📚 Livro do Dia" : "🎬 Filme do Dia";

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 ${
        isClosing ? "animate-fade-out" : "animate-fade-in"
      }`}
      onClick={handleClose}
    >
      <Card
        className={`max-w-sm w-full shadow-2xl relative pt-12 border-0 ${
          isClosing ? "animate-scale-out" : "animate-scale-in"
        } ${
          isLivro
            ? "bg-gradient-to-b from-amber-950/90 to-background"
            : "bg-gradient-to-b from-blue-950/90 to-background"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <X className="w-4 h-4 text-white/70" />
        </button>

        {/* Ícone animado no topo */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg animate-pulse ${
              isLivro
                ? "bg-gradient-to-br from-amber-500 to-amber-700"
                : "bg-gradient-to-br from-blue-500 to-blue-700"
            }`}
          >
            <IconComponent className="w-10 h-10 text-white" />
          </div>
        </div>

        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl text-white">{label}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Nova recomendação disponível para hoje!
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-4 items-start p-3 rounded-lg bg-black/20">
            {capa && (
              <img
                src={capa}
                alt={titulo}
                className="w-16 h-24 object-cover rounded-md shadow-md flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight text-white">
                {titulo}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p>
              {area && (
                <Badge
                  variant="outline"
                  className={`mt-2 text-xs ${
                    isLivro
                      ? "border-amber-500/40 text-amber-300/80"
                      : "border-blue-500/40 text-blue-300/80"
                  }`}
                >
                  {area}
                </Badge>
              )}
            </div>
          </div>

          <Button
            onClick={handleVerRecomendacao}
            className={`w-full ${
              isLivro
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            size="lg"
          >
            Ver recomendação
          </Button>

          <button
            onClick={handleClose}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Agora não
          </button>
        </CardContent>
      </Card>
    </div>
  );
};
