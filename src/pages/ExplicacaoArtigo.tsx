import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Sparkles, RefreshCw, Play, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ExplicacaoPlayer from "@/components/explicacao-artigo/ExplicacaoPlayer";

interface ArtigoCP {
  id: number;
  'Número do Artigo': string;
  Artigo: string;
}

export default function ExplicacaoArtigo() {
  const navigate = useNavigate();
  const [gerandoArtigo, setGerandoArtigo] = useState<string | null>(null);
  const [etapaAtual, setEtapaAtual] = useState('');
  const [busca, setBusca] = useState('');
  const [playerArtigo, setPlayerArtigo] = useState<string | null>(null);

  // Buscar todos os artigos do CP
  const { data: artigos, isLoading: loadingArtigos } = useQuery({
    queryKey: ['cp-artigos-lista'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('CP - Código Penal')
        .select('id, "Número do Artigo", Artigo, ordem_artigo')
        .not('"Número do Artigo"', 'is', null)
        .neq('"Número do Artigo"', '')
        .order('ordem_artigo', { ascending: true, nullsFirst: false });
      if (error) {
        console.error('Erro ao buscar artigos CP:', error);
        throw error;
      }
      return (data as ArtigoCP[]) || [];
    },
  });

  // Buscar explicações já geradas
  const { data: explicacoes, refetch } = useQuery({
    queryKey: ['explicacoes-artigos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('explicacoes_artigos_diarias')
        .select('*')
        .eq('codigo', 'cp');
      if (error) throw error;
      return data;
    },
  });

  // Auto-poll enquanto gerando
  useEffect(() => {
    if (!gerandoArtigo) return;
    const interval = setInterval(() => refetch(), 3000);
    return () => clearInterval(interval);
  }, [gerandoArtigo, refetch]);

  const getStatusArtigo = useCallback((numArtigo: string) => {
    const exp = explicacoes?.find(e => e.numero_artigo === numArtigo);
    if (!exp) return null;
    return exp;
  }, [explicacoes]);

  const invocarEtapa = async (numArtigo: string, etapa: string, extra: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('gerar-explicacao-artigo', {
      body: { numero_artigo: numArtigo, codigo: 'cp', etapa, ...extra },
    });
    if (error) throw new Error(error.message || 'Erro na etapa ' + etapa);
    return data;
  };

  const gerarArtigo = async (numArtigo: string) => {
    setGerandoArtigo(numArtigo);
    try {
      // Verificar se já existe registro parcial para continuar de onde parou
      const statusExistente = getStatusArtigo(numArtigo);
      const progresso = statusExistente?.progresso_geracao || 0;
      const jaTemTexto = progresso >= 30;
      const jaTemAudio = progresso >= 50;
      let totalSegs = (statusExistente?.segmentos as any[])?.length || 0;

      // Etapa 1: Texto (pular se já gerado)
      if (!jaTemTexto) {
        setEtapaAtual('Gerando texto...');
        const textoResult = await invocarEtapa(numArtigo, 'texto');
        toast.success(`Art. ${numArtigo}: Texto gerado!`);
        await refetch();
        totalSegs = textoResult?.total_segmentos || 6;
      } else {
        console.log(`Art. ${numArtigo}: Texto já existe, pulando...`);
      }

      // Etapa 2: TTS por segmento (pular se já gerado)
      if (!jaTemAudio) {
        // Recarregar para pegar segmentos atualizados
        await refetch();
        const registroAtual = getStatusArtigo(numArtigo);
        const segsParaTTS = (registroAtual?.segmentos as any[]) || [];
        const totalSegsTTS = segsParaTTS.length || totalSegs;
        
        for (let i = 0; i < totalSegsTTS; i++) {
          // Pular segmentos que já têm audio_url
          if (segsParaTTS[i]?.audio_url) {
            console.log(`Art. ${numArtigo}: Áudio seg ${i+1} já existe, pulando...`);
            continue;
          }
          setEtapaAtual(`Áudio ${i + 1}/${totalSegsTTS}...`);
          await invocarEtapa(numArtigo, 'tts', { segmento_index: i });
        }
        toast.success(`Art. ${numArtigo}: Áudio gerado!`);
        await refetch();
      } else {
        console.log(`Art. ${numArtigo}: Áudio já existe, pulando...`);
      }

      // Etapa 3: Imagens (verificar quais já foram geradas)
      if (!totalSegs) {
        // Recarregar para pegar total de segmentos
        await refetch();
        const recarregado = getStatusArtigo(numArtigo);
        totalSegs = (recarregado?.segmentos as any[])?.length || 6;
      }

      // Verificar quais segmentos já têm imagem
      const segmentosAtuais = (statusExistente?.segmentos as any[]) || [];
      const primeiroSemImagem = segmentosAtuais.findIndex((s: any) => !s.imagem_url);
      const inicioImagens = primeiroSemImagem >= 0 ? primeiroSemImagem : 0;

      for (let i = inicioImagens; i < totalSegs; i++) {
        setEtapaAtual(`Imagem ${i + 1}/${totalSegs}...`);
        await invocarEtapa(numArtigo, 'imagem', { segmento_index: i });
        await refetch();
      }

      toast.success(`Art. ${numArtigo} concluído! 🎉`);
    } catch (e: any) {
      console.error('Geração erro:', e);
      toast.error(`Erro Art. ${numArtigo}: ${e.message}. Clique em "Gerar" novamente para continuar.`);
    } finally {
      setGerandoArtigo(null);
      setEtapaAtual('');
      refetch();
    }
  };

  // Filtrar artigos pela busca
  const artigosFiltrados = artigos?.filter(a => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      a['Número do Artigo']?.toLowerCase().includes(termo) ||
      a.Artigo?.toLowerCase().includes(termo)
    );
  });

  // Player view
  const explicacaoPlayer = playerArtigo
    ? explicacoes?.find(e => e.numero_artigo === playerArtigo && e.status === 'concluido')
    : null;

  if (explicacaoPlayer && playerArtigo) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <button onClick={() => setPlayerArtigo(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Art. {playerArtigo}</h1>
              <p className="text-xs text-muted-foreground">{explicacaoPlayer.titulo}</p>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ExplicacaoPlayer
            segmentos={explicacaoPlayer.segmentos as any}
            audioUrl={explicacaoPlayer.audio_url}
            titulo={explicacaoPlayer.titulo}
            numeroArtigo={explicacaoPlayer.numero_artigo}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Explicação Artigo</h1>
            <p className="text-xs text-muted-foreground">Código Penal • {artigos?.length || 0} artigos</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artigo por número ou texto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 bg-muted/50 border-border/50"
          />
        </div>

        {/* Stats */}
        {explicacoes && (
          <div className="flex gap-3 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {explicacoes.filter(e => e.status === 'concluido').length} gerados
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 text-amber-500" />
              {explicacoes.filter(e => e.status === 'gerando').length} em progresso
            </div>
          </div>
        )}

        {/* Lista */}
        {loadingArtigos ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {artigosFiltrados?.map(artigo => {
              const numArt = artigo['Número do Artigo'];
              const status = getStatusArtigo(numArt);
              const isGerando = gerandoArtigo === numArt;
               const isConcluido = status?.status === 'concluido';
               const isErro = status?.status === 'erro';
               const isGerandoParado = status?.status === 'gerando' && gerandoArtigo !== numArt;
              const tituloResumido = artigo.Artigo?.split('\n')[0]?.substring(0, 60) || '';

              return (
                <div
                  key={artigo.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    isConcluido
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : isGerando
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-border/50 bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  {/* Número */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    isConcluido
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {numArt}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Art. {numArt}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {tituloResumido}
                    </p>
                    {isGerando && (
                      <p className="text-xs text-amber-500 mt-0.5">{etapaAtual}</p>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex-shrink-0">
                    {isConcluido ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPlayerArtigo(numArt)}
                        className="gap-1.5 text-emerald-400 hover:text-emerald-300"
                      >
                        <Play className="w-3.5 h-3.5" /> Ver
                      </Button>
                    ) : isGerando ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => gerarArtigo(numArt)}
                        disabled={!!gerandoArtigo}
                        className="gap-1.5"
                      >
                        {isErro || isGerandoParado ? (
                          <><RefreshCw className="w-3.5 h-3.5" /> Continuar</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" /> Gerar</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}