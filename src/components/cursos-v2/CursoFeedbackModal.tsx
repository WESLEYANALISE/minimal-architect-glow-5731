import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CursoFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (nota: number, comentario: string) => void;
  aulaTitulo: string;
}

export const CursoFeedbackModal = ({ open, onClose, onSubmit, aulaTitulo }: CursoFeedbackModalProps) => {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");

  const handleSubmit = () => {
    onSubmit(nota || 5, comentario);
    setNota(0);
    setComentario("");
  };

  const handleSkip = () => {
    onSubmit(0, "");
    setNota(0);
    setComentario("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-center text-lg">🎉 Aula Concluída!</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Como foi a aula "<span className="font-medium text-foreground">{aulaTitulo}</span>"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Stars */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} onClick={() => setNota(i)} className="p-1 transition-transform hover:scale-110">
                <Star className={cn(
                  "w-8 h-8 transition-colors",
                  i <= nota ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                )} />
              </button>
            ))}
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Deixe um comentário (opcional)..."
            value={comentario}
            onChange={e => setComentario(e.target.value)}
            className="resize-none h-20 text-sm"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={handleSkip}>
              Pular
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
