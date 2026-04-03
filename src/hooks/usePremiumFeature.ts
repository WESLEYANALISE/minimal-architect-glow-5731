import { useState, useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

interface UsePremiumFeatureOptions {
  featureName?: string;
}

export const usePremiumFeature = (options: UsePremiumFeatureOptions = {}) => {
  const { isPremium, loading } = useSubscription();
  const navigate = useNavigate();
  const [shouldShowModal, setShouldShowModal] = useState(false);
  
  const { featureName = 'recurso' } = options;

  const checkPremiumAccess = useCallback((action?: () => void): boolean => {
    if (loading) return false;
    
    if (!isPremium) {
      setShouldShowModal(true);
      return false;
    }
    
    if (action) {
      action();
    }
    return true;
  }, [isPremium, loading]);

  const requirePremium = <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: Parameters<T>) => {
      if (!isPremium) {
        setShouldShowModal(true);
        return;
      }
      return fn(...args);
    }) as T;
  };

  const closePremiumModal = useCallback(() => {
    setShouldShowModal(false);
  }, []);

  return {
    isPremium,
    loading,
    checkPremiumAccess,
    requirePremium,
    shouldShowModal,
    closePremiumModal,
    featureName,
    navigateToSubscription: () => navigate('/assinatura')
  };
};
