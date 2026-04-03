import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UseRequireAuthResult {
  requireAuth: (callback: () => void) => void;
  isAuthenticated: boolean;
  // Kept for backwards compatibility (no-ops)
  isAuthDialogOpen: boolean;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
}

export function useRequireAuth(): UseRequireAuthResult {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const openAuthDialog = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const closeAuthDialog = useCallback(() => {
    // no-op kept for compatibility
  }, []);

  const requireAuth = useCallback((callback: () => void) => {
    if (user) {
      callback();
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  return {
    isAuthDialogOpen: false,
    openAuthDialog,
    closeAuthDialog,
    requireAuth,
    isAuthenticated,
  };
}
