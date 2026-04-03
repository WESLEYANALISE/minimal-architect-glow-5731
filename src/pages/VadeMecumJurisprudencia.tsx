import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, Search, Filter, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { InformativoCard } from "@/components/jurisprudencia/InformativoCard";
import { InformativoDrawer } from "@/components/jurisprudencia/InformativoDrawer";

type Tribunal = 'STF' | 'STJ' | 'TODOS';

interface Informativo {
  id: number;
  tribunal: string;
  numero_edicao: number;
  data_publicacao: string | null;
  titulo_edicao: string | null;
  tipo: string | null;
  notas_count?: number;
}

interface Nota {
  id: number;
  informativo_id: number;
  orgao_julgador: string | null;
  ramo_direito: string | null;
  tema: string | null;
  destaque: string | null;
  inteiro_teor: string | null;
  processo: string | null;
  relator: string | null;
  data_julgamento: string | null;
  link_processo: string | null;
  link_audio: string | null;
  link_video: string | null;
  ordem: number | null;
}

const RAMOS_DIREITO = [
  'Todos', 'DIREITO PENAL', 'DIREITO CIVIL', 'DIREITO PROCESSUAL CIVIL',
  'DIREITO CONSTITUCIONAL', 'DIREITO ADMINISTRATIVO', 'DIREITO TRIBUTÁRIO',
  'DIREITO DO TRABALHO', 'DIREITO PROCESSUAL PENAL', 'DIREITO EMPRESARIAL',
  'DIREITO DO CONSUMIDOR', 'DIREITO AMBIENTAL', 'DIREITO PREVIDENCIÁRIO',
];

export default function VadeMecumJurisprudencia() {
  const navigate = useNavigate();
  const [tribunal, setTribunal] = useState<Tribunal>('TODOS');
  const [busca, setBusca] = useState('');
  const [ramoFiltro, setRamoFiltro] = useState('Todos');
  const [showFiltros, setShowFiltros] = useState(false);
  const [informativos, setInformativos] = useState<Informativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedInformativo, setSelectedInformativo] = useState<Informativo | null>(null);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const PAGE_SIZE = 20;

  const fetchInformativos = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      let query = supabase
        .from('informativos_jurisprudencia')
        .select('*')
        .order('numero_edicao', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (tribunal !== 'TODOS') {
        query = query.eq('tribunal', tribunal);
      }

      if (busca.trim()) {
        query = query.ilike('titulo_edicao', `%${busca.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (reset) {
        setInformativos(data || []);
      } else {
        setInformativos(prev => [...prev, ...(data || [])]);
      }
      setHasMore((data?.length || 0) === PAGE_SIZE);
    } catch (e) {
      console.error('Erro ao buscar informativos:', e);
    } finally {
      setLoading(false);
    }
  }, [tribunal, busca]);

  useEffect(() => {
    setPage(0);
    fetchInformativos(0, true);
  }, [tribunal, busca]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchInformativos(next);
  };

  const openInformativo = async (info: Informativo) => {
    setSelectedInformativo(info);
    setDrawerOpen(true);
    setLoadingNotas(true);
    try {
      let query = supabase
        .from('informativos_notas')
        .select('*')
        .eq('informativo_id', info.id)
        .order('ordem', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setNotas(data || []);
    } catch (e) {
      console.error('Erro ao buscar notas:', e);
    } finally {
      setLoadingNotas(false);
    }
  };

  const filteredNotas = useMemo(() => {
    if (ramoFiltro === 'Todos') return notas;
    return notas.filter(n => n.ramo_direito?.toUpperCase().includes(ramoFiltro.toUpperCase()));
  }, [notas, ramoFiltro]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-bold text-foreground">Jurisprudência</h1>
          </div>
        </div>

        {/* Toggle Tribunal */}
        <div className="flex gap-2 px-4 pb-3">
          {(['TODOS', 'STF', 'STJ'] as Tribunal[]).map((t) => (
            <button
              key={t}
              onClick={() => setTribunal(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tribunal === t
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-muted/50 text-muted-foreground border border-transparent'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 border border-border/30">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por tema, processo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button onClick={() => setShowFiltros(!showFiltros)}>
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Filtros por ramo */}
        {showFiltros && (
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {RAMOS_DIREITO.map((ramo) => (
              <button
                key={ramo}
                onClick={() => setRamoFiltro(ramo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  ramoFiltro === ramo
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted/30 text-muted-foreground border border-transparent'
                }`}
              >
                {ramo === 'Todos' ? '📋 Todos' : ramo.replace('DIREITO ', '')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Informativos */}
      <div className="px-4 py-4 space-y-3">
        {informativos.length === 0 && !loading && (
          <div className="text-center py-16">
            <Scale className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum informativo encontrado</p>
            <p className="text-muted-foreground/50 text-xs mt-1">Os informativos serão carregados em breve</p>
          </div>
        )}

        {informativos.map((info) => (
          <InformativoCard
            key={`${info.tribunal}-${info.numero_edicao}`}
            informativo={info}
            onClick={() => openInformativo(info)}
          />
        ))}

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && hasMore && informativos.length > 0 && (
          <Button
            variant="outline"
            onClick={loadMore}
            className="w-full rounded-xl"
          >
            Carregar mais
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Drawer de Leitura */}
      <InformativoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        informativo={selectedInformativo}
        notas={filteredNotas}
        loading={loadingNotas}
        ramoFiltro={ramoFiltro}
        onRamoChange={setRamoFiltro}
      />
    </div>
  );
}
