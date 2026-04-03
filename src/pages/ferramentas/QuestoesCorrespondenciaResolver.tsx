import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Link2, Loader2, Home, XCircle, CheckCircle2 } from "lucide-react";
import CountdownStart from "@/components/CountdownStart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { supabase } from "@/integrations/supabase/client";
import { playCorrectLetterSound, playWrongLetterSound } from "@/hooks/useGamificacaoSounds";

interface Par {
  conceito: string;
  definicao: string;
  subtema: string;
}

interface ShuffledItem {
  id: number;
  text: string;
  originalIndex: number;
}

const MAX_BATCH_ATTEMPTS = 16;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QuestoesCorrespondenciaResolver = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const tema = searchParams.get("tema") || "";
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [allPares, setAllPares] = useState<Par[]>([]);
  const [fase, setFase] = useState<"loading" | "countdown" | "jogando" | "resultado">("loading");
  const [erro, setErro] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState({ processados: 0, total: 0 });

  // Game state per round (subtema)
  const [currentSubtemaIndex, setCurrentSubtemaIndex] = useState(0);
  const [selectedConcept, setSelectedConcept] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [errorPair, setErrorPair] = useState<{ concept: number; definition: number } | null>(null);
  const [acertosFirstTry, setAcertosFirstTry] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [roundErrors, setRoundErrors] = useState<Set<number>>(new Set());
  const [shuffledDefs, setShuffledDefs] = useState<ShuffledItem[]>([]);

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

  // Group pares by subtema
  const subtemasGroups = useMemo(() => {
    const map = new Map<string, Par[]>();
    allPares.forEach((p) => {
      const key = p.subtema;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).map(([subtema, pares]) => ({ subtema, pares }));
  }, [allPares]);

  const currentGroup = subtemasGroups[currentSubtemaIndex];
  const currentPares = currentGroup?.pares || [];

  // Shuffle definitions when round changes
  useEffect(() => {
    if (currentPares.length === 0) return;
    const defs: ShuffledItem[] = currentPares.map((p, i) => ({
      id: i,
      text: p.definicao,
      originalIndex: i,
    }));
    setShuffledDefs(shuffleArray(defs));
    setMatchedPairs(new Set());
    setSelectedConcept(null);
    setErrorPair(null);
    setRoundErrors(new Set());
  }, [currentSubtemaIndex, allPares]);

  const carregarPares = useCallback(async () => {
    if (!area || !tema) { setErro("Área e tema são obrigatórios."); return; }
    setFase("loading");
    setErro(null);

    try {
      let geracaoCompleta = false;
      for (let tentativa = 1; tentativa <= MAX_BATCH_ATTEMPTS; tentativa++) {
        const { data, error } = await supabase.functions.invoke("gerar-questoes-correspondencia", { body: { area, tema } });
        if (error) throw error;
        setLoadingInfo({
          processados: Number(data?.subtemas_processados || 0),
          total: Number(data?.total_subtemas || 0),
        });
        if (data?.geracao_completa) { geracaoCompleta = true; break; }
        await sleep(1000);
      }
      if (!geracaoCompleta) throw new Error("A geração não finalizou no tempo esperado.");

      const { data: final, error: erroFinal } = await supabase.functions.invoke("gerar-questoes-correspondencia", {
        body: { area, tema, include_questions: true },
      });
      if (erroFinal) throw erroFinal;

      const pares = (final?.pares || [])
        .map((item: any) => ({
          conceito: String(item?.conceito || "").trim(),
          definicao: String(item?.definicao || "").trim(),
          subtema: String(item?.subtema || tema).trim(),
        }))
        .filter((p: Par) => p.conceito.length > 0 && p.definicao.length > 0);

      if (pares.length === 0) throw new Error("Nenhum par foi gerado para este tema.");

      setAllPares(pares);
      setCurrentSubtemaIndex(0);
      setAcertosFirstTry(0);
      setTotalAttempts(0);
      setFase("countdown");
    } catch (error: any) {
      console.error("Erro ao carregar correspondência:", error);
      setErro(error?.message || "Erro ao gerar os pares");
    }
  }, [area, tema]);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) { navigate("/ferramentas/questoes", { replace: true }); return; }
    carregarPares();
  }, [user, isAdmin, navigate, carregarPares]);

  const handleSelectConcept = (index: number) => {
    if (matchedPairs.has(index) || errorPair) return;
    setSelectedConcept(index);
  };

  const handleSelectDefinition = (defItem: ShuffledItem) => {
    if (selectedConcept === null || matchedPairs.has(defItem.originalIndex) || errorPair) return;

    setTotalAttempts((prev) => prev + 1);

    if (selectedConcept === defItem.originalIndex) {
      // Correct match
      playCorrectLetterSound();
      playFlipSound();
      const newMatched = new Set(matchedPairs);
      newMatched.add(selectedConcept);
      setMatchedPairs(newMatched);

      if (!roundErrors.has(selectedConcept)) {
        setAcertosFirstTry((prev) => prev + 1);
      }

      setSelectedConcept(null);

      // Check if round complete
      if (newMatched.size === currentPares.length) {
        setTimeout(() => {
          if (currentSubtemaIndex + 1 < subtemasGroups.length) {
            setCurrentSubtemaIndex((prev) => prev + 1);
          } else {
            setFase("resultado");
          }
        }, 800);
      }
    } else {
      // Wrong match
      playWrongLetterSound();
      setErrorPair({ concept: selectedConcept, definition: defItem.id });
      setRoundErrors((prev) => new Set(prev).add(selectedConcept));

      setTimeout(() => {
        setErrorPair(null);
        setSelectedConcept(null);
      }, 600);
    }
  };

  const backUrl = `/ferramentas/questoes/correspondencia/temas?area=${encodeURIComponent(area)}`;

  const totalPares = allPares.length;
  const paresResolvidos = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentSubtemaIndex; i++) {
      count += (subtemasGroups[i]?.pares.length || 0);
    }
    count += matchedPairs.size;
    return count;
  }, [currentSubtemaIndex, matchedPairs, subtemasGroups]);

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
            <p className="text-xs text-white/50">Correspondência • {area}</p>
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
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-white mb-1">Gerando pares de correspondência...</p>
                <p className="text-xs text-white/50">Subtemas: {loadingInfo.processados}/{loadingInfo.total || "..."}</p>
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
    const percentual = totalPares > 0 ? Math.round((acertosFirstTry / totalPares) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "hsl(0 0% 13%)" }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm text-center">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-indigo-500/15">
            <span className="text-3xl font-black text-indigo-400">{percentual}%</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {percentual >= 70 ? "Excelente! 🎉" : percentual >= 40 ? "Bom trabalho! 👍" : "Continue praticando! 💪"}
          </h2>
          <p className="text-sm text-white/60 mb-1">{tema} • {area}</p>
          <p className="text-sm text-white/60 mb-2">
            Acertos de primeira: <span className="font-bold text-indigo-400">{acertosFirstTry}</span> de <span className="font-bold text-white">{totalPares}</span>
          </p>
          <p className="text-xs text-white/40 mb-6">{subtemasGroups.length} subtemas</p>
          <Button onClick={() => navigate(backUrl)} className="w-full gap-2 rounded-xl">
            <Home className="w-4 h-4" /> Voltar aos temas
          </Button>
        </motion.div>
      </div>
    );
  }

  // Jogando
  const progressoGeral = totalPares > 0 ? (paresResolvidos / totalPares) * 100 : 0;

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
            Subtema {currentSubtemaIndex + 1}/{subtemasGroups.length} • {currentGroup?.subtema}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/40">Progresso geral</span>
          <span className="text-xs font-bold text-indigo-400">{paresResolvidos}/{totalPares}</span>
        </div>
        <Progress value={progressoGeral} className="h-1.5" />
      </div>

      {/* Game area */}
      <div className="flex-1 px-4 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {/* Left column: Concepts */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide mb-1">Conceitos</p>
            {currentPares.map((par, idx) => {
              const isMatched = matchedPairs.has(idx);
              const isSelected = selectedConcept === idx;
              const isError = errorPair?.concept === idx;

              return (
                <motion.button
                  key={`c-${idx}`}
                  onClick={() => handleSelectConcept(idx)}
                  disabled={isMatched}
                  animate={isError ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                  transition={isError ? { duration: 0.4 } : {}}
                  className={`w-full text-left rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                    isMatched
                      ? "bg-emerald-900/40 border-2 border-emerald-500/50 text-emerald-300 opacity-70"
                      : isError
                      ? "bg-red-900/40 border-2 border-red-500/50 text-red-300"
                      : isSelected
                      ? "bg-indigo-900/50 border-2 border-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-[hsl(0_0%_18%)] border-2 border-transparent text-white/90 hover:border-indigo-500/30"
                  }`}
                >
                  {isMatched && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />}
                  {par.conceito}
                </motion.button>
              );
            })}
          </div>

          {/* Right column: Definitions (shuffled) */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1">Definições</p>
            {shuffledDefs.map((defItem) => {
              const isMatched = matchedPairs.has(defItem.originalIndex);
              const isError = errorPair?.definition === defItem.id;

              return (
                <motion.button
                  key={`d-${defItem.id}`}
                  onClick={() => handleSelectDefinition(defItem)}
                  disabled={isMatched || selectedConcept === null}
                  animate={isError ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                  transition={isError ? { duration: 0.4 } : {}}
                  className={`w-full text-left rounded-xl px-3 py-3 text-[12px] leading-relaxed transition-all ${
                    isMatched
                      ? "bg-emerald-900/40 border-2 border-emerald-500/50 text-emerald-300 opacity-70"
                      : isError
                      ? "bg-red-900/40 border-2 border-red-500/50 text-red-300"
                      : selectedConcept !== null
                      ? "bg-[hsl(0_0%_18%)] border-2 border-transparent text-white/80 hover:border-blue-500/30 cursor-pointer"
                      : "bg-[hsl(0_0%_18%)] border-2 border-transparent text-white/60 cursor-not-allowed"
                  }`}
                >
                  {isMatched && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />}
                  {defItem.text}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-400">{matchedPairs.size}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <Link2 className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-indigo-400">{currentPares.length - matchedPairs.size} restantes</span>
        </div>
      </div>
    </div>
  );
};

export default QuestoesCorrespondenciaResolver;
