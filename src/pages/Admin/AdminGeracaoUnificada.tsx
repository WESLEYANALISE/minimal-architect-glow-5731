import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FilaItem {
  id: number;
  tipo: string;
  area: string;
  tema: string;
  subtema: string | null;
  status: string;
  erro: string | null;
  itens_gerados: number;
  created_at: string;
  updated_at: string;
}

interface TypeStats {
  pendente: number;
  gerando: number;
  concluido: number;
  erro: number;
  total: number;
}

const TIPOS = ['cornell', 'feynman', 'flashcards', 'lacunas', 'correspondencias', 'questoes', 'questoes_sim_nao'] as const;

const TIPO_LABELS: Record<string, { label: string; emoji: string; color: string; grupo: string }> = {
  cornell:          { label: 'Cornell',           emoji: '📝', color: 'text-blue-400 bg-blue-500/20',    grupo: 'Metodologias' },
  feynman:          { label: 'Feynman',           emoji: '🧠', color: 'text-purple-400 bg-purple-500/20', grupo: 'Metodologias' },
  flashcards:       { label: 'Conceitos',         emoji: '📇', color: 'text-amber-400 bg-amber-500/20',  grupo: 'Flashcards' },
  lacunas:          { label: 'Lacunas',           emoji: '🔲', color: 'text-pink-400 bg-pink-500/20',    grupo: 'Flashcards' },
  correspondencias: { label: 'Correspondências',  emoji: '🔗', color: 'text-cyan-400 bg-cyan-500/20',   grupo: 'Flashcards' },
  questoes:         { label: 'Alternativas',      emoji: '❓', color: 'text-emerald-400 bg-emerald-500/20', grupo: 'Questões' },
  questoes_sim_nao: { label: 'Sim/Não',           emoji: '✅', color: 'text-orange-400 bg-orange-500/20', grupo: 'Questões' },
};

const GRUPOS = [
  { nome: 'Metodologias', tipos: ['cornell', 'feynman'] },
  { nome: 'Flashcards', tipos: ['flashcards', 'lacunas', 'correspondencias'] },
  { nome: 'Questões', tipos: ['questoes', 'questoes_sim_nao'] },
];

const AdminGeracaoUnificada = () => {
  const navigate = useNavigate();
  const [pausado, setPausado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(false);
  const [processandoLoop, setProcessandoLoop] = useState(false);
  const [stats, setStats] = useState<Record<string, TypeStats>>({});
  const [ultimosErros, setUltimosErros] = useState<FilaItem[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [rodadaAtual, setRodadaAtual] = useState(0);
  const [processadosRodada, setProcessadosRodada] = useState(0);
  const [errosRodada, setErrosRodada] = useState(0);
  const [tempoInicio, setTempoInicio] = useState<number | null>(null);
  const [totalProcessadosSessao, setTotalProcessadosSessao] = useState(0);
  const [, setTick] = useState(0);

  const fetchData = useCallback(async () => {
    const statsMap: Record<string, TypeStats> = {};

    const queries = TIPOS.flatMap(tipo =>
      ['pendente', 'gerando', 'concluido', 'erro'].map(status => 
        supabase.from('geracao_unificada_fila' as any)
          .select('*', { count: 'exact', head: true })
          .eq('tipo', tipo)
          .eq('status', status)
      )
    );

    const results = await Promise.all(queries);
    
    let idx = 0;
    for (const tipo of TIPOS) {
      const s: TypeStats = { pendente: 0, gerando: 0, concluido: 0, erro: 0, total: 0 };
      for (const status of ['pendente', 'gerando', 'concluido', 'erro'] as const) {
        const count = results[idx]?.count || 0;
        s[status] = count;
        s.total += count;
        idx++;
      }
      statsMap[tipo] = s;
    }
    setStats(statsMap);

    const { data: config } = await supabase
      .from('geracao_unificada_config' as any)
      .select('pausado')
      .eq('id', 'main')
      .single();
    if (config) setPausado((config as any).pausado);

    const { data: erros } = await supabase
      .from('geracao_unificada_fila' as any)
      .select('*')
      .eq('status', 'erro')
      .order('updated_at', { ascending: false })
      .limit(20);
    setUltimosErros((erros || []) as unknown as FilaItem[]);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!processandoLoop) return;
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [processandoLoop]);

  const togglePausa = async () => {
    const novo = !pausado;
    await supabase.from('geracao_unificada_config' as any).update({ pausado: novo }).eq('id', 'main');
    setPausado(novo);
    toast(novo ? "⏸️ Pipeline pausado" : "▶️ Pipeline retomado");
  };

  const popularFila = async () => {
    setPopularLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('popular-fila-unificada');
      if (error) throw error;
      toast.success(`Fila populada: ${data.total} itens`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPopularLoading(false);
    }
  };

  const iniciarProcessamento = async () => {
    if (processandoLoop) return;
    
    const { count: pendentesAntes } = await supabase
      .from('geracao_unificada_fila' as any)
      .select('*', { count: 'exact', head: true })
      .in('status', ['pendente', 'gerando']);
    
    if (!pendentesAntes || pendentesAntes === 0) {
      toast.warning("⚠️ Fila vazia! Clique em 'Popular Fila' primeiro.");
      return;
    }

    setProcessandoLoop(true);
    setRodadaAtual(0);
    setTotalProcessadosSessao(0);
    setTempoInicio(Date.now());

    await supabase.from('geracao_unificada_config' as any).update({ pausado: false }).eq('id', 'main');
    setPausado(false);

    toast(`🚀 Processamento iniciado! ${pendentesAntes} itens na fila.`);

    let rodada = 0;
    let sessaoProcessados = 0;
    let errosConsecutivos = 0;

    while (true) {
      rodada++;
      setRodadaAtual(rodada);

      const { data: config } = await supabase
        .from('geracao_unificada_config' as any)
        .select('pausado')
        .eq('id', 'main')
        .single();

      if ((config as any)?.pausado) {
        toast("⏸️ Processamento pausado pelo admin");
        break;
      }

      try {
        const { data, error } = await supabase.functions.invoke('cron-geracao-unificada');
        if (error) throw error;

        errosConsecutivos = 0;
        const processadosNaRodada = data?.totalProcessados || 0;
        const errosNaRodada = data?.totalErros || 0;
        sessaoProcessados += processadosNaRodada;
        
        setProcessadosRodada(processadosNaRodada);
        setErrosRodada(errosNaRodada);
        setTotalProcessadosSessao(sessaoProcessados);

        if (data?.pendentesRestantes === 0 && processadosNaRodada === 0) {
          await fetchData();
          toast.success(`✅ Todos processados! (${sessaoProcessados} total)`);
          break;
        }

        await fetchData();
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err: any) {
        errosConsecutivos++;
        console.error('Erro no loop:', err);
        toast.error(`Erro na rodada ${rodada}: ${err.message}`);
        
        if (errosConsecutivos >= 5) {
          toast.error("❌ Muitos erros consecutivos. Parado.");
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    setProcessandoLoop(false);
    setTempoInicio(null);
  };

  const pararProcessamento = async () => {
    await supabase.from('geracao_unificada_config' as any).update({ pausado: true }).eq('id', 'main');
    setPausado(true);
    setProcessandoLoop(false);
    toast("⏹️ Processamento parado");
  };

  const retentarErros = async () => {
    await supabase.from('geracao_unificada_fila' as any)
      .update({ status: 'pendente', erro: null })
      .eq('status', 'erro');
    toast.success("🔄 Erros resetados para pendente");
    fetchData();
  };

  const totalGeral = Object.values(stats).reduce((s, t) => s + t.total, 0);
  const concluidoGeral = Object.values(stats).reduce((s, t) => s + t.concluido, 0);
  const pendenteGeral = Object.values(stats).reduce((s, t) => s + t.pendente, 0);
  const gerandoGeral = Object.values(stats).reduce((s, t) => s + t.gerando, 0);
  const erroGeral = Object.values(stats).reduce((s, t) => s + t.erro, 0);
  const progressPercent = totalGeral > 0 ? Math.round((concluidoGeral / totalGeral) * 100) : 0;

  const errosFiltrados = filtroTipo === 'todos'
    ? ultimosErros
    : ultimosErros.filter(e => e.tipo === filtroTipo);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const subtitleParts = GRUPOS.map(g => g.nome).join(' • ');

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Geração Unificada</h1>
          <p className="text-xs text-muted-foreground">{subtitleParts}</p>
        </div>
      </div>

      {/* Main actions */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {!processandoLoop ? (
          <Button onClick={iniciarProcessamento} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Play className="h-4 w-4 mr-1" /> Iniciar
          </Button>
        ) : (
          <Button onClick={pararProcessamento} size="sm" variant="destructive">
            <Pause className="h-4 w-4 mr-1" /> Parar
          </Button>
        )}
        <Button onClick={popularFila} disabled={popularLoading} variant="outline" size="sm">
          {popularLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
          Popular Fila
        </Button>
        {erroGeral > 0 && (
          <Button onClick={retentarErros} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-1" /> Retentar ({erroGeral})
          </Button>
        )}
      </div>

      {/* Overall progress */}
      {(() => {
        const tempoDecorrido = tempoInicio ? Math.floor((Date.now() - tempoInicio) / 1000) : 0;
        const tempoDecorridoStr = tempoDecorrido > 60 
          ? `${Math.floor(tempoDecorrido / 60)}min ${tempoDecorrido % 60}s`
          : `${tempoDecorrido}s`;
        const tempoEstimadoMin = Math.ceil((pendenteGeral + gerandoGeral) * 3 / 60);

        return totalGeral > 0 ? (
          <Card className="mb-4">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{progressPercent}%</span>
                  {processandoLoop && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <Loader2 className="h-3 w-3 animate-spin" /> Rodada {rodadaAtual}
                    </span>
                  )}
                  {pausado && !processandoLoop && (
                    <span className="text-xs text-amber-400">⏸️ Pausado</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {concluidoGeral}/{totalGeral} • ~{tempoEstimadoMin}min
                </span>
              </div>
              <Progress value={progressPercent} className="h-2.5" />
              
              {processandoLoop && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Tempo: {tempoDecorridoStr}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>{totalProcessadosSessao} processados</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    <span>{pendenteGeral + gerandoGeral} pendentes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Última: {processadosRodada}✓ {errosRodada}✗</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Stats per group */}
      {GRUPOS.map(grupo => {
        const grupoStats = grupo.tipos.map(t => stats[t]).filter(Boolean);
        const grupoTotal = grupoStats.reduce((s, t) => s + t.total, 0);
        if (grupoTotal === 0 && totalGeral === 0) return null;

        return (
          <div key={grupo.nome} className="mb-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{grupo.nome}</h2>
            <div className="grid grid-cols-2 gap-2">
              {grupo.tipos.map(tipo => {
                const s = stats[tipo];
                if (!s) return null;
                const info = TIPO_LABELS[tipo];
                const pct = s.total > 0 ? Math.round((s.concluido / s.total) * 100) : 0;
                return (
                  <Card key={tipo} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>
                          {info.emoji} {info.label}
                        </span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xl font-bold text-foreground">{s.concluido}<span className="text-xs text-muted-foreground">/{s.total}</span></p>
                          {s.gerando > 0 && <p className="text-xs text-blue-400">{s.gerando} gerando</p>}
                          {s.erro > 0 && <p className="text-xs text-destructive">{s.erro} erros</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5 mt-2" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Errors section */}
      {ultimosErros.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-destructive" /> Últimos Erros
              </CardTitle>
              <select
                className="text-xs bg-muted rounded px-2 py-1 border border-border"
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos</option>
                {TIPOS.map(t => (
                  <option key={t} value={t}>{TIPO_LABELS[t].label}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="max-h-[30vh] overflow-auto space-y-1.5">
              {errosFiltrados.map(item => (
                <div key={item.id} className="flex items-start gap-2 p-2 rounded bg-destructive/5 border border-destructive/10">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${TIPO_LABELS[item.tipo]?.color || ''}`}>
                    {TIPO_LABELS[item.tipo]?.emoji} {TIPO_LABELS[item.tipo]?.label || item.tipo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground truncate">{item.area} &gt; {item.tema}{item.subtema ? ` > ${item.subtema}` : ''}</p>
                    <p className="text-[10px] text-destructive truncate">{item.erro}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {totalGeral === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Fila vazia. Clique em <strong>"Popular Fila"</strong> para escanear conteúdo pendente.</p>
        </div>
      )}
    </div>
  );
};

export default AdminGeracaoUnificada;
