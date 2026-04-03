import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { URLS_PLANALTO } from "@/lib/urlsPlanalto";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Check, X, ChevronDown, ChevronRight, AlertTriangle, Plus, Minus, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ArtigoDiff {
  numero: string;
  id: number | null;
  textoAtual: string;
  textoNovo: string;
  marcadores: string[];
  tipo: 'alterado' | 'novo' | 'removido';
}

interface VerificacaoResult {
  totalPlanalto: number;
  totalBanco: number;
  totalDiferencas: number;
  artigosAlterados: ArtigoDiff[];
  artigosNovos: ArtigoDiff[];
  artigosRemovidos: ArtigoDiff[];
}

interface LeiStatus {
  loading: boolean;
  result: VerificacaoResult | null;
  error: string | null;
  dismissed: Set<string>;
  updated: Set<string>;
}

export default function AdminLeisAtualizacaoManual() {
  const navigate = useNavigate();
  const [statusMap, setStatusMap] = useState<Record<string, LeiStatus>>({});

  const leis = Object.entries(URLS_PLANALTO).map(([nome, url]) => ({ nome, url }));

  const verificarLei = async (nome: string, url: string) => {
    setStatusMap(prev => ({
      ...prev,
      [nome]: { loading: true, result: null, error: null, dismissed: new Set(), updated: new Set() }
    }));

    try {
      const { data, error } = await supabase.functions.invoke('verificar-atualizacao-lei', {
        body: { tableName: nome, urlPlanalto: url }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido');

      setStatusMap(prev => ({
        ...prev,
        [nome]: {
          loading: false,
          result: {
            totalPlanalto: data.totalPlanalto,
            totalBanco: data.totalBanco,
            totalDiferencas: data.totalDiferencas,
            artigosAlterados: data.artigosAlterados || [],
            artigosNovos: data.artigosNovos || [],
            artigosRemovidos: data.artigosRemovidos || [],
          },
          error: null,
          dismissed: new Set(),
          updated: new Set(),
        }
      }));

      const total = (data.artigosAlterados?.length || 0) + (data.artigosNovos?.length || 0);
      if (total === 0) {
        toast.success(`${nome}: Nenhuma diferença encontrada ✅`);
      } else {
        toast.warning(`${nome}: ${total} diferença(s) encontrada(s)`);
      }
    } catch (err: any) {
      setStatusMap(prev => ({
        ...prev,
        [nome]: { loading: false, result: null, error: err.message, dismissed: new Set(), updated: new Set() }
      }));
      toast.error(`Erro ao verificar ${nome}: ${err.message}`);
    }
  };

  const atualizarArtigo = async (leiNome: string, artigo: ArtigoDiff) => {
    if (!artigo.id) {
      toast.error("Artigo novo - inserção manual necessária");
      return;
    }

    try {
      const { error } = await supabase
        .from(leiNome as any)
        .update({ Artigo: artigo.textoNovo })
        .eq('id', artigo.id);

      if (error) throw error;

      setStatusMap(prev => {
        const current = prev[leiNome];
        if (!current) return prev;
        const updated = new Set(current.updated);
        updated.add(artigo.numero);
        return { ...prev, [leiNome]: { ...current, updated } };
      });

      toast.success(`Art. ${artigo.numero} atualizado com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao atualizar Art. ${artigo.numero}: ${err.message}`);
    }
  };

  const dismissArtigo = (leiNome: string, numero: string) => {
    setStatusMap(prev => {
      const current = prev[leiNome];
      if (!current) return prev;
      const dismissed = new Set(current.dismissed);
      dismissed.add(numero);
      return { ...prev, [leiNome]: { ...current, dismissed } };
    });
    toast.info(`Art. ${numero} marcado como alarme falso`);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'alterado': return <Edit className="w-4 h-4 text-yellow-500" />;
      case 'novo': return <Plus className="w-4 h-4 text-green-500" />;
      case 'removido': return <Minus className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'alterado': return 'Alterado';
      case 'novo': return 'Novo';
      case 'removido': return 'Removido';
      default: return tipo;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Leis Manuais - Atualização</h1>
          <p className="text-sm text-muted-foreground">{leis.length} leis mapeadas</p>
        </div>
      </div>

      <div className="space-y-3">
        {leis.map(({ nome, url }) => {
          const status = statusMap[nome];
          const allDiffs = [
            ...(status?.result?.artigosAlterados || []),
            ...(status?.result?.artigosNovos || []),
            ...(status?.result?.artigosRemovidos || []),
          ].filter(a => !status?.dismissed.has(a.numero) && !status?.updated.has(a.numero));

          return (
            <Card key={nome} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">{nome}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{url}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={status?.result && allDiffs.length === 0 ? "outline" : "default"}
                    onClick={() => verificarLei(nome, url)}
                    disabled={status?.loading}
                    className="shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${status?.loading ? 'animate-spin' : ''}`} />
                    {status?.loading ? 'Verificando...' : 'Verificar'}
                  </Button>
                </div>

                {status?.loading && (
                  <Progress value={undefined} className="mt-2 h-1" />
                )}

                {status?.error && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {status.error}
                  </p>
                )}

                {status?.result && (
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span>Planalto: {status.result.totalPlanalto} arts</span>
                    <span>Banco: {status.result.totalBanco} arts</span>
                    {status.result.totalDiferencas > 0 ? (
                      <span className="text-yellow-600 font-medium">
                        {allDiffs.length} pendente(s)
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Atualizado
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>

              {status?.result && allDiffs.length > 0 && (
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2">
                    {allDiffs.map((artigo) => (
                      <Collapsible key={artigo.numero}>
                        <div className="border rounded-lg overflow-hidden">
                          <CollapsibleTrigger className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left">
                            <div className="flex items-center gap-2">
                              {getTipoIcon(artigo.tipo)}
                              <span className="text-sm font-medium">Art. {artigo.numero}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                                {getTipoLabel(artigo.tipo)}
                              </span>
                              {artigo.marcadores.length > 0 && (
                                <span className="text-xs text-orange-600 font-medium">
                                  📋 {artigo.marcadores.length} marcador(es)
                                </span>
                              )}
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="p-3 border-t space-y-3">
                              {artigo.marcadores.length > 0 && (
                                <div className="bg-orange-50 dark:bg-orange-950/30 rounded p-2">
                                  <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                                    Prova Real - Marcadores de Alteração:
                                  </p>
                                  {artigo.marcadores.map((m, i) => (
                                    <p key={i} className="text-xs text-orange-600 dark:text-orange-300">{m}</p>
                                  ))}
                                </div>
                              )}

                              {artigo.textoAtual && (
                                 <div>
                                   <p className="text-xs font-medium text-muted-foreground mb-1">Texto Atual (Banco):</p>
                                   <div className="bg-muted/50 border border-border rounded p-2 text-xs max-h-40 overflow-y-auto whitespace-pre-wrap text-foreground">
                                     {artigo.textoAtual}
                                   </div>
                                 </div>
                              )}

                              {artigo.textoNovo && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Texto Novo (Planalto):</p>
                                  <div className="bg-muted/30 border border-border rounded p-2 text-xs max-h-40 overflow-y-auto whitespace-pre-wrap text-foreground">
                                    {artigo.textoNovo}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 pt-1">
                                {artigo.tipo !== 'removido' && artigo.id && (
                                  <Button
                                    size="sm"
                                    onClick={() => atualizarArtigo(nome, artigo)}
                                    className="text-xs"
                                  >
                                    <Check className="w-3 h-3 mr-1" /> Atualizar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => dismissArtigo(nome, artigo.numero)}
                                  className="text-xs"
                                >
                                  <X className="w-3 h-3 mr-1" /> Alarme Falso
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
