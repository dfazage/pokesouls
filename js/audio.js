// Effets sonores synthétisés (aucun fichier audio). Activés au premier geste de l'utilisateur.
let ac = null;
export function unlockAudio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } if (ac && ac.state === 'suspended') ac.resume(); }
function live() { if (!ac || ac.state !== 'running') unlockAudio(); return !!ac; }   // relance le contexte s'il dort (manette seule : aucun clic ni touche)
function tone(f0, f1, dur, type = 'square', vol = 0.06, delay = 0) {
  if (!live()) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.08, lp = 2000, delay = 0) {
  if (!live()) return; const n = ac.sampleRate * dur, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
  s.buffer = b; g.gain.value = vol; s.connect(f).connect(g).connect(ac.destination); s.start(ac.currentTime + delay);
}
// souffle de flamme : bruit dont le filtre s'ouvre puis se referme
function whoosh(dur, vol, lp0, lp1, delay = 0) {
  if (!live()) return; const t = ac.currentTime + delay, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; s.buffer = b;
  f.frequency.setValueAtTime(lp0, t); f.frequency.exponentialRampToValueAtTime(lp1, t + dur * 0.45); f.frequency.exponentialRampToValueAtTime(lp0, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(ac.destination); s.start(t);
}
// cris de boss : fichiers réels dans assets/audio/cries/<id>.ogg (dépôt PokeAPI/cries)
const CRY_URL = id => ['assets/audio/cries/' + id + '.ogg'];
const cryCache = {};
function playCry(id) {
  const urls = CRY_URL(id); let i = 0;
  const go = () => {
    if (i >= urls.length) return;
    const a = cryCache[id + i] || (cryCache[id + i] = new Audio(urls[i])); a.volume = 0.33;
    a.onerror = () => { i++; go(); };
    try { a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => { if (!a.paused) return; i++; go(); }); } catch (e) { i++; go(); }
  };
  go();
}
export const SFX = {
  cry(id) { playCry(id); },
  swing() { noise(0.12, 0.05, 3000); },
  hit() { noise(0.1, 0.12, 1500); tone(180, 60, 0.12, 'square', 0.06); },
  crit() { noise(0.14, 0.14, 2500); tone(420, 120, 0.2, 'sawtooth', 0.07); },
  hurt() { tone(160, 50, 0.25, 'sawtooth', 0.09); noise(0.15, 0.1, 900); },
  dodge() { noise(0.16, 0.05, 5000); },
  parry() { tone(900, 1400, 0.1, 'triangle', 0.09); tone(1400, 900, 0.14, 'triangle', 0.06, 0.05); },
  block() { tone(220, 120, 0.1, 'square', 0.06); },
  telegraph() { tone(520, 700, 0.12, 'square', 0.04); },
  shoot() { tone(600, 200, 0.18, 'sawtooth', 0.04); },
  // allumage du feu : souffle de flamme puis quelques crépitements, aucune note
  bonfire() { whoosh(1.0, 0.12, 250, 2200); [0.12, 0.26, 0.33, 0.5, 0.62, 0.8].forEach(d => noise(0.03 + Math.random() * 0.03, 0.05 + Math.random() * 0.04, 3000 + Math.random() * 2500, d + Math.random() * 0.05)); },
  death() { tone(220, 40, 1.2, 'sawtooth', 0.1); noise(1, 0.08, 400); },
  victory() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.8, 'triangle', 0.07, i * 0.15)); },
  heal() { tone(500, 900, 0.3, 'sine', 0.07); },
  blip(pitch = 1) { tone((700 + Math.random() * 120) * pitch, (640 + Math.random() * 100) * pitch, 0.035, 'square', 0.035); },
  pick() { tone(700, 1000, 0.12, 'triangle', 0.06); },
  boom() { noise(0.4, 0.2, 700); tone(100, 30, 0.4, 'sawtooth', 0.1); },
  door() { noise(0.4, 0.07, 500); },
};
