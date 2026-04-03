import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, Zap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CODIGO_TO_TABLE } from "@/lib/codigoMappings";
import { motion } from "framer-motion";
import InvasoresCanvas from "@/components/jogos/InvasoresCanvas";
import InvasoresQuestao from "@/components/jogos/InvasoresQuestao";
import InvasoresGameOver from "@/components/jogos/InvasoresGameOver";
import InvasoresBriefing from "@/components/jogos/InvasoresBriefing";
import InvasoresPowerUps, { type PowerUpType } from "@/components/jogos/InvasoresPowerUps";
import { useGameMusic } from "@/components/jogos/useGameMusic";
import { useInvasoresHistorico } from "@/hooks/useInvasoresHistorico";

interface Artigo {
  numero: string;
  texto: string;
}

type GhostType = 'normal' | 'elite' | 'boss';
type GamePhase = 'hub' | 'briefing' | 'playing' | 'question' | 'gameover';

const CODIGOS_DISPONIVEIS = [
  { slug: 'cp', nome: 'Código Penal', icone: '⚖️', sigla: 'CP' },
  { slug: 'cpc', nome: 'Código de Processo Civil', icone: '📋', sigla: 'CPC' },
  { slug: 'cpp', nome: 'Código de Processo Penal', icone: '🔍', sigla: 'CPP' },
  { slug: 'cdc', nome: 'Código de Defesa do Consumidor', icone: '🛒', sigla: 'CDC' },
  { slug: 'cf', nome: 'Constituição Federal', icone: '📜', sigla: 'CF' },
  { slug: 'clt', nome: 'CLT', icone: '👷', sigla: 'CLT' },
  { slug: 'ctn', nome: 'Código Tributário Nacional', icone: '💰', sigla: 'CTN' },
  { slug: 'cc', nome: 'Código Civil', icone: '🏠', sigla: 'CC' },
  { slug: 'eca', nome: 'Estatuto da Criança', icone: '👶', sigla: 'ECA' },
];

const InvasoresGame = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('hub');
  const [codigoSlug, setCodigoSlug] = useState('');
  const [codigoNome, setCodigoNome] = useState('');
  const [codigoIcone, setCodigoIcone] = useState('');
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [totalArtigos, setTotalArtigos] = useState(0);
  const [loading, setLoading] = useState(false);

  const [vidas, setVidas] = useState(3);
  const [pontuacao, setPontuacao] = useState(0);
  const [nivel, setNivel] = useState(1);
  const [fantasmasDestruidos, setFantasmasDestruidos] = useState(0);

  const [artigoAtual, setArtigoAtual] = useState<Artigo | null>(null);
  const [ghostTypeAtual, setGhostTypeAtual] = useState<GhostType>('normal');
  const [artigosErrados, setArtigosErrados] = useState<Artigo[]>([]);
  const [artigosCobertosSession, setArtigosCobertosSession] = useState<Set<string>>(new Set());
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [countdown, setCountdown] = useState<number | string | null>(null);
  const { start: startMusic, stop: stopMusic } = useGameMusic();
  const { historicos, getHistoricoByCodigo, getMelhorPontuacao, salvarResultado } = useInvasoresHistorico();

  // Power-ups state
  const [powerUps, setPowerUps] = useState([
    { type: 'triple_shot' as PowerUpType, available: false, used: false, killsNeeded: 10 },
    { type: 'shield' as PowerUpType, available: false, used: false, killsNeeded: 20 },
    { type: 'bomb' as PowerUpType, available: false, used: false, killsNeeded: 30 },
  ]);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpsUsedCount, setPowerUpsUsedCount] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);

  useEffect(() => {
    if (phase === 'playing' && !showExitConfirm && countdown === null) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [phase, showExitConfirm, startMusic, stopMusic, countdown]);

  // Update power-up availability based on kills
  useEffect(() => {
    setPowerUps(prev => prev.map(pu => ({
      ...pu,
      available: !pu.used && fantasmasDestruidos >= pu.killsNeeded,
    })));
  }, [fantasmasDestruidos]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 'GO!') {
      const timer = setTimeout(() => setCountdown(null), 600);
      return () => clearTimeout(timer);
    }
    if (typeof countdown === 'number' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown === 1 ? 'GO!' : countdown - 1);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const carregarArtigos = async (slug: string) => {
    setLoading(true);
    try {
      const tabela = CODIGO_TO_TABLE[slug];
      if (!tabela) throw new Error('Código não encontrado');

      // Get total count
      const { count } = await (supabase as any)
        .from(tabela)
        .select('*', { count: 'exact', head: true });
      setTotalArtigos(count || 0);

      const { data, error } = await (supabase as any)
        .from(tabela)
        .select('"Número do Artigo", "Artigo"')
        .order('"Número do Artigo"', { ascending: true })
        .limit(500);

      if (error) throw error;

      const artigosFormatados: Artigo[] = (data || [])
        .filter((a: any) => a['Número do Artigo'] && a['Artigo'])
        .map((a: any) => ({
          numero: String(a['Número do Artigo']),
          texto: a['Artigo'],
        }));

      if (artigosFormatados.length < 5) {
        toast.error('Poucos artigos disponíveis neste código');
        return;
      }

      setArtigos(artigosFormatados);
      if (totalArtigos === 0) setTotalArtigos(artigosFormatados.length);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
      toast.error('Erro ao carregar artigos');
    } finally {
      setLoading(false);
    }
  };

  const selecionarCodigo = (slug: string, nome: string, icone: string) => {
    setCodigoSlug(slug);
    setCodigoNome(nome);
    setCodigoIcone(icone);
    carregarArtigos(slug);
    setPhase('briefing');
  };

  const iniciarJogo = () => {
    setCountdown(3);
    setPhase('playing');
  };

  const onGhostReachedBottom = useCallback((artigo: Artigo, ghostType: GhostType) => {
    // Shield intercept
    if (shieldActive) {
      setShieldActive(false);
      toast.success('Escudo Jurídico absorveu o invasor!');
      return;
    }
    setArtigoAtual(artigo);
    setGhostTypeAtual(ghostType);
    setArtigosCobertosSession(prev => new Set(prev).add(artigo.numero));
    setPhase('question');
  }, [shieldActive]);

  const onGhostDestroyed = useCallback((ghostType: GhostType) => {
    const bonusMap: Record<GhostType, number> = { normal: 100, elite: 250, boss: 500 };
    const bonus = bonusMap[ghostType];
    setPontuacao(prev => prev + bonus * nivel);
    setFantasmasDestruidos(prev => {
      const novo = prev + 1;
      if (novo % 10 === 0) {
        setNivel(n => n + 1);
      }
      return novo;
    });
  }, [nivel]);

  const activatePowerUp = useCallback((type: PowerUpType) => {
    setPowerUps(prev => prev.map(pu =>
      pu.type === type ? { ...pu, used: true, available: false } : pu
    ));
    setPowerUpsUsedCount(prev => prev + 1);

    switch (type) {
      case 'triple_shot':
        setActivePowerUp('triple_shot');
        toast.success('🔫 Tiro Triplo ativado! 8 segundos');
        setTimeout(() => setActivePowerUp(null), 8000);
        break;
      case 'shield':
        setShieldActive(true);
        setActivePowerUp('shield');
        toast.success('🛡️ Escudo Jurídico ativado!');
        setTimeout(() => setActivePowerUp(null), 2000);
        break;
      case 'bomb':
        setActivePowerUp('bomb');
        toast.success('💣 Bomba Legal! Destruindo todos!');
        setTimeout(() => setActivePowerUp(null), 1500);
        break;
    }
  }, []);

  const onAnswerResult = (correct: boolean) => {
    if (correct) {
      const bonusMap: Record<GhostType, number> = { normal: 200, elite: 300, boss: 400 };
      const bonus = bonusMap[ghostTypeAtual];
      setPontuacao(prev => prev + bonus);
      toast.success(`Correto! +${bonus} pontos`);
    } else {
      setVidas(prev => {
        const novasVidas = prev - 1;
        if (novasVidas <= 0) {
          // Save before game over
          salvarResultado({
            codigoSlug,
            pontuacao,
            nivelMaximo: nivel,
            fantasmasDestruidos,
            artigosCobertos: [...artigosCobertosSession],
            powerUpsUsados: powerUpsUsedCount,
          });
          setPhase('gameover');
          return 0;
        }
        return novasVidas;
      });
      if (artigoAtual) {
        setArtigosErrados(prev => [...prev, artigoAtual]);
      }
      toast.error('Errou! Perdeu uma vida');
    }
    if (vidas > 1 || correct) {
      setPhase('playing');
    }
    setArtigoAtual(null);
    setGhostTypeAtual('normal');
  };

  const reiniciarJogo = () => {
    setVidas(3);
    setPontuacao(0);
    setNivel(1);
    setFantasmasDestruidos(0);
    setArtigosErrados([]);
    setArtigosCobertosSession(new Set());
    setPowerUps([
      { type: 'triple_shot', available: false, used: false, killsNeeded: 10 },
      { type: 'shield', available: false, used: false, killsNeeded: 20 },
      { type: 'bomb', available: false, used: false, killsNeeded: 30 },
    ]);
    setActivePowerUp(null);
    setShieldActive(false);
    setPowerUpsUsedCount(0);
    setCountdown(3);
    setPhase('playing');
  };

  const voltarHub = () => {
    stopMusic();
    setShowExitConfirm(false);
    setPhase('hub');
    setArtigos([]);
    setVidas(3);
    setPontuacao(0);
    setNivel(1);
    setFantasmasDestruidos(0);
    setArtigosErrados([]);
    setArtigosCobertosSession(new Set());
    setPowerUps([
      { type: 'triple_shot', available: false, used: false, killsNeeded: 10 },
      { type: 'shield', available: false, used: false, killsNeeded: 20 },
      { type: 'bomb', available: false, used: false, killsNeeded: 30 },
    ]);
    setActivePowerUp(null);
    setShieldActive(false);
    setPowerUpsUsedCount(0);
  };

  const handleBackClick = () => {
    if (phase === 'playing' || phase === 'question') {
      setShowExitConfirm(true);
    } else {
      voltarHub();
    }
  };

  // ===== HUB SCREEN =====
  if (phase === 'hub') {
    const melhor = getMelhorPontuacao();

    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-cyan-950/20 to-neutral-950 pb-20">
        <div className="px-3 py-4 max-w-lg mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate('/gamificacao')} className="mb-3 text-neutral-400">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-4">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-6xl mb-2"
            >
              🚀
            </motion.div>
            <h1 className="text-2xl font-black text-white tracking-tight">INVASORES JURÍDICOS</h1>
            <p className="text-cyan-400/70 text-sm mt-1">Defenda a justiça!</p>
          </motion.div>

          {/* Record Card */}
          {melhor && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Card className="bg-neutral-900/60 border-yellow-500/20 mb-4">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-neutral-400 text-sm">Seu Record:</span>
                    <span className="text-yellow-400 font-bold text-sm">{melhor.pontuacao.toLocaleString()} pts</span>
                  </div>
                  <span className="text-cyan-400 text-xs font-semibold">Nv.{melhor.nivel_maximo}</span>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {CODIGOS_DISPONIVEIS.map((cod, index) => {
                const hist = getHistoricoByCodigo(cod.slug);
                const hasPlayed = !!hist;

                return (
                  <motion.div
                    key={cod.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:scale-[1.03] transition-all border-cyan-500/15 hover:border-cyan-500/50 bg-neutral-900/60 backdrop-blur-sm relative overflow-hidden group"
                      onClick={() => selecionarCodigo(cod.slug, cod.nome, cod.icone)}
                    >
                      {/* Neon glow on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-cyan-500/5 to-transparent" />
                      <CardContent className="p-3 text-center relative">
                        <div className="text-3xl mb-1">{cod.icone}</div>
                        <h3 className="font-bold text-white text-xs leading-tight">{cod.nome}</h3>
                        <span className="text-cyan-400/60 text-[10px] font-mono">{cod.sigla}</span>
                        {hasPlayed && (
                          <div className="mt-1.5 flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-400/80 text-[10px] font-bold">{hist!.pontuacao.toLocaleString()}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== BRIEFING SCREEN =====
  if (phase === 'briefing') {
    return (
      <InvasoresBriefing
        codigoSlug={codigoSlug}
        codigoNome={codigoNome}
        codigoIcone={codigoIcone}
        totalArtigos={totalArtigos || artigos.length}
        historico={getHistoricoByCodigo(codigoSlug)}
        onPlay={iniciarJogo}
        onBack={voltarHub}
      />
    );
  }

  // ===== GAME OVER =====
  if (phase === 'gameover') {
    return (
      <InvasoresGameOver
        pontuacao={pontuacao}
        nivel={nivel}
        fantasmasDestruidos={fantasmasDestruidos}
        artigosErrados={artigosErrados}
        codigoNome={codigoNome}
        artigosCobertos={artigosCobertosSession.size}
        totalArtigos={totalArtigos || artigos.length}
        onRestart={reiniciarJogo}
        onBack={voltarHub}
      />
    );
  }

  // ===== PLAYING + QUESTION =====
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* HUD */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/80 z-10">
        <Button variant="ghost" size="sm" onClick={handleBackClick} className="text-neutral-400 p-1 h-auto">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2">
          {/* Article progress */}
          <div className="flex items-center gap-1 text-neutral-500 text-[10px]">
            <BookOpen className="w-3 h-3" />
            {artigosCobertosSession.size}/{totalArtigos || artigos.length}
          </div>

          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart key={i} className={`w-4 h-4 ${i < vidas ? 'text-red-500 fill-red-500' : 'text-neutral-700'}`} />
            ))}
          </div>
          <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
            <Star className="w-3.5 h-3.5 fill-yellow-400" />
            {pontuacao}
          </div>
          <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold">
            <Zap className="w-3 h-3" />
            Nv.{nivel}
          </div>
        </div>
      </div>

      {/* Power-ups bar */}
      <div className="px-3 py-1 bg-black/60 z-10 flex justify-end">
        <InvasoresPowerUps
          kills={fantasmasDestruidos}
          powerUps={powerUps}
          onActivate={activatePowerUp}
          activePowerUp={activePowerUp}
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <InvasoresCanvas
          artigos={artigos}
          nivel={nivel}
          paused={phase === 'question' || showExitConfirm || countdown !== null}
          onGhostReachedBottom={onGhostReachedBottom}
          onGhostDestroyed={onGhostDestroyed}
          activePowerUp={activePowerUp}
        />

        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60">
            <div className="text-center" key={String(countdown)}>
              <div className={`font-black ${countdown === 'GO!' ? 'text-7xl text-green-400' : 'text-8xl text-cyan-400'}`}
                style={{
                  textShadow: countdown === 'GO!'
                    ? '0 0 40px rgba(74,222,128,0.8), 0 0 80px rgba(74,222,128,0.4)'
                    : '0 0 40px rgba(34,211,238,0.8), 0 0 80px rgba(34,211,238,0.4)',
                }}>
                {countdown}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Modal */}
      {phase === 'question' && artigoAtual && (
        <InvasoresQuestao
          artigo={artigoAtual}
          codigoNome={codigoNome}
          dificuldade={ghostTypeAtual}
          onResult={onAnswerResult}
        />
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-30">
          <Card className="w-full max-w-sm bg-neutral-900 border-yellow-500/40">
            <CardContent className="p-6 space-y-4 text-center">
              <div className="text-5xl">⚠️</div>
              <h2 className="text-white font-bold text-lg">Você realmente quer sair?</h2>
              <p className="text-neutral-400 text-sm">Seu progresso será perdido.</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                  onClick={() => {
                    salvarResultado({
                      codigoSlug,
                      pontuacao,
                      nivelMaximo: nivel,
                      fantasmasDestruidos,
                      artigosCobertos: [...artigosCobertosSession],
                      powerUpsUsados: powerUpsUsedCount,
                    });
                    voltarHub();
                  }}
                >
                  Sair
                </Button>
                <Button
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Continuar Jogando
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InvasoresGame;
