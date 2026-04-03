import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TRIAL_DAYS = 3;

const ALLOWED_ROUTES = [
  '/',
  '/inicio',
  '/assinatura',
  '/assinatura/checkout',
  '/assinatura/callback',
  '/configuracoes',
  '/perfil',
];

interface TrialOverride {
  extra_ms: number;
  desativado: boolean;
  rating_bonus_claimed: boolean;
  rating_bonus_revoked: boolean;
}

interface TrialStatus {
  isInTrial: boolean;
  trialDaysLeft: number;
  trialHoursLeft: number;
  trialMsRemaining: number;
  trialExpired: boolean;
  trialModalVisto: boolean;
  ratingBonusClaimed: boolean;
  ratingBonusRevoked: boolean;
  loading: boolean;
}

export const useTrialStatus = (): TrialStatus => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: subLoading, checkedUserId } = useSubscription();
  const [override, setOverride] = useState<TrialOverride | null>(null);
  const [overrideLoaded, setOverrideLoaded] = useState(false);

  const [trialBloqueadoIp, setTrialBloqueadoIp] = useState(false);
  const [trialModalVisto, setTrialModalVisto] = useState(false);

  const fetchOverride = useCallback(async (userId: string) => {
    const [overrideRes, profileRes] = await Promise.all([
      supabase
        .from('trial_overrides')
        .select('extra_ms, desativado, rating_bonus_claimed, rating_bonus_revoked')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('trial_bloqueado_ip, trial_modal_visto')
        .eq('id', userId)
        .maybeSingle(),
    ]);
    setOverride(overrideRes.data ? {
      extra_ms: Number(overrideRes.data.extra_ms) || 0,
      desativado: !!overrideRes.data.desativado,
      rating_bonus_claimed: !!(overrideRes.data as any).rating_bonus_claimed,
      rating_bonus_revoked: !!(overrideRes.data as any).rating_bonus_revoked,
    } : null);
    setTrialBloqueadoIp(!!profileRes.data?.trial_bloqueado_ip);
    setTrialModalVisto(!!profileRes.data?.trial_modal_visto);
    setOverrideLoaded(true);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setOverride(null);
      setOverrideLoaded(true);
      return;
    }
    fetchOverride(user.id);

    // Realtime subscription - use unique channel name to avoid StrictMode conflicts
    const channelName = `trial_override_${user.id}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trial_overrides', filter: `user_id=eq.${user.id}` },
        () => fetchOverride(user.id)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchOverride]);

  const subscriptionNotReady = !!user?.id && checkedUserId !== user.id;
  const loading = authLoading || subLoading || subscriptionNotReady || !overrideLoaded;

  if (loading || !user) {
    return { isInTrial: false, trialDaysLeft: 0, trialHoursLeft: 0, trialMsRemaining: 0, trialExpired: false, trialModalVisto: false, ratingBonusClaimed: false, ratingBonusRevoked: false, loading };
  }

  // Se admin desativou o trial ou IP bloqueado
  if (override?.desativado || trialBloqueadoIp) {
    return { isInTrial: false, trialDaysLeft: 0, trialHoursLeft: 0, trialMsRemaining: 0, trialExpired: true, trialModalVisto, ratingBonusClaimed: override?.rating_bonus_claimed || false, ratingBonusRevoked: override?.rating_bonus_revoked || false, loading: false };
  }

  const createdAt = new Date(user.created_at);
  const now = new Date();
  const LAUNCH_DATE = new Date('2026-02-20T00:00:00Z');
  const effectiveStartDate = new Date(Math.max(createdAt.getTime(), LAUNCH_DATE.getTime()));

  const msElapsed = now.getTime() - effectiveStartDate.getTime();
  const totalTrialMs = TRIAL_DAYS * 24 * 60 * 60 * 1000 + (override?.extra_ms || 0);
  const msRemaining = Math.max(0, totalTrialMs - msElapsed);

  const withinTrialPeriod = msElapsed < totalTrialMs;
  const confirmedPremium = !subLoading && isPremium;
  const isInTrial = !confirmedPremium && withinTrialPeriod;
  const trialDaysLeft = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60 * 24)));
  const trialHoursLeft = Math.max(0, Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const trialExpired = confirmedPremium ? false : msElapsed >= totalTrialMs;

  return { isInTrial, trialDaysLeft, trialHoursLeft, trialMsRemaining: msRemaining, trialExpired, trialModalVisto, ratingBonusClaimed: override?.rating_bonus_claimed || false, ratingBonusRevoked: override?.rating_bonus_revoked || false, loading: false };
};

export const isTrialAllowedRoute = (pathname: string): boolean => {
  return ALLOWED_ROUTES.some(route => pathname.startsWith(route));
};
