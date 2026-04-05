import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useDeviceType } from "@/hooks/use-device-type";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, Clock } from "lucide-react";
import { useInstantCache } from "@/hooks/useInstantCache";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Noticia {
  id: string;
  categoria: string;
  portal: string;
  titulo: string;
  capa: string;
  link: string;
  dataHora: string;
}

type Filtro = "todos" | "direito" | "concursos" | "politica";

const FILTROS: { label: string; value: Filtro }[] = [
  { label: "Todos", value: "todos" },
  { label: "Direito", value: "direito" },
  { label: "Concursos", value: "concursos" },
  { label: "Política", value: "politica" },
];

function formatarData(iso: string) {
  try {
    return format(new Date(iso), "dd MMM · HH:mm", { locale: ptBR });
  } catch {
    return "";
  }
}

const CATEGORIA_LABELS: Record<string, { label: string; color: string }> = {
  direito: { label: "Direito", color: "bg-red-600" },
  concursos: { label: "Concursos", color: "bg-amber-600" },
  politica: { label: "Política", color: "bg-blue-600" },
};

// ─── Destaque (card grande) ───
const NoticiaDestaque = ({ noticia, onClick, showTag }: { noticia: Noticia; onClick: () => void; showTag?: boolean }) => {
  const tag = CATEGORIA_LABELS[noticia.categoria];
  return (
    <button onClick={onClick} className="w-full text-left group">
      <div className="relative h-52 rounded-2xl overflow-hidden">
        {noticia.capa ? (
          <img
            src={noticia.capa}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Newspaper className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70 bg-primary/80 backdrop-blur-sm px-2 py-0.5 rounded">
              {noticia.portal}
            </span>
            {showTag && tag && (
              <span className={cn("text-[10px] font-semibold text-white px-2 py-0.5 rounded", tag.color)}>
                {tag.label}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-white leading-snug line-clamp-3">
            {noticia.titulo}
          </h2>
          <div className="flex items-center gap-1.5 mt-2 text-white/60">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">{formatarData(noticia.dataHora)}</span>
          </div>
        </div>
      </div>
    </button>
  );
};
// ─── Item de lista ───
const NoticiaItem = ({ noticia, onClick, showTag }: { noticia: Noticia; onClick: () => void; showTag?: boolean }) => {
  const tag = CATEGORIA_LABELS[noticia.categoria];
  return (
    <button
      onClick={onClick}
      className="w-full flex gap-3 p-3 rounded-xl bg-card/50 hover:bg-card transition-colors text-left group"
    >
      <div className="shrink-0 w-24 h-20 rounded-lg overflow-hidden">
        {noticia.capa ? (
          <img
            src={noticia.capa}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {noticia.titulo}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {showTag && tag && (
            <span className={cn("text-[9px] font-semibold text-white px-1.5 py-0.5 rounded", tag.color)}>
              {tag.label}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{noticia.portal}</span>
          <span className="text-[10px] text-muted-foreground/50">·</span>
          <span className="text-[10px] text-muted-foreground">{formatarData(noticia.dataHora)}</span>
        </div>
      </div>
    </button>
  );
};

const NoticiasJuridicas = () => {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const { isDesktop } = useDeviceType();

  // ─── Data fetching ───
  const { data: noticiasJuridicasRaw, refresh: refreshJuridicas } = useInstantCache<any[]>({
    cacheKey: 'noticias-juridicas-all-v3',
    queryFn: async () => {
      const quatorzeDiasAtras = new Date();
      quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 14);
      const dataInicio = quatorzeDiasAtras.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('noticias_juridicas_cache')
        .select('id, titulo, link, imagem, imagem_webp, fonte, categoria, data_publicacao, created_at, conteudo_formatado, conteudo_completo')
        .gte('data_publicacao', dataInicio)
        .order('data_publicacao', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((n: any) => ({
        id: n.id.toString(),
        categoria: 'direito',
        portal: n.fonte || 'Portal Jurídico',
        titulo: n.titulo,
        capa: n.imagem_webp || n.imagem || '',
        link: n.link,
        dataHora: n.data_publicacao || n.created_at || new Date().toISOString(),
      }));
    },
    cacheDuration: 2 * 60 * 1000,
  });

  const { data: noticiasConcursosRaw, refresh: refreshConcursos } = useInstantCache<any[]>({
    cacheKey: 'noticias-concursos-all-v3',
    queryFn: async () => {
      const quatorzeDiasAtras = new Date();
      quatorzeDiasAtras.setDate(quatorzeDiasAtras.getDate() - 14);
      const dataInicio = quatorzeDiasAtras.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('noticias_concursos_cache')
        .select('id, titulo, link, imagem, imagem_webp, fonte, data_publicacao, created_at')
        .gte('data_publicacao', dataInicio)
        .order('data_publicacao', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((n: any) => ({
        id: `concurso-${n.id}`,
        categoria: 'concursos',
        portal: n.fonte || 'Portal de Concursos',
        titulo: n.titulo,
        capa: n.imagem_webp || n.imagem || '',
        link: n.link,
        dataHora: n.data_publicacao || n.created_at || new Date().toISOString(),
      }));
    },
    cacheDuration: 2 * 60 * 1000,
  });

  const { data: noticiasPoliticasRaw, refresh: refreshPoliticas } = useInstantCache<any[]>({
    cacheKey: 'noticias-politicas-instant-v2',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noticias_politicas_cache')
        .select('*')
        .eq('processado', true)
        .order('data_publicacao', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((n: any) => ({
        id: n.id?.toString(),
        categoria: 'politica',
        portal: n.fonte || 'Portal de Notícias',
        titulo: n.titulo,
        capa: n.imagem_url_webp || n.imagem_url || '',
        link: n.url || '',
        dataHora: n.data_publicacao || new Date().toISOString(),
      }));
    },
    cacheDuration: 2 * 60 * 1000,
  });

  useEffect(() => {
    refreshJuridicas();
    const ch1 = supabase.channel('noticias-juridicas-rt').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'noticias_juridicas_cache' }, () => refreshJuridicas()).subscribe();
    const ch2 = supabase.channel('noticias-concursos-rt').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'noticias_concursos_cache' }, () => refreshConcursos()).subscribe();
    const ch3 = supabase.channel('noticias-politicas-rt').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'noticias_politicas_cache' }, () => refreshPoliticas()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
  }, []);

  // Merge and filter
  const todasNoticias = useMemo(() => {
    const all = [
      ...(noticiasJuridicasRaw || []),
      ...(noticiasConcursosRaw || []),
      ...(noticiasPoliticasRaw || []),
    ].sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    
    if (filtro === "todos") return all;
    return all.filter(n => n.categoria === filtro);
  }, [noticiasJuridicasRaw, noticiasConcursosRaw, noticiasPoliticasRaw, filtro]);

  const destaque = todasNoticias[0];
  const listaRestante = todasNoticias.slice(1);

  const handleNoticiaClick = useCallback((noticia: Noticia) => {
    if (noticia.categoria === 'politica') {
      navigate(`/politica/noticias/${noticia.id}`, { state: { noticia } });
    } else {
      navigate(`/noticias-juridicas/${noticia.id}`, { state: { noticia } });
    }
  }, [navigate]);

  // ─── DESKTOP: Layout jornal ───
  if (isDesktop) {
    return (
      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        {/* Sidebar filtros */}
        <div className="w-[200px] flex-shrink-0 border-r border-border/30 bg-card/20 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Categorias</h3>
          <div className="space-y-1">
            {FILTROS.map(f => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={cn(
                  "w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                  filtro === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {todasNoticias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Newspaper className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhuma notícia encontrada</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Destaque grande */}
                {destaque && (
                  <div className="col-span-2 row-span-2">
                    <NoticiaDestaque noticia={destaque} onClick={() => handleNoticiaClick(destaque)} showTag={filtro === "todos"} />
                  </div>
                )}
                {/* Lista lateral */}
                {listaRestante.slice(0, 6).map(noticia => (
                  <NoticiaItem key={noticia.id} noticia={noticia} onClick={() => handleNoticiaClick(noticia)} showTag={filtro === "todos"} />
                ))}
                {/* Restante em grid */}
                {listaRestante.slice(6).map(noticia => (
                  <NoticiaItem key={noticia.id} noticia={noticia} onClick={() => handleNoticiaClick(noticia)} showTag={filtro === "todos"} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── MOBILE ───
  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-[52px] z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="grid grid-cols-4 gap-1.5 px-4 py-3">
          {FILTROS.map(f => (
            <button key={f.value} onClick={() => setFiltro(f.value)} className={cn("py-2 rounded-xl text-sm font-semibold transition-all text-center", filtro === f.value ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-muted")}>{f.label}</button>
          ))}
        </div>
      </div>
      <div className="px-4 pt-4 space-y-3">
        {todasNoticias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Newspaper className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">Nenhuma notícia encontrada</p>
          </div>
        ) : (
          <>
            {destaque && <NoticiaDestaque noticia={destaque} onClick={() => handleNoticiaClick(destaque)} showTag={filtro === "todos"} />}
            <div className="space-y-2">
              {listaRestante.map(noticia => (
                <NoticiaItem key={noticia.id} noticia={noticia} onClick={() => handleNoticiaClick(noticia)} showTag={filtro === "todos"} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NoticiasJuridicas;
