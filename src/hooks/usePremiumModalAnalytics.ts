import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type ModalType = "floating_card" | "upgrade_modal" | "chat_gate";

const detectDevice = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
};

export const usePremiumModalAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();

  const trackModalOpen = (modalType: ModalType, sourceFeature?: string) => {
    // Fire-and-forget
    supabase
      .from('premium_modal_views')
      .insert({
        user_id: user?.id || null,
        modal_type: modalType,
        source_page: location.pathname,
        source_feature: sourceFeature || null,
        device: detectDevice(),
      })
      .then(({ error }) => {
        if (error) console.error('Erro ao registrar modal view:', error);
      });
  };

  return { trackModalOpen };
};
