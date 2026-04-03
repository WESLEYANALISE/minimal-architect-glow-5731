import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDailyLimit } from "@/hooks/useDailyLimit";
import { PremiumFloatingCard } from "@/components/PremiumFloatingCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BotaoExplicarProps {
  contexto: string;
  dados?: any;
  titulo?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const BotaoExplicar = ({ 
  contexto, 
  dados = {}, 
  titulo = "O que isso significa?",
  variant = "outline",
  size = "sm",
  className = ""
}: BotaoExplicarProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explicacao, setExplicacao] = useState("");
  const [showPremiumCard, setShowPremiumCard] = useState(false);
  const { toast } = useToast();

  // Hook de limite diário
  const { canUse, remainingUses, isUnlimited, incrementUse } = useDailyLimit('explicar-artigo');

  const handleExplicar = async () => {
    // Verificar limite antes de prosseguir
    if (!canUse && !isUnlimited) {
      setShowPremiumCard(true);
      return;
    }

    setOpen(true);
    setLoading(true);
    setExplicacao("");

    try {
      const { data, error } = await supabase.functions.invoke('explicar-com-gemini', {
        body: { contexto, dados }
      });

      if (error) throw error;

      // Incrementar uso após sucesso
      incrementUse();
      
      setExplicacao(data.explicacao || 'Não foi possível gerar explicação.');
    } catch (error: any) {
      console.error('Erro ao buscar explicação:', error);
      toast({
        title: "Erro ao buscar explicação",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Texto do tooltip mostrando usos restantes
  const tooltipText = isUnlimited 
    ? "Explicações ilimitadas" 
    : `${remainingUses} explicações restantes hoje`;

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={variant} 
              size={size}
              onClick={handleExplicar}
              className={className}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Explicar
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-accent" />
              {titulo}
            </DialogTitle>
            <DialogDescription>
              Explicação educativa gerada por IA
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <span className="ml-3 text-muted-foreground">Gerando explicação...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {explicacao}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-accent/10 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 Esta explicação foi gerada por inteligência artificial para fins educativos.
              Para informações oficiais, consulte o site do TSE.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Card quando limite atingido */}
      <PremiumFloatingCard
        isOpen={showPremiumCard}
        onClose={() => setShowPremiumCard(false)}
        title="Limite de Explicações Atingido"
        description="Você usou todas as suas 5 explicações gratuitas de hoje. Assine o Premium para explicações ilimitadas!"
        sourceFeature="Explicar Artigo"
      />
    </>
  );
};
