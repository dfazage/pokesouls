// Zones au sol des boss (pluie, tourbillon, geysers…) : télégraphe texturé par élément, petit sprite de charge, trace après l'impact, sprites PMD à l'impact.
// Remplace le disque rouge uni. Les boss sans style ici (ZSTYLE) gardent l'ancien disque (render.js). Mockup validé le 18 oct. : tout est dessiné au pixel près,
// le même repère de lecture qu'avant (anneau net, remplissage jusqu'à l'impact, éclat blanc sur les derniers 12 %), seul l'intérieur change.
import { FXS, pxScale } from './fx.js';

export const ZLING = 1.4;   // durée de la trace au sol après l'impact (s)
// boss -> style. 'mew' est la variante pétales du style psy.
export const ZSTYLE = { lugia: 'water', suicune: 'water', entei: 'fire', moltres: 'fire', raikou: 'elec', zapdos: 'elec', mewtwo: 'psy', mew: 'mew', celebi: 'grass', articuno: 'ice' };
const PAL = {
  water: { rim: '#cfeaff', rim2: '#6fbce8', deep: '#0a2c44', fill: '#3b8fc8', light: [111, 188, 232] },
  fire: { rim: '#ffd36a', rim2: '#ff7a2e', deep: '#1c0f0a', fill: '#ff8a30', light: [255, 122, 46] },
  elec: { rim: '#fff58a', rim2: '#ffd23a', deep: '#10141c', fill: '#ffe24a', light: [255, 210, 58] },
  psy: { rim: '#ffd0f0', rim2: '#ff8fd4', deep: '#1a1024', fill: '#ff7fcf', light: [255, 143, 212] },
  grass: { rim: '#e4ffd0', rim2: '#7fe08a', deep: '#0e2a18', fill: '#5fd070', light: [127, 224, 138] },
  ice: { rim: '#e8f8ff', rim2: '#8fd8ff', deep: '#10263a', fill: '#9fe0ff', light: [143, 216, 255] },
};
const palOf = st => PAL[st === 'mew' ? 'psy' : st];
// sprites d'impact : [clé, échelle absolue (px écran par px source), décalage y, point d'ancrage dans la frame (0 haut, 1 bas), durée]
const IMPACT = {
  water: [['whirlpool', 1, 3, 0.6, 0.5], ['brine', 0.7, 4, 0.62, 0.65], ['waterspout', 0.5, -8, 0.5, 0.7]],
  fire: [['eruption', 1, 3, 0.62, 0.6], ['earthpower', 0.75, -6, 0.55, 0.8]],
  elec: [['thunderbolt', 0.85, -4, 0.5, 0.55]],
  psy: [['extrasensory', 0.8, -4, 0.5, 0.64]],
  grass: [['ingrain', 0.9, 3, 0.62, 0.8], ['leafblade', 0.8, -8, 0.5, 0.9], ['vinewhip', 1.2, -2, 0.5, 0.3]],
  ice: [['frostbone', 0.75, -4, 0.5, 0.68]],
};

export function zoneStyle(z) {
  if (z.sty === undefined) z.sty = (z.owner && ZSTYLE[z.owner.sprite]) || null;
  return z.sty;
}
export function zoneLight(z) { const st = zoneStyle(z); return st ? palOf(st).light : [255, 90, 70]; }
export function zoneLives(z) { return zoneStyle(z) ? ZLING : 0.15; }   // durée de vie après l'impact

// ---------------------------------------------------------------- outils pixel
const rng = s => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
function ell(c, cx, cy, rx, ry, col, a = 1, d = 0) {
  if (rx < 1 || ry < 0.6) return; c.globalAlpha = a; c.fillStyle = col; const R = Math.floor(ry);
  for (let dy = -R; dy <= R; dy++) {
    const t = dy / ry, hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
    if (!d) c.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
    else for (let x = -hw; x <= hw; x++) if (((x + dy) & 1) === 0 || (d === 2 && ((x + dy) & 3) === 1)) c.fillRect(cx + x, cy + dy, 1, 1);
  }
  c.globalAlpha = 1;
}
function ring(c, cx, cy, rx, ry, col, a = 1, every = 1, on = 1, off = 0) {
  if (rx < 1) return; c.globalAlpha = a; c.fillStyle = col; const n = Math.max(16, Math.ceil(6.2832 * Math.max(rx, ry) * 1.15));
  for (let i = 0; i < n; i++) { if (every > 1 && ((i + off) % every) >= on) continue; const an = i / n * 6.2832; c.fillRect(Math.round(cx + Math.cos(an) * rx), Math.round(cy + Math.sin(an) * ry), 1, 1); }
  c.globalAlpha = 1;
}
function line(c, x0, y0, x1, y1, col, a = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); c.globalAlpha = a; c.fillStyle = col;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, g = 0;
  while (g++ < 400) { c.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  c.globalAlpha = 1;
}
// une frame d'une planche PMD, à l'échelle absolue A, posée sur le sol (ground = fraction de la frame qui touche le sol)
function frame(c, key, fi, x, y, A, alpha, ground) {
  const m = FXS.man[key], im = FXS.img[key]; if (!m || !im) return;
  fi = Math.max(0, Math.min(m.n - 1, fi | 0)); const w = m.fw * A, h = m.fh * A;
  c.globalAlpha = alpha; c.imageSmoothingEnabled = false;
  c.drawImage(im, (fi % m.cols) * m.fw, ((fi / m.cols) | 0) * m.fh, m.fw, m.fh, Math.round(x - w / 2), Math.round(y - h * ground), w, h); c.globalAlpha = 1;
}
function crackSet(R) { const a = []; for (let i = 0; i < 7; i++) { const an = i / 7 * 6.28 + (R() - 0.5) * 0.5, pts = []; let ra = 0; for (let j = 0; j < 4; j++) { ra += 0.22 + R() * 0.12; pts.push([an + (R() - 0.5) * 0.35, Math.min(1, ra)]); } a.push(pts); } return a; }

// ---------------------------------------------------------------- télégraphe
function tele(c, st, z, k, T) {
  const P = palOf(st), rx = z.r + 4, ry = rx, zx = Math.round(z.x), zy = Math.round(z.y), tm = T + z.x * 0.013;
  if (st === 'water') {
    ell(c, zx, zy, rx, ry, P.deep, 0.62);
    for (let i = 0; i < 3; i++) { const ph = (tm * 0.9 + i / 3) % 1, rr = 1 - ph; ring(c, zx, zy, rx * rr, ry * rr, P.rim2, Math.sin(ph * Math.PI) * 0.9); }
    ell(c, zx, zy, rx * k, ry * k, P.fill, 0.5, 1);
    ring(c, zx, zy, rx, ry, P.rim, 0.85, 3, 2); c.fillStyle = '#fff';
    for (let i = 0; i < 10; i++) { const an = i * 0.628 + tm * 0.9; c.fillRect(Math.round(zx + Math.cos(an) * (rx + 1)), Math.round(zy + Math.sin(an) * (ry + 1)), 2, 1); }
  } else if (st === 'fire') {
    ell(c, zx, zy, rx, ry, P.deep, 0.75); ell(c, zx, zy, rx - 3, ry - 3, '#3a2016', 0.6, 1);
    const pulse = 0.65 + 0.35 * Math.sin(tm * 9), g = Math.min(1, k * 1.5);
    if (!z.cr) z.cr = crackSet(rng((z.x * 7 + z.y * 13) | 0));
    for (const pts of z.cr) { let px = zx, py = zy; for (const [an, rr] of pts) { if (rr > g) break; const nx = zx + Math.cos(an) * rr * (rx - 1), ny = zy + Math.sin(an) * rr * (ry - 1); line(c, px, py, nx, ny, '#ff8a30', pulse); px = nx; py = ny; } }
    ell(c, zx, zy, rx * k, ry * k, P.fill, 0.4, 1);
    ring(c, zx, zy, rx, ry, P.rim2, 0.9, 2, 1);
    for (let i = 0; i < 8; i++) { const an = i * 0.785 + tm * 1.3; c.fillStyle = i % 2 ? '#ffd36a' : '#ff7a2e'; c.fillRect(Math.round(zx + Math.cos(an) * rx), Math.round(zy + Math.sin(an) * ry - ((tm * 6 + i * 3) % 4)), 1, 2); }
  } else if (st === 'elec') {
    ell(c, zx, zy, rx, ry, P.deep, 0.78);
    ring(c, zx, zy, rx * 0.72, ry * 0.72, P.rim2, 0.75, 3, 2, ((tm * 8) | 0) % 3);
    for (let i = 0; i < 4; i++) { const an = i * 1.5708; line(c, zx + Math.cos(an) * rx * 0.55, zy + Math.sin(an) * ry * 0.55, zx + Math.cos(an) * rx * 0.9, zy + Math.sin(an) * ry * 0.9, P.rim2, 0.9); }
    ell(c, zx, zy, rx * k, ry * k, P.fill, 0.38, 1);
    const sr = rng((((tm * 14) | 0) * 131 + z.x * 7 + z.y) | 0);
    for (let j = 0; j < 5; j++) { let an = sr() * 6.28, px = null, py = null; for (let s = 0; s < 4; s++) { const rr = 1 + (sr() - 0.5) * 0.18, x = zx + Math.cos(an) * rx * rr, y = zy + Math.sin(an) * ry * rr; if (px !== null) line(c, px, py, x, y, j % 2 ? '#fff' : P.rim, 0.95); px = x; py = y; an += 0.28; } }
    ring(c, zx, zy, rx, ry, P.rim2, 0.55);
  } else if (st === 'psy' || st === 'mew') {
    ell(c, zx, zy, rx, ry, P.deep, 0.72); ell(c, zx, zy, rx * k, ry * k, P.fill, 0.34, 1);
    ring(c, zx, zy, rx, ry, P.rim, 0.85, 3, 1, ((tm * 6) | 0) % 3); ring(c, zx, zy, rx * 0.62, ry * 0.62, P.rim2, 0.6, 2, 1);
    if (st === 'mew') {
      for (let i = 0; i < 6; i++) { const an = tm * 0.8 + i * 1.0472, x = Math.round(zx + Math.cos(an) * rx * 0.6), y = Math.round(zy + Math.sin(an) * ry * 0.6); ell(c, x, y, 3, 2, P.rim, 0.85, 1); ell(c, x, y, 1, 1, '#fff', 1); }
      const L = Math.round(rx * 0.5 * (0.4 + 0.6 * k)); line(c, zx - L, zy, zx + L, zy, '#fff', 0.9); line(c, zx, zy - L, zx, zy + L, '#fff', 0.9);
    } else for (let t3 = 0; t3 < 2; t3++) {
      const pts = []; for (let i = 0; i < 3; i++) { const an = tm * 0.9 * (t3 ? -1 : 1) + i * 2.094 + t3 * 1.047; pts.push([zx + Math.cos(an) * rx * 0.85, zy + Math.sin(an) * ry * 0.85]); }
      for (let i = 0; i < 3; i++) line(c, pts[i][0], pts[i][1], pts[(i + 1) % 3][0], pts[(i + 1) % 3][1], P.rim2, 0.85);
    }
  } else if (st === 'grass') {
    ell(c, zx, zy, rx, ry, P.deep, 0.75); ell(c, zx, zy, rx - 3, ry - 3, '#17402a', 0.5, 1); ell(c, zx, zy, rx * k, ry * k, P.fill, 0.38, 1);
    const g = Math.min(1, 0.2 + k * 1.1);
    for (let a = 0; a < 3; a++) { let px = zx, py = zy; for (let s = 1; s <= 14; s++) { const u = s / 14 * g, an = a * 2.094 + u * 3.1 + tm * 0.4, rr = u * (rx - 2), nx = zx + Math.cos(an) * rr, ny = zy + Math.sin(an) * rr; line(c, px, py, nx, ny, a % 2 ? P.rim2 : '#4fb868', 0.95); px = nx; py = ny; } ell(c, Math.round(px), Math.round(py), 2, 1, P.rim, 0.9, 1); }
    ring(c, zx, zy, rx, ry, P.rim2, 0.85, 3, 2);
    for (let i = 0; i < 8; i++) { const an = i * 0.785 + tm * 0.5, x = Math.round(zx + Math.cos(an) * (rx + 1)), y = Math.round(zy + Math.sin(an) * (ry + 1)); c.fillStyle = i % 2 ? P.rim : P.rim2; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 1); }
    const sr = rng((((tm * 5) | 0) * 29 + z.x) | 0); c.fillStyle = '#f4ffd0'; for (let j = 0; j < 4; j++) c.fillRect(zx + ((sr() * 2 - 1) * rx * 0.8 | 0), zy + ((sr() * 2 - 1) * ry * 0.8 | 0) - ((tm * 8 + j * 3) % 5 | 0), 1, 1);
  } else {   // glace
    ell(c, zx, zy, rx, ry, P.deep, 0.7); ell(c, zx, zy, rx * k, ry * k, P.fill, 0.36, 1);
    const g = 0.25 + 0.75 * k;
    for (let i = 0; i < 6; i++) {
      const an = i * 1.0472 + 0.2, L = rx * 0.92 * g, ex = zx + Math.cos(an) * L, ey = zy + Math.sin(an) * L; line(c, zx, zy, ex, ey, P.rim, 0.95);
      for (const f of [0.45, 0.72]) { const bx = zx + Math.cos(an) * L * f, by = zy + Math.sin(an) * L * f; for (const s of [-1, 1]) line(c, bx, by, bx + Math.cos(an + s * 0.9) * L * 0.22, by + Math.sin(an + s * 0.9) * L * 0.22, P.rim2, 0.9); }
    }
    ring(c, zx, zy, rx, ry, P.rim2, 0.8, 3, 2); c.fillStyle = '#fff'; c.globalAlpha = 0.9;
    for (let i = 0; i < 12; i++) { const an = i * 0.5236; c.fillRect(Math.round(zx + Math.cos(an) * (rx + 1)), Math.round(zy + Math.sin(an) * (ry + 1)) - 1, 1, 2); } c.globalAlpha = 1;
    const sr = rng((((tm * 6) | 0) * 17 + z.x) | 0); c.fillStyle = '#fff'; for (let j = 0; j < 3; j++) c.fillRect(zx + ((sr() * 2 - 1) * rx * 0.8 | 0), zy + ((sr() * 2 - 1) * ry * 0.8 | 0), 1, 1);
  }
  if (k > 0.88 && ((T * 30) | 0) % 2 === 0) ell(c, zx, zy, rx, ry, '#fff', 0.38, 1);   // éclat blanc juste avant l'impact
  // petit sprite de charge au centre, qui apparaît à mi-chemin
  const a = Math.max(0, (k - 0.5) / 0.4); if (a <= 0) return; const al = Math.min(1, a);
  if (st === 'water') frame(c, 'whirlpool', ((tm * 8) | 0) % 3, zx, zy + 3, 1, al, 0.6);
  else if (st === 'fire') frame(c, 'earthpower', ((tm * 10) | 0) % 3, zx, zy + 4, 0.55, al, 0.75);
  else if (st === 'elec') frame(c, 'thunderbolt', ((tm * 14) | 0) % 2, zx, zy - 2, 0.5, al, 0.5);
  else if (st === 'psy' || st === 'mew') frame(c, 'extrasensory', ((tm * 14) | 0) % 3, zx, zy - 2, 0.45, al, 0.5);
  else if (st === 'grass') frame(c, 'vinewhip', ((tm * 8) | 0) % 2, zx, zy - 1, 0.9, al, 0.5);
  else frame(c, 'frostbone', ((tm * 10) | 0) % 3, zx, zy - 2, 0.4, al, 0.5);
}

// ---------------------------------------------------------------- trace après l'impact (plus terne que le télégraphe : ce n'est plus une zone active)
function stain(c, st, z, tt) {
  if (tt > ZLING) return; const P = palOf(st), f = 1 - tt / ZLING, rx = z.r + 2, ry = rx, zx = Math.round(z.x), zy = Math.round(z.y);
  if (st === 'water') { ell(c, zx, zy, rx, ry, P.deep, 0.5 * f, 1); const ph = (tt * 0.8) % 1; ring(c, zx, zy, rx * (0.4 + ph * 0.6), ry * (0.4 + ph * 0.6), P.rim2, 0.5 * f * (1 - ph)); }
  else if (st === 'fire') {
    ell(c, zx, zy, rx, ry, '#0d0807', 0.7 * f); ell(c, zx, zy, rx - 4, ry - 4, '#1c0f0a', 0.5 * f, 1); const sr = rng((z.x * 3 + z.y) | 0);
    for (let i = 0; i < 5; i++) { c.fillStyle = '#ff8a30'; c.globalAlpha = f * (0.4 + 0.6 * ((Math.sin(tt * 9 + i * 2) + 1) / 2)); c.fillRect(Math.round(zx + (sr() - 0.5) * rx * 1.4), Math.round(zy + (sr() - 0.5) * ry * 1.4 - tt * 4 % 3), 1, 1); } c.globalAlpha = 1;
  } else if (st === 'elec') { ell(c, zx, zy, rx, ry, '#0a0c10', 0.7 * f); const sr = rng((z.x * 5 + z.y) | 0); for (let i = 0; i < 5; i++) { const an = sr() * 6.28; line(c, zx, zy, zx + Math.cos(an) * rx * 0.85, zy + Math.sin(an) * ry * 0.85, '#8a7a30', 0.7 * f); } }
  else if (st === 'grass') { ell(c, zx, zy, rx, ry, '#0a1a0f', 0.55 * f, 1); const sr = rng((z.x * 7 + z.y) | 0); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#7fe08a' : '#4fb868'; c.globalAlpha = f; c.fillRect(zx + ((sr() * 2 - 1) * rx * 0.8 | 0), zy + ((sr() * 2 - 1) * ry * 0.8 | 0), 2, 1); } c.globalAlpha = 1; }
  else if (st === 'psy' || st === 'mew') { ell(c, zx, zy, rx, ry, '#120a1a', 0.5 * f, 1); ring(c, zx, zy, rx * 0.8, ry * 0.8, P.rim2, 0.4 * f, 2, 1); }
  else { ell(c, zx, zy, rx, ry, '#cfeaff', 0.28 * f, 1); const sr = rng((z.x * 9 + z.y + ((tt * 6) | 0)) | 0); c.fillStyle = '#fff'; c.globalAlpha = f; for (let i = 0; i < 4; i++) c.fillRect(zx + ((sr() * 2 - 1) * rx * 0.8 | 0), zy + ((sr() * 2 - 1) * ry * 0.8 | 0), 1, 1); c.globalAlpha = 1; }
}

// Dessine une zone au sol ; renvoie false si le boss n'a pas de style (l'ancien disque rouge s'en charge).
export function drawZoneGround(ctx, g, z) {
  const st = zoneStyle(z); if (!st) return false;
  ctx.save();
  if (z.t < z.delay) tele(ctx, st, z, Math.min(1, z.t / z.delay), g.t); else stain(ctx, st, z, z.t - z.delay);
  ctx.restore(); return true;
}

// À l'impact : sprites PMD (Game.fx) à la place des éclats de couleur unie.
export function zoneImpactFx(g, z) {
  const st = zoneStyle(z); if (!st) return false;
  for (const [key, A, dy, gr, dur] of IMPACT[st === 'mew' ? 'psy' : st]) {
    const m = FXS.man[key]; if (!m) continue;
    const h = m.fh * A;   // g.fx pose la frame centrée sur (x, y - z) : on remonte le point d'ancrage voulu
    g.fx(key, z.x, z.y, { scale: A / pxScale(m), z: -(dy + h * (0.5 - gr)), dur });
  }
  return true;
}

// ---------------------------------------------------------------- télégraphes de forme (secteur, ligne, onde, mur…)
// Même DA que les zones rondes : motif pixel-art de l'élément + liseré à la couleur du boss, au lieu d'un aplat rouge.
const TILES = {};
function tile(st) {
  if (TILES[st]) return TILES[st];
  const S = 12, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), P = palOf(st), R = rng(st.length * 977 + st.charCodeAt(0));
  const px = (x, y, col, a = 1) => { c.globalAlpha = a; c.fillStyle = col; c.fillRect(((x % S) + S) % S, ((y % S) + S) % S, 1, 1); };
  c.fillStyle = P.deep; c.globalAlpha = 0.85; c.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (((x + y) & 1) === 0) px(x, y, P.fill, 0.38);
  if (st === 'water') { for (let x = 0; x < S; x++) { px(x, 3 + Math.round(Math.sin(x / S * 6.28)), P.rim, 0.9); px(x, 9 + Math.round(Math.sin(x / S * 6.28 + 2)), P.rim2, 0.8); } }
  else if (st === 'fire') { let x = 1, y = 0; for (let i = 0; i < S; i++) { px(x, y, P.rim, 0.95); y++; x += R() < 0.5 ? 1 : -1; if (i % 4 === 3) px(x + 1, y, P.rim2, 0.9); } px(8, 9, P.rim, 1); px(9, 9, P.rim2, 1); }
  else if (st === 'elec') { let x = 6; for (let y = 0; y < S; y++) { px(x, y, P.rim, 1); x += (y & 1) ? 2 : -2; px(x, y, P.rim2, 0.7); } }
  else if (st === 'grass') { for (let i = 0; i < 5; i++) { px(2 + i, 2 + i, P.rim, 0.95); px(8 - i / 2 | 0, 11 - i, P.rim2, 0.85); } px(9, 3, P.rim, 1); }
  else if (st === 'ice') { for (let i = 0; i < S; i++) { px(i, i, P.rim, 0.9); px(S - 1 - i, i, P.rim2, 0.55); } px(6, 6, '#fff', 1); }
  else { for (const [x, y] of [[3, 3], [9, 3], [3, 9], [9, 9]]) { px(x, y, P.rim, 1); px(x + 1, y, P.rim2, 1); px(x, y + 1, P.rim2, 1); } px(6, 6, P.rim, 1); }
  c.globalAlpha = 1; return (TILES[st] = cv);
}
const patOf = (ctx, st) => { const key = '_pat_' + st; return ctx[key] || (ctx[key] = ctx.createPattern(tile(st), 'repeat')); };
function shape(ctx, st, k, held, build) {
  const P = palOf(st), a = 0.5 + 0.3 * k;
  ctx.save(); build(); ctx.globalAlpha = a; ctx.fillStyle = patOf(ctx, st); ctx.fill();
  ctx.globalAlpha = held ? 1 : 0.7 + 0.3 * k; ctx.strokeStyle = P.rim2; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = P.rim; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -performance.now() / 60; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}
function band(ctx, x0, y0, x1, y1, hw) { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * hw, ny = dx / l * hw; ctx.beginPath(); ctx.moveTo(x0 + nx, y0 + ny); ctx.lineTo(x1 + nx, y1 + ny); ctx.lineTo(x1 - nx, y1 - ny); ctx.lineTo(x0 - nx, y0 - ny); ctx.closePath(); }
// renvoie true si le télégraphe de ce boss est dessiné ici (sinon l'ancien rendu rouge prend le relais)
export function bossTele(ctx, g, e, k) {
  const st = ZSTYLE[e.sprite]; if (!st) return false; const T = e.atkType, held = !!e.held;
  if ((T === 'dash' || T === 'beam') && e.lockDir) { const L = T === 'beam' ? 260 : 150; shape(ctx, st, k, held, () => band(ctx, e.x, e.y, e.x + e.lockDir.x * L, e.y + e.lockDir.y * L, T === 'beam' ? 5 : 8)); return true; }
  if (T === 'swing' || T === 'feint') { const an = Math.atan2(e.face.y, e.face.x); shape(ctx, st, k, held, () => { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 30 + e.r * 1.5, an - 1.57, an + 1.57); ctx.closePath(); }); return true; }
  if (T === 'tide') { const an = Math.atan2(e.face.y, e.face.x), aw = 0.96, p = held ? 1 : Math.max(0, Math.min(1, 1 - e.st / 1.3)), R = 40 + 175 * p; shape(ctx, st, k, held, () => { ctx.beginPath(); ctx.arc(e.x, e.y, R, an - aw, an + aw); ctx.arc(e.x, e.y, 40, an + aw, an - aw, true); ctx.closePath(); }); return true; }
  if (T === 'wall') { const u = e.face, px = -u.y, py = u.x, hw = 130; shape(ctx, st, k, held, () => band(ctx, e.x + u.x * 30 + px * hw, e.y + u.y * 30 + py * hw, e.x + u.x * 30 - px * hw, e.y + u.y * 30 - py * hw, 6)); return true; }
  if (T === 'nova' || T === 'pulse') { const R = Math.max(2, 14 + 22 * (1 - Math.min(1, e.st)) + (T === 'pulse' ? 6 : 0)); shape(ctx, st, k, held, () => { ctx.beginPath(); ctx.arc(e.x, e.y, R, 0, 7); }); return true; }
  return false;
}
