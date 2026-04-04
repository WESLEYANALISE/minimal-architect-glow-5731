import { useNavigate, useSearchParams } from "react-router-dom";
import { CountdownOverlay } from "@/components/CountdownOverlay";
import { Scale, Loader2, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FlashcardViewer, FlashcardSettings } from "@/components/FlashcardViewer";
import { FlashcardSettingsModal } from "@/components/FlashcardSettingsModal";
import { Progress } from "@/components/ui/progress";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";

interface FlashcardsEstudarProps {
  inlineArea?: string;
  inlineTema?: string;
  onExit?: () => void;
  onComplete?: () => void;
}

interface FlashcardGerado {
  id: number;
  pergunta: string;
  resposta: string;
  exemplo: string | null;
  base_legal: string | null;
  url_imagem_exemplo: string | null;
  url_audio_exemplo?: string | null;
  subtema: string;
  tema: string;
  url_audio_pergunta?: string | null;
  url_audio_resposta?: string | null;
}

const FRASES_GERACAO = [
  "Analisando o conteúdo jurídico...",
  "Criando flashcards de memorização...",
  "Elaborando perguntas e respostas...",
  "Preparando exemplos práticos...",
  "Refinando os flashcards...",
  "Organizando por subtemas...",
  "A IA está trabalhando...",
  "Quase pronto...",
];

const FlashcardsEstudar = ({ inlineArea, inlineTema, onExit, onComplete }: FlashcardsEstudarProps = {}) => {
  const navigate = useNavigate();
  const { goBack } = useHierarchicalNavigation();
  const [searchParams] = useSearchParams();
  const area = inlineArea || searchParams.get("area") || "";
  const tema = inlineTema || searchParams.get("tema") || "";
  const temas = searchParams.get("temas") || "";
  const modo = searchParams.get("modo") || "";
  const isInline = !!inlineArea;
  const isModoTodos = modo === "todos" || (!tema && !temas);
  const temasArray = temas ? temas.split(",").map(t => decodeURIComponent(t)) : [];

  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardGerado[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [fraseIndex, setFraseIndex] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<FlashcardSettings>({ autoNarration: false, showExamples: true, studyMode: 'leitura' });
  const fraseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [flashcardsCount, setFlashcardsCount] = useState<number | null>(null);
  
  // Background generation state
  const [bgGenerating, setBgGenerating] = useState(false);
  const [bgCurrentTema, setBgCurrentTema] = useState<string | null>(null);
  const [bgGeradosCount, setBgGeradosCount] = useState(0);
  const abortRef = useRef(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const flashcardsIdsRef = useRef<Set<number>>(new Set());
  const hasAttemptedGeneration = useRef(false);

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
      if (fraseIntervalRef.current) clearInterval(fraseIntervalRef.current);
    };
  }, [isGenerating]);

  // Fetch all flashcards with pagination
  const fetchAllFlashcards = useCallback(async () => {
    let allData: FlashcardGerado[] = [];
    let offset = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from("FLASHCARDS_GERADOS")
        .select("*")
        .ilike("area", area);

      if (!isModoTodos && tema) {
        query = query.eq("tema", tema);
      } else if (!isModoTodos && temasArray.length > 0) {
        query = query.in("tema", temasArray);
      }

      const { data, error } = await query.range(offset, offset + pageSize - 1);

      if (error) throw error;
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        offset += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allData as FlashcardGerado[];
  }, [area, tema, temas, isModoTodos, temasArray]);

  // Initial load
  useEffect(() => {
    if (!area) return;
    
    const load = async () => {
      setIsLoadingInitial(true);
      try {
        const data = await fetchAllFlashcards();
        setFlashcards(data);
        flashcardsIdsRef.current = new Set(data.map(f => f.id));
        setFlashcardsCount(data.length);
        
        // If modo=todos and no flashcards exist yet, trigger generation
        if (data.length === 0 && isModoTodos) {
          startInitialGeneration();
        }
      } catch (err) {
        console.error("Erro ao carregar flashcards:", err);
      } finally {
        setIsLoadingInitial(false);
      }
    };
    
    load();

    return () => {
      abortRef.current = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [area, tema, temas, modo]);

   // Polling for new flashcards (background gen) — only when generating
  useEffect(() => {
    if (!area || !isModoTodos || isLoadingInitial || !isGenerating) return;

    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchAllFlashcards();
        const newIds = data.filter(f => !flashcardsIdsRef.current.has(f.id));
        if (newIds.length > 0) {
          setFlashcards(prev => {
            const existingIds = new Set(prev.map(f => f.id));
            const truly = newIds.filter(f => !existingIds.has(f.id));
            return [...prev, ...truly];
          });
          newIds.forEach(f => flashcardsIdsRef.current.add(f.id));
        }
      } catch (e) {
        // silent
      }
    }, 15000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [area, isModoTodos, isLoadingInitial, isGenerating, fetchAllFlashcards]);

  // Background generation for modo=todos
  useEffect(() => {
    if (!isModoTodos || isLoadingInitial || !area || flashcards.length === 0) return;
    
    startBackgroundGeneration();
  }, [isModoTodos, isLoadingInitial, area, flashcards.length > 0]);

  const startInitialGeneration = async () => {
    setIsGenerating(true);
    try {
      // Get first tema from RESUMO
      const { data: resumos } = await supabase
        .from("RESUMO")
        .select("tema, subtema, conteudo")
        .eq("area", area)
        .limit(100);

      if (!resumos || resumos.length === 0) {
        toast.error("Não há conteúdo disponível para gerar flashcards");
        setIsGenerating(false);
        return;
      }

      const firstTema = resumos[0].tema;
      const resumosDoTema = resumos.filter(r => r.tema === firstTema);

      const { error } = await supabase.functions.invoke("gerar-flashcards-tema", {
        body: { area, tema: firstTema, resumos: resumosDoTema }
      });

      if (error) throw error;

      // Reload flashcards
      const data = await fetchAllFlashcards();
      setFlashcards(data);
      flashcardsIdsRef.current = new Set(data.map(f => f.id));
      
      if (data.length > 0) {
        toast.success(`${data.length} flashcards disponíveis!`);
      }
    } catch (err) {
      console.error("Erro na geração inicial:", err);
      toast.error("Erro ao gerar flashcards");
    } finally {
      setIsGenerating(false);
    }
  };

  const startBackgroundGeneration = async () => {
    if (bgGenerating) return;
    setBgGenerating(true);
    abortRef.current = false;

    try {
      // Get all temas from RESUMO
      const { data: resumoTemas } = await supabase
        .from("RESUMO")
        .select("tema, subtema")
        .eq("area", area);

      if (!resumoTemas) { setBgGenerating(false); return; }

      // Group subtemas by tema
      const temasMap = new Map<string, Set<string>>();
      resumoTemas.forEach(r => {
        if (!r.tema) return;
        if (!temasMap.has(r.tema)) temasMap.set(r.tema, new Set());
        if (r.subtema) temasMap.get(r.tema)!.add(r.subtema);
      });

      // Get existing flashcard subtemas by tema
      const existingSubtemas = new Map<string, Set<string>>();
      flashcards.forEach(f => {
        if (!existingSubtemas.has(f.tema)) existingSubtemas.set(f.tema, new Set());
        if (f.subtema) existingSubtemas.get(f.tema)!.add(f.subtema);
      });

      // Find temas with missing subtemas
      for (const [temaName, subtemas] of temasMap) {
        if (abortRef.current) break;
        
        const existingSubs = existingSubtemas.get(temaName) || new Set();
        if (existingSubs.size >= subtemas.size) continue; // Already complete

        setBgCurrentTema(temaName);

        const { data: resumos } = await supabase
          .from("RESUMO")
          .select("subtema, conteudo")
          .eq("area", area)
          .eq("tema", temaName);

        if (!resumos || abortRef.current) continue;

        try {
          const { data } = await supabase.functions.invoke("gerar-flashcards-tema", {
            body: { area, tema: temaName, resumos }
          });
          
          setBgGeradosCount(prev => prev + (data?.flashcards_gerados || 0));
        } catch (e) {
          console.error(`Erro gerando ${temaName}:`, e);
        }

        // Wait between calls
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error("Erro na geração background:", err);
    } finally {
      setBgGenerating(false);
      setBgCurrentTema(null);
    }
  };

  // Single tema generation (original flow)
  const generateFlashcardsSingleTema = async () => {
    if (!tema) return;
    setIsGenerating(true);
    
    try {
      const { data: resumos, error: resumosError } = await supabase
        .from("RESUMO")
        .select("subtema, conteudo")
        .eq("area", area)
        .eq("tema", tema);

      if (resumosError) throw resumosError;
      if (!resumos || resumos.length === 0) {
        toast.error("Não há conteúdo disponível para gerar flashcards");
        setIsGenerating(false);
        return;
      }

      const { error } = await supabase.functions.invoke("gerar-flashcards-tema", {
        body: { area, tema, resumos }
      });

      if (error) throw error;

      const data = await fetchAllFlashcards();
      setFlashcards(data);
      flashcardsIdsRef.current = new Set(data.map(f => f.id));
      
      if (data.length > 0) {
        toast.success(`${data.length} flashcards disponíveis!`);
      }
    } catch (error) {
      console.error("Erro ao gerar flashcards:", error);
      toast.error("Erro ao gerar flashcards. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger generation for single tema if no flashcards — only once
  useEffect(() => {
    if (!isModoTodos && tema && !isLoadingInitial && flashcards.length === 0 && settings && !hasAttemptedGeneration.current) {
      hasAttemptedGeneration.current = true;
      generateFlashcardsSingleTema();
    }
  }, [isModoTodos, tema, isLoadingInitial, flashcards.length, settings]);
  
  // Reset flag when tema changes
  useEffect(() => {
    hasAttemptedGeneration.current = false;
  }, [tema]);

  const handleSettingsConfirm = (newSettings: FlashcardSettings) => {
    setSettings(newSettings);
    setShowSettingsModal(false);
  };

  // Redirecionar se não houver área
  if (!area) {
    if (isInline && onExit) { onExit(); return null; }
    navigate("/flashcards");
    return null;
  }

  // Mostrar tela de geração
  if (isGenerating) {
    return (
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'hsl(0 0% 13%)' }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="text-center w-full max-w-xs">
            <h2 className="text-lg font-semibold mb-1 text-white">Gerando flashcards...</h2>
            <p className="text-sm text-white/60 max-w-xs mt-2 min-h-[40px] transition-opacity duration-300">
              {FRASES_GERACAO[fraseIndex]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingInitial) {
    return (
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'hsl(0 0% 13%)' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-white/60">Carregando flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se não tem flashcards
  if (settings && flashcards.length === 0 && !isGenerating) {
    return (
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'hsl(0 0% 13%)' }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <Scale className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1 text-white">Nenhum flashcard disponível</h2>
            <p className="text-sm text-white/60 max-w-xs mb-4">
              Não foi possível carregar ou gerar flashcards.
            </p>
            <Button onClick={() => isInline && onExit ? onExit() : goBack()}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  // Transformar flashcards para o formato do FlashcardViewer
  const flashcardsFormatados = flashcards.map(f => ({
    id: f.id,
    front: f.pergunta,
    back: f.resposta,
    exemplo: f.exemplo || undefined,
    base_legal: f.base_legal || undefined,
    url_imagem_exemplo: f.url_imagem_exemplo || undefined,
    url_audio_exemplo: f.url_audio_exemplo || undefined,
    "audio-pergunta": f.url_audio_pergunta || undefined,
    "audio-resposta": f.url_audio_resposta || undefined,
    tema: f.tema || undefined,
    subtema: f.subtema || undefined,
  }));

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'hsl(0 0% 13%)' }}>
      <FlashcardSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onStart={handleSettingsConfirm}
        totalFlashcards={flashcardsCount ?? flashcards.length}
        tema={isModoTodos ? area : tema}
        onBack={goBack}
      />

      {/* Background generation indicator - bottom */}
      {bgGenerating && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 bg-black/70 border border-emerald-500/20 rounded-full px-4 py-2 backdrop-blur-md shadow-lg">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300/80 flex-1 truncate">
                Gerando: {bgCurrentTema || '...'} • +{bgGeradosCount}
              </p>
              <Loader2 className="w-3 h-3 animate-spin text-emerald-400/70 shrink-0" />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-3 py-4">
        {flashcards.length > 0 ? (
          <FlashcardViewer flashcards={flashcardsFormatados} settings={settings} area={area} />
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-white/60">Carregando flashcards...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsEstudar;
