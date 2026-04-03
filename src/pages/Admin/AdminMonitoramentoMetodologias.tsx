import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, Trash2, CheckCircle, Clock, AlertCircle, Loader2, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FilaItem {
  id: number;
  area: string;
  tema: string;
  subtema: string;
  metodo: string;
  status: string;
  erro: string | null;
  created_at: string;
  updated_at: string;
}

const METODOS = ['cornell', 'feynman'] as const;

const AdminMonitoramentoMetodologias = () => {
  const navigate = useNavigate();
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, concluidos: 0, pendentes: 0, gerando: 0, erros: 0 });
  const [countsPorMetodo, setCountsPorMetodo] = useState<Record<string, { total: number; concluidos: number; pendentes: number; gerando: number; erros: number }>>({});
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [populandoTudo, setPopulandoTudo] = useState(false);
  const [disparando, setDisparando] = useState(false);
  const [filtroMetodo, setFiltroMetodo] = useState<string>("todos");

  const fetchCounts = useCallback(async () => {
    // Fetch real counts from DB
    const statuses = ['pendente', 'concluido', 'gerando', 'erro'] as const;
    const metodos = ['cornell', 'feynman', 'mapamental'] as const;

    const [totalRes, concluidosRes, pendentesRes, gerandoRes, errosRes] = await Promise.all([
      supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }),
      supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }).eq('status', 'concluido'),
      supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
      supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }).eq('status', 'gerando'),
      supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }).eq('status', 'erro'),
    ]);

    setCounts({
      total: totalRes.count || 0,
      concluidos: concluidosRes.count || 0,
      pendentes: pendentesRes.count || 0,
      gerando: gerandoRes.count || 0,
      erros: errosRes.count || 0,
    });

    // Counts per method
    const perMetodo: Record<string, any> = {};
    for (const m of metodos) {
      const [t, c, p, g, e] = await Promise.all([
        supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }).eq('metodo', m),
        supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }).eq('metodo', m).eq('status', 'concluido'),
        supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }).eq('metodo', m).eq('status', 'pendente'),
        supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }).eq('metodo', m).eq('status', 'gerando'),
        supabase.from('metodologias_fila').select('*', { count: 'exact', head: true }).eq('metodo', m).eq('status', 'erro'),
      ]);
      perMetodo[m] = {
        total: t.count || 0,
        concluidos: c.count || 0,
        pendentes: p.count || 0,
        gerando: g.count || 0,
        erros: e.count || 0,
      };
    }
    setCountsPorMetodo(perMetodo);
  }, []);

  const fetchFila = useCallback(async () => {
    // Fetch visible items for list (latest 200)
    const query = filtroMetodo === 'todos'
      ? supabase.from('metodologias_fila').select('*').order('id', { ascending: false }).limit(200)
      : supabase.from('metodologias_fila').select('*').eq('metodo', filtroMetodo).order('id', { ascending: false }).limit(200);

    const { data, error } = await query;
    if (!error && data) {
      setFila(data as FilaItem[]);
    }
    setLoading(false);
  }, [filtroMetodo]);

  // Polling
  useEffect(() => {
    fetchFila();
    fetchCounts();
    if (!polling) return;
    const interval = setInterval(() => { fetchFila(); fetchCounts(); }, 4000);
    return () => clearInterval(interval);
  }, [fetchFila, fetchCounts, polling]);

  // Re-fetch list when filter changes
  useEffect(() => { fetchFila(); }, [filtroMetodo]);

  const { total, concluidos, pendentes, gerando, erros } = counts;
  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  // Stats per method from real counts
  const statsPorMetodo = METODOS.map(m => ({
    metodo: m,
    ...(countsPorMetodo[m] || { total: 0, concluidos: 0, pendentes: 0, gerando: 0, erros: 0 }),
  }));

  // Popular TODAS as áreas e métodos pendentes
  const popularTudo = async () => {
    setPopulandoTudo(true);
    try {
      // Buscar todos os subtemas do RESUMO
      const { data: subtemas, error } = await supabase
        .from('RESUMO')
        .select('area, tema, subtema')
        .not('area', 'is', null)
        .not('tema', 'is', null)
        .not('subtema', 'is', null);

      if (error) throw error;
      if (!subtemas || subtemas.length === 0) {
        toast.error("Nenhum subtema encontrado");
        setPopulandoTudo(false);
        return;
      }

      // Buscar o que já existe na fila
      const { data: filaExistente } = await supabase
        .from('metodologias_fila')
        .select('area, tema, subtema, metodo');

      const existenteSet = new Set(
        (filaExistente || []).map(f => `${f.area}||${f.tema}||${f.subtema}||${f.metodo}`)
      );

      // Buscar o que já foi gerado em METODOLOGIAS_GERADAS
      const { data: metGerados } = await supabase
        .from('METODOLOGIAS_GERADAS')
        .select('area, tema, subtema, metodo');

      const geradosSet = new Set(
        (metGerados || []).map(g => `${g.area}||${g.tema}||${g.subtema}||${g.metodo}`)
      );

      // (mapas mentais removidos do pipeline)

      let itemsToInsert: any[] = [];

      for (const s of subtemas) {
        if (!s.area || !s.tema || !s.subtema) continue;

        for (const metodo of METODOS) {
          const filaKey = `${s.area}||${s.tema}||${s.subtema}||${metodo}`;
          
          // Skip if already in queue
          if (existenteSet.has(filaKey)) continue;

          if (geradosSet.has(filaKey)) continue;

          itemsToInsert.push({
            area: s.area,
            tema: s.tema,
            subtema: s.subtema,
            metodo,
            status: 'pendente',
          });
        }
      }

      if (itemsToInsert.length === 0) {
        toast.success("Tudo já está na fila ou gerado! 🎉");
        setPopulandoTudo(false);
        return;
      }

      // Insert in batches of 200
      let inseridos = 0;
      for (let i = 0; i < itemsToInsert.length; i += 200) {
        const batch = itemsToInsert.slice(i, i + 200);
        const { error: insertError } = await supabase
          .from('metodologias_fila')
          .upsert(batch, { onConflict: 'area,tema,subtema,metodo', ignoreDuplicates: true });
        
        if (!insertError) {
          inseridos += batch.length;
        }
      }

      toast.success(`${inseridos} itens adicionados à fila (2 métodos)`);
      fetchFila(); fetchCounts();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
    setPopulandoTudo(false);
  };

  // Disparar processamento contínuo
  const dispararCron = async () => {
    setDisparando(true);
    try {
      const { error } = await supabase.functions.invoke('cron-gerar-metodologias', { body: {} });
      if (error) throw error;
      toast.success("🚀 Processamento contínuo iniciado! Vai gerar até esvaziar a fila.");
      setTimeout(() => { fetchFila(); fetchCounts(); }, 3000);
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
    setDisparando(false);
  };

  const limparConcluidos = async () => {
    if (!confirm("Limpar todos os itens concluídos da fila?")) return;
    await supabase.from('metodologias_fila').delete().eq('status', 'concluido');
    toast.success("Concluídos removidos");
    fetchFila(); fetchCounts();
  };

  const retentarErros = async () => {
    await supabase.from('metodologias_fila').update({ status: 'pendente', erro: null }).eq('status', 'erro');
    toast.success("Itens com erro marcados para reprocessar");
    fetchFila(); fetchCounts();
  };

  const limparTudo = async () => {
    if (!confirm("Limpar TODA a fila?")) return;
    await supabase.from('metodologias_fila').delete().gte('id', 0);
    toast.success("Fila limpa");
    fetchFila(); fetchCounts();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'concluido': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'gerando': return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'erro': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'gerando': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'erro': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const metodoLabel = (m: string) => {
    switch (m) {
      case 'cornell': return '📝 Cornell';
      case 'feynman': return '💡 Feynman';
      case 'mapamental': return '🧠 Mapa Mental';
      default: return m;
    }
  };

  // fila already filtered by query

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-4 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Monitoramento de Metodologias</h1>
            <p className="text-xs text-muted-foreground">Cornell e Feynman • 10 de cada (20/execução)</p>
          </div>
          <Button
            variant={polling ? "secondary" : "outline"}
            size="sm"
            onClick={() => setPolling(!polling)}
          >
            {polling ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {polling ? "Pausar" : "Polling"}
          </Button>
        </div>

        {/* Contadores gerais */}
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-foreground">{total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-500">{concluidos}</p>
            <p className="text-[10px] text-muted-foreground">Concluídos</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-muted-foreground">{pendentes}</p>
            <p className="text-[10px] text-muted-foreground">Pendentes</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-yellow-500">{gerando}</p>
            <p className="text-[10px] text-muted-foreground">Gerando</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-red-500">{erros}</p>
            <p className="text-[10px] text-muted-foreground">Erros</p>
          </div>
        </div>

        {/* Barra de progresso */}
        {total > 0 && (
          <div className="bg-card border border-border rounded-xl p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso Geral</span>
              <span className="font-bold text-foreground">{progresso}% ({concluidos}/{total})</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500 rounded-full"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats por método */}
        <div className="grid grid-cols-3 gap-2">
          {statsPorMetodo.map(s => (
            <div key={s.metodo} className="bg-card border border-border rounded-xl p-3 space-y-1">
              <p className="text-xs font-semibold">{metodoLabel(s.metodo)}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-green-500">{s.concluidos}</span>
                <span className="text-[10px] text-muted-foreground">/ {s.total}</span>
              </div>
              {s.pendentes > 0 && (
                <p className="text-[10px] text-muted-foreground">{s.pendentes} pendentes</p>
              )}
              {s.gerando > 0 && (
                <p className="text-[10px] text-yellow-500">{s.gerando} gerando...</p>
              )}
              {s.erros > 0 && (
                <p className="text-[10px] text-red-500">{s.erros} erros</p>
              )}
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Ações</h3>
          <div className="flex flex-wrap gap-2">
            <Button onClick={popularTudo} disabled={populandoTudo} className="flex-1">
              {populandoTudo ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Zap className="w-4 h-4 mr-1" />}
              Popular Tudo (2 métodos)
            </Button>
            <Button onClick={dispararCron} disabled={disparando} variant="secondary" className="flex-1">
              {disparando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
              Disparar Contínuo
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={retentarErros} disabled={erros === 0}>
              <RotateCcw className="w-3 h-3 mr-1" /> Retentar Erros ({erros})
            </Button>
            <Button variant="outline" size="sm" onClick={limparConcluidos} disabled={concluidos === 0}>
              <RefreshCw className="w-3 h-3 mr-1" /> Limpar Concluídos
            </Button>
            <Button variant="destructive" size="sm" onClick={limparTudo}>
              <Trash2 className="w-3 h-3 mr-1" /> Limpar Tudo
            </Button>
          </div>
        </div>

        {/* Filtro e lista */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">Fila ({fila.length})</h3>
            <select
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
              value={filtroMetodo}
              onChange={e => setFiltroMetodo(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="cornell">Cornell</option>
              <option value="feynman">Feynman</option>
              
            </select>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {fila.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">Nenhum item na fila</p>
            ) : (
              <div className="divide-y divide-border">
                {fila.map(item => (
                  <div key={item.id} className="px-3 py-2 flex items-center gap-2 text-xs">
                    {statusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {item.subtema}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.area} › {item.tema} • {metodoLabel(item.metodo)}
                      </p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                    {item.erro && (
                      <span className="text-[10px] text-red-400 max-w-[120px] truncate" title={item.erro}>
                        {item.erro}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMonitoramentoMetodologias;
