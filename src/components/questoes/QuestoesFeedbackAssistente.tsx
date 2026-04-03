import { useState } from "react";
import { Bot, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PERGUNTAS = [
  { key: "geral", label: "📊 Como estou hoje?" },
  { key: "estudar", label: "📚 O que devo estudar?" },
  { key: "fortes", label: "💪 Meus pontos fortes" },
  { key: "melhorar", label: "⚠️ Onde preciso melhorar" },
  { key: "dica", label: "💡 Dica de estudo" },
];

interface QuestoesFeedbackAssistenteProps {
  onBack: () => void;
}

export const QuestoesFeedbackAssistente = ({ onBack }: QuestoesFeedbackAssistenteProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resposta, setResposta] = useState<string | null>(null);
  const [perguntaAtiva, setPerguntaAtiva] = useState<string | null>(null);

  const handlePergunta = async (key: string) => {
    if (!user || loading) return;
    setLoading(true);
    setPerguntaAtiva(key);
    setResposta(null);

    try {
      const { data, error } = await supabase.functions.invoke("questoes-feedback", {
        body: { tipo: key, user_id: user.id },
      });

      if (error) throw error;
      setResposta(data?.resposta || "Não foi possível gerar o feedback no momento.");
    } catch (e) {
      console.error("Erro no feedback:", e);
      setResposta("Ocorreu um erro ao gerar o feedback. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-6 space-y-4">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Menu</span>
      </button>

      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-violet-400" />
        <h2 className="text-base font-bold text-foreground">Assistente de Questões</h2>
      </div>

      <p className="text-xs text-muted-foreground">
        Escolha uma pergunta e receba uma análise personalizada do seu desempenho.
      </p>

      {/* Perguntas pré-prontas */}
      <div className="space-y-2">
        {PERGUNTAS.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePergunta(p.key)}
            disabled={loading}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
              perguntaAtiva === p.key
                ? "border-violet-500/50 bg-violet-500/10 text-foreground"
                : "border-border bg-card text-foreground hover:border-violet-500/30 hover:bg-violet-500/5"
            } disabled:opacity-50`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Resposta */}
      {(loading || resposta) && (
        <div className="bg-card border border-border rounded-xl p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analisando seu desempenho...</span>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground prose-strong:text-foreground prose-strong:font-bold prose-li:text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {resposta || ""}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
