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
// Nom d'un bouton d'après son indice (disposition « standard » du navigateur) et le type de manette.
export function padBtnName(i) {
  const f = FACE[padKind], s = SYS[padKind];
  if (i < 8) return f[i]; if (i === 8) return s[0]; if (i === 9) return s[1]; if (i === 10) return 'Clic G'; if (i === 11) return 'Clic D';
  if (i >= 12 && i <= 15) return ['↑', '↓', '←', '→'][i - 12]; return 'Bouton ' + i;
}
export function padLabel(a) {
  const w = padBtnName(PADACT.mod);
  switch (a) {
    case 'up': case 'down': case 'left': case 'right': return 'Stick G';
    case 'run': return padBtnName(PADACT.dodge) + ' (maintenu)';
    case 'berry': return w + '+' + padBtnName(3); case 'candy': return w + '+' + padBtnName(2); case 'ether': return w + '+' + padBtnName(1); case 'revive': return w + '+' + padBtnName(0);
    default: return a in PADACT ? padBtnName(PADACT[a]) : '';
  }
}
export const padKindName = () => (padOn ? KIND_NAME[padKind] : '');
// Noms des boutons selon le type de manette (positions : 0 bas, 1 droite, 2 gauche, 3 haut, 4 L1, 5 R1, 6 L2, 7 R2) pour le schéma de l'écran Commandes.
export const padFace = () => ({ f: FACE[padKind], s: SYS[padKind] });
export function padLabels() {
  const f = FACE[padKind];
  return [['Déplacement', 'Stick gauche'], ['Esquive (appui) / course (maintenu)', padLabel('dodge')], ['Interagir', padLabel('interact')], ['Attaque légère', padLabel('light')], ['Attaque lourde', padLabel('heavy')],
    ['Garde / parade (maintenir)', padLabel('guard')], ['Capacité spéciale', padLabel('ability')], ['Relève (Pokémon suivant)', padLabel('next')], ['Objets : roue', 'maintenir ' + f[5] + ' + stick droit, relâcher'], ['Changer de cible verrouillée', 'Stick droit gauche / droite'], ['Baie', padLabel('berry')], ['Super Bonbon', padLabel('candy')], ['Fiole d’endurance', padLabel('ether')], ['Rappel', padLabel('revive')], ['Lien (alliés)', 'Clic stick gauche'],
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
// R maintenu + bouton de face = objets rapides (haut = baie, gauche = bonbon, droite = Éther, bas = Rappel : la croix du HUD).
// R relâché : un coup de stick droit à gauche / droite change de cible verrouillée ; le clic du stick droit verrouille.
const PADDEF = { dodge: 0, interact: 1, light: 2, heavy: 3, guard: 7, ability: 4, next: 6, bag: 12, link: 10, lock: 11, pause: 9, map: 8, mod: 5 };
const PADSTORE = 'pokesouls.padmap.v1';
const PADACT = { ...PADDEF };   // action → indice de bouton (réassignable dans l'écran Commandes)
try { const sv = JSON.parse(localStorage.getItem(PADSTORE) || 'null'); if (sv) for (const a of Object.keys(PADDEF)) if (Number.isInteger(sv[a]) && sv[a] >= 0 && sv[a] < 32) PADACT[a] = sv[a]; } catch (e) { /* défauts */ }
const padPersist = () => { try { localStorage.setItem(PADSTORE, JSON.stringify(PADACT)); } catch (e) { /* rien */ } };
let PAD = {}, PAD_ITEM = { 3: 'berry', 2: 'candy', 1: 'ether', 0: 'revive' }, padLearn = null, padInfo = { id: '', mapping: '' };
const padRebuild = () => { PAD = {}; for (const [a, i] of Object.entries(PADACT)) if (a !== 'mod') PAD[i] = a; };
padRebuild();
// R tenu + bouton de face = objet : haut (lourd) = baie, gauche (léger) = bonbon, droite (interagir) = Éther, bas (esquive) = Rappel. Suit les boutons réassignés.
// Couche « physique » : indice réel renvoyé par le navigateur → position standard (0 bas, 1 droite, 2 gauche, 3 haut, 4 L, 5 R, 6 ZL, 7 ZR, 8 −, 9 +, 10 clic G, 11 clic D), réglée par l'assistant de l'écran Commandes.
const PHYSSTORE = 'pokesouls.padphys.v1';
const physIdx = Array.from({ length: 17 }, (_, i) => i);
try { const sv = JSON.parse(localStorage.getItem(PHYSSTORE) || 'null'); if (Array.isArray(sv)) sv.forEach((v, i) => { if (i < 17 && Number.isInteger(v) && v >= 0 && v < 40) physIdx[i] = v; }); } catch (e) { /* identité */ }
const physPersist = () => { try { localStorage.setItem(PHYSSTORE, JSON.stringify(physIdx)); } catch (e) { /* rien */ } };
// Manettes Nintendo : certains navigateurs numérotent les boutons d'après leurs étiquettes (A = indice 0, B = indice 1, X = 2, Y = 3) et non d'après leur position.
// Dans ce cas on peut échanger A/B et X/Y ; réglable dans l'écran Commandes (activé par défaut : B = bouton du bas = esquive, A = bouton de droite, X = haut, Y = gauche).
const NSWAPSTORE = 'pokesouls.nswap.v1';
let nswap = true; try { nswap = localStorage.getItem(NSWAPSTORE) !== '0'; } catch (e) { /* défaut */ }
const NSW = [1, 0, 3, 2];
const physOf = i => (padKind === 'nin' && nswap && i < 4 && physIdx[i] === i ? NSW[i] : physIdx[i]);
let rawLearn = null; const rawPrev = [], rawEdge = [], rawHeld = [];
let modNow = false, flickPrev = 0;
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
  padOn = true; padKind = kindOf(gp.id); padInfo = { id: gp.id, mapping: gp.mapping };
  const dz = v => (Math.abs(v) < 0.2 ? 0 : v);
  padAxes = [dz(gp.axes[0] || 0), dz(gp.axes[1] || 0)];
  let any = Math.hypot(padAxes[0], padAxes[1]) > 0.6;
  rawEdge.length = 0; rawHeld.length = 0;   // boutons bruts du navigateur (assistant de configuration et affichage de contrôle)
  for (let i = 0; i < Math.min(40, gp.buttons.length); i++) { const r = !!(gp.buttons[i] && gp.buttons[i].pressed); if (r && !rawPrev[i]) rawEdge.push(i); rawPrev[i] = r; if (r) rawHeld.push(i); }
  if (rawLearn && rawEdge.length) { const cb = rawLearn; rawLearn = null; btnPrev.length = 0; cb(rawEdge[0]); return; }
  if (rawLearn) return;
  for (let i = 0; i < 17; i++) {
    const pi = physOf(i), on = !!(gp.buttons[pi] && gp.buttons[pi].pressed);
    if (on && !btnPrev[i]) padEdge.add(i);
    btnPrev[i] = on; if (on) any = true;
  }
  if (padLearn && padEdge.size) { const cb = padLearn, i = [...padEdge][0]; padLearn = null; padEdge.clear(); cb(i); return; }   // réassignation : le prochain bouton pressé
  if (padLearn) return;
  if (any) lastDev = 'pad';
  const mod = !!btnPrev[PADACT.mod];   // R tenu : les boutons de face deviennent des objets
  for (const [b, act] of Object.entries(PAD)) {
    const item = mod && PAD_ITEM[b], ign = mod && act === 'lock';   // le clic du stick droit ne verrouille pas pendant R
    if (padEdge.has(+b) && !ign && !item) pressedNow.add(act);
    if (btnPrev[b] && !ign && !item) padDown.add(act); else padDown.delete(act);
  }
  if (mod) for (const [b, item] of Object.entries(PAD_ITEM)) if (padEdge.has(+b)) pressedNow.add(item);   // R + bouton de face fixe : haut baie, gauche bonbon, droite (A) huile, bas rappel
  { // stick droit, R relâché : un coup de stick à gauche / droite change de cible verrouillée
    const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0, mag = Math.hypot(rx, ry);
    const f = !mod && mag > 0.7 && Math.abs(rx) > Math.abs(ry) * 1.3 ? Math.sign(rx) : 0;
    if (f && f !== flickPrev) pressedNow.add(f < 0 ? 'lockPrev' : 'lockNext');
    flickPrev = f; modNow = mod;
  }
  // La course se maintient avec le bouton d'esquive ; elle doit être retirée dès qu'il est relâché (sinon elle reste active en permanence).
  if (btnPrev[PADACT.dodge] && !mod) padDown.add('run'); else padDown.delete('run');
}
export const PAD_ACTIONS = [['dodge', 'Esquive / course'], ['light', 'Attaque légère'], ['heavy', 'Attaque lourde'], ['interact', 'Interagir'], ['guard', 'Garde / parade'], ['ability', 'Capacité spéciale'], ['next', 'Relève (Pokémon suivant)'], ['mod', 'Objets rapides (maintenir + bouton de face)'], ['link', 'Lien'], ['lock', 'Verrouillage'], ['bag', 'Sac'], ['map', 'Carte'], ['pause', 'Pause']];
export const Input = {
  // réassignation des boutons de la manette (écran Commandes)
  padLearn(cb) { padLearn = cb; }, padStopLearn() { padLearn = null; }, padInfo: () => padInfo,
  padRawLearn(cb) { rawLearn = cb; }, padRawStop() { rawLearn = null; }, padRawHeld: () => rawHeld.slice(),
  padSetPhys(pos, raw) { physIdx[pos] = raw; physPersist(); },
  padResetPhys() { for (let i = 0; i < 17; i++) physIdx[i] = i; try { localStorage.removeItem(PHYSSTORE); } catch (e) { /* rien */ } },
  padPhysCustom: () => physIdx.some((v, i) => v !== i),
  // menus : convention Nintendo (A, à droite, valide ; B, en bas, retour) ; Xbox / PlayStation : bouton du bas valide
  padOk: () => (padKind === 'nin' ? 1 : 0), padNo: () => (padKind === 'nin' ? 0 : 1),
  padNswap: () => nswap, padSetNswap(v) { nswap = !!v; try { localStorage.setItem(NSWAPSTORE, v ? '1' : '0'); } catch (e) { /* rien */ } },
  padIndex: a => PADACT[a],
  padAssign(a, i) { const old = PADACT[a]; for (const o of Object.keys(PADACT)) if (o !== a && PADACT[o] === i) PADACT[o] = old; PADACT[a] = i; padRebuild(); padPersist(); },
  padResetMap() { Object.assign(PADACT, PADDEF); padRebuild(); try { localStorage.removeItem(PADSTORE); } catch (e) { /* rien */ } },
  padCustom: () => Object.keys(PADDEF).some(a => PADACT[a] !== PADDEF[a]),
  poll() { pollPad(); },
  endFrame() { pressedNow.clear(); padEdge.clear(); },
  pressed: a => pressedNow.has(a),
  // aides pour la navigation manette dans les menus (js/padnav.js)
  padEdge: i => padEdge.has(i),
  padHeld: i => !!btnPrev[i],
  padStick: () => padAxes,
  padMod: () => padOn && modNow,   // R tenu (objets rapides)
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
