import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, ChevronRight, FileText, Sparkles, X, GraduationCap, BookOpen, Target, ArrowLeft, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ProgressBar";
import { ConceitosSlidesViewer } from "@/components/conceitos/slides";
import type { ConceitoSecao, ConceitoSlide } from "@/components/conceitos/slides";
import type { AulaEstruturaV2 } from "@/components/aula-v2/types";

interface Sugestao {
  area: string;
  tema: string;
  tipo: "prioridade" | "revisao";
  taxa: number;
  totalRespondidas: number;
}

interface SugestoesReforcoProps {
  sugestoes: Sugestao[];
  showAll?: boolean;
}

// Mapeamento de tipos SlideContent -> ConceitoSlide
const MAPA_TIPOS: Record<string, ConceitoSlide['tipo']> = {
  introducao: 'introducao',
  texto: 'texto',
  termos: 'termos',
  explicacao: 'explicacao',
  atencao: 'atencao',
  exemplo: 'caso',
  quickcheck: 'quickcheck',
  caso: 'caso',
  storytelling: 'caso',
  tabela: 'tabela',
  linha_tempo: 'linha_tempo',
  mapa_mental: 'texto',
  dica_estudo: 'dica',
  resumo_visual: 'resumo',
  resumo: 'resumo',
};

function converterParaConceitoSecoes(secoes: AulaEstruturaV2['secoes']): ConceitoSecao[] {
  return secoes.map((secao) => ({
    id: secao.id,
    titulo: secao.titulo || `Seção ${secao.id}`,
    slides: secao.slides.map((slide): ConceitoSlide => {
      const tipo = MAPA_TIPOS[slide.tipo] || 'texto';
      let conteudo = slide.conteudo || '';
      if (slide.tipo === 'mapa_mental' && slide.conceitos?.length) {
        const mapas = slide.conceitos.map(c =>
          `**${c.central}**: ${c.relacionados.join(', ')}`
        ).join('\n\n');
        conteudo = conteudo ? `${conteudo}\n\n${mapas}` : mapas;
      }
      if (slide.tipo === 'storytelling') {
        if (slide.personagem) conteudo = `**${slide.personagem}**: ${conteudo}`;
        if (slide.narrativa) conteudo += `\n\n${slide.narrativa}`;
      }
      return {
        tipo,
        titulo: slide.titulo || '',
        conteudo,
        icone: slide.icone,
        termos: slide.termos,
        etapas: slide.etapas,
        tabela: slide.tabela,
        pontos: slide.pontos,
        pergunta: slide.pergunta,
        opcoes: slide.opcoes,
        resposta: slide.resposta,
        feedback: slide.feedback,
        imagemUrl: slide.imagemUrl,
        imagemLoading: slide.imagemLoading,
      };
    }),
  }));
}

const loadingMessages = [
  "Analisando o tema em profundidade...",
  "Criando histórias envolventes...",
  "Preparando explicações detalhadas...",
  "Gerando exemplos práticos...",
  "Criando questões de fixação...",
  "Montando flashcards de memorização...",
  "Finalizando sua aula personalizada..."
];

type EtapaReforco = 'idle' | 'loading' | 'intro' | 'slides';

export const SugestoesReforco = ({ sugestoes, showAll }: SugestoesReforcoProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedSugestao, setSelectedSugestao] = useState<Sugestao | null>(null);
  
  // Inline aula generation states
  const [etapaReforco, setEtapaReforco] = useState<EtapaReforco>('idle');
  const [aulaEstrutura, setAulaEstrutura] = useState<AulaEstruturaV2 | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [aulaArea, setAulaArea] = useState("");

  const conceitoSecoes = useMemo(() => {
    if (!aulaEstrutura) return [];
    return converterParaConceitoSecoes(aulaEstrutura.secoes);
  }, [aulaEstrutura]);

  const totalSlides = useMemo(() => {
    return conceitoSecoes.reduce((acc, s) => acc + s.slides.length, 0);
  }, [conceitoSecoes]);

  if (sugestoes.length === 0 && etapaReforco === 'idle') return null;

  const items = showAll ? sugestoes : sugestoes.slice(0, 4);

  const shortAreaName = (area: string) =>
    area.replace(/^Direito\s+(do\s+|da\s+|de\s+|dos\s+|das\s+)?/i, '').replace(/^Direitos\s+/i, '');

  const handleCriarAula = async () => {
    if (!selectedSugestao) return;
    const tema = selectedSugestao.tema;
    const area = selectedSugestao.area;
    setSelectedArea(null); // Close bottom sheet
    setSelectedSugestao(null);
    setAulaArea(tema);
    setEtapaReforco('loading');
    setLoadingProgress(0);
    setLoadingMessage(loadingMessages[0]);
    setAulaEstrutura(null);

    // Register in history with tema
    if (user) {
      supabase.from("user_aulas_historico").insert({
        user_id: user.id,
        tema: tema,
        area: area,
        origem: "reforco",
      }).then(() => {});
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-aula-streaming`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ tema: tema })
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Erro ao conectar');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                setLoadingMessage(data.message);
                setLoadingProgress(data.progress || 0);
              }

              if (data.type === 'complete') {
                setLoadingProgress(100);
                setAulaEstrutura(data.estrutura);
                setEtapaReforco('intro');
                toast.success(data.cached ? "Aula carregada!" : "Aula criada com sucesso!");
              }

              if (data.type === 'secao') {
                setAulaEstrutura(prev => {
                  if (!prev) {
                    return {
                      versao: 2,
                      titulo: data.estruturaBasica.titulo,
                      tempoEstimado: data.estruturaBasica.tempoEstimado,
                      area: data.estruturaBasica.area,
                      descricao: data.estruturaBasica.descricao,
                      objetivos: data.estruturaBasica.objetivos,
                      secoes: [data.secao],
                      atividadesFinais: { matching: [], flashcards: [], questoes: [] },
                      provaFinal: []
                    };
                  }
                  return { ...prev, secoes: [...prev.secoes, data.secao] };
                });
              }

              if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (parseErr) {
              console.error('Erro ao parsear SSE:', parseErr);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Erro ao gerar aula:', error);
      toast.error("Erro ao gerar aula. Tente novamente.");
      setEtapaReforco('idle');
      setAulaEstrutura(null);
    }
  };

  const handleVoltarIdle = () => {
    setEtapaReforco('idle');
    setAulaEstrutura(null);
    setAulaArea("");
  };

  // === LOADING STATE (floating overlay) ===
  const loadingOverlay = etapaReforco === 'loading' ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[90%] max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center"
      >
        {/* Cancel button */}
        <button
          onClick={handleVoltarIdle}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Progress circle */}
        <div className="relative mb-6">
          <svg width="100" height="100" className="-rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 - (loadingProgress / 100) * 2 * Math.PI * 42}
              strokeLinecap="round"
              className="transition-all duration-500" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-primary">
            {Math.round(loadingProgress)}%
          </span>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-1">{loadingMessage}</h3>
        <p className="text-sm text-muted-foreground">Gerando aula sobre {aulaArea}</p>

        {/* Progress bar */}
        <div className="w-full mt-6 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${loadingProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    </div>
  ) : null;

  // === INTRO STATE (FULL PAGE) ===
  if (etapaReforco === 'intro' && aulaEstrutura) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="max-w-2xl w-full bg-gradient-to-br from-card via-muted/30 to-card border-2 border-primary/20 shadow-2xl overflow-hidden rounded-2xl relative">
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onClick={handleVoltarIdle}
              className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 hover:bg-background border border-border/50 text-foreground hover:text-primary transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Voltar</span>
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className="space-y-6"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 15 }}
                className="flex justify-center pt-16"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
                  <BookOpen className="w-12 h-12 text-primary-foreground" />
                </div>
              </motion.div>

              {/* Content */}
              <div className="px-8 md:px-12 pb-12 text-center space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <div className="text-sm text-muted-foreground font-medium">
                    {aulaArea}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    {aulaEstrutura.titulo}
                  </h2>
                </motion.div>

                {aulaEstrutura.descricao && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed"
                  >
                    {aulaEstrutura.descricao}
                  </motion.p>
                )}

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center gap-6 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    {aulaEstrutura.tempoEstimado}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-primary" />
                    {totalSlides} páginas
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
                  className="pt-4"
                >
                  <Button
                    onClick={() => setEtapaReforco('slides')}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Play className="w-5 h-5" />
                    Começar Leitura
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // === SLIDES STATE (fullscreen) ===
  if (etapaReforco === 'slides' && aulaEstrutura && conceitoSecoes.length > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <ConceitosSlidesViewer
          secoes={conceitoSecoes}
          titulo={aulaEstrutura.titulo}
          onClose={handleVoltarIdle}
          onComplete={handleVoltarIdle}
        />
      </div>
    );
  }

  // === DEFAULT / IDLE STATE ===
  return (
    <>
      {loadingOverlay}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-foreground mb-3">Sugestões de Reforço</h2>
        <div className={showAll ? "space-y-2" : "flex gap-3 overflow-x-auto pb-2 scrollbar-hide"}>
          {items.map((s, idx) => (
            <button
              key={`${s.area}-${s.tema}-${idx}`}
              onClick={() => { setSelectedArea(s.area); setSelectedSugestao(s); }}
              className={`${showAll ? "w-full" : "min-w-[220px] flex-shrink-0"} p-4 rounded-2xl bg-card border border-border/50 text-left hover:border-primary/30 transition-all active:scale-[0.97]`}
            >
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 ${
                s.tipo === "prioridade"
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}>
                {s.tipo === "prioridade" ? (
                  <><AlertTriangle className="w-3 h-3" /> PRIORIDADE ALTA</>
                ) : (
                  <><Clock className="w-3 h-3" /> REVISÃO PENDENTE</>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground leading-tight mb-1">
                Melhore em: {s.tema}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {shortAreaName(s.area)} · {s.tipo === "prioridade"
                  ? `Sua taxa está em ${s.taxa}%`
                  : `${s.totalRespondidas} questões respondidas`}
              </p>
              <span className="text-xs text-amber-400 font-medium flex items-center gap-0.5">
                Praticar Agora <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selectedArea && (
          <div className="fixed inset-0 z-50" onClick={() => setSelectedArea(null)}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border/50 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Reforce: {selectedSugestao?.tema || shortAreaName(selectedArea)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {shortAreaName(selectedArea)} · Escolha como estudar
                  </p>
                </div>
                <button
                  onClick={() => setSelectedArea(null)}
                  className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Options */}
              <div className="px-5 pb-8 space-y-3">
                {/* Criar Aula */}
                <button
                  onClick={handleCriarAula}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/30 text-left hover:from-orange-500/25 hover:to-red-500/25 transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/25">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        RECOMENDADO
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground">Criar Aula Interativa</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Aula completa com slides e quizzes</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-orange-400 flex-shrink-0" />
                </button>

                {/* Resumos */}
                <button
                  onClick={() => {
                    const area = selectedArea;
                    setSelectedArea(null);
                    navigate(`/resumos-juridicos/prontos/${encodeURIComponent(area)}`);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-left hover:from-blue-500/20 hover:to-cyan-500/20 transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">Resumos</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Resumos prontos da área</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
                </button>

                {/* Flashcards */}
                <button
                  onClick={() => {
                    const area = selectedArea;
                    setSelectedArea(null);
                    navigate(`/flashcards/temas?area=${encodeURIComponent(area)}`);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-left hover:from-purple-500/20 hover:to-pink-500/20 transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/25">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">Flashcards</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Memorize com repetição espaçada</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400 flex-shrink-0" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
