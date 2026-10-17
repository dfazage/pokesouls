// Cinématique d'introduction des boss (~10 s) : marche dans la brume, caméra qui se rapproche, éveil signature du boss,
// carton-titre, puis combat. Après une première fois, la version courte (dernières 4 s) est jouée. Toujours passable.
// installBossCine() ajoute les méthodes à la classe Game ; hud.js lit game.cine pour les barres et le carton-titre.

export const CINE_LEN = 10;       // durée totale
export const CINE_UNLOCK = 9.3;   // les commandes sont rendues
export const CINE_SHORT = 6;      // la version courte démarre ici (revenu après une défaite)

// Signature d'éveil par boss : levit = lévitation psychique, dive = piqué enflammé, descend = descente givrée.
const SIG = { mewtwo: 'levit', mew: 'levit', moltres: 'dive', zapdos: 'dive', dragonite: 'dive', articuno: 'descend', raikou: 'dive', entei: 'descend', suicune: 'dive', lugia: 'descend', celebi: 'levit' };
const IMPACT = { levit: 4.6, dive: 4.6, descend: 5.8 };

// image clé de la caméra : [t, tangage °, distance, champ °, hauteur visée (tuiles), part de focus sur le boss]
const KF = [
  [0.0, 40, 13.5, 36, 0.5, 0],
  [1.0, 34, 16, 38, 0.5, 0],
  [2.8, 30, 15, 36, 0.8, 0.45],
  [4.0, 17, 8.8, 34, 2.4, 1],
  [6.5, 13, 7.6, 34, 2.8, 1],
  [8.2, 22, 10, 35, 1.6, 0.6],
  [9.8, 40, 13.5, 36, 0.5, 0],
];
// Caméra de duel (HD-2D) : réglage propre à chaque boss, atteint à la fin de l'intro puis tenu pendant tout le combat.
// pitch = tangage (° ; l'exploration est à 40°), dist = distance, fov = champ, look = hauteur visée (tuiles),
// focus = part du trajet joueur → boss sur laquelle la caméra se décale (0 = suit le joueur seul).
// Un tangage plus bas donne de la grandeur au boss ; vue presque « à la troisième personne » : en dessous de ~19° les zones au sol (télégraphes) s'aplatissent trop pour se lire.
export const BOSS_CAM_DEFAULT = { pitch: 22, dist: 11, fov: 36, look: 1.4, focus: 0.2 };
export const BOSS_CAM = {
  articuno: { pitch: 23, dist: 11.5 },
  zapdos:   { pitch: 23, dist: 11.5 },
  moltres:  { pitch: 23, dist: 12 },
  dragonite: { pitch: 21, dist: 13, look: 1.7, focus: 0.25 },
  mewtwo:   { pitch: 22, dist: 11.5, look: 1.5 },
  mew:      { pitch: 24, dist: 10.5, focus: 0.18 },
  raikou:   { pitch: 23, dist: 11, look: 1.3 },
  entei:    { pitch: 21, dist: 11.5, focus: 0.24 },
  suicune:  { pitch: 23, dist: 11, look: 1.3 },
  lugia:    { pitch: 20, dist: 14, look: 2.0, focus: 0.22 },
  celebi:   { pitch: 24, dist: 10.5, focus: 0.18 },
};
export const BOSS_CAM_MIN_PITCH = Math.min(...Object.values(BOSS_CAM).map(c => c.pitch), BOSS_CAM_DEFAULT.pitch);
export const bossCamOf = b => ({ ...BOSS_CAM_DEFAULT, ...(BOSS_CAM[b && b.def && b.def.sprite] || {}) });
const sm = x => x * x * (3 - 2 * x);
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
// bc : réglage de duel du boss ; l'intro se termine exactement dessus, sans saut quand les commandes sont rendues
export function cineKey(t, bc) {
  const K = bc ? [...KF.slice(0, -1), [KF[KF.length - 1][0], bc.pitch, bc.dist, bc.fov, bc.look, bc.focus]] : KF;
  if (t <= K[0][0]) return K[0].slice(1);
  for (let i = 1; i < K.length; i++) {
    if (t <= K[i][0]) { const a = K[i - 1], b = K[i], k = sm((t - a[0]) / (b[0] - a[0])); return b.map((v, j) => j ? a[j] + (v - a[j]) * k : 0).slice(1); }
  }
  return K[K.length - 1].slice(1);
}

export function installBossCine(Game, d) {
  const { Input, TS, vw, H, clamp, hyp, setAnim, SFX, M } = d;
  const P = Game.prototype;

  // t = instant de départ (0 = version complète, CINE_SHORT = version courte)
  P.startCine = function (b, short) {
    const a = this.world.arena, fg = this.world.fog, dir = fg.dir, c = this.chief();
    const mid = fg.tiles[Math.floor(fg.tiles.length / 2)];
    const gx = (mid[0] + 0.5) * TS, gy = (mid[1] + 0.5) * TS;
    const ex = (a.cx - dir.x * (a.r - 2)) * TS, ey = (a.cy - dir.y * (a.r - 2)) * TS;   // point d'arrivée dans l'arène
    const pts = short ? [{ x: ex, y: ey }, { x: ex, y: ey }] : [{ x: c.x, y: c.y }, { x: gx - dir.x * 1.2 * TS, y: gy - dir.y * 1.2 * TS }, { x: ex, y: ey }];
    let len = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = hyp(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(l); len += l; }
    const kind = SIG[b.sprite] || 'levit';
    this.cine = { t: short ? CINE_SHORT : 0, short, pts, seg, len, kind, impact: IMPACT[kind], b, gx, gy, dir, lock: true, flash: 0, dim: 0, done: false, fogClosed: !!short, held: 0, fired: new Set() };
    if (short) { this.team.forEach(m => { m.x = ex; m.y = ey; m.atk = null; m.dodge = null; }); this.closeFog(); }
    this.cineApply(b);
    this.cineCam(true);
  };
  P.skipCine = function () {
    const q = this.cine; if (!q || q.done || q.t < 0.4 || q.t >= CINE_UNLOCK - 0.1) return;
    // on place tout le monde dans l'état de fin d'éveil
    const e = q.pts[q.pts.length - 1]; this.team.forEach(m => { m.x = e.x; m.y = e.y; m.atk = null; m.dodge = null; });
    if (!q.fogClosed) { this.closeFog(); q.fogClosed = true; }
    q.t = CINE_UNLOCK - 0.1; q.flash = 0; this.shake = 0; this.cineFire(q, q.impact); q.fired.add('cry');
  };

  // état du boss aux instants donnés (fonctions pures de t, pour que la version courte retrouve le même état)
  P.cineApply = function (b) {
    const q = this.cine, t = q.t, kind = q.kind, I = q.impact; let lift = 0, reveal = 1, alpha = 1;
    if (t < CINE_UNLOCK + 0.5) {
      reveal = cl((t - I) / 1.0);
      if (kind === 'levit') { lift = t < I ? 26 * sm(cl((t - 2.6) / 2.0)) : 26 * (1 - sm(cl((t - I) / 0.8))); }
      else if (kind === 'dive') { const k = cl((t - 3.6) / 1.0); lift = 360 * (1 - k * k); alpha = t < 3.5 ? 0 : cl((t - 3.5) / 0.3); }
      else { const k = cl((t - 4.0) / 1.8); lift = 130 * (1 - sm(k)); alpha = cl((t - 3.6) / 1.0); }
    }
    b.lift = lift; b.reveal = reveal; b.cineAlpha = alpha;
  };
  // effets uniques déclenchés au passage d'un instant
  P.cineFire = function (q, tt) {
    const b = q.b, col = b.def.color;
    if (tt >= q.impact && !q.fired.has('impact')) {
      q.fired.add('impact'); q.flash = 1; this.shake = Math.max(this.shake, q.kind === 'descend' ? 6 : 9); SFX.boom();
      this.burst(b.x, b.y - 8, col, 18);
      if (q.kind === 'dive') this.fx('plasmaburst', b.x, b.y, { scale: 1.0, z: 12, add: true, dur: 0.8, glow: col });
      this.fx('novablaster', b.x, b.y, { scale: 0.9, z: 4, delay: 0.1, add: true, dur: 0.9, glow: col });
    }
  };

  // cri de fureur une fois l'éveil terminé, juste avant le carton-titre
  P.cineCry = function (q, tt) { if (tt >= Math.max(q.impact + 1.0, q.short ? CINE_SHORT + 0.8 : 0) && !q.fired.has('cry')) { q.fired.add('cry'); this.bossCry(q.b, 7.5, 1.6); } };
  P.cineCam = function (snap) {
    const q = this.cine, b = q.b, c = this.chief(), [pitch, dist, fov, look, foc] = cineKey(q.t, bossCamOf(b));
    this.camFx = { pitch, dist, fov, look };
    const fx = c.x + (b.x - c.x) * foc, fy = c.y + (b.y - c.y) * foc - 6 * (1 - foc);
    const W = vw(), tx = clamp(fx - W / 2, 0, M.MW * TS - W), ty = clamp(fy - H / 2, 0, M.MH * TS - H);
    if (snap) { this.cam.x = tx; this.cam.y = ty; } else { this.cam.x += (tx - this.cam.x) * 0.2; this.cam.y += (ty - this.cam.y) * 0.2; }
  };

  // avance la cinématique ; renvoie true tant que le joueur n'a pas la main
  P.updateCine = function (dt) {
    const q = this.cine; if (!q) return false;
    const b = q.b, c = this.chief(), prev = q.t;
    q.t += dt; const t = q.t;
    if (!q.done && (Input.pressed('interact') && t > 0.5 && t < CINE_UNLOCK - 0.1)) this.skipCine();
    if (b.dead) { this.endCine(); return false; }
    const locked = q.lock;
    // marche automatique dans la brume (version complète seulement)
    if (!locked) { /* commandes rendues : updateChief reprend la main */ }
    else if (!q.short && t < 4.4) {
      const k = sm(cl((t - 0.5) / 3.7)), s = k * q.len; let acc = 0, i = 0;
      while (i < q.seg.length - 1 && s > acc + q.seg[i]) { acc += q.seg[i]; i++; }
      const A = q.pts[i], B = q.pts[i + 1], f = q.seg[i] > 0 ? cl((s - acc) / q.seg[i]) : 1;
      const nx = A.x + (B.x - A.x) * f, ny = A.y + (B.y - A.y) * f;
      if (t > 0.5) { c.face = { x: B.x - A.x, y: B.y - A.y }; const l = hyp(c.face.x, c.face.y) || 1; c.face = { x: c.face.x / l, y: c.face.y / l }; }
      this.team.forEach(m => { m.x = nx; m.y = ny; });
      setAnim(c, t > 0.5 && t < 4.3 ? 'Walk' : 'Idle'); c.at += dt * 0.9;
      // brume ouverte pendant le passage, refermée derrière le joueur
      if (t > 0.6 && !q.fogOpen) { q.fogOpen = true; this.openFog(); SFX.door(); }
      const along = (c.x - q.gx) * q.dir.x + (c.y - q.gy) * q.dir.y;
      if (q.fogOpen && !q.fogClosed && along > TS * 1.4) { q.fogClosed = true; this.closeFog(); }
    } else if (!q.short) { if (!q.fogClosed) { q.fogClosed = true; this.closeFog(); } setAnim(c, 'Idle'); c.at += dt; }
    else { setAnim(c, 'Idle'); c.at += dt; }
    if (locked) { for (const m of this.team) this.tickMember(m, dt); this.stamTick(dt, false); }
    // boss
    this.cineApply(b); this.cineFire(q, t); this.cineCry(q, t);
    q.flash = Math.max(0, q.flash - dt * 2.6);
    q.dim = cl((t - 2.4) / 0.8) * (1 - cl((t - 4.2) / 0.8)) * 0.55;
    b.st = 99; b.invuln = 99;
    if (q.kind === 'levit' && t > 2.6 && t < q.impact && Math.random() < dt * 30) this.spark(b.x + (Math.random() - 0.5) * 60, b.y + (Math.random() - 0.5) * 30, b.def.color, 1);
    if (q.kind === 'descend' && t > 4.8 && t < 7 && Math.random() < dt * 20) this.spark(b.x + (Math.random() - 0.5) * 70, b.y + (Math.random() - 0.5) * 30, '#dff6ff', 1);
    this.cineCam(false);
    if (t >= CINE_UNLOCK && q.lock) { q.lock = false; }
    if (t >= CINE_LEN) this.endCine();
    return q.lock;
  };
  P.endCine = function () {
    const q = this.cine; if (!q) return;
    const b = q.b; b.lift = 0; b.reveal = 1; b.cineAlpha = 1;
    if (b.state === 'intro') { b.st = 0; } b.invuln = 0;
    if (!q.fogClosed) this.closeFog();
    this.prog[this.mapIdx].introSeen = true; this.save();
    q.done = true; this.cine = null; this.camFx = null;
    if (window.hd2d) { this.bossCam = bossCamOf(b); this.bossCamK = 1; }   // le duel reprend le réglage de fin d'intro
  };
}
