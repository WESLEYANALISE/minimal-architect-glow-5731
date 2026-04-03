import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, X, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";

interface AulaFloatingCardProps {
  onClose: () => void;
}

const SUGESTOES = [
  "Direito Penal - Legítima Defesa",
  "Direito Civil - Contratos",
  "Direito Constitucional - Direitos Fundamentais",
  "Direito Trabalhista - Rescisão",
  "Direito Administrativo - Licitações",
  "Direito do Consumidor - CDC",
];

export const AulaFloatingCard = ({ onClose }: AulaFloatingCardProps) => {
  const navigate = useNavigate();
  const [tema, setTema] = useState("");
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [aulaGerada, setAulaGerada] = useState<any>(null);

  const handleGerar = async () => {
    if (!tema.trim()) return;
    setLoading(true);
    setProgresso(5);
    setMensagem("Iniciando geração da aula...");
    setAulaGerada(null);

    try {
      setProgresso(10);
      setMensagem("Preparando estrutura da aula...");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-aula-streaming`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ tema }),
        }
      );

      if (!response.ok) throw new Error("Erro ao gerar aula");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Sem reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "progress") {
              setProgresso(parsed.progress || 0);
              setMensagem(parsed.message || "Gerando conteúdo...");
            } else if (parsed.type === "complete" && parsed.estrutura) {
              setProgresso(100);
              setMensagem("Aula pronta! 🎓");
              setAulaGerada(parsed.estrutura);
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error("Erro ao gerar aula:", error);
      setMensagem("Erro ao gerar aula. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleIrParaAula = () => {
    if (aulaGerada) {
      sessionStorage.setItem("aulaGerada", JSON.stringify(aulaGerada));
      navigate("/aula-interativa");
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground">Criar Aula Interativa</h3>
          </div>
          <button
            onClick={() => !loading && onClose()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!loading && !aulaGerada && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Qual tema deseja estudar?
                </label>
                <Textarea
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ex: Legítima defesa no Direito Penal..."
                  className="min-h-[80px] bg-muted/50 border-border"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Sugestões rápidas:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setTema(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground/80 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGerar}
                disabled={!tema.trim()}
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Gerar Aula
              </Button>
            </>
          )}

          {loading && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground">{mensagem}</p>
              </div>
              <Progress value={progresso} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">{progresso}% concluído</p>
            </div>
          )}

          {aulaGerada && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="w-8 h-8 text-blue-500" />
                </div>
                <h4 className="font-semibold text-foreground text-lg">Aula Pronta! 🎓</h4>
                <p className="text-sm text-muted-foreground mt-1">Sua aula interativa foi gerada com sucesso.</p>
              </div>
              <Button
                onClick={handleIrParaAula}
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium gap-2"
              >
                <GraduationCap className="w-5 h-5" />
                Ver Aula Pronta
                <ExternalLink className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};