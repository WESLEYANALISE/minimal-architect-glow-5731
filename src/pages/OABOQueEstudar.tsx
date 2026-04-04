import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

const OABOQueEstudar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: materias, isLoading } = useQuery({
    queryKey: ["plano-estudos-materias"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("PLANO DE ESTUDOS- MATERIAS").select("*");
      if (error) throw error;
      return data;
    },
  });

  const areas = useMemo(() => {
    if (!materias || materias.length === 0) return [];
    const primeiraLinha = materias[0];
    const todasColunas = Object.keys(primeiraLinha);
    const colunasAreas = todasColunas.filter(col => !["id", "created_at", "updated_at"].includes(col.toLowerCase()));
    const areasList = colunasAreas.map(coluna => {
      const materiasNaoVazias = materias.filter((row: any) => row[coluna] && row[coluna].toString().trim() !== "").length;
      return { nome: coluna, count: materiasNaoVazias };
    }).filter(area => area.count > 0);
    return areasList.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [materias]);

  const areasFiltradas = useMemo(() => {
    if (!searchTerm) return areas;
    return areas.filter((area: any) => area.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [areas, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto pt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ background: 'hsla(40, 80%, 55%, 0.15)' }}>
              <BookOpen className="w-6 h-6" style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
                O que estudar
              </h1>
              <p className="text-sm mt-1" style={{ color: 'hsl(40, 30%, 70%)' }}>
                Escolha uma área do Direito para ver as matérias da OAB
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-3 py-4 max-w-4xl mx-auto">
        {/* Pesquisa */}
        <Card className="mb-6 backdrop-blur-sm" style={{ background: 'hsla(345, 30%, 18%, 0.7)', borderColor: 'hsla(40, 60%, 50%, 0.15)' }}>
          <CardContent className="p-4">
            <Input
              placeholder="Buscar área do Direito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
              style={{ background: 'hsla(345, 20%, 15%, 0.5)', borderColor: 'hsla(40, 60%, 50%, 0.2)', color: 'hsl(40, 60%, 90%)' }}
            />
          </CardContent>
        </Card>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {areasFiltradas.map((area: any) => (
            <Card
              key={area.nome}
              className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg group backdrop-blur-sm"
              style={{ background: 'hsla(345, 30%, 18%, 0.7)', borderColor: 'hsla(40, 60%, 50%, 0.12)' }}
              onClick={() => navigate(`/oab/o-que-estudar/${encodeURIComponent(area.nome)}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 transition-colors" style={{ color: 'hsl(40, 60%, 90%)' }}>
                      {area.nome}
                    </h3>
                    <p className="text-sm" style={{ color: 'hsl(40, 20%, 55%)' }}>
                      {area.count} {area.count === 1 ? "matéria" : "matérias"}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ background: 'hsla(40, 80%, 55%, 0.12)' }}>
                    <BookOpen className="w-5 h-5" style={{ color: GOLD }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {areasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'hsl(40, 20%, 55%)' }}>Nenhuma área encontrada para "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OABOQueEstudar;
