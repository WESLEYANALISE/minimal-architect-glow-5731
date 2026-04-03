import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  decimalPlaces?: number;
  locale?: string;
}

export const NumberTicker = ({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  locale = "pt-BR",
}: NumberTickerProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });
  const [displayValue, setDisplayValue] = useState(direction === "down" ? value : 0);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [motionValue, isInView, delay, value, direction]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(
        decimalPlaces > 0
          ? parseFloat(latest.toFixed(decimalPlaces))
          : Math.round(latest)
      );
    });
    return unsubscribe;
  }, [springValue, decimalPlaces]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {displayValue.toLocaleString(locale)}
    </span>
  );
};
