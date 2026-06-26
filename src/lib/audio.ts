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

// ── Background Music ─────────────────────────────────────────────────────────
// Synthesized cinematic ambient: D-minor drone + slow melody + bass pulses

let _bgRunning = false;
let _bgIntervals: ReturnType<typeof setInterval>[] = [];
let _bgDrones: OscillatorNode[] = [];
let _bgGain: GainNode | null = null;
let _bgNoteIdx = 0;

// D natural minor slow melody (Hz): D3 F3 G3 A3 G3 F3 D3 C3 D3 F3 A3 Bb3 A3 G3 F3 D3
const BG_MELODY = [
  146.83, 174.61, 196.00, 220.00,
  196.00, 174.61, 146.83, 130.81,
  146.83, 174.61, 220.00, 233.08,
  220.00, 196.00, 174.61, 146.83,
];

function _bgNote(freq: number, duration: number, vol: number, type: OscillatorType = "sine") {
  if (!_bgRunning || !_bgGain) return;
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ac.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.35);
    g.gain.setValueAtTime(vol, t + Math.max(duration - 0.5, 0.1));
    g.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(g);
    g.connect(_bgGain);
    osc.start(t);
    osc.stop(t + duration + 0.1);
  } catch { /* ignore audio errors */ }
}

export function startBgMusic() {
  if (_bgRunning || isMuted()) return;
  _bgRunning = true;
  try {
    const ac = getCtx();
    if (ac.state === "suspended") ac.resume();

    // Master gain — fades in slowly
    _bgGain = ac.createGain();
    _bgGain.gain.setValueAtTime(0, ac.currentTime);
    _bgGain.gain.linearRampToValueAtTime(0.20, ac.currentTime + 6);
    _bgGain.connect(ac.destination);

    // Drone: D2 + D2 (slightly detuned) + A2 through heavy lowpass → deep rumble
    const droneFilter = ac.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.value = 380;
    droneFilter.Q.value = 1.8;
    droneFilter.connect(_bgGain);

    [
      { f: 73.42, t: "sawtooth" as OscillatorType, v: 0.30 },
      { f: 73.85, t: "sawtooth" as OscillatorType, v: 0.28 }, // detuned for chorus
      { f: 110.0, t: "sine"     as OscillatorType, v: 0.14 }, // A2 fifth
      { f: 146.83,t: "sine"     as OscillatorType, v: 0.10 }, // D3 octave
    ].forEach(({ f, t, v }) => {
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.type = t;
      osc.frequency.value = f;
      g.gain.value = v;
      osc.connect(g);
      g.connect(droneFilter);
      osc.start();
      _bgDrones.push(osc);
    });

    // Melody — slow note every 2.4 s
    const playMelody = () => {
      const freq = BG_MELODY[_bgNoteIdx % BG_MELODY.length];
      _bgNoteIdx++;
      _bgNote(freq, 2.1, 0.052);
    };
    playMelody();
    _bgIntervals.push(setInterval(playMelody, 2400));

    // Bass war-drum pulse every 3.8 s
    const playDrum = () => _bgNote(73.42, 1.6, 0.24, "triangle");
    setTimeout(playDrum, 600);
    _bgIntervals.push(setInterval(playDrum, 3800));

    // Occasional low accent (every ~7.6 s, offset)
    setTimeout(() => {
      const playAccent = () => _bgNote(87.31, 2.5, 0.14, "triangle"); // F2
      playAccent();
      _bgIntervals.push(setInterval(playAccent, 7600));
    }, 3800);

  } catch { /* ignore */ }
}

export function stopBgMusic() {
  _bgRunning = false;
  _bgIntervals.forEach(clearInterval);
  _bgIntervals = [];
  if (_bgGain) {
    try {
      const ac = getCtx();
      _bgGain.gain.linearRampToValueAtTime(0, ac.currentTime + 2);
    } catch { /* ignore */ }
    setTimeout(() => {
      _bgDrones.forEach((o) => { try { o.stop(); } catch { /* ignore */ } });
      _bgDrones = [];
      _bgGain = null;
    }, 2200);
  }
  _bgNoteIdx = 0;
}

/** Hook: muted state + toggle, persisted in localStorage */
export function useAudio() {
  const [muted, setMutedState] = useState(() => isMuted());
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (next) stopBgMusic();
    else startBgMusic();
  };
  return { muted, toggle };
}
