import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

type FunnelEventType =
  | 'page_enter'
  | 'page_leave'
  | 'plan_tab_switch'
  | 'plan_modal_open'
  | 'payment_method_select'
  | 'pix_generated'
  | 'card_initiated'
  | 'card_form_filled'
  | 'card_payment_success'
  | 'card_payment_error'
  | 'card_form_abandoned'
  | 'card_form_progress'
  | 'payment_completed';

interface TrackEventParams {
  event_type: FunnelEventType;
  plan_type?: string;
  payment_method?: string;
  amount?: number;
  referrer_page?: string;
  duration_seconds?: number;
  metadata?: Record<string, unknown>;
}

const detectDevice = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
};

interface UseSubscriptionFunnelTrackingOptions {
  enabled?: boolean;
}

export const useSubscriptionFunnelTracking = ({ enabled = true }: UseSubscriptionFunnelTrackingOptions = {}) => {
  const { user } = useAuth();
  const location = useLocation();
  const enterTimeRef = useRef<number>(Date.now());
  const hasTrackedEnterRef = useRef(false);

  const trackEvent = useCallback(async (params: TrackEventParams) => {
    if (!user?.id || !enabled) return;
    try {
      await supabase.from('subscription_funnel_events').insert([{
        user_id: user.id,
        event_type: params.event_type,
        plan_type: params.plan_type || null,
        payment_method: params.payment_method || null,
        amount: params.amount || null,
        referrer_page: params.referrer_page || null,
        duration_seconds: params.duration_seconds || null,
        metadata: (params.metadata || {}) as any,
        device: detectDevice(),
      }]);
    } catch (err) {
      console.error('Funnel tracking error:', err);
    }
  }, [user?.id, enabled]);

  const trackEventRef = useRef(trackEvent);
  trackEventRef.current = trackEvent;

  // Track page_enter on mount and page_leave on unmount
  useEffect(() => {
    if (!user?.id || !enabled || hasTrackedEnterRef.current) return;
    hasTrackedEnterRef.current = true;
    enterTimeRef.current = Date.now();

    const referrer = document.referrer
      ? new URL(document.referrer).pathname
      : (location.state as any)?.from || 'direto';

    trackEventRef.current({
      event_type: 'page_enter',
      referrer_page: referrer,
    });

    return () => {
      const duration = Math.round((Date.now() - enterTimeRef.current) / 1000);
      trackEventRef.current({
        event_type: 'page_leave',
        duration_seconds: duration,
      });
    };
  }, [user?.id, enabled]);

  return { trackEvent };
};
