import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, ChevronRight, Play } from "lucide-react";

interface CursoCardProps {
  area: string;
  totalAulas: number;
  concluidas: number;
  onClick: () => void;
}

const AREA_COLORS: Record<string, { bg: string; accent: string; icon: string }> = {
  "Direito": { bg: "from-amber-900/40 to-amber-800/20", accent: "text-amber-400", icon: "bg-amber-500/20" },
  "Direito Penal": { bg: "from-red-900/40 to-red-800/20", accent: "text-red-400", icon: "bg-red-500/20" },
  "Direito Civil": { bg: "from-blue-900/40 to-blue-800/20", accent: "text-blue-400", icon: "bg-blue-500/20" },
  "Direito Constitucional": { bg: "from-purple-900/40 to-purple-800/20", accent: "text-purple-400", icon: "bg-purple-500/20" },
  "Direito Processual Civil": { bg: "from-cyan-900/40 to-cyan-800/20", accent: "text-cyan-400", icon: "bg-cyan-500/20" },
  "Direito Penal e Processual Penal": { bg: "from-orange-900/40 to-orange-800/20", accent: "text-orange-400", icon: "bg-orange-500/20" },
};

const getColors = (area: string) => AREA_COLORS[area] || AREA_COLORS["Direito"];

export const CursoCard = ({ area, totalAulas, concluidas, onClick }: CursoCardProps) => {
  const colors = getColors(area);
  const percentual = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;
  const emAndamento = concluidas > 0 && concluidas < totalAulas;
  const completo = concluidas === totalAulas && totalAulas > 0;

  return (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer border-border/50 hover:border-primary/40 transition-all duration-300 active:scale-[0.98] bg-gradient-to-br ${colors.bg}`}
    >
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${colors.icon}`}>
            <BookOpen className={`w-6 h-6 ${colors.accent}`} />
          </div>
          {completo ? (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Completo
            </Badge>
          ) : emAndamento ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-0">
              <Play className="w-3 h-3 mr-1" /> Continuar
            </Badge>
          ) : null}
        </div>

        {/* Title */}
        <div>
          <h3 className="font-bold text-lg text-foreground">{area}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {totalAulas} {totalAulas === 1 ? 'aula' : 'aulas'} disponíveis
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{concluidas}/{totalAulas} concluídas</span>
            <span className={colors.accent}>{percentual}%</span>
          </div>
          <Progress value={percentual} className="h-2 bg-muted/30" />
        </div>

        {/* CTA arrow */}
        <div className="flex items-center justify-end">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
};
