// Effets sonores synthétisés (aucun fichier audio). Activés au premier geste de l'utilisateur.
let ac = null;
export function unlockAudio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } if (ac && ac.state === 'suspended') ac.resume(); }
// bus maître : compresseur/limiteur + réverbération (réponse impulsionnelle générée) pour donner du volume aux sons de boss
let bus = null, wet = null;
function buses() {
  if (bus) return bus;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 6; comp.attack.value = 0.002; comp.release.value = 0.18;
  comp.connect(ac.destination); bus = ac.createGain(); bus.gain.value = 1; bus.connect(comp);
  const len = Math.floor(ac.sampleRate * 2.2), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) { const k = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 2.6) * (k < 0.01 ? k * 100 : 1); } }
  const cv = ac.createConvolver(); cv.buffer = ir; wet = ac.createGain(); wet.gain.value = 0.5; wet.connect(cv); cv.connect(comp);
  return bus;
}
// sortie d'une couche : direct + envoi réverbération (rv 0..1) + panoramique (pan -1..1)
function out(node, rv = 0, pan = 0) {
  const b = buses(); let n = node;
  if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
  n.connect(b); if (rv > 0) { const s = ac.createGain(); s.gain.value = rv; n.connect(s); s.connect(wet); }
}
function live() { if (!ac || ac.state !== 'running') unlockAudio(); return !!ac; }   // relance le contexte s'il dort (manette seule : aucun clic ni touche)
function tone(f0, f1, dur, type = 'square', vol = 0.06, delay = 0) {
  if (!live()) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); out(g); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.08, lp = 2000, delay = 0) {
  if (!live()) return; const n = ac.sampleRate * dur, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
  s.buffer = b; g.gain.value = vol; s.connect(f).connect(g); out(g); s.start(ac.currentTime + delay);
}
// souffle de flamme : bruit dont le filtre s'ouvre puis se referme
function whoosh(dur, vol, lp0, lp1, delay = 0) {
  if (!live()) return; const t = ac.currentTime + delay, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; s.buffer = b;
  f.frequency.setValueAtTime(lp0, t); f.frequency.exponentialRampToValueAtTime(lp1, t + dur * 0.45); f.frequency.exponentialRampToValueAtTime(lp0, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g); out(g); s.start(t);
}

// bande de bruit filtrée, enveloppe courte (coup, frottement, métal)
function band(f, q, dur, vol, delay = 0, type = 'bandpass') {
  if (!live()) return; const t = ac.currentTime + delay, n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.buffer = b;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl).connect(g); out(g, 0.08); s.start(t);
}
// ───── couches des attaques de boss ─────
const NB = {};   // tampons de bruit réutilisés
function nbuf(sec) { const k = sec; if (!NB[k]) { const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; NB[k] = b; } return NB[k]; }
// enveloppe attaque/déclin
function env(g, t, a, dur, vol) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
// grondement : plusieurs dents de scie désaccordées, filtrées, glissando
function growl(f0, f1, dur, vol, o = {}) {
  if (!live()) return; const t = ac.currentTime + (o.delay || 0), g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = o.q || 4;
  f.frequency.setValueAtTime(o.lp0 || 900, t); f.frequency.exponentialRampToValueAtTime(o.lp1 || 120, t + dur);
  env(g, t, o.a || 0.02, dur, vol); f.connect(g);
  for (const dt of [-14, -5, 0, 6, 15]) { const os = ac.createOscillator(); os.type = o.type || 'sawtooth'; os.detune.value = dt; os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(Math.max(18, f1), t + dur); os.connect(f); os.start(t); os.stop(t + dur + 0.05); }
  out(g, o.rv == null ? 0.35 : o.rv, o.pan || 0);
}
// sub-basse : sinus qui plonge, ressenti physique
function sub(f0, f1, dur, vol, delay = 0) {
  if (!live()) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(18, f1), t + dur * 0.8);
  g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); out(g, 0.1); o.start(t); o.stop(t + dur + 0.05);
}
// balayage de bruit filtré (passe-bande), montant ou descendant
function sweep(f0, f1, dur, vol, o = {}) {
  if (!live()) return; const t = ac.currentTime + (o.delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = nbuf(2); s.loop = true; f.type = o.type || 'bandpass'; f.Q.value = o.q || 1.2;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, t, o.a || dur * 0.4, dur, vol);
  s.connect(f).connect(g); out(g, o.rv == null ? 0.3 : o.rv, o.pan || 0); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
// claquement d'impact : transitoire de bruit court, très brillant puis grave
function crack(vol, delay = 0, lp = 6000) {
  if (!live()) return; const t = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = nbuf(1); f.type = 'lowpass'; f.frequency.setValueAtTime(lp, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.25); env(g, t, 0.002, 0.3, vol);
  s.connect(f).connect(g); out(g, 0.4); s.start(t, Math.random()); s.stop(t + 0.35);
}
// crépitement électrique : micro-claquements aléatoires à haute fréquence
function zap(dur, vol, delay = 0, dens = 40) {
  if (!live()) return; const n = Math.floor(dur * dens);
  for (let i = 0; i < n; i++) {
    const d = delay + Math.random() * dur, t = ac.currentTime + d, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), L = 0.01 + Math.random() * 0.025;
    s.buffer = nbuf(1); f.type = 'highpass'; f.frequency.value = 2500 + Math.random() * 4500; env(g, t, 0.001, L, vol * (0.3 + Math.random() * 0.7));
    s.connect(f).connect(g); out(g, 0.25, Math.random() * 1.6 - 0.8); s.start(t, Math.random()); s.stop(t + L + 0.02);
  }
}
// saveur du boss selon son sprite
const FL = { raikou: 'elec', entei: 'fire', suicune: 'water', lugia: 'air', celebi: 'mystic' };
const flv = id => FL[id] || 'dark';
function flavor(id, vol = 1, delay = 0) {
  const k = flv(id);
  if (k === 'elec') zap(0.5, 0.09 * vol, delay, 55);
  else if (k === 'fire') sweep(300, 1800, 0.5, 0.12 * vol, { delay, a: 0.05, type: 'lowpass', q: 0.6 });
  else if (k === 'water') sweep(2200, 500, 0.6, 0.09 * vol, { delay, a: 0.05 });
  else if (k === 'air') sweep(500, 3500, 0.5, 0.1 * vol, { delay, a: 0.15 });
  else if (k === 'mystic') { tone(880, 1320, 0.5, 'sine', 0.04 * vol, delay); tone(1320, 1980, 0.5, 'sine', 0.03 * vol, delay + 0.05); }
  else growl(90, 45, 0.5, 0.06 * vol, { delay });
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
// effets en fichier : assets/audio/sfx/<nom>.ogg (ou .mp3 / .wav) ; absent = on retombe sur la version synthétisée, sans erreur
const sfxFiles = {};
function playSfxFile(name, vol = 0.55) {
  let f = sfxFiles[name];
  if (f === undefined) {
    f = sfxFiles[name] = null; const exts = ['ogg', 'mp3', 'wav']; let i = 0;
    const tryNext = () => { if (i >= exts.length) return; const a = new Audio('assets/audio/sfx/' + name + '.' + exts[i++]); a.preload = 'auto'; a.oncanplaythrough = () => { sfxFiles[name] = a; }; a.onerror = tryNext; a.load(); };
    tryNext();
  }
  if (!f) return false;
  try { const c = f.cloneNode(); c.volume = vol; const p = c.play(); if (p && p.catch) p.catch(() => {}); return true; } catch (e) { return false; }
}
export const SFX = {
  cry(id) { playCry(id); },
  swing() { band(1800, 0.7, 0.16, 0.07); band(900, 0.6, 0.12, 0.04, 0.03); },
  hit() { band(1400, 0.8, 0.09, 0.14); tone(110, 50, 0.14, 'sine', 0.1); band(300, 0.6, 0.12, 0.08); },
  // coup super efficace : impact plus lourd que le coup normal (claquement sec, boum grave, craquement, résonance métallique) ; au plus un toutes les 90 ms quand une zone touche plusieurs cibles
  superHit() {
    const now = performance.now(); if (now - (SFX._sup ?? -1e9) < 90) return; SFX._sup = now;
    if (playSfxFile('super_effective')) return;   // fichier déposé dans assets/audio/sfx/ : il remplace la version synthétisée
    band(2800, 0.9, 0.09, 0.2); band(5400, 1.2, 0.14, 0.09, 0.008);
    tone(125, 36, 0.38, 'sine', 0.18); noise(0.34, 0.09, 520, 0.005);
    band(750, 1.3, 0.24, 0.15, 0.02); band(1900, 2, 0.16, 0.08, 0.03);
    band(4300, 7, 0.4, 0.04, 0.05); band(3100, 9, 0.5, 0.03, 0.08);
  },
  crit() { band(2200, 0.8, 0.12, 0.17); tone(90, 40, 0.25, 'sine', 0.14); band(250, 0.6, 0.2, 0.1); band(5000, 1.5, 0.18, 0.05, 0.02); },
  hurt() { tone(80, 38, 0.28, 'sine', 0.13); band(500, 0.7, 0.18, 0.12); band(2500, 1, 0.06, 0.06); },
  dodge() { band(3500, 0.6, 0.18, 0.04); },
  parry() { band(3200, 3, 0.25, 0.12); band(4800, 4, 0.18, 0.07, 0.01); band(2300, 4, 0.3, 0.06, 0.02); tone(1900, 1850, 0.22, 'sine', 0.015); },
  block() { band(900, 1.5, 0.1, 0.1); tone(120, 70, 0.12, 'sine', 0.09); },
  telegraph() { band(1200, 1.2, 0.2, 0.04); },
  shoot() { band(1500, 0.8, 0.2, 0.06); band(500, 0.7, 0.15, 0.04, 0.02); },
  // allumage du feu : souffle de flamme puis quelques crépitements, aucune note
  bonfire() { whoosh(1.0, 0.12, 250, 2200); [0.12, 0.26, 0.33, 0.5, 0.62, 0.8].forEach(d => noise(0.03 + Math.random() * 0.03, 0.05 + Math.random() * 0.04, 3000 + Math.random() * 2500, d + Math.random() * 0.05)); },
  // K.O. d'un allié : coup sourd, sans note ni dent de scie
  death() { tone(110, 45, 0.5, 'sine', 0.08); noise(0.5, 0.05, 350); },
  // ramassage de la récompense : deux notes douces et longues (une quinte), sans arpège
  victory() { tone(523, 523, 1.2, 'sine', 0.04); tone(784, 784, 1.4, 'sine', 0.035, 0.12); },
  heal() { tone(440, 520, 0.5, 'sine', 0.035); tone(660, 700, 0.6, 'sine', 0.025, 0.05); },
  blip(pitch = 1) { tone((420 + Math.random() * 60) * pitch, (400 + Math.random() * 50) * pitch, 0.04, 'sine', 0.03); },
  pick() { band(2500, 2, 0.08, 0.05); tone(600, 640, 0.15, 'sine', 0.03); },
  // ───── attaques de boss : annonce qui monte, puis impact lourd ─────
  bossTele(id, dur = 0.8) { sub(55, 110, dur, 0.22); sweep(180, 2600, dur, 0.13, { a: dur * 0.8, q: 2 }); growl(55, 110, dur, 0.07, { lp0: 300, lp1: 700, a: dur * 0.6 }); if (flv(id) === 'elec') zap(dur, 0.05, 0, 28); [0.55, 0.75].forEach(k => tone(220 + k * 400, 300 + k * 700, dur * 0.4, 'sawtooth', 0.018, dur * k * 0.8)); },
  bossBall(id) { sub(120, 40, 0.7, 0.35); growl(260, 70, 0.55, 0.16, { lp0: 2200, lp1: 200 }); sweep(1500, 200, 0.5, 0.13, { a: 0.02 }); crack(0.2); flavor(id, 1); },
  bossVolley(id) { for (let i = 0; i < 5; i++) { const d = i * 0.055; sub(150, 55, 0.25, 0.14, d); growl(420 - i * 20, 120, 0.22, 0.08, { delay: d, lp0: 2600, lp1: 300, pan: (i - 2) * 0.3 }); crack(0.1, d, 7000); } flavor(id, 0.8); },
  bossNova(id) { sub(90, 28, 1.3, 0.5); growl(140, 38, 1.0, 0.2, { lp0: 1600, lp1: 90, rv: 0.6 }); sweep(3500, 120, 1.0, 0.16, { a: 0.01, rv: 0.6 }); crack(0.32); [0.1, 0.22].forEach(d => crack(0.14, d, 3000)); flavor(id, 1.3); },
  bossSwing(id) { sweep(500, 4200, 0.22, 0.2, { a: 0.07, q: 0.8 }); sweep(3500, 300, 0.3, 0.14, { delay: 0.15, a: 0.02 }); sub(110, 45, 0.4, 0.28, 0.12); crack(0.2, 0.14, 4000); },
  bossPulse(id) { for (let i = 0; i < 3; i++) { const d = i * 0.17; sub(70 - i * 8, 26, 0.9, 0.42, d); growl(120, 40, 0.6, 0.12, { delay: d, lp0: 700, lp1: 70, rv: 0.6 }); crack(0.2 - i * 0.04, d, 2500); } sweep(2000, 100, 1.1, 0.1, { a: 0.02, rv: 0.7 }); flavor(id, 1.1); },
  bossDash(id) { sweep(250, 3000, 0.45, 0.2, { a: 0.18 }); growl(70, 150, 0.5, 0.18, { lp0: 500, lp1: 1500, a: 0.2 }); sub(70, 45, 0.6, 0.3, 0.05); flavor(id, 0.7); },
  bossRain(id) { sweep(400, 3500, 0.6, 0.12, { a: 0.4 }); growl(70, 160, 0.6, 0.12, { lp0: 400, lp1: 1200, a: 0.45 }); sub(70, 35, 0.8, 0.28); flavor(id, 0.9); },
  // impact au sol d'une zone de pluie
  bossImpact(id) { sub(100, 30, 0.7, 0.4); crack(0.3, 0, 5000); growl(180, 50, 0.4, 0.1, { lp0: 1400, lp1: 120 }); sweep(3000, 200, 0.5, 0.1, { a: 0.01 }); if (flv(id) === 'elec') zap(0.35, 0.08, 0, 70); },
  bossBeam(id) { sub(60, 38, 1.1, 0.5); growl(110, 220, 0.9, 0.22, { lp0: 500, lp1: 3000, a: 0.04, rv: 0.5 }); growl(165, 330, 0.9, 0.12, { lp0: 700, lp1: 3500, a: 0.04 }); sweep(500, 6000, 0.35, 0.18, { a: 0.03 }); sweep(6000, 600, 0.9, 0.1, { delay: 0.35, a: 0.05 }); crack(0.35); flavor(id, 1.5); },
  bossSummon(id) { sweep(120, 1800, 1.0, 0.16, { a: 0.7, rv: 0.6 }); growl(55, 90, 1.1, 0.18, { lp0: 300, lp1: 800, a: 0.6 }); sub(45, 80, 1.0, 0.3); tone(330, 495, 0.9, 'sine', 0.05, 0.1); tone(495, 740, 0.9, 'sine', 0.04, 0.2); },
  // changement de phase : cataclysme
  bossPhase(id) { sub(80, 22, 2.2, 0.6); growl(110, 28, 1.8, 0.28, { lp0: 2200, lp1: 80, rv: 0.7 }); sweep(4500, 80, 1.6, 0.2, { a: 0.02, rv: 0.8 }); crack(0.45); [0.15, 0.35, 0.6].forEach((d, i) => { crack(0.2 - i * 0.04, d, 2500); sub(60, 24, 0.6, 0.3, d); }); flavor(id, 2); },
  boom() { noise(0.4, 0.2, 700); tone(100, 30, 0.4, 'sawtooth', 0.1); },
  door() { noise(0.4, 0.07, 500); },
};
