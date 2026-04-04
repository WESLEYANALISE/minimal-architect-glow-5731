import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownOverlayProps {
  onComplete: () => void;
  label?: string;
}

export const CountdownOverlay = ({ onComplete, label = "Preparando..." }: CountdownOverlayProps) => {
  const [count, setCount] = useState(3);

  const playBeep = useCallback((n: number) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = n === 0 ? 880 : 440;
      gain.gain.value = 0.15;
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (n === 0 ? 0.25 : 0.15));
      setTimeout(() => ctx.close(), 300);
    } catch {}
  }, []);

  useEffect(() => {
    playBeep(count);
    if (count === 0) {
      const t = setTimeout(onComplete, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [count, onComplete, playBeep]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "hsla(0, 0%, 5%, 0.97)" }}
    >
      <div className="flex flex-col items-center gap-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{
              border: "4px solid hsl(40, 80%, 55%)",
              boxShadow: "0 0 40px hsla(40, 80%, 55%, 0.3), inset 0 0 20px hsla(40, 80%, 55%, 0.1)",
            }}
          >
            <span
              className="font-black"
              style={{
                fontSize: count === 0 ? "1.5rem" : "4rem",
                color: "hsl(40, 80%, 55%)",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              {count === 0 ? "GO!" : count}
            </span>
          </motion.div>
        </AnimatePresence>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm"
          style={{ color: "hsla(40, 50%, 70%, 0.7)" }}
        >
          {label}
        </motion.p>
      </div>
    </motion.div>
  );
};
