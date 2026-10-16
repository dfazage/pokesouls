// Extensions du cœur de jeu : ulti « Lien » (coéquipiers), combos à attaque signature, obstacles et éléments de terrain des boss.
// installExtras() ajoute ces méthodes à la classe Game (game.js lui fournit ses utilitaires).

import { TYPE_COLOR } from './pool.js';
import { TYPE_FR } from './data.js';

// Couleur des anneaux du Lien (planches PMD) selon le type du Pokémon.
export const LINKC = { fire: 'red', water: 'blue', grass: 'green', electric: 'yellow', psychic: 'pink', fairy: 'pink', ghost: 'purple', poison: 'purple', dark: 'purple', dragon: 'blue', ice: 'blue', flying: 'blue', fighting: 'red', rock: 'yellow', ground: 'yellow', steel: 'blue', bug: 'green', normal: 'yellow' };

// Attaques signature : une par type (feu / eau / plante) et par stade d'évolution (0, 1, 2).
// kinds : cross (deux entailles), whirl (tourbillon), blast (3 boules explosives), rush (charge perforante), storm (pluie d'impacts), fan (éventail), leaves (nova de feuilles), sun (rayon + soin)
export const SIGS = {
  fire: [
    { name: 'Croix Ardente', kind: 'cross', anims: ['Double', 'Attack', 'Strike'], color: '#ff8a30', mult: 2.4, st: ['burn', 0.2] },
    { name: 'Roue de Flammes', kind: 'whirl', anims: ['Rotate', 'Spin', 'Swing', 'Attack'], color: '#ff6a30', mult: 2.9, radius: 50, st: ['burn', 0.3] },
    { name: 'Grand Brasier', kind: 'blast', anims: ['SpAttack', 'Shoot', 'Charge', 'Attack'], color: '#ff5a20', mult: 3.3, st: ['burn', 0.35] },
  ],
  water: [
    { name: 'Jet Perforant', kind: 'rush', anims: ['Charge', 'Kick', 'Strike', 'Attack'], color: '#5ab8ff', mult: 2.5, st: null },
    { name: 'Tourbillon Marin', kind: 'whirl', anims: ['Rotate', 'Spin', 'Swing', 'Attack'], color: '#4aa8ff', mult: 2.8, radius: 56, pull: true, st: null },
    { name: 'Déluge', kind: 'storm', anims: ['Appeal', 'SpAttack', 'Shoot', 'Charge'], color: '#7fd0ff', mult: 3.2, n: 6, st: null },
  ],
  grass: [
    { name: 'Fouet Croisé', kind: 'fan', anims: ['Double', 'Shoot', 'Attack'], color: '#9cff8a', mult: 2.2, st: ['poison', 0.2] },
    { name: 'Tempête de Feuilles', kind: 'leaves', anims: ['SpAttack', 'Shoot', 'Charge'], color: '#6cd84c', mult: 2.7, st: ['poison', 0.3] },
    { name: 'Fléau Solaire', kind: 'sun', anims: ['SpAttack', 'Shoot', 'Charge'], color: '#e4ff7a', mult: 3.3, st: null },
  ],
};

// Attaques signature des types sans kit propre : un kit par gabarit (A, R, D, S), couleur et nom du type.
const GEN_KITS = {
  A: [['Croix', 'cross', ['Double', 'Attack', 'Strike'], 2.4], ['Tourbillon', 'whirl', ['Rotate', 'Spin', 'Swing', 'Attack'], 2.8], ['Charge', 'rush', ['Charge', 'Kick', 'Strike', 'Attack'], 3.2]],
  R: [['Charge', 'rush', ['Charge', 'Kick', 'Strike', 'Attack'], 2.3], ['Tourbillon', 'whirl', ['Rotate', 'Spin', 'Swing', 'Attack'], 2.6], ['Déluge', 'storm', ['Appeal', 'SpAttack', 'Shoot', 'Charge'], 3.0]],
  D: [['Éventail', 'fan', ['Double', 'Shoot', 'Attack'], 2.2], ['Rafale', 'storm', ['Appeal', 'SpAttack', 'Shoot', 'Charge'], 2.8], ['Grande explosion', 'blast', ['SpAttack', 'Shoot', 'Charge', 'Attack'], 3.3]],
  S: [['Éventail', 'fan', ['Double', 'Shoot', 'Attack'], 2.0], ['Nova', 'leaves', ['SpAttack', 'Shoot', 'Charge'], 2.6], ['Rayon bienfaisant', 'sun', ['SpAttack', 'Shoot', 'Charge'], 3.2]],
};
const genSigs = {};
export function sigsOf(m) {
  if (SIGS[m.type]) return SIGS[m.type];
  const k = m.gab + m.type; if (genSigs[k]) return genSigs[k];
  const col = (TYPE_COLOR[m.type] || TYPE_COLOR.normal)[0], tn = TYPE_FR[m.type] || '';
  return (genSigs[k] = GEN_KITS[m.gab].map(([n, kind, anims, mult]) => ({ name: n + ' ' + tn, kind, anims, color: col, mult, radius: 52, n: 6, st: null })));
}

// Obstacles et éléments de terrain. solid : bloque déplacements, projectiles et rayons ; hp : détruisible ; weak : élément qui l'abîme x3 ; quench : éléments qui dissipent la zone
export const OBS = {
  ice:     { solid: true, hw: 7, hh: 6, hp: 34, life: 16, delay: 1.0, color: '#bfeaff', weak: 'fire' },
  frost:   { r: 26, life: 10, delay: 1.1, color: '#9fe8ff', quench: ['fire'] },
  pylon:   { solid: true, hw: 6, hh: 6, hp: 45, life: 18, delay: 1.0, color: '#ffe84a' },
  rock:    { solid: true, hw: 8, hh: 7, hp: 48, life: 22, delay: 1.1, color: '#c8a070', fall: true },
  basalt:  { solid: true, hw: 8, hh: 7, hp: 48, life: 20, delay: 1.0, color: '#ff8a40' },
  lava:    { r: 22, life: 9, delay: 1.1, color: '#ff6a20', quench: ['water', 'ice'] },
  crystal: { solid: true, hw: 7, hh: 7, hp: 38, life: 16, delay: 0.9, color: '#d89aff' },
  gravity: { r: 38, life: 9, delay: 1.1, color: '#b070ff' },
  thorn:   { solid: true, hw: 7, hh: 6, hp: 22, life: 14, delay: 0.9, color: '#7bdc6a', weak: 'fire' },
  flower:  { r: 12, life: 12, delay: 0.6, color: '#ff9ad8' },
};
// Quels obstacles chaque boss fait apparaître, par phase : [type, nombre]
export const PLAN = {
  articuno:  { 2: [['ice', 3]], 3: [['ice', 3], ['frost', 2]] },
  zapdos:    { 2: [['pylon', 1]], 3: [['pylon', 2]] },
  moltres:   { 2: [['basalt', 2], ['lava', 1]], 3: [['basalt', 2], ['lava', 3]] },
  dragonite: { 2: [['rock', 2]], 3: [['rock', 3]] },
  mewtwo:    { 2: [['crystal', 3]], 3: [['crystal', 3], ['gravity', 2]] },
  mew:       { 2: [['thorn', 2], ['flower', 2]], 3: [['thorn', 3], ['flower', 2]] },
};

export function installExtras(G, d) {
  const { Input, move, rand, hyp, unit, setAnim, timing, pickAnim, SFX, M, D, TS, dirFromVec } = d;
  const P = G.prototype;
  const REV = Object.fromEntries(Object.entries(D.TYPE_FR).map(([k, v]) => [v, k]));

  P.initExtras = function () {
    this.link = 0; this.linkT = 0; this.linkMalus = 0; this.allies = [];
    this.comboN = 0; this.comboAt = -9; this.comboWin = 0.8; this.relayWin = 1.3; this.later = [];
    this.obs = []; this.gust = null; this.terrain = { slow: 1, frost: false }; this.lastPD = -9; this.curElem = 'normal';
  };

  // ======================= LIEN : jauge, invocation des coéquipiers =======================
  P.addLink = function (n) {
    if (this.linkT > 0 || this.state !== 'play' || this.link >= 100) return;
    if (this.bossActive) n *= 0.25; // Lien plus lent à remplir pendant un combat de boss
    this.link = Math.min(100, this.link + n);
    if (this.link >= 100) { const c = this.chief(); SFX.pick(); this.ringFx(c.x, c.y, 28, '#ffe27a'); this.emit('toast', 'Lien prêt !'); }
  };
  P.tryLink = function () {
    const c = this.chief();
    if (this.state !== 'play' || this.linkT > 0 || c.exh || (c.fx && c.fx.k === 'freeze')) return false;
    if (this.link < 100) { this.emit('toast', 'Jauge de Lien : ' + Math.floor(this.link) + ' %'); return false; }
    const al = this.team.filter(q => q !== c && !q.exh);
    if (!al.length) { this.emit('toast', 'Aucun allié en état de combattre'); return false; }
    this.link = 0; this.linkT = 8; this.allies = al; this.buf = null; this.linkBossDmg = 0; this.tutEvent('link');
    if (this.boss && this.boss.tel) this.boss.tel.links++;
    al.forEach((q, k) => {
      const side = k === 0 ? -1 : 1; let x = c.x + side * 22, y = c.y + 6;
      if (!M.boxFree(this.world, x, y, 4, 3)) { x = c.x; y = c.y; }
      Object.assign(q, { x, y, face: { x: c.face.x, y: c.face.y }, atk: null, dodge: null, dash: null, hurtT: 0, kx: 0, ky: 0, summoned: true, acd: 0.5 + k * 0.3, fx: null, regen: null });
      q.anim = 'Idle'; q.at = 0; q.loop = true; q.dir = dirFromVec(c.face.x, c.face.y);
      this.ringFx(q.x, q.y, 30, q.def.color); for (let i = 0; i < 14; i++) this.spark(q.x, q.y - 8, i % 2 ? '#ffe9a0' : q.def.color, 1);
    });
    this.fx('linkburst', c.x, c.y, { scale: 1.5, z: 8, dur: 0.7, glow: '#ffe27a' }); this.fx('linkstar', c.x, c.y, { scale: 1.1, z: 14, delay: 0.1, dur: 0.8 });
    for (const q of al) { const col = LINKC[q.type] || 'yellow'; this.fx('linkring_' + col, q.x, q.y, { scale: 1.1, z: 6, dur: 0.7, glow: q.def.color }); this.fx('linkpulse_' + col, q.x, q.y, { scale: 1.0, z: 10, delay: 0.12, dur: 0.6 }); }
    this.ringFx(c.x, c.y, 44, '#ffe27a'); this.hitstop = 0.12; this.shake = Math.max(this.shake, 4); SFX.boom();
    this.emit('toast', 'Lien : ' + al.map(q => q.def.name).join(' et ') + ' entrent en scène');
    return true;
  };
  // fin du Lien : les réserves reviennent à 85 % de leurs PV, le Pokémon actif est essoufflé quelques secondes
  P.endLink = function (silent) {
    if (!this.allies.length && this.linkT <= 0) return;
    for (const q of this.allies) {
      q.summoned = false; q.atk = null; q.dash = null; q.anim = 'Idle';
      if (!q.exh) q.hp = Math.max(1, Math.round(q.hp * 0.85));
      this.ringFx(q.x, q.y, 22, q.def.color); for (let i = 0; i < 10; i++) this.spark(q.x, q.y - 8, q.def.color, 1);
    }
    this.allies = []; this.linkT = 0;
    if (!silent) { this.linkMalus = 3; this.emit('toast', 'Le Lien se dissipe… ' + this.chief().def.name + ' est essoufflé'); }
  };
  P.allyTick = function (m, dt) {
    const c = this.chief(); m.acd -= dt;
    if (m.atk) { this.tickAtk(m, dt); return; }
    let tg = null, bd = 200;
    for (const e of this.enemies) {
      if (e.dead || e.state === 'dormant') continue;
      const dd = hyp(e.x - c.x, e.y - c.y) * (e.boss ? 0.5 : 1);
      if (dd < bd) { bd = dd; tg = e; }
    }
    const sp = m.def.speed * 1.15;
    if (tg) {
      const rg = m.def.mode === 'ranged' ? m.def.range * 0.7 : m.def.range + 4, dist = hyp(tg.x - m.x, tg.y - m.y), u = unit(tg.x - m.x, tg.y - m.y);
      m.face = u; m.dir = dirFromVec(u.x, u.y);
      if (dist > rg) { move(this, m, u.x * sp * dt, u.y * sp * dt); setAnim(m, 'Walk'); m.at += dt; }
      else if (m.acd <= 0) {
        const ab = m.def.ability, supp = ['heal', 'cleanse', 'regen'].includes(ab.kind);
        const hurt = this.team.some(q => !q.exh && (q.hp < q.maxhp * 0.75 || q.fx));
        let kind = Math.random() < 0.3 ? 'heavy' : 'light';
        if (m.cd <= 0 && (!supp ? Math.random() < 0.45 : hurt)) kind = 'ability';
        this.startAttack(m, kind, tg); m.acd = rand(0.45, 0.8);
      } else { setAnim(m, 'Idle'); m.at += dt; }
    } else {
      const slot = this.allies.indexOf(m), tx = c.x + (slot === 0 ? -24 : 24), ty = c.y + 8, dd = hyp(tx - m.x, ty - m.y);
      if (dd > 10) { const u = unit(tx - m.x, ty - m.y); move(this, m, u.x * sp * dt, u.y * sp * dt); m.face = u; m.dir = dirFromVec(u.x, u.y); setAnim(m, 'Walk'); } else { m.face = { x: c.face.x, y: c.face.y }; m.dir = dirFromVec(m.face.x, m.face.y); setAnim(m, 'Idle'); }
      m.at += dt;
    }
  };

  // ======================= COMBOS : léger, léger, lourd =======================
  // renvoie true quand l'attaque signature est déclenchée
  P.comboStep = function (m, kind) {
    const fresh = this.t - this.comboAt <= this.comboWin, n = fresh ? this.comboN : 0;
    if (kind === 'light') { this.comboN = n >= 2 ? 1 : n + 1; this.comboAt = this.t + 99; return false; }
    if (n === 2 && this.stam >= 30) { this.comboN = 0; this.comboAt = -9; this.startSignature(m); return true; }
    this.comboN = 0; this.comboAt = this.t + 99; return false;
  };
  P.comboReset = function () { this.comboN = 0; this.comboAt = -9; };
  // pause de la fenêtre pendant `d` secondes (esquive, recul léger) : elle ne commence à s'écouler qu'après
  P.comboHold = function (d) { if (this.comboN > 0) this.comboAt = this.t + d; };
  // coup reçu : seul un coup qui brise la poise (coup lourd, ou gros dégâts, plus tolérant pour un Rempart) remet le combo à zéro
  P.comboHit = function (m, dmg, o) {
    const big = (o && o.heavy) || dmg >= m.maxhp * (m.def && m.def.guard != null && m.def.guard <= 0.25 ? 0.2 : 0.13);
    if (big) this.comboReset(); else this.comboHold(m.hurtT || 0.28);
  };
  P.startSignature = function (m) {
    this.tutEvent('sig');
    const sg = sigsOf(m)[m.stage], df = m.def, tgt = this.aimTarget(m);
    let aim = tgt ? unit(tgt.x - m.x, tgt.y - m.y) : { x: m.face.x, y: m.face.y };
    if (m.fx && m.fx.k === 'confuse') { const a = Math.atan2(aim.y, aim.x) + rand(-0.7, 0.7); aim = { x: Math.cos(a), y: Math.sin(a) }; }
    const anim = pickAnim(df.id, sg.anims), tm = timing(df.id, anim), sp = Math.max(1, tm.hit / 0.42, tm.total / 1.15);
    m.face = aim; m.dir = dirFromVec(aim.x, aim.y);
    m.atk = { kind: 'sig', sig: sg, anim, t: 0, pre: 0.24, hit: tm.hit / sp, total: tm.total / sp, speed: sp, done: false, aim, tgt };
    this.stam = Math.max(0, this.stam - 38); this.stamPause = 1.1;
    this.floatText(m.x, m.y - 36, sg.name.toUpperCase(), sg.color); this.ringFx(m.x, m.y, 26, sg.color); SFX.swing();
    for (let i = 0; i < 12; i++) this.spark(m.x, m.y - 8, i % 2 ? '#ffffff' : sg.color, 1.2);
  };
  P.doSignature = function (m, a) {
    const sg = a.sig, aim = a.aim, ang = Math.atan2(aim.y, aim.x), dmg = this.powerOf(m, { kind: 'light' }) * sg.mult, col = sg.color;
    const o = { heavy: true, sig: true, stagger: 0.8, knock: 90, status: sg.st };
    const arc = (v, mult, range, cos) => { const h = this.meleeArc(m, v, range, cos, dmg * mult, o); return h; };
    const proj = (an, sp, mult, extra) => this.fireProj({ x: m.x, y: m.y, ang: an, speed: sp, dmg: dmg * mult, r: 4, life: 1.1, team: 'p', color: col, owner: m, status: sg.st, sig: true, heavy: true, ...extra });
    this.shake = Math.max(this.shake, 3);
    this.fxSig(m, a, sg);
    switch (sg.kind) {
      case 'cross': {
        arc(aim, 0.55, m.def.range + 12, 0.0);
        const v2 = { x: Math.cos(ang + 1.0), y: Math.sin(ang + 1.0) };
        this.later.push({ el: this.curElem, tr: this.curTrig, t: 0.14, fn: () => { if (m.exh) return; arc(aim, 0.6, m.def.range + 14, -0.2); this.burst(m.x + aim.x * 20, m.y - 8, col, 10); SFX.boom(); } });
        for (let i = 0; i < 16; i++) { const k = i / 15 - 0.5; this.parts.push({ x: m.x + aim.x * 20 + v2.x * k * 40, y: m.y - 6 + v2.y * k * 24, z: 8, vx: v2.x * 30, vy: v2.y * 20, vz: 0, life: 0.3, max: 0.3, c: i % 2 ? '#fff' : col, size: 2 }); }
        SFX.boom(); break;
      }
      case 'whirl': {
        const R = sg.radius;
        const hit = () => { this.meleeArc(m, aim, R, -2, dmg * 0.5, { ...o, knock: sg.pull ? 0 : 110 }); if (sg.pull) for (const e of this.enemies) if (!e.dead && !e.boss && !e.def.armor && hyp(e.x - m.x, e.y - m.y) < R + e.r) { const k = unit(m.x - e.x, m.y - e.y); e.kx = k.x * 120; e.ky = k.y * 120; } };
        hit(); this.later.push({ el: this.curElem, tr: this.curTrig, t: 0.18, fn: () => { if (!m.exh) { hit(); this.ringFx(m.x, m.y, R * 0.7, col); } } });
        this.ringFx(m.x, m.y, R, col); this.ringFx(m.x, m.y, R * 0.55, '#ffffff');
        for (let i = 0; i < 26; i++) { const an = i / 26 * 6.28; this.parts.push({ x: m.x, y: m.y - 6, z: 6, vx: Math.cos(an + 1.6) * 90, vy: Math.sin(an + 1.6) * 60, vz: rand(-5, 12), life: 0.4, max: 0.4, c: i % 2 ? col : '#ffffff', size: 2 }); }
        SFX.boom(); this.shake = Math.max(this.shake, 4); break;
      }
      case 'blast': {
        for (let i = -1; i <= 1; i++) proj(ang + i * 0.26, 175, 0.75, { explode: 32, r: 5, life: 1.2 });
        for (let i = 0; i < 24; i++) { const aa = ang + rand(-0.4, 0.4), s = rand(60, 190); this.parts.push({ x: m.x, y: m.y, z: 8, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s * 0.7, vz: rand(-5, 15), life: rand(0.25, 0.5), max: 0.5, c: Math.random() < 0.5 ? col : '#ffd36a', size: 3 }); }
        SFX.shoot(); SFX.boom(); break;
      }
      case 'rush': {
        const L = 96; m.dash = { vx: aim.x * 360, vy: aim.y * 360, t: 0.26 }; m.inv = Math.max(m.inv, 0.3);
        let hit = false;
        for (const e of this.enemies) { if (e.dead) continue; const rx = e.x - m.x, ry = e.y - m.y, al = rx * aim.x + ry * aim.y, pd = Math.abs(rx * aim.y - ry * aim.x); if (al > -8 && al < L + e.r && pd < e.r + 10) if (this.damageEnemy(e, dmg, m, { ...o, stagger: 1.0, knock: 120 })) hit = true; }
        for (let k = 0; k <= 6; k++) this.hitObs(m.x + aim.x * L * k / 6, m.y + aim.y * L * k / 6, 8, dmg * 0.4, this.curElem);
        for (let i = 0; i < 22; i++) this.parts.push({ x: m.x + aim.x * rand(0, L), y: m.y + aim.y * rand(0, L) - 6, z: 6, vx: -aim.x * 40, vy: -aim.y * 25, vz: rand(0, 18), life: 0.35, max: 0.35, c: i % 2 ? col : '#ffffff', size: 2 });
        if (hit) this.hitstop = 0.06; SFX.boom(); break;
      }
      case 'storm': {
        const base = a.tgt && !a.tgt.dead ? { x: a.tgt.x, y: a.tgt.y } : { x: m.x + aim.x * 70, y: m.y + aim.y * 70 };
        for (let i = 0; i < sg.n; i++) {
          const p = i === 0 ? base : { x: base.x + rand(-58, 58), y: base.y + rand(-42, 42) };
          this.ringFx(p.x, p.y, 10, col);
          this.later.push({ el: this.curElem, tr: this.curTrig, t: 0.3 + i * 0.11, fn: () => {
            this.ringFx(p.x, p.y, 28, col); this.burst(p.x, p.y - 4, col, 10); SFX.boom(); this.fx('whirlpool', p.x, p.y, { scale: 0.7, z: 0, ground: true, dur: 0.5, add: true }); this.fx('brine', p.x, p.y, { scale: 0.9, z: 10, dur: 0.45, add: true, glow: col });
            for (const e of this.enemies) if (!e.dead && hyp(e.x - p.x, e.y - p.y) < 26 + e.r) this.damageEnemy(e, dmg * 0.5, m, { ...o, stagger: 0.5, knock: 50 });
            this.hitObs(p.x, p.y, 26, dmg * 0.5, 'water');
          } });
        }
        break;
      }
      case 'fan': {
        for (let i = -2; i <= 2; i++) proj(ang + i * 0.2, 235, 0.55, { r: 3.5 });
        SFX.shoot(); this.later.push({ el: this.curElem, tr: this.curTrig, t: 0.12, fn: () => { if (m.exh) return; for (let i = -1; i <= 1; i++) proj(ang + i * 0.34, 215, 0.5, { r: 3.5 }); SFX.shoot(); } }); break;
      }
      case 'leaves': {
        const off = rand(0, 6.28);
        for (let i = 0; i < 12; i++) proj(off + i * 6.283 / 12, 150, 0.55, { r: 3.5, life: 0.95 });
        this.ringFx(m.x, m.y, 30, col); SFX.shoot(); SFX.boom(); break;
      }
      case 'sun': {
        const len = 230; this.beams.push({ x: m.x, y: m.y - 6, ang, len, t: 0, max: 0.42, color: col, w: 11 });
        let hit = false;
        for (const e of this.enemies) { if (e.dead) continue; const rx = e.x - m.x, ry = e.y - m.y, al = rx * aim.x + ry * aim.y, pd = Math.abs(rx * aim.y - ry * aim.x); if (al > 0 && al < len + e.r && pd < e.r + 9) if (this.damageEnemy(e, dmg, m, { ...o, stagger: 0.9, knock: 70 })) hit = true; }
        for (let k = 1; k <= 8; k++) this.hitObs(m.x + aim.x * len * k / 8, m.y + aim.y * len * k / 8, 8, dmg * 0.4, 'grass');
        for (const q of this.team) if (!q.exh) q.hp = Math.min(q.maxhp, q.hp + q.maxhp * 0.06);
        this.healFx(m); if (hit) this.hitstop = 0.06; SFX.boom(); this.shake = Math.max(this.shake, 5); break;
      }
    }
  };

  // ======================= OBSTACLES ET ÉLÉMENTS DE TERRAIN =======================
  P.spawnObs = function (kind, x, y) {
    const s = OBS[kind];
    const o = { kind, x, y, hw: s.hw || 0, hh: s.hh || 0, r: s.r || 0, solid: !!s.solid, on: false, t: 0, delay: s.delay, life: s.life, hp: s.hp || 0, maxhp: s.hp || 0, color: s.color, flash: 0, tk: 0, dead: false, seed: Math.random() * 100 };
    this.obs.push(o); return o;
  };
  P.spawnObstacles = function (b) {
    const plan = (PLAN[b.sprite] || {})[b.phase]; if (!plan) return;
    const c = this.chief(), a = this.world.arena; let any = false;
    for (const [kind, n] of plan) {
      const s = OBS[kind];
      for (let i = 0; i < n; i++) {
        const cap = s.solid ? (b.phase === 2 ? 4 : 6) : 4;
        if (this.obs.filter(q => !q.dead && !!q.solid === !!s.solid).length >= cap) break;
        let spot = null;
        for (let tr = 0; tr < 40 && !spot; tr++) {
          const an = rand(0, 6.283), di = rand(42, 115), x = c.x + Math.cos(an) * di, y = c.y + Math.sin(an) * di, hw = (s.hw || s.r) + 3, hh = (s.hh || s.r) + 3;
          if (hyp(x - a.cx * TS, y - a.cy * TS) > (a.r - 2.2) * TS || !M.boxFree(this.world, x, y, hw, hh)) continue;
          if (s.solid && (hyp(x - c.x, y - c.y) < 34 || hyp(x - b.x, y - b.y) < b.r + s.hw + 14 || this.obs.some(q => !q.dead && q.solid && hyp(q.x - x, q.y - y) < 34))) continue;
          spot = { x, y };
        }
        if (spot) { this.spawnObs(kind, spot.x, spot.y); any = true; }
      }
    }
    if (b.sprite === 'zapdos') {
      const n = b.phase === 2 ? 2 : 4;
      for (let i = 0; i < n; i++) {
        let p = i === 0 ? { x: c.x, y: c.y } : { x: c.x + rand(-75, 75), y: c.y + rand(-55, 55) }, pyl = null, bd = 120;
        for (const q of this.obs) if (q.kind === 'pylon' && q.on && !q.dead) { const dd = hyp(q.x - p.x, q.y - p.y); if (dd < bd) { bd = dd; pyl = q; } }
        if (pyl) p = { x: pyl.x, y: pyl.y };
        this.zones.push({ x: p.x, y: p.y, r: 20, t: 0, delay: 1.0 + i * 0.3, dmg: b.dmg * 1.1, color: '#fff58a', owner: b, pyl });
      }
      any = true;
    }
    if (b.sprite === 'dragonite' && b.phase === 3 && Math.random() < 0.6) {
      const an = rand(0, 6.283); this.gust = { dx: Math.cos(an), dy: Math.sin(an), t: 0, delay: 1.0, dur: 2.6 }; any = true;
    }
    if (any) SFX.telegraph();
  };
  P.obsBlockedBy = function (o, e, hwE, hhE) { return Math.abs(e.x - o.x) < o.hw + hwE && Math.abs(e.y - o.y) < o.hh + hhE; };
  // dégage une entité prise dans un obstacle plein
  P.eject = function (e, hwE, hhE) {
    for (const o of this.obs) {
      if (!o.on || !o.solid || o.dead) continue;
      const dx = e.x - o.x, dy = e.y - o.y, ox = o.hw + hwE - Math.abs(dx), oy = o.hh + hhE - Math.abs(dy);
      if (ox <= 0 || oy <= 0) continue;
      const sx = (dx >= 0 ? 1 : -1) * (ox + 0.6), sy = (dy >= 0 ? 1 : -1) * (oy + 0.6);
      const opts = ox < oy ? [[sx, 0], [0, sy], [-sx, 0], [0, -sy]] : [[0, sy], [sx, 0], [0, -sy], [-sx, 0]];
      for (const [ax, ay] of opts) if (M.boxFree(this.world, e.x + ax, e.y + ay, hwE, hhE)) { e.x += ax; e.y += ay; break; }
    }
  };
  P.obsActivate = function (o) {
    const bd = this.boss && !this.boss.dead ? this.boss.dmg : 12;
    this.burst(o.x, o.y - 2, o.color, 10);
    if (OBS[o.kind].fall) {
      this.ringFx(o.x, o.y, 30, '#c8a070'); this.shake = Math.max(this.shake, 4); SFX.boom();
      for (const m of this.actors()) if (!m.exh && hyp(m.x - o.x, m.y - o.y) < 24) this.hurtMember(m, bd * 1.3, o, { parry: false, heavy: true, owner: this.boss });
    } else SFX.door();
  };
  P.obsBreak = function (o) { this.burst(o.x, o.y - 6, o.color, o.solid ? 14 : 6); if (o.solid) { SFX.hit(); this.ringFx(o.x, o.y, 14, o.color); } };
  P.damageObs = function (o, dmg, elem) {
    if (!o.solid || o.dead || !o.on) return false;
    const s = OBS[o.kind]; if (s.weak && s.weak === elem) dmg *= 3;
    o.hp -= dmg; o.flash = 0.12; this.burst(o.x, o.y - 6, o.color, 3);
    if (o.hp <= 0) { o.dead = true; this.obsBreak(o); }
    return true;
  };
  // frappe tout ce qui est obstacle dans le cercle (x, y, r) ; les zones se dissipent avec le bon élément
  P.hitObs = function (x, y, r, dmg, elem) {
    let hit = false; this.surfTouch(x, y, r, elem);
    for (const o of this.obs) {
      if (o.dead || !o.on) continue;
      const dd = hyp(o.x - x, o.y - y);
      if (o.solid) { if (dd < r + Math.max(o.hw, o.hh)) { this.damageObs(o, dmg, elem); hit = true; } }
      else { const q = OBS[o.kind].quench; if (q && q.includes(elem) && dd < r + o.r * 0.8) { o.dead = true; this.obsBreak(o); this.floatText(o.x, o.y - 10, o.kind === 'lava' ? 'Éteint' : 'Fondu', o.color); hit = true; } }
    }
    return hit;
  };
  P.quenchAt = function (x, y, elem) {
    if (!elem) return; this.surfTouch(x, y, 4, elem);
    for (const o of this.obs) { if (o.dead || !o.on || o.solid) continue; const q = OBS[o.kind].quench; if (q && q.includes(elem) && hyp(o.x - x, o.y - y) < o.r * 0.8) { o.dead = true; this.obsBreak(o); this.floatText(o.x, o.y - 10, o.kind === 'lava' ? 'Éteint' : 'Fondu', o.color); } }
  };
  // distance jusqu'au premier obstacle plein sur un rayon
  P.rayObs = function (x, y, v, len) {
    let best = len;
    for (const o of this.obs) {
      if (o.dead || !o.on || !o.solid) continue;
      const rx = o.x - x, ry = o.y - y, al = rx * v.x + ry * v.y, pd = Math.abs(rx * v.y - ry * v.x);
      if (al > 0 && al < best + 8 && pd < Math.max(o.hw, o.hh) + 3) best = Math.min(best, al);
    }
    return best;
  };
  P.dotMember = function (m, dmg, st) {
    if (m.exh || this.god || (m.dodge && m.dodge.t < m.dodge.iframes)) return;
    dmg = Math.max(1, Math.round(dmg)); m.hp -= dmg; m.flash = 0.1;
    this.floatText(m.x, m.y - 22, String(dmg), '#ff9a50');
    if (st && m.hp > 0 && Math.random() < st[1]) this.inflict(m, st[0]);
    if (m.hp <= 0) this.memberDown(m);
  };
  P.clearObstacles = function () { for (const o of this.obs) if (!o.dead) { o.dead = true; this.obsBreak(o); } this.obs.length = 0; this.gust = null; };

  P.updateExtras = function (dt) {
    // Lien
    this.linkMalus = Math.max(0, this.linkMalus - dt);
    if (this.linkT > 0) {
      this.linkT -= dt;
      for (const q of this.allies) this.allyTick(q, dt);
      if (this.linkT <= 0) this.endLink();
    }
    // actions différées (signatures)
    for (const l of this.later) l.t -= dt;
    const due = this.later.filter(l => l.t <= 0); if (due.length) { this.later = this.later.filter(l => l.t > 0); for (const l of due) { if (l.el) { this.curElem = l.el; this.curTrig = l.tr; } l.fn(); } }
    // terrain
    this.terrain = { slow: 1, frost: false };
    const c = this.chief();
    if (this.gust) {
      const g = this.gust; g.t += dt;
      if (g.t > g.delay && g.t < g.delay + g.dur && !c.exh) move(this, c, g.dx * 72 * dt, g.dy * 72 * dt);
      if (g.t > g.delay + g.dur) this.gust = null;
    }
    for (const o of this.obs) {
      if (o.dead) continue;
      o.t += dt; o.flash -= dt;
      if (!o.on) { if (o.t >= o.delay) { o.on = true; o.t = 0; this.obsActivate(o); } continue; }
      if (o.t > o.life) { o.dead = true; this.obsBreak(o); continue; }
      if (o.solid || c.exh) continue;
      const dd = hyp(c.x - o.x, c.y - o.y); if (dd >= o.r) continue;
      if (o.kind === 'frost') { this.terrain.slow = Math.min(this.terrain.slow, 0.62); this.terrain.frost = true; }
      else if (o.kind === 'gravity') { this.terrain.slow = Math.min(this.terrain.slow, 0.55); move(this, c, (o.x - c.x) / (dd || 1) * 26 * dt, (o.y - c.y) / (dd || 1) * 26 * dt); }
      else if (o.kind === 'lava') { o.tk -= dt; if (o.tk <= 0) { o.tk = 0.5; this.dotMember(c, (this.boss ? this.boss.dmg : 12) * 0.3, ['burn', 0.45]); } }
      else if (o.kind === 'flower') { const h = Math.min(c.maxhp - c.hp, c.maxhp * 0.08); c.hp += h; this.healFx(c); o.dead = true; SFX.heal(); }
    }
    for (let i = this.obs.length - 1; i >= 0; i--) if (this.obs[i].dead) this.obs.splice(i, 1);
    if (this.obs.length) {
      if (!c.exh) this.eject(c, 4, 3);
      for (const e of this.enemies) if (!e.dead) this.eject(e, e.boss ? 6 : Math.min(e.r, 6) * 0.8, e.boss ? 4 : 3);
    }
  };

  // ======================= utilitaires =======================
  P.elemOf = function (m, a) { return a && a.kind === 'ability' ? (REV[m.def.ability.type] || 'normal') : m.type; };
}
