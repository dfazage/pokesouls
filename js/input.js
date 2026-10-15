// Clavier (QWERTY/AZERTY) + souris + manette, avec commandes modifiables (stockées dans le navigateur).
export const ACTIONS = [
  ['Déplacement', [['up', 'Haut'], ['down', 'Bas'], ['left', 'Gauche'], ['right', 'Droite'], ['run', 'Courir'], ['dodge', 'Esquive']]],
  ['Combat', [['light', 'Attaque légère'], ['heavy', 'Attaque lourde'], ['ability', 'Capacité spéciale (CT)'], ['guard', 'Garde / parade'], ['lock', 'Verrouillage'], ['berry', 'Baie de soin'], ['ether', 'Fiole d’endurance (Huile)'], ['link', 'Lien : appeler les deux alliés (jauge pleine)']]],
  ['Équipe (un seul Pokémon sur le terrain)', [['next', 'Relève : Pokémon suivant'], ['s1', 'Appeler le Pokémon 1'], ['s2', 'Appeler le Pokémon 2'], ['s3', 'Appeler le Pokémon 3']]],
  ['Monde', [['interact', 'Interagir'], ['map', 'Carte / téléportation'], ['bag', 'Sac']]],
  ['Système', [['pause', 'Pause']]],
];
export const DEFAULTS = {
  up: ['KeyW', 'KeyZ', 'ArrowUp'], down: ['KeyS', 'ArrowDown', ''], left: ['KeyA', 'KeyQ', 'ArrowLeft'], right: ['KeyD', 'ArrowRight', ''],
  light: ['KeyJ', 'Mouse0', ''], heavy: ['KeyK', 'Mouse2', ''], ability: ['KeyL', '', ''], guard: ['KeyH', 'KeyU', ''], dodge: ['Space', '', ''], run: ['ShiftLeft', 'ShiftRight', ''],
  interact: ['KeyE', '', ''], berry: ['KeyR', '', ''], lock: ['KeyT', '', ''], next: ['Tab', '', ''], ether: ['KeyF', '', ''], link: ['KeyV', '', ''], pause: ['Escape', 'KeyP', ''],
  s1: ['Digit1', 'Numpad1', ''], s2: ['Digit2', 'Numpad2', ''], s3: ['Digit3', 'Numpad3', ''], map: ['KeyM', '', ''], bag: ['KeyB', '', ''],
};
export const PAD_LABELS = [
  ['Déplacement', 'Stick gauche'], ['Esquive / course (maintenu)', 'A'], ['Interagir', 'B'], ['Attaque légère', 'X'], ['Attaque lourde', 'Y'],
  ['Garde', 'LB'], ['Capacité spéciale', 'RB'], ['Relève (Pokémon suivant)', 'RT'], ['Fiole d’endurance', 'LT'], ['Baie', 'Croix haut'], ['Lien (alliés)', 'LB + RB ensemble'], ['Verrouillage', 'Clic stick droit'], ['Carte / téléportation', 'Select'], ['Sac', 'Croix bas'], ['Pause', 'Start'],
];
const STORE = 'pokesouls.controls.v1';
let binds = {}, codeToAct = {}, layout = null, capture = null;

function rebuild() { codeToAct = {}; for (const [a, cs] of Object.entries(binds)) for (const c of cs) if (c) (codeToAct[c] ||= []).push(a); }
function load() {
  binds = JSON.parse(JSON.stringify(DEFAULTS));
  try { const s = JSON.parse(localStorage.getItem(STORE) || 'null'); if (s) for (const a of Object.keys(DEFAULTS)) if (Array.isArray(s[a])) binds[a] = [0, 1, 2].map(i => s[a][i] || ''); } catch (e) { /* défauts */ }
  rebuild();
}
function persist() { try { localStorage.setItem(STORE, JSON.stringify(binds)); } catch (e) { /* rien */ } }
load();
if (navigator.keyboard && navigator.keyboard.getLayoutMap) navigator.keyboard.getLayoutMap().then(m => { layout = m; }).catch(() => {});

export function keyLabel(code) {
  if (!code) return '—';
  if (code === 'Mouse0') return 'Clic gauche'; if (code === 'Mouse1') return 'Clic molette'; if (code === 'Mouse2') return 'Clic droit';
  const names = { Space: 'Espace', ShiftLeft: 'Maj gauche', ShiftRight: 'Maj droite', ControlLeft: 'Ctrl gauche', ControlRight: 'Ctrl droite', AltLeft: 'Alt gauche', AltRight: 'Alt droite', Escape: 'Échap', Tab: 'Tab', Enter: 'Entrée', Backspace: '⌫',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
  if (names[code]) return names[code];
  if (layout && layout.get(code)) return layout.get(code).toUpperCase();
  if (code.startsWith('Key')) return code.slice(3); if (code.startsWith('Digit')) return code.slice(5); if (code.startsWith('Numpad')) return 'Pavé ' + code.slice(6);
  return code;
}
export const Controls = {
  get: a => binds[a] || ['', '', ''],
  set(action, slot, code) {
    if (code) for (const a of Object.keys(binds)) binds[a] = binds[a].map((c, i) => (c === code && !(a === action && i === slot) ? '' : c));
    binds[action][slot] = code; rebuild(); persist();
  },
  reset() { binds = JSON.parse(JSON.stringify(DEFAULTS)); rebuild(); try { localStorage.removeItem(STORE); } catch (e) { /* rien */ } },
  // écoute la prochaine touche / clic : cb(code) ; Échap annule
  listen(cb) { capture = cb; },
  stopListen() { capture = null; },
  isListening: () => !!capture,
};

const down = new Set(), pressedNow = new Set(), padPrev = {}, padDown = new Set();
let padAxes = [0, 0];
const press = c => { const acts = codeToAct[c]; if (acts) for (const a of acts) { down.add(a); pressedNow.add(a); } };
const release = c => { const acts = codeToAct[c]; if (acts) for (const a of acts) down.delete(a); };

addEventListener('keydown', e => {
  if (capture) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) { const cb = capture; capture = null; cb(e.code); } return; }
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (!codeToAct[e.code]) return;
  if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) return; press(e.code);
}, true);
addEventListener('keyup', e => release(e.code));
addEventListener('blur', () => down.clear());
const onUi = e => e.target && e.target.closest && e.target.closest('button,.menu,.screen,#hud .slot');
addEventListener('mousedown', e => {
  if (capture) { if (onUi(e) && !e.target.closest('.keybtn')) return; e.preventDefault(); const cb = capture; capture = null; cb('Mouse' + e.button); return; }
  if (onUi(e)) return; press('Mouse' + e.button);
}, true);
addEventListener('mouseup', e => release('Mouse' + e.button));
addEventListener('contextmenu', e => e.preventDefault());

// Manette (disposition standard)
const PAD = { 0: 'dodge', 1: 'interact', 2: 'light', 3: 'heavy', 4: 'guard', 5: 'ability', 7: 'next', 6: 'ether', 12: 'berry', 13: 'bag', 11: 'lock', 9: 'pause', 8: 'map' };
function pollPad() {
  const gp = (navigator.getGamepads && [...navigator.getGamepads()].find(Boolean)) || null;
  padAxes = [0, 0];
  if (!gp) return;
  const dz = v => (Math.abs(v) < 0.2 ? 0 : v);
  padAxes = [dz(gp.axes[0] || 0), dz(gp.axes[1] || 0)];
  for (const [b, act] of Object.entries(PAD)) {
    const on = !!(gp.buttons[b] && gp.buttons[b].pressed);
    if (on && !padPrev[b]) pressedNow.add(act);
    padPrev[b] = on;
    if (on) padDown.add(act); else padDown.delete(act);
  }
  if (gp.buttons[0] && gp.buttons[0].pressed) padDown.add('run');
  { const both = !!(gp.buttons[4] && gp.buttons[4].pressed && gp.buttons[5] && gp.buttons[5].pressed); if (both && !padPrev.chord) pressedNow.add('link'); padPrev.chord = both; }
}
export const Input = {
  poll() { pollPad(); },
  endFrame() { pressedNow.clear(); },
  pressed: a => pressedNow.has(a),
  down: a => down.has(a) || padDown.has(a),
  axis() {
    let x = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0) + padAxes[0];
    let y = (Input.down('down') ? 1 : 0) - (Input.down('up') ? 1 : 0) + padAxes[1];
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return [x, y];
  },
  clear() { down.clear(); pressedNow.clear(); },
};
