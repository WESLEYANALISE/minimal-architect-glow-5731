import { Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';

interface VideoaulaTrialLockProps {
  type: 'flashcards' | 'questões';
  children: React.ReactNode;
}

const VideoaulaTrialLock: React.FC<VideoaulaTrialLockProps> = ({ type, children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trialExpired, loading: trialLoading } = useTrialStatus();
  const { isPremium } = useSubscription();

  const isLocked = !!user && !trialLoading && trialExpired && !isPremium;

  if (isLocked) {
    return (
      <div className="bg-neutral-900/80 border border-white/5 rounded-xl p-6">
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {type === 'flashcards' ? 'Flashcards' : 'Questões'} bloqueados
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Seu período gratuito terminou. Assine para desbloquear {type} e todo o conteúdo premium.
          </p>
          <Button
            onClick={() => navigate('/assinatura')}
            className="mt-2 gap-2"
            style={{
              background: 'linear-gradient(135deg, hsl(43 80% 45%), hsl(35 90% 50%))',
              color: 'hsl(25 30% 10%)',
            }}
          >
            <Zap className="w-4 h-4" />
            Assinar agora
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default VideoaulaTrialLock;
