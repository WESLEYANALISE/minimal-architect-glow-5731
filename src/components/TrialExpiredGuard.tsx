import React, { lazy, Suspense } from 'react';
import { useTrialStatus, isTrialAllowedRoute } from '@/hooks/useTrialStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useLocation } from 'react-router-dom';

const TrialExpiredModal = lazy(() => import('@/components/TrialExpiredModal'));
const UpsellVitalicioCard = lazy(() => import('@/components/UpsellVitalicioCard'));

const TrialExpiredGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();
  const { trialExpired, loading } = useTrialStatus();
  const location = useLocation();

  const isBlocked = !loading && !!user && !isPremium && trialExpired;
  const showUpsell = !loading && !subLoading && !!user && !isPremium && !isBlocked;

  // If blocked and NOT on an allowed route, hide all content and show only the modal
  if (isBlocked && !isTrialAllowedRoute(location.pathname)) {
    return (
      <Suspense fallback={null}>
        <TrialExpiredModal />
      </Suspense>
    );
  }

  return (
    <>
      {children}
      {showUpsell && (
        <Suspense fallback={null}>
          <UpsellVitalicioCard />
        </Suspense>
      )}
    </>
  );
};

export default TrialExpiredGuard;
