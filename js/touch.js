// Commandes tactiles : stick flottant à gauche, boutons d'action à droite (repère 1280×720 du #stage).
// Les boutons déclenchent les mêmes actions que le clavier et la manette, via Touch (input.js).
import { Touch } from './input.js';

// [action(s), libellé, centre x, centre y, rayon, classe]
const BTN = [
  [['light'], 'Coup', 1175, 595, 70, 'big'],
  [['heavy'], 'Lourd', 1020, 655, 52, ''],
  [['dodge', 'run'], 'Esquive', 1050, 515, 54, ''],
  [['ability'], 'CT', 885, 615, 48, ''],
  [['guard'], 'Garde', 1185, 445, 48, ''],
  [['link'], 'Lien', 1070, 395, 40, 'sm'],
  [['next'], 'Relève', 1195, 330, 42, 'sm'],
  [['berry'], 'Baie', 915, 500, 38, 'sm'],
  [['ether'], 'Huile', 790, 575, 38, 'sm'],
  [['interact'], 'Agir', 880, 400, 44, 'sm gold'],
  [['lock'], 'Cible', 735, 455, 36, 'sm'],
  [['pause'], 'II', 900, 44, 34, 'sm sys'],
  [['bag'], 'Sac', 820, 44, 34, 'sm sys'],
  [['map'], 'Carte', 740, 44, 34, 'sm sys'],
];
const STICK_R = 64; // rayon de course du stick, en pixels du stage

export function initTouch(stage) {
  const root = document.createElement('div');
  root.id = 'touch';
  root.innerHTML = '<div id="tz-move"></div><div id="tj-base"><div id="tj-knob"></div></div>';
  for (const [acts, label, x, y, r, cls] of BTN) {
    const b = document.createElement('div');
    b.className = 'tbtn ' + cls; b.dataset.act = acts.join(' '); b.textContent = label;
    b.style.cssText = `left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px`;
    root.appendChild(b);
  }
  stage.appendChild(root);

  const scale = () => stage.getBoundingClientRect().width / (stage.offsetWidth || 1280) || 1;
  const toStage = (cx, cy) => { const rc = stage.getBoundingClientRect(), s = scale(); return [(cx - rc.left) / s, (cy - rc.top) / s]; };

  // ---- boutons ----
  const held = new Map(); // pointerId → bouton
  const off = id => { const b = held.get(id); if (!b) return; held.delete(id); b.classList.remove('on'); for (const a of b.dataset.act.split(' ')) Touch.release(a); };
  root.querySelectorAll('.tbtn').forEach(b => {
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
      held.set(e.pointerId, b); b.classList.add('on');
      for (const a of b.dataset.act.split(' ')) Touch.press(a);
      if (navigator.vibrate) try { navigator.vibrate(8); } catch (err) { /* ignoré */ }
    });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, e => off(e.pointerId));
  });

  // ---- stick flottant ----
  const zone = root.querySelector('#tz-move'), base = root.querySelector('#tj-base'), knob = root.querySelector('#tj-knob');
  let sid = null, ox = 0, oy = 0; // origine du stick, en pixels écran
  const showStick = (cx, cy) => { const [x, y] = toStage(cx, cy); base.style.left = x + 'px'; base.style.top = y + 'px'; base.classList.add('on'); knob.style.transform = 'translate(-50%,-50%)'; };
  const move = e => {
    const R = STICK_R * scale();
    let dx = e.clientX - ox, dy = e.clientY - oy, l = Math.hypot(dx, dy);
    if (l > R) { // le pouce dérive : l'origine suit, pour ne jamais « sortir » du stick
      const k = (l - R) / l; ox += dx * k; oy += dy * k; dx = e.clientX - ox; dy = e.clientY - oy; l = R;
      const [x, y] = toStage(ox, oy); base.style.left = x + 'px'; base.style.top = y + 'px';
    }
    const m = l / R;
    knob.style.transform = `translate(calc(-50% + ${dx / scale()}px),calc(-50% + ${dy / scale()}px))`;
    if (m < 0.18) Touch.axis(0, 0); else Touch.axis(dx / R, dy / R);
  };
  const end = e => { if (e.pointerId !== sid) return; sid = null; Touch.axis(0, 0); base.classList.remove('on'); };
  zone.addEventListener('pointerdown', e => {
    if (sid !== null) return;
    e.preventDefault(); sid = e.pointerId; ox = e.clientX; oy = e.clientY;
    try { zone.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
    showStick(ox, oy); move(e);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === sid) { e.preventDefault(); move(e); } });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) zone.addEventListener(ev, end);

  let shown = false;
  return {
    // appelé à chaque image : les commandes ne sont visibles qu'en jeu (pas dans les menus ni sur l'écran titre)
    update(mode) {
      const on = mode === 'play';
      if (on === shown) return; shown = on;
      root.classList.toggle('on', on);
      if (!on) { for (const id of [...held.keys()]) off(id); sid = null; base.classList.remove('on'); Touch.releaseAll(); }
    },
  };
}
