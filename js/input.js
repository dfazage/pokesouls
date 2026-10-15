// Clavier (QWERTY/AZERTY) + manette. Actions : appui (pressed) et maintien (down).
const KEYS = {
  up: ['KeyW', 'KeyZ', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'KeyQ', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  light: ['KeyJ'], heavy: ['KeyK'], ability: ['KeyL'], guard: ['KeyH', 'KeyU'], dodge: ['Space'], run: ['ShiftLeft', 'ShiftRight'],
  interact: ['KeyE'], berry: ['KeyR'], lock: ['KeyT'], next: ['Tab'], order: ['KeyC'], pause: ['Escape', 'KeyP'],
  s1: ['Digit1', 'Numpad1'], s2: ['Digit2', 'Numpad2'], s3: ['Digit3', 'Numpad3'], s4: ['Digit4', 'Numpad4'], s5: ['Digit5', 'Numpad5'], s6: ['Digit6', 'Numpad6'],
};
const codeToAct = {};
for (const [a, cs] of Object.entries(KEYS)) for (const c of cs) (codeToAct[c] ||= []).push(a);

const down = new Set(), pressedNow = new Set(), padPrev = {}, padDown = new Set();
let padAxes = [0, 0];

addEventListener('keydown', e => {
  const acts = codeToAct[e.code]; if (!acts) return;
  if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) return;
  for (const a of acts) { down.add(a); pressedNow.add(a); }
});
addEventListener('keyup', e => { const acts = codeToAct[e.code]; if (acts) for (const a of acts) down.delete(a); });
addEventListener('blur', () => down.clear());
addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('button,.menu')) return; if (e.button === 0) { down.add('light'); pressedNow.add('light'); } if (e.button === 2) { down.add('heavy'); pressedNow.add('heavy'); } });
addEventListener('mouseup', e => { if (e.button === 0) down.delete('light'); if (e.button === 2) down.delete('heavy'); });
addEventListener('contextmenu', e => e.preventDefault());

// Manette (disposition standard) : A esquive-course, B interaction, X/Y attaque légère/lourde, LB garde, RB capacité,
// RT changement de chef, LT ordres, croix : baies / verrouillage (clic stick droit).
const PAD = { 0: 'dodge', 1: 'interact', 2: 'light', 3: 'heavy', 4: 'guard', 5: 'ability', 7: 'next', 6: 'order', 12: 'berry', 11: 'lock', 9: 'pause' };
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
  if (gp.buttons[0] && gp.buttons[0].pressed) padDown.add('run'); // A maintenu = course
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
