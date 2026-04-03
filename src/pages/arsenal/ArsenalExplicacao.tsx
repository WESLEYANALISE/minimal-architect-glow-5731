import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArsenalConteudoInput } from "@/components/arsenal/ArsenalConteudoInput";
import { ArsenalResultadoViewer } from "@/components/arsenal/ArsenalResultadoViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const estilos = [
  { id: "iniciante", label: "Para Iniciante", emoji: "🌱", desc: "Sem jargões, linguagem simples" },
  { id: "preprova", label: "Revisão Pré-Prova", emoji: "📋", desc: "Direto ao ponto, o que cai" },
  { id: "analogias", label: "Com Analogias", emoji: "🧩", desc: "Exemplos do cotidiano" },
  { id: "semjargoes", label: "Sem Jargões", emoji: "💬", desc: "Substituindo termos técnicos" },
];

const ArsenalExplicacao = () => {
  const navigate = useNavigate();
  const [conteudo, setConteudo] = useState("");
  const [estilo, setEstilo] = useState("iniciante");
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleGerar = async () => {
    if (!conteudo.trim()) { toast.error("Insira o conteúdo"); return; }
    setCarregando(true);
    setResultado("");
    try {
      const { data, error } = await supabase.functions.invoke("arsenal-academico", {
        body: { ferramenta: "explicacao", conteudo, opcoes: { estilo } },
      });
      if (error) throw error;
      setResultado(data.resultado || "");
    } catch (e) {
      toast.error("Erro ao gerar explicação");
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
          <div className="p-1.5 bg-cyan-500/20 rounded-lg"><BookOpen className="w-5 h-5 text-cyan-400" /></div>
          <div>
            <h1 className="text-base font-bold text-foreground">Explicação Simplificada</h1>
            <p className="text-xs text-muted-foreground">IA explica do seu jeito</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 max-w-2xl mx-auto w-full">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">1. Conteúdo a explicar</h2>
          <ArsenalConteudoInput onConteudoChange={(c) => setConteudo(c)} placeholder="Cole o texto, conceito ou trecho que deseja entender melhor..." />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">2. Escolha o estilo de explicação</h2>
          <div className="grid grid-cols-2 gap-2">
            {estilos.map((e) => (
              <button key={e.id} onClick={() => setEstilo(e.id)}
                className={cn("flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                  estilo === e.id ? "border-cyan-500/60 bg-cyan-500/10" : "border-border/50 bg-muted/30")}>
                <span className="text-xl mb-1">{e.emoji}</span>
                <span className="text-xs font-semibold text-foreground">{e.label}</span>
                <span className="text-[10px] text-muted-foreground leading-snug">{e.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleGerar} disabled={carregando || !conteudo.trim()} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {carregando ? "Explicando..." : "Gerar Explicação"}
        </Button>

        {resultado && (
          <ArsenalResultadoViewer conteudo={resultado} titulo="Explicação Gerada" />
        )}
      </div>
    </div>
  );
};

export default ArsenalExplicacao;
