import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { normalizeArticleNumber } from "@/lib/articleSorter";
import { useSalvarProgresso } from "@/hooks/useGamificacao";
import { useGamificacaoSounds } from "@/hooks/useGamificacaoSounds";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Loader2, Eye, Clock, Trophy, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const ARTIGOS_POR_NIVEL = 5;
const TEMPO_POR_RODADA = 30;
const VIDAS_INICIAIS = 3;
const PONTOS_POR_PISTA = [100, 80, 60, 40, 20];

interface Rodada {
  artigo_correto: string;
  pistas: string[];
  distratores: string[];
  narrativa: string;
}

const JogoPistasJogar = () => {
  const { nivel: nivelStr } = useParams<{ nivel: string }>();
  const nivel = parseInt(nivelStr || "1");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const salvarProgresso = useSalvarProgresso();
  const { playCorrectLetterSound, playWrongLetterSound, playLevelCompleteSound, playLevelFailSound, playWordCompleteSound } = useGamificacaoSounds();

  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [rodadaAtual, setRodadaAtual] = useState(0);
  const [pistaAtual, setPistaAtual] = useState(0);
  const [vidas, setVidas] = useState(VIDAS_INICIAIS);
  const [pontos, setPontos] = useState(0);
  const [tempo, setTempo] = useState(TEMPO_POR_RODADA);
  const [respondeu, setRespondeu] = useState(false);
  const [respostaCorreta, setRespostaCorreta] = useState<string | null>(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [vitoria, setVitoria] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [opcoes, setOpcoes] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin]);

  // Fetch artigos for this level
  const { data: artigosNivel = [], isLoading: loadingArtigos } = useQuery({
    queryKey: ["pistas-artigos-nivel", nivel],
    queryFn: async () => {
      const allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("CP - Código Penal" as any)
          .select('id, "Número do Artigo", Artigo')
          .order("ordem_artigo", { ascending: true, nullsFirst: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw error;
        if (data) allData.push(...data);
        hasMore = (data?.length || 0) === pageSize;
        page++;
      }
      const seen = new Set<string>();
      const sorted = allData
        .filter((item: any) => {
          const num = item["Número do Artigo"]?.trim();
          if (!num) return false;
          if (seen.has(num)) return false;
          seen.add(num);
          return true;
        })
        .sort((a: any, b: any) =>
          normalizeArticleNumber(a["Número do Artigo"]) - normalizeArticleNumber(b["Número do Artigo"])
        );
      const start = (nivel - 1) * ARTIGOS_POR_NIVEL;
      return sorted.slice(start, start + ARTIGOS_POR_NIVEL);
    },
    staleTime: 1000 * 60 * 10,
  });

  // Generate clues when articles load
  useEffect(() => {
    if (artigosNivel.length > 0 && rodadas.length === 0 && !gerando) {
      gerarPistas();
    }
  }, [artigosNivel]);

  const gerarPistas = async () => {
    setGerando(true);
    try {
      const artigos = artigosNivel.map((a: any) => ({
        numero: a["Número do Artigo"]?.trim(),
        conteudo: a.Artigo || "",
      }));

      const { data, error } = await supabase.functions.invoke("gerar-pistas-artigo", {
        body: { artigos },
      });

      if (error) throw error;
      if (!data?.rodadas?.length) throw new Error("Sem rodadas geradas");

      setRodadas(data.rodadas);
      iniciarRodada(data.rodadas, 0);
    } catch (err: any) {
      console.error("Erro ao gerar pistas:", err);
      toast.error("Erro ao gerar pistas. Tente novamente.");
    } finally {
      setGerando(false);
    }
  };

  const iniciarRodada = (rods: Rodada[], idx: number) => {
    const rodada = rods[idx];
    if (!rodada) return;
    setPistaAtual(0);
    setRespondeu(false);
    setRespostaCorreta(null);
    setRespostaSelecionada(null);
    setTempo(TEMPO_POR_RODADA);

    // Shuffle options
    const opts = [rodada.artigo_correto, ...rodada.distratores].sort(() => Math.random() - 0.5);
    setOpcoes(opts);
    iniciarTimer();
  };

  const iniciarTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTempo(TEMPO_POR_RODADA);
    timerRef.current = setInterval(() => {
      setTempo(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTempoEsgotado();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTempoEsgotado = () => {
    setRespondeu(true);
    setRespostaCorreta(rodadas[rodadaAtual]?.artigo_correto || null);
    playWrongLetterSound();
    setVidas(prev => {
      const novas = prev - 1;
      if (novas <= 0) {
        setTimeout(() => finalizarGameOver(), 2000);
      } else {
        setTimeout(() => avancarRodada(), 2500);
      }
      return novas;
    });
  };

  const revelarPista = () => {
    if (pistaAtual < 4) {
      setPistaAtual(prev => prev + 1);
      playCorrectLetterSound();
    }
  };

  const handleResposta = (artigo: string) => {
    if (respondeu) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setRespondeu(true);
    setRespostaSelecionada(artigo);

    const correto = rodadas[rodadaAtual]?.artigo_correto;
    setRespostaCorreta(correto || null);

    if (artigo === correto) {
      const pts = PONTOS_POR_PISTA[pistaAtual] || 20;
      setPontos(prev => prev + pts);
      playWordCompleteSound();
      setTimeout(() => avancarRodada(), 2000);
    } else {
      playWrongLetterSound();
      setVidas(prev => {
        const novas = prev - 1;
        if (novas <= 0) {
          setTimeout(() => finalizarGameOver(), 2000);
        } else {
          setTimeout(() => avancarRodada(), 2500);
        }
        return novas;
      });
    }
  };

  const avancarRodada = () => {
    const proxima = rodadaAtual + 1;
    if (proxima >= rodadas.length) {
      finalizarVitoria();
    } else {
      setRodadaAtual(proxima);
      iniciarRodada(rodadas, proxima);
    }
  };

  const finalizarVitoria = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setVitoria(true);
    playLevelCompleteSound();
    const estrelas = vidas >= 3 ? 3 : vidas >= 2 ? 2 : 1;
    salvarProgresso.mutate({
      materia: "pistas-cp",
      nivel,
      estrelas,
      palavras_acertadas: pontos,
      palavras_total: rodadas.length * 100,
    });
  };

  const finalizarGameOver = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(true);
    playLevelFailSound();
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const rodada = rodadas[rodadaAtual];
  const tempoPercentual = (tempo / TEMPO_POR_RODADA) * 100;

  if (loadingArtigos || gerando) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-amber-400 font-medium">{gerando ? "Gerando pistas..." : "Carregando..."}</p>
        <p className="text-xs text-muted-foreground">Preparando o dossiê do nível {nivel}</p>
      </div>
    );
  }

  // Game Over screen
  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950 via-gray-950 to-gray-950 flex flex-col items-center justify-center px-6 gap-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl">💀</motion.div>
        <h2 className="text-2xl font-bold text-red-400">Game Over!</h2>
        <p className="text-muted-foreground text-center">Você perdeu todas as vidas.<br />Pontuação: {pontos} pts</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/gamificacao/jogo-pistas")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => window.location.reload()}>
            <RotateCcw className="w-4 h-4 mr-2" /> Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Victory screen
  if (vitoria) {
    const estrelas = vidas >= 3 ? 3 : vidas >= 2 ? 2 : 1;
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-950 via-gray-950 to-gray-950 flex flex-col items-center justify-center px-6 gap-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl">🏆</motion.div>
        <h2 className="text-2xl font-bold text-amber-400">Nível {nivel} Completo!</h2>
        <div className="flex gap-1 text-3xl">
          {[1, 2, 3].map(s => (
            <motion.span key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: s * 0.2 }}>
              {s <= estrelas ? "⭐" : "☆"}
            </motion.span>
          ))}
        </div>
        <p className="text-muted-foreground">Pontuação: <span className="text-amber-400 font-bold">{pontos}</span> pts</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/gamificacao/jogo-pistas")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Trilha
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => navigate(`/gamificacao/jogo-pistas/${nivel + 1}`)}>
            Próximo Nível →
          </Button>
        </div>
      </div>
    );
  }

  if (!rodada) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-sm border-b border-amber-500/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate("/gamificacao/jogo-pistas")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            {/* Lives */}
            <div className="flex gap-1">
              {Array.from({ length: VIDAS_INICIAIS }).map((_, i) => (
                <Heart key={i} className={`w-5 h-5 ${i < vidas ? "text-red-500 fill-red-500" : "text-gray-600"}`} />
              ))}
            </div>
            {/* Points */}
            <div className="bg-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-sm font-bold">
              {pontos} pts
            </div>
          </div>
        </div>

        {/* Timer bar */}
        <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${tempo > 10 ? "bg-green-500" : tempo > 5 ? "bg-yellow-500" : "bg-red-500"}`}
            animate={{ width: `${tempoPercentual}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">Rodada {rodadaAtual + 1}/{rodadas.length}</span>
          <span className={`text-xs font-bold ${tempo <= 5 ? "text-red-400 animate-pulse" : "text-muted-foreground"}`}>
            <Clock className="w-3 h-3 inline mr-1" />{tempo}s
          </span>
        </div>
      </div>

      {/* Narrative */}
      {rodada.narrativa && (
        <div className="mx-4 mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-300 italic leading-relaxed">📖 {rodada.narrativa}</p>
        </div>
      )}

      {/* Clues */}
      <div className="flex-1 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-amber-400">🔍 Pistas Reveladas</h3>
          {!respondeu && pistaAtual < 4 && (
            <Button size="sm" variant="outline" onClick={revelarPista} className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
              <Eye className="w-3 h-3 mr-1" /> Revelar Pista ({PONTOS_POR_PISTA[pistaAtual + 1]} pts)
            </Button>
          )}
        </div>

        <AnimatePresence>
          {rodada.pistas.slice(0, pistaAtual + 1).map((pista, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3 rounded-lg border ${
                idx === pistaAtual
                  ? "bg-amber-500/15 border-amber-500/40"
                  : "bg-gray-800/50 border-gray-700/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  idx === pistaAtual ? "bg-amber-500 text-white" : "bg-gray-700 text-gray-300"
                }`}>
                  {idx + 1}
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{pista}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Points indicator */}
        <div className="text-center">
          <span className="text-xs text-muted-foreground">
            Valor atual: <span className="text-amber-400 font-bold">{PONTOS_POR_PISTA[pistaAtual]} pts</span>
          </span>
        </div>
      </div>

      {/* Answer options */}
      <div className="px-4 pb-6 space-y-2">
        <p className="text-xs text-center text-muted-foreground mb-2">Qual é o artigo?</p>
        <div className="grid grid-cols-2 gap-2">
          {opcoes.map(artigo => {
            let btnClass = "bg-gray-800/70 border-gray-600 hover:border-amber-500/60 text-foreground";
            if (respondeu) {
              if (artigo === respostaCorreta) {
                btnClass = "bg-green-500/30 border-green-500 text-green-300";
              } else if (artigo === respostaSelecionada) {
                btnClass = "bg-red-500/30 border-red-500 text-red-300";
              } else {
                btnClass = "bg-gray-800/40 border-gray-700 text-gray-500 opacity-50";
              }
            }
            return (
              <motion.button
                key={artigo}
                whileTap={!respondeu ? { scale: 0.95 } : undefined}
                disabled={respondeu}
                onClick={() => handleResposta(artigo)}
                className={`p-4 rounded-xl border-2 text-center font-bold text-lg transition-all ${btnClass}`}
              >
                Art. {artigo}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JogoPistasJogar;
