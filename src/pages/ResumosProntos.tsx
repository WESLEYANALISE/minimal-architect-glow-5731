import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, FilePenLine, ArrowDownAZ, Clock, FileText, ChevronRight, Loader2, ArrowLeft, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { getAreaHex } from "@/lib/flashcardsAreaColors";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useResumosTemas } from "@/hooks/useResumosAreasCache";

const FREE_AREAS_RESUMOS = ["Direito Constitucional", "Direito Administrativo"];
const normalizeAreaResumo = (area: string) => area.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const isAreaFreeResumo = (area: string) => FREE_AREAS_RESUMOS.some(f => normalizeAreaResumo(f) === normalizeAreaResumo(area));

const ResumosProntos = () => {
  const navigate = useNavigate();
  const { area: areaFromUrl } = useParams<{ area: string }>();
  const areaSelecionada = areaFromUrl ? decodeURIComponent(areaFromUrl) : null;
  const [searchTema, setSearchTema] = useState("");
  const [ordenacaoTemas, setOrdenacaoTemas] = useState<"cronologica" | "alfabetica">("cronologica");
  const debouncedSearch = useDebounce(searchTema, 300);
  const { isPremium } = useSubscription();

  const hex = areaSelecionada ? getAreaHex(areaSelecionada) : "#64748b";

  useEffect(() => {
    if (!areaFromUrl) navigate('/resumos-juridicos', { replace: true });
  }, [areaFromUrl, navigate]);

  const { temas, isLoading, totalResumos } = useResumosTemas(areaSelecionada || '');

  const temasFiltrados = useMemo(() => {
    if (!temas) return [];
    let filtered = temas;
    if (debouncedSearch.trim()) {
      filtered = filtered.filter(t => t.tema.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }
    if (ordenacaoTemas === "alfabetica") {
      return [...filtered].sort((a, b) => a.tema.localeCompare(b.tema));
    }
    return filtered;
  }, [temas, debouncedSearch, ordenacaoTemas]);

  if (!areaSelecionada) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/resumos-juridicos/temas?area=${encodeURIComponent(areaSelecionada)}`)}
              className="shrink-0 bg-black/80 backdrop-blur-sm hover:bg-black border border-white/20 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{areaSelecionada}</h1>
              <p className="text-xs text-muted-foreground">
                {totalResumos} resumos · {temasFiltrados.length} temas
              </p>
            </div>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar temas..."
              value={searchTema}
              onChange={(e) => setSearchTema(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50 rounded-xl h-10 text-sm"
            />
          </div>

          <div className="flex gap-1 bg-secondary/50 p-0.5 rounded-lg">
            <button
              onClick={() => setOrdenacaoTemas("cronologica")}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all font-medium"
              style={ordenacaoTemas === "cronologica" ? { backgroundColor: hex, color: "white" } : {}}
            >
              <Clock className="w-3.5 h-3.5" />
              Cronológica
            </button>
            <button
              onClick={() => setOrdenacaoTemas("alfabetica")}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-all font-medium"
              style={ordenacaoTemas === "alfabetica" ? { backgroundColor: hex, color: "white" } : {}}
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              Alfabética
            </button>
          </div>
        </div>
      </div>

      {/* Lista de temas */}
      <div className="px-4 pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: hex }} />
          </div>
        ) : temasFiltrados.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Nenhum tema encontrado
          </div>
        ) : (
          <div className="space-y-2">
            {temasFiltrados.map((tema, index) => {
              const ordemNum = parseInt(tema.ordem) || (index + 1);
              const lockedFrom20 = Math.max(1, Math.ceil(temasFiltrados.length * 0.20));
              const isLockedTema = !isPremium && index >= lockedFrom20;
              return (
                <button
                  key={tema.tema}
                  onClick={() => isLockedTema
                    ? navigate('/assinatura')
                    : navigate(`/resumos-juridicos/prontos/${encodeURIComponent(areaSelecionada)}/${encodeURIComponent(tema.tema)}`)
                  }
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:bg-accent/30 transition-all duration-200 active:scale-[0.98] group"
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${hex}50`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
                >
                  <div
                    className="relative w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isLockedTema ? 'rgba(180,130,0,0.12)' : `${hex}15` }}
                  >
                    <FilePenLine className="w-6 h-6" style={{ color: isLockedTema ? '#f59e0b' : hex }} />
                    <div
                      className="absolute -bottom-1 -left-1 w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: isLockedTema ? 'rgba(180,130,0,0.9)' : hex }}
                    >
                      <span className="text-[9px] font-bold text-white">
                        {String(ordemNum).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                      {tema.tema}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {tema.count} {tema.count === 1 ? "resumo" : "resumos"}
                      </span>
                    </div>
                  </div>

                  {isLockedTema ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: "rgba(180,130,0,0.92)",
                        border: "2px solid #f59e0b",
                        boxShadow: "0 0 12px rgba(245,158,11,0.7)"
                      }}
                    >
                      <Lock className="w-4 h-4 text-amber-300" />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-colors" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumosProntos;
