import { useState } from "react";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
  }
  return audioCtx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gainVal = 0.22,
  delayS = 0,
) {
  if (isMuted()) return;
  try {
    const ac = getCtx();
    // Resume context on user gesture (required by some browsers)
    if (ac.state === "suspended") ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delayS);
    gain.gain.setValueAtTime(gainVal, ac.currentTime + delayS);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ac.currentTime + delayS + duration,
    );
    osc.start(ac.currentTime + delayS);
    osc.stop(ac.currentTime + delayS + duration + 0.05);
  } catch {
    // Silently ignore audio errors (autoplay policy, etc.)
  }
}

export function isMuted(): boolean {
  return localStorage.getItem("audio-muted") === "1";
}

export function setMuted(m: boolean): void {
  localStorage.setItem("audio-muted", m ? "1" : "0");
}

/** Whoosh when a card is revealed */
export function playCardReveal() {
  tone(480, 0.07, "triangle", 0.18);
  tone(660, 0.09, "triangle", 0.15, 0.06);
}

/** Ascending tones on round win */
export function playWinRound() {
  tone(523, 0.07, "sine", 0.26);
  tone(659, 0.07, "sine", 0.26, 0.1);
  tone(784, 0.16, "sine", 0.28, 0.2);
}

/** Soft descending on round loss */
export function playLoseRound() {
  tone(380, 0.1, "sine", 0.16);
  tone(300, 0.16, "sine", 0.12, 0.12);
}

/** Short click for attribute selection */
export function playButtonClick() {
  tone(900, 0.04, "square", 0.1);
}

/** Victory fanfare */
export function playGameWin() {
  [523, 659, 784, 1047].forEach((f, i) =>
    tone(f, 0.2, "sine", 0.28, i * 0.13),
  );
}

/** Somber ending */
export function playGameLose() {
  [440, 370, 320, 260].forEach((f, i) =>
    tone(f, 0.2, "sine", 0.16, i * 0.14),
  );
}

/** Hook: muted state + toggle, persisted in localStorage */
export function useAudio() {
  const [muted, setMutedState] = useState(() => isMuted());
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };
  return { muted, toggle };
}
