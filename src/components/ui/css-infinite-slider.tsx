import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CSSInfiniteSliderProps {
  children: ReactNode;
  gap?: number;
  duration?: number;
  className?: string;
}

/**
 * Carrossel infinito usando apenas CSS @keyframes.
 * Zero JS por frame — animação roda na GPU/compositor.
 */
export function CSSInfiniteSlider({
  children,
  gap = 32,
  duration = 25,
  className,
}: CSSInfiniteSliderProps) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <div
        className="flex w-max animate-[cssSlide_var(--slider-duration)_linear_infinite]"
        style={{
          gap: `${gap}px`,
          '--slider-duration': `${duration}s`,
        } as React.CSSProperties}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
