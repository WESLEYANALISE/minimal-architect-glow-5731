import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Pause, RefreshCw, AlertCircle, CheckCircle2, Loader2, Clock, BookOpen, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FilaItem {
  id: string;
  biblioteca_id: number;
  area: string;
  tema: string;
  status: string;
  erro_msg: string | null;
  materia_id: number | null;
  topicos_total: number;
  topicos_concluidos: number;
  created_at: string;
  updated_at: string;
}

interface AreaResumo {
  area: string;
  total: number;
  concluidos: number;
  gerando: number;
  erros: number;
  pendentes: number;
}

const statusColors: Record<string, string> = {
  pendente: "text-muted-foreground",
  processando: "text-blue-500",
  extraindo: "text-blue-500",
  identificando: "text-amber-500",
  gerando: "text-purple-500",
  concluido: "text-green-500",
  erro: "text-destructive",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  processando: "Processando",
  extraindo: "Extraindo PDF",
  identificando: "Identificando Temas",
  gerando: "Gerando Conteúdo",
  concluido: "Concluído",
  erro: "Erro",
};

export default function AcompanhamentoAulas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [pausado, setPausado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [populando, setPopulando] = useState(false);
  const [areaResumos, setAreaResumos] = useState<AreaResumo[]>([]);
  const [filtroArea, setFiltroArea] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Fetch fila
    const { data: filaData } = await supabase
      .from('aulas_geracao_fila')
      .select('*')
      .order('created_at', { ascending: true });

    // Fetch config
    const { data: configData } = await supabase
      .from('aulas_geracao_config')
      .select('pausado')
      .eq('id', 'main')
      .single();

    if (filaData) {
      setFila(filaData as unknown as FilaItem[]);

      // Calcular resumo por área
      const areasMap = new Map<string, AreaResumo>();
      for (const item of filaData) {
        const fi = item as unknown as FilaItem;
        if (!areasMap.has(fi.area)) {
          areasMap.set(fi.area, { area: fi.area, total: 0, concluidos: 0, gerando: 0, erros: 0, pendentes: 0 });
        }
        const r = areasMap.get(fi.area)!;
        r.total++;
        if (fi.status === 'concluido') r.concluidos++;
        else if (fi.status === 'gerando') r.gerando++;
        else if (fi.status === 'erro') r.erros++;
        else r.pendentes++;
      }
      setAreaResumos(Array.from(areasMap.values()).sort((a, b) => a.area.localeCompare(b.area)));
    }

    if (configData) setPausado(configData.pausado as boolean);
    setLoading(false);
  }, []);

  // Atualizar contagem de tópicos concluídos para itens em "gerando"
  const atualizarTopicos = useCallback(async () => {
    const gerando = fila.filter(f => f.status === 'gerando' && f.materia_id);
    for (const item of gerando) {
      const { count: totalExistentes } = await supabase
        .from('categorias_topicos')
        .select('*', { count: 'exact', head: true })
        .eq('materia_id', item.materia_id!);

      const { count } = await supabase
        .from('categorias_topicos')
        .select('*', { count: 'exact', head: true })
        .eq('materia_id', item.materia_id!)
        .eq('status', 'concluido');

      const total = totalExistentes || item.topicos_total;
      const concluidos = count || 0;

      // Marcar como concluído se todos os tópicos estão prontos OU se topicos_total era 0 mas já existem tópicos concluídos
      const isConcluido = (total > 0 && concluidos >= total) || (item.topicos_total === 0 && (totalExistentes || 0) > 0);

      if (concluidos !== item.topicos_concluidos || total !== item.topicos_total) {
        await supabase
          .from('aulas_geracao_fila')
          .update({
            topicos_concluidos: concluidos,
            topicos_total: total,
            status: isConcluido ? 'concluido' : 'gerando'
          })
          .eq('id', item.id);
      }
    }
  }, [fila]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (fila.some(f => f.status === 'gerando')) {
      atualizarTopicos();
    }
  }, [fila, atualizarTopicos]);

  const togglePausa = async () => {
    const novo = !pausado;
    await supabase.from('aulas_geracao_config').update({ pausado: novo }).eq('id', 'main');
    setPausado(novo);
    toast({ title: novo ? "Pipeline pausado" : "Pipeline retomado" });
  };

  const popularFila = async () => {
    setPopulando(true);
    try {
      // Buscar todas as matérias da BIBLIOTECA-ESTUDOS
      const { data: biblioteca, error: bibError } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('id, Área, Tema, Download, "Capa-livro", "Capa-area"')
        .not('Download', 'is', null)
        .not('Área', 'is', null)
        .not('Tema', 'is', null);

      if (bibError) throw bibError;
      if (!biblioteca || biblioteca.length === 0) {
        toast({ title: "Nenhuma matéria encontrada na biblioteca", variant: "destructive" });
        return;
      }

      // Buscar IDs já na fila
      const { data: jaExistem } = await supabase
        .from('aulas_geracao_fila')
        .select('biblioteca_id');

      const idsExistentes = new Set((jaExistem || []).map((j: any) => j.biblioteca_id));

      // Buscar matérias já em categorias_materias
      const { data: categoriasExistentes } = await supabase
        .from('categorias_materias')
        .select('categoria, nome');

      const chavesCategorias = new Set(
        (categoriasExistentes || []).map((c: any) => `${c.categoria}|||${c.nome}`)
      );

      // Filtrar matérias que ainda não foram processadas
      const novos = biblioteca.filter((b: any) => {
        if (idsExistentes.has(b.id)) return false;
        const chave = `${b['Área']}|||${b['Tema']}`;
        if (chavesCategorias.has(chave)) return false;
        // Verificar se tem URL de download válida
        if (!b.Download || b.Download.includes('/folders/')) return false;
        return true;
      });

      if (novos.length === 0) {
        toast({ title: "Todas as matérias já estão na fila ou processadas!" });
        return;
      }

      // Inserir em lotes
      const batchSize = 50;
      let inserted = 0;
      for (let i = 0; i < novos.length; i += batchSize) {
        const batch = novos.slice(i, i + batchSize).map((b: any) => ({
          biblioteca_id: b.id,
          area: b['Área'],
          tema: b['Tema'],
          pdf_url: b.Download,
          capa_url: b['Capa-livro'] || null,
          capa_area_url: b['Capa-area'] || null,
          status: 'pendente',
        }));

        const { error: insertError } = await supabase.from('aulas_geracao_fila').insert(batch);
        if (insertError) {
          console.error('Erro ao inserir batch:', insertError);
        } else {
          inserted += batch.length;
        }
      }

      toast({ title: `${inserted} matérias adicionadas à fila!` });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro ao popular fila", description: err.message, variant: "destructive" });
    } finally {
      setPopulando(false);
    }
  };

  const retryErro = async (id: string) => {
    await supabase.from('aulas_geracao_fila').update({ status: 'pendente', erro_msg: null }).eq('id', id);
    toast({ title: "Matéria reenfileirada" });
    fetchData();
  };

  const resetarTravados = async () => {
    // Resetar TODOS os itens em "gerando" que não progrediram nas últimas 2h
    const travados = fila.filter(f => {
      if (f.status !== 'gerando') return false;
      const updatedAt = new Date(f.updated_at).getTime();
      const agora = Date.now();
      return (agora - updatedAt) > 2 * 60 * 60 * 1000; // 2h
    });

    if (travados.length === 0) {
      toast({ title: "Nenhum item travado encontrado", description: "Todos os itens em progresso foram atualizados nas últimas 2h" });
      return;
    }

    for (const item of travados) {
      await supabase
        .from('aulas_geracao_fila')
        .update({ status: 'pendente', erro_msg: 'Reset manual: travado em gerando' })
        .eq('id', item.id);
    }

    toast({ title: `${travados.length} itens resetados para pendente` });
    fetchData();
  };

  // Stats
  const totalFila = fila.length;
  const concluidos = fila.filter(f => f.status === 'concluido').length;
  const erros = fila.filter(f => f.status === 'erro').length;
  const gerando = fila.filter(f => ['processando', 'extraindo', 'identificando', 'gerando'].includes(f.status)).length;
  const pendentes = fila.filter(f => f.status === 'pendente').length;
  const progresso = totalFila > 0 ? Math.round((concluidos / totalFila) * 100) : 0;

  // Filtro
  const filaFiltrada = fila.filter(f => {
    if (filtroArea && f.area !== filtroArea) return false;
    if (filtroStatus && f.status !== filtroStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Acompanhamento de Aulas</h1>
            <p className="text-sm text-muted-foreground">Pipeline automático de geração</p>
          </div>
          <div className="flex gap-2">
            <Button variant={pausado ? "default" : "outline"} size="sm" onClick={togglePausa}>
              {pausado ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
              {pausado ? "Retomar" : "Pausar"}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="cursor-pointer" onClick={() => setFiltroStatus(null)}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{totalFila}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFiltroStatus('pendente')}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{pendentes}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Pendentes</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFiltroStatus('gerando')}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-purple-500">{gerando}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Zap className="w-3 h-3" /> Em progresso</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFiltroStatus('concluido')}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-500">{concluidos}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> Concluídos</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer" onClick={() => setFiltroStatus('erro')}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-destructive">{erros}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" /> Erros</div>
            </CardContent>
          </Card>
        </div>

        {/* Progresso geral */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso Geral</span>
              <span className="text-sm text-muted-foreground">{progresso}%</span>
            </div>
            <Progress value={progresso} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{concluidos} de {totalFila} matérias</span>
              <span>~{Math.ceil((totalFila - concluidos) * 5 / 60)}h restantes</span>
            </div>
          </CardContent>
        </Card>

        {/* Popular fila */}
        {totalFila === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Fila vazia</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clique para popular a fila com todas as matérias pendentes da Biblioteca de Estudos
              </p>
              <Button onClick={popularFila} disabled={populando}>
                {populando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                {populando ? "Populando..." : "Popular Fila"}
              </Button>
            </CardContent>
          </Card>
        )}

        {totalFila > 0 && fila.length > 0 && (
          <div className="flex justify-end gap-2">
            {gerando > 0 && (
              <Button variant="outline" size="sm" onClick={resetarTravados} className="text-amber-500 border-amber-500/30">
                <RefreshCw className="w-4 h-4 mr-1" />
                Resetar Travados
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={popularFila} disabled={populando}>
              {populando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
              Atualizar Fila
            </Button>
          </div>
        )}

        {/* Progresso por área */}
        {areaResumos.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Por Área</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {areaResumos.map(a => {
                const pct = a.total > 0 ? Math.round((a.concluidos / a.total) * 100) : 0;
                return (
                  <button
                    key={a.area}
                    onClick={() => setFiltroArea(filtroArea === a.area ? null : a.area)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${filtroArea === a.area ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate flex-1">{a.area}</span>
                      <span className="text-xs text-muted-foreground ml-2">{a.concluidos}/{a.total}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    {a.erros > 0 && <span className="text-xs text-destructive">{a.erros} erro(s)</span>}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Filtros ativos */}
        {(filtroArea || filtroStatus) && (
          <div className="flex gap-2 flex-wrap">
            {filtroArea && (
              <Button variant="secondary" size="sm" onClick={() => setFiltroArea(null)}>
                Área: {filtroArea} ✕
              </Button>
            )}
            {filtroStatus && (
              <Button variant="secondary" size="sm" onClick={() => setFiltroStatus(null)}>
                Status: {statusLabels[filtroStatus] || filtroStatus} ✕
              </Button>
            )}
          </div>
        )}

        {/* Lista de matérias */}
        <div className="space-y-2">
          {filaFiltrada.map(item => (
            <Card key={item.id} className={item.status === 'erro' ? 'border-destructive/50' : ''}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${statusColors[item.status] || ''}`}>
                        {['processando', 'extraindo', 'identificando', 'gerando'].includes(item.status) && (
                          <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                        )}
                        {statusLabels[item.status] || item.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate mt-1">{item.tema}</p>
                    <p className="text-xs text-muted-foreground">{item.area}</p>
                    {item.status === 'gerando' && item.topicos_total > 0 && (
                      <div className="mt-1">
                        <Progress value={(item.topicos_concluidos / item.topicos_total) * 100} className="h-1" />
                        <span className="text-xs text-muted-foreground">{item.topicos_concluidos}/{item.topicos_total} tópicos</span>
                      </div>
                    )}
                    {item.erro_msg && (
                      <p className="text-xs text-destructive mt-1 line-clamp-2">{item.erro_msg}</p>
                    )}
                  </div>
                  {item.status === 'erro' && (
                    <Button variant="ghost" size="sm" onClick={() => retryErro(item.id)}>
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
