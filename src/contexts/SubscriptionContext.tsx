import React, { createContext, useContext, useEffect, useState, useCallback, startTransition } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ADMIN_EMAIL } from '@/lib/adminConfig';

export type PlanLevel = 'free' | 'essencial' | 'pro' | 'vitalicio';

interface SubscriptionData {
  id: string;
  status: string;
  planType: string;
  amount: number;
  expirationDate: string | null;
  paymentMethod: string | null;
  createdAt: string;
}

interface SubscriptionContextType {
  isPremium: boolean;
  hasEvelynAccess: boolean;
  planLevel: PlanLevel;
  subscription: SubscriptionData | null;
  daysRemaining: number | null;
  loading: boolean;
  checkedUserId: string | null;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  hasEvelynAccess: false,
  planLevel: 'free',
  subscription: null,
  daysRemaining: null,
  loading: true,
  checkedUserId: null,
  refreshSubscription: async () => {},
});

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Helper: determine plan level from plan_type string
const parsePlanLevel = (planType: string | null): PlanLevel => {
  if (!planType) return 'free';
  const lower = planType.toLowerCase();
  if (lower.includes('vitalicio') || lower.includes('lifetime')) return 'vitalicio';
  // All paid plans (mensal, anual, essencial, pro, semestral, trimestral) get full access
  if (lower.includes('pro') || lower.includes('anual') || lower.includes('annual') ||
      lower.includes('essencial') || lower.includes('semestral') || lower.includes('mensal') ||
      lower.includes('monthly') || lower.includes('trimestral')) return 'pro';
  return 'free';
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [hasEvelynAccess, setHasEvelynAccess] = useState(false);
  const [planLevel, setPlanLevel] = useState<PlanLevel>('free');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  // Fallback: query subscriptions table directly when edge function fails
  const fallbackDirectQuery = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['authorized', 'active', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[Subscription] Fallback DB query failed:', error);
        return null;
      }

      if (data) {
        const level = parsePlanLevel(data.plan_type);
        const isActive = ['authorized', 'active', 'approved'].includes(data.status);
        
        // Check expiration
        let expired = false;
        let remaining: number | null = null;
        if (data.expiration_date) {
          const expDate = new Date(data.expiration_date);
          expired = expDate < new Date();
          remaining = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        }

        const premium = isActive && !expired;
        return {
          isPremium: premium,
          hasEvelynAccess: premium && (level === 'pro' || level === 'vitalicio'),
          planLevel: premium ? level : 'free' as PlanLevel,
          daysRemaining: remaining,
          subscription: premium ? {
            id: data.id,
            status: data.status,
            planType: data.plan_type,
            amount: Number(data.amount),
            expirationDate: data.expiration_date,
            paymentMethod: data.payment_method,
            createdAt: data.created_at,
          } : null,
        };
      }

      return null; // No subscription found
    } catch (err) {
      console.error('[Subscription] Fallback query error:', err);
      return null;
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    // CRITICAL: Set loading INSIDE the function to prevent race condition
    startTransition(() => setLoading(true));

    if (!user?.id) {
      startTransition(() => {
        setIsPremium(false);
        setHasEvelynAccess(false);
        setPlanLevel('free');
        setSubscription(null);
        setDaysRemaining(null);
        setLoading(false);
        setCheckedUserId(null);
      });
      return;
    }

    // Admin bypass: full premium without edge function call
    if (user.email === ADMIN_EMAIL) {
      startTransition(() => {
        setIsPremium(true);
        setHasEvelynAccess(true);
        setPlanLevel('vitalicio');
        setSubscription(null);
        setDaysRemaining(null);
        setLoading(false);
        setCheckedUserId(user.id);
      });
      return;
    }

    let resolved = false;

    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-verificar-assinatura', {
        body: { userId: user.id }
      });

      if (error) {
        console.warn('[Subscription] Edge function error, trying DB fallback:', error);
      } else if (data) {
        resolved = true;
        startTransition(() => {
          setIsPremium(data.isPremium || false);
          setHasEvelynAccess(data.hasEvelynAccess || false);
          setPlanLevel(data.planLevel || 'free');
          setSubscription(data.subscription || null);
          setDaysRemaining(data.daysRemaining || null);
        });
      }
    } catch (error) {
      console.warn('[Subscription] Edge function exception, trying DB fallback:', error);
    }

    // Fallback to direct DB query if edge function failed
    if (!resolved) {
      const fallback = await fallbackDirectQuery(user.id);
      if (fallback) {
        startTransition(() => {
          setIsPremium(fallback.isPremium);
          setHasEvelynAccess(fallback.hasEvelynAccess);
          setPlanLevel(fallback.planLevel);
          setSubscription(fallback.subscription);
          setDaysRemaining(fallback.daysRemaining);
        });
      } else {
        // Both failed — keep defaults (free)
        startTransition(() => {
          setIsPremium(false);
          setHasEvelynAccess(false);
          setPlanLevel('free');
          setSubscription(null);
          setDaysRemaining(null);
        });
      }
    }

    startTransition(() => {
      setLoading(false);
      setCheckedUserId(user?.id || null);
    });
  }, [user?.id, user?.email, fallbackDirectQuery]);

  // Reset checkedUserId immediately when user changes
  useEffect(() => {
    if (user?.id) {
      setCheckedUserId(null);
    }
  }, [user?.id]);

  // Single effect for subscription check — no separate loading effect needed
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`sync-sub-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        () => checkSubscription()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, checkSubscription]);

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => checkSubscription(), 2000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(debounceTimer);
    };
  }, [user?.id, checkSubscription]);

  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider value={{ isPremium, hasEvelynAccess, planLevel, subscription, daysRemaining, loading, checkedUserId, refreshSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
