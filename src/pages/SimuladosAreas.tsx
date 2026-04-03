import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Layers, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AREA_ICONS: Record<string, string> = {
  "Direito Penal": "⚖️",
  "Direito Civil": "📜",
  "Direito Constitucional": "🏛️",
  "Direito Processual Civil": "📋",
  "Direito do Trabalho": "👷",
  "Direito Administrativo": "🏢",
  "Direito Tributário": "💰",
  "Processo do Trabalho": "⚙️",
  "Direito Processual Penal": "🔍",
  "Direito Empresarial": "💼",
  "Ética Profissional": "📖",
  "Direito Internacional": "🌍",
  "Código de Defesa do Consumidor (CDC)": "🛒",
  "Filosofia do Direito": "🤔",
  "Direito Ambiental": "🌿",
  "Estatuto da Criança e do Adolescente (ECA)": "👶",
  "Direito Eleitoral": "🗳️",
  "Direito Previdenciário": "🏥",
  "Direitos Humanos": "✊",
  "Direito Financeiro": "📊",
};

const SimuladosAreas = () => {
  const navigate = useNavigate();
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const { data: areas, isLoading } = useQuery({
    queryKey: ["simulado-areas-oab"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("SIMULADO-OAB" as any)
        .select("area");
      if (error) throw error;

      const countMap: Record<string, number> = {};
      (data || []).forEach((q: any) => {
        const area = q.area;
        if (area && area !== ";" && area.trim()) {
          countMap[area] = (countMap[area] || 0) + 1;
        }
      });

      return Object.entries(countMap)
        .map(([area, total]) => ({ area, total }))
        .sort((a, b) => b.total - a.total);
    },
  });

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const iniciarSimulado = () => {
    if (selectedAreas.length === 0) return;
    const params = new URLSearchParams({
      areas: selectedAreas.join(","),
      quantidade: "20",
    });
    navigate(`/simulados/realizar?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Simulado por Matéria</h1>
            <p className="text-xs text-muted-foreground">Selecione as áreas para seu simulado</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Toque nas matérias para selecioná-las. Você pode escolher uma ou mais áreas.
            </p>

            <div className="grid grid-cols-1 gap-2">
              {areas?.map(({ area, total }) => {
                const isSelected = selectedAreas.includes(area);
                const icon = AREA_ICONS[area] || "📚";

                return (
                  <Card
                    key={area}
                    className={cn(
                      "cursor-pointer transition-all border",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border hover:bg-accent/30"
                    )}
                    onClick={() => toggleArea(area)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{area}</p>
                        <p className="text-xs text-muted-foreground">{total} questões</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-bold">✓</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* CTA fixo */}
      {selectedAreas.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={iniciarSimulado}
              className="w-full h-12 text-base font-bold gap-2"
            >
              <Layers className="w-5 h-5" />
              Iniciar com {selectedAreas.length} matéria{selectedAreas.length > 1 ? "s" : ""}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimuladosAreas;
