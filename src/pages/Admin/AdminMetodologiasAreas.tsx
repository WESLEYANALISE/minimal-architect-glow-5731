import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ChevronRight, NotebookPen, Lightbulb, Brain, FilePenLine, Search, Heart } from 'lucide-react';
import { getAreaGradient } from '@/lib/flashcardsAreaColors';
import { MapaMentalSkeleton } from '@/components/skeletons/MapaMentalSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useResumosAreasCache } from '@/hooks/useResumosAreasCache';

const ADMIN_EMAIL = 'wn7corporation@gmail.com';

const metodoInfo: Record<string, { titulo: string; descricao: string; icon: any }> = {
  cornell: {
    titulo: 'Método Cornell',
    descricao: 'Divide a página em 3 seções: Anotações principais (pontos-chave com artigos de lei), Palavras-chave (termos técnicos com definições) e Resumo (síntese em 2 frases). Ideal para revisão ativa e memorização estruturada.',
    icon: NotebookPen,
  },
  feynman: {
    titulo: 'Método Feynman',
    descricao: 'Aprenda explicando! 4 etapas: Conceito (definição clara), Explicação Simples (como para um leigo), Lacunas (pontos que estudantes mais erram) e Analogias (comparações do dia a dia). Excelente para compreensão profunda.',
    icon: Lightbulb,
  },
  mapamental: {
    titulo: 'Mapa Mental',
    descricao: 'Visualização radial em árvore com 5 ramos: Fundamentos, Conceitos-chave, Aplicação, Exceções e Consequências. Cada nó inclui termos técnicos, exemplos práticos e dicas de prova destacadas em amarelo.',
    icon: Brain,
  },
};

const AREAS_PRINCIPAIS = [
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Civil',
  'Direito Penal',
  'Direito Processual Civil',
  'Direito Processual Penal',
  'Direito do Trabalho',
  'Direito Tributário',
];

const AREAS_SECUNDARIAS = [
  'Direito Empresarial',
  'Direito Ambiental',
  'Direito do Consumidor',
  'Direito Eleitoral',
  'Direito Previdenciário',
];

const normalizar = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getCategoriaCurta = (area: string): string => {
  return area
    .replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '')
    .replace(/^Direitos\s+/i, '');
};

const getFavoritesKey = (metodo: string) => `metodologias-areas-favoritas-${metodo}`;

const loadFavorites = (metodo: string): Set<string> => {
  try {
    const raw = localStorage.getItem(getFavoritesKey(metodo));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
};

const saveFavorites = (metodo: string, favs: Set<string>) => {
  localStorage.setItem(getFavoritesKey(metodo), JSON.stringify([...favs]));
};

interface AreaItem {
  area: string;
  totalTemas: number;
  gerados: number;
  capa?: string;
}

const AdminMetodologiasAreas = () => {
  const navigate = useNavigate();
  const { metodo } = useParams<{ metodo: string }>();
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [favoritos, setFavoritos] = useState<Set<string>>(() => loadFavorites(metodo || ''));

  const info = metodoInfo[metodo || ''] || metodoInfo.cornell;
  const isMapaMental = metodo === 'mapamental';

  // Get cover images from resumos cache
  const { areas: resumosAreas } = useResumosAreasCache();

  const { data: areas, isLoading } = useQuery({
    queryKey: ['metodologias-areas', metodo],
    queryFn: async () => {
      let allData: { area: string; tema: string }[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from('RESUMO')
          .select('area, tema')
          .range(offset, offset + batchSize - 1);
        if (error) throw error;
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          offset += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      const areaMap = new Map<string, Set<string>>();
      allData.forEach((r: any) => {
        if (!r.area) return;
        if (!areaMap.has(r.area)) areaMap.set(r.area, new Set());
        if (r.tema) areaMap.get(r.area)!.add(r.tema);
      });

      let geradosMap = new Map<string, number>();

      if (isMapaMental) {
        const { data: gerados } = await supabase
          .from('MAPAS_MENTAIS_GERADOS')
          .select('area, tema');
        (gerados || []).forEach((g: any) => {
          geradosMap.set(g.area, (geradosMap.get(g.area) || 0) + 1);
        });
      } else {
        const { data: gerados } = await supabase
          .from('METODOLOGIAS_GERADAS')
          .select('area, tema')
          .eq('metodo', metodo!);
        (gerados || []).forEach((g: any) => {
          geradosMap.set(g.area, (geradosMap.get(g.area) || 0) + 1);
        });
      }

      return Array.from(areaMap.entries())
        .map(([area, temas]) => ({
          area,
          totalTemas: temas.size,
          gerados: geradosMap.get(area) || 0,
        }))
        .sort((a, b) => a.area.localeCompare(b.area));
    },
  });

  // Build cover map from resumos
  const capaMap = useMemo(() => {
    const map = new Map<string, string>();
    resumosAreas?.forEach(ra => {
      if (ra.capa) map.set(normalizar(ra.area), ra.capa);
    });
    return map;
  }, [resumosAreas]);

  // Categorize areas
  const categorized = useMemo(() => {
    if (!areas) return { principais: [], secundarias: [], demais: [] };

    const buscaNorm = normalizar(busca);
    const filtered = busca
      ? areas.filter(a => normalizar(a.area).includes(buscaNorm))
      : areas;

    const enriched: AreaItem[] = filtered.map(a => ({
      ...a,
      capa: capaMap.get(normalizar(a.area)),
    }));

    const principais: AreaItem[] = [];
    const secundarias: AreaItem[] = [];
    const demais: AreaItem[] = [];

    enriched.forEach(item => {
      const norm = normalizar(item.area);
      if (AREAS_PRINCIPAIS.some(a => normalizar(a) === norm)) {
        principais.push(item);
      } else if (AREAS_SECUNDARIAS.some(a => normalizar(a) === norm)) {
        secundarias.push(item);
      } else {
        demais.push(item);
      }
    });

    // Sort: favorites first within each group
    const sortWithFavs = (arr: AreaItem[]) => {
      return arr.sort((a, b) => {
        const aFav = favoritos.has(a.area);
        const bFav = favoritos.has(b.area);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.area.localeCompare(b.area, 'pt-BR');
      });
    };

    return {
      principais: sortWithFavs(principais),
      secundarias: sortWithFavs(secundarias),
      demais: sortWithFavs(demais),
    };
  }, [areas, busca, favoritos, capaMap]);

  const toggleFavorito = (area: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoritos(prev => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      saveFavorites(metodo || '', next);
      return next;
    });
  };

  if (user?.email !== ADMIN_EMAIL) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito.</div>;
  }

  if (isLoading) return <MapaMentalSkeleton />;

  const renderSection = (title: string, items: AreaItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">{title}</h2>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, i) => {
            const gradient = getAreaGradient(item.area);
            const pct = item.totalTemas > 0 ? Math.round((item.gerados / item.totalTemas) * 100) : 0;
            const isFav = favoritos.has(item.area);

            return (
              <div
                key={item.area}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
              >
                <button
                  onClick={() => navigate(`/admin/metodologias/${metodo}/area/${encodeURIComponent(item.area)}`)}
                  className="group relative overflow-hidden rounded-2xl text-left transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-lg h-[110px] w-full"
                >
                  {/* Background: cover image or gradient */}
                  {item.capa ? (
                    <>
                      <img src={item.capa} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50" />
                    </>
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
                  )}
                  
                  <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="bg-white/20 rounded-xl p-2 w-fit group-hover:bg-white/30 transition-colors">
                        <info.icon className="w-4 h-4 text-white" />
                      </div>
                      <button
                        onClick={(e) => toggleFavorito(item.area, e)}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-red-400 text-red-400' : 'text-white/60'}`} />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-tight">
                        {getCategoriaCurta(item.area)}
                      </h3>
                      <p className="text-[10px] text-white/60 mt-0.5">{item.totalTemas} temas</p>
                    </div>
                  </div>
                  
                  <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-all z-10" />
                  
                  {pct > 0 && (
                    <div className="absolute bottom-3 left-4 right-10 z-10">
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/metodologias')}
          className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
        <div className="flex items-center gap-2">
          <info.icon className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">{info.titulo}</h1>
            <p className="text-xs text-muted-foreground">Selecione uma área do Direito</p>
          </div>
        </div>
      </div>

      {/* Description banner - clean style */}
      <div className="mx-4 mt-2 mb-4 p-3 rounded-xl bg-card border border-border/60">
        <p className="text-xs text-muted-foreground leading-relaxed">{info.descricao}</p>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar área..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
      </div>

      {/* Categorized areas */}
      <div className="px-4">
        {renderSection('Áreas Principais', categorized.principais)}
        {renderSection('Áreas Secundárias', categorized.secundarias)}
        {renderSection('Demais Áreas', categorized.demais)}
        
        {categorized.principais.length === 0 && categorized.secundarias.length === 0 && categorized.demais.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhuma área encontrada.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMetodologiasAreas;
