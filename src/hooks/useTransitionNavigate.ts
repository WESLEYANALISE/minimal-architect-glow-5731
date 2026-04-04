import { useCallback, startTransition } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';

/**
 * Wrapper around useNavigate that wraps navigation in startTransition
 * to prevent React error #426 (component suspended during synchronous input).
 */
export function useTransitionNavigate(): NavigateFunction {
  const navigate = useNavigate();

  return useCallback((...args: any[]) => {
    // Reset scroll before rendering new page
    window.scrollTo(0, 0);
    startTransition(() => {
      (navigate as any)(...args);
    });
  }, [navigate]) as unknown as NavigateFunction;
}
