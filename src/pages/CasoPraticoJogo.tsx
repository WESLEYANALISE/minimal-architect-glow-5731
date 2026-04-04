import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, BookOpen, Scale, Gavel, ScrollText, MessageCircle, ImagePlus } from "lucide-react";
import { TermoJuridicoTooltip } from "@/components/caso-pratico/TermoJuridicoTooltip";
import { Button } from "@/components/ui/button";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { ContentGenerationLoader } from "@/components/ContentGenerationLoader";
import { PointsAnimation } from "@/components/simulacao/PointsAnimation";
import { useGamificacaoSounds } from "@/hooks/useGamificacaoSounds";
import { motion, AnimatePresence } from "framer-motion";
import CasoPraticoAudioPlayer from "@/components/CasoPraticoAudioPlayer";
import bgPenal from "@/assets/caso-pratico-bg-penal.webp";
import doutor1Img from "@/assets/doutor-1.webp";
import doutor2Img from "@/assets/doutor-2.webp";
import doutora1Img from "@/assets/doutora-1.webp";

const DOUTORES = [
  { nome: "Dr. Rafael Mendes", avatar: doutor1Img, genero: "masculino" as const },
  { nome: "Dr. Carlos Augusto", avatar: doutor2Img, genero: "masculino" as const },
  { nome: "Dra. Fernanda Lima", avatar: doutora1Img, genero: "feminino" as const },
];

// Preload avatar images on module load
DOUTORES.forEach(d => { const img = new Image(); img.src = d.avatar; });

interface Questao {
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

// Full contextual phrases to highlight (sorted longest-first for greedy matching)
const TERMOS_CHAVE = [
  // Compound phrases first (longer = higher priority)
  "restrição de algumas liberdades civis",
  "princípio da anterioridade da lei penal",
  "estrito cumprimento do dever legal",
  "exercício regular de direito",
  "transitou em julgado",
  "trânsito em julgado",
  "princípio da legalidade",
  "estado de defesa social",
  "estado de necessidade",
  "pena de reclusão",
  "pena de detenção",
  "revisão criminal",
  "lei mais benéfica",
  "legítima defesa",
  "regime semiaberto",
  "regime fechado",
  "regime aberto",
  "estado de defesa",
  "estado de sítio",
  "abolitio criminis",
  "habeas corpus",
  "irretroatividade",
  "retroatividade",
  "substância ilícita",
  "descriminalização",
  "câmera de segurança",
  "registro recuperado",
  "forçou a entrada",
  "fugindo rapidamente",
  "ação foi flagrada",
  "ordem pública",
  "medidas mais enérgicas",
  "patrulhas militares",
  "território nacional",
  "privativa de liberdade",
  "lei penal",
  "sentença condenatória",
  "sentença absolutória",
  // Contextual action phrases
  "decretou o",
  "foi preso em flagrante",
  "preso em flagrante",
  "denúncia oferecida",
  "onda de saques e vandalismo",
  "escalada da violência",
  "medida excepcional",
  "aproveitando-se",
  // Single important terms
  "flagrante",
  "condenatória",
  "absolvição",
  "condenação",
  "absolvido",
  "confessou",
  "reincidência",
  "atenuante",
  "agravante",
  "qualificadora",
  "tipicidade",
  "ilicitude",
  "culpabilidade",
  "dolo",
  "culpa",
  "tentativa",
  "consumação",
  "prescrição",
  "decadência",
  "anistia",
  "indulto",
  "recurso",
  "apelação",
  "revogação",
  "multa",
].sort((a, b) => b.length - a.length); // longest first

// Date/value patterns: dd/mm/yyyy, R$ values, durations like "30 dias", "2 anos", percentages
const DATA_VALOR_REGEX = /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}\s+de\s+\w+\s+de\s+\d{4}|R\$\s*[\d.,]+|\d+\s*(?:dias?|meses?|anos?|horas?|minutos?)|\d+[.,]\d+\s*%|\d+%)/gi;

function renderNarrativaComDestaques(texto: string, termosExtras: string[] = []) {
  if (!texto) return null;

  // Merge static + dynamic terms, deduplicate, sort longest-first
  const allTermos = [...new Set([...TERMOS_CHAVE, ...termosExtras])].sort((a, b) => b.length - a.length);

  // First split by date/value patterns
  const segments: { text: string; type: "text" | "date" }[] = [];
  let lastIdx = 0;
  const dateMatches = [...texto.matchAll(DATA_VALOR_REGEX)];
  
  for (const match of dateMatches) {
    const idx = match.index!;
    if (idx > lastIdx) {
      segments.push({ text: texto.slice(lastIdx, idx), type: "text" });
    }
    segments.push({ text: match[0], type: "date" });
    lastIdx = idx + match[0].length;
  }
  if (lastIdx < texto.length) {
    segments.push({ text: texto.slice(lastIdx), type: "text" });
  }

  // Build regex with longest-first ordering
  const escaped = allTermos.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const termoRegex = new RegExp(`(${escaped.join('|')})`, 'gi');

  let keyIdx = 0;
  return segments.map((seg) => {
    if (seg.type === "date") {
      return (
        <span key={`d-${keyIdx++}`} className="text-cyan-400 font-semibold bg-cyan-400/10 px-1 rounded">
          {seg.text}
        </span>
      );
    }

    const parts = seg.text.split(termoRegex);
    return parts.map((part) => {
      const isMatch = escaped.some(e => new RegExp(`^${e}$`, 'i').test(part));
      if (isMatch) {
        return <TermoJuridicoTooltip key={`t-${keyIdx++}`} termo={part}>{part}</TermoJuridicoTooltip>;
      }
      return <span key={`s-${keyIdx++}`}>{part}</span>;
    });
  });
}

const CasoPraticoJogo = () => {
  const { artigo } = useParams<{ artigo: string }>();
  const artigoDecoded = decodeURIComponent(artigo || "");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const queryClient = useQueryClient();
  const sounds = useGamificacaoSounds();

  const [fase, setFase] = useState<"loading" | "narrativa" | "questoes" | "resultado">("loading");
  const [questoesTab, setQuestoesTab] = useState<"questoes" | "caso">("questoes");
  const [caso, setCaso] = useState<any>(null);
  const [progresso, setProgresso] = useState(0);
  const [statusMsg, setStatusMsg] = useState("Carregando...");
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null);
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false);
  const [pontuacao, setPontuacao] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [pointsAnim, setPointsAnim] = useState<{ pts: number; tipo: "ganho" | "perda" } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [chatStep, setChatStep] = useState<"typing" | "pergunta" | "cta" | "opcoes">("typing");
  const [typedText, setTypedText] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const invokedRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick ONE doctor per article (stable across questions)
  const doutorAtual = useMemo(() => {
    const hash = artigoDecoded.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return DOUTORES[hash % DOUTORES.length];
  }, [artigoDecoded]);

  // Get user first name from profiles table (same as greeting)
  const [nomeUsuario, setNomeUsuario] = useState("Estudante");
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.nome) setNomeUsuario(data.nome.split(" ")[0]);
      else {
        const meta = user.user_metadata;
        const fallback = meta?.full_name || meta?.name || user.email?.split("@")[0] || "Estudante";
        setNomeUsuario(fallback.split(" ")[0]);
      }
    });
  }, [user]);

  useEffect(() => {
    if (user && !isAdmin) navigate("/", { replace: true });
  }, [user, isAdmin]);

  const getStatusMessage = (p: number) => {
    if (p < 15) return "Iniciando geração...";
    if (p < 30) return "Lendo o artigo...";
    if (p < 55) return "Gerando caso prático com IA...";
    if (p < 70) return "Criando questões cronológicas...";
    if (p < 100) return "Gerando ilustração da cena...";
    return "Finalizando...";
  };

  const pollStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("gamificacao_casos_praticos")
        .select("*")
        .eq("area", "Código Penal")
        .eq("numero_artigo", artigoDecoded)
        .maybeSingle();

      if (error || !data) return;

      const p = data.progresso_geracao || 0;
      setProgresso(p);
      setStatusMsg(getStatusMessage(p));

      if (data.status === "concluido") {
        setCaso(data);
        setFase("narrativa");
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      } else if (data.status === "erro") {
        setErro("Erro ao gerar o caso prático. Tente novamente.");
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      }
    } catch (e) { console.error("Poll exception:", e); }
  }, [artigoDecoded]);

  useEffect(() => {
    if (!artigoDecoded || invokedRef.current) return;
    invokedRef.current = true;

    const init = async () => {
      try {
        const { data: existing } = await supabase
          .from("gamificacao_casos_praticos")
          .select("*")
          .eq("area", "Código Penal")
          .eq("numero_artigo", artigoDecoded)
          .maybeSingle();

        if (existing?.status === "concluido") {
          setCaso(existing);
          setFase("narrativa");
          return;
        }

        if (existing?.status === "gerando") {
          setProgresso(existing.progresso_geracao || 5);
          setStatusMsg(getStatusMessage(existing.progresso_geracao || 5));
          pollingRef.current = setInterval(pollStatus, 2000);
          return;
        }

        setProgresso(5);
        setStatusMsg("Iniciando geração...");

        const { data, error } = await supabase.functions.invoke("gerar-caso-pratico", {
          body: { numero_artigo: artigoDecoded, area: "Código Penal", codigo: "cp" },
        });

        if (error) {
          setErro("Erro ao iniciar geração. Tente novamente.");
          return;
        }

        if (data?.status === "concluido") {
          setCaso(data);
          setFase("narrativa");
          return;
        }

        pollingRef.current = setInterval(pollStatus, 2000);
      } catch (e) {
        setErro("Erro ao iniciar. Tente novamente.");
      }
    };

    init();
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [artigoDecoded, pollStatus]);

  const questoes: Questao[] = caso?.questoes || [];

  const handleResposta = useCallback((idx: number) => {
    if (respostaSelecionada !== null) return;
    setRespostaSelecionada(idx);
    setMostrarExplicacao(true);

    const isCorrect = idx === questoes[questaoAtual]?.correta;
    if (isCorrect) {
      sounds.playCorrectLetterSound();
      setPontuacao(p => p + 20);
      setAcertos(a => a + 1);
      setPointsAnim({ pts: 20, tipo: "ganho" });
    } else {
      sounds.playWrongLetterSound();
      setPontuacao(p => Math.max(0, p - 5));
      setPointsAnim({ pts: 5, tipo: "perda" });
    }
    setTimeout(() => setPointsAnim(null), 2200);
    // Auto-scroll to explanation after feedback renders
    setTimeout(() => {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    }, 500);
    // Second pass for content that animates in later
    setTimeout(() => {
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
    }, 1200);
  }, [respostaSelecionada, questaoAtual, questoes, sounds]);

  const handleProximaQuestao = useCallback(() => {
    if (questaoAtual + 1 >= questoes.length) {
      sounds.playLevelCompleteSound();
      setFase("resultado");
      salvarProgresso();
    } else {
      setQuestaoAtual(q => q + 1);
      setRespostaSelecionada(null);
      setMostrarExplicacao(false);
      setChatStep("typing");
    }
  }, [questaoAtual, questoes.length, sounds]);

  // Chat animation sequence with typewriter
  useEffect(() => {
    if (fase !== "questoes") return;
    setChatStep("typing");
    setTypedText("");
    if (typewriterRef.current) clearInterval(typewriterRef.current);

    const q = questoes[questaoAtual];
    if (!q) return;

    const fullText = `${nomeUsuario}, ${q.pergunta.charAt(0).toLowerCase() + q.pergunta.slice(1)}`;

    // After "typing" indicator, start typewriter
    const t1 = setTimeout(() => {
      setChatStep("pergunta");
      let charIndex = 0;
      typewriterRef.current = setInterval(() => {
        charIndex++;
        setTypedText(fullText.slice(0, charIndex));
        // Auto-scroll during typing
        chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
        if (charIndex >= fullText.length) {
          if (typewriterRef.current) clearInterval(typewriterRef.current);
          typewriterRef.current = null;
          // Show CTA after typing done
          setTimeout(() => setChatStep("cta"), 400);
          setTimeout(() => setChatStep("opcoes"), 1000);
        }
      }, 20);
    }, 1000);

    return () => {
      clearTimeout(t1);
      if (typewriterRef.current) { clearInterval(typewriterRef.current); typewriterRef.current = null; }
    };
  }, [questaoAtual, fase, questoes, nomeUsuario]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" }), 100);
    }
  }, [chatStep, mostrarExplicacao]);

  const salvarProgresso = async () => {
    if (!user || !caso?.id) return;
    try {
      await supabase
        .from("gamificacao_casos_praticos_progresso")
        .upsert({
          user_id: user.id,
          caso_id: caso.id,
          pontuacao,
          acertos,
          total_questoes: questoes.length,
          concluido: true,
        } as any, { onConflict: "user_id,caso_id" });
      queryClient.invalidateQueries({ queryKey: ["caso-pratico-progresso"] });
    } catch (e) { console.error("Erro salvando progresso:", e); }
  };

  // Extract article number for display
  const artigoNumero = artigoDecoded.replace(/[^\dºª\-A-Za-z]/g, '') || artigoDecoded;

  // ─── LOADING ───
  if (fase === "loading") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <img src={bgPenal} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        </div>

        <div className="relative z-10 px-4 pt-4 pb-2 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/gamificacao/caso-pratico")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Art. {artigoNumero}</h1>
            <p className="text-xs text-muted-foreground">Código Penal • Caso Prático</p>
          </div>
        </div>

        {erro ? (
          <div className="relative z-10 flex flex-col items-center justify-center py-16 px-6 text-center">
            <p className="text-destructive mb-4">{erro}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" /> Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="relative z-10">
            <ContentGenerationLoader message={statusMsg} progress={progresso > 0 ? progresso : undefined} />
          </div>
        )}
      </div>
    );
  }

  // ─── NARRATIVA ───
  if (fase === "narrativa") {
    const resumoArtigo = (caso as any)?.resumo_artigo;
    const hasCapa = !!caso?.imagem_capa_url;

    return (
      <div className="min-h-screen bg-background relative overflow-hidden pb-24">
        {/* Hero image or fallback bg */}
        <div className="relative">
          {hasCapa ? (
            <div className="relative w-full h-56 overflow-hidden">
              <img
                src={caso.imagem_capa_url}
                alt="Ilustração do caso prático"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
            </div>
          ) : (
            <div className="relative w-full h-40 overflow-hidden">
              <img src={bgPenal} alt="" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
              {/* Admin: Regenerate cover button */}
              {isAdmin && (
                <div className="absolute bottom-4 right-4 z-20">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-background/60 backdrop-blur-sm animate-pulse border-red-500/50 text-red-400 hover:bg-red-500/20"
                    onClick={async () => {
                      try {
                        await supabase.functions.invoke("gerar-caso-pratico", {
                          body: { numero_artigo: artigoDecoded, area: "Código Penal", codigo: "cp", regenerar_capa: true },
                        });
                        alert("Capa sendo regenerada em background. Recarregue em alguns segundos.");
                      } catch (e) { alert("Erro ao regenerar capa"); }
                    }}
                  >
                    <ImagePlus className="w-4 h-4 mr-1" /> Gerar Capa
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Back button overlay */}
          <div className="absolute top-4 left-4 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/gamificacao/caso-pratico")}
              className="bg-background/60 backdrop-blur-sm hover:bg-background/80"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Article title card */}
        <div className="relative z-10 px-4 -mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-lg">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground">
                  Artigo {artigoNumero}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Código Penal Brasileiro
                </p>
                {resumoArtigo && (
                  <p className="text-xs text-amber-400/90 mt-2 leading-relaxed">
                    {resumoArtigo}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative z-10 px-4 mt-4"
        >
          <div className="bg-card border border-border/30 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 px-5 py-3 border-b border-border/20 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-foreground">Caso Prático</h2>
              <span className="ml-auto text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {questoes.length} questões
              </span>
            </div>
            <div className="p-5 space-y-4">
              {caso?.audio_url && (
                <CasoPraticoAudioPlayer audioUrl={caso.audio_url} />
              )}
              <p className="text-sm text-foreground/90 leading-[1.8] whitespace-pre-line">
                {renderNarrativaComDestaques(caso?.caso_narrativa || "", caso?.termos_destaque || [])}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative z-10 px-4 mt-4"
        >
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-400">Como jogar</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Leia atentamente o caso prático acima. Em seguida, responda {questoes.length} questões em ordem cronológica sobre os fatos narrados e a aplicação do artigo.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="relative z-10 px-4 mt-6"
        >
          <Button
            onClick={() => setFase("questoes")}
            className="w-full h-14 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-base rounded-xl shadow-lg shadow-red-500/20"
          >
            <Scale className="w-5 h-5 mr-2" />
            Praticar Caso ({questoes.length})
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── QUESTÕES (Chat Style) ───
  if (fase === "questoes" && questoes.length > 0) {
    const q = questoes[questaoAtual];
    const hasCapa = !!caso?.imagem_capa_url;
    const doutor = doutorAtual;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header com capa */}
        <div className="relative shrink-0">
          {hasCapa ? (
            <div className="relative w-full h-28 overflow-hidden">
              <img src={caso.imagem_capa_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
            </div>
          ) : (
            <div className="relative w-full h-28 overflow-hidden">
              <img src={bgPenal} alt="" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
            </div>
          )}

          {/* Top bar overlay */}
          <div className="absolute top-0 left-0 right-0 px-3 pt-3 flex items-center gap-2 z-10">
            <Button variant="ghost" size="icon" onClick={() => setFase("narrativa")} className="bg-background/50 backdrop-blur-sm h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xs font-bold text-foreground truncate">Art. {artigoNumero} • Código Penal</h1>
              <p className="text-[10px] text-muted-foreground">Questão {questaoAtual + 1} de {questoes.length}</p>
            </div>
            <div className="relative text-right bg-background/50 backdrop-blur-sm rounded-lg px-2.5 py-1">
              <span className="text-xs font-bold text-primary">{pontuacao} pts</span>
              {pointsAnim && <PointsAnimation pontos={pointsAnim.pts} tipo={pointsAnim.tipo} />}
            </div>
          </div>

          {/* Progress bar at bottom of header */}
          <div className="absolute bottom-0 left-0 right-0 px-4">
            <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${((questaoAtual + 1) / questoes.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Toggle tabs: Questões / Caso */}
        <div className="shrink-0 px-4 pt-2 pb-1">
          <div className="grid grid-cols-2 gap-1 bg-muted/30 rounded-xl p-1">
            <button
              onClick={() => setQuestoesTab("questoes")}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${questoesTab === "questoes" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              📝 Questões
            </button>
            <button
              onClick={() => setQuestoesTab("caso")}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${questoesTab === "caso" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              📖 Caso
            </button>
          </div>
        </div>

        {/* Content area */}
        {questoesTab === "caso" ? (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="bg-card border border-border/30 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 px-5 py-3 border-b border-border/20 flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-bold text-foreground">Caso Prático</h2>
              </div>
              <div className="p-5 space-y-4">
                {caso?.audio_url && (
                  <CasoPraticoAudioPlayer audioUrl={caso.audio_url} />
                )}
                <p className="text-sm text-foreground/90 leading-[1.8] whitespace-pre-line">
                  {renderNarrativaComDestaques(caso?.caso_narrativa || "", caso?.termos_destaque || [])}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <AnimatePresence mode="wait">
            <motion.div key={questaoAtual} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">

              {/* Typing indicator */}
              {chatStep === "typing" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <img src={doutor.avatar} alt={doutor.nome} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shrink-0" loading="eager" decoding="async" />
                  <div>
                    <p className="text-[10px] font-semibold text-primary mb-1">{doutor.nome}</p>
                    <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-2.5 inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0s" }} />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0.15s" }} />
                      <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0.3s" }} />
                      <span className="text-[10px] text-muted-foreground ml-1 italic">digitando...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Question as chat message */}
              {(chatStep === "pergunta" || chatStep === "cta" || chatStep === "opcoes") && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <img src={doutor.avatar} alt={doutor.nome} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shrink-0" loading="eager" decoding="async" />
                  <div className="flex-1 max-w-[85%]">
                    <p className="text-[10px] font-semibold text-primary mb-1">{doutor.nome}</p>
                    <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <p className="text-sm text-foreground leading-relaxed">
                        {typedText}
                        {chatStep === "pergunta" && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse align-middle" />}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* CTA: "Responda o(a) Dr(a)..." */}
              {(chatStep === "cta" || chatStep === "opcoes") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-center"
                >
                  <div className="bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      Responda {doutor.genero === "feminino" ? "a" : "o"} {doutor.nome.split(" ").slice(0, 2).join(" ")}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Alternativas animadas */}
              {chatStep === "opcoes" && (
                <div className="space-y-2 pl-12">
                  {q.opcoes.map((opcao, idx) => {
                    const isSelected = respostaSelecionada === idx;
                    const isCorrect = idx === q.correta;
                    const showResult = respostaSelecionada !== null;

                    let optionBg = "bg-card border-border hover:border-primary/40 hover:bg-primary/5";
                    if (showResult) {
                      if (isCorrect) optionBg = "bg-green-500/10 border-green-500/40";
                      else if (isSelected && !isCorrect) optionBg = "bg-red-500/10 border-red-500/40";
                      else optionBg = "bg-card border-border opacity-40";
                    }

                    return (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.15, type: "spring", stiffness: 300, damping: 25 }}
                        onClick={() => handleResposta(idx)}
                        disabled={respostaSelecionada !== null}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${optionBg}`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          showResult && isCorrect ? "bg-green-500 text-white"
                          : showResult && isSelected ? "bg-red-500 text-white"
                          : "bg-primary/15 text-primary"
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm text-foreground flex-1">{opcao}</span>
                        {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                        {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {mostrarExplicacao && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <img src={doutor.avatar} alt={doutor.nome} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shrink-0" loading="eager" decoding="async" />
                  <div className="flex-1 max-w-[85%] space-y-2">
                    {/* Feedback acertou/errou */}
                    {respostaSelecionada === q.correta ? (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-xs font-bold text-green-400 mb-1">🎉 Muito bem, {nomeUsuario}! Você acertou!</p>
                        <p className="text-sm text-foreground/80 leading-relaxed">{q.explicacao}</p>
                      </div>
                    ) : (
                      <div className="bg-red-500/8 border border-red-400/25 rounded-2xl rounded-tl-sm px-4 py-3">
                        <p className="text-xs font-bold text-red-400 mb-1">😔 Não foi dessa vez, {nomeUsuario}...</p>
                        <p className="text-sm text-foreground/70 leading-relaxed">{q.explicacao}</p>
                      </div>
                    )}
                    <Button
                      onClick={handleProximaQuestao}
                      className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl h-11 font-bold"
                    >
                      {questaoAtual + 1 >= questoes.length ? "🏆 Ver meu Resultado" : "⚡ Avançar!"}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // ─── RESULTADO ───
  if (fase === "resultado") {
    const percentual = questoes.length > 0 ? Math.round((acertos / questoes.length) * 100) : 0;
    const doutor = doutorAtual;

    // Doctor feedback based on performance
    const getFeedbackDoutor = () => {
      const nome = nomeUsuario;
      const tratamento = doutor.genero === "feminino" ? "Dra." : "Dr.";
      
      if (percentual >= 90) {
        return `🎉 Impressionante, ${nome}! ${percentual}% de aproveitamento! Você demonstrou domínio completo deste artigo. Continue assim e a aprovação é certa!`;
      } else if (percentual >= 70) {
        return `👏 Muito bem, ${nome}! ${percentual}% é um ótimo resultado. Você está no caminho certo. Revise os pontos que errou e será imbatível.`;
      } else if (percentual >= 50) {
        return `🤔 ${nome}, ${percentual}% mostra que você tem uma base, mas precisa reforçar. Releia o caso com atenção aos termos destacados e tente novamente.`;
      } else if (percentual >= 30) {
        return `😤 ${nome}, vou ser sincero${doutor.genero === "feminino" ? "a" : ""}: ${percentual}% não é aceitável. Você precisa estudar este artigo com mais dedicação. Volte ao caso, leia cada detalhe, e faça de novo.`;
      } else {
        return `😠 ${nome}, ${percentual}% é preocupante. Isso mostra que você não leu o caso com a devida atenção. Na OAB e na prática jurídica, cada detalhe importa. Recomece, leia o caso inteiro com calma, e leve isso a sério!`;
      }
    };

    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center px-6 pb-8">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <img src={bgPenal} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 text-center w-full max-w-sm"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-amber-500/30">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Caso Concluído!</h2>
          <p className="text-sm text-muted-foreground mb-1">Art. {artigoNumero} • Código Penal</p>
          <p className="text-xs text-muted-foreground/70 mb-6">{artigoDecoded}</p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-card border border-border rounded-xl p-3.5 text-center">
              <p className="text-2xl font-bold text-primary">{pontuacao}</p>
              <p className="text-[10px] text-muted-foreground">Pontos</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3.5 text-center">
              <p className="text-2xl font-bold text-green-400">{acertos}/{questoes.length}</p>
              <p className="text-[10px] text-muted-foreground">Acertos</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3.5 text-center">
              <p className="text-2xl font-bold text-amber-400">{percentual}%</p>
              <p className="text-[10px] text-muted-foreground">Aproveitamento</p>
            </div>
          </div>

          {/* Doctor feedback */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex items-start gap-3 text-left bg-card border border-border/50 rounded-2xl p-4">
              <img
                src={doutor.avatar}
                alt={doutor.nome}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-primary mb-1">{doutor.nome}</p>
                <p className="text-xs text-foreground/85 leading-relaxed">
                  {getFeedbackDoutor()}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={() => navigate("/gamificacao/caso-pratico")}
              className="w-full h-12 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl"
            >
              Próximo Artigo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFase("narrativa");
                setQuestaoAtual(0);
                setRespostaSelecionada(null);
                setMostrarExplicacao(false);
                setPontuacao(0);
                setAcertos(0);
              }}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Jogar Novamente
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default CasoPraticoJogo;
