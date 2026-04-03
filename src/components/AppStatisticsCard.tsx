import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";

interface AppStatisticsCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  color: string;
  delay?: number;
  onClick?: () => void;
}

export const AppStatisticsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  color,
  delay = 0,
  onClick
}: AppStatisticsCardProps) => {
  return (
    <Card 
      className={`relative p-6 hover:shadow-lg transition-all hover:scale-105 overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`p-4 rounded-full ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <div className="text-4xl font-bold text-foreground mb-2">
            <NumberTicker value={value} delay={delay / 1000} />
          </div>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </div>
      <BorderBeam size={150} duration={12} delay={delay / 1000} />
    </Card>
  );
};
