import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Scan, ShieldAlert, Scale, Crown, Shield, Gavel, HandCoins, FileText, ScrollText, Zap, ChevronRight, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { toast } from "sonner";
import brasaoRepublica from "@/assets/brasao-republica.webp";

const CATEGORIAS = [
  { id: "constitucional", label: "Constitucional", icon: Crown, color: "bg-amber-500/20", iconColor: "text-amber-400" },
  { id: "codigos", label: "Códigos", icon: Scale, color: "bg-blue-500/20", iconColor: "text-blue-400" },
  { id: "penal", label: "Penal", icon: Shield, color: "bg-red-500/20", iconColor: "text-red-400" },
  { id: "estatutos", label: "Estatutos", icon: Gavel, color: "bg-emerald-500/20", iconColor: "text-emerald-400" },
  { id: "previdenciario", label: "Previdenciário", icon: HandCoins, color: "bg-purple-500/20", iconColor: "text-purple-400" },
  { id: "ordinarias", label: "Ordinárias", icon: FileText, color: "bg-cyan-500/20", iconColor: "text-cyan-400" },
  { id: "decretos", label: "Decretos", icon: ScrollText, color: "bg-orange-500/20", iconColor: "text-orange-400" },
  { id: "medidas_provisorias", label: "MPs", icon: Zap, color: "bg-pink-500/20", iconColor: "text-pink-400" },
];

const RaioXLegislativo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleImportAll = async () => {
    const categoriasParaImportar = ["constitucional", "codigos", "decretos"];
    for (const cat of categoriasParaImportar) {
      setImporting(cat);
      try {
        const { data, error } = await supabase.functions.invoke("importar-historico-raio-x", {
          body: { categoria: cat },
        });
        if (error) throw error;
        toast.success(`${cat}: ${data.importados} importados, ${data.existentes} já existiam`);
      } catch (err: any) {
        toast.error(`Erro ao importar ${cat}: ${err.message}`);
      }
    }
    setImporting(null);
    fetchCounts();
  };

  const fetchCounts = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("raio_x_legislativo" as any)
        .select("categoria")
        .limit(1000);
      if (error) throw error;

      const map: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const cat = row.categoria || "outros";
        map[cat] = (map[cat] || 0) + 1;
      });
      setCounts(map);
    } catch (err) {
      console.error("Erro ao buscar contagens:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <ShieldAlert className="w-16 h-16 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Acesso Restrito</h1>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Esta área é exclusiva para administradores.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          Voltar
        </button>
      </div>
    );
  }

  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StandardPageHeader
        title="Raio-X Legislativo"
        subtitle="Atualizações recentes na legislação"
        backPath="/vade-mecum"
        icon={<Scan className="w-5 h-5 text-primary" />}
      />

      <div className="bg-gradient-to-b from-card/80 to-background px-4 py-5 flex items-center gap-3 border-b border-border/20">
        <img
          src={brasaoRepublica}
          alt="Brasão"
          className="w-12 h-12 object-contain opacity-80"
        />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            Selecione uma categoria para ver a timeline de alterações legislativas.
          </p>
          {!isLoading && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              {totalItems} alteração{totalItems !== 1 ? "ões" : ""} registrada{totalItems !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {importing ? (
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-[11px]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Importando {importing}...
          </div>
        ) : (
          <button
            onClick={handleImportAll}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Importar Histórico
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card/50 rounded-2xl p-4 h-28 animate-pulse border border-border/30" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIAS.map((cat) => {
              const Icon = cat.icon;
              const count = counts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(cat.id === "codigos" ? `/vade-mecum/raio-x/codigos` : `/vade-mecum/raio-x/${cat.id}`)}
                  className="group bg-card/90 backdrop-blur-sm rounded-2xl p-4 text-left transition-all duration-150 hover:bg-card hover:scale-[1.02] border border-border/50 hover:border-primary/30 shadow-lg relative overflow-hidden"
                >
                  <div className={`${cat.color} rounded-xl p-2.5 w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 text-sm">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {count} alteraç{count !== 1 ? "ões" : "ão"}
                  </p>
                  <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RaioXLegislativo;
