import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Gift, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCapacitorPlatform } from '@/hooks/use-capacitor-platform';
import { useExternalBrowser } from '@/hooks/use-external-browser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.lovable.ee0c2f23b4d24626aa8b673465242430';
const APP_STORE_URL = 'https://apps.apple.com/app/id6744440937';

interface Props {
  open: boolean;
  onClose: () => void;
}

const RatingBonusModal: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const { isIOS } = useCapacitorPlatform();
  const { openUrl } = useExternalBrowser();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleAvaliar = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('conceder-bonus-avaliacao', { body: {} });
      if (error) throw error;

      // Open store
      const storeUrl = isIOS ? APP_STORE_URL : PLAY_STORE_URL;
      await openUrl(storeUrl);

      toast.success('🎉 7 dias grátis ativados! Obrigado por avaliar!');
      queryClient.invalidateQueries({ queryKey: ['admin-trial-users'] });
      onClose();
    } catch (err: any) {
      if (err?.message?.includes('already_claimed')) {
        toast.info('Você já resgatou este bônus');
        onClose();
      } else {
        toast.error('Erro ao ativar bônus. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, isIOS, openUrl, onClose, queryClient]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm border-0 rounded-3xl overflow-hidden p-0 [&>button]:hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(250 25% 10%) 0%, hsl(260 20% 7%) 100%)',
          border: '2px solid hsl(270 60% 50% / 0.5)',
        }}
      >
        {/* Glow strip */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-70" />

        <div className="px-6 pb-8 pt-8 flex flex-col gap-5">
          {/* Icon */}
          <div className="flex justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(270 60% 50%), hsl(280 70% 60%))',
                boxShadow: '0 0 40px hsl(270 60% 50% / 0.4)',
              }}
            >
              <Gift className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white leading-tight">
              Ganhe 7 dias grátis! 🎁
            </h2>
            <p className="text-purple-200/80 text-sm leading-relaxed">
              Avalie o Direito Prime na loja de aplicativos e ganhe{' '}
              <span className="text-purple-300 font-bold">7 dias extras</span>{' '}
              para continuar estudando gratuitamente.
            </p>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
              </motion.div>
            ))}
          </div>

          {/* Info */}
          <p className="text-center text-xs text-white/50">
            Ao clicar, você será redirecionado para a {isIOS ? 'App Store' : 'Play Store'}.
            Os 7 dias serão ativados automaticamente.
          </p>

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* CTAs */}
          <div className="space-y-2">
            <Button
              onClick={handleAvaliar}
              disabled={loading}
              className="w-full h-12 font-bold text-base rounded-xl gap-2 transition-all"
              style={{
                background: 'linear-gradient(135deg, hsl(270 60% 50%), hsl(280 70% 55%))',
                color: 'white',
                boxShadow: '0 4px 20px hsl(270 60% 50% / 0.4)',
              }}
            >
              <Star className="w-5 h-5" />
              {loading ? 'Ativando...' : 'Avaliar e ganhar 7 dias'}
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className="w-full h-10 text-white/50 hover:text-white/80 hover:bg-white/5 text-sm"
            >
              Mais tarde
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingBonusModal;
