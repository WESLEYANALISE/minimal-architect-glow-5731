import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FilaItem {
  id: string;
  tipo: string;
  area: string;
  tema: string;
  status: string;
  erro_msg: string | null;
  itens_gerados: number;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  pendente: number;
  processando: number;
  concluido: number;
  erro: number;
  flashcards: { pendente: number; concluido: number; erro: number };
  questoes: { pendente: number; concluido: number; erro: number };
  lacunas: { pendente: number; concluido: number; erro: number };
}

const AdminMonitoramentoConteudo = () => {
  const navigate = useNavigate();
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pausado, setPausado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const fetchData = async () => {
    const [filaRes, configRes] = await Promise.all([
      supabase.from('conteudo_geracao_fila').select('*').order('created_at', { ascending: true }),
      supabase.from('conteudo_geracao_config').select('pausado').eq('id', 'main').single(),
    ]);

    if (filaRes.data) {
      setFila(filaRes.data as FilaItem[]);

      const calcStats = (items: FilaItem[]): Stats => {
        const byStatus = (s: string) => items.filter(i => i.status === s).length;
        const byTypeStatus = (t: string, s: string) => items.filter(i => i.tipo === t && i.status === s).length;
        return {
          total: items.length,
          pendente: byStatus('pendente'),
          processando: byStatus('processando'),
          concluido: byStatus('concluido'),
          erro: byStatus('erro'),
          flashcards: { pendente: byTypeStatus('flashcards', 'pendente'), concluido: byTypeStatus('flashcards', 'concluido'), erro: byTypeStatus('flashcards', 'erro') },
          questoes: { pendente: byTypeStatus('questoes', 'pendente'), concluido: byTypeStatus('questoes', 'concluido'), erro: byTypeStatus('questoes', 'erro') },
          lacunas: { pendente: byTypeStatus('lacunas', 'pendente'), concluido: byTypeStatus('lacunas', 'concluido'), erro: byTypeStatus('lacunas', 'erro') },
        };
      };
      setStats(calcStats(filaRes.data as FilaItem[]));
    }

    if (configRes.data) {
      setPausado(configRes.data.pausado);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const togglePausa = async () => {
    const novo = !pausado;
    await supabase.from('conteudo_geracao_config').update({ pausado: novo }).eq('id', 'main');
    setPausado(novo);
    toast({ title: novo ? "⏸️ Geração pausada" : "▶️ Geração retomada" });
  };

  const popularFila = async () => {
    setPopularLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('popular-fila-conteudo');
      if (error) throw error;
      toast({
        title: "✅ Fila populada!",
        description: `${data.total} itens adicionados (${data.flashcards} FC, ${data.questoes} Q, ${data.lacunas} L)`,
      });
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setPopularLoading(false);
    }
  };

  const retentarErros = async () => {
    await supabase.from('conteudo_geracao_fila')
      .update({ status: 'pendente', erro_msg: null })
      .eq('status', 'erro');
    toast({ title: "🔄 Erros resetados para pendente" });
    fetchData();
  };

  const progressPercent = stats ? (stats.total > 0 ? Math.round((stats.concluido / stats.total) * 100) : 0) : 0;
  const tempoRestanteSegs = stats ? (stats.pendente + stats.processando) * 30 : 0;
  const tempoRestanteMin = Math.ceil(tempoRestanteSegs / 60);

  const filaFiltrada = fila.filter(item => {
    if (filtroStatus !== 'todos' && item.status !== filtroStatus) return false;
    if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false;
    return true;
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'processando': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'concluido': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'erro': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const tipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      flashcards: 'bg-blue-500/20 text-blue-400',
      questoes: 'bg-purple-500/20 text-purple-400',
      lacunas: 'bg-amber-500/20 text-amber-400',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[tipo] || ''}`}>{tipo}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Monitoramento de Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Flashcards, Questões e Lacunas</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button onClick={togglePausa} variant={pausado ? "default" : "outline"} size="sm">
          {pausado ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
          {pausado ? "Retomar" : "Pausar"}
        </Button>
        <Button onClick={popularFila} disabled={popularLoading} variant="outline" size="sm">
          {popularLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
          Popular Fila
        </Button>
        <Button onClick={retentarErros} variant="outline" size="sm" disabled={!stats?.erro}>
          <RefreshCw className="h-4 w-4 mr-1" /> Retentar Erros ({stats?.erro || 0})
        </Button>
      </div>

      {/* Progress */}
      {stats && stats.total > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{progressPercent}% concluído</span>
              <span className="text-xs text-muted-foreground">
                ~{tempoRestanteMin} min restantes ({stats.concluido}/{stats.total})
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            {pausado && (
              <p className="text-xs text-amber-500 mt-2 font-medium">⏸️ Geração pausada</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(['flashcards', 'questoes', 'lacunas'] as const).map(tipo => {
            const s = stats[tipo];
            const total = s.pendente + s.concluido + s.erro;
            const label = tipo === 'flashcards' ? '📇 Flashcards' : tipo === 'questoes' ? '❓ Questões' : '🔤 Lacunas';
            return (
              <Card key={tipo}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs">{label}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-lg font-bold text-foreground">{s.concluido}/{total}</p>
                  {s.erro > 0 && <p className="text-xs text-destructive">{s.erro} erros</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          className="text-xs bg-muted rounded px-2 py-1 border border-border"
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos status</option>
          <option value="pendente">Pendente</option>
          <option value="processando">Processando</option>
          <option value="concluido">Concluído</option>
          <option value="erro">Erro</option>
        </select>
        <select
          className="text-xs bg-muted rounded px-2 py-1 border border-border"
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
        >
          <option value="todos">Todos tipos</option>
          <option value="flashcards">Flashcards</option>
          <option value="questoes">Questões</option>
          <option value="lacunas">Lacunas</option>
        </select>
        <span className="text-xs text-muted-foreground self-center">{filaFiltrada.length} itens</span>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-auto max-h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filaFiltrada.slice(0, 200).map(item => (
                <TableRow key={item.id}>
                  <TableCell>{statusIcon(item.status)}</TableCell>
                  <TableCell>{tipoBadge(item.tipo)}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{item.area}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{item.tema}</TableCell>
                  <TableCell className="text-xs">{item.itens_gerados || '-'}</TableCell>
                  <TableCell className="text-xs text-destructive max-w-[150px] truncate">{item.erro_msg || ''}</TableCell>
                </TableRow>
              ))}
              {filaFiltrada.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Fila vazia. Clique em "Popular Fila" para iniciar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default AdminMonitoramentoConteudo;
