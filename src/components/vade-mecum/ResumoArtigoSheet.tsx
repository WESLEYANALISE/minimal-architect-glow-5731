import { useState } from "react";
import { X, Loader2, BookOpen, Brain } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MetodologiaCornellView from "@/components/metodologias/MetodologiaCornellView";
import MetodologiaFeynmanView from "@/components/metodologias/MetodologiaFeynmanView";

interface ResumoArtigoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  artigo: string;
  numeroArtigo: string;
  codeName: string;
  area: string;
}

export const ResumoArtigoSheet = ({
  isOpen,
  onClose,
  artigo,
  numeroArtigo,
  codeName,
  area,
}: ResumoArtigoSheetProps) => {
  const [loading, setLoading] = useState(false);
  const [metodoSelecionado, setMetodoSelecionado] = useState<"cornell" | "feynman" | null>(null);
  const [conteudo, setConteudo] = useState<any>(null);

  const gerarResumo = async (metodo: "cornell" | "feynman") => {
    setMetodoSelecionado(metodo);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-resumo-artigo-metodo", {
        body: {
          artigo,
          numeroArtigo,
          codeName,
          area,
          metodo,
        },
      });
      if (error) throw error;
      setConteudo(data?.conteudo);
    } catch (err) {
      console.error("Erro ao gerar resumo:", err);
      toast.error("Erro ao gerar resumo");
      setMetodoSelecionado(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMetodoSelecionado(null);
    setConteudo(null);
    onClose();
  };

  // Se temos conteúdo gerado, mostrar o viewer
  if (conteudo && metodoSelecionado) {
    if (metodoSelecionado === "cornell") {
      return (
        <MetodologiaCornellView
          conteudo={conteudo}
          tema={`Art. ${numeroArtigo}`}
          area={area}
          onClose={handleClose}
        />
      );
    }
    return (
      <MetodologiaFeynmanView
        conteudo={conteudo}
        tema={`Art. ${numeroArtigo}`}
        area={area}
        onClose={handleClose}
      />
    );
  }

  return (
    <Drawer open={isOpen || loading || (!!conteudo && !!metodoSelecionado)} onOpenChange={(open) => !open && !loading && !conteudo && handleClose()}>
      <DrawerContent className="max-h-[60vh]">
        <div className="max-w-lg mx-auto w-full p-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Resumo — Art. {numeroArtigo}</h3>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-sm text-muted-foreground">
                Gerando resumo {metodoSelecionado === "cornell" ? "Cornell" : "Feynman"}...
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">Escolha o método de estudo:</p>
              <div className="flex flex-col gap-2">
                {/* Cornell */}
                <button
                  onClick={() => gerarResumo("cornell")}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Cornell</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Anotações estruturadas</p>
                  </div>
                </button>

                {/* Feynman */}
                <button
                  onClick={() => gerarResumo("feynman")}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Brain className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Feynman</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Explicação simplificada</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
