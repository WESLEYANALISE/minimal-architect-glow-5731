import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Loader2, CheckCircle2, AlertCircle, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { useFlashcardsPendentes, type AreaPendente } from '@/hooks/useFlashcardsPendentes';
import { flashcardGenManager } from '@/lib/flashcardGenerationManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type TemaStatus = 'pending' | 'running' | 'done' | 'error';

const AdminFlashcardsPendentesTab = () => {
  const { data: pendentes, isLoading, refetch } = useFlashcardsPendentes();
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [temaStatuses, setTemaStatuses] = useState<Map<string, TemaStatus>>(new Map());
  const [areaRunning, setAreaRunning] = useState<Set<string>>(new Set());

  const totalPendentes = pendentes?.reduce((acc, a) => acc + a.temas.length, 0) || 0;

  const toggleArea = (area: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const getTemaKey = (area: string, tema: string) => `${area}|||${tema}`;

  const gerarTemaIndividual = async (area: string, tema: string) => {
    const key = getTemaKey(area, tema);
    setTemaStatuses(prev => new Map(prev).set(key, 'running'));

    try {
      let hasMore = true;
      let totalGerados = 0;

      while (hasMore) {
        const { data: resumos, error: resumosError } = await supabase
          .from('RESUMO')
          .select('id, tema, subtema, conteudo')
          .ilike('area', area)
          .eq('tema', tema);

        if (resumosError || !resumos?.length) {
          throw new Error('Sem resumos encontrados');
        }

        const { data, error } = await supabase.functions.invoke('gerar-flashcards-tema', {
          body: { area, tema, resumos }
        });

        if (error) throw error;

        totalGerados += data?.flashcards_gerados || 0;
        hasMore = !data?.geracao_completa;

        if (hasMore) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      setTemaStatuses(prev => new Map(prev).set(key, 'done'));
      toast({ title: `✅ ${tema}`, description: `${totalGerados} flashcards gerados` });
    } catch (err) {
      console.error('Erro gerando flashcards:', err);
      setTemaStatuses(prev => new Map(prev).set(key, 'error'));
      toast({ title: `❌ Erro em ${tema}`, description: String(err), variant: 'destructive' });
    }
  };

  const gerarTodosArea = async (areaPendente: AreaPendente) => {
    const { area, temas } = areaPendente;
    setAreaRunning(prev => new Set(prev).add(area));

    for (const tema of temas) {
      const key = getTemaKey(area, tema);
      const status = temaStatuses.get(key);
      if (status === 'done' || status === 'running') continue;
      await gerarTemaIndividual(area, tema);
    }

    setAreaRunning(prev => {
      const next = new Set(prev);
      next.delete(area);
      return next;
    });

    toast({ title: `🎉 ${area}`, description: 'Geração completa!' });
  };

  const getStatusIcon = (status: TemaStatus | undefined) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'done': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Flashcards Pendentes</h2>
          <Badge variant="outline" className="text-xs">
            {totalPendentes} temas
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Atualizar
        </Button>
      </div>

      {totalPendentes === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
            <p className="font-medium">Todos os flashcards foram gerados!</p>
          </CardContent>
        </Card>
      ) : (
        pendentes?.map(areaPendente => {
          const isExpanded = expandedAreas.has(areaPendente.area);
          const isRunning = areaRunning.has(areaPendente.area);
          const doneCount = areaPendente.temas.filter(t => 
            temaStatuses.get(getTemaKey(areaPendente.area, t)) === 'done'
          ).length;

          return (
            <Card key={areaPendente.area}>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleArea(areaPendente.area)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{areaPendente.area}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {areaPendente.temas.length - doneCount} pendentes
                    </Badge>
                    {doneCount > 0 && (
                      <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                        {doneCount} concluídos
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={isRunning}
                      onClick={(e) => {
                        e.stopPropagation();
                        gerarTodosArea(areaPendente);
                      }}
                      className="text-xs h-7"
                    >
                      {isRunning ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5 mr-1" />
                      )}
                      Gerar Todos
                    </Button>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0 space-y-1.5">
                  {areaPendente.temas.map(tema => {
                    const key = getTemaKey(areaPendente.area, tema);
                    const status = temaStatuses.get(key);
                    const isDisabled = status === 'running' || status === 'done';

                    return (
                      <div
                        key={tema}
                        className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getStatusIcon(status)}
                          <span className={`text-sm truncate ${status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                            {tema}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDisabled}
                          onClick={() => gerarTemaIndividual(areaPendente.area, tema)}
                          className="text-xs h-7 shrink-0"
                        >
                          {status === 'running' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : status === 'done' ? (
                            'Feito'
                          ) : status === 'error' ? (
                            'Retry'
                          ) : (
                            'Gerar'
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
};

export default AdminFlashcardsPendentesTab;
