import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { URLS_PLANALTO } from "@/lib/urlsPlanalto";
import { ArrowLeft, RefreshCw, FileText, CheckCircle, Clock, Loader2, Play, AlertCircle, Pause, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export default function AdminGeracaoExplicacoes() {
  const navigate = useNavigate();
  const [selectedLei, setSelectedLei] = useState<string>("");
  const [isPopulating, setIsPopulating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const leis = Object.keys(URLS_PLANALTO);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev.slice(-99), {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      message,
      type,
    }]);
  };

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedLei) return;
    setLogs([]);

    const channel = supabase
      .channel('explicacoes-fila-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'explicacoes_artigos_fila',
          filter: `tabela_lei=eq.${selectedLei}`,
        },
        (payload: any) => {
          const { new: row } = payload;
          const artigo = row.numero_artigo || row.id;
          if (row.status === 'concluido') {
            addLog(`✅ Art. ${artigo} — concluído`, 'success');
          } else if (row.status === 'erro') {
            addLog(`❌ Art. ${artigo} — erro: ${row.erro || 'desconhecido'}`, 'error');
          } else if (row.status === 'gerando') {
            addLog(`⏳ Art. ${artigo} — gerando...`, 'info');
          } else if (row.status === 'pausado') {
            addLog(`⏸️ Art. ${artigo} — pausado`, 'warning');
          }
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLei]);

  // Stats da fila para a lei selecionada
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-explicacoes-stats', selectedLei],
    queryFn: async () => {
      if (!selectedLei) return null;

      const { data: filaData } = await supabase
        .from("explicacoes_artigos_fila")
        .select("status")
        .eq("tabela_lei", selectedLei);

      const fila = filaData || [];
      const pendentes = fila.filter(f => f.status === 'pendente').length;
      const gerando = fila.filter(f => f.status === 'gerando').length;
      const concluidos = fila.filter(f => f.status === 'concluido').length;
      const erros = fila.filter(f => f.status === 'erro').length;
      const pausados = fila.filter(f => f.status === 'pausado').length;
      const total = fila.length;

      return { total, pendentes, gerando, concluidos, erros, pausados };
    },
    enabled: !!selectedLei,
    refetchInterval: selectedLei ? 5000 : false,
  });

  const handlePopularFila = async () => {
    if (!selectedLei) return;
    setIsPopulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('popular-fila-explicacoes', {
        body: { tableName: selectedLei },
      });
      if (error) throw error;
      toast.success(`Fila populada: ${data.adicionadosNaFila} artigos pendentes de ${data.totalArtigos} total`);
      refetch();
    } catch (e: any) {
      toast.error("Erro ao popular fila: " + e.message);
    }
    setIsPopulating(false);
  };

  const runningRef = useRef(false);

  const handleIniciarGeracao = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    addLog('🚀 Processamento automático iniciado', 'info');

    while (runningRef.current) {
      try {
        const { data, error } = await supabase.functions.invoke('cron-gerar-explicacoes-artigos');
        if (error) throw error;
        refetch();

        const remaining = data?.remaining ?? 0;
        if (remaining === 0) {
          addLog('🎉 Todos os artigos foram processados!', 'success');
          break;
        }

        // Small delay between batches
        await new Promise(r => setTimeout(r, 2000));
      } catch (e: any) {
        addLog(`❌ Erro no lote: ${e.message}`, 'error');
        // Wait longer on error before retrying
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    runningRef.current = false;
    setIsRunning(false);
  };

  const stopProcessing = () => {
    runningRef.current = false;
  };

  const handlePausar = async () => {
    setIsPausing(true);
    try {
      // Muda todos os pendentes e gerando para "pausado"
      const { error } = await supabase
        .from("explicacoes_artigos_fila")
        .update({ status: "pausado" } as any)
        .eq("tabela_lei", selectedLei)
        .in("status", ["pendente", "gerando"]);
      if (error) throw error;
      toast.success("Geração pausada!");
      refetch();
    } catch (e: any) {
      toast.error("Erro ao pausar: " + e.message);
    }
    setIsPausing(false);
  };

  const handleRetomar = async () => {
    setIsPausing(true);
    try {
      const { error } = await supabase
        .from("explicacoes_artigos_fila")
        .update({ status: "pendente" } as any)
        .eq("tabela_lei", selectedLei)
        .eq("status", "pausado");
      if (error) throw error;
      toast.success("Geração retomada!");
      refetch();
    } catch (e: any) {
      toast.error("Erro ao retomar: " + e.message);
    }
    setIsPausing(false);
  };

  const percentual = stats && stats.total > 0
    ? Math.round((stats.concluidos / stats.total) * 100)
    : 0;

  return (
    <div className="px-4 py-4 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Geração de Explicações</h1>
          <p className="text-sm text-muted-foreground">Explicação, exemplo e termos dos artigos</p>
        </div>
      </div>

      {/* Seletor de Lei */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Selecione a Lei</label>
        <Select value={selectedLei} onValueChange={setSelectedLei}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha uma lei..." />
          </SelectTrigger>
          <SelectContent>
            {leis.map(lei => (
              <SelectItem key={lei} value={lei}>{lei}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedLei && (
        <>
          {/* Botão Popular Fila */}
          <div className="mb-4">
            <Button
              onClick={handlePopularFila}
              disabled={isPopulating}
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isPopulating ? 'animate-spin' : ''}`} />
              {isPopulating ? 'Analisando artigos...' : 'Verificar e Popular Fila'}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats && stats.total > 0 ? (
            <>
              {/* Cards de resumo */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="bg-card border rounded-xl p-3 text-center">
                  <FileText className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-bold">{stats.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <p className="text-lg font-bold">{stats.pendentes}</p>
                  <p className="text-[10px] text-muted-foreground">Pendentes</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <CheckCircle className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-bold">{stats.concluidos}</p>
                  <p className="text-[10px] text-muted-foreground">Concluídos</p>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <AlertCircle className="w-4 h-4 mx-auto mb-1 text-red-500" />
                  <p className="text-lg font-bold">{stats.erros}</p>
                  <p className="text-[10px] text-muted-foreground">Erros</p>
                </div>
              </div>

              {/* Progresso */}
              <div className="bg-card border rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso</span>
                  <span className="text-sm font-bold">{percentual}%</span>
                </div>
                <Progress value={percentual} className="h-3" />
                {stats.gerando > 0 && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {stats.gerando} em processamento...
                  </p>
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                {!isRunning ? (
                  <Button
                    onClick={stats.pausados > 0 ? async () => { await handleRetomar(); handleIniciarGeracao(); } : handleIniciarGeracao}
                    disabled={stats.pendentes === 0 && stats.pausados === 0}
                    className="flex-1 gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {stats.pendentes === 0 && stats.pausados === 0 ? 'Todos concluídos!' : stats.pausados > 0 ? `Retomar (${stats.pausados + stats.pendentes} restantes)` : `Iniciar (${stats.pendentes} pendentes)`}
                  </Button>
                ) : (
                  <Button
                    onClick={async () => { stopProcessing(); await handlePausar(); }}
                    disabled={isPausing}
                    className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700"
                  >
                    <Pause className="w-4 h-4" />
                    {isPausing ? 'Pausando...' : 'Pausar'}
                  </Button>
                )}
              </div>

              {/* Log em tempo real */}
              <div className="mt-6 bg-card border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
                  <Terminal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Log em tempo real</span>
                  {logs.length > 0 && (
                    <button
                      onClick={() => setLogs([])}
                      className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <ScrollArea className="h-48">
                  <div className="p-2 font-mono text-[11px] space-y-0.5">
                    {logs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Aguardando atividade...
                      </p>
                    ) : (
                      logs.map(log => (
                        <div key={log.id} className={`px-2 py-0.5 rounded ${
                          log.type === 'success' ? 'text-green-400' :
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'warning' ? 'text-amber-400' :
                          'text-muted-foreground'
                        }`}>
                          <span className="opacity-50">
                            {log.timestamp.toLocaleTimeString('pt-BR')}
                          </span>
                          {' '}{log.message}
                        </div>
                      ))
                    )}
                    <div ref={logEndRef} />
                  </div>
                </ScrollArea>
              </div>
            </>
          ) : stats && stats.total === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Clique em "Verificar e Popular Fila" para analisar os artigos desta lei</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
