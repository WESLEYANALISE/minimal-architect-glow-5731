import { useState, useEffect, useCallback } from "react";

interface CountdownStartProps {
  onComplete: () => void;
}

// Play flip sound using Web Audio API
const playFlipTick = () => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.setValueAtTime(900, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 200);
  } catch {}
};

const CountdownStart = ({ onComplete }: CountdownStartProps) => {
  const [count, setCount] = useState(3);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    playFlipTick();
  }, []);

  useEffect(() => {
    if (count === 0) {
      const t = setTimeout(onComplete, 400);
      return () => clearTimeout(t);
    }

    const timer = setTimeout(() => {
      setCount((prev) => prev - 1);
      setAnimKey((prev) => prev + 1);
      if (count > 1) playFlipTick();
    }, 800);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "hsl(0 0% 13%)" }}>
      <div
        key={animKey}
        className="flex flex-col items-center justify-center"
      >
        {count > 0 ? (
          <span
            className="text-[120px] font-black leading-none animate-countdown-stomp select-none"
            style={{ color: "hsl(0 75% 60%)", textShadow: "0 8px 32px hsla(0, 75%, 60%, 0.3)" }}
          >
            {count}
          </span>
        ) : (
          <span
            className="text-5xl font-black leading-none animate-countdown-stomp select-none"
            style={{ color: "hsl(0 75% 60%)", textShadow: "0 8px 32px hsla(0, 75%, 60%, 0.3)" }}
          >
            PRATICAR!
          </span>
        )}
      </div>
    </div>
  );
};

export default CountdownStart;
