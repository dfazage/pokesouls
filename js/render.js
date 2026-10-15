// Rendu : sol, murs, entités triées en profondeur, effets, éclairage HD-2D (ambiance multiplicative + lueurs additives).
import { MARKS } from './elements.js';
import { TICK, A, drawSprite, dirFromVec } from './assets.js';
import * as M from './maps.js';
import { W, H } from './game.js';
import * as D from './data.js';
import { drawFxs, fxLights } from './fx.js';

const { TS } = M;
let lightC = null;
function lightCtx() { if (!lightC) { lightC = document.createElement('canvas'); lightC.width = W; lightC.height = H; } return lightC.getContext('2d'); }

let shadowSink = null;
export function setShadowSink(fn) { shadowSink = fn; }
function shadow(ctx, x, y, rx, a = 0.4) { if (shadowSink) { shadowSink(x, y, rx, a); return; } ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.4, 0, 0, 7); ctx.fill(); }
function hasAnim(id, n) { return !!A.db[id].anims[n]; }

export function render(g, ctx) {
  ctx.imageSmoothingEnabled = false;
  const shx = g.shake ? (Math.random() - 0.5) * g.shake : 0, shy = g.shake ? (Math.random() - 0.5) * g.shake : 0;
  const sx = Math.round(Math.max(0, Math.min(M.MW * TS - W, g.cam.x + shx))), sy = Math.round(Math.max(0, Math.min(M.MH * TS - H, g.cam.y + shy)));
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(g.floor, sx, sy, W, H, 0, 0, W, H);
  ctx.save(); ctx.translate(-sx, -sy);
  M.drawWalls(ctx, g.world, { x: sx, y: sy }, W, H, g.t);
  drawGates(ctx, g);
  groundFx(ctx, g);

  const inView = (x, y, pad = 60) => x > sx - pad && x < sx + W + pad && y > sy - pad && y < sy + H + pad + 40;
  const list = collectDrawList(g, inView);
  list.sort((a, b) => a.y - b.y);
  for (const o of list) o.f(ctx);

  // projectiles, particules, textes
  for (const p of g.projs) {
    shadow(ctx, p.x, p.y + 2, 3, 0.25);
    const r = (p.big ? 5 : p.r > 3.4 ? 4 : 3) + Math.sin(g.t * 30) * 0.5;
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y - 8, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y - 8, r * 0.5, 0, 7); ctx.fill();
  }
  for (const b of g.beams) { const k = 1 - b.t / b.max; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang); ctx.globalAlpha = k; ctx.fillStyle = b.color; ctx.fillRect(0, -b.w / 2, b.len, b.w); ctx.fillStyle = '#fff'; ctx.fillRect(0, -b.w / 5, b.len, b.w * 0.4); ctx.restore(); }
  ctx.globalAlpha = 1;
  for (const p of g.parts) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.z - p.size / 2), p.size, p.size); }
  ctx.globalAlpha = 1;
  drawFxs(g, ctx, false);
  ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
  for (const t of g.texts) { ctx.globalAlpha = Math.min(1, (0.9 - t.t) * 3); ctx.fillStyle = '#000'; ctx.fillText(t.s, Math.round(t.x) + 1, Math.round(t.y) + 1); ctx.fillStyle = t.c; ctx.fillText(t.s, Math.round(t.x), Math.round(t.y)); }
  ctx.globalAlpha = 1;
  // verrouillage
  if (g.lock && !g.lock.dead) { const e = g.lock, y = e.y - (A.db[e.sprite].anchor.h * (e.def.scale || 1)) - 8 + Math.sin(g.t * 6) * 1.5; ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.moveTo(e.x, y + 5); ctx.lineTo(e.x - 4, y); ctx.lineTo(e.x, y - 5); ctx.lineTo(e.x + 4, y); ctx.fill(); }
  ctx.restore();

  lighting(ctx, g, sx, sy);
}


// Liste des objets à dessiner (décors, coffres, feux, objets, ennemis, alliés…) : {x, y (pieds), big, f(ctx)}.
// Partagée par le rendu 2D (tri par y) et le rendu HD-2D (chaque entrée devient un billboard).
export function collectDrawList(g, inView) {
  const list = [], pr = g.prog[g.mapIdx];
  const bigFor = (id, sc) => { const sp = A.db[id]; if (!sp) return false; const an = sp.anims.Idle || Object.values(sp.anims)[0]; return !!an && Math.max(an.fw, an.fh) * sc > 92; };
  for (const d of g.world.decor) { const by = M.decorBaseline(d), bx = (d.tx + d.w / 2) * TS; if (inView(bx, by, 50)) list.push({ x: bx, y: by, f: c => M.drawDecor(c, g.world, d, g.t) }); }
  for (const d of g.chestObjs) { const by = M.decorBaseline(d), bx = (d.tx + 0.5) * TS; if (inView(bx, by, 50)) list.push({ x: bx, y: by, f: c => M.drawDecor(c, g.world, d, g.t, pr.chests.includes(d.id)) }); }
  for (const b of g.world.bonfires) { const x = (b.tx + 0.5) * TS, y = (b.ty + 0.6) * TS; if (inView(x, y)) list.push({ x, y, f: c => drawBonfire(c, g, b, x, y) }); }
  for (const it of g.items) list.push({ x: it.x, y: it.y + 2, f: c => drawItem(c, g, it) });
  for (const e of g.enemies) if (inView(e.x, e.y)) list.push({ x: e.x, y: e.y, big: e.boss || bigFor(e.sprite, e.def.scale || 1), f: c => drawEnemy(c, g, e) });
  for (const o of g.obs) if (!o.dead && o.solid && o.on && inView(o.x, o.y)) list.push({ x: o.x, y: o.y + o.hh, f: c => drawObsSolid(c, g, o) });
  for (const q of g.allies) list.push({ x: q.x, y: q.y, big: bigFor(q.id, 1), f: c => drawAlly(c, g, q) });
  { const m = g.chief(); list.push({ x: m.x, y: m.y, big: bigFor(m.id, 1), f: c => drawMember(c, g, m) }); }
  if (g.souvenir) list.push({ x: g.souvenir.x, y: g.souvenir.y, f: c => drawSouvenir(c, g) });
  return list;
}

// ---------- obstacles de boss, alliés du Lien ----------
const OBS_LIGHT = { lava: [48, '#ff6a20', 0.9], pylon: [40, '#ffe84a', 0.8], crystal: [34, '#d89aff', 0.7], gravity: [50, '#b070ff', 0.5], flower: [28, '#ff9ad8', 0.8], ice: [30, '#bfeaff', 0.5], frost: [34, '#9fe8ff', 0.4], basalt: [26, '#ff8a40', 0.5] };
const rgba = (hex, a) => { const c = hexToRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
function poly(ctx, pts, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill(); }
function drawAlly(ctx, g, m) {
  const k = g.linkT < 2 ? 0.4 + 0.4 * Math.sin(g.t * 24) : 0.75;
  ctx.strokeStyle = rgba(m.def.color, k); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(m.x, m.y + 1, 12 + Math.sin(g.t * 6) * 1.2, 5, 0, 0, 7); ctx.stroke();
  ctx.fillStyle = rgba(m.def.color, 0.14); ctx.fill();
  drawMember(ctx, g, m);
}
function drawObsGround(ctx, g) {
  for (const q of g.allies) { const c = g.chief(); ctx.strokeStyle = rgba(q.def.color, 0.35 + 0.2 * Math.sin(g.t * 8)); ctx.lineWidth = 1; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(c.x, c.y - 6); ctx.lineTo(q.x, q.y - 6); ctx.stroke(); ctx.setLineDash([]); }
  if (g.gust) {
    const gu = g.gust, c = g.chief(), live = gu.t > gu.delay, a = Math.atan2(gu.dy, gu.dx);
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(a); ctx.globalAlpha = live ? 0.5 : 0.25 + 0.2 * Math.sin(g.t * 20); ctx.strokeStyle = '#e8f4ff'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { const off = ((g.t * (live ? 160 : 40) + i * 40) % 160) - 40; ctx.beginPath(); ctx.moveTo(off, i * 18); ctx.lineTo(off + 26, i * 18); ctx.moveTo(off + 20, i * 18 - 4); ctx.lineTo(off + 26, i * 18); ctx.lineTo(off + 20, i * 18 + 4); ctx.stroke(); }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  for (const o of g.obs) {
    if (o.dead) continue;
    if (!o.on) {
      const k = Math.min(1, o.t / o.delay), f = 0.5 + 0.5 * Math.sin(g.t * 22), r = o.solid ? Math.max(o.hw, o.hh) + 7 : o.r;
      ctx.fillStyle = rgba(o.color, 0.10 + 0.12 * f); ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.fill();
      ctx.strokeStyle = rgba(o.color, 0.9); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = rgba(o.color, 0.28); ctx.beginPath(); ctx.arc(o.x, o.y, r * k, 0, 7); ctx.fill();
      if (o.kind === 'rock') { const dy = -(1 - k) * 90; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 10 * k, 4 * k, 0, 0, 7); ctx.fill(); poly(ctx, [o.x - 8, o.y + dy, o.x - 5, o.y + dy - 12, o.x + 3, o.y + dy - 14, o.x + 8, o.y + dy - 4, o.x + 5, o.y + dy + 4], '#8a7a6a'); }
      continue;
    }
    if (o.solid) continue;
    const fade = Math.min(1, (o.life - o.t) / 1.5), t = g.t;
    ctx.globalAlpha = fade;
    if (o.kind === 'lava') {
      ctx.fillStyle = '#3a1208'; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r + 2, o.r * 0.62 + 2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff5a14'; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r * 0.62, o.r * 0.34, 0, 0, 7); ctx.fill();
      for (let i = 0; i < 4; i++) { const ph = (t * 1.5 + i * 0.25 + o.seed) % 1; ctx.fillStyle = `rgba(255,230,140,${1 - ph})`; ctx.beginPath(); ctx.arc(o.x + Math.sin(o.seed + i * 2.1) * o.r * 0.6, o.y - ph * 14, 1.6, 0, 7); ctx.fill(); }
    } else if (o.kind === 'frost') {
      ctx.fillStyle = 'rgba(190,235,255,.4)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.6, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(235,250,255,.85)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 5; i++) { const a = o.seed + i * 1.26, rr = o.r * 0.6; const x = o.x + Math.cos(a) * rr, y = o.y + Math.sin(a) * rr * 0.6; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 2); ctx.stroke(); }
    } else if (o.kind === 'gravity') {
      ctx.fillStyle = 'rgba(80,30,140,.28)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.6, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(210,150,255,.8)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { const rr = o.r * (1 - ((t * 0.7 + i / 3) % 1)); ctx.globalAlpha = fade * (rr / o.r); ctx.beginPath(); ctx.ellipse(o.x, o.y, rr, rr * 0.6, 0, 0, 7); ctx.stroke(); }
    } else if (o.kind === 'flower') {
      ctx.fillStyle = 'rgba(255,154,216,.2)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, o.r, o.r * 0.6, 0, 0, 7); ctx.fill();
      for (let i = 0; i < 4; i++) { const a = o.seed + i * 1.57, x = o.x + Math.cos(a) * 5, y = o.y - 2 + Math.sin(a) * 3 - Math.sin(t * 3 + i) * 1.5; ctx.fillStyle = '#ff9ad8'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(x, y, 1, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
}
function drawObsSolid(ctx, g, o) {
  const rise = Math.min(1, o.t / 0.22), fade = o.life - o.t < 1.5 ? 0.45 + 0.55 * (Math.sin(g.t * 26) > 0 ? 1 : 0.4) : 1, x = o.x, y = o.y + o.hh - 1, h0 = rise;
  ctx.globalAlpha = fade; shadow(ctx, x, y + 1, 10, 0.35 * fade);
  if (o.kind === 'ice') { const h = 24 * h0; poly(ctx, [x - 7, y, x - 6, y - h * 0.6, x - 1, y - h, x + 3, y - h * 0.8, x + 7, y - h * 0.55, x + 7, y], '#8fd8f0'); poly(ctx, [x - 7, y, x - 6, y - h * 0.6, x - 1, y - h, x, y], '#d8f6ff'); poly(ctx, [x + 2, y, x + 3, y - h * 0.8, x + 7, y - h * 0.55, x + 7, y], '#56a8d0'); poly(ctx, [x - 4, y - h * 0.35, x - 2, y - h * 0.8, x - 1, y - h * 0.4], 'rgba(255,255,255,.7)'); }
  else if (o.kind === 'pylon') { const h = 28 * h0; ctx.fillStyle = '#2a2c3a'; ctx.fillRect(x - 6, y - 4, 12, 4); ctx.fillStyle = '#4a4e66'; ctx.fillRect(x - 2, y - h, 4, h - 3); ctx.fillStyle = '#6a6f8c'; ctx.fillRect(x - 2, y - h, 1, h - 3);
    const pu = 0.6 + 0.4 * Math.sin(g.t * 12 + o.seed); ctx.strokeStyle = `rgba(255,232,74,${pu})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - h, 7, 3, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#fff6a8'; ctx.beginPath(); ctx.arc(x, y - h - 2, 2.4 + pu, 0, 7); ctx.fill();
    if (Math.random() < 0.25) g.parts.push({ x: x + (Math.random() - 0.5) * 8, y, z: h, vx: 0, vy: 0, vz: -10, life: 0.3, max: 0.3, c: '#fff58a', size: 1 }); }
  else if (o.kind === 'rock' || o.kind === 'basalt') { const h = 18 * h0, lava = o.kind === 'basalt', c1 = lava ? '#3a2a2a' : '#8a7a6a', c2 = lava ? '#54403c' : '#b0a090', c3 = lava ? '#241a1a' : '#5e5246';
    poly(ctx, [x - 9, y, x - 8, y - h * 0.6, x - 3, y - h, x + 4, y - h * 0.9, x + 9, y - h * 0.5, x + 8, y], c1); poly(ctx, [x - 8, y - h * 0.6, x - 3, y - h, x + 1, y - h * 0.7, x - 4, y - h * 0.3], c2); poly(ctx, [x + 2, y, x + 4, y - h * 0.6, x + 8, y - h * 0.5, x + 8, y], c3);
    if (lava) { ctx.strokeStyle = `rgba(255,130,40,${0.7 + 0.3 * Math.sin(g.t * 5 + o.seed)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 3, y - 2); ctx.lineTo(x - 1, y - h * 0.5); ctx.lineTo(x + 3, y - h * 0.7); ctx.stroke(); }
    if (o.hp < o.maxhp * 0.55) { ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 4, y - h * 0.9); ctx.lineTo(x - 1, y - h * 0.5); ctx.lineTo(x + 3, y - h * 0.3); ctx.stroke(); } }
  else if (o.kind === 'crystal') { const h = 26 * h0, pu = 0.6 + 0.4 * Math.sin(g.t * 5 + o.seed); poly(ctx, [x - 7, y - 2, x - 4, y - h * 0.7, x, y - h, x + 4, y - h * 0.7, x + 7, y - 2, x, y + 1], '#8a4ac8'); poly(ctx, [x - 7, y - 2, x - 4, y - h * 0.7, x, y - h, x, y + 1], '#c890ff'); poly(ctx, [x, y - h, x + 4, y - h * 0.7, x + 7, y - 2, x, y + 1], '#6a30a8');
    ctx.fillStyle = `rgba(255,255,255,${0.5 * pu})`; ctx.fillRect(x - 3, y - h * 0.7, 2, h * 0.4); }
  else if (o.kind === 'thorn') { const h = 18 * h0; ctx.strokeStyle = '#2e7a3a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { const a = -2.6 + i * 0.42, l = (10 + (i % 3) * 4) * h0; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 2, y - 2); ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.7, y - l * 0.9, x + Math.cos(a) * l * 1.1, y - Math.abs(Math.sin(a)) * l * 1.3 - 2); ctx.stroke(); }
    ctx.fillStyle = '#4ab85a'; ctx.beginPath(); ctx.ellipse(x, y - 4, 7, 4, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#d8ffb0'; for (let i = 0; i < 4; i++) ctx.fillRect(x - 6 + i * 4, y - 7 - (i % 2) * 5 * h0, 1.5, 3); ctx.lineCap = 'butt'; }
  if (o.flash > 0) { ctx.globalAlpha = 0.55; ctx.fillStyle = '#fff'; ctx.fillRect(x - o.hw, y - 24 * h0, o.hw * 2, 24 * h0); }
  ctx.globalAlpha = 1;
  if (o.hp < o.maxhp) { const w = 16; ctx.fillStyle = '#000'; ctx.fillRect(x - w / 2 - 1, y - 32, w + 2, 4); ctx.fillStyle = '#e8c860'; ctx.fillRect(x - w / 2, y - 31, w * Math.max(0, o.hp / o.maxhp), 2); }
}

export function drawGates(ctx, g) {
  for (const [tx, ty] of (g.world.door ? g.world.door.tiles : [])) {
    const v = g.world.grid[ty * M.MW + tx]; if (v !== M.T.DOOR) continue;
    const x = tx * TS, y = ty * TS; ctx.fillStyle = '#4d5780'; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = '#2a3150'; ctx.fillRect(x + 2, y + 2, TS - 4, TS - 4);
    ctx.fillStyle = '#c690ff'; ctx.fillRect(x + 4, y + 10, TS - 8, 2); ctx.fillStyle = '#10142a'; ctx.fillRect(x, y + TS - 3, TS, 3);
  }
  for (const [tx, ty] of g.world.fog.tiles) {
    if (g.world.grid[ty * M.MW + tx] !== M.T.FOG) continue;
    const x = tx * TS, y = ty * TS;
    for (let i = 0; i < 6; i++) { const a = 0.25 + 0.15 * Math.sin(g.t * 2 + i + ty); ctx.fillStyle = `rgba(190,130,255,${a})`; const ox = Math.sin(g.t * 1.3 + i * 2) * 5; ctx.beginPath(); ctx.ellipse(x + TS / 2 + ox, y + 4 + i * 4, 12, 6, 0, 0, 7); ctx.fill(); }
  }
}

function drawSurfs(ctx, g) {
  for (const f of g.surf) {
    const k = Math.min(1, (f.life - f.t) / 1.2), a = Math.max(0, k);
    ctx.save(); ctx.globalAlpha = a;
    if (f.kind === 'fire') { ctx.fillStyle = 'rgba(255,110,30,.35)'; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.5, 0, 0, 7); ctx.fill(); for (let i = 0; i < 5; i++) { const q = f.seed + i * 1.7, fx = f.x + Math.cos(q) * f.r * 0.7, fy = f.y + Math.sin(q) * f.r * 0.3, h = 4 + 3 * Math.sin(g.t * 9 + q); ctx.fillStyle = i % 2 ? '#ffd24a' : '#ff7a30'; ctx.fillRect(Math.round(fx) - 1, Math.round(fy - h), 2, Math.round(h)); } }
    else if (f.kind === 'puddle') { ctx.fillStyle = f.shock > 0 ? 'rgba(255,232,74,.45)' : 'rgba(74,168,255,.35)'; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.5, 0, 0, 7); ctx.fill(); ctx.strokeStyle = f.shock > 0 ? '#fff6a0' : 'rgba(190,230,255,.7)'; ctx.lineWidth = 1; ctx.stroke(); if (f.shock > 0) for (let i = 0; i < 3; i++) { const q = g.t * 14 + i * 2; ctx.fillStyle = '#fff6a0'; ctx.fillRect(Math.round(f.x + Math.cos(q) * f.r * 0.7), Math.round(f.y + Math.sin(q) * f.r * 0.3), 2, 2); } }
    else if (f.kind === 'steam') { for (let i = 0; i < 6; i++) { const q = f.seed + i * 1.1 + g.t * 0.8; ctx.fillStyle = 'rgba(235,245,255,.28)'; ctx.beginPath(); ctx.arc(f.x + Math.cos(q) * f.r * 0.6, f.y - 6 - (g.t * 6 + i * 3) % 12 + Math.sin(q) * 4, 6 + i % 3, 0, 7); ctx.fill(); } }
    else if (f.kind === 'toxic') { ctx.fillStyle = 'rgba(160,70,220,.28)'; ctx.beginPath(); ctx.ellipse(f.x, f.y - 4, f.r, f.r * 0.6, 0, 0, 7); ctx.fill(); for (let i = 0; i < 4; i++) { const q = f.seed + i * 1.9 + g.t * 0.6; ctx.fillStyle = 'rgba(200,120,255,.5)'; ctx.beginPath(); ctx.arc(f.x + Math.cos(q) * f.r * 0.6, f.y - 4 + Math.sin(q * 1.3) * 6, 3, 0, 7); ctx.fill(); } }
    ctx.restore();
  }
}
function markPips(ctx, g, o, top) {
  if (!o.el || !o.el.length) return;
  const n = o.el.length, x0 = Math.round(o.x - (n * 9 - 1) / 2);
  o.el.forEach((m, i) => {
    const M_ = MARKS[m.k]; if (!M_) return; const x = x0 + i * 9, y = Math.round(top);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, 9, 8); ctx.fillStyle = M_.color; ctx.globalAlpha = m.t < 1 ? 0.5 + 0.5 * Math.sin(g.t * 20) : 1; ctx.fillRect(x, y, 7, 6); ctx.globalAlpha = 1;
    ctx.fillStyle = '#000'; ctx.fillRect(x + 1, y + 5, Math.max(0, Math.round(5 * Math.min(1, m.t / m.max))), 1);
  });
}
export function groundFx(ctx, g, hook) {
  drawSurfs(ctx, g);
  for (const r of g.rings) {
    if (r.r <= 0) continue; ctx.strokeStyle = r.color || 'rgba(224,160,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
  }
  if (g.fxRings) for (const r of g.fxRings) { const k = r.t / 0.45; ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.3 + 0.7 * k), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  drawFxs(g, ctx, true, hook);
  drawObsGround(ctx, g);
  for (const z of g.zones) { const k = Math.min(1, z.t / z.delay), f = 0.5 + 0.5 * Math.sin(g.t * 24); ctx.fillStyle = `rgba(255,70,70,${0.12 + 0.18 * f})`; ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 4, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,120,100,.9)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'rgba(255,200,150,.5)'; ctx.beginPath(); ctx.arc(z.x, z.y, (z.r + 4) * k, 0, 7); ctx.fill(); }
  for (const e of g.enemies) {
    if (!e.tele || e.dead) continue; const k = 0.5 + 0.5 * Math.sin(g.t * 24);
    const def = e.def;
    if (def.kind === 'slam' && e.slamAt) { ctx.fillStyle = `rgba(255,90,40,${0.15 + 0.15 * k})`; ctx.beginPath(); ctx.arc(e.slamAt.x, e.slamAt.y, def.blast, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,120,60,.8)'; ctx.lineWidth = 1; ctx.stroke(); continue; }
    if (e.boss && (e.atkType === 'dash' || e.atkType === 'beam') && e.lockDir) { const L = e.atkType === 'beam' ? 260 : 150; ctx.strokeStyle = `rgba(255,70,70,${0.35 + 0.35 * k})`; ctx.lineWidth = e.atkType === 'beam' ? 8 : 12; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.lockDir.x * L, e.y + e.lockDir.y * L); ctx.stroke(); continue; }
    if (e.boss && e.atkType === 'nova') { ctx.strokeStyle = `rgba(255,255,255,${0.3 + 0.4 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 14 + 22 * (1 - e.st), 0, 7); ctx.stroke(); continue; }
    if (def.kind === 'bomb') { ctx.fillStyle = `rgba(255,90,40,${0.15 + 0.15 * k})`; ctx.beginPath(); ctx.arc(e.x, e.y, def.blast, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,120,60,.8)'; ctx.lineWidth = 1; ctx.stroke(); }
    else if (e.boss && e.atkType === 'swing') { ctx.fillStyle = `rgba(255,70,90,${0.18 + 0.14 * k})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 46, Math.atan2(e.face.y, e.face.x) - 1.57, Math.atan2(e.face.y, e.face.x) + 1.57); ctx.fill(); }
    else if (e.boss && e.atkType === 'pulse') { ctx.strokeStyle = `rgba(224,160,255,${0.3 + 0.4 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 20 + 30 * (1 - e.st), 0, 7); ctx.stroke(); }
    else if (e.boss) { continue; }
    else if (def.kind === 'roller') { const u = { x: g.chief().x - e.x, y: g.chief().y - e.y }; const l = Math.hypot(u.x, u.y) || 1; ctx.strokeStyle = `rgba(255,70,70,${0.4 + 0.3 * k})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + u.x / l * 120, e.y + u.y / l * 120); ctx.stroke(); }
  }
}

const STATUS_TINT = {
  burn: t => `sepia(1) saturate(5) hue-rotate(-25deg) brightness(${1.05 + 0.2 * Math.sin(t * 14)})`,
  poison: () => 'hue-rotate(250deg) saturate(1.6) brightness(.95)',
  freeze: () => 'saturate(.35) brightness(1.6) contrast(.9)',
  para: t => `sepia(1) saturate(4) hue-rotate(5deg) brightness(${Math.sin(t * 40) > 0.3 ? 1.6 : 1})`,
  confuse: t => `hue-rotate(${Math.floor(t * 300) % 360}deg) saturate(1.8)`,
};
function statusTint(g, fx) { return fx && STATUS_TINT[fx.k] ? STATUS_TINT[fx.k](g.t) : null; }
function statusTag(ctx, g, o, fx, h) {
  const S = D.STATUS[fx.k], y = Math.round(o.y - h - 4);
  if (fx.k === 'freeze') { const hh = Math.max(14, h - 2); ctx.fillStyle = 'rgba(140,225,255,.38)'; ctx.fillRect(Math.round(o.x - 10), Math.round(o.y - hh), 20, hh); ctx.strokeStyle = 'rgba(220,250,255,.9)'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(o.x - 10) + .5, Math.round(o.y - hh) + .5, 20, hh); }
  ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center'; const w = 18;
  ctx.fillStyle = '#000'; ctx.fillRect(Math.round(o.x - w / 2) - 1, y - 7, w + 2, 9); ctx.fillStyle = S.color; ctx.fillRect(Math.round(o.x - w / 2), y - 6, w, 7);
  ctx.fillStyle = '#000'; ctx.fillText(S.tag, Math.round(o.x), y);
  if (fx.k === 'confuse') { for (let i = 0; i < 3; i++) { const a = g.t * 5 + i * 2.1; ctx.fillStyle = S.color; ctx.fillRect(Math.round(o.x + Math.cos(a) * 9), Math.round(y - 10 + Math.sin(a) * 2), 2, 2); } }
}
function drawMember(ctx, g, m) {
  const id = m.id, ch = m === g.chief();
  shadow(ctx, m.x, m.y, 8, m.exh ? 0.2 : 0.4);
  let alpha = m.exh ? 0.55 : 1; if (ch && m.inv > 0 && !m.exh && !m.dodge) alpha = (Math.floor(g.t * 30) % 2) ? 0.5 : 1; if (m.dodge) alpha = 0.55;
  const dir = m.atk ? m.dir : m.dir = dirFromVec(m.face.x, m.face.y);
  let anim = m.anim; if (!A.db[id].anims[anim]) anim = 'Idle';
  if (m.exh) { anim = hasAnim(id, 'Faint') ? 'Faint' : 'Hurt'; }
  drawSprite(ctx, id, anim, m.at / TICK, m.loop && !m.exh, dir, m.x, m.y, { alpha, flash: m.flash > 0, tint: statusTint(g, m.fx) });
  if (m.fx && !m.exh) statusTag(ctx, g, m, m.fx, A.db[id].anchor.h);
  if (!m.exh) markPips(ctx, g, m, m.y - A.db[id].anchor.h - 16);
  if (m.regen && !m.exh) { ctx.strokeStyle = 'rgba(141,255,176,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(m.x, m.y, 12 + Math.sin(g.t * 6) * 1.5, 5, 0, 0, 7); ctx.stroke(); }
  if (ch && !m.exh) { const y = m.y - A.db[id].anchor.h - 4 + Math.sin(g.t * 5); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(m.x - 3, y - 4); ctx.lineTo(m.x + 3, y - 4); ctx.lineTo(m.x, y); ctx.fill(); }
  if (ch && g.guarding) { ctx.strokeStyle = g.guardT < 0.22 ? 'rgba(160,240,255,.9)' : 'rgba(180,210,255,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(m.x + m.face.x * 8, m.y - 8 + m.face.y * 5, 11, Math.atan2(m.face.y, m.face.x) - 1.1, Math.atan2(m.face.y, m.face.x) + 1.1); ctx.stroke(); }
}

function drawEnemy(ctx, g, e) {
  const id = e.sprite, def = e.def, sc = def.scale || 1, sp = A.db[id];
  const fly = def.fly || def.hover || e.clone; const z = fly ? 6 + Math.sin(g.t * 3 + e.bob) * 1.5 : 0;
  let alpha = 1; if (e.dead && !e.boss) alpha = Math.max(0, 1 - e.deadT / 0.9);
  shadow(ctx, e.x, e.y, (e.boss ? 12 : 7) * sc * (e.boss ? 1.3 : 1), 0.35 * alpha);
  let anim = e.anim; if (!sp.anims[anim]) anim = 'Idle';
  if (e.dead && e.boss) anim = 'Faint';
  const tint = e.fx ? statusTint(g, e.fx) : e.invuln > 0 && e.boss ? 'brightness(1.5) hue-rotate(40deg)' : e.clone ? 'hue-rotate(150deg) saturate(1.6) brightness(.9)' : e.state === 'dormant' ? null : null;
  drawSprite(ctx, id, anim, e.at / TICK, e.loop && !(e.dead), e.dir, e.x, e.y, { scale: sc, z, alpha, flash: e.flash > 0, tint });
  if (e.dead) return;
  const top = e.y - z - sp.anchor.h * sc - 6;
  if (e.fx) statusTag(ctx, g, e, e.fx, sp.anchor.h * sc + z + 8);
  markPips(ctx, g, e, top - 10);
  if (e.shell && e.shell.hp > 0) { ctx.strokeStyle = `rgba(200,240,255,${0.5 + 0.2 * Math.sin(g.t * 6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - z - 12, 22, 28, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#000'; ctx.fillRect(e.x - 15, top + 8, 30, 4); ctx.fillStyle = '#bfeaff'; ctx.fillRect(e.x - 14, top + 9, 28 * e.shell.hp / e.shell.max, 2); }
  if (e.blind > 0) { ctx.fillStyle = '#e8f4ff'; ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center'; ctx.fillText('?', e.x + 10, top + 4); }
  if (e.tele) { ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText('!', e.x + 1, top + 1); ctx.fillStyle = '#ff4a4a'; ctx.fillText('!', e.x, top); }
  if (!e.boss && e.hp < e.maxhp) { const w = Math.max(14, e.r * 2.4); ctx.fillStyle = '#000'; ctx.fillRect(e.x - w / 2 - 1, top + 3, w + 2, 4); ctx.fillStyle = '#d63a3a'; ctx.fillRect(e.x - w / 2, top + 4, w * Math.max(0, e.hp / e.maxhp), 2); }
  if (e.boss) { const gl = def.glow; ctx.strokeStyle = `rgba(${gl[0]},${gl[1]},${gl[2]},${0.3 + 0.15 * Math.sin(g.t * 4)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(e.x, e.y - z - 10, 18, 24, 0, 0, 7); ctx.stroke(); }
}

function drawBonfire(ctx, g, b, x, y) {
  const lit = g.lit.has(b.id); shadow(ctx, x, y, 11, 0.4);
  ctx.fillStyle = '#4a5578'; ctx.beginPath(); ctx.ellipse(x, y - 1, 10, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2c3452'; ctx.beginPath(); ctx.ellipse(x, y - 3, 8, 3.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#6b4a30'; ctx.save(); ctx.translate(x, y - 5); ctx.rotate(0.5); ctx.fillRect(-7, -1, 14, 2); ctx.rotate(-1); ctx.fillRect(-7, -1, 14, 2); ctx.restore();
  // épée plantée
  ctx.fillStyle = '#cfd6ea'; ctx.fillRect(x - 1, y - 24, 2, 18); ctx.fillStyle = '#8b97b8'; ctx.fillRect(x - 4, y - 21, 8, 2);
  if (lit) {
    for (let i = 0; i < 5; i++) { const t = g.t * 6 + i * 1.7, h = 8 + Math.sin(t) * 3 + (i === 2 ? 4 : 0); ctx.fillStyle = i % 2 ? '#ff9a2e' : '#ffd36a'; ctx.beginPath(); ctx.ellipse(x - 4 + i * 2 + Math.sin(t * 1.3), y - 7 - h / 2, 2.2 - Math.abs(i - 2) * 0.3, h / 2, 0, 0, 7); ctx.fill(); }
    if (Math.random() < 0.3) g.parts.push({ x: x + (Math.random() - 0.5) * 6, y: y - 6, z: 6, vx: 0, vy: 0, vz: 22, life: 0.8, max: 0.8, c: '#ffb34a', size: 1 });
  } else { ctx.fillStyle = '#ff7a30'; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(g.t * 3); ctx.fillRect(x - 1, y - 8, 2, 2); ctx.globalAlpha = 1; }
}
function drawItem(ctx, g, it) {
  if (it.kind === 'portal') {
    shadow(ctx, it.x, it.y, 12, 0.3);
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${g.world.theme.accent2[0]},${g.world.theme.accent2[1]},${g.world.theme.accent2[2]},${0.7 - i * 0.2})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(it.x, it.y - 14, 8 + i * 3 + Math.sin(g.t * 3 + i) * 1.5, 14 + i * 3, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(it.x, it.y - 14, 6, 11, 0, 0, 7); ctx.fill(); return;
  }
  M.drawDecor(ctx, g.world, { kind: 'chest', tx: Math.floor(it.x / TS) - 0 , ty: Math.floor(it.y / TS), w: 1, h: 1, seed: 3 }, g.t, false);
}
function drawPlaque(ctx, g, it) { shadow(ctx, it.x, it.y, 8, 0.35); const y = it.y - 10 + Math.sin(g.t * 3) * 2; ctx.fillStyle = '#c690ff'; ctx.fillRect(it.x - 6, y - 8, 12, 16); ctx.fillStyle = '#f2e0ff'; ctx.fillRect(it.x - 4, y - 6, 8, 12); ctx.fillStyle = '#7a4fc0'; ctx.fillRect(it.x - 1, y - 4, 2, 8); ctx.fillRect(it.x - 3, y - 1, 6, 2); }
function drawSouvenir(ctx, g) { const s = g.souvenir, y = s.y - 8 + Math.sin(g.t * 3) * 2; ctx.fillStyle = 'rgba(201,167,255,.9)'; ctx.beginPath(); ctx.arc(s.x, y, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, y, 2, 0, 7); ctx.fill(); }

export function buildLights(g) {
  const c = g.chief();
  const inArena = M.inArena(g.world, c.x, c.y);
  const th = g.world.theme, pr = g.prog[g.mapIdx], amb = pr.bossDead && inArena ? th.amb.map(v => Math.min(255, v + 45)) : inArena ? th.ambArena : th.amb;
  const lights = [];
  for (const b of g.world.bonfires) if (g.lit.has(b.id)) lights.push({ x: (b.tx + 0.5) * TS, y: (b.ty + 0.2) * TS, r: 120 + Math.sin(g.t * 9 + b.tx) * 6, c: [255, 160, 70], a: 0.95 });
  for (const d of g.world.decor) { const l = M.decorLight(g.world, d); if (l) lights.push({ ...l, a: 0.6 }); }
  for (const d of g.chestObjs) { const l = M.decorLight(g.world, d, pr.chests.includes(d.id)); if (l) lights.push({ ...l, a: 0.6 }); }
  for (const z of g.zones) lights.push({ x: z.x, y: z.y, r: 34, c: [255, 90, 70], a: 0.5 });
  for (const b of g.beams) lights.push({ x: b.x + Math.cos(b.ang) * b.len / 2, y: b.y + Math.sin(b.ang) * b.len / 2, r: b.len / 2, c: hexToRgb(b.color), a: 0.5 * (1 - b.t / b.max) });
  lights.push({ x: c.x, y: c.y - 8, r: 90, c: [140, 150, 200], a: 0.55 });
  for (const q of g.allies) lights.push({ x: q.x, y: q.y - 8, r: 60, c: hexToRgb(q.def.color), a: 0.7 });
  for (const o of g.obs) { if (o.dead) continue; const k = o.on ? 1 : 0.5 * Math.min(1, o.t / o.delay); const L = OBS_LIGHT[o.kind]; if (L) lights.push({ x: o.x, y: o.y - 8, r: L[0], c: hexToRgb(L[1]), a: L[2] * k }); }
  for (const p of g.projs) lights.push({ x: p.x, y: p.y - 8, r: p.big ? 60 : 38, c: hexToRgb(p.color), a: 0.9 });
  for (const e of g.enemies) {
    if (e.dead) continue;
    if (e.boss) lights.push({ x: e.x, y: e.y - 14, r: 90, c: e.def.glow, a: e.tele ? 1 : 0.7 });
    else if (e.tele) lights.push({ x: e.x, y: e.y - 8, r: 44, c: [255, 60, 50], a: 0.9 });
    else if (e.def.color) lights.push({ x: e.x, y: e.y - 8, r: 30, c: hexToRgb(e.def.color), a: 0.5 });
  }
  if (g.fxRings) for (const r of g.fxRings) lights.push({ x: r.x, y: r.y, r: r.r * 1.2, c: hexToRgb(r.c), a: 0.6 * (1 - r.t / 0.45) });
  for (const l of fxLights(g)) lights.push({ ...l, c: hexToRgb(l.c) });
  if (g.souvenir) lights.push({ x: g.souvenir.x, y: g.souvenir.y - 8, r: 40, c: [200, 160, 255], a: 0.8 });
  for (const it of g.items) lights.push({ x: it.x, y: it.y - 10, r: 70, c: it.kind === 'portal' ? [190, 150, 255] : [255, 220, 130], a: 0.9 });
  if (pr.bossDead) { const a = g.world.arena; lights.push({ x: a.cx * TS, y: a.cy * TS, r: 160, c: [255, 220, 170], a: 0.7 }); }
  return { amb, lights };
}

function lighting(ctx, g, sx, sy) {
  const lc = lightCtx();
  const { amb, lights } = buildLights(g);
  lc.globalCompositeOperation = 'source-over'; lc.fillStyle = `rgb(${amb})`; lc.fillRect(0, 0, W, H);
  lc.globalCompositeOperation = 'lighter';
  for (const L of lights) { const x = L.x - sx, y = L.y - sy; if (x < -L.r || y < -L.r || x > W + L.r || y > H + L.r) continue; radial(lc, x, y, L.r, L.c, L.a); }
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(lc.canvas, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const L of lights) { const x = L.x - sx, y = L.y - sy; if (x < -L.r || y < -L.r || x > W + L.r || y > H + L.r) continue; radial(ctx, x, y, L.r * 0.7, L.c, L.a * 0.16); }
  ctx.globalCompositeOperation = 'source-over';
  // flash de transition / mort
  if (g.state === 'dead') { ctx.fillStyle = `rgba(0,0,0,${Math.min(0.7, g.deadT * 0.5)})`; ctx.fillRect(0, 0, W, H); }
}
export function radial(c, x, y, r, col, a) { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`); gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); }
const hexCache = {};
export function hexToRgb(h) { if (hexCache[h]) return hexCache[h]; const n = parseInt(h.slice(1), 16); return (hexCache[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]); }
