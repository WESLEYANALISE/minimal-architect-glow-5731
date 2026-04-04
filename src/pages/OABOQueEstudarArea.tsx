import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Clock, ExternalLink, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { DotPattern } from "@/components/ui/dot-pattern";

const GOLD = "hsl(40, 80%, 55%)";

const normalizeText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

interface Materia { id: number; area: string; materia: string; }
interface Resumo { id: number; area: string; tema: string; subtema: string | null; }

const OABOQueEstudarArea = () => {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const areaDecoded = decodeURIComponent(area || "");

  const { data: dadosTabela, isLoading: loadingMaterias } = useQuery({
    queryKey: ["plano-estudos-materias", areaDecoded],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("PLANO DE ESTUDOS- MATERIAS").select("*");
      if (error) throw error;
      const materiasDaArea: Materia[] = [];
      data?.forEach((row: any, index: number) => {
        if (row[areaDecoded] && row[areaDecoded].toString().trim() !== "") {
          materiasDaArea.push({ id: index + 1, area: areaDecoded, materia: row[areaDecoded].toString().trim() });
        }
      });
      return materiasDaArea;
    },
  });

  const { data: resumos, isLoading: loadingResumos } = useQuery({
    queryKey: ["resumos-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("RESUMO").select("id, area, tema, subtema");
      if (error) throw error;
      return data as Resumo[];
    },
  });

  const materiasComResumos = useMemo(() => {
    if (!dadosTabela || !resumos) return [];
    return dadosTabela.map(materia => {
      const materiaNormalizada = normalizeText(materia.materia);
      let resumoMatch = resumos.find(r => normalizeText(r.tema) === materiaNormalizada);
      if (!resumoMatch) resumoMatch = resumos.find(r => normalizeText(r.subtema) === materiaNormalizada);
      return { ...materia, temResumo: !!resumoMatch, resumo: resumoMatch || null };
    });
  }, [dadosTabela, resumos]);

  const materiasFiltradas = useMemo(() => {
    if (!searchTerm) return materiasComResumos;
    return materiasComResumos.filter(m => m.materia.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [materiasComResumos, searchTerm]);

  const isLoading = loadingMaterias || loadingResumos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  const totalMaterias = materiasComResumos.length;
  const materiasComConteudo = materiasComResumos.filter(m => m.temResumo).length;

  return (
    <div className="min-h-screen relative overflow-hidden pb-20" style={{ background: 'linear-gradient(to bottom, hsl(345, 65%, 28%), hsl(350, 40%, 12%))' }}>
      <DotPattern className="opacity-[0.15]" />

      {/* Header */}
      <div className="sticky top-0 z-10 shadow-lg relative" style={{ background: 'linear-gradient(135deg, hsl(345, 65%, 30%), hsl(350, 40%, 18%))' }}>
        <div className="relative px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown className="w-5 h-5" style={{ color: GOLD }} />
              <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'hsl(40, 60%, 85%)' }}>
                {areaDecoded}
              </h1>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm" style={{ color: 'hsl(40, 30%, 70%)' }}>
              <span>{totalMaterias} {totalMaterias === 1 ? "matéria" : "matérias"}</span>
              <span>•</span>
              <span className="font-semibold" style={{ color: GOLD }}>{materiasComConteudo} com conteúdo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-3 py-6 max-w-4xl mx-auto">
        <Card className="mb-6 backdrop-blur-sm" style={{ background: 'hsla(345, 30%, 18%, 0.7)', borderColor: 'hsla(40, 60%, 50%, 0.15)' }}>
          <CardContent className="p-4">
            <Input
              placeholder="Buscar matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-base"
              style={{ background: 'hsla(345, 20%, 15%, 0.5)', borderColor: 'hsla(40, 60%, 50%, 0.2)', color: 'hsl(40, 60%, 90%)' }}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          {materiasFiltradas.map(materia => (
            <Card key={materia.id} className="overflow-hidden hover:shadow-md transition-shadow backdrop-blur-sm" style={{ background: 'hsla(345, 30%, 18%, 0.7)', borderColor: 'hsla(40, 60%, 50%, 0.12)' }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-2 line-clamp-2" style={{ color: 'hsl(40, 60%, 90%)' }}>
                      {materia.materia}
                    </h3>
                    <div className="mb-2">
                      {materia.temResumo ? (
                        <Badge style={{ background: 'hsla(140, 60%, 40%, 0.15)', color: 'hsl(140, 60%, 60%)', borderColor: 'hsla(140, 60%, 40%, 0.2)' }}>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conteúdo disponível
                        </Badge>
                      ) : (
                        <Badge style={{ background: 'hsla(40, 40%, 50%, 0.1)', color: 'hsl(40, 20%, 55%)', borderColor: 'hsla(40, 40%, 50%, 0.2)' }}>
                          <Clock className="w-3 h-3 mr-1" />
                          Em breve
                        </Badge>
                      )}
                    </div>
                    {materia.temResumo && materia.resumo && (
                      <p className="text-xs line-clamp-1" style={{ color: 'hsl(40, 20%, 50%)' }}>
                        {materia.resumo.area} → {materia.resumo.tema}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {materia.temResumo && materia.resumo && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/resumos-juridicos/prontos/${encodeURIComponent(materia.resumo!.area)}/${encodeURIComponent(materia.resumo!.tema)}`)}
                        style={{ background: GOLD, color: 'hsl(350, 40%, 12%)' }}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Ver conteúdo
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {materiasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: 'hsl(40, 20%, 55%)' }}>Nenhuma matéria encontrada para "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OABOQueEstudarArea;
