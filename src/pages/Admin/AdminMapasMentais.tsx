import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, ChevronRight } from 'lucide-react';
import { getAreaGradient, getAreaHex } from '@/lib/flashcardsAreaColors';
import { MapaMentalSkeleton } from '@/components/skeletons/MapaMentalSkeleton';

const ADMIN_EMAIL = 'wn7corporation@gmail.com';

const AdminMapasMentais = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.email !== ADMIN_EMAIL) {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito ao administrador.</div>;
  }

  const { data: areas, isLoading } = useQuery({
    queryKey: ['mapas-mentais-areas'],
    queryFn: async () => {
      // Buscar áreas e contagem de temas da tabela RESUMO
      const { data, error } = await supabase
        .from('RESUMO')
        .select('area, tema');

      if (error) throw error;

      const areaMap = new Map<string, Set<string>>();
      (data || []).forEach((r: any) => {
        if (!r.area) return;
        if (!areaMap.has(r.area)) areaMap.set(r.area, new Set());
        if (r.tema) areaMap.get(r.area)!.add(r.tema);
      });

      // Buscar mapas já gerados
      const { data: gerados } = await supabase
        .from('MAPAS_MENTAIS_GERADOS')
        .select('area, tema');

      const geradosMap = new Map<string, number>();
      (gerados || []).forEach((g: any) => {
        geradosMap.set(g.area, (geradosMap.get(g.area) || 0) + 1);
      });

      return Array.from(areaMap.entries())
        .map(([area, temas]) => ({
          area,
          totalTemas: temas.size,
          gerados: geradosMap.get(area) || 0,
        }))
        .sort((a, b) => a.area.localeCompare(b.area));
    },
  });

  if (isLoading) return <MapaMentalSkeleton />;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Brain className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Mapas Mentais</h1>
          </div>
          <p className="text-sm text-muted-foreground">Gere mapas mentais organizados por área e tema</p>
        </div>

        {/* Grid de áreas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {areas?.map((item) => {
            const hex = getAreaHex(item.area);
            const gradient = getAreaGradient(item.area);
            const pct = item.totalTemas > 0 ? Math.round((item.gerados / item.totalTemas) * 100) : 0;

            return (
              <button
                key={item.area}
                onClick={() => navigate(`/admin/mapas-mentais/area/${encodeURIComponent(item.area)}`)}
                className={`bg-gradient-to-br ${gradient} rounded-xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg relative overflow-hidden group`}
              >
                <div className="relative z-10">
                  <h3 className="text-white font-semibold text-base mb-1">{item.area}</h3>
                  <p className="text-white/70 text-sm">{item.totalTemas} temas</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full rounded-full bg-white/80 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-white/60 text-xs">{item.gerados}/{item.totalTemas}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminMapasMentais;
