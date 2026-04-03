import { useState, useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { FlashcardViewer } from "@/components/FlashcardViewer";

export type PraticaTipo = 
  | "flashcard_conceito" | "flashcard_lacuna" | "flashcard_correspondencia"
  | "questao_alternativa" | "questao_sim_nao" | "questao_caso_pratico";

interface PraticaArtigoModalProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
  codigoTabela: string;
  tipo: PraticaTipo;
}

const TIPO_LABELS: Record<PraticaTipo, { emoji: string; title: string }> = {
  flashcard_conceito: { emoji: "🎴", title: "Flashcards - Conceitos" },
  flashcard_lacuna: { emoji: "✏️", title: "Flashcards - Lacunas" },
  flashcard_correspondencia: { emoji: "🔗", title: "Flashcards - Correspondência" },
  questao_alternativa: { emoji: "📝", title: "Questões - Alternativas" },
  questao_sim_nao: { emoji: "✅", title: "Questões - Sim ou Não" },
  questao_caso_pratico: { emoji: "⚖️", title: "Questões - Caso Prático" },
};

// Simple Quiz Viewer for questoes
const QuizViewer = ({ questoes, tipo }: { questoes: any[]; tipo: PraticaTipo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = questoes[currentIndex];
  if (!current) return null;

  const handleAnswer = (index: number | boolean) => {
    if (selectedAnswer !== null || showExplanation) return;
    
    let isCorrect = false;
    if (tipo === "questao_sim_nao") {
      const boolAnswer = index === 0; // 0 = true (Certo), 1 = false (Errado)
      isCorrect = boolAnswer === current.correta;
      setSelectedAnswer(index as number);
    } else {
      isCorrect = index === current.resposta_correta;
      setSelectedAnswer(index as number);
    }
    
    setShowExplanation(true);
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentIndex(prev => Math.min(prev + 1, questoes.length - 1));
  };

  if (tipo === "questao_sim_nao") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>{currentIndex + 1} de {questoes.length}</span>
          <span>✅ {score.correct}/{score.total}</span>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 border border-border">
          <p className="text-base font-medium leading-relaxed">{current.afirmacao}</p>
          {current.exemplo && (
            <p className="text-sm text-muted-foreground mt-2 italic">💡 {current.exemplo}</p>
          )}
        </div>
        {!showExplanation ? (
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handleAnswer(0)} variant="outline" className="h-14 text-base border-green-500/30 hover:bg-green-500/10">
              ✅ Certo
            </Button>
            <Button onClick={() => handleAnswer(1)} variant="outline" className="h-14 text-base border-red-500/30 hover:bg-red-500/10">
              ❌ Errado
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className={`p-3 rounded-lg border ${
              (selectedAnswer === 0) === current.correta 
                ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
            }`}>
              <p className="font-semibold text-sm">
                {(selectedAnswer === 0) === current.correta ? '✅ Acertou!' : '❌ Errou!'}
              </p>
              <p className="text-sm mt-1">{current.explicacao}</p>
            </div>
            {currentIndex < questoes.length - 1 && (
              <Button onClick={nextQuestion} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                Próxima →
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // questao_alternativa or questao_caso_pratico
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>{currentIndex + 1} de {questoes.length}</span>
        <span>✅ {score.correct}/{score.total}</span>
      </div>
      {tipo === "questao_caso_pratico" && current.cenario && (
        <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20">
          <p className="text-sm leading-relaxed">{current.cenario}</p>
        </div>
      )}
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <p className="text-base font-medium leading-relaxed">{current.enunciado || current.pergunta}</p>
      </div>
      <div className="space-y-2">
        {(current.alternativas || []).map((alt: string, i: number) => {
          const isSelected = selectedAnswer === i;
          const isCorrect = i === current.resposta_correta;
          let classes = "w-full text-left justify-start h-auto py-3 px-4 text-sm";
          if (showExplanation) {
            if (isCorrect) classes += " bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400";
            else if (isSelected && !isCorrect) classes += " bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400";
          }
          return (
            <Button
              key={i}
              variant="outline"
              className={classes}
              onClick={() => handleAnswer(i)}
              disabled={showExplanation}
            >
              {alt}
            </Button>
          );
        })}
      </div>
      {showExplanation && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border bg-muted/30 border-border">
            <p className="text-sm">{current.explicacao || current.fundamentacao}</p>
          </div>
          {currentIndex < questoes.length - 1 && (
            <Button onClick={nextQuestion} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Próxima →
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Lacunas Viewer
const LacunasViewer = ({ lacunas }: { lacunas: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = lacunas[currentIndex];
  if (!current) return null;

  const checkAnswer = () => {
    const isCorrect = userAnswer.trim().toLowerCase() === current.resposta.trim().toLowerCase();
    setShowAnswer(true);
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));
  };

  const nextLacuna = () => {
    setUserAnswer("");
    setShowAnswer(false);
    setCurrentIndex(prev => Math.min(prev + 1, lacunas.length - 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{currentIndex + 1} de {lacunas.length}</span>
        <span>✅ {score.correct}/{score.total}</span>
      </div>
      <div className="bg-muted/30 rounded-xl p-4 border border-border">
        <p className="text-base leading-relaxed">{current.texto_com_lacuna}</p>
        {current.dica && <p className="text-sm text-muted-foreground mt-2 italic">💡 Dica: {current.dica}</p>}
      </div>
      {!showAnswer ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            onKeyDown={e => e.key === "Enter" && userAnswer.trim() && checkAnswer()}
            placeholder="Digite a resposta..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Button onClick={checkAnswer} disabled={!userAnswer.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Verificar
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`p-3 rounded-lg border ${
            userAnswer.trim().toLowerCase() === current.resposta.trim().toLowerCase()
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <p className="font-semibold text-sm">
              Resposta correta: <span className="text-accent">{current.resposta}</span>
            </p>
          </div>
          {currentIndex < lacunas.length - 1 && (
            <Button onClick={nextLacuna} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Próxima →
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Correspondência Viewer
const CorrespondenciaViewer = ({ pares }: { pares: any[] }) => {
  const [selectedConceito, setSelectedConceito] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [shuffledDefs, setShuffledDefs] = useState<number[]>([]);

  useEffect(() => {
    setShuffledDefs([...Array(pares.length).keys()].sort(() => Math.random() - 0.5));
  }, [pares]);

  const handleDefClick = (defIndex: number) => {
    if (selectedConceito === null) return;
    setMatches(prev => ({ ...prev, [selectedConceito]: defIndex }));
    setSelectedConceito(null);
  };

  const allMatched = Object.keys(matches).length === pares.length;
  const correctCount = Object.entries(matches).filter(([c, d]) => Number(c) === d).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Toque em um conceito e depois na definição correspondente</p>
      
      <div className="grid grid-cols-1 gap-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Conceitos</p>
        {pares.map((par, i) => {
          const isMatched = i in matches;
          const isSelected = selectedConceito === i;
          return (
            <button
              key={`c-${i}`}
              onClick={() => !isMatched && setSelectedConceito(i)}
              className={`text-left p-3 rounded-lg border text-sm transition-all ${
                isMatched
                  ? i === matches[i] ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                  : isSelected ? 'bg-accent/20 border-accent ring-2 ring-accent/50' : 'bg-muted/30 border-border hover:bg-muted/50'
              }`}
              disabled={isMatched}
            >
              {par.conceito}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Definições</p>
        {shuffledDefs.map((defIdx) => {
          const isMatched = Object.values(matches).includes(defIdx);
          return (
            <button
              key={`d-${defIdx}`}
              onClick={() => handleDefClick(defIdx)}
              className={`text-left p-3 rounded-lg border text-sm transition-all ${
                isMatched ? 'opacity-40 cursor-not-allowed' : selectedConceito !== null ? 'bg-accent/5 border-accent/30 hover:bg-accent/10 cursor-pointer' : 'bg-muted/30 border-border'
              }`}
              disabled={isMatched || selectedConceito === null}
            >
              {pares[defIdx].definicao}
            </button>
          );
        })}
      </div>

      {allMatched && (
        <div className="text-center p-4 bg-accent/10 rounded-xl border border-accent/30">
          <p className="font-bold text-lg">🎉 {correctCount}/{pares.length} acertos!</p>
        </div>
      )}
    </div>
  );
};

const PraticaArtigoModal = ({ isOpen, onClose, artigo, numeroArtigo, codigoTabela, tipo }: PraticaArtigoModalProps) => {
  const [conteudo, setConteudo] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("Iniciando...");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !conteudo && !loading) {
      generate();
    }
  }, [isOpen]);

  const generate = async () => {
    setLoading(true);
    setProgress(0);
    setProgressMessage("📖 Analisando o artigo...");

    let currentProgress = 0;
    const interval = window.setInterval(() => {
      if (currentProgress < 85) {
        currentProgress += currentProgress < 30 ? 2 : currentProgress < 60 ? 1.5 : 0.5;
        setProgress(Math.round(currentProgress));
        if (currentProgress < 20) setProgressMessage("📖 Analisando o artigo...");
        else if (currentProgress < 45) setProgressMessage("🧠 Identificando conceitos...");
        else if (currentProgress < 70) setProgressMessage("✍️ Gerando conteúdo...");
        else setProgressMessage("✨ Finalizando...");
      }
    }, 400);

    try {
      const { data, error } = await supabase.functions.invoke("gerar-pratica-artigo", {
        body: { artigo, numeroArtigo, codigoTabela, tipo },
      });
      
      clearInterval(interval);
      if (error) throw error;

      setProgress(100);
      setProgressMessage("✅ Pronto!");
      await new Promise(r => setTimeout(r, 300));
      setConteudo(data.conteudo);
    } catch (err) {
      clearInterval(interval);
      console.error("Erro:", err);
      toast({ title: "Erro", description: "Não foi possível gerar o conteúdo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConteudo(null);
    setProgress(0);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  const info = TIPO_LABELS[tipo];

  const renderContent = () => {
    if (!conteudo || conteudo.length === 0) {
      return <p className="text-center text-muted-foreground py-8">Nenhum conteúdo gerado.</p>;
    }

    if (tipo === "flashcard_conceito") {
      return <FlashcardViewer flashcards={conteudo} />;
    }
    if (tipo === "flashcard_lacuna") {
      return <LacunasViewer lacunas={conteudo} />;
    }
    if (tipo === "flashcard_correspondencia") {
      return <CorrespondenciaViewer pares={conteudo} />;
    }
    // questoes
    return <QuizViewer questoes={conteudo} tipo={tipo} />;
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-accent">{info.emoji} {info.title}</h2>
            <p className="text-sm text-muted-foreground">Art. {numeroArtigo}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <ContentGenerationLoader message={progressMessage} progress={progress} />
          ) : (
            renderContent()
          )}
        </div>

        {!loading && conteudo && conteudo.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
            <Button onClick={handleClose} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PraticaArtigoModal;
