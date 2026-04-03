import { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Play, Loader2, Eye, Sparkles, NotebookPen, Lightbulb, Brain, FileText, ChevronRight, Check, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getAreaHex } from '@/lib/flashcardsAreaColors';
import { MapaMentalSkeleton } from '@/components/skeletons/MapaMentalSkeleton';
import MetodologiaCornellView from '@/components/metodologias/MetodologiaCornellView';
import MetodologiaFeynmanView from '@/components/metodologias/MetodologiaFeynmanView';
import MapaMentalCanvas from '@/components/mapas-mentais/MapaMentalCanvas';

const ADMIN_EMAIL = 'wn7corporation@gmail.com';

const metodoInfo: Record<string, { titulo: string; icon: any }> = {
  cornell: { titulo: 'Método Cornell', icon: NotebookPen },
  feynman: { titulo: 'Método Feynman', icon: Lightbulb },
  mapamental: { titulo: 'Mapa Mental', icon: Brain },
};

const AdminMetodologiasSubtopicos = () => {
  const navigate = useNavigate();
  const { metodo, area, tema } = useParams<{ metodo: string; area: string; tema: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const decodedArea = decodeURIComponent(area || '');
  const decodedTema = decodeURIComponent(tema || '');
  const hex = getAreaHex(decodedArea);
  const info = metodoInfo[metodo || ''] || metodoInfo.cornell;
  const isMapaMental = metodo === 'mapamental';
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [gerando, setGerando] = useState<string | null>(null);
  const [gerandoTodos, setGerandoTodos] = useState(false);
  const [viewContent, setViewContent] = useState<any>(null);
  const [viewSubtema, setViewSubtema] = useState<string | null>(null);
  
  // Local set to track generated subtemas (survives query invalidation)
  const [geradosLocais, setGeradosLocais] = useState<Set<string>>(new Set());
  const [conteudosLocais, setConteudosLocais] = useState<Map<string, any>>(new Map());

  // Fetch subtemas from RESUMO
  const { data: subtemas, isLoading: loadingSubtemas } = useQuery({
    queryKey: ['metodologia-subtemas', decodedArea, decodedTema],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('RESUMO')
        .select('subtema')
        .eq('area', decodedArea)
        .eq('tema', decodedTema)
        .not('subtema', 'is', null);
      if (error) throw error;
      const unique = [...new Set((data || []).map((r: any) => r.subtema).filter(Boolean))];
      return unique.sort();
    },
  });

  // Fetch generated content
  const { data: gerados, isLoading: loadingGerados } = useQuery({
    queryKey: ['metodologia-gerados', metodo, decodedArea, decodedTema],
    queryFn: async () => {
      if (isMapaMental) {
        const { data } = await supabase
          .from('MAPAS_MENTAIS_GERADOS')
          .select('subtema, dados_json')
          .eq('area', decodedArea)
          .eq('tema', decodedTema);
        const map = new Map<string, any>();
        (data || []).forEach((g: any) => {
          if (g.subtema) map.set(g.subtema, g.dados_json);
        });
        return { bySubtema: true, map };
      } else {
        const { data } = await supabase
          .from('METODOLOGIAS_GERADAS')
          .select('subtema, conteudo')
          .eq('area', decodedArea)
          .eq('tema', decodedTema)
          .eq('metodo', metodo!);
        const map = new Map<string, any>();
        (data || []).forEach((g: any) => {
          map.set(g.subtema || '', g.conteudo);
        });
        return { bySubtema: true, map };
      }
    },
  });

  const gerarSubtema = useCallback(async (subtema: string) => {
    setGerando(subtema);
    try {
      if (isMapaMental) {
        const { data, error } = await supabase.functions.invoke('gerar-mapa-mental', {
          body: { area: decodedArea, tema: decodedTema, subtema },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setGeradosLocais(prev => new Set(prev).add(subtema));
        if (data?.dados_json) {
          setConteudosLocais(prev => new Map(prev).set(subtema, data.dados_json));
        }
        toast.success(`Mapa Mental gerado para "${subtema}"!`);
      } else {
        const { data, error } = await supabase.functions.invoke('gerar-metodologia', {
          body: { area: decodedArea, tema: decodedTema, subtema, metodo },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        // Store locally so it persists through query invalidation
        setGeradosLocais(prev => new Set(prev).add(subtema));
        if (data?.conteudo) {
          setConteudosLocais(prev => new Map(prev).set(subtema, data.conteudo));
        }
        toast.success(`${info.titulo} gerado para "${subtema}"!`);
      }
      queryClient.invalidateQueries({ queryKey: ['metodologia-gerados', metodo, decodedArea, decodedTema] });
      queryClient.invalidateQueries({ queryKey: ['metodologias-temas-trilha', metodo, decodedArea] });
      queryClient.invalidateQueries({ queryKey: ['metodologias-areas', metodo] });
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    } finally {
      setGerando(null);
    }
  }, [decodedArea, decodedTema, metodo, isMapaMental, queryClient, info.titulo]);

  const gerarTodos = useCallback(async () => {
    if (!subtemas || subtemas.length === 0) return;
    setGerandoTodos(true);
    let sucesso = 0;
    let erros = 0;

    if (isMapaMental) {
      for (const sub of subtemas) {
        const alreadyDone = (gerados?.bySubtema && gerados.map.has(sub)) || geradosLocais.has(sub);
        if (alreadyDone) { sucesso++; continue; }
        try {
          setGerando(sub);
          const { data, error } = await supabase.functions.invoke('gerar-mapa-mental', {
            body: { area: decodedArea, tema: decodedTema, subtema: sub },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          sucesso++;
          setGeradosLocais(prev => new Set(prev).add(sub));
          if (data?.dados_json) {
            setConteudosLocais(prev => new Map(prev).set(sub, data.dados_json));
          }
          await queryClient.invalidateQueries({ queryKey: ['metodologia-gerados', metodo, decodedArea, decodedTema] });
        } catch {
          erros++;
        }
      }
    } else {
      for (const sub of subtemas) {
        const alreadyDone = (gerados?.bySubtema && gerados.map.has(sub)) || geradosLocais.has(sub);
        if (alreadyDone) { sucesso++; continue; }
        
        try {
          setGerando(sub);
          const { data, error } = await supabase.functions.invoke('gerar-metodologia', {
            body: { area: decodedArea, tema: decodedTema, subtema: sub, metodo },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          sucesso++;
          setGeradosLocais(prev => new Set(prev).add(sub));
          if (data?.conteudo) {
            setConteudosLocais(prev => new Map(prev).set(sub, data.conteudo));
          }
          await queryClient.invalidateQueries({ queryKey: ['metodologia-gerados', metodo, decodedArea, decodedTema] });
        } catch {
          erros++;
        }
      }
    }

    setGerando(null);
    setGerandoTodos(false);
    queryClient.invalidateQueries({ queryKey: ['metodologias-temas-trilha', metodo, decodedArea] });
    queryClient.invalidateQueries({ queryKey: ['metodologias-areas', metodo] });
    toast.success(`Concluído: ${sucesso} gerados, ${erros} erros`);
  }, [subtemas, gerados, geradosLocais, decodedArea, decodedTema, metodo, isMapaMental, queryClient]);

  if (loadingSubtemas || loadingGerados) return <MapaMentalSkeleton />;

  const isSubtemaGerado = (sub: string) => {
    return (gerados?.bySubtema && gerados.map.has(sub)) || geradosLocais.has(sub);
  };

  const getSubtemaContent = (sub: string) => {
    if (gerados?.bySubtema && gerados.map.has(sub)) return gerados.map.get(sub);
    return conteudosLocais.get(sub) || null;
  };

  const totalGerados = subtemas?.filter(s => isSubtemaGerado(s)).length || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Viewer fullscreen overlay */}
      {viewContent && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
         <div className="px-3 pt-3 pb-6">
            {metodo === 'cornell' && (
              <MetodologiaCornellView
                conteudo={viewContent}
                tema={decodedTema}
                area={decodedArea}
                subtema={viewSubtema || ''}
                onClose={() => { setViewContent(null); setViewSubtema(null); }}
              />
            )}
            {metodo === 'feynman' && (
              <MetodologiaFeynmanView
                conteudo={viewContent}
                tema={decodedTema}
                area={decodedArea}
                subtema={viewSubtema || ''}
                onClose={() => { setViewContent(null); setViewSubtema(null); }}
              />
            )}
            {isMapaMental && (
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Mapa Mental - {decodedTema}</h2>
                   <Button variant="ghost" size="icon" onClick={() => { setViewContent(null); setViewSubtema(null); }} className="bg-black/80 hover:bg-black border border-white/20 rounded-full">
                     <X className="w-5 h-5 text-white" />
                   </Button>
                </div>
                <MapaMentalCanvas dados={viewContent} areaColor={hex} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/metodologias/${metodo}/area/${encodeURIComponent(decodedArea)}`)}
              className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg text-foreground">{decodedTema}</h1>
              <p className="text-xs text-muted-foreground">{decodedArea} · {info.titulo} · {totalGerados}/{subtemas?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 space-y-3">
        {/* Generate All button - admin only */}
        {isAdmin && subtemas && subtemas.length > 0 && (
          <Button
            onClick={gerarTodos}
            disabled={gerandoTodos || !!gerando}
            className="w-full"
            variant="default"
          >
            {gerandoTodos ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            {gerandoTodos ? `Gerando... (${gerando || ''})` : `Gerar Todos (${subtemas.length})`}
          </Button>
        )}

        {/* Subtemas list */}
        {subtemas && subtemas.length > 0 ? (
          subtemas.map((sub, i) => {
            const done = isSubtemaGerado(sub);
            const content = getSubtemaContent(sub);
            const isGenerating = gerando === sub;

            return (
              <div
                key={sub}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 transition-all duration-200 animate-fade-in min-h-[64px]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Number badge */}
                <div
                  className="relative w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ backgroundColor: `${hex}15`, color: hex }}
                >
                  {i + 1}
                  {done && (
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: hex }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Title - no truncation, no bold, normal case */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-foreground">
                    {sub.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                  </h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {done && content && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => { setViewContent(content); setViewSubtema(sub); }}
                    >
                      <FileText className="w-3 h-3 mr-1" style={{ color: hex }} />
                      Ver
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      variant={done ? 'outline' : 'default'}
                      size="sm"
                      className="h-8 px-3 text-xs"
                      disabled={isGenerating || (gerandoTodos && !isGenerating)}
                      onClick={() => gerarSubtema(sub)}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span className="ml-1">{done ? 'Regerar' : 'Gerar'}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum subtema encontrado para este tema.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMetodologiasSubtopicos;
