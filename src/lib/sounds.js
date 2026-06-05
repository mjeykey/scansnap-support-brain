// Simple Web Audio API sounds
const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playTone(frequency, duration, type = 'triangle', volume = 0.15) {
  if (!audioCtx) return;
  try {
    audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {}
}

export function playAction() {
  playTone(523, 0.3, 'triangle');
}

export function playSuccess() {
  playTone(392, 0.5, 'sine', 0.12);
  setTimeout(() => playTone(523, 0.6, 'sine', 0.12), 200);
}

export function playHum() {
  playTone(220, 1.5, 'sine', 0.06);
}