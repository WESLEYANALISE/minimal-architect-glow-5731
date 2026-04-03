import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import useSound from "use-sound";
import { motion } from "framer-motion";

interface Par {
  termo: string;
  definicao: string;
}

const PARES: Par[] = [
  { termo: "Habeas Corpus", definicao: "Protege o direito de ir e vir" },
  { termo: "Mandado de Segurança", definicao: "Protege direito líquido e certo" },
  { termo: "Ação Popular", definicao: "Qualquer cidadão pode propor" },
  { termo: "Litispendência", definicao: "Duas ações idênticas em curso" },
  { termo: "Coisa Julgada", definicao: "Decisão judicial irrecorrível" },
  { termo: "Dolo", definicao: "Intenção de cometer o ilícito" },
  { termo: "Culpa Stricto Sensu", definicao: "Negligência, imprudência ou imperícia" },
  { termo: "Prescrição", definicao: "Perda da pretensão pelo decurso do tempo" },
];

interface CartaState {
  id: number;
  conteudo: string;
  parId: number;
  tipo: 'termo' | 'definicao';
  virada: boolean;
  encontrada: boolean;
}

const MemoriaGame = () => {
  const navigate = useNavigate();
  const [cartas, setCartas] = useState<CartaState[]>([]);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [tentativas, setTentativas] = useState(0);
  const [paresEncontrados, setParesEncontrados] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  const [playCorrect] = useSound('/sounds/correct.mp3', { volume: 0.5 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.5 });

  const totalPares = PARES.length;

  const embaralhar = useCallback(() => {
    const cartasGeradas: CartaState[] = [];
    PARES.forEach((par, idx) => {
      cartasGeradas.push({ id: idx * 2, conteudo: par.termo, parId: idx, tipo: 'termo', virada: false, encontrada: false });
      cartasGeradas.push({ id: idx * 2 + 1, conteudo: par.definicao, parId: idx, tipo: 'definicao', virada: false, encontrada: false });
    });
    // Fisher-Yates shuffle
    for (let i = cartasGeradas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cartasGeradas[i], cartasGeradas[j]] = [cartasGeradas[j], cartasGeradas[i]];
    }
    setCartas(cartasGeradas);
    setSelecionadas([]);
    setTentativas(0);
    setParesEncontrados(0);
    setFinalizado(false);
    setBloqueado(false);
  }, []);

  useEffect(() => { embaralhar(); }, [embaralhar]);

  const clicarCarta = (id: number) => {
    if (bloqueado) return;
    const carta = cartas.find(c => c.id === id);
    if (!carta || carta.virada || carta.encontrada) return;
    if (selecionadas.length >= 2) return;

    const novasCartas = cartas.map(c => c.id === id ? { ...c, virada: true } : c);
    setCartas(novasCartas);
    const novasSelecionadas = [...selecionadas, id];
    setSelecionadas(novasSelecionadas);

    if (novasSelecionadas.length === 2) {
      setTentativas(t => t + 1);
      setBloqueado(true);
      const [id1, id2] = novasSelecionadas;
      const c1 = novasCartas.find(c => c.id === id1)!;
      const c2 = novasCartas.find(c => c.id === id2)!;

      if (c1.parId === c2.parId && c1.tipo !== c2.tipo) {
        // Par encontrado
        playCorrect();
        setTimeout(() => {
          setCartas(prev => prev.map(c =>
            c.parId === c1.parId ? { ...c, encontrada: true, virada: true } : c
          ));
          setSelecionadas([]);
          setBloqueado(false);
          setParesEncontrados(p => {
            const novo = p + 1;
            if (novo === totalPares) {
              setFinalizado(true);
              toast.success('🎉 Parabéns! Todos os pares encontrados!');
            }
            return novo;
          });
        }, 600);
      } else {
        // Não é par
        playError();
        setTimeout(() => {
          setCartas(prev => prev.map(c =>
            novasSelecionadas.includes(c.id) && !c.encontrada ? { ...c, virada: false } : c
          ));
          setSelecionadas([]);
          setBloqueado(false);
        }, 1000);
      }
    }
  };

  if (finalizado) {
    const estrelas = tentativas <= totalPares + 2 ? 3 : tentativas <= totalPares + 6 ? 2 : 1;
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-amber-950/20 to-neutral-950 pb-20">
        <div className="px-4 py-6 max-w-lg mx-auto text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Parabéns!</h1>
            <div className="text-3xl mb-4">{'⭐'.repeat(estrelas)}{'☆'.repeat(3 - estrelas)}</div>
            <p className="text-neutral-400 mb-6">Completado em <span className="text-amber-400 font-bold">{tentativas}</span> tentativas</p>
            <div className="space-y-3">
              <Button onClick={embaralhar} className="w-full gap-2">
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
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-amber-950/20 to-neutral-950 pb-20">
      <div className="px-3 py-4 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/jogos-juridicos')} className="mb-3 text-neutral-400">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-white">🧠 Jogo da Memória</h1>
          <p className="text-xs text-neutral-400 mt-1">Encontre os pares: termo ↔ definição</p>
        </div>

        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-xs text-neutral-400">Tentativas: <span className="text-amber-400 font-bold">{tentativas}</span></span>
          <span className="text-xs text-neutral-400">Pares: <span className="text-amber-400 font-bold">{paresEncontrados}/{totalPares}</span></span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {cartas.map(carta => (
            <motion.button
              key={carta.id}
              onClick={() => clicarCarta(carta.id)}
              className="aspect-square relative"
              whileTap={{ scale: 0.95 }}
            >
              <div
                className="w-full h-full transition-all duration-300 relative"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: carta.virada || carta.encontrada ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Frente (escondida) */}
                <div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg border border-amber-500/30"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-2xl">⚖️</span>
                </div>
                {/* Verso (conteúdo) */}
                <div
                  className={`absolute inset-0 rounded-xl flex items-center justify-center p-1.5 shadow-lg border ${
                    carta.encontrada
                      ? 'bg-green-900/60 border-green-500/50'
                      : carta.tipo === 'termo'
                      ? 'bg-blue-900/60 border-blue-500/30'
                      : 'bg-purple-900/60 border-purple-500/30'
                  }`}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="text-[9px] sm:text-[10px] text-white font-medium text-center leading-tight">
                    {carta.conteudo}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemoriaGame;
