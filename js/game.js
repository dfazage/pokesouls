// Cœur du jeu : équipe de trois starters, combat temps réel, ennemis, boss, cartes, objets, sauvegarde.
import { TICK, A, hitTick, animTotal, dirFromVec, loadSpecies } from './assets.js';
import { Input } from './input.js';
import { SFX } from './audio.js';
import * as M from './maps.js';
import * as D from './data.js';
import { poolEntry, archOf, startTm } from './pool.js';
import { installExtras } from './extras.js';
import { installFx } from './fx.js';
import { installElements, BOSS_LORE } from './elements.js';
import { installTutorial } from './tutorial.js';
import { installBossCine } from './bosscine.js';
import { installFala, FALA_KEY, MODULES, DEFAULT_MODULE } from './fala.js';
import { installReserve } from './reserve.js';

const { TS } = M;
export let W = 400; export const H = 225;
export function setViewW(w) { W = w; }
const saveKey = ch => (!ch || ch === 'kanto' ? 'pokesouls.gen1.v2' : 'pokesouls.' + ch + '.v1');   // une sauvegarde par chapitre
const LAST_KEY = 'pokesouls.lastchapter';
export const lastChapter = () => { try { const c = localStorage.getItem(LAST_KEY); return M.CHAPTER_MAPS[c] && M.CHAPTER_MAPS[c].length && localStorage.getItem(saveKey(c)) ? c : 'kanto'; } catch (e) { return 'kanto'; } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const hyp = Math.hypot;
const unit = (x, y) => { const l = hyp(x, y) || 1; return { x: x / l, y: y / l }; };
// Équilibrage des boss (simulation sim_boss_balance.py, config D) : plafond des bonus par coup, Lien limité.
export const BAL = { BOSS_MULT_CAP: 3.1, LINK_BOSS_FILL: 0.25, LINK_BOSS_CAP: 0.05, LINK_BOSS_DMG: 0.5, REACT_BOSS_CAP: 0.05 };
const VIT_KEYS = Object.keys(D.VITAMINS);
const hasAnim = (id, n) => !!(A.db[id] && A.db[id].anims[n]);
const pickAnim = (id, list) => list.find(n => hasAnim(id, n)) || 'Idle';

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
export function speciesForMap(idx) {
  const d = M.MAPS[idx], set = new Set();
  for (const t of [...d.mobs.mini, ...d.mobs.mid, d.mobs.big]) set.add(D.spriteOfEnemy(t));
  const b = D.BOSSES[d.boss]; set.add(b.sprite); if (b.summon) set.add(D.spriteOfEnemy(b.summon));
  if (d.fala) set.add(FALA_KEY);   // quête de Fala
  if (idx === 0) set.add(D.spriteOfEnemy('dummy'));   // mannequin du tutoriel : il vit sur la première carte de chaque chapitre (Johto n'a pas d'Otaria dans ses ennemis)
  return [...set];
}
const newProg = () => ({ lit: [], doorOpen: false, bigDead: false, bossDead: false, rewardTaken: false, introSeen: false, chests: [] });
const stageOf = lvl => (lvl >= D.EVOLVE_AT[1] ? 2 : lvl >= D.EVOLVE_AT[0] ? 1 : 0);

export class Game {
  constructor(chapter = 'kanto') {
    this.chapter = M.setChapter(chapter);   // les cartes du chapitre deviennent M.MAPS
    this.emit = () => {};
    this.dev = /[?&]dev/.test(location.search);
    this.god = false;
    this.t = 0; this.state = 'loading'; this.hitstop = 0; this.shake = 0;
    this.cam = { x: 0, y: 0 };
    this.team = []; this.bench = []; this.picks = null;
    this.chiefIdx = 0; this.berries = 5; this.maxBerries = 5; this.stam = 100; this.maxStam = 100; this.stamPause = 0;
    this.essence = 0; this.ethers = 3; this.maxEthers = 3; this.respawnQ = []; this.guardT = 9; this.guarding = false; this.wasGuard = false; this.buffT = 0;
    this.buf = null; this.lock = null; this.switchT = 0; this.swapCd = 0;
    this.enemies = []; this.projs = []; this.parts = []; this.texts = []; this.rings = []; this.items = []; this.zones = []; this.beams = []; this.fxRings = []; this.fxs = [];
    this.boss = null; this.bossActive = false; this.prompt = null; this.lastArea = null; this.deadT = 0;
    this.bag = {}; this.tms = []; this.unlocked = 0; this.souvenir = null; this.last = null; this.mapIdx = 0;
    this.prog = M.MAPS.map(newProg); this.floors = {}; this.lit = new Set(); this.chestObjs = [];
    this.world = null; this.floor = null; this.initExtras(); this.initElements(); this.initTutorial();
    this.hasSave = this.load();
  }

  // ---------- état ----------
  chief() { return this.team[this.chiefIdx]; }
  makeMember(key, i) {
    const e0 = poolEntry(key), mod = key === FALA_KEY ? DEFAULT_MODULE : null, e = mod ? { ...e0, type: MODULES[mod].type } : e0;   // Fala : l'élément vient du Module équipé
    return { key, mod, type: e.type, gab: e.gab, line: e.line, i, lvl: D.START_LEVEL, vit: Object.fromEntries(VIT_KEYS.map(k => [k, 0])), tm: startTm(e), stage: 0,
      hp: 1, maxhp: 1, exh: false, x: 0, y: 0, face: { x: 0, y: 1 }, dir: 0, anim: 'Idle', at: 0, loop: true, atk: null, dodge: null, hurtT: 0, inv: 0, flash: 0, cd: 0, acd: rand(0.3, 1), kx: 0, ky: 0, drink: 0, dash: null, deadT: 0, fx: null, regen: null, frzImm: 0 };
  }
  computeDef(m) {
    const a = archOf({ ...poolEntry(m.key), type: m.type }), st = stageOf(m.lvl), id = m.line[st], v = m.vit;
    m.stage = st; m.id = id;
    m.def = { ...a, id, name: D.NAMES_FR[id], hp: Math.round(a.hp * D.hpMult(m.lvl) * D.STAGE_HP[st] * (1 + 0.08 * v.hpup)),
      dmg: a.dmg * D.dmgMult(m.lvl) * D.STAGE_DMG[st] * (1 + 0.06 * v.protein), speed: a.speed * (1 + 0.03 * v.carbos), ability: D.TMS[m.tm] };
  }
  applyLevels(full) {
    for (const m of [...this.team, ...this.bench]) { this.computeDef(m); const mx = m.def.hp; if (full) m.hp = mx; else if (mx > m.maxhp) m.hp += mx - m.maxhp; m.maxhp = mx; m.hp = Math.min(m.hp, mx); }
    this.maxStam = 100 + 6 * this.team.reduce((s, m) => s + m.vit.zinc, 0); this.stam = Math.min(this.stam, this.maxStam);
  }
  newGame(picks) {
    this.picks = picks.slice(0, 3); this.tutState = 'pending';
    this.team = this.picks.map((k, i) => this.makeMember(k, i));
    this.tms = this.team.map(m => m.tm); this.bag = { candy: 2 }; this.ethers = this.maxEthers = 3; this.applyLevels(true);
    this.save();
  }
  saveData() {
    this.prog[this.mapIdx].lit = [...this.lit];
    return { v: 2, mv: 2, tut: this.tutState, picks: this.picks, lvls: this.team.map(m => m.lvl), vit: this.team.map(m => m.vit), tm: this.team.map(m => m.tm), mods: this.team.map(m => m.mod || null), bench: this.bench.map(m => ({ key: m.key, lvl: m.lvl, vit: m.vit, tm: m.tm, mod: m.mod || null })), tms: this.tms, bag: this.bag, berries: this.berries, maxBerries: this.maxBerries, ethers: this.ethers, maxEthers: this.maxEthers, link: Math.floor(this.link),
      essence: this.essence, souvenir: this.souvenir, map: this.mapIdx, last: this.last, prog: this.prog, unlocked: this.unlocked, chiefIdx: this.chiefIdx };
  }
  save() { try { localStorage.setItem(saveKey(this.chapter), JSON.stringify(this.saveData())); localStorage.setItem(LAST_KEY, this.chapter); } catch (e) { /* stockage indisponible */ } }
  static exists(ch) { try { return !!localStorage.getItem(saveKey(ch)); } catch (e) { return false; } }
  static existsAny() { return Object.keys(M.CHAPTER_MAPS).some(c => M.CHAPTER_MAPS[c].length && Game.exists(c)); }
  static wipe(ch) { try { localStorage.removeItem(saveKey(ch)); } catch (e) { /* rien */ } }
  load() {
    let s = null; try { s = JSON.parse(localStorage.getItem(saveKey(this.chapter)) || 'null'); } catch (e) { s = null; }
    if (!s || s.v !== 2 || !(s.picks || s.starters)) return false;
    // anciennes sauvegardes : { fire: n, water: n, grass: n } -> clés de lignées
    this.picks = s.picks || ['fire', 'water', 'grass'].map(t => D.STARTERS[t][s.starters[t]][0]);
    const restore = (key, i, o) => {
      const m = this.makeMember(key, i);
      if (key === FALA_KEY && MODULES[o.mod]) { m.mod = o.mod; m.type = MODULES[o.mod].type; }
      m.lvl = o.lvl || D.START_LEVEL; if (o.vit) Object.assign(m.vit, o.vit);
      if (o.tm && D.TMS[o.tm]) { const st = stageOf(m.lvl); if (D.tmCompat(o.tm, m.type, m.line[st], st).ok) m.tm = o.tm; }
      return m;
    };
    this.team = this.picks.map((key, i) => restore(key, i, { lvl: (s.lvls || [])[i], vit: (s.vit || [])[i], tm: (s.tm || [])[i], mod: (s.mods || [])[i] }));
    this.bench = (s.bench || []).filter(b => poolEntry(b.key)).map(b => restore(b.key, -1, b));
    this.tms = s.tms || this.team.map(m => m.tm); this.bag = s.bag || {}; this.berries = s.berries ?? 5; this.maxBerries = s.maxBerries || 5; this.maxEthers = s.maxEthers || 3; this.ethers = s.ethers ?? this.maxEthers; this.essence = s.essence || 0; this.link = s.link || 0;
    if (s.mv !== 2) {   // l'ancienne carte 4 (Route Victoire) n'existe plus : Labo et Île Mystère reculent d'un cran
      const mp = n => (n > 3 ? n - 1 : n);
      s.unlocked = mp(s.unlocked || 0);
      if (s.map === 3) { s.map = 2; s.last = null; } else { s.map = mp(s.map || 0); if (s.last) s.last = { ...s.last, map: mp(s.last.map) }; }
      if (s.prog) s.prog = s.prog.filter((_, i) => i !== 3);
    }
    this.tutState = s.tut === 'pending' ? 'pending' : 'done'; this.souvenir = s.souvenir || null; this.mapIdx = s.map || 0; this.last = s.last || null; this.unlocked = s.unlocked || 0; this.chiefIdx = s.chiefIdx || 0;
    if (s.prog) s.prog.forEach((p, i) => { this.prog[i] = { ...newProg(), ...p }; });
    this.applyLevels(true);
    return true;
  }
  // charge les sprites de l'équipe puis entre dans la carte de reprise
  async start() {
    await loadSpecies(this.team.flatMap(m => m.line), null, true);
    const l = this.last;
    await this.enterMap(l ? l.map : 0, l ? l.id : 'start', true);
    if (this.tutState === 'pending') { this.startTutorial(); }
  }

  // ---------- cartes ----------
  async enterMap(idx, dest, silent) {
    this.surf = [];
    this.state = 'loading'; if (!silent) this.emit('fade');
    await loadSpecies(speciesForMap(idx), null, true);
    if (this.world) { this.prog[this.mapIdx].lit = [...this.lit]; }
    this.mapIdx = idx; this.world = M.buildWorld(idx); this.falaEnter(); this.obs = []; this.world.obs = this.obs; this.gust = null; this.later = []; this.fxs = []; this.endLink(true); this.floor = this.floors[idx] || (this.floors[idx] = M.bakeFloor(this.world));
    const pr = this.prog[idx]; this.lit = new Set(pr.lit);
    if (pr.doorOpen && this.world.door) for (const [x, y] of this.world.door.tiles) this.world.grid[y * M.MW + x] = M.T.FLOOR;
    if (pr.bossDead) this.openFog();
    this.chestObjs = this.world.chests.map(c => ({ ...c, kind: 'chest', w: 1, h: 1, seed: (c.tx * 7 + c.ty) % 31 }));
    this.items = [];
    this.spawnAll(); this.buildItems();
    const b = dest && dest !== 'start' ? this.world.bonfires.find(q => q.id === dest) : null;
    const s = this.world.start;
    this.placeTeam(b ? (b.tx + 0.5) * TS : (s.tx + 0.5) * TS, b ? (b.ty + 1.6) * TS : (s.ty + 0.5) * TS);
    this.snapCam(); this.lastArea = null; this.lock = null;
    this.state = 'play';
    this.emit('area', { zone: 'Chapitre Génération ' + M.CHAPTER_INFO[this.chapter].gen + ' · Carte ' + (idx + 1), area: this.world.name });
    this.save();
  }
  travelOptions() {
    const out = [];
    for (let i = 0; i < M.MAPS.length; i++) {
      const open = i <= this.unlocked, d = M.MAPS[i];
      const pr = i === this.mapIdx ? { lit: [...this.lit] } : this.prog[i];
      const w = i === this.mapIdx ? this.world : null;
      const spots = [];
      if (open) {
        spots.push({ id: 'start', name: 'Entrée de la carte' });
        const names = w ? Object.fromEntries(w.bonfires.map(b => [b.id, b.name])) : bonfireNames(i);
        for (const id of pr.lit) spots.push({ id, name: 'Feu : ' + (names[id] || id) });
      }
      out.push({ idx: i, name: d.name, sub: d.sub, open, boss: D.BOSSES[d.boss].name, done: this.prog[i].bossDead, spots });
    }
    return out;
  }
  canTravel() { return this.state === 'play' && !this.bossActive && !this.team.every(m => m.exh); }
  travel(idx, dest) { if (!this.canTravel() || idx > this.unlocked) return false; this.enterMap(idx, dest); return true; }

  openFog() { for (const [x, y] of this.world.fog.tiles) this.world.grid[y * M.MW + x] = M.T.FLOOR; }
  closeFog() { if (this.prog[this.mapIdx].bossDead) return; for (const [x, y] of this.world.fog.tiles) this.world.grid[y * M.MW + x] = M.T.FOG; }
  buildItems() {
    const pr = this.prog[this.mapIdx], a = this.world.arena; this.items = [];
    if (pr.bossDead) {
      if (!pr.rewardTaken) this.items.push({ kind: 'reward', x: a.cx * TS, y: a.cy * TS });
      this.items.push({ kind: 'portal', x: (a.cx + 3) * TS, y: a.cy * TS });
    }
  }
  placeTeam(x, y) {
    this.team.forEach(m => { m.x = x; m.y = y; m.atk = null; m.dodge = null; m.hurtT = 0; m.dash = null; m.kx = m.ky = 0; m.fx = null; m.regen = null; });
  }
  snapCam() { const c = this.chief(); this.cam.x = clamp(c.x - W / 2, 0, M.MW * TS - W); this.cam.y = clamp(c.y - H / 2, 0, M.MH * TS - H); }

  spawnAll() {
    this.enemies = []; const pr = this.prog[this.mapIdx];
    for (const s of this.world.spawns) {
      const d = D.ENEMIES[s.type]; if (!d) continue;
      if (d.tier === 'big' && pr.bigDead) continue;
      this.enemies.push(this.makeEnemy(s.type, (s.tx + 0.5) * TS, (s.ty + 0.5) * TS));
    }
    this.respawnQ = []; this.projs = []; this.rings = []; this.zones = []; this.beams = []; this.boss = null; this.bossActive = false; this.lock = null; this.cine = null; this.camFx = null;
    this.closeFog();
  }
  makeEnemy(type, x, y) {
    const lv0 = this.world.def.lv;
    let d, lv = lv0, hp, dmg, r, ess;
    if (type === 'boss') {
      const B = D.BOSSES[this.world.def.boss]; d = { ...B, boss: true, kind: 'boss', sight: 999, anim: 'Shoot', tier: 'boss' };
      hp = B.hp; dmg = B.dmg * D.dmgMult(lv0); r = B.r; ess = D.essenceOf(lv0, 40);
    } else {
      d = D.ENEMIES[type]; lv = lv0 + (d.tier === 'mid' ? 1 : d.tier === 'big' ? 3 : 0);
      hp = Math.round(d.hp * D.hpMult(lv)); dmg = d.dmg * D.dmgMult(lv); r = ({ mini: 6.5, mid: 9, big: 11 }[d.tier] || 7) * (d.scale || 1); ess = d.k ? D.essenceOf(lv, d.k) : 0;
    }
    return { def: d, type, sprite: type === 'boss' ? d.sprite : D.spriteOfEnemy(type), x, y, hx: x, hy: y, hp, maxhp: hp, dmg, r, essence: ess, lv, dir: 0, face: { x: 0, y: 1 }, state: d.dormant ? 'dormant' : 'idle', st: 0, at: rand(0, 2), anim: 'Idle', loop: true, flash: 0, cd: rand(0.5, 1.5),
      vx: 0, vy: 0, kx: 0, ky: 0, dead: false, deadT: 0, boss: !!d.boss, clone: !!d.clone, big: d.tier === 'big', phase: 1, invuln: 0, tele: false, hitDone: false, bob: rand(0, 6) };
  }

  // ---------- boucle ----------
  update(dt) {
    if (this.state === 'loading' || !this.world) return;
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    this.t += dt;
    if (this.furyT > 0) { this.furyT -= dt; this.shake = Math.max(this.shake, this.furyAmp * Math.min(1, this.furyT / 0.5) * (0.75 + 0.25 * Math.sin(this.t * 60))); }   // fureur : secousse tenue pendant le cri
    this.shake = Math.max(0, this.shake - dt * 14);
    this.buffT = Math.max(0, this.buffT - dt);
    if (this.state === 'dead') { this.deadT += dt; this.updateFx(dt); if (this.deadT > 3 && (Input.pressed('interact') || Input.pressed('light') || this.deadT > 6.5)) this.respawn(); return; }
    const cineLock = this.cine ? this.updateCine(dt) : false;
    if (!cineLock) this.updateChief(dt);
    this.updateRespawn(dt);
    this.updateEnemies(dt);
    this.updateProjs(dt);
    this.updateRings(dt);
    this.updateZones(dt);
    this.updateExtras(dt);
    this.updateElements(dt);
    this.updateTutorial(dt);
    this.updateFx(dt);
    this.updateWorld(dt);
    const c = this.chief();
    if (this.cine) return;
    const tx = clamp(c.x - W / 2, 0, M.MW * TS - W), ty = clamp(c.y - H / 2 - 6, 0, M.MH * TS - H);
    const k = 1 - Math.exp(-9 * dt); this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
  }

  // ---------- équipe : un seul Pokémon sur le terrain, les deux autres en réserve ----------
  actors() { const c = this.chief(); return c && !c.exh ? [c] : []; }
  tickMember(m, dt) {
    m.flash -= dt; m.inv -= dt; m.cd -= dt;
    if (m.exh) { m.at += dt; m.deadT += dt; }
  }
  updateChief(dt) {
    const m = this.chief();
    this.swapCd -= dt;
    const linkKey = Input.pressed('link'); if (linkKey) this.tryLink();
    if (Input.pressed('guard')) this.guardPressT = this.t;
    for (const a of ['light', 'heavy', 'ability', 'dodge']) if (Input.pressed(a) && !(linkKey && a === 'ability')) this.buf = { a, t: 0.3 };
    if (this.buf) { this.buf.t -= dt; if (this.buf.t <= 0) this.buf = null; }
    if (Input.pressed('next')) this.cycleChief();
    for (let i = 0; i < 3; i++) if (Input.pressed('s' + (i + 1))) this.switchTo(i);
    if (Input.pressed('lock')) this.toggleLock();
    if (this.lock && (Input.pressed('lockNext') || Input.pressed('lockPrev'))) this.cycleLock(Input.pressed('lockNext') ? 1 : -1);
    if (Input.pressed('berry')) this.useBerry();
    if (Input.pressed('ether')) this.useEther();
    if (Input.pressed('candy')) this.useCandy(this.team.indexOf(m));
    if (Input.pressed('revive')) { const i = this.team.findIndex(q => q.exh); if (i >= 0) this.useRevive(i); }
    for (const q of this.team) this.tickMember(q, dt);
    this.updateStatus(m, dt);
    if (this.state === 'dead') return;
    if (this.lock && (this.lock.dead || hyp(this.lock.x - m.x, this.lock.y - m.y) > 260)) this.lock = null;

    this.stamPause -= dt;
    let [ax, ay] = Input.axis();
    if ((ax || ay) && m.fx && m.fx.k === 'confuse') { const a = Math.sin(this.t * 4) * 0.9 + Math.sin(this.t * 7.3) * 0.5, c = Math.cos(a), s = Math.sin(a); [ax, ay] = [ax * c - ay * s, ax * s + ay * c]; }
    const moving = !!(ax || ay);
    if (m.exh) { this.stamTick(dt, false); this.switchT -= dt; if (this.switchT <= 0) this.autoSwitch(); return; }

    let busy = false;
    if (m.fx && m.fx.k === 'freeze') { m.atk = null; m.dodge = null; m.dash = null; setAnim(m, 'Hurt', false); busy = true; this.buf = null; }
    else if (m.hurtT > 0) { m.hurtT -= dt; move(this, m, m.kx * dt, m.ky * dt); m.kx *= 0.88; m.ky *= 0.88; setAnim(m, 'Hurt', false); m.at += dt; busy = true; }
    else if (m.dodge) {
      const d = m.dodge; d.t += dt; const sp = d.dist / d.dur; move(this, m, d.dx * sp * dt, d.dy * sp * dt);
      setAnim(m, 'Walk'); m.at += dt * 2.4; busy = true; if (d.t >= d.dur) m.dodge = null;
    } else if (m.drink > 0) { m.drink -= dt; setAnim(m, 'Idle'); m.at += dt; busy = true; }
    else if (m.atk) {
      this.tickAtk(m, dt); busy = true;
      if (this.buf && this.buf.a === 'dodge' && (m.atk && m.atk.done)) { m.atk = null; this.buf = null; this.tryDodge(m, ax, ay); }
    }
    if (busy) { this.stamTick(dt, false); this.guarding = false; this.wasGuard = false; return; }

    const guarding = Input.down('guard') && this.stam > 0;
    if (guarding && !this.wasGuard) this.guardT = 0; this.wasGuard = guarding; if (guarding) this.guardT += dt; this.guarding = guarding;

    if (this.buf) {
      const a = this.buf.a; this.buf = null;
      if (a === 'dodge') { if (this.stam > 0) { this.tryDodge(m, ax, ay); return; } }
      else if (this.tryAttack(m, a)) return;
    }

    const run = Input.down('run') && moving && this.stam > 0 && !guarding;
    let spd = m.def.speed; if (run) { spd *= 1.5; this.stam = Math.max(0, this.stam - 8 * dt); this.stamPause = 0.5; } if (guarding) spd *= 0.45;
    if (m.fx && m.fx.k === 'para') spd *= 0.6;
    spd *= this.terrain.slow;
    if (moving) move(this, m, ax * spd * dt, ay * spd * dt);
    if (this.lock) { m.face = unit(this.lock.x - m.x, this.lock.y - m.y); }
    else if (moving) m.face = unit(ax, ay);
    setAnim(m, moving ? 'Walk' : 'Idle'); m.at += dt * (run ? 1.5 : 1) * (guarding ? 0.5 : 1);
    this.stamTick(dt, run || guarding);
  }
  stamTick(dt, hold) { if (!hold && this.stamPause <= 0) { const m = this.chief(); this.stam = Math.min(this.maxStam, this.stam + 35 * (m && m.fx && m.fx.k === 'para' ? 0.5 : 1) * (this.linkMalus > 0 ? 0.4 : 1) * (this.terrain.frost ? 0.5 : 1) * dt); } }

  tryDodge(m, ax, ay) {
    let d = (ax || ay) ? unit(ax, ay) : { x: -m.face.x, y: -m.face.y };
    this.stam = Math.max(0, this.stam - 20 * (this.linkMalus > 0 ? 1.5 : 1)); this.stamPause = 0.8; this.comboHold(0.35);   // l'esquive garde le combo : la fenêtre ne s'écoule qu'après la roulade
    m.dodge = { t: 0, dur: 0.35, iframes: 0.28, dist: m.fx && m.fx.k === 'para' ? 44 : 64, dx: d.x, dy: d.y }; m.atk = null;
    if (!this.lock && (ax || ay)) m.face = d;
    SFX.dodge();
    for (let i = 0; i < 4; i++) this.spark(m.x, m.y, '#9fb3ff', 1);
    return true;
  }
  tryAttack(m, kind) {
    if (this.stam <= 0.5) return false;
    const ab = m.def.ability;
    if (kind === 'ability' && m.cd > 0) return false;
    if (kind === 'ability') this.comboReset(); else if (this.comboStep(m, kind)) return true;
    const cost = kind === 'light' ? 12 : kind === 'heavy' ? 28 : ab.cost;
    this.stam = Math.max(0, this.stam - cost); this.stamPause = 0.8;
    this.startAttack(m, kind, this.aimTarget(m));
    if (kind === 'ability') this.tutEvent('ct');
    return true;
  }
  // animation du sprite PMDCollab la mieux adaptée à l'attaque (les noms existent selon l'espèce)
  attackAnim(m, kind) {
    const d = m.def, id = d.id;
    if (kind === 'ability') return pickAnim(id, d.ability.anims);
    if (d.mode === 'ranged') return pickAnim(id, kind === 'heavy' ? ['SpAttack', 'Shoot', 'Charge'] : ['Shoot', 'Charge', 'Attack']);
    return pickAnim(id, kind === 'heavy' ? ['Strike', 'Swing', 'Double', 'Attack'] : ['Attack', 'Strike']);
  }
  aimTarget(m) {
    if (this.lock && !this.lock.dead) return this.lock;
    let best = null, bd = (m.def.range + 40) * (m.def.mode === 'ranged' ? 1.5 : 1);
    for (const e of this.enemies) {
      if (e.dead || e.state === 'dormant') continue; const dx = e.x - m.x, dy = e.y - m.y, d = hyp(dx, dy);
      if (d < bd && (d < 14 || (dx * m.face.x + dy * m.face.y) / d > 0.2)) { bd = d; best = e; }
    }
    return best;
  }
  // coup de stick droit : passe à la cible voisine (triée de gauche à droite sur l'écran), en boucle
  cycleLock(dir) {
    const m = this.chief(), c = [];
    for (const e of this.enemies) { if (e.dead || e.state === 'dormant') continue; if (hyp(e.x - m.x, e.y - m.y) < 200 && M.lineClear(this.world, m.x, m.y, e.x, e.y)) c.push(e); }
    if (c.length < 2) return; c.sort((a, b) => a.x - b.x || a.y - b.y);
    const i = Math.max(0, c.indexOf(this.lock)); this.lock = c[(i + dir + c.length) % c.length];
  }
  toggleLock() {
    if (this.lock) { this.lock = null; return; }
    const m = this.chief(); let best = null, bd = 180;
    for (const e of this.enemies) { if (e.dead || e.state === 'dormant') continue; const d = hyp(e.x - m.x, e.y - m.y); if (d < bd && M.lineClear(this.world, m.x, m.y, e.x, e.y)) { bd = d; best = e; } }
    this.lock = best; if (best) this.tutEvent('lock');
  }
  useBerry() {
    const m = this.chief(); if (m.exh || this.berries <= 0 || (m.hp >= m.maxhp && !m.fx) || m.atk || m.dodge || m.drink > 0 || (m.fx && m.fx.k === 'freeze')) return;
    this.berries--; this.tutEvent('berry'); m.hp = Math.min(m.maxhp, m.hp + m.maxhp * 0.4); m.fx = null; m.drink = 0.55; SFX.heal(); this.healFx(m);
  }
  // fiole d'endurance (Huile) : endurance pleine et capacité spéciale rechargée
  useEther() {
    const m = this.chief(); if (m.exh || this.ethers <= 0 || m.atk || m.dodge || m.drink > 0 || (m.fx && m.fx.k === 'freeze')) return;
    if (this.stam >= this.maxStam * 0.9 && m.cd <= 0) return;
    this.ethers--; this.stam = this.maxStam; this.stamPause = 0; m.cd = 0; m.drink = 0.5; SFX.heal(); this.ringFx(m.x, m.y, 20, '#7fd0ff'); this.fx('charge', m.x, m.y, { scale: 0.55, z: 12, add: true, dur: 0.5 });
    for (let i = 0; i < 8; i++) this.parts.push({ x: m.x + rand(-8, 8), y: m.y, z: 0, vx: 0, vy: 0, vz: rand(25, 50), life: 0.7, max: 0.7, c: '#7fd0ff', size: 2 });
    this.floatText(m.x, m.y - 26, 'Endurance', '#7fd0ff');
  }
  cycleChief() { for (let k = 1; k <= 2; k++) { const i = (this.chiefIdx + k) % 3; if (!this.team[i].exh) { this.switchTo(i); return; } } }
  // relève : le nouveau Pokémon prend la place de l'ancien (brève invulnérabilité, délai avant de pouvoir recommencer)
  switchTo(i, force) {
    const n = this.team[i], o = this.chief();
    if (!n || i === this.chiefIdx || n.exh || this.state !== 'play' || (this.swapCd > 0 && !force) || (this.linkT > 0 && !force)) return false;
    if (this.linkT > 0) this.endLink(true);
    this.comboReset();
    this.swapBall(o, n, force);
    n.x = o.x; n.y = o.y; n.face = o.face; n.dir = o.dir; n.atk = null; n.dodge = null; n.dash = null; n.hurtT = 0; n.kx = n.ky = 0; n.drink = 0;
    n.fx = null; n.regen = null; o.fx = null; o.regen = null; o.atk = null; o.dodge = null; o.dash = null;
    n.inv = Math.max(n.inv, force ? 1 : 0.7); setAnim(n, 'Idle'); n.anim = 'Idle';
    this.chiefIdx = i; this.swapCd = force ? 0 : 1.2; this.lock = null; this.guarding = false; this.buf = null; this.hitstop = 0;
    this.ringFx(n.x, n.y, 22, n.def.color); SFX.pick();
    for (let k = 0; k < 10; k++) this.spark(n.x, n.y - 8, k % 2 ? '#ffffff' : n.def.color, 1);
    this.emit('toast', n.def.name + ' entre au combat');
    this.tryRelay(n, o);
    return true;
  }
  autoSwitch() { for (let k = 1; k <= 2; k++) { const i = (this.chiefIdx + k) % 3; if (!this.team[i].exh) { this.switchTo(i, true); return; } } this.die(); }

  // ---------- altérations d'état ----------
  statusOf(o) { if (!o) return null; if (o.def && o.def.status) return o.def.status; return D.ENEMY_STATUS[o.type] || null; }
  inflict(m, k) {
    if (this.god || m.exh) return;
    const S = D.STATUS[k];
    if (m.fx && m.fx.k === k) { m.fx.t = S.dur; return; }
    if (k === 'freeze' && m.frzImm > 0) return;
    m.fx = { k, t: S.dur, tick: 1 };
    if (k === 'freeze') { m.atk = null; m.dodge = null; m.dash = null; this.guarding = false; }
    this.floatText(m.x, m.y - 32, S.name, S.color); this.burst(m.x, m.y - 8, S.color, 6); this.fxStatus(m, k);
  }
  updateStatus(m, dt) {
    if (m.frzImm > 0) m.frzImm -= dt;
    if (m.regen && !m.exh) {
      m.regen.t -= dt; m.hp = Math.min(m.maxhp, m.hp + m.maxhp * m.regen.pct * dt);
      if (Math.random() < dt * 6) this.parts.push({ x: m.x + rand(-6, 6), y: m.y, z: 0, vx: 0, vy: 0, vz: 30, life: 0.7, max: 0.7, c: '#8dffb0', size: 2 });
      if (m.regen.t <= 0) m.regen = null;
    }
    const f = m.fx; if (!f || m.exh) return;
    f.t -= dt; const S = D.STATUS[f.k];
    if (S.dot) {
      f.tick -= dt;
      if (f.tick <= 0) {
        f.tick += 1; let d = Math.max(1, Math.round(m.maxhp * S.dot));
        if (f.k === 'poison') d = Math.min(d, Math.max(0, Math.floor(m.hp) - 1));
        if (d > 0) { m.hp -= d; m.flash = 0.1; this.floatText(m.x, m.y - 22, String(d), S.color); if (m.hp <= 0) { this.memberDown(m); return; } }
      }
    }
    if (Math.random() < dt * 10) this.parts.push({ x: m.x + rand(-5, 5), y: m.y, z: rand(2, 14), vx: 0, vy: 0, vz: 20, life: 0.5, max: 0.5, c: S.color, size: 2 });
    if (f.t <= 0) { if (f.k === 'freeze') m.frzImm = 1.5; m.fx = null; }
  }
  inflictEnemy(e, k) {
    if (e.dead) return; const S = D.STATUS[k];
    if ((k === 'freeze' || k === 'confuse') && (e.boss || e.def.armor)) return;
    if (e.fx && e.fx.k === k) { e.fx.t = S.dur; return; }
    e.fx = { k, t: S.dur, tick: 1 };
    if (k === 'poison') this.addMark(e, 'toxin');
    this.floatText(e.x, e.y - 30, S.name, S.color); this.burst(e.x, e.y - 8, S.color, 6); this.fxStatus(e, k);
    if (k === 'freeze') { e.state = 'stagger'; e.st = S.dur; e.tele = false; setAnim(e, 'Hurt', false); }
    if (k === 'confuse') { e.state = 'dizzy'; e.st = S.dur * 0.5; e.tele = false; }
  }
  tickEnemyFx(e, dt) {
    const f = e.fx; if (!f) return;
    f.t -= dt; const S = D.STATUS[f.k];
    if (S.dot) {
      f.tick -= dt;
      if (f.tick <= 0) {
        f.tick += 1; const d = Math.max(1, Math.round(e.maxhp * S.dot * (e.boss ? 0.2 : 1)));
        if (e.boss) { const th = D.BOSS_THRESHOLDS; const floor = (e.phase === 1 ? th[0] : e.phase === 2 ? th[1] : 0) * e.maxhp + 1; e.hp = Math.max(Math.min(e.hp, floor), e.hp - d); }
        else e.hp -= d;
        e.flash = 0.1; this.floatText(e.x, e.y - 20, String(d), S.color);
        if (e.hp <= 0 && !e.boss) { this.killEnemy(e); return; }
      }
    }
    if (Math.random() < dt * 8) this.parts.push({ x: e.x + rand(-5, 5), y: e.y, z: rand(2, 16), vx: 0, vy: 0, vz: 20, life: 0.5, max: 0.5, c: S.color, size: 2 });
    if (f.t <= 0) e.fx = null;
  }
  healAura(m, tm) {
    this.ringFx(m.x, m.y, tm.radius * 0.7, tm.color); this.ringFx(m.x, m.y, tm.radius * 0.35, '#8dffb0');
    for (let i = 0; i < 28; i++) { const a = rand(0, 6.28), r = rand(8, tm.radius * 0.7); this.parts.push({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r * 0.6, z: 0, vx: 0, vy: 0, vz: rand(25, 60), life: rand(0.6, 1.0), max: 1, c: i % 2 ? '#8dffb0' : tm.color, size: 2 }); }
  }

  // ---------- les ennemis vaincus reviennent au bout d'un moment ----------
  queueRespawn(e) { if (e.boss || e.clone || e.big || e.queued) return; e.queued = true; this.respawnQ.push({ type: e.type, x: e.hx, y: e.hy, t: 110 + Math.random() * 40 }); }
  updateRespawn(dt) {
    if (!this.respawnQ.length || this.bossActive) return; const c = this.chief();
    for (const q of this.respawnQ) {
      q.t -= dt;
      if (q.t <= 0 && hyp(q.x - c.x, q.y - c.y) > 240) { this.enemies.push(this.makeEnemy(q.type, q.x, q.y)); q.done = true; }
    }
    this.respawnQ = this.respawnQ.filter(q => !q.done);
  }

  // ---------- attaques ----------
  startAttack(m, kind, tgt) {
    const d = m.def, ab = d.ability; const anim = this.attackAnim(m, kind);
    const tm = timing(d.id, anim);
    let aim = tgt ? unit(tgt.x - m.x, tgt.y - m.y) : { x: m.face.x, y: m.face.y };
    if (m.fx && m.fx.k === 'confuse') { const a = Math.atan2(aim.y, aim.x) + rand(-0.7, 0.7); aim = { x: Math.cos(a), y: Math.sin(a) }; }
    m.face = aim;
    const sp = Math.max(1, tm.hit / (kind === 'light' ? 0.34 : kind === 'heavy' ? 0.42 : 0.5), tm.total / 1.15);
    m.atk = { kind, anim, t: 0, pre: kind === 'heavy' ? 0.26 : 0, hit: tm.hit / sp, total: tm.total / sp, speed: sp, done: false, aim, tgt };
    m.dir = dirFromVec(aim.x, aim.y);
    SFX.swing();
    if (kind === 'ability') {
      m.cd = ab.cd;
      if (ab.kind === 'lunge') m.dash = { vx: aim.x * 330, vy: aim.y * 330, t: 0.2 };
      if (ab.kind === 'smoke') {
        for (let i = 0; i < 10; i++) this.spark(m.x, m.y - 6, ab.color, 1.5);
        if (tgt) { const bx = tgt.x - aim.x * (tgt.r + 10), by = tgt.y - aim.y * (tgt.r + 10); if (M.boxFree(this.world, bx, by, 4, 3)) { m.x = bx; m.y = by; } m.inv = Math.max(m.inv, 0.4); }
        else m.dash = { vx: aim.x * 300, vy: aim.y * 300, t: 0.2 };
        for (let i = 0; i < 10; i++) this.spark(m.x, m.y - 6, ab.color, 1.5);
      }
    }
  }
  tickAtk(m, dt) {
    const a = m.atk; a.t += dt;
    if (m.dash) { move(this, m, m.dash.vx * dt, m.dash.vy * dt); m.dash.t -= dt; if (m.dash.t <= 0) m.dash = null; }
    else if (!a.done && m.def.mode === 'melee' && a.kind !== 'ability') move(this, m, a.aim.x * 26 * dt, a.aim.y * 26 * dt);
    m.dir = dirFromVec(a.aim.x, a.aim.y);
    if (a.t < a.pre) { setAnim(m, 'Charge'); m.at += dt; return; }
    const t = a.t - a.pre; setAnim(m, a.anim, false); m.at = t * (a.speed || 1);
    if (!a.done && t >= a.hit) { a.done = true; this.doHit(m, a); }
    if (t >= a.total) { m.atk = null; if (m === this.chief()) this.comboAt = this.t; }
  }
  powerOf(m, a) {
    const d = m.def; const mult = a.kind === 'heavy' ? 1.9 : a.kind === 'ability' ? d.ability.mult : 1;
    let p = d.dmg * mult;
    if (m.fx && m.fx.k === 'burn') p *= 0.8;
    if (this.buffT > 0) p *= this.buffMult || 1.5;
    if (a.kind === 'ability') p *= 1 + 0.08 * m.vit.calcium;
    return p;
  }
  doHit(m, a) {
    const d = m.def, dmg = this.powerOf(m, a), aim = a.aim, heavy = a.kind === 'heavy';
    this.curElem = this.elemOf(m, a); this.curTrig = this.trigOf(m, a);
    if (this.curElem === 'water' && (a.kind === 'ability' || a.kind === 'sig')) this.addSurf('puddle', m.x + aim.x * 22, m.y + aim.y * 22, 20, 7, dmg);
    if (a.kind === 'sig') { this.doSignature(m, a); return; }
    if (a.kind === 'ability') {
      const tm = d.ability, k = tm.kind, ang = Math.atan2(aim.y, aim.x), np = this.projs.length;
      if (k === 'lunge' || k === 'smoke') this.meleeArc(m, aim, d.range + 14, -0.1, dmg, { heavy: true, stagger: 0.7, knock: 90, status: tm.status });
      else if (k === 'flame') {
        this.meleeArc(m, aim, 54, 0.35, dmg, { heavy: true, stagger: 0.6, knock: 60, status: tm.status });
        for (let i = 0; i < 26; i++) { const aa = ang + rand(-0.35, 0.35), s = rand(60, 170); this.parts.push({ x: m.x, y: m.y, z: 8, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s * 0.7, vz: rand(-5, 15), life: rand(0.25, 0.45), max: 0.45, c: Math.random() < 0.5 ? tm.color : '#ffd36a', size: 3 }); }
        this.fxRings.push({ x: m.x + aim.x * 28, y: m.y + aim.y * 28, r: 30, c: tm.color, t: 0 }); SFX.boom();
      } else if (k === 'shock') { this.meleeArc(m, aim, tm.radius, -2, dmg, { heavy: true, stagger: 0.9, knock: 140, status: tm.status }); this.ringFx(m.x, m.y, tm.radius, tm.color); SFX.boom(); this.shake = Math.max(this.shake, 2); }
      else if (k === 'volley') { for (let i = -2; i <= 2; i++) this.fireProj({ x: m.x, y: m.y, ang: ang + i * 0.16, speed: 230, dmg, r: 3, life: 0.9, team: 'p', color: tm.color, owner: m, status: tm.status }); SFX.shoot(); }
      else if (k === 'burst') { this.fireProj({ x: m.x, y: m.y, ang, speed: 190, dmg, r: 5, life: 1.3, team: 'p', color: tm.color, owner: m, status: tm.status, explode: 32, heavy: true }); SFX.shoot(); }
      else if (k === 'leech') { this.fireProj({ x: m.x, y: m.y, ang, speed: 220, dmg, r: 4, life: 1.0, team: 'p', color: tm.color, owner: m, status: tm.status, leech: true, heavy: true }); SFX.shoot(); }
      else if (k === 'beam') {
        const len = 200; this.beams.push({ x: m.x, y: m.y - 6, ang, len, t: 0, max: 0.28, color: tm.color, w: 6 }); SFX.boom(); this.shake = Math.max(this.shake, 2);
        let hit = false;
        for (const e of this.enemies) { if (e.dead) continue; const rx = e.x - m.x, ry = e.y - m.y, al = rx * aim.x + ry * aim.y, pd = Math.abs(rx * aim.y - ry * aim.x); if (al > 0 && al < len + e.r && pd < e.r + 7) { if (this.damageEnemy(e, dmg, m, { heavy: true, stagger: 0.8, knock: 80, status: tm.status })) hit = true; } }
        for (let q = 1; q <= 8; q++) this.hitObs(m.x + aim.x * len * q / 8, m.y + aim.y * len * q / 8, 8, dmg * 0.4, this.curElem);
        if (hit && m === this.chief()) this.hitstop = 0.05;
      } else if (k === 'heal' || k === 'cleanse') {
        let tot = 0;
        for (const q of this.team) { if (q.exh) continue; const h = Math.min(q.maxhp - q.hp, q.maxhp * tm.mult); q.hp += h; tot += h; if (tm.cure || k === 'cleanse') q.fx = null; }
        this.healAura(m, tm); this.floatText(m.x, m.y - 30, '+' + Math.round(tot) + ' PV', '#8dffb0'); SFX.heal();
        this.emit('toast', tm.name + ' : toute l’équipe est soignée' + (tm.cure || k === 'cleanse' ? ' et guérie' : ''));
      } else if (k === 'regen') {
        m.regen = { t: 8, pct: tm.mult }; this.healAura(m, tm); SFX.heal(); this.emit('toast', tm.name + ' : régénération pendant 8 s');
      } else if (k === 'haste') { this.buffT = 10; this.buffMult = tm.mult; this.ringFx(m.x, m.y, 40, tm.color); SFX.pick(); this.emit('toast', tm.name + ' : dégâts ×' + tm.mult + ' pendant 10 s'); }
      this.fxAbility(m, tm, aim, ang, np);
      return;
    }
    if (d.mode === 'melee') { this.fxSwing(m, aim, d.range, heavy); this.meleeArc(m, aim, d.range + (heavy ? 8 : 4), heavy ? -0.1 : 0.25, dmg, { heavy, stagger: heavy ? 0.7 : 0.38, knock: heavy ? 70 : 30 }); }
    else {
      this.fireProj({ x: m.x, y: m.y, ang: Math.atan2(aim.y, aim.x), speed: heavy ? 150 : 210, dmg, r: heavy ? 5 : 3, life: 1.2, team: 'p', color: d.orb || '#ffe27a', owner: m, heavy });
      SFX.shoot();
    }
  }
  meleeArc(m, aim, range, cosMin, dmg, o) {
    let hit = false;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = e.x - m.x, dy = e.y - m.y, d = hyp(dx, dy);
      if (d > range + e.r) continue;
      if (d > e.r + 6 && (dx * aim.x + dy * aim.y) / d < cosMin) continue;
      if (this.damageEnemy(e, dmg, m, o)) hit = true;
    }
    if (cosMin < -1) this.hitObs(m.x, m.y, range, dmg * 0.8, this.curElem); else this.hitObs(m.x + aim.x * range * 0.55, m.y + aim.y * range * 0.55, range * 0.5 + 4, dmg * 0.8, this.curElem);
    if (hit && m === this.chief()) this.hitstop = 0.045;
    return hit;
  }
  fireProj(p) { this.projs.push({ ...p, elem: p.elem || this.curElem, trig: p.trig || this.curTrig, vx: Math.cos(p.ang) * p.speed, vy: Math.sin(p.ang) * p.speed, age: 0 }); }

  // ---------- dégâts ----------
  damageEnemy(e, dmg, src, o = {}) {
    if (e.dead || e.invuln > 0) return false;
    if (e.tutDummy && src.def) this.tutEvent('hit', { heavy: !!o.heavy });
    const dmg0 = dmg; let back = false;
    if (!e.boss && src.def && (e.face.x * (src.x - e.x) + e.face.y * (src.y - e.y)) < -4 && e.state !== 'dormant') { dmg *= 1.15; back = true; }
    const crit = Math.random() < 0.08; if (crit) dmg *= 1.5;
    const elemOn = !o.noElem && src.def;
    dmg *= this.elemMult(e, o, src);
    if (o.sig && e.boss) dmg *= 0.55;
    if (e.boss) {
      // bonus empilés (critique, type, vulnérabilité, signature) plafonnés ; l'excédent est perdu
      dmg = Math.min(dmg, dmg0 * BAL.BOSS_MULT_CAP);
      // Lien : les alliés invoqués font la moitié des dégâts, et au plus 5 % des PV du boss par invocation
      if (src.summoned) {
        dmg *= BAL.LINK_BOSS_DMG;
        dmg = Math.max(0, Math.min(dmg, e.maxhp * BAL.LINK_BOSS_CAP - (this.linkBossDmg || 0)));
        this.linkBossDmg = (this.linkBossDmg || 0) + dmg;
      }
      const tl = e.tel || (e.tel = { t0: this.t, chief: 0, ally: 0, react: 0, hits: 0, links: 0 });
      tl[o.react ? 'react' : src.summoned ? 'ally' : 'chief'] += dmg; tl.hits++;
    }
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg; e.flash = 0.12; e.aggro = true;
    if (src === this.chief() && !src.summoned) this.addLink(o.sig ? 5 : o.heavy ? 4.5 : 2.5);
    if (e.state === 'idle' || e.state === 'dormant') e.state = 'chase';
    this.floatText(e.x, e.y - 18, String(dmg), crit || back ? '#ffd24a' : '#ffffff');
    this.burst(e.x, e.y - 6, crit ? '#ffd24a' : '#ffffff', crit ? 8 : 4); this.fxHit(e, src, o, crit);
    (crit ? SFX.crit : SFX.hit)();
    const kd = unit(e.x - src.x, e.y - src.y);
    if (!e.boss && !e.def.armor) { e.kx = kd.x * (o.knock || 30) * 3; e.ky = kd.y * (o.knock || 30) * 3; }
    if (e.boss) {
      const th = D.BOSS_THRESHOLDS;
      if (e.phase === 1 && e.hp <= th[0] * e.maxhp) { e.hp = th[0] * e.maxhp; this.bossPhase(e, 2); }
      else if (e.phase === 2 && e.hp <= th[1] * e.maxhp) { e.hp = th[1] * e.maxhp; this.bossPhase(e, 3); }
    } else if (!(e.fx && e.fx.k === 'freeze') && (!e.def.armor || o.heavy)) { e.state = 'stagger'; e.st = o.stagger || 0.35; e.tele = false; }
    if (o.status && e.hp > 0 && Math.random() < o.status[1]) this.inflictEnemy(e, o.status[0]);
    if (elemOn && e.hp > 0) this.elemApply(e, dmg, src, o);
    if (e.hp <= 0) this.killEnemy(e);
    return true;
  }
  // mesure en combat : durée et part de chaque source de dégâts (pour caler les PV des boss)
  bossReport(e) {
    const tl = e.tel; if (!tl) return;
    const T = Math.max(1, this.t - tl.t0), tot = Math.max(1, tl.chief + tl.ally + tl.react), p = v => Math.round(100 * v / tot);
    const r = { boss: e.type === 'boss' ? e.def.name : e.type, secondes: Math.round(T), pv: e.maxhp, dpsEffectif: +(tot / T).toFixed(2), pctPokemon: p(tl.chief), pctLien: p(tl.ally), pctReactions: p(tl.react), liens: tl.links };
    (window.__bossReports = window.__bossReports || []).push(r); console.table([r]);
    this.emit('toast', r.boss + ' : ' + r.secondes + ' s, Lien ' + r.pctLien + ' %');
  }
  killEnemy(e) {
    e.dead = true; e.deadT = 0; e.hp = 0; e.tele = false; this.queueRespawn(e);
    if (this.lock === e) this.lock = null;
    if (e.essence) { this.essence += e.essence; this.floatText(e.x, e.y - 28, '+' + e.essence, '#ffd37a'); }
    this.burst(e.x, e.y - 6, e.boss ? '#e0a0ff' : '#ffd37a', e.boss ? 40 : 12); SFX.hit();
    if (e.boss) this.fx('selfdestruct', e.x, e.y, { scale: 1.8, z: 20, add: true, dur: 0.8, glow: '#e0a0ff' }); else this.fx('mist', e.x, e.y, { scale: 0.7, z: 10, dur: 0.6, alpha: 0.8 });
    if (e.big && !this.prog[this.mapIdx].bigDead) {
      this.prog[this.mapIdx].bigDead = true; this.bag.candy = (this.bag.candy || 0) + 1; this.save();
      this.emit('banner', D.NAMES_FR[e.type].toUpperCase() + ' VAINCU', 'mini'); this.emit('toast', '+1 Super Bonbon');
    }
    if (e.boss) { this.bossReport(e); this.bossDefeated(e); }
  }
  hurtMember(m, dmg, src, o = {}) {
    if (m.exh || m.inv > 0 || this.god) return false;
    let sx = null; const chief = m === this.chief();
    if (chief && m.dodge && m.dodge.t < m.dodge.iframes) { if (this.t - this.lastPD > 0.6) { this.lastPD = this.t + (m.dodge.dur - m.dodge.t); this.addLink(6);   // le chrono du relais démarre à la fin de la roulade this.floatText(m.x, m.y - 24, 'Esquive', '#9fb3ff'); this.tutEvent('dodge'); } return false; }
    const dx = src.x - m.x, dy = src.y - m.y, dl = hyp(dx, dy) || 1;
    dmg *= Math.max(0.5, 1 - 0.04 * this.team.reduce((s, q) => s + q.vit.iron, 0) / 3);
    dmg *= this.elemDefMult(m, o, src);
    const pre = chief && !this.guarding && o.parry !== false && this.stam > 0 && this.t - this.guardPressT <= this.parryPre;   // pré-appui : garde pressée juste avant l'impact
    if (chief && (this.guarding || pre) && (dx * m.face.x + dy * m.face.y) / dl > -0.15 && !m.atk) {
      if ((pre || this.guardT < this.parryWin) && o.parry !== false) {
        this.guardPressT = -9; this.lastParry = this.t + 0.4; this.tutEvent('parry');   // fenêtre de relais : après la récupération (0,4 s) SFX.parry(); this.hitstop = 0.09; this.shake = 3; this.floatText(m.x, m.y - 24, 'PARADE !', '#9fe8ff'); this.burst(m.x + m.face.x * 10, m.y - 6, '#9fe8ff', 10); this.fx('protect', m.x + m.face.x * 12, m.y, { scale: 0.6, z: 12, add: true, dur: 0.4, glow: '#9fe8ff' });
        m.inv = 0.4; this.stam = Math.min(this.maxStam, this.stam + 20); this.addLink(14); this.comboN = 2; this.comboAt = this.t + 0.6;
        return 'parry';
      }
      const red = m.def.guard != null ? m.def.guard : 0.35; dmg = Math.max(1, Math.round(dmg * red));
      this.stam = Math.max(0, this.stam - dmg * 1.1 - 6); this.stamPause = 1; SFX.block();
      this.burst(m.x + m.face.x * 8, m.y - 6, '#cfe6ff', 5);
      if (this.stam <= 0) { this.guarding = false; this.guardT = 9; m.hurtT = 0.4; m.kx = -dx / dl * 90; m.ky = -dy / dl * 90; this.emit('toast', 'Garde brisée'); }
    } else {
      dmg = Math.round(dmg); m.hurtT = 0.28 + (o.heavy ? 0.15 : 0); m.kx = -dx / dl * (o.heavy ? 150 : 80); m.ky = -dy / dl * (o.heavy ? 150 : 80); m.atk = null; m.dash = null;
      SFX.hurt(); if (chief) { this.comboHit(m, dmg, o); this.shake = Math.max(this.shake, 3); this.hitstop = 0.05; }
      sx = o.status || this.statusOf(o.owner);
    }
    m.hp -= dmg; m.flash = 0.12; m.inv = 0.45;
    this.floatText(m.x, m.y - 22, String(dmg), '#ff6a6a'); this.burst(m.x, m.y - 6, '#ff6a6a', 4); this.fx('tackle', m.x, m.y, { scale: 0.5, z: 12, add: true, dur: 0.3 });
    if (sx && m.hp > 0 && Math.random() < sx[1]) this.inflict(m, sx[0]);
    this.elemOnHurt(m, dmg, o, src);
    if (m.hp <= 0) this.memberDown(m);
    return true;
  }
  memberDown(m) {
    m.hp = 0; m.exh = true; m.fx = null; m.regen = null; m.atk = null; m.dodge = null; m.drink = 0; m.deadT = 0; setAnim(m, hasAnim(m.id, 'Faint') ? 'Faint' : 'Hurt', false);
    this.floatText(m.x, m.y - 24, 'K.O.', '#ff9a9a'); SFX.death();
    if (m === this.chief()) { this.switchT = 0.8; this.lock = null; this.guarding = false; }
    if (this.team.every(q => q.exh)) this.die();
  }
  die() {
    if (this.state === 'dead') return;
    this.state = 'dead'; this.deadT = 0; this.guarding = false; this.endLink(true); this.comboReset();
    const c = this.chief();
    if (this.essence > 0) this.souvenir = { map: this.mapIdx, x: c.x, y: c.y, amount: this.essence };
    this.essence = 0; this.hubAt = null; this.save(); SFX.death(); this.emit('jingle', 'JINGLE_DEATH'); this.emit('banner', 'VOUS ÊTES MORT', 'death');
  }
  async respawn() {
    const l = this.last, map = l ? l.map : 0;
    this.bossActive = false;
    for (const m of this.team) { m.exh = false; m.hp = m.maxhp; m.hurtT = 0; m.inv = 1; m.cd = 0; m.anim = 'Idle'; m.atk = null; m.dodge = null; m.fx = null; m.regen = null; }
    this.chiefIdx = 0; this.berries = this.maxBerries; this.ethers = this.maxEthers; this.stam = this.maxStam; this.buffT = 0;
    await this.enterMap(map, l ? l.id : 'start');
  }

  // ---------- ennemis ----------
  nearestMember(e) {
    let best = null, bd = 1e9;
    for (const m of this.actors()) { const d = hyp(m.x - e.x, m.y - e.y); if (d < bd) { bd = d; best = m; } }
    return [best, bd];
  }
  updateEnemies(dt) {
    const ch = this.chief();
    for (const e of this.enemies) {
      if (e.dead) { e.deadT += dt; e.at += dt; continue; }
      e.at += dt; e.flash -= dt; e.cd -= dt; e.invuln = Math.max(0, e.invuln - dt);
      this.tickEnemyFx(e, dt); if (e.dead) continue;
      if (hyp(e.x - ch.x, e.y - ch.y) > 320 && e.state === 'idle' && !e.boss) continue;
      if (Math.abs(e.kx) + Math.abs(e.ky) > 1) { move(this, e, e.kx * dt, e.ky * dt, Math.min(e.r, 6) * 0.8); e.kx *= 0.86; e.ky *= 0.86; }
      if (e.tutDummy && !(this.tut && this.tut.aggro)) { setAnim(e, 'Idle'); e.state = 'idle'; e.tele = false; continue; }
      if (e.boss) { this.bossAI(e, dt); continue; }
      const def = e.def; const [tg, td] = this.nearestMember(e);
      if (!tg) continue;
      const dx = tg.x - e.x, dy = tg.y - e.y, u = unit(dx, dy);
      const see = td < def.sight && M.lineClear(this.world, e.x, e.y, tg.x, tg.y);
      const sp = def.speed * (e.fx && e.fx.k === 'para' ? 0.5 : 1) * this.markSpeed(e), hw = Math.min(e.r, 6) * 0.8;
      switch (e.state) {
        case 'dormant': setAnim(e, 'Idle'); if (td < def.sight) e.state = 'chase'; break;
        case 'idle': setAnim(e, 'Idle'); if (see) e.state = 'chase'; break;
        case 'return': {
          const hx = e.hx - e.x, hy = e.hy - e.y, hd = hyp(hx, hy);
          if (hd < 4) { e.state = def.dormant ? 'dormant' : 'idle'; e.hp = e.maxhp; } else { move(this, e, hx / hd * sp * dt, hy / hd * sp * dt, hw); setAnim(e, 'Walk'); e.face = unit(hx, hy); e.dir = dirFromVec(hx, hy); }
          if (see && td < def.sight * 0.8) e.state = 'chase';
          break;
        }
        case 'chase': {
          e.face = u; e.dir = dirFromVec(u.x, u.y);
          if (td > def.sight * 2.2 || hyp(e.x - e.hx, e.y - e.hy) > 420) { e.state = 'return'; break; }
          let mvx = 0, mvy = 0;
          const kind = def.kind;
          if (kind === 'ranged' || kind === 'ranged3') {
            if (td < def.range * 0.6) { mvx = -u.x; mvy = -u.y; } else if (td > def.range * 0.95) { mvx = u.x; mvy = u.y; } else { mvx = -u.y * 0.5; mvy = u.x * 0.5; }
            if (td < def.range && e.cd <= 0 && see) { e.state = 'windup'; e.st = def.windup; e.tele = true; SFX.telegraph(); }
          } else if (kind === 'slam') {
            if (td < def.range * 0.5) { mvx = -u.x; mvy = -u.y; } else if (td > def.range * 0.9) { mvx = u.x; mvy = u.y; }
            if (td < def.range && e.cd <= 0 && see) { e.state = 'windup'; e.st = def.windup; e.tele = true; e.slamAt = { x: tg.x, y: tg.y }; SFX.telegraph(); }
          } else if (kind === 'melee') {
            if (td > 40) { mvx = u.x; mvy = u.y; }
            if (td < 62 && e.cd <= 0) { e.state = 'windup'; e.st = def.windup; e.tele = true; e.lock = u; SFX.telegraph(); }
          } else if (kind === 'bomb') {
            mvx = u.x; mvy = u.y;
            if (td < def.range) { e.state = 'windup'; e.st = def.windup; e.tele = true; SFX.telegraph(); }
          } else if (kind === 'roller') {
            if (td > def.range * 0.8) { mvx = u.x; mvy = u.y; }
            if (td < def.range * 1.4 && e.cd <= 0) { e.state = 'windup'; e.st = def.windup; e.tele = true; SFX.telegraph(); }
          }
          const ml = hyp(mvx, mvy); if (ml > 0.05 && sp > 0) { move(this, e, mvx / ml * sp * dt, mvy / ml * sp * dt, hw); setAnim(e, 'Walk'); } else setAnim(e, 'Idle');
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
      for (const o of this.enemies) { if (o === e || o.dead) continue; const ox = e.x - o.x, oy = e.y - o.y, od = hyp(ox, oy); if (od > 0 && od < e.r + o.r) move(this, e, ox / od * 30 * dt, oy / od * 30 * dt, 4); }
    }
    this.enemies = this.enemies.filter(e => !(e.dead && e.deadT > 1.0 && !e.boss));
  }
  enemyStrike(e, u, tg) {
    const def = e.def;
    if (def.kind === 'ranged' || def.kind === 'ranged3') {
      const ang = Math.atan2(tg.y - e.y, tg.x - e.x); const n = def.kind === 'ranged3' ? [-0.28, 0, 0.28] : [0];
      for (const o of n) this.fireProj({ x: e.x, y: e.y, ang: ang + o + (e.blind > 0 ? rand(-0.55, 0.55) : 0), speed: def.proj, dmg: e.dmg, r: 3.5, life: 2.6, team: 'e', color: def.color, owner: e });
      SFX.shoot(); setAnim(e, def.anim, false); e.state = 'recover'; e.st = 0.45; e.cd = 1.7 * (def.rec || 1);
    } else if (def.kind === 'slam') {
      const s = e.slamAt || tg; this.ringFx(s.x, s.y, def.blast, def.color || '#ffb050'); this.fx('earthpower', s.x, s.y, { scale: def.blast / 42, z: 6, add: true, dur: 0.5 }); this.fx('dig', s.x, s.y, { scale: def.blast / 40, z: 0, ground: true, dur: 0.6 }); SFX.boom(); this.shake = Math.max(this.shake, 3); this.burst(s.x, s.y - 4, def.color || '#ffb050', 14);
      for (const m of this.actors()) if (!m.exh && hyp(m.x - s.x, m.y - s.y) < def.blast) this.hurtMember(m, e.dmg * 1.3, s, { owner: e, heavy: true, parry: false });
      setAnim(e, def.anim, false); e.state = 'recover'; e.st = 0.7; e.cd = 1.9; e.slamAt = null;
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
      if (!e.hitDone) for (const m of this.actors()) if (!m.exh && hyp(m.x - e.x, m.y - e.y) < e.r + 10) { const r = this.hurtMember(m, e.dmg, e, { owner: e }); e.hitDone = true; if (r === 'parry') this.parried(e); }
      if (e.st <= 0) { e.state = 'recover'; e.st = 0.55; e.cd = 1.3 * (def.rec || 1); }
    } else if (def.kind === 'roller') {
      const px = e.x, py = e.y; const sp = 200 * (e.st > 0.1 ? 1 : 0.4);
      move(this, e, e.vx * sp * dt, e.vy * sp * dt, 7, 5);
      for (const m of this.actors()) if (!m.exh && !e.rollHit.has(m) && hyp(m.x - e.x, m.y - e.y) < e.r + 8) { e.rollHit.add(m); const r = this.hurtMember(m, e.dmg, e, { owner: e, heavy: true }); if (r === 'parry') { this.parried(e); return; } }
      this.parts.push({ x: e.x, y: e.y, z: 4, vx: 0, vy: 0, vz: 10, life: 0.3, max: 0.3, c: '#ffe27a', size: 2 });
      if (hyp(e.x - px, e.y - py) < 0.4 * 200 * dt * 0.5) { e.state = 'dizzy'; e.st = 1.3; this.shake = 3; SFX.boom(); this.floatText(e.x, e.y - 24, 'Étourdi', '#ffe27a'); }
      else if (e.st <= 0) { e.state = 'recover'; e.st = 0.7; e.cd = 1.2; }
    }
  }
  parried(e) { if (e.boss) return; e.state = 'dizzy'; e.st = 1.4; e.tele = false; e.invuln = 0; e.cd = 1.2; }
  explode(e) {
    const def = e.def; this.ringFx(e.x, e.y, def.blast, '#ffb050'); this.fx('selfdestruct', e.x, e.y, { scale: def.blast / 40, z: 8, add: true, dur: 0.6, glow: '#ffb050' }); SFX.boom(); this.shake = 5; this.burst(e.x, e.y - 6, '#ffb050', 18);
    for (const m of this.actors()) if (!m.exh && hyp(m.x - e.x, m.y - e.y) < def.blast) this.hurtMember(m, e.dmg, e, { owner: e, heavy: true, parry: false });
    e.dead = true; e.deadT = 2; e.hp = 0; this.queueRespawn(e); if (this.lock === e) this.lock = null;
  }

  // ---------- boss ----------
  startBoss(short) {
    const a = this.world.arena, dir = this.world.fog.dir;
    this.bossActive = true; if (short) this.closeFog();
    const b = this.makeEnemy('boss', (a.cx + dir.x * 4) * TS, (a.cy + dir.y * 4) * TS);
    b.state = 'intro'; b.st = 99; b.invuln = 99; b.cd = 1.5; b.face = { x: -dir.x, y: -dir.y }; b.dir = dirFromVec(-dir.x, -dir.y);
    this.enemies.push(b); this.boss = b; SFX.boom();
    this.startCine(b, short);
    this.emit('bossStart', b, short);
  }
  bossPhase(b, ph) {
    this.bossCry(b, 6, 1.3); b.phase = ph; b.state = 'phase'; b.st = 2.4; b.invuln = 2.4; b.tele = false; this.projs = this.projs.filter(p => p.team !== 'e'); this.rings = []; this.zones = [];
    this.shake = 8; SFX.boom(); this.burst(b.x, b.y - 10, b.def.color, 30);
    this.fx('plasmaburst', b.x, b.y, { scale: 2.2, z: 24, add: true, dur: 0.9, glow: b.def.color }); this.fx('novablaster', b.x, b.y, { scale: 1.6, z: 8, delay: 0.25, add: true, dur: 0.8 });
    if (ph === 3 && b.def.summon) this.spawnSummons(b);
    this.emit('bossPhase', b, ph);
  }
  spawnSummons(b) {
    const a = this.world.arena; const type = b.def.summon;
    for (let i = 0; i < 3; i++) { const an = i * 2.094 + 0.5; const c = this.makeEnemy(type, (a.cx + Math.cos(an) * 7) * TS, (a.cy + Math.sin(an) * 7) * TS); c.state = 'chase'; c.cd = 1.5 + i * 0.8; this.enemies.push(c); }
  }
  bossAI(b, dt) {
    const def = b.def; const [tg, td] = this.nearestMember(b); if (!tg) return;
    const u = unit(tg.x - b.x, tg.y - b.y); const id = b.sprite;
    switch (b.state) {
      case 'intro': setAnim(b, this.cine && this.cine.t < 5.4 ? 'Idle' : pickAnim(id, ['Appeal', 'Charge', 'Idle']), this.cine && this.cine.t < 5.4); b.st -= dt; if (b.st <= 0) { b.state = 'move'; b.invuln = 0; } break;
      case 'phase': setAnim(b, pickAnim(id, ['Appeal', 'Charge', 'Idle']), false); b.st -= dt; this.shake = Math.max(this.shake, 1.5); if (b.st <= 0) { b.state = 'move'; b.invuln = 0; b.cd = 0.8; b.obsT = 0.9; } break;
      case 'move': {
        b.face = u; b.dir = dirFromVec(u.x, u.y);
        const want = (def.want || 74) - (b.phase - 1) * 7; let mx = 0, my = 0;
        if (td > want + 10) { mx = u.x; my = u.y; } else if (td < want - 25 && td > 30) { mx = -u.x; my = -u.y; } else { mx = -u.y * 0.4; my = u.x * 0.4; }
        const sp = def.speed * (b.phase === 3 ? 1.25 : 1); move(this, b, mx * sp * dt, my * sp * dt, 6, 4);
        setAnim(b, b.phase >= 2 ? pickAnim(id, ['Hover', 'Walk']) : 'Walk');
        if (b.cd <= 0) this.bossChoose(b, td);
        break;
      }
      case 'windup': {
        b.st -= dt; const ty = b.atkType;
        if (ty === 'dash' || ty === 'beam') { if (b.st > 0.3) b.lockDir = u; b.face = b.lockDir || u; } else if (ty !== 'pulse' && ty !== 'nova') b.face = u;
        b.dir = dirFromVec(b.face.x, b.face.y); setAnim(b, ty === 'pulse' || ty === 'nova' ? pickAnim(id, ['SpAttack', 'Charge']) : 'Charge'); b.tele = true;
        if (b.st <= 0) { b.tele = false; this.bossStrike(b, u, tg); }
        break;
      }
      case 'dash': {
        b.st -= dt; const v = b.lockDir; const px = b.x, py = b.y; move(this, b, v.x * 270 * dt, v.y * 270 * dt, 6, 4); this.hitObs(b.x + v.x * 14, b.y + v.y * 14, 6, 70, 'boss'); setAnim(b, 'Walk'); b.at += dt * 2;
        this.parts.push({ x: b.x, y: b.y, z: 6, vx: 0, vy: 0, vz: 5, life: 0.3, max: 0.3, c: def.color, size: 3 });
        for (const m of this.actors()) if (!m.exh && !b.rollHit.has(m) && hyp(m.x - b.x, m.y - b.y) < b.r + 9) { b.rollHit.add(m); const r = this.hurtMember(m, b.dmg * 1.8, b, { owner: b, heavy: true }); if (r === 'parry') { b.st = 0; } }
        if (b.st <= 0 || hyp(b.x - px, b.y - py) < 0.4 * 270 * dt * 0.5) { b.state = 'recover'; b.st = 0.8; b.cd = b.phase === 1 ? 1.4 : 0.9; this.shake = 3; }
        break;
      }
      case 'recover': b.st -= dt; setAnim(b, 'Idle');
        if (b.st <= 0) {
          b.state = 'move';
          if (def.blink && Math.random() < 0.7) this.blink(b, tg);
          if (b.queue > 0) { b.queue--; b.cd = 0; this.bossChoose(b, td, 'ball'); }
        }
        break;
    }
    if (b.phase >= 2 && b.state === 'move' && b.obsT !== undefined) { b.obsT -= dt; if (b.obsT <= 0) { this.spawnObstacles(b); b.obsT = b.phase === 3 ? 6.5 : 9; } }
    if (b.phase === 3 && def.summon && b.state === 'move' && !this.enemies.some(e => e.clone && !e.dead) && b.cd < 0) this.spawnSummons(b);
    for (const e of this.enemies) if (e.clone && !e.dead) { e.face = unit(tg.x - e.x, tg.y - e.y); e.dir = dirFromVec(e.face.x, e.face.y); }
  }
  blink(b, tg) {
    const a = this.world.arena;
    for (let t = 0; t < 12; t++) {
      const an = rand(0, 6.28), dist = rand(50, 95), x = tg.x + Math.cos(an) * dist, y = tg.y + Math.sin(an) * dist;
      if (hyp(x - a.cx * TS, y - a.cy * TS) < (a.r - 1.5) * TS && M.boxFree(this.world, x, y, 6, 4)) { for (let i = 0; i < 12; i++) this.spark(b.x, b.y - 8, b.def.color, 1.5); b.x = x; b.y = y; for (let i = 0; i < 12; i++) this.spark(b.x, b.y - 8, b.def.color, 1.5); SFX.dodge(); return; }
    }
  }
  bossChoose(b, td, force) {
    const list = b.def.moves[b.phase - 1]; let type = force;
    if (!type) {
      if (td < 42 && list.some(l => l[0] === 'swing') && Math.random() < 0.7) type = 'swing';
      else {
        const pool = list.filter(l => l[0] !== b.lastAtk || list.length < 2); let tot = pool.reduce((s, l) => s + l[1], 0), r = Math.random() * tot;
        type = pool[0][0]; for (const l of pool) { r -= l[1]; if (r <= 0) { type = l[0]; break; } }
      }
    }
    b.lastAtk = type; b.atkType = type; b.state = 'windup'; SFX.telegraph(); b.lockDir = null;
    b.st = { ball: 0.6, volley: 0.7, nova: 0.85, swing: 0.5, pulse: 0.95, dash: 0.85, rain: 0.7, beam: 1.0, summon: 1.0 }[type] || 0.6;
    if (type === 'ball' && b.phase >= 2 && !force) b.queue = 1;
  }
  bossStrike(b, u, tg) {
    const T = b.atkType, d = b.dmg, col = b.def.color, id = b.sprite;
    const rec = (st, cd) => { b.state = 'recover'; b.st = st; b.cd = cd * (b.phase === 3 ? 0.75 : b.phase === 2 ? 0.9 : 1); };
    if (T === 'ball') {
      this.fireProj({ x: b.x, y: b.y, ang: Math.atan2(tg.y - b.y, tg.x - b.x), speed: 140, dmg: d * 1.6, r: 6, life: 3.5, team: 'e', color: col, owner: b, big: true }); SFX.shoot();
      setAnim(b, pickAnim(id, ['Shoot', 'Attack']), false); rec(0.5, 1.5);
    } else if (T === 'volley') {
      const n = b.phase >= 2 ? 5 : 3, ang = Math.atan2(tg.y - b.y, tg.x - b.x);
      for (let i = 0; i < n; i++) this.fireProj({ x: b.x, y: b.y, ang: ang + (i - (n - 1) / 2) * 0.22, speed: 165, dmg: d * 0.9, r: 3.5, life: 3, team: 'e', color: col, owner: b });
      SFX.shoot(); setAnim(b, pickAnim(id, ['Shoot', 'Attack']), false); rec(0.6, 1.4);
    } else if (T === 'nova') {
      const n = b.phase === 3 ? 18 : 14, off = rand(0, 6.28);
      for (let i = 0; i < n; i++) this.fireProj({ x: b.x, y: b.y, ang: off + i * 6.283 / n, speed: 105, dmg: d * 0.8, r: 3.5, life: 3.2, team: 'e', color: col, owner: b });
      SFX.boom(); this.shake = 3; setAnim(b, pickAnim(id, ['SpAttack', 'Shoot']), false); rec(0.8, 1.6);
    } else if (T === 'swing') {
      setAnim(b, pickAnim(id, ['Swing', 'Attack']), false); SFX.swing();
      for (const m of this.actors()) {
        if (m.exh) continue; const dx = m.x - b.x, dy = m.y - b.y, dist = hyp(dx, dy);
        if (dist < 46 && (dx * b.face.x + dy * b.face.y) / (dist || 1) > 0.0) { const r = this.hurtMember(m, d * 2, b, { owner: b, heavy: true }); if (r === 'parry') { rec(1.0, 0.6); return; } }
      }
      this.ringFx(b.x + b.face.x * 20, b.y + b.face.y * 20, 30, col); rec(0.6, 1.2);
    } else if (T === 'pulse') {
      setAnim(b, pickAnim(id, ['SpAttack', 'Shoot']), false); SFX.boom(); this.shake = 4;
      for (let i = 0; i < 3; i++) this.rings.push({ x: b.x, y: b.y, r: 4 - i * 40, speed: 95, max: 250, hit: new Set(), dmg: d * 1.5, color: col, owner: b });
      rec(0.9, 1.4);
    } else if (T === 'dash') {
      b.state = 'dash'; b.st = 0.5; b.rollHit = new Set(); SFX.swing();
    } else if (T === 'rain') {
      const n = 5 + b.phase * 2; SFX.boom();
      for (let i = 0; i < n; i++) { const p = i === 0 ? { x: tg.x, y: tg.y } : { x: tg.x + rand(-85, 85), y: tg.y + rand(-65, 65) }; this.zones.push({ x: p.x, y: p.y, r: 20, t: 0, delay: 0.85 + i * 0.13, dmg: d * 1.2, color: b.def.rainColor || col, owner: b }); }
      setAnim(b, pickAnim(id, ['SpAttack', 'Shoot']), false); rec(0.6, 1.5);
    } else if (T === 'beam') {
      const v = b.lockDir || u, ang = Math.atan2(v.y, v.x), len = this.rayObs(b.x, b.y, v, 260);
      this.beams.push({ x: b.x, y: b.y - 6, ang, len, t: 0, max: 0.35, color: col, w: 9 }); SFX.boom(); this.shake = 5; if (len < 260) this.hitObs(b.x + v.x * len, b.y + v.y * len, 6, 40, 'boss');
      for (const m of this.actors()) { if (m.exh) continue; const rx = m.x - b.x, ry = m.y - b.y, al = rx * v.x + ry * v.y, pd = Math.abs(rx * v.y - ry * v.x); if (al > 0 && al < len && pd < 11) { const r = this.hurtMember(m, d * 2, b, { owner: b, heavy: true, parry: false }); if (r) { /* touché */ } } }
      setAnim(b, pickAnim(id, ['Shoot', 'SpAttack']), false); rec(0.9, 1.6);
    } else if (T === 'summon') {
      if (b.def.summon && this.enemies.filter(e => e.clone && !e.dead).length < 3) this.spawnSummons(b);
      setAnim(b, pickAnim(id, ['Appeal', 'SpAttack']), false); rec(1.0, 1.4);
    }
  }
  // cri de fureur : son propre au boss + secousse de caméra tenue `dur` secondes
  bossCry(b, amp = 7, dur = 1.5) { SFX.cry(b.sprite); this.furyT = Math.max(this.furyT || 0, dur); this.furyAmp = amp; this.hitstop = Math.max(this.hitstop || 0, 0.06); }
  bossDefeated(b) {
    const pr = this.prog[this.mapIdx];
    this.bossActive = false; pr.bossDead = true; this.clearObstacles(); this.unlocked = Math.min(M.MAPS.length - 1, Math.max(this.unlocked, this.mapIdx + 1));
    this.enemies.forEach(e => { if (e.clone) { e.dead = true; e.deadT = 0.2; } });
    this.projs = this.projs.filter(p => p.team !== 'e'); this.rings = []; this.zones = []; setAnim(b, hasAnim(b.sprite, 'Faint') ? 'Faint' : 'Hurt', false); this.hitstop = 0.25; this.shake = 9;
    this.openFog(); this.buildItems(); SFX.victory(); this.emit('jingle', 'JINGLE_VICTORY'); this.save();
    { const nx = M.MAPS[this.mapIdx + 1]; if (nx && nx.secret) setTimeout(() => this.emit('toast', 'Un lieu secret est apparu sur la carte…'), 4500); }
    this.emit('banner', b.def.name + ' VAINCU', 'victory'); setTimeout(() => this.emit('bossLine', b, 'death'), 1400);
  }

  // ---------- projectiles, anneaux, zones, effets ----------
  updateProjs(dt) {
    for (const p of this.projs) {
      p.age += dt; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.life <= 0 || M.solidAt(this.world, p.x, p.y)) { if (p.life > 0 && this.obs.length) this.hitObs(p.x, p.y, 4, p.dmg * (p.team === 'p' ? 0.8 : 0.6), p.team === 'p' ? (p.elem || 'normal') : 'enemy'); p.dead = true; this.burst(p.x, p.y, p.color, 3); if (p.explode && p.life > 0) this.projExplode(p); continue; }
      if (Math.random() < 0.6) this.parts.push({ x: p.x, y: p.y, z: 8, vx: 0, vy: 0, vz: 0, life: 0.25, max: 0.25, c: p.color, size: p.big ? 3 : 2 });
      if (p.team === 'p') {
        if (this.obs.length) this.quenchAt(p.x, p.y, p.elem);
        for (const e of this.enemies) {
          if (e.dead || p.dead) continue;
          if (hyp(e.x - p.x, e.y - 4 - p.y) < e.r + p.r + 2) {
            if (p.explode) { this.projExplode(p); p.dead = true; break; }
            if (this.damageEnemy(e, p.dmg, p.owner, { heavy: p.heavy, stagger: 0.3, knock: 20, status: p.status, sig: p.sig, elem: p.elem, trig: p.trig }) && p.leech) { const o = p.owner; if (o && !o.exh) { o.hp = Math.min(o.maxhp, o.hp + p.dmg * 0.6); this.healFx(o); } }
            p.dead = true; if (p.owner === this.chief()) this.hitstop = 0.03; break;
          }
        }
      } else {
        for (const m of this.actors()) {
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
    this.fxBoom(p); this.ringFx(p.x, p.y, p.explode, p.color); SFX.boom(); this.burst(p.x, p.y, p.color, 14);
    for (const e of this.enemies) if (!e.dead && hyp(e.x - p.x, e.y - p.y) < p.explode + e.r) this.damageEnemy(e, p.dmg, p.owner, { heavy: true, stagger: 0.8, knock: 80, status: p.status, sig: p.sig, elem: p.elem, trig: p.trig });
    this.hitObs(p.x, p.y, p.explode, p.dmg * 0.8, p.elem || 'normal');
  }
  updateRings(dt) {
    for (const r of this.rings) {
      r.r += r.speed * dt;
      if (r.r > 0) for (const m of this.actors()) if (!m.exh && !r.hit.has(m) && Math.abs(hyp(m.x - r.x, m.y - r.y) - r.r) < 6) { r.hit.add(m); this.hurtMember(m, r.dmg, r, { parry: false, heavy: true, owner: r.owner }); }
    }
    this.rings = this.rings.filter(r => r.r < r.max);
    for (const b of this.beams) b.t += dt; this.beams = this.beams.filter(b => b.t < b.max);
  }
  updateZones(dt) {
    for (const z of this.zones) {
      z.t += dt;
      if (!z.done && z.t >= z.delay) {
        z.done = true; if (z.pyl && !z.pyl.dead) this.damageObs(z.pyl, 22, 'electric'); this.ringFx(z.x, z.y, z.r + 6, z.color); this.burst(z.x, z.y - 4, z.color, 8); SFX.boom();
        for (const m of this.actors()) if (!m.exh && hyp(m.x - z.x, m.y - z.y) < z.r + 6) this.hurtMember(m, z.dmg, z, { parry: false, heavy: true, owner: z.owner });
      }
    }
    this.zones = this.zones.filter(z => z.t < z.delay + 0.15);
  }
  spark(x, y, c, n = 1) { for (let i = 0; i < n; i++) this.parts.push({ x, y, z: 4, vx: rand(-30, 30), vy: rand(-20, 20), vz: rand(10, 40), life: 0.35, max: 0.35, c, size: 2 }); }
  burst(x, y, c, n) { for (let i = 0; i < n; i++) { const a = rand(0, 6.28), s = rand(20, 80); this.parts.push({ x, y, z: 6, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: rand(10, 60), life: rand(0.25, 0.5), max: 0.5, c, size: 2, g: 160 }); } }
  healFx(m) { this.fx('recover', m.x, m.y, { scale: 0.8, z: 12, add: true, dur: 0.6 }); for (let i = 0; i < 8; i++) this.parts.push({ x: m.x + rand(-8, 8), y: m.y + rand(-4, 4), z: 0, vx: 0, vy: 0, vz: rand(25, 50), life: 0.8, max: 0.8, c: '#8dffb0', size: 2 }); this.floatText(m.x, m.y - 24, '+', '#8dffb0'); }
  ringFx(x, y, r, c) { this.fxRings.push({ x, y, r, c, t: 0 }); }
  floatText(x, y, s, c) { this.texts.push({ x: x + rand(-4, 4), y, s, c, t: 0 }); }
  updateFx(dt) {
    this.updateFxs(dt);
    for (const p of this.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= (p.g || 0) * dt; }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const t of this.texts) { t.t += dt; t.y -= 14 * dt; }
    if (this.pops) { for (const p of this.pops) p.t += dt; this.pops = this.pops.filter(p => p.t < 1.8); }
    this.texts = this.texts.filter(t => t.t < 0.9);
    for (const r of this.fxRings) r.t += dt; this.fxRings = this.fxRings.filter(r => r.t < 0.45);
  }

  // ---------- monde : zones, feux, portes, brume, coffres ----------
  updateWorld(dt) {
    const c = this.chief(); this.prompt = null; const pr = this.prog[this.mapIdx];
    const z = M.zoneAt(this.world, c.x, c.y);
    if (z && z.area && z.area !== this.lastArea) { this.lastArea = z.area; this.emit('area', z); }
    const s = this.souvenir;
    if (s && s.map === this.mapIdx && hyp(s.x - c.x, s.y - c.y) < 14) { this.essence += s.amount; this.floatText(c.x, c.y - 30, '+' + s.amount, '#ffd37a'); this.souvenir = null; SFX.pick(); this.save(); this.emit('toast', 'Souvenir récupéré'); }
    // feux
    for (const b of this.world.bonfires) if (hyp((b.tx + 0.5) * TS - c.x, (b.ty + 0.5) * TS - c.y) < 42) {
      this.prompt = this.lit.has(b.id) ? { text: 'Se recueillir au feu', act: () => { this.last = { map: this.mapIdx, id: b.id }; this.emit('menu', b); } } : { text: 'Allumer le feu', act: () => this.lightBonfire(b) };
    }
    // coffres
    for (const ch of this.world.chests) if (!pr.chests.includes(ch.id) && hyp((ch.tx + 0.5) * TS - c.x, (ch.ty + 0.5) * TS - c.y) < 34) this.prompt = { text: 'Ouvrir le coffre', act: () => this.openChest(ch) };
    // objets du sanctuaire
    for (const it of this.items) if (hyp(it.x - c.x, it.y - c.y) < 30) {
      if (it.kind === 'reward') this.prompt = { text: 'Ouvrir le coffre du boss', act: () => this.takeReward() };
      else this.prompt = { text: (this.world.def.final || this.world.def.secret) ? (M.MAPS[this.mapIdx + 1] && M.MAPS[this.mapIdx + 1].secret ? 'Franchir le portail vers l’Île Mystère' : 'Franchir le portail final') : 'Franchir le portail vers la carte suivante', act: () => this.usePortal() };
    }
    // porte-raccourci
    const dr = this.world.door;
    if (dr && !pr.doorOpen) for (const [tx, ty] of dr.tiles) {
      const cx = (tx + 0.5) * TS, cy = (ty + 0.5) * TS;
      if (Math.abs(c.x - cx) < 40 && Math.abs(c.y - cy) < 40) {
        const side = (cx - c.x) * dr.dir.x + (cy - c.y) * dr.dir.y;
        this.prompt = side > 0 ? { text: 'Ouvrir la porte', act: () => this.openDoor() } : { text: 'Verrouillée de l’autre côté', act: null };
      }
    }
    // brume
    if (!pr.bossDead && !this.bossActive) {
      const fg = this.world.fog;
      for (const [tx, ty] of fg.tiles) {
        const cx = (tx + 0.5) * TS, cy = (ty + 0.5) * TS, along = (cx - c.x) * fg.dir.x + (cy - c.y) * fg.dir.y, perp = Math.abs((cx - c.x) * fg.dir.y - (cy - c.y) * fg.dir.x);
        if (along > 0 && along < 56 && perp < 44) this.prompt = { text: 'Franchir la brume', act: () => this.enterFog() };
      }
    }
    this.updateFala(dt);
    if (this.prompt && this.prompt.act && Input.pressed('interact') && !c.atk && !c.dodge && c.hurtT <= 0) this.prompt.act();
  }
  lightBonfire(b) {
    this.lit.add(b.id); this.last = { map: this.mapIdx, id: b.id }; this.rest(true); SFX.bonfire(); this.hubAt = { x: (b.tx + 0.5) * TS, y: (b.ty + 0.5) * TS }; this.emit('jingle', 'JINGLE_CAMPFIRE'); this.emit('banner', 'FEU ALLUMÉ', 'fire');
  }
  rest(quiet) {
    for (const m of this.team) { m.exh = false; m.hp = m.maxhp; m.hurtT = 0; m.anim = 'Idle'; m.fx = null; m.regen = null; }
    this.berries = this.maxBerries; this.ethers = this.maxEthers; this.stam = this.maxStam; this.buffT = 0; if (this.linkT <= 0) this.link = Math.max(this.link, 50); this.spawnAll(); this.save();
    if (!quiet) SFX.bonfire();
  }
  openDoor() { this.prog[this.mapIdx].doorOpen = true; for (const [x, y] of this.world.door.tiles) this.world.grid[y * M.MW + x] = M.T.FLOOR; SFX.door(); this.save(); this.emit('toast', 'Raccourci ouvert'); }
  enterFog() {
    const a = this.world.arena, dir = this.world.fog.dir; SFX.door();
    this.lock = null; this.buf = null;
    const short = !!this.prog[this.mapIdx].introSeen;   // revenu après une défaite : version courte
    if (short) { this.startBoss(true); this.emit('fade'); } else this.startBoss(false);
  }
  give(item) {
    if (item === 'candy' || VIT_KEYS.includes(item)) { this.bag[item] = (this.bag[item] || 0) + 1; return D.ITEM_NAMES[item]; }
    if (item === 'berrypack') { this.berries += 2; return 'Baies ×2'; }
    if (item === 'etherpack') { this.ethers += 2; return 'Huile ×2'; }
    if (item === 'maxether') { this.maxEthers++; this.ethers++; return 'Huile Max (fioles max +1)'; }
    if (item === 'revive') { this.bag.revive = (this.bag.revive || 0) + 1; return 'Rappel'; }
    if (item === 'maxberry') { this.maxBerries++; this.berries++; return 'Baie Oran Plus (baies max +1)'; }
    if (D.TMS[item]) {
      if (this.tms.includes(item)) { this.bag.candy = (this.bag.candy || 0) + 1; return D.ITEM_NAMES[item] + ' (déjà connue → Super Bonbon)'; }
      this.tms.push(item); return D.ITEM_NAMES[item];
    }
    return item;
  }
  // bulle d'objet : l'icône sort de la Poké Ball et monte en fondu (dessinée dans render.js)
  popItem(x, y, key, delay = 0) { (this.pops ||= []).push({ x, y, key, t: -delay }); }
  openChest(ch) {
    const pr = this.prog[this.mapIdx]; pr.chests.push(ch.id); const n = this.give(ch.item); SFX.pick(); this.save();
    const cx = (ch.tx + 0.5) * TS, cy = (ch.ty + 0.55) * TS; this.popItem(cx, cy, ch.item); this.ringFx(cx, cy, 16, '#fff2a0');
    this.emit('banner', n.toUpperCase().split(' (')[0], 'item', ch.item); this.emit('toast', 'Coffre : ' + n, ch.item);
  }
  takeReward() {
    const pr = this.prog[this.mapIdx]; if (pr.rewardTaken) return; pr.rewardTaken = true;
    const got = this.world.def.reward.map(i => this.give(i)); const rw = this.items.find(i => i.kind === 'reward'); this.items = this.items.filter(i => i.kind !== 'reward'); SFX.victory(); this.save();
    if (rw) this.world.def.reward.forEach((k, i, a) => this.popItem(rw.x + (i - (a.length - 1) / 2) * 20, rw.y - 6, k, i * 0.25));
    this.emit('banner', 'RÉCOMPENSE', 'item', this.world.def.reward[0]); this.emit('toast', got.join(' · '), this.world.def.reward[0]);
  }
  usePortal() {
    const nx = M.MAPS[this.mapIdx + 1];
    if (nx && nx.secret && this.unlocked > this.mapIdx) { this.enterMap(this.mapIdx + 1, 'start'); return; }   // le portail du Laboratoire mène à l'Île Mystère (Mew) une fois Mewtwo vaincu
    if (this.world.def.final || this.world.def.secret || this.mapIdx >= M.MAPS.length - 1) { this.emit('end', !!this.world.def.secret); return; }
    this.enterMap(this.mapIdx + 1, 'start');
  }

  // ---------- objets, niveaux, CT (menus) ----------
  gainLevel(m) {
    const st0 = m.stage; m.lvl++; this.applyLevels(false);
    if (m.stage > st0) { m.hp = m.maxhp; this.emit('banner', D.NAMES_FR[m.line[st0]].toUpperCase() + ' ÉVOLUE !', 'item'); this.emit('toast', D.NAMES_FR[m.line[st0]] + ' évolue en ' + D.NAMES_FR[m.id]); }
  }
  levelUp(i) {
    const m = this.team[i], cost = D.levelCost(m.lvl);
    if (m.lvl >= D.MAX_LEVEL || this.essence < cost) return false;
    this.essence -= cost; this.gainLevel(m); this.save(); SFX.pick(); return true;
  }
  useCandy(i) { const m = this.team[i]; if (!(this.bag.candy > 0) || m.lvl >= D.MAX_LEVEL) return false; this.bag.candy--; this.gainLevel(m); this.save(); SFX.pick(); return true; }
  useVitamin(i, k) { const m = this.team[i]; if (!(this.bag[k] > 0) || m.vit[k] >= 5) return false; this.bag[k]--; m.vit[k]++; this.applyLevels(false); this.save(); SFX.pick(); return true; }
  teach(i, tm) {
    const m = this.team[i]; if (!this.tms.includes(tm)) return false;
    const c = D.tmCompat(tm, m.type, m.id, m.stage); if (!c.ok) { this.emit('toast', m.def.name + ' ne peut pas apprendre ' + D.TMS[tm].name + ' : ' + c.why); return false; }
     m.tm = tm; m.def.ability = D.TMS[tm]; m.cd = 0; this.save(); SFX.pick(); return true;
  }
  useRevive(i) { const m = this.team[i]; if (!m || !m.exh || !(this.bag.revive > 0)) return false; this.bag.revive--; m.exh = false; m.hp = Math.round(m.maxhp * 0.5); m.deadT = 0; m.anim = 'Idle'; m.fx = null; this.save(); SFX.heal(); return true; }

  // ---------- développement ----------
  devKey(k) {
    if (!this.dev) return;
    if (k === 'F1') { this.god = !this.god; this.emit('toast', 'Invincible : ' + (this.god ? 'oui' : 'non')); }
    if (k === 'F2') { const f = this.world.fog, t = f.tiles[1]; this.placeTeam((t[0] + 0.5 - f.dir.x * 1.6) * TS, (t[1] + 0.5 - f.dir.y * 1.6) * TS); this.snapCam(); }
    if (k === 'F3') { this.essence += 1000; }
    if (k === 'F4') { for (const e of this.enemies) if (!e.dead && !e.boss && hyp(e.x - this.chief().x, e.y - this.chief().y) < 260) this.damageEnemy(e, 99999, this.chief(), { heavy: true }); }
    if (k === 'F5' && this.boss && !this.boss.dead) { this.boss.hp = Math.min(this.boss.hp, this.boss.maxhp * 0.27); }
    if (k === 'F7') { this.link = 100; this.emit('toast', 'Lien plein'); }
    if (k === 'F8') this.fxCycle(false);
    if (k === 'F9') this.fxCycle(true);
    if (k === 'F6') { this.ethers = this.maxEthers = 5; this.bag.revive = (this.bag.revive || 0) + 2; this.unlocked = M.MAPS.length - 1; for (const t of Object.keys(D.TMS)) if (!this.tms.includes(t)) this.tms.push(t); this.bag.candy = (this.bag.candy || 0) + 20; for (const v of VIT_KEYS) this.bag[v] = (this.bag[v] || 0) + 3; this.emit('toast', 'Tout débloqué'); }
  }
}

installFx(Game, { D });
installElements(Game, { setAnim, rand, hyp, unit, SFX, M, D, TS });
installTutorial(Game, { M, D, TS, SFX, hyp });
installBossCine(Game, { Input, TS, vw: () => W, H, clamp, hyp, setAnim, SFX, M });
installFala(Game, { M, TS, SFX, hyp });
installReserve(Game, { D, stageOf });
installExtras(Game, { Input, move, rand, hyp, unit, setAnim, timing, pickAnim, SFX, M, D, TS, dirFromVec });

// noms des feux d'une autre carte (menu de voyage) : déterminés par la génération
const bnCache = {};
function bonfireNames(i) { if (!bnCache[i]) bnCache[i] = Object.fromEntries(M.buildWorld(i).bonfires.map(b => [b.id, b.name])); return bnCache[i]; }
