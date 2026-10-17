// Brume d'entrée des sanctuaires de boss : un portail de nuages en pixel art (générés en code), une lueur au centre et la
// silhouette du boss qui se précise quand le joueur approche. Un seul moteur ; chaque boss règle palette, mouvement et effets
// dans FOG_STYLES. L'objet est dessiné comme un décor (billboard en HD-2D, sprite en 2D), voir collectDrawList.
import * as M from './maps.js';
import * as D from './data.js';
import { A, drawSprite } from './assets.js';

const TS = 24, RX = 34, RY0 = 44;
let RY = RY0;                             // demi-hauteur courante : réduite pendant le combat (voir drawFog)          // demi-largeur et demi-hauteur du portail (px de monde)
const BURST_T = 0.9;                      // durée de l'éclatement quand la brume s'ouvre (s)

// dark/light : bornes de la palette de nuages ; glow : lueur centrale ; swirl : vitesse de rotation (négatif = sens inverse) ;
// rise : les nuages montent (fumée) ; jit : tremblement ; fx : effets propres au boss (voir FX)
export const FOG_STYLES = {
  lugia:    { dark: '#06142c', light: '#d6edff', glow: [170, 220, 255], swirl: 1,    fx: ['swirl'] },
  articuno: { dark: '#0b2a44', light: '#f2fbff', glow: [190, 240, 255], swirl: 0.5,  fx: ['snow'] },
  zapdos:   { dark: '#1a1530', light: '#c9b8e8', glow: [255, 236, 110], swirl: 1.4,  jit: 1,   fx: ['bolt'], bolt: [255, 240, 120] },
  moltres:  { dark: '#1a0604', light: '#ff9a40', glow: [255, 150, 60],  swirl: 0.6,  rise: 1,  fx: ['ember'] },
  mewtwo:   { dark: '#120a24', light: '#cfc8f0', glow: [200, 150, 255], swirl: 0.25, jit: 0.6, fx: ['glitch', 'ring'] },
  mew:      { dark: '#3a1f4a', light: '#ffe6f6', glow: [255, 200, 235], swirl: 0.5,  fx: ['sparkle'] },
  raikou:   { dark: '#10142a', light: '#f0d878', glow: [255, 215, 90],  swirl: 1.6,  jit: 1,   fx: ['bolt', 'low'], bolt: [255, 220, 90] },
  entei:    { dark: '#1a0a06', light: '#e8c0a0', glow: [255, 130, 60],  swirl: 0.7,  rise: 1,  fx: ['ember', 'column'] },
  suicune:  { dark: '#0a3050', light: '#e6fbff', glow: [170, 235, 255], swirl: 0.4,  fx: ['ripple'] },
  celebi:   { dark: '#0c2a1a', light: '#d4f5c0', glow: [170, 255, 170], swirl: 0.35, fx: ['leaf'] },
};
const DEFAULT_STYLE = FOG_STYLES.lugia;

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

// un nuage pixelisé (taille de génération : la moitié du rendu, chaque pixel fait 2 px de monde)
function makePuff(w, h, pal, rnd) {
  const o = document.createElement('canvas'); o.width = w; o.height = h; const g = o.getContext('2d');
  const bl = []; for (let i = 0; i < 5; i++) bl.push([w * (0.2 + 0.6 * rnd()), h * (0.35 + 0.3 * rnd()), w * (0.14 + 0.14 * rnd())]);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let d = 0; for (const b of bl) { const dx = (i - b[0]) / b[2], dy = (j - b[1]) / (b[2] * 0.62); d += Math.exp(-(dx * dx + dy * dy)); }
    d += (rnd() - 0.5) * 0.18;
    const t = d + (BAYER[j & 3][i & 3] / 16 - 0.5) * 0.28;
    if (t < 0.45) continue;
    const k = Math.min(3, Math.floor((1 - j / h) * 2.2 + (t - 0.45) * 1.4));
    g.fillStyle = pal[k]; g.fillRect(i, j, 1, 1);
  }
  return o;
}

// particules de nuages d'un style : 3 plans (fond, milieu, avant) + brume rasante
const cache = {};
function build(key, st) {
  if (cache[key]) return cache[key];
  let s = 1; for (const ch of key) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; s = s || 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const dk = hex(st.dark), lt = hex(st.light), ramp = (a, b) => [0, 1, 2, 3].map(i => rgb(mix(dk, lt, a + (b - a) * i / 3)));
  const pals = [ramp(0, 0.5), ramp(0.2, 0.75), ramp(0.45, 1)], sizes = [[20, 11], [17, 10], [14, 8]], counts = [16, 14, 12];
  const layers = pals.map((pal, li) => Array.from({ length: counts[li] }, (_, i) => ({
    img: makePuff(sizes[li][0], sizes[li][1], pal, rnd), u: 0.3 + rnd() * 0.85, a0: rnd() * 6.283, sp: 0.16 + 0.05 * li, ph: rnd(), w: sizes[li][0] * 2, h: sizes[li][1] * 2,
  })));
  const ground = Array.from({ length: 6 }, () => ({ img: makePuff(20, 7, pals[2], rnd), ph: rnd(), sp: 0.05 + rnd() * 0.05, w: 40, h: 14 }));
  return (cache[key] = { layers, ground });
}

// ---------- effets propres au boss : tous en pixels francs, positionnés autour du centre (X, YC) du portail ----------
const px = (c, x, y, w, h, col, a = 1) => { c.globalAlpha = a; c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); c.globalAlpha = 1; };
const FX = {
  swirl(c, t, X, YC, o, st) {   // bras de spirale clairs qui tournent
    for (let arm = 0; arm < 3; arm++) for (let j = 0; j < 22; j++) {
      const a = arm * 2.094 + j * 0.27 + t * 0.9 * st.swirl, u = 0.2 + j * 0.045;
      px(c, X + Math.cos(a) * u * RX * 1.1, YC + Math.sin(a) * u * RY, 2, 2, '#e8f6ff', (0.7 - j * 0.028) * (0.6 + 0.4 * o));
    }
  },
  snow(c, t, X, YC, o) {
    for (let i = 0; i < 22; i++) {
      const h = hash(i), y = YC - RY + ((t * (12 + h * 12) + h * 120) % (RY * 2 + 20)), x = X + (h - 0.5) * 2 * RX * 1.1 + Math.sin(t * 1.2 + i) * 4;
      px(c, x, y, h > 0.6 ? 2 : 1, h > 0.6 ? 2 : 1, '#ffffff', 0.85);
    }
    for (let i = 0; i < 5; i++) {   // éclats de givre : petite croix qui scintille
      const f = (t * 0.7 + hash(i + 40) * 3) % 3; if (f > 0.5) continue; const k = Math.sin(f / 0.5 * Math.PI), x = X + (hash(i + 7) - 0.5) * 2 * RX, y = YC + (hash(i + 13) - 0.5) * 2 * RY;
      px(c, x - 3, y, 7, 1, '#dff6ff', k); px(c, x, y - 3, 1, 7, '#dff6ff', k);
    }
  },
  bolt(c, t, X, YC, o, st) {
    const per = 2.2, n = Math.floor(t / per), f = t - n * per; if (f > 0.22) return;
    const col = st.bolt || [255, 240, 120], k = 1 - f / 0.22;
    c.globalAlpha = 0.22 * k; c.fillStyle = rgb(col); c.beginPath(); c.ellipse(X, YC, RX * 1.2, RY * 1.1, 0, 0, 7); c.fill(); c.globalAlpha = 1;
    let x = X + (hash(n * 3.1) - 0.5) * RX, y = YC - RY;
    for (let s = 0; s < 9; s++) {
      const nx = x + (hash(n * 7 + s) - 0.5) * 22, ny = y + RY * 2 / 9;
      const dx = nx - x, dy = ny - y, L = Math.max(1, Math.hypot(dx, dy));
      for (let q = 0; q < L; q += 2) { px(c, x + dx * q / L - 1, y + dy * q / L, 3, 3, rgb(col), k); px(c, x + dx * q / L, y + dy * q / L + 1, 1, 1, '#ffffff', k); }
      x = nx; y = ny;
    }
  },
  low(c, t, X, YC, o, st) {     // éclair rampant au sol (Raikou)
    const per = 1.7, n = Math.floor(t / per + 0.4), f = t / per + 0.4 - n; if (f > 0.16) return;
    const col = st.bolt || [255, 220, 90], k = 1 - f / 0.16; let y = YC + RY + 2;
    for (let x = X - RX * 1.4; x < X + RX * 1.4; x += 4) { y += (hash(n * 11 + x) - 0.5) * 3; px(c, x, y, 4, 2, rgb(col), k); }
  },
  ember(c, t, X, YC, o) {
    for (let i = 0; i < 16; i++) {
      const h = hash(i + 3), f = ((t * (0.16 + h * 0.12) + h) % 1), y = YC + RY - f * RY * 2.4, x = X + (h - 0.5) * 2 * RX + Math.sin(t * 2 + i) * 3;
      px(c, x, y, 2, 2, f < 0.4 ? '#ffd35a' : f < 0.75 ? '#ff7a30' : '#c4301a', 1 - f * f);
    }
  },
  column(c, t, X, YC) {         // colonne de feu qui jaillit à intervalles (Entei)
    const per = 3.2, n = Math.floor(t / per), f = (t - n * per) / 0.9; if (f > 1) return;
    const x = X + (hash(n * 5.3) - 0.5) * RX * 1.6, hgt = Math.sin(f * Math.PI) * 64 * RY / RY0;
    for (let y = 0; y < hgt; y += 3) { const w = Math.max(2, 10 - y * 0.12); px(c, x - w / 2, YC + RY - y, w, 3, y < hgt * 0.5 ? '#ffb040' : '#ff6a20', 0.9 - y / hgt * 0.4); }
  },
  glitch(c, t, X, YC, o) {      // bandes décalées, comme une image qui saute
    const n = Math.floor(t * 5); for (let i = 0; i < 3; i++) {
      const h = hash(n * 3 + i), y = YC - RY + h * RY * 2, off = (hash(n * 7 + i) - 0.5) * 14;
      if (hash(n + i * 9) > 0.55) px(c, X - RX * 0.9 + off, y, RX * 1.8, 3, '#d8c8ff', 0.28);
    }
  },
  ring(c, t, X, YC, o) {        // anneaux psychiques qui s'élargissent
    for (let i = 0; i < 3; i++) { const f = (t * 0.35 + i / 3) % 1; c.globalAlpha = (1 - f) * 0.5; c.strokeStyle = '#e0c8ff'; c.lineWidth = 1; c.beginPath(); c.ellipse(X, YC, 8 + f * RX * 1.3, 6 + f * RY * 1.2, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
  },
  sparkle(c, t, X, YC) {
    for (let i = 0; i < 14; i++) {
      const f = (t * 0.6 + hash(i) * 3) % 3; if (f > 1) continue; const k = Math.sin(f * Math.PI), a = hash(i + 20) * 6.283, u = 0.3 + hash(i + 31) * 0.9, x = X + Math.cos(a) * u * RX * 1.15, y = YC + Math.sin(a) * u * RY, col = i % 3 === 0 ? '#ffe9a0' : i % 3 === 1 ? '#ffd0ee' : '#ffffff';
      px(c, x, y, 1, 1, col, k); if (k > 0.5) { px(c, x - 2, y, 5, 1, col, k * 0.8); px(c, x, y - 2, 1, 5, col, k * 0.8); }
    }
  },
  ripple(c, t, X, YC) {         // rides sur le sol : la brume se reflète comme sur un miroir d'eau
    for (let i = 0; i < 3; i++) { const f = (t * 0.3 + i / 3) % 1; c.globalAlpha = (1 - f) * 0.7; c.strokeStyle = '#d8f6ff'; c.lineWidth = 1; c.beginPath(); c.ellipse(X, YC + RY + 2, 10 + f * 70, 3 + f * 14, 0, 0, 7); c.stroke(); c.globalAlpha = 1; }
  },
  leaf(c, t, X, YC) {
    for (let i = 0; i < 12; i++) {
      const h = hash(i + 60), f = (t * (0.1 + h * 0.08) + h) % 1, y = YC - RY + f * RY * 2.2, x = X + (h - 0.5) * 2 * RX * 1.1 + Math.sin(t * 1.4 + i * 2) * 6;
      px(c, x, y, 2, 3, i % 2 ? '#7bd36a' : '#bff59a', 0.9); px(c, x + 1, y + 1, 1, 1, '#2f7a2a', 0.8);
    }
    for (let i = 0; i < 8; i++) {   // lucioles
      const x = X + Math.sin(t * 0.6 + i * 1.7) * RX, y = YC + Math.cos(t * 0.5 + i * 2.3) * RY * 0.9, k = 0.5 + 0.5 * Math.sin(t * 3 + i * 5);
      px(c, x, y, 2, 2, '#ffee88', k);
    }
  },
};

// l'objet à ajouter à la liste de dessin, ou null si la brume n'est pas là
export function fogItem(g, inView) {
  const w = g.world, fg = w.fog; if (!fg) return null;
  const closed = fg.tiles.some(([x, y]) => w.grid[y * M.MW + x] === M.T.FOG);
  const bt = g.fogBurst !== undefined && g.fogBurst !== null ? g.t - g.fogBurst : 99, burst = !closed && bt >= 0 && bt < BURST_T ? bt / BURST_T : -1;
  if (!closed && burst < 0) return null;
  const X = fg.tiles.reduce((s, t) => s + (t[0] + 0.5) * TS, 0) / fg.tiles.length, Y = fg.tiles.reduce((s, t) => s + (t[1] + 0.5) * TS, 0) / fg.tiles.length + TS * 0.35;
  if (!inView(X, Y, 120)) return null;
  const boss = w.def.boss, st = FOG_STYLES[boss] || DEFAULT_STYLE;
  return { x: X, y: Y, big: true, f: c => drawFog(c, g, X, Y, boss, st, burst) };
}

function drawFog(c, g, X, Y, boss, st, burst) {
  const low = !!g.bossActive && burst < 0;   // dans l'arène : mur bas, pour ne pas gêner la vue ni les déplacements
  RY = low ? 12 : RY0; const ps = low ? 0.55 : 1;
  const t = g.t, P = build(boss, st), YC = Y - (low ? 12 : 46), ch = g.chief();
  // approche : 0 loin, 1 collé au portail (lissé)
  const f = g._fogK || (g._fogK = { k: 0, t }), dt = Math.min(0.1, Math.max(0, t - f.t)); f.t = t;
  const target = low ? 0 : burst >= 0 ? 1 : clamp((150 - Math.hypot(ch.x - X, ch.y - Y)) / 110, 0, 1);
  f.k += (target - f.k) * Math.min(1, dt * 3); const o = f.k;
  const bk = burst >= 0 ? burst : 0, fade = burst >= 0 ? 1 - bk : 1;
  c.save(); c.imageSmoothingEnabled = false;
  const layer = li => {
    for (let i = 0; i < P.layers[li].length; i++) {
      const p = P.layers[li][i], a = p.a0 + t * p.sp * st.swirl * (1 / (0.45 + p.u));
      let u = p.u + (1.3 - p.u) * o * 0.7; u *= 1 + bk * 1.7;
      let x = X + Math.cos(a) * u * RX * 1.15, y = YC + Math.sin(a) * u * RY, al = (li === 2 ? 1 - 0.7 * o : li === 1 ? 1 - 0.4 * o : 1) * fade;
      if (st.rise) { const r = ((t * 0.18 + p.ph) % 1); y += (26 - r * 52) * RY / RY0; al *= Math.sin(r * Math.PI) * 0.8 + 0.2; }
      if (st.jit) { const n = Math.floor(t * 12); x += (hash(n + i * 3.7 + li) - 0.5) * 3 * st.jit; y += (hash(n * 1.3 + i + li) - 0.5) * 2 * st.jit; }
      if (low && i % 2) continue;   // combat : moitié moins de nuages, plus petits et plus clairs
      const w = p.w * ps, h = p.h * ps;
      c.globalAlpha = clamp(al * (low ? 0.8 : 1), 0, 1); c.drawImage(p.img, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
    }
    c.globalAlpha = 1;
  };
  layer(0);
  // lueur centrale (anneaux pleins, bords francs)
  const gk = (0.45 + 0.9 * o) * fade, gl = st.glow;
  for (let r = low ? 0 : 34; r > 3; r -= 3) { c.fillStyle = `rgba(${gl[0]},${gl[1]},${gl[2]},${0.1 * gk})`; c.beginPath(); c.ellipse(X, YC + 4, r * 1.2, r * 1.35, 0, 0, 7); c.fill(); }
  
  // silhouette du boss derrière la brume
  const spr = D.BOSSES[boss] && D.BOSSES[boss].sprite, sp = spr && A.db[spr];
  if (sp && !low) {
    const sc = Math.min(D.BOSSES[boss].scale || 1.5, 92 / (sp.anchor.h || 60)), al = (0.2 + 0.78 * o) * fade;
    drawSprite(c, spr, 'Idle', t * 8, true, 0, X, YC + 36, { scale: sc, alpha: al, tint: 'brightness(.07) saturate(.5)' });
  }
  layer(1); layer(2);
  for (const e of st.fx) FX[e] && FX[e](c, t, X, YC, o, st);
  // brume rasante au pied du portail
  for (let i = 0; i < P.ground.length; i++) {
    const p = P.ground[i], x = X + Math.sin(t * p.sp * 3 + p.ph * 6.283) * RX * 1.5 * (1 + bk * 1.2), y = Y - 4 + Math.sin(t * 0.5 + i) * 2;
    c.globalAlpha = (low ? 0.55 : 0.75) * fade; c.drawImage(p.img, Math.round(x - p.w * ps / 2), Math.round(y - p.h * ps / 2), p.w * ps, p.h * ps);
  }
  c.globalAlpha = 1; c.restore();
}
