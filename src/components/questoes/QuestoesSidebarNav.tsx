import { useNavigate, useLocation } from "react-router-dom";
import { Search, BarChart3, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { QuestoesProgressoSheet } from "./QuestoesProgressoSheet";

interface QuestoesSidebarNavProps {
  onPesquisar?: () => void;
  onDiagnostico?: () => void;
}

export const QuestoesSidebarNav = ({ onPesquisar, onDiagnostico }: QuestoesSidebarNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progressoOpen, setProgressoOpen] = useState(false);

  const handlePesquisar = () => {
    if (location.pathname !== "/ferramentas/questoes") {
      navigate("/ferramentas/questoes?tab=pesquisar");
    } else {
      onPesquisar?.();
    }
  };

  const navItems = [
    {
      icon: Search,
      label: "Pesquisar",
      onClick: handlePesquisar,
    },
    {
      icon: BarChart3,
      label: "Progresso",
      onClick: () => setProgressoOpen(true),
      highlight: true,
    },
    {
      icon: Stethoscope,
      label: "Diagnóstico",
      onClick: () => onDiagnostico?.(),
    },
  ];

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[88px] shrink-0 bg-card border-r border-border h-full">
        <div className="flex flex-col items-center gap-1 py-4 px-2 flex-1">
          {navItems.map(({ icon: Icon, label, onClick, highlight }) => (
            <button
              key={label}
              onClick={onClick}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all",
                highlight
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              {highlight ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
      </aside>

      <QuestoesProgressoSheet open={progressoOpen} onOpenChange={setProgressoOpen} />
    </>
  );
};
