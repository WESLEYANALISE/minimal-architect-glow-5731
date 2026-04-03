import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Target } from "lucide-react";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SimuladoFreeConfirmDialog = ({ open, onConfirm, onCancel }: Props) => {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent className="max-w-[340px] rounded-2xl bg-card border-border/50">
        <AlertDialogHeader className="items-center text-center">
          <div className="mx-auto p-3 bg-amber-500/20 rounded-2xl mb-2">
            <Target className="w-6 h-6 text-amber-400" />
          </div>
          <AlertDialogTitle className="text-foreground text-base">
            Simulado Gratuito
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
            Você tem direito a <strong className="text-foreground">1 simulado gratuito por mês</strong>. Deseja usar agora?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:flex-row">
          <AlertDialogCancel
            onClick={onCancel}
            className="flex-1 mt-0 rounded-xl"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-primary text-primary-foreground"
          >
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
