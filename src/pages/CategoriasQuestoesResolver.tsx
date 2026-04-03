import { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, Settings, RotateCcw, Shuffle, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import QuestoesConcurso, { type QuestoesConcursoRef } from "@/components/QuestoesConcurso";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface CategoriaQuestao {
  pergunta: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
  exemplo_pratico?: string;
}

const LETTER_MAP = ["A", "B", "C", "D"];

const CategoriasQuestoesResolver = () => {
  const { materiaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const questoesConcursoRef = useRef<QuestoesConcursoRef | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch materia info
  const { data: materia } = useQuery({
    queryKey: ["categorias-materia-info", materiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_materias")
        .select("id, nome, categoria")
        .eq("id", parseInt(materiaId!))
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!materiaId,
  });

  // Fetch all completed topicos for this materia
  const { data: topicos, isLoading } = useQuery({
    queryKey: ["categorias-topicos-questoes", materiaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_topicos")
        .select("id, titulo, questoes")
        .eq("materia_id", parseInt(materiaId!))
        .eq("status", "concluido");
      if (error) throw error;
      return data || [];
    },
    enabled: !!materiaId,
  });

  // Transform categorias format to QuestoesConcurso format and shuffle
  const questoesTransformed = useMemo(() => {
    if (!topicos) return [];
    const all: any[] = [];
    let idCounter = 1;

    topicos.forEach((t) => {
      const arr = t.questoes as unknown as CategoriaQuestao[] | null;
      if (Array.isArray(arr)) {
        arr.forEach((q) => {
          if (q.pergunta && Array.isArray(q.alternativas) && q.alternativas.length >= 4) {
            all.push({
              id: idCounter++,
              enunciado: q.pergunta,
              alternativa_a: q.alternativas[0],
              alternativa_b: q.alternativas[1],
              alternativa_c: q.alternativas[2],
              alternativa_d: q.alternativas[3],
              resposta_correta: LETTER_MAP[q.correta] || "A",
              comentario: q.explicacao || "",
              subtema: t.titulo || "",
              tema: t.titulo || "",
              exemplo_pratico: q.exemplo_pratico || undefined,
            });
          }
        });
      }
    });

    // Shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  }, [topicos]);

  const backPath = materia?.categoria
    ? `/categorias/trilha/${encodeURIComponent(materia.categoria)}`
    : "/ferramentas/questoes";

  const handleFinish = useCallback(async () => {
    // Save progress for all topicos
    if (user?.id && topicos) {
      const upserts = topicos.map((t) => ({
        user_id: user.id,
        topico_id: t.id,
        questoes_concluidas: true,
        updated_at: new Date().toISOString(),
      }));
      await supabase
        .from("categorias_progresso")
        .upsert(upserts, { onConflict: "user_id,topico_id" });
    }
    navigate(backPath);
  }, [user, topicos, navigate, backPath]);

  const handleBack = () => navigate(backPath);

  const handleRestart = () => {
    const progressKey = `questoes_progress_categorias_${materiaId}`;
    localStorage.removeItem(progressKey);
    questoesConcursoRef.current?.restart();
    setShowSettings(false);
    toast.success("Progresso reiniciado!");
  };

  const handleShuffle = () => {
    const progressKey = `questoes_progress_categorias_${materiaId}`;
    localStorage.removeItem(progressKey);
    questoesConcursoRef.current?.restart();
    setShowSettings(false);
    toast.success("Questões embaralhadas!");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Carregando questões...</p>
        </div>
      </div>
    );
  }

  if (questoesTransformed.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <Scale className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1">Nenhuma questão disponível</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Nenhuma questão foi gerada para esta matéria ainda.
            </p>
            <Button onClick={() => navigate(backPath)}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  const progressKey = `questoes_progress_categorias_${materiaId}`;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header with violet gradient */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-500 to-violet-700 px-4 py-3">
        <div className="h-[env(safe-area-inset-top)]" />
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center flex-1 min-w-0 px-2">
            <h1 className="font-bold text-base text-white truncate">
              {materia?.nome || "Questões"}
            </h1>
            <p className="text-xs text-white/80 truncate">
              {questoesTransformed.length} questões
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="shrink-0 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full text-white"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Quiz using QuestoesConcurso */}
      <QuestoesConcurso
        ref={questoesConcursoRef}
        questoes={questoesTransformed}
        onFinish={handleFinish}
        area={materia?.nome || ""}
        tema=""
        autoplayAudio={false}
        progressKey={progressKey}
      />

      {/* Settings Drawer */}
      <Drawer open={showSettings} onOpenChange={setShowSettings}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Configurações
            </DrawerTitle>
            <DrawerDescription>
              Gerencie seu progresso e preferências
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-2 space-y-2">
            <button
              onClick={handleRestart}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Reiniciar questões</p>
                <p className="text-xs text-muted-foreground">Zera o progresso e volta para a questão 1</p>
              </div>
            </button>
            <button
              onClick={handleShuffle}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shuffle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Embaralhar questões</p>
                <p className="text-xs text-muted-foreground">Reorganiza a ordem das questões</p>
              </div>
            </button>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CategoriasQuestoesResolver;
