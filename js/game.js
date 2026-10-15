// Cœur du jeu : équipe de six, combat en temps réel, ennemis, boss Mewtwo, feux de camp, sauvegarde.
import { TICK, A, hitTick, animTotal, dirFromVec } from './assets.js';
import { Input } from './input.js';
import { SFX } from './audio.js';
import * as M from './map.js';
import { TEAM, ENEMIES, BOSS, START_LEVEL, levelCost, hpMult, dmgMult } from './data.js';

const { TS } = M;
export const W = 400, H = 225;
const SAVE_KEY = 'pokesouls.mewtwo.v1';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const hyp = Math.hypot;
const unit = (x, y) => { const l = hyp(x, y) || 1; return { x: x / l, y: y / l }; };

export function timing(species, anim) {
  const sp = A.db[species]; const an = sp.anims[anim] || sp.anims.Idle;
  const total = animTotal(an) * TICK; let hit = hitTick(an) * TICK; if (an.hit < 0) hit = total * 0.5;
  return { hit, total };
}
export function setAnim(o, name, loop = true) { if (o.anim !== name) { o.anim = name; o.at = 0; o.loop = loop; } }
function move(g, o, dx, dy, hw = 4, hh = 3) {
  if (dx && M.boxFree(g.world, o.x + dx, o.y, hw, hh)) o.x += dx;
  if (dy && M.boxFree(g.world, o.x, o.y + dy, hw, hh)) o.y += dy;
}

export class Game {
  constructor() {
    this.world = M.buildWorld();
    this.floor = M.bakeFloor(this.world);
    this.emit = () => {};
    this.dev = /[?&]dev/.test(location.search);
    this.god = false;
    this.t = 0; this.state = 'play'; this.hitstop = 0; this.shake = 0;
    this.cam = { x: 0, y: 0 };
    this.team = TEAM.map((d, i) => ({ def: d, i, lvl: START_LEVEL, hp: 1, maxhp: 1, exh: false, x: 0, y: 0, face: { x: 0, y: 1 }, dir: 0, anim: 'Idle', at: 0, loop: true, atk: null, dodge: null, hurtT: 0, inv: 0, flash: 0, cd: 0, acd: rand(0.3, 1), kx: 0, ky: 0, drink: 0, dash: null, deadT: 0 }));
    this.chiefIdx = 0; this.berries = 5; this.stam = 100; this.maxStam = 100; this.stamPause = 0;
    this.order = 'focus'; this.essence = 0; this.guardT = 9; this.guarding = false; this.wasGuard = false;
    this.buf = null; this.lock = null; this.trail = []; this.switchT = 0; this.swapCd = 0;
    this.enemies = []; this.projs = []; this.parts = []; this.texts = []; this.rings = []; this.items = [];
    this.boss = null; this.bossActive = false; this.prompt = null; this.lastArea = null; this.deadT = 0;
    this.lit = new Set(); this.last = null; this.doorOpen = false; this.miniDead = false; this.bossDead = false; this.plaque = false; this.souvenir = null;
    this.load();
    this.applyLevels(true);
    this.spawnAll();
    const b = this.last ? M.BONFIRES.find(b => b.id === this.last) : null;
    this.placeTeam(b ? (b.tx + 0.5) * TS : (M.START.tx + 0.5) * TS, b ? (b.ty + 1.6) * TS : (M.START.ty + 0.5) * TS);
    this.snapCam();
  }

  // ---------- état ----------
  chief() { return this.team[this.chiefIdx]; }
  maxhpOf(m) { return Math.round(m.def.hp * hpMult(m.lvl)); }
  applyLevels(full) { for (const m of this.team) { const mx = this.maxhpOf(m); if (full) m.hp = mx; else m.hp += mx - m.maxhp; m.maxhp = mx; } }
  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ essence: this.essence, lvls: this.team.map(m => m.lvl), lit: [...this.lit], last: this.last, doorOpen: this.doorOpen, miniDead: this.miniDead, bossDead: this.bossDead, plaque: this.plaque, souvenir: this.souvenir }));
    } catch (e) { /* stockage indisponible */ }
  }
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  static wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* rien */ } }
  load() {
    let s = null; try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { s = null; }
    if (!s) return;
    this.essence = s.essence || 0; (s.lvls || []).forEach((l, i) => { if (this.team[i]) this.team[i].lvl = l; });
    this.lit = new Set(s.lit || []); this.last = s.last || null; this.doorOpen = !!s.doorOpen; this.miniDead = !!s.miniDead; this.bossDead = !!s.bossDead; this.plaque = !!s.plaque; this.souvenir = s.souvenir || null;
    if (this.doorOpen) for (const [x, y] of this.world.doorTiles) this.world.grid[y * M.MW + x] = M.T.FLOOR;
    if (this.bossDead) this.openFog();
  }
  openFog() { for (const [x, y] of this.world.fogTiles) this.world.grid[y * M.MW + x] = M.T.FLOOR; if (!this.plaque) this.items = [{ kind: 'plaque', x: this.world.arena.cx * TS, y: this.world.arena.cy * TS }]; }
  closeFog() { if (this.bossDead) return; for (const [x, y] of this.world.fogTiles) this.world.grid[y * M.MW + x] = M.T.FOG; }

  placeTeam(x, y) {
    this.team.forEach((m, i) => { m.x = x + (i % 3 - 1) * 8; m.y = y + ((i / 3) | 0) * 6; m.atk = null; m.dodge = null; m.hurtT = 0; m.dash = null; });
    this.trail = [{ x, y }];
  }
  snapCam() { const c = this.chief(); this.cam.x = clamp(c.x - W / 2, 0, M.MW * TS - W); this.cam.y = clamp(c.y - H / 2, 0, M.MH * TS - H); }

  spawnAll() {
    this.enemies = [];
    for (const [type, tx, ty] of M.SPAWNS) {
      if (type === 'electrode' && this.miniDead) continue;
      this.enemies.push(this.makeEnemy(type, (tx + 0.5) * TS, (ty + M.DY + 0.5) * TS));
    }
    this.projs = []; this.rings = []; this.boss = null; this.bossActive = false; this.lock = null;
    this.closeFog();
  }
  makeEnemy(type, x, y) {
    const d = type === 'boss' ? { ...BOSS, boss: true, kind: 'boss', sight: 999, anim: 'Shoot', lv: 40 } : ENEMIES[type];
    return { def: d, type, x, y, hx: x, hy: y, hp: d.hp, maxhp: d.hp, r: d.r, dir: 0, face: { x: 0, y: 1 }, state: d.dormant ? 'dormant' : 'idle', st: 0, at: rand(0, 2), anim: 'Idle', loop: true, flash: 0, cd: rand(0.5, 1.5), vx: 0, vy: 0, kx: 0, ky: 0, dead: false, deadT: 0, boss: !!d.boss, clone: !!d.clone, phase: 1, invuln: 0, tele: false, hitDone: false, bob: rand(0, 6) };
  }

  // ---------- boucle ----------
  update(dt) {
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt * 14);
    if (this.state === 'dead') { this.deadT += dt; this.updateFx(dt); if (this.deadT > 3 && (Input.pressed('interact') || Input.pressed('light') || this.deadT > 6.5)) this.respawn(); return; }
    this.updateChief(dt);
    this.updateFollowers(dt);
    this.updateEnemies(dt);
    this.updateProjs(dt);
    this.updateRings(dt);
    this.updateFx(dt);
    this.updateWorld(dt);
    const c = this.chief();
    const tx = clamp(c.x - W / 2, 0, M.MW * TS - W), ty = clamp(c.y - H / 2 - 6, 0, M.MH * TS - H);
    const k = 1 - Math.exp(-9 * dt); this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
  }

  // ---------- équipe : chef ----------
  updateChief(dt) {
    const m = this.chief();
    this.swapCd -= dt;
    for (const a of ['light', 'heavy', 'ability', 'dodge']) if (Input.pressed(a)) this.buf = { a, t: 0.3 };
    if (this.buf) { this.buf.t -= dt; if (this.buf.t <= 0) this.buf = null; }
    if (Input.pressed('next')) this.cycleChief();
    for (let i = 0; i < 6; i++) if (Input.pressed('s' + (i + 1))) this.switchTo(i);
    if (Input.pressed('order')) { this.order = { focus: 'garde', garde: 'repli', repli: 'focus' }[this.order]; this.emit('toast', 'Ordre : ' + { focus: 'Focus', garde: 'Garde', repli: 'Repli' }[this.order]); }
    if (Input.pressed('lock')) this.toggleLock();
    if (Input.pressed('berry')) this.useBerry();
    for (const q of this.team) this.tickMember(q, dt);
    if (this.lock && (this.lock.dead || hyp(this.lock.x - m.x, this.lock.y - m.y) > 260)) this.lock = null;

    this.stamPause -= dt;
    const [ax, ay] = Input.axis(); const moving = !!(ax || ay);
    if (m.exh) { this.stamTick(dt, false); this.switchT -= dt; if (this.switchT <= 0) this.autoSwitch(); return; }

    let busy = false;
    if (m.hurtT > 0) { move(this, m, m.kx * dt, m.ky * dt); m.kx *= 0.88; m.ky *= 0.88; setAnim(m, 'Hurt', false); m.at += dt; busy = true; }
    else if (m.dodge) {
      const d = m.dodge; d.t += dt; const sp = d.dist / d.dur; move(this, m, d.dx * sp * dt, d.dy * sp * dt);
      setAnim(m, 'Walk'); m.at += dt * 2.4; busy = true; if (d.t >= d.dur) m.dodge = null;
    } else if (m.drink > 0) { m.drink -= dt; setAnim(m, 'Idle'); m.at += dt; busy = true; }
    else if (m.atk) {
      this.tickAtk(m, dt); busy = true;
      if (this.buf && this.buf.a === 'dodge' && (m.atk && m.atk.done)) { m.atk = null; this.buf = null; this.tryDodge(m, ax, ay); }
    }
    if (busy) { this.stamTick(dt, false); this.guarding = false; this.wasGuard = false; this.pushTrail(m); return; }

    const guarding = Input.down('guard') && this.stam > 0;
    if (guarding && !this.wasGuard) this.guardT = 0; this.wasGuard = guarding; if (guarding) this.guardT += dt; this.guarding = guarding;

    if (this.buf) {
      const a = this.buf.a; this.buf = null;
      if (a === 'dodge') { if (this.stam > 0) { this.tryDodge(m, ax, ay); return; } }
      else if (this.tryAttack(m, a)) return;
    }

    const run = Input.down('run') && moving && this.stam > 0 && !guarding;
    let spd = m.def.speed; if (run) { spd *= 1.5; this.stam = Math.max(0, this.stam - 8 * dt); this.stamPause = 0.5; } if (guarding) spd *= 0.45;
    if (moving) move(this, m, ax * spd * dt, ay * spd * dt);
    if (this.lock) { m.face = unit(this.lock.x - m.x, this.lock.y - m.y); }
    else if (moving) m.face = unit(ax, ay);
    setAnim(m, moving ? 'Walk' : 'Idle'); m.at += dt * (run ? 1.5 : 1) * (guarding ? 0.5 : 1);
    this.stamTick(dt, run || guarding);
    this.pushTrail(m);
  }
  stamTick(dt, hold) { if (!hold && this.stamPause <= 0) this.stam = Math.min(this.maxStam, this.stam + 35 * dt); }
  pushTrail(m) { const l = this.trail[this.trail.length - 1]; if (!l || hyp(l.x - m.x, l.y - m.y) > 4) { this.trail.push({ x: m.x, y: m.y }); if (this.trail.length > 160) this.trail.shift(); } }

  tryDodge(m, ax, ay) {
    let d = (ax || ay) ? unit(ax, ay) : { x: -m.face.x, y: -m.face.y };
    this.stam = Math.max(0, this.stam - 20); this.stamPause = 0.8;
    m.dodge = { t: 0, dur: 0.35, iframes: 0.28, dist: 64, dx: d.x, dy: d.y }; m.atk = null;
    if (!this.lock && (ax || ay)) m.face = d;
    SFX.dodge();
    for (let i = 0; i < 4; i++) this.spark(m.x, m.y, '#9fb3ff', 1);
    return true;
  }
  tryAttack(m, kind) {
    if (this.stam <= 0.5) return false;
    const ab = m.def.ability;
    if (kind === 'ability' && m.cd > 0) return false;
    const cost = kind === 'light' ? 12 : kind === 'heavy' ? 28 : ab.cost;
    this.stam = Math.max(0, this.stam - cost); this.stamPause = 0.8;
    this.startAttack(m, kind, this.aimTarget(m));
    return true;
  }
  aimTarget(m) {
    if (m === this.chief() && this.lock && !this.lock.dead) return this.lock;
    let best = null, bd = (m.def.range + 40) * (m.def.mode === 'ranged' ? 1.5 : 1);
    for (const e of this.enemies) {
      if (e.dead || e.state === 'dormant') continue; const dx = e.x - m.x, dy = e.y - m.y, d = hyp(dx, dy);
      if (d < bd && (d < 14 || (dx * m.face.x + dy * m.face.y) / d > 0.2)) { bd = d; best = e; }
    }
    return best;
  }
  toggleLock() {
    if (this.lock) { this.lock = null; return; }
    const m = this.chief(); let best = null, bd = 180;
    for (const e of this.enemies) { if (e.dead || e.state === 'dormant') continue; const d = hyp(e.x - m.x, e.y - m.y); if (d < bd && M.lineClear(this.world, m.x, m.y, e.x, e.y)) { bd = d; best = e; } }
    this.lock = best;
  }
  useBerry() {
    const m = this.chief(); if (m.exh || this.berries <= 0 || m.hp >= m.maxhp || m.atk || m.dodge || m.drink > 0) return;
    this.berries--; m.hp = Math.min(m.maxhp, m.hp + m.maxhp * 0.4); m.drink = 0.55; SFX.heal(); this.healFx(m);
  }
  cycleChief() { for (let k = 1; k <= 6; k++) { const i = (this.chiefIdx + k) % 6; if (!this.team[i].exh) { this.switchTo(i); return; } } }
  switchTo(i) {
    const n = this.team[i]; if (i === this.chiefIdx || n.exh || this.swapCd > 0) return;
    const o = this.chief(); o.atk = null; o.dodge = null; this.chiefIdx = i; this.swapCd = 0.4; this.lock = null; n.atk = null; n.dodge = null; n.hurtT = 0;
    this.trail = [{ x: n.x, y: n.y }]; SFX.pick();
    for (let k = 0; k < 6; k++) this.spark(n.x, n.y - 8, '#ffffff', 1);
  }
  autoSwitch() { for (let k = 1; k <= 6; k++) { const i = (this.chiefIdx + k) % 6; if (!this.team[i].exh) { this.switchTo2(i); return; } } this.die(); }
  switchTo2(i) { this.swapCd = 0; this.switchTo(i); }

  // ---------- attaques (chef et suiveurs) ----------
  startAttack(m, kind, tgt) {
    const d = m.def, ab = d.ability; const anim = kind === 'ability' ? ab.anim : d[kind];
    const tm = timing(d.id, anim);
    let aim = tgt ? unit(tgt.x - m.x, tgt.y - m.y) : { x: m.face.x, y: m.face.y };
    m.face = aim;
    m.atk = { kind, anim, t: 0, pre: kind === 'heavy' ? 0.26 : 0, hit: tm.hit, total: tm.total, done: false, aim, tgt };
    m.dir = dirFromVec(aim.x, aim.y);
    SFX.swing();
    if (kind === 'ability') {
      m.cd = m === this.chief() ? 4.5 : 9;
      if (ab.kind === 'lunge') m.dash = { vx: aim.x * 330, vy: aim.y * 330, t: 0.2 };
      if (ab.kind === 'smoke') {
        for (let i = 0; i < 10; i++) this.spark(m.x, m.y - 6, '#9a8cc0', 1.5);
        if (tgt) { const bx = tgt.x - aim.x * (tgt.r + 10), by = tgt.y - aim.y * (tgt.r + 10); if (M.boxFree(this.world, bx, by, 4, 3)) { m.x = bx; m.y = by; } m.inv = Math.max(m.inv, 0.4); }
        else m.dash = { vx: aim.x * 300, vy: aim.y * 300, t: 0.2 };
        for (let i = 0; i < 10; i++) this.spark(m.x, m.y - 6, '#9a8cc0', 1.5);
      }
    }
  }
  tickAtk(m, dt) {
    const a = m.atk; a.t += dt;
    if (m.dash) { move(this, m, m.dash.vx * dt, m.dash.vy * dt); m.dash.t -= dt; if (m.dash.t <= 0) m.dash = null; }
    else if (!a.done && m.def.mode === 'melee' && a.kind !== 'ability') move(this, m, a.aim.x * 26 * dt, a.aim.y * 26 * dt);
    m.dir = dirFromVec(a.aim.x, a.aim.y);
    if (a.t < a.pre) { setAnim(m, 'Charge'); m.at += dt; return; }
    const t = a.t - a.pre; setAnim(m, a.anim, false); m.at = t;
    if (!a.done && t >= a.hit) { a.done = true; this.doHit(m, a); }
    if (t >= a.total) m.atk = null;
  }
  powerOf(m, a) {
    const d = m.def; let mult = a.kind === 'heavy' ? 1.9 : a.kind === 'ability' ? d.ability.mult : 1;
    return d.dmg * dmgMult(m.lvl) * mult * (m === this.chief() ? 1 : 0.7);
  }
  doHit(m, a) {
    const d = m.def, dmg = this.powerOf(m, a), aim = a.aim, heavy = a.kind === 'heavy';
    if (a.kind === 'ability') {
      const k = d.ability.kind;
      if (k === 'lunge' || k === 'smoke') this.meleeArc(m, aim, d.range + 14, -0.1, dmg, { heavy: true, stagger: 0.7, knock: 90 });
      else if (k === 'shock') { this.meleeArc(m, aim, 48, -2, dmg, { heavy: true, stagger: 0.9, knock: 140 }); this.ringFx(m.x, m.y, 48, '#7fd0ff'); SFX.boom(); this.shake = Math.max(this.shake, 2); }
      else if (k === 'volley') { for (let i = -2; i <= 2; i++) this.fireProj({ x: m.x, y: m.y, ang: Math.atan2(aim.y, aim.x) + i * 0.16, speed: 230, dmg: dmg, r: 3, life: 0.9, team: 'p', color: '#9cff8a', owner: m }); SFX.shoot(); }
      else if (k === 'burst') { this.fireProj({ x: m.x, y: m.y, ang: Math.atan2(aim.y, aim.x), speed: 190, dmg: dmg, r: 5, life: 1.3, team: 'p', color: '#ff9aff', owner: m, explode: 30, heavy: true }); SFX.shoot(); }
      else if (k === 'heal') {
        for (const q of this.team) if (!q.exh && hyp(q.x - m.x, q.y - m.y) < 110) { q.hp = Math.min(q.maxhp, q.hp + q.maxhp * 0.3); this.healFx(q); }
        this.ringFx(m.x, m.y, 100, '#ffb0d8'); SFX.heal();
      }
      return;
    }
    if (d.mode === 'melee') this.meleeArc(m, aim, d.range + (heavy ? 8 : 4), heavy ? -0.1 : 0.25, dmg, { heavy, stagger: heavy ? 0.7 : 0.38, knock: heavy ? 70 : 30 });
    else {
      this.fireProj({ x: m.x, y: m.y, ang: Math.atan2(aim.y, aim.x), speed: heavy ? 150 : 210, dmg: dmg, r: heavy ? 5 : 3, life: 1.2, team: 'p', color: d.orb || '#ffe27a', owner: m, heavy });
      SFX.shoot();
    }
  }
  meleeArc(m, aim, range, cosMin, dmg, o) {
    let hit = false;
    for (const e of this.enemies) {
      if (e.dead || e.state === 'dormant' && false) continue;
      const dx = e.x - m.x, dy = e.y - m.y, d = hyp(dx, dy);
      if (d > range + e.r) continue;
      if (d > e.r + 6 && (dx * aim.x + dy * aim.y) / d < cosMin) continue;
      if (this.damageEnemy(e, dmg, m, o)) hit = true;
    }
    if (hit && m === this.chief()) this.hitstop = 0.045;
    return hit;
  }
  fireProj(p) {
    const sp = p.speed; this.projs.push({ ...p, vx: Math.cos(p.ang) * sp, vy: Math.sin(p.ang) * sp, age: 0 });
  }

  // ---------- dégâts ----------
  damageEnemy(e, dmg, src, o = {}) {
    if (e.dead || e.invuln > 0) return false;
    let back = false;
    if (src.def && src.def.back && (e.face.x * (src.x - e.x) + e.face.y * (src.y - e.y)) < 0) { dmg *= src.def.back; back = true; }
    else if (src.def && (e.face.x * (src.x - e.x) + e.face.y * (src.y - e.y)) < -4 && e.state !== 'dormant' && !e.boss) { dmg *= 1.15; }
    const crit = Math.random() < 0.08; if (crit) dmg *= 1.5;
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg; e.flash = 0.12; e.aggro = true;
    if (e.state === 'idle' || e.state === 'dormant') e.state = 'chase';
    this.floatText(e.x, e.y - 18, String(dmg), crit || back ? '#ffd24a' : '#ffffff');
    this.burst(e.x, e.y - 6, crit ? '#ffd24a' : '#ffffff', crit ? 8 : 4);
    (crit ? SFX.crit : SFX.hit)();
    const kd = unit(e.x - src.x, e.y - src.y);
    if (!e.boss && !e.def.armor) { e.kx = kd.x * (o.knock || 30) * 3; e.ky = kd.y * (o.knock || 30) * 3; }
    if (e.boss) {
      const th = BOSS.thresholds;
      if (e.phase === 1 && e.hp <= th[0] * e.maxhp) { e.hp = th[0] * e.maxhp; this.bossPhase(e, 2); }
      else if (e.phase === 2 && e.hp <= th[1] * e.maxhp) { e.hp = th[1] * e.maxhp; this.bossPhase(e, 3); }
    } else if (!e.def.armor || o.heavy) {
      if (e.state !== 'stagger' || true) { e.state = 'stagger'; e.st = o.stagger || 0.35; e.tele = false; }
    }
    if (e.hp <= 0) this.killEnemy(e);
    return true;
  }
  killEnemy(e) {
    e.dead = true; e.deadT = 0; e.hp = 0; e.tele = false;
    if (this.lock === e) this.lock = null;
    if (e.def.essence) { this.essence += e.def.essence; this.floatText(e.x, e.y - 28, '+' + e.def.essence, '#c9a7ff'); }
    this.burst(e.x, e.y - 6, e.boss ? '#e0a0ff' : '#c9a7ff', e.boss ? 40 : 12); SFX.hit();
    if (e.type === 'electrode') { this.miniDead = true; this.save(); this.emit('banner', 'ÉLECTRODE ALPHA VAINCU', 'mini'); }
    if (e.boss) this.bossDefeated(e);
  }
  hurtMember(m, dmg, src, o = {}) {
    if (m.exh || m.inv > 0 || this.god) return false;
    const chief = m === this.chief();
    if (chief && m.dodge && m.dodge.t < m.dodge.iframes) return false;
    const dx = src.x - m.x, dy = src.y - m.y, dl = hyp(dx, dy) || 1;
    if (chief && this.guarding && (dx * m.face.x + dy * m.face.y) / dl > -0.15 && !m.atk) {
      if (this.guardT < 0.22 && o.parry !== false) {
        SFX.parry(); this.hitstop = 0.09; this.shake = 3; this.floatText(m.x, m.y - 24, 'PARADE !', '#9fe8ff'); this.burst(m.x + m.face.x * 10, m.y - 6, '#9fe8ff', 10);
        m.inv = 0.4; this.stam = Math.min(this.maxStam, this.stam + 20);
        return 'parry';
      }
      const red = m.def.guard != null ? m.def.guard : 0.35; dmg = Math.max(1, Math.round(dmg * red));
      this.stam = Math.max(0, this.stam - dmg * 1.1 - 6); this.stamPause = 1; SFX.block();
      this.burst(m.x + m.face.x * 8, m.y - 6, '#cfe6ff', 5);
      if (this.stam <= 0) { this.guarding = false; this.guardT = 9; m.hurtT = 0.4; m.kx = -dx / dl * 90; m.ky = -dy / dl * 90; this.emit('toast', 'Garde brisée'); }
    } else {
      dmg = Math.round(dmg); m.hurtT = 0.28 + (o.heavy ? 0.15 : 0); m.kx = -dx / dl * (o.heavy ? 150 : 80); m.ky = -dy / dl * (o.heavy ? 150 : 80); m.atk = null; m.dash = null;
      SFX.hurt(); if (chief) { this.shake = Math.max(this.shake, 3); this.hitstop = 0.05; }
    }
    m.hp -= dmg; m.flash = 0.12; m.inv = 0.45;
    this.floatText(m.x, m.y - 22, String(dmg), '#ff6a6a'); this.burst(m.x, m.y - 6, '#ff6a6a', 4);
    if (m.hp <= 0) this.memberDown(m);
    return true;
  }
  memberDown(m) {
    m.hp = 0; m.exh = true; m.atk = null; m.dodge = null; m.drink = 0; m.deadT = 0; setAnim(m, A.db[m.def.id].anims.Faint ? 'Faint' : 'Hurt', false);
    this.floatText(m.x, m.y - 24, 'ÉPUISÉ', '#ff9a9a'); SFX.death();
    if (m === this.chief()) { this.switchT = 0.8; this.lock = null; this.guarding = false; }
    if (this.team.every(q => q.exh)) this.die();
  }
  die() {
    if (this.state === 'dead') return;
    this.state = 'dead'; this.deadT = 0; this.guarding = false;
    const c = this.chief();
    if (this.essence > 0) this.souvenir = { x: c.x, y: c.y, amount: this.essence };
    this.essence = 0; this.save(); SFX.death(); this.emit('banner', 'VOUS ÊTES MORT', 'death');
  }
  respawn() {
    const b = this.last ? M.BONFIRES.find(b => b.id === this.last) : null;
    for (const m of this.team) { m.exh = false; m.hp = m.maxhp; m.hurtT = 0; m.inv = 1; m.cd = 0; m.anim = 'Idle'; }
    this.chiefIdx = 0; this.berries = 5; this.stam = this.maxStam; this.state = 'play'; this.spawnAll();
    this.placeTeam(b ? (b.tx + 0.5) * TS : (M.START.tx + 0.5) * TS, b ? (b.ty + 1.6) * TS : (M.START.ty + 0.5) * TS);
    this.snapCam(); this.emit('fade');
  }

  // ---------- suiveurs ----------
  tickMember(m, dt) {
    m.flash -= dt; m.inv -= dt; m.cd -= dt;
    if (m.exh) { m.at += dt; m.deadT += dt; }
  }
  updateFollowers(dt) {
    const ch = this.chief(); let rank = 0;
    for (const m of this.team) {
      if (m === ch || m.exh) continue; rank++;
      m.acd -= dt;
      if (m.hurtT > 0) { m.hurtT -= dt; move(this, m, m.kx * dt, m.ky * dt); m.kx *= 0.88; m.ky *= 0.88; setAnim(m, 'Hurt', false); m.at += dt; continue; }
      if (m.atk) { this.tickAtk(m, dt); continue; }
      if (m.dash) { move(this, m, m.dash.vx * dt, m.dash.vy * dt); m.dash.t -= dt; if (m.dash.t <= 0) m.dash = null; }
      const d = m.def;
      // soin
      if (d.ability.kind === 'heal' && m.cd <= 0 && this.team.some(q => !q.exh && q.hp < q.maxhp * 0.55 && hyp(q.x - m.x, q.y - m.y) < 90)) { this.startAttack(m, 'ability', null); continue; }
      // cible
      let tgt = null, bd = this.order === 'garde' ? 90 : this.order === 'repli' ? d.range : 150;
      if (this.lock && !this.lock.dead && this.order === 'focus') tgt = this.lock;
      else for (const e of this.enemies) {
        if (e.dead || e.state === 'dormant') continue;
        const dd = hyp(e.x - m.x, e.y - m.y); if (dd < bd && hyp(e.x - ch.x, e.y - ch.y) < 200) { bd = dd; tgt = e; }
      }
      let mx = 0, my = 0, spd = d.speed * 1.1, face = null;
      if (tgt && (this.order !== 'repli' || d.mode === 'ranged')) {
        const dx = tgt.x - m.x, dy = tgt.y - m.y, dd = hyp(dx, dy), u = unit(dx, dy); face = u;
        const tether = hyp(ch.x - m.x, ch.y - m.y);
        if (d.mode === 'melee') {
          if (this.order === 'garde' && tether > 100) { const l = this.slot(rank); mx = l.x - m.x; my = l.y - m.y; }
          else if (dd > d.range * 0.8) { mx = u.x; my = u.y; }
          if (dd < d.range + tgt.r + 6 && m.acd <= 0) { this.startAttack(m, Math.random() < 0.25 ? 'heavy' : 'light', tgt); m.acd = rand(0.9, 1.6); continue; }
        } else {
          if (dd < d.range * 0.5) { mx = -u.x; my = -u.y; } else if (dd > d.range * 0.95 && this.order !== 'repli') { mx = u.x; my = u.y; }
          if (dd < d.range && m.acd <= 0 && M.lineClear(this.world, m.x, m.y, tgt.x, tgt.y)) {
            const ab = d.ability.kind !== 'heal' && m.cd <= 0 && Math.random() < 0.25;
            this.startAttack(m, ab ? 'ability' : 'light', tgt); m.acd = rand(1.0, 1.7); continue;
          }
        }
        if (d.mode === 'melee' && m.cd <= 0 && dd < 90 && dd > 30 && Math.random() < 0.01) { this.startAttack(m, 'ability', tgt); continue; }
      } else {
        const l = this.slot(rank), dx = l.x - m.x, dy = l.y - m.y, dd = hyp(dx, dy);
        if (dd > 220) { m.x = l.x; m.y = l.y; }
        if (dd > 5) { mx = dx / dd; my = dy / dd; if (dd > 60) spd *= 1.4; }
      }
      const ml = hyp(mx, my);
      if (ml > 0.05) { mx /= ml; my /= ml; move(this, m, mx * spd * dt, my * spd * dt); if (!face) face = { x: mx, y: my }; setAnim(m, 'Walk'); } else setAnim(m, 'Idle');
      if (face) { m.face = face; m.dir = dirFromVec(face.x, face.y); }
      m.at += dt;
    }
  }
  slot(rank) { const k = Math.min(this.trail.length - 1, rank * 5); return this.trail[Math.max(0, this.trail.length - 1 - k)]; }

  // ---------- ennemis ----------
  nearestMember(e) {
    let best = null, bd = 1e9;
    for (const m of this.team) { if (m.exh) continue; const d = hyp(m.x - e.x, m.y - e.y); if (d < bd) { bd = d; best = m; } }
    return [best, bd];
  }
  updateEnemies(dt) {
    const ch = this.chief();
    for (const e of this.enemies) {
      if (e.dead) { e.deadT += dt; e.at += dt; continue; }
      e.at += dt; e.flash -= dt; e.cd -= dt; e.invuln = Math.max(0, e.invuln - dt);
      if (hyp(e.x - ch.x, e.y - ch.y) > 320 && e.state === 'idle' && !e.boss) continue;
      if (Math.abs(e.kx) + Math.abs(e.ky) > 1) { move(this, e, e.kx * dt, e.ky * dt, Math.min(e.r, 6) * 0.8); e.kx *= 0.86; e.ky *= 0.86; }
      if (e.boss) { this.bossAI(e, dt); continue; }
      const def = e.def; const [tg, td] = this.nearestMember(e);
      if (!tg) continue;
      const dx = tg.x - e.x, dy = tg.y - e.y, u = unit(dx, dy);
      const see = td < def.sight && M.lineClear(this.world, e.x, e.y, tg.x, tg.y);
      const sp = def.speed;
      switch (e.state) {
        case 'dormant': setAnim(e, 'Idle'); if (td < def.sight) { e.state = 'chase'; } break;
        case 'idle': setAnim(e, 'Idle'); if (see) e.state = 'chase'; break;
        case 'return': {
          const hx = e.hx - e.x, hy = e.hy - e.y, hd = hyp(hx, hy);
          if (hd < 4) { e.state = def.dormant ? 'dormant' : 'idle'; e.hp = e.maxhp; } else { move(this, e, hx / hd * sp * dt, hy / hd * sp * dt, 5); setAnim(e, 'Walk'); e.face = unit(hx, hy); e.dir = dirFromVec(hx, hy); }
          if (see && td < def.sight * 0.8) e.state = 'chase';
          break;
        }
        case 'chase': {
          e.face = u; e.dir = dirFromVec(u.x, u.y);
          if (td > def.sight * 2.2 || hyp(e.x - e.hx, e.y - e.hy) > 420) { e.state = 'return'; break; }
          let mvx = 0, mvy = 0;
          if (def.kind === 'ranged' || def.kind === 'ranged3') {
            if (td < def.range * 0.6) { mvx = -u.x; mvy = -u.y; } else if (td > def.range * 0.95) { mvx = u.x; mvy = u.y; } else { mvx = -u.y * 0.5; mvy = u.x * 0.5; }
            if (td < def.range && e.cd <= 0 && see) { e.state = 'windup'; e.st = def.windup; e.tele = true; SFX.telegraph(); }
          } else if (def.kind === 'melee') {
            if (td > 40) { mvx = u.x; mvy = u.y; }
            if (td < 62 && e.cd <= 0) { e.state = 'windup'; e.st = def.windup; e.tele = true; e.lock = u; SFX.telegraph(); }
          } else if (def.kind === 'bomb') {
            mvx = u.x; mvy = u.y;
            if (td < def.range) { e.state = 'windup'; e.st = def.windup; e.tele = true; SFX.telegraph(); }
          } else if (def.kind === 'roller') {
            if (td > def.range * 0.8) { mvx = u.x; mvy = u.y; }
            if (td < def.range * 1.4 && e.cd <= 0) { e.state = 'windup'; e.st = def.windup; e.tele = true; SFX.telegraph(); }
          }
          const ml = hyp(mvx, mvy); if (ml > 0.05) { move(this, e, mvx / ml * sp * dt, mvy / ml * sp * dt, Math.min(e.r, 6) * 0.8); setAnim(e, 'Walk'); } else setAnim(e, 'Idle');
          break;
        }
        case 'windup':
          setAnim(e, 'Charge'); e.st -= dt;
          if (def.kind !== 'roller' && def.kind !== 'melee') { e.face = u; e.dir = dirFromVec(u.x, u.y); }
          if (def.kind === 'melee') { e.lock = e.lock || u; e.dir = dirFromVec(e.lock.x, e.lock.y); }
          if (e.st <= 0) { e.tele = false; this.enemyStrike(e, u, tg); }
          break;
        case 'attack': this.enemyAttack(e, dt); break;
        case 'recover': e.st -= dt; setAnim(e, 'Idle'); if (e.st <= 0) e.state = 'chase'; break;
        case 'stagger': e.st -= dt; setAnim(e, 'Hurt', false); if (e.st <= 0) { e.state = 'chase'; e.cd = Math.max(e.cd, 0.4); } break;
        case 'dizzy': e.st -= dt; setAnim(e, 'Hurt', false); if (e.st <= 0) { e.state = 'chase'; e.cd = 1; } break;
      }
      // séparation
      for (const o of this.enemies) { if (o === e || o.dead) continue; const ox = e.x - o.x, oy = e.y - o.y, od = hyp(ox, oy); if (od > 0 && od < e.r + o.r) { move(this, e, ox / od * 30 * dt, oy / od * 30 * dt, 4); } }
    }
    this.enemies = this.enemies.filter(e => !(e.dead && e.deadT > 1.0 && !e.boss));
  }
  enemyStrike(e, u, tg) {
    const def = e.def;
    if (def.kind === 'ranged' || def.kind === 'ranged3') {
      const ang = Math.atan2(tg.y - e.y, tg.x - e.x); const n = def.kind === 'ranged3' ? [-0.28, 0, 0.28] : [0];
      for (const o of n) this.fireProj({ x: e.x, y: e.y, ang: ang + o, speed: def.proj, dmg: def.dmg, r: 3.5, life: 2.6, team: 'e', color: def.color, owner: e });
      SFX.shoot(); setAnim(e, def.anim, false); e.state = 'recover'; e.st = 0.45; e.cd = 1.7 * (def.rec || 1);
    } else if (def.kind === 'melee') {
      e.state = 'attack'; e.st = 0.24; e.hitDone = false; setAnim(e, def.anim, false); e.vx = (e.lock || u).x; e.vy = (e.lock || u).y; e.lock = null; SFX.swing();
    } else if (def.kind === 'bomb') {
      this.explode(e);
    } else if (def.kind === 'roller') {
      e.state = 'attack'; e.st = 0.9; e.hitDone = false; e.vx = u.x; e.vy = u.y; e.rollHit = new Set(); setAnim(e, 'Walk'); SFX.swing();
    }
  }
  enemyAttack(e, dt) {
    const def = e.def; e.st -= dt;
    if (def.kind === 'melee') {
      move(this, e, e.vx * def.lunge * dt, e.vy * def.lunge * dt, 5);
      if (!e.hitDone) for (const m of this.team) if (!m.exh && hyp(m.x - e.x, m.y - e.y) < e.r + 10) { const r = this.hurtMember(m, def.dmg, e, { owner: e }); e.hitDone = true; if (r === 'parry') this.parried(e); }
      if (e.st <= 0) { e.state = 'recover'; e.st = 0.55; e.cd = 1.3 * (def.rec || 1); }
    } else if (def.kind === 'roller') {
      const px = e.x, py = e.y; const sp = 200 * (e.st > 0.1 ? 1 : 0.4);
      move(this, e, e.vx * sp * dt, e.vy * sp * dt, 7, 5);
      for (const m of this.team) if (!m.exh && !e.rollHit.has(m) && hyp(m.x - e.x, m.y - e.y) < e.r + 8) { e.rollHit.add(m); const r = this.hurtMember(m, def.dmg, e, { owner: e, heavy: true }); if (r === 'parry') { this.parried(e); return; } }
      this.parts.push({ x: e.x, y: e.y, z: 4, vx: 0, vy: 0, vz: 10, life: 0.3, max: 0.3, c: '#ffe27a', size: 2 });
      if (hyp(e.x - px, e.y - py) < 0.4 * 200 * dt * 0.5) { e.state = 'dizzy'; e.st = 1.3; this.shake = 3; SFX.boom(); this.floatText(e.x, e.y - 24, 'Étourdi', '#ffe27a'); }
      else if (e.st <= 0) { e.state = 'recover'; e.st = 0.7; e.cd = 1.2; }
    }
  }
  parried(e) { if (e.boss) return; e.state = 'dizzy'; e.st = 1.4; e.tele = false; e.invuln = 0; e.cd = 1.2; }
  explode(e) {
    const def = e.def; this.ringFx(e.x, e.y, def.blast, '#ffb050'); SFX.boom(); this.shake = 5; this.burst(e.x, e.y - 6, '#ffb050', 18);
    for (const m of this.team) if (!m.exh && hyp(m.x - e.x, m.y - e.y) < def.blast) this.hurtMember(m, def.dmg, e, { owner: e, heavy: true, parry: false });
    e.dead = true; e.deadT = 2; e.hp = 0; if (this.lock === e) this.lock = null;
  }

  // ---------- Mewtwo ----------
  startBoss() {
    const a = this.world.arena;
    this.bossActive = true; this.closeFog();
    const b = this.makeEnemy('boss', (a.cx + 4) * TS, a.cy * TS);
    b.state = 'intro'; b.st = 2.2; b.invuln = 2.2; b.cd = 1.5; b.face = { x: -1, y: 0 }; b.dir = 6;
    this.enemies.push(b); this.boss = b; SFX.boom();
    this.emit('bossStart', b);
  }
  bossPhase(b, ph) {
    b.phase = ph; b.state = 'phase'; b.st = 2.0; b.invuln = 2.0; b.tele = false; this.projs = this.projs.filter(p => p.team !== 'e'); this.rings = [];
    this.shake = 8; SFX.boom(); this.burst(b.x, b.y - 10, '#e0a0ff', 30);
    if (ph === 3) this.spawnClones();
    this.emit('toast', ph === 2 ? 'Mewtwo libère sa puissance' : 'Mewtwo déploie ses clones');
  }
  spawnClones() {
    const a = this.world.arena;
    for (let i = 0; i < 3; i++) { const an = i * 2.094 + 0.5; const c = this.makeEnemy('clone', (a.cx + Math.cos(an) * 7) * TS, (a.cy + Math.sin(an) * 7) * TS); c.state = 'chase'; c.cd = 1.5 + i * 0.8; this.enemies.push(c); }
  }
  bossAI(b, dt) {
    const def = b.def; const [tg, td] = this.nearestMember(b); if (!tg) return;
    const u = unit(tg.x - b.x, tg.y - b.y);
    switch (b.state) {
      case 'intro': setAnim(b, 'Appeal', false); b.st -= dt; if (b.st <= 0) { b.state = 'move'; b.invuln = 0; } break;
      case 'phase': setAnim(b, 'Appeal', false); b.st -= dt; this.shake = Math.max(this.shake, 1.5); if (b.st <= 0) { b.state = 'move'; b.invuln = 0; b.cd = 0.8; } break;
      case 'move': {
        b.face = u; b.dir = dirFromVec(u.x, u.y);
        const want = b.phase === 1 ? 74 : 60; let mx = 0, my = 0;
        if (td > want + 10) { mx = u.x; my = u.y; } else if (td < want - 25 && td > 30) { mx = -u.x; my = -u.y; } else { mx = -u.y * 0.4; my = u.x * 0.4; }
        const sp = def.speed * (b.phase === 3 ? 1.25 : 1); move(this, b, mx * sp * dt, my * sp * dt, 6, 4);
        setAnim(b, b.phase >= 2 ? 'Hover' : 'Walk');
        if (b.cd <= 0) this.bossChoose(b, td, tg);
        break;
      }
      case 'windup':
        b.st -= dt; b.face = b.atkType === 'pulse' ? b.face : u; b.dir = dirFromVec(b.face.x, b.face.y); setAnim(b, b.atkType === 'pulse' ? 'SpAttack' : 'Charge'); b.tele = true;
        if (b.st <= 0) { b.tele = false; this.bossStrike(b, u, tg); }
        break;
      case 'recover': b.st -= dt; setAnim(b, 'Idle'); if (b.st <= 0) { b.state = 'move'; if (b.queue > 0) { b.queue--; b.cd = 0; this.bossChoose(b, td, tg, 'ball'); } } break;
    }
    // clones : relance en phase 3
    if (b.phase === 3 && b.state === 'move' && !this.enemies.some(e => e.clone && !e.dead) && b.cd < 0) { this.spawnClones(); }
    if (b.phase === 3) for (const e of this.enemies) if (e.clone && !e.dead) { e.face = unit(tg.x - e.x, tg.y - e.y); e.dir = dirFromVec(e.face.x, e.face.y); }
  }
  bossChoose(b, td, tg, force) {
    const p = Math.random(); let type = 'ball';
    if (force) type = force;
    else if (td < 42) type = p < 0.75 ? 'swing' : 'ball';
    else if (b.phase >= 2 && p < 0.35) type = 'pulse';
    b.atkType = type; b.state = 'windup'; SFX.telegraph();
    b.st = type === 'swing' ? 0.5 : type === 'pulse' ? 0.95 : 0.6;
    if (type === 'ball' && b.phase >= 2 && !force) b.queue = 1;
  }
  bossStrike(b, u, tg) {
    const def = b.def;
    if (b.atkType === 'ball') {
      const ang = Math.atan2(tg.y - b.y, tg.x - b.x);
      this.fireProj({ x: b.x, y: b.y, ang, speed: 140, dmg: 26, r: 6, life: 3.5, team: 'e', color: '#d89aff', owner: b, big: true }); SFX.shoot();
      setAnim(b, 'Shoot', false); b.state = 'recover'; b.st = 0.5; b.cd = b.phase === 1 ? 1.5 : b.phase === 2 ? 1.1 : 0.8;
    } else if (b.atkType === 'swing') {
      setAnim(b, 'Swing', false); SFX.swing();
      for (const m of this.team) {
        if (m.exh) continue; const dx = m.x - b.x, dy = m.y - b.y, d = hyp(dx, dy);
        if (d < 46 && (dx * b.face.x + dy * b.face.y) / (d || 1) > 0.0) { const r = this.hurtMember(m, 34, b, { owner: b, heavy: true }); if (r === 'parry') { b.state = 'recover'; b.st = 1.0; b.cd = 0.6; return; } }
      }
      this.ringFx(b.x + b.face.x * 20, b.y + b.face.y * 20, 30, '#e0a0ff');
      b.state = 'recover'; b.st = 0.6; b.cd = b.phase === 1 ? 1.2 : 0.8;
    } else {
      setAnim(b, 'SpAttack', false); SFX.boom(); this.shake = 4;
      for (let i = 0; i < 3; i++) this.rings.push({ x: b.x, y: b.y, r: 4 - i * 40, speed: 95, max: 250, hit: new Set(), dmg: 26 });
      b.state = 'recover'; b.st = 0.9; b.cd = b.phase === 2 ? 1.4 : 1.0;
    }
  }
  bossDefeated(b) {
    this.bossActive = false; this.bossDead = true; this.enemies.forEach(e => { if (e.clone) { e.dead = true; e.deadT = 0.2; } });
    this.projs = this.projs.filter(p => p.team !== 'e'); this.rings = []; setAnim(b, 'Faint', false); this.hitstop = 0.25; this.shake = 9;
    this.openFog(); SFX.victory(); this.save();
    this.emit('banner', 'LÉGENDAIRE VAINCU', 'victory');
  }

  // ---------- projectiles, anneaux, effets ----------
  updateProjs(dt) {
    for (const p of this.projs) {
      p.age += dt; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0 || M.solidAt(this.world, p.x, p.y)) { p.dead = true; this.burst(p.x, p.y, p.color, 3); if (p.explode && p.life > 0) this.projExplode(p); continue; }
      if (Math.random() < 0.6) this.parts.push({ x: p.x, y: p.y, z: 8, vx: 0, vy: 0, vz: 0, life: 0.25, max: 0.25, c: p.color, size: p.big ? 3 : 2 });
      if (p.team === 'p') {
        for (const e of this.enemies) {
          if (e.dead || p.dead) continue;
          if (hyp(e.x - p.x, e.y - 4 - p.y) < e.r + p.r + 2) {
            if (p.explode) { this.projExplode(p); p.dead = true; break; }
            this.damageEnemy(e, p.dmg, p.owner, { heavy: p.heavy, stagger: 0.3, knock: 20 }); p.dead = true; if (p.owner === this.chief()) this.hitstop = 0.03; break;
          }
        }
      } else {
        for (const m of this.team) {
          if (m.exh || p.dead) continue;
          if (hyp(m.x - p.x, m.y - 4 - p.y) < 7 + p.r) {
            const r = this.hurtMember(m, p.dmg, p, { owner: p.owner, heavy: p.big });
            if (r === 'parry') { p.team = 'p'; p.vx *= -1.3; p.vy *= -1.3; p.dmg *= 2.5; p.owner = m; p.life = 2; p.color = '#9fe8ff'; p.age = 0; }
            else p.dead = true;
            break;
          }
        }
      }
    }
    this.projs = this.projs.filter(p => !p.dead);
  }
  projExplode(p) {
    this.ringFx(p.x, p.y, p.explode, p.color); SFX.boom(); this.burst(p.x, p.y, p.color, 14);
    for (const e of this.enemies) if (!e.dead && hyp(e.x - p.x, e.y - p.y) < p.explode + e.r) this.damageEnemy(e, p.dmg, p.owner, { heavy: true, stagger: 0.8, knock: 80 });
  }
  updateRings(dt) {
    for (const r of this.rings) {
      r.r += r.speed * dt;
      if (r.r > 0) for (const m of this.team) if (!m.exh && !r.hit.has(m) && Math.abs(hyp(m.x - r.x, m.y - r.y) - r.r) < 6) { r.hit.add(m); this.hurtMember(m, r.dmg, r, { parry: false, heavy: true }); }
    }
    this.rings = this.rings.filter(r => r.r < r.max);
  }
  spark(x, y, c, n = 1) { for (let i = 0; i < n; i++) this.parts.push({ x, y, z: 4, vx: rand(-30, 30), vy: rand(-20, 20), vz: rand(10, 40), life: 0.35, max: 0.35, c, size: 2 }); }
  burst(x, y, c, n) { for (let i = 0; i < n; i++) { const a = rand(0, 6.28), s = rand(20, 80); this.parts.push({ x, y, z: 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: rand(10, 60), life: rand(0.25, 0.5), max: 0.5, c, size: 2, g: 160 }); } }
  healFx(m) { for (let i = 0; i < 8; i++) this.parts.push({ x: m.x + rand(-8, 8), y: m.y + rand(-4, 4), z: 0, vx: 0, vy: 0, vz: rand(25, 50), life: 0.8, max: 0.8, c: '#8dffb0', size: 2 }); this.floatText(m.x, m.y - 24, '+', '#8dffb0'); }
  ringFx(x, y, r, c) { this.fxRings = this.fxRings || []; this.fxRings.push({ x, y, r, c, t: 0 }); }
  floatText(x, y, s, c) { this.texts.push({ x: x + rand(-4, 4), y, s, c, t: 0 }); }
  updateFx(dt) {
    for (const p of this.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= (p.g || 0) * dt; }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const t of this.texts) { t.t += dt; t.y -= 14 * dt; }
    this.texts = this.texts.filter(t => t.t < 0.9);
    if (this.fxRings) { for (const r of this.fxRings) r.t += dt; this.fxRings = this.fxRings.filter(r => r.t < 0.45); }
  }

  // ---------- monde : zones, feux, portes, brume ----------
  updateWorld(dt) {
    const c = this.chief(); this.prompt = null;
    const z = M.zoneAt(this.world, c.x, c.y);
    if (z && z.area && z.area !== this.lastArea) { this.lastArea = z.area; this.emit('area', z); }
    // souvenir
    const s = this.souvenir;
    if (s && hyp(s.x - c.x, s.y - c.y) < 14) { this.essence += s.amount; this.floatText(c.x, c.y - 30, '+' + s.amount, '#c9a7ff'); this.souvenir = null; SFX.pick(); this.save(); this.emit('toast', 'Souvenir récupéré'); }
    for (const it of this.items) if (it.kind === 'plaque' && hyp(it.x - c.x, it.y - c.y) < 26 && !this.plaque) this.prompt = { text: 'Prendre la Plaque Psy', act: () => { this.plaque = true; this.items = []; SFX.victory(); this.save(); this.emit('banner', 'PLAQUE PSY OBTENUE', 'item'); this.emit('end'); } };
    // feux
    for (const b of M.BONFIRES) if (hyp((b.tx + 0.5) * TS - c.x, (b.ty + 0.5) * TS - c.y) < 42) {
      this.prompt = this.lit.has(b.id) ? { text: 'Se recueillir au feu', act: () => { this.last = b.id; this.emit('menu', b); } } : { text: 'Allumer le feu', act: () => this.lightBonfire(b) };
    }
    // porte-raccourci : s'ouvre depuis le nord
    if (!this.doorOpen) for (const [tx, ty] of this.world.doorTiles) {
      const cx = (tx + 0.5) * TS, cy = (ty + 0.5) * TS;
      if (Math.abs(c.x - cx) < 40 && Math.abs(c.y - cy) < 32) {
        this.prompt = c.y < cy ? { text: 'Ouvrir la porte', act: () => this.openDoor() } : { text: 'Verrouillée de l’autre côté', act: null };
      }
    }
    // brume
    if (!this.bossDead && !this.bossActive) for (const [tx, ty] of this.world.fogTiles) {
      const cx = (tx + 0.5) * TS, cy = (ty + 0.5) * TS;
      if (c.x < cx && cx - c.x < 56 && Math.abs(c.y - cy) < 44) this.prompt = { text: 'Franchir la brume', act: () => this.enterFog() };
    }
    if (this.prompt && this.prompt.act && Input.pressed('interact') && !c.atk && !c.dodge && c.hurtT <= 0) this.prompt.act();
  }
  lightBonfire(b) {
    this.lit.add(b.id); this.last = b.id; this.rest(true); SFX.bonfire(); this.emit('banner', 'FEU ALLUMÉ', 'fire');
  }
  rest(quiet) {
    for (const m of this.team) { m.exh = false; m.hp = m.maxhp; m.hurtT = 0; m.anim = 'Idle'; }
    this.berries = 5; this.stam = this.maxStam; this.spawnAll(); this.save();
    if (!quiet) SFX.bonfire();
  }
  openDoor() { this.doorOpen = true; for (const [x, y] of this.world.doorTiles) this.world.grid[y * M.MW + x] = M.T.FLOOR; SFX.door(); this.save(); this.emit('toast', 'Raccourci ouvert'); }
  enterFog() {
    const a = this.world.arena; SFX.door();
    const sx = (a.cx - a.r + 1.5) * TS, sy = a.cy * TS;
    this.team.forEach((m, i) => { m.x = sx + (i % 2) * 8; m.y = sy + (i - 2.5) * 9; m.atk = null; m.dodge = null; });
    this.trail = [{ x: sx, y: sy }]; this.lock = null;
    this.startBoss(); this.emit('fade');
  }
  levelUp(i) {
    const m = this.team[i], cost = levelCost(m.lvl);
    if (this.essence < cost) return false;
    this.essence -= cost; m.lvl++; this.applyLevels(false); this.save(); SFX.pick(); return true;
  }

  // ---------- développement ----------
  devKey(k) {
    if (!this.dev) return;
    if (k === 'F1') { this.god = !this.god; this.emit('toast', 'Invincible : ' + (this.god ? 'oui' : 'non')); }
    if (k === 'F2') { const f = this.world.fogTiles[1]; this.placeTeam((f[0] - 0.8) * TS, (f[1] + 0.5) * TS); this.snapCam(); }
    if (k === 'F3') { this.essence += 1000; }
    if (k === 'F4') { for (const e of this.enemies) if (!e.dead && !e.boss && hyp(e.x - this.chief().x, e.y - this.chief().y) < 260) this.damageEnemy(e, 99999, this.chief(), { heavy: true }); }
    if (k === 'F5' && this.boss && !this.boss.dead) { this.boss.hp = Math.min(this.boss.hp, this.boss.maxhp * 0.27); }
  }
}
