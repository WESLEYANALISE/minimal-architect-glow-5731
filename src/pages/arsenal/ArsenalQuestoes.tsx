import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Loader2, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArsenalConteudoInput } from "@/components/arsenal/ArsenalConteudoInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tiposQuestao = [
  { id: "multipla", label: "Múltipla Escolha OAB", emoji: "⚖️" },
  { id: "concurso", label: "Estilo Concurso", emoji: "🏛️" },
  { id: "vf", label: "Verdadeiro ou Falso", emoji: "✅" },
];

const dificuldades = [
  { id: "facil", label: "Fácil", emoji: "🟢" },
  { id: "medio", label: "Médio", emoji: "🟡" },
  { id: "dificil", label: "Difícil", emoji: "🔴" },
];

interface Alternativa { letra: string; texto: string; }
interface Questao {
  id: number;
  enunciado: string;
  alternativas: Alternativa[];
  gabarito: string;
  explicacao: string;
}

const ArsenalQuestoes = () => {
  const navigate = useNavigate();
  const [conteudo, setConteudo] = useState("");
  const [tipo, setTipo] = useState("multipla");
  const [dificuldade, setDificuldade] = useState("medio");
  const [quantidade, setQuantidade] = useState(5);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [mostrarGabarito, setMostrarGabarito] = useState<Record<number, boolean>>({});
  const [carregando, setCarregando] = useState(false);

  const handleGerar = async () => {
    if (!conteudo.trim()) { toast.error("Insira o conteúdo"); return; }
    setCarregando(true);
    setQuestoes([]);
    setRespostas({});
    setMostrarGabarito({});
    try {
      const { data, error } = await supabase.functions.invoke("arsenal-academico", {
        body: { ferramenta: "questoes", conteudo, opcoes: { tipo, dificuldade, quantidade } },
      });
      if (error) throw error;
      setQuestoes(data.resultado?.questoes || []);
    } catch (e) {
      toast.error("Erro ao gerar questões");
    } finally {
      setCarregando(false);
    }
  };

  const handleResponder = (questaoId: number, letra: string) => {
    if (respostas[questaoId]) return; // Já respondeu
    setRespostas(prev => ({ ...prev, [questaoId]: letra }));
    setMostrarGabarito(prev => ({ ...prev, [questaoId]: true }));
  };

  const acertos = questoes.filter(q => respostas[q.id] === q.gabarito).length;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-1.5 bg-orange-500/20 rounded-lg"><HelpCircle className="w-5 h-5 text-orange-400" /></div>
          <div>
            <h1 className="text-base font-bold text-foreground">Gerador de Questões</h1>
            <p className="text-xs text-muted-foreground">Quiz interativo com feedback</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 max-w-2xl mx-auto w-full">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">1. Conteúdo</h2>
          <ArsenalConteudoInput onConteudoChange={(c) => setConteudo(c)} />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">2. Tipo de questão</h2>
          <div className="flex flex-col gap-2">
            {tiposQuestao.map((t) => (
              <button key={t.id} onClick={() => setTipo(t.id)}
                className={cn("flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  tipo === t.id ? "border-orange-500/60 bg-orange-500/10" : "border-border/50 bg-muted/30")}>
                <span>{t.emoji}</span>
                <span className="text-sm font-medium text-foreground">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">3. Dificuldade</h2>
            <div className="flex flex-col gap-1.5">
              {dificuldades.map((d) => (
                <button key={d.id} onClick={() => setDificuldade(d.id)}
                  className={cn("flex items-center gap-2 p-2 rounded-lg border text-xs transition-all",
                    dificuldade === d.id ? "border-orange-500/60 bg-orange-500/10" : "border-border/50 bg-muted/30")}>
                  <span>{d.emoji}</span><span className="font-medium text-foreground">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">4. Quantidade</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {[5, 10, 15, 20].map((q) => (
                <button key={q} onClick={() => setQuantidade(q)}
                  className={cn("py-2 rounded-lg text-xs font-medium border transition-all",
                    quantidade === q ? "border-orange-500/60 bg-orange-500/10 text-orange-400" : "border-border/50 bg-muted/30 text-muted-foreground")}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleGerar} disabled={carregando || !conteudo.trim()} className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {carregando ? "Gerando questões..." : "Gerar Questões"}
        </Button>

        {/* Resultado */}
        {questoes.length > 0 && (
          <div className="space-y-4">
            {Object.keys(respostas).length === questoes.length && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{acertos}/{questoes.length}</p>
                <p className="text-sm text-muted-foreground">Acertos ({Math.round(acertos / questoes.length * 100)}%)</p>
              </div>
            )}

            {questoes.map((q, idx) => (
              <div key={q.id} className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-orange-400 bg-orange-500/10 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                  <p className="text-sm text-foreground leading-relaxed">{q.enunciado}</p>
                </div>
                <div className="space-y-2 pl-8">
                  {q.alternativas?.map((alt) => {
                    const respondeu = !!respostas[q.id];
                    const selecionada = respostas[q.id] === alt.letra;
                    const correta = q.gabarito === alt.letra;
                    return (
                      <button key={alt.letra} onClick={() => handleResponder(q.id, alt.letra)} disabled={respondeu}
                        className={cn("w-full flex items-start gap-2 p-2.5 rounded-lg border text-left text-xs transition-all",
                          !respondeu ? "border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40" :
                          correta ? "border-green-500/60 bg-green-500/10" :
                          selecionada ? "border-red-500/60 bg-red-500/10" : "border-border/30 bg-muted/10 opacity-60")}>
                        <span className="font-bold text-foreground/70">{alt.letra})</span>
                        <span className="text-foreground/90 flex-1">{alt.texto}</span>
                        {respondeu && correta && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                        {respondeu && selecionada && !correta && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {mostrarGabarito[q.id] && (
                  <div className="pl-8 bg-muted/20 rounded-lg p-2.5">
                    <p className="text-[11px] text-muted-foreground"><span className="text-green-400 font-semibold">Gabarito: {q.gabarito}</span> — {q.explicacao}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArsenalQuestoes;
