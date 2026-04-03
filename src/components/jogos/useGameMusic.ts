import { useRef, useCallback, useEffect } from "react";

/**
 * Generates a retro game music loop using Web Audio API
 */
export const useGameMusic = () => {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const playingRef = useRef(false);

  const stop = useCallback(() => {
    playingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.gain.setValueAtTime(0, ctxRef.current?.currentTime ?? 0);
    }
  }, []);

  const start = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;

    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.gain.value = 0.08;
      gainRef.current.connect(ctxRef.current.destination);
    }

    const ctx = ctxRef.current;
    const gain = gainRef.current!;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);

    // Retro melody notes (frequencies)
    const melody = [
      262, 330, 392, 523, 392, 330, 262, 294,
      349, 440, 523, 440, 349, 294, 262, 330,
      392, 523, 659, 523, 392, 330, 294, 349,
      440, 523, 440, 349, 330, 294, 262, 330,
    ];
    let noteIndex = 0;

    const playNote = () => {
      if (!playingRef.current || !ctx) return;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = melody[noteIndex % melody.length];
      noteGain.gain.setValueAtTime(0.12, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(noteGain);
      noteGain.connect(gain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
      noteIndex++;
    };

    playNote();
    intervalRef.current = window.setInterval(playNote, 220);
  }, []);

  useEffect(() => {
    return () => {
      stop();
      if (ctxRef.current) {
        ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, [stop]);

  return { start, stop };
};
