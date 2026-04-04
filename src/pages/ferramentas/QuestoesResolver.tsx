import { useNavigate, useSearchParams } from "react-router-dom";
import { Scale, Loader2, ArrowLeft, Settings, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QuestoesConcurso from "@/components/QuestoesConcurso";

import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const AREA_GRADIENTS: Record<string, string> = {
  "Direito Penal": "from-red-600 to-red-800",
  "Direito Civil": "from-blue-600 to-blue-800",
  "Direito Constitucional": "from-purple-600 to-purple-800",
  "Direito Processual Civil": "from-teal-600 to-teal-800",
  "Direito do Trabalho": "from-orange-500 to-orange-700",
  "Direito Tributário": "from-emerald-600 to-emerald-800",
  "Direito Administrativo": "from-indigo-500 to-indigo-700",
  "Direito Processual Penal": "from-pink-600 to-pink-800",
  "Direito Empresarial": "from-amber-500 to-amber-700",
  "Direitos Humanos": "from-cyan-600 to-cyan-800",
  "Português": "from-rose-500 to-rose-700",
  "Filosofia do Direito": "from-violet-500 to-violet-700",
  "Direito Ambiental": "from-lime-600 to-lime-800",
  "Direito do Consumidor": "from-yellow-600 to-yellow-800",
  "Direito Eleitoral": "from-sky-600 to-sky-800",
  "Direito Previdenciário": "from-fuchsia-600 to-fuchsia-800",
  "Direito Internacional": "from-slate-500 to-slate-700",
  "Direito Concorrencial": "from-stone-500 to-stone-700",
  "Direito Desportivo": "from-gray-500 to-gray-700",
  "Direito Processual do Trabalho": "from-orange-600 to-orange-800",
};

const getAreaGradient = (area: string) =>
  AREA_GRADIENTS[area] || "from-slate-500 to-slate-700";

export interface Questao {
  id: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  resposta_correta: string;
  comentario: string;
  subtema: string;
  tema?: string;
}

interface GeracaoStatus {
  total_subtemas: number;
  subtemas_processados: number;
  subtemas_faltantes: number;
  geracao_completa: boolean;
}

const FRASES_GERACAO = [
  "Analisando o conteúdo jurídico...",
  "Criando questões desafiadoras...",
  "Elaborando alternativas...",
  "Preparando comentários explicativos...",
  "Refinando as questões...",
  "Verificando gabaritos...",
  "Organizando por subtemas...",
  "Finalizando questões...",
  "A IA está trabalhando...",
  "Quase pronto...",
];

const QuestoesResolver = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const area = searchParams.get("area") || "";
  const tema = searchParams.get("tema") || "";
  const modo = searchParams.get("modo") || "";
  const autoplayParam = searchParams.get("autoplay");
  const autoplayAudio = autoplayParam !== null ? autoplayParam === "true" : true;
  const isModoTodas = modo === "todas";
  const [isGenerating, setIsGenerating] = useState(false);
  const countdownDone = true; // Skip countdown — start instantly
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [geracaoStatus, setGeracaoStatus] = useState<GeracaoStatus | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [fraseIndex, setFraseIndex] = useState(0);
  const fraseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const questoesConcursoRef = useRef<{ restart: () => void } | null>(null);

  // Rotacionar frases durante a geração
  useEffect(() => {
    if (isGenerating) {
      fraseIntervalRef.current = setInterval(() => {
        setFraseIndex(prev => (prev + 1) % FRASES_GERACAO.length);
      }, 3000);
    } else {
      if (fraseIntervalRef.current) {
        clearInterval(fraseIntervalRef.current);
        fraseIntervalRef.current = null;
      }
      setFraseIndex(0);
    }
    
    return () => {
      if (fraseIntervalRef.current) {
        clearInterval(fraseIntervalRef.current);
      }
    };
  }, [isGenerating]);

  const { data: questoesCache, isLoading, refetch } = useQuery({
    queryKey: ["questoes-resolver", area, tema, modo],
    queryFn: async () => {
      if (isModoTodas) {
        // Buscar TODAS as questões da área com paginação (sem limite de 1000)
        let allData: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;
        
        while (hasMore) {
          const from = page * pageSize;
          const to = from + pageSize - 1;
          const { data, error } = await supabase
            .from("QUESTOES_GERADAS")
            .select("*")
            .eq("area", area)
            .range(from, to);
          if (error) throw error;
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < pageSize) hasMore = false;
          } else {
            hasMore = false;
          }
          page++;
        }
        
        // Embaralhar para variar a experiência
        const shuffled = allData.sort(() => Math.random() - 0.5);
        return shuffled as Questao[];
      }
      const { data, error } = await supabase
        .from("QUESTOES_GERADAS")
        .select("*")
        .eq("area", area)
        .eq("tema", tema);

      if (error) throw error;
      return data as Questao[];
    },
    enabled: !!area && (!!tema || isModoTodas),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    placeholderData: (prev) => prev, // previne flash de loading ao navegar entre temas
  });

  // Verificar se precisa gerar mais questões (se não completou todos os subtemas)
  useEffect(() => {
    const checkAndGenerate = async () => {
      if (!area || isGenerating) return;
      if (isModoTodas) {
        // No generation needed for modo=todas, just use cached data
        if (questoesCache && questoesCache.length > 0) {
          setQuestoes(questoesCache);
        }
        return;
      }
      if (!tema) return;
      
      if (questoesCache && questoesCache.length > 0) {
        setQuestoes(questoesCache);
        
        // Buscar quantos subtemas existem no RESUMO
        const { data: resumos } = await supabase
          .from("RESUMO")
          .select("subtema")
          .eq("area", area)
          .eq("tema", tema);
        
        if (resumos) {
          const subtemasTotal = new Set(resumos.map(r => r.subtema)).size;
          const subtemasComQuestoes = new Set(questoesCache.map(q => q.subtema)).size;
          
          // Se faltam subtemas, continuar gerando em background
          if (subtemasComQuestoes < subtemasTotal) {
            console.log(`Faltam ${subtemasTotal - subtemasComQuestoes} subtemas. Gerando...`);
            generateQuestoes();
          }
        }
      } else if (questoesCache && questoesCache.length === 0) {
        generateQuestoes();
      }
    };
    
    checkAndGenerate();
  }, [questoesCache, area, tema, isModoTodas]);

  const generateQuestoes = async () => {
    setIsGenerating(true);
    setProgressMessage("Buscando resumos do tema...");
    
    try {
      // Busca resumos do tema
      const { data: resumos, error: resumosError } = await supabase
        .from("RESUMO")
        .select("subtema, conteudo")
        .eq("area", area)
        .eq("tema", tema);

      if (resumosError) throw resumosError;

      if (!resumos || resumos.length === 0) {
        toast.error("Não há conteúdo disponível para gerar questões");
        setIsGenerating(false);
        return;
      }

      // Calcular total de subtemas para mostrar progresso
      const subtemasUnicos = new Set(resumos.map(r => r.subtema));
      const totalSubtemas = subtemasUnicos.size;
      
      // Buscar subtemas já processados
      const { data: questoesExistentes } = await supabase
        .from("QUESTOES_GERADAS")
        .select("subtema")
        .eq("area", area)
        .eq("tema", tema);
      
      const subtemasJaProcessados = new Set(questoesExistentes?.map(q => q.subtema) || []);
      const subtemasProcessadosInicial = subtemasJaProcessados.size;
      
      setGeracaoStatus({
        total_subtemas: totalSubtemas,
        subtemas_processados: subtemasProcessadosInicial,
        subtemas_faltantes: totalSubtemas - subtemasProcessadosInicial,
        geracao_completa: false
      });

      // Iniciar polling para atualizar progresso em tempo real
      let pollInterval: NodeJS.Timeout | null = null;
      
      const pollProgress = async () => {
        const { data: questoesAtuais } = await supabase
          .from("QUESTOES_GERADAS")
          .select("subtema")
          .eq("area", area)
          .eq("tema", tema);
        
        if (questoesAtuais) {
          const subtemasAtuais = new Set(questoesAtuais.map(q => q.subtema)).size;
          setGeracaoStatus(prev => ({
            ...prev!,
            subtemas_processados: subtemasAtuais,
            subtemas_faltantes: totalSubtemas - subtemasAtuais,
            geracao_completa: subtemasAtuais >= totalSubtemas
          }));
          
          // Atualiza as questões em tempo real
          const { data: todasQuestoes } = await supabase
            .from("QUESTOES_GERADAS")
            .select("*")
            .eq("area", area)
            .eq("tema", tema);
          
          if (todasQuestoes && todasQuestoes.length > 0) {
            setQuestoes(todasQuestoes as Questao[]);
          }
        }
      };
      
      // Polling a cada 3 segundos
      pollInterval = setInterval(pollProgress, 3000);

      // Chama edge function para gerar questões
      const { data, error } = await supabase.functions.invoke("gerar-questoes-tema", {
        body: { area, tema, resumos }
      });

      // Para o polling
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      if (error) throw error;

      // Busca final das questões após a geração
      const { data: questoesFinais } = await supabase
        .from("QUESTOES_GERADAS")
        .select("*")
        .eq("area", area)
        .eq("tema", tema);

      if (questoesFinais && questoesFinais.length > 0) {
        setQuestoes(questoesFinais as Questao[]);
        
        const subtemasFinais = new Set(questoesFinais.map(q => q.subtema)).size;
        const geracaoCompleta = subtemasFinais >= totalSubtemas;
        
        setGeracaoStatus({
          total_subtemas: totalSubtemas,
          subtemas_processados: subtemasFinais,
          subtemas_faltantes: totalSubtemas - subtemasFinais,
          geracao_completa: geracaoCompleta
        });
        
        if (geracaoCompleta) {
          toast.success(`${questoesFinais.length} questões disponíveis!`);
        } else {
          toast.success(
            `${questoesFinais.length} questões geradas! (${subtemasFinais}/${totalSubtemas} subtemas)`,
            {
              description: "O próximo acesso continuará gerando mais questões.",
              duration: 5000
            }
          );
        }
      } else {
        toast.error("Não foi possível gerar questões");
      }
    } catch (error) {
      console.error("Erro ao gerar questões:", error);
      toast.error("Erro ao gerar questões. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinish = () => {
    navigate(`/ferramentas/questoes/temas?area=${encodeURIComponent(area)}`);
  };

  const handleBack = () => {
    navigate(`/ferramentas/questoes/temas?area=${encodeURIComponent(area)}`);
  };

  const handleRestart = () => {
    const progressKey = `questoes_progress_${area}_${modo || tema}`;
    localStorage.removeItem(progressKey);
    questoesConcursoRef.current?.restart();
    setShowSettings(false);
    toast.success("Progresso reiniciado!");
  };

  const handleShuffle = () => {
    const shuffled = [...questoes].sort(() => Math.random() - 0.5);
    setQuestoes(shuffled);
    const progressKey = `questoes_progress_${area}_${modo || tema}`;
    localStorage.removeItem(progressKey);
    questoesConcursoRef.current?.restart();
    setShowSettings(false);
    toast.success("Questões embaralhadas!");
  };

  // Calcular progresso para a barra
  const progressPercent = geracaoStatus 
    ? Math.round((geracaoStatus.subtemas_processados / geracaoStatus.total_subtemas) * 100)
    : 0;

  // Full-screen loading ONLY when no questions exist yet
  if (isLoading && questoes.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="text-center w-full max-w-xs">
            <h2 className="text-lg font-semibold mb-1">Carregando...</h2>
            <p className="text-sm text-muted-foreground">Verificando questões disponíveis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <Scale className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1">Nenhuma questão disponível</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-4">
              Não foi possível carregar ou gerar questões para este tema.
            </p>
            <Button onClick={() => navigate(-1)}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  const progressKey = `questoes_progress_${area}_${modo || tema}`;
  const shouldShowCountdown = !countdownDone && questoes.length > 0;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header com gradiente da área */}
        <div className={`sticky top-0 z-10 bg-gradient-to-r ${getAreaGradient(area)} px-4 py-3`}>
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
              <h1 className="font-bold text-base text-white truncate">{area}</h1>
              <p className="text-xs text-white/80 truncate">
                {tema ? `${tema} · ${questoes.length} questões` : `${questoes.length} questões`}
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

        {/* Discrete background generation banner */}
        {isGenerating && (
          <div className="px-4 py-2 flex items-center gap-2 bg-primary/10 border-b border-primary/20">
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
            <p className="text-xs text-primary truncate">
              {geracaoStatus
                ? `Gerando mais questões... ${geracaoStatus.subtemas_processados}/${geracaoStatus.total_subtemas} subtemas`
                : FRASES_GERACAO[fraseIndex]}
            </p>
          </div>
        )}

        {/* Quiz */}
        <QuestoesConcurso 
          ref={questoesConcursoRef}
          questoes={questoes} 
          onFinish={handleFinish}
          area={area}
          tema={tema}
          autoplayAudio={autoplayAudio}
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
                  <p className="text-xs text-muted-foreground">Reordena aleatoriamente todas as questões</p>
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

    </>
  );
};

export default QuestoesResolver;
