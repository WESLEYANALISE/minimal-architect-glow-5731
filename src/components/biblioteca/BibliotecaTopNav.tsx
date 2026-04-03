import { BookOpen, Target, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export type BibliotecaTab = "acervo" | "plano" | "favoritos";

const tabs = [
  { key: "acervo" as const, label: "Acervo", icon: BookOpen },
  { key: "plano" as const, label: "Plano", icon: Target },
  { key: "favoritos" as const, label: "Favoritos", icon: Heart },
];

interface BibliotecaTopNavProps {
  activeTab: BibliotecaTab;
  onTabChange?: (tab: BibliotecaTab) => void;
}

export const BibliotecaTopNav = ({ activeTab, onTabChange }: BibliotecaTopNavProps) => {
  return (
    <div className="px-4 lg:px-8 pb-2">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-neutral-800/80 border border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange?.(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center",
                  isActive
                    ? "bg-amber-500/20 text-amber-400 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
