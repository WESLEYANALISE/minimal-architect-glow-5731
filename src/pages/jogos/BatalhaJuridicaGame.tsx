import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Swords, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import BatalhaCasoCard from "@/components/jogos/BatalhaCasoCard";
import BatalhaChat from "@/components/jogos/BatalhaChat";
import BatalhaResultado from "@/components/jogos/BatalhaResultado";
import BatalhaCasosCarousel from "@/components/jogos/BatalhaCasosCarousel";
import BatalhaProvas from "@/components/jogos/BatalhaProvas";
import type { ProvaData } from "@/components/jogos/BatalhaProvas";
import BatalhaSentenca from "@/components/jogos/BatalhaSentenca";
import type { OpcaoSentenca } from "@/components/jogos/BatalhaSentenca";
import BatalhaVSTransition from "@/components/jogos/BatalhaVSTransition";

interface ParteData {
  nome: string;
  tese: string;
  papel: string;
  argumentos: string[];
}

interface CasoData {
  nivel: string;
  caso: string;
  pontos_chave: string[];
  tipo_processo: string;
  parte1: ParteData;
  parte2: ParteData;
  provas: ProvaData[];
  opcoes_sentenca: OpcaoSentenca[];
  explicacao: string;
  // Legacy compat
  advogado1?: ParteData;
  advogado2?: ParteData;
  correto?: number;
}

interface Mensagem {
  advogado: 1 | 2;
  texto: string;
  tipo?: "argumento" | "pedido_fala" | "pedido_prova" | "sistema";
}

interface ProvaDecisao {
  prova: ProvaData;
  deferido: boolean;
  correto: boolean;
}

type Fase = "loading" | "selecao" | "caso" | "vs" | "provas" | "debate" | "sentenca" | "resultado";

const nivelLabel: Record<string, string> = {
  facil: "Fácil",
  medio: "Médio",
  dificil: "Difícil",
};

function normalizeCaso(caso: any): CasoData {
  return {
    ...caso,
    tipo_processo: caso.tipo_processo || "criminal",
    parte1: caso.parte1 || caso.advogado1 || { nome: "Dr. Silva", papel: "Advogado", tese: "", argumentos: [] },
    parte2: caso.parte2 || caso.advogado2 || { nome: "Dra. Lima", papel: "Advogado", tese: "", argumentos: [] },
    provas: caso.provas || [],
    opcoes_sentenca: caso.opcoes_sentenca || [],
  };
}

export default function BatalhaJuridicaGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { area, tema } = (location.state as { area: string; tema: string }) || {};

  const [fase, setFase] = useState<Fase>("loading");
  const [casos, setCasos] = useState<CasoData[]>([]);
  const [casoSelecionado, setCasoSelecionado] = useState<CasoData | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Turn-based state
  const [waitingForPermission, setWaitingForPermission] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Mensagem[]>([]);
  const [currentProvaRequest, setCurrentProvaRequest] = useState<ProvaData | null>(null);
  const [provasDecisoes, setProvasDecisoes] = useState<ProvaDecisao[]>([]);
  const [provaIndex, setProvaIndex] = useState(0);

  // Result state
  const [sentencaEscolhida, setSentencaEscolhida] = useState<OpcaoSentenca | null>(null);

  const hasState = !!(area && tema);

  const gerarBatalha = async () => {
    setFase("loading");
    setCasos([]);
    setCasoSelecionado(null);
    setMensagens([]);
    setProvasDecisoes([]);
    setProvaIndex(0);
    setSentencaEscolhida(null);
    setWaitingForPermission(false);
    setPendingMessages([]);
    setCurrentProvaRequest(null);

    try {
      const { data: cached } = await supabase
        .from("batalha_juridica_cache")
        .select("casos")
        .eq("area", area)
        .eq("tema", tema)
        .maybeSingle();

      if (cached?.casos) {
        const casosData = (typeof cached.casos === "string" ? JSON.parse(cached.casos) : cached.casos) as CasoData[];
        if (casosData.length > 0) {
          setCasos(casosData.map(normalizeCaso));
          setFase("selecao");
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("gerar-batalha-juridica", {
        body: { area, tema },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const casosData = (data.casos as any[]).map(normalizeCaso);
      if (!casosData || casosData.length === 0) throw new Error("Nenhum caso gerado");

      await supabase.from("batalha_juridica_cache").upsert(
        { area, tema, casos: casosData as any },
        { onConflict: "area,tema" }
      );

      setCasos(casosData);
      setFase("selecao");
    } catch (err: any) {
      toast.error("Erro ao gerar batalha: " + (err.message || "Tente novamente"));
      setFase("selecao");
    }
  };

  useEffect(() => {
    if (!hasState) {
      navigate("/gamificacao/batalha-juridica/areas", { replace: true });
      return;
    }
    if (!initialized) {
      setInitialized(true);
      gerarBatalha();
    }
  }, [hasState, initialized]);

  const selecionarCaso = (index: number) => {
    setCasoSelecionado(normalizeCaso(casos[index]));
    setFase("caso");
  };

  const iniciarVS = () => {
    setFase("vs");
  };

  const iniciarProvas = useCallback(() => {
    if (!casoSelecionado) return;
    if (casoSelecionado.provas && casoSelecionado.provas.length > 0) {
      setFase("provas");
    } else {
      iniciarDebate();
    }
  }, [casoSelecionado]);

  const iniciarDebate = useCallback(() => {
    if (!casoSelecionado) return;
    const p1Args = casoSelecionado.parte1.argumentos;
    const p2Args = casoSelecionado.parte2.argumentos;

    // Build turn-based messages: p1 talks, then we wait, then p2 talks
    const firstBatch: Mensagem[] = [];
    if (p1Args.length > 0) {
      firstBatch.push({ advogado: 1, texto: p1Args[0], tipo: "argumento" });
    }

    const restMessages: Mensagem[] = [];
    const max = Math.max(p1Args.length, p2Args.length);
    for (let i = 0; i < max; i++) {
      if (i < p2Args.length) {
        restMessages.push({ advogado: 2, texto: p2Args[i], tipo: "argumento" });
      }
      if (i + 1 < p1Args.length) {
        restMessages.push({ advogado: 1, texto: p1Args[i + 1], tipo: "argumento" });
      }
    }

    setMensagens(firstBatch);
    setPendingMessages(restMessages);
    setWaitingForPermission(true);
    setFase("debate");
  }, [casoSelecionado]);

  const allowSpeak = useCallback(() => {
    if (pendingMessages.length === 0) {
      setWaitingForPermission(false);
      return;
    }

    // Release next 1-2 messages (one per side)
    const next: Mensagem[] = [];
    let remaining = [...pendingMessages];

    // Take one message
    next.push(remaining.shift()!);
    // If the next one is from a different side, take it too
    if (remaining.length > 0 && remaining[0].advogado !== next[0].advogado) {
      next.push(remaining.shift()!);
    }

    setMensagens(prev => [...prev, ...next]);
    setPendingMessages(remaining);
    setWaitingForPermission(remaining.length > 0);
  }, [pendingMessages]);

  const debaterMais = async () => {
    if (!casoSelecionado) return;
    setLoadingChat(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-batalha-juridica", {
        body: {
          area,
          tema,
          continuar: true,
          contexto: {
            caso: casoSelecionado.caso,
            parte1: casoSelecionado.parte1,
            parte2: casoSelecionado.parte2,
          },
        },
      });

      if (error) throw error;

      const novos1 = data.parte1_novos || data.advogado1_novos || [];
      const novos2 = data.parte2_novos || data.advogado2_novos || [];
      const novasIntercaladas: Mensagem[] = [];
      const max = Math.max(novos1.length, novos2.length);
      for (let i = 0; i < max; i++) {
        if (i < novos1.length) novasIntercaladas.push({ advogado: 1, texto: novos1[i], tipo: "argumento" });
        if (i < novos2.length) novasIntercaladas.push({ advogado: 2, texto: novos2[i], tipo: "argumento" });
      }

      // Check if should present a prova
      if (casoSelecionado.provas && provaIndex < casoSelecionado.provas.length) {
        const prova = casoSelecionado.provas[provaIndex];
        novasIntercaladas.push({
          advogado: prova.apresentada_por as 1 | 2,
          texto: `Excelência, solicito a juntada da prova: ${prova.nome}`,
          tipo: "pedido_prova",
        });
        setCurrentProvaRequest(prova);
        setProvaIndex(prev => prev + 1);
      }

      setCasoSelecionado(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          parte1: { ...prev.parte1, argumentos: [...prev.parte1.argumentos, ...novos1] },
          parte2: { ...prev.parte2, argumentos: [...prev.parte2.argumentos, ...novos2] },
        };
      });

      setMensagens(prev => [...prev, ...novasIntercaladas]);
    } catch (err: any) {
      toast.error("Erro ao gerar mais debate: " + (err.message || "Tente novamente"));
    } finally {
      setLoadingChat(false);
    }
  };

  const deferirProva = (prova: ProvaData) => {
    setProvasDecisoes(prev => [...prev, { prova, deferido: true, correto: prova.deve_deferir === true }]);
    setCurrentProvaRequest(null);
    setMensagens(prev => [...prev, {
      advogado: 1,
      texto: prova.deve_deferir ? `✅ Prova "${prova.nome}" deferida pelo juiz.` : `✅ Prova "${prova.nome}" deferida pelo juiz. (Atenção: decisão questionável)`,
      tipo: "sistema" as const,
    }]);
  };

  const indeferirProva = (prova: ProvaData) => {
    setProvasDecisoes(prev => [...prev, { prova, deferido: false, correto: prova.deve_deferir === false }]);
    setCurrentProvaRequest(null);
    setMensagens(prev => [...prev, {
      advogado: 1,
      texto: !prova.deve_deferir ? `❌ Prova "${prova.nome}" indeferida pelo juiz.` : `❌ Prova "${prova.nome}" indeferida pelo juiz. (Atenção: decisão questionável)`,
      tipo: "sistema" as const,
    }]);
  };

  const encerrarInstrucao = () => {
    setFase("sentenca");
  };

  const sentenciar = (opcao: OpcaoSentenca) => {
    setSentencaEscolhida(opcao);
    setTimeout(() => setFase("resultado"), 1800);
  };

  if (fase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0d14] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Swords className="w-10 h-10 text-red-500" />
        </motion.div>
        <p className="text-gray-400 text-sm">Gerando 3 casos jurídicos...</p>
        <p className="text-gray-600 text-xs">Fácil • Médio • Difícil</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-red-950/5 to-neutral-950">
      {/* VS Transition overlay */}
      <AnimatePresence>
        {fase === "vs" && casoSelecionado && (
          <BatalhaVSTransition
            parte1Nome={casoSelecionado.parte1.nome}
            parte1Papel={casoSelecionado.parte1.papel}
            parte2Nome={casoSelecionado.parte2.nome}
            parte2Papel={casoSelecionado.parte2.papel}
            onComplete={iniciarProvas}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      {fase !== "vs" && (
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => {
              if (fase === "selecao") {
                navigate(`/gamificacao/batalha-juridica/temas/${encodeURIComponent(area)}`);
              } else if (fase === "caso" || fase === "provas") {
                setFase("selecao");
              } else {
                navigate(`/gamificacao/batalha-juridica/temas/${encodeURIComponent(area)}`);
              }
            }}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Swords className="w-5 h-5 text-red-400" />
          <h1 className="text-sm font-bold text-white">Batalha Jurídica</h1>
          <span className="text-xs text-gray-500">• {tema}</span>
        </div>
      )}

      <div className={fase === "debate" ? "" : "px-4 pb-24"}>
        {fase === "selecao" && casos.length > 0 && (
          <BatalhaCasosCarousel casos={casos} onSelecionar={selecionarCaso} />
        )}

        {fase === "caso" && casoSelecionado && (
          <BatalhaCasoCard
            caso={casoSelecionado.caso}
            tema={tema}
            pontos_chave={casoSelecionado.pontos_chave}
            nivel={casoSelecionado.nivel}
            onIniciar={iniciarVS}
          />
        )}

        {fase === "provas" && casoSelecionado && (
          <BatalhaProvas
            provas={casoSelecionado.provas}
            parte1Nome={casoSelecionado.parte1.nome}
            parte2Nome={casoSelecionado.parte2.nome}
            parte1Papel={casoSelecionado.parte1.papel}
            parte2Papel={casoSelecionado.parte2.papel}
            onIniciarJulgamento={iniciarDebate}
          />
        )}

        {fase === "debate" && casoSelecionado && (
          <BatalhaChat
            mensagens={mensagens}
            parte1={casoSelecionado.parte1}
            parte2={casoSelecionado.parte2}
            loading={loadingChat}
            onDebaterMais={debaterMais}
            onEncerrarInstrucao={encerrarInstrucao}
            podeEscolher={mensagens.length > 0}
            nivelBadge={nivelLabel[casoSelecionado.nivel]}
            caso={casoSelecionado.caso}
            pontos_chave={casoSelecionado.pontos_chave}
            waitingForPermission={waitingForPermission}
            onAllowSpeak={allowSpeak}
            currentProvaRequest={currentProvaRequest}
            onDeferirProva={deferirProva}
            onIndeferirProva={indeferirProva}
          />
        )}

        {fase === "sentenca" && casoSelecionado && (
          <BatalhaSentenca
            opcoes={casoSelecionado.opcoes_sentenca}
            tipoProcesso={casoSelecionado.tipo_processo}
            casoResumo={casoSelecionado.caso}
            onSentenciar={sentenciar}
          />
        )}

        {fase === "resultado" && casoSelecionado && sentencaEscolhida && (
          <BatalhaResultado
            sentencaEscolhida={sentencaEscolhida}
            provasDecisoes={provasDecisoes}
            explicacao={casoSelecionado.explicacao}
            onJogarNovamente={gerarBatalha}
            onVoltar={() => navigate(`/gamificacao/batalha-juridica/temas/${encodeURIComponent(area)}`)}
          />
        )}
      </div>
    </div>
  );
}
