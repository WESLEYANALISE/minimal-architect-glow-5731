import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gavel, Scale, CheckCircle } from "lucide-react";

export interface OpcaoSentenca {
  texto: string;
  correta: boolean;
  pontos: number;
  feedback: string;
}

interface BatalhaSentencaProps {
  opcoes: OpcaoSentenca[];
  tipoProcesso: string;
  casoResumo: string;
  onSentenciar: (opcao: OpcaoSentenca, index: number) => void;
}

const BatalhaSentenca = ({ opcoes, tipoProcesso, casoResumo, onSentenciar }: BatalhaSentencaProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [hammerAnimating, setHammerAnimating] = useState(false);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setHammerAnimating(true);

    setTimeout(() => {
      onSentenciar(opcoes[index], index);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-5"
    >
      {/* Header solene */}
      <div className="text-center space-y-3">
        <motion.div
          animate={hammerAnimating ? {
            rotate: [0, -30, 15, -10, 5, 0],
            scale: [1, 1.2, 1.1, 1.15, 1.05, 1],
          } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20"
        >
          <Gavel className="w-8 h-8 text-white" />
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-white">Sentença</h2>
          <p className="text-gray-400 text-sm mt-1">Excelência, profira sua decisão</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-300 uppercase tracking-wider font-semibold">
            Processo {tipoProcesso}
          </span>
        </div>
      </div>

      {/* Resumo */}
      <div className="rounded-xl bg-neutral-900/80 border border-white/10 p-4">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">Resumo dos Fatos</p>
        <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">{casoResumo}</p>
      </div>

      {/* Opções de sentença */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Escolha sua decisão</p>
        {opcoes.map((opcao, i) => {
          const isSelected = selected === i;
          const isDisabled = selected !== null && !isSelected;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              onClick={() => handleSelect(i)}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                isSelected
                  ? "border-amber-400/60 bg-amber-900/20 ring-2 ring-amber-400/20"
                  : isDisabled
                  ? "border-white/5 bg-neutral-900/30 opacity-40 pointer-events-none"
                  : "border-white/10 bg-neutral-900/50 hover:border-white/30 hover:bg-neutral-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSelected ? "bg-amber-500/30" : "bg-white/5"
                }`}>
                  {isSelected ? (
                    <CheckCircle className="w-4 h-4 text-amber-300" />
                  ) : (
                    <span className="text-gray-500 text-sm font-bold">{i + 1}</span>
                  )}
                </div>
                <p className={`text-sm leading-relaxed ${isSelected ? "text-amber-200 font-medium" : "text-gray-300"}`}>
                  {opcao.texto}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Hammer animation overlay */}
      <AnimatePresence>
        {hammerAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, -45, 10, -5, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Gavel className="w-20 h-20 text-amber-400 mx-auto" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-white text-xl font-bold mt-4"
              >
                Sentença Proferida!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BatalhaSentenca;
