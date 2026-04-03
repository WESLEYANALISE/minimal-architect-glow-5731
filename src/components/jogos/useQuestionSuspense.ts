import { useRef, useCallback, useEffect } from "react";

/**
 * Generates suspense/tension music for question cards using Web Audio API
 */
export const useQuestionSuspense = () => {
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
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setValueAtTime(0, ctxRef.current.currentTime);
    }
  }, []);

  const start = useCallback((urgency: number = 1) => {
    if (playingRef.current) return;
    playingRef.current = true;

    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
      gainRef.current = ctxRef.current.createGain();
      gainRef.current.gain.value = 0.06;
      gainRef.current.connect(ctxRef.current.destination);
    }

    const ctx = ctxRef.current;
    const gain = gainRef.current!;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);

    // Dark, tense melody in A minor / E minor
    const suspenseNotes = [
      220, 208, 196, 185, // A3 descending
      165, 175, 185, 196, // E3 ascending
      220, 233, 220, 196, // tension
      185, 175, 165, 156, // resolution down
    ];
    let noteIndex = 0;

    const playNote = () => {
      if (!playingRef.current || !ctx) return;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      // Main tone - dark sine
      osc.type = 'sine';
      osc.frequency.value = suspenseNotes[noteIndex % suspenseNotes.length];
      
      // Sub-harmonic for depth
      osc2.type = 'triangle';
      osc2.frequency.value = suspenseNotes[noteIndex % suspenseNotes.length] * 0.5;
      
      noteGain.gain.setValueAtTime(0.08, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      
      osc.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(gain);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.7);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.7);
      
      noteIndex++;
    };

    playNote();
    // Speed based on urgency (slower = more suspense, faster = more panic)
    const interval = Math.max(300, 700 - urgency * 100);
    intervalRef.current = window.setInterval(playNote, interval);
  }, []);

  const updateUrgency = useCallback((urgency: number) => {
    if (!playingRef.current) return;
    // Restart with new interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    const suspenseNotes = [220, 208, 196, 185, 165, 175, 185, 196, 220, 233, 220, 196, 185, 175, 165, 156];
    let noteIndex = 0;

    const playNote = () => {
      if (!playingRef.current || !ctx) return;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = suspenseNotes[noteIndex % suspenseNotes.length];
      noteGain.gain.setValueAtTime(0.06 + urgency * 0.01, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(noteGain);
      noteGain.connect(gainRef.current!);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      noteIndex++;
    };

    const interval = Math.max(250, 700 - urgency * 80);
    intervalRef.current = window.setInterval(playNote, interval);
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

  return { start, stop, updateUrgency };
};
