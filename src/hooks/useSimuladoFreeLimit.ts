import { useState, useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTrialStatus } from '@/hooks/useTrialStatus';

const STORAGE_KEY = 'simulado-free-usage';

interface UsageData {
  month: string;
  count: number;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getUsage(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { month: getCurrentMonth(), count: 0 };
    const parsed = JSON.parse(raw) as UsageData;
    if (parsed.month !== getCurrentMonth()) {
      return { month: getCurrentMonth(), count: 0 };
    }
    return parsed;
  } catch {
    return { month: getCurrentMonth(), count: 0 };
  }
}

export const useSimuladoFreeLimit = () => {
  const { isPremium } = useSubscription();
  const { isInTrial } = useTrialStatus();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingNavigate, setPendingNavigate] = useState<(() => void) | null>(null);

  const hasFullAccess = isPremium || isInTrial;
  const usage = getUsage();
  const usedThisMonth = usage.count > 0;
  const canStartFree = !usedThisMonth;
  const isLocked = !hasFullAccess && usedThisMonth;

  const markUsed = useCallback(() => {
    const data: UsageData = { month: getCurrentMonth(), count: 1 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const handleSimuladoClick = useCallback((navigateFn: () => void) => {
    if (hasFullAccess) {
      navigateFn();
      return;
    }
    if (usedThisMonth) {
      // blocked - caller should redirect to /assinatura
      return 'blocked' as const;
    }
    // Show confirmation
    setPendingNavigate(() => navigateFn);
    setShowConfirmation(true);
    return 'confirming' as const;
  }, [hasFullAccess, usedThisMonth]);

  const confirmAndStart = useCallback(() => {
    markUsed();
    setShowConfirmation(false);
    if (pendingNavigate) {
      pendingNavigate();
      setPendingNavigate(null);
    }
  }, [markUsed, pendingNavigate]);

  const cancelConfirmation = useCallback(() => {
    setShowConfirmation(false);
    setPendingNavigate(null);
  }, []);

  return {
    hasFullAccess,
    canStartFree,
    usedThisMonth,
    isLocked,
    markUsed,
    showConfirmation,
    setShowConfirmation,
    handleSimuladoClick,
    confirmAndStart,
    cancelConfirmation,
  };
};
