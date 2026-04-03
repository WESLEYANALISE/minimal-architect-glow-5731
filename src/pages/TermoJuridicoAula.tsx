import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X, Trophy } from "lucide-react";
import { AulaEstruturaV2 } from "@/components/aula-v2/types";
import { ConceitosSlidesViewer } from "@/components/conceitos/slides";
import type { ConceitoSecao, ConceitoSlide } from "@/components/conceitos/slides";
import { FlashcardViewer } from "@/components/FlashcardViewer";
import { QuizViewerEnhanced } from "@/components/QuizViewerEnhanced";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

type EtapaAula = 'intro' | 'slides' | 'flashcards' | 'quiz' | 'resultado';

const MAPA_TIPOS: Record<string, ConceitoSlide['tipo']> = {
  introducao: 'introducao', texto: 'texto', termos: 'termos',
  explicacao: 'explicacao', atencao: 'atencao', exemplo: 'caso',
  quickcheck: 'quickcheck', caso: 'caso', storytelling: 'caso',
  tabela: 'tabela', linha_tempo: 'linha_tempo', mapa_mental: 'texto',
  dica_estudo: 'dica', resumo_visual: 'resumo', resumo: 'resumo',
};

function converterParaConceitoSecoes(secoes: AulaEstruturaV2['secoes']): ConceitoSecao[] {
  return secoes.map((secao) => ({
    id: secao.id,
    titulo: secao.titulo || `Seção ${secao.id}`,
    slides: secao.slides.map((slide): ConceitoSlide => {
      const tipo = MAPA_TIPOS[slide.tipo] || 'texto';
      let conteudo = slide.conteudo || '';
      if (slide.tipo === 'mapa_mental' && slide.conceitos?.length) {
        const mapas = slide.conceitos.map(c => `**${c.central}**: ${c.relacionados.join(', ')}`).join('\n\n');
        conteudo = conteudo ? `${conteudo}\n\n${mapas}` : mapas;
      }
      if (slide.tipo === 'storytelling') {
        if (slide.personagem) conteudo = `**${slide.personagem}**: ${conteudo}`;
        if (slide.narrativa) conteudo += `\n\n${slide.narrativa}`;
      }
      return {
        tipo, titulo: slide.titulo || '', conteudo, icone: slide.icone,
        termos: slide.termos, etapas: slide.etapas, tabela: slide.tabela,
        pontos: slide.pontos, pergunta: slide.pergunta, opcoes: slide.opcoes,
        resposta: slide.resposta, feedback: slide.feedback,
        imagemUrl: slide.imagemUrl, imagemLoading: slide.imagemLoading,
      };
    }),
  }));
}

const TermoJuridicoAula = () => {
  const { termoId } = useParams();
  const navigate = useNavigate();
  const [etapaAtual, setEtapaAtual] = useState<EtapaAula>('intro');
  const [acertos, setAcertos] = useState(0);

  const { data: termo, isLoading } = useQuery({
    queryKey: ["termo-juridico-aula", termoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("termos_juridicos_aulas")
        .select("*")
        .eq("id", Number(termoId))
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!termoId,
  });

  const estrutura = termo?.estrutura_completa as unknown as AulaEstruturaV2 | null;

  const conceitoSecoes = useMemo(() => {
    if (!estrutura?.secoes) return [];
    return converterParaConceitoSecoes(estrutura.secoes);
  }, [estrutura]);

  const flashcards = useMemo(() => {
    if (!estrutura?.atividadesFinais?.flashcards) return [];
    return estrutura.atividadesFinais.flashcards.map(f => ({
      id: Math.random(),
      front: f.frente,
      back: f.verso,
      exemplo: f.exemplo || '',
    }));
  }, [estrutura]);

  const questoes = useMemo(() => {
    if (!estrutura?.atividadesFinais?.questoes) return [];
    return estrutura.atividadesFinais.questoes.map(q => ({
      question: q.question, options: q.options,
      correctAnswer: q.correctAnswer, explicacao: q.explicacao,
    }));
  }, [estrutura]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  if (!estrutura) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Aula ainda não gerada para este termo.</p>
        <Button variant="outline" onClick={() => navigate("/termos-juridicos")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <button
        onClick={() => navigate("/termos-juridicos")}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
      >
        <X className="w-5 h-5 text-foreground" />
      </button>

      <AnimatePresence mode="wait">
        {etapaAtual === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
          >
            {termo?.capa_url && (
              <img src={termo.capa_url} alt={termo.termo} className="w-32 h-32 rounded-2xl object-cover mb-6 shadow-lg" />
            )}
            <h1 className="text-2xl font-bold text-foreground mb-2">{estrutura.titulo || termo?.termo}</h1>
            <p className="text-muted-foreground text-sm mb-2">{estrutura.area || termo?.categoria}</p>
            <p className="text-muted-foreground text-xs mb-6">{estrutura.tempoEstimado || '12 min'}</p>
            {estrutura.objetivos?.length > 0 && (
              <ul className="text-left text-sm text-muted-foreground mb-6 space-y-1 max-w-sm">
                {estrutura.objetivos.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button onClick={() => setEtapaAtual('slides')} size="lg">
              Iniciar Aula
            </Button>
          </motion.div>
        )}

        {etapaAtual === 'slides' && (
          <motion.div key="slides" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConceitosSlidesViewer
              secoes={conceitoSecoes}
              titulo={estrutura.titulo}
              onClose={() => navigate("/termos-juridicos")}
              onComplete={() => {
                if (flashcards.length > 0) setEtapaAtual('flashcards');
                else if (questoes.length > 0) setEtapaAtual('quiz');
                else setEtapaAtual('resultado');
              }}
            />
          </motion.div>
        )}

        {etapaAtual === 'flashcards' && (
          <motion.div key="flashcards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-4"
          >
            <FlashcardViewer flashcards={flashcards} tema={termo?.termo} />
            <Button className="mt-6" onClick={() => questoes.length > 0 ? setEtapaAtual('quiz') : setEtapaAtual('resultado')}>
              {questoes.length > 0 ? 'Ir para Quiz' : 'Concluir'}
            </Button>
          </motion.div>
        )}

        {etapaAtual === 'quiz' && (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center p-4"
          >
            <QuizViewerEnhanced questions={questoes} />
            <Button className="mt-6" onClick={() => setEtapaAtual('resultado')}>
              Ver Resultado
            </Button>
          </motion.div>
        )}

        {etapaAtual === 'resultado' && (
          <motion.div key="resultado" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
          >
            <Trophy className="w-16 h-16 text-primary mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Aula Concluída! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Você estudou: <strong>{termo?.termo}</strong>
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/termos-juridicos")}>
                Voltar aos Termos
              </Button>
              <Button onClick={() => { setEtapaAtual('intro'); setAcertos(0); }}>
                Revisar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TermoJuridicoAula;
