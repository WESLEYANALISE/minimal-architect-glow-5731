import { memo, useState, useRef, useEffect } from "react";
import { ChevronDown, ExternalLink, ArrowRightLeft, Plus, Trash2, AlertTriangle, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RaioXDetalhe } from "./RaioXDetalhe";

interface RaioXCardProps {
  item: {
    id: string;
    categoria: string;
    tipo_alteracao: string;
    lei_afetada: string | null;
    artigos_afetados: string[] | null;
    relevancia: string;
    resumo_alteracao: string | null;
    created_at: string;
    resenha_diaria?: {
      numero_lei: string;
      ementa: string | null;
      data_publicacao: string | null;
      url_planalto: string;
      artigos?: any;
      texto_formatado?: string | null;
      explicacao_lei?: string | null;
    };
  };
  index: number;
}

const TIPO_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; icon: React.ElementType }> = {
  alteracao: { label: "Alteração", bgColor: "bg-amber-500/25", textColor: "text-amber-300", icon: ArrowRightLeft },
  nova: { label: "Nova Lei", bgColor: "bg-emerald-500/25", textColor: "text-emerald-300", icon: Plus },
  inclusao: { label: "Inclusão", bgColor: "bg-cyan-500/25", textColor: "text-cyan-300", icon: Plus },
  revogacao: { label: "Revogação", bgColor: "bg-red-500/25", textColor: "text-red-300", icon: Trash2 },
  vide: { label: "Referência", bgColor: "bg-blue-500/25", textColor: "text-blue-300", icon: Eye },
};

const TIPO_LINE_COLOR: Record<string, string> = {
  alteracao: "bg-amber-400",
  nova: "bg-emerald-400",
  inclusao: "bg-cyan-400",
  revogacao: "bg-red-400",
  vide: "bg-blue-400",
};

export const RaioXCard = memo(({ item, index }: RaioXCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [detalheOpen, setDetalheOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const tipoConfig = TIPO_CONFIG[item.tipo_alteracao] || TIPO_CONFIG.nova;
  const TipoIcon = tipoConfig.icon;
  const lineColor = TIPO_LINE_COLOR[item.tipo_alteracao] || "bg-muted";
  const resenha = item.resenha_diaria;

  const dataPub = resenha?.data_publicacao
    ? new Date(resenha.data_publicacao + "T12:00:00")
    : null;

  const dia = dataPub ? format(dataPub, "dd", { locale: ptBR }) : null;
  const mes = dataPub ? format(dataPub, "MMM", { locale: ptBR }).toUpperCase() : null;
  const ano = dataPub ? format(dataPub, "yyyy") : null;

  return (
    <>
      <div ref={ref} className="relative flex gap-3">
        {/* Timeline dot */}
        <div className="flex flex-col items-center shrink-0 w-6">
          <div className={`w-3.5 h-3.5 rounded-full ${lineColor} ring-4 ring-background z-10 shrink-0 mt-5 transition-transform duration-500 ${visible ? "scale-100" : "scale-0"}`} />
          <div className="w-0.5 flex-1 bg-border/40" />
        </div>

        {/* Card */}
        <div
          className={`flex-1 mb-4 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
          style={{ transitionDelay: `${Math.min(index * 80, 400)}ms` }}
        >
          <div className="bg-card rounded-xl border border-border/50 p-4 shadow-lg hover:border-primary/20 transition-colors">
            {/* Date + Type row */}
            <div className="flex items-center gap-2 mb-3">
              {dataPub && (
                <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-2.5 py-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">{dia}</span>
                  <span className="text-[10px] font-semibold text-primary uppercase">{mes}</span>
                  <span className="text-[10px] text-muted-foreground">{ano}</span>
                </div>
              )}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${tipoConfig.bgColor} ${tipoConfig.textColor}`}>
                <TipoIcon className="w-3.5 h-3.5" />
                {tipoConfig.label}
              </span>
              {item.relevancia === "alta" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/20 text-red-300">
                  <AlertTriangle className="w-3 h-3" />
                  Alta
                </span>
              )}
            </div>

            {/* Law number */}
            <h3 className="font-bold text-sm text-foreground mb-1.5">
              {resenha?.numero_lei || "—"}
            </h3>

            {/* Ementa - more visible */}
            <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3 mb-2.5">
              {resenha?.ementa || "Sem ementa disponível"}
            </p>

            {/* Lei afetada - amber highlight */}
            {item.lei_afetada && (
              <div className="flex items-center gap-1 mb-3">
                <span className="text-[11px] px-3 py-1 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 font-semibold">
                  ⚖️ Altera: {item.lei_afetada}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.artigos_afetados && item.artigos_afetados.length > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors bg-muted/40 rounded-lg px-2 py-1"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  {item.artigos_afetados.length} artigo{item.artigos_afetados.length > 1 ? "s" : ""}
                </button>
              )}

              <button
                onClick={() => setDetalheOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
              >
                <Eye className="w-4 h-4" />
                Ver detalhes
              </button>

              {resenha?.url_planalto && (
                <a
                  href={resenha.url_planalto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1.5 text-[11px] text-primary font-medium hover:underline bg-primary/10 rounded-lg px-2.5 py-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Planalto
                </a>
              )}
            </div>

            {/* Expanded artigos */}
            {expanded && item.artigos_afetados && (
              <div className="mt-3 pt-3 border-t border-border/30 flex flex-wrap gap-1.5">
                {item.artigos_afetados.map((art: string, i: number) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 bg-amber-500/10 text-amber-300/90 rounded-lg font-mono border border-amber-500/20">
                    {art}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RaioXDetalhe item={item} open={detalheOpen} onClose={() => setDetalheOpen(false)} />
    </>
  );
});

RaioXCard.displayName = "RaioXCard";
