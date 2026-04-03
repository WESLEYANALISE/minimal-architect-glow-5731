import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Home, Lightbulb } from "lucide-react";
import CountdownStart from "@/components/CountdownStart";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { supabase } from "@/integrations/supabase/client";
import { playCorrectLetterSound, playWrongLetterSound } from "@/hooks/useGamificacaoSounds";

interface Pergunta {
  afirmacao: string;
  resposta: boolean;
  explicacao: string;
  subtema: string;
}

const MAX_BATCH_ATTEMPTS = 16;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const QuestoesSimNaoResolver = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const temaParam = searchParams.get("tema") || "";
  const temasParam = searchParams.get("temas") || "";
  // Support both single tema and multiple temas (deck mode)
  const temasList = temasParam ? temasParam.split(",").map(t => decodeURIComponent(t)) : temaParam ? [temaParam] : [];
  const tema = temasList[0] || "";

  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [totalRespondidas, setTotalRespondidas] = useState(0);
  const [respondida, setRespondida] = useState(false);
  const [respostaUsuario, setRespostaUsuario] = useState<boolean | null>(null);
  const [fase, setFase] = useState<"loading" | "countdown" | "jogando" | "resultado">("loading");
  const [erro, setErro] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState({ processados: 0, total: 0, geradas: 0 });
  const [showExemplo, setShowExemplo] = useState(false);
  const [exemploTexto, setExemploTexto] = useState<string | null>(null);
  const [exemploLoading, setExemploLoading] = useState(false);
  const exemplosCache = useRef<Record<number, string>>({});

  const carregarPerguntas = useCallback(async () => {
    if (!area || temasList.length === 0) { setErro("Área e tema são obrigatórios."); return; }
    setFase("loading");
    setErro(null);

    try {
      const allPerguntas: Pergunta[] = [];

      for (const temaAtual of temasList) {
        let geracaoCompleta = false;
        for (let tentativa = 1; tentativa <= MAX_BATCH_ATTEMPTS; tentativa++) {
          const { data, error } = await supabase.functions.invoke("gerar-questoes-sim-nao", { body: { area, tema: temaAtual } });
          if (error) throw error;
          setLoadingInfo((prev) => ({
            processados: Number(data?.subtemas_processados || prev.processados),
            total: Number(data?.total_subtemas || prev.total),
            geradas: prev.geradas + Number(data?.questoes_geradas || 0),
          }));
          if (data?.geracao_completa) { geracaoCompleta = true; break; }
          await sleep(1000);
        }
        if (!geracaoCompleta) throw new Error("A geração não finalizou no tempo esperado. Tente novamente.");

        const { data: resultadoFinal, error: erroFinal } = await supabase.functions.invoke("gerar-questoes-sim-nao", {
          body: { area, tema: temaAtual, include_questions: true },
        });
        if (erroFinal) throw erroFinal;

        const perguntasDoTema = (resultadoFinal?.perguntas || [])
          .map((item: any) => ({
            afirmacao: String(item?.afirmacao || "").trim(),
            resposta: typeof item?.resposta === "boolean" ? item.resposta : String(item?.resposta).trim().toLowerCase() === "true",
            explicacao: String(item?.explicacao || "").trim(),
            subtema: String(item?.subtema || temaAtual).trim(),
          }))
          .filter((item: Pergunta) => item.afirmacao.length > 0 && item.explicacao.length > 0);

        allPerguntas.push(...perguntasDoTema);
      }

      if (allPerguntas.length === 0) throw new Error("Nenhuma questão foi gerada para este tema.");

      // Shuffle questions when multiple temas (deck mode)
      const perguntasFinais = temasList.length > 1 
        ? allPerguntas.sort(() => Math.random() - 0.5) 
        : allPerguntas;

      setPerguntas(perguntasFinais);
      setPerguntaAtual(0);
      setAcertos(0);
      setTotalRespondidas(0);
      setRespondida(false);
      setRespostaUsuario(null);
      setFase("countdown");
    } catch (error: any) {
      console.error("Erro ao carregar questões Sim/Não:", error);
      setErro(error?.message || "Erro ao gerar as questões");
    }
  }, [area, temasList.join(",")]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) { navigate("/ferramentas/questoes", { replace: true }); return; }
    carregarPerguntas();
  }, [user, isAdmin, navigate, carregarPerguntas]);

  const shakeControls = useAnimation();

  const handleResposta = useCallback(
    async (resposta: boolean) => {
      if (respondida || !perguntas[perguntaAtual]) return;
      setRespondida(true);
      setRespostaUsuario(resposta);
      setTotalRespondidas((prev) => prev + 1);
      const correta = resposta === perguntas[perguntaAtual].resposta;
      if (correta) { setAcertos((prev) => prev + 1); playCorrectLetterSound(); }
      else {
        playWrongLetterSound();
        shakeControls.start({
          x: [0, -8, 8, -6, 6, -3, 3, 0],
          transition: { duration: 0.5 },
        });
      }
    },
    [respondida, perguntas, perguntaAtual, shakeControls]
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
    try {
      if (flipSoundRef.current) {
        flipSoundRef.current.currentTime = 0;
        flipSoundRef.current.play().catch(() => {});
      }
    } catch {}
  }, []);

  const proximaPergunta = useCallback(() => {
    if (perguntaAtual + 1 >= perguntas.length) { setFase("resultado"); return; }
    playFlipSound();
    setPerguntaAtual((prev) => prev + 1);
    setRespondida(false);
    setRespostaUsuario(null);
    setShowExemplo(false);
    setExemploTexto(null);
  }, [perguntaAtual, perguntas.length, playFlipSound]);

  const subtemasUnicos = useMemo(() => [...new Set(perguntas.map((p) => p.subtema || tema))], [perguntas, tema]);

  const pergunta = perguntas[perguntaAtual];
  const subtemaAtual = pergunta?.subtema || tema;

  const indicesSubtemaAtual = useMemo(() => {
    const indices: number[] = [];
    perguntas.forEach((item, index) => { if ((item.subtema || tema) === subtemaAtual) indices.push(index); });
    return indices;
  }, [perguntas, subtemaAtual, tema]);

  const perguntaNoSubtema = Math.max(1, indicesSubtemaAtual.indexOf(perguntaAtual) + 1);
  const totalPerguntasSubtema = Math.max(1, indicesSubtemaAtual.length);
  const subtemaAtualIndex = Math.max(1, subtemasUnicos.indexOf(subtemaAtual) + 1);

  const gerarExemploPratico = useCallback(async () => {
    if (!pergunta) return;
    if (exemplosCache.current[perguntaAtual]) {
      setExemploTexto(exemplosCache.current[perguntaAtual]);
      setShowExemplo(true);
      return;
    }
    setExemploLoading(true);
    setShowExemplo(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-exemplo-pratico", {
        body: {
          palavra: pergunta.afirmacao.substring(0, 100),
          significado: `${pergunta.afirmacao}\n\nExplicação: ${pergunta.explicacao}\n\nResposta correta: ${pergunta.resposta ? "Verdadeiro" : "Falso"}`,
        },
      });
      if (error) throw error;
      const texto = data?.exemplo || data?.text || "Não foi possível gerar o exemplo.";
      exemplosCache.current[perguntaAtual] = texto;
      setExemploTexto(texto);
    } catch (err) {
      console.error("Erro ao gerar exemplo:", err);
      setExemploTexto("Erro ao gerar exemplo prático. Tente novamente.");
    } finally {
      setExemploLoading(false);
    }
  }, [pergunta, perguntaAtual]);

  const backUrl = `/ferramentas/questoes/sim-nao/temas?area=${encodeURIComponent(area)}`;

  // ── Loading ──
  if (fase === "loading") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "hsl(0 0% 13%)" }}>
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </Button>
          <div>
            <h1 className="text-sm font-bold text-white truncate">{tema}</h1>
            <p className="text-xs text-white/50">Sim ou Não • {area}</p>
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
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white mb-1">Gerando todas as questões do tema...</p>
                <p className="text-xs text-white/50">Subtemas processados: {loadingInfo.processados}/{loadingInfo.total || "..."}</p>
                <p className="text-[11px] text-white/40 mt-1">Questões geradas: {loadingInfo.geradas}</p>
              </div>
              <Progress value={loadingInfo.total > 0 ? (loadingInfo.processados / loadingInfo.total) * 100 : 5} className="w-56 h-2" />
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Countdown ──
  if (fase === "countdown") {
    return <CountdownStart onComplete={() => setFase("jogando")} />;
  }

  if (fase === "resultado") {
    const percentual = totalRespondidas > 0 ? Math.round((acertos / totalRespondidas) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "hsl(0 0% 13%)" }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-primary/15">
            <span className="text-3xl font-black text-primary">{percentual}%</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {percentual >= 70 ? "Excelente! 🎉" : percentual >= 40 ? "Bom trabalho! 👍" : "Continue praticando! 💪"}
          </h2>
          <p className="text-sm text-white/60 mb-1">{tema} • {area}</p>
          <p className="text-sm text-white/60 mb-2">
            Você acertou <span className="font-bold text-primary">{acertos}</span> de <span className="font-bold text-white">{totalRespondidas}</span>
          </p>
          <p className="text-xs text-white/40 mb-6">{subtemasUnicos.length} subtemas</p>
          <Button onClick={() => navigate(backUrl)} className="w-full gap-2 rounded-xl">
            <Home className="w-4 h-4" /> Voltar aos temas
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Jogando ──
  if (!pergunta) return null;

  const acertou = respostaUsuario === pergunta.resposta;
  const progressoGeral = perguntas.length > 0 ? (perguntaAtual / perguntas.length) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(0 0% 13%)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}>
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white truncate">{area}</h1>
          <p className="text-[10px] text-white/50">
            Pergunta {perguntaAtual + 1}/{perguntas.length}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-4 max-w-lg mx-auto w-full">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-white/40">Progresso geral</span>
          <div className="flex items-center gap-1 bg-primary/15 rounded-lg px-2.5 py-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">{acertos}/{totalRespondidas}</span>
          </div>
        </div>
        <Progress value={progressoGeral} className="h-1.5 mb-5" />

        {/* Card da questão */}
        <motion.div animate={shakeControls}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${perguntaAtual}-${subtemaAtual}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className={`rounded-2xl p-6 mb-5 min-h-[180px] flex flex-col justify-center shadow-xl ${
                respondida
                  ? acertou
                    ? "bg-gradient-to-br from-emerald-900/80 to-emerald-950/90 border-2 border-emerald-500/40"
                    : "bg-gradient-to-br from-red-900/80 to-red-950/90 border-2 border-red-500/40"
                  : "bg-gradient-to-br from-red-900 to-red-950 border-2 border-red-700/50"
              }`}
              style={{
                boxShadow: respondida
                  ? acertou
                    ? "0 8px 32px rgba(16, 185, 129, 0.15)"
                    : "0 8px 32px rgba(220, 38, 38, 0.2)"
                  : "0 8px 32px rgba(160, 40, 30, 0.25)",
              }}
            >
              {/* Subtopic badge inside card */}
              <p className="text-[10px] font-medium text-white/40 mb-3 uppercase tracking-wide">
                {subtemaAtual}
              </p>

              <p className="text-base font-semibold text-white leading-relaxed">{pergunta.afirmacao}</p>

              {respondida && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="flex items-start gap-2">
                    {acertou ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-bold ${acertou ? "text-emerald-400" : "text-red-400"}`}>
                        {acertou ? "Correto! ✓" : "Incorreto ✗"}
                      </p>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">{pergunta.explicacao}</p>
                      <p className="text-[10px] text-white/40 mt-1">
                        Resposta: {pergunta.resposta ? "Verdadeiro" : "Falso"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Exemplo Prático */}
        <AnimatePresence>
          {respondida && showExemplo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-2xl border border-amber-500/30 overflow-hidden"
              style={{ background: "hsla(38, 70%, 15%, 0.5)" }}
            >
              <div className="p-4">
                <p className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4" /> Exemplo Prático
                </p>
                {exemploLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400/60" />
                    <span className="text-sm text-white/50">Gerando exemplo prático com IA...</span>
                  </div>
                ) : (
                  <div className="text-sm text-white/80 leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 [&_strong]:text-amber-400 [&_strong]:font-bold">
                    <ReactMarkdown>{exemploTexto || ""}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botões */}
        {!respondida ? (
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileTap={{ scale: 0.93 }}>
              <button
                onClick={() => handleResposta(true)}
                className="shine-effect w-full h-14 rounded-xl text-base font-bold flex items-center justify-center gap-2 text-white transition-all shadow-lg shadow-emerald-900/40 active:shadow-md"
                style={{
                  background: "linear-gradient(135deg, hsl(152 60% 32%), hsl(152 55% 24%))",
                  border: "1px solid hsla(152, 50%, 45%, 0.3)",
                }}
              >
                <CheckCircle2 className="w-5 h-5" /> Verdadeiro
              </button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.93 }}>
              <button
                onClick={() => handleResposta(false)}
                className="shine-effect w-full h-14 rounded-xl text-base font-bold flex items-center justify-center gap-2 text-white transition-all shadow-lg shadow-red-900/40 active:shadow-md"
                style={{
                  background: "linear-gradient(135deg, hsl(8 65% 42%), hsl(8 60% 30%))",
                  border: "1px solid hsla(8, 50%, 50%, 0.3)",
                }}
              >
                <XCircle className="w-5 h-5" /> Falso
              </button>
            </motion.div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            {!showExemplo && (
              <button
                onClick={gerarExemploPratico}
                className="w-full h-11 rounded-xl text-sm font-semibold text-amber-400 transition-all flex items-center justify-center gap-2"
                style={{
                  background: "hsla(38, 70%, 15%, 0.4)",
                  border: "1px solid hsla(38, 60%, 40%, 0.3)",
                }}
              >
                <Lightbulb className="w-4 h-4" /> Ver Exemplo Prático
              </button>
            )}
            <button
              onClick={proximaPergunta}
              className="shine-effect w-full h-12 rounded-xl text-base font-bold text-white transition-all shadow-lg shadow-red-900/30"
              style={{
                background: "linear-gradient(135deg, hsl(8 65% 42%), hsl(8 55% 32%))",
                border: "1px solid hsla(8, 50%, 50%, 0.3)",
              }}
            >
              {perguntaAtual + 1 >= perguntas.length ? "Ver Resultado" : "Próxima →"}
            </button>
          </motion.div>
        )}

        {/* Footer score */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">{acertos}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-red-400">{totalRespondidas - acertos}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestoesSimNaoResolver;
