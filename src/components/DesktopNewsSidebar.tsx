import { useNavigate } from "react-router-dom";
import { Newspaper, ChevronRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFeaturedNews } from "@/hooks/useFeaturedNews";

export const DesktopNewsSidebar = () => {
  const navigate = useNavigate();
  const { featuredNews, loading } = useFeaturedNews();
  const noticias = featuredNews.slice(0, 15);

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/15">
            <Newspaper className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-xs text-foreground">Notícias Jurídicas</h3>
        </div>
        <button
          onClick={() => navigate("/noticias-juridicas")}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Ver todas <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-2 rounded-lg animate-pulse">
              <div className="flex gap-2">
                <div className="w-20 h-14 rounded bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-2 bg-muted rounded w-1/3" />
                </div>
              </div>
            </div>
          ))
        ) : noticias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Newspaper className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">Nenhuma notícia disponível</p>
          </div>
        ) : (
          noticias.map((noticia) => {
            const imagem = noticia.imagem_webp || noticia.imagemCached || noticia.imagem;
            const isInternal = noticia.link?.startsWith("/");

            return (
              <button
                key={noticia.id}
                onClick={() => {
                  if (isInternal) {
                    navigate(noticia.link);
                    return;
                  }

                  if (noticia.link) {
                    window.open(noticia.link, "_blank", "noopener,noreferrer");
                  }
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex gap-2.5 items-start">
                  <div className="w-20 h-14 rounded bg-muted flex-shrink-0 overflow-hidden border border-border/50">
                    {imagem ? (
                      <img
                        src={imagem}
                        alt={noticia.titulo}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Newspaper className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {noticia.titulo}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                      {noticia.fonte && (
                        <span className="text-[9px] text-muted-foreground truncate">{noticia.fonte}</span>
                      )}
                      {noticia.data && (
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(noticia.data), "dd/MM", { locale: ptBR })}
                        </span>
                      )}
                      {!isInternal && noticia.link && (
                        <ExternalLink className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
