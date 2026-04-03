import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, TrendingUp, Loader2, Users, ChevronRight, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface DeputadoGasto {
  deputado_id: number;
  valor_total: number;
  deputado?: {
    nome: string;
    sigla_partido: string | null;
    sigla_uf: string | null;
    url_foto: string | null;
  };
}

const LegislativoCamaraRankings = () => {
  const navigate = useNavigate();
  const [gastos, setGastos] = useState<DeputadoGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const ano = new Date().getFullYear();

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("deputados_gastos_ranking")
        .select("deputado_id, valor_total")
        .eq("ano", ano)
        .is("mes", null)
        .order("valor_total", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Buscar dados dos deputados
      const ids = (data || []).map((d: any) => d.deputado_id);
      if (ids.length > 0) {
        const { data: deps } = await supabase
          .from("deputados_cache")
          .select("id, nome, sigla_partido, sigla_uf, url_foto")
          .in("id", ids);

        const depsMap = new Map((deps || []).map((d: any) => [d.id, d]));
        setGastos(
          (data as any[]).map((g: any) => ({
            ...g,
            deputado: depsMap.get(g.deputado_id),
          }))
        );
      } else {
        setGastos([]);
      }
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button onClick={() => navigate('/legislativo/camara')} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Ranking de Gastos</h1>
            <p className="text-[11px] text-muted-foreground">Cota Parlamentar {ano}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : gastos.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Dados de gastos ainda não sincronizados</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Os dados serão atualizados automaticamente
            </p>
          </div>
        ) : (
          gastos.map((item, i) => (
            <button
              key={item.deputado_id}
              onClick={() => navigate(`/tres-poderes/legislativo/deputado/${item.deputado_id}`)}
              className="w-full flex items-center gap-3 bg-card border border-border/40 rounded-xl p-3 text-left hover:border-primary/40 transition-all active:scale-[0.98] group"
            >
              {/* Posição */}
              <span className={`text-sm font-bold w-6 text-center ${
                i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'
              }`}>
                {i + 1}º
              </span>

              {/* Foto */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {item.deputado?.url_foto ? (
                  <img src={item.deputado.url_foto} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white/40" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">{item.deputado?.nome || "—"}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.deputado?.sigla_partido && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">{item.deputado.sigla_partido}</Badge>
                  )}
                  {item.deputado?.sigla_uf && (
                    <span className="text-[10px] text-muted-foreground">{item.deputado.sigla_uf}</span>
                  )}
                </div>
              </div>

              {/* Valor */}
              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold text-red-400">{formatCurrency(item.valor_total)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default LegislativoCamaraRankings;
