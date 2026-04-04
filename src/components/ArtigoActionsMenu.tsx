import { 
  GraduationCap, 
  Bookmark, 
  Target,
  X,
  Crown,
  Lock,
  ChevronDown,
  Puzzle,
  Link2,
  CheckCircle,
  Scale
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { isArticleFeatureAllowed } from "@/lib/utils/premiumNarration";
import { motion, AnimatePresence } from "framer-motion";
import type { PraticaTipo } from "@/components/PraticaArtigoModal";

interface Article {
  "Número do Artigo": string | null;
  "Artigo": string | null;
  "Narração": string | null;
  "Comentario": string | null;
  "Aula": string | null;
}

interface ArtigoActionsMenuProps {
  article: Article;
  codigoNome: string;
  onPlayNarration?: (audioUrl: string) => void;
  onPlayComment?: (audioUrl: string, title: string) => void;
  onOpenAula?: () => void;
  onOpenExplicacao?: (tipo: "explicacao" | "exemplo") => void;
  onGenerateFlashcards?: () => void;
  onOpenTermos?: () => void;
  onOpenQuestoes?: () => void;
  onPerguntar?: () => void;
  onOpenAulaArtigo?: () => void;
  onOpenPratica?: (tipo: PraticaTipo) => void;
  loadingFlashcards?: boolean;
  isCommentPlaying?: boolean;
  isEmbedded?: boolean;
  onShowPremiumCard?: () => void;
}

const FLASHCARD_SUBTYPES = [
  { tipo: "flashcard_conceito" as PraticaTipo, icon: Bookmark, label: "Conceitos", description: "Frente e verso clássico" },
  { tipo: "flashcard_lacuna" as PraticaTipo, icon: Puzzle, label: "Lacunas", description: "Preencha os espaços" },
  { tipo: "flashcard_correspondencia" as PraticaTipo, icon: Link2, label: "Correspondência", description: "Associe os pares" },
];

const QUESTAO_SUBTYPES = [
  { tipo: "questao_alternativa" as PraticaTipo, icon: Target, label: "Alternativas", description: "Múltipla escolha" },
  { tipo: "questao_sim_nao" as PraticaTipo, icon: CheckCircle, label: "Sim ou Não", description: "Certo ou errado" },
  { tipo: "questao_caso_pratico" as PraticaTipo, icon: Scale, label: "Caso Prático", description: "Cenários narrativos" },
];

export const ArtigoActionsMenu = ({
  article,
  codigoNome,
  onOpenAulaArtigo,
  onOpenPratica,
  isEmbedded = false,
  onShowPremiumCard,
}: ArtigoActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<"flashcards" | "questoes" | null>(null);
  
  const { isPremium } = useSubscription();
  const numeroArtigo = article["Número do Artigo"] || "";
  const canUseResources = isArticleFeatureAllowed(numeroArtigo, isPremium, codigoNome);

  const handleAction = (action: () => void) => {
    if (!canUseResources) {
      onShowPremiumCard?.();
      if (!isEmbedded) setIsOpen(false);
      return;
    }
    action();
    if (!isEmbedded) setIsOpen(false);
  };

  const handleSubAction = (tipo: PraticaTipo) => {
    if (!canUseResources) {
      onShowPremiumCard?.();
      return;
    }
    onOpenPratica?.(tipo);
    if (!isEmbedded) setIsOpen(false);
  };

  const toggleSection = (section: "flashcards" | "questoes") => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const isBlocked = !canUseResources;
  const showCrown = isBlocked;

  const RecursosContent = () => (
    <div className="space-y-2">
      {isBlocked && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/10 border border-accent/30 mb-3">
          <Crown className="w-5 h-5 text-accent flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-accent">Recursos Premium</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Disponível para artigos 1-10. Assine para acesso completo.
            </p>
          </div>
        </div>
      )}

      {/* Aula Interativa */}
      {onOpenAulaArtigo && (
        <button
          onClick={() => handleAction(onOpenAulaArtigo)}
           className={`relative w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md text-left ${
             isBlocked
               ? 'bg-muted/50 border border-border/50 opacity-60'
               : 'bg-accent/5 hover:bg-accent/10 border border-border/50 border-l-2 border-l-red-500/40'
           }`}
        >
          {isBlocked ? <Lock className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" /> : <GraduationCap className="w-5 h-5 mt-0.5 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Aula Interativa</div>
            <div className="text-xs mt-0.5 opacity-80">Aprenda tudo sobre este artigo</div>
          </div>
          {showCrown && <Crown className="w-3.5 h-3.5 text-accent absolute top-2 right-2" />}
        </button>
      )}

      {/* Flashcards - Expandable */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <button
          onClick={() => toggleSection("flashcards")}
          className={`relative w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left ${
            isBlocked ? 'bg-muted/50 opacity-60' : 'bg-accent/5 hover:bg-accent/10'
          }`}
        >
          {isBlocked ? <Lock className="w-5 h-5 flex-shrink-0 text-muted-foreground" /> : <Bookmark className="w-5 h-5 flex-shrink-0 text-accent" />}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground">Flashcards</div>
            <div className="text-xs text-muted-foreground">3 modos de memorização</div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedSection === "flashcards" ? "rotate-180" : ""}`} />
          {showCrown && <Crown className="w-3.5 h-3.5 text-accent absolute top-2 right-2" />}
        </button>
        <AnimatePresence>
          {expandedSection === "flashcards" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-1.5">
                {FLASHCARD_SUBTYPES.map(sub => {
                  const Icon = sub.icon;
                  return (
                    <button
                      key={sub.tipo}
                      onClick={() => handleSubAction(sub.tipo)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background hover:bg-accent/10 transition-all text-left border border-border/30"
                    >
                      <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{sub.label}</div>
                        <div className="text-xs text-muted-foreground">{sub.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Questões - Expandable */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <button
          onClick={() => toggleSection("questoes")}
          className={`relative w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left ${
            isBlocked ? 'bg-muted/50 opacity-60' : 'bg-accent/5 hover:bg-accent/10'
          }`}
        >
          {isBlocked ? <Lock className="w-5 h-5 flex-shrink-0 text-muted-foreground" /> : <Target className="w-5 h-5 flex-shrink-0 text-accent" />}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground">Questões</div>
            <div className="text-xs text-muted-foreground">3 tipos de exercício</div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedSection === "questoes" ? "rotate-180" : ""}`} />
          {showCrown && <Crown className="w-3.5 h-3.5 text-accent absolute top-2 right-2" />}
        </button>
        <AnimatePresence>
          {expandedSection === "questoes" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-1.5">
                {QUESTAO_SUBTYPES.map(sub => {
                  const Icon = sub.icon;
                  return (
                    <button
                      key={sub.tipo}
                      onClick={() => handleSubAction(sub.tipo)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background hover:bg-accent/10 transition-all text-left border border-border/30"
                    >
                      <Icon className="w-4 h-4 text-accent flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{sub.label}</div>
                        <div className="text-xs text-muted-foreground">{sub.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  if (isEmbedded) {
    return <RecursosContent />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-accent/10 hover:bg-accent/20 text-foreground border-accent/40 font-semibold transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
          variant="outline"
        >
          <Target className="w-4 h-4 mr-2" />
          <span className="text-sm">Praticar</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px] animate-scale-in max-h-[80vh] overflow-y-auto">
        <DialogHeader className="relative pr-8">
          <DialogTitle className="flex items-start gap-2 text-lg leading-tight">
            <Target className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold">Praticar Art. {article["Número do Artigo"]}</div>
              <div className="text-sm font-normal text-muted-foreground mt-0.5">{codigoNome}</div>
            </div>
          </DialogTitle>
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-0 top-0 rounded-full p-1.5 hover:bg-accent/20 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </DialogHeader>
        
        <div className="py-4">
          <RecursosContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};
