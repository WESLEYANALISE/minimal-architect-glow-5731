import { startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Scale, Gavel, Building2, Shield, BookOpen, Briefcase, Landmark, Users, Leaf, ShoppingCart, Vote, Heart, Hammer, Globe, ChevronRight, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DisciplinaCardProps {
  area: string;
  gradient: string;
  totalQuestoes: number;
  progress?: number;
  respondidas?: number;
  isLocked?: boolean;
  onLockedClick?: () => void;
}

const AREA_ICONS: Record<string, LucideIcon> = {
  "Direito Constitucional": Landmark,
  "Direito Administrativo": Building2,
  "Direito Penal": Gavel,
  "Direito Processual Penal": Shield,
  "Direito Civil": Scale,
  "Direito Processual Civil": BookOpen,
  "Direito do Trabalho": Hammer,
  "Direito Processual do Trabalho": Hammer,
  "Direito Tributário": Briefcase,
  "Direito Empresarial": Briefcase,
  "Direitos Humanos": Users,
  "Direito Ambiental": Leaf,
  "Direito do Consumidor": ShoppingCart,
  "Direito Eleitoral": Vote,
  "Direito Previdenciário": Heart,
  "Direito Internacional": Globe,
};

const ProgressCircle = ({ percent }: { percent: number }) => {
  const size = 38;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="white" strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500" />
      </svg>
      <span className="absolute text-[9px] font-bold text-white">
        {percent < 1 && percent > 0 ? percent.toFixed(1) : Math.round(percent)}%
      </span>
    </div>
  );
};

export const DisciplinaCard = ({ area, gradient, totalQuestoes, progress = 0, respondidas, isLocked = false, onLockedClick }: DisciplinaCardProps) => {
  const navigate = useNavigate();
  const IconComponent = AREA_ICONS[area] || Target;

  const shortName = area
    .replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '')
    .replace(/^Direitos\s+/i, '');

  const handleClick = () => {
    if (isLocked) {
      onLockedClick?.();
    } else {
      startTransition(() => {
        navigate(`/ferramentas/questoes/temas?area=${encodeURIComponent(area)}`);
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-150 hover:scale-[1.02] bg-gradient-to-br ${gradient} shadow-lg h-[100px] animate-fade-in`}
    >
      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/35 rounded-2xl z-10" />
      )}

      <div className="absolute -right-3 -bottom-3 opacity-20">
        <IconComponent className="w-20 h-20 text-white" />
      </div>
      
      {/* Progress circle - top right */}
      {!isLocked && (
        <div className="absolute top-3 right-3">
          <ProgressCircle percent={progress} />
        </div>
      )}

      {/* Crown badge for locked cards */}
      {isLocked && (
        <div
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-20"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #b45309)",
            boxShadow: "0 0 10px rgba(245,158,11,0.7), 0 2px 6px rgba(0,0,0,0.4)",
            border: "1.5px solid #fbbf24",
          }}
        >
          <Crown className="w-3.5 h-3.5 text-white" style={{ filter: "drop-shadow(0 0 2px rgba(251,191,36,0.9))" }} />
        </div>
      )}

      <div className="relative z-10 bg-white/20 rounded-xl p-2 w-fit mb-2 group-hover:bg-white/30 transition-colors">
        <IconComponent className="w-5 h-5 text-white" />
      </div>
      <h3 className="relative z-10 font-semibold text-white text-sm leading-tight pr-12">{shortName}</h3>
      <p className="relative z-10 text-[10px] text-white/60 mt-0.5">
        {respondidas !== undefined && respondidas > 0
          ? `${respondidas}/${totalQuestoes.toLocaleString('pt-BR')} feitas`
          : `${totalQuestoes.toLocaleString('pt-BR')} questões`
        }
      </p>
    </button>
  );
};
