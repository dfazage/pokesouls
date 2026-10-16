// Clavier (QWERTY/AZERTY) + souris + manette, avec commandes modifiables (stockées dans le navigateur).
export const ACTIONS = [
  ['Déplacement', [['up', 'Haut'], ['down', 'Bas'], ['left', 'Gauche'], ['right', 'Droite'], ['run', 'Courir'], ['dodge', 'Esquive']]],
  ['Combat', [['light', 'Attaque légère'], ['heavy', 'Attaque lourde'], ['ability', 'Capacité spéciale (CT)'], ['guard', 'Garde / parade'], ['lock', 'Verrouillage'], ['berry', 'Baie de soin'], ['candy', 'Super Bonbon (Pokémon actif)'], ['revive', 'Rappel (relève un Pokémon épuisé)'], ['ether', 'Fiole d’endurance (Huile)'], ['link', 'Lien : appeler les deux alliés (jauge pleine)']]],
  ['Équipe (un seul Pokémon sur le terrain)', [['next', 'Relève : Pokémon suivant'], ['s1', 'Appeler le Pokémon 1'], ['s2', 'Appeler le Pokémon 2'], ['s3', 'Appeler le Pokémon 3']]],
  ['Monde', [['interact', 'Interagir'], ['map', 'Carte / téléportation'], ['bag', 'Sac']]],
  ['Système', [['pause', 'Pause']]],
];
export const DEFAULTS = {
  up: ['KeyW', 'KeyZ', 'ArrowUp'], down: ['KeyS', 'ArrowDown', ''], left: ['KeyA', 'KeyQ', 'ArrowLeft'], right: ['KeyD', 'ArrowRight', ''],
  light: ['KeyJ', 'Mouse0', ''], heavy: ['KeyK', 'Mouse2', ''], ability: ['KeyL', '', ''], guard: ['KeyH', 'KeyU', ''], dodge: ['Space', '', ''], run: ['ShiftLeft', 'ShiftRight', ''],
  interact: ['KeyE', '', ''], berry: ['KeyR', '', ''], candy: ['KeyC', '', ''], revive: ['KeyG', '', ''], lock: ['KeyT', '', ''], next: ['Tab', '', ''], ether: ['KeyF', '', ''], link: ['KeyV', '', ''], pause: ['Escape', 'KeyP', ''],
  s1: ['Digit1', 'Numpad1', ''], s2: ['Digit2', 'Numpad2', ''], s3: ['Digit3', 'Numpad3', ''], map: ['KeyM', '', ''], bag: ['KeyB', '', ''],
};
// ---- étiquettes de manette : elles suivent le type détecté (Xbox, Nintendo Switch / Joy-Con, PlayStation) ----
// Indices de la disposition « standard » : 0 bas, 1 droite, 2 gauche, 3 haut, 4 L1, 5 R1, 6 L2, 7 R2.
const FACE = { xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT'], nin: ['B', 'A', 'Y', 'X', 'L', 'R', 'ZL', 'ZR'], ps: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2'] };
const SYS = { xbox: ['Select', 'Start'], nin: ['−', '+'], ps: ['Select', 'Options'] };
const KIND_NAME = { xbox: 'Xbox / standard', nin: 'Nintendo Switch', ps: 'PlayStation' };
let padKind = 'xbox', padOn = false, lastDev = 'kb';
const kindOf = id => (/054c|playstation|dualshock|dualsense/i.test(id) ? 'ps' : /057e|nintendo|joy-?con|pro controller|switch/i.test(id) ? 'nin' : 'xbox');
export function padLabel(a) {
  const f = FACE[padKind], s = SYS[padKind];
  switch (a) {
    case 'up': case 'down': case 'left': case 'right': return 'Stick G';
    case 'dodge': return f[0]; case 'run': return f[0] + ' (maintenu)'; case 'interact': return f[1]; case 'light': return f[2]; case 'heavy': return f[3];
    case 'guard': return f[7]; case 'ability': return f[4]; case 'ether': return f[5] + '+' + f[1]; case 'candy': return f[5] + '+' + f[2]; case 'revive': return f[5] + '+' + f[0]; case 'next': return f[6]; case 'link': return 'Clic G';
    case 'map': return s[0]; case 'pause': return s[1]; case 'lock': return 'Clic stick D'; case 'berry': return f[5] + '+' + f[3]; case 'bag': return '↑';
    default: return '';
  }
}
export const padKindName = () => (padOn ? KIND_NAME[padKind] : '');
export function padLabels() {
  const f = FACE[padKind];
  return [['Déplacement', 'Stick gauche'], ['Esquive (appui) / course (maintenu)', padLabel('dodge')], ['Interagir', padLabel('interact')], ['Attaque légère', padLabel('light')], ['Attaque lourde', padLabel('heavy')],
    ['Garde / parade (maintenir)', padLabel('guard')], ['Capacité spéciale', padLabel('ability')], ['Relève (Pokémon suivant)', padLabel('next')], ['Objets : maintenir ' + f[5] + ' puis', 'bouton de face'], ['Baie', padLabel('berry')], ['Super Bonbon', padLabel('candy')], ['Fiole d’endurance', padLabel('ether')], ['Rappel', padLabel('revive')], ['Lien (alliés)', 'Clic stick gauche'],
    ['Verrouillage', 'Clic stick droit'], ['Carte / téléportation', padLabel('map')], ['Sac', 'Croix haut'], ['Pause', padLabel('pause')],
    ['Menus : naviguer', 'Croix ou stick gauche'], ['Menus : valider / retour', f[0] + ' / ' + f[1]], ['Menus : changer d’onglet', f[4] + ' / ' + f[5]]];
}
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

const down = new Set(), pressedNow = new Set(), padPrev = {}, padDown = new Set(), touchDown = new Set();
let padAxes = [0, 0], touchAxes = [0, 0], lastTouchT = -1e9;
const press = c => { const acts = codeToAct[c]; if (acts) for (const a of acts) { down.add(a); pressedNow.add(a); } };
const release = c => { const acts = codeToAct[c]; if (acts) for (const a of acts) down.delete(a); };

addEventListener('keydown', e => {
  lastDev = 'kb';
  if (capture) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) { const cb = capture; capture = null; cb(e.code); } return; }
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (!codeToAct[e.code]) return;
  if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) return; press(e.code);
}, true);
addEventListener('keyup', e => release(e.code));
addEventListener('blur', () => down.clear());
const onUi = e => e.target && e.target.closest && e.target.closest('button,.menu,.screen,#hud .slot,#touch');
// Sur écran tactile, le navigateur émule une souris après chaque toucher : on l'ignore (sinon un toucher = une attaque).
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') lastTouchT = performance.now(); }, true);
addEventListener('mousedown', e => {
  if (performance.now() - lastTouchT < 1000) return;
  lastDev = 'kb';
  if (capture) { if (onUi(e) && !e.target.closest('.keybtn')) return; e.preventDefault(); const cb = capture; capture = null; cb('Mouse' + e.button); return; }
  if (onUi(e)) return; press('Mouse' + e.button);
}, true);
addEventListener('mouseup', e => release('Mouse' + e.button));
// Commandes tactiles (js/touch.js) : mêmes actions que le clavier et la manette.
export const Touch = {
  press(a) { if (!touchDown.has(a)) { touchDown.add(a); pressedNow.add(a); } },
  release(a) { touchDown.delete(a); },
  axis(x, y) { touchAxes = [x, y]; },
  releaseAll() { touchDown.clear(); touchAxes = [0, 0]; },
};
addEventListener('contextmenu', e => e.preventDefault());

// Manette (disposition standard). Une Joy-Con fusionnée ou une Pro Controller est vue comme une manette standard par Chrome.
// Disposition : B esquive, Y/X attaques, A interagir, ZL relève, ZR garde, L capacité, clic stick G lien, clic stick D verrouillage, croix haut sac.
// R maintenu + bouton de face = objets rapides (haut = baie, gauche = bonbon, droite = Éther, bas = Rappel : la même croix que dans le HUD).
const PAD = { 0: 'dodge', 1: 'interact', 2: 'light', 3: 'heavy', 7: 'guard', 4: 'ability', 6: 'next', 12: 'bag', 10: 'link', 11: 'lock', 9: 'pause', 8: 'map' };
const PAD_ITEM = { 3: 'berry', 2: 'candy', 1: 'ether', 0: 'revive' };
const btnPrev = [], padEdge = new Set();
function padReset() { padDown.clear(); btnPrev.length = 0; padEdge.clear(); for (const k of Object.keys(padPrev)) delete padPrev[k]; }
addEventListener('gamepadconnected', e => { padKind = kindOf(e.gamepad.id); lastDev = 'pad'; });
addEventListener('gamepaddisconnected', () => { padReset(); padOn = false; padAxes = [0, 0]; });
addEventListener('blur', padReset);
function pollPad() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  const gp = pads.find(p => p.mapping === 'standard') || pads[0] || null;
  padAxes = [0, 0];
  if (!gp) { if (padOn) { padReset(); padOn = false; } return; }
  padOn = true; padKind = kindOf(gp.id);
  const dz = v => (Math.abs(v) < 0.2 ? 0 : v);
  padAxes = [dz(gp.axes[0] || 0), dz(gp.axes[1] || 0)];
  let any = Math.hypot(padAxes[0], padAxes[1]) > 0.6;
  for (let i = 0; i < 17; i++) {
    const on = !!(gp.buttons[i] && gp.buttons[i].pressed);
    if (on && !btnPrev[i]) padEdge.add(i);
    btnPrev[i] = on; if (on) any = true;
  }
  if (any) lastDev = 'pad';
  const mod = !!btnPrev[5];   // R tenu : les boutons de face deviennent des objets
  for (const [b, act] of Object.entries(PAD)) {
    const item = mod && PAD_ITEM[b];
    if (padEdge.has(+b)) pressedNow.add(item || act);
    if (btnPrev[b] && !item) padDown.add(act); else padDown.delete(act);
  }
  // La course se maintient avec le bouton d'esquive ; elle doit être retirée dès qu'il est relâché (sinon elle reste active en permanence).
  if (btnPrev[0] && !mod) padDown.add('run'); else padDown.delete('run');
}
export const Input = {
  poll() { pollPad(); },
  endFrame() { pressedNow.clear(); padEdge.clear(); },
  pressed: a => pressedNow.has(a),
  // aides pour la navigation manette dans les menus (js/padnav.js)
  padEdge: i => padEdge.has(i),
  padHeld: i => !!btnPrev[i],
  padStick: () => padAxes,
  eat: a => { pressedNow.delete(a); },
  // vrai quand une manette est branchée et que c'est elle qui a servi en dernier (hors mode tactile)
  usingPad: () => padOn && lastDev === 'pad' && !document.body.classList.contains('touch'),
  down: a => down.has(a) || padDown.has(a) || touchDown.has(a),
  axis() {
    let x = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0) + padAxes[0] + touchAxes[0];
    let y = (Input.down('down') ? 1 : 0) - (Input.down('up') ? 1 : 0) + padAxes[1] + touchAxes[1];
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return [x, y];
  },
  clear() { down.clear(); pressedNow.clear(); touchDown.clear(); padEdge.clear(); },
};
