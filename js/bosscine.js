// Cinématique d'introduction des boss (~10 s) : marche dans la brume, caméra qui se rapproche, éveil signature du boss,
// carton-titre, puis combat. Après une première fois, la version courte (dernières 4 s) est jouée. Toujours passable.
// installBossCine() ajoute les méthodes à la classe Game ; hud.js lit game.cine pour les barres et le carton-titre.

export const CINE_LEN = 10;       // durée totale
export const CINE_UNLOCK = 9.3;   // les commandes sont rendues
export const CINE_SHORT = 6;      // (plus utilisée par le jeu : l intro complète se rejoue à chaque tentative)

// Signature d'éveil propre à chaque boss (chaque entrée est une petite mise en scène) :
// levit = lévitation psychique, dive = piqué enflammé, descend = descente givrée, strike = foudroiement,
// stomp = atterrissage lourd, blink = sauts téléportés, run = course d'éclair, erupt = éruption,
// ripple = glissade sur l'eau, rift = faille temporelle, abyss = silhouette qui jaillit des profondeurs.
const SIG = { mewtwo: 'levit', mew: 'blink', moltres: 'dive', zapdos: 'strike', dragonite: 'stomp', articuno: 'descend', raikou: 'run', entei: 'erupt', suicune: 'ripple', lugia: 'abyss', celebi: 'rift' };
const HUE = { descend: 185, strike: 35, run: 35, levit: 255, blink: 300, ripple: 190, rift: 95, abyss: 190 };   // teinte des effets orange de base
const IMPACT = { levit: 4.6, dive: 4.6, descend: 5.8, strike: 4.2, stomp: 5.0, blink: 5.4, run: 4.4, erupt: 4.8, ripple: 5.0, rift: 5.0, abyss: 6.4 };

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
// Les boss (hors Mew et Celebi) font 2× la taille d'origine : distance de duel augmentée d'autant.
export const BOSS_CAM = {
  articuno: { pitch: 23, dist: 14 },
  zapdos:   { pitch: 23, dist: 14 },
  moltres:  { pitch: 23, dist: 14.5 },
  dragonite: { pitch: 21, dist: 15.5, look: 1.7, focus: 0.25 },
  mewtwo:   { pitch: 22, dist: 14, look: 1.5 },
  mew:      { pitch: 24, dist: 10.5, focus: 0.18 },
  raikou:   { pitch: 23, dist: 13.5, look: 1.3 },
  entei:    { pitch: 21, dist: 14, focus: 0.24 },
  suicune:  { pitch: 23, dist: 13.5, look: 1.3 },
  lugia:    { pitch: 22, dist: 18.5, look: 2.8, focus: 0.2 },
  celebi:   { pitch: 24, dist: 10.5, focus: 0.18 },
};
export const BOSS_CAM_MIN_PITCH = Math.min(...Object.values(BOSS_CAM).map(c => c.pitch), BOSS_CAM_DEFAULT.pitch);
export const bossCamOf = b => ({ ...BOSS_CAM_DEFAULT, ...(BOSS_CAM[b && b.def && b.def.sprite] || {}), big: !!(b && b.def && b.def.scale > 2) });
const sm = x => x * x * (3 - 2 * x);
// Mort d'un boss : il reprend d'abord sa taille normale (÷2 pour les géants), marque une pause, puis se désagrège en cendres qui s'envolent.
export const ASH = { shrink: 1.0, hold: 0.7, dissolve: 2.8 };
export function bossAshState(e) {
  const sc0 = e.def.scale || 1, T = e.deadT, k = sm(Math.max(0, Math.min(1, T / ASH.shrink)));
  return { sc: sc0 > 2 ? sc0 * (1 - 0.5 * k) : sc0, k, d: Math.max(0, Math.min(1, (T - ASH.shrink - ASH.hold) / ASH.dissolve)) };
}
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
// bc : réglage de duel du boss ; l'intro se termine exactement dessus, sans saut quand les commandes sont rendues
export function cineKey(t, bc) {
  const K = bc ? [...KF.slice(0, -1).map((k, i) => bc.big && i >= 3 ? [k[0], k[1], k[2] * 1.45, k[3], k[4], k[5]] : k), [KF[KF.length - 1][0], bc.pitch, bc.dist, bc.fov, bc.look, bc.focus]] : KF;   // boss géant : plans rapprochés reculés
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
    const kind = SIG[b.sprite] || 'levit'; b.home = { x: b.x, y: b.y };
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
    const q = this.cine, t = q.t, kind = q.kind, I = q.impact, h = b.home || { x: b.x, y: b.y }; let lift = 0, reveal = 1, alpha = 1, px = h.x, py = h.y;
    if (t < CINE_UNLOCK + 0.5) {
      reveal = cl((t - I) / 1.0);
      if (kind === 'levit') { lift = t < I ? 26 * sm(cl((t - 2.6) / 2.0)) : 26 * (1 - sm(cl((t - I) / 0.8))); }
      else if (kind === 'dive') { const k = cl((t - 3.6) / 1.0); lift = 360 * (1 - k * k); alpha = t < 3.5 ? 0 : cl((t - 3.5) / 0.3); }
      else if (kind === 'descend') { const k = cl((t - 4.0) / 1.8); lift = 130 * (1 - sm(k)); alpha = cl((t - 3.6) / 1.0); }
      else if (kind === 'strike') { alpha = t < 3.9 ? 0 : 1; reveal = cl((t - 3.9) / 0.5); }                                            // apparaît dans l'éclair
      else if (kind === 'stomp') { const k = cl((t - 3.4) / 1.6); lift = 520 * (1 - k * k * k); alpha = t < 3.3 ? 0 : 1; reveal = cl((t - 3.4) / 1.2); }   // chute lourde, depuis très haut
      else if (kind === 'blink') {
        const hops = [[3.0, 70, -26], [3.7, -80, 18], [4.4, 46, 46], [5.0, -30, -40]], hp = hops.filter(o => t >= o[0]).pop();
        alpha = t < 3.0 ? 0 : t < I ? (Math.floor(t * 14) % 3 === 0 ? 0.35 : 0.9) : 1; reveal = cl((t - 3.0) / 1.8) ;
        if (hp && t < I) { px = h.x + hp[1]; py = h.y + hp[2]; } lift = t < I ? 10 + 6 * Math.sin(t * 8) : 0;
      }
      else if (kind === 'run') { const k = sm(cl((t - 2.8) / 1.6)); px = h.x + q.dir.x * 110 * (1 - k); py = h.y + q.dir.y * 110 * (1 - k); alpha = t < 2.8 ? 0 : 1; reveal = cl((t - 2.8) / 1.0); }
      else if (kind === 'erupt') { const k = cl((t - 4.0) / 0.8); lift = 150 * Math.sin(Math.PI * Math.min(1, k * 1.15)); alpha = t < 4.0 ? 0 : 1; reveal = cl((t - 4.0) / 0.9); }
      else if (kind === 'ripple') { const k = sm(cl((t - 2.6) / 2.4)); px = h.x - q.dir.y * 120 * (1 - k); py = h.y + q.dir.x * 120 * (1 - k); alpha = cl((t - 2.6) / 0.8) * (0.55 + 0.45 * k); reveal = cl((t - 3.4) / 1.6); }
      else if (kind === 'rift') { alpha = cl((t - 3.4) / 1.4) * (Math.floor(t * 18) % 4 === 0 && t < I ? 0.5 : 1); lift = 14 * sm(cl((t - 3.4) / 1.4)) * (1 - sm(cl((t - I) / 1.0))); reveal = cl((t - 3.4) / 1.8); }
      else if (kind === 'abyss') {
        // 0–3.8 s : ombre immense qui rôde sous la surface ; 3.8–6.4 s : elle jaillit, s'élève très haut et retombe dans l'arène
        const sil = cl((t - 1.2) / 1.6) * (1 - cl((t - 5.0) / 0.5));
        if (t < 3.8) { alpha = 0.5 * sil; reveal = 0; lift = 0; px = h.x + Math.sin(t * 1.1) * 46; py = h.y + Math.cos(t * 0.8) * 22; }
        else { const k = cl((t - 3.8) / 2.6); lift = 250 * 4 * k * (1 - k); alpha = cl((t - 3.8) / 0.25); reveal = cl((t - 4.1) / 1.4); px = h.x + Math.sin(3.8 * 1.1) * 46 * (1 - sm(k)); py = h.y + Math.cos(3.8 * 0.8) * 22 * (1 - sm(k)); }
      }
    }
    b.lift = lift; b.reveal = reveal; b.cineAlpha = alpha; b.x = px; b.y = py;
  };
  // effets uniques déclenchés au passage d'un instant
  P.cineFire = function (q, tt) {
    const b = q.b, col = b.def.color;
    if (tt >= q.impact && !q.fired.has('impact')) {
      q.fired.add('impact'); q.flash = 1; this.shake = Math.max(this.shake, q.kind === 'descend' ? 6 : 9); SFX.boom();
      this.burst(b.x, b.y - 8, col, 18);
      if (q.kind === 'dive') this.fx('plasmaburst', b.x, b.y, { scale: 1.0, z: 12, add: true, dur: 0.8, glow: col });
      this.fx('novablaster', b.x, b.y, { scale: 0.9, z: 4, delay: 0.1, add: true, dur: 0.9, glow: col, hue: HUE[q.kind] || 0 });
      const K = q.kind, W = '#8fd0ff';
      if (K === 'stomp') { this.shake = 15; for (let i = 0; i < 3; i++) setTimeout(() => this.ringFx(b.x, b.y, 40 + i * 38, '#e8c890'), i * 160); this.fx('earthpower', b.x, b.y, { scale: 2.2, z: 6, add: true, dur: 0.7 }); }
      if (K === 'erupt') for (let i = 0; i < 6; i++) { const a = i * 1.047, x = b.x + Math.cos(a) * 46, y = b.y + Math.sin(a) * 30; this.fx('plasmaburst', x, y, { scale: 0.9, z: 6, add: true, dur: 0.8, delay: i * 0.06, glow: '#ff7a2a' }); this.burst(x, y, '#ff8a30', 6); }
      if (K === 'ripple') for (let i = 0; i < 3; i++) setTimeout(() => this.ringFx(b.x, b.y, 30 + i * 30, W), i * 140);
      if (K === 'rift') for (let i = 0; i < 3; i++) setTimeout(() => this.ringFx(b.x, b.y - 10, 24 + i * 26, '#9cff9c'), i * 150);
      if (K === 'abyss') { this.shake = 16; for (let i = 0; i < 4; i++) setTimeout(() => this.ringFx(b.x, b.y, 36 + i * 36, i % 2 ? '#dff2ff' : W), i * 170); this.burst(b.x, b.y - 8, W, 34); this.fx('novablaster', b.x, b.y, { scale: 1.3, z: 6, add: true, dur: 1.0, glow: W, hue: 190 }); }
      if (K === 'run') this.ringFx(b.x, b.y, 44, '#fff0a0');
      if (K === 'blink') for (let i = 0; i < 20; i++) this.spark(b.x, b.y - 10, '#ffc0f0', 2);
    }
  };

  // effets continus et ponctuels propres à chaque signature
  P.cineAmbient = function (q, t, dt) {
    const b = q.b, K = q.kind, f = k => { if (q.fired.has(k)) return false; q.fired.add(k); return true; }, rnd = a => (Math.random() - 0.5) * a, W = '#8fd0ff';
    if (K === 'levit' && t > 2.6 && t < q.impact && Math.random() < dt * 30) this.spark(b.x + rnd(60), b.y + rnd(30), b.def.color, 1);
    if (K === 'levit') for (const [ts, i] of [[3.0, 0], [3.7, 1], [4.3, 2]]) if (t >= ts && f('p' + i)) this.ringFx(b.x, b.y - 10, 30 + i * 22, '#d89aff');
    if (K === 'descend' && t > 4.8 && t < 7 && Math.random() < dt * 20) this.spark(b.x + rnd(70), b.y + rnd(30), '#dff6ff', 1);
    if (K === 'descend' && t > 2.4 && t < 5.8 && Math.random() < dt * 40) this.spark(b.x + rnd(260), b.y - 120 + rnd(30), '#eaf8ff', 1);   // blizzard
    if (K === 'dive' && t > 3.5 && t < 4.7 && Math.random() < dt * 80) this.spark(b.x + rnd(30), b.y - (b.lift || 0) * 0.6 + rnd(30), '#ffb050', 1.6);   // traînée de feu
    if (K === 'strike') for (const [ts, k] of [[2.4, 's0'], [3.1, 's1'], [3.9, 's2']]) if (t >= ts && f(k)) { q.flash = Math.max(q.flash, 0.9); this.shake = Math.max(this.shake, 5); SFX.boom(); const x = b.x + (k === 's2' ? 0 : rnd(150)), y = b.y + (k === 's2' ? 0 : rnd(90)); this.fx('plasmaburst', x, y, { scale: 1.2, z: 10, add: true, dur: 0.6, glow: '#fff070', hue: 35 }); this.burst(x, y, '#fff070', 12); this.ringFx(x, y, 26, '#fff070'); }
    if (K === 'stomp' && t > 3.4 && t < 5.0 && Math.random() < dt * 30) this.spark(b.x + rnd(30), b.y - (b.lift || 0) * 0.5, '#e8d0b0', 1.4);
    if (K === 'blink') for (const [ts, i] of [[3.0, 0], [3.7, 1], [4.4, 2], [5.0, 3]]) if (t >= ts && f('h' + i)) { for (let n = 0; n < 14; n++) this.spark(b.x, b.y - 10, '#ffc0f0', 1.6); this.ringFx(b.x, b.y - 6, 18, '#ffb0e8'); SFX.dodge(); }
    if (K === 'run' && t > 2.6 && t < q.impact && Math.random() < dt * 60) this.spark(b.x - q.dir.x * 10 + rnd(10), b.y - q.dir.y * 10 + rnd(10), '#fff070', 1.4);
    if (K === 'run' && t >= 2.8 && f('bolt')) { q.flash = 1; SFX.boom(); this.fx('plasmaburst', b.x, b.y, { scale: 1.4, z: 10, add: true, dur: 0.6, glow: '#fff070', hue: 35 }); }
    if (K === 'erupt') { if (t > 3.0 && t < 4.8 && Math.random() < dt * 40) { const x = b.x + rnd(90), y = b.y + rnd(50); this.spark(x, y - 4, '#ff7a2a', 1.8); } if (t >= 3.4 && f('crack')) { this.shake = Math.max(this.shake, 7); this.ringFx(b.x, b.y, 24, '#ff7a2a'); } if (t >= 4.0 && f('burst')) { q.flash = 0.8; this.fx('plasmaburst', b.x, b.y, { scale: 1.6, z: 8, add: true, dur: 0.8, glow: '#ff8a30' }); this.burst(b.x, b.y, '#ff8a30', 22); } }
    if (K === 'ripple' && t > 2.4 && t < 5.4) { q.rip = (q.rip || 0) - dt; if (q.rip <= 0) { q.rip = 0.28; this.ringFx(b.x, b.y + 4, 14, W); } }
    if (K === 'rift') { if (t > 2.6 && t < q.impact) { q.rip = (q.rip || 0) - dt; if (q.rip <= 0) { q.rip = 0.45; this.ringFx(b.x, b.y - 12, 10 + (t - 2.6) * 14, '#9cff9c'); } } if (t > 2.8 && t < 6 && Math.random() < dt * 40) this.spark(b.x + rnd(80), b.y - 6 + rnd(40), '#b8ff9c', 1.3); }
    if (K === 'abyss') {
      if (t > 1.2 && t < 3.8) { q.rip = (q.rip || 0) - dt; if (q.rip <= 0) { q.rip = 0.55; this.ringFx(b.x, b.y, 18 + (t - 1.2) * 10, W); } }
      if (t >= 3.0 && t < 3.8) this.shake = Math.max(this.shake, 2.5);
      if (t >= 3.8 && f('breach')) { q.flash = 0.85; this.shake = Math.max(this.shake, 11); SFX.boom(); for (let i = 0; i < 3; i++) setTimeout(() => this.ringFx(b.x, b.y, 30 + i * 34, W), i * 130); this.burst(b.x, b.y, W, 30); this.fx('novablaster', b.x, b.y, { scale: 1.1, z: 6, add: true, dur: 0.9, glow: W, hue: 190 }); }
      if (t > 3.8 && t < 6.4 && Math.random() < dt * 60) this.spark(b.x + rnd(80), b.y - (b.lift || 0) * 0.4 + rnd(60), '#cfeaff', 1.5);   // gouttes
    }
  };

  // cri de fureur une fois l'éveil terminé, juste avant le carton-titre
  P.cineCry = function (q, tt) { if (tt >= Math.max(q.impact + 1.0, q.short ? CINE_SHORT + 0.8 : 0) && !q.fired.has('cry')) { q.fired.add('cry'); this.bossCry(q.b, 7.5, 1.6); } };
  P.cineCam = function (snap) {
    const q = this.cine, b = q.b, c = this.chief(), [pitch, dist, fov, look, foc] = cineKey(q.t, bossCamOf(b));
    this.camFx = { pitch, dist, fov, look: look + Math.min(b.lift || 0, 480) / TS * 1.0 * Math.min(1, foc * 2) };   // la caméra suit le boss quand il s'élève
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
    if (locked) { for (const m of this.team) { this.tickMember(m, dt); m.inv = Math.max(m.inv, 0.3); m.kx = m.ky = 0; m.hurtT = 0; } this.stamTick(dt, false); }   // intro : l'équipe est intouchable et sans élan
    // boss
    this.cineApply(b); this.cineFire(q, t); this.cineCry(q, t);
    q.flash = Math.max(0, q.flash - dt * 2.6);
    q.dim = cl((t - 2.4) / 0.8) * (1 - cl((t - 4.2) / 0.8)) * 0.55;
    b.st = 99; b.invuln = 99;
    if (!q.short) this.cineAmbient(q, t, dt);
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
    this.unstickTeam(); q.done = true; this.cine = null; this.camFx = null;
    if (window.hd2d) { this.bossCam = bossCamOf(b); this.bossCamK = 1; }   // le duel reprend le réglage de fin d'intro
  };
}
