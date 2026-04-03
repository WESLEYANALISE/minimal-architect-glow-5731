import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, DollarSign, FileQuestion, Calendar } from "lucide-react";
import tjspLogo from "@/assets/tjsp-logo.webp";

const SALARIOS_CONHECIDOS: Record<string, { inicial: string; total: string }> = {
  "escrevente técnico judiciário": { inicial: "R$ 6.345,94", total: "R$ 9.000,00" },
  "juiz substituto": { inicial: "R$ 33.689,11", total: "R$ 39.717,69" },
  "juiz de direito": { inicial: "R$ 33.689,11", total: "R$ 39.717,69" },
  "magistratura": { inicial: "R$ 33.689,11", total: "R$ 39.717,69" },
  "promotor de justiça": { inicial: "R$ 33.689,11", total: "R$ 39.717,69" },
  "procurador da república": { inicial: "R$ 33.689,11", total: "R$ 39.717,69" },
  "defensor público": { inicial: "R$ 22.197,67", total: "R$ 32.004,65" },
  "delegado de polícia": { inicial: "R$ 23.692,74", total: "R$ 31.000,00" },
  "analista judiciário": { inicial: "R$ 13.994,78", total: "R$ 16.000,00" },
  "técnico judiciário": { inicial: "R$ 8.529,65", total: "R$ 11.000,00" },
  "oficial de justiça": { inicial: "R$ 8.529,65", total: "R$ 12.000,00" },
  "procurador do estado": { inicial: "R$ 27.500,17", total: "R$ 35.000,00" },
  "advogado da união": { inicial: "R$ 21.014,49", total: "R$ 27.500,17" },
  "auditor fiscal": { inicial: "R$ 21.029,09", total: "R$ 27.000,00" },
  "analista tributário": { inicial: "R$ 11.684,39", total: "R$ 16.000,00" },
};

const SimuladoDinamicoDetalhes = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: simulado, isLoading } = useQuery({
    queryKey: ["simulado-dinamico", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulados_concursos")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: materias } = useQuery({
    queryKey: ["simulado-dinamico-materias", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulados_questoes")
        .select("materia")
        .eq("simulado_id", id!);
      if (error) throw error;

      const contagem: Record<string, number> = {};
      data?.forEach((q) => {
        const m = q.materia || "Geral";
        contagem[m] = (contagem[m] || 0) + 1;
      });
      return Object.entries(contagem)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!simulado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Simulado não encontrado</p>
        <Button onClick={() => navigate("/ferramentas/simulados")} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const cargoKey = simulado.cargo?.toLowerCase() || "";
  const salarioDb = (simulado as any).salario_inicial ? {
    inicial: (simulado as any).salario_inicial,
    total: (simulado as any).salario_maximo || (simulado as any).salario_inicial,
  } : null;
  const salario = salarioDb || Object.entries(SALARIOS_CONHECIDOS).find(([key]) => cargoKey.includes(key))?.[1] || null;
  const isEscrevente = cargoKey.includes("escrevente");

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-background to-background pointer-events-none" />

      <div className="flex-1 px-4 md:px-6 py-6 space-y-5 relative">
        {/* Header com logo */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center shadow-lg">
            {isEscrevente ? (
              <img src={tjspLogo} alt="TJSP" className="w-full h-full object-contain p-1" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: `${simulado.cor || '#f59e0b'}20` }}
              >
                <BookOpen className="w-10 h-10" style={{ color: simulado.cor || '#f59e0b' }} />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">{simulado.nome}</h1>
            {simulado.ano && (
              <p className="text-lg font-semibold text-amber-400">Prova {simulado.ano}</p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {simulado.banca && <Badge variant="outline" className="border-amber-500/30 text-amber-400">{simulado.banca}</Badge>}
            {simulado.orgao && <Badge variant="outline" className="border-border">{simulado.orgao}</Badge>}
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileQuestion className="w-4 h-4" />
              {simulado.total_questoes} questões
            </span>
            {simulado.ano && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {simulado.ano}
              </span>
            )}
          </div>
        </div>

        {/* Salário destacado */}
        {salario && (
          <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-600/5 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Remuneração inicial</p>
                  <p className="text-2xl font-bold text-amber-400">{salario.inicial}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Podendo chegar a <span className="font-semibold text-foreground">{salario.total}</span> com benefícios
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão iniciar */}
        <Button
          onClick={() => navigate(`/ferramentas/simulados/concurso/${id}/resolver`)}
          className="w-full h-12 text-base bg-[hsl(8,65%,52%)] hover:bg-[hsl(8,65%,45%)] text-white"
          size="lg"
        >
          <Play className="w-5 h-5 mr-2" />
          Iniciar Simulado
        </Button>

        {/* Matérias */}
        {materias && materias.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Matérias
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {materias.map((m) => (
                <Card key={m.nome} className="overflow-hidden">
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm">{m.nome}</span>
                    <Badge variant="secondary">{m.total} questões</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimuladoDinamicoDetalhes;
