import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Check, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import useSound from "use-sound";
import { motion } from "framer-motion";

interface Lacuna {
  texto_completo: string; // com {0}, {1} etc. marcando lacunas
  lacunas: string[]; // respostas corretas na ordem
  opcoes: string[]; // todas as opções (incluindo distratores)
  referencia: string;
  categoria: string;
}

const DESAFIOS: Lacuna[] = [
  {
    texto_completo: "A República Federativa do Brasil tem como fundamentos: a {0}, a cidadania, a {1} da pessoa humana, os valores sociais do trabalho e da {2} e o pluralismo político.",
    lacunas: ["soberania", "dignidade", "livre iniciativa"],
    opcoes: ["soberania", "dignidade", "livre iniciativa", "liberdade", "autonomia", "propriedade"],
    referencia: "Art. 1º, CF/88",
    categoria: "Direito Constitucional",
  },
  {
    texto_completo: "Constituem objetivos fundamentais: construir uma sociedade {0}, justa e solidária; garantir o desenvolvimento {1}; erradicar a pobreza e reduzir as {2} sociais.",
    lacunas: ["livre", "nacional", "desigualdades"],
    opcoes: ["livre", "nacional", "desigualdades", "plena", "regional", "diferenças"],
    referencia: "Art. 3º, CF/88",
    categoria: "Direito Constitucional",
  },
  {
    texto_completo: "Ninguém será submetido a {0} nem a tratamento desumano ou {1}. A lei punirá qualquer discriminação atentatória dos direitos e {2} fundamentais.",
    lacunas: ["tortura", "degradante", "liberdades"],
    opcoes: ["tortura", "degradante", "liberdades", "violência", "cruel", "garantias"],
    referencia: "Art. 5º, III e XLI, CF/88",
    categoria: "Direito Constitucional",
  },
  {
    texto_completo: "São poderes da União, independentes e {0} entre si, o {1}, o Executivo e o {2}.",
    lacunas: ["harmônicos", "Legislativo", "Judiciário"],
    opcoes: ["harmônicos", "Legislativo", "Judiciário", "complementares", "Congresso", "Tribunal"],
    referencia: "Art. 2º, CF/88",
    categoria: "Direito Constitucional",
  },
  {
    texto_completo: "A propriedade atenderá a sua {0} social. A lei estabelecerá o procedimento para {1} por necessidade ou utilidade pública, ou por interesse {2}.",
    lacunas: ["função", "desapropriação", "social"],
    opcoes: ["função", "desapropriação", "social", "obrigação", "expropriação", "público"],
    referencia: "Art. 5º, XXIII e XXIV, CF/88",
    categoria: "Direito Constitucional",
  },
];

const CompletarLacunasGame = () => {
  const navigate = useNavigate();
  const [desafioAtual, setDesafioAtual] = useState(0);
  const [respostas, setRespostas] = useState<(string | null)[]>([]);
  const [lacunaAtiva, setLacunaAtiva] = useState<number | null>(null);
  const [verificado, setVerificado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const [playCorrect] = useSound('/sounds/correct.mp3', { volume: 0.5 });
  const [playError] = useSound('/sounds/error.mp3', { volume: 0.5 });

  const desafio = DESAFIOS[desafioAtual];

  // Inicializar respostas quando muda o desafio
  useState(() => {
    setRespostas(new Array(desafio.lacunas.length).fill(null));
  });

  const inicializarDesafio = (idx: number) => {
    setDesafioAtual(idx);
    setRespostas(new Array(DESAFIOS[idx].lacunas.length).fill(null));
    setLacunaAtiva(0);
    setVerificado(false);
  };

  const selecionarOpcao = (opcao: string) => {
    if (verificado || lacunaAtiva === null) return;
    const novasRespostas = [...respostas];
    novasRespostas[lacunaAtiva] = opcao;
    setRespostas(novasRespostas);
    // Avançar para próxima lacuna vazia
    const proxima = novasRespostas.findIndex((r, i) => r === null && i > lacunaAtiva);
    setLacunaAtiva(proxima !== -1 ? proxima : novasRespostas.findIndex(r => r === null));
  };

  const verificar = () => {
    const todasPreenchidas = respostas.every(r => r !== null);
    if (!todasPreenchidas) {
      toast.error('Preencha todas as lacunas!');
      return;
    }
    setVerificado(true);
    const corretas = respostas.filter((r, i) => r === desafio.lacunas[i]).length;
    const todosCorretos = corretas === desafio.lacunas.length;
    if (todosCorretos) {
      setAcertos(a => a + 1);
      playCorrect();
      toast.success('Todas as lacunas corretas! 🎉');
    } else {
      playError();
      toast.error(`${corretas}/${desafio.lacunas.length} corretas`);
    }
  };

  const proximo = () => {
    if (desafioAtual + 1 >= DESAFIOS.length) {
      setFinalizado(true);
      return;
    }
    inicializarDesafio(desafioAtual + 1);
  };

  // Renderizar texto com lacunas
  const renderTexto = () => {
    const partes = desafio.texto_completo.split(/(\{\d+\})/g);
    return partes.map((parte, idx) => {
      const match = parte.match(/\{(\d+)\}/);
      if (!match) return <span key={idx}>{parte}</span>;
      const lacunaIdx = parseInt(match[1]);
      const resposta = respostas[lacunaIdx];
      const estaCorreta = verificado && resposta === desafio.lacunas[lacunaIdx];
      const estaErrada = verificado && resposta !== desafio.lacunas[lacunaIdx];
      const ativa = lacunaAtiva === lacunaIdx && !verificado;

      return (
        <button
          key={idx}
          onClick={() => !verificado && setLacunaAtiva(lacunaIdx)}
          className={`inline-flex items-center justify-center min-w-[80px] px-2 py-0.5 mx-1 rounded-md border-2 text-sm font-semibold transition-all ${
            resposta
              ? estaCorreta
                ? 'border-green-500 bg-green-500/20 text-green-300'
                : estaErrada
                ? 'border-red-500 bg-red-500/20 text-red-300'
                : ativa
                ? 'border-teal-400 bg-teal-500/20 text-teal-300'
                : 'border-neutral-600 bg-neutral-800 text-neutral-200'
              : ativa
              ? 'border-teal-400 bg-teal-500/10 text-teal-400 animate-pulse'
              : 'border-dashed border-neutral-600 text-neutral-500'
          }`}
        >
          {resposta || '___'}
        </button>
      );
    });
  };

  if (finalizado) {
    const percentual = Math.round((acertos / DESAFIOS.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-teal-950/20 to-neutral-950 pb-20">
        <div className="px-4 py-6 max-w-lg mx-auto text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Trophy className="w-16 h-16 text-teal-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Finalizado!</h1>
            <p className="text-teal-400 text-lg font-semibold mb-6">{acertos}/{DESAFIOS.length} corretos ({percentual}%)</p>
            <div className="space-y-3">
              <Button onClick={() => { inicializarDesafio(0); setAcertos(0); setFinalizado(false); }} className="w-full gap-2">
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

  // Opções já usadas
  const opcoesUsadas = respostas.filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-teal-950/20 to-neutral-950 pb-20">
      <div className="px-4 py-4 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/jogos-juridicos')} className="mb-3 text-neutral-400">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-white">📝 Completar Lacunas</h1>
          <p className="text-xs text-neutral-400 mt-1">Preencha os espaços em branco nos textos de lei</p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-neutral-400">Desafio {desafioAtual + 1}/{DESAFIOS.length}</span>
            <span className="text-xs text-teal-400 font-semibold">{acertos} acertos</span>
          </div>
          <Progress value={(desafioAtual / DESAFIOS.length) * 100} className="h-2" />
        </div>

        {/* Referência */}
        <div className="mb-3 flex gap-2">
          <span className="text-[10px] px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 font-semibold">{desafio.referencia}</span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-neutral-800 text-neutral-400">{desafio.categoria}</span>
        </div>

        {/* Texto com lacunas */}
        <Card className="bg-neutral-900/60 border-neutral-700 mb-5">
          <CardContent className="p-5">
            <p className="text-sm text-neutral-200 leading-relaxed">
              {renderTexto()}
            </p>
          </CardContent>
        </Card>

        {/* Opções */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {desafio.opcoes.map((opcao, idx) => {
            const jaUsada = opcoesUsadas.includes(opcao);
            return (
              <button
                key={idx}
                onClick={() => selecionarOpcao(opcao)}
                disabled={jaUsada || verificado}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  jaUsada
                    ? 'bg-neutral-800 text-neutral-600 opacity-50'
                    : 'bg-teal-600/20 text-teal-300 border border-teal-500/30 active:scale-95'
                }`}
              >
                {opcao}
              </button>
            );
          })}
        </div>

        {/* Resposta correta quando errou */}
        {verificado && respostas.some((r, i) => r !== desafio.lacunas[i]) && (
          <Card className="bg-neutral-900/60 border-l-4 border-l-teal-500 mb-4">
            <CardContent className="p-3">
              <p className="text-xs text-neutral-400 mb-1">Respostas corretas:</p>
              <div className="flex flex-wrap gap-1">
                {desafio.lacunas.map((l, i) => (
                  <span key={i} className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded">{i + 1}. {l}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões */}
        {!verificado ? (
          <Button onClick={verificar} className="w-full gap-2">
            <Check className="w-4 h-4" /> Verificar
          </Button>
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

export default CompletarLacunasGame;
