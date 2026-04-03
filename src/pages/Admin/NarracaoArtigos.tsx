import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Mic, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Trash2, 
  Play, 
  Pause,
  AlertTriangle,
  Loader2,
  ChevronUp,
  Sparkles,
  ArrowUpDown,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { narracaoApi, EstatisticasGerais, ArtigoNarracao, Anomalia } from "@/lib/api/narracaoApi";
import { supabase } from "@/integrations/supabase/client";

// Interface para artigo com prioridade
interface ArtigoComPrioridade extends ArtigoNarracao {
  prioridade?: 'alta' | 'media' | 'baixa';
}

const NarracaoArtigos = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Estados principais
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [loading, setLoading] = useState(true);
  const [leiSelecionada, setLeiSelecionada] = useState<string | null>(null);
  const [artigos, setArtigos] = useState<ArtigoComPrioridade[]>([]);
  const [artigosOrdenados, setArtigosOrdenados] = useState<ArtigoComPrioridade[]>([]);
  const [loadingArtigos, setLoadingArtigos] = useState(false);
  const [modoOrdenacao, setModoOrdenacao] = useState<'numerica' | 'prioridade'>('numerica');
  
  // Estados de ação
  const [artigoExpandido, setArtigoExpandido] = useState<number | null>(null);
  const [audioTocando, setAudioTocando] = useState<number | null>(null);
  const [processando, setProcessando] = useState<number | null>(null);
  const [progressoNarracao, setProgressoNarracao] = useState<number>(0);
  
  // Fila de narração
  const [filaNarracao, setFilaNarracao] = useState<Array<{ artigo: ArtigoComPrioridade; tipo: 'narrar' | 'regenerar' }>>([]);
  const processandoFilaRef = useRef(false);
  
  
  
  // Estado para sugestão IA
  const [loadingSugestao, setLoadingSugestao] = useState(false);
  
  // Estados para seleção em lote (usado internamente ao clicar "Narrar em lote")
  const [artigosSelecionados, setArtigosSelecionados] = useState<Set<number>>(new Set());
  
  // Estados para job em lote
  const [jobAtivo, setJobAtivo] = useState<{
    id: string;
    status: string;
    artigos_total: number;
    artigos_processados: number;
    artigo_atual: number | null;
  } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Diálogo de confirmação (apenas apagar)
  const [dialogoConfirmacao, setDialogoConfirmacao] = useState<{
    tipo: 'apagar';
    artigo: ArtigoNarracao;
  } | null>(null);

  // Carregar estatísticas ao montar
  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    setLoading(true);
    try {
      const [stats, anomaliasData] = await Promise.all([
        narracaoApi.buscarEstatisticasGerais(),
        narracaoApi.detectarAnomalias(),
      ]);
      setEstatisticas(stats);
      setAnomalias(anomaliasData);
    } catch (e) {
      console.error('Erro ao carregar estatísticas:', e);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const carregarArtigosDaLei = async (tableName: string) => {
    setLoadingArtigos(true);
    setLeiSelecionada(tableName);
    setArtigosSelecionados(new Set());
    try {
      const data = await narracaoApi.buscarArtigosDaLei(tableName);
      
      // Carregar prioridades salvas do banco
      const artigosComPrioridades = await carregarPrioridadesSalvas(tableName, data);
      setArtigos(artigosComPrioridades);
      
      // Se há prioridades salvas, ativar modo de ordenação por prioridade
      const temPrioridades = artigosComPrioridades.some(a => a.prioridade);
      if (temPrioridades) {
        setModoOrdenacao('prioridade');
      }
      
      // Verificar se há job ativo para esta lei
      await verificarJobAtivo(tableName);
    } catch (e) {
      console.error('Erro ao carregar artigos:', e);
      toast.error('Erro ao carregar artigos');
    } finally {
      setLoadingArtigos(false);
    }
  };
  
  // Verificar job ativo
  const verificarJobAtivo = async (tableName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('narrar-lote', {
        body: { action: 'buscar-ativo', tabelaLei: tableName },
      });
      
      if (data?.job) {
        setJobAtivo(data.job);
        iniciarPolling(data.job.id);
      } else {
        setJobAtivo(null);
        pararPolling();
      }
    } catch (e) {
      console.error('Erro ao verificar job:', e);
    }
  };
  
  // Polling para atualizar status do job
  const iniciarPolling = (jobId: string) => {
    pararPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke('narrar-lote', {
          body: { action: 'status', jobId },
        });
        
        if (data?.job) {
          setJobAtivo(data.job);
          
          // Se job terminou, recarregar artigos
          if (['concluido', 'cancelado', 'erro'].includes(data.job.status)) {
            pararPolling();
            if (leiSelecionada) {
              const artigosAtualizados = await narracaoApi.buscarArtigosDaLei(leiSelecionada);
              setArtigos(artigosAtualizados);
            }
            if (data.job.status === 'concluido') {
              toast.success('Narração em lote concluída!');
            }
          }
        }
      } catch (e) {
        console.error('Erro no polling:', e);
      }
    }, 2000);
  };
  
  const pararPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };
  
  // Limpar polling ao desmontar
  useEffect(() => {
    return () => pararPolling();
  }, []);

  const voltarParaLista = () => {
    setLeiSelecionada(null);
    setArtigos([]);
    setArtigoExpandido(null);
    setArtigosSelecionados(new Set());
    pararAudio();
  };

  // Controle de áudio
  const tocarAudio = (artigo: ArtigoNarracao) => {
    if (audioTocando === artigo.id) {
      pararAudio();
      return;
    }

    if (artigo.urlNarracao) {
      pararAudio();
      audioRef.current = new Audio(artigo.urlNarracao);
      audioRef.current.play();
      audioRef.current.onended = () => setAudioTocando(null);
      setAudioTocando(artigo.id);
    }
  };

  const pararAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioTocando(null);
  };
  const atualizarArtigoLocalmente = (artigoId: number, updates: Partial<ArtigoComPrioridade>) => {
    setArtigos((prev) => prev.map((item) => (item.id === artigoId ? { ...item, ...updates } : item)));
  };

  const atualizarEstatisticasLocais = (tableName: string, narradosDelta: number) => {
    if (!narradosDelta) return;

    setEstatisticas((prev) => {
      if (!prev) return prev;

      const totalNarrados = Math.max(0, prev.totalNarrados + narradosDelta);

      return {
        ...prev,
        totalNarrados,
        percentualGeral: prev.totalArtigos > 0 ? Math.round((totalNarrados / prev.totalArtigos) * 100) : 0,
        porLei: prev.porLei.map((lei) => {
          if (lei.nome !== tableName) return lei;

          const narrados = Math.max(0, lei.narrados + narradosDelta);
          return {
            ...lei,
            narrados,
            percentual: lei.total > 0 ? Math.round((narrados / lei.total) * 100) : 0,
          };
        }),
      };
    });
  };

  // Adicionar à fila de narração (ou processar direto se fila vazia)
  const narrarDireto = async (artigo: ArtigoNarracao, tipo: 'narrar' | 'regenerar') => {
    if (!leiSelecionada) return;
    
    // Se já está na fila ou processando, ignorar
    if (processando === artigo.id || filaNarracao.some(f => f.artigo.id === artigo.id)) {
      return;
    }
    
    // Se nada está processando, processar direto
    if (processando === null && !processandoFilaRef.current) {
      processarNarracao(artigo as ArtigoComPrioridade, tipo);
    } else {
      // Adicionar à fila
      setFilaNarracao(prev => [...prev, { artigo: artigo as ArtigoComPrioridade, tipo }]);
      toast.info(`Art. ${artigo.numeroArtigo} adicionado à fila (posição ${filaNarracao.length + 1})`);
    }
  };

  // Processar próximo item da fila quando o atual terminar
  useEffect(() => {
    if (processando === null && filaNarracao.length > 0 && !processandoFilaRef.current) {
      const [proximo, ...resto] = filaNarracao;
      setFilaNarracao(resto);
      processarNarracao(proximo.artigo, proximo.tipo);
    }
  }, [processando, filaNarracao]);

  // Função interna que faz a narração real
  const processarNarracao = async (artigo: ArtigoComPrioridade, tipo: 'narrar' | 'regenerar') => {
    if (!leiSelecionada) return;
    processandoFilaRef.current = true;

    setProcessando(artigo.id);
    setProgressoNarracao(0);

    const nomeAmigavel = estatisticas?.porLei.find((l) => l.nome === leiSelecionada)?.nomeAmigavel || leiSelecionada;
    const previsao = await narracaoApi.obterPrevisaoNarracao(leiSelecionada, artigo.id, artigo.artigo);
    const totalSegments = previsao.success ? Math.max(1, previsao.totalSegments) : 1;
    const baselineUrl = artigo.urlNarracao;
    const inicioNarracao = Date.now();
    const percentualInicial = totalSegments === 1
      ? 8
      : Math.min(12, Math.max(3, Math.round(100 / (totalSegments * 2))));
    const tetoAquecimento = totalSegments === 1
      ? 88
      : Math.max(percentualInicial, Math.min(35, Math.round(100 / totalSegments) - 1));

    let narracaoConcluida = false;
    let pollingAtivo = true;

    setProgressoNarracao(percentualInicial);

    const atualizarProgressoReal = async () => {
      if (!pollingAtivo) return;

      const status = await narracaoApi.buscarStatusNarracaoArtigo(leiSelecionada, artigo.id);
      if (!status.success) return;

      const urlsConcluidas = tipo === 'regenerar' && status.urlNarracao === baselineUrl ? 0 : status.urlsCount;
      const percentualReal = Math.round((Math.min(urlsConcluidas, totalSegments) / totalSegments) * 100);

      if (percentualReal > 0) {
        setProgressoNarracao((atual) => Math.max(atual, percentualReal));
        return;
      }

      const segundosDecorridos = (Date.now() - inicioNarracao) / 1000;
      const incrementoPorSegundo = totalSegments === 1 ? 6 : Math.max(1.5, 8 / totalSegments);
      const percentualAquecimento = Math.min(
        tetoAquecimento,
        Math.round(percentualInicial + segundosDecorridos * incrementoPorSegundo)
      );

      setProgressoNarracao((atual) => Math.max(atual, percentualAquecimento));
    };

    await atualizarProgressoReal();

    const pollingId = setInterval(() => {
      void atualizarProgressoReal();
    }, 800);

    try {
      const result = await narracaoApi.gerarNarracao(leiSelecionada, artigo.id, artigo.artigo, nomeAmigavel, 1.0);

      if (result.success) {
        const statusFinal = await narracaoApi.buscarStatusNarracaoArtigo(leiSelecionada, artigo.id);

        atualizarArtigoLocalmente(artigo.id, {
          temNarracao: true,
          urlNarracao: statusFinal.urlNarracao || result.urlAudio || null,
        });

        if (!artigo.temNarracao) {
          atualizarEstatisticasLocais(leiSelecionada, 1);
        }

        narracaoConcluida = true;
        setProgressoNarracao(100);
        
        // Formatar duração se disponível
        if (result.duration) {
          const min = Math.floor(result.duration / 60);
          const sec = result.duration % 60;
          const duracaoStr = min > 0 ? `${min}min ${sec}s` : `${sec}s`;
          toast.success(`Narração completa • Duração: ${duracaoStr}`);
        } else {
          toast.success('Narração completa');
        }

        setTimeout(() => {
          setProcessando(null);
          setProgressoNarracao(0);
        }, 450);
        return;
      }

      toast.error(result.error || 'Erro ao narrar');
    } catch (e) {
      toast.error('Erro ao narrar');
    } finally {
      pollingAtivo = false;
      clearInterval(pollingId);
      processandoFilaRef.current = false;

      if (!narracaoConcluida) {
        setProcessando(null);
        setProgressoNarracao(0);
      }
    }
  };

  // Ações com confirmação (apenas para apagar)
  const executarAcao = async () => {
    if (!dialogoConfirmacao || !leiSelecionada) return;

    const { artigo } = dialogoConfirmacao;
    setDialogoConfirmacao(null);
    setProcessando(artigo.id);

    try {
      const result = await narracaoApi.apagarNarracao(leiSelecionada, artigo.id);

      if (result.success) {
        if (audioTocando === artigo.id) {
          pararAudio();
        }

        atualizarArtigoLocalmente(artigo.id, {
          temNarracao: false,
          urlNarracao: null,
        });

        if (artigo.temNarracao) {
          atualizarEstatisticasLocais(leiSelecionada, -1);
        }

        toast.success('Narração apagada');
      } else {
        toast.error(result.error || 'Erro ao apagar');
      }
    } catch (e) {
      toast.error('Erro ao apagar');
    } finally {
      setProcessando(null);
    }
  };

  // Carregar prioridades salvas do banco
  const carregarPrioridadesSalvas = async (tableName: string, artigosData: ArtigoComPrioridade[]) => {
    try {
      const { data: prioridades, error } = await supabase
        .from('narracao_prioridades')
        .select('numero_artigo, prioridade')
        .eq('tabela_lei', tableName);
      
      if (error) {
        console.error('Erro ao carregar prioridades:', error);
        return artigosData;
      }
      
      if (prioridades && prioridades.length > 0) {
        const prioridadesMap = new Map<string, 'alta' | 'media' | 'baixa'>();
        prioridades.forEach((p) => {
          prioridadesMap.set(p.numero_artigo, p.prioridade as 'alta' | 'media' | 'baixa');
        });
        
        return artigosData.map(a => ({
          ...a,
          prioridade: prioridadesMap.get(a.numeroArtigo),
        }));
      }
      
      return artigosData;
    } catch (e) {
      console.error('Erro ao carregar prioridades:', e);
      return artigosData;
    }
  };

  // Salvar prioridades no banco
  const salvarPrioridades = async (tableName: string, sugestoes: { numero: string; prioridade: 'alta' | 'media' | 'baixa'; motivo?: string }[]) => {
    try {
      // Deletar prioridades existentes desta lei
      await supabase
        .from('narracao_prioridades')
        .delete()
        .eq('tabela_lei', tableName);
      
      // Inserir novas prioridades
      const registros = sugestoes.map(s => ({
        tabela_lei: tableName,
        numero_artigo: s.numero,
        prioridade: s.prioridade,
        motivo: s.motivo || null,
      }));
      
      const { error } = await supabase
        .from('narracao_prioridades')
        .insert(registros);
      
      if (error) {
        console.error('Erro ao salvar prioridades:', error);
        toast.error('Erro ao salvar prioridades');
        return false;
      }
      
      return true;
    } catch (e) {
      console.error('Erro ao salvar prioridades:', e);
      return false;
    }
  };

  // Sugestão de artigos por IA
  const buscarSugestaoIA = async () => {
    if (!leiSelecionada) return;
    
    setLoadingSugestao(true);
    try {
      const leiInfo = estatisticas?.porLei.find(l => l.nome === leiSelecionada);
      const artigosNaoNarrados = artigos.filter(a => !a.temNarracao);
      
      if (artigosNaoNarrados.length === 0) {
        toast.info('Todos os artigos já foram narrados!');
        return;
      }
      
      // Preparar lista de artigos para a IA analisar
      const listaArtigos = artigosNaoNarrados.slice(0, 50).map(a => ({
        numero: a.numeroArtigo,
        resumo: a.artigo.substring(0, 200),
      }));
      
      const { data, error } = await supabase.functions.invoke('sugerir-artigos-narracao', {
        body: {
          nomeLei: leiInfo?.nomeAmigavel || leiSelecionada,
          artigos: listaArtigos,
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.sugestoes) {
        // Salvar prioridades no banco
        const salvo = await salvarPrioridades(leiSelecionada, data.sugestoes);
        
        if (salvo) {
          // Atualizar artigos com prioridades
          const prioridadesMap = new Map<string, 'alta' | 'media' | 'baixa'>();
          data.sugestoes.forEach((s: { numero: string; prioridade: 'alta' | 'media' | 'baixa' }) => {
            prioridadesMap.set(s.numero, s.prioridade);
          });
          
          const artigosComPrioridade = artigos.map(a => ({
            ...a,
            prioridade: prioridadesMap.get(a.numeroArtigo),
          }));
          
          setArtigos(artigosComPrioridade);
          setModoOrdenacao('prioridade');
          toast.success('Artigos priorizados e salvos com sucesso!');
        }
      }
    } catch (e) {
      console.error('Erro ao buscar sugestão:', e);
      toast.error('Erro ao buscar sugestão da IA');
    } finally {
      setLoadingSugestao(false);
    }
  };

  // Funções de seleção em lote
  const selecionarTodosNaoNarrados = () => {
    const idsNaoNarrados = artigos.filter(a => !a.temNarracao).map(a => a.id);
    setArtigosSelecionados(new Set(idsNaoNarrados));
  };
  
  const limparSelecao = () => {
    setArtigosSelecionados(new Set());
  };
  
  // Iniciar narração em lote
  const iniciarNarracaoLote = async () => {
    if (!leiSelecionada || artigosSelecionados.size === 0) return;
    
    const idsArray = Array.from(artigosSelecionados);
    
    try {
      const { data, error } = await supabase.functions.invoke('narrar-lote', {
        body: {
          action: 'iniciar',
          tabelaLei: leiSelecionada,
          artigosIds: idsArray,
          velocidade: 1.0,
        },
      });
      
      if (error) throw new Error(error.message);
      
      if (data?.jobId) {
        toast.success(`Iniciando narração de ${idsArray.length} artigos...`);
        setJobAtivo({
          id: data.jobId,
          status: 'processando',
          artigos_total: idsArray.length,
          artigos_processados: 0,
          artigo_atual: null,
        });
        iniciarPolling(data.jobId);
        limparSelecao();
      }
    } catch (e) {
      console.error('Erro ao iniciar lote:', e);
      toast.error('Erro ao iniciar narração em lote');
    }
  };
  
  // Pausar job
  const pausarJob = async () => {
    if (!jobAtivo) return;
    
    try {
      await supabase.functions.invoke('narrar-lote', {
        body: { action: 'pausar', jobId: jobAtivo.id },
      });
      toast.info('Narração pausada');
    } catch (e) {
      toast.error('Erro ao pausar');
    }
  };
  
  // Retomar job
  const retomarJob = async () => {
    if (!jobAtivo) return;
    
    try {
      await supabase.functions.invoke('narrar-lote', {
        body: { action: 'retomar', jobId: jobAtivo.id },
      });
      toast.success('Narração retomada');
    } catch (e) {
      toast.error('Erro ao retomar');
    }
  };
  
  // Cancelar job
  const cancelarJob = async () => {
    if (!jobAtivo) return;
    
    try {
      await supabase.functions.invoke('narrar-lote', {
        body: { action: 'cancelar', jobId: jobAtivo.id },
      });
      toast.info('Narração cancelada');
      pararPolling();
      setJobAtivo(null);
    } catch (e) {
      toast.error('Erro ao cancelar');
    }
  };

  // Cor baseada no percentual
  const getCorPercentual = (percentual: number) => {
    if (percentual >= 80) return 'hsl(var(--chart-2))';
    if (percentual >= 50) return 'hsl(var(--chart-4))';
    return 'hsl(var(--chart-1))';
  };

  // Badge de prioridade com novas cores
  const renderBadgePrioridade = (prioridade?: 'alta' | 'media' | 'baixa') => {
    if (!prioridade) return null;
    
    const cores = {
      alta: 'bg-green-500/20 text-green-500 border-green-500/50',
      media: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
      baixa: 'bg-white/20 text-muted-foreground border-border',
    };
    
    const labels = {
      alta: 'Alta',
      media: 'Média',
      baixa: 'Baixa',
    };
    
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cores[prioridade]}`}>
        {labels[prioridade]}
      </span>
    );
  };

  // Ordenar artigos baseado no modo
  const getArtigosOrdenados = () => {
    if (modoOrdenacao === 'prioridade') {
      const temPrioridade = artigos.some(a => a.prioridade);
      if (temPrioridade) {
        return [...artigos].sort((a, b) => {
          const ordemPrioridade = { alta: 0, media: 1, baixa: 2, undefined: 3 };
          const pA = ordemPrioridade[a.prioridade as keyof typeof ordemPrioridade] ?? 3;
          const pB = ordemPrioridade[b.prioridade as keyof typeof ordemPrioridade] ?? 3;
          return pA - pB;
        });
      }
    }
    return artigos;
  };

  // Renderizar estatísticas gerais
  const renderEstatisticasGerais = () => {
    if (!estatisticas) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Artigos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalArtigos.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Artigos Narrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{estatisticas.totalNarrados.toLocaleString()}</div>
            <Progress value={estatisticas.percentualGeral} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faltam Narrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {(estatisticas.totalArtigos - estatisticas.totalNarrados).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.percentualGeral}% concluído
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar anomalias
  const renderAnomalias = () => {
    if (anomalias.length === 0) return null;

    return (
      <Card className="mb-6 border-orange-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-500">
            <AlertTriangle className="h-4 w-4" />
            Anomalias Detectadas ({anomalias.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {anomalias.map((anomalia, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <VolumeX className="h-3 w-3 text-orange-500" />
                <span><strong>{anomalia.lei}:</strong> {anomalia.descricao}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar lista de leis
  const renderListaLeis = () => {
    if (!estatisticas) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {estatisticas.porLei.map((lei) => (
          <button
            key={lei.nome}
            onClick={() => carregarArtigosDaLei(lei.nome)}
            className="bg-card border border-border rounded-xl p-4 text-left transition-all hover:bg-muted/50 hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{lei.nomeAmigavel}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                lei.percentual >= 80 ? 'bg-green-500/20 text-green-500' :
                lei.percentual >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
                'bg-red-500/20 text-red-500'
              }`}>
                {lei.percentual}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              {lei.narrados > 0 ? (
                <Volume2 className="h-3 w-3 text-green-500" />
              ) : (
                <VolumeX className="h-3 w-3 text-muted-foreground" />
              )}
              <span>{lei.narrados}/{lei.total} artigos narrados</span>
            </div>
            <Progress value={lei.percentual} className="h-1.5" />
          </button>
        ))}
      </div>
    );
  };

  // Renderizar lista de artigos
  const renderListaArtigos = () => {
    if (!leiSelecionada) return null;

    const leiInfo = estatisticas?.porLei.find(l => l.nome === leiSelecionada);
    const percentualLei = leiInfo?.percentual || 0;
    const percentualLote = jobAtivo
      ? Math.round((jobAtivo.artigos_processados / Math.max(1, jobAtivo.artigos_total)) * 100)
      : 0;
    const progressoPrincipal = processando !== null
      ? Math.round(progressoNarracao)
      : jobAtivo
        ? percentualLote
        : percentualLei;
    const resumoProgresso = processando !== null
      ? `Narração atual em andamento (${Math.round(progressoNarracao)}%)`
      : jobAtivo
        ? `Lote em andamento: ${percentualLote}% (${jobAtivo.artigos_processados}/${jobAtivo.artigos_total})`
        : `${leiInfo?.narrados || 0}/${leiInfo?.total || 0} narrados (${percentualLei}%)`;

    return (
      <div className="space-y-4">
        {/* Header da lei */}
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold truncate">{leiInfo?.nomeAmigavel || leiSelecionada}</h2>
              <p className="text-xs text-muted-foreground">
                {resumoProgresso}
              </p>
              {(processando !== null || jobAtivo) && (
                <p className="text-[11px] text-muted-foreground/80">
                  Progresso geral da lei: {leiInfo?.narrados || 0}/{leiInfo?.total || 0} narrados ({percentualLei}%)
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" className="shrink-0 ml-2" onClick={voltarParaLista}>
              <ArrowLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Botão direto de narrar em lote — narra todos os não-narrados */}
            {!jobAtivo && artigos.some(a => !a.temNarracao) && (
              <Button 
                variant="default"
                size="sm" 
                className="h-7 text-xs"
                onClick={() => {
                  selecionarTodosNaoNarrados();
                  setTimeout(() => iniciarNarracaoLote(), 100);
                }}
              >
                <Mic className="h-3 w-3 mr-1" />
                Narrar em lote ({artigos.filter(a => !a.temNarracao).length})
              </Button>
            )}
            {artigos.some(a => a.prioridade) && (
              <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                <Button 
                  variant={modoOrdenacao === 'numerica' ? 'default' : 'ghost'}
                  size="sm" 
                  className="h-6 px-2 text-[10px]"
                  onClick={() => setModoOrdenacao('numerica')}
                >
                  Numérica
                </Button>
                <Button 
                  variant={modoOrdenacao === 'prioridade' ? 'default' : 'ghost'}
                  size="sm" 
                  className="h-6 px-2 text-[10px]"
                  onClick={() => setModoOrdenacao('prioridade')}
                >
                  <ArrowUpDown className="h-3 w-3 mr-0.5" />
                  Prior.
                </Button>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={buscarSugestaoIA}
              disabled={loadingSugestao}
            >
              {loadingSugestao ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 sm:mr-1" />}
              <span className="hidden sm:inline">Sugestão</span>
            </Button>
          </div>
        </div>

        <Progress value={progressoPrincipal} className="h-2" />
        
        {/* Barra de job ativo com controles */}
        {jobAtivo && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-3 px-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {jobAtivo.status === 'processando' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  )}
                  {jobAtivo.status === 'pausado' && (
                    <Pause className="h-4 w-4 text-yellow-500 shrink-0" />
                  )}
                  <span className="font-medium text-sm">
                    {jobAtivo.status === 'processando' ? 'Narrando em lote...' : 
                     jobAtivo.status === 'pausado' ? 'Pausado' : 
                     jobAtivo.status === 'concluido' ? 'Concluído!' : 'Processando...'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {jobAtivo.artigos_processados}/{jobAtivo.artigos_total}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {jobAtivo.status === 'processando' && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={pausarJob}>
                      <Pause className="h-3 w-3 mr-1" />
                      Pausar
                    </Button>
                  )}
                  {jobAtivo.status === 'pausado' && (
                    <Button variant="default" size="sm" className="h-7 text-xs" onClick={retomarJob}>
                      <Play className="h-3 w-3 mr-1" />
                      Retomar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={cancelarJob}>
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
              <Progress 
                value={(jobAtivo.artigos_processados / jobAtivo.artigos_total) * 100} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {Math.round((jobAtivo.artigos_processados / jobAtivo.artigos_total) * 100)}% concluído
              </p>
            </CardContent>
          </Card>
        )}

        {/* Lista de artigos */}
        {loadingArtigos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div>
            <div className="space-y-1.5 pr-2">
              {getArtigosOrdenados().map((artigo) => {
                const isProcessingBatch = jobAtivo?.artigo_atual === artigo.id;
                const isProcessingSingle = processando === artigo.id;
                const isPlaying = audioTocando === artigo.id;
                const posicaoFila = filaNarracao.findIndex(f => f.artigo.id === artigo.id);
                const naFila = posicaoFila >= 0;
                
                return (
                  <Collapsible
                    key={artigo.id}
                    open={artigoExpandido === artigo.id}
                    onOpenChange={(open) => setArtigoExpandido(open ? artigo.id : null)}
                  >
                    <div className={`bg-card border rounded-lg px-3 py-2.5 transition-all duration-300 ${
                      isProcessingBatch ? 'ring-2 ring-primary bg-primary/5 border-primary/30' : 
                      isPlaying ? 'ring-2 ring-green-500/50 bg-green-500/5 border-green-500/30' :
                      isProcessingSingle ? 'ring-1 ring-amber-500/50 bg-amber-500/5' :
                      naFila ? 'ring-1 ring-blue-500/40 bg-blue-500/5 border-blue-500/30' :
                      'border-border hover:bg-muted/30'
                    }`}>
                      {/* Row principal */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isProcessingBatch ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                          ) : isPlaying ? (
                            <Volume2 className="h-4 w-4 text-green-500 shrink-0 animate-pulse" />
                          ) : artigo.temNarracao ? (
                            <Volume2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <VolumeX className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-sm truncate">{artigo.numeroArtigo}</span>
                          {renderBadgePrioridade(artigo.prioridade)}
                          
                          {!artigo.temNarracao && !isProcessingBatch && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                              artigo.artigo.length > 1750 
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' 
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            }`}>
                              {artigo.artigo.length > 1750 ? 'Pro' : 'Flash'}
                            </span>
                          )}
                          
                          {isProcessingBatch && (
                            <span className="text-xs text-primary font-medium shrink-0">Narrando...</span>
                          )}
                          
                          {isProcessingSingle && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                              <span className="text-xs text-amber-500 font-medium">
                                {Math.round(progressoNarracao)}%
                              </span>
                            </div>
                          )}
                          
                          {naFila && !isProcessingSingle && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs text-blue-400 font-medium">Fila #{posicaoFila + 1}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5" 
                                onClick={(e) => { e.stopPropagation(); setFilaNarracao(prev => prev.filter(f => f.artigo.id !== artigo.id)); }}>
                                <X className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Ações compactas */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                              {artigoExpandido === artigo.id ? <ChevronUp className="h-3 w-3 mr-0.5" /> : null}
                              Ver
                            </Button>
                          </CollapsibleTrigger>

                          {artigo.temNarracao && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => tocarAudio(artigo)}>
                              {isPlaying ? <Pause className="h-3 w-3 text-green-500" /> : <Play className="h-3 w-3" />}
                            </Button>
                          )}

                          {artigo.temNarracao ? (
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isProcessingSingle || naFila}
                              onClick={() => narrarDireto(artigo, 'regenerar')}>
                              <RefreshCw className="h-3 w-3 text-blue-500" />
                            </Button>
                          ) : (
                            <Button variant="default" size="sm" className="h-7 px-2.5 text-xs" disabled={isProcessingSingle || naFila}
                              onClick={() => narrarDireto(artigo, 'narrar')}>
                              <Mic className="h-3 w-3 mr-0.5" />
                              {naFila ? `Fila` : 'Narrar'}
                            </Button>
                          )}

                          {artigo.temNarracao && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isProcessingSingle || naFila}
                              onClick={() => setDialogoConfirmacao({ tipo: 'apagar', artigo })}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="mt-2.5 pt-2.5 border-t border-border">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {artigo.artigo || 'Texto não disponível'}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="container mx-auto px-3 py-4 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Narração de Artigos</h1>
            <p className="text-xs text-muted-foreground">
              Gerenciar áudios de narração do Vade Mecum
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={carregarEstatisticas} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : leiSelecionada ? (
          renderListaArtigos()
        ) : (
          <>
            {renderEstatisticasGerais()}
            {renderAnomalias()}
            <h2 className="text-base font-semibold mb-3">Leis Disponíveis</h2>
            {renderListaLeis()}
          </>
        )}
      </div>

      {/* Diálogo de confirmação apenas para apagar */}
      <Dialog open={!!dialogoConfirmacao} onOpenChange={() => setDialogoConfirmacao(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Apagar Narração
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja apagar a narração do <strong>{dialogoConfirmacao?.artigo?.numeroArtigo}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogoConfirmacao(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={executarAcao}>Sim, Apagar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NarracaoArtigos;
