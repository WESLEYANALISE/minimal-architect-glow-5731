import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Brain, Trophy, Clock, Target, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { AulaEstruturaV2 } from "@/components/aula-v2/types";
import { ConceitosSlidesViewer } from "@/components/conceitos/slides";
import type { ConceitoSecao, ConceitoSlide } from "@/components/conceitos/slides";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewerEnhanced } from "@/components/QuizViewerEnhanced";
import { AulaIntro } from "@/components/aula/AulaIntro";

type EtapaAula = 'loading' | 'intro' | 'slides' | 'flashcards' | 'quiz' | 'resultado';

const loadingMessages = [
  "Analisando o tema em profundidade...",
  "Criando histórias envolventes...",
  "Preparando explicações detalhadas...",
  "Gerando exemplos práticos...",
  "Criando questões de fixação...",
  "Montando flashcards de memorização...",
  "Finalizando sua aula personalizada..."
];

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
      
      // Para mapa_mental, formatar conteúdo
      let conteudo = slide.conteudo || '';
      if (slide.tipo === 'mapa_mental' && slide.conceitos?.length) {
        const mapas = slide.conceitos.map(c => 
          `**${c.central}**: ${c.relacionados.join(', ')}`
        ).join('\n\n');
        conteudo = conteudo ? `${conteudo}\n\n${mapas}` : mapas;
      }

      // Para storytelling, incluir narrativa no conteúdo
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

const AulaInterativaV2 = () => {
  const [aulaEstrutura, setAulaEstrutura] = useState<AulaEstruturaV2 | null>(null);
  const [etapaAtual, setEtapaAtual] = useState<EtapaAula>('intro');
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [aulaId, setAulaId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tema, setTema] = useState("");
  const [leituraCompleta, setLeituraCompleta] = useState(false);
  const [acertos, setAcertos] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (etapaAtual === 'loading') {
      const interval = setInterval(() => {
        setLoadingIndex(prev => {
          const next = (prev + 1) % loadingMessages.length;
          setLoadingMessage(loadingMessages[next]);
          return next;
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [etapaAtual]);

  // Animate progress smoothly
  useEffect(() => {
    if (etapaAtual === 'loading') {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 3;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [etapaAtual]);

  // Check for lesson from chat
  useEffect(() => {
    const aulaFromChat = sessionStorage.getItem('aulaGeradaChat');
    if (aulaFromChat) {
      try {
        const { estrutura, tema: temaSalvo, aulaId: id } = JSON.parse(aulaFromChat);
        sessionStorage.removeItem('aulaGeradaChat');
        setAulaEstrutura(estrutura);
        setAulaId(id || null);
        setTema(temaSalvo);
        setEtapaAtual('intro');
        toast.success(`Aula "${temaSalvo}" carregada!`);
      } catch (e) {
        console.error('Erro ao carregar aula do chat:', e);
      }
    }
  }, []);

  const gerarAula = async (temaInput: string) => {
    setIsLoading(true);
    setEtapaAtual('loading');
    setTema(temaInput);
    setLoadingProgress(0);
    
    try {
      const response = await fetch(
        `https://izspjvegxdfgkgibpyst.supabase.co/functions/v1/gerar-aula-streaming`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3BqdmVneGRmZ2tnaWJweXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNDA2MTQsImV4cCI6MjA2MDcxNjYxNH0.LwTMbDH-S0mBoiIxfrSH2BpUMA7r4upOWWAb5a_If0Y`
          },
          body: JSON.stringify({ tema: temaInput })
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
                setAulaId(data.aulaId || null);
                setEtapaAtual('intro');
                toast.success(data.cached ? "Aula carregada do cache!" : "Aula criada com sucesso!");
              }
              
              if (data.type === 'secao') {
                // Progressive loading - update partial structure
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
                  return {
                    ...prev,
                    secoes: [...prev.secoes, data.secao]
                  };
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
      setEtapaAtual('intro');
      setAulaEstrutura(null);
    } finally {
      setIsLoading(false);
    }
  };

  const conceitoSecoes = useMemo(() => {
    if (!aulaEstrutura) return [];
    return converterParaConceitoSecoes(aulaEstrutura.secoes);
  }, [aulaEstrutura]);

  const totalSlides = useMemo(() => {
    return conceitoSecoes.reduce((acc, s) => acc + s.slides.length, 0);
  }, [conceitoSecoes]);

  const handleSair = () => {
    setAulaEstrutura(null);
    setEtapaAtual('intro');
    setAcertos(0);
    setTema("");
    setAulaId(null);
    setLeituraCompleta(false);
  };

  const handleLeituraComplete = () => {
    setLeituraCompleta(true);
    setEtapaAtual('intro');
    toast.success("Leitura concluída! Flashcards e Quiz desbloqueados.");
  };

  const finalizarQuiz = async (acertosQuiz: number, total: number) => {
    setAcertos(acertosQuiz);
    setEtapaAtual('resultado');

    if (aulaId) {
      try {
        const percentual = (acertosQuiz / total) * 100;
        const { data: aulaData } = await supabase
          .from('aulas_interativas')
          .select('aproveitamento_medio, visualizacoes')
          .eq('id', aulaId)
          .single();

        if (aulaData) {
          const visualizacoes = aulaData.visualizacoes || 1;
          const mediaAtual = aulaData.aproveitamento_medio || 0;
          const novaMedia = ((mediaAtual * (visualizacoes - 1)) + percentual) / visualizacoes;
          await supabase
            .from('aulas_interativas')
            .update({ aproveitamento_medio: novaMedia })
            .eq('id', aulaId);
        }
      } catch (error) {
        console.error('Erro ao atualizar aproveitamento:', error);
      }
    }
  };

  // SVG progress circle values
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (Math.round(loadingProgress) / 100) * circumference;

  // Show input screen when no aula loaded
  if (etapaAtual === 'intro' && !aulaEstrutura) {
    return <AulaIntro onIniciar={gerarAula} isLoading={isLoading} />;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {/* ===== LOADING ===== */}
        {etapaAtual === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center px-6 max-w-md">
              {/* SVG Progress Circle */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64" cy="64" r="45"
                    stroke="currentColor" strokeWidth="8" fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="64" cy="64" r="45"
                    stroke="currentColor" strokeWidth="8" fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="text-accent transition-all duration-500 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-accent">
                    {Math.round(loadingProgress)}%
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">{tema}</h2>
              <p className="text-muted-foreground mb-4">Criando sua aula personalizada</p>

              <motion.p
                key={loadingIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-muted-foreground mb-6"
              >
                {loadingMessage}
              </motion.p>

              <Button variant="ghost" onClick={handleSair} className="text-muted-foreground">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}

        {/* ===== INTRO (com módulos) ===== */}
        {etapaAtual === 'intro' && aulaEstrutura && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="w-full max-w-lg">
                <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-2xl">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"
                    >
                      <BookOpen className="w-8 h-8 text-primary-foreground" />
                    </motion.div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                      {aulaEstrutura.titulo}
                    </h1>
                    {aulaEstrutura.area && (
                      <p className="text-sm text-muted-foreground">{aulaEstrutura.area}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-secondary/50 rounded-xl p-3 text-center">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Duração</p>
                      <p className="font-semibold text-sm text-foreground">{aulaEstrutura.tempoEstimado}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3 text-center">
                      <Target className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Slides</p>
                      <p className="font-semibold text-sm text-foreground">{totalSlides} páginas</p>
                    </div>
                  </div>

                  {/* Objetivos */}
                  {aulaEstrutura.objetivos?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        O que você vai aprender
                      </h3>
                      <ul className="space-y-1.5">
                        {aulaEstrutura.objetivos.slice(0, 4).map((obj, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            </div>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3 Módulos */}
                  <div className="space-y-3">
                    {/* Leitura */}
                    <Button
                      onClick={() => setEtapaAtual('slides')}
                      className="w-full h-14 bg-red-600 hover:bg-red-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-red-600/20 justify-between px-5"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5" />
                        <span>{leituraCompleta ? 'Reler Conteúdo' : 'Começar Leitura'}</span>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </Button>

                    {/* Flashcards */}
                    <Button
                      onClick={() => setEtapaAtual('flashcards')}
                      disabled={!leituraCompleta}
                      className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-purple-600/20 justify-between px-5 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5" />
                        <span>Flashcards</span>
                      </div>
                      {!leituraCompleta ? <Lock className="w-4 h-4" /> : <ChevronRight className="w-5 h-5" />}
                    </Button>

                    {/* Praticar */}
                    <Button
                      onClick={() => setEtapaAtual('quiz')}
                      disabled={!leituraCompleta}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base rounded-xl shadow-lg shadow-emerald-600/20 justify-between px-5 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5" />
                        <span>Praticar</span>
                      </div>
                      {!leituraCompleta ? <Lock className="w-4 h-4" /> : <ChevronRight className="w-5 h-5" />}
                    </Button>
                  </div>

                  {/* Voltar */}
                  <div className="mt-4 text-center">
                    <Button variant="ghost" size="sm" onClick={handleSair} className="text-muted-foreground">
                      <X className="w-4 h-4 mr-1" />
                      Sair da aula
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== SLIDES (ConceitosSlidesViewer) ===== */}
        {etapaAtual === 'slides' && conceitoSecoes.length > 0 && (
          <ConceitosSlidesViewer
            key="slides"
            secoes={conceitoSecoes}
            titulo={aulaEstrutura?.titulo || tema}
            materiaName={aulaEstrutura?.area || 'Aula Interativa'}
            onClose={() => setEtapaAtual('intro')}
            onComplete={handleLeituraComplete}
            onGoToFlashcards={() => {
              setLeituraCompleta(true);
              setEtapaAtual('flashcards');
            }}
          />
        )}

        {/* ===== FLASHCARDS ===== */}
        {etapaAtual === 'flashcards' && aulaEstrutura && (
          <motion.div
            key="flashcards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3">
              <div className="flex items-center gap-3 max-w-2xl mx-auto">
                <Button variant="ghost" size="icon" onClick={() => setEtapaAtual('intro')}>
                  <X className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="font-semibold text-foreground text-sm">Flashcards</h1>
                  <p className="text-xs text-muted-foreground">{aulaEstrutura.titulo}</p>
                </div>
              </div>
            </div>
            <div className="p-4 max-w-2xl mx-auto">
              <FlashcardViewer
                flashcards={aulaEstrutura.atividadesFinais.flashcards.map(f => ({
                  front: f.frente,
                  back: f.verso,
                  example: f.exemplo
                }))}
                tema={tema}
              />
            </div>
          </motion.div>
        )}

        {/* ===== QUIZ ===== */}
        {etapaAtual === 'quiz' && aulaEstrutura && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3">
              <div className="flex items-center gap-3 max-w-2xl mx-auto">
                <Button variant="ghost" size="icon" onClick={() => setEtapaAtual('intro')}>
                  <X className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="font-semibold text-foreground text-sm">Praticar</h1>
                  <p className="text-xs text-muted-foreground">{aulaEstrutura.titulo}</p>
                </div>
              </div>
            </div>
            <div className="p-4 max-w-2xl mx-auto">
              <QuizViewerEnhanced
                questions={aulaEstrutura.atividadesFinais.questoes}
              />
            </div>
          </motion.div>
        )}

        {/* ===== RESULTADO ===== */}
        {etapaAtual === 'resultado' && aulaEstrutura && (
          <motion.div
            key="resultado"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center p-4"
          >
            <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Aula Concluída!</h2>
              <p className="text-muted-foreground mb-4">{aulaEstrutura.titulo}</p>
              <div className="text-4xl font-bold text-accent mb-6">
                {acertos}/{aulaEstrutura.provaFinal?.length || aulaEstrutura.atividadesFinais.questoes.length}
              </div>
              <div className="space-y-3">
                <Button onClick={() => { setEtapaAtual('intro'); setAcertos(0); }} className="w-full">
                  Voltar ao Menu
                </Button>
                <Button variant="ghost" onClick={handleSair} className="w-full">
                  Nova Aula
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AulaInterativaV2;
