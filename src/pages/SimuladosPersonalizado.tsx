import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Play, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

const SimuladosPersonalizado = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [quantidade, setQuantidade] = useState<number>(20);

  const { data: areas, isLoading } = useQuery({
    queryKey: ["simulados-areas"],
    queryFn: async () => {
      const { data, error } = (await supabase.from("SIMULADO-OAB" as any).select("area").not("area", "is", null).neq("area", "").neq("area", "Erro na API")) as any;
      if (error) throw error;
      const areaMap = new Map<string, number>();
      data.forEach(item => {
        if (item.area && item.area.trim()) {
          areaMap.set(item.area, (areaMap.get(item.area) || 0) + 1);
        }
      });
      return Array.from(areaMap.entries()).map(([area, count]) => ({ area, count })).sort((a, b) => a.area.localeCompare(b.area));
    }
  });

  const toggleArea = (area: string) => {
    setSelectedAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };
  const toggleAll = () => {
    if (selectedAreas.length === areas?.length) {
      setSelectedAreas([]);
    } else {
      setSelectedAreas(areas?.map(a => a.area) || []);
    }
  };
  const handleIniciar = () => {
    if (selectedAreas.length === 0) {
      toast({ title: "Selecione pelo menos uma área", description: "Escolha uma ou mais áreas para criar seu simulado", variant: "destructive" });
      return;
    }
    navigate(`/simulados/realizar?areas=${encodeURIComponent(selectedAreas.join(","))}&quantidade=${quantidade}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-24" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      <div className="relative z-10 px-3 py-6 max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Crown className="w-6 h-6" style={{ color: GOLD }} />
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
              Simulado Personalizado
            </h1>
            <p className="text-sm" style={{ color: 'hsl(40, 30%, 70%)' }}>
              Escolha as áreas e quantidade de questões
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quantidade */}
          <Card className="p-5 backdrop-blur-sm" style={{ background: 'hsla(345, 30%, 18%, 0.7)', borderColor: 'hsla(40, 60%, 50%, 0.15)' }}>
            <h3 className="font-semibold mb-4" style={{ color: 'hsl(40, 60%, 85%)' }}>Quantidade de Questões</h3>
            <div className="flex gap-2 flex-wrap">
              {[10, 20, 30, 50].map(qtd => (
                <Button
                  key={qtd}
                  variant={quantidade === qtd ? "default" : "outline"}
                  onClick={() => setQuantidade(qtd)}
                  className="flex-1 min-w-[70px]"
                  style={quantidade === qtd ? { background: GOLD, color: 'hsl(350, 40%, 12%)' } : { borderColor: 'hsla(40, 60%, 50%, 0.3)', color: 'hsl(40, 60%, 85%)' }}
                >
                  {qtd}
                </Button>
              ))}
            </div>
          </Card>

          {/* Áreas */}
          <Card className="p-5 backdrop-blur-sm" style={{ background: 'hsla(345, 30%, 18%, 0.7)', borderColor: 'hsla(40, 60%, 50%, 0.15)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'hsl(40, 60%, 85%)' }}>Áreas do Direito</h3>
              {areas && areas.length > 0 && (
                <button onClick={toggleAll} className="text-sm font-medium hover:underline" style={{ color: GOLD }}>
                  {selectedAreas.length === areas.length ? "Desmarcar Todas" : "Selecionar Todas"}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : areas && areas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {areas.map(item => (
                  <div
                    key={item.area}
                    onClick={() => toggleArea(item.area)}
                    className="flex items-center space-x-3 p-4 rounded-xl transition-all cursor-pointer"
                    style={{
                      borderWidth: 2,
                      borderStyle: 'solid',
                      borderColor: selectedAreas.includes(item.area) ? GOLD : 'hsla(40, 60%, 50%, 0.12)',
                      background: selectedAreas.includes(item.area) ? 'hsla(40, 80%, 55%, 0.08)' : 'transparent',
                    }}
                  >
                    <Checkbox
                      id={item.area}
                      checked={selectedAreas.includes(item.area)}
                      onCheckedChange={() => toggleArea(item.area)}
                      className="pointer-events-none"
                    />
                    <Label htmlFor={item.area} className="flex-1 cursor-pointer pointer-events-none">
                      <div className="font-medium" style={{ color: 'hsl(40, 60%, 90%)' }}>{item.area}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'hsl(40, 20%, 55%)' }}>
                        {item.count} {item.count === 1 ? "questão" : "questões"}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: 'hsl(40, 20%, 55%)' }}>Nenhuma área disponível.</p>
            )}
          </Card>

          {/* Botão Iniciar */}
          <Button
            onClick={handleIniciar}
            className="w-full"
            size="lg"
            disabled={selectedAreas.length === 0}
            style={{ background: `linear-gradient(135deg, ${GOLD}, hsl(35, 85%, 45%))`, color: 'hsl(350, 40%, 12%)' }}
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar Simulado ({selectedAreas.length}{" "}
            {selectedAreas.length === 1 ? "área" : "áreas"})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimuladosPersonalizado;
