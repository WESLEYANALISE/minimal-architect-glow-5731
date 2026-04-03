import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Receipt, X, Loader2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CamaraDeputadoDespesas = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [despesas, setDespesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [nomeDeputado, setNomeDeputado] = useState("");

  useEffect(() => {
    if (id) {
      carregarDespesas();
      carregarNome();
    }
  }, [id]);

  const carregarNome = async () => {
    const { data } = await supabase
      .from("deputados_cache")
      .select("nome")
      .eq("id", Number(id))
      .maybeSingle();
    if (data) setNomeDeputado((data as any).nome);
  };

  const carregarDespesas = async () => {
    setLoading(true);
    try {
      const anoAtual = new Date().getFullYear();
      const { data, error } = await supabase.functions.invoke("deputado-despesas", {
        body: { idDeputado: id, ano: anoAtual },
      });
      if (error) throw error;
      setDespesas(data.despesas || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = useMemo(() => {
    if (!busca.trim()) return despesas;
    const term = busca.toLowerCase();
    return despesas.filter(
      (d) =>
        d.tipoDespesa?.toLowerCase().includes(term) ||
        d.nomeFornecedor?.toLowerCase().includes(term)
    );
  }, [despesas, busca]);

  const totalFiltrado = filtradas.reduce((sum, d) => sum + (d.valorLiquido || 0), 0);

  // Group by type
  const porTipo = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    despesas.forEach((d) => {
      const tipo = d.tipoDespesa || "Outros";
      if (!map[tipo]) map[tipo] = { total: 0, count: 0 };
      map[tipo].total += d.valorLiquido || 0;
      map[tipo].count++;
    });
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);
  }, [despesas]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">
              Despesas {new Date().getFullYear()}
            </h1>
            {nomeDeputado && (
              <p className="text-[11px] text-muted-foreground truncate">{nomeDeputado}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-4">
        {/* Resumo */}
        {!loading && despesas.length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Resumo
                </h2>
                <span className="text-lg font-bold text-primary">
                  {totalFiltrado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{filtradas.length} despesas registradas</p>

              {/* Top categorias */}
              {porTipo.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {porTipo.map(([tipo, info]) => (
                    <div key={tipo} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate flex-1 mr-2">{tipo}</span>
                      <span className="font-medium text-foreground whitespace-nowrap">
                        {info.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar despesa ou fornecedor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 bg-card border-border/50"
          />
          {busca && (
            <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {busca ? "Nenhuma despesa encontrada" : "Sem despesas registradas"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtradas.map((despesa, index) => (
              <Card
                key={index}
                className="bg-card border-border/50 hover:border-primary/30 transition-all animate-fade-in"
                style={{ animationDelay: `${Math.min(index * 0.03, 0.5)}s`, animationFillMode: "backwards" }}
              >
                <CardContent className="p-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground line-clamp-2">{despesa.tipoDespesa}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{despesa.nomeFornecedor}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-bold text-primary">
                          {(despesa.valorLiquido || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {despesa.dataDocumento ? new Date(despesa.dataDocumento).toLocaleDateString("pt-BR") : ""}
                        </span>
                      </div>
                      {despesa.urlDocumento && (
                        <a
                          href={despesa.urlDocumento}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary/70 hover:text-primary mt-1 inline-block"
                        >
                          Ver comprovante →
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CamaraDeputadoDespesas;
