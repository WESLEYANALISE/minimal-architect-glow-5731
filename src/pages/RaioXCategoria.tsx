import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Scale, Crown, Shield, Gavel, HandCoins, FileText, ScrollText, Zap, ShieldAlert, BookOpen, Briefcase, ShoppingCart, Landmark, Car, Vote, Swords, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { StandardPageHeader } from "@/components/StandardPageHeader";
import { RaioXTimeline } from "@/components/raio-x/RaioXTimeline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subDays, format } from "date-fns";

const CATEGORIAS_MAP: Record<string, { label: string; icon: React.ElementType; iconColor: string }> = {
  constitucional: { label: "Constitucional", icon: Crown, iconColor: "text-amber-400" },
  codigos: { label: "Códigos", icon: Scale, iconColor: "text-blue-400" },
  penal: { label: "Penal", icon: Shield, iconColor: "text-red-400" },
  estatutos: { label: "Estatutos", icon: Gavel, iconColor: "text-emerald-400" },
  previdenciario: { label: "Previdenciário", icon: HandCoins, iconColor: "text-purple-400" },
  ordinarias: { label: "Ordinárias", icon: FileText, iconColor: "text-cyan-400" },
  decretos: { label: "Decretos", icon: ScrollText, iconColor: "text-orange-400" },
  medidas_provisorias: { label: "MPs", icon: Zap, iconColor: "text-pink-400" },
};

const SUBCODIGOS_MAP: Record<string, { label: string; sigla: string; filtros: string[]; icon: React.ElementType; iconColor: string }> = {
  cp: { label: "Código Penal", sigla: "CP", filtros: ["2.848", "Código Penal"], icon: Shield, iconColor: "text-red-400" },
  cc: { label: "Código Civil", sigla: "CC", filtros: ["10.406", "Código Civil"], icon: BookOpen, iconColor: "text-blue-400" },
  cpc: { label: "Código de Processo Civil", sigla: "CPC", filtros: ["13.105", "Processo Civil"], icon: Gavel, iconColor: "text-emerald-400" },
  cpp: { label: "Código de Processo Penal", sigla: "CPP", filtros: ["3.689", "Processo Penal"], icon: Swords, iconColor: "text-orange-400" },
  clt: { label: "CLT", sigla: "CLT", filtros: ["5.452", "Leis do Trabalho"], icon: Briefcase, iconColor: "text-amber-400" },
  cdc: { label: "Código de Defesa do Consumidor", sigla: "CDC", filtros: ["8.078", "Defesa do Consumidor"], icon: ShoppingCart, iconColor: "text-cyan-400" },
  ctn: { label: "Código Tributário Nacional", sigla: "CTN", filtros: ["5.172", "Tributário Nacional"], icon: Landmark, iconColor: "text-purple-400" },
  ctb: { label: "Código de Trânsito", sigla: "CTB", filtros: ["9.503", "Trânsito"], icon: Car, iconColor: "text-pink-400" },
  ce: { label: "Código Eleitoral", sigla: "CE", filtros: ["4.737", "Eleitoral"], icon: Vote, iconColor: "text-teal-400" },
  cpm: { label: "Código Penal Militar", sigla: "CPM", filtros: ["1.001", "Penal Militar"], icon: Flag, iconColor: "text-slate-400" },
};

const PERIODOS = [
  { value: "todos", label: "Desde o início" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
];

const RaioXCategoria = () => {
  const { categoria, subcodigo } = useParams<{ categoria?: string; subcodigo?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("todos");
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Determine what we're showing
  const subConfig = subcodigo ? SUBCODIGOS_MAP[subcodigo] : null;
  const catConfig = subConfig
    ? { label: subConfig.sigla, icon: subConfig.icon, iconColor: subConfig.iconColor }
    : categoria ? CATEGORIAS_MAP[categoria] : null;

  const effectiveCategoria = subcodigo ? "codigos" : categoria;

  const fetchData = useCallback(async () => {
    if (!isAdmin || !effectiveCategoria) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from("raio_x_legislativo" as any)
        .select("*, resenha_diaria(id, numero_lei, ementa, data_publicacao, url_planalto, artigos, texto_formatado, explicacao_lei)")
        .eq("categoria", effectiveCategoria)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (periodo !== "todos") {
        const dataLimite = format(subDays(new Date(), parseInt(periodo)), "yyyy-MM-dd");
        query = query.gte("created_at", dataLimite);
      }

      // Filter by specific code if subcodigo is set (OR across multiple filter terms)
      if (subConfig) {
        const orFilter = subConfig.filtros.map(f => `lei_afetada.ilike.%${f}%`).join(',');
        query = query.or(orFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Erro ao buscar raio-x:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCategoria, subcodigo, periodo, isAdmin, subConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <ShieldAlert className="w-16 h-16 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Acesso Restrito</h1>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Voltar
        </button>
      </div>
    );
  }

  if (!catConfig) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground">Categoria não encontrada</p>
        <button onClick={() => navigate("/vade-mecum/raio-x")} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          Voltar
        </button>
      </div>
    );
  }

  const Icon = catConfig.icon;
  const backPath = subcodigo ? "/vade-mecum/raio-x/codigos" : "/vade-mecum/raio-x";
  const subtitle = subConfig ? subConfig.label : "Timeline de alterações";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StandardPageHeader
        title={catConfig.label}
        subtitle={subtitle}
        backPath={backPath}
        icon={<Icon className={`w-5 h-5 ${catConfig.iconColor}`} />}
      />

      <div className="px-4 py-3 border-b border-border/20">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-44 h-8 text-xs bg-card border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map((p) => (
              <SelectItem key={p.value} value={p.value} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 px-4 py-4 pb-24 overflow-y-auto">
        <RaioXTimeline items={items} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default RaioXCategoria;
