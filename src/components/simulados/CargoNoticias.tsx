import { useNoticiasConcurso } from "@/hooks/useNoticiasConcurso";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  cargo: string;
}

export default function CargoNoticias({ cargo }: Props) {
  const { noticias, loading } = useNoticiasConcurso(cargo);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!noticias.length) {
    return (
      <div className="text-center py-8 space-y-2">
        <Newspaper className="w-8 h-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm text-muted-foreground">
          Nenhuma notícia encontrada sobre este cargo.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Novas notícias são buscadas diariamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {noticias.map((n: any) => (
        <a
          key={n.id}
          href={n.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all group"
        >
          {n.imagem && (
            <img
              src={n.imagem}
              alt=""
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {n.titulo}
            </h4>
            {n.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {n.descricao}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/60">
              {n.fonte && <span>{n.fonte}</span>}
              {n.data_publicacao && (
                <span>
                  {format(new Date(n.data_publicacao), "dd MMM yyyy", { locale: ptBR })}
                </span>
              )}
              <ExternalLink className="w-2.5 h-2.5 ml-auto" />
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
