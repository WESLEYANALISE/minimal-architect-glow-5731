import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Clock, ArrowLeft } from "lucide-react";
import { useNoticiasLegislativas } from "@/hooks/useNoticiasLegislativas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatarData(iso: string) {
  try {
    return format(new Date(iso), "dd MMM · HH:mm", { locale: ptBR });
  } catch {
    return "";
  }
}

function formatarDataDestaque(iso: string) {
  try {
    const d = new Date(iso);
    const dia = format(d, "dd", { locale: ptBR });
    const mes = format(d, "MMM", { locale: ptBR });
    const hora = format(d, "HH:mm", { locale: ptBR });
    return { dia, mes, hora };
  } catch {
    return null;
  }
}

interface NoticiaLeg {
  id: string;
  titulo: string;
  link: string;
  imagem?: string;
  imagem_webp?: string;
  fonte?: string;
  categoria?: string;
  data_publicacao?: string;
}

const NoticiaDestaque = ({ noticia, onClick }: { noticia: NoticiaLeg; onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left group">
    <div className="relative h-52 rounded-2xl overflow-hidden cover-reflection">
      {noticia.imagem ? (
        <img src={noticia.imagem_webp || noticia.imagem} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Landmark className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70 bg-primary/80 backdrop-blur-sm px-2 py-0.5 rounded">
            {noticia.fonte || 'Câmara'}
          </span>
          {noticia.categoria && (
            <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded bg-emerald-600">
              {noticia.categoria}
            </span>
          )}
        </div>
        <h2 className="text-base font-bold text-white leading-snug line-clamp-3">{noticia.titulo}</h2>
        {noticia.data_publicacao && (
          <div className="flex items-center gap-1.5 mt-2 text-white/80">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-sm font-semibold">{formatarData(noticia.data_publicacao)}</span>
          </div>
        )}
      </div>
    </div>
  </button>
);

const NoticiaItem = ({ noticia, onClick }: { noticia: NoticiaLeg; onClick: () => void }) => {
  const dataInfo = noticia.data_publicacao ? formatarDataDestaque(noticia.data_publicacao) : null;

  return (
    <button onClick={onClick} className="w-full flex gap-3 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors text-left group">
      {/* Date badge */}
      {dataInfo && (
        <div className="shrink-0 w-14 flex flex-col items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-1 py-1.5">
          <span className="text-lg font-bold text-emerald-400 leading-none">{dataInfo.dia}</span>
          <span className="text-[9px] font-semibold text-emerald-300 uppercase">{dataInfo.mes}</span>
          <span className="text-[10px] font-bold text-foreground mt-0.5">{dataInfo.hora}</span>
        </div>
      )}
      {/* Thumbnail */}
      <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden cover-reflection">
        {noticia.imagem ? (
          <img src={noticia.imagem_webp || noticia.imagem} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Landmark className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      {/* Text content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{noticia.titulo}</p>
        <div className="flex items-center gap-2 mt-1">
          {noticia.categoria && (
            <span className="text-[9px] font-semibold text-white px-1.5 py-0.5 rounded bg-emerald-600">{noticia.categoria}</span>
          )}
          <span className="text-[10px] text-muted-foreground">{noticia.fonte}</span>
        </div>
      </div>
    </button>
  );
};

const NoticiasLegislativas = () => {
  const navigate = useNavigate();
  const { noticias, loading } = useNoticiasLegislativas(50);

  const destaque = noticias[0] as NoticiaLeg | undefined;
  const listaRestante = (noticias as NoticiaLeg[]).slice(1);

  const handleClick = useCallback((noticia: NoticiaLeg) => {
    navigate(`/noticias-legislativas/${noticia.id}`, {
      state: {
        noticia: {
          id: noticia.id,
          titulo: noticia.titulo,
          portal: noticia.fonte || 'Câmara dos Deputados',
          capa: noticia.imagem_webp || noticia.imagem || '',
          link: noticia.link,
          dataHora: noticia.data_publicacao,
          categoria: noticia.categoria,
        }
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="px-4 pt-3 pb-3 flex items-center gap-2.5">
          <button onClick={() => navigate('/?tab=leis')} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shrink-0">
            <Landmark className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Notícias Legislativas</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-6 h-6 animate-spin border-2 border-primary border-t-transparent rounded-full mb-3" />
            <p className="text-sm">Carregando notícias...</p>
          </div>
        ) : noticias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Landmark className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Nenhuma notícia legislativa disponível</p>
          </div>
        ) : (
          <>
            {destaque && <NoticiaDestaque noticia={destaque} onClick={() => handleClick(destaque)} />}
            <div className="space-y-2">
              {listaRestante.map(noticia => (
                <NoticiaItem key={noticia.id} noticia={noticia} onClick={() => handleClick(noticia)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NoticiasLegislativas;
