// Monde 4 : Le Laboratoire oublié. Carte à tuiles (24 px), zones Lisière / Cœur / Approche / Sanctuaire.
export const TS = 24, MW = 124, MH = 60, DY = 4, FACE = 10;
export const T = { VOID: 0, FLOOR: 1, DOOR: 2, FOG: 3, SOLID: 4 };

// [id, x, y, w, h, zone, nom de salle] (y avant décalage DY)
const ROOMS = [
  ['R0', 3, 38, 12, 9, 'Lisière', "Hall d'entrée"],
  ['C0', 15, 41, 9, 3, 'Lisière', null],
  ['R1', 24, 36, 11, 12, 'Lisière', "Salle d'observation"],
  ['C1', 28, 29, 3, 7, 'Cœur', null],
  ['R2', 20, 12, 30, 17, 'Cœur', 'Salle des cuves'],
  ['C2v', 9, 26, 3, 12, 'Cœur', null],
  ['C2h', 12, 26, 8, 3, 'Cœur', null],
  ['C3', 50, 19, 4, 3, 'Cœur', null],
  ['R3', 54, 15, 9, 10, 'Cœur', 'Salle de contrôle'],
  ['C5', 33, 8, 3, 4, 'Cœur', null],
  ['R4', 28, 0, 14, 8, 'Cœur', 'Chambre de clonage'],
  ['C4', 63, 18, 8, 3, 'Approche', null],
  ['R5', 71, 10, 16, 18, 'Approche', 'Galerie des miroirs'],
  ['C6', 87, 17, 4, 3, 'Approche', null],
  ['R7', 91, 12, 9, 10, 'Approche', 'Antichambre'],
  ['C7', 100, 16, 3, 3, 'Sanctuaire', null],
];
const ARENA = { cx: 113, cy: 17 + DY, r: 10 };
const DOOR_TILES = [[9, 31], [10, 31], [11, 31]]; // raccourci : s'ouvre depuis le côté nord (Cœur)
const FOG_TILES = [[101, 16], [101, 17], [101, 18]];
const DECOR_DEFS = [
  ['tank', 26, 15], ['tank', 26, 23], ['tank', 32, 19], ['tank', 38, 15], ['tank', 38, 23], ['tank', 44, 19],
  ['pillar', 27, 39], ['pillar', 32, 39], ['pillar', 27, 45], ['pillar', 32, 45],
  ['pillar', 6, 40], ['pillar', 12, 40], ['pillar', 6, 45], ['pillar', 12, 45],
  ['mirror', 75, 14], ['mirror', 75, 22], ['mirror', 82, 14], ['mirror', 82, 22], ['mirror', 79, 18],
  ['console', 57, 17], ['console', 59, 22],
  ['tankbroken', 31, 3], ['tankbroken', 37, 3], ['pillar', 29, 6], ['pillar', 40, 6],
  ['pillar', 93, 14], ['pillar', 98, 14], ['pillar', 93, 20], ['pillar', 98, 20],
];
const FOOT = { tank: [2, 2], tankbroken: [2, 2], pillar: [1, 1], mirror: [1, 1], console: [2, 1] };

export const BONFIRES = [
  { id: 'b1', name: "Hall d'entrée", tx: 8, ty: 42 + DY },
  { id: 'b2', name: 'Salle de contrôle', tx: 58, ty: 20 + DY },
  { id: 'b3', name: 'Antichambre', tx: 95, ty: 17 + DY },
];
export const START = { tx: 8, ty: 44 + DY };

// Ennemis : [type, tx, ty] (y avant DY)
export const SPAWNS = [
  ['magnemite', 28, 41], ['magnemite', 32, 44], ['koffing', 30, 38],
  ['koffing', 28, 18], ['koffing', 41, 21], ['koffing', 34, 27], ['voltorb', 24, 20], ['voltorb', 46, 25], ['voltorb', 31, 13], ['magnemite', 45, 14],
  ['koffing', 57, 21], ['koffing', 60, 17],
  ['electrode', 35, 4],
  ['porygon', 77, 18], ['porygon', 83, 19], ['magnemite', 79, 12], ['magnemite', 84, 25], ['magnemite', 73, 25], ['koffing', 80, 22],
];
export const BOSS_SPAWN = { tx: ARENA.cx, ty: ARENA.cy };

export function buildWorld() {
  const grid = new Uint8Array(MW * MH);
  const roomOf = new Int16Array(MW * MH).fill(-1);
  ROOMS.forEach((r, i) => {
    for (let y = r[2] + DY; y < r[2] + DY + r[4]; y++) for (let x = r[1]; x < r[1] + r[3]; x++) { grid[y * MW + x] = T.FLOOR; if (roomOf[y * MW + x] < 0 || r[6]) roomOf[y * MW + x] = i; }
  });
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const dx = x + 0.5 - ARENA.cx, dy = y + 0.5 - ARENA.cy;
    if (dx * dx + dy * dy <= ARENA.r * ARENA.r) { grid[y * MW + x] = T.FLOOR; roomOf[y * MW + x] = 100; }
  }
  const decor = [];
  for (const [kind, x, y0] of DECOR_DEFS) {
    const y = y0 + DY, [w, h] = FOOT[kind];
    const d = { kind, tx: x, ty: y, w, h, seed: (x * 31 + y * 17) % 97 };
    decor.push(d);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) grid[(y + j) * MW + x + i] = T.SOLID;
  }
  for (const [x, y] of DOOR_TILES) grid[(y + DY) * MW + x] = T.DOOR;
  for (const [x, y] of FOG_TILES) grid[(y + DY) * MW + x] = T.FOG;
  // masque de murs : vide adjacent (8 voisins) à du sol
  const wall = new Uint8Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (grid[y * MW + x] !== T.VOID) continue;
    let near = false;
    for (let j = -1; j <= 1 && !near; j++) for (let i = -1; i <= 1; i++) { const nx = x + i, ny = y + j; if (nx >= 0 && ny >= 0 && nx < MW && ny < MH && grid[ny * MW + nx] !== T.VOID) { near = true; break; } }
    wall[y * MW + x] = near ? 1 : 0;
  }
  return { grid, wall, roomOf, decor, doorTiles: DOOR_TILES.map(([x, y]) => [x, y + DY]), fogTiles: FOG_TILES.map(([x, y]) => [x, y + DY]), arena: ARENA };
}

export function zoneAt(world, px, py) {
  const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return null;
  const ri = world.roomOf[ty * MW + tx];
  if (ri === 100) return { zone: 'Sanctuaire', area: 'Sanctuaire de Mewtwo' };
  if (ri < 0) return null;
  const r = ROOMS[ri];
  return { zone: r[5], area: r[6] };
}
export function inArena(world, px, py) {
  const dx = px / TS - world.arena.cx, dy = py / TS - world.arena.cy; return dx * dx + dy * dy <= world.arena.r * world.arena.r;
}

const rnd = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

function isSolidTile(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true;
  const g = world.grid[ty * MW + tx];
  return g === T.VOID || g === T.SOLID || g === T.DOOR || g === T.FOG;
}
// Collision d'un point (en pixels), y compris la face avant des murs
export function solidAt(world, px, py) {
  const tx = Math.floor(px / TS), ty = Math.floor(py / TS);
  if (isSolidTile(world, tx, ty)) return true;
  const ly = py - ty * TS;
  if (ly < FACE && ty > 0 && world.grid[(ty - 1) * MW + tx] === T.VOID) return true;
  return false;
}
export function boxFree(world, x, y, hw, hh) {
  return !(solidAt(world, x - hw, y - hh) || solidAt(world, x + hw, y - hh) || solidAt(world, x - hw, y + hh) || solidAt(world, x + hw, y + hh));
}
export function lineClear(world, x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8);
  for (let i = 1; i < n; i++) { const t = i / n; if (solidAt(world, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; }
  return true;
}

// --- rendu du sol (mis en cache) ---
export function bakeFloor(world, state) {
  const c = document.createElement('canvas'); c.width = MW * TS; c.height = MH * TS;
  const g = c.getContext('2d');
  g.fillStyle = '#05060c'; g.fillRect(0, 0, c.width, c.height);
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const v = world.grid[ty * MW + tx];
    if (v === T.VOID) continue;
    const x = tx * TS, y = ty * TS, r = rnd(tx, ty);
    const inA = world.roomOf[ty * MW + tx] === 100;
    const ri = world.roomOf[ty * MW + tx];
    const lab = ri >= 0 && ri < 100 && (ROOMS[ri][0] === 'R2' || ROOMS[ri][0] === 'R4');
    const base = inA ? [38, 30, 62] : lab ? [28, 40, 58] : [34, 40, 62];
    const k = ((tx + ty) & 1) ? 6 : 0;
    g.fillStyle = `rgb(${base[0] + k + r * 6 | 0},${base[1] + k + r * 6 | 0},${base[2] + k + r * 8 | 0})`;
    g.fillRect(x, y, TS, TS);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, y + TS - 1, TS, 1); g.fillRect(x + TS - 1, y, 1, TS);
    g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x, y, TS, 1); g.fillRect(x, y, 1, TS);
    if (r > 0.82) { g.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 3; i < TS - 3; i += 4) g.fillRect(x + 4, y + i, TS - 8, 1); } // grille
    if (r < 0.14) { // circuit
      g.strokeStyle = inA ? 'rgba(190,120,255,.55)' : 'rgba(80,220,200,.45)'; g.lineWidth = 1; g.beginPath();
      const a = 4 + (r * 100 % 12) | 0; g.moveTo(x, y + a); g.lineTo(x + 10, y + a); g.lineTo(x + 10, y + 16); g.lineTo(x + TS, y + 16); g.stroke();
      g.fillStyle = inA ? '#d0a0ff' : '#6cf0e0'; g.fillRect(x + 9, y + a - 1, 3, 3);
    }
    if (r > 0.6 && r < 0.64) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x + 6, y + 8, 10, 6); g.fillStyle = 'rgba(200,160,255,.2)'; g.fillRect(x + 7, y + 9, 3, 2); } // tache
  }
  // anneaux de l'arène
  const A = world.arena; g.save(); g.translate(A.cx * TS, A.cy * TS);
  for (const [rad, col, lw] of [[A.r * TS - 6, 'rgba(200,140,255,.55)', 2], [A.r * TS * 0.62, 'rgba(200,140,255,.35)', 1], [A.r * TS * 0.3, 'rgba(120,230,230,.4)', 1]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, rad, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = 'rgba(200,140,255,.25)'; g.lineWidth = 1;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(Math.cos(a) * A.r * TS * 0.3, Math.sin(a) * A.r * TS * 0.3); g.lineTo(Math.cos(a) * (A.r * TS - 6), Math.sin(a) * (A.r * TS - 6)); g.stroke(); }
  g.restore();
  // ombres au pied des murs
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    if (world.grid[ty * MW + tx] === T.VOID) continue;
    const x = tx * TS, y = ty * TS;
    const up = ty > 0 && world.grid[(ty - 1) * MW + tx] === T.VOID;
    if (up) { const gr = g.createLinearGradient(0, y, 0, y + 18); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, TS, 18); }
    const lf = tx > 0 && world.grid[ty * MW + tx - 1] === T.VOID, rt = tx < MW - 1 && world.grid[ty * MW + tx + 1] === T.VOID, dn = ty < MH - 1 && world.grid[(ty + 1) * MW + tx] === T.VOID;
    if (lf) { const gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, 8, TS); }
    if (rt) { const gr = g.createLinearGradient(x + TS, 0, x + TS - 8, 0); gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + TS - 8, y, 8, TS); }
    if (dn) { const gr = g.createLinearGradient(0, y + TS, 0, y + TS - 8); gr.addColorStop(0, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y + TS - 8, TS, 8); }
  }
  return c;
}

// --- murs (dessinés à chaque image, tuiles visibles seulement) ---
export function drawWalls(ctx, world, cam, w, h, time) {
  const x0 = Math.max(0, Math.floor(cam.x / TS) - 1), x1 = Math.min(MW - 1, Math.floor((cam.x + w) / TS) + 1);
  const y0 = Math.max(0, Math.floor(cam.y / TS) - 1), y1 = Math.min(MH - 1, Math.floor((cam.y + h) / TS) + 1);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const i = ty * MW + tx;
    if (!world.wall[i]) continue;
    const x = tx * TS, y = ty * TS, r = rnd(tx, ty, 3);
    ctx.fillStyle = r > 0.5 ? '#2c3452' : '#2a3150'; ctx.fillRect(x, y, TS, TS);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x, y, TS, 1);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + TS - 1, y, 1, TS); ctx.fillRect(x, y + TS - 1, TS, 1);
    if (r < 0.2) { ctx.fillStyle = 'rgba(80,220,200,.18)'; ctx.fillRect(x + 4, y + 10, TS - 8, 2); }
    // face avant : sur la tuile de sol au sud
    const south = ty < MH - 1 ? world.grid[(ty + 1) * MW + tx] : T.VOID;
    if (south !== T.VOID) {
      const fy = y + TS;
      ctx.fillStyle = '#1c2038'; ctx.fillRect(x, fy, TS, FACE);
      ctx.fillStyle = '#3a4468'; ctx.fillRect(x, fy, TS, 1);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, fy + FACE - 2, TS, 2);
      const rr = rnd(tx, ty, 9);
      if (rr < 0.28) { // hublot / voyant
        const on = ((time * 2 + rr * 10) | 0) % 5 !== 0;
        ctx.fillStyle = on ? (rr < 0.12 ? '#6cf0e0' : '#c690ff') : '#2a3050'; ctx.fillRect(x + 8, fy + 3, 8, 3);
      } else if (rr < 0.4) { ctx.fillStyle = '#10142a'; ctx.fillRect(x + 4, fy + 3, TS - 8, 1); ctx.fillRect(x + 4, fy + 6, TS - 8, 1); }
    }
  }
}

// --- décors (sprites procéduraux, triés par profondeur) ---
export function decorBaseline(d) { return (d.ty + d.h) * TS; }
export function drawDecor(ctx, d, time, st) {
  const x = d.tx * TS, base = (d.ty + d.h) * TS, w = d.w * TS;
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x + w / 2, base - 3, w * 0.5, 5, 0, 0, 7); ctx.fill();
  if (d.kind === 'tank' || d.kind === 'tankbroken') {
    const broken = d.kind === 'tankbroken';
    ctx.fillStyle = '#4a5578'; ctx.fillRect(x + 4, base - 10, w - 8, 8); ctx.fillStyle = '#6a7699'; ctx.fillRect(x + 4, base - 10, w - 8, 2);
    const gx = x + 8, gw = w - 16, gy = base - 62;
    ctx.fillStyle = broken ? '#10182a' : '#134a58'; ctx.fillRect(gx, gy, gw, 52);
    if (!broken) {
      const g = ctx.createLinearGradient(gx, 0, gx + gw, 0); g.addColorStop(0, '#1d8b9c'); g.addColorStop(0.35, '#7af2e4'); g.addColorStop(1, '#136a7a');
      ctx.fillStyle = g; ctx.fillRect(gx + 1, gy + 6, gw - 2, 46);
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(gx + 4, gy + 4, 2, 44);
      for (let i = 0; i < 4; i++) { const t = (time * 14 + i * 13 + d.seed) % 44; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(gx + 6 + (i * 9 + d.seed) % (gw - 12), gy + 50 - t, 2, 2); }
      ctx.fillStyle = 'rgba(40,120,140,.8)'; ctx.fillRect(gx, gy + 3, gw, 3);
    } else {
      ctx.strokeStyle = '#6a7699'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx + 6, gy); ctx.lineTo(gx + 14, gy + 20); ctx.lineTo(gx + 8, gy + 34); ctx.lineTo(gx + 20, gy + 52); ctx.stroke();
      ctx.fillStyle = 'rgba(122,242,228,.25)'; ctx.fillRect(gx + 2, gy + 44, gw - 4, 8);
    }
    ctx.fillStyle = '#6a7699'; ctx.fillRect(x + 6, gy - 5, w - 12, 6); ctx.fillStyle = '#8b97b8'; ctx.fillRect(x + 6, gy - 5, w - 12, 2);
    ctx.fillStyle = '#34405e'; ctx.fillRect(x + 20, gy - 12, 8, 8);
  } else if (d.kind === 'pillar') {
    ctx.fillStyle = '#5a6488'; ctx.fillRect(x + 3, base - 6, w - 6, 6);
    ctx.fillStyle = '#7e89ad'; ctx.fillRect(x + 6, base - 38, w - 12, 34); ctx.fillStyle = '#9aa5c6'; ctx.fillRect(x + 6, base - 38, 3, 34); ctx.fillStyle = '#4d5780'; ctx.fillRect(x + w - 10, base - 38, 4, 34);
    ctx.fillStyle = '#5a6488'; ctx.fillRect(x + 3, base - 42, w - 6, 6);
    const on = ((time * 1.5 + d.seed) | 0) % 6 !== 0; ctx.fillStyle = on ? '#c690ff' : '#3a3560'; ctx.fillRect(x + w / 2 - 1, base - 30, 2, 18);
  } else if (d.kind === 'mirror') {
    ctx.fillStyle = '#3d4668'; ctx.fillRect(x + 1, base - 50, w - 2, 46); ctx.fillStyle = '#8b97b8'; ctx.fillRect(x + 1, base - 50, w - 2, 2);
    const g = ctx.createLinearGradient(x, base - 48, x + w, base - 6); g.addColorStop(0, '#273a6a'); g.addColorStop(0.5, '#6b8cd8'); g.addColorStop(1, '#2b2f66');
    ctx.fillStyle = g; ctx.fillRect(x + 4, base - 46, w - 8, 38);
    const gl = ((time * 20 + d.seed * 7) % 80) - 20; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 4 + (gl > 0 && gl < w - 10 ? gl : -50), base - 46, 3, 38);
    ctx.fillStyle = '#4d5780'; ctx.fillRect(x + 6, base - 4, w - 12, 4);
  } else if (d.kind === 'console') {
    ctx.fillStyle = '#3d4668'; ctx.fillRect(x + 2, base - 14, w - 4, 12); ctx.fillStyle = '#6a7699'; ctx.fillRect(x + 2, base - 14, w - 4, 2);
    ctx.fillStyle = '#10142a'; ctx.fillRect(x + 6, base - 32, w - 12, 18); ctx.fillStyle = '#4dffa0'; for (let i = 0; i < 4; i++) ctx.fillRect(x + 9, base - 29 + i * 4, 6 + ((time * 6 + i * 3 + d.seed) | 0) % 18, 2);
  }
}
export function decorLight(d) {
  if (d.kind === 'tank') return { x: (d.tx + 1) * TS, y: (d.ty + 0.4) * TS, r: 62, c: [40, 190, 190] };
  if (d.kind === 'mirror') return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.2) * TS, r: 36, c: [80, 110, 220] };
  if (d.kind === 'console') return { x: (d.tx + 1) * TS, y: (d.ty + 0.2) * TS, r: 36, c: [50, 200, 120] };
  if (d.kind === 'pillar') return { x: (d.tx + 0.5) * TS, y: (d.ty + 0.2) * TS, r: 26, c: [120, 70, 190] };
  return null;
}
