import { BookOpen, Scale, Landmark, Shield, Gavel, Users, Building2, Leaf, Globe2, Coins, Briefcase, FileText, Heart, Brain, GraduationCap, Megaphone, MapPin, Trophy, HardHat, Swords, ChevronRight } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface AreaConfig {
  icon: LucideIcon;
  gradient: string;
  accent: string;
}

const AREA_CONFIGS: Record<string, AreaConfig> = {
  "Direito Penal": { icon: Gavel, gradient: "from-red-900/90 to-red-700/80", accent: "bg-red-500" },
  "Direito Civil": { icon: Users, gradient: "from-blue-900/90 to-blue-700/80", accent: "bg-blue-500" },
  "Direito Constitucional": { icon: Landmark, gradient: "from-amber-900/90 to-amber-700/80", accent: "bg-amber-500" },
  "Direito Processual Civil": { icon: FileText, gradient: "from-cyan-900/90 to-cyan-700/80", accent: "bg-cyan-500" },
  "Direito Processual Penal": { icon: Shield, gradient: "from-rose-900/90 to-rose-700/80", accent: "bg-rose-500" },
  "Direito Do Trabalho": { icon: HardHat, gradient: "from-orange-900/90 to-orange-700/80", accent: "bg-orange-500" },
  "Direito Tributario": { icon: Coins, gradient: "from-emerald-900/90 to-emerald-700/80", accent: "bg-emerald-500" },
  "Direito Administrativo": { icon: Building2, gradient: "from-violet-900/90 to-violet-700/80", accent: "bg-violet-500" },
  "Direito Empresarial": { icon: Briefcase, gradient: "from-indigo-900/90 to-indigo-700/80", accent: "bg-indigo-500" },
  "Direito Financeiro": { icon: Coins, gradient: "from-teal-900/90 to-teal-700/80", accent: "bg-teal-500" },
  "Direito Ambiental": { icon: Leaf, gradient: "from-green-900/90 to-green-700/80", accent: "bg-green-500" },
  "Direito Internacional Público": { icon: Globe2, gradient: "from-sky-900/90 to-sky-700/80", accent: "bg-sky-500" },
  "Direito Internacional Privado": { icon: Globe2, gradient: "from-blue-900/90 to-slate-700/80", accent: "bg-slate-500" },
  "Direito Previndenciario": { icon: Heart, gradient: "from-pink-900/90 to-pink-700/80", accent: "bg-pink-500" },
  "Direito Processual Do Trabalho": { icon: Scale, gradient: "from-amber-900/90 to-orange-700/80", accent: "bg-orange-400" },
  "Direito Concorrencial": { icon: Trophy, gradient: "from-yellow-900/90 to-yellow-700/80", accent: "bg-yellow-500" },
  "Direito Desportivo": { icon: Trophy, gradient: "from-lime-900/90 to-lime-700/80", accent: "bg-lime-500" },
  "Direito Urbanistico": { icon: MapPin, gradient: "from-stone-800/90 to-stone-600/80", accent: "bg-stone-500" },
  "Direitos Humanos": { icon: Heart, gradient: "from-fuchsia-900/90 to-fuchsia-700/80", accent: "bg-fuchsia-500" },
  "Lei Penal Especial": { icon: Swords, gradient: "from-red-800/90 to-rose-700/80", accent: "bg-red-400" },
  "Teoria E Filosofia Do Direito": { icon: Brain, gradient: "from-purple-900/90 to-purple-700/80", accent: "bg-purple-500" },
  "Politicas Publicas": { icon: Megaphone, gradient: "from-blue-800/90 to-indigo-700/80", accent: "bg-blue-400" },
  "Portugues": { icon: BookOpen, gradient: "from-slate-800/90 to-slate-600/80", accent: "bg-slate-400" },
  "Pratica Profissional": { icon: Briefcase, gradient: "from-zinc-800/90 to-zinc-600/80", accent: "bg-zinc-400" },
  "Formação Complementar": { icon: GraduationCap, gradient: "from-neutral-800/90 to-neutral-600/80", accent: "bg-neutral-400" },
  "Revisão Oab": { icon: Scale, gradient: "from-amber-800/90 to-yellow-700/80", accent: "bg-amber-400" },
  "Pesquisa Científica": { icon: Brain, gradient: "from-indigo-800/90 to-blue-700/80", accent: "bg-indigo-400" },
};

const DEFAULT_CONFIG: AreaConfig = { icon: BookOpen, gradient: "from-gray-800/90 to-gray-600/80", accent: "bg-gray-500" };

export function getAreaConfig(area: string): AreaConfig {
  return AREA_CONFIGS[area] || DEFAULT_CONFIG;
}

interface AreaCardEstudosProps {
  area: string;
  totalLivros: number;
  capaUrl?: string | null;
  onClick: () => void;
}

export function AreaCardEstudos({ area, totalLivros, capaUrl, onClick }: AreaCardEstudosProps) {
  const config = getAreaConfig(area);
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-2xl border border-border/30 bg-card/80 hover:bg-card transition-all duration-200 active:scale-[0.98] group text-left"
    >
      {/* Capa colorida com ícone */}
      <div className={`relative w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br ${config.gradient} shadow-lg shine-effect`}>
        {capaUrl ? (
          <>
            <img src={capaUrl} alt={area} className="absolute inset-0 w-full h-full object-cover opacity-30" loading="lazy" />
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
          </>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-8 h-8 text-white/80" strokeWidth={1.5} />
        </div>
        {/* Barra de cor no topo */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${config.accent}`} />
      </div>

      {/* Informações */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {area}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalLivros} {totalLivros === 1 ? "livro" : "livros"}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </button>
  );
}
