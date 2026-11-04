// Tiny synthesized sound effects with WebAudio. No audio files.
// Mute is remembered per device (see storage.getDevicePrefs).

let ctx = null;
let muted = false;
let master = null;

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function ac() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Call from a click handler so browsers allow sound.
export function unlockAudio() {
  ac();
}

function tone({ freq, to, dur = 0.12, type = 'sine', vol = 0.3, delay = 0, attack = 0.005 }) {
  const a = ac();
  if (!a || muted) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  coin() {
    tone({ freq: 1320, dur: 0.08, type: 'square', vol: 0.08 });
    tone({ freq: 1760, dur: 0.16, type: 'square', vol: 0.07, delay: 0.06 });
  },
  pop() {
    tone({ freq: 500, to: 900, dur: 0.07, type: 'sine', vol: 0.25 });
  },
  boop() {
    tone({ freq: 330, to: 220, dur: 0.18, type: 'triangle', vol: 0.18 });
  },
  tap() {
    tone({ freq: 880, dur: 0.05, type: 'triangle', vol: 0.12 });
  },
  bell() {
    tone({ freq: 1568, dur: 0.6, type: 'sine', vol: 0.18 });
    tone({ freq: 2093, dur: 0.5, type: 'sine', vol: 0.1, delay: 0.02 });
  },
  whoosh() {
    tone({ freq: 200, to: 800, dur: 0.25, type: 'sawtooth', vol: 0.03 });
  },
  fanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', vol: 0.2, delay: i * 0.12 }));
    tone({ freq: 1047, dur: 0.7, type: 'triangle', vol: 0.18, delay: 0.5 });
    tone({ freq: 1319, dur: 0.7, type: 'sine', vol: 0.12, delay: 0.5 });
  },
  sad() {
    tone({ freq: 392, to: 370, dur: 0.25, type: 'triangle', vol: 0.15 });
    tone({ freq: 330, to: 294, dur: 0.4, type: 'triangle', vol: 0.15, delay: 0.25 });
  },
  cheer() {
    [784, 988, 1175].forEach((f, i) => tone({ freq: f, dur: 0.15, type: 'square', vol: 0.06, delay: i * 0.07 }));
  },
};
