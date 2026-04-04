import { useState, startTransition } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Target, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuestoesTemas } from "@/hooks/useQuestoesTemas";
import { DotPattern } from "@/components/ui/dot-pattern";

const QuestoesTemasNovo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const { temas, isLoading } = useQuestoesTemas(area);
  const [searchQuery, setSearchQuery] = useState("");

  const shortArea = area
    .replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '')
    .replace(/^Direitos\s+/i, '');

  const filtered = searchQuery
    ? temas.filter(t => t.tema.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(
        searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      ))
    : temas;

  const handleSelect = (tema: string) => {
    startTransition(() => {
      navigate(`/ferramentas/questoes/resolver?area=${encodeURIComponent(area)}&tema=${encodeURIComponent(tema)}`);
    });
  };

  return (
    <div className="min-h-screen relative" style={{ background: "hsl(0 0% 10%)" }}>
      <DotPattern className="opacity-[0.03]" />

      {/* Header */}
      <div
        className="relative overflow-hidden rounded-b-3xl mb-4"
        style={{
          background: "linear-gradient(145deg, hsl(345 65% 30%), hsl(350 50% 22%), hsl(350 40% 15%))",
        }}
      >
        <Target className="absolute -right-4 -bottom-4 text-white pointer-events-none" style={{ width: 90, height: 90, opacity: 0.05 }} />
        <div className="absolute top-4 right-8 w-2 h-2 rounded-full" style={{ background: "hsl(40, 80%, 55%)", opacity: 0.3, boxShadow: "0 0 12px hsl(40, 80%, 55%)" }} />

        <div className="relative z-10 px-4 pt-3 pb-5">
          <button onClick={() => navigate("/ferramentas/questoes-v2")} className="flex items-center gap-2 mb-3 group">
            <ArrowLeft className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Questões</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: "hsla(40, 60%, 50%, 0.15)",
                border: "1px solid hsla(40, 60%, 50%, 0.25)",
              }}
            >
              <Target className="w-5 h-5" style={{ color: "hsl(40, 80%, 55%)" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">{shortArea}</h1>
              <p className="text-xs" style={{ color: "hsla(40, 60%, 70%, 0.7)" }}>
                {temas.length} temas disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <input
          type="text"
          placeholder="Buscar tema..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
          style={{
            background: "hsla(0, 0%, 100%, 0.05)",
            border: "1px solid hsla(40, 60%, 50%, 0.12)",
          }}
        />
      </div>

      {/* Temas list */}
      <div className="px-4 pb-8 space-y-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "hsla(0, 0%, 100%, 0.04)" }} />
          ))
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: "hsla(0, 0%, 100%, 0.4)" }}>
            Nenhum tema encontrado
          </p>
        ) : (
          filtered.map((tema, i) => (
            <motion.button
              key={tema.tema}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => handleSelect(tema.tema)}
              className="w-full group flex items-center gap-3 rounded-xl p-3.5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "hsla(0, 0%, 100%, 0.04)",
                border: "1px solid hsla(40, 60%, 50%, 0.08)",
              }}
            >
              {/* Status indicator */}
              <div className="shrink-0">
                {tema.temQuestoes ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color: "hsl(145, 60%, 45%)" }} />
                ) : tema.parcial ? (
                  <AlertCircle className="w-5 h-5" style={{ color: "hsl(40, 80%, 55%)" }} />
                ) : (
                  <div className="w-5 h-5 rounded-full" style={{ border: "2px solid hsla(0, 0%, 100%, 0.15)" }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{tema.tema}</h3>
                <p className="text-[10px] mt-0.5" style={{ color: "hsla(40, 60%, 70%, 0.5)" }}>
                  {tema.totalQuestoes > 0
                    ? `${tema.totalQuestoes} questões • ${tema.subtemasGerados}/${tema.totalSubtemas} subtemas`
                    : `${tema.totalSubtemas} subtemas`
                  }
                </p>
              </div>

              {/* Progress */}
              {tema.progressoPercent > 0 && (
                <span className="text-[11px] font-semibold shrink-0" style={{ color: "hsl(40, 80%, 55%)" }}>
                  {tema.progressoPercent}%
                </span>
              )}

              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "hsla(0, 0%, 100%, 0.15)" }} />
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestoesTemasNovo;
