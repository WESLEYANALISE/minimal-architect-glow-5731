import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

import authDialogHero from '@/assets/auth-dialog-hero.webp';

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function AuthRequiredDialog({
  open,
  onOpenChange,
}: AuthRequiredDialogProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/auth?mode=login');
  };

  const handleSignup = () => {
    onOpenChange(false);
    navigate('/auth?mode=signup');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 border-0" overlayClassName="backdrop-blur-xl bg-black/60">
        {/* Single hero image */}
        <div className="relative w-full aspect-[4/3] bg-black overflow-hidden">
          <img
            src={authDialogHero}
            alt="Direito Prime"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
           <div className="absolute bottom-4 left-4 right-4 text-white text-center">
             <h3 className="text-xl font-bold font-playfair">Direito Prime</h3>
             <p className="text-sm text-white/80 mt-1">Sua jornada jurídica começa aqui</p>
           </div>
         </div>

         {/* Login message */}
         <div className="px-5 pt-4 pb-1 text-center">
           <p className="text-sm font-medium text-foreground">
             Você precisa estar logado para acessar este recurso.
           </p>
         </div>

         {/* Buttons */}
         <div className="px-5 pb-5 pt-2 space-y-3">
          <Button
            onClick={handleSignup}
            className="w-full gap-2"
            size="lg"
          >
            <UserPlus className="w-4 h-4" />
            Quero ser Aluno(a)!
          </Button>
          <Button
            onClick={handleLogin}
            className="w-full gap-2"
            variant="outline"
            size="lg"
          >
            <LogIn className="w-4 h-4" />
            Já sou Aluno(a)
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            É rápido e gratuito!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
