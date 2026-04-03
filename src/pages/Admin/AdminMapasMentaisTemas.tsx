import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Brain, Check, Loader2, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAreaHex } from '@/lib/flashcardsAreaColors';
import { toast } from 'sonner';
import { useState } from 'react';
import MapaMentalCanvas from '@/components/mapas-mentais/MapaMentalCanvas';

const ADMIN_EMAIL = 'wn7corporation@gmail.com';

const AdminMapasMentaisTemas = () => {
  const { area } = useParams<{ area: string }>();
  const decodedArea = decodeURIComponent(area || '');
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [previewData, setPreviewData] = useState<any>(null);
  const [gerandoTema, setGerandoTema] = useState<string | null>(null);
  const [gerandoTodos, setGerandoTodos] = useState(false);
  const areaColor = getAreaHex(decodedArea);

  if (user?.email !== ADMIN_EMAIL) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito.</div>;
  }

  const { data: temas, isLoading } = useQuery({
    queryKey: ['mapas-mentais-temas', decodedArea],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('RESUMO')
        .select('tema')
        .eq('area', decodedArea)
        .not('tema', 'is', null);

      if (error) throw error;

      const temasUnicos = [...new Set((data || []).map((r: any) => r.tema))].sort();

      // Buscar gerados
      const { data: gerados } = await supabase
        .from('MAPAS_MENTAIS_GERADOS')
        .select('tema')
        .eq('area', decodedArea);

      const geradosSet = new Set((gerados || []).map((g: any) => g.tema));

      return temasUnicos.map(tema => ({
        tema,
        gerado: geradosSet.has(tema),
      }));
    },
  });

  const gerarMapa = async (tema: string) => {
    setGerandoTema(tema);
    try {
      const { data, error } = await supabase.functions.invoke('gerar-mapa-mental', {
        body: { area: decodedArea, tema },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido');

      toast.success(`Mapa de "${tema}" gerado!`);
      queryClient.invalidateQueries({ queryKey: ['mapas-mentais-temas', decodedArea] });
      queryClient.invalidateQueries({ queryKey: ['mapas-mentais-areas'] });
      return data.dados_json;
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
      return null;
    } finally {
      setGerandoTema(null);
    }
  };

  const verPreview = async (tema: string) => {
    // Tentar carregar do cache primeiro
    const { data } = await supabase
      .from('MAPAS_MENTAIS_GERADOS')
      .select('dados_json')
      .eq('area', decodedArea)
      .eq('tema', tema)
      .maybeSingle();

    if (data?.dados_json) {
      setPreviewData(data.dados_json);
    } else {
      // Gerar e depois mostrar
      const resultado = await gerarMapa(tema);
      if (resultado) setPreviewData(resultado);
    }
  };

  const gerarTodos = async () => {
    if (!temas) return;
    const pendentes = temas.filter(t => !t.gerado);
    if (pendentes.length === 0) {
      toast.info('Todos já estão gerados!');
      return;
    }

    setGerandoTodos(true);
    let sucesso = 0;
    for (const t of pendentes) {
      const resultado = await gerarMapa(t.tema);
      if (resultado) sucesso++;
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));
    }
    setGerandoTodos(false);
    toast.success(`${sucesso}/${pendentes.length} mapas gerados!`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalGerados = temas?.filter(t => t.gerado).length || 0;
  const totalTemas = temas?.length || 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/mapas-mentais')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{decodedArea}</h1>
            <p className="text-sm text-muted-foreground">
              {totalGerados}/{totalTemas} mapas gerados
            </p>
          </div>
          <div className="ml-auto">
            <Button
              onClick={gerarTodos}
              disabled={gerandoTodos || gerandoTema !== null}
              size="sm"
              style={{ backgroundColor: areaColor }}
              className="text-white"
            >
              {gerandoTodos ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Gerando...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-1" /> Gerar Todos</>
              )}
            </Button>
          </div>
        </div>

        {/* Preview modal */}
        {previewData && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Preview</h2>
              <Button variant="ghost" size="sm" onClick={() => setPreviewData(null)}>
                Fechar
              </Button>
            </div>
            <MapaMentalCanvas dados={previewData} areaColor={areaColor} />
          </div>
        )}

        {/* Lista de temas - trilha serpentina */}
        <div className="space-y-2">
          {temas?.map((item, idx) => {
            const isGerando = gerandoTema === item.tema;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={item.tema}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  item.gerado ? 'border-border/50 bg-card' : 'border-border/30 bg-card/50'
                } ${isEven ? '' : 'ml-8'}`}
              >
                {/* Número */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: item.gerado ? areaColor : '#475569' }}
                >
                  {idx + 1}
                </div>

                {/* Tema */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.tema}</p>
                </div>

                {/* Badge */}
                {item.gerado && (
                  <Badge variant="secondary" className="text-xs bg-emerald-500/15 text-emerald-400 border-0">
                    <Check className="w-3 h-3 mr-1" /> Gerado
                  </Badge>
                )}

                {/* Ações */}
                <div className="flex gap-1">
                  {item.gerado && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => verPreview(item.tema)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={isGerando || gerandoTodos}
                    onClick={() => verPreview(item.tema)}
                  >
                    {isGerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminMapasMentaisTemas;
