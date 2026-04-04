import { startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { Target, Scale, Gavel, Building2, Shield, BookOpen, Briefcase, Landmark, Users, Leaf, ShoppingCart, Vote, Heart, Hammer, Globe, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DisciplinaCardRealezaProps {
  area: string;
  totalQuestoes: number;
  progress?: number;
  respondidas?: number;
  isLocked?: boolean;
  onLockedClick?: () => void;
  onSelect?: (area: string) => void;
  delay?: number;
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
  const size = 40;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsla(40, 60%, 50%, 0.2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(40, 80%, 55%)" strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <span className="absolute text-[9px] font-bold" style={{ color: "hsl(40, 80%, 55%)" }}>
        {percent < 1 && percent > 0 ? percent.toFixed(1) : Math.round(percent)}%
      </span>
    </div>
  );
};

export const DisciplinaCardRealeza = ({ area, totalQuestoes, progress = 0, respondidas, isLocked = false, onLockedClick, onSelect, delay = 0 }: DisciplinaCardRealezaProps) => {
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
        navigate(`/ferramentas/questoes-v2/temas?area=${encodeURIComponent(area)}`);
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] h-[110px] animate-fade-in"
      style={{
        background: "hsla(0, 0%, 100%, 0.04)",
        backdropFilter: "blur(12px)",
        border: "1px solid hsla(40, 60%, 50%, 0.12)",
        boxShadow: "0 4px 20px -4px rgba(0,0,0,0.4), inset 0 1px 0 hsla(40, 60%, 80%, 0.06)",
        animationDelay: `${delay}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* Shimmer reflection */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 40%, hsla(40, 80%, 70%, 0.06) 45%, hsla(40, 80%, 70%, 0.12) 50%, hsla(40, 80%, 70%, 0.06) 55%, transparent 60%)",
        }}
      />

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 rounded-2xl z-10" style={{ background: "hsla(0, 0%, 0%, 0.4)" }} />
      )}

      {/* Background icon */}
      <div className="absolute -right-3 -bottom-3 opacity-[0.07]">
        <IconComponent className="w-20 h-20" style={{ color: "hsl(40, 80%, 55%)" }} />
      </div>

      {/* Progress circle */}
      {!isLocked && (
        <div className="absolute top-3 right-3">
          <ProgressCircle percent={progress} />
        </div>
      )}

      {/* Crown for locked */}
      {isLocked && (
        <div
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-20"
          style={{
            background: "linear-gradient(135deg, hsl(40, 90%, 50%), hsl(40, 70%, 35%))",
            boxShadow: "0 0 10px hsla(40, 90%, 50%, 0.5)",
            border: "1.5px solid hsl(40, 80%, 60%)",
          }}
        >
          <Crown className="w-3.5 h-3.5 text-white" style={{ filter: "drop-shadow(0 0 2px hsla(40, 80%, 60%, 0.9))" }} />
        </div>
      )}

      {/* Icon badge */}
      <div
        className="relative z-10 rounded-xl p-2 w-fit mb-2 transition-colors"
        style={{
          background: "hsla(40, 60%, 50%, 0.12)",
          border: "1px solid hsla(40, 60%, 50%, 0.15)",
        }}
      >
        <IconComponent className="w-5 h-5" style={{ color: "hsl(40, 80%, 55%)" }} />
      </div>

      <h3 className="relative z-10 font-semibold text-white text-sm leading-tight pr-12">{shortName}</h3>
      <p className="relative z-10 text-[10px] mt-0.5" style={{ color: "hsla(40, 60%, 70%, 0.6)" }}>
        {respondidas !== undefined && respondidas > 0
          ? `${respondidas}/${totalQuestoes.toLocaleString('pt-BR')} feitas`
          : `${totalQuestoes.toLocaleString('pt-BR')} questões`
        }
      </p>
    </button>
  );
};
