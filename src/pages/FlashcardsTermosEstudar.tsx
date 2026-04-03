import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, BookOpen } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FlashcardViewer, FlashcardSettings } from "@/components/FlashcardViewer";
import { FlashcardSettingsModal } from "@/components/FlashcardSettingsModal";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { Button } from "@/components/ui/button";

interface DicionarioTermo {
  Palavra: string | null;
  Significado: string | null;
  "Exemplo de Uso 1"?: string | null;
  "Exemplo de Uso 2"?: string | null;
  Letra: string | null;
}

interface Flashcard {
  id?: number;
  front: string;
  back: string;
  exemplo?: string;
  tema?: string;
  subtema?: string;
}

const FRASES_CARREGAMENTO = [
  "Carregando termos jurídicos...",
  "Organizando flashcards...",
  "Enriquecendo definições com IA...",
  "Preparando o vocabulário...",
  "Quase pronto...",
];

const BATCH_SIZE = 10;

// Enrich a batch of terms via Gemini
async function enrichBatch(termos: { palavra: string; significado: string }[]): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.functions.invoke('enriquecer-termos-dicionario', {
      body: { termos },
    });

    if (error) {
      console.error("Erro ao enriquecer batch:", error);
      return {};
    }

    const enriched: Record<string, string> = {};
    if (data?.enriched && Array.isArray(data.enriched)) {
      for (const item of data.enriched) {
        if (item.palavra && item.significado_enriquecido) {
          enriched[item.palavra.toLowerCase()] = item.significado_enriquecido;
        }
      }
    }
    return enriched;
  } catch (err) {
    console.error("Erro na chamada de enriquecimento:", err);
    return {};
  }
}

const FlashcardsTermosEstudar = () => {
  const navigate = useNavigate();
  const { goBack } = useHierarchicalNavigation();
  const [searchParams] = useSearchParams();
  const letra = searchParams.get("letra") || "";
  const { user } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState<FlashcardSettings>({
    autoNarration: false,
    showExamples: true,
    studyMode: 'leitura',
  });
  const [fraseIndex, setFraseIndex] = useState(0);
  const enrichingRef = useRef(false);

  // Rotate loading phrases
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setFraseIndex(prev => (prev + 1) % FRASES_CARREGAMENTO.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Fetch all terms for the letter with pagination
  const fetchTermos = useCallback(async () => {
    if (!letra) return [];

    const accentVariants: Record<string, string[]> = {
      'A': ['A', 'Á', 'À', 'Ã', 'Â'], 'E': ['E', 'É', 'Ê'],
      'I': ['I', 'Í', 'Î'], 'O': ['O', 'Ó', 'Ô', 'Õ'],
      'U': ['U', 'Ú', 'Û'], 'C': ['C', 'Ç'],
    };
    const variants = accentVariants[letra] || [letra];

    const allTerms: DicionarioTermo[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("DICIONARIO" as any)
        .select("*")
        .in("Letra", variants)
        .order("Palavra", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      allTerms.push(...((data || []) as unknown as DicionarioTermo[]));
      hasMore = (data as any[]).length === pageSize;
      from += pageSize;
    }

    return allTerms;
  }, [letra]);

  // Enrich definitions progressively in batches of 10
  const enrichDefinitions = useCallback(async (cards: Flashcard[]) => {
    if (enrichingRef.current || cards.length === 0) return;
    enrichingRef.current = true;

    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const batch = cards.slice(i, i + BATCH_SIZE);
      const termosParaEnriquecer = batch.map(c => ({
        palavra: c.front,
        significado: c.back,
      }));

      const enriched = await enrichBatch(termosParaEnriquecer);

      if (Object.keys(enriched).length > 0) {
        setFlashcards(prev => prev.map(card => {
          const key = card.front.toLowerCase();
          if (enriched[key]) {
            return { ...card, back: enriched[key] };
          }
          return card;
        }));
      }
    }

    enrichingRef.current = false;
  }, []);

  // Load terms on mount
  useEffect(() => {
    if (!letra) return;
    setIsLoading(true);

    fetchTermos()
      .then(termos => {
        const mapped: Flashcard[] = termos.map((t, idx) => {
          const exemplos = [t["Exemplo de Uso 1"], t["Exemplo de Uso 2"]]
            .filter(Boolean)
            .join("\n\n");

          return {
            id: idx + 1,
            front: t.Palavra || "Sem termo",
            back: t.Significado || "Sem significado",
            exemplo: exemplos || undefined,
            tema: `Letra ${letra}`,
            subtema: t.Palavra || undefined,
          };
        });
        setFlashcards(mapped);
        setIsLoading(false);
        
        // Start enriching definitions in background
        enrichDefinitions(mapped);
      })
      .catch(err => {
        console.error("Erro ao carregar termos:", err);
        setIsLoading(false);
      });
  }, [letra, fetchTermos, enrichDefinitions]);

  // Redirect non-admin
  if (!isAdmin) {
    navigate("/flashcards/areas", { replace: true });
    return null;
  }

  if (!letra) {
    navigate("/flashcards/termos-juridicos", { replace: true });
    return null;
  }

  const handleSettingsConfirm = (newSettings: FlashcardSettings) => {
    setSettings(newSettings);
    setShowSettingsModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'hsl(0 0% 13%)' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60 min-h-[40px] transition-opacity duration-300">
              {FRASES_CARREGAMENTO[fraseIndex]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'hsl(0 0% 13%)' }}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-destructive" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1 text-white">Nenhum termo encontrado</h2>
            <p className="text-sm text-white/60 max-w-xs mb-4">
              Não há termos disponíveis para a letra {letra}.
            </p>
            <Button onClick={goBack}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'hsl(0 0% 13%)' }}>
      <FlashcardSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onStart={handleSettingsConfirm}
        totalFlashcards={flashcards.length}
        tema={`Letra ${letra}`}
        onBack={goBack}
      />

      <div className="max-w-4xl mx-auto px-3 py-4">
        <FlashcardViewer
          flashcards={flashcards}
          settings={settings}
          area="Termos Jurídicos"
          tema={`Letra ${letra}`}
        />
      </div>
    </div>
  );
};

export default FlashcardsTermosEstudar;
