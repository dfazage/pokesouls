// Rendu : sol, murs, entités triées en profondeur, effets, éclairage HD-2D (ambiance multiplicative + lueurs additives).
import { TICK, A, drawSprite, dirFromVec } from './assets.js';
import * as M from './maps.js';
import { W, H } from './game.js';
import * as D from './data.js';

const { TS } = M;
let lightC = null;
function lightCtx() { if (!lightC) { lightC = document.createElement('canvas'); lightC.width = W; lightC.height = H; } return lightC.getContext('2d'); }

function shadow(ctx, x, y, rx, a = 0.4) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.4, 0, 0, 7); ctx.fill(); }
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
  const list = [];
  for (const d of g.world.decor) { const by = M.decorBaseline(d); if (inView((d.tx + d.w / 2) * TS, by, 50)) list.push({ y: by, f: () => M.drawDecor(ctx, g.world, d, g.t) }); }
  const pr = g.prog[g.mapIdx];
  for (const d of g.chestObjs) { const by = M.decorBaseline(d); if (inView((d.tx + 0.5) * TS, by, 50)) list.push({ y: by, f: () => M.drawDecor(ctx, g.world, d, g.t, pr.chests.includes(d.id)) }); }
  for (const b of g.world.bonfires) { const x = (b.tx + 0.5) * TS, y = (b.ty + 0.6) * TS; if (inView(x, y)) list.push({ y, f: () => drawBonfire(ctx, g, b, x, y) }); }
  for (const it of g.items) list.push({ y: it.y + 2, f: () => drawItem(ctx, g, it) });
  for (const e of g.enemies) if (inView(e.x, e.y)) list.push({ y: e.y, f: () => drawEnemy(ctx, g, e) });
  { const m = g.chief(); list.push({ y: m.y, f: () => drawMember(ctx, g, m) }); }
  if (g.souvenir) list.push({ y: g.souvenir.y, f: () => drawSouvenir(ctx, g) });
  list.sort((a, b) => a.y - b.y);
  for (const o of list) o.f();

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
  ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
  for (const t of g.texts) { ctx.globalAlpha = Math.min(1, (0.9 - t.t) * 3); ctx.fillStyle = '#000'; ctx.fillText(t.s, Math.round(t.x) + 1, Math.round(t.y) + 1); ctx.fillStyle = t.c; ctx.fillText(t.s, Math.round(t.x), Math.round(t.y)); }
  ctx.globalAlpha = 1;
  // verrouillage
  if (g.lock && !g.lock.dead) { const e = g.lock, y = e.y - (A.db[e.sprite].anchor.h * (e.def.scale || 1)) - 8 + Math.sin(g.t * 6) * 1.5; ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.moveTo(e.x, y + 5); ctx.lineTo(e.x - 4, y); ctx.lineTo(e.x, y - 5); ctx.lineTo(e.x + 4, y); ctx.fill(); }
  ctx.restore();

  lighting(ctx, g, sx, sy);
}

function drawGates(ctx, g) {
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

function groundFx(ctx, g) {
  for (const r of g.rings) {
    if (r.r <= 0) continue; ctx.strokeStyle = r.color || 'rgba(224,160,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
  }
  if (g.fxRings) for (const r of g.fxRings) { const k = r.t / 0.45; ctx.globalAlpha = 1 - k; ctx.strokeStyle = r.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r.x, r.y, r.r * (0.3 + 0.7 * k), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
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

function lighting(ctx, g, sx, sy) {
  const lc = lightCtx(); const c = g.chief();
  const inArena = M.inArena(g.world, c.x, c.y);
  const th = g.world.theme, pr = g.prog[g.mapIdx], amb = pr.bossDead && inArena ? th.amb.map(v => Math.min(255, v + 45)) : inArena ? th.ambArena : th.amb;
  lc.globalCompositeOperation = 'source-over'; lc.fillStyle = `rgb(${amb})`; lc.fillRect(0, 0, W, H);
  const lights = [];
  for (const b of g.world.bonfires) if (g.lit.has(b.id)) lights.push({ x: (b.tx + 0.5) * TS, y: (b.ty + 0.2) * TS, r: 120 + Math.sin(g.t * 9 + b.tx) * 6, c: [255, 160, 70], a: 0.95 });
  for (const d of g.world.decor) { const l = M.decorLight(g.world, d); if (l) lights.push({ ...l, a: 0.6 }); }
  for (const d of g.chestObjs) { const l = M.decorLight(g.world, d, pr.chests.includes(d.id)); if (l) lights.push({ ...l, a: 0.6 }); }
  for (const z of g.zones) lights.push({ x: z.x, y: z.y, r: 34, c: [255, 90, 70], a: 0.5 });
  for (const b of g.beams) lights.push({ x: b.x + Math.cos(b.ang) * b.len / 2, y: b.y + Math.sin(b.ang) * b.len / 2, r: b.len / 2, c: hexToRgb(b.color), a: 0.5 * (1 - b.t / b.max) });
  lights.push({ x: c.x, y: c.y - 8, r: 90, c: [140, 150, 200], a: 0.55 });
  for (const p of g.projs) lights.push({ x: p.x, y: p.y - 8, r: p.big ? 60 : 38, c: hexToRgb(p.color), a: 0.9 });
  for (const e of g.enemies) {
    if (e.dead) continue;
    if (e.boss) lights.push({ x: e.x, y: e.y - 14, r: 90, c: e.def.glow, a: e.tele ? 1 : 0.7 });
    else if (e.tele) lights.push({ x: e.x, y: e.y - 8, r: 44, c: [255, 60, 50], a: 0.9 });
    else if (e.def.color) lights.push({ x: e.x, y: e.y - 8, r: 30, c: hexToRgb(e.def.color), a: 0.5 });
  }
  if (g.fxRings) for (const r of g.fxRings) lights.push({ x: r.x, y: r.y, r: r.r * 1.2, c: hexToRgb(r.c), a: 0.6 * (1 - r.t / 0.45) });
  if (g.souvenir) lights.push({ x: g.souvenir.x, y: g.souvenir.y - 8, r: 40, c: [200, 160, 255], a: 0.8 });
  for (const it of g.items) lights.push({ x: it.x, y: it.y - 10, r: 70, c: it.kind === 'portal' ? [190, 150, 255] : [255, 220, 130], a: 0.9 });
  if (pr.bossDead) { const a = g.world.arena; lights.push({ x: a.cx * TS, y: a.cy * TS, r: 160, c: [255, 220, 170], a: 0.7 }); }
  lc.globalCompositeOperation = 'lighter';
  for (const L of lights) { const x = L.x - sx, y = L.y - sy; if (x < -L.r || y < -L.r || x > W + L.r || y > H + L.r) continue; radial(lc, x, y, L.r, L.c, L.a); }
  ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(lc.canvas, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const L of lights) { const x = L.x - sx, y = L.y - sy; if (x < -L.r || y < -L.r || x > W + L.r || y > H + L.r) continue; radial(ctx, x, y, L.r * 0.7, L.c, L.a * 0.16); }
  ctx.globalCompositeOperation = 'source-over';
  // flash de transition / mort
  if (g.state === 'dead') { ctx.fillStyle = `rgba(0,0,0,${Math.min(0.7, g.deadT * 0.5)})`; ctx.fillRect(0, 0, W, H); }
}
function radial(c, x, y, r, col, a) { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`); gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); }
const hexCache = {};
function hexToRgb(h) { if (hexCache[h]) return hexCache[h]; const n = parseInt(h.slice(1), 16); return (hexCache[h] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]); }
