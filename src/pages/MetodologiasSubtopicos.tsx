import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, NotebookPen, Lightbulb, Brain, Eye, Loader2 } from 'lucide-react';
import { getAreaHex } from '@/lib/flashcardsAreaColors';
import { MapaMentalSkeleton } from '@/components/skeletons/MapaMentalSkeleton';
import MetodologiaCornellView from '@/components/metodologias/MetodologiaCornellView';
import MetodologiaFeynmanView from '@/components/metodologias/MetodologiaFeynmanView';
import MapaMentalCanvas from '@/components/mapas-mentais/MapaMentalCanvas';
import { Button } from '@/components/ui/button';

const metodoInfo: Record<string, { titulo: string; icon: any }> = {
  cornell: { titulo: 'Método Cornell', icon: NotebookPen },
  feynman: { titulo: 'Método Feynman', icon: Lightbulb },
  mapamental: { titulo: 'Mapa Mental', icon: Brain },
};

const MetodologiasSubtopicos = () => {
  const navigate = useNavigate();
  const { metodo, area, tema } = useParams<{ metodo: string; area: string; tema: string }>();
  const decodedArea = decodeURIComponent(area || '');
  const decodedTema = decodeURIComponent(tema || '');
  const hexColor = getAreaHex(decodedArea);
  const info = metodoInfo[metodo || ''] || metodoInfo.cornell;
  const isMapaMental = metodo === 'mapamental';

  const [viewContent, setViewContent] = useState<any>(null);
  const [viewSubtema, setViewSubtema] = useState('');

  // Fetch subtemas
  const { data: subtemas, isLoading: loadingSubtemas } = useQuery({
    queryKey: ['metodologia-subtemas-public', decodedArea, decodedTema],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('RESUMO')
        .select('subtema, "ordem subtema"')
        .eq('area', decodedArea)
        .eq('tema', decodedTema)
        .not('subtema', 'is', null)
        .order('ordem subtema', { ascending: true });
      if (error) throw error;
      return (data || []).reduce((acc: { subtema: string; ordem: string }[], r: any) => {
        if (!acc.find(a => a.subtema === r.subtema)) acc.push({ subtema: r.subtema, ordem: r['ordem subtema'] });
        return acc;
      }, []);
    },
  });

  // Fetch generated content
  const { data: gerados, isLoading: loadingGerados } = useQuery({
    queryKey: ['metodologia-gerados-public', metodo, decodedArea, decodedTema],
    queryFn: async () => {
      if (isMapaMental) {
        const { data } = await supabase
          .from('MAPAS_MENTAIS_GERADOS')
          .select('subtema, dados_json')
          .ilike('area', decodedArea)
          .ilike('tema', decodedTema);
        const map = new Map<string, any>();
        (data || []).forEach((d: any) => map.set(d.subtema, d.dados_json));
        return map;
      } else {
        const { data } = await supabase
          .from('METODOLOGIAS_GERADAS')
          .select('subtema, conteudo')
          .ilike('area', decodedArea)
          .ilike('tema', decodedTema)
          .eq('metodo', metodo!);
        const map = new Map<string, any>();
        (data || []).forEach((d: any) => map.set(d.subtema, d.conteudo));
        return map;
      }
    },
  });

  if (loadingSubtemas || loadingGerados) return <MapaMentalSkeleton />;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 border-b border-border/30">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/metodologias/${metodo}/area/${encodeURIComponent(decodedArea)}`)}
            className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">{decodedTema}</h1>
            <p className="text-xs text-muted-foreground">{decodedArea} · {info.titulo}</p>
          </div>
        </div>
      </div>

      {/* Subtemas list */}
      <div className="px-4 pt-3 space-y-2">
        {(!subtemas || subtemas.length === 0) && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum subtema encontrado
          </div>
        )}
        {subtemas?.map((sub, i) => {
          const conteudo = gerados?.get(sub.subtema);
          const disponivel = !!conteudo;

          return (
            <button
              key={sub.subtema}
              disabled={!disponivel}
              onClick={() => {
                if (disponivel) {
                  setViewContent(conteudo);
                  setViewSubtema(sub.subtema);
                }
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
                disponivel
                  ? 'bg-card border-border/50 hover:bg-accent/30'
                  : 'bg-card/50 border-border/20 opacity-50 cursor-not-allowed'
              }`}
              style={disponivel ? {} : {}}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: disponivel ? `${hexColor}20` : 'rgba(100,100,100,0.1)' }}
              >
                <span className="text-xs font-bold" style={{ color: disponivel ? hexColor : '#888' }}>
                  {sub.ordem || String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-sm font-medium text-foreground line-clamp-2">{sub.subtema}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {disponivel ? 'Toque para visualizar' : 'Em breve'}
                </p>
              </div>
              {disponivel && <Eye className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Full-screen viewer */}
      {viewContent && (
        <>
          {metodo === 'cornell' && (
            <MetodologiaCornellView
              conteudo={viewContent}
              tema={decodedTema}
              subtema={viewSubtema}
              area={decodedArea}
              onClose={() => setViewContent(null)}
            />
          )}
          {metodo === 'feynman' && (
            <MetodologiaFeynmanView
              conteudo={viewContent}
              tema={decodedTema}
              subtema={viewSubtema}
              area={decodedArea}
              onClose={() => setViewContent(null)}
            />
          )}
          {isMapaMental && (
            <div className="fixed inset-0 z-50 bg-background">
              <MapaMentalCanvas
                dados={viewContent}
                areaColor={hexColor}
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setViewContent(null)}
                className="absolute top-3 right-3 z-10 h-9 w-9 p-0 rounded-full"
              >
                <span className="sr-only">Fechar</span>✕
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MetodologiasSubtopicos;
