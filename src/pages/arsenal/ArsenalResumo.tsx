import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArsenalConteudoInput } from "@/components/arsenal/ArsenalConteudoInput";
import { ArsenalResultadoViewer } from "@/components/arsenal/ArsenalResultadoViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tiposResumo = [
  { id: "simples", label: "Simples", desc: "Visão geral rápida", emoji: "📝" },
  { id: "aprofundado", label: "Aprofundado", desc: "Conceitos e exemplos detalhados", emoji: "🔬" },
  { id: "revisao", label: "Revisão Rápida", desc: "Bullet points essenciais para prova", emoji: "⚡" },
  { id: "mapa", label: "Mapa de Conceitos", desc: "Estrutura hierárquica", emoji: "🗺️" },
];

const ArsenalResumo = () => {
  const navigate = useNavigate();
  const [conteudo, setConteudo] = useState("");
  const [tipo, setTipo] = useState("simples");
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleGerar = async () => {
    if (!conteudo.trim()) {
      toast.error("Insira o conteúdo para gerar o resumo");
      return;
    }
    setCarregando(true);
    setResultado("");
    try {
      const { data, error } = await supabase.functions.invoke("arsenal-academico", {
        body: { ferramenta: "resumo", conteudo, opcoes: { tipo } },
      });
      if (error) throw error;
      setResultado(data.resultado || "");
    } catch (e) {
      toast.error("Erro ao gerar resumo. Tente novamente.");
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-1.5 bg-blue-500/20 rounded-lg"><FileText className="w-5 h-5 text-blue-400" /></div>
          <div>
            <h1 className="text-base font-bold text-foreground">Resumo Inteligente</h1>
            <p className="text-xs text-muted-foreground">Gere resumos personalizados com IA</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 max-w-2xl mx-auto w-full">
        {/* Conteúdo */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">1. Insira o conteúdo</h2>
          <ArsenalConteudoInput
            onConteudoChange={(c) => setConteudo(c)}
            placeholder="Cole seu texto, anotações de aula, trecho de lei..."
          />
        </div>

        {/* Tipo de resumo */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">2. Escolha o tipo de resumo</h2>
          <div className="grid grid-cols-2 gap-2">
            {tiposResumo.map((t) => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                  tipo === t.id
                    ? "border-blue-500/60 bg-blue-500/10"
                    : "border-border/50 bg-muted/30 hover:border-border"
                )}
              >
                <span className="text-lg mb-1">{t.emoji}</span>
                <span className="text-xs font-semibold text-foreground">{t.label}</span>
                <span className="text-[10px] text-muted-foreground leading-snug">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Botão Gerar */}
        <Button
          onClick={handleGerar}
          disabled={carregando || !conteudo.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {carregando ? "Gerando resumo..." : "Gerar Resumo"}
        </Button>

        {/* Resultado */}
        {resultado && (
          <ArsenalResultadoViewer
            conteudo={resultado}
            titulo="Resumo Gerado"
          />
        )}
      </div>
    </div>
  );
};

export default ArsenalResumo;
