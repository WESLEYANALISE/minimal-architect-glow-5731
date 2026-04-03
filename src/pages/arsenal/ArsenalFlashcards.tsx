import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Layers, Loader2, Sparkles, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArsenalConteudoInput } from "@/components/arsenal/ArsenalConteudoInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactCardFlip from "react-card-flip";

const tipos = [
  { id: "conceitual", label: "Conceitual", emoji: "🧠", desc: "Definições e conceitos" },
  { id: "comparativo", label: "Comparativo", emoji: "⚖️", desc: "Comparação de institutos" },
  { id: "exemplos", label: "Exemplos Práticos", emoji: "📚", desc: "Casos de aplicação" },
  { id: "memorizacao", label: "Memorização Ativa", emoji: "🎯", desc: "Datas, artigos, números" },
];

interface Flashcard {
  id: number;
  frente: string;
  verso: string;
  dica?: string;
}

const ArsenalFlashcards = () => {
  const navigate = useNavigate();
  const [conteudo, setConteudo] = useState("");
  const [tipo, setTipo] = useState("conceitual");
  const [quantidade, setQuantidade] = useState(10);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [carregando, setCarregando] = useState(false);

  const handleGerar = async () => {
    if (!conteudo.trim()) { toast.error("Insira o conteúdo"); return; }
    setCarregando(true);
    setCards([]);
    setFlipped({});
    try {
      const { data, error } = await supabase.functions.invoke("arsenal-academico", {
        body: { ferramenta: "flashcards", conteudo, opcoes: { tipo, quantidade } },
      });
      if (error) throw error;
      setCards(data.resultado?.flashcards || []);
    } catch (e) {
      toast.error("Erro ao gerar flashcards");
    } finally {
      setCarregando(false);
    }
  };

  const handleFlip = (id: number) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const exportarAnki = () => {
    const texto = cards.map(c => `${c.frente} :: ${c.verso}`).join("\n");
    const blob = new Blob([texto], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "flashcards-anki.txt"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado no formato Anki!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-1.5 bg-purple-500/20 rounded-lg"><Layers className="w-5 h-5 text-purple-400" /></div>
          <div>
            <h1 className="text-base font-bold text-foreground">Gerador de Flashcards</h1>
            <p className="text-xs text-muted-foreground">Estilo Anki com IA</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5 max-w-2xl mx-auto w-full">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">1. Conteúdo</h2>
          <ArsenalConteudoInput onConteudoChange={(c) => setConteudo(c)} placeholder="Cole o conteúdo para gerar os flashcards..." />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">2. Tipo de flashcard</h2>
          <div className="grid grid-cols-2 gap-2">
            {tipos.map((t) => (
              <button key={t.id} onClick={() => setTipo(t.id)}
                className={cn("flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                  tipo === t.id ? "border-purple-500/60 bg-purple-500/10" : "border-border/50 bg-muted/30")}>
                <span className="text-lg">{t.emoji}</span>
                <span className="text-xs font-semibold text-foreground">{t.label}</span>
                <span className="text-[10px] text-muted-foreground">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">3. Quantidade: <span className="text-purple-400">{quantidade} cards</span></h2>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((q) => (
              <button key={q} onClick={() => setQuantidade(q)}
                className={cn("flex-1 py-2 rounded-lg text-xs font-medium border transition-all",
                  quantidade === q ? "border-purple-500/60 bg-purple-500/10 text-purple-400" : "border-border/50 bg-muted/30 text-muted-foreground")}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleGerar} disabled={carregando || !conteudo.trim()} className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2">
          {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {carregando ? "Gerando flashcards..." : "Gerar Flashcards"}
        </Button>

        {/* Resultado */}
        {cards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">{cards.length} Flashcards gerados</h3>
              <Button variant="outline" size="sm" onClick={exportarAnki} className="h-8 text-xs gap-1.5">
                <Download className="w-3.5 h-3.5" /> Exportar Anki
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Toque em um card para revelar a resposta</p>
            <div className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} onClick={() => handleFlip(card.id)} className="cursor-pointer">
                  <ReactCardFlip isFlipped={!!flipped[card.id]} flipDirection="vertical">
                    {/* Frente */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-700/10 border border-purple-500/30 rounded-xl p-4 min-h-[80px] flex flex-col justify-between">
                      <span className="text-[10px] text-purple-400 font-medium uppercase tracking-wide">Pergunta</span>
                      <p className="text-sm text-foreground font-medium mt-1">{card.frente}</p>
                      <span className="text-[10px] text-muted-foreground mt-2">Toque para ver a resposta →</span>
                    </div>
                    {/* Verso */}
                    <div className="bg-gradient-to-br from-green-500/10 to-green-700/10 border border-green-500/30 rounded-xl p-4 min-h-[80px] flex flex-col justify-between">
                      <span className="text-[10px] text-green-400 font-medium uppercase tracking-wide">Resposta</span>
                      <p className="text-sm text-foreground mt-1">{card.verso}</p>
                      {card.dica && <p className="text-[11px] text-amber-400 italic mt-1">💡 {card.dica}</p>}
                    </div>
                  </ReactCardFlip>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={() => { setCards([]); setFlipped({}); }} className="w-full text-sm gap-2">
              <RotateCcw className="w-4 h-4" /> Gerar novos flashcards
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArsenalFlashcards;
