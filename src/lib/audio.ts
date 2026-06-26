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

// ── Background Music ──────────────────────────────────────────────────────────
// Cinematic march in D minor: kick + snare + bass line + melody phrases
// Uses Web Audio API lookahead scheduler for tight, drift-free timing.

const BPM = 100;
const BEAT = 60 / BPM;          // 0.6 s per quarter note
const BARS = 4;                  // loop length
const TOTAL_BEATS = BARS * 4;   // 16 beats per loop
const LOOKAHEAD = 0.15;         // schedule this many seconds ahead
const TICK_MS = 50;             // scheduler poll interval

// D natural minor note frequencies (Hz)
const N: Record<string, number> = {
  C3: 130.81, D3: 146.83, F3: 174.61, G3: 196.00,
  A3: 220.00, Bb3: 233.08,
  D4: 293.66, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16,
};

// Bass: one quarter note per beat (loops every 16 beats)
const BASS_SEQ: (keyof typeof N)[] = [
  "D3","F3","G3","A3",
  "G3","F3","D3","C3",
  "D3","F3","A3","G3",
  "A3","G3","F3","D3",
];

// Melody: [note, duration_in_beats] — sums to exactly 16 beats
const MELODY_SEQ: [keyof typeof N, number][] = [
  ["D4", 2], ["F4", 1], ["G4", 1],   // phrase 1 (4 beats)
  ["A4", 2], ["G4", 1], ["F4", 1],   // phrase 2 (4 beats)
  ["D4", 1], ["F4", 1], ["A4", 1], ["Bb4", 1], // phrase 3 (4 beats)
  ["A4", 2], ["G4", 2],              // phrase 4 — resolves back to top
];

// Scheduler state
let bgRunning = false;
let _bgTimer: ReturnType<typeof setTimeout> | null = null;
let _bgGain: GainNode | null = null;
let _bgDrones: OscillatorNode[] = [];
let _nextBeatTime = 0;
let _beatIdx = 0;
let _melodyNext = 0;  // beat index when the next melody note fires
let _melodyIdx = 0;

function _kick(t: number, g: GainNode) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.28);
    env.gain.setValueAtTime(0.85, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.connect(env); env.connect(g);
    osc.start(t); osc.stop(t + 0.34);
  } catch { /* ignore */ }
}

function _snare(t: number, g: GainNode) {
  try {
    const ac = getCtx();
    // Noise burst
    const bufLen = Math.ceil(ac.sampleRate * 0.18);
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) ch[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const hp = ac.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 1000;
    const nEnv = ac.createGain();
    nEnv.gain.setValueAtTime(0.28, t);
    nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    src.connect(hp); hp.connect(nEnv); nEnv.connect(g);
    src.start(t); src.stop(t + 0.2);
    // Body thud
    const body = ac.createOscillator();
    const bEnv = ac.createGain();
    body.frequency.value = 185;
    bEnv.gain.setValueAtTime(0.18, t);
    bEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    body.connect(bEnv); bEnv.connect(g);
    body.start(t); body.stop(t + 0.12);
  } catch { /* ignore */ }
}

function _bassNote(t: number, freq: number, g: GainNode) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const lp = ac.createBiquadFilter();
    const env = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    lp.type = "lowpass"; lp.frequency.value = 600;
    const dur = BEAT * 0.85;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.28, t + 0.02);
    env.gain.setValueAtTime(0.28, t + dur - 0.08);
    env.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(lp); lp.connect(env); env.connect(g);
    osc.start(t); osc.stop(t + dur + 0.02);
  } catch { /* ignore */ }
}

function _melodyNote(t: number, freq: number, beats: number, g: GainNode) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    const dur = beats * BEAT;
    osc.type = "sine";
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.10, t + 0.12);
    env.gain.setValueAtTime(0.10, t + dur - 0.25);
    env.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(env); env.connect(g);
    osc.start(t); osc.stop(t + dur + 0.05);
    // Slight detune copy for warmth
    const osc2 = ac.createOscillator();
    const env2 = ac.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * 1.003;
    env2.gain.setValueAtTime(0, t);
    env2.gain.linearRampToValueAtTime(0.04, t + 0.14);
    env2.gain.setValueAtTime(0.04, t + dur - 0.25);
    env2.gain.linearRampToValueAtTime(0, t + dur);
    osc2.connect(env2); env2.connect(g);
    osc2.start(t); osc2.stop(t + dur + 0.05);
  } catch { /* ignore */ }
}

function _schedule() {
  if (!bgRunning || !_bgGain) return;
  const ac = getCtx();
  const g = _bgGain;

  while (_nextBeatTime < ac.currentTime + LOOKAHEAD) {
    const beat = _beatIdx % TOTAL_BEATS;
    const beatInBar = beat % 4;
    const t = _nextBeatTime;

    // Drums: kick on 1+3, snare on 2+4
    if (beatInBar === 0 || beatInBar === 2) _kick(t, g);
    if (beatInBar === 1 || beatInBar === 3) _snare(t, g);

    // Bass line
    _bassNote(t, N[BASS_SEQ[beat]], g);

    // Melody (variable duration — fires only when its beat arrives)
    if (beat === _melodyNext) {
      const [note, dur] = MELODY_SEQ[_melodyIdx];
      _melodyNote(t, N[note], dur, g);
      _melodyNext += dur;
      _melodyIdx++;
      if (_melodyIdx >= MELODY_SEQ.length) {
        _melodyIdx = 0;
        _melodyNext = 0; // will wrap with _beatIdx naturally
      }
    }

    _nextBeatTime += BEAT;
    _beatIdx++;
    // Keep _melodyNext relative to current loop position
    if (_beatIdx % TOTAL_BEATS === 0) {
      _melodyNext = 0;
      _melodyIdx = 0;
    }
  }

  _bgTimer = setTimeout(_schedule, TICK_MS);
}

export function startBgMusic() {
  if (bgRunning || isMuted()) return;
  bgRunning = true;
  try {
    const ac = getCtx();
    if (ac.state === "suspended") ac.resume();

    _bgGain = ac.createGain();
    _bgGain.gain.setValueAtTime(0, ac.currentTime);
    _bgGain.gain.linearRampToValueAtTime(0.6, ac.currentTime + 2.5);
    _bgGain.connect(ac.destination);

    // Subtle low drone underneath the beat
    const droneGain = ac.createGain();
    const droneLp = ac.createBiquadFilter();
    droneGain.gain.value = 0.10;
    droneLp.type = "lowpass"; droneLp.frequency.value = 180;
    droneGain.connect(droneLp); droneLp.connect(_bgGain);
    [73.42, 73.85].forEach((f) => {
      const osc = ac.createOscillator();
      osc.type = "sawtooth"; osc.frequency.value = f;
      osc.connect(droneGain); osc.start();
      _bgDrones.push(osc);
    });

    // Reset scheduler
    _nextBeatTime = ac.currentTime + 0.08;
    _beatIdx = 0; _melodyNext = 0; _melodyIdx = 0;
    _schedule();
  } catch { /* ignore */ }
}

export function stopBgMusic() {
  bgRunning = false;
  if (_bgTimer) { clearTimeout(_bgTimer); _bgTimer = null; }
  if (_bgGain) {
    try {
      const ac = getCtx();
      _bgGain.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
    } catch { /* ignore */ }
    setTimeout(() => {
      _bgDrones.forEach((o) => { try { o.stop(); } catch { /* ignore */ } });
      _bgDrones = [];
      _bgGain = null;
    }, 1600);
  }
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
