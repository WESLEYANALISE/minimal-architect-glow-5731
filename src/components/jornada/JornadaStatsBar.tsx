import { memo } from "react";
import { BookOpen, Flame, Trophy, Sparkles } from "lucide-react";
import type { JornadaStats } from "@/hooks/useJornadaPessoal";

interface Props {
  stats: JornadaStats;
}

export const JornadaStatsBar = memo(({ stats }: Props) => {
  const items = [
    { icon: <BookOpen className="w-4 h-4 text-red-400" />, label: "Aulas", value: stats.totalAulas },
    { icon: <Flame className="w-4 h-4 text-orange-400" />, label: "Streak", value: `${stats.streak}d` },
    { icon: <Trophy className="w-4 h-4 text-yellow-400" />, label: "Max", value: `${stats.maxStreak}d` },
    { icon: <Sparkles className="w-4 h-4 text-purple-400" />, label: "Top", value: stats.areaMaisEstudada?.split(" ")[0] || "—" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      {items.map((item, i) => (
        <div key={i} className="bg-card/60 border border-border/30 rounded-xl p-2.5 text-center space-y-1">
          <div className="flex justify-center">{item.icon}</div>
          <p className="text-xs font-bold text-foreground truncate">{item.value}</p>
          <p className="text-[10px] text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
});

JornadaStatsBar.displayName = "JornadaStatsBar";
