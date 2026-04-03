import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Timer, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuestionSuspense } from "./useQuestionSuspense";

interface Artigo {
  numero: string;
  texto: string;
}

type Dificuldade = 'normal' | 'elite' | 'boss';

interface Props {
  artigo: Artigo;
  codigoNome: string;
  dificuldade?: Dificuldade;
  onResult: (correct: boolean) => void;
}

interface Questao {
  pergunta: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
}

const TIMER_MAP: Record<Dificuldade, number> = {
  normal: 30,
  elite: 25,
  boss: 20,
};

const EMOJI_MAP: Record<Dificuldade, string> = {
  normal: '👻',
  elite: '😈',
  boss: '👹',
};

const InvasoresQuestao = ({ artigo, codigoNome, dificuldade = 'normal', onResult }: Props) => {
  const [questao, setQuestao] = useState<Questao | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timer, setTimer] = useState(TIMER_MAP[dificuldade]);
  const { start: startSuspense, stop: stopSuspense, updateUrgency } = useQuestionSuspense();

  useEffect(() => {
    gerarQuestao();
    return () => stopSuspense();
  }, []);

  // Start suspense music when question loads
  useEffect(() => {
    if (!loading && !answered) {
      startSuspense(1);
    }
  }, [loading, answered]);

  // Update urgency based on timer
  useEffect(() => {
    if (loading || answered) return;
    if (timer <= 0) {
      stopSuspense();
      onResult(false);
      return;
    }
    const maxTimer = TIMER_MAP[dificuldade];
    const urgency = Math.max(1, Math.floor((1 - timer / maxTimer) * 10));
    updateUrgency(urgency);
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, loading, answered]);

  const gerarQuestao = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gerar-questao-invasores', {
        body: {
          codigo: codigoNome,
          numero_artigo: artigo.numero,
          texto_artigo: artigo.texto.substring(0, 800),
          dificuldade,
        },
      });

      if (error) throw error;
      if (data?.questao) {
        setQuestao(data.questao);
      } else {
        setQuestao({
          pergunta: `Sobre o Art. ${artigo.numero}: qual é a disposição correta?`,
          alternativas: [
            artigo.texto.substring(0, 80) + '...',
            'Disposição revogada pela EC 45/2004',
            'Aplica-se somente a crimes dolosos',
            'Não possui correspondência na legislação vigente',
          ],
          resposta_correta: 0,
          explicacao: artigo.texto.substring(0, 200),
        });
      }
    } catch (err) {
      console.error('Erro ao gerar questão:', err);
      setQuestao({
        pergunta: `O Art. ${artigo.numero} do ${codigoNome} dispõe sobre:`,
        alternativas: [
          artigo.texto.substring(0, 80) + '...',
          'Matéria processual diversa',
          'Disposição revogada',
          'Norma de direito internacional',
        ],
        resposta_correta: 0,
        explicacao: artigo.texto.substring(0, 200),
      });
    } finally {
      setLoading(false);
    }
  };

  const responder = (index: number) => {
    if (answered || !questao) return;
    setSelectedIndex(index);
    setAnswered(true);
    stopSuspense();
    const correct = index === questao.resposta_correta;
    setTimeout(() => onResult(correct), 1500);
  };

  const urgency = timer <= 10 ? 'animate-[pulse_0.5s_ease-in-out_infinite]' : timer <= 20 ? 'animate-[pulse_1s_ease-in-out_infinite]' : '';

  const borderColorMap: Record<Dificuldade, { urgent: string; normal: string }> = {
    normal: { urgent: 'border-red-500/60', normal: 'border-cyan-500/30' },
    elite: { urgent: 'border-red-500/70', normal: 'border-purple-500/50' },
    boss: { urgent: 'border-red-500', normal: 'border-orange-500/50' },
  };
  const borderColor = timer <= 10 ? borderColorMap[dificuldade].urgent : borderColorMap[dificuldade].normal;

  const headerLabel = dificuldade === 'boss'
    ? '⚠️ CHEFE te atingiu!'
    : dificuldade === 'elite'
    ? '💀 Elite te atingiu!'
    : 'Você foi atingido!';

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-20">
      <Card className={`w-full max-w-lg bg-neutral-900 ${borderColor} max-h-[90vh] overflow-y-auto ${urgency}`}>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-5xl">{EMOJI_MAP[dificuldade]}</div>
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-5 h-5" />
              <span className="font-bold text-sm">{headerLabel}</span>
            </div>
            <p className="text-neutral-400 text-xs">
              Responda corretamente para não perder uma vida!
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className={`${dificuldade === 'boss' ? 'bg-red-500/20' : dificuldade === 'elite' ? 'bg-purple-500/20' : 'bg-cyan-500/20'} px-3 py-1 rounded-full`}>
              <span className={`${dificuldade === 'boss' ? 'text-red-400' : dificuldade === 'elite' ? 'text-purple-400' : 'text-cyan-400'} font-bold text-sm`}>Art. {artigo.numero}</span>
            </div>
            {!loading && !answered && (
              <div className={`flex items-center gap-1 text-sm font-bold ${timer <= 10 ? 'text-red-400 animate-pulse' : timer <= 20 ? 'text-yellow-400' : 'text-neutral-400'}`}>
                <Timer className="w-4 h-4" />
                {timer}s
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-neutral-400 text-sm">Gerando questão...</p>
            </div>
          ) : questao && (
            <>
              <p className="text-white font-medium text-sm leading-relaxed">{questao.pergunta}</p>

              <div className="space-y-2">
                {questao.alternativas.map((alt, i) => {
                  let btnClass = 'w-full text-left p-3 rounded-lg border text-sm transition-all ';
                  if (!answered) {
                    btnClass += 'border-neutral-700 hover:border-cyan-500/50 bg-neutral-800 text-neutral-200';
                  } else if (i === questao.resposta_correta) {
                    btnClass += 'border-green-500 bg-green-500/20 text-green-300';
                  } else if (i === selectedIndex) {
                    btnClass += 'border-red-500 bg-red-500/20 text-red-300';
                  } else {
                    btnClass += 'border-neutral-700 bg-neutral-800/50 text-neutral-500';
                  }

                  return (
                    <button key={i} onClick={() => responder(i)} className={btnClass} disabled={answered}>
                      <span className="font-bold mr-2">{String.fromCharCode(65 + i)})</span>
                      {alt}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700">
                  <p className="text-xs text-neutral-400 leading-relaxed">{questao.explicacao}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvasoresQuestao;
