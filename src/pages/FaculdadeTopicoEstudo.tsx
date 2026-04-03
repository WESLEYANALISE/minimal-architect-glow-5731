import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import OABTrilhasTopicoIntro from "@/components/oab/OABTrilhasTopicoIntro";
import { ConceitosSlidesViewer } from "@/components/conceitos/slides";
import type { ConceitoSecao, ConceitoSlide } from "@/components/conceitos/slides/types";

type ViewMode = 'intro' | 'slides';

const FaculdadeTopicoEstudo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('intro');

  const { data: topico, isLoading, refetch } = useQuery({
    queryKey: ["faculdade-topico", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculdade_topicos")
        .select("*, disciplina:faculdade_disciplinas(*)")
        .eq("id", parseInt(id!))
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "gerando" || data?.status === "na_fila") return 3000;
      return false;
    },
  });

  const { data: progresso, refetch: refetchProgresso } = useQuery({
    queryKey: ["faculdade-topico-progresso", user?.id, id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("faculdade_progresso")
        .select("*")
        .eq("user_id", user.id)
        .eq("topico_id", parseInt(id!))
        .maybeSingle();
      return data as any;
    },
    enabled: !!user?.id && !!id,
  });

  // Auto-trigger generation for pending topics
  const gerarConteudoMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gerar-conteudo-faculdade-topico", {
        body: { topico_id: parseInt(id!) },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { refetch(); toast.success("Geração iniciada!"); },
    onError: () => { refetch(); toast.error("Erro ao gerar conteúdo."); },
  });

  useEffect(() => {
    if ((topico?.status === "pendente" || topico?.status === "erro") && !gerarConteudoMutation.isPending) {
      gerarConteudoMutation.mutate();
    }
  }, [topico?.status]);

  // Parse conteudo_gerado into slides format
  const conteudoGerado = useMemo(() => {
    if (!topico?.conteudo_gerado) return null;
    try {
      const parsed = typeof topico.conteudo_gerado === 'string' ? JSON.parse(topico.conteudo_gerado) : topico.conteudo_gerado;
      // Validate it has the expected slides structure
      if (parsed && parsed.secoes) return parsed;
      return null;
    } catch {
      console.warn('[FaculdadeTopicoEstudo] conteudo_gerado não é JSON válido, ignorando');
      return null;
    }
  }, [topico?.conteudo_gerado]);

  const slidesData: ConceitoSecao[] = useMemo(() => {
    if (!conteudoGerado?.secoes) return [];
    return conteudoGerado.secoes.map((secao: any) => ({
      id: secao.id,
      titulo: secao.titulo,
      slides: (secao.slides || []).map((slide: any): ConceitoSlide => ({
        tipo: slide.tipo || 'texto',
        titulo: slide.titulo,
        conteudo: slide.conteudo || '',
        termos: slide.termos,
        correspondencias: slide.correspondencias,
        etapas: slide.etapas,
        tabela: slide.tabela,
        pergunta: slide.pergunta,
        opcoes: slide.opcoes,
        resposta: slide.resposta,
        feedback: slide.feedback,
        pontos: slide.pontos,
        imagemUrl: slide.imagemUrl,
      }))
    }));
  }, [conteudoGerado]);

  const flashcards = (topico?.flashcards as any[]) || [];
  const questoes = (topico?.questoes as any[]) || [];
  const totalPaginas = slidesData.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
  const objetivos = conteudoGerado?.objetivos || [];

  const handleBack = () => {
    navigate(-1);
  };

  const handleSlidesComplete = async () => {
    if (user?.id && id) {
      await (supabase.from("faculdade_progresso") as any).upsert({
        user_id: user.id,
        topico_id: parseInt(id),
        leitura_concluida: true,
        pagina_leitura: totalPaginas,
        total_paginas: totalPaginas,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,topico_id' });
      queryClient.invalidateQueries({ queryKey: ["faculdade-topico-progresso"] });
    }
    toast.success("Leitura concluída!");
    setViewMode('intro');
  };

  const handleProgressChange = async (progressPercent: number) => {
    if (!user?.id || !id) return;
    const paginaAtual = Math.round((progressPercent / 100) * totalPaginas);
    await (supabase.from("faculdade_progresso") as any).upsert({
      user_id: user.id,
      topico_id: parseInt(id),
      pagina_leitura: paginaAtual,
      total_paginas: totalPaginas,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,topico_id' });
  };

  const progressoLeituraReal = progresso?.leitura_concluida
    ? 100
    : (progresso?.total_paginas && progresso?.total_paginas > 0)
      ? Math.round((progresso.pagina_leitura || 0) / progresso.total_paginas * 100)
      : 0;

  if (isLoading) {
    return <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  // Generating state
  if (topico?.status === "gerando" || topico?.status === "na_fila" || gerarConteudoMutation.isPending) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8"><ArrowLeft className="w-4 h-4" /></Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-400 uppercase tracking-widest truncate">{topico?.disciplina?.nome}</p>
              <h1 className="text-sm font-semibold text-white truncate">{topico?.titulo}</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Gerando conteúdo...</h2>
          <p className="text-sm text-gray-400">A IA está criando o material de estudo.</p>
        </div>
      </div>
    );
  }

  // Slides viewer mode
  if (viewMode === 'slides' && slidesData.length > 0) {
    return (
      <ConceitosSlidesViewer
        secoes={slidesData}
        titulo={topico?.titulo || ""}
        materiaName={topico?.disciplina?.nome}
        capaUrl={topico?.capa_url}
        topicoId={topico?.id}
        area={topico?.disciplina?.nome}
        onClose={() => { refetchProgresso(); setViewMode('intro'); }}
        onComplete={handleSlidesComplete}
        onProgressChange={handleProgressChange}
        initialProgress={progressoLeituraReal}
        tabelaAlvo="faculdade_topicos"
        campoJson="conteudo_gerado"
      />
    );
  }

  // Intro screen
  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <div className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 text-white hover:bg-white/10"><ArrowLeft className="w-4 h-4" /></Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-400 uppercase tracking-widest truncate">{topico?.disciplina?.nome}</p>
          </div>
        </div>
      </div>
      <OABTrilhasTopicoIntro
        titulo={topico?.titulo || ""}
        materiaName={topico?.disciplina?.nome}
        capaUrl={topico?.capa_url}
        tempoEstimado={`${Math.ceil(totalPaginas * 2)} min`}
        totalPaginas={totalPaginas}
        objetivos={objetivos}
        progressoLeitura={progressoLeituraReal}
        progressoFlashcards={progresso?.flashcards_concluidos ? 100 : 0}
        progressoQuestoes={progresso?.questoes_concluidas ? 100 : 0}
        hasFlashcards={flashcards.length > 0}
        hasQuestoes={questoes.length > 0}
        onStartPaginas={() => setViewMode('slides')}
        onStartFlashcards={() => navigate(`/faculdade/topico/${id}/flashcards`)}
        onStartQuestoes={() => navigate(`/faculdade/topico/${id}/questoes`)}
        onBack={handleBack}
        subtituloMateria={topico?.disciplina?.nome || ""}
        textoMotivacional="Prepare-se para dominar este tema!"
        textoFooter="As páginas são interativas e ideais para memorização"
      />
    </div>
  );
};

export default FaculdadeTopicoEstudo;
