import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import useSound from "use-sound";
import { motion, AnimatePresence } from "framer-motion";

interface Questao {
  pergunta: string;
  tipo: 'multipla' | 'vf';
  alternativas?: string[];
  resposta_correta: number | boolean;
  explicacao: string;
  categoria: string;
}

const QUESTOES_EXEMPLO: Questao[] = [
  {
    pergunta: "O habeas corpus pode ser impetrado por qualquer pessoa, inclusive estrangeiros?",
    tipo: "vf",
    resposta_correta: true,
    explicacao: "Sim. O habeas corpus é uma garantia constitucional que pode ser impetrado por qualquer pessoa, nacional ou estrangeira, em seu favor ou de terceiro (art. 5º, LXVIII, CF/88).",
    categoria: "Direito Constitucional",
  },
  {
    pergunta: "Qual é o prazo para interpor recurso de apelação no processo civil?",
    tipo: "multipla",
    alternativas: ["10 dias", "15 dias", "20 dias", "30 dias"],
    resposta_correta: 1,
    explicacao: "O prazo para interpor apelação é de 15 dias, conforme art. 1.003, §5º do CPC/2015.",
    categoria: "Direito Processual Civil",
  },
  {
    pergunta: "A Constituição Federal pode ser emendada durante estado de sítio?",
    tipo: "vf",
    resposta_correta: false,
    explicacao: "Não. A Constituição não pode ser emendada na vigência de intervenção federal, estado de defesa ou estado de sítio (art. 60, §1º, CF/88).",
    categoria: "Direito Constitucional",
  },
  {
    pergunta: "Qual princípio determina que ninguém será considerado culpado até o trânsito em julgado?",
    tipo: "multipla",
    alternativas: ["Princípio da legalidade", "Presunção de inocência", "Princípio do contraditório", "Princípio da ampla defesa"],
    resposta_correta: 1,
    explicacao: "A presunção de inocência está prevista no art. 5º, LVII da CF/88: 'ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória'.",
    categoria: "Direito Penal",
  },
  {
    pergunta: "O mandado de segurança pode ser impetrado contra ato de particular?",
    tipo: "vf",
    resposta_correta: false,
    explicacao: "Não. O mandado de segurança protege direito líquido e certo contra ato ilegal ou abusivo de autoridade pública ou agente de pessoa jurídica no exercício de atribuições do Poder Público (art. 5º, LXIX, CF/88).",
    categoria: "Direito Constitucional",
  },
  {
    pergunta: "Qual é a idade mínima para ser eleito Presidente da República?",
    tipo: "multipla",
    alternativas: ["30 anos", "35 anos", "40 anos", "21 anos"],
    resposta_correta: 1,
    explicacao: "A idade mínima para Presidente e Vice-Presidente é 35 anos (art. 14, §3º, VI, 'a', CF/88).",
    categoria: "Direito Constitucional",
  },
  {
    pergunta: "A ação penal pública é sempre incondicionada?",
    tipo: "vf",
    resposta_correta: false,
    explicacao: "Não. A ação penal pública pode ser incondicionada ou condicionada à representação do ofendido ou à requisição do Ministro da Justiça (art. 24 do CPP).",
    categoria: "Direito Penal",
  },
  {
    pergunta: "Qual órgão é responsável pelo controle externo da atividade policial?",
    tipo: "multipla",
    alternativas: ["Poder Judiciário", "Ministério Público", "Defensoria Pública", "Tribunal de Contas"],
    resposta_correta: 1,
    explicacao: "O controle externo da atividade policial é função institucional do Ministério Público (art. 129, VII, CF/88).",
    categoria: "Direito Constitucional",
  },
  {
    pergunta: "O contrato de trabalho por prazo determinado pode exceder 2 anos?",
    tipo: "vf",
    resposta_correta: false,
    explicacao: "Não. O contrato por prazo determinado não pode ser estipulado por mais de 2 anos, conforme art. 445 da CLT.",
    categoria: "Direito do Trabalho",
  },
  {
    pergunta: "Qual é o quórum para aprovação de emenda constitucional?",
    tipo: "multipla",
    alternativas: ["Maioria simples", "Maioria absoluta", "2/3 dos membros", "3/5 dos membros"],
    resposta_correta: 3,
    explicacao: "A proposta de emenda será aprovada se obtiver, em cada Casa, 3/5 dos votos dos respectivos membros, em dois turnos (art. 60, §2º, CF/88).",
    categoria: "Direito Constitucional",
  },
];

const QuizJuridicoGame = () => {
  const navigate = useNavigate();
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | boolean | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const [playCorrect] = useSound('/sounds/correct.mp3', { volume: 0.5 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.5 });

  const questao = QUESTOES_EXEMPLO[questaoAtual];
  const progresso = ((questaoAtual) / QUESTOES_EXEMPLO.length) * 100;

  const responder = useCallback((resposta: number | boolean) => {
    if (mostrarResultado) return;
    setRespostaSelecionada(resposta);
    setMostrarResultado(true);

    const correta = questao.tipo === 'vf'
      ? resposta === questao.resposta_correta
      : resposta === questao.resposta_correta;

    if (correta) {
      setAcertos(a => a + 1);
      playCorrect();
    } else {
      setErros(e => e + 1);
      playError();
    }
  }, [mostrarResultado, questao, playCorrect, playError]);

  const proximaQuestao = () => {
    if (questaoAtual + 1 >= QUESTOES_EXEMPLO.length) {
      setFinalizado(true);
      return;
    }
    setQuestaoAtual(q => q + 1);
    setRespostaSelecionada(null);
    setMostrarResultado(false);
  };

  const reiniciar = () => {
    setQuestaoAtual(0);
    setRespostaSelecionada(null);
    setMostrarResultado(false);
    setAcertos(0);
    setErros(0);
    setFinalizado(false);
  };

  if (finalizado) {
    const percentual = Math.round((acertos / QUESTOES_EXEMPLO.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-emerald-950/20 to-neutral-950 pb-20">
        <div className="px-4 py-6 max-w-lg mx-auto">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="text-6xl mb-4">{percentual >= 70 ? '🏆' : percentual >= 50 ? '👏' : '📚'}</div>
            <h1 className="text-2xl font-bold text-white mb-2">Quiz Finalizado!</h1>
            <p className="text-emerald-400 text-lg font-semibold mb-6">{percentual}% de acertos</p>
            <Card className="bg-neutral-900/60 border-emerald-500/20 mb-6">
              <CardContent className="p-6 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-400">{acertos}</p>
                  <p className="text-xs text-neutral-400">Acertos</p>
                </div>
                <div className="text-center">
                  <XCircle className="w-8 h-8 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-400">{erros}</p>
                  <p className="text-xs text-neutral-400">Erros</p>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-3">
              <Button onClick={reiniciar} className="w-full gap-2">
                <RotateCcw className="w-4 h-4" /> Jogar Novamente
              </Button>
              <Button variant="outline" onClick={() => navigate('/jogos-juridicos')} className="w-full">
                Voltar aos Jogos
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-emerald-950/20 to-neutral-950 pb-20">
      <div className="px-4 py-4 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/jogos-juridicos')} className="mb-3 text-neutral-400">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-neutral-400">Questão {questaoAtual + 1}/{QUESTOES_EXEMPLO.length}</span>
            <span className="text-xs text-emerald-400 font-semibold">{acertos} acertos</span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        {/* Categoria */}
        <div className="mb-3">
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
            {questao.categoria}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={questaoAtual}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Pergunta */}
            <Card className="bg-neutral-900/60 border-neutral-700 mb-6">
              <CardContent className="p-5">
                <p className="text-white font-semibold text-base leading-relaxed">{questao.pergunta}</p>
              </CardContent>
            </Card>

            {/* Alternativas */}
            {questao.tipo === 'multipla' ? (
              <div className="space-y-3 mb-6">
                {questao.alternativas?.map((alt, idx) => {
                  const isSelected = respostaSelecionada === idx;
                  const isCorrect = idx === questao.resposta_correta;
                  let style = 'border-neutral-700 hover:border-emerald-500/50';
                  if (mostrarResultado) {
                    if (isCorrect) style = 'border-green-500 bg-green-500/10';
                    else if (isSelected && !isCorrect) style = 'border-red-500 bg-red-500/10';
                    else style = 'border-neutral-800 opacity-50';
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => responder(idx)}
                      disabled={mostrarResultado}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${style}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-300 flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm text-white">{alt}</span>
                        {mostrarResultado && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />}
                        {mostrarResultado && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 ml-auto flex-shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Verdadeiro', value: true, icon: '✅' },
                  { label: 'Falso', value: false, icon: '❌' },
                ].map(opt => {
                  const isSelected = respostaSelecionada === opt.value;
                  const isCorrect = opt.value === questao.resposta_correta;
                  let style = 'border-neutral-700 hover:border-emerald-500/50';
                  if (mostrarResultado) {
                    if (isCorrect) style = 'border-green-500 bg-green-500/10';
                    else if (isSelected && !isCorrect) style = 'border-red-500 bg-red-500/10';
                    else style = 'border-neutral-800 opacity-50';
                  }
                  return (
                    <button
                      key={String(opt.value)}
                      onClick={() => responder(opt.value)}
                      disabled={mostrarResultado}
                      className={`p-5 rounded-xl border-2 transition-all text-center ${style}`}
                    >
                      <span className="text-2xl block mb-1">{opt.icon}</span>
                      <span className="text-sm font-semibold text-white">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explicação */}
            {mostrarResultado && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <Card className="bg-neutral-900/60 border-l-4 border-l-emerald-500 mb-4">
                  <CardContent className="p-4">
                    <p className="text-xs text-neutral-400 mb-1">Explicação:</p>
                    <p className="text-sm text-neutral-200 leading-relaxed">{questao.explicacao}</p>
                  </CardContent>
                </Card>
                <Button onClick={proximaQuestao} className="w-full">
                  {questaoAtual + 1 >= QUESTOES_EXEMPLO.length ? 'Ver Resultado' : 'Próxima Questão'}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuizJuridicoGame;
