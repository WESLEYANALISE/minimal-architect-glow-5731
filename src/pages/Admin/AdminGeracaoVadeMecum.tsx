import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Volume2, Sparkles, FileText, Tag, Loader2, ChevronDown, ChevronRight, CheckCircle2, Circle, Filter, Play, Square, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { CODIGO_TO_TABLE } from "@/lib/codigoMappings";
import { toast } from "sonner";

interface ContagemLei {
  codigo: string;
  tableName: string;
  total: number;
  explicacao: number;
  narracao: number;
  grifo: number;
  exemplos: number;
  termos: number;
}

interface ResumoGlobal {
  total: number;
  explicacao: number;
  narracao: number;
  grifo: number;
  exemplos: number;
  termos: number;
}

interface ArtigoSimples {
  id: number;
  numero: string;
  texto: string;
  temExplicacao: boolean;
  temNarracao: boolean;
  temGrifo: boolean;
  temExemplo: boolean;
  temTermos: boolean;
}

interface GenerationState {
  tipo: string;
  tableName: string;
  isRunning: boolean;
  current: string | null;
  processed: number;
  total: number;
}

const CONTENT_TYPES = [
  { key: "explicacao", label: "Explicação", icon: BookOpen, color: "text-blue-400", bgColor: "bg-blue-500" },
  { key: "narracao", label: "Narração", icon: Volume2, color: "text-green-400", bgColor: "bg-green-500" },
  { key: "grifo", label: "Grifo Mágico", icon: Sparkles, color: "text-amber-400", bgColor: "bg-amber-500" },
  { key: "exemplos", label: "Exemplos", icon: FileText, color: "text-purple-400", bgColor: "bg-purple-500" },
  { key: "termos", label: "Termos", icon: Tag, color: "text-pink-400", bgColor: "bg-pink-500" },
] as const;

function getUniqueEntries(): [string, string][] {
  const seen = new Set<string>();
  const entries: [string, string][] = [];
  for (const [codigo, tableName] of Object.entries(CODIGO_TO_TABLE)) {
    if (!seen.has(tableName)) {
      seen.add(tableName);
      entries.push([codigo, tableName]);
    }
  }
  return entries.sort((a, b) => a[1].localeCompare(b[1]));
}

const AdminGeracaoVadeMecum = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contagens, setContagens] = useState<ContagemLei[]>([]);
  const [resumo, setResumo] = useState<ResumoGlobal>({ total: 0, explicacao: 0, narracao: 0, grifo: 0, exemplos: 0, termos: 0 });
  const [expandedLei, setExpandedLei] = useState<string | null>(null);
  const [filterPendente, setFilterPendente] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Generation state
  const [generation, setGeneration] = useState<GenerationState | null>(null);
  const stopRef = useRef(false);
  
  // Articles for expanded law
  const [artigos, setArtigos] = useState<ArtigoSimples[]>([]);
  const [loadingArtigos, setLoadingArtigos] = useState(false);

  useEffect(() => {
    carregarContagens();
  }, []);

  // Load articles when a law is expanded
  useEffect(() => {
    if (expandedLei) {
      const lei = contagens.find(c => c.codigo === expandedLei);
      if (lei) carregarArtigos(lei.tableName);
    } else {
      setArtigos([]);
    }
  }, [expandedLei]);

  async function carregarArtigos(tableName: string) {
    setLoadingArtigos(true);
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select("id, \"Número do Artigo\", Artigo, explicacao_tecnico, Narração")
        .order("ordem_artigo", { ascending: true, nullsFirst: false })
        .limit(2000);

      if (error) throw error;

      // Get cached content for this table
      const { data: cacheData } = await supabase
        .from("artigo_ai_cache")
        .select("artigo_numero, modo")
        .eq("tabela_nome", tableName);

      const cacheSet = new Set<string>();
      (cacheData || []).forEach((c: any) => cacheSet.add(`${c.artigo_numero}__${c.modo}`));

      const mapped: ArtigoSimples[] = (data || []).map((a: any) => {
        const num = a["Número do Artigo"] || "";
        return {
          id: a.id,
          numero: num,
          texto: (a.Artigo || "").substring(0, 100),
          temExplicacao: !!a.explicacao_tecnico,
          temNarracao: !!a["Narração"],
          temGrifo: cacheSet.has(`${num}__grifo_magico_v5`),
          temExemplo: cacheSet.has(`${num}__exemplo`),
          temTermos: cacheSet.has(`${num}__termos`),
        };
      });

      setArtigos(mapped);
    } catch (err) {
      console.error("Erro ao carregar artigos:", err);
      toast.error("Erro ao carregar artigos");
    } finally {
      setLoadingArtigos(false);
    }
  }

  async function carregarContagens() {
    setLoading(true);
    const entries = getUniqueEntries();
    const results: ContagemLei[] = [];
    let processed = 0;

    for (let i = 0; i < entries.length; i += 5) {
      const batch = entries.slice(i, i + 5);
      const batchResults = await Promise.allSettled(
        batch.map(async ([codigo, tableName]) => {
          try {
            const { count: total, error } = await supabase
              .from(tableName as any)
              .select("*", { count: "exact", head: true });
            if (error || !total) return null;

            const [expRes, narRes] = await Promise.all([
              supabase.from(tableName as any).select("*", { count: "exact", head: true }).not("explicacao_tecnico", "is", null),
              supabase.from(tableName as any).select("*", { count: "exact", head: true }).not("Narração", "is", null),
            ]);

            const [grifoRes, exRes, termRes] = await Promise.all([
              supabase.from("artigo_ai_cache").select("*", { count: "exact", head: true }).eq("tabela_nome", tableName).eq("modo", "grifo_magico_v5"),
              supabase.from("artigo_ai_cache").select("*", { count: "exact", head: true }).eq("tabela_nome", tableName).eq("modo", "exemplo"),
              supabase.from("artigo_ai_cache").select("*", { count: "exact", head: true }).eq("tabela_nome", tableName).eq("modo", "termos"),
            ]);

            return {
              codigo, tableName, total,
              explicacao: expRes.count || 0,
              narracao: narRes.count || 0,
              grifo: grifoRes.count || 0,
              exemplos: exRes.count || 0,
              termos: termRes.count || 0,
            } as ContagemLei;
          } catch { return null; }
        })
      );

      for (const r of batchResults) {
        if (r.status === "fulfilled" && r.value) results.push(r.value);
      }
      processed += batch.length;
      setLoadingProgress(Math.round((processed / entries.length) * 100));
    }

    results.sort((a, b) => b.total - a.total);
    setContagens(results);

    const sum = results.reduce(
      (acc, c) => ({
        total: acc.total + c.total,
        explicacao: acc.explicacao + c.explicacao,
        narracao: acc.narracao + c.narracao,
        grifo: acc.grifo + c.grifo,
        exemplos: acc.exemplos + c.exemplos,
        termos: acc.termos + c.termos,
      }),
      { total: 0, explicacao: 0, narracao: 0, grifo: 0, exemplos: 0, termos: 0 }
    );
    setResumo(sum);
    setLoading(false);
  }

  const stopGeneration = useCallback(() => {
    stopRef.current = true;
    toast.info("Parando geração...");
  }, []);

  const startGeneration = useCallback(async (tipo: string, lei: ContagemLei) => {
    stopRef.current = false;

    // Load full articles for generation
    const { data: fullArtigos, error } = await supabase
      .from(lei.tableName as any)
      .select("id, \"Número do Artigo\", Artigo, explicacao_tecnico, Narração")
      .order("ordem_artigo", { ascending: true, nullsFirst: false })
      .limit(2000);

    if (error || !fullArtigos) {
      toast.error("Erro ao carregar artigos");
      return;
    }

    // Get existing cache entries for grifo/exemplos/termos
    let cacheSet = new Set<string>();
    if (["grifo", "exemplos", "termos"].includes(tipo)) {
      const modoMap: Record<string, string> = { grifo: "grifo_magico_v5", exemplos: "exemplo", termos: "termos" };
      const { data: cacheData } = await supabase
        .from("artigo_ai_cache")
        .select("artigo_numero")
        .eq("tabela_nome", lei.tableName)
        .eq("modo", modoMap[tipo]);
      (cacheData || []).forEach((c: any) => cacheSet.add(c.artigo_numero));
    }

    // Filter articles that need generation
    const pending = (fullArtigos as any[]).filter(a => {
      const num = a["Número do Artigo"];
      if (!num || !a.Artigo) return false;
      // Skip structural headings (PARTE, TÍTULO, LIVRO, CAPÍTULO, SEÇÃO)
      if (/^(PARTE|TÍTULO|LIVRO|CAPÍTULO|SEÇÃO|DISPOSIÇÃO)/i.test(num.trim())) return false;
      
      switch (tipo) {
        case "explicacao": return !a.explicacao_tecnico;
        case "narracao": return !a["Narração"];
        case "grifo":
        case "exemplos":
        case "termos":
          return !cacheSet.has(num);
        default: return false;
      }
    });

    if (pending.length === 0) {
      toast.success(`Todos os artigos já têm ${CONTENT_TYPES.find(c => c.key === tipo)?.label}!`);
      return;
    }

    setGeneration({
      tipo,
      tableName: lei.tableName,
      isRunning: true,
      current: null,
      processed: 0,
      total: pending.length,
    });

    toast.info(`Iniciando geração de ${pending.length} ${CONTENT_TYPES.find(c => c.key === tipo)?.label}`);

    let successCount = 0;

    for (const artigo of pending) {
      if (stopRef.current) break;

      const num = artigo["Número do Artigo"];
      setGeneration(prev => prev ? { ...prev, current: `Art. ${num}`, processed: successCount } : null);

      try {
        let success = false;

        switch (tipo) {
          case "explicacao": {
            const { data, error } = await supabase.functions.invoke("gerar-explicacao-v2", {
              body: {
                artigo: artigo.Artigo,
                tipo: "explicacao",
                nivel: "tecnico",
                codigo: lei.codigo,
                numeroArtigo: num,
              },
            });
            success = !error && !!data?.conteudo;
            break;
          }
          case "narracao": {
            const { data, error } = await supabase.functions.invoke("gerar-narracao-vademecum", {
              body: {
                tableName: lei.tableName,
                articleId: artigo.id,
                numeroArtigo: num,
                textoArtigo: artigo.Artigo,
              },
            });
            success = !error && data?.success !== false;
            break;
          }
          case "grifo": {
            const { data, error } = await supabase.functions.invoke("grifo-magico", {
              body: {
                artigoTexto: artigo.Artigo,
                artigoNumero: num,
                leiNome: lei.tableName,
              },
            });
            success = !error && !data?.rateLimited && !!data?.grifos;
            break;
          }
          case "exemplos": {
            const { data, error } = await supabase.functions.invoke("gerar-explicacao-v2", {
              body: {
                artigo: artigo.Artigo,
                tipo: "exemplo",
                codigo: lei.codigo,
                numeroArtigo: num,
              },
            });
            success = !error && !!data?.conteudo;
            break;
          }
          case "termos": {
            const { data, error } = await supabase.functions.invoke("gerar-explicacao-v2", {
              body: {
                artigo: artigo.Artigo,
                tipo: "explicacao",
                nivel: "tecnico",
                codigo: lei.codigo,
                numeroArtigo: num,
              },
            });
            // Cache termos in artigo_ai_cache manually if needed
            success = !error && !!data?.conteudo;
            break;
          }
        }

        if (success) {
          successCount++;
          console.log(`✅ ${tipo} gerado para Art. ${num}`);
        } else {
          console.error(`❌ Falha ao gerar ${tipo} para Art. ${num}`);
        }
      } catch (err) {
        console.error(`❌ Erro ao gerar ${tipo} para Art. ${num}:`, err);
      }

      // Rate limiting delay
      const delay = tipo === "narracao" ? 6000 : 3000;
      await new Promise(r => setTimeout(r, delay));
    }

    setGeneration(prev => prev ? { ...prev, isRunning: false, current: null, processed: successCount } : null);
    toast.success(`${successCount}/${pending.length} ${CONTENT_TYPES.find(c => c.key === tipo)?.label} gerados!`);

    // Refresh counts for this law
    setTimeout(() => {
      carregarContagens();
      if (expandedLei) {
        const leiAtual = contagens.find(c => c.codigo === expandedLei);
        if (leiAtual) carregarArtigos(leiAtual.tableName);
      }
    }, 2000);
  }, [contagens, expandedLei]);

  const pct = (val: number, total: number) => total > 0 ? Math.round((val / total) * 100) : 0;

  const filteredContagens = filterPendente
    ? contagens.filter(c => c.explicacao < c.total || c.narracao < c.total || c.grifo < c.total)
    : contagens;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Geração Vade Mecum</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Carregando contagens... {loadingProgress}%</p>
          <Progress value={loadingProgress} className="w-64 h-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Geração Vade Mecum</h1>
          <p className="text-xs text-muted-foreground">{contagens.length} leis • {resumo.total.toLocaleString()} artigos</p>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto" onClick={() => carregarContagens()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Active Generation Banner */}
      {generation?.isRunning && (
        <Card className="border-primary/50 bg-primary/10 mb-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-medium">
                  Gerando {CONTENT_TYPES.find(c => c.key === generation.tipo)?.label}
                </span>
              </div>
              <Button variant="destructive" size="sm" onClick={stopGeneration} className="h-7 text-xs">
                <Square className="w-3 h-3 mr-1" /> Parar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              {generation.current || "Preparando..."} • {generation.processed}/{generation.total}
            </p>
            <Progress value={pct(generation.processed, generation.total)} className="h-1.5" />
          </CardContent>
        </Card>
      )}

      {/* Global Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {CONTENT_TYPES.map(ct => {
          const val = resumo[ct.key as keyof ResumoGlobal];
          const percent = pct(val, resumo.total);
          return (
            <Card key={ct.key} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ct.icon className={`w-4 h-4 ${ct.color}`} />
                  <span className="text-xs font-medium truncate">{ct.label}</span>
                </div>
                <div className="text-lg font-bold">{percent}%</div>
                <p className="text-[10px] text-muted-foreground">{val}/{resumo.total}</p>
                <Progress value={percent} className="h-1.5 mt-1" />
              </CardContent>
            </Card>
          );
        })}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Total Artigos</span>
            </div>
            <div className="text-lg font-bold">{resumo.total.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground">{contagens.length} leis</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={filterPendente ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterPendente(!filterPendente)}
          className="text-xs"
        >
          <Filter className="w-3 h-3 mr-1" />
          Só pendentes
        </Button>
        <span className="text-xs text-muted-foreground">
          {filteredContagens.length} leis
        </span>
      </div>

      {/* Per-law detail */}
      <div className="space-y-2">
        {filteredContagens.map(lei => (
          <Collapsible
            key={lei.codigo}
            open={expandedLei === lei.codigo}
            onOpenChange={(open) => setExpandedLei(open ? lei.codigo : null)}
          >
            <Card className="border-border/50">
              <CollapsibleTrigger asChild>
                <CardHeader className="p-3 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">{lei.tableName}</CardTitle>
                      <p className="text-[10px] text-muted-foreground">{lei.total} artigos</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {CONTENT_TYPES.map(ct => {
                        const val = lei[ct.key as keyof ContagemLei] as number;
                        const complete = val >= lei.total && lei.total > 0;
                        return complete ? (
                          <CheckCircle2 key={ct.key} className={`w-3.5 h-3.5 ${ct.color}`} />
                        ) : (
                          <Circle key={ct.key} className="w-3.5 h-3.5 text-muted-foreground/30" />
                        );
                      })}
                      {expandedLei === lei.codigo ? (
                        <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-1 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-3 pt-0 space-y-3">
                  {/* Progress bars with generate buttons */}
                  {CONTENT_TYPES.map(ct => {
                    const val = lei[ct.key as keyof ContagemLei] as number;
                    const percent = pct(val, lei.total);
                    const isComplete = val >= lei.total && lei.total > 0;
                    const isThisGenerating = generation?.isRunning && generation.tipo === ct.key && generation.tableName === lei.tableName;
                    
                    return (
                      <div key={ct.key} className="flex items-center gap-2">
                        <ct.icon className={`w-3.5 h-3.5 ${ct.color} shrink-0`} />
                        <span className="text-[10px] w-16 shrink-0">{ct.label}</span>
                        <Progress value={percent} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground w-14 text-right">{val}/{lei.total}</span>
                        <span className="text-[10px] font-medium w-8 text-right">{percent}%</span>
                        {!isComplete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 shrink-0"
                            disabled={!!generation?.isRunning}
                            onClick={(e) => {
                              e.stopPropagation();
                              startGeneration(ct.key, lei);
                            }}
                          >
                            {isThisGenerating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3 text-primary" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {/* Article list */}
                  {loadingArtigos ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : artigos.length > 0 && (
                    <div className="mt-3 border-t border-border/50 pt-3">
                      <p className="text-[10px] text-muted-foreground mb-2 font-medium">
                        Artigos ({artigos.length})
                      </p>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {artigos.map(art => (
                          <div key={art.id} className="flex items-center gap-2 py-1 px-2 rounded bg-muted/30">
                            <span className="text-[10px] font-mono w-12 shrink-0 truncate">
                              {art.numero || "—"}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex-1 truncate">
                              {art.texto}
                            </span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <div className={`w-2 h-2 rounded-full ${art.temExplicacao ? 'bg-blue-500' : 'bg-muted-foreground/20'}`} title="Explicação" />
                              <div className={`w-2 h-2 rounded-full ${art.temNarracao ? 'bg-green-500' : 'bg-muted-foreground/20'}`} title="Narração" />
                              <div className={`w-2 h-2 rounded-full ${art.temGrifo ? 'bg-amber-500' : 'bg-muted-foreground/20'}`} title="Grifo" />
                              <div className={`w-2 h-2 rounded-full ${art.temExemplo ? 'bg-purple-500' : 'bg-muted-foreground/20'}`} title="Exemplo" />
                              <div className={`w-2 h-2 rounded-full ${art.temTermos ? 'bg-pink-500' : 'bg-muted-foreground/20'}`} title="Termos" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default AdminGeracaoVadeMecum;
