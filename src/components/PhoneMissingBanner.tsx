import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

const DISMISS_KEY = 'phone_banner_dismissed';

export function PhoneMissingBanner() {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || !isPremium) return;
    
    const dismissed = localStorage.getItem(`${DISMISS_KEY}_${user.id}`);
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      // Re-show after 3 days
      if (Date.now() - dismissedAt.getTime() < 3 * 24 * 60 * 60 * 1000) return;
    }

    supabase.from('profiles').select('telefone').eq('id', user.id).single()
      .then(({ data }) => {
        const tel = data?.telefone?.replace(/\D/g, '') || '';
        if (!tel || tel.length < 10) setShow(true);
      });
  }, [user, isPremium]);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(`${DISMISS_KEY}_${user!.id}`, new Date().toISOString());
    setShow(false);
  };

  return (
    <div className="mx-2 mb-3 relative bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
      <div className="bg-amber-500/20 rounded-full p-2">
        <Phone className="h-5 w-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Cadastre seu telefone</p>
        <p className="text-xs text-muted-foreground">Para usar a Evelyn no WhatsApp</p>
      </div>
      <button
        onClick={() => navigate('/configuracoes')}
        className="text-xs bg-amber-500 text-black font-semibold px-3 py-1.5 rounded-lg shrink-0"
      >
        Cadastrar
      </button>
      <button onClick={dismiss} className="absolute top-1 right-1 p-1 text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
