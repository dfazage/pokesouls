// Monde HD-2D : sol, murs extrudés, portes, brume des portes de boss, abîme thématique (fond), décor lointain et particules d'ambiance.
import * as THREE from './vendor/three.module.min.js';
import * as M from './maps.js';
import * as S from './hd2d_shaders.js';

const { TS, MW, MH, FACE, T } = M;
export const DEPTH = 3.4, OPEN_DEPTH = 0.06, WATER_DEPTH = 0.42;
const floorDepth = cfg => cfg.water || cfg.banks ? WATER_DEPTH : cfg.open ? OPEN_DEPTH : DEPTH;           // profondeur de l'abîme sous le sol (en tuiles)
export const WALL_TALL = 1.8, WALL_LOW = 0.28, WALL_SIDE = 1.3, WALL_MID = 1.0;

// ---------- réglages par thème ----------
// type : variante du shader d'abîme ; fog : couleur de brume ; grade : étalonnage de l'image finale
export const HD = {
  lab: { type: 0, fog: [.045, .04, .09], fogD: .021, mist: .5, abyss: [[.015, .015, .05], [.11, .05, .22], [.55, .72, 1.]], prop: 'mono', propCol: [.22, .24, .38], emis: [.45, .85, 1.], light: [.95, .98, 1.1], bob: 1,
    part: { n: 240, size: 40, color: [.55, .8, 1.], vel: [0, .06, 0], sway: .6, box: [44, 12, 40] }, emisTint: [.6, .95, 1.2], emisK: 1.3,
    grade: { ts: [.93, .96, 1.07], th: [1.04, 1.02, 1.], sat: 1.1, con: 1.07, bloom: .5, vig: .42 } },
  ice: { type: 1, fog: [.07, .12, .22], fogD: .02, mist: .55, abyss: [[.02, .04, .11], [.07, .15, .3], [.35, .95, .85]], prop: 'spire', propCol: [.42, .6, .82], emis: [.5, .95, 1.], light: [.92, 1., 1.15], bob: 0,
    part: { n: 420, size: 34, color: [.9, .96, 1.], vel: [-.25, -.9, .1], sway: 1.4, box: [46, 14, 42] }, emisTint: [.8, 1., 1.2], emisK: 1.2,
    grade: { ts: [.92, .98, 1.1], th: [1.03, 1.02, 1.], sat: 1.08, con: 1.06, bloom: .5, vig: .4 } },
  plant: { type: 2, fog: [.05, .05, .08], fogD: .022, mist: .5, abyss: [[.03, .035, .05], [.1, .1, .14], [.25, .95, .95]], prop: 'tower', propCol: [.2, .2, .27], emis: [.35, .95, .95], light: [1., 1., 1.05], bob: 0,
    part: { n: 200, size: 30, color: [1., .9, .35], vel: [0, .15, 0], sway: 1.8, box: [44, 10, 40] }, emisTint: [1., .95, .55], emisK: 1.25,
    grade: { ts: [.97, .97, 1.02], th: [1.04, 1.03, .98], sat: 1.06, con: 1.07, bloom: .5, vig: .4 } },
  lava: { type: 3, fog: [.17, .045, .025], fogD: .02, mist: .65, abyss: [[.1, .015, .01], [.45, .08, .02], [1., .55, .12]], prop: 'column', propCol: [.16, .1, .1], emis: [1., .45, .1], light: [1.1, .98, .9], bob: 0,
    part: { n: 340, size: 36, color: [1., .55, .15], vel: [.15, .95, 0], sway: 1.3, box: [44, 14, 40] }, emisTint: [1.2, .8, .5], emisK: 1.6,
    grade: { ts: [1.02, .94, .9], th: [1.08, 1.02, .94], sat: 1.12, con: 1.08, bloom: .65, vig: .44 } },
  rock: { type: 4, fog: [.1, .08, .06], fogD: .021, mist: .5, abyss: [[.05, .04, .03], [.16, .12, .08], [.9, .65, .35]], prop: 'stalag', propCol: [.3, .24, .19], emis: [1., .7, .35], light: [1.05, 1., .94], bob: 0,
    part: { n: 260, size: 28, color: [.95, .8, .6], vel: [.35, .05, .1], sway: 1.2, box: [46, 10, 42] }, emisTint: [1.1, .85, .5], emisK: 1.2,
    grade: { ts: [.98, .96, .93], th: [1.06, 1.02, .96], sat: 1.06, con: 1.07, bloom: .45, vig: .42 } },
  bell: { type: 6, open: true, fog: [.2, .15, .18], fogD: .014, mist: .4, abyss: [[.2, .16, .12], [.3, .24, .17], [1., .8, .42]], prop: 'tree', propCol: [.1, .26, .12], emis: [1., .75, .3], light: [1.06, 1., .96], bob: 0,
    part: { n: 280, size: 32, color: [1., .85, .4], vel: [0, .28, 0], sway: 1.6, box: [44, 12, 40] }, emisTint: [1.15, .9, .55], emisK: 1.3,
    grade: { ts: [.95, .95, 1.05], th: [1.08, 1.02, .94], sat: 1.1, con: 1.08, bloom: .55, vig: .5 } },
  ember: { type: 3, open: true, banks: true, edge: 'ruin', fog: [.2, .1, .07], fogD: .016, mist: .5, abyss: [[.1, .015, .01], [.45, .08, .02], [1., .55, .12]], prop: 'tree', propCol: [.1, .26, .12], emis: [1., .5, .2], light: [1.1, .97, .9], bob: 0,
    roof: [[.07, .06, .06], [.17, .14, .13]], win: .9, walls: [[.2, .17, .15], [.28, .2, .15], [.15, .12, .1], [.3, .26, .22], [.24, .16, .12], [.34, .28, .24], [.18, .15, .14], [.12, .1, .09]],
    part: { n: 280, size: 30, color: [1., .55, .2], vel: [0, .5, 0], sway: 1.5, box: [44, 12, 40] }, emisTint: [1.25, .85, .5], emisK: 1.5,
    grade: { ts: [1.02, .95, .92], th: [1.1, 1.02, .92], sat: 1.12, con: 1.1, bloom: .62, vig: .45 } },
  mirror: { type: 7, open: true, water: true, edge: 'water', fog: [.52, .66, .74], fogD: .011, mist: .35, abyss: [[.13, .36, .44], [.3, .6, .66], [1., .82, .9]], prop: 'tree', propCol: [.1, .26, .12], emis: [1., .8, .85], light: [1.05, 1.03, 1.02], bob: 0,
    part: { n: 260, size: 34, color: [1., .78, .88], vel: [.25, -.22, 0], sway: 1.9, box: [44, 12, 40] }, emisTint: [1.1, 1.05, 1.0], emisK: 1.0,
    grade: { ts: [.96, 1., 1.05], th: [1.05, 1.03, 1.], sat: 1.1, con: 1.05, bloom: .6, vig: .34 } },
  storm: { type: 8, open: true, water: true, edge: 'water', fog: [.16, .2, .27], fogD: .017, mist: .5, abyss: [[.06, .11, .18], [.16, .26, .38], [.8, .9, 1.]], prop: 'tree', propCol: [.1, .26, .12], emis: [.8, .9, 1.], light: [.96, 1., 1.06], bob: 0,
    part: { n: 380, size: 26, color: [.8, .9, 1.], vel: [-.35, -1.5, 0], sway: .5, box: [44, 14, 40] }, emisTint: [1., 1.05, 1.15], emisK: 1.0,
    grade: { ts: [.92, .97, 1.06], th: [.98, 1.02, 1.04], sat: 1.05, con: 1.1, bloom: .5, vig: .46 } },
  ilex: { type: 9, open: true, edge: 'forest', fog: [.1, .18, .12], fogD: .016, mist: .45, abyss: [[.1, .22, .1], [.18, .34, .14], [1., .85, .45]], prop: 'tree', propCol: [.1, .3, .14], emis: [1., .9, .5], light: [1.02, 1.04, .96], bob: 0,
    trees: [[.1, .3, .14], [.08, .26, .13], [.12, .34, .15], [.5, .42, .12]],
    part: { n: 320, size: 34, color: [1., .9, .5], vel: [0, .22, 0], sway: 1.7, box: [44, 12, 40] }, emisTint: [1.1, 1.05, .8], emisK: 1.2,
    grade: { ts: [.95, 1.02, .98], th: [1.07, 1.04, .94], sat: 1.14, con: 1.07, bloom: .58, vig: .4 } },
  mystic: { type: 5, fog: [.03, .09, .09], fogD: .021, mist: .55, abyss: [[.01, .035, .04], [.05, .16, .15], [.55, 1., .85]], prop: 'tree', propCol: [.07, .22, .2], emis: [.6, 1., .85], light: [.95, 1.05, 1.02], bob: 0,
    part: { n: 360, size: 38, color: [.7, 1., .75], vel: [0, .22, 0], sway: 1.6, box: [44, 12, 40] }, emisTint: [1.1, 1., .9], emisK: .85,
    grade: { ts: [.92, 1.02, 1.], th: [1.02, 1.04, 1.], sat: 1.12, con: 1.07, bloom: .55, vig: .42 } },
};

const rndI = (a, b, c = 0) => { let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 2147483647)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const css = (c, k = 1, a = 1) => `rgba(${Math.max(0, Math.min(255, c[0] * k)) | 0},${Math.max(0, Math.min(255, c[1] * k)) | 0},${Math.max(0, Math.min(255, c[2] * k)) | 0},${a})`;

// ---------- textures des murs (24 px par tuile, comme le sol) ----------
const NV = 4;       // variantes
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function drawBricks(g, x0, vi, base, key) {
  const rows = [[0, 12, 0], [12, 12, 7]];
  for (const [y, h, off] of rows) {
    let x = -off, k = 0;
    while (x < TS) {
      const bw = 9 + Math.floor(rndI(vi, y, k) * 8);
      const jit = (rndI(vi, x + 99, y) - 0.5) * 18;
      const xs = Math.max(0, x), xe = Math.min(TS, x + bw);
      if (xe > xs) {
        g.fillStyle = css(base, 1, 1); g.fillStyle = `rgb(${(base[0] + jit) | 0},${(base[1] + jit) | 0},${(base[2] + jit * 1.2) | 0})`;
        g.fillRect(x0 + xs, y, xe - xs, h);
        g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(x0 + xs, y + 1, xe - xs, 1);        // arête haute
        g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(x0 + xs, y + h - 1, xe - xs, 1);           // joint bas
        g.fillStyle = 'rgba(0,0,0,.28)'; if (x >= 0) g.fillRect(x0 + x, y, 1, h);              // joint gauche
        if (rndI(vi, x, y + 7) > 0.7) { g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x0 + xs + 2, y + 3 + (k % 3) * 2, Math.max(2, xe - xs - 5), 2); }
      }
      x += bw; k++;
    }
  }
}

function sideDetails(g, ge, x0, vi, th, key) {
  const ac = th.accent, ac2 = th.accent2, r = k => rndI(vi, k, 5);
  if (key === 'lab') {
    if (vi === 1) { g.fillStyle = '#10142a'; g.fillRect(x0 + 4, 5, 16, 14); g.fillStyle = '#1c2240'; g.fillRect(x0 + 5, 6, 14, 12); ge.fillStyle = css(ac); ge.fillRect(x0 + 6, 11, 12, 2); g.fillStyle = css(ac); g.fillRect(x0 + 6, 11, 12, 2); }
    else if (vi === 2) { g.fillStyle = '#0c1020'; g.fillRect(x0 + 5, 5, 14, 14); for (let i = 0; i < 5; i++) { g.fillStyle = '#2c3452'; g.fillRect(x0 + 6, 7 + i * 2.6, 12, 1); } }
    else if (vi === 3) { for (let i = 0; i < 4; i++) { const c = i % 2 ? ac2 : ac; g.fillStyle = css(c); g.fillRect(x0 + 4 + i * 5, 10, 3, 3); ge.fillStyle = css(c); ge.fillRect(x0 + 4 + i * 5, 10, 3, 3); } }
  } else if (key === 'plant') {
    if (vi === 1) { const gr = g.createLinearGradient(0, 8, 0, 16); gr.addColorStop(0, '#9aa0b8'); gr.addColorStop(0.4, '#5c6078'); gr.addColorStop(1, '#2a2c3c'); g.fillStyle = gr; g.fillRect(x0, 8, TS, 8); g.fillStyle = '#c0c4d8'; for (let i = 0; i < 3; i++) g.fillRect(x0 + 3 + i * 8, 9, 2, 2); }
    else if (vi === 2) { for (let i = -4; i < 14; i++) { g.fillStyle = i % 2 ? '#e8c020' : '#201c10'; g.beginPath(); g.moveTo(x0 + 2 + i * 3, 17); g.lineTo(x0 + 5 + i * 3, 17); g.lineTo(x0 + 9 + i * 3, 21); g.lineTo(x0 + 6 + i * 3, 21); g.fill(); } g.fillStyle = '#10101c'; g.fillRect(x0 + 10, 5, 5, 5); g.fillStyle = '#ffd24a'; g.fillRect(x0 + 11, 6, 3, 3); ge.fillStyle = '#ffd24a'; ge.fillRect(x0 + 11, 6, 3, 3); }
    else if (vi === 3) { g.strokeStyle = '#14141e'; g.lineWidth = 1.5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x0, 6 + i * 5); g.bezierCurveTo(x0 + 8, 3 + i * 5, x0 + 16, 10 + i * 5, x0 + TS, 6 + i * 5); g.stroke(); } ge.strokeStyle = css(ac, 1, 0.8); ge.lineWidth = 1; ge.beginPath(); ge.moveTo(x0, 11); ge.bezierCurveTo(x0 + 8, 8, x0 + 16, 15, x0 + TS, 11); ge.stroke(); }
  } else if (key === 'ice') {
    for (let i = 0; i < 7; i++) { const x = x0 + 1 + r(i) * 22, y = 1 + r(i + 9) * 21; g.fillStyle = 'rgba(235,248,255,.5)'; g.fillRect(x, y, 2, 1); }
    if (vi === 1) { g.strokeStyle = 'rgba(225,245,255,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + 3, 2); g.lineTo(x0 + 9, 10); g.lineTo(x0 + 7, 16); g.lineTo(x0 + 15, 23); g.stroke(); ge.strokeStyle = 'rgba(120,230,255,.7)'; ge.beginPath(); ge.moveTo(x0 + 3, 2); ge.lineTo(x0 + 9, 10); ge.lineTo(x0 + 7, 16); ge.lineTo(x0 + 15, 23); ge.stroke(); }
    if (vi === 2) { g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(x0 + 12, 12, 8, 5, 0, 0, 7); g.fill(); }
    if (vi === 3) { g.fillStyle = 'rgba(190,235,255,.5)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x0 + 3 + i * 6, 0); g.lineTo(x0 + 6 + i * 6, 0); g.lineTo(x0 + 4.5 + i * 6, 6 + (i % 2) * 4); g.fill(); } }
  } else if (key === 'lava') {
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x0, 0, TS, TS);
    const cr = [[3, 1, 9, 8, 7, 14, 14, 23], [14, 0, 17, 9, 12, 15, 19, 24], [0, 10, 8, 13, 15, 12, 24, 17], [6, 0, 5, 7, 12, 9, 10, 24]][vi];
    const col = css(ac, 1, 1);
    for (const [gg, w, c] of [[g, 1.5, col], [ge, 2, css(ac2, 1, 1)]]) { gg.strokeStyle = c; gg.lineWidth = w; gg.beginPath(); gg.moveTo(x0 + cr[0], cr[1]); gg.lineTo(x0 + cr[2], cr[3]); gg.lineTo(x0 + cr[4], cr[5]); gg.lineTo(x0 + cr[6], cr[7]); gg.stroke(); }
  } else if (key === 'rock') {
    for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(${i % 2 ? '255,230,190' : '0,0,0'},.13)`; g.fillRect(x0, 3 + i * 8 + vi, TS, 2); }
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x0 + 2 + r(i) * 20, 2 + r(i + 4) * 20, 2, 2); }
  } else if (key === 'bell') {   // muret de pierre moussue ; poteaux de bois laqué et ex-voto
    g.fillStyle = 'rgba(86,128,64,.45)'; for (let i = 0; i < 2; i++) { g.beginPath(); g.ellipse(x0 + 4 + r(i) * 16, 21 - i * 2, 5, 3, 0, 0, 7); g.fill(); }
    if (vi === 1) { g.fillStyle = '#6a2a22'; g.fillRect(x0 + 8, 0, 8, TS); g.fillStyle = '#8a3a2c'; g.fillRect(x0 + 8, 0, 2, TS); g.fillStyle = '#2a1410'; g.fillRect(x0 + 6, 2, 12, 3); }
    else if (vi === 3) { g.fillStyle = '#c8a050'; g.fillRect(x0 + 10, 9, 4, 6); g.fillStyle = '#3a2418'; g.fillRect(x0 + 11, 7, 2, 2); ge.fillStyle = 'rgba(255,200,110,.5)'; ge.fillRect(x0 + 10, 9, 4, 6); }
  } else if (key === 'mystic') {
    g.fillStyle = 'rgba(70,170,110,.5)';
    for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x0 + 3 + r(i) * 18, 2 + (i * 7 + vi * 3) % 20, 4 + r(i + 3) * 3, 2.5, 0, 0, 7); g.fill(); }
    if (vi !== 0) { g.strokeStyle = 'rgba(50,130,80,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + 8 + vi * 2, 0); g.bezierCurveTo(x0 + 4, 8, x0 + 12, 14, x0 + 8, 24); g.stroke(); const c = vi % 2 ? ac2 : ac; g.fillStyle = css(c); ge.fillStyle = css(c); g.fillRect(x0 + 9, 12, 2, 2); ge.fillRect(x0 + 8, 11, 4, 4); }
  }
}

function drawDoorTile(g, ge, x0, th) {
  g.fillStyle = '#3c4568'; g.fillRect(x0, 0, TS, TS);
  g.fillStyle = '#4d5780'; g.fillRect(x0, 0, TS, 2); g.fillRect(x0, 0, 2, TS); g.fillRect(x0 + TS - 2, 0, 2, TS);
  g.fillStyle = '#232a4a'; g.fillRect(x0 + 3, 3, TS - 6, TS - 5);
  g.fillStyle = '#2f3860'; g.fillRect(x0 + 3, 3, TS - 6, 1);
  g.fillStyle = '#10142a'; g.fillRect(x0 + 3, TS - 3, TS - 6, 3);
  g.fillStyle = '#c690ff'; g.fillRect(x0 + 5, 11, TS - 10, 2); g.fillRect(x0 + 11, 5, 2, 14);
  ge.fillStyle = 'rgba(198,144,255,.6)'; ge.fillRect(x0 + 5, 11, TS - 10, 2); ge.fillRect(x0 + 11, 5, 2, 14);
}

export function makeWallTextures(th, key) {
  const A = hexRgb(th.wallA), B = hexRgb(th.wallB), F = hexRgb(th.face);
  const side = mkCanvas(TS * (NV + 1), TS), sideE = mkCanvas(TS * (NV + 1), TS);
  const top = mkCanvas(TS * NV, TS), topE = mkCanvas(TS * NV, TS);
  const g = side.getContext('2d'), ge = sideE.getContext('2d'); ge.fillStyle = '#000'; ge.fillRect(0, 0, side.width, side.height);
  const sideBase = A.map((v, i) => (v * 0.62 + F[i] * 0.38));
  for (let vi = 0; vi < NV; vi++) { drawBricks(g, vi * TS, vi, sideBase, key); sideDetails(g, ge, vi * TS, vi, th, key); }
  drawDoorTile(g, ge, NV * TS, th);
  const gt = top.getContext('2d'), gte = topE.getContext('2d'); gte.fillStyle = '#000'; gte.fillRect(0, 0, top.width, top.height);
  for (let vi = 0; vi < NV; vi++) {
    const x0 = vi * TS;
    gt.fillStyle = `rgb(${B[0]},${B[1]},${B[2]})`; gt.fillRect(x0, 0, TS, TS);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const k = (rndI(vi, i, j + 40) - 0.5) * 16, c = (i + j) % 2 ? A : B;
      gt.fillStyle = `rgb(${(c[0] + k) | 0},${(c[1] + k) | 0},${(c[2] + k * 1.2) | 0})`; gt.fillRect(x0 + i * 12, j * 12, 12, 12);
      gt.fillStyle = 'rgba(255,255,255,.09)'; gt.fillRect(x0 + i * 12, j * 12, 12, 1); gt.fillRect(x0 + i * 12, j * 12, 1, 12);
      gt.fillStyle = 'rgba(0,0,0,.3)'; gt.fillRect(x0 + i * 12 + 11, j * 12, 1, 12); gt.fillRect(x0 + i * 12, j * 12 + 11, 12, 1);
    }
    if (key === 'ice') { gt.fillStyle = 'rgba(240,250,255,.35)'; for (let i = 0; i < 6; i++) gt.fillRect(x0 + rndI(vi, i, 3) * 22, rndI(vi, i, 4) * 22, 2, 1); }
    if (key === 'lava') { gte.fillStyle = css(th.accent2); for (let i = 0; i < 2; i++) { const x = x0 + 3 + rndI(vi, i, 8) * 17, y = 3 + rndI(vi, i, 9) * 17; gte.fillRect(x, y, 2, 2); gt.fillStyle = css(th.accent2); gt.fillRect(x, y, 2, 2); } }
    if (key === 'mystic') { gt.fillStyle = 'rgba(70,180,110,.45)'; gt.beginPath(); gt.ellipse(x0 + 6 + vi * 3, 8 + vi * 2, 7, 5, 0, 0, 7); gt.fill(); }
    if (key === 'bell') { gt.fillStyle = 'rgba(86,128,64,.4)'; gt.beginPath(); gt.ellipse(x0 + 7 + vi * 3, 9 + vi * 2, 7, 4, 0, 0, 7); gt.fill(); gt.fillStyle = 'rgba(255,250,235,.1)'; gt.fillRect(x0, 0, TS, 2); }
    if (key === 'plant' && vi === 2) { gt.fillStyle = '#20202e'; gt.fillRect(x0 + 8, 8, 8, 8); gt.fillStyle = '#ffd24a'; gt.fillRect(x0 + 11, 11, 2, 2); gte.fillStyle = '#ffd24a'; gte.fillRect(x0 + 11, 11, 2, 2); }
    if (key === 'lab' && vi === 1) { gte.fillStyle = css(th.accent); gte.fillRect(x0 + 4, 11, 16, 2); gt.fillStyle = css(th.accent); gt.fillRect(x0 + 4, 11, 16, 2); }
  }
  return { side, sideE, top, topE };
}

// ---------- géométrie ----------
class GeoB {
  constructor() { this.p = []; this.n = []; this.u = []; this.i = []; }
  quad(a, b, c, d, n, ua, ub, uc, ud) {
    const base = this.p.length / 3;
    for (const v of [a, b, c, d]) { this.p.push(v[0], v[1], v[2]); this.n.push(n[0], n[1], n[2]); }
    this.u.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1], ud[0], ud[1]);
    this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setIndex(this.i);
    g.computeBoundingSphere();
    return g;
  }
}

const inB = (tx, ty) => tx >= 0 && ty >= 0 && tx < MW && ty < MH;
const gridAt = (w, tx, ty) => inB(tx, ty) ? w.grid[ty * MW + tx] : T.VOID;
const floorLike = (w, tx, ty) => gridAt(w, tx, ty) !== T.VOID;

export function wallHeight(w, tx, ty) {
  const S = floorLike(w, tx, ty + 1), N = floorLike(w, tx, ty - 1), E = floorLike(w, tx + 1, ty), Wd = floorLike(w, tx - 1, ty);
  if (w.theme && w.theme.open) return S ? 0.74 : N ? 0.36 : 0.52;   // thèmes de plein air : murets et balustrades, on voit par-dessus
  return S ? WALL_TALL : N ? WALL_LOW : (E || Wd) ? WALL_SIDE : WALL_MID;
}

export function buildGround(w) {
  const b = new GeoB();
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    if (w.grid[ty * MW + tx] === T.VOID) continue;
    const u0 = tx / MW, u1 = (tx + 1) / MW, v0 = ty / MH, v1 = (ty + 1) / MH;
    b.quad([tx, 0, ty], [tx, 0, ty + 1], [tx + 1, 0, ty + 1], [tx + 1, 0, ty], [0, 1, 0], [u0, v0], [u0, v1], [u1, v1], [u1, v0]);
  }
  return b.build();
}

// murs : une boîte par tuile de mur (hauteur selon la position par rapport au sol), faces cachées omises.
// Retourne deux géométries : dessus (atlas « top ») et parois (atlas « side »).
export function buildWalls(w) {
  const bt = new GeoB(), bs = new GeoB(), fz = FACE / TS;
  const wallH = (tx, ty) => (inB(tx, ty) && w.wall[ty * MW + tx] && w.grid[ty * MW + tx] === T.VOID) ? wallHeight(w, tx, ty) : null;
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    if (!w.wall[ty * MW + tx] || w.grid[ty * MW + tx] !== T.VOID) continue;
    const h = wallHeight(w, tx, ty), vi = Math.floor(rndI(tx, ty, 3) * NV);
    const S = floorLike(w, tx, ty + 1);
    const x0 = tx, x1 = tx + 1, z0 = ty, z1 = ty + 1 + (S ? fz : 0);
    const tu = k => (vi + k) / NV;
    bt.quad([x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0], [0, 1, 0], [tu(0), 0], [tu(0), z1 - z0], [tu(1), z1 - z0], [tu(1), 0]);
    const sideFace = (nx, nz, A, B2) => {
      const tn = [tx + nx, ty + nz], wh = wallH(tn[0], tn[1]);
      let base;
      if (wh !== null) { if (wh >= h) return; base = wh; }
      else if (floorLike(w, tn[0], tn[1])) base = 0;
      else base = -(w.theme && w.theme.open ? OPEN_DEPTH : DEPTH);
      const u0 = (vi + 0.02) / (NV + 1), u1 = (vi + 0.98) / (NV + 1);
      bs.quad([A[0], base, A[1]], [B2[0], base, B2[1]], [B2[0], h, B2[1]], [A[0], h, A[1]], [nx, 0, nz], [u0, -base], [u1, -base], [u1, -h], [u0, -h]);
    };
    sideFace(0, 1, [x0, z1], [x1, z1]);       // sud (vers la caméra)
    sideFace(0, -1, [x1, z0], [x0, z0]);      // nord
    sideFace(1, 0, [x1, z1], [x1, z0]);       // est
    sideFace(-1, 0, [x0, z0], [x0, z1]);      // ouest
  }
  return { top: bt.build(), side: bs.build() };
}

// rives des îles : parois verticales sous chaque bord de sol qui donne sur l'eau
export function buildBanks(w, depth) {
  const b = new GeoB();
  const u0 = (k) => (k + 0.02) / (NV + 1), u1 = (k) => (k + 0.98) / (NV + 1);
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const g0 = w.grid[ty * MW + tx]; if (g0 === T.VOID || g0 === T.DOOR) continue;
    const vi = Math.floor(rndI(tx, ty, 5) * NV), a = u0(vi), c = u1(vi);
    const face = (nx, nz, A, B2) => { if (gridAt(w, tx + nx, ty + nz) !== T.VOID) return; b.quad([A[0], -depth, A[1]], [B2[0], -depth, B2[1]], [B2[0], 0, B2[1]], [A[0], 0, A[1]], [nx, 0, nz], [a, depth], [c, depth], [c, 0], [a, 0]); };
    face(0, 1, [tx, ty + 1], [tx + 1, ty + 1]); face(0, -1, [tx + 1, ty], [tx, ty]); face(1, 0, [tx + 1, ty + 1], [tx + 1, ty]); face(-1, 0, [tx, ty], [tx, ty + 1]);
  }
  return b.build();
}

// portes de salle de boss (tuiles T.DOOR) : blocs pleins, faces texturées « porte »
export function buildDoors(w) {
  const bt = new GeoB(), bs = new GeoB(), vi = NV;
  for (const [tx, ty] of (w.door ? w.door.tiles : [])) {
    if (w.grid[ty * MW + tx] !== T.DOOR) continue;
    const h = WALL_TALL, x0 = tx, x1 = tx + 1, z0 = ty, z1 = ty + 1;
    bt.quad([x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0], [0, 1, 0], [0, 0], [0, 1], [1 / NV, 1], [1 / NV, 0]);
    const face = (nx, nz, A, B2) => {
      if (gridAt(w, tx + nx, ty + nz) === T.DOOR) return;
      const u0 = (vi + 0.02) / (NV + 1), u1 = (vi + 0.98) / (NV + 1);
      bs.quad([A[0], 0, A[1]], [B2[0], 0, B2[1]], [B2[0], h, B2[1]], [A[0], h, A[1]], [nx, 0, nz], [u0, 0], [u1, 0], [u1, -h], [u0, -h]);
    };
    face(0, 1, [x0, z1], [x1, z1]); face(0, -1, [x1, z0], [x0, z0]); face(1, 0, [x1, z1], [x1, z0]); face(-1, 0, [x0, z0], [x0, z1]);
  }
  return { top: bt.build(), side: bs.build() };
}

// brume des portes de boss : quads face caméra
export function buildMist(w, pitch) {
  const b = new GeoB(), up = [0, Math.cos(pitch), -Math.sin(pitch)], hw = 0.78, hh = 1.9;
  for (const [tx, ty] of (w.fog ? w.fog.tiles : [])) {
    if (w.grid[ty * MW + tx] !== T.FOG) continue;
    const cx = tx + 0.5, cz = ty + 0.5;
    const P = (sx, v) => [cx + sx * hw, v * hh * up[1], cz + v * hh * up[2]];
    b.quad(P(-1, 0), P(1, 0), P(1, 1), P(-1, 1), [0, Math.sin(pitch), Math.cos(pitch)], [0, 0], [1, 0], [1, 1], [0, 1]);
  }
  return b.build();
}

// ---------- décor lointain ----------
function geoCone(sides, h = 1) { const g = new THREE.ConeGeometry(1, h, sides, 1, false); g.translate(0, h / 2, 0); return g; }
function mergeGeos(list) {
  const pos = [], nor = [], idx = []; let off = 0;
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    const p = g.getAttribute('position'), n = g.getAttribute('normal');
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); idx.push(off + i); }
    off += p.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}
function propGeometry(kind) {
  if (kind === 'mono' || kind === 'tower') { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return g; }
  if (kind === 'spire') return geoCone(5);
  if (kind === 'stalag') return geoCone(6);
  if (kind === 'column') { const g = new THREE.CylinderGeometry(0.9, 1, 1, 6); g.translate(0, 0.5, 0); return g; }
  if (kind === 'edo') {   // maison de ville : corps (y 0→.5) + toit en croupe (y .5→1)
    const body = new THREE.BoxGeometry(1, 0.5, 1); body.translate(0, 0.25, 0);
    const roof = new THREE.CylinderGeometry(0.16, 0.8, 0.5, 4, 1); roof.rotateY(Math.PI / 4); roof.translate(0, 0.75, 0);
    return mergeGeos([body, roof]);
  }
  // arbre : tronc + trois cônes empilés
  const trunk = new THREE.CylinderGeometry(0.1, 0.14, 0.4, 6); trunk.translate(0, 0.2, 0);
  const c1 = new THREE.ConeGeometry(0.62, 0.42, 7); c1.translate(0, 0.38, 0);
  const c2 = new THREE.ConeGeometry(0.46, 0.4, 7); c2.translate(0, 0.62, 0);
  const c3 = new THREE.ConeGeometry(0.3, 0.38, 7); c3.translate(0, 0.84, 0);
  return mergeGeos([trunk, c1, c2, c3]);
}

const EDO_WALL = [[.78, .72, .58], [.7, .52, .32], [.4, .26, .16], [.74, .72, .66], [.58, .4, .24], [.8, .66, .46], [.5, .46, .4], [.34, .22, .14]];   // plâtre crème, ocre, bois sombre, torchis…

export function buildProps(w, key, seed, shared) {
  const cfg = HD[key], R = (() => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; })();
  const MG = 24;
  // distance (Tchebychev) au sol : on n'implante rien contre les murs
  const W2 = MW + 2 * MG, H2 = MH + 2 * MG, near = new Uint8Array(W2 * H2);
  const R_ = cfg.prop === 'tower' ? 7 : cfg.open ? 6 : 4;   // les tours restent loin de la zone jouable
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) if (w.grid[ty * MW + tx] !== T.VOID) {
    for (let j = -R_; j <= R_; j++) for (let i = -R_; i <= R_; i++) near[(ty + MG + j) * W2 + (tx + MG + i)] = 1;
  }
  const items = [], wallItems = [], target = Math.round(W2 * H2 / 34), forest = cfg.edge === 'forest', water = cfg.edge === 'water';
  if (cfg.open && cfg.edge !== 'water') {   // plein air : plus de murs, les limites sont des maisons, des ruines ou des arbres (la collision reste celle de la grille)
    const dist = new Uint8Array(MW * MH).fill(99);
    for (let i = 0; i < MW * MH; i++) if (w.grid[i] !== T.VOID) dist[i] = 0;
    for (let d = 1; d <= 6; d++) for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
      if (dist[ty * MW + tx] !== 99) continue;
      let hit = false;
      for (let j = -1; j <= 1 && !hit; j++) for (let i = -1; i <= 1; i++) { const x = tx + i, y = ty + j; if (inB(x, y) && dist[y * MW + x] === d - 1) { hit = true; break; } }
      if (hit) dist[ty * MW + tx] = d;
    }
    const floorAbove = (tx, ty) => { for (let j = 1; j <= 3; j++) for (let i = -1; i <= 1; i++) if (inB(tx + i, ty - j) && w.grid[(ty - j) * MW + tx + i] !== T.VOID) return true; return false; };
    const V = (tx, ty, k) => rndI(tx, ty, k + 11);
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
      const d = dist[ty * MW + tx]; if (d === 0 || d > 6) continue;
      if (w.chasm && w.chasm[ty * MW + tx]) continue;   // gouffre : on le laisse ouvert
      const low = floorAbove(tx, ty);   // côté sud d'une zone : haies basses, pour ne jamais cacher le joueur
      const put = (k, kind, px, pz) => {
        const a = V(tx, ty, k * 5 + 1), b = V(tx, ty, k * 5 + 2), c = V(tx, ty, k * 5 + 3), e = V(tx, ty, k * 5 + 4);
        if (forest) {   // sous-bois : buissons bas côté caméra, arbres plus hauts ailleurs
          let sx, sy;
          if (kind === 0) { sx = 1.5 + a * 0.7; sy = low ? 0.55 + b * 0.35 : 1.1 + b * 0.7; }
          else if (kind === 1) { sx = 1.4 + a * 0.9; sy = low ? 1.3 + b * 0.9 : 2.4 + b * 1.8; }
          else { sx = 1.6 + a * 1.0; sy = low ? 2.4 + b * 1.4 : 3.4 + b * 2.4; }
          items.push([tx + px + (kind === 0 ? V(tx, ty, k + 80) * 0.5 - 0.25 : 0), ty + pz, a, b, c, kind, sx, sy, e]); return;
        }
        if (kind === 0) { wallItems.push([tx + 0.5, ty + 0.5, a, b, c, 0, 1.02, low ? 0.78 + b * 0.12 : 1.0 + b * 0.5, e]); return; }   // muret en torchis coiffé de tuiles
        let sx, sy;   // maisons de ville : corps de plâtre et de bois, toit de tuiles
        if (kind === 1) { sx = 1.7 + a * 0.7; sy = low ? 1.7 + b * 0.5 : 2.6 + b * 1.0; }
        else { sx = 2.0 + a * 0.9; sy = low ? 2.6 + b * 0.8 : 3.4 + b * 1.6; }
        items.push([tx + px, ty + pz, a, b, c, kind, sx, sy, e]);
      };
      if (d === 1) { if (forest) for (let k = 0; k < 3; k++) put(k, 0, 0.15 + V(tx, ty, 40 + k) * 0.7, 0.15 + V(tx, ty, 50 + k) * 0.7); else put(0, 0, 0.5, 0.5); }
      else if (d === 2) put(0, low ? 0 : 1, 0.3 + V(tx, ty, 60) * 0.4, 0.3 + V(tx, ty, 61) * 0.4);
      else if (d <= 4) { if (V(tx, ty, 65) < 0.8) put(0, low && d === 3 ? 1 : 2, 0.2 + V(tx, ty, 66) * 0.6, 0.2 + V(tx, ty, 67) * 0.6); }
      else if (V(tx, ty, 68) < 0.5) put(0, 2, V(tx, ty, 69), V(tx, ty, 70));
    }
  }
  for (let k = 0; !water && k < target * 3 && items.length < target; k++) {
    const x = R() * W2, z = R() * H2, ix = Math.floor(x), iz = Math.floor(z);
    if (near[iz * W2 + ix]) continue;
    // distance minimale entre deux accessoires
    items.push([x - MG, z - MG, R(), R(), R()]);
  }
  if (!items.length) items.push([-300, -300, 0, 0, 0, 0, 0.01, 0.01, 0]);   // jamais de maillage vide (pas d'attribut de couleur sinon)
  const geo = propGeometry(cfg.open && !forest ? 'edo' : cfg.prop), n = items.length;
  const mat = new THREE.ShaderMaterial({
    vertexShader: S.PROP_VERT, fragmentShader: S.PROP_FRAG,
    uniforms: {
      uTime: shared.uTime, uFog: shared.uFog, uFogD: shared.uFogD, uMist: shared.uMist, uCam: shared.uCam,
      uRoofA: { value: new THREE.Vector3(...(cfg.roof ? cfg.roof[0] : [.1, .12, .16])) }, uRoofB: { value: new THREE.Vector3(...(cfg.roof ? cfg.roof[1] : [.24, .27, .33])) }, uWinT: { value: cfg.win || .7 },
      uType: { value: cfg.open ? (forest ? 8 : 6) : { mono: 0, spire: 1, tower: 2, column: 3, stalag: 4, tree: 5 }[cfg.prop] },
      uEmisCol: { value: new THREE.Vector3(...cfg.emis) }, uLightCol: { value: new THREE.Vector3(...cfg.light) }, uBob: { value: cfg.bob },
    },
  });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  items.forEach(([x, z, a, b2, c], i) => {
    let sx, sy, sz, y = -(cfg.open ? OPEN_DEPTH : DEPTH);
    if (items[i].length > 5) { sx = sz = items[i][6]; sy = items[i][7]; }
    else if (cfg.prop === 'mono') { sx = 0.5 + a * 0.8; sy = 1.5 + b2 * 4.5; sz = 0.5 + c * 0.8; y = -2 + a * 5.5; }
    else if (cfg.prop === 'tower') { sx = 0.9 + a * 1.4; sz = 0.9 + c * 1.4; sy = DEPTH + 0.2 + b2 * 1.3; }   // sommets entre le sol et ~1,5 tuile au-dessus : les tours ne cachent plus le jeu
    else if (cfg.prop === 'spire') { sx = sz = 0.5 + a * 0.9; sy = 5.5 + b2 * 7; }
    else if (cfg.prop === 'column') { sx = sz = 0.7 + a * 0.8; sy = 3.8 + b2 * 4.5; }
    else if (cfg.prop === 'stalag') { sx = sz = 0.7 + a * 1.1; sy = 5 + b2 * 6; }
    else if (cfg.open && forest) { sx = sz = 1.8 + a * 1.2; sy = 4 + b2 * 3; }
    else if (cfg.open) { sx = sz = 2.2 + a * 1.2; sy = 3.4 + b2 * 2.4; }   // toits lointains de la ville
    else { sx = sz = 1.5 + a * 1.2; sy = 6 + b2 * 5.5; }
    const rot = cfg.open ? Math.floor(c * 4) * Math.PI / 2 : c * 6.283;
    m4.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), new THREE.Vector3(sx, sy, sz));
    mesh.setMatrixAt(i, m4);
    const k = 0.75 + b2 * 0.5;
    const pc = cfg.open ? (forest ? (cfg.trees || [cfg.propCol])[Math.floor(c * 7.99) % (cfg.trees || [1]).length] : (cfg.walls || EDO_WALL)[Math.floor(c * 7.99) % (cfg.walls || EDO_WALL).length]) : cfg.propCol;
    col.setRGB(pc[0] * k, pc[1] * k, pc[2] * k); mesh.setColorAt(i, col);
  });
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  if (cfg.open && wallItems.length) {   // murets de torchis : boîte + chapeau de tuiles
    const wb = new THREE.BoxGeometry(1, 0.82, 1); wb.translate(0, 0.41, 0);
    const cap = new THREE.BoxGeometry(1.14, 0.18, 1.14); cap.translate(0, 0.91, 0);
    const wmat = mat.clone(); wmat.uniforms = { ...mat.uniforms, uType: { value: 7 } };
    const wm = new THREE.InstancedMesh(mergeGeos([wb, cap]), wmat, wallItems.length);
    wallItems.forEach(([x, z, a, b2, c, , sx, sy], i) => {
      m4.compose(new THREE.Vector3(x, -OPEN_DEPTH, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sx)); wm.setMatrixAt(i, m4);
      const pal = cfg.walls || EDO_WALL, pc = pal[Math.floor(c * 7.99) % pal.length], k = 0.8 + b2 * 0.4; col.setRGB(pc[0] * k, pc[1] * k, pc[2] * k); wm.setColorAt(i, col);
    });
    wm.instanceMatrix.needsUpdate = true; if (wm.instanceColor) wm.instanceColor.needsUpdate = true; wm.frustumCulled = false;
    mesh.add(wm);
  }
  return mesh;
}

// ---------- particules d'ambiance ----------
export function buildParticles(key, shared) {
  const P = HD[key].part, n = P.n, seed = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { seed[i * 4] = Math.random(); seed[i * 4 + 1] = Math.random(); seed[i * 4 + 2] = Math.random(); seed[i * 4 + 3] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    vertexShader: S.PART_VERT, fragmentShader: S.PART_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: shared.uTime, uScale: shared.uPointScale, uSize: { value: P.size }, uCenter: shared.uCenter, uBox: { value: new THREE.Vector3(...P.box) }, uVel: { value: new THREE.Vector3(...P.vel) }, uSway: { value: P.sway }, uColor: { value: new THREE.Vector3(...P.color) }, uAdd: { value: 1 } },
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 20;
  return pts;
}

// ---------- abîme ----------
export function buildAbyss(key, shared) {
  const cfg = HD[key], sz = 400;
  const geo = new THREE.PlaneGeometry(sz, sz); geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    vertexShader: S.ABYSS_VERT, fragmentShader: S.ABYSS_FRAG,
    uniforms: { uTime: shared.uTime, uFog: shared.uFog, uFogD: shared.uFogD, uMist: { value: 0 }, uCam: shared.uCam, uType: { value: cfg.type }, uCol1: { value: new THREE.Vector3(...cfg.abyss[0]) }, uCol2: { value: new THREE.Vector3(...cfg.abyss[1]) }, uCol3: { value: new THREE.Vector3(...cfg.abyss[2]) } },
  });
  const m = new THREE.Mesh(geo, mat); m.position.set(MW / 2, -floorDepth(cfg), MH / 2); m.frustumCulled = false;
  return m;
}

export function canvasTex(c, opts = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace; t.flipY = false; t.generateMipmaps = false;
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = opts.repeatY ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.premultiplyAlpha = false;
  return t;
}

export function terrainMaterial(shared, tex, texSize, emisTex, emisSize, mode, extra = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: S.TERRAIN_VERT, fragmentShader: S.TERRAIN_FRAG, side: THREE.DoubleSide,
    uniforms: {
      uMap: { value: tex }, uMapSize: { value: new THREE.Vector2(texSize[0], texSize[1]) },
      uEmis: { value: emisTex }, uEmisSize: { value: new THREE.Vector2(emisSize[0], emisSize[1]) },
      uLight: shared.uLight, uOvN: shared.uOvN, uOvA: shared.uOvA, uReg: shared.uReg,
      uTime: shared.uTime, uGain: shared.uGain, uMode: { value: mode }, uEmisK: { value: extra.emisK ?? 1 }, uPulse: { value: extra.pulse ?? 0 }, uTopY: { value: WALL_TALL },
      uEmisTint: { value: new THREE.Vector3(...(extra.tint || [1, 1, 1])) },
      uFog: shared.uFog, uFogD: shared.uFogD, uMist: shared.uMist, uCam: shared.uCam,
      uPl: shared.uPl, uPlP: shared.uPlP, uCamF: shared.uCamF, uResS: shared.uResS, uCut: shared.uCut,
    },
  });
}

export function mistMaterial(shared, color) {
  return new THREE.ShaderMaterial({
    vertexShader: S.MIST_VERT, fragmentShader: S.MIST_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: shared.uTime, uColor: { value: new THREE.Vector3(...color) }, uFog: shared.uFog, uFogD: shared.uFogD, uMist: { value: 0 }, uCam: shared.uCam },
  });
}

export const THEME_KEY = th => { for (const k of Object.keys(M.THEMES)) if (M.THEMES[k] === th) return k; return 'lab'; };
