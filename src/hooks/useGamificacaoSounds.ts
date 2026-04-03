/**
 * Hook de sons para gamificação usando Web Audio API
 * Sem dependências externas ou arquivos de áudio
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
};

const playTone = (freq: number, type: OscillatorType, duration: number, volume = 0.15, startTime = 0) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration + 0.05);
};

/** Som de clique ao selecionar letra */
export const playClickSound = () => {
  playTone(800, 'sine', 0.06, 0.08);
};

/** Letra correta - ding agudo */
export const playCorrectLetterSound = () => {
  playTone(880, 'sine', 0.15, 0.12);
  playTone(1100, 'sine', 0.12, 0.08, 0.08);
};

/** Letra errada - buzz grave */
export const playWrongLetterSound = () => {
  playTone(200, 'square', 0.15, 0.08);
};

/** Palavra acertada - fanfarra curta ascendente */
export const playWordCompleteSound = () => {
  playTone(523, 'sine', 0.12, 0.12, 0);      // Dó
  playTone(659, 'sine', 0.12, 0.12, 0.1);     // Mi
  playTone(784, 'sine', 0.12, 0.12, 0.2);     // Sol
  playTone(1047, 'sine', 0.25, 0.15, 0.3);    // Dó alto
};

/** Palavra errada - sequência descendente triste */
export const playWordFailSound = () => {
  playTone(440, 'sine', 0.15, 0.1, 0);
  playTone(370, 'sine', 0.15, 0.1, 0.12);
  playTone(330, 'sine', 0.25, 0.08, 0.24);
};

/** Nível completo - fanfarra longa com acordes */
export const playLevelCompleteSound = () => {
  // Acorde 1
  playTone(523, 'sine', 0.2, 0.1, 0);
  playTone(659, 'sine', 0.2, 0.08, 0);
  playTone(784, 'sine', 0.2, 0.08, 0);
  // Acorde 2
  playTone(587, 'sine', 0.2, 0.1, 0.22);
  playTone(740, 'sine', 0.2, 0.08, 0.22);
  playTone(880, 'sine', 0.2, 0.08, 0.22);
  // Acorde final
  playTone(659, 'sine', 0.35, 0.12, 0.44);
  playTone(784, 'sine', 0.35, 0.1, 0.44);
  playTone(1047, 'sine', 0.35, 0.1, 0.44);
};

/** Nível falhou */
export const playLevelFailSound = () => {
  playTone(392, 'sine', 0.2, 0.1, 0);
  playTone(349, 'sine', 0.2, 0.1, 0.18);
  playTone(330, 'sine', 0.2, 0.1, 0.36);
  playTone(262, 'sine', 0.4, 0.08, 0.54);
};

export const useGamificacaoSounds = () => ({
  playClickSound,
  playCorrectLetterSound,
  playWrongLetterSound,
  playWordCompleteSound,
  playWordFailSound,
  playLevelCompleteSound,
  playLevelFailSound,
});
