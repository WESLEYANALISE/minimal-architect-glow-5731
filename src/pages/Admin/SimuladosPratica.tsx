import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, CheckCircle, Clock, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Simulado {
  id: string;
  nome: string;
  cargo: string | null;
  banca: string | null;
  ano: number | null;
  orgao: string | null;
  total_questoes: number | null;
  status: string;
  created_at: string;
}

const SimuladosPratica = () => {
  const navigate = useNavigate();
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarSimulados();
  }, []);

  const carregarSimulados = async () => {
    try {
      const { data, error } = await supabase
        .from("simulados_concursos")
        .select("*")
        .in("status", ["pronto", "liberado"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSimulados(data || []);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const alterarStatus = async (id: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from("simulados_concursos")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) throw error;
      toast({ title: `Status alterado para "${novoStatus}"` });
      carregarSimulados();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">Simulados (Praticar)</h1>
      </div>

      <div className="p-4 space-y-3 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : simulados.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum simulado disponível</p>
            <p className="text-sm">Use "Popular Simulado" para criar um</p>
          </div>
        ) : (
          simulados.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{s.nome}</h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {s.banca && (
                        <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                          {s.banca}
                        </span>
                      )}
                      {s.ano && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                          {s.ano}
                        </span>
                      )}
                      {s.cargo && (
                        <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full">
                          {s.cargo}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{s.total_questoes || 0} questões</span>
                      <span className={`flex items-center gap-1 ${s.status === "liberado" ? "text-green-600" : "text-amber-600"}`}>
                        {s.status === "liberado" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {s.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => navigate(`/ferramentas/simulados/concurso/${s.id}`)}
                    >
                      <Play className="h-3 w-3 mr-1" /> Praticar
                    </Button>
                    {s.status === "pronto" && (
                      <Button
                        size="sm"
                        className="text-xs h-7 bg-green-600 hover:bg-green-700"
                        onClick={() => alterarStatus(s.id, "liberado")}
                      >
                        Liberar
                      </Button>
                    )}
                    {s.status === "liberado" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => alterarStatus(s.id, "pronto")}
                      >
                        Recolher
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SimuladosPratica;
