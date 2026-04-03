import { Calendar, Crown, Infinity, Check } from "lucide-react";
import type { PlanType } from "@/hooks/use-mercadopago-pix";

interface PlanConfig {
  price: number;
  label: string;
  days: number;
  badge: string | null;
  featured?: boolean;
  savings?: string;
}

interface PlanoCardNovoProps {
  planKey: PlanType;
  plan: PlanConfig;
  selected: boolean;
  onSelect: () => void;
}

const PlanoCardNovo = ({ planKey, plan, selected, onSelect }: PlanoCardNovoProps) => {
  const isAnual = planKey === 'anual';
  const isVitalicio = planKey === 'vitalicio';

  const getColors = () => {
    if (isAnual) return {
      border: 'border-amber-500/30',
      selectedBorder: 'border-amber-400',
      selectedBg: 'hsl(43 60% 50% / 0.12)',
      unselectedBg: 'hsl(0 0% 9%)',
      shadow: '',
      selectedShadow: 'shadow-[0_0_30px_-5px_rgba(245,158,11,0.35)]',
      gradient: 'from-amber-300 to-amber-500',
      badge: 'bg-gradient-to-r from-amber-500 to-amber-400 text-black',
      check: 'bg-amber-500',
      iconColor: 'text-amber-400',
      iconGlow: 'rgba(245,158,11,0.5)',
      iconBg: 'bg-amber-400/20',
    };
    if (isVitalicio) return {
      border: 'border-emerald-500/30',
      selectedBorder: 'border-emerald-400',
      selectedBg: 'hsl(160 50% 40% / 0.1)',
      unselectedBg: 'hsl(0 0% 9%)',
      shadow: '',
      selectedShadow: 'shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]',
      gradient: 'from-emerald-300 to-emerald-500',
      badge: 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black',
      check: 'bg-emerald-500',
      iconColor: 'text-emerald-400',
      iconGlow: 'rgba(16,185,129,0.5)',
      iconBg: 'bg-emerald-400/20',
    };
    return {
      border: 'border-zinc-700/50',
      selectedBorder: 'border-blue-400',
      selectedBg: 'hsl(217 60% 50% / 0.1)',
      unselectedBg: 'hsl(0 0% 9%)',
      shadow: '',
      selectedShadow: 'shadow-[0_0_25px_-5px_rgba(59,130,246,0.3)]',
      gradient: 'from-blue-300 to-blue-500',
      badge: 'bg-gradient-to-r from-blue-500 to-blue-400 text-white',
      check: 'bg-blue-500',
      iconColor: 'text-blue-400',
      iconGlow: 'rgba(59,130,246,0.5)',
      iconBg: 'bg-blue-400/20',
    };
  };

  const colors = getColors();

  return (
    <button
      onClick={onSelect}
      className={`relative w-full rounded-2xl text-center transition-all duration-300 cursor-pointer border-2 overflow-hidden active:scale-[0.97] ${
        selected
          ? `${colors.selectedBorder} ${colors.selectedShadow} scale-[1.02]`
          : `${colors.border} hover:scale-[1.01] opacity-60 hover:opacity-80`
      } ${isAnual ? 'py-5 px-3 sm:px-4' : 'py-4 px-3 sm:px-4'}`}
      style={{
        background: selected ? colors.selectedBg : colors.unselectedBg,
      }}
    >
      {/* Badge */}
      {plan.badge && (
        <div className={`absolute -top-[1px] left-1/2 -translate-x-1/2 ${colors.badge} text-[8px] sm:text-[9px] font-bold rounded-b-lg px-3 py-0.5 tracking-wider uppercase z-20`}>
          {plan.badge}
        </div>
      )}

      <div className="relative z-10 mt-1">
        {/* Icon */}
        <div className="flex items-center justify-center mb-2">
          <div className="relative">
            {isAnual ? (
              <Crown className={`w-9 h-9 ${colors.iconColor} transition-all duration-300 ${selected ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]' : ''}`} />
            ) : isVitalicio ? (
              <Infinity className={`w-9 h-9 ${colors.iconColor} transition-all duration-300 ${selected ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]' : ''}`} />
            ) : (
              <Calendar className={`w-9 h-9 ${colors.iconColor} transition-all duration-300 ${selected ? 'drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]' : ''}`} />
            )}
            {selected && (
              <div className={`absolute inset-0 ${colors.iconBg} rounded-full blur-lg animate-pulse`} />
            )}
          </div>
        </div>

        {/* Name */}
        <h3 className={`text-sm sm:text-base font-bold mb-1.5 transition-colors duration-300 ${selected ? 'text-white' : 'text-zinc-400'}`}>
          {plan.label}
        </h3>

        {/* Price */}
        <div className="flex items-baseline justify-center gap-0.5">
          <span className={`text-[10px] self-start mt-1 transition-colors duration-300 ${selected ? 'text-zinc-400' : 'text-zinc-600'}`}>R$</span>
          <span className={`text-xl sm:text-2xl font-extrabold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent transition-all duration-300 ${selected ? 'opacity-100' : 'opacity-70'}`}>
            {plan.price.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Period label */}
        <p className={`text-[9px] mt-1 uppercase tracking-wider font-medium transition-colors duration-300 ${selected ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {isVitalicio ? 'pagamento único' : isAnual ? 'por ano' : 'mensal'}
        </p>

        {isAnual && (
          <p className={`text-[9px] mt-1 transition-colors duration-300 ${selected ? 'text-zinc-400' : 'text-zinc-600'}`}>
            acesso por 1 ano
          </p>
        )}
        {isVitalicio && (
          <p className={`text-[9px] mt-1 transition-colors duration-300 ${selected ? 'text-zinc-400' : 'text-zinc-600'}`}>
            acesso pra sempre
          </p>
        )}
      </div>

      {/* Selected check */}
      {selected && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${colors.check} shadow-lg animate-[scaleIn_150ms_ease-out]`}>
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
};

export default PlanoCardNovo;
