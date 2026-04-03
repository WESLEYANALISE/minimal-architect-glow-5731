import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, RotateCcw, Home } from "lucide-react";

const SimuladoDinamicoResultado = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const state = location.state as { acertos: number; total: number; tempo: number } | null;

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Nenhum resultado encontrado</p>
        <Button onClick={() => navigate("/simulados")} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const { acertos, total, tempo } = state;
  const percentual = total > 0 ? Math.round((acertos / total) * 100) : 0;

  const formatarTempo = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 space-y-6">
      <div className="text-center space-y-2">
        <Trophy className={`w-16 h-16 mx-auto ${percentual >= 70 ? "text-yellow-400" : percentual >= 50 ? "text-blue-400" : "text-muted-foreground"}`} />
        <h1 className="text-2xl font-bold">Resultado</h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center space-y-4">
          <div className="text-5xl font-bold" style={{ color: percentual >= 70 ? "#22c55e" : percentual >= 50 ? "#3b82f6" : "#ef4444" }}>
            {percentual}%
          </div>
          <p className="text-lg">{acertos} de {total} questões corretas</p>
          <p className="text-sm text-muted-foreground">Tempo: {formatarTempo(tempo)}</p>
        </CardContent>
      </Card>

      <div className="flex gap-3 w-full max-w-sm">
        <Button variant="outline" onClick={() => navigate(`/ferramentas/simulados/concurso/${id}/resolver`)} className="flex-1">
          <RotateCcw className="w-4 h-4 mr-1" />Refazer
        </Button>
        <Button onClick={() => navigate("/simulados")} className="flex-1">
          <Home className="w-4 h-4 mr-1" />Simulados
        </Button>
      </div>
    </div>
  );
};

export default SimuladoDinamicoResultado;
