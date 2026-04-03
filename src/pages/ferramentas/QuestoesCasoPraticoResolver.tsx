import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Home, Briefcase } from "lucide-react";
import CountdownStart from "@/components/CountdownStart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { supabase } from "@/integrations/supabase/client";
import { playCorrectLetterSound, playWrongLetterSound } from "@/hooks/useGamificacaoSounds";
import MultiplaEscolhaCard from "@/components/simulacao/MultiplaEscolhaCard";

interface CasoPratico {
  cenario: string;
  pergunta: string;
  alternativas: { letra: string; texto: string }[];
  gabarito: string;
  explicacao: string;
  subtema: string;
}

const MAX_BATCH_ATTEMPTS = 16;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const QuestoesCasoPraticoResolver = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const tema = searchParams.get("tema") || "";

  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [casos, setCasos] = useState<CasoPratico[]>([]);
  const [casoAtual, setCasoAtual] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [totalRespondidas, setTotalRespondidas] = useState(0);
  const [respondida, setRespondida] = useState(false);
  const [respostaUsuario, setRespostaUsuario] = useState<string | null>(null);
  const [fase, setFase] = useState<"loading" | "countdown" | "jogando" | "resultado">("loading");
  const [erro, setErro] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState({ processados: 0, total: 0, geradas: 0 });

  const carregarCasos = useCallback(async () => {
    if (!area || !tema) { setErro("Área e tema são obrigatórios."); return; }
    setFase("loading");
    setErro(null);

    try {
      let geracaoCompleta = false;
      for (let tentativa = 1; tentativa <= MAX_BATCH_ATTEMPTS; tentativa++) {
        const { data, error } = await supabase.functions.invoke("gerar-questoes-caso-pratico", { body: { area, tema } });
        if (error) throw error;
        setLoadingInfo((prev) => ({
          processados: Number(data?.subtemas_processados || prev.processados),
          total: Number(data?.total_subtemas || prev.total),
          geradas: prev.geradas + Number(data?.questoes_geradas || 0),
        }));
        if (data?.geracao_completa) { geracaoCompleta = true; break; }
        await sleep(1000);
      }
      if (!geracaoCompleta) throw new Error("A geração não finalizou no tempo esperado.");

      const { data: resultadoFinal, error: erroFinal } = await supabase.functions.invoke("gerar-questoes-caso-pratico", {
        body: { area, tema, include_questions: true },
      });
      if (erroFinal) throw erroFinal;

      const casosFinais = (resultadoFinal?.perguntas || [])
        .map((item: any) => ({
          cenario: String(item?.cenario || "").trim(),
          pergunta: String(item?.pergunta || "").trim(),
          alternativas: Array.isArray(item?.alternativas)
            ? item.alternativas.map((a: any) => ({
                id: String(a?.letra || ""),
                texto: String(a?.texto || ""),
                letra: String(a?.letra || ""),
              }))
            : [],
          gabarito: String(item?.gabarito || "").trim(),
          explicacao: String(item?.explicacao || "").trim(),
          subtema: String(item?.subtema || tema).trim(),
        }))
        .filter((c: CasoPratico) => c.cenario.length > 0 && c.alternativas.length === 4);

      if (casosFinais.length === 0) throw new Error("Nenhum caso prático foi gerado.");

      setCasos(casosFinais);
      setCasoAtual(0);
      setAcertos(0);
      setTotalRespondidas(0);
      setRespondida(false);
      setRespostaUsuario(null);
      setFase("countdown");
    } catch (error: any) {
      console.error("Erro ao carregar casos práticos:", error);
      setErro(error?.message || "Erro ao gerar os casos práticos");
    }
  }, [area, tema]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) { navigate("/ferramentas/questoes", { replace: true }); return; }
    carregarCasos();
  }, [user, isAdmin, navigate, carregarCasos]);

   const shakeControls = useAnimation();
  const feedbackRef = useRef<HTMLDivElement>(null);

  const handleResposta = useCallback(
    (letraSelecionada: string) => {
      if (respondida || !casos[casoAtual]) return;
      setRespondida(true);
      setRespostaUsuario(letraSelecionada);
      setTotalRespondidas((prev) => prev + 1);
      const correta = letraSelecionada === casos[casoAtual].gabarito;
      if (correta) { setAcertos((prev) => prev + 1); playCorrectLetterSound(); }
      else {
        playWrongLetterSound();
        shakeControls.start({ x: [0, -8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.5 } });
      }
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 400);
    },
    [respondida, casos, casoAtual, shakeControls]
  );

  const flipSoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    try {
      const audio = new Audio('/sounds/virar_card.mp3');
      audio.volume = 0.4;
      audio.preload = 'auto';
      flipSoundRef.current = audio;
    } catch {}
    return () => { flipSoundRef.current = null; };
  }, []);

  const playFlipSound = useCallback(() => {
    try { if (flipSoundRef.current) { flipSoundRef.current.currentTime = 0; flipSoundRef.current.play().catch(() => {}); } } catch {}
  }, []);

  const proximoCaso = useCallback(() => {
    if (casoAtual + 1 >= casos.length) { setFase("resultado"); return; }
    playFlipSound();
    setCasoAtual((prev) => prev + 1);
    setRespondida(false);
    setRespostaUsuario(null);
  }, [casoAtual, casos.length, playFlipSound]);

  const caso = casos[casoAtual];
  const backUrl = `/ferramentas/questoes/caso-pratico/temas?area=${encodeURIComponent(area)}`;

  // Loading
  if (fase === "loading") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "hsl(0 0% 13%)" }}>
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Button>
          <div>
            <h1 className="text-sm font-bold text-white truncate">{tema}</h1>
            <p className="text-xs text-white/50">Caso Prático • {area}</p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          {erro ? (
            <>
              <XCircle className="w-10 h-10 text-red-400" />
              <p className="text-sm text-white/60 text-center">{erro}</p>
              <Button variant="outline" onClick={() => navigate(backUrl)}>Voltar</Button>
            </>
          ) : (
            <>
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white mb-1">Gerando casos práticos...</p>
                <p className="text-xs text-white/50">Subtemas: {loadingInfo.processados}/{loadingInfo.total || "..."}</p>
                <p className="text-[11px] text-white/40 mt-1">Gerados: {loadingInfo.geradas}</p>
              </div>
              <Progress value={loadingInfo.total > 0 ? (loadingInfo.processados / loadingInfo.total) * 100 : 5} className="w-56 h-2" />
            </>
          )}
        </div>
      </div>
    );
  }

  // Countdown
  if (fase === "countdown") {
    return <CountdownStart onComplete={() => setFase("jogando")} />;
  }

  // Resultado
  if (fase === "resultado") {
    const percentual = totalRespondidas > 0 ? Math.round((acertos / totalRespondidas) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "hsl(0 0% 13%)" }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-blue-500/15">
            <span className="text-3xl font-black text-blue-400">{percentual}%</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {percentual >= 70 ? "Excelente! 🎉" : percentual >= 40 ? "Bom trabalho! 👍" : "Continue praticando! 💪"}
          </h2>
          <p className="text-sm text-white/60 mb-1">{tema} • {area}</p>
          <p className="text-sm text-white/60 mb-6">
            Acertou <span className="font-bold text-blue-400">{acertos}</span> de <span className="font-bold text-white">{totalRespondidas}</span>
          </p>
          <Button onClick={() => navigate(backUrl)} className="w-full gap-2 rounded-xl">
            <Home className="w-4 h-4" /> Voltar aos temas
          </Button>
        </motion.div>
      </div>
    );
  }

  // Jogando
  if (!caso) return null;

  const acertou = respostaUsuario === caso.gabarito;
  const progressoGeral = casos.length > 0 ? (casoAtual / casos.length) * 100 : 0;

  const opcoesParaCard = caso.alternativas.map((a: any) => ({
    id: a.letra || a.id,
    texto: a.texto,
    letra: a.letra || a.id,
  }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(0 0% 13%)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white truncate">{area}</h1>
          <p className="text-[10px] text-white/50">Caso {casoAtual + 1}/{casos.length}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-4 max-w-lg mx-auto w-full">
        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-white/40">Progresso</span>
          <div className="flex items-center gap-1 bg-blue-500/15 rounded-lg px-2.5 py-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-bold text-blue-400">{acertos}/{totalRespondidas}</span>
          </div>
        </div>
        <Progress value={progressoGeral} className="h-1.5 mb-5" />

        {/* Cenário */}
        <motion.div animate={shakeControls}>
          <AnimatePresence mode="wait">
            <motion.div
              key={casoAtual}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-5 mb-4 shadow-xl"
              style={{
                background: "linear-gradient(135deg, hsl(220 30% 18%), hsl(230 25% 14%))",
                border: "1px solid hsl(220 30% 25%)",
                boxShadow: "0 8px 32px rgba(40, 50, 120, 0.2)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <p className="text-[10px] font-medium text-blue-400 uppercase tracking-wide">
                  {caso.subtema}
                </p>
              </div>
              <p className="text-sm text-white/90 leading-relaxed mb-4">{caso.cenario}</p>
              <p className="text-base font-semibold text-white">{caso.pergunta}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Alternativas */}
        <MultiplaEscolhaCard
          opcoes={opcoesParaCard}
          opcaoSelecionada={respostaUsuario}
          onSelecionar={(id) => handleResposta(id)}
          disabled={respondida}
        />

        {/* Feedback */}
        <AnimatePresence>
          {respondida && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-4"
            >
              <div
                className={`rounded-xl p-4 ${
                  acertou
                    ? "bg-emerald-900/40 border border-emerald-500/30"
                    : "bg-red-900/40 border border-red-500/30"
                }`}
              >
                <div className="flex items-start gap-2">
                  {acertou ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-bold ${acertou ? "text-emerald-400" : "text-red-400"}`}>
                      {acertou ? "Correto! ✓" : `Incorreto ✗ — Resposta: ${caso.gabarito}`}
                    </p>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed">{caso.explicacao}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão próxima */}
        {respondida && (
          <motion.div
            ref={feedbackRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <Button onClick={proximoCaso} className="w-full rounded-xl h-12 text-base font-bold">
              {casoAtual + 1 >= casos.length ? "Ver Resultado" : "Próximo Caso →"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuestoesCasoPraticoResolver;
