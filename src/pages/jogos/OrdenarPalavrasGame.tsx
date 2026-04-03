import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Check, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import useSound from "use-sound";
import { motion, AnimatePresence } from "framer-motion";

interface Desafio {
  frase_original: string;
  dica: string;
  categoria: string;
}

const DESAFIOS: Desafio[] = [
  { frase_original: "Ninguém será considerado culpado até o trânsito em julgado", dica: "Presunção de inocência - Art. 5º, LVII, CF", categoria: "Direito Constitucional" },
  { frase_original: "A lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito", dica: "Princípio da inafastabilidade - Art. 5º, XXXV, CF", categoria: "Direito Constitucional" },
  { frase_original: "Todos são iguais perante a lei sem distinção de qualquer natureza", dica: "Princípio da igualdade - Art. 5º, caput, CF", categoria: "Direito Constitucional" },
  { frase_original: "É livre a manifestação do pensamento sendo vedado o anonimato", dica: "Liberdade de expressão - Art. 5º, IV, CF", categoria: "Direito Constitucional" },
  { frase_original: "Ninguém será preso senão em flagrante delito ou por ordem escrita da autoridade judiciária competente", dica: "Garantia contra prisão ilegal - Art. 5º, LXI, CF", categoria: "Direito Constitucional" },
];

const OrdenarPalavrasGame = () => {
  const navigate = useNavigate();
  const [desafioAtual, setDesafioAtual] = useState(0);
  const [palavrasEmbaralhadas, setPalavrasEmbaralhadas] = useState<string[]>([]);
  const [palavrasOrdenadas, setPalavrasOrdenadas] = useState<string[]>([]);
  const [verificado, setVerificado] = useState(false);
  const [correto, setCorreto] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const [playCorrect] = useSound('/sounds/correct.mp3', { volume: 0.5 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.5 });

  const desafio = DESAFIOS[desafioAtual];

  const embaralhar = useCallback((frase: string) => {
    const palavras = frase.split(' ');
    const copia = [...palavras];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    // Garantir que está embaralhada
    if (copia.join(' ') === frase) {
      [copia[0], copia[copia.length - 1]] = [copia[copia.length - 1], copia[0]];
    }
    setPalavrasEmbaralhadas(copia);
    setPalavrasOrdenadas([]);
    setVerificado(false);
    setCorreto(false);
  }, []);

  useEffect(() => {
    embaralhar(DESAFIOS[desafioAtual].frase_original);
  }, [desafioAtual, embaralhar]);

  const adicionarPalavra = (palavra: string, idx: number) => {
    if (verificado) return;
    setPalavrasOrdenadas(prev => [...prev, palavra]);
    setPalavrasEmbaralhadas(prev => prev.filter((_, i) => i !== idx));
  };

  const removerPalavra = (idx: number) => {
    if (verificado) return;
    const palavra = palavrasOrdenadas[idx];
    setPalavrasOrdenadas(prev => prev.filter((_, i) => i !== idx));
    setPalavrasEmbaralhadas(prev => [...prev, palavra]);
  };

  const verificar = () => {
    const fraseUsuario = palavrasOrdenadas.join(' ');
    const estaCorreto = fraseUsuario === desafio.frase_original;
    setVerificado(true);
    setCorreto(estaCorreto);
    if (estaCorreto) {
      setAcertos(a => a + 1);
      playCorrect();
      toast.success('Correto! 🎉');
    } else {
      playError();
      toast.error('Ordem incorreta!');
    }
  };

  const proximo = () => {
    if (desafioAtual + 1 >= DESAFIOS.length) {
      setFinalizado(true);
      return;
    }
    setDesafioAtual(d => d + 1);
  };

  if (finalizado) {
    const percentual = Math.round((acertos / DESAFIOS.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-indigo-950/20 to-neutral-950 pb-20">
        <div className="px-4 py-6 max-w-lg mx-auto text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Trophy className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Finalizado!</h1>
            <p className="text-indigo-400 text-lg font-semibold mb-6">{acertos}/{DESAFIOS.length} corretos ({percentual}%)</p>
            <div className="space-y-3">
              <Button onClick={() => { setDesafioAtual(0); setAcertos(0); setFinalizado(false); }} className="w-full gap-2">
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-indigo-950/20 to-neutral-950 pb-20">
      <div className="px-4 py-4 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/jogos-juridicos')} className="mb-3 text-neutral-400">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-white">🔤 Ordenar Palavras</h1>
          <p className="text-xs text-neutral-400 mt-1">Coloque as palavras na ordem correta</p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-neutral-400">Desafio {desafioAtual + 1}/{DESAFIOS.length}</span>
            <span className="text-xs text-indigo-400 font-semibold">{acertos} acertos</span>
          </div>
          <Progress value={(desafioAtual / DESAFIOS.length) * 100} className="h-2" />
        </div>

        {/* Dica */}
        <Card className="bg-neutral-900/60 border-indigo-500/20 mb-4">
          <CardContent className="p-3">
            <p className="text-xs text-neutral-400">💡 {desafio.dica}</p>
            <span className="text-[10px] text-indigo-400/70">{desafio.categoria}</span>
          </CardContent>
        </Card>

        {/* Zona de resposta */}
        <div className="min-h-[100px] rounded-xl border-2 border-dashed border-neutral-700 p-3 mb-4 flex flex-wrap gap-2 items-start">
          {palavrasOrdenadas.length === 0 && (
            <p className="text-neutral-600 text-xs w-full text-center mt-6">Toque nas palavras abaixo para montar a frase</p>
          )}
          <AnimatePresence>
            {palavrasOrdenadas.map((p, idx) => (
              <motion.button
                key={`ord-${idx}-${p}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => removerPalavra(idx)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  verificado
                    ? correto
                      ? 'bg-green-600/30 text-green-300 border border-green-500/30'
                      : 'bg-red-600/30 text-red-300 border border-red-500/30'
                    : 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 active:scale-95'
                }`}
                disabled={verificado}
              >
                {p}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Palavras embaralhadas */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <AnimatePresence>
            {palavrasEmbaralhadas.map((p, idx) => (
              <motion.button
                key={`emb-${idx}-${p}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => adicionarPalavra(p, idx)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-200 border border-neutral-700 active:scale-95 transition-transform"
              >
                {p}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Resposta correta quando errou */}
        {verificado && !correto && (
          <Card className="bg-neutral-900/60 border-l-4 border-l-indigo-500 mb-4">
            <CardContent className="p-3">
              <p className="text-xs text-neutral-400 mb-1">Ordem correta:</p>
              <p className="text-sm text-indigo-300 font-medium">{desafio.frase_original}</p>
            </CardContent>
          </Card>
        )}

        {/* Botões */}
        {!verificado ? (
          <div className="space-y-2">
            <Button
              onClick={verificar}
              disabled={palavrasOrdenadas.length === 0}
              className="w-full gap-2"
            >
              <Check className="w-4 h-4" /> Verificar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => embaralhar(desafio.frase_original)} className="w-full text-neutral-500">
              <RotateCcw className="w-3 h-3 mr-1" /> Reembaralhar
            </Button>
          </div>
        ) : (
          <Button onClick={proximo} className="w-full gap-2">
            {desafioAtual + 1 >= DESAFIOS.length ? 'Ver Resultado' : 'Próximo'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrdenarPalavrasGame;
